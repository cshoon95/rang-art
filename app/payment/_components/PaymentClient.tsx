"use client";

import React, { useState } from "react";
import styled, { css, keyframes } from "styled-components";

import PaymentGrid from "./PaymentGrid";
import PaymentSummary from "./PaymentSummary";
import { PaymentType } from "@/api/payment/type";
import { getTodayYear, getTodayMonth } from "@/utils/date";
import Select from "@/components/Select";
import { usePaymentMessageList } from "@/api/payment/usePaymentQuery";
import PageTitleWithStar from "@/components/PageTitleWithStar";
import ModalPaymentMessage from "@/components/modals/ModalPaymentMessage";
import PaymentAddModal from "@/app/payment/_components/PaymentAddModal";
import { MessageCircle, Bell, Plus } from "lucide-react";

// --- Styled Components ---
const PageContainer = styled.div`
  padding: 32px 24px;
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 24px;
  background-color: #f9f9fb;
  min-height: 100vh;

  @media (max-width: 600px) {
    padding: 20px 16px;
    margin-bottom: 20px;
  }
`;

const HeaderSection = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  flex-wrap: wrap;
  gap: 16px;
`;
const TitleGroup = styled.div`
  display: flex;
  justify-content: space-between; /* 양 끝 정렬 */
  align-items: center; /* 수직 중앙 정렬 */
  width: 100%; /* 부모 영역 꽉 채우기 */
  gap: 12px;
`;

// 2. 텍스트(제목+부제)를 감쌀 새로운 컴포넌트 추가
const TextColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

// 3. 버튼 영역 스타일 (위치 고정 해제 및 정렬)
const TopRightArea = styled.div`
  flex-shrink: 0; /* 화면이 좁아져도 버튼이 찌그러지지 않게 함 */
`;

const Title = styled.h1`
  font-size: 26px;
  font-weight: 800;
  color: #191f28;
  margin: 0;
  letter-spacing: -0.5px;
  @media (max-width: 600px) {
    font-size: 22px;
  }
`;

const SubTitle = styled.span`
  font-size: 14px;
  color: #8b95a1;
  font-weight: 500;
`;

const HeaderControls = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;

  @media (max-width: 768px) {
    width: 100%;
    /* 모바일에서는 버튼을 위로, 나머지는 아래로 */
    flex-wrap: wrap;
    justify-content: flex-end;
  }
`;

// 🌟 [수정] 알림 버튼 스타일 (우측 상단 배치용)
const MsgButton = styled.button<{ $hasCount: boolean }>`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background-color: ${({ $hasCount }) => ($hasCount ? "#fff0f0" : "#ffffff")};
  color: ${({ $hasCount }) => ($hasCount ? "#e11d48" : "#4e5968")};
  border: 1px solid ${({ $hasCount }) => ($hasCount ? "#fda4af" : "#d1d6db")};
  border-radius: 10px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);

  &:hover {
    background-color: ${({ $hasCount }) => ($hasCount ? "#fee2e2" : "#f2f4f6")};
    transform: translateY(-1px);
  }
`;

// 🌟 [추가] 펄스 애니메이션 (알림이 있을 때 강조)
const pulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
`;

const CountBadge = styled.span`
  background-color: #e11d48;
  color: white;
  font-size: 11px;
  font-weight: 800;
  padding: 2px 6px;
  border-radius: 99px;
  margin-left: 2px;
  animation: ${pulse} 2s infinite; /* 알림 있으면 둥둥 거림 */
`;

const SegmentedControl = styled.div`
  background-color: #e5e8eb;
  padding: 4px;
  border-radius: 10px;
  display: flex;
  height: 40px;
  @media (max-width: 600px) {
    flex: 1; /* 모바일에서 꽉 차게 */
    order: 2; /* 줄바꿈 시 순서 조정 */
  }
`;

const SegmentButton = styled.button<{ $active: boolean }>`
  flex: 1;
  border: none;
  border-radius: 8px;
  background-color: ${(props) => (props.$active ? "#ffffff" : "transparent")};
  color: ${(props) => (props.$active ? "#191f28" : "#8b95a1")};
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  padding: 0 16px;
  box-shadow: ${(props) =>
    props.$active ? "0 1px 3px rgba(0,0,0,0.12)" : "none"};
  white-space: nowrap;
`;

const Divider = styled.div`
  width: 1px;
  height: 20px;
  background-color: #d1d6db;
  margin: 0 4px;
  @media (max-width: 768px) {
    display: none;
  }
`;

const SelectGroup = styled.div`
  display: flex;
  gap: 8px;
  flex-shrink: 0;
  @media (max-width: 600px) {
    order: 2;
  }
`;

// 🌟 [추가] 모바일에서 버튼

const ContentLayout = styled.div`
  display: flex;
  gap: 24px;
  align-items: flex-start;
  @media (max-width: 900px) {
    flex-direction: column;
  }
`;

const MainCard = styled.div`
  flex: 1;
  background: white;
  border-radius: 24px;
  padding: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.02);
  border: 1px solid #f2f4f6;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  max-height: 580px;
  width: 100%;
  @media (max-width: 600px) {
    padding: 16px;
  }
`;

const SidePanel = styled.div`
  width: 320px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  position: sticky;
  top: 24px;
  @media (max-width: 900px) {
    width: 100%;
    position: static;
  }
`;

interface Props {
  academyCode: string;
  userId: string;
}

export default function PaymentClient({ academyCode, userId }: Props) {
  const [tabValue, setTabValue] = useState<PaymentType>("income");
  const [year, setYear] = useState(getTodayYear());
  const [month, setMonth] = useState(getTodayMonth());
  const [isMsgModalOpen, setIsMsgModalOpen] = useState(false);
  // 🌟 [추가] 부모 컴포넌트에서 데이터 미리 로드 (인원수 확인용)
  const { data: messageList = [], isLoading: messageLoading } =
    usePaymentMessageList(academyCode);
  const msgCount = messageList.length;

  const yearOptions = Array.from({ length: 5 }, (_, i) => {
    const y = String(Number(getTodayYear()) - i);
    return { label: `${y}년`, value: y };
  });

  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const m = String(i + 1).padStart(2, "0");
    return { label: `${m}월`, value: m };
  });

  return (
    <PageContainer>
      <HeaderSection>
        <TitleGroup>
          {/* 텍스트는 세로로 쌓이게 TextColumn으로 감쌈 */}
          <TextColumn>
            <PageTitleWithStar title={<Title>출납 관리</Title>} />
          </TextColumn>

          {/* 버튼은 텍스트 우측에 배치 */}
          {msgCount > 0 && (
            <TopRightArea>
              <MsgButton
                onClick={() => setIsMsgModalOpen(true)}
                $hasCount={msgCount > 0}
              >
                {msgCount > 0 ? (
                  <Bell size={16} fill="#e11d48" />
                ) : (
                  <MessageCircle size={16} />
                )}
                결제 알림
                {msgCount > 0 && <CountBadge> {msgCount}명</CountBadge>}
              </MsgButton>
            </TopRightArea>
          )}
        </TitleGroup>
        <HeaderControls>
          <SegmentedControl>
            <SegmentButton
              $active={tabValue === "income"}
              onClick={() => setTabValue("income")}
            >
              수입
            </SegmentButton>
            <SegmentButton
              $active={tabValue === "expenditure"}
              onClick={() => setTabValue("expenditure")}
            >
              지출
            </SegmentButton>
          </SegmentedControl>

          <Divider />

          <SelectGroup>
            <Select
              options={yearOptions}
              value={year}
              onChange={setYear}
              width="90px"
            />
            <Select
              options={monthOptions}
              value={month}
              onChange={setMonth}
              width="80px"
            />
          </SelectGroup>
        </HeaderControls>
      </HeaderSection>

      <ContentLayout>
        <MainCard>
          <PaymentGrid
            year={year}
            month={month}
            type={tabValue}
            academyCode={academyCode}
            userId={userId}
          />
        </MainCard>

        <SidePanel>
          <PaymentSummary
            year={year}
            month={month}
            type={tabValue}
            academyCode={academyCode}
          />
        </SidePanel>
      </ContentLayout>

      {isMsgModalOpen && (
        <ModalPaymentMessage
          messageList={messageList}
          isLoading={messageLoading}
          onClose={() => setIsMsgModalOpen(false)}
          academyCode={academyCode} // 🌟 추가
          userId={userId} // 🌟 추가
        />
      )}
    </PageContainer>
  );
}
