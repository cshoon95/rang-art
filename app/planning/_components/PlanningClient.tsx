"use client";

import React, { useState } from "react";
import styled, { css, keyframes } from "styled-components";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Edit2,
  Calendar as CalendarIcon,
  Image as ImageIcon,
  User,
  Clock,
  Layout,
} from "lucide-react";
import { useModalStore } from "@/store/modalStore";
import PageTitleWithStar from "@/components/PageTitleWithStar";
import { getTodayYear, getTodayMonth } from "@/utils/date";
import ModalPlanningManager from "./ModalPlanningManager";
import PlanningSkeleton from "./PlanningSkeleton";
import { useGetPlanning } from "@/app/_querys";

interface Props {
  academyCode: string;
  userId: string;
}

type TabType = "normal" | "special" | "temporary";

const TABS = [
  { id: "normal", label: "일반" },
  { id: "special", label: "특강" },
  { id: "temporary", label: "임시" },
];

export default function PlanningClient({ academyCode, userId }: Props) {
  const [year, setYear] = useState(getTodayYear());
  const [month, setMonth] = useState(getTodayMonth());
  const [activeTab, setActiveTab] = useState<TabType>("normal");

  const { openModal } = useModalStore();

  const { data: planData, isLoading } = useGetPlanning({
    year: Number(year),
    month: Number(month),
    type: activeTab,
    academyCode,
  });

  const handleMonthChange = (dir: number) => {
    let newMonth = Number(month) + dir;
    let newYear = Number(year);

    if (newMonth > 12) {
      newMonth = 1;
      newYear += 1;
    } else if (newMonth < 1) {
      newMonth = 12;
      newYear -= 1;
    }

    setYear(String(newYear));
    setMonth(String(newMonth).padStart(2, "0"));
  };

  const openManagerModal = () => {
    openModal({
      title: planData ? "계획안 수정" : "새 계획안 작성",
      content: (
        <ModalPlanningManager
          initialData={planData}
          year={Number(year)}
          month={Number(month)}
          type={activeTab}
          academyCode={academyCode}
          userId={userId}
        />
      ),
      hideFooter: true,
      type: "FULL",
    });
  };

  return (
    <>
      {isLoading ? (
        <PlanningSkeleton />
      ) : (
        <Container>
          {/* 1. 상단 컨트롤 바 (타이틀 + 연도/탭 통합) */}
          <TopBar>
            <PageTitleWithStar title={<MainTitle>월간 계획</MainTitle>} />

            <ControlGroup>
              {/* 연도/월 네비게이터 */}
              <DateNavigator>
                <NavBtn onClick={() => handleMonthChange(-1)}>
                  <ChevronLeft size={18} />
                </NavBtn>
                <DateText>
                  {year}년 {month}월
                </DateText>
                <NavBtn onClick={() => handleMonthChange(1)}>
                  <ChevronRight size={18} />
                </NavBtn>
              </DateNavigator>

              <DividerVertical />

              {/* 탭 메뉴 */}
              <TabGroup>
                {TABS.map((tab) => (
                  <TabItem
                    key={tab.id}
                    $active={activeTab === tab.id}
                    onClick={() => setActiveTab(tab.id as TabType)}
                  >
                    {tab.label}
                  </TabItem>
                ))}
              </TabGroup>
            </ControlGroup>
          </TopBar>

          {/* 2. 메인 컨텐츠 영역 */}
          <ContentSection>
            {isLoading ? (
              <LoadingState>
                <CalendarIcon size={24} className="spin" />
                데이터를 불러오고 있습니다...
              </LoadingState>
            ) : planData ? (
              <Paper>
                {/* 이미지 영역 (높이 제한) */}
                <CoverImageWrapper>
                  {planData.image_url ? (
                    <CoverImage src={planData.image_url} alt="Cover" />
                  ) : (
                    <NoImage>
                      <ImageIcon size={32} />
                      <span>등록된 이미지가 없습니다</span>
                    </NoImage>
                  )}

                  <EditButton onClick={openManagerModal}>
                    <Edit2 size={14} /> 수정
                  </EditButton>
                </CoverImageWrapper>

                {/* 텍스트 내용 */}
                <PaperContent>
                  <ContentHeader>
                    <Badge>
                      {TABS.find((t) => t.id === activeTab)?.label} 계획안
                    </Badge>
                    <MetaInfo>
                      <span>
                        <User size={13} /> {planData.register_id || "관리자"}
                      </span>
                      <Dot />
                      <span>
                        <Clock size={13} />{" "}
                        {new Date(
                          planData.updated_at || planData.created_at
                        ).toLocaleDateString()}
                      </span>
                    </MetaInfo>
                  </ContentHeader>

                  <DocTitle>{planData.title || "제목 없음"}</DocTitle>
                  <DocBody>
                    {planData.content || "작성된 내용이 없습니다."}
                  </DocBody>
                </PaperContent>
              </Paper>
            ) : (
              // 데이터 없을 때
              <EmptyState>
                <EmptyIcon>
                  <Layout size={40} strokeWidth={1.5} />
                </EmptyIcon>
                <EmptyMessage>
                  <strong>아직 등록된 계획안이 없어요</strong>
                  <span>
                    {year}년 {month}월의 새로운 계획을 세워보세요!
                  </span>
                </EmptyMessage>
                <CreateButton onClick={openManagerModal}>
                  <Plus size={16} /> 작성하기
                </CreateButton>
              </EmptyState>
            )}
          </ContentSection>
        </Container>
      )}
    </>
  );
}

// --------------------------------------------------------------------------
// ✨ Styles (Compact & Clean)
// --------------------------------------------------------------------------

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const Container = styled.div`
  width: 100%;
  min-height: 100vh;
  background-color: #f8fafc;
  display: flex;
  flex-direction: column;
  padding: 24px;
  gap: 24px;

  @media (max-width: 768px) {
    padding: 16px;
    gap: 16px;
  }
`;

// --- Header & Controls ---
const TopBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
`;

const MainTitle = styled.h1`
  font-size: 22px;
  font-weight: 800;
  color: #1e293b;
  margin: 0;
`;

const ControlGroup = styled.div`
  display: flex;
  align-items: center;
  background: white;
  padding: 4px;
  border-radius: 12px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);
  border: 1px solid #e2e8f0;

  @media (max-width: 600px) {
    width: 100%;
    justify-content: space-between;
  }
`;

const DateNavigator = styled.div`
  display: flex;
  align-items: center;
  padding: 0 4px;
  gap: 4px;
`;

const NavBtn = styled.button`
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  color: #64748b;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  &:hover {
    background-color: #f1f5f9;
    color: #1e293b;
  }
`;

const DateText = styled.span`
  font-size: 14px;
  font-weight: 700;
  color: #1e293b;
  padding: 0 8px;
  white-space: nowrap;
`;

const DividerVertical = styled.div`
  width: 1px;
  height: 20px;
  background-color: #e2e8f0;
  margin: 0 8px;
`;

const TabGroup = styled.div`
  display: flex;
  gap: 2px;
  background-color: #f1f5f9;
  padding: 3px;
  border-radius: 8px;
`;

const TabItem = styled.button<{ $active: boolean }>`
  padding: 6px 12px;
  border-radius: 6px;
  border: none;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s;

  ${(props) =>
    props.$active
      ? css`
          background-color: white;
          color: #3182f6;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);
        `
      : css`
          background-color: transparent;
          color: #64748b;
          &:hover {
            color: #333;
          }
        `}
`;

// --- Content Section ---
const ContentSection = styled.div`
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: flex-start; /* 위쪽 정렬 */
  animation: ${fadeIn} 0.4s ease-out;
`;

const Paper = styled.div`
  width: 100%;
  max-width: 720px;
  background: white;
  border-radius: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
  border: 1px solid #f1f5f9;
  overflow: hidden;
`;

// ✅ [수정] 이미지 크기 제한 (높이 제한)
const CoverImageWrapper = styled.div`
  width: 100%;
  height: 450px; /* 고정 높이 */
  background-color: #f8fafc;
  position: relative;
  overflow: hidden;
  border-bottom: 1px solid #f1f5f9;

  @media (max-width: 768px) {
    height: 200px; /* 모바일에서는 더 작게 */
  }
`;

const CoverImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: contain; /* 이미지가 잘리지 않고 다 보이게 */
  /* 꽉 채우고 싶으면 object-fit: cover; 로 변경 */
`;

const NoImage = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #94a3b8;
  font-size: 13px;
  background-image: radial-gradient(#e2e8f0 1px, transparent 1px);
  background-size: 20px 20px;
`;

const EditButton = styled.button`
  position: absolute;
  bottom: 16px;
  right: 16px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(4px);
  border: 1px solid rgba(0, 0, 0, 0.05);
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  color: #475569;
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);

  &:hover {
    background: white;
    color: #3182f6;
    transform: translateY(-2px);
  }
`;

const PaperContent = styled.div`
  padding: 32px;
  @media (max-width: 768px) {
    padding: 24px;
  }
`;

const ContentHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`;

const Badge = styled.span`
  background-color: #eff6ff;
  color: #3182f6;
  font-size: 12px;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 6px;
`;

const MetaInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #94a3b8;

  span {
    display: flex;
    align-items: center;
    gap: 4px;
  }
`;

const Dot = styled.div`
  width: 3px;
  height: 3px;
  background-color: #cbd5e1;
  border-radius: 50%;
`;

const DocTitle = styled.h2`
  font-size: 24px;
  font-weight: 800;
  color: #1e293b;
  margin: 0 0 16px 0;
  line-height: 1.4;
`;

const DocBody = styled.div`
  font-size: 16px;
  line-height: 1.75;
  color: #475569;
  white-space: pre-wrap;
`;

// --- Empty State ---
const EmptyState = styled.div`
  width: 100%;
  max-width: 500px;
  padding: 60px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  background: white;
  border-radius: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);
  border: 1px dashed #e2e8f0;
  margin-top: 40px;
`;

const EmptyIcon = styled.div`
  width: 64px;
  height: 64px;
  border-radius: 20px;
  background-color: #f1f5f9;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #94a3b8;
  margin-bottom: 16px;
`;

const EmptyMessage = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 24px;

  strong {
    font-size: 18px;
    color: #334155;
  }
  span {
    font-size: 14px;
    color: #94a3b8;
  }
`;

const CreateButton = styled.button`
  background-color: #3182f6;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;
  &:hover {
    background-color: #2563eb;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(49, 130, 246, 0.3);
  }
`;

const LoadingState = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  color: #94a3b8;
  margin-top: 100px;

  .spin {
    animation: spin 1s linear infinite;
  }
  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
`;
