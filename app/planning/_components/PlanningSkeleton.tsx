"use client";

import React from "react";
import styled, { keyframes } from "styled-components";

export default function PlanningSkeleton() {
  return (
    <Container>
      {/* 1. Top Bar Skeleton */}
      <TopBar>
        {/* Title */}
        <SkeletonBase style={{ width: 120, height: 32 }} />

        {/* Controls (Date Nav + Tabs) */}
        <ControlGroupSkeleton>
          {/* Date Nav part */}
          <SkeletonBase style={{ width: 120, height: 28, borderRadius: 6 }} />
          {/* Vertical Divider */}
          <DividerSkeleton />
          {/* Tabs part */}
          <SkeletonBase style={{ width: 160, height: 28, borderRadius: 6 }} />
        </ControlGroupSkeleton>
      </TopBar>

      {/* 2. Content Skeleton */}
      <ContentSection>
        <PaperSkeleton>
          {/* Cover Image Area (Responsive Height) */}
          <ImageAreaSkeleton />

          {/* Content Area */}
          <ContentPadding>
            {/* Header (Badge + Meta) */}
            <ContentHeader>
              <SkeletonBase
                style={{ width: 60, height: 24, borderRadius: 6 }}
              />
              <SkeletonBase
                style={{ width: 140, height: 20, borderRadius: 4 }}
              />
            </ContentHeader>

            {/* Title */}
            <SkeletonBase
              style={{
                width: "60%",
                height: 32,
                marginTop: 16,
                marginBottom: 16,
                borderRadius: 4,
              }}
            />

            {/* Body Lines */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <SkeletonBase style={{ width: "100%", height: 16 }} />
              <SkeletonBase style={{ width: "95%", height: 16 }} />
              <SkeletonBase style={{ width: "90%", height: 16 }} />
              <SkeletonBase style={{ width: "92%", height: 16 }} />
              <SkeletonBase style={{ width: "60%", height: 16 }} />
            </div>
          </ContentPadding>
        </PaperSkeleton>
      </ContentSection>
    </Container>
  );
}

// --------------------------------------------------------------------------
// ✨ Animations & Base
// --------------------------------------------------------------------------

const shimmer = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`;

const SkeletonBase = styled.div`
  background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
  background-size: 200% 100%;
  animation: ${shimmer} 1.5s infinite linear;
  border-radius: 4px;
`;

// --------------------------------------------------------------------------
// ✨ Styles (Matching PlanningClient)
// --------------------------------------------------------------------------

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

// --- Top Bar ---
const TopBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
`;

const ControlGroupSkeleton = styled.div`
  display: flex;
  align-items: center;
  background: white;
  padding: 4px 8px;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  height: 44px;
  gap: 8px;

  @media (max-width: 600px) {
    width: 100%;
    justify-content: space-between;
  }
`;

const DividerSkeleton = styled(SkeletonBase)`
  width: 1px;
  height: 20px;
`;

// --- Content Section ---
const ContentSection = styled.div`
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: flex-start;
`;

const PaperSkeleton = styled.div`
  width: 100%;
  max-width: 720px;
  background: white;
  border-radius: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
  border: 1px solid #f1f5f9;
  overflow: hidden;
  display: flex;
  flex-direction: column;
`;

// ✅ 이미지 영역 높이 반응형 처리
const ImageAreaSkeleton = styled(SkeletonBase)`
  width: 100%;
  height: 450px;
  border-bottom: 1px solid #f1f5f9;
  border-radius: 0; // 이미지는 컨테이너에 맞춰짐

  @media (max-width: 768px) {
    height: 200px;
  }
`;

const ContentPadding = styled.div`
  padding: 32px;
  display: flex;
  flex-direction: column;

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
