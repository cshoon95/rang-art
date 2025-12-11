// components/signup/SignupClient.tsx (클라이언트 컴포넌트)

"use client";

import { useState } from "react";
import styled, { keyframes } from "styled-components";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { useModalStore } from "@/store/modalStore";
import ModalLoginWaiting from "@/components/modals/ModalLoginWaiting";
import { useInsertJoin } from "@/app/api/auth/useAuth";

interface Props {
  initialBranches: any[]; // DB에서 넘어온 지점 목록
}

export default function SignupClient({ initialBranches }: Props) {
  const { data: session, update } = useSession();
  const router = useRouter();
  const openModal = useModalStore((state) => state.openModal);

  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { mutate: joinMutate, isPending: isLoadingJoinMutate } = useInsertJoin({
    onSuccess: async (data, variables) => {
      // 1. 세션 강제 갱신
      await update();

      // 2. 이동할 경로 결정 (무료체험이면 바로 홈, 아니면 대기)
      // code가 '2'인지 확인하는 로직은 DB 데이터에 따라 유연하게 처리 필요
      // 여기선 예시로 '무료체험' 이름이나 특정 코드를 체크하거나,
      // 승인 대기 로직을 일괄 적용할 수도 있습니다.
      const isFreeTrial =
        variables.academyCode === "2" || variables.academyCode.startsWith("A");
      // (기존 로직 유지하거나 상황에 맞게 수정하세요)

      const nextPath = "/waiting"; // 일단 대기 페이지로 보냄 (AuthCheck가 알아서 처리)

      openModal({
        type: "ALERT",
        title: "가입 대기",
        content: <ModalLoginWaiting academyCode={variables.academyCode} />,
        onConfirm: () => {
          // 확인 버튼 누르면 이동
          window.location.reload();
        },
      });

      // 모달 없이 바로 이동하려면
      // router.replace(nextPath);
    },
    onError: (error) => {
      console.error(error);
      alert("오류가 발생했습니다. 다시 시도해주세요.");
    },
  });

  const handleSubmit = async () => {
    if (!selectedCode || !session?.user?.email) return;

    const userName = session.user.name || "이름없음";

    // [중요] 세션 업데이트는 onSuccess에서 하는 게 더 안전하지만,
    // 여기서 미리 호출해도 큰 문제는 없습니다. (다만 비동기 순서 주의)
    // await update({ academyCode: "2" }); // 이 줄은 제거하거나 신중히 사용

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
          {/* ✅ DB 데이터로 렌더링 */}
          {initialBranches.map((branch) => (
            <BranchItem
              key={branch.code}
              $isSelected={selectedCode === branch.code}
              onClick={() => setSelectedCode(branch.code)}
            >
              <BranchName>
                {branch.name}
                <BranchOwner>
                  ({branch.owner + " 원장님" || "원장 미정"})
                </BranchOwner>
              </BranchName>

              {selectedCode === branch.code && (
                <CheckIconWrapper>
                  <Check size={20} strokeWidth={3} />
                </CheckIconWrapper>
              )}
            </BranchItem>
          ))}
        </BranchList>

        <SubmitButton
          disabled={!selectedCode || isLoading || isLoadingJoinMutate}
          onClick={handleSubmit}
        >
          {isLoading || isLoadingJoinMutate ? "등록 중..." : "선택 완료"}
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
  background-color: #f2f4f6;
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
  max-height: 90vh; /* 화면이 작을 때 스크롤 생기도록 */
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
  overflow-y: auto; /* 목록 길어지면 스크롤 */
  flex: 1; /* 남은 공간 차지 */

  /* 스크롤바 커스텀 (선택사항) */
  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-thumb {
    background-color: #eee;
    border-radius: 3px;
  }
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
  display: flex;
  align-items: center;
  gap: 6px;
`;

// 원장 이름 스타일 추가
const BranchOwner = styled.span`
  font-size: 13px;
  font-weight: 500;
  color: #8b95a1;
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
