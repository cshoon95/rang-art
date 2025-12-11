"use client";

import React from "react";
import styled, { keyframes } from "styled-components";

export default function CashReceiptSkeleton() {
  // 테이블 행 개수 (화면 꽉 차게 12개 정도)
  const rows = Array.from({ length: 8 });

  return (
    <Container>
      {/* 1. Header Skeleton */}
      <Header>
        <SkeletonBase style={{ width: 160, height: 32 }} /> {/* Title */}
        <Controls>
          {/* Year Select */}
          <SkeletonBase style={{ width: 90, height: 40, borderRadius: 12 }} />
          {/* Month Select */}
          <SkeletonBase style={{ width: 80, height: 40, borderRadius: 12 }} />
          {/* Search Input */}
          <SearchSkeleton />
        </Controls>
      </Header>

      {/* 2. Content Skeleton */}
      <ContentArea>
        <TableContainer>
          <Table>
            <thead>
              <tr>
                <Th style={{ width: "50px" }}>
                  <SkeletonBase
                    style={{ width: 20, height: 20, margin: "0 auto" }}
                  />
                </Th>
                <Th style={{ width: "100px" }}>
                  <SkeletonBase
                    style={{ width: 40, height: 16, margin: "0 auto" }}
                  />
                </Th>
                <Th style={{ width: "140px" }}>
                  <SkeletonBase style={{ width: 60, height: 16 }} />
                </Th>
                <Th style={{ width: "100px" }}>
                  <SkeletonBase style={{ width: 40, height: 16 }} />
                </Th>
                <Th style={{ width: "150px" }}>
                  <SkeletonBase style={{ width: 80, height: 16 }} />
                </Th>
                <Th style={{ width: "120px", textAlign: "right" }}>
                  <SkeletonBase
                    style={{ width: 50, height: 16, marginLeft: "auto" }}
                  />
                </Th>
                <Th>
                  <SkeletonBase style={{ width: 60, height: 16 }} />
                </Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((_, i) => (
                <tr key={i}>
                  {/* Checkbox */}
                  <Td style={{ textAlign: "center" }}>
                    <SkeletonBase
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: 4,
                        margin: "0 auto",
                      }}
                    />
                  </Td>
                  {/* Status Badge */}
                  <Td style={{ textAlign: "center" }}>
                    <SkeletonBase
                      style={{
                        width: 50,
                        height: 24,
                        borderRadius: 6,
                        margin: "0 auto",
                      }}
                    />
                  </Td>
                  {/* Date */}
                  <Td>
                    <SkeletonBase
                      style={{ width: 90, height: 20, borderRadius: 4 }}
                    />
                  </Td>
                  {/* Name */}
                  <Td>
                    <SkeletonBase
                      style={{ width: 60, height: 20, borderRadius: 4 }}
                    />
                  </Td>
                  {/* Number */}
                  <Td>
                    <SkeletonBase
                      style={{ width: 110, height: 20, borderRadius: 4 }}
                    />
                  </Td>
                  {/* Amount */}
                  <Td style={{ textAlign: "right" }}>
                    <SkeletonBase
                      style={{
                        width: 80,
                        height: 20,
                        borderRadius: 4,
                        marginLeft: "auto",
                      }}
                    />
                  </Td>
                  {/* Note */}
                  <Td>
                    <SkeletonBase
                      style={{ width: "90%", height: 20, borderRadius: 4 }}
                    />
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </TableContainer>

        {/* 3. Footer Skeleton */}
        <ActionFooter>
          <SkeletonBase style={{ width: 100, height: 20 }} /> {/* Text */}
          <SkeletonBase
            style={{ width: 130, height: 40, borderRadius: 8 }}
          />{" "}
          {/* Button */}
        </ActionFooter>
      </ContentArea>
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
// ✨ Styles (Matching CashReceiptClient)
// --------------------------------------------------------------------------

const Container = styled.div`
  padding: 32px;
  background-color: #f9f9fb;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  gap: 24px;

  @media (max-width: 600px) {
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

const Controls = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: nowrap;

  @media (max-width: 768px) {
    width: 50%;
    margin-top: 4px;
  }
`;

const SearchSkeleton = styled(SkeletonBase)`
  width: 180px;
  height: 40px;
  border-radius: 12px;

  @media (max-width: 768px) {
    width: 100%;
    flex: 1;
  }
`;

const ContentArea = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const TableContainer = styled.div`
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);
  overflow-x: auto;
  border: 1px solid #e5e8eb;
  min-height: 500px;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  min-width: 800px;
`;

const Th = styled.th`
  padding: 16px;
  text-align: left;
  border-bottom: 1px solid #e5e8eb;
  background-color: #f9fafb;
  white-space: nowrap;
`;

const Td = styled.td`
  padding: 12px 16px;
  border-bottom: 1px solid #f2f4f6;
  vertical-align: middle;
  background-color: white;
`;

const ActionFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 16px;
  padding: 0 8px;
`;
