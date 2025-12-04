"use client";

import { useEffect, useState } from "react";
import styled, { keyframes } from "styled-components";
import { CheckCircle, Clock, Loader2 } from "lucide-react";
import { useModalStore } from "@/store/modalStore";
import { useShallow } from "zustand/react/shallow";

export default function ModalLoginWaiting({
  academyCode,
}: {
  academyCode: string | null;
}) {
  // ✅ 수정: store에서 data를 꺼내와야 합니다.
  const { closeModal } = useModalStore(
    useShallow((state) => ({
      closeModal: state.closeModal,
    }))
  );

  // 공용(2)은 3초, 그 외에는 5초 대기
  const INITIAL_TIME = academyCode === "2" ? 3 : 5;
  const [time, setTime] = useState(INITIAL_TIME);

  const isFreeTrial = academyCode === "2";

  useEffect(() => {
    const timer = setInterval(() => {
      setTime((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          closeModal(); // 닫히면서 store에 등록된 콜백(페이지 이동) 실행
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [closeModal]);

  return (
    <Container>
      <IconWrapper>
        {isFreeTrial ? (
          <CheckCircle size={52} color="#3182f6" strokeWidth={2} />
        ) : (
          <Loader2 size={52} color="#3182f6" strokeWidth={2} className="spin" />
        )}
      </IconWrapper>

      <Title>{isFreeTrial ? "환영합니다!" : "가입 요청 완료"}</Title>

      <DescBox>
        {isFreeTrial ? (
          <>
            <MainText>무료체험 계정으로 시작합니다.</MainText>
            <SubText>지금 바로 모든 기능을 사용하실 수 있어요.</SubText>
          </>
        ) : (
          <>
            <MainText>관리자 승인 후 이용 가능합니다.</MainText>
            <SubText>승인이 완료되면 카카오톡으로 알려드릴게요.</SubText>
          </>
        )}
      </DescBox>

      <TimerBadge>
        <Clock size={14} />
        <span>{time}초 후 자동으로 이동합니다</span>
      </TimerBadge>

      <ProgressBar>
        {/* 타이머 시간에 맞춰 애니메이션 속도 조절 */}
        <ProgressFill $duration={INITIAL_TIME} />
      </ProgressBar>
    </Container>
  );
}

// --- Styles ---

const spin = keyframes`
  from { transform: rotate(0deg); } to { transform: rotate(360deg); }
`;

const popIn = keyframes`
  0% { transform: scale(0.5); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
`;

const Container = styled.div`
  text-align: center;
  padding: 12px 0 0;
`;

const IconWrapper = styled.div`
  margin-bottom: 24px;
  display: flex;
  justify-content: center;
  animation: ${popIn} 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);

  & .spin {
    animation: ${spin} 3s linear infinite;
  }
`;

const Title = styled.h2`
  font-size: 24px;
  font-weight: 800;
  color: #191f28;
  margin-bottom: 16px;
  letter-spacing: -0.5px;
`;

const DescBox = styled.div`
  background-color: #f9fafb;
  border-radius: 20px;
  padding: 24px;
  margin-bottom: 24px;
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const MainText = styled.p`
  font-size: 16px;
  font-weight: 700;
  color: #333d4b;
  margin: 0;
`;

const SubText = styled.p`
  font-size: 14px;
  color: #8b95a1;
  margin: 0;
`;

const TimerBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background-color: #f2f4f6;
  border-radius: 20px;
  color: #6b7684;
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 20px;
`;

const progressAnim = keyframes`
  from { width: 100%; } to { width: 0%; }
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 4px;
  background-color: #f2f4f6;
  border-radius: 2px;
  overflow: hidden;
`;

const ProgressFill = styled.div<{ $duration: number }>`
  height: 100%;
  background-color: #3182f6;
  /* duration을 props로 받아서 동적으로 설정 */
  animation: ${progressAnim} ${({ $duration }) => $duration}s linear forwards;
`;
