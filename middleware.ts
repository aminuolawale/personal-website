import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

function secret() {
  const s = process.env.JWT_SECRET ?? "dev-secret-change-in-production";
  return new TextEncoder().encode(s);
}

export async function middleware(req: NextRequest) {
  const token = req.cookies.get("admin_session")?.value;

  if (!token) {
    return NextResponse.redirect(new URL("/admin", req.url));
  }

  try {
    await jwtVerify(token, secret());
    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL("/admin", req.url));
  }
}

export const config = {
  matcher: ["/admin/dashboard/:path*"],
};
