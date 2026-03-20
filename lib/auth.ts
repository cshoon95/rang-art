import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { createClient } from "@/utils/supabase/server";
import { LEVEL_OPTIONS } from "@/utils/list";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // 1. 초기 로그인 시점
      if (user?.email) {
        token.id = user.email;
      }

      // 2. DB 최신 동기화
      if (token.id) {
        const supabase = await createClient();
        const { data: dbUser } = await supabase
          .from("users")
          .select("state, academy_code, level, academy_name")
          .eq("id", token.id)
          .single();

        if (dbUser) {
          token.state = dbUser.state ?? token.state;
          token.academyCode = dbUser.academy_code ?? token.academyCode;
          token.academyName = dbUser.academy_name ?? token.academyName;
          token.level = dbUser.level ?? token.level;
        }
      }

      return token;
    },

    async session({ session, token }) {
      const levelName =
        LEVEL_OPTIONS.find((v) => v.value == token.level)?.label || "선생님";

      if (session.user) {
        (session.user as any).state = token.state;
        (session.user as any).academyCode = token.academyCode;
        (session.user as any).academyName = token.academyName;
        (session.user as any).level = token.level;
        (session.user as any).levelName = levelName;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 365 * 24 * 60 * 60,
    updateAge: 24 * 60 * 60,
  },
};
