"use client";

import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import { Spinner } from "../Spinner";

export default function AuthCheck({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  // 🔒 화면 노출 여부를 결정하는 상태 (기본값 false: 일단 숨김)
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    // 세션 로딩 중이면 대기
    if (status === "loading") return;

    // 1. 비로그인 상태 -> 로그인 페이지로 리다이렉트
    if (status === "unauthenticated") {
      if (pathname !== "/login") {
        router.replace("/login");
      } else {
        setIsAuthorized(true); // 로그인 페이지는 보여줌
      }
      return;
    }

    // 2. 로그인 상태 (검증 로직)
    if (status === "authenticated") {
      const user = session?.user as any;
      const userState = user?.state; // 'Y' or 'N'
      const academyCode = user?.academyCode;

      // (1) /signup, /waiting 페이지에 있는 경우 (예외 처리)
      if (pathname === "/signup" || pathname === "/waiting") {
        // 이미 승인된(Y) 사람이 굳이 여기 들어왔다면 -> 홈으로 보냄
        if (userState === "Y" && academyCode) {
          router.replace("/");
        } else {
          // 그 외에는 해당 페이지를 볼 수 있게 허용
          setIsAuthorized(true);
        }
        return;
      }

      // (2) 지점 미선택 -> 가입 페이지로 납치
      if (!academyCode) {
        router.replace("/signup");
        return; // 리다이렉트 중이니 authorized를 true로 바꾸지 않음
      }

      // (3) 승인 대기중(N) -> 대기 페이지로 납치
      if (userState !== "Y") {
        router.replace("/waiting");
        return; // 리다이렉트 중이니 authorized를 true로 바꾸지 않음
      }

      // (4) 모든 검사 통과! -> 드디어 화면 보여줌
      setIsAuthorized(true);
    }
  }, [session, status, pathname, router]);

  // ⏳ 로딩 중이거나, 아직 검증이 안 끝났으면 스피너만 보여줌
  // children(홈 화면 등)은 절대 렌더링하지 않음
  if (status === "loading" || !isAuthorized) {
    return (
      <Box
        sx={{
          height: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Spinner />
      </Box>
    );
  }

  // 검증 완료된 경우에만 실제 컨텐츠 노출
  return <>{children}</>;
}
