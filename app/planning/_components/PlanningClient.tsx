"use client";

import React, { useState, useMemo, useCallback } from "react";
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
  X, // 닫기 아이콘 추가
  Maximize2, // 확대 아이콘 추가
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

// --- 1. Sub Components ---

const PlanContent = React.memo(
  ({
    planData,
    openManagerModal,
    activeTabLabel,
    onImageClick, // 이미지 클릭 핸들러 추가
  }: any) => {
    if (!planData) {
      return (
        <EmptyState>
          <EmptyIcon>
            <Layout size={40} strokeWidth={1.5} />
          </EmptyIcon>
          <EmptyMessage>
            <strong>아직 등록된 계획안이 없어요</strong>
            <span>새로운 계획을 세워보세요!</span>
          </EmptyMessage>
          <CreateButton onClick={openManagerModal}>
            <Plus size={16} /> 작성하기
          </CreateButton>
        </EmptyState>
      );
    }

    return (
      <Paper>
        <CoverImageWrapper>
          {planData.image_url ? (
            <ImageContainer onClick={() => onImageClick(planData.image_url)}>
              <CoverImage src={planData.image_url} alt="Cover" loading="lazy" />
              <HoverOverlay>
                <Maximize2 color="white" size={24} />
              </HoverOverlay>
            </ImageContainer>
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

        <PaperContent>
          <ContentHeader>
            <Badge>{activeTabLabel} 계획안</Badge>
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
          <DocBody>{planData.content || "작성된 내용이 없습니다."}</DocBody>
        </PaperContent>
      </Paper>
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

  // 이미지 미리보기 핸들러
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
        <Container>
          <TopBar>
            <PageTitleWithStar title={<MainTitle>월간 계획</MainTitle>} />
            <ControlGroup>
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

          <ContentSection>
            {isLoading ? (
              <LoadingState>
                <CalendarIcon size={24} className="spin" />
                데이터를 불러오고 있습니다...
              </LoadingState>
            ) : (
              <PlanContent
                planData={planData}
                openManagerModal={openManagerModal}
                activeTabLabel={activeTabLabel}
                onImageClick={handleImageClick} // 전달
              />
            )}
          </ContentSection>

          {/* 이미지 미리보기 오버레이 */}
          {previewImage && (
            <ImageOverlay onClick={closePreview}>
              <CloseBtn onClick={closePreview}>
                <X size={24} color="white" />
              </CloseBtn>
              <FullImage
                src={previewImage}
                alt="Preview"
                onClick={(e) => e.stopPropagation()} // 이미지 클릭 시 닫히지 않도록
              />
            </ImageOverlay>
          )}
        </Container>
      )}
    </>
  );
}

// --------------------------------------------------------------------------
// ✨ Styles
// --------------------------------------------------------------------------

// ... (기존 스타일 동일 유지) ...

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const Container = styled.div`
  width: 100%;
  background-color: white;
  display: flex;
  flex-direction: column;
  padding: 24px;
  gap: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.02);
  border: 1px solid rgba(224, 224, 224, 0.4);
  border-radius: 24px;

  @media (max-width: 768px) {
    padding: 16px;
    gap: 16px;
  }
`;

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

const ContentSection = styled.div`
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: flex-start;
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

const CoverImageWrapper = styled.div`
  width: 100%;
  height: 450px;
  background-color: #f8fafc;
  position: relative;
  overflow: hidden;
  border-bottom: 1px solid #f1f5f9;

  @media (max-width: 768px) {
    height: 200px;
  }
`;

// ✅ [NEW] 이미지 클릭 효과 및 오버레이
const ImageContainer = styled.div`
  width: 100%;
  height: 100%;
  position: relative;
  cursor: pointer;
  &:hover > div {
    opacity: 1;
  }
`;

const HoverOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s;
`;

const CoverImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: contain;
  padding: 20px 0;
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
  z-index: 5; // 호버 오버레이보다 위에

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

// ✅ [NEW] Image Overlay Styles
const ImageOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.9);
  z-index: 9999;
  display: flex;
  justify-content: center;
  align-items: center;
  animation: ${fadeIn} 0.2s ease-out;
  cursor: zoom-out;
`;

const FullImage = styled.img`
  max-width: 90%;
  max-height: 90%;
  object-fit: contain;
  border-radius: 8px;
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.5);
  cursor: default;
`;

const CloseBtn = styled.button`
  position: absolute;
  top: 24px;
  right: 24px;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.2s;
  z-index: 10000;

  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }
`;
