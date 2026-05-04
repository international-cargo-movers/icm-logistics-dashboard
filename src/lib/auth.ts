import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/mongodb";
import { getAdminModels } from "@/model/tenantModels";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "manager@company.com" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Missing email or password");
        }

        await dbConnect();
        const { User } = await getAdminModels();

        // 1. Find the user
        const user: any = await User.findOne({ email: credentials.email }).lean();
        if (!user || !user.isActive) {
          throw new Error("Invalid credentials or inactive account");
        }

        // 2. Verify the password hash
        const isPasswordValid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!isPasswordValid) {
          throw new Error("Invalid credentials");
        }

        // 3. Return the specific data we want encoded into the JWT
        const userRoles = (user.roles && user.roles.length > 0) ? user.roles : (user.role ? [user.role] : ["Viewer"]);

        return {
          id: user._id.toString(),
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          role: userRoles[0], // Legacy fallback
          roles: userRoles,
        };
      }
    })
  ],
  callbacks: {
    // This fires when the JWT is created/updated. We inject our custom fields here.
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.roles = user.roles;
      }
      return token;
    },
    // This exposes the token data to the frontend when you call useSession()
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.roles = token.roles as string[];
      }
      return session;
    }
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: "jwt",
    maxAge: 12 * 60 * 60, // 12 hour shift limit
  },
  secret: process.env.NEXTAUTH_SECRET,
};
