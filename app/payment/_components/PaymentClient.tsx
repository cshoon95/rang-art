"use client";

import React, { useState, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import styled, { css, keyframes } from "styled-components";
import { MessageCircle, Bell, ChevronLeft, ChevronRight } from "lucide-react";

// Components
import PaymentGrid from "./PaymentGrid";
import PaymentSummary from "./PaymentSummary";
import Select from "@/components/Select";
import PageTitleWithStar from "@/components/PageTitleWithStar";

const ModalPaymentMessage = dynamic(
  () => import("@/components/modals/ModalPaymentMessage"),
  { ssr: false }
);

// Utils & Hooks
import { getTodayYear, getTodayMonth } from "@/utils/date";
import { PaymentType } from "@/app/_types/type";
import { usePaymentMessageList } from "@/app/_querys";

interface Props {
  academyCode: string;
  userId: string;
}

// --------------------------------------------------------------------------
// 🧩 Memoized Sub-Components
// --------------------------------------------------------------------------
const MemoizedPaymentGrid = React.memo(PaymentGrid);
const MemoizedPaymentSummary = React.memo(PaymentSummary);

export default function PaymentClient({ academyCode, userId }: Props) {
  // 상태 관리
  const [tabValue, setTabValue] = useState<PaymentType>("income");
  const [year, setYear] = useState(getTodayYear());
  const [month, setMonth] = useState(getTodayMonth());
  const [isMsgModalOpen, setIsMsgModalOpen] = useState(false);

  // 데이터 미리 로드
  const { data: messageList = [], isLoading: messageLoading } =
    usePaymentMessageList(academyCode);

  const msgCount = messageList.length;

  // 옵션 데이터 (useMemo)
  const yearOptions = useMemo(
    () =>
      // length를 4로 늘리면 [2026, 2025, 2024, 2023] 이렇게 4개가 나옵니다.
      Array.from({ length: 4 }, (_, i) => {
        // ✅ [수정] (현재 연도 + 1)부터 시작해서 내림차순으로 생성
        const y = String(Number(getTodayYear()) + 1 - i);
        return { label: `${y}년`, value: y };
      }),
    []
  );
  const monthOptions = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => {
        const m = String(i + 1).padStart(2, "0");
        return { label: `${m}월`, value: m };
      }),
    []
  );

  // 3. 핸들러 메모이제이션
  const handleTabIncome = useCallback(() => setTabValue("income"), []);
  const handleTabExpenditure = useCallback(
    () => setTabValue("expenditure"),
    []
  );

  const handleYearChange = useCallback((_: any, v?: string) => {
    if (v) setYear(v);
  }, []);

  const handleMonthSelectChange = useCallback((_: any, v?: string) => {
    if (v) setMonth(v);
  }, []);

  const handleOpenMsgModal = useCallback(() => setIsMsgModalOpen(true), []);
  const handleCloseMsgModal = useCallback(() => setIsMsgModalOpen(false), []);

  // ✅ [수정됨] 날짜 변경 로직 (연도 전환 버그 수정)
  const handleMonthChange = useCallback(
    (direction: "prev" | "next") => {
      // 현재 상태를 기준으로 계산
      const currentY = parseInt(year);
      const currentM = parseInt(month);

      let newY = currentY;
      let newM = currentM;

      if (direction === "prev") {
        newM = currentM - 1;
        if (newM < 1) {
          newM = 12;
          newY = currentY - 1;
        }
      } else {
        newM = currentM + 1;
        if (newM > 12) {
          newM = 1;
          newY = currentY + 1;
        }
      }

      setYear(String(newY));
      setMonth(String(newM).padStart(2, "0"));
    },
    [year, month] // year와 month가 바뀔 때마다 함수 재생성 -> 최신 상태값 참조 보장
  );

  return (
    <PageContainer>
      <HeaderSection>
        <HeaderTop>
          <PageTitleWithStar title={<Title>출납 관리</Title>} />

          {msgCount > 0 && (
            <MsgButton onClick={handleOpenMsgModal} $hasCount={true}>
              <Bell size={16} fill="#e11d48" />
              결제 알림
              <CountBadge>{msgCount}명</CountBadge>
            </MsgButton>
          )}
        </HeaderTop>

        <HeaderControls>
          <SegmentedControl>
            <SegmentButton
              $active={tabValue === "income"}
              onClick={handleTabIncome}
            >
              수입
            </SegmentButton>
            <SegmentButton
              $active={tabValue === "expenditure"}
              onClick={handleTabExpenditure}
            >
              지출
            </SegmentButton>
          </SegmentedControl>

          <DateNavigation>
            <NavArrow onClick={() => handleMonthChange("prev")}>
              <ChevronLeft size={20} />
            </NavArrow>

            <SelectGroup>
              <Select
                options={yearOptions}
                value={year}
                onChange={handleYearChange}
                width="90px"
              />
              <Select
                options={monthOptions}
                value={month}
                onChange={handleMonthSelectChange}
                width="80px"
              />
            </SelectGroup>

            <NavArrow onClick={() => handleMonthChange("next")}>
              <ChevronRight size={20} />
            </NavArrow>
          </DateNavigation>
        </HeaderControls>
      </HeaderSection>

      <ContentLayout>
        <MainCard>
          <MemoizedPaymentGrid
            year={year}
            month={month}
            type={tabValue}
            academyCode={academyCode}
            userId={userId}
          />
        </MainCard>

        <SidePanel>
          <MemoizedPaymentSummary
            year={year}
            month={month}
            type={tabValue}
            academyCode={academyCode}
          />
        </SidePanel>
      </ContentLayout>

      {/* Dynamic Import된 모달 (조건부 렌더링) */}
      {isMsgModalOpen && (
        <ModalPaymentMessage
          messageList={messageList}
          isLoading={messageLoading}
          onClose={handleCloseMsgModal}
          academyCode={academyCode}
          userId={userId}
        />
      )}
    </PageContainer>
  );
}

// --------------------------------------------------------------------------
// ✨ Styled Components (변경 없음)
// --------------------------------------------------------------------------

const PageContainer = styled.div`
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 24px;
  background-color: white;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.02);
  border: 1px solid rgba(224, 224, 224, 0.4);
  border-radius: 24px;
  font-family: "Pretendard", sans-serif;

  @media (max-width: 768px) {
    padding: 16px;
    gap: 16px;
  }
`;

const HeaderSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const HeaderTop = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Title = styled.h1`
  font-size: 24px;
  font-weight: 800;
  color: #191f28;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 6px;
  @media (max-width: 768px) {
    font-size: 20px;
  }
`;

const HeaderControls = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;

  @media (max-width: 768px) {
    flex-direction: column-reverse; /* 모바일: 날짜가 위, 탭이 아래 */
    align-items: stretch;
  }
`;

const MsgButton = styled.button<{ $hasCount: boolean }>`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background-color: #fff0f0;
  color: #e11d48;
  border: 1px solid #fda4af;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background-color: #fee2e2;
    transform: translateY(-1px);
  }
`;

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
  animation: ${pulse} 2s infinite;
`;

const SegmentedControl = styled.div`
  background-color: #f2f4f6;
  padding: 4px;
  border-radius: 12px;
  display: flex;
  width: 200px;

  @media (max-width: 768px) {
    width: 100%;
  }
`;

const SegmentButton = styled.button<{ $active: boolean }>`
  flex: 1;
  border: none;
  border-radius: 8px;
  background-color: ${(props) => (props.$active ? "#ffffff" : "transparent")};
  color: ${(props) => (props.$active ? "#191f28" : "#8b95a1")};
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  padding: 8px 0;
  box-shadow: ${(props) =>
    props.$active ? "0 1px 3px rgba(0,0,0,0.1)" : "none"};
  transition: all 0.2s ease;
`;

const DateNavigation = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  background: white;

  @media (max-width: 768px) {
    justify-content: space-between;
    width: 100%;
  }
`;

const NavArrow = styled.button`
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  border: 1px solid #e5e8eb;
  background-color: white;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background-color: #f9fafb;
    color: #191f28;
    border-color: #d1d6db;
  }
`;

const SelectGroup = styled.div`
  display: flex;
  gap: 8px;
`;

const ContentLayout = styled.div`
  display: flex;
  gap: 24px;
  align-items: flex-start;
  min-height: 600px;

  @media (max-width: 1024px) {
    flex-direction: column;
  }
`;

const MainCard = styled.div`
  flex: 1;
  background: white;
  border-radius: 20px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  width: 100%;
`;

const SidePanel = styled.div`
  width: 340px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 20px;
  position: sticky;
  top: 24px;

  @media (max-width: 1024px) {
    width: 100%;
    position: static;
  }
`;
