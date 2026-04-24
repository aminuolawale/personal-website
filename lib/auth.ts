import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const COOKIE = "admin_session";

function secret() {
  const s = process.env.JWT_SECRET ?? "dev-secret-change-in-production";
  return new TextEncoder().encode(s);
}

export async function createSession() {
  return new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(secret());
}

export async function verifyToken(token: string) {
  try {
    await jwtVerify(token, secret());
    return true;
  } catch {
    return false;
  }
}

export async function getSession(): Promise<boolean> {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (!token) return false;
  return verifyToken(token);
}

export const SESSION_COOKIE = COOKIE;
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7;
