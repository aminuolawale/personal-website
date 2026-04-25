import { auth } from "@/auth"
import { NextResponse } from "next/server"

const ADMIN_EMAIL = "aminuolawalekan@gmail.com"

export default auth((req) => {
  const email = req.auth?.user?.email
  if (email !== ADMIN_EMAIL) {
    return NextResponse.redirect(new URL("/admin", req.url))
  }
})

export const config = {
  matcher: ["/admin/dashboard/:path*"],
}
