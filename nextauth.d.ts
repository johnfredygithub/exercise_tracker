import NextAuth, { DefaultSession } from "next-auth";
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      emailVerified?: boolean;
      roles: string[]; // ✅ ahora es un array
      image?: string;
      isActive?: boolean;
    } & DefaultSession["user"];
  }
}
