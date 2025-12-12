"use client";

import React from "react";
import styled, { keyframes } from "styled-components";

export default function SignupSkeleton() {
  return (
    <Container>
      <Card>
        {/* 헤더 영역 스켈레톤 */}
        <HeaderSection>
          <SkeletonBox
            width="70%"
            height="32px"
            style={{ marginBottom: "12px" }}
          />
          <SkeletonBox width="50%" height="20px" />
        </HeaderSection>

        {/* 지점 목록 스켈레톤 (5개 정도 가짜로 생성) */}
        <BranchList>
          {[1, 2, 3].map((idx) => (
            <BranchItemSkeleton key={idx}>
              {/* 지점명 */}
              <SkeletonBox width="40%" height="20px" />
              {/* 원장명 (작게) */}
              <SkeletonBox width="20%" height="16px" />
            </BranchItemSkeleton>
          ))}
        </BranchList>

        {/* 버튼 영역 스켈레톤 */}
        <SkeletonBox
          width="100%"
          height="56px"
          borderRadius="16px"
          style={{ marginTop: "auto" }}
        />
      </Card>
    </Container>
  );
}

// --- Animation ---
const shimmer = keyframes`
  0% { background-color: #f2f4f6; }
  50% { background-color: #e5e8eb; }
  100% { background-color: #f2f4f6; }
`;

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

// --- Skeleton Utils ---
const SkeletonBox = styled.div<{
  width?: string;
  height?: string;
  borderRadius?: string;
}>`
  width: ${(props) => props.width || "100%"};
  height: ${(props) => props.height || "20px"};
  border-radius: ${(props) => props.borderRadius || "8px"};
  animation: ${shimmer} 1.5s infinite ease-in-out;
  background-color: #f2f4f6;
`;

// --- Layout Styles (Original과 동일하게 유지) ---
const Container = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f2f4f6;
  padding: 20px;
`;

const Card = styled.div`
  width: 100%;
  max-width: 420px;
  background: white;
  padding: 40px;
  border-radius: 24px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.04);
  display: flex;
  flex-direction: column;
  height: 80vh; /* 스켈레톤은 높이를 어느정도 고정해두면 보기 좋습니다 */
  max-height: 90vh;
  animation: ${fadeIn} 0.3s ease-out;
`;

const HeaderSection = styled.div`
  margin-bottom: 32px;
  text-align: left;
`;

const BranchList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 40px;
  overflow: hidden; /* 스크롤바 숨김 */
  flex: 1;
`;

const BranchItemSkeleton = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: 18px 20px;
  border-radius: 16px;
  border: 1px solid #f2f4f6; /* 연한 테두리 */
  background-color: white;
`;
