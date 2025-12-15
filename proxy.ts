import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { HIGH_LEVELS } from "./utils/list";

// 🔐 권한 설정 (경로: 허용된 레벨 배열)
const PROTECTED_ROUTES: Record<string, number[]> = {
  "/payment": HIGH_LEVELS, // 출납부
  "/cash-receipt": HIGH_LEVELS, // 현금영수증
  "/employee": HIGH_LEVELS, // 직원 관리
  "/branch": HIGH_LEVELS, // 지점 관리
  "/register": HIGH_LEVELS, // 등록부
};

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. 세션 토큰 가져오기
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // 2. 비로그인 상태 접근 차단 (로그인 페이지로 리다이렉트)
  if (!token) {
    const url = new URL("/login", req.url);
    url.searchParams.set("callbackUrl", encodeURI(req.url));
    return NextResponse.redirect(url);
  }

  // ✅ [추가] 루트(/) 경로 접근 시 /home으로 강제 이동
  // (로그인이 되어 있는 경우에만 실행됨)
  if (pathname === "/") {
    return NextResponse.redirect(new URL("/home", req.url));
  }

  // 3. 보호된 경로 접근 권한 체크
  // 현재 경로가 보호된 경로 중 하나로 시작하는지 확인
  const protectedPath = Object.keys(PROTECTED_ROUTES).find((route) =>
    pathname.startsWith(route)
  );

  if (protectedPath) {
    const allowedLevels = PROTECTED_ROUTES[protectedPath];
    // 토큰에 저장된 유저 레벨 (없으면 기본값 '선생님')
    const userLevel = Number(token.level) || 3;

    // 4. 권한 체크: 허용된 레벨이 아니면 권한 없음 페이지로 이동
    if (!allowedLevels.includes(userLevel)) {
      console.warn(`⛔ 접근 거부: ${userLevel}은 ${pathname}에 접근 권한 없음`);
      return NextResponse.redirect(new URL("/denied", req.url));
    }
  }

  // 통과
  return NextResponse.next();
}

// 미들웨어(프록시)가 실행될 경로 설정
export const config = {
  matcher: [
    /*
     * 아래 경로를 제외한 모든 경로에서 실행:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - login (로그인 페이지)
     * - manifest.webmanifest, manifest.json (PWA 설정 파일) ✅ 추가됨
     */
    "/((?!api|_next/static|_next/image|favicon.ico|login|manifest.webmanifest|manifest.json).*)",
  ],
};
