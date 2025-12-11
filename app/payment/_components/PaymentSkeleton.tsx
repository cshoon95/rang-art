"use client";

import React from "react";
import styled, { keyframes } from "styled-components";

export default function PaymentSkeleton() {
  // 테이블 행 개수 (10개 정도)
  const rows = Array.from({ length: 10 });

  return (
    <PageContainer>
      {/* 1. Header Section Skeleton */}
      <HeaderSection>
        <TitleGroup>
          <SkeletonBase style={{ width: 150, height: 32 }} />
        </TitleGroup>
        <HeaderControls>
          {/* Segmented Control */}
          <SkeletonBase style={{ width: 140, height: 40, borderRadius: 10 }} />
          {/* Select Inputs */}
          <SkeletonBase style={{ width: 180, height: 40, borderRadius: 12 }} />
        </HeaderControls>
      </HeaderSection>

      {/* 2. Content Layout */}
      <ContentLayout>
        {/* Main Card (Grid) */}
        <MainCard>
          {/* Toolbar */}
          <Toolbar>
            <LeftGroup>
              <SkeletonBase style={{ width: 100, height: 24 }} />
              <SkeletonBase
                style={{ width: 32, height: 32, borderRadius: 8 }}
              />
            </LeftGroup>
            <SkeletonBase
              style={{ width: 240, height: 40, borderRadius: 12 }}
            />
          </Toolbar>

          {/* Table */}
          <TableContainer>
            <Table>
              <Thead>
                <tr>
                  {["날짜", "이름/내역", "금액", "수단/분류", "비고"].map(
                    (_, i) => (
                      <Th key={i}>
                        <SkeletonBase
                          style={{ width: i === 4 ? "80%" : 60, height: 16 }}
                        />
                      </Th>
                    )
                  )}
                </tr>
              </Thead>
              <tbody>
                {rows.map((_, i) => (
                  <tr key={i}>
                    {/* 날짜 */}
                    <Td>
                      <SkeletonBase style={{ width: 50, height: 16 }} />
                    </Td>
                    {/* 이름 */}
                    <Td>
                      <SkeletonBase style={{ width: 80, height: 16 }} />
                    </Td>
                    {/* 금액 */}
                    <Td style={{ textAlign: "right" }}>
                      <SkeletonBase
                        style={{ width: 70, height: 16, marginLeft: "auto" }}
                      />
                    </Td>
                    {/* 수단 */}
                    <Td>
                      <SkeletonBase style={{ width: 60, height: 16 }} />
                    </Td>
                    {/* 비고 */}
                    <Td>
                      <SkeletonBase style={{ width: "90%", height: 16 }} />
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </TableContainer>
        </MainCard>

        {/* Side Panel (Summary) */}
        <SidePanel>
          <SummaryCardSkeleton />
        </SidePanel>
      </ContentLayout>
    </PageContainer>
  );
}

// --- Summary Card Component ---
function SummaryCardSkeleton() {
  return (
    <CardContainer>
      <TopRow>
        <TitleGroup>
          <SkeletonBase style={{ width: 36, height: 36, borderRadius: 12 }} />
          <SkeletonBase style={{ width: 80, height: 20 }} />
        </TitleGroup>
        <SkeletonBase style={{ width: 100, height: 32 }} />
      </TopRow>
      <Divider />
      <BottomRow>
        <SkeletonBase style={{ width: 60, height: 16 }} />
        <SkeletonBase style={{ width: 40, height: 16 }} />
      </BottomRow>
    </CardContainer>
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
// ✨ Layout Styles (Matching Original)
// --------------------------------------------------------------------------

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
  align-items: center;
  gap: 12px;
`;

const HeaderControls = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  @media (max-width: 768px) {
    width: 100%;
    justify-content: flex-end;
  }
`;

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
  min-height: 500px;
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
  @media (max-width: 900px) {
    width: 100%;
  }
`;

// --- Grid Skeleton Styles ---

const Toolbar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  gap: 12px;
`;

const LeftGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const TableContainer = styled.div`
  width: 100%;
  overflow: hidden;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
`;

const Thead = styled.thead`
  background-color: #f9fafb;
`;

const Th = styled.th`
  padding: 12px 16px;
  border-bottom: 1px solid #e5e8eb;
`;

const Td = styled.td`
  padding: 12px 16px;
  border-bottom: 1px solid #f2f4f6;
  vertical-align: middle;
`;

// --- Summary Skeleton Styles ---

const CardContainer = styled.div`
  background-color: white;
  border-radius: 24px;
  padding: 24px;
  border: 1px solid #f2f4f6;
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const TopRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
`;

const Divider = styled.div`
  height: 1px;
  background-color: #f2f4f6;
  width: 100%;
`;

const BottomRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;
