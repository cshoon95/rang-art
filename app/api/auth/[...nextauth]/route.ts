import NextAuth, { NextAuthOptions } from "next-auth";
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
          // --- 수정된 부분: ?? "" (Null 병합 연산자) 추가 ---
          // dbUser의 값이 null이면 빈 문자열로 처리하여 타입 에러 방지
          token.state = dbUser.state ?? token.state;
          token.academyCode = dbUser.academy_code ?? token.academyCode;
          token.academyName = dbUser.academy_name ?? token.academyName;
          token.level = dbUser.level ?? token.level;
        }
      }

      return token;
    },

    async session({ session, token, user }) {
      // level 값 비교 시 token.level이 null일 경우 대비
      const levelName =
        LEVEL_OPTIONS.find((v) => v.value == token.level)?.label || "선생님";

      if (session.user) {
        // any 타입 단언(assertion)을 사용 중이므로 여기서는 에러가 나지 않지만,
        // 위 jwt 콜백에서 값이 확실히 string으로 넘어오게 됩니다.
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
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
