// app/api/auth/[...nextauth]/route.ts

import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { createClient } from "@/utils/supabase/server"; // Supabase 사용 시
// 또는 mysql pool을 import 하세요.

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    // 1️⃣ JWT 콜백: 로그인 성공 직후 실행됨. 여기서 DB를 조회합니다.
    async jwt({ token, user }) {
      // user 객체가 있다는 것은 방금 막 로그인했다는 뜻입니다.
      if (user && user.email) {
        try {
          // [DB 조회 로직] 구글 이메일로 우리 DB 유저 조회
          // Supabase 예시 (MySQL이면 db.query 사용)
          const supabase = await createClient();
          const { data: dbUser } = await supabase
            .from("users") // 테이블명 (기존 USER)
            .select("state, academy_code, name, level")
            .eq("id", user.email) // ID 컬럼이 이메일이라고 가정
            .single();

          if (dbUser) {
            // DB에 유저가 존재하면 토큰에 정보 저장
            token.state = dbUser.state;
            token.academyCode = dbUser.academy_code;
            token.level = dbUser.level;
          } else {
            // DB에 유저가 없으면 (신규 가입 대상)
            token.state = "N"; // 미승인 상태로 간주
            token.academyCode = null;
          }
        } catch (error) {
          console.error("DB User Fetch Error", error);
        }
      }
      return token;
    },

    // 2️⃣ Session 콜백: 클라이언트(AuthCheck)에서 useSession()으로 접근할 때 실행됨
    async session({ session, token }) {
      // JWT 토큰에 저장해둔 DB 정보를 세션으로 옮김
      if (session.user) {
        (session.user as any).state = token.state;
        (session.user as any).academyCode = token.academyCode;
        (session.user as any).level = token.level;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login", // 커스텀 로그인 페이지 경로
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
