// Session token: "<expiresAtMs>.<hmac>" signed with SESSION_SECRET.
// Uses Web Crypto so it works in both proxy.ts and server code.

export const SESSION_COOKIE = "mw_session";
// The session ends after this long without opening any page, so the PIN is
// asked again whenever the app is opened later. Each request renews it.
export const SESSION_IDLE_SECONDS = 10 * 60;
// Renew the cookie at most once a minute.
const RENEW_AFTER_SECONDS = 60;

const encoder = new TextEncoder();

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "SESSION_SECRET belum diatur atau kurang dari 32 karakter.",
    );
  }
  return secret;
}

async function hmac(data: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(getSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(data));
  let bin = "";
  for (const byte of new Uint8Array(sig)) bin += String.fromCharCode(byte);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function createSessionToken(): Promise<string> {
  const expiresAt = Date.now() + SESSION_IDLE_SECONDS * 1000;
  const payload = String(expiresAt);
  return `${payload}.${await hmac(payload)}`;
}

/** Expiry time of a valid token, or 0 if the token is missing, forged or expired. */
export async function sessionExpiry(token: string | undefined): Promise<number> {
  if (!token) return 0;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return 0;
  const expiresAt = Number(payload);
  if (!Number.isFinite(expiresAt) || expiresAt < Date.now()) return 0;
  try {
    return safeEqual(sig, await hmac(payload)) ? expiresAt : 0;
  } catch {
    return 0;
  }
}

export async function verifySessionToken(
  token: string | undefined,
): Promise<boolean> {
  return (await sessionExpiry(token)) > 0;
}

export function shouldRenew(expiresAt: number): boolean {
  return (
    expiresAt - Date.now() < (SESSION_IDLE_SECONDS - RENEW_AFTER_SECONDS) * 1000
  );
}

/** Cookie options. No maxAge: the browser drops it when fully closed. */
export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};
