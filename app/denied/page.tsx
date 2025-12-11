"use client";

import Link from "next/link";
import styled, { keyframes } from "styled-components";
import { ShieldAlert, ChevronLeft, Home } from "lucide-react";

export default function AccessDenied() {
  return (
    <Container>
      <Card>
        <IconWrapper>
          <ShieldAlert size={64} color="#ef4444" strokeWidth={1.5} />
        </IconWrapper>
        <Title>접근 권한이 없습니다</Title>
        <Description>
          죄송합니다. 이 페이지에 접근할 권한이 부족합니다.
          <br />
          관리자에게 문의하거나 다른 계정으로 로그인해주세요.
        </Description>
        <ButtonGroup>
          <SecondaryButton href="/home">
            <Home size={18} />
            홈으로 가기
          </SecondaryButton>
        </ButtonGroup>
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

const Container = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background-color: #f9fafb;
  padding: 20px;
`;

const Card = styled.div`
  background: white;
  width: 100%;
  max-width: 420px;
  padding: 48px 32px;
  border-radius: 32px;
  box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.05);
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const IconWrapper = styled.div`
  width: 120px;
  height: 120px;
  background-color: #fef2f2; /* 연한 빨강 배경 */
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 32px;
  animation: ${float} 3s ease-in-out infinite; /* 둥둥 떠다니는 애니메이션 */
  box-shadow: 0 10px 20px rgba(239, 68, 68, 0.1);
`;

const Title = styled.h1`
  font-size: 24px;
  font-weight: 800;
  color: #1f2937;
  margin-bottom: 12px;
  letter-spacing: -0.5px;
`;

const Description = styled.p`
  font-size: 15px;
  color: #6b7280;
  line-height: 1.6;
  margin-bottom: 40px;
`;

const ButtonGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
`;

const ButtonBase = styled(Link)`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 16px;
  border-radius: 16px;
  font-size: 15px;
  font-weight: 700;
  text-decoration: none;
  transition: transform 0.1s, opacity 0.2s;

  &:active {
    transform: scale(0.98);
  }
`;

const PrimaryButton = styled(ButtonBase)`
  background-color: #ef4444; /* 빨강 */
  color: white;
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.2);

  &:hover {
    background-color: #dc2626;
  }
`;

const SecondaryButton = styled(ButtonBase)`
  background-color: #f3f4f6;
  color: #4b5563;

  &:hover {
    background-color: #e5e7eb;
  }
`;
