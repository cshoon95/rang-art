"use client";

import React, { useEffect, useState } from "react";
import styled, { keyframes } from "styled-components";

export const SplashScreen = () => {
  const [isVisible, setIsVisible] = useState(true);
  const [shouldRender, setShouldRender] = useState(true);
  const [loadingText, setLoadingText] = useState("");

  useEffect(() => {
    // 1. PWA 모드인지 확인 (웹에서도 보고 싶으면 이 줄은 주석 처리하세요)
    const isPWA = window.matchMedia("(display-mode: standalone)").matches;

    // 2. 이미 본 적이 있는지 확인 (새로고침 시 스킵)
    const hasSeenSplash = sessionStorage.getItem("hasSeenSplash");

    // PWA가 아니거나, 이미 봤다면 렌더링 안 함
    // (테스트할 때는 !hasSeenSplash 조건을 잠시 지우세요)
    if (!isPWA || hasSeenSplash) {
      setShouldRender(false);
      return;
    }

    // 문구 리스트 (원하는 문구를 마음껏 추가하세요)
    const messages = [
      "수훈 & 한별, 경제적 자유를 향해! 🚀",
      "한별이랑 함께라서 더 든든한 수훈 💖",
      "한별이랑 수훈, 오늘도 부자 루트 탑승! 🚀",
      "수훈 & 한별, 둘이 함께하니 자산도 사랑도 성장 중 💖",
      "한별이랑 수훈이의 재테크 콤보는 무적이다 💪",
      "수훈이랑 한별, 오늘도 현명한 선택 완료 ✨",
      "한별 & 수훈, 우리의 하루가 곧 미래 투자 📈",
      "수훈이와 한별, 둘이서 만드는 경제적 자유 ❤️",
      "한별이랑 함께하니 소비도 행복해지는 수훈 😊",
      "오늘도 한별-수훈 팀워크는 복리처럼 쌓인다 💞",
      "수훈 & 한별, 목표 향해 꾸준히 GO! 🎯",
      "한별의 꿈 + 수훈의 계획 = 완벽 자산 로드맵 🗺️",
      "수훈이랑 한별, 둘이 계획하면 못할 게 없다 🔥",
      "한별 & 수훈, 자산 그래프도 사랑처럼 상승 중 📈",
      "수훈이의 믿음 + 한별이의 꼼꼼함 = 최고의 팀 🤝",
      "한별과 수훈, 함께라서 더 빨리 성장한다 🚄",
      "오늘도 한별-수훈의 작은 선택이 큰 자산이 된다 💵",
      "수훈 & 한별, 차곡차곡 쌓는 우리의 미래 🍀",
      "한별이 있어서 더 든든한 수훈, 수훈이 있어서 더 빛나는 한별 ✨",
      "수훈과 한별, 우리의 자유는 우리가 만든다 🗽",
      "한별-수훈 커플, 요즘 제일 잘 나가는 성장주 📊",
      "수훈이랑 한별이의 행복 그래프는 항상 우상향 ❤️",
      "수훈 & 한별, 건물주 되는 그날까지 🏢",
    ];

    // 랜덤으로 하나 선택
    const randomMsg = messages[Math.floor(Math.random() * messages.length)];
    setLoadingText(randomMsg);

    // 3. 스플래시 표시 로직
    const timer = setTimeout(() => {
      setIsVisible(false); // 페이드 아웃 시작
      sessionStorage.setItem("hasSeenSplash", "true"); // 봤다고 기록

      // 애니메이션 끝난 후 컴포넌트 제거 (0.5초 뒤)
      setTimeout(() => {
        setShouldRender(false);
      }, 500);
    }, 2000); // 2초 동안 보여줌

    return () => clearTimeout(timer);
  }, []);

  if (!shouldRender) return null;

  return (
    <SplashWrapper $isVisible={isVisible}>
      <LogoContainer>
        <AppTitle>
          MONEY <span style={{ color: "#007bff" }}>STAR</span>
        </AppTitle>
        <LoadingText>{loadingText}</LoadingText>
      </LogoContainer>
    </SplashWrapper>
  );
};

// --- Animations ---

const fadeOut = keyframes`
  from { opacity: 1; }
  to { opacity: 0; }
`;

const pulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
`;

const slideUp = keyframes`
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
`;

// --- Styles ---

const SplashWrapper = styled.div<{ $isVisible: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: #ffffff;
  z-index: 9999; /* 최상위 */
  display: flex;
  align-items: center;
  justify-content: center;

  /* 사라질 때 페이드 아웃 효과 */
  opacity: ${(props) => (props.$isVisible ? 1 : 0)};
  transition: opacity 0.5s ease-in-out;
  pointer-events: ${(props) => (props.$isVisible ? "auto" : "none")};
`;

const LogoContainer = styled.div`
  text-align: center;
  animation: ${slideUp} 0.8s ease-out;
`;

const AppTitle = styled.h1`
  font-size: 32px;
  font-weight: 800;
  color: #333;
  margin-bottom: 10px;
  letter-spacing: -1px;
  animation: ${pulse} 2s infinite ease-in-out;
`;

const LoadingText = styled.p`
  font-size: 15px;
  color: #666;
  margin-top: 16px;
  font-weight: 600;
  word-break: keep-all; /* 단어 단위 줄바꿈 */
  line-height: 1.5;
`;
