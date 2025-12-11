"use client";

import React from "react";
import styled, { keyframes } from "styled-components";

export default function AttendanceSkeleton() {
  // 테이블 행 개수 (화면 꽉 차게 보이도록 15개 정도 생성)
  const rows = Array.from({ length: 15 });
  // 날짜 컬럼 개수 (대략적으로 20개)
  const cols = Array.from({ length: 20 });

  return (
    <Container>
      {/* 1. Header Skeleton */}
      <Header>
        <TitleSkeleton />
        <Controls>
          <DateNavSkeleton />
          <SearchSkeleton />
        </Controls>
      </Header>

      {/* 2. Table Skeleton */}
      <TableWrapper>
        {/* Table Header Row */}
        <TableRow>
          <StickyGroup>
            <HeaderCell $width={100} /> {/* 이름 */}
            <HeaderCell $width={50} /> {/* 전월 */}
            <HeaderCell $width={70} /> {/* 원비 */}
          </StickyGroup>
          <ScrollableArea>
            {cols.map((_, i) => (
              <HeaderCell key={i} $width={48} />
            ))}
          </ScrollableArea>
        </TableRow>

        {/* Table Body Rows */}
        <TableBody>
          {rows.map((_, i) => (
            <TableRow key={i}>
              <StickyGroup>
                <NameCellSkeleton />
                <CellSkeleton $width={50} />
                <CellSkeleton $width={70} />
              </StickyGroup>
              <ScrollableArea>
                {cols.map((_, j) => (
                  <InputCellSkeleton key={j} />
                ))}
              </ScrollableArea>
            </TableRow>
          ))}
        </TableBody>
      </TableWrapper>
    </Container>
  );
}

// --------------------------------------------------------------------------
// ✨ Animations
// --------------------------------------------------------------------------

const shimmer = keyframes`
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
`;

// 스켈레톤 기본 베이스 스타일 (회색 배경 + 쉬머 효과)
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
  padding: 24px;
  background-color: #f8fafc;
  height: 100vh;
  display: flex;
  flex-direction: column;
  gap: 20px;
  overflow: hidden;

  @media (max-width: 600px) {
    padding: 16px;
    gap: 16px;
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
  height: 40px; /* 대략적인 높이 고정 */

  @media (max-width: 600px) {
    flex-direction: column;
    align-items: stretch;
    height: auto;
    gap: 16px;
  }
`;

const TitleSkeleton = styled(SkeletonBase)`
  width: 120px;
  height: 32px;
`;

const Controls = styled.div`
  display: flex;
  gap: 12px;
  @media (max-width: 600px) {
    flex-direction: column;
    width: 100%;
  }
`;

const DateNavSkeleton = styled(SkeletonBase)`
  width: 160px;
  height: 40px;
  border-radius: 12px;
  @media (max-width: 600px) {
    width: 100%;
  }
`;

const SearchSkeleton = styled(SkeletonBase)`
  width: 200px;
  height: 40px;
  border-radius: 12px;
  @media (max-width: 600px) {
    width: 100%;
  }
`;

const TableWrapper = styled.div`
  flex: 1;
  background: white;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
`;

const TableBody = styled.div`
  flex: 1;
  overflow: hidden; /* 스크롤바 숨김 처리 (스켈레톤이니까) */
`;

const TableRow = styled.div`
  display: flex;
  border-bottom: 1px solid #f1f5f9;
  height: 49px; /* 실제 row height와 비슷하게 */
  align-items: center;
`;

// 왼쪽 고정 영역 (이름, 전월, 원비)
const StickyGroup = styled.div`
  display: flex;
  background: white;
  flex-shrink: 0;
  border-right: 1px solid #f1f5f9;
  box-shadow: 4px 0 8px rgba(0, 0, 0, 0.02);
  z-index: 2;
`;

// 오른쪽 스크롤 영역 (날짜들)
const ScrollableArea = styled.div`
  display: flex;
  flex: 1;
  overflow: hidden;
`;

// --- Cells ---

const HeaderCell = styled.div<{ $width: number }>`
  width: ${({ $width }) => $width}px;
  height: 48px;
  border-right: 1px solid #f1f5f9;
  background-color: #f8fafc;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  &::after {
    content: "";
    width: 60%;
    height: 14px;
    background-color: #e2e8f0;
    border-radius: 4px;
  }
`;

const NameCellSkeleton = styled.div`
  width: 100px;
  height: 48px;
  display: flex;
  align-items: center;
  padding: 0 12px;
  border-right: 1px solid #f1f5f9;
  flex-shrink: 0;

  &::after {
    content: "";
    width: 80%;
    height: 16px;
    ${SkeletonBase as any}; /* 스타일 상속 */
    background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
    background-size: 200% 100%;
    animation: ${shimmer} 1.5s infinite linear;
    border-radius: 4px;
  }
`;

const CellSkeleton = styled.div<{ $width: number }>`
  width: ${({ $width }) => $width}px;
  height: 48px;
  border-right: 1px solid #f1f5f9;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  &::after {
    content: "";
    width: 60%;
    height: 20px;
    background-color: #f8fafc;
    border-radius: 4px;
  }
`;

const InputCellSkeleton = styled.div`
  width: 48px;
  height: 48px;
  border-right: 1px solid #f1f5f9;
  flex-shrink: 0;
  /* 아주 연하게 빈칸 느낌만 */
`;
