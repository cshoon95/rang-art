"use client";

import { signIn } from "next-auth/react";
import styled, { keyframes } from "styled-components";
import Image from "next/image"; // ✅ next/image 사용
import logoImg from "@/assets/icon.webp"; // ✅ 이미지 import (경로 확인 필요)

export default function LoginPage() {
  const handleGoogleLogin = () => {
    signIn("google", { callbackUrl: "/" });
  };

  return (
    <Container>
      <Card>
        <LogoWrapper>
          <IconCircle>
            <Image
              src={logoImg}
              alt="Rang Art Logo"
              width={40} // 원 안에 들어갈 적절한 크기
              height={40}
              style={{ objectFit: "contain" }}
              priority
            />
          </IconCircle>
          <LogoTitle>
            RANG <span style={{ color: "#3b82f6" }}>ART</span>
          </LogoTitle>
          <LogoSubtitle>Rang Art Academy Management</LogoSubtitle>
        </LogoWrapper>

        <ContentSection>
          <WelcomeText>환영합니다!</WelcomeText>
          <Description>
            랑아트 미술학원 관리자 및 선생님 전용 페이지입니다.
            <br />
            구글 계정으로 간편하게 로그인하세요.
          </Description>
        </ContentSection>

        <GoogleButton onClick={handleGoogleLogin}>
          <GoogleIconWrapper>
            <svg
              viewBox="0 0 24 24"
              width="20"
              height="20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
                <path
                  fill="#4285F4"
                  d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"
                />
                <path
                  fill="#34A853"
                  d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z"
                />
                <path
                  fill="#FBBC05"
                  d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.734 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z"
                />
                <path
                  fill="#EA4335"
                  d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z"
                />
              </g>
            </svg>
          </GoogleIconWrapper>
          <ButtonText>Google 계정으로 시작하기</ButtonText>
        </GoogleButton>

        <Footer>
          <FooterText>© RANG ART ACADEMY. All rights reserved.</FooterText>
        </Footer>
      </Card>
    </Container>
  );
}

// --- Styles ---

const float = keyframes`
  0% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
  100% { transform: translateY(0px); }
`;

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

// ✅ 레이아웃 무시하고 전체 화면 덮기 (position: fixed 사용)
const Container = styled.div`
  position: fixed; /* 레이아웃의 패딩이나 마진을 무시하고 뷰포트 기준으로 배치 */
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 9999; /* 다른 요소들 위에 오도록 설정 */

  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f8fafc;
  font-family: "Pretendard", sans-serif;
  overflow: hidden;
`;

const Card = styled.div`
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px);
  padding: 60px 48px;
  border-radius: 32px;
  box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.05),
    0 0 0 1px rgba(0, 0, 0, 0.02);
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 90%; /* 모바일 대응을 위해 100% -> 90% */
  max-width: 420px;
  animation: ${fadeIn} 0.8s cubic-bezier(0.2, 0.8, 0.2, 1);
  z-index: 1;
  border: 1px solid rgba(255, 255, 255, 0.6);
`;

const LogoWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 40px;
`;

const IconCircle = styled.div`
  width: 64px;
  height: 64px;
  background: "white";
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
  box-shadow: 0 8px 20px rgba(37, 99, 235, 0.25);
  transform: rotate(-5deg);
  overflow: hidden; /* 이미지가 둥근 모서리를 넘지 않게 */
  position: relative; /* Image 컴포넌트 위치 잡기 위함 */
`;

const LogoTitle = styled.h1`
  font-size: 28px;
  font-weight: 900;
  color: #1e293b;
  margin: 0 0 6px 0;
  letter-spacing: -0.5px;
`;

const LogoSubtitle = styled.p`
  font-size: 13px;
  color: #94a3b8;
  font-weight: 500;
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const ContentSection = styled.div`
  text-align: center;
  margin-bottom: 40px;
`;

const WelcomeText = styled.h2`
  font-size: 20px;
  font-weight: 700;
  color: #334155;
  margin: 0 0 12px 0;
`;

const Description = styled.p`
  font-size: 14px;
  color: #64748b;
  line-height: 1.6;
  margin: 0;
`;

const GoogleButton = styled.button`
  width: 100%;
  height: 56px;
  background-color: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02);

  &:hover {
    background-color: #f8fafc;
    border-color: #cbd5e1;
    transform: translateY(-2px);
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05);
  }

  &:active {
    transform: translateY(0);
    background-color: #f1f5f9;
  }
`;

const GoogleIconWrapper = styled.div`
  position: absolute;
  left: 20px;
  display: flex;
  align-items: center;
`;

const ButtonText = styled.span`
  font-size: 15px;
  font-weight: 600;
  color: #334155;
`;

const Footer = styled.div`
  margin-top: 40px;
  border-top: 1px solid #f1f5f9;
  width: 100%;
  padding-top: 24px;
  text-align: center;
`;

const FooterText = styled.p`
  font-size: 12px;
  color: #cbd5e1;
  font-weight: 500;
`;
