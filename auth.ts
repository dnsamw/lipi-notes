import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { prisma } from "@/lib/prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET,
  callbacks: {
    async signIn({ account, profile }) {
      if (account?.provider === "google" && profile) {
        const googleProfile = profile as {
          sub: string;
          email: string;
          name: string;
          picture?: string;
        };
        try {
          await prisma.user.upsert({
            where: { googleId: googleProfile.sub },
            create: {
              googleId: googleProfile.sub,
              email: googleProfile.email,
              name: googleProfile.name,
              avatar: googleProfile.picture ?? null,
            },
            update: {
              email: googleProfile.email,
              name: googleProfile.name,
              avatar: googleProfile.picture ?? null,
            },
          });
        } catch (err) {
          console.error("[auth] signIn DB upsert failed:", err);
          // Return an error string so Auth.js shows a meaningful message
          return `/login?error=DatabaseError`;
        }
      }
      return true;
    },
    async jwt({ token, account, profile }) {
      if (account?.provider === "google" && profile) {
        const googleProfile = profile as { sub: string };
        try {
          const dbUser = await prisma.user.findUnique({
            where: { googleId: googleProfile.sub },
          });
          if (dbUser) {
            token.userId = dbUser.id;
            token.name = dbUser.name;
            token.email = dbUser.email;
            token.picture = dbUser.avatar ?? undefined;
          }
        } catch (err) {
          console.error("[auth] jwt DB lookup failed:", err);
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token.userId) {
        session.user.id = token.userId as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
});

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}
