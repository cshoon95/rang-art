"use client";

import Link from "next/link";
import styled, { keyframes } from "styled-components";
import { FileQuestion, MoveLeft } from "lucide-react";

export default function NotFound() {
  return (
    <Container>
      <Card>
        <IconWrapper>
          <FileQuestion size={64} color="#3b82f6" strokeWidth={1.5} />
        </IconWrapper>
        <Title>페이지를 찾을 수 없어요</Title>
        <Description>
          요청하신 페이지가 사라졌거나,
          <br />
          잘못된 경로로 접근하셨습니다. 주소를 다시 확인해주세요.
        </Description>
        <ButtonGroup>
          <PrimaryButton href="/home">
            <MoveLeft size={18} />
            홈으로 돌아가기
          </PrimaryButton>
        </ButtonGroup>
      </Card>
    </Container>
  );
}

// --- Styles (403 페이지와 구조는 같지만 색상이 다름) ---

const float = keyframes`
  0% { transform: translateY(0px) rotate(0deg); }
  50% { transform: translateY(-10px) rotate(5deg); } /* 살짝 회전 추가 */
  100% { transform: translateY(0px) rotate(0deg); }
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
  background-color: #eff6ff; /* 연한 파랑 배경 */
  border-radius: 40px; /* 둥근 사각형 */
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 32px;
  animation: ${float} 4s ease-in-out infinite;
  box-shadow: 0 10px 20px rgba(59, 130, 246, 0.15);
`;

const Title = styled.h1`
  font-size: 24px;
  font-weight: 800;
  color: #111827;
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
  width: 100%;
`;

const PrimaryButton = styled(Link)`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 16px;
  width: 100%;
  border-radius: 16px;
  font-size: 16px;
  font-weight: 700;
  text-decoration: none;
  background-color: #3b82f6; /* 파랑 */
  color: white;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.25);
  transition: all 0.2s;

  &:hover {
    background-color: #2563eb;
    transform: translateY(-2px);
  }
  &:active {
    transform: scale(0.98);
  }
`;
