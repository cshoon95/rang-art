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
        try {
          // 주의: 여기서 사용하는 createClient가 cookies()를 쓰면 에러가 날 수 있습니다.
          // 만약 에러가 계속된다면, Supabase Admin Client(Service Role)를 사용해야 합니다.
          const supabase = await createClient();

          const { data: dbUser, error } = await supabase
            .from("users")
            .select("state, academy_code, level, academy_name")
            .eq("id", token.id)
            .single();

          if (error) {
            console.error("Supabase fetch error in JWT:", error);
            // 에러나도 로그인은 유지되도록 그냥 넘어감 (값은 비워둠)
          }

          if (dbUser) {
            token.state = dbUser.state ?? "";
            token.academyCode = dbUser.academy_code ?? "";
            token.academyName = dbUser.academy_name ?? "";
            token.level = dbUser.level ?? "";
          }
        } catch (err) {
          console.error("JWT Callback Unexpected Error:", err);
          // 여기서 throw를 하면 로그인이 아예 안 되므로, catch만 하고 진행합니다.
        }
      }

      return token;
    },

    async session({ session, token }) {
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
