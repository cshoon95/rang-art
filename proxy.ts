import { withAuth } from "next-auth/middleware";

export default withAuth({
  // 로그인이 필요한 페이지에 접근했을 때 리다이렉트할 페이지
  pages: {
    signIn: "/login",
  },
});

// 미들웨어가 적용될 경로 (로그인 페이지, API, 정적 파일 제외하고 모든 경로 보호)
export const config = {
  matcher: ["/((?!login|api|_next/static|_next/image|favicon.ico|icon.png).*)"],
};
