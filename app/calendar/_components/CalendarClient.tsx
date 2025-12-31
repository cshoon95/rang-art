"use client";

import React, { useState, useMemo, useCallback } from "react";
import styled, { createGlobalStyle } from "styled-components";
import {
  Calendar,
  dateFnsLocalizer,
  Views,
  ToolbarProps,
  EventPropGetter,
} from "react-big-calendar";
import {
  format,
  parse,
  startOfWeek,
  getDay,
  getYear,
  addDays,
  subDays,
  isWeekend,
  isSameMonth,
} from "date-fns";
import { ko } from "date-fns/locale";
import Holidays from "date-holidays";

import "react-big-calendar/lib/css/react-big-calendar.css";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import ModalCalendarAdd from "@/components/modals/ModalCalendarAdd";
import CalendarSkeleton from "./CalendarSkeleton";
import { useGetCalendarList } from "@/app/_querys";
import { MappedEvent, CalendarRow } from "@/app/_types/type";

// --- 1. Global Styles ---
const GlobalStyle = createGlobalStyle`
  @import url("https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css");

  body {
    font-family: "Pretendard", -apple-system, BlinkMacSystemFont, system-ui, Roboto, "Helvetica Neue", "Segoe UI", "Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", sans-serif;
    -webkit-font-smoothing: antialiased;
  }

  /* 일요일 빨간색 */
  .rbc-row .rbc-date-cell:first-child { color: #ef4444 !important; font-weight: 700; }
  .rbc-header:first-child { color: #ef4444 !important; }
  
  /* 토요일 파란색 */
  .rbc-row .rbc-date-cell:last-child { color: #3b82f6 !important; font-weight: 700; }
  .rbc-header:last-child { color: #3b82f6 !important; }

  /* 이벤트 바 포인터 설정 */
  .rbc-event {
    pointer-events: auto; 
    cursor: pointer;
  }
`;

// --- 2. Localizer Setup ---
const locales = { ko: ko };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const hd = new Holidays("KR");

interface Props {
  academyCode: string;
  userId: string;
}

export default function CalendarClient({ academyCode, userId }: Props) {
  // State
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<MappedEvent | null>(null);
  const [initialDate, setInitialDate] = useState<Date>(new Date());

  // React Query
  const { data: rawEvents, isLoading } = useGetCalendarList(academyCode);

  // --- 3. Events Calculation (Memoized) ---
  const events: MappedEvent[] = useMemo(() => {
    const dbEvents = rawEvents
      ? rawEvents.map((item: CalendarRow) => ({
          id: item.id,
          title: item.content,
          start: new Date(`${item.start_date}T${item.start_time}`),
          end: new Date(`${item.end_date}T${item.end_time}`),
          resource: { ...item, isHoliday: item.type === "school_holiday" },
          type: "event" as const,
        }))
      : [];

    const currentYear = getYear(currentDate);
    const yearsToGen = [currentYear - 1, currentYear, currentYear + 1];
    let holidayEvents: MappedEvent[] = [];

    const toDateString = (dateInput: string | Date) => {
      if (typeof dateInput === "string") return dateInput.substring(0, 10);
      return format(dateInput, "yyyy-MM-dd");
    };

    yearsToGen.forEach((year) => {
      const rawList = hd.getHolidays(year);
      const holidayMap = new Map<string, any>();

      rawList.forEach((h) => {
        if (
          h.substitute ||
          h.name.includes("Substitute") ||
          h.name.includes("대체") ||
          h.type !== "public"
        )
          return;

        if (h.name === "설날" || h.name === "추석") {
          const mainDate = new Date(h.date);
          const threeDays = [
            subDays(mainDate, 1),
            mainDate,
            addDays(mainDate, 1),
          ];
          threeDays.forEach((d) => {
            const dKey = toDateString(d);
            holidayMap.set(dKey, {
              ...h,
              date: dKey,
              start: d,
              end: d,
              name: h.name,
              substitute: false,
            });
          });
        } else {
          const dKey = toDateString(h.date);
          if (!holidayMap.has(dKey)) {
            holidayMap.set(dKey, {
              ...h,
              date: dKey,
              start: new Date(dKey),
              end: new Date(dKey),
              substitute: false,
            });
          }
        }
      });

      const confirmedHolidays = Array.from(holidayMap.values());
      confirmedHolidays.forEach((h) => {
        const dateStr = h.date;
        const holidayDate = new Date(dateStr);
        const dow = getDay(holidayDate);
        const isSeollalOrChuseok = h.name === "설날" || h.name === "추석";
        let needSubstitute = false;

        if (isSeollalOrChuseok) {
          if (dow === 0) needSubstitute = true;
        } else {
          if (isWeekend(holidayDate)) needSubstitute = true;
        }

        if (needSubstitute) {
          let nextDay = addDays(holidayDate, 1);
          while (true) {
            const nextKey = toDateString(nextDay);
            const isWeekendDay = isWeekend(nextDay);
            const isOccupied = holidayMap.has(nextKey);

            if (!isWeekendDay && !isOccupied) {
              holidayMap.set(nextKey, {
                date: nextKey,
                start: nextDay,
                end: nextDay,
                name: `(대체) ${h.name}`,
                type: "public",
                substitute: true,
              });
              break;
            }
            nextDay = addDays(nextDay, 1);
          }
        }
      });

      const yearEvents = Array.from(holidayMap.values()).map((h, idx) => {
        let title = h.name;
        if (title === "Korean New Year") title = "설날";
        else if (title === "Chuseok") title = "추석";
        else if (title === "Independence Movement Day") title = "삼일절";
        else if (title === "Children's Day") title = "어린이날";
        else if (title === "Memorial Day") title = "현충일";
        else if (title === "Liberation Day") title = "광복절";
        else if (title === "National Foundation Day") title = "개천절";
        else if (title === "Hangul Day") title = "한글날";
        else if (title === "Christmas Day") title = "성탄절";
        else if (title === "New Year's Day") title = "신정";
        else if (title === "Buddha's Birthday") title = "석가탄신일";

        if (h.substitute && !title.startsWith("(대체)")) {
          title = `(대체) ${title}`;
        }

        return {
          id: `holiday-${year}-${idx}-${h.date}`,
          title: title,
          start: new Date(h.date),
          end: new Date(h.date),
          resource: null,
          type: "holiday" as const,
          substitute: h.substitute || false,
        };
      });
      holidayEvents = [...holidayEvents, ...yearEvents];
    });

    return [...dbEvents, ...holidayEvents];
  }, [rawEvents, currentDate]);

  // --- 4. Handlers (Callback) ---

  const handleSelectSlot = useCallback(
    ({ start }: { start: Date; end: Date }) => {
      setSelectedEvent(null);
      setInitialDate(start);
      setIsModalOpen(true);
    },
    []
  );

  const handleSelectEvent = useCallback((event: MappedEvent) => {
    if (event.type === "holiday") return;
    if (event.resource) {
      setSelectedEvent(event);
      setIsModalOpen(true);
    }
  }, []);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedEvent(null);
  }, []);

  // ✅ [수정] any 타입으로 받아서 처리 (라이브러리 타입 충돌 방지)
  const eventPropGetter = useCallback(
    (event: any) => {
      const isPublicHoliday = event.type === "holiday";
      const isSubstitute = event.substitute;
      const isSchoolHoliday =
        event.resource?.isHoliday || event.resource?.type === "school_holiday";
      const isRedEvent = isPublicHoliday || isSchoolHoliday;
      const isDifferentMonth = !isSameMonth(event.start, currentDate);

      return {
        style: {
          backgroundColor: isRedEvent ? "#fff1f2" : "#3182f6",
          color: isRedEvent ? "#e11d48" : "#fff",
          border: isRedEvent ? "1px solid #fda4af" : "1px solid transparent",
          borderRadius: "4px",
          padding: "1px 4px",
          fontSize: "12px",
          fontWeight: "600",
          boxSizing: "border-box" as const,
          // ✅ [수정] pointerEvents 타입 캐스팅
          pointerEvents: (isPublicHoliday
            ? "none"
            : "auto") as React.CSSProperties["pointerEvents"],
          opacity: isDifferentMonth ? 0.5 : isSubstitute ? 0.8 : 1,
          zIndex: 10,
        },
      };
    },
    [currentDate]
  );
  const CustomToolbar = useCallback((toolbar: ToolbarProps) => {
    const goToBack = () => {
      // ❌ 삭제: setCurrentDate((prev) => ... );
      // ✅ 유지: 라이브러리가 알아서 onNavigate를 트리거하여 상태를 변경합니다.
      toolbar.onNavigate("PREV");
    };

    const goToNext = () => {
      // ❌ 삭제: setCurrentDate((prev) => ... );
      // ✅ 유지
      toolbar.onNavigate("NEXT");
    };

    const goToCurrent = () => {
      // ❌ 삭제: setCurrentDate(new Date());
      // ✅ 유지
      toolbar.onNavigate("TODAY");
    };

    const isCurrentMonth = isSameMonth(toolbar.date, new Date());

    return (
      <ToolbarContainer>
        <NavGroup>
          <NavButton onClick={goToBack}>
            <ChevronLeft size={20} />
          </NavButton>
          {/* toolbar.label을 사용하면 라이브러리가 계산한 정확한 라벨을 보여줍니다. 
              혹은 기존처럼 toolbar.date를 formatting 해도 됩니다. */}
          <MonthTitle>{format(toolbar.date, "yyyy년 M월")}</MonthTitle>
          <NavButton onClick={goToNext}>
            <ChevronRight size={20} />
          </NavButton>
        </NavGroup>
        <TodayButton onClick={goToCurrent} disabled={isCurrentMonth}>
          이번 달 바로가기
        </TodayButton>
      </ToolbarContainer>
    );
  }, []);

  const components = useMemo(
    () => ({
      toolbar: CustomToolbar,
      dateCellWrapper: ({ children, value }: any) => (
        <div
          style={{ flex: 1, height: "100%", cursor: "pointer" }}
          onClick={() => handleSelectSlot({ start: value, end: value })}
        >
          {children}
        </div>
      ),
    }),
    [CustomToolbar, handleSelectSlot]
  );

  return (
    <>
      {isLoading ? (
        <CalendarSkeleton />
      ) : (
        <Container>
          <GlobalStyle />
          <Header>
            <Title>일정표</Title>
            <AddButton
              onClick={() =>
                handleSelectSlot({ start: new Date(), end: new Date() })
              }
            >
              <Plus size={18} />
            </AddButton>
          </Header>

          <CalendarWrapper>
            {/* ✅ [수정] StyledCalendar에서 제네릭 <MappedEvent> 제거 */}
            <StyledCalendar
              localizer={localizer}
              events={events}
              // ✅ [수정] any로 받아서 Date로 반환하는 함수로 명시
              startAccessor={(event: any) => event.start}
              endAccessor={(event: any) => event.end}
              date={currentDate}
              onNavigate={(date) => setCurrentDate(date)}
              views={[Views.MONTH]}
              defaultView={Views.MONTH}
              culture="ko"
              popup
              selectable
              onSelectSlot={handleSelectSlot}
              // ✅ [수정] any로 받아서 처리
              onSelectEvent={(event: any) => handleSelectEvent(event)}
              onDrillDown={(date) =>
                handleSelectSlot({ start: date, end: date })
              }
              components={components}
              eventPropGetter={eventPropGetter}
            />
          </CalendarWrapper>

          <ModalCalendarAdd
            isOpen={isModalOpen}
            onClose={closeModal}
            academyCode={academyCode}
            userId={userId}
            selectedEvent={selectedEvent}
            initialDate={initialDate}
          />
        </Container>
      )}
    </>
  );
}

// --------------------------------------------------------------------------
// ✨ Styles (기존과 동일)
// --------------------------------------------------------------------------

const Container = styled.div`
  padding: 32px;
  display: flex;
  flex-direction: column;
  background-color: white;
  gap: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.02);
  border: 1px solid rgba(224, 224, 224, 0.4);
  border-radius: 24px;
  @media (max-width: 600px) {
    padding: 16px;
    gap: 16px;
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
`;

const Title = styled.h1`
  font-size: 26px;
  font-weight: 800;
  color: #191f28;
  letter-spacing: -0.5px;
  @media (max-width: 600px) {
    font-size: 20px;
  }
`;

const AddButton = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  background-color: #3182f6;
  color: white;
  border: none;
  padding: 12px;
  border-radius: 12px;
  font-weight: 600;
  font-size: 15px;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 12px rgba(49, 130, 246, 0.2);
  &:hover {
    background-color: #1b64da;
    transform: translateY(-1px);
    box-shadow: 0 6px 16px rgba(49, 130, 246, 0.3);
  }
  @media (max-width: 600px) {
    padding: 8px 12px;
    font-size: 13px;
    span {
      display: none;
    }
  }
`;

const CalendarWrapper = styled.div`
  background: white;
  border-radius: 24px;
  padding: 32px;
  box-shadow: 0 2px 20px rgba(0, 0, 0, 0.04);
  height: 650px;
  border: 1px solid rgba(0, 0, 0, 0.02);
  @media (max-width: 600px) {
    padding: 16px;
    height: 550px;
    border-radius: 16px;
  }
`;

// ✅ StyledCalendar (제네릭 없이 정의)
const StyledCalendar = styled(Calendar)`
  font-family: "Pretendard", sans-serif;

  .rbc-month-view,
  .rbc-time-view,
  .rbc-agenda-view {
    border: none;
  }
  .rbc-header {
    padding: 16px 0;
    font-size: 14px;
    font-weight: 600;
    color: #8b95a1;
    border-bottom: none;
    text-transform: uppercase;
    @media (max-width: 600px) {
      font-size: 12px;
      padding: 8px 0;
    }
  }
  .rbc-date-cell {
    padding: 12px;
    font-size: 14px;
    font-weight: 500;
    color: #333d4b;
    text-align: center;
    cursor: pointer;
    @media (max-width: 600px) {
      padding: 4px;
      font-size: 12px;
    }
  }
  .rbc-date-cell.rbc-off-range {
    color: #e5e8eb !important;
    opacity: 1;
  }
  .rbc-today {
    background-color: transparent;
    .rbc-button-link {
      background-color: #191f28;
      color: white;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin-top: -4px;
      @media (max-width: 600px) {
        width: 24px;
        height: 24px;
        font-size: 12px;
        margin-top: 0;
      }
    }
  }
  .rbc-event {
    min-height: 22px;
    line-height: 1.5;
    margin-bottom: 1px;
  }
  .rbc-event-content {
    font-size: 12px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    @media (max-width: 600px) {
      font-size: 10px;
    }
  }
  .rbc-day-bg {
    cursor: pointer;
    transition: background-color 0.2s;
  }
  .rbc-day-bg:hover {
    background-color: #f8fafc;
  }
  .rbc-day-bg + .rbc-day-bg {
    border-left: 1px dashed #f2f4f6;
  }
  .rbc-month-row + .rbc-month-row {
    border-top: 1px dashed #f2f4f6;
  }
  .rbc-off-range-bg {
    background-color: transparent;
  }
`;

const ToolbarContainer = styled.div`
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

const MonthTitle = styled.h2`
  font-size: 24px;
  font-weight: 800;
  color: #191f28;
  min-width: 140px;
  text-align: center;
  @media (max-width: 600px) {
    font-size: 20px;
    min-width: auto;
  }
`;

const NavButton = styled.button`
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #e5e8eb;
  background: white;
  border-radius: 50%;
  cursor: pointer;
  color: #6b7684;
  transition: all 0.2s;
  &:hover {
    background: #f2f4f6;
    color: #333;
  }
`;

const TodayButton = styled.button`
  padding: 8px 16px;
  border: 1px solid #e5e8eb;
  background: white;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
  color: #4e5968;
  cursor: pointer;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    background: #f2f4f6;
    color: #191f28;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    background-color: #f9f9f9;
    color: #b0b8c1;
  }

  @media (max-width: 600px) {
    width: 100%;
    padding: 10px;
    background-color: #f9f9fb;
    border: none;
  }
`;
