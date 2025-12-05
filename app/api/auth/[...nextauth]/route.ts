import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { createClient } from "@/utils/supabase/server";

// 1. authOptions 정의
export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.email;
      }

      if (user || trigger === "update") {
        const supabase = await createClient();
        const { data: dbUser } = await supabase
          .from("users")
          .select("state, academy_code, level")
          .eq("id", token.email)
          .single();

        if (dbUser) {
          token.state = dbUser.state;
          token.academyCode = dbUser.academy_code;
          token.level = dbUser.level;
        }
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        (session.user as any).state = token.state;
        (session.user as any).academyCode = token.academyCode;
        (session.user as any).level = token.level;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
};

// 2. NextAuth 핸들러 생성
const handler = NextAuth(authOptions);

// 3. GET, POST로 내보내기 (필수 규칙)
export { handler as GET, handler as POST };
