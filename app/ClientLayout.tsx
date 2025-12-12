"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { SessionProvider } from "next-auth/react";
import styled from "styled-components";
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
    <SessionProvider>
      {!isLoginPage && <Header />}
      <SplashScreen />

      {/* 1. 배경색과 전체 높이를 담당하는 바깥 래퍼 */}
      <ContentWrapper $isLoginPage={isLoginPage}>
        {/* 2. 헤더와 라인을 맞춰주는 내부 컨테이너 (PC 전용) */}
        <ContentInner>{children}</ContentInner>
      </ContentWrapper>

      {!isLoginPage && <Footer />}
    </SessionProvider>
  );
}

// ----------------------------------------------------------------------
// 🎨 Styles
// ----------------------------------------------------------------------

/* 1. 바깥 래퍼: 배경색(회색)을 화면 전체에 꽉 채움 */
const ContentWrapper = styled.main<{ $isLoginPage: boolean }>`
  width: 100%;
  min-height: calc(100vh - 60px - 150px);
  box-sizing: border-box;

  /* 배경색 설정 */
  background-color: ${(props) => (props.$isLoginPage ? "#ffffff" : "#f4f6f8")};

  /* 📱 모바일/태블릿: 여기서 패딩을 줌 (Inner는 무시됨) */
  padding: 20px 20px 90px 20px;

  ${(props) =>
    props.$isLoginPage &&
    `
    padding-bottom: 20px;
    background-color: #ffffff;
  `}

  /* 🖥️ PC 화면 */
  @media (min-width: 1025px) and (hover: hover) {
    /* PC에서는 바깥 패딩을 제거하고 Inner에서 제어하거나, 상단 여백만 줌 */
    padding: 0;
    padding-top: 40px; /* 헤더와의 간격 */
    padding-bottom: 40px; /* 푸터와의 간격 */

    /* 중앙 정렬을 위해 flex 사용 */
    display: flex;
    justify-content: center;
  }
`;

/* 2. 내부 컨테이너: 헤더와 너비/여백 라인을 맞춤 */
const ContentInner = styled.div`
  width: 100%;

  /* 📱 모바일: 별도 제한 없음 (Wrapper가 처리함) */

  /* 🖥️ PC 화면: 헤더 규격과 동기화 */
  @media (min-width: 1025px) and (hover: hover) {
    max-width: 1400px; /* 헤더의 max-width와 동일 */
    padding: 0 40px; /* 헤더의 padding과 동일 */
    /* margin: 0 auto; -> Wrapper의 justify-content: center로 대체됨 */
  }
`;
