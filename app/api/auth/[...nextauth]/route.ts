import NextAuth from "next-auth";
import type { NextAuthOptions } from "next-auth";

import GithubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";

//import type { PrismaClient as StandardPrismaClient } from "../../../../generated/prisma";
///import { PrismaClient } from "../../../../generated/prisma";

import { PrismaClient } from "@prisma/client";

import { signInEmailPassword } from "./actions/auth-actions";

interface User {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

const prisma = new PrismaClient();
export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma as any),
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID ?? "",
      clientSecret: process.env.GITHUB_SECRET ?? "",
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credetials, req): Promise<User | null> {
        const user = signInEmailPassword(
          credetials!.email,
          credetials!.password
        );

        if (user) {
          return user;
        } else {
          return null;
        }
      },
    }),
  ],

  session: {
    strategy: "jwt",
  },
  callbacks: {
    async signIn({ user, account, profile, email, credentials }) {
      return true;
    },
    async jwt({ token, user, account, profile }) {
      //// Check if the user exists in the database
      const dbUser = await prisma.user.findUnique({
        where: { email: token.email ?? "no-email" },
      });
      /* if (dbUser?.isActive === false) {
        throw new Error("User is not active");
      } */
      /* if (dbUser?.roles) {
        throw new Error("User is not active");
      } */

      token.roles = dbUser?.roles ?? ["no-roles"];
      token.id = dbUser?.id ?? "no-cuid";
      token.isActive = dbUser?.isActive ?? false;
      return token;
    },

    async session({ user, session, token }) {
      if (session && session.user) {
        session.user.id = token.id as string;
        session.user.roles = token.roles as string[];
        session.user.isActive = token.isActive as boolean;
      }
      return session;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
