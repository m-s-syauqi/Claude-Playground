// Gerak sync endpoint (Vercel Function, Node.js).
//
// Data disimpan di Upstash Redis lewat REST API, tanpa dependency.
// Kunci penyimpanan = SHA-256 dari kode sinkron, jadi kode itu sendiri tidak
// pernah disimpan dan tanpa kode tidak ada cara menemukan datanya.
//
//   GET  /api/sync                 -> { rev, updatedAt, data }   (rev 0 = belum ada data)
//   PUT  /api/sync {baseRev, data, device, seq}
//                                  -> { rev, updatedAt }  atau 409 { rev, updatedAt, data, device, seq }
//
// Header wajib: X-Gerak-Code: <kode sinkron>
'use strict';

const crypto = require('crypto');

const MAX_BYTES = 900 * 1024;
const RATE_LIMIT = 300;        // permintaan per IP
const RATE_WINDOW_S = 600;     // per 10 menit
const CODE_RE = /^[A-Za-z0-9-]{16,128}$/;

// Compare-and-set: tulis hanya jika revisi di server masih sama dengan baseRev.
const CAS_SCRIPT = `
local rev = tonumber(redis.call('GET', KEYS[2]) or '0')
if rev ~= tonumber(ARGV[1]) then return {0, rev} end
redis.call('SET', KEYS[1], ARGV[2])
redis.call('SET', KEYS[2], rev + 1)
return {1, rev + 1}`;

function redisConfig() {
  const env = process.env;
  let url = env.KV_REST_API_URL || env.UPSTASH_REDIS_REST_URL;
  let token = env.KV_REST_API_TOKEN || env.UPSTASH_REDIS_REST_TOKEN;
  if ((!url || !token) && (env.REDIS_URL || env.KV_URL)) {
    // Upstash: rediss://default:<token>@<host>:<port> -> REST di https://<host> dengan token yang sama
    try {
      const u = new URL(env.REDIS_URL || env.KV_URL);
      if (u.hostname.endsWith('.upstash.io') && u.password) {
        url = `https://${u.hostname}`;
        token = decodeURIComponent(u.password);
      }
    } catch (e) { /* abaikan */ }
  }
  return url && token ? { url: url.replace(/\/$/, ''), token } : null;
}

async function redis(cfg, path, body) {
  const res = await fetch(cfg.url + path, {
    method: 'POST',
    headers: { Authorization: `Bearer ${cfg.token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => null);
  if (!res.ok || !json) throw new Error(`redis ${res.status}`);
  return json;
}
const cmd = async (cfg, ...args) => {
  const r = await redis(cfg, '', args);
  if (r.error) throw new Error(r.error);
  return r.result;
};
const pipeline = async (cfg, cmds) => {
  const r = await redis(cfg, '/pipeline', cmds);
  return r.map((x) => { if (x.error) throw new Error(x.error); return x.result; });
};

function send(res, status, obj) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(obj));
}

async function readBody(req) {
  if (req.body !== undefined && req.body !== null) {
    if (typeof req.body === 'string') return req.body;
    if (Buffer.isBuffer(req.body)) return req.body.toString('utf8');
    return JSON.stringify(req.body);
  }
  const chunks = []; let size = 0;
  for await (const c of req) {
    size += c.length;
    if (size > MAX_BYTES + 1024) throw Object.assign(new Error('too_large'), { status: 413 });
    chunks.push(c);
  }
  return Buffer.concat(chunks).toString('utf8');
}

async function readRecord(cfg, dataKey, revKey) {
  const [raw, rev] = await pipeline(cfg, [['GET', dataKey], ['GET', revKey]]);
  if (!raw) return { rev: Number(rev) || 0, updatedAt: null, data: null, device: null, seq: null };
  const rec = JSON.parse(raw);
  return { rev: Number(rev) || 0, updatedAt: rec.updatedAt, data: rec.data, device: rec.device ?? null, seq: rec.seq ?? null };
}

module.exports = async function handler(req, res) {
  const cfg = redisConfig();
  if (!cfg) return send(res, 503, { error: 'not_configured' });

  const code = String(req.headers['x-gerak-code'] || '');
  if (!CODE_RE.test(code)) return send(res, 401, { error: 'bad_code' });

  try {
    const ip = String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown').split(',')[0].trim();
    const rlKey = `gerak:rl:${crypto.createHash('sha256').update(ip).digest('hex').slice(0, 32)}`;
    const [, count] = await pipeline(cfg, [['SET', rlKey, 0, 'EX', RATE_WINDOW_S, 'NX'], ['INCR', rlKey]]);
    if (count > RATE_LIMIT) return send(res, 429, { error: 'rate_limited' });

    const id = crypto.createHash('sha256').update(code).digest('hex');
    const dataKey = `gerak:v1:data:${id}`;
    const revKey = `gerak:v1:rev:${id}`;

    if (req.method === 'GET') return send(res, 200, await readRecord(cfg, dataKey, revKey));

    if (req.method === 'PUT') {
      const raw = await readBody(req);
      if (Buffer.byteLength(raw) > MAX_BYTES) return send(res, 413, { error: 'too_large' });
      let body;
      try { body = JSON.parse(raw); } catch (e) { return send(res, 400, { error: 'bad_json' }); }
      const baseRev = Number(body?.baseRev);
      const data = body?.data;
      if (!Number.isInteger(baseRev) || baseRev < 0 || !data || typeof data !== 'object' || data.version !== 1) {
        return send(res, 400, { error: 'bad_payload' });
      }
      const device = typeof body.device === 'string' ? body.device.slice(0, 64) : null;
      const seq = Number.isInteger(body.seq) ? body.seq : null;
      const updatedAt = new Date().toISOString();
      const [ok, rev] = await cmd(cfg, 'EVAL', CAS_SCRIPT, 2, dataKey, revKey, baseRev, JSON.stringify({ updatedAt, device, seq, data }));
      if (Number(ok) === 1) return send(res, 200, { rev: Number(rev), updatedAt });
      return send(res, 409, await readRecord(cfg, dataKey, revKey));
    }

    res.setHeader('Allow', 'GET, PUT');
    return send(res, 405, { error: 'method_not_allowed' });
  } catch (e) {
    return send(res, e.status || 502, { error: e.status ? e.message : 'storage_error' });
  }
};
