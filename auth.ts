import NextAuth from "next-auth"
import Google from "next-auth/providers/google"

const ADMIN_EMAIL = "aminuolawalekan@gmail.com"

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Google],
  callbacks: {
    signIn({ user }) {
      return user.email === ADMIN_EMAIL
    },
  },
  pages: {
    signIn: "/admin",
    error: "/admin",
  },
})
