import React, { useMemo } from "react";
import { Calendar, dateFnsLocalizer, ToolbarProps } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import ko from "date-fns/locale/ko";
import styled from "styled-components";
import { Box, IconButton, Typography } from "@mui/material";
import { ChevronLeft, ChevronRight, Today } from "@mui/icons-material";
import { Spinner } from "../_shared/layouts/loading/Spinner"; // 경로 확인 필요
import { useModal } from "@/shared-hooks";
import { useGetCalendarList } from "../../api/calendar/useCalendarQuery";
import { useGetCustomerList } from "../../api/customers/useCustomersQuery";
import { useAttendanceStore } from "@/shared-store";
import { useShallow } from "zustand/react/shallow";
import "react-big-calendar/lib/css/react-big-calendar.css";

// --- Localizer Setup ---
const locales = { ko };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

export default function CalendarClient() {
  const { showModal } = useModal();

  // Store & Query
  const { holidayList } = useAttendanceStore(useShallow((state) => state));
  const { data: calendarList, isLoading: isLoadingCalendarList } =
    useGetCalendarList();
  // const { data: customerList, isLoading: isLoadingCustomerList } = useGetCustomerList(); // 생일 로직 필요 시 주석 해제

  // --- Data Processing ---
  const events = useMemo(() => {
    const calendarEvents =
      calendarList?.map((item: any) => ({
        type: "calendar",
        id: `${item.ID}`,
        title: item.CONTENT,
        start: new Date(item.STARTDATE + " " + item.STARTTIME),
        end: new Date(item.ENDDATE + " " + item.ENDTIME),
      })) || [];

    const holidayEvents =
      holidayList?.map((item) => {
        const year = new Date().getFullYear();
        const holidayDate = new Date(
          year,
          Number(item.SOL_MM) - 1,
          Number(item.SOL_DD)
        );
        return {
          type: "holiday",
          id: `holiday-${item.SOL_STR_DATE}`,
          title: item.SOL_PLAN,
          start: holidayDate,
          end: holidayDate,
          allDay: true,
        };
      }) || [];

    return [...calendarEvents, ...holidayEvents];
  }, [calendarList, holidayList]);

  // --- Event Style Strategy ---
  const eventPropGetter = (event: any) => {
    let backgroundColor = "#3b82f6"; // 기본: Blue
    let borderLeft = "4px solid #1d4ed8";

    if (event.type === "holiday") {
      backgroundColor = "#ef4444"; // Red
      borderLeft = "4px solid #b91c1c";
    } else if (event.type === "birth") {
      backgroundColor = "#ec4899"; // Pink
      borderLeft = "4px solid #be185d";
    }

    return {
      style: {
        backgroundColor,
        color: "#fff",
        borderRadius: "6px",
        border: "none",
        borderLeft, // 왼쪽 강조선
        fontSize: "12px",
        fontWeight: "600",
        padding: "2px 5px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
      },
    };
  };

  if (isLoadingCalendarList) return <Spinner />;

  return (
    <CalendarWrapper>
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: "calc(100vh - 100px)" }} // 전체 화면 활용
        eventPropGetter={eventPropGetter}
        components={{
          toolbar: CustomToolbar, // 커스텀 툴바 적용
        }}
        onSelectEvent={(e) => showModal("ModalCalendarDetail", { param: e })}
        popup // +N 보기 활성화
        // culture="ko" // 한글 설정
        views={["month"]} // 월간 뷰만 사용 (필요 시 추가)
      />
    </CalendarWrapper>
  );
}

// --- Custom Components ---

const CustomToolbar = (toolbar: ToolbarProps) => {
  const goToBack = () => {
    toolbar.onNavigate("PREV");
  };

  const goToNext = () => {
    toolbar.onNavigate("NEXT");
  };

  const goToCurrent = () => {
    toolbar.onNavigate("TODAY");
  };

  const label = () => {
    const date = toolbar.date;
    return (
      <span className="label-text">
        <span className="year">{format(date, "yyyy")}</span>
        <span className="month">{format(date, "M")}월</span>
      </span>
    );
  };

  return (
    <ToolbarContainer>
      <div className="left-controls">
        <div className="date-label">{label()}</div>
      </div>
      <div className="right-controls">
        <IconButton onClick={goToBack} size="small">
          <ChevronLeft />
        </IconButton>
        <IconButton
          onClick={goToCurrent}
          size="small"
          sx={{ fontSize: "14px", fontWeight: "bold" }}
        >
          <Today sx={{ mr: 0.5, fontSize: "18px" }} /> 오늘
        </IconButton>
        <IconButton onClick={goToNext} size="small">
          <ChevronRight />
        </IconButton>
      </div>
    </ToolbarContainer>
  );
};

// --- Styled Components ---

const ToolbarContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 0 10px;

  .date-label {
    font-family: "Pretendard", sans-serif;
    color: #1e293b;
    display: flex;
    align-items: baseline;
    gap: 8px;

    .year {
      font-size: 24px;
      font-weight: 400;
      color: #94a3b8;
    }
    .month {
      font-size: 32px;
      font-weight: 800;
      color: #3b82f6; // 포인트 컬러
    }
  }

  .right-controls {
    display: flex;
    gap: 8px;
    background: #fff;
    padding: 4px;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  }
`;

const CalendarWrapper = styled(Box)`
  padding: 24px;
  background-color: #f8fafc; // 배경색: 아주 연한 그레이
  height: 100vh;
  box-sizing: border-box;

  // React Big Calendar Override
  .rbc-calendar {
    font-family: "Pretendard", sans-serif;
    background-color: #fff;
    border-radius: 20px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);
    padding: 20px;
    border: 1px solid #e2e8f0;
  }

  // 헤더 (요일)
  .rbc-month-view {
    border: none;
  }
  .rbc-header {
    padding: 12px 0;
    font-weight: 700;
    font-size: 14px;
    color: #64748b;
    border-bottom: 2px solid #f1f5f9;
    border-left: none;

    // 일요일 빨간색
    &:first-child {
      color: #ef4444;
    }
  }

  // 그리드 셀
  .rbc-month-row {
    border-top: 1px solid #f1f5f9;
  }
  .rbc-day-bg {
    border-left: 1px solid #f1f5f9;
    &:hover {
      background-color: #f8fafc;
    }
  }
  .rbc-off-range-bg {
    background-color: #fcfcfc; // 이번달 아닌 날짜 배경
  }

  // 날짜 숫자
  .rbc-date-cell {
    padding: 8px 12px;
    font-size: 13px;
    font-weight: 600;
    color: #334155;

    // 일요일 날짜 빨간색 처리
    &:first-child {
      /* React Big Calendar 구조상 요일별로 class를 주진 않아서 JS 로직 없이는 
         CSS만으로 완벽하게 일요일만 타겟팅하긴 어렵지만, 
         보통 첫번째 컬럼이 일요일인 경우 적용 */
    }
  }

  // "오늘" 날짜 스타일
  .rbc-today {
    background-color: transparent; // 기본 배경 제거
    .rbc-button-link {
      background-color: #3b82f6;
      color: white;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-left: auto;
    }
  }

  // 이벤트바 (More 버튼 등)
  .rbc-show-more {
    font-size: 12px;
    color: #64748b;
    font-weight: 600;
    margin-top: 4px;
    &:hover {
      color: #3b82f6;
    }
  }

  // 현재 시간 라인 제거 (월간뷰에선 불필요)
  .rbc-current-time-indicator {
    display: none;
  }
`;
