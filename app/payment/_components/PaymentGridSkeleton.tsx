import React from "react";
import styled, { keyframes, css } from "styled-components";

export default function PaymentGridSkeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* 1. 툴바 영역 (타이틀, 버튼, 검색창) */}
      <Toolbar>
        <LeftGroup>
          {/* 타이틀 */}
          <SkeletonBox width="100px" height="24px" />
          {/* 추가 버튼 */}
          <SkeletonBox width="32px" height="32px" borderRadius="8px" />
        </LeftGroup>

        <SearchInputWrapper>
          {/* 검색창 */}
          <SkeletonBox width="100%" height="40px" borderRadius="12px" />
        </SearchInputWrapper>
      </Toolbar>

      {/* 2. 테이블 영역 */}
      <TableContainer>
        <Table>
          <Thead>
            <tr>
              {/* 헤더 컬럼들 (너비는 원본과 비슷하게 맞춤) */}
              <Th style={{ width: "100px" }} $isFirst>
                <SkeletonBox width="40px" height="16px" />
              </Th>
              <Th style={{ width: "100px" }}>
                <SkeletonBox width="50px" height="16px" />
              </Th>
              <Th style={{ width: "120px" }}>
                <SkeletonBox width="60px" height="16px" />
              </Th>
              <Th style={{ width: "100px" }}>
                <SkeletonBox width="50px" height="16px" />
              </Th>
              <Th style={{ width: "100px" }}>
                <SkeletonBox width="50px" height="16px" />
              </Th>
              <Th style={{ minWidth: "150px" }}>
                <SkeletonBox width="80px" height="16px" />
              </Th>
              <Th style={{ width: "50px" }}></Th>
            </tr>
          </Thead>
          <tbody>
            {/* 10개의 가짜 행 생성 */}
            {[...Array(10)].map((_, i) => (
              <Tr key={i}>
                <Td $isFirst>
                  <SkeletonBox width="60px" height="20px" />
                </Td>
                <Td>
                  <SkeletonBox width="70px" height="20px" />
                </Td>
                <Td style={{ textAlign: "right" }}>
                  <SkeletonBox
                    width="80px"
                    height="20px"
                    style={{ marginLeft: "auto" }}
                  />
                </Td>
                <Td style={{ textAlign: "center" }}>
                  <SkeletonBox
                    width="50px"
                    height="24px"
                    borderRadius="6px"
                    style={{ margin: "0 auto" }}
                  />
                </Td>
                <Td>
                  <SkeletonBox width="40px" height="20px" />
                </Td>
                <Td>
                  <SkeletonBox width="120px" height="20px" />
                </Td>
                <Td style={{ textAlign: "center" }}>
                  <SkeletonBox
                    width="24px"
                    height="24px"
                    borderRadius="4px"
                    style={{ margin: "0 auto" }}
                  />
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      </TableContainer>

      {/* 3. 페이지네이션 영역 */}
      <PaginationWrapper>
        <SkeletonBox width="32px" height="32px" borderRadius="8px" />
        <SkeletonBox width="40px" height="20px" />
        <SkeletonBox width="32px" height="32px" borderRadius="8px" />
      </PaginationWrapper>
    </div>
  );
}

// --- Animation ---
const shimmer = keyframes`
  0% { background-color: #f2f4f6; }
  50% { background-color: #e5e8eb; }
  100% { background-color: #f2f4f6; }
`;

// --- Skeleton Component ---
const SkeletonBox = styled.div<{
  width?: string;
  height?: string;
  borderRadius?: string;
}>`
  width: ${(props) => props.width || "100%"};
  height: ${(props) => props.height || "20px"};
  border-radius: ${(props) => props.borderRadius || "4px"};
  animation: ${shimmer} 1.5s infinite ease-in-out;
`;

// --- Layout Styles (원본과 동일하게 유지하여 레이아웃 시프트 방지) ---

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

const SearchInputWrapper = styled.div`
  position: relative;
  width: 240px;
  @media (max-width: 600px) {
    width: 160px;
  }
`;

const TableContainer = styled.div`
  overflow-x: auto;
  width: 100%;
  min-height: 500px;
  @media (max-width: 768px) {
    min-height: 300px;
  }
  &::-webkit-scrollbar {
    height: 8px;
    width: 8px;
  }
  &::-webkit-scrollbar-thumb {
    background: #e5e8eb;
    border-radius: 4px;
  }
`;

const Table = styled.table`
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  min-width: 700px;
`;

const Thead = styled.thead`
  background-color: #f9fafb;
`;

const Th = styled.th<{ $isFirst?: boolean }>`
  padding: 12px 16px;
  text-align: left;
  border-bottom: 1px solid #e5e8eb;
  background-color: #f9fafb;
  position: sticky;
  top: 0;
  z-index: 10;

  ${(props) =>
    props.$isFirst &&
    css`
      left: 0;
      z-index: 20;
      border-right: 1px solid #e5e8eb;
    `}
`;

const Tr = styled.tr``;

const Td = styled.td<{ $isFirst?: boolean }>`
  padding: 10px 16px;
  border-bottom: 1px solid #f2f4f6;
  background-color: #fff;
  vertical-align: middle;

  ${(props) =>
    props.$isFirst &&
    css`
      position: sticky;
      left: 0;
      z-index: 5;
      border-right: 1px solid #f2f4f6;
    `}
`;

const PaginationWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  margin-top: 24px;
`;
