"use client";

import React from "react";
import styled, { keyframes, css } from "styled-components";

export default function RegisterSkeleton() {
  // 테이블 행 개수 (화면 꽉 차게 15개 정도)
  const rows = Array.from({ length: 10 });
  // 월 컬럼 (12개월)
  const months = Array.from({ length: 12 });

  return (
    <Container>
      {/* 1. Header Skeleton */}
      <Header>
        <TitleArea>
          <SkeletonBase style={{ width: 120, height: 32 }} />
        </TitleArea>

        <Controls>
          {/* Year Controller */}
          <SkeletonBase style={{ width: 140, height: 40, borderRadius: 12 }} />
          {/* Mobile Toggle */}
          <SkeletonBase style={{ width: 100, height: 40, borderRadius: 12 }} />
          {/* Search */}
          <SkeletonBase style={{ width: 200, height: 40, borderRadius: 12 }} />
          {/* Excel Button */}
          <SkeletonBase style={{ width: 110, height: 40, borderRadius: 12 }} />
        </Controls>
      </Header>

      {/* 2. Table Skeleton */}
      <TableContainer>
        <Table>
          <Thead>
            {/* Header Row 1: Columns */}
            <tr style={{ height: "50px" }}>
              <StickyThLeft>
                <SkeletonBase
                  style={{ width: 40, height: 20, margin: "0 auto" }}
                />
              </StickyThLeft>
              {months.map((_, i) => (
                <Th key={i}>
                  <SkeletonBase
                    style={{ width: 30, height: 20, margin: "0 auto" }}
                  />
                </Th>
              ))}
              <StickyThRight>
                <SkeletonBase
                  style={{ width: 40, height: 20, margin: "0 auto" }}
                />
              </StickyThRight>
            </tr>

            {/* Header Row 2: Monthly Totals */}
            <TotalRow>
              <StickyTdLeftTotal>
                <SkeletonBase style={{ width: 60, height: 16 }} />
              </StickyTdLeftTotal>
              {months.map((_, i) => (
                <TotalTd key={i}>
                  <SkeletonBase
                    style={{
                      width: "80%",
                      height: 16,
                      margin: "0 auto",
                      opacity: 0.7,
                    }}
                  />
                </TotalTd>
              ))}
              <StickyTdRightTotal>
                <SkeletonBase style={{ width: 70, height: 16 }} />
              </StickyTdRightTotal>
            </TotalRow>
          </Thead>

          <tbody>
            {rows.map((_, rowIdx) => (
              <tr key={rowIdx}>
                {/* Name Column (Sticky Left) */}
                <StickyTdLeft>
                  <SkeletonBase style={{ width: 60, height: 20 }} />
                </StickyTdLeft>

                {/* Monthly Data Cells */}
                {months.map((_, colIdx) => (
                  <Td key={colIdx}>
                    {/* 랜덤하게 데이터 있는 척 (비어있는 칸도 자연스럽게) */}
                    {/* 여기서는 그냥 모든 칸에 연한 스켈레톤을 둠 */}
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      <SkeletonBase style={{ width: "60%", height: 12 }} />
                      <SkeletonBase style={{ width: "80%", height: 14 }} />
                    </div>
                  </Td>
                ))}

                {/* Row Total (Sticky Right) */}
                <StickyTdRight>
                  <SkeletonBase
                    style={{ width: 70, height: 20, marginLeft: "auto" }}
                  />
                </StickyTdRight>
              </tr>
            ))}
          </tbody>
        </Table>
      </TableContainer>
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
// ✨ Styles (Matching RegisterClient)
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
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
`;

const TitleArea = styled.div`
  display: flex;
  align-items: center;
`;

const Controls = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
  @media (max-width: 768px) {
    width: 100%;
    justify-content: flex-end;

    /* 모바일에서는 검색창 등 꽉 차게 */
    & > div {
      flex: 1;
    }
    /* 버튼들은 고정 크기 */
    & > div:first-child,
    & > div:nth-child(2) {
      flex: 0 0 auto;
    }
  }
`;

const TableContainer = styled.div`
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);
  overflow: hidden; /* 스크롤바 숨김 */
  min-height: 500px;
  border: 1px solid #e5e8eb;
  position: relative;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  min-width: 1400px;
`;

const Thead = styled.thead`
  position: sticky;
  top: 0;
  z-index: 20;
  background-color: #f8fafc;
`;

const cellBase = css`
  padding: 10px 8px;
  text-align: center;
  font-size: 13px;
  border-bottom: 1px solid #f1f5f9;
  border-right: 1px solid #f1f5f9;
  white-space: nowrap;
  vertical-align: middle;
`;

const Th = styled.th`
  ${cellBase}
  background-color: #f1f5f9;
  border-bottom: 2px solid #e2e8f0;
  height: 50px;
`;

const stickyStyle = css`
  position: sticky;
  z-index: 10;
  background-color: #fff;
  border-right: 2px solid #e2e8f0;
`;

const StickyThLeft = styled(Th)`
  ${stickyStyle}
  left: 0;
  width: 80px;
  min-width: 80px;
  z-index: 30;
  background-color: #f1f5f9;
`;

const StickyThRight = styled(Th)`
  ${stickyStyle}
  right: 0;
  width: 100px;
  min-width: 100px;
  z-index: 30;
  background-color: #f1f5f9;
  border-right: none;
  border-left: 2px solid #e2e8f0;
`;

const TotalRow = styled.tr`
  background-color: #fffbeb;
  td {
    border-bottom: 2px solid #e2e8f0;
    height: 40px;
  }
`;

const StickyTdLeft = styled.td`
  ${cellBase};
  ${stickyStyle};
  left: 0;
  background-color: #fff;
`;

const StickyTdRight = styled.td`
  ${cellBase};
  ${stickyStyle};
  right: 0;
  background-color: #f0f9ff;
  border-left: 2px solid #e2e8f0;
  border-right: none;
  text-align: right;
  padding-right: 16px;
`;

const StickyTdLeftTotal = styled(StickyTdLeft)`
  background-color: #fffbeb !important;
  z-index: 25;
`;

const StickyTdRightTotal = styled(StickyTdRight)`
  background-color: #fffbeb;
  z-index: 25;
`;

const Td = styled.td`
  ${cellBase};
  background-color: #fff;
`;

const TotalTd = styled.td`
  ${cellBase};
  background-color: #fffbeb;
`;
