"use client";

import React from "react";
import styled, { keyframes } from "styled-components";

export default function MemoSkeleton() {
  // 섹션 시뮬레이션 (2개 정도)
  const sections = Array.from({ length: 2 });
  // 카드 시뮬레이션 (섹션당 4개)
  const cards = Array.from({ length: 4 });

  return (
    <Container>
      {/* 1. Header Skeleton */}
      <Header>
        {/* Title */}
        <SkeletonBase style={{ width: 100, height: 32 }} />

        {/* Controls (Search + Add) */}
        <Controls>
          <SkeletonBase style={{ width: 220, height: 44, borderRadius: 14 }} />
          <SkeletonBase style={{ width: 44, height: 44, borderRadius: 14 }} />
        </Controls>
      </Header>

      {/* 2. Content Skeleton */}
      <ContentArea>
        {sections.map((_, secIdx) => (
          <Section key={secIdx}>
            {/* Section Title */}
            <SkeletonBase
              style={{
                width: 120,
                height: 24,
                marginBottom: 12,
                marginLeft: 4,
              }}
            />

            {/* Card Grid */}
            <Grid>
              {cards.map((_, cardIdx) => (
                <CardSkeleton key={cardIdx}>
                  {/* Card Header */}
                  <CardHeader>
                    <SkeletonBase style={{ width: "60%", height: 24 }} />
                  </CardHeader>

                  {/* Card Content (3 lines) */}
                  <CardContent>
                    <SkeletonBase
                      style={{ width: "100%", height: 16, marginBottom: 6 }}
                    />
                    <SkeletonBase
                      style={{ width: "90%", height: 16, marginBottom: 6 }}
                    />
                    <SkeletonBase style={{ width: "70%", height: 16 }} />
                  </CardContent>

                  {/* Card Footer */}
                  <CardFooter>
                    <SkeletonBase style={{ width: 80, height: 16 }} />
                    <SkeletonBase
                      style={{ width: 50, height: 20, borderRadius: 4 }}
                    />
                  </CardFooter>
                </CardSkeleton>
              ))}
            </Grid>
          </Section>
        ))}
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
// ✨ Styles (Matching MemoClient)
// --------------------------------------------------------------------------

const Container = styled.div`
  padding: 24px;
  background-color: #f2f4f6;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  gap: 24px;

  @media (max-width: 768px) {
    padding: 20px;
    gap: 20px;
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
  padding-top: 8px;
`;

const Controls = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  @media (max-width: 600px) {
    width: 100%;
    justify-content: flex-end;
    /* 모바일에서 검색창 늘리기 */
    & > div:first-child {
      flex: 1;
    }
  }
`;

const ContentArea = styled.div`
  display: flex;
  flex-direction: column;
  gap: 32px;
`;

const Section = styled.div`
  display: flex;
  flex-direction: column;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
`;

const CardSkeleton = styled.div`
  background: white;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  border: 1px solid #f2f4f6;
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: 180px; /* 대략적인 카드 높이 */
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  min-height: 24px;
`;

const CardContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  padding-top: 4px;
`;

const CardFooter = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: auto;
  padding-top: 12px;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
`;
