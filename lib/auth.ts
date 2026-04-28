import { auth } from "@/auth"

// This site has a single admin. Rather than a roles table, we just check the
// email. If you take over this project, update this value and the matching
// constant in middleware.ts.
const ADMIN_EMAIL = "aminuolawalekan@gmail.com"

// Returns true if the current request is authenticated as the admin.
// Used in every API write route as a second layer after the proxy.
export async function getSession(): Promise<boolean> {
  const session = await auth()
  return session?.user?.email === ADMIN_EMAIL
}

type ReaderSession = {
  email: string;
  name: string | null;
  image: string | null;
}

// Returns the signed-in reader's profile, or null if not authenticated.
// Any Google account is a valid reader — admin is also a valid reader.
export async function getReaderSession(): Promise<ReaderSession | null> {
  const session = await auth();
  if (!session?.user?.email) return null;
  return {
    email: session.user.email,
    name: session.user.name ?? null,
    image: session.user.image ?? null,
  };
}
