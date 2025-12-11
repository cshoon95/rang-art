"use client";

import React from "react";
import styled, { keyframes } from "styled-components";

export default function CalendarSkeleton() {
  // 달력 그리드 (5주 x 7일)
  const weeks = Array.from({ length: 5 });
  const days = Array.from({ length: 7 });

  return (
    <Container>
      {/* 1. Header Skeleton */}
      <Header>
        <SkeletonBase style={{ width: 140, height: 32 }} /> {/* Title */}
        <SkeletonBase
          style={{ width: 42, height: 42, borderRadius: 12 }}
        />{" "}
        {/* Add Button */}
      </Header>

      {/* 2. Calendar Wrapper Skeleton */}
      <CalendarWrapper>
        {/* Toolbar */}
        <Toolbar>
          <NavGroup>
            <SkeletonBase
              style={{ width: 40, height: 40, borderRadius: "50%" }}
            />{" "}
            {/* Prev */}
            <SkeletonBase style={{ width: 120, height: 32 }} />{" "}
            {/* Month Title */}
            <SkeletonBase
              style={{ width: 40, height: 40, borderRadius: "50%" }}
            />{" "}
            {/* Next */}
          </NavGroup>
          <SkeletonBase style={{ width: 120, height: 36, borderRadius: 20 }} />{" "}
          {/* Today Button */}
        </Toolbar>

        {/* Days Header (Sun ~ Sat) */}
        <DaysHeader>
          {days.map((_, i) => (
            <SkeletonBase
              key={i}
              style={{ width: 30, height: 20, margin: "0 auto" }}
            />
          ))}
        </DaysHeader>

        {/* Month Grid */}
        <MonthGrid>
          {weeks.map((_, weekIdx) => (
            <WeekRow key={weekIdx}>
              {days.map((_, dayIdx) => (
                <DayCell key={dayIdx}>
                  {/* 날짜 숫자 위치 */}
                  <SkeletonBase
                    style={{
                      width: 20,
                      height: 20,
                      marginBottom: 8,
                      marginLeft: "auto",
                      marginRight: "auto",
                    }}
                  />
                  {/* 일정 바 (랜덤하게 배치) */}
                  {/* 첫 번째 주, 몇몇 날짜에만 일정이 있는 척 */}
                  {(weekIdx + dayIdx) % 3 === 0 && (
                    <SkeletonBase
                      style={{
                        width: "90%",
                        height: 18,
                        borderRadius: 4,
                        opacity: 0.6,
                      }}
                    />
                  )}
                </DayCell>
              ))}
            </WeekRow>
          ))}
        </MonthGrid>
      </CalendarWrapper>
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
// ✨ Styles (Matching CalendarClient Layout)
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
    gap: 16px;
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const CalendarWrapper = styled.div`
  background: white;
  border-radius: 24px;
  padding: 32px;
  box-shadow: 0 2px 20px rgba(0, 0, 0, 0.04);
  height: 650px;
  border: 1px solid rgba(0, 0, 0, 0.02);
  display: flex;
  flex-direction: column;

  @media (max-width: 600px) {
    padding: 16px;
    height: 550px;
    border-radius: 16px;
  }
`;

// Toolbar Area
const Toolbar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
  padding: 0 8px;

  @media (max-width: 600px) {
    flex-direction: column-reverse;
    gap: 16px;
    align-items: stretch;
    margin-bottom: 20px;
    padding: 0;

    /* 모바일에서는 Today 버튼이 위로 올라감 */
    & > div:last-child {
      width: 100%;
    }
  }
`;

const NavGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  @media (max-width: 600px) {
    justify-content: space-between;
    width: 100%;
    gap: 0;
  }
`;

// Grid Area
const DaysHeader = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  margin-bottom: 16px;
  text-align: center;

  @media (max-width: 600px) {
    margin-bottom: 8px;
  }
`;

const MonthGrid = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  border-top: 1px solid #e5e8eb;
  border-left: 1px solid #e5e8eb;
`;

const WeekRow = styled.div`
  flex: 1;
  display: grid;
  grid-template-columns: repeat(7, 1fr);
`;

const DayCell = styled.div`
  border-right: 1px solid #e5e8eb;
  border-bottom: 1px solid #e5e8eb;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;

  @media (max-width: 600px) {
    padding: 4px;
  }
`;
