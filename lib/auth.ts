import { auth } from "@/auth"

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
