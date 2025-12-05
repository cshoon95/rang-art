"use client";

import { useState } from "react";
import styled, { keyframes } from "styled-components";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { useInsertJoin } from "../api/auth/useAuth";
import { useModalStore } from "@/store/modalStore";
import ModalLoginWaiting from "@/components/modals/ModalLoginWaiting";
import { useShallow } from "zustand/react/shallow";
import { ACADEMY_LIST } from "@/utils/list";

// 선택 가능한 지점 목록
const ACADEMIES = [
  { code: "1", name: "본점 (Main)" },
  { code: "2", name: "공용 (Free Trial)" },
];

export default function SignupPage() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const openModal = useModalStore((state) => state.openModal);

  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { mutate: joinMutate, isPending: isLoadingJoinMutate } = useInsertJoin({
    onSuccess: async (data, variables) => {
      // 1. 세션 강제 갱신 (서버 DB 다시 조회 트리거)
      // 인자 없이 호출하면 jwt 콜백에서 trigger: "update"가 됨
      await update();

      // 2. 이동할 경로 결정
      const nextPath = variables.academyCode === "2" ? "/" : "/waiting";

      // 3. 모달 띄우기 (만약 모달 확인 후 이동이라면 여기서 router 호출 X)
      openModal({
        type: "SIMPLE",
        title: "가입 대기",
        content: <ModalLoginWaiting academyCode={variables.academyCode} />, // variables 사용 권장
        onConfirm: () => {
          // 4. [수정] 모달 확인 버튼 누르면 이동 (명시적 이동)
          // router.replace(nextPath);
        },
      });

      // 만약 모달 없이 바로 이동하고 싶다면:
      router.replace(nextPath);
    },
    onError: (error) => {
      console.error(error);
      alert("오류가 발생했습니다. 다시 시도해주세요.");
    },
  });

  const handleSubmit = async () => {
    // 여기있던 update() 제거! (onSuccess로 이동)

    if (!selectedCode || !session?.user?.email) return;

    const userName = session.user.name || "이름없음";

    await update({ academyCode: "2" });

    // Mutation 실행
    await joinMutate({
      email: session.user.email,
      name: userName,
      academyCode: selectedCode,
    });
  };

  return (
    <Container>
      <Card>
        <HeaderSection>
          <Title>어느 지점 관리자이신가요?</Title>
          <SubTitle>소속된 학원 지점을 선택해주세요.</SubTitle>
        </HeaderSection>

        <BranchList>
          {ACADEMY_LIST.map((academy) => (
            <BranchItem
              key={academy.code}
              $isSelected={selectedCode === academy.code}
              onClick={() => setSelectedCode(academy.code)}
            >
              <BranchName>{academy.name}</BranchName>
              {selectedCode === academy.code && (
                <CheckIconWrapper>
                  <Check size={20} strokeWidth={3} />
                </CheckIconWrapper>
              )}
            </BranchItem>
          ))}
        </BranchList>

        <SubmitButton
          disabled={!selectedCode || isLoading}
          onClick={handleSubmit}
        >
          {isLoading ? "등록 중..." : "선택 완료"}
        </SubmitButton>
      </Card>
    </Container>
  );
}

// --- Styles ---

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); } 
  to { opacity: 1; transform: translateY(0); }
`;

const Container = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f2f4f6; /* 토스 스타일 연회색 배경 */
  padding: 20px;
`;

const Card = styled.div`
  width: 100%;
  max-width: 420px;
  background: white;
  padding: 40px;
  border-radius: 24px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.04);
  animation: ${fadeIn} 0.6s cubic-bezier(0.16, 1, 0.3, 1);
  display: flex;
  flex-direction: column;
`;

const HeaderSection = styled.div`
  margin-bottom: 32px;
  text-align: left;
`;

const Title = styled.h1`
  font-size: 24px;
  font-weight: 800;
  color: #191f28;
  margin: 0 0 8px 0;
  letter-spacing: -0.5px;
`;

const SubTitle = styled.p`
  font-size: 15px;
  color: #8b95a1;
  margin: 0;
  line-height: 1.5;
`;

const BranchList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 40px;
`;

const BranchItem = styled.button<{ $isSelected: boolean }>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: 18px 20px;
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  font-family: inherit;
  text-align: left;

  /* 선택 여부에 따른 스타일 */
  border: 2px solid
    ${(props) => (props.$isSelected ? "#3182f6" : "transparent")};
  background-color: ${(props) => (props.$isSelected ? "#f2f9ff" : "#f9fafb")};
  color: ${(props) => (props.$isSelected ? "#3182f6" : "#4e5968")};

  &:hover {
    background-color: ${(props) => (props.$isSelected ? "#f2f9ff" : "#f2f4f6")};
  }

  &:active {
    transform: scale(0.98);
  }
`;

const BranchName = styled.span`
  font-size: 16px;
  font-weight: 700;
`;

const CheckIconWrapper = styled.div`
  color: #3182f6;
  display: flex;
  align-items: center;
`;

const SubmitButton = styled.button`
  width: 100%;
  padding: 18px;
  border-radius: 16px;
  border: none;
  background-color: #3182f6;
  color: white;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  margin-top: auto;

  &:disabled {
    background-color: #e5e8eb;
    color: #b0b8c1;
    cursor: not-allowed;
  }

  &:not(:disabled):hover {
    background-color: #1b64da;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(49, 130, 246, 0.2);
  }

  &:not(:disabled):active {
    transform: translateY(0);
  }
`;
