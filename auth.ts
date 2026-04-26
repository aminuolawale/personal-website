import NextAuth from "next-auth"
import Google from "next-auth/providers/google"

// NextAuth configuration. Exports `handlers` (mounted at /api/auth/[...nextauth]),
// `auth` (session accessor), `signIn`, and `signOut` — used throughout the app.
// Credentials are read from AUTH_GOOGLE_ID and AUTH_GOOGLE_SECRET env vars.
export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Google],
  pages: {
    // Both sign-in and error states send the user to /admin (the login page)
    // rather than NextAuth's default /auth/signin page.
    signIn: "/admin",
    error: "/admin",
  },
})
