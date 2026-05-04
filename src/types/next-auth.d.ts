import { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string; // Legacy for backwards compatibility
      roles: string[];
    } & DefaultSession["user"]
  }

  interface User {
    id: string;
    role: string; // Legacy
    roles: string[];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string; // Legacy
    roles: string[];
  }
}
