"use client";

import React from "react";
import styled, { keyframes } from "styled-components";

// --- Base Animation ---
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

// ----------------------------------------------------------------------
// 1. 수업/임시 시간표 스켈레톤 (ScheduleListSkeleton)
// ----------------------------------------------------------------------
export function ScheduleListSkeleton() {
  const rows = Array.from({ length: 5 }); // 5개 정도

  return (
    <ListContainer>
      {rows.map((_, i) => (
        <Row key={i}>
          {/* Time Column */}
          <div style={{ width: 60, display: "flex", justifyContent: "center" }}>
            <SkeletonBase style={{ width: 40, height: 16 }} />
          </div>
          {/* M Class */}
          <div style={{ flex: 1.5, padding: "0 12px" }}>
            <SkeletonBase
              style={{ width: "80%", height: 24, borderRadius: 6 }}
            />
          </div>
          {/* D Class */}
          <div style={{ flex: 1.5, padding: "0 12px" }}>
            <SkeletonBase
              style={{ width: "60%", height: 24, borderRadius: 6 }}
            />
          </div>
        </Row>
      ))}
    </ListContainer>
  );
}

// ----------------------------------------------------------------------
// 2. 픽업 시간표 스켈레톤 (PickupListSkeleton)
// ----------------------------------------------------------------------
export function PickupListSkeleton() {
  const rows = Array.from({ length: 4 });

  return (
    <ListContainer>
      {rows.map((_, i) => (
        <Row key={i} style={{ padding: "0 24px", minHeight: 60 }}>
          {/* Time */}
          <SkeletonBase style={{ width: 40, height: 16, marginRight: 20 }} />
          {/* Line decoration (optional simple version) */}
          <SkeletonBase style={{ width: 2, height: 40, marginRight: 20 }} />
          {/* Content Chips */}
          <div style={{ flex: 1, display: "flex", gap: 6 }}>
            <SkeletonBase style={{ width: 50, height: 24, borderRadius: 6 }} />
            <SkeletonBase style={{ width: 60, height: 24, borderRadius: 6 }} />
          </div>
        </Row>
      ))}
    </ListContainer>
  );
}

// ----------------------------------------------------------------------
// 3. 오늘의 일정 스켈레톤 (EventListSkeleton)
// ----------------------------------------------------------------------
export function EventListSkeleton() {
  const rows = Array.from({ length: 3 });

  return (
    <ListContainer>
      {rows.map((_, i) => (
        <Row key={i} style={{ padding: "16px 24px", gap: 12 }}>
          {/* Icon Box */}
          <SkeletonBase
            style={{ width: 32, height: 32, borderRadius: 8, flexShrink: 0 }}
          />
          {/* Text Info */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 6,
              flex: 1,
            }}
          >
            <SkeletonBase style={{ width: "50%", height: 16 }} />
            <SkeletonBase style={{ width: "80%", height: 12 }} />
          </div>
        </Row>
      ))}
    </ListContainer>
  );
}

// --- Common Styles ---
const ListContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  padding-top: 10px;
`;

const Row = styled.div`
  display: flex;
  align-items: center;
  min-height: 50px;
  border-bottom: 1px solid #f9f9f9;
`;
