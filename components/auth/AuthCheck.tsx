"use client";

import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import { Spinner } from "../Spinner";
// Spinner 컴포넌트 경로를 실제 프로젝트에 맞게 수정해주세요

export default function AuthCheck({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  // 🔒 화면 노출 여부 (검증 전까진 숨김)
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    // 0. 세션 로딩 중이면 대기
    if (status === "loading") return;

    // 1. 비로그인 상태 처리
    if (status === "unauthenticated") {
      if (pathname !== "/login") {
        router.replace("/login");
      } else {
        setIsAuthorized(true); // 로그인 페이지는 보여줌
      }
      return;
    }

    // 2. 로그인 상태 (Authenticated) -> 단계별 검증
    if (status === "authenticated") {
      const user = session?.user as any;

      // DB 정보를 세션에서 가져옴 (route.ts에서 넣어준 값)
      const userState = user?.state || "N";
      const academyCode = user?.academyCode;

      // [단계 A] 학원 정보가 없는 경우 (신규 가입 대상)
      // -> 무조건 회원가입(/signup) 페이지에 있어야 함
      if (!academyCode) {
        if (pathname !== "/signup") {
          router.replace("/signup");
        } else {
          setIsAuthorized(true); // signup 페이지는 보여줌
        }
        return;
      }

      // [단계 B] 학원은 선택했으나, 승인 대기 중인 경우 (STATE !== 'Y')
      // -> 무조건 대기(/waiting) 페이지에 있어야 함
      if (userState !== "Y") {
        if (pathname !== "/waiting") {
          router.replace("/waiting");
        } else {
          setIsAuthorized(true); // waiting 페이지는 보여줌
        }
        return;
      }

      // [단계 C] 승인 완료된 유저 (STATE === 'Y')
      // -> 정상 이용 가능. 단, 로그인/가입/대기 페이지로 역주행하려 하면 홈으로 보냄
      if (
        pathname === "/login" ||
        pathname === "/signup" ||
        pathname === "/waiting"
      ) {
        router.replace("/home");
        return;
      }

      // 모든 검사 통과 -> 요청한 페이지 보여줌
      setIsAuthorized(true);
    }
  }, [session, status, pathname, router]);

  // ⏳ 로딩 중이거나, 검증 로직이 끝나지 않았으면 스피너 노출
  // (화면 깜빡임 방지)
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

  // 검증 완료된 실제 페이지 컨텐츠 노출
  return <>{children}</>;
}
