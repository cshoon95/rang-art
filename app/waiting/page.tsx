"use client";

import styled, { keyframes } from "styled-components";
import { useSession, signOut } from "next-auth/react";
import { Hourglass, LogOut, RefreshCw } from "lucide-react";
import { useEffect } from "react";

export default function WaitingPage() {
  const { data: session } = useSession();

  return (
    <Container>
      <Card>
        <IconArea>
          <Hourglass size={60} color="#3182f6" />
          <PulseCircle />
        </IconArea>

        <Title>
          가입 승인을
          <br />
          기다리고 있어요 ⏳
        </Title>

        <Description>
          <Highlight>{session?.user?.name}</Highlight>님의 계정은 현재 검토
          중입니다.
          <br />
          관리자 승인이 완료되면 서비스를 이용하실 수 있습니다.
        </Description>

        <InfoBox>
          <Label>신청 계정</Label>
          <Value>{session?.user?.email}</Value>
        </InfoBox>

        <ButtonGroup>
          <ActionButton onClick={() => window.location.reload()}>
            <RefreshCw size={18} /> 새로고침
          </ActionButton>
          <LogoutButton onClick={() => signOut({ callbackUrl: "/login" })}>
            <LogOut size={18} /> 로그아웃
          </LogoutButton>
        </ButtonGroup>
      </Card>
    </Container>
  );
}

// --- Styles ---

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); }
`;

const pulse = keyframes`
  0% { transform: scale(0.9); opacity: 0.7; }
  50% { transform: scale(1.1); opacity: 0.3; }
  100% { transform: scale(0.9); opacity: 0.7; }
`;

const Container = styled.div`
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f2f4f6;
  padding: 20px;
`;

const Card = styled.div`
  width: 100%;
  max-width: 420px;
  background: white;
  padding: 50px 30px;
  border-radius: 32px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.05);
  text-align: center;
  animation: ${fadeIn} 0.6s cubic-bezier(0.16, 1, 0.3, 1);
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const IconArea = styled.div`
  position: relative;
  width: 100px;
  height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f2f9ff;
  border-radius: 50%;
  margin-bottom: 30px;
`;

const PulseCircle = styled.div`
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background-color: #3182f6;
  opacity: 0.1;
  animation: ${pulse} 2s infinite ease-in-out;
  z-index: -1;
`;

const Title = styled.h1`
  font-size: 26px;
  font-weight: 800;
  color: #191f28;
  margin-bottom: 16px;
  line-height: 1.4;
`;

const Description = styled.p`
  font-size: 15px;
  color: #6b7684;
  line-height: 1.6;
  margin-bottom: 32px;
`;

const Highlight = styled.span`
  color: #3182f6;
  font-weight: 700;
`;

const InfoBox = styled.div`
  background-color: #f9fafb;
  border-radius: 16px;
  padding: 16px 24px;
  width: 100%;
  margin-bottom: 40px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Label = styled.span`
  font-size: 13px;
  font-weight: 600;
  color: #8b95a1;
`;

const Value = styled.span`
  font-size: 14px;
  font-weight: 500;
  color: #333d4b;
`;

const ButtonGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
`;

const ActionButton = styled.button`
  width: 100%;
  padding: 16px;
  border-radius: 16px;
  border: none;
  background-color: #3182f6;
  color: white;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: transform 0.2s;

  &:hover {
    background-color: #2b72d7;
    transform: translateY(-2px);
  }
  &:active {
    transform: translateY(0);
  }
`;

const LogoutButton = styled.button`
  width: 100%;
  padding: 16px;
  border-radius: 16px;
  border: none;
  background-color: #fff;
  color: #ef4444;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;

  &:hover {
    background-color: #fff5f5;
  }
`;
