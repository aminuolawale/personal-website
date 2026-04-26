import { auth } from "@/auth"
import { NextResponse } from "next/server"

// Must match the constant in lib/auth.ts — kept separate because middleware
// runs at the edge and cannot import from lib/ without bundling concerns.
const ADMIN_EMAIL = "aminuolawalekan@gmail.com"

// Protects every page under /admin/dashboard/* at the edge (before rendering).
// Non-admins are redirected to /admin (the login page).
// API routes are not covered here — they do their own auth check via getSession().
export default auth((req) => {
  const email = req.auth?.user?.email
  if (email !== ADMIN_EMAIL) {
    return NextResponse.redirect(new URL("/admin", req.url))
  }
})

export const config = {
  matcher: ["/admin/dashboard/:path*"],
}
