import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import pool from "@/lib/db";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async signIn({ user }) {
      debugger;
      if (!user.email) return false;
      try {
        const query = `SELECT * FROM "USER" WHERE "id" = $1`;
        const { rows } = await pool.query(query, [user.email]);
        // 레벨 설정 (예: 3 = 선생님/관리자 후보)
        const level = 3;

        if (rows.length === 0) {
          const insertQuery = `
            INSERT INTO "USER" ("id", "NAME", "state", "register_id", "LEVEL")
            VALUES ($1, $2, 'N', $3, $4)
          `;
          await pool.query(insertQuery, [
            user.email,
            user.name,
            user.name,
            level,
          ]);
        }
        return true;
      } catch (error) {
        console.error("SignIn Error:", error);
        return false;
      }
    },

    async jwt({ token, trigger, session }) {
      if (trigger === "update" && session) {
        return { ...token, ...session };
      }
      return token;
    },

    // 🚨 여기가 문제입니다! 여기를 이렇게 바꿔주세요.
    async session({ session }) {
      if (session.user?.email) {
        try {
          // 1. DB에서 유저 정보 최신화
          // (컬럼명은 소문자로 쿼리하는게 정신건강에 좋습니다)
          const query = `SELECT * FROM "USER" WHERE "id" = $1`;
          const { rows } = await pool.query(query, [session.user.email]);

          if (rows.length > 0) {
            const dbUser = rows[0];

            // 🔍 디버깅: 터미널에 DB가 뭐라고 반환하는지 찍어봅니다.
            console.log("DB User Info:", dbUser);

            // 2. 대소문자 모두 체크하여 값 할당 (Postgres는 소문자 반환이 기본)
            // academy_code(소문자)가 있을 확률이 99%입니다.
            (session.user as any).academyCode =
              dbUser.academy_code || dbUser.ACADEMY_CODE;
            (session.user as any).state = dbUser.state || dbUser.STATE;

            // 이름도 확실하게 DB 정보로 덮어씌우기
            session.user.name = dbUser.name || dbUser.NAME;
          }
        } catch (error) {
          console.error("Session Error:", error);
        }
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
