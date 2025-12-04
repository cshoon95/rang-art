import NextAuth, { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      academyCode?: string;
      state?: string; // 'Y': 승인, 'N': 신규/대기
      id?: string;
    } & DefaultSession["user"];
  }

  interface User {
    academyCode?: string;
    state?: string;
  }
}
