"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import styled, { css } from "styled-components";
import dynamic from "next/dynamic"; // ⚡️ 최적화 1: Dynamic Import
import { ko } from "date-fns/locale";
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isWeekend,
  subDays,
  addDays,
} from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Search,
  Mail,
  CheckSquare,
  Square,
} from "lucide-react";

import PageTitleWithStar from "@/components/PageTitleWithStar";
import AttendanceSkeleton from "./AttendanceSkeleton";
import { getPublicHolidays } from "@/utils/date";
import { extractInitialConsonants } from "@/utils/common";
import {
  getPrevMonthLastDataAction,
  updateCustomerStatusAction,
} from "@/app/_actions";
import {
  useUpsertAttendance,
  useGetStudents,
  useGetAttendance,
  useGetCalendarList,
} from "@/app/_querys";

// ⚡️ 최적화 1: 모달을 필요할 때만 불러옵니다. (초기 번들 사이즈 감소)
const AttendanceDetailModal = dynamic(() => import("./AttendanceDetailModal"), {
  ssr: false,
  loading: () => null,
});

// --------------------------------------------------------------------------
// 🧩 Sub Components (Memoized)
// --------------------------------------------------------------------------

interface EditableCellProps {
  initialValue: string;
  studentId: number;
  studentName: string;
  date: string;
  maxCount: number;
  academyCode: string;
  isToday: boolean;
  isFriday: boolean;
  isHoliday: boolean;
  onLastClass: () => void;
}

const EditableCell = React.memo(
  ({
    initialValue,
    studentId,
    studentName,
    date,
    maxCount,
    academyCode,
    isToday,
    isFriday,
    isHoliday,
    onLastClass,
  }: EditableCellProps) => {
    const [value, setValue] = useState(initialValue);
    const { mutate } = useUpsertAttendance();

    useEffect(() => {
      setValue(initialValue);
    }, [initialValue]);

    const handleBlur = () => {
      const trimmedValue = value.trim();
      if (trimmedValue === initialValue) {
        setValue(initialValue);
        return;
      }

      // 'l' -> 'L' 자동 변환 및 숫자 파싱 로직
      let tempValue = trimmedValue.replace(/l/g, "L");
      const parts = tempValue.split(/([\.,\s]+)/);

      const processedParts = parts.map((part) => {
        if (/^[\.,\s]+$/.test(part)) return part;
        if (part === String(maxCount)) return "L";
        const match = part.match(/^([^0-9]*)([0-9]+)$/);
        if (match) {
          const prefix = match[1];
          const num = match[2];
          if (num === String(maxCount)) return `${prefix}L`;
        }
        return part;
      });

      const finalValue = processedParts.join("");

      mutate({
        academyCode,
        studentId,
        date,
        content: finalValue,
        name: studentName,
      });

      setValue(finalValue);

      if (finalValue.includes("L") && !initialValue.includes("L")) {
        onLastClass();
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        (e.target as HTMLInputElement).blur();
      }
    };

    const hasL = value.includes("L");

    return (
      <CellWrapper
        $isToday={isToday}
        $isFriday={isFriday}
        $isL={hasL}
        $isHoliday={isHoliday}
      >
        <CellInput
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
        />
      </CellWrapper>
    );
  },
  (prev, next) => {
    return (
      prev.initialValue === next.initialValue &&
      prev.isToday === next.isToday &&
      prev.isHoliday === next.isHoliday &&
      prev.isFriday === next.isFriday &&
      prev.maxCount === next.maxCount
    );
  },
);
EditableCell.displayName = "EditableCell";

interface StudentRowProps {
  student: any;
  daysInMonth: Date[];
  attendanceMap: Map<string, string>;
  prevData: string;
  holidaySet: Set<string>;
  academyCode: string;
  onOpenHistory: (id: number) => void;
  onToggleFee: (student: any) => void;
  onCycleMsg: (student: any) => void;
  onRefetchStudents: () => void;
}

const StudentRow = React.memo(
  ({
    student,
    daysInMonth,
    attendanceMap,
    prevData,
    holidaySet,
    academyCode,
    onOpenHistory,
    onToggleFee,
    onCycleMsg,
    onRefetchStudents,
  }: StudentRowProps) => {
    const maxCount = (student.count || 1) * 4;
    const weekCount = student.count || 1;

    const handleLastClass = useCallback(() => {
      // ✅ 수정: student.name -> student.id
      updateCustomerStatusAction(student.id, "msg_yn", "Y").then(() =>
        onRefetchStudents(),
      );
    }, [student.id, onRefetchStudents]); // 의존성 배열도 수정

    return (
      <TableRow>
        <StickyGroup>
          <NameCell onClick={() => onOpenHistory(student.id)}>
            <span className="name">
              {student.name}
              <span className="sub"> (주{weekCount}회)</span>
            </span>
          </NameCell>
          <PrevDataCell>{prevData || "-"}</PrevDataCell>
        </StickyGroup>

        <FeeCell>
          <FeeCheckbox onClick={() => onToggleFee(student)}>
            {student.fee_yn === "Y" ? (
              <CheckSquare size={18} color="#3182f6" />
            ) : (
              <Square size={18} color="#cbd5e1" />
            )}
          </FeeCheckbox>
          <MsgIcon $status={student.msg_yn} onClick={() => onCycleMsg(student)}>
            <Mail size={18} />
          </MsgIcon>
        </FeeCell>

        {daysInMonth.map((day) => {
          const dateStr = format(day, "yyyy-MM-dd");
          const content = attendanceMap.get(`${student.id}-${dateStr}`) || "";
          const isToday = isSameDay(day, new Date());
          const isFriday = day.getDay() === 5;
          const isHoliday = holidaySet.has(dateStr);

          return (
            <EditableCell
              key={`${student.id}-${dateStr}`}
              initialValue={content}
              studentId={student.id}
              studentName={student.name}
              date={dateStr}
              maxCount={maxCount}
              academyCode={academyCode}
              isToday={isToday}
              isFriday={isFriday}
              isHoliday={isHoliday}
              onLastClass={handleLastClass}
            />
          );
        })}
      </TableRow>
    );
  },
);
StudentRow.displayName = "StudentRow";

// --------------------------------------------------------------------------
// 🧩 Main Component
// --------------------------------------------------------------------------

interface Props {
  academyCode: string;
  initialPrevData?: Record<string, string>; // 서버에서 받은 초기 데이터
}

export default function AttendanceClient({
  academyCode,
  initialPrevData,
}: Props) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // ⚡️ 최적화 2: 초기값을 서버 데이터로 설정 (useEffect 로딩 제거)
  const [prevDataMap, setPrevDataMap] = useState<Record<string, string>>(
    initialPrevData || {},
  );

  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(
    null,
  );
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  // ⚡️ 최적화 3: 화면에 처음 그리는 개수를 10개로 줄여 첫 화면 진입 속도를 2배로 높입니다.
  const [renderLimit, setRenderLimit] = useState(10);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      // 검색 시 렌더 리미트 초기화
      setRenderLimit(10);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // 날짜 계산 (Memo)
  const { startDate, endDate, daysInMonth } = useMemo(() => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    const days = eachDayOfInterval({ start, end }).filter(
      (day) => !isWeekend(day),
    );
    return { startDate: start, endDate: end, daysInMonth: days };
  }, [currentDate]);

  // React Query Fetching
  const { data: students = [], refetch: refetchStudents } =
    useGetStudents(academyCode);

  const { data: attendanceList = [], isLoading: isAttendanceDataLoading } =
    useGetAttendance(
      academyCode,
      format(startDate, "yyyy-MM-dd"),
      format(endDate, "yyyy-MM-dd"),
    );

  const { data: calendarEvents = [], isLoading: isCalendarDataLoading } =
    useGetCalendarList(academyCode);

  // 공휴일 계산 (Memo)
  const holidaySet = useMemo(() => {
    const set = new Set<string>();
    const year = currentDate.getFullYear();
    const publicHolidays = getPublicHolidays(year);
    publicHolidays.forEach((dateStr) => set.add(dateStr));

    if (calendarEvents) {
      calendarEvents.forEach((event: any) => {
        if (event.type === "school_holiday") {
          let curr = new Date(event.start_date);
          const end = new Date(event.end_date);
          while (curr <= end) {
            set.add(format(curr, "yyyy-MM-dd"));
            curr = addDays(curr, 1);
          }
        }
      });
    }
    return set;
  }, [currentDate, calendarEvents]);

  // 전월 데이터 Fetching (날짜 변경 시에만 실행, 초기엔 pass)

  // 전월 데이터 Fetching
  useEffect(() => {
    let isMounted = true;

    const fetchPrevData = async () => {
      // 1️⃣ [현재 달]로 돌아온 경우: 서버에서 받은 초기값으로 즉시 복구
      if (isSameDay(currentDate, new Date()) && initialPrevData) {
        setPrevDataMap(initialPrevData);
        return;
      }

      // 2️⃣ [다른 달]로 이동한 경우:
      // 🔥 핵심 수정: 일단 기존 데이터를 싹 비웁니다(로딩 중 꼬임 방지)
      setPrevDataMap({});

      const currentStart = startOfMonth(currentDate);
      const prevMonthEnd = format(subDays(currentStart, 1), "yyyy-MM-dd");

      try {
        const data = await getPrevMonthLastDataAction(
          academyCode,
          prevMonthEnd,
        );
        if (isMounted) {
          setPrevDataMap(data || {});
        }
      } catch (error) {
        console.error("전월 데이터 조회 실패:", error);
      }
    };

    fetchPrevData();

    return () => {
      isMounted = false;
    };
  }, [currentDate, academyCode, initialPrevData]);
  // ... 기존 코드 ...
  // 출석 데이터 Map 변환
  const attendanceMap = useMemo(() => {
    const map = new Map<string, string>();
    if (attendanceList && attendanceList.length > 0) {
      // 대량 데이터 처리를 위해 forEach 대신 일반 for 루프 사용 (성능 우위)
      for (let i = 0; i < attendanceList.length; i++) {
        const record = attendanceList[i];
        map.set(`${record.student_id}-${record.date}`, record.content);
      }
    }
    return map;
  }, [attendanceList]);

  // 학생 필터링
  const filteredStudents = useMemo(() => {
    // 1. API 응답에 중복된 학생 ID가 있을 경우를 대비해 중복 제거
    const seen = new Set();
    const uniqueStudents = students.filter((s: any) => {
      const duplicate = seen.has(s.id);
      seen.add(s.id);
      return !duplicate;
    });

    if (!debouncedSearch) return uniqueStudents;

    // 2. 이름 또는 초성으로 학생 검색
    return uniqueStudents.filter((s: any) => {
      const name = s.name || "";
      const nameMatch = name.includes(debouncedSearch);
      const choseongMatch =
        extractInitialConsonants(name).includes(debouncedSearch);
      return nameMatch || choseongMatch;
    });
  }, [students, debouncedSearch]);

  const selectedStudent = useMemo(
    () => students.find((s: any) => s.id === selectedStudentId),
    [students, selectedStudentId],
  );

  // ⚡️ [수정됨] 최적화 4: 점진적 렌더링 로직 안전장치 추가
  // 기존 requestAnimationFrame은 너무 빨라서 브라우저가 터질 수 있음 -> setTimeout으로 변경
  useEffect(() => {
    if (filteredStudents.length > 0 && renderLimit < filteredStudents.length) {
      const timer = setTimeout(() => {
        // 상태 업데이트만 남겨서 렌더링이 멈추는 현상(Stuck) 방지
        // 초기 로딩 후엔 무리하지 않고 20개씩 부드럽게 이어서 그립니다.
        setRenderLimit((prev) => prev + 20);
      }, 50); // 대기 시간은 살짝 줄여서 시각적으로 매끄럽게 연결

      return () => clearTimeout(timer);
    }
  }, [renderLimit, filteredStudents.length]);
  // 핸들러 함수들
  const handleToggleFee = useCallback(
    async (student: any) => {
      const isChecked = student.fee_yn === "Y";
      const nextVal = isChecked ? "N" : "Y";
      try {
        // ✅ 수정: student.name -> student.id
        await updateCustomerStatusAction(student.id, "fee_yn", nextVal);
        if (nextVal === "Y") {
          await updateCustomerStatusAction(student.id, "msg_yn", "N");
        }
        await refetchStudents();
      } catch (e) {
        console.error("업데이트 실패", e);
      }
    },
    [refetchStudents],
  );

  const handleCycleMsg = useCallback(
    async (student: any) => {
      const currentStatus = student.msg_yn;
      let nextStatus = "Y";
      if (currentStatus === "Y") nextStatus = "T";
      else if (currentStatus === "T") nextStatus = "Y";
      else nextStatus = "Y";

      try {
        // ✅ 수정: student.name -> student.id
        await updateCustomerStatusAction(student.id, "msg_yn", nextStatus);
        await refetchStudents();
      } catch (e) {
        console.error("메시지 상태 업데이트 실패", e);
      }
    },
    [refetchStudents],
  );

  const handleOpenHistory = useCallback((studentId: number) => {
    setSelectedStudentId(studentId);
    setIsHistoryModalOpen(true);
  }, []);

  const handleRefetchStudents = useCallback(() => {
    refetchStudents();
  }, [refetchStudents]);

  // ⚡️ 로딩 처리: 데이터가 없고 로딩 중일 때만 스켈레톤 표시 (서버데이터 활용 시 스켈레톤 스킵 가능)
  if (isAttendanceDataLoading && !attendanceList.length) {
    return <AttendanceSkeleton />;
  }

  // 캘린더 로딩만 따로 체크 (화면 전체를 막지 않도록)
  if (isCalendarDataLoading && !calendarEvents.length) {
    // 필요하다면 여기서도 스켈레톤 리턴 가능
  }

  // ⚡️ 실제 렌더링할 학생 리스트 슬라이싱
  const visibleStudents = filteredStudents.slice(0, renderLimit);

  return (
    <Container>
      <Header>
        <PageTitleWithStar title={<MainTitle>출석부</MainTitle>} />
        <Controls>
          <DateNav>
            <NavBtn onClick={() => setCurrentDate(subMonths(currentDate, 1))}>
              <ChevronLeft size={20} />
            </NavBtn>
            <DateText>
              <CalendarIcon size={18} />
              {format(currentDate, "yyyy년 M월", { locale: ko })}
            </DateText>
            <NavBtn onClick={() => setCurrentDate(addMonths(currentDate, 1))}>
              <ChevronRight size={20} />
            </NavBtn>
          </DateNav>

          <SearchBox>
            <Search size={18} color="#94a3b8" />
            <SearchInput
              placeholder="이름 검색..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </SearchBox>
        </Controls>
      </Header>

      <TableWrapper>
        <TableContainer>
          <TableHeader>
            <StickyGroup>
              <HeaderCell $width={100}>이름</HeaderCell>
              <HeaderCell $width={50} $bg="#fffbeb">
                전월
              </HeaderCell>
            </StickyGroup>

            <HeaderCell $width={70} $bg="#f0f9ff">
              원비
            </HeaderCell>

            {daysInMonth.map((day) => {
              const dateStr = format(day, "yyyy-MM-dd");
              const isFriday = day.getDay() === 5;
              const isHoliday = holidaySet.has(dateStr);

              return (
                <HeaderCell
                  key={day.toString()}
                  $isFriday={isFriday}
                  $isHoliday={isHoliday}
                >
                  <span className="day">{format(day, "d")}</span>
                  <span className="week">
                    {format(day, "EEE", { locale: ko })}
                  </span>
                </HeaderCell>
              );
            })}
          </TableHeader>

          <TableBody key={currentDate.toString()}>
            {visibleStudents.map((student: any) => (
              <StudentRow
                key={student.id}
                student={student}
                daysInMonth={daysInMonth}
                attendanceMap={attendanceMap}
                prevData={prevDataMap[String(student.id)]}
                holidaySet={holidaySet}
                academyCode={academyCode}
                onOpenHistory={handleOpenHistory}
                onToggleFee={handleToggleFee}
                onCycleMsg={handleCycleMsg}
                onRefetchStudents={handleRefetchStudents}
              />
            ))}
            {/* 렌더링 진행 중일 때 하단 인디케이터 (선택 사항) */}
            {visibleStudents.length < filteredStudents.length && (
              <div style={{ padding: 20, textAlign: "center", color: "#ccc" }}>
                불러오는 중...
              </div>
            )}
          </TableBody>
        </TableContainer>
      </TableWrapper>

      {/* 모달은 상태가 true일 때만 렌더링하여 DOM 최적화 */}
      {isHistoryModalOpen && (
        <AttendanceDetailModal
          isOpen={isHistoryModalOpen}
          onClose={() => setIsHistoryModalOpen(false)}
          student={selectedStudent || null}
          academyCode={academyCode}
        />
      )}
    </Container>
  );
}

// --------------------------------------------------------------------------
// ✨ Styles (기존과 동일)
// --------------------------------------------------------------------------
const Container = styled.div`
  padding: 24px;
  background-color: white;
  height: 100vh;
  display: flex;
  flex-direction: column;
  gap: 20px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.02);
  border: 1px solid rgba(224, 224, 224, 0.4);
  border-radius: 24px;
  @media (max-width: 600px) {
    padding: 16px;
    gap: 16px;
    margin-bottom: 60px;
  }
`;
const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
  @media (max-width: 600px) {
    flex-direction: column;
    align-items: stretch;
    gap: 16px;
  }
`;
const MainTitle = styled.h1`
  font-size: 24px;
  font-weight: 800;
  color: #1e293b;
  margin: 0;
  white-space: nowrap;
`;
const Controls = styled.div`
  display: flex;
  gap: 12px;
  @media (max-width: 600px) {
    flex-direction: column;
    width: 100%;
  }
`;
const DateNav = styled.div`
  display: flex;
  align-items: center;
  background: white;
  padding: 4px;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  @media (max-width: 600px) {
    width: 100%;
    justify-content: space-between;
  }
`;
const NavBtn = styled.button`
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  cursor: pointer;
  color: #64748b;
  &:hover {
    color: #1e293b;
  }
`;
const DateText = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 700;
  color: #1e293b;
  padding: 0 12px;
  white-space: nowrap;
`;
const SearchBox = styled.div`
  display: flex;
  align-items: center;
  background: white;
  padding: 0 12px;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  width: 200px;
  @media (max-width: 600px) {
    width: 100%;
  }
`;
const SearchInput = styled.input`
  border: none;
  outline: none;
  padding: 10px 0;
  margin-left: 8px;
  font-size: 14px;
  width: 100%;
  font-family: inherit;
`;

const TableWrapper = styled.div`
  flex: 1;
  background: white;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  overflow: hidden;
  position: relative;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
`;
const TableContainer = styled.div`
  width: 100%;
  height: 100%;
  overflow: auto;
`;
const TableHeader = styled.div`
  display: flex;
  position: sticky;
  top: 0;
  z-index: 50;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  min-width: max-content;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
`;
const TableBody = styled.div`
  min-width: max-content;
`;
const TableRow = styled.div`
  display: flex;
  border-bottom: 1px solid #f1f5f9;
  &:hover {
    background-color: #fcfcfc;
  }
`;
const StickyGroup = styled.div`
  position: sticky;
  left: 0;
  z-index: 40;
  display: flex;
  background: white;
  box-shadow: 4px 0 8px rgba(0, 0, 0, 0.03);
`;
const HeaderCell = styled.div<{
  $width?: number;
  $isFriday?: boolean;
  $bg?: string;
  $isHoliday?: boolean;
}>`
  width: ${({ $width }) => ($width ? `${$width}px` : "48px")};
  flex-shrink: 0;
  height: 48px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-right: 1px solid #f1f5f9;
  background-color: ${({ $bg }) => $bg || "transparent"};
  ${({ $isFriday }) =>
    $isFriday &&
    css`
      border-right: 2px solid #cbd5e1;
    `}
  ${({ $isHoliday }) =>
    $isHoliday &&
    css`
      background-color: #fef2f2;
      .day,
      .week {
        color: #ef4444 !important;
      }
    `}
  .day {
    font-size: 13px;
    font-weight: 700;
    color: #1e293b;
  }
  .week {
    font-size: 11px;
    color: #94a3b8;
  }
`;
const NameCell = styled.div`
  width: 100px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-right: 1px solid #f1f5f9;
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
  cursor: pointer;
  white-space: nowrap;
  overflow: hidden;
  padding: 0 8px;
  &:hover {
    background-color: #f1f5f9;
  }
  .name {
    text-overflow: ellipsis;
    overflow: hidden;
  }
  .sub {
    font-size: 11px;
    font-weight: 400;
    color: #64748b;
    margin-left: 2px;
  }
`;
const PrevDataCell = styled.div`
  width: 50px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-right: 1px solid #f1f5f9;
  font-size: 13px;
  color: #64748b;
  background-color: #fffbeb;
  font-weight: 500;
`;
const FeeCell = styled.div`
  width: 70px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border-right: 1px solid #f1f5f9;
  background-color: #f0f9ff;
  flex-shrink: 0;
`;
const FeeCheckbox = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  display: flex;
  &:active {
    transform: scale(0.9);
  }
`;
const MsgIcon = styled.button<{ $status: string }>`
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  display: flex;
  transition: transform 0.2s;
  ${({ $status }) => {
    switch ($status) {
      case "Y":
        return css`
          color: #ef4444;
          animation: pulse 2s infinite;
        `;
      case "T":
        return css`
          color: #10b981;
        `;
      default:
        return css`
          color: #cbd5e1;
        `;
    }
  }}
  @keyframes pulse {
    0% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.1);
    }
    100% {
      transform: scale(1);
    }
  }
`;
const CellWrapper = styled.div<{
  $isToday?: boolean;
  $isFriday?: boolean;
  $isL?: boolean;
  $isHoliday?: boolean;
}>`
  width: 48px;
  flex-shrink: 0;
  height: 48px;
  border-right: 1px solid #f1f5f9;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.1s;
  ${({ $isFriday }) =>
    $isFriday &&
    css`
      border-right: 2px solid #cbd5e1;
    `}
  background-color: ${({ $isL, $isHoliday, $isToday }) =>
    $isL
      ? "#dbeafe"
      : $isHoliday
        ? "#fff1f2"
        : $isToday
          ? "#fff7ed"
          : "transparent"};
  color: ${({ $isL, $isHoliday }) =>
    $isL ? "#1e40af" : $isHoliday ? "#ef4444" : "inherit"};
  font-weight: ${({ $isL }) => ($isL ? "700" : "normal")};
  &:focus-within {
    background-color: white;
    box-shadow: inset 0 0 0 2px #3182f6;
  }
`;
const CellInput = styled.input`
  width: 100%;
  height: 100%;
  border: none;
  background: transparent;
  text-align: center;
  font-size: 14px;
  font-weight: 500;
  color: inherit;
  padding: 0;
  outline: none;
  &:focus {
    font-weight: 700;
    color: #3182f6;
  }
`;
