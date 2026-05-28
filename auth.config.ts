import type { NextAuthConfig } from "next-auth";

// Shared base config. Providers and callbacks are defined in auth.ts.
export const authConfig: NextAuthConfig = {
  providers: [],
  session: { strategy: "jwt" },
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  pages: { signIn: "/login" },
};
