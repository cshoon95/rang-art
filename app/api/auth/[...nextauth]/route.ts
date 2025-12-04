import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth"; // 👈 만들어둔 설정 파일 import

// 1. 핸들러 생성 (authOptions를 그대로 넣습니다)
const handler = NextAuth(authOptions);

// 2. GET, POST로 내보내기
export { handler as GET, handler as POST };
