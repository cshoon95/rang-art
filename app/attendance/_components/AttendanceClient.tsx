"use client";

import React, { useState, useMemo, useEffect } from "react";
import styled, { css } from "styled-components";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Search,
  Mail,
  CheckSquare,
  Square,
} from "lucide-react";
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
import { ko } from "date-fns/locale";
import { useModalStore } from "@/store/modalStore";
import PageTitleWithStar from "@/components/PageTitleWithStar";
import AttendanceDetailModal from "./AttendanceDetailModal";
import { getPublicHolidays } from "@/utils/date";
import AttendanceSkeleton from "./AttendanceSkeleton";
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

interface Props {
  academyCode: string;
}

// --------------------------------------------------------------------------
// 🧩 Main Component
// --------------------------------------------------------------------------

export default function AttendanceClient({ academyCode }: Props) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [search, setSearch] = useState("");
  const [prevDataMap, setPrevDataMap] = useState<Record<string, string>>({});

  // 모달 관련 상태
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(
    null
  );
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  const { openModal } = useModalStore();
  const upsertMutation = useUpsertAttendance();

  // 1. 날짜 계산 (주말 제외)
  const startDate = startOfMonth(currentDate);
  const endDate = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({
    start: startDate,
    end: endDate,
  }).filter((day) => !isWeekend(day));

  // 2. 데이터 조회 (학생, 출석)
  const { data: students = [], refetch: refetchStudents } =
    useGetStudents(academyCode);

  const { data: attendanceList = [], isLoading: isAttendanceDataLoading } =
    useGetAttendance(
      academyCode,
      format(startDate, "yyyy-MM-dd"),
      format(endDate, "yyyy-MM-dd")
    );

  // 3. 캘린더(휴일) 데이터 조회 & 휴일 집합 계산
  const currentYearMonth = format(currentDate, "yyyy-MM");
  const { data: calendarEvents = [], isLoading: isCalendarDataLoading } =
    useGetCalendarList(academyCode);

  const holidaySet = useMemo(() => {
    const set = new Set<string>();

    // A. 법정 공휴일
    const year = currentDate.getFullYear();
    const publicHolidays = getPublicHolidays(year);
    publicHolidays.forEach((dateStr) => set.add(dateStr));

    // B. 학원 캘린더 'school_holiday'
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

  // 4. 전월 말일 데이터 가져오기
  useEffect(() => {
    const fetchPrevData = async () => {
      const currentStart = startOfMonth(currentDate);
      const prevMonthEnd = format(subDays(currentStart, 1), "yyyy-MM-dd");

      try {
        const data = await getPrevMonthLastDataAction(
          academyCode,
          prevMonthEnd
        );
        setPrevDataMap(data || {});
      } catch (error) {
        console.error("전월 데이터 조회 실패:", error);
      }
    };
    fetchPrevData();
  }, [currentDate, academyCode]);

  // 5. Lookup Map
  const attendanceMap = useMemo(() => {
    const map = new Map();
    attendanceList?.forEach((record: any) => {
      map.set(`${record.student_id}-${record.date}`, record.content);
    });
    return map;
  }, [attendanceList]);

  const filteredStudents = students.filter((s: any) => s.name.includes(search));
  const selectedStudent = students.find((s: any) => s.id === selectedStudentId);

  // --- Handlers ---

  const toggleFeeCheck = async (student: any) => {
    const isChecked = student.fee_yn === "Y";
    const nextVal = isChecked ? "N" : "Y";

    try {
      await updateCustomerStatusAction(student.name, "fee_yn", nextVal);
      if (nextVal === "Y") {
        await updateCustomerStatusAction(student.name, "msg_yn", "N");
      }
      await refetchStudents();
    } catch (e) {
      console.error("업데이트 실패", e);
    }
  };

  const cycleMsgStatus = async (student: any) => {
    const currentStatus = student.msg_yn;
    let nextStatus = "Y";

    if (currentStatus === "Y") nextStatus = "T";
    else if (currentStatus === "T") nextStatus = "Y";
    else nextStatus = "Y";

    try {
      await updateCustomerStatusAction(student.name, "msg_yn", nextStatus);
      await refetchStudents();
    } catch (e) {
      console.error("메시지 상태 업데이트 실패", e);
    }
  };

  const handleOpenHistory = (studentId: number) => {
    setSelectedStudentId(studentId);
    setIsHistoryModalOpen(true);
  };

  return (
    <>
      {isAttendanceDataLoading || isCalendarDataLoading ? (
        <AttendanceSkeleton />
      ) : (
        <Container>
          {/* --- Header (Mobile Responsive) --- */}
          <Header>
            <PageTitleWithStar title={<MainTitle>출석부</MainTitle>} />
            <Controls>
              <DateNav>
                <NavBtn
                  onClick={() => setCurrentDate(subMonths(currentDate, 1))}
                >
                  <ChevronLeft size={20} />
                </NavBtn>
                <DateText>
                  <CalendarIcon size={18} />
                  {format(currentDate, "yyyy년 M월", { locale: ko })}
                </DateText>
                <NavBtn
                  onClick={() => setCurrentDate(addMonths(currentDate, 1))}
                >
                  <ChevronRight size={20} />
                </NavBtn>
              </DateNav>
              <SearchBox>
                <Search size={18} color="#94a3b8" />
                <SearchInput
                  placeholder="이름 검색"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </SearchBox>
            </Controls>
          </Header>
          {/* --- Table --- */}
          <TableWrapper>
            <TableContainer>
              <TableHeader>
                <StickyGroup>
                  <HeaderCell $width={100}>이름</HeaderCell>
                  <HeaderCell $width={50} $bg="#fffbeb">
                    전월
                  </HeaderCell>
                  <HeaderCell $width={70} $bg="#f0f9ff">
                    원비
                  </HeaderCell>
                </StickyGroup>

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

              <TableBody>
                {filteredStudents.map((student: any) => {
                  const maxCount = (student.count || 1) * 4;
                  const weekCount = student.count || 1;

                  return (
                    <TableRow key={student.id}>
                      <StickyGroup>
                        <NameCell onClick={() => handleOpenHistory(student.id)}>
                          <span className="name">
                            {student.name}
                            <span className="sub"> (주{weekCount}회)</span>
                          </span>
                        </NameCell>

                        <PrevDataCell>
                          {prevDataMap[String(student.id)] || "-"}
                        </PrevDataCell>

                        <FeeCell>
                          <FeeCheckbox onClick={() => toggleFeeCheck(student)}>
                            {student.fee_yn === "Y" ? (
                              <CheckSquare size={18} color="#3182f6" />
                            ) : (
                              <Square size={18} color="#cbd5e1" />
                            )}
                          </FeeCheckbox>
                          <MsgIcon
                            $status={student.msg_yn}
                            onClick={() => cycleMsgStatus(student)}
                          >
                            <Mail size={18} />
                          </MsgIcon>
                        </FeeCell>
                      </StickyGroup>

                      {daysInMonth.map((day) => {
                        const dateStr = format(day, "yyyy-MM-dd");
                        const content =
                          attendanceMap.get(`${student.id}-${dateStr}`) || "";
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
                            onLastClass={() =>
                              updateCustomerStatusAction(
                                student.name,
                                "msg_yn",
                                "Y"
                              ).then(() => refetchStudents())
                            }
                            // [수정 1] .then(refetchStudents) -> .then(() => refetchStudents())
                          />
                        );
                      })}
                    </TableRow>
                  );
                })}
              </TableBody>
            </TableContainer>
          </TableWrapper>
          {/* --- Detail Modal --- */}
          <AttendanceDetailModal
            isOpen={isHistoryModalOpen}
            onClose={() => setIsHistoryModalOpen(false)}
            student={selectedStudent || null}
            academyCode={academyCode}
            // [수정 2] attendanceList Prop 제거 (AttendanceDetailModal에서 정의되지 않음)
          />
        </Container>
      )}
    </>
  );
}

// --------------------------------------------------------------------------
// 🧩 Editable Cell & Logic (Input Parsing)
// --------------------------------------------------------------------------

const EditableCell = ({
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
}: any) => {
  const [value, setValue] = useState(initialValue);
  const { mutate } = useUpsertAttendance();

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  const handleBlur = () => {
    if (value === initialValue) return;

    // 파싱 로직 (1.2, 보1, L 등)
    let tempValue = value.trim().replace(/l/g, "L");
    const parts = tempValue.split(/([\.,\s]+)/);

    const processedParts = parts.map((part: string) => {
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
    if (e.key === "Enter") (e.target as HTMLInputElement).blur();
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
};

// --------------------------------------------------------------------------
// ✨ Styles
// --------------------------------------------------------------------------
// (스타일 코드는 기존과 동일하므로 생략하지 않고 그대로 유지)

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
