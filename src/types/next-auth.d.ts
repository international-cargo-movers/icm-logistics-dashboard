import NextAuth, { DefaultSession } from "next-auth"
import { JWT } from "next-auth/jwt"

declare module "next-auth" {
  // 1. Extend the default session user
  interface Session {
    user: {
      id: string
      role: string
    } & DefaultSession["user"]
  }

  // 2. Extend the default user object
  interface User {
    role: string
  }
}

declare module "next-auth/jwt" {
  // 3. Extend the JWT token
  interface JWT {
    id: string
    role: string
  }
}