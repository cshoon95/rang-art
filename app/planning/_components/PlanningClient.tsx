"use client";

import React, { useState, useMemo, useCallback } from "react";
import styled, { css, keyframes } from "styled-components";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Edit3, // 아이콘 변경
  Calendar as CalendarIcon,
  Image as ImageIcon,
  User,
  Clock,
  Layout,
  X,
  Maximize2,
  MoreHorizontal, // 아이콘 추가
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
  { id: "normal", label: "정규 수업" },
  { id: "special", label: "특강 / 행사" },
  { id: "temporary", label: "임시 저장" },
];

// --- 1. Sub Components ---

const PlanContent = React.memo(
  ({ planData, openManagerModal, activeTabLabel, onImageClick }: any) => {
    if (!planData) {
      return (
        <EmptyStateContainer>
          <EmptyCircle>
            <Layout size={48} strokeWidth={1} />
          </EmptyCircle>
          <EmptyTextGroup>
            <h3>등록된 {activeTabLabel} 계획이 없습니다</h3>
            <p>이번 달의 계획을 세워보세요.</p>
          </EmptyTextGroup>
          <PrimaryButton onClick={openManagerModal}>
            <Plus size={18} /> 새 계획안 작성하기
          </PrimaryButton>
        </EmptyStateContainer>
      );
    }

    return (
      <ArticleCard>
        <ImageSection>
          {planData.image_url ? (
            <ImageWrapper onClick={() => onImageClick(planData.image_url)}>
              <StyledImage
                src={planData.image_url}
                alt="Cover"
                loading="lazy"
              />
              <ImageOverlay>
                <OverlayBtn>
                  <Maximize2 size={20} /> 미리보기
                </OverlayBtn>
              </ImageOverlay>
            </ImageWrapper>
          ) : (
            <NoImagePlaceholder>
              <div className="icon-box">
                <ImageIcon size={40} strokeWidth={1.5} />
              </div>
              <span>대표 이미지가 등록되지 않았습니다</span>
            </NoImagePlaceholder>
          )}

          <FloatingEditBtn onClick={openManagerModal} aria-label="수정">
            <Edit3 size={20} />
          </FloatingEditBtn>
        </ImageSection>

        <ContentSection>
          <HeaderGroup>
            <TagBadge $type={activeTabLabel}>{activeTabLabel}</TagBadge>
            <MetaGroup>
              <MetaItem>
                <User size={14} />
                {planData.register_id || "관리자"}
              </MetaItem>
              <Divider />
              <MetaItem>
                <Clock size={14} />
                {new Date(
                  planData.updated_at || planData.created_at
                ).toLocaleDateString()}
              </MetaItem>
            </MetaGroup>
          </HeaderGroup>

          <TitleArea>{planData.title || "제목을 입력해주세요"}</TitleArea>

          <DividerLine />

          <BodyArea>
            {planData.content || "내용이 작성되지 않았습니다."}
          </BodyArea>
        </ContentSection>
      </ArticleCard>
    );
  }
);
PlanContent.displayName = "PlanContent";

// --- 2. Main Component ---

export default function PlanningClient({ academyCode, userId }: Props) {
  // State
  const [year, setYear] = useState(getTodayYear());
  const [month, setMonth] = useState(getTodayMonth());
  const [activeTab, setActiveTab] = useState<TabType>("normal");

  // Image Preview State
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const { openModal } = useModalStore();

  const { data: planData, isLoading } = useGetPlanning({
    year: Number(year),
    month: Number(month),
    type: activeTab,
    academyCode,
  });

  const handleMonthChange = useCallback(
    (dir: number) => {
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
    },
    [year, month]
  );

  const openManagerModal = useCallback(() => {
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
  }, [planData, year, month, activeTab, academyCode, userId, openModal]);

  const handleImageClick = useCallback((url: string) => {
    setPreviewImage(url);
  }, []);

  const closePreview = useCallback(() => {
    setPreviewImage(null);
  }, []);

  const activeTabLabel = useMemo(
    () => TABS.find((t) => t.id === activeTab)?.label || "일반",
    [activeTab]
  );

  return (
    <>
      {isLoading ? (
        <PlanningSkeleton />
      ) : (
        <PageLayout>
          {/* Header Controls */}
          <HeaderSection>
            <PageTitleWithStar
              title={<PageHeading>월간 계획 관리</PageHeading>}
            />

            <ControlsContainer>
              <MonthNavigator>
                <NavButton onClick={() => handleMonthChange(-1)}>
                  <ChevronLeft size={20} />
                </NavButton>
                <CurrentDate>
                  <span className="year">{year}년</span>
                  <span className="month">{month}월</span>
                </CurrentDate>
                <NavButton onClick={() => handleMonthChange(1)}>
                  <ChevronRight size={20} />
                </NavButton>
              </MonthNavigator>

              <SegmentedControl>
                {TABS.map((tab) => (
                  <SegmentButton
                    key={tab.id}
                    $active={activeTab === tab.id}
                    onClick={() => setActiveTab(tab.id as TabType)}
                  >
                    {tab.label}
                  </SegmentButton>
                ))}
              </SegmentedControl>
            </ControlsContainer>
          </HeaderSection>

          {/* Main Content Area */}
          <MainArea>
            {isLoading ? (
              <LoadingView>
                <CalendarIcon size={32} className="spin" />
                <span>데이터를 불러오는 중입니다...</span>
              </LoadingView>
            ) : (
              <PlanContent
                planData={planData}
                openManagerModal={openManagerModal}
                activeTabLabel={activeTabLabel}
                onImageClick={handleImageClick}
              />
            )}
          </MainArea>

          {/* Image Overlay Modal */}
          {previewImage && (
            <OverlayBackdrop onClick={closePreview}>
              <OverlayCloseBtn onClick={closePreview}>
                <X size={24} />
              </OverlayCloseBtn>
              <OverlayImage
                src={previewImage}
                alt="Original"
                onClick={(e) => e.stopPropagation()}
              />
            </OverlayBackdrop>
          )}
        </PageLayout>
      )}
    </>
  );
}

// --------------------------------------------------------------------------
// 🎨 Styled Components (Redesigned)
// --------------------------------------------------------------------------

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const PageLayout = styled.div`
  width: 100%;
  max-width: 1000px; /* 적절한 최대 너비 설정 */
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 32px;
  padding: 0 0 40px 0;
`;

const HeaderSection = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  flex-wrap: wrap;
  gap: 20px;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
  }
`;

const PageHeading = styled.h1`
  font-size: 26px;
  font-weight: 800;
  color: #111827;
  letter-spacing: -0.5px;
`;

const ControlsContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;

  @media (max-width: 600px) {
    width: 100%;
    flex-direction: column;
    align-items: stretch;
  }
`;

// --- Date Navigator ---
const MonthNavigator = styled.div`
  display: flex;
  align-items: center;
  background: white;
  padding: 4px 6px;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);

  @media (max-width: 600px) {
    justify-content: space-between;
  }
`;

const NavButton = styled.button`
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  border-radius: 8px;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #f3f4f6;
    color: #111827;
  }
  &:active {
    background: #e5e7eb;
  }
`;

const CurrentDate = styled.div`
  display: flex;
  align-items: baseline;
  gap: 4px;
  padding: 0 12px;

  .year {
    font-size: 16px;
    color: #6b7280;
    font-weight: 500;
  }
  .month {
    font-size: 16px;
    color: #111827;
    font-weight: 700;
  }
`;

// --- Tabs (Segmented Control Style) ---
const SegmentedControl = styled.div`
  display: flex;
  background: #f3f4f6;
  padding: 4px;
  border-radius: 12px;
  gap: 2px;
`;

const SegmentButton = styled.button<{ $active: boolean }>`
  flex: 1;
  padding: 8px 16px;
  font-size: 13px;
  font-weight: 600;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  white-space: nowrap;

  ${(props) =>
    props.$active
      ? css`
          background: white;
          color: #2563eb;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1),
            0 1px 2px rgba(0, 0, 0, 0.06);
        `
      : css`
          background: transparent;
          color: #6b7280;
          &:hover {
            color: #374151;
            background: rgba(255, 255, 255, 0.5);
          }
        `}
`;

// --- Main Content ---
const MainArea = styled.main`
  width: 100%;
  animation: ${fadeIn} 0.5s cubic-bezier(0.4, 0, 0.2, 1);
`;

const ArticleCard = styled.article`
  background: white;
  border-radius: 24px;
  border: 1px solid #f3f4f6;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05),
    0 2px 4px -1px rgba(0, 0, 0, 0.03), 0 0 0 1px rgba(0, 0, 0, 0.02); /* Subtle outline */
  overflow: hidden;
  transition: transform 0.3s ease, box-shadow 0.3s ease;

  &:hover {
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.08),
      0 4px 6px -2px rgba(0, 0, 0, 0.04);
  }
`;

// --- Image Section ---
const ImageSection = styled.div`
  position: relative;
  width: 100%;
  height: 480px;
  background-color: #f8fafc;
  overflow: hidden;

  @media (max-width: 768px) {
    height: 280px;
  }
`;

const ImageWrapper = styled.div`
  width: 100%;
  height: 100%;
  cursor: zoom-in;
  position: relative;

  &:hover div {
    opacity: 1;
  }

  &:hover img {
    transform: scale(1.03);
  }
`;

const StyledImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: contain;
  padding: 20px;
  transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  background-color: white; /* 이미지가 작을 경우 배경 */
`;

const ImageOverlay = styled.div`
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
  backdrop-filter: blur(2px);
`;

const OverlayBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.95);
  border: none;
  padding: 10px 20px;
  border-radius: 30px;
  font-weight: 600;
  font-size: 14px;
  color: #111;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  cursor: pointer;
  transform: translateY(10px);
  transition: transform 0.3s ease;

  ${ImageWrapper}:hover & {
    transform: translateY(0);
  }
`;

const NoImagePlaceholder = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  color: #9ca3af;
  background-image: radial-gradient(#e5e7eb 1px, transparent 1px);
  background-size: 24px 24px;

  .icon-box {
    width: 80px;
    height: 80px;
    background: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.02);
    border: 1px solid #f3f4f6;
  }

  span {
    font-size: 14px;
    font-weight: 500;
  }
`;

const FloatingEditBtn = styled.button`
  position: absolute;
  top: 20px;
  right: 20px;
  width: 44px;
  height: 44px;
  border-radius: 14px;
  background: white;
  border: 1px solid rgba(0, 0, 0, 0.05);
  color: #4b5563;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 10;

  &:hover {
    background: #2563eb;
    color: white;
    transform: translateY(-2px) scale(1.05);
    box-shadow: 0 8px 16px rgba(37, 99, 235, 0.25);
  }
`;

// --- Content Section ---
const ContentSection = styled.div`
  padding: 40px;

  @media (max-width: 768px) {
    padding: 24px;
  }
`;

const HeaderGroup = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 12px;
`;

const TagBadge = styled.span<{ $type: string }>`
  font-size: 12px;
  font-weight: 700;
  padding: 6px 12px;
  border-radius: 8px;
  letter-spacing: 0.02em;
  text-transform: uppercase;

  /* 색상 자동 할당 로직이 필요하다면 props에 따라 변경 가능 */
  background-color: #eff6ff;
  color: #2563eb;
`;

const MetaGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const MetaItem = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #6b7280;
  font-weight: 500;
`;

const Divider = styled.div`
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background-color: #d1d5db;
`;

const TitleArea = styled.h2`
  font-size: 28px;
  font-weight: 800;
  color: #111827;
  line-height: 1.4;
  margin-bottom: 24px;
  word-break: keep-all;
`;

const DividerLine = styled.hr`
  border: none;
  border-top: 1px dashed #e5e7eb;
  margin-bottom: 24px;
`;

const BodyArea = styled.div`
  font-size: 16px;
  line-height: 1.8;
  color: #374151;
  white-space: pre-wrap;
  word-break: break-word;

  /* Optional: Typography enhancement */
  p {
    margin-bottom: 1em;
  }
`;

// --- Empty State ---
const EmptyStateContainer = styled.div`
  background: white;
  border-radius: 24px;
  padding: 80px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  border: 1px dashed #e5e7eb;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02);
`;

const EmptyCircle = styled.div`
  width: 96px;
  height: 96px;
  border-radius: 50%;
  background-color: #f9fafb;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
  margin-bottom: 24px;
`;

const EmptyTextGroup = styled.div`
  margin-bottom: 32px;
  h3 {
    font-size: 20px;
    font-weight: 700;
    color: #111827;
    margin-bottom: 8px;
  }
  p {
    font-size: 15px;
    color: #6b7280;
  }
`;

const PrimaryButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  background-color: #2563eb;
  color: white;
  border: none;
  padding: 14px 28px;
  border-radius: 14px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2);

  &:hover {
    background-color: #1d4ed8;
    transform: translateY(-2px);
    box-shadow: 0 10px 15px -3px rgba(37, 99, 235, 0.3);
  }
  &:active {
    transform: translateY(0);
  }
`;

// --- Loading State ---
const LoadingView = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 100px 0;
  gap: 16px;
  color: #6b7280;
  font-size: 15px;
  font-weight: 500;

  .spin {
    animation: spin 1s linear infinite;
    color: #d1d5db;
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

// --- Overlay ---
const OverlayBackdrop = styled.div`
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(5px);
  z-index: 9999;
  display: flex;
  justify-content: center;
  align-items: center;
  animation: ${fadeIn} 0.3s ease-out;
`;

const OverlayImage = styled.img`
  max-width: 90vw;
  max-height: 90vh;
  object-fit: contain;
  border-radius: 8px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
`;

const OverlayCloseBtn = styled.button`
  position: absolute;
  top: 30px;
  right: 30px;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.25);
    transform: rotate(90deg);
  }
`;
