import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

export type SharePayload = { workspaceId: string; batchId: string; exp: number; jti: string; reviewer?: string; dueAt?: string };
const TTL = 30 * 24 * 60 * 60 * 1000;

function secret() {
  const value = process.env.SESSION_SECRET;
  if (process.env.NODE_ENV === "production" && (!value || value.length < 32)) throw new Error("SESSION_SECRET must be at least 32 characters");
  return value ?? "brandrail-dev-secret-change-me";
}

export function signShareToken(workspaceId: string, batchId: string, review: { reviewer?: string; dueAt?: string } = {}) {
  const body = Buffer.from(JSON.stringify({ workspaceId, batchId, exp: Date.now() + TTL, jti: randomBytes(12).toString("hex"), ...review })).toString("base64url");
  const signature = createHmac("sha256", `share:${secret()}`).update(body).digest("base64url");
  return `${body}.${signature}`;
}

export function verifyShareToken(token: string): SharePayload | null {
  const dot = token.lastIndexOf(".");
  if (dot < 0) return null;
  const body = token.slice(0, dot); const signature = token.slice(dot + 1);
  const expected = createHmac("sha256", `share:${secret()}`).update(body).digest("base64url");
  try {
    if (signature.length !== expected.length || !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
    const payload = JSON.parse(Buffer.from(body, "base64url").toString()) as SharePayload;
    if (payload.exp < Date.now() || !/^[A-Za-z0-9_-]+$/.test(payload.workspaceId) || !/^[A-Za-z0-9_-]+$/.test(payload.batchId)) return null;
    if (payload.reviewer && (typeof payload.reviewer !== "string" || payload.reviewer.length > 80)) return null;
    if (payload.dueAt && (typeof payload.dueAt !== "string" || !Number.isFinite(Date.parse(payload.dueAt)))) return null;
    return payload;
  } catch { return null; }
}
