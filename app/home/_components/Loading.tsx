"use client";

import React from "react";
import styled, { keyframes } from "styled-components";

export default function HomeDashboardSkeleton() {
  return (
    <Container>
      {/* 헤더 스켈레톤 */}
      <HeaderSection>
        <WelcomeText>
          <SkeletonItem
            style={{ width: "140px", height: "22px", marginBottom: "6px" }}
          />
        </WelcomeText>
        <DateBadge>
          <SkeletonItem style={{ width: "60px", height: "16px" }} />
        </DateBadge>
      </HeaderSection>

      {/* 지출 브리핑 스켈레톤 */}
      <FeedContainer>
        {[...Array(2)].map((_, i) => (
          <FeedCardSkeleton key={i}>
            <FeedHeader>
              <SkeletonItem style={{ width: "60px", height: "14px" }} />
              <SkeletonItem style={{ width: "40px", height: "24px" }} />
            </FeedHeader>
            <ItemList>
              {[...Array(4)].map((_, j) => (
                <FeedItemSkeleton key={j}>
                  <SkeletonItem
                    style={{
                      width: "50px",
                      height: "14px",
                      borderRadius: "6px",
                    }}
                  />
                  <SkeletonItem
                    style={{
                      width: "180px",
                      height: "14px",
                      borderRadius: "6px",
                    }}
                  />
                </FeedItemSkeleton>
              ))}
            </ItemList>
          </FeedCardSkeleton>
        ))}
      </FeedContainer>

      {/* 월간 요약 카드 스켈레톤 */}
      <SummaryGrid>
        {[...Array(2)].map((_, i) => (
          <InfoCardSkeleton key={i}>
            <SkeletonItem
              style={{ width: "100px", height: "14px", marginBottom: "6px" }}
            />
            <SkeletonItem style={{ width: "80%", height: "20px" }} />
          </InfoCardSkeleton>
        ))}
      </SummaryGrid>

      {/* 시장 & 투자 스켈레톤 */}
      <MarketScroll>
        {[...Array(4)].map((_, i) => (
          <MarketItemSkeleton key={i}>
            <SkeletonItem style={{ width: "60px", height: "12px" }} />
            <SkeletonItem style={{ width: "40px", height: "16px" }} />
          </MarketItemSkeleton>
        ))}
      </MarketScroll>

      <InvestCardSkeleton>
        {[...Array(5)].map((_, i) => (
          <InvestRowSkeleton key={i}>
            <SkeletonItem style={{ width: "80px", height: "14px" }} />
            <SkeletonItem style={{ width: "60px", height: "14px" }} />
          </InvestRowSkeleton>
        ))}
      </InvestCardSkeleton>
    </Container>
  );
}

// --- Styles & Animation ---
const pulse = keyframes`
  0% { opacity: 1; background-color: #f3f4f6; }
  50% { opacity: 0.6; background-color: #e5e7eb; }
  100% { opacity: 1; background-color: #f3f4f6; }
`;

const SkeletonItem = styled.div`
  border-radius: 6px;
  animation: ${pulse} 1.5s infinite ease-in-out;
`;

const Container = styled.div`
  font-family: "Pretendard", sans-serif;
  color: #333;
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

/* 헤더 */
const HeaderSection = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
`;

const WelcomeText = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const DateBadge = styled.div`
  padding: 6px 10px;
  border-radius: 12px;
`;

/* 알림 */
const AlertList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const AlertCardSkeleton = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

/* 지출 브리핑 */
const FeedContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
`;

const FeedCardSkeleton = styled.div`
  background: white;
  border-radius: 20px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  border: 1px solid #f0f0f0;
`;

const FeedHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const ItemList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const FeedItemSkeleton = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

/* 요약 카드 */
const SummaryGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
`;

const InfoCardSkeleton = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 20px;
  border-radius: 20px;
  background: #fff;
`;

/* 시장 */
const MarketScroll = styled.div`
  display: flex;
  gap: 12px;
  overflow-x: auto;
  padding-bottom: 10px;
`;

const MarketItemSkeleton = styled.div`
  min-width: 110px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 16px;
  border-radius: 16px;
  background: white;
  border: 1px solid #eee;
`;

/* 투자 카드 */
const InvestCardSkeleton = styled.div`
  background: white;
  padding: 24px;
  border-radius: 16px;
  border: 1px solid #eee;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const InvestRowSkeleton = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;
