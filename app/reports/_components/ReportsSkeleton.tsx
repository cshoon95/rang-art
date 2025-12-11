"use client";

import React from "react";
import styled, { keyframes } from "styled-components";

export default function ReportsSkeleton() {
  return (
    <Container>
      {/* 1. Header Skeleton */}
      <Header>
        <SkeletonBase style={{ width: 140, height: 32 }} /> {/* Title */}
        <Controls>
          <SkeletonBase style={{ width: 120, height: 40, borderRadius: 12 }} />{" "}
          {/* Year */}
          <SkeletonBase
            style={{ width: 180, height: 40, borderRadius: 12 }}
          />{" "}
          {/* Tabs */}
        </Controls>
      </Header>

      {/* 2. Dashboard Grid Skeleton */}
      <DashboardGrid>
        {/* Stat Cards (Top Row) */}
        {[1, 2, 3].map((i) => (
          <StatCardSkeleton key={i}>
            <StatHeader>
              <SkeletonBase style={{ width: 100, height: 16 }} />
              <SkeletonBase
                style={{ width: 32, height: 32, borderRadius: 10 }}
              />
            </StatHeader>
            <div style={{ marginTop: 16 }}>
              <SkeletonBase
                style={{ width: 120, height: 28, marginBottom: 8 }}
              />
              <SkeletonBase style={{ width: 80, height: 14 }} />
            </div>
          </StatCardSkeleton>
        ))}

        {/* Main Chart (Span 2) */}
        <MainChartCardSkeleton>
          <SkeletonBase style={{ width: 150, height: 20, marginBottom: 20 }} />
          <SkeletonBase
            style={{ width: "100%", height: 250, borderRadius: 8 }}
          />
        </MainChartCardSkeleton>

        {/* Sub Chart (Span 1) */}
        <SubChartCardSkeleton>
          <SkeletonBase style={{ width: 120, height: 20, marginBottom: 20 }} />
          <SkeletonBase
            style={{ width: "100%", height: 250, borderRadius: 100 }}
          />{" "}
          {/* 원형 차트 느낌 */}
        </SubChartCardSkeleton>

        {/* Bottom Pie Grid (Optional: for Customer Tab Layout) */}
        <PieChartGridSkeleton>
          {[1, 2, 3].map((i) => (
            <PieCardSkeleton key={i}>
              <SkeletonBase
                style={{ width: 80, height: 16, marginBottom: 16 }}
              />
              <SkeletonBase
                style={{
                  width: 140,
                  height: 140,
                  borderRadius: "50%",
                  margin: "0 auto",
                }}
              />
            </PieCardSkeleton>
          ))}
        </PieChartGridSkeleton>
      </DashboardGrid>
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
  border-radius: 6px;
`;

// --------------------------------------------------------------------------
// ✨ Styles (Matching ReportsClient Layout)
// --------------------------------------------------------------------------

const Container = styled.div`
  padding: 24px;
  background-color: #f2f4f6;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  gap: 20px;
  @media (max-width: 768px) {
    padding: 16px;
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-direction: column;
  gap: 16px;

  @media (min-width: 769px) {
    flex-direction: row;
    align-items: center;
    margin-bottom: 8px;
  }
`;

const Controls = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;

  @media (min-width: 769px) {
    width: auto;
    gap: 16px;
  }
`;

// --- Grid Layout ---

const DashboardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;

  @media (max-width: 1024px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 768px) {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
`;

const CardBase = styled.div`
  background: white;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
  border: 1px solid rgba(224, 224, 224, 0.3);
`;

const StatCardSkeleton = styled(CardBase)`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 140px;
`;

const StatHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
`;

const MainChartCardSkeleton = styled(CardBase)`
  grid-column: span 2;
  min-height: 320px;

  @media (max-width: 1024px) {
    grid-column: span 3; /* 태블릿에선 꽉 차게 */
  }
  @media (max-width: 768px) {
    min-height: 280px;
    width: 100%;
  }
`;

const SubChartCardSkeleton = styled(CardBase)`
  min-height: 320px;
  @media (max-width: 768px) {
    min-height: 280px;
    width: 100%;
  }
`;

const PieChartGridSkeleton = styled.div`
  grid-column: span 3;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;

  @media (max-width: 1024px) {
    grid-template-columns: repeat(2, 1fr);
  }
  @media (max-width: 768px) {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
`;

const PieCardSkeleton = styled(CardBase)`
  min-height: 260px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;
