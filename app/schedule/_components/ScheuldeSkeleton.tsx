"use client";

import React from "react";
import styled, { keyframes } from "styled-components";

export default function ScheduleSkeleton() {
  // 테이블 행 개수 (시간표 10개 교시 정도)
  const rows = Array.from({ length: 10 });
  // 요일 개수 (월~금 5개)
  const days = Array.from({ length: 5 });
  // 데이터 셀 개수 (월~금 x 2개 타입 = 10개)
  const cells = Array.from({ length: 10 });

  return (
    <Container>
      {/* 1. Header Skeleton */}
      <Header>
        <HeaderTop>
          {/* Title Area */}
          <SkeletonBase style={{ width: 180, height: 32 }} />

          {/* Controls Area (Search + Add) */}
          <Controls>
            <SkeletonBase
              style={{ width: 260, height: 42, borderRadius: 12 }}
            />
            <SkeletonBase style={{ width: 42, height: 42, borderRadius: 12 }} />
          </Controls>
        </HeaderTop>

        {/* Mobile Tabs Skeleton */}
        <MobileControlBar>
          <SkeletonBase style={{ flex: 1, height: 45, borderRadius: 12 }} />
          <SkeletonBase style={{ width: 100, height: 45, borderRadius: 12 }} />
        </MobileControlBar>
      </Header>

      {/* 2. Table Skeleton */}
      <TableWrapper>
        <Table>
          <Thead>
            <tr>
              <ThStickyCorner>
                <SkeletonBase style={{ width: 40, height: 20 }} />
              </ThStickyCorner>
              {days.map((_, i) => (
                <ThStickyTop key={i} colSpan={2}>
                  <SkeletonBase
                    style={{ width: 60, height: 20, margin: "0 auto" }}
                  />
                </ThStickyTop>
              ))}
            </tr>
          </Thead>
          <tbody>
            {rows.map((_, i) => (
              <tr key={i}>
                {/* Time Column (Sticky Left) */}
                <ThStickyLeft>
                  <SkeletonBase
                    style={{ width: 50, height: 20, margin: "0 auto" }}
                  />
                </ThStickyLeft>

                {/* Data Cells */}
                {cells.map((_, j) => (
                  <Td key={j} $isDayEnd={(j + 1) % 2 === 0}>
                    {/* 셀 내용 스켈레톤 (랜덤한 길이감) */}
                    <SkeletonBase style={{ width: "80%", height: 16 }} />
                  </Td>
                ))}
              </tr>
            ))}
          </tbody>
        </Table>
      </TableWrapper>
    </Container>
  );
}

// --------------------------------------------------------------------------
// ✨ Animations & Base Style
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
// ✨ Styles (Layout Matching)
// --------------------------------------------------------------------------

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  padding: 24px;
  background-color: #f2f4f6;
  overflow: hidden;
  gap: 20px;
  @media (max-width: 768px) {
    padding: 16px;
    gap: 16px;
  }
`;

const Header = styled.header`
  display: flex;
  flex-direction: column;
  gap: 16px;
  flex-shrink: 0;
`;

const HeaderTop = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
`;

const Controls = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  @media (max-width: 768px) {
    width: 100%;
    & > div:first-child {
      flex: 1;
    } /* Search bar stretch */
  }
`;

const MobileControlBar = styled.div`
  display: none;
  gap: 8px;
  @media (max-width: 768px) {
    display: flex;
    width: 100%;
  }
`;

const TableWrapper = styled.div`
  flex: 1;
  background-color: #fff;
  border-radius: 20px;
  overflow: hidden; /* 스크롤바 숨김 (스켈레톤 느낌) */
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
  border: 1px solid #e5e8eb;
`;

const Table = styled.table`
  width: 100%;
  min-width: 800px;
  border-collapse: separate;
  border-spacing: 0;
  table-layout: fixed;
  height: 100%;
`;

const Thead = styled.thead`
  background-color: #f9fafb;
`;

// 테이블 셀 기본 스타일 복제
const CellBase = styled.td`
  padding: 10px;
  text-align: center;
  vertical-align: middle;
  border-bottom: 1px solid #f2f4f6;
  border-right: 1px solid #f2f4f6;
  height: 56px;
  background-color: white;
`;

const ThStickyCorner = styled(CellBase).attrs({ as: "th" })`
  position: sticky;
  top: 0;
  left: 0;
  z-index: 50;
  background-color: #f2f9ff;
  border-right: 2px solid #cbd5e1;
  border-bottom: 2px solid #e0f2fe;
  width: 80px;
  min-width: 80px;
`;

const ThStickyTop = styled(CellBase).attrs({ as: "th" })`
  position: sticky;
  top: 0;
  z-index: 40;
  background-color: #f2f9ff;
  border-bottom: 2px solid #e0f2fe;
  border-right: 2px solid #cbd5e1;
`;

const ThStickyLeft = styled(CellBase).attrs({ as: "th" })`
  position: sticky;
  left: 0;
  z-index: 30;
  background-color: #fff;
  border-right: 2px solid #cbd5e1;
`;

const Td = styled(CellBase)<{ $isDayEnd?: boolean }>`
  background-color: #fff;
  border-right: ${({ $isDayEnd }) =>
    $isDayEnd ? "2px solid #cbd5e1" : "1px solid #f2f4f6"};

  /* 내용물 중앙 정렬 */
  display: table-cell;
  vertical-align: middle;

  /* 내부 div(스켈레톤 바) 중앙 정렬용 */
  & > div {
    margin: 0 auto;
  }
`;
