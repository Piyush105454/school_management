import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { db } from "@/db";
import { users, inquiries } from "@/db/schema";
import { eq, or, sql, and } from "drizzle-orm";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const identifier = credentials.email.trim();
        const lowerIdentifier = identifier.toLowerCase();
        console.log("LOGIN_ATTEMPT:", identifier);

        let user: any = null;

        // 1. Try finding by Email first (for everyone)
        user = await db.query.users.findFirst({
          where: sql`lower(${users.email}) = ${lowerIdentifier}`,
        });

        // 2. If not found and it looks like a 12-digit Aadhaar, search via student relations
        if (!user && /^\d{12}$/.test(identifier)) {
          const match = await db.query.inquiries.findFirst({
            where: eq(inquiries.aadhaarNumber, identifier),
            with: {
              admissionMeta: {
                with: {
                  studentProfile: true
                }
              }
            }
          });

          const userId = match?.admissionMeta?.studentProfile?.userId;
          if (userId) {
            user = await db.query.users.findFirst({
              where: eq(users.id, userId),
            });
          }
        }

        console.log("USER_FOUND:", !!user, user?.role);

        if (!user) return null;

        const isValid = await bcrypt.compare(credentials.password, user.password);
        console.log("PASSWORD_VALID:", isValid);

        if (!isValid) return null;

        return {
          id: user.id,
          email: user.email,
          role: user.role,
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user = {
          ...session.user,
          id: token.id as string,
          role: token.role as string,
        };
      }
      return session;
    }
  },
  pages: {
    signIn: "/",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
