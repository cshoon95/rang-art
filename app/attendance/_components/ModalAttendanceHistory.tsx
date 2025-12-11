"use client";

import React from "react";
import styled from "styled-components";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/utils/supabase/client";
import { format, parseISO } from "date-fns";
import { ko } from "date-fns/locale";

interface Props {
  studentId: string;
  academyCode: string;
}

// ✅ 컨텐츠 파싱 헬퍼 함수
const parseContent = (content: string) => {
  const cleanContent = content.trim();

  // 1. 마지막 회차 (L)
  if (cleanContent.toUpperCase().includes("L")) {
    return {
      type: "LAST",
      badge: "종료",
      text: "마지막 회차 수업",
    };
  }

  // 2. 보강 (보~)
  if (cleanContent.startsWith("보")) {
    const num = cleanContent.replace("보", "");
    return {
      type: "MAKEUP",
      badge: "보강",
      text: num ? `${num}회차 보강 수업` : "보강 수업",
    };
  }

  // 3. 결석 (/, 결석, 무 등)
  if (
    cleanContent === "/" ||
    cleanContent.includes("결") ||
    cleanContent.includes("무")
  ) {
    return {
      type: "ABSENT",
      badge: "결석",
      text: "결석",
    };
  }

  // 4. 일반 출석 (숫자만 있는 경우)
  if (!isNaN(Number(cleanContent))) {
    return {
      type: "ATTENDANCE",
      badge: "출석",
      text: `${cleanContent}회차 수업`,
    };
  }

  // 5. 그 외 (메모 등)
  return {
    type: "ETC",
    badge: "기타",
    text: cleanContent,
  };
};

export default function ModalAttendanceHistory({
  studentId,
  academyCode,
}: Props) {
  const supabase = createClient();

  const { data: history = [], isLoading } = useQuery({
    queryKey: ["history", studentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("attendance")
        .select("*")
        .eq("academy_code", academyCode)
        .eq("student_id", studentId)
        .order("date", { ascending: false })
        .limit(20);

      if (error) throw error;
      return data || [];
    },
  });

  if (isLoading) return <Loading>로딩 중...</Loading>;

  return (
    <ListWrapper>
      {history.length === 0 ? (
        <Empty>최근 출석 기록이 없습니다.</Empty>
      ) : (
        history.map((record: any) => {
          // 데이터 파싱
          const { type, badge, text } = parseContent(record.content || "");
          const dateStr = format(parseISO(record.date), "M.d(EEE)", {
            locale: ko,
          });

          return (
            <ListItem key={record.id} $type={type}>
              {/* 날짜 */}
              <DateText>{dateStr}</DateText>

              {/* 구분 뱃지 (보강/출석 등) */}
              <Badge $type={type}>{badge}</Badge>

              {/* 상세 내용 (1회차 수업 등) */}
              <ContentText $type={type}>{text}</ContentText>

              {/* 비고가 있다면 */}
              {record.note && <NoteText>{record.note}</NoteText>}
            </ListItem>
          );
        })
      )}
    </ListWrapper>
  );
}

// --------------------------------------------------------------------------
// ✨ Styles
// --------------------------------------------------------------------------

const ListWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 400px;
  overflow-y: auto;
  padding: 4px;
`;

// 타입에 따라 배경색 미세하게 변경 (선택사항)
const ListItem = styled.div<{ $type: string }>`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 12px;
  background: white;
  border: 1px solid #e2e8f0;
  transition: all 0.2s;

  &:hover {
    background: #f8fafc;
  }
`;

const DateText = styled.span`
  font-size: 13px;
  color: #64748b;
  font-weight: 500;
  width: 60px; /* 날짜 영역 고정 */
`;

// 타입별 뱃지 스타일
const Badge = styled.span<{ $type: string }>`
  font-size: 11px;
  font-weight: 700;
  padding: 4px 8px;
  border-radius: 6px;
  min-width: 40px;
  text-align: center;

  ${({ $type }) => {
    switch ($type) {
      case "LAST": // 마지막
        return "background: #fee2e2; color: #ef4444;";
      case "MAKEUP": // 보강
        return "background: #f3e8ff; color: #9333ea;";
      case "ATTENDANCE": // 출석
        return "background: #dbeafe; color: #2563eb;";
      case "ABSENT": // 결석
        return "background: #f1f5f9; color: #64748b;";
      default:
        return "background: #f1f5f9; color: #64748b;";
    }
  }}
`;

const ContentText = styled.span<{ $type: string }>`
  font-size: 15px;
  font-weight: 600;
  color: #334155;
  flex: 1;

  /* 마지막 회차일 경우 강조 */
  ${({ $type }) => $type === "LAST" && "color: #ef4444; font-weight: 800;"}
`;

const NoteText = styled.span`
  font-size: 12px;
  color: #94a3b8;
  max-width: 80px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const Empty = styled.div`
  text-align: center;
  color: #94a3b8;
  padding: 40px 0;
  font-size: 14px;
`;

const Loading = styled.div`
  padding: 20px;
  text-align: center;
  color: #94a3b8;
  font-size: 14px;
`;
