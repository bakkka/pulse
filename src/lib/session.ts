import crypto from "node:crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "pulse_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

export type SessionPayload = {
  sub: string;
  email: string;
  name: string;
  role: string;
  exp: number;
};

function secret(): string {
  return process.env.PULSE_SESSION_SECRET || "pulse-insecure-dev-secret";
}

function base64url(input: Buffer | string): string {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function fromBase64url(input: string): Buffer {
  return Buffer.from(input.replace(/-/g, "+").replace(/_/g, "/"), "base64");
}

export function signToken(payload: SessionPayload): string {
  const body = base64url(JSON.stringify(payload));
  const signature = crypto.createHmac("sha256", secret()).update(body).digest();
  return `${body}.${base64url(signature)}`;
}

export function verifyToken(token: string | undefined): SessionPayload | null {
  if (!token) return null;
  const [body, signature] = token.split(".");
  if (!body || !signature) return null;

  const expected = crypto.createHmac("sha256", secret()).update(body).digest();
  const received = fromBase64url(signature);
  if (expected.length !== received.length) return null;
  if (!crypto.timingSafeEqual(expected, received)) return null;

  try {
    const payload = JSON.parse(fromBase64url(body).toString("utf8")) as SessionPayload;
    if (!payload?.sub || typeof payload.exp !== "number") return null;
    if (payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function readSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  return verifyToken(store.get(COOKIE_NAME)?.value);
}

export async function writeSession(payload: Omit<SessionPayload, "exp">): Promise<void> {
  const store = await cookies();
  const token = signToken({ ...payload, exp: Date.now() + MAX_AGE_SECONDS * 1000 });
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}
