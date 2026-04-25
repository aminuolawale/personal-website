import { auth } from "@/auth"

const ADMIN_EMAIL = "aminuolawalekan@gmail.com"

export async function getSession(): Promise<boolean> {
  const session = await auth()
  return session?.user?.email === ADMIN_EMAIL
}
