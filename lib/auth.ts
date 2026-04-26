import { auth } from "@/auth"
import { getToken } from "next-auth/jwt"
import type { NextRequest } from "next/server"

// This site has a single admin. Rather than a roles table, we just check the
// email. If you take over this project, update this value and the matching
// constant in proxy.ts.
const ADMIN_EMAIL = "aminuolawalekan@gmail.com"

// Returns true if the current request is authenticated as the admin.
// Used in every API write route as a second layer after the proxy.
export async function getSession(): Promise<boolean> {
  const session = await auth()
  return session?.user?.email === ADMIN_EMAIL
}

export type ReaderSession = {
  email: string;
  name: string | null;
  image: string | null;
}

// Returns the signed-in reader's profile, or null if not authenticated.
// Reads directly from the JWT in the request cookies — reliable in Route Handlers
// without depending on next/headers async context (which can fail in Next.js 16).
export async function getReaderSession(req: NextRequest): Promise<ReaderSession | null> {
  const token = await getToken({ req, secret: process.env.AUTH_SECRET! });
  if (!token?.email) return null;
  return {
    email: token.email as string,
    name: (token.name as string) ?? null,
    image: (token.picture as string) ?? null,
  };
}
