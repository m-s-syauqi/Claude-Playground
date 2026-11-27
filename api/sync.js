// Vercel Function: POST /api/sync
//
// Body: { key, runs, deleted }. The key is the device's sync code. The server
// stores runs under a SHA-256 hash of it (the code itself is never stored),
// merges what the device sent with what is stored, saves the result and returns
// it. Devices send everything they have each time, so an update lost to two
// devices syncing at the same instant is sent again on the next sync.
//
// Storage: Upstash Redis, connected to the Vercel project from the Marketplace,
// which sets UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN (or the older
// KV_REST_API_URL and KV_REST_API_TOKEN names).

const crypto = require('crypto');
const { mergeDocs, cleanDoc } = require('../sync-merge.js');

const MAX_BODY = 2 * 1024 * 1024;

function send(res, status, data) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(data));
}

async function readBody(req) {
  if (req.body !== undefined) return typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  let size = 0;
  const chunks = [];
  for await (const c of req) {
    size += c.length;
    if (size > MAX_BODY) throw Object.assign(new Error('too_large'), { status: 413 });
    chunks.push(c);
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
}

async function redis(url, token, command) {
  const r = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(command),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok || data.error) throw new Error(`redis: ${data.error || r.status}`);
  return data.result;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return send(res, 405, { error: 'method_not_allowed' });
  }
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  if (!url || !token) return send(res, 503, { error: 'not_configured' });

  let body;
  try {
    body = await readBody(req);
  } catch (e) {
    return send(res, e.status || 400, { error: e.status === 413 ? 'too_large' : 'bad_json' });
  }
  const code = typeof body.key === 'string' ? body.key.toUpperCase().replace(/[^A-Z0-9]/g, '') : '';
  if (!/^[A-Z0-9]{20,64}$/.test(code)) return send(res, 400, { error: 'bad_key' });
  const storeKey = `stride:sync:${crypto.createHash('sha256').update(code).digest('hex')}`;

  try {
    const raw = await redis(url, token, ['GET', storeKey]);
    const stored = raw ? cleanDoc(JSON.parse(raw)) : null;
    const merged = mergeDocs(stored, cleanDoc(body));
    if (JSON.stringify(mergeDocs(stored)) !== JSON.stringify(merged)) {
      await redis(url, token, ['SET', storeKey, JSON.stringify(merged)]);
    }
    return send(res, 200, merged);
  } catch (e) {
    console.error(e);
    return send(res, 502, { error: 'storage_failed' });
  }
};
