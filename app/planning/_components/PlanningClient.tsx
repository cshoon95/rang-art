"use client";

import React, { useState, useMemo, useCallback, useEffect } from "react";
import styled, { css, keyframes } from "styled-components";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Edit3,
  Calendar as CalendarIcon,
  Image as ImageIcon,
  User,
  Clock,
  Layout,
  X,
  Maximize2,
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

// --------------------------------------------------------------------------
// 1. Sub Components (PlanContent)
// --------------------------------------------------------------------------

const PlanContent = React.memo(
  ({ planData, openManagerModal, activeTabLabel, onImageClick }: any) => {
    // ✅ 1. 이미지 데이터 정규화
    const images: string[] = useMemo(() => {
      if (!planData) return [];
      if (
        planData.images &&
        Array.isArray(planData.images) &&
        planData.images.length > 0
      ) {
        return planData.images;
      }
      if (planData.image_url) {
        return [planData.image_url];
      }
      return [];
    }, [planData]);

    const [currentIndex, setCurrentIndex] = useState(0);

    // 데이터 변경 시 인덱스 초기화
    useEffect(() => {
      setCurrentIndex(0);
    }, [planData]);

    const handlePrev = (e: React.MouseEvent) => {
      e.stopPropagation();
      setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    };

    const handleNext = (e: React.MouseEvent) => {
      e.stopPropagation();
      setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    };

    // ✅ 썸네일 클릭 핸들러
    const handleThumbnailClick = (index: number, e: React.MouseEvent) => {
      e.stopPropagation();
      setCurrentIndex(index);
    };

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
          {images.length > 0 ? (
            <>
              <ImageWrapper onClick={() => onImageClick(images, currentIndex)}>
                <StyledImage
                  src={images[currentIndex]}
                  alt={`Slide ${currentIndex}`}
                  loading="lazy"
                />
                <ImageOverlay>
                  <OverlayBtn>
                    <Maximize2 size={20} /> 크게 보기
                  </OverlayBtn>
                </ImageOverlay>

                {/* 화살표 버튼 (2장 이상일 때) */}
                {images.length > 1 && (
                  <>
                    <SliderBtn $position="left" onClick={handlePrev}>
                      <ChevronLeft size={24} />
                    </SliderBtn>
                    <SliderBtn $position="right" onClick={handleNext}>
                      <ChevronRight size={24} />
                    </SliderBtn>
                  </>
                )}
              </ImageWrapper>

              {/* ✅ [추가] 하단 썸네일 리스트 (2장 이상일 때만 표시) */}
              {images.length > 1 && (
                <ThumbnailList>
                  {images.map((img, idx) => (
                    <ThumbnailItem
                      key={idx}
                      $active={idx === currentIndex}
                      onClick={(e) => handleThumbnailClick(idx, e)}
                    >
                      <img src={img} alt={`thumb-${idx}`} />
                    </ThumbnailItem>
                  ))}
                </ThumbnailList>
              )}
            </>
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
          {/* ... (기존 내용 유지) ... */}
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
// --------------------------------------------------------------------------
// 2. Main Component
// --------------------------------------------------------------------------

export default function PlanningClient({ academyCode, userId }: Props) {
  // State
  const [year, setYear] = useState(getTodayYear());
  const [month, setMonth] = useState(getTodayMonth());
  const [activeTab, setActiveTab] = useState<TabType>("normal");

  // ✅ Preview State (배열 & 인덱스)
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [previewIndex, setPreviewIndex] = useState(0);

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

  // 이미지 클릭 핸들러
  const handleImageClick = useCallback((images: string[], index: number) => {
    setPreviewImages(images);
    setPreviewIndex(index);
  }, []);

  const closePreview = useCallback(() => {
    setPreviewImages([]);
    setPreviewIndex(0);
  }, []);

  // 모달 내부 슬라이드 핸들러
  const handleModalPrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreviewIndex((prev) =>
      prev === 0 ? previewImages.length - 1 : prev - 1
    );
  };
  const handleModalNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreviewIndex((prev) =>
      prev === previewImages.length - 1 ? 0 : prev + 1
    );
  };

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
            <PageTitleWithStar title={<PageHeading>월간 계획안</PageHeading>} />

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

          {/* ✅ 다중 이미지 모달 뷰어 */}
          {previewImages.length > 0 && (
            <OverlayBackdrop onClick={closePreview}>
              <OverlayCloseBtn onClick={closePreview}>
                <X size={24} />
              </OverlayCloseBtn>

              {/* 모달: 좌측 버튼 */}
              {previewImages.length > 1 && (
                <ModalNavBtn $pos="left" onClick={handleModalPrev}>
                  <ChevronLeft size={32} />
                </ModalNavBtn>
              )}

              <OverlayImage
                src={previewImages[previewIndex]}
                alt="Original"
                onClick={(e) => e.stopPropagation()}
              />

              {/* 모달: 우측 버튼 */}
              {previewImages.length > 1 && (
                <ModalNavBtn $pos="right" onClick={handleModalNext}>
                  <ChevronRight size={32} />
                </ModalNavBtn>
              )}

              {/* 모달: 페이지네이션 */}
              {previewImages.length > 1 && (
                <ModalPagination onClick={(e) => e.stopPropagation()}>
                  {previewIndex + 1} / {previewImages.length}
                </ModalPagination>
              )}
            </OverlayBackdrop>
          )}
        </PageLayout>
      )}
    </>
  );
}

// --------------------------------------------------------------------------
// 🎨 Styled Components
// --------------------------------------------------------------------------

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const PageLayout = styled.div`
  width: 100%;
  max-width: 1000px;
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

// --- Tabs ---
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
    0 2px 4px -1px rgba(0, 0, 0, 0.03), 0 0 0 1px rgba(0, 0, 0, 0.02);
  overflow: hidden;
  transition: transform 0.3s ease, box-shadow 0.3s ease;

  &:hover {
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.08),
      0 4px 6px -2px rgba(0, 0, 0, 0.04);
  }
`;

const ImageSection = styled.div`
  position: relative;
  width: 100%;
  /* ✅ 높이를 자동으로 늘어나게 변경 (썸네일 포함을 위해) */
  /* height: 480px; 기존 고정 높이 제거 혹은 min-height로 변경 권장 */
  background-color: #f8fafc;
  overflow: hidden;
  display: flex;
  flex-direction: column; /* 세로 배치 */
`;

const ImageWrapper = styled.div`
  width: 100%;
  height: 380px; /* ✅ 메인 이미지 높이 여기서 고정 */
  cursor: zoom-in;
  position: relative;
  background-color: #000; /* 이미지가 비는 공간 검은색 처리 (선택) */

  @media (max-width: 768px) {
    height: 320px;
  }

  &:hover div {
    opacity: 1;
  }
`;

// ✅ [추가] 썸네일 리스트 컨테이너
const ThumbnailList = styled.div`
  display: flex;
  gap: 8px;
  padding: 12px;
  background: white;
  border-top: 1px solid #e5e7eb;
  overflow-x: auto; /* 이미지 많으면 가로 스크롤 */

  /* 스크롤바 숨기기 (선택) */
  &::-webkit-scrollbar {
    height: 6px;
  }
  &::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 3px;
  }
`;

// ✅ [추가] 썸네일 아이템
const ThumbnailItem = styled.div<{ $active: boolean }>`
  width: 60px;
  height: 60px;
  flex-shrink: 0;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  border: 2px solid ${(props) => (props.$active ? "#2563eb" : "transparent")};
  opacity: ${(props) => (props.$active ? 1 : 0.6)};
  transition: all 0.2s;

  &:hover {
    opacity: 1;
  }

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const StyledImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: contain;
  padding: 20px;
  transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  background-color: white;
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
  pointer-events: none; /* 오버레이가 클릭 이벤트를 가로채지 않도록 */
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
  transform: translateY(10px);
  transition: transform 0.3s ease;

  ${ImageWrapper}:hover & {
    transform: translateY(0);
  }
`;

// ✅ 슬라이더 버튼 (썸네일)
const SliderBtn = styled.button<{ $position: "left" | "right" }>`
  position: absolute;
  top: 50%;
  ${(props) => (props.$position === "left" ? "left: 10px;" : "right: 10px;")}
  transform: translateY(-50%);
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 5;
  color: #333;
  backdrop-filter: blur(4px);
  transition: all 0.2s;
  opacity: 0;

  ${ImageWrapper}:hover & {
    opacity: 1;
  }

  &:hover {
    background: white;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    transform: translateY(-50%) scale(1.1);
  }
`;

// ✅ 페이지네이션 (썸네일)
const Pagination = styled.div`
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 8px;
  z-index: 5;
  opacity: 0;
  transition: opacity 0.2s;

  ${ImageWrapper}:hover & {
    opacity: 1;
  }
`;

const Dot = styled.div<{ $active: boolean }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: ${(props) =>
    props.$active ? "#2563eb" : "rgba(255, 255, 255, 0.6)"};
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: all 0.3s;
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
  transition: transform 0.2s;
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
  z-index: 10001;

  &:hover {
    background: rgba(255, 255, 255, 0.25);
    transform: rotate(90deg);
  }
`;

// ✅ 모달 네비게이션 버튼
const ModalNavBtn = styled.button<{ $pos: "left" | "right" }>`
  position: absolute;
  top: 50%;
  ${(props) => (props.$pos === "left" ? "left: 20px;" : "right: 20px;")}
  transform: translateY(-50%);
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  padding: 10px;
  z-index: 10000;

  &:hover {
    color: white;
    transform: translateY(-50%) scale(1.2);
  }

  @media (max-width: 600px) {
    /* 모바일에서는 버튼을 작게 하거나 숨길 수 있음. 여기선 유지 */
    ${(props) => (props.$pos === "left" ? "left: 5px;" : "right: 5px;")}
    transform: translateY(-50%) scale(0.8);
  }
`;

const ModalPagination = styled.div`
  position: absolute;
  bottom: 30px;
  color: white;
  font-size: 16px;
  font-weight: 600;
  background: rgba(0, 0, 0, 0.5);
  padding: 6px 16px;
  border-radius: 20px;
  z-index: 10000;
`;
