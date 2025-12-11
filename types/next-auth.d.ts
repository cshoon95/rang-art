import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      state?: string;
      email: string;
      name: string;
      level: string; // ✅ 추가
      academy_code: string; // ✅ 추가
      levelName?: string;
      academyName?: string;
    } & DefaultSession["user"];
  }

  interface User {
    // DB User 모델과 일치시키는 부분
    id: string;
    level: string;
    academy_code: string;
    academy_name: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    level: string;
    academy_code: string;
    academyName?: string;
    levelName?: string;
    state?: string;
  }
}

import NextAuth, { DefaultSession } from "next-auth";
