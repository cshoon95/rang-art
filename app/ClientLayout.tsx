// app/ClientLayout.tsx  (클라이언트 컴포넌트)
"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { SessionProvider } from "next-auth/react";
import { Header } from "./common/Header";
import { SplashScreen } from "./common/SplashScreen";
import { Footer } from "./common/Footer";
import { hideHeaderPath } from "@/utils/list";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isLoginPage = hideHeaderPath.includes(pathname);

  return (
    // SessionProvider는 client 전용이므로 여기서 감싸야 함
    <SessionProvider>
      {/* 로그인 페이지인 경우 헤더/푸터 숨기기 */}
      {!isLoginPage && <Header />}

      <SplashScreen />
      <div style={{ minHeight: "calc(100vh - 60px - 150px)" }}>{children}</div>

      {!isLoginPage && <Footer />}
    </SessionProvider>
  );
}
