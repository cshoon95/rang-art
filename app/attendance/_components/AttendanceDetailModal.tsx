"use client";

import React, { useState, useMemo, useEffect } from "react";
import styled, { css } from "styled-components";
import {
  X as XIcon,
  RotateCcw,
  CalendarRange,
  Zap,
  AlertCircle,
  CalendarCheck,
  Loader2,
} from "lucide-react";
import {
  format,
  parseISO,
  isWithinInterval,
  startOfDay,
  endOfDay,
  startOfMonth,
  endOfMonth,
  compareDesc,
} from "date-fns";
import { ko } from "date-fns/locale";
import { createClient } from "@/utils/supabase/client";
import { useGetStudentAttendanceHistory } from "@/app/_querys";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  student: {
    id: number;
    name: string;
    count: number;
  } | null;
  academyCode: string;
}

// ✅ 컨텐츠 파싱 함수
const parseAttendanceContent = (content: string) => {
  const clean = content.trim();
  if (clean.toUpperCase().includes("L"))
    return { type: "LAST", badge: "종료", text: "마지막 수업", raw: clean };
  if (clean.startsWith("보")) {
    const num = clean.replace("보", "");
    return {
      type: "MAKEUP",
      badge: "보강",
      text: num ? `${num}회차 보강` : "보강 수업",
      raw: clean,
    };
  }
  if (clean === "/" || clean.includes("결") || clean.includes("무"))
    return { type: "ABSENT", badge: "결석", text: "결석", raw: clean };
  if (!isNaN(Number(clean)))
    return {
      type: "ATTENDANCE",
      badge: "출석",
      text: `${clean}회차 수업`,
      raw: clean,
    };
  return { type: "ETC", badge: "기타", text: clean, raw: clean };
};

export default function AttendanceDetailModal({
  isOpen,
  onClose,
  student,
  academyCode,
}: Props) {
  // ------------------------------------------------------------------------
  // 1. Hooks & State
  // ------------------------------------------------------------------------
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isFiltered, setIsFiltered] = useState(false);

  // 데이터 조회 Hook
  const { data: attendanceList = [], isLoading } =
    useGetStudentAttendanceHistory(academyCode, student?.name!, isOpen);

  // 1. 데이터 파싱 & 정렬
  const allHistories = useMemo(() => {
    if (!attendanceList) return [];
    return attendanceList
      .map((att: any) => ({
        ...att,
        parsed: parseAttendanceContent(att.content),
      }))
      .sort((a: any, b: any) =>
        compareDesc(parseISO(a.date), parseISO(b.date))
      );
  }, [attendanceList]);

  // ✅ [수정 1] 학생이 바뀌거나 모달이 닫히면 상태 초기화
  useEffect(() => {
    if (!isOpen || !student) {
      setIsFiltered(false);
      setStartDate("");
      setEndDate("");
    }
  }, [isOpen, student?.name]); // student.id가 바뀌면 실행

  // ✅ [수정 2] 데이터가 로드되면, 해당 학생의 "최근 1회차"를 찾아 날짜 셋팅
  useEffect(() => {
    // 모달이 열려있고, 데이터가 있고, 아직 필터가 설정되지 않았다면 실행
    if (isOpen && allHistories.length > 0 && !isFiltered && !isLoading) {
      // 최신순 데이터에서 가장 먼저 나오는 "1" (즉, 가장 최근의 1회차)
      const lastFirstClass = allHistories.find(
        (item) => item.parsed.type === "ATTENDANCE" && item.parsed.raw === "1"
      );

      if (lastFirstClass) {
        // 찾았다! -> 그 날짜부터 오늘까지 조회
        setStartDate(lastFirstClass.date);
        setEndDate(format(new Date(), "yyyy-MM-dd"));
        setIsFiltered(true);
      } else {
        // 1회차가 없으면 -> 이번 달 1일 ~ 말일
        setStartDate(format(startOfMonth(new Date()), "yyyy-MM-dd"));
        setEndDate(format(endOfMonth(new Date()), "yyyy-MM-dd"));
        setIsFiltered(false); // 필터 미적용 상태로 전체 보여주기 (선택)
      }
    }
  }, [isOpen, allHistories, isFiltered, isLoading, student?.id]);

  // 3. 날짜 범위 필터링 로직
  const filteredHistories = useMemo(() => {
    if (!isFiltered || !startDate || !endDate) return allHistories;

    const start = startOfDay(new Date(startDate));
    const end = endOfDay(new Date(endDate));

    return allHistories.filter((item) => {
      const targetDate = parseISO(item.date);
      return isWithinInterval(targetDate, { start, end });
    });
  }, [allHistories, isFiltered, startDate, endDate]);

  // ------------------------------------------------------------------------
  // 2. Early Return
  // ------------------------------------------------------------------------
  if (!isOpen || !student) return null;

  // 3. 데이터 그룹화
  const makeupList: any[] = [];
  const absentList: any[] = [];
  const regularList: any[] = [];

  filteredHistories.forEach((item) => {
    if (item.parsed.type === "MAKEUP") makeupList.push(item);
    else if (item.parsed.type === "ABSENT") absentList.push(item);
    else regularList.push(item);
  });

  // 핸들러
  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStartDate(e.target.value);
    setIsFiltered(true);
  };
  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEndDate(e.target.value);
    setIsFiltered(true);
  };
  const handleResetFilter = () => {
    setIsFiltered(false);
    setStartDate(format(startOfMonth(new Date()), "yyyy-MM-dd"));
    setEndDate(format(endOfMonth(new Date()), "yyyy-MM-dd"));
  };

  return (
    <Overlay onClick={onClose}>
      <ModalContainer onClick={(e) => e.stopPropagation()}>
        <Header>
          <TitleGroup>
            {/* 이름 숫자 제거 */}
            <StudentName>{student.name.replace(/[0-9]/g, "")}</StudentName>
            <StudentBadge>주 {student.count}회 반</StudentBadge>
          </TitleGroup>
          <CloseButton onClick={onClose}>
            <XIcon size={24} />
          </CloseButton>
        </Header>

        <FilterBar>
          <DateRangeBox $isActive={isFiltered}>
            <CalendarRange
              size={16}
              color={isFiltered ? "#3182f6" : "#94a3b8"}
            />
            <DateInput
              type="date"
              value={startDate}
              onChange={handleStartDateChange}
            />
            <Separator>~</Separator>
            <DateInput
              type="date"
              value={endDate}
              onChange={handleEndDateChange}
            />
          </DateRangeBox>
        </FilterBar>

        <ScrollContainer>
          {isLoading ? (
            <LoadingState>
              <Loader2 className="animate-spin" size={24} color="#3182f6" />
              <span>데이터를 불러오는 중...</span>
            </LoadingState>
          ) : (
            <ContentBody>
              <SectionHeader>
                <CalendarCheck size={16} /> 정규 수업
                <CountBadge $type="regular">{regularList.length}</CountBadge>
              </SectionHeader>

              <HistoryList>
                {regularList.length > 0 ? (
                  regularList.map((item) => (
                    <HistoryItem key={item.date} $type={item.parsed.type}>
                      <DateText>
                        {format(parseISO(item.date), "M월 d일 (EEE)", {
                          locale: ko,
                        })}
                      </DateText>
                      <RightContent>
                        <TypeBadge $type={item.parsed.type}>
                          {item.parsed.badge}
                        </TypeBadge>
                        <StatusText $type={item.parsed.type}>
                          {item.parsed.text}
                        </StatusText>
                      </RightContent>
                    </HistoryItem>
                  ))
                ) : (
                  <EmptyState>
                    {isFiltered
                      ? "해당 기간에 정규 수업이 없습니다."
                      : "정규 수업 기록이 없습니다."}
                  </EmptyState>
                )}
              </HistoryList>

              <SectionDivider />

              {/* 상단: 보강 & 결석 */}
              <SummaryGrid>
                <SummaryCard $type="makeup">
                  <CardHeader $type="makeup">
                    <HeaderTitle>
                      <Zap size={16} fill="#9333ea" /> 보강
                    </HeaderTitle>
                    <CountBadge $type="makeup">{makeupList.length}</CountBadge>
                  </CardHeader>
                  <CardList>
                    {makeupList.length > 0 ? (
                      makeupList.map((item) => (
                        <MiniItem key={item.date}>
                          <MiniDate>
                            {format(parseISO(item.date), "M.d(EEE)", {
                              locale: ko,
                            })}
                          </MiniDate>
                          <MiniText>{item.parsed.text}</MiniText>
                        </MiniItem>
                      ))
                    ) : (
                      <EmptyText>보강 없음</EmptyText>
                    )}
                  </CardList>
                </SummaryCard>

                <SummaryCard $type="absent">
                  <CardHeader $type="absent">
                    <HeaderTitle>
                      <AlertCircle size={16} /> 결석
                    </HeaderTitle>
                    <CountBadge $type="absent">{absentList.length}</CountBadge>
                  </CardHeader>
                  <CardList>
                    {absentList.length > 0 ? (
                      absentList.map((item) => (
                        <MiniItem key={item.date}>
                          <MiniDate>
                            {format(parseISO(item.date), "M.d(EEE)", {
                              locale: ko,
                            })}
                          </MiniDate>
                          <MiniText $isAbsent>{item.parsed.text}</MiniText>
                        </MiniItem>
                      ))
                    ) : (
                      <EmptyText>결석 없음</EmptyText>
                    )}
                  </CardList>
                </SummaryCard>
              </SummaryGrid>
            </ContentBody>
          )}
        </ScrollContainer>
      </ModalContainer>
    </Overlay>
  );
}

// --------------------------------------------------------------------------
// ✨ Styles
// --------------------------------------------------------------------------

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 100;
  background-color: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  animation: fadeIn 0.2s ease-out;
  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
`;

const ModalContainer = styled.div`
  width: 100%;
  max-width: 600px;
  height: 85vh;
  background: white;
  border-radius: 20px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  @keyframes slideUp {
    from {
      transform: translateY(20px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
`;

const Header = styled.div`
  padding: 16px 20px;
  border-bottom: 1px solid #f1f5f9;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
  flex-shrink: 0;
`;

const TitleGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const StudentName = styled.h2`
  font-size: 18px;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
`;

const StudentBadge = styled.span`
  background-color: #f1f5f9;
  color: #64748b;
  font-size: 12px;
  font-weight: 600;
  padding: 4px 8px;
  border-radius: 6px;
`;

const CloseButton = styled.button`
  background: transparent;
  border: none;
  cursor: pointer;
  color: #94a3b8;
  padding: 4px;
  border-radius: 50%;
  display: flex;
  &:hover {
    background-color: #f1f5f9;
    color: #475569;
  }
`;

const FilterBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px;
  background-color: #fff;
  border-bottom: 1px solid #f1f5f9;
  gap: 8px;
  flex-shrink: 0;
`;

const DateRangeBox = styled.div<{ $isActive: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  background: ${({ $isActive }) => ($isActive ? "#f0f9ff" : "#f8fafc")};
  padding: 6px 12px;
  border-radius: 8px;
  border: 1px solid ${({ $isActive }) => ($isActive ? "#3182f6" : "#e2e8f0")};
  transition: all 0.2s;
`;

const DateInput = styled.input`
  border: none;
  background: transparent;
  font-size: 13px;
  font-weight: 600;
  color: #334155;
  outline: none;
  cursor: pointer;
  font-family: inherit;
  &::-webkit-calendar-picker-indicator {
    cursor: pointer;
    opacity: 0.6;
    &:hover {
      opacity: 1;
    }
  }
`;

const Separator = styled.span`
  color: #94a3b8;
  font-weight: 400;
`;

const ResetBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 4px;
  background: #f1f5f9;
  border: none;
  padding: 6px 10px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
  cursor: pointer;
  &:hover {
    background: #e2e8f0;
    color: #475569;
  }
`;

/* ✅ 스크롤 영역 */
const ScrollContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  background-color: #f8fafc;
  padding: 20px;
`;

const ContentBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

/* ✅ 1. 상단 요약 그리드 (보강/결석) */
const SummaryGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;

  @media (max-width: 500px) {
    grid-template-columns: 1fr; /* 모바일: 세로 배치 */
  }
`;

const SummaryCard = styled.div<{ $type: "makeup" | "absent" }>`
  background: white;
  border-radius: 12px;
  border: 1px solid
    ${({ $type }) => ($type === "makeup" ? "#e9d5ff" : "#e2e8f0")};
  background-color: ${({ $type }) => ($type === "makeup" ? "#faf5ff" : "#fff")};
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
`;

const CardHeader = styled.div<{ $type: "makeup" | "absent" }>`
  padding: 10px 14px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid
    ${({ $type }) => ($type === "makeup" ? "#f3e8ff" : "#f1f5f9")};
  background-color: ${({ $type }) =>
    $type === "makeup" ? "#f3e8ff" : "#f8fafc"};
`;

const HeaderTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 700;
  color: #1e293b;
`;

const CountBadge = styled.span<{ $type: "makeup" | "absent" | "regular" }>`
  font-size: 11px;
  font-weight: 800;
  padding: 2px 8px;
  border-radius: 10px;

  ${({ $type }) => {
    switch ($type) {
      case "makeup":
        return css`
          background: #9333ea;
          color: white;
        `;
      case "absent":
        return css`
          background: #cbd5e1;
          color: white;
        `;
      case "regular":
        return css`
          background: #e2e8f0;
          color: #64748b;
        `;
    }
  }}
`;

const CardList = styled.div`
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-height: 80px;
  max-height: 200px;
  overflow-y: auto;
`;

const MiniItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
`;

const MiniDate = styled.span`
  color: #64748b;
  font-weight: 500;
`;

const MiniText = styled.span<{ $isAbsent?: boolean }>`
  font-weight: 600;
  color: ${({ $isAbsent }) => ($isAbsent ? "#94a3b8" : "#1e293b")};
  text-decoration: ${({ $isAbsent }) => ($isAbsent ? "line-through" : "none")};
`;

const EmptyText = styled.div`
  text-align: center;
  color: #cbd5e1;
  font-size: 12px;
  margin-top: 20px;
`;

/* ✅ 2. 하단 정규 수업 리스트 */
const SectionDivider = styled.div`
  height: 1px;
  background-color: #e2e8f0;
  margin: 0 4px;
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 700;
  color: #334155;
  margin-bottom: -10px; /* 리스트와 간격 조정 */
`;

const HistoryList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const HistoryItem = styled.div<{ $type: string }>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px;
  background: white;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02);

  ${({ $type }) => {
    switch ($type) {
      case "LAST":
        return css`
          border-color: #fecdd3;
          background: #fff1f2;
        `;
      default:
        return css`
          border-color: #e2e8f0;
        `;
    }
  }}
`;

const DateText = styled.span`
  font-size: 13px;
  color: #64748b;
  font-weight: 600;
`;

const RightContent = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const TypeBadge = styled.span<{ $type: string }>`
  font-size: 11px;
  font-weight: 700;
  padding: 4px 8px;
  border-radius: 6px;
  line-height: 1;

  ${({ $type }) => {
    switch ($type) {
      case "LAST":
        return css`
          background: #ef4444;
          color: white;
        `;
      case "ATTENDANCE":
        return css`
          background: #3b82f6;
          color: white;
        `;
      default:
        return css`
          background: #e2e8f0;
          color: #64748b;
        `;
    }
  }}
`;

const StatusText = styled.div<{ $type: string }>`
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;

  ${({ $type }) => {
    switch ($type) {
      case "LAST":
        return css`
          color: #e11d48;
          font-weight: 800;
        `;
      case "ATTENDANCE":
        return css`
          color: #1d4ed8;
        `;
      default:
        return css`
          color: #334155;
        `;
    }
  }}
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 30px 0;
  color: #cbd5e1;
  font-size: 13px;
`;

const LoadingState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  gap: 12px;
  color: #64748b;
  font-size: 14px;

  .animate-spin {
    animation: spin 1s linear infinite;
  }
  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
`;
