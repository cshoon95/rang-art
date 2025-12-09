"use client";

import React, { useState, useMemo, useRef } from "react";
import styled, { createGlobalStyle, css } from "styled-components";
import { Calendar, dateFnsLocalizer, Views } from "react-big-calendar";
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
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  Clock,
  Calendar as CalIcon,
  CheckCircle2,
  Circle,
} from "lucide-react";
import {
  MappedEvent,
  CalendarFormData,
  CalendarRow,
} from "@/api/calendar/type";
import {
  useGetCalendarList,
  useInsertCalendar,
  useUpdateCalendar,
  useDeleteCalendar,
} from "@/api/calendar/useCalendarQuery";

// --- 1. 글로벌 스타일 (폰트 및 캘린더 커스텀) ---
const GlobalStyle = createGlobalStyle`
  @import url("https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css");

  body {
    font-family: "Pretendard", -apple-system, BlinkMacSystemFont, system-ui, Roboto, "Helvetica Neue", "Segoe UI", "Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", sans-serif;
    -webkit-font-smoothing: antialiased;
  }

  /* 일요일 (첫 번째 칸) - 빨간색 */
  .rbc-row .rbc-date-cell:first-child {
    color: #ef4444 !important;
    font-weight: 700;
  }
  
  /* 토요일 (마지막 칸) - 파란색 */
  .rbc-row .rbc-date-cell:last-child {
    color: #3b82f6 !important;
    font-weight: 700;
  }

  /* 캘린더 헤더 요일 색상 */
  .rbc-header:first-child { color: #ef4444 !important; }
  .rbc-header:last-child { color: #3b82f6 !important; }
`;

// --- 2. Setup ---
const locales = { ko: ko };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

// 한국 공휴일 라이브러리
const hd = new Holidays("KR");

interface Props {
  academyCode: string;
  userId: string;
}

export default function CalendarClient({ academyCode, userId }: Props) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<MappedEvent | null>(null);

  // 🌟 유효성 검사 및 포커싱을 위한 상태/Ref
  const contentInputRef = useRef<HTMLInputElement>(null);
  const [contentError, setContentError] = useState(false);

  // 입력 폼 상태
  const [formData, setFormData] = useState<
    CalendarFormData & { isHoliday: boolean }
  >({
    content: "",
    startDate: format(new Date(), "yyyy-MM-dd"),
    startTime: "09:00",
    endDate: format(new Date(), "yyyy-MM-dd"),
    endTime: "10:00",
    isHoliday: false,
  });

  const { data: rawEvents } = useGetCalendarList(academyCode);
  const insertMutation = useInsertCalendar(academyCode, () => closeModal());
  const updateMutation = useUpdateCalendar(academyCode, () => closeModal());
  const deleteMutation = useDeleteCalendar(academyCode, () => closeModal());

  // --- Events Calculation (공휴일 + DB데이터) ---
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

      // 1. 기본 공휴일
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

      // 2. 대체공휴일 계산
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

      // 3. 매핑
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

  // --- Handlers ---
  const handleSelectSlot = ({ start }: { start: Date; end: Date }) => {
    setSelectedEvent(null);
    setFormData({
      content: "",
      startDate: format(start, "yyyy-MM-dd"),
      startTime: "09:00",
      endDate: format(start, "yyyy-MM-dd"),
      endTime: "10:00",
      isHoliday: false,
    });
    setContentError(false);
    setIsModalOpen(true);
  };

  const handleSelectEvent = (event: MappedEvent) => {
    if (event.type === "holiday") return;
    const { resource } = event;
    if (resource) {
      setSelectedEvent(event);
      setFormData({
        content: resource.content,
        startDate: resource.start_date,
        startTime: resource.start_time.substring(0, 5),
        endDate: resource.end_date,
        endTime: resource.end_time.substring(0, 5),
        isHoliday: resource.isHoliday || resource.type === "school_holiday",
      });
      setContentError(false);
      setIsModalOpen(true);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedEvent(null);
  };

  const handleSave = () => {
    // 🌟 유효성 검사 (필수 입력)
    if (!formData.content.trim()) {
      setContentError(true);
      contentInputRef.current?.focus();
      return;
    }

    const payload = {
      content: formData.content,
      startDate: formData.startDate,
      startTime: formData.startTime,
      endDate: formData.endDate,
      endTime: formData.endTime,
      type: formData.isHoliday ? "school_holiday" : "event",
    };

    if (selectedEvent && selectedEvent.resource) {
      updateMutation.mutate({
        ...payload,
        id: Number(selectedEvent.id),
        updater_id: userId,
      });
    } else {
      insertMutation.mutate({
        ...payload,
        register_id: userId,
      });
    }
  };

  const handleDelete = () => {
    if (selectedEvent && confirm("정말 삭제하시겠습니까?")) {
      deleteMutation.mutate(Number(selectedEvent.id));
    }
  };

  const eventPropGetter = (event: any) => {
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
        boxSizing: "border-box",
        pointerEvents: (isPublicHoliday ? "none" : "auto") as "none" | "auto",
        opacity: isDifferentMonth ? 0.5 : isSubstitute ? 0.8 : 1,
      },
    };
  };

  const CustomToolbar = (toolbar: any) => {
    const goToBack = () => {
      toolbar.onNavigate("PREV");
      const newDate = new Date(toolbar.date);
      newDate.setMonth(newDate.getMonth() - 1);
      setCurrentDate(newDate);
    };
    const goToNext = () => {
      toolbar.onNavigate("NEXT");
      const newDate = new Date(toolbar.date);
      newDate.setMonth(newDate.getMonth() + 1);
      setCurrentDate(newDate);
    };
    const goToCurrent = () => {
      toolbar.onNavigate("TODAY");
      setCurrentDate(new Date());
    };

    return (
      <ToolbarContainer>
        <NavGroup>
          <NavButton onClick={goToBack}>
            <ChevronLeft size={20} />
          </NavButton>
          <MonthTitle>{format(toolbar.date, "yyyy년 M월")}</MonthTitle>
          <NavButton onClick={goToNext}>
            <ChevronRight size={20} />
          </NavButton>
        </NavGroup>
        <TodayButton onClick={goToCurrent}>오늘</TodayButton>
      </ToolbarContainer>
    );
  };

  return (
    <Container>
      <GlobalStyle />
      <Header>
        <Title>학원 일정표</Title>
        <AddButton
          onClick={() =>
            handleSelectSlot({ start: new Date(), end: new Date() })
          }
        >
          <Plus size={18} /> 일정 등록
        </AddButton>
      </Header>

      <CalendarWrapper>
        <StyledCalendar
          localizer={localizer}
          events={events}
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
          onSelectEvent={(event: any) => handleSelectEvent(event)}
          components={{ toolbar: CustomToolbar }}
          eventPropGetter={eventPropGetter}
        />
      </CalendarWrapper>

      {/* --- Modal --- */}
      {isModalOpen && (
        <ModalOverlay onClick={closeModal}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>
                {selectedEvent ? "일정 수정" : "새 일정 등록"}
              </ModalTitle>
              <CloseBtn onClick={closeModal}>
                <X size={22} />
              </CloseBtn>
            </ModalHeader>

            <ModalBody>
              <InputGroup>
                <Label>
                  일정 내용 <RequiredMark>*</RequiredMark>
                </Label>
                {/* 🌟 한 줄 배치: 입력창 + 휴일 버튼 */}
                <ContentRow>
                  <div style={{ flex: 1, position: "relative" }}>
                    <Input
                      ref={contentInputRef}
                      value={formData.content}
                      onChange={(e) => {
                        setFormData({ ...formData, content: e.target.value });
                        if (e.target.value) setContentError(false);
                      }}
                      placeholder="예: 학부모 상담"
                      $error={contentError}
                      autoFocus
                    />
                    {contentError && (
                      <ErrorMessage>내용을 입력해주세요.</ErrorMessage>
                    )}
                  </div>

                  <HolidayButton
                    type="button"
                    $active={formData.isHoliday}
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        isHoliday: !prev.isHoliday,
                      }))
                    }
                    title="학원 휴일로 지정"
                  >
                    {formData.isHoliday ? (
                      <CheckCircle2 size={18} />
                    ) : (
                      <Circle size={18} />
                    )}
                    <span>휴일</span>
                  </HolidayButton>
                </ContentRow>
              </InputGroup>

              <Row>
                <InputGroup>
                  <Label>
                    <CalIcon size={14} /> 시작일
                  </Label>
                  <Input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) =>
                      setFormData({ ...formData, startDate: e.target.value })
                    }
                  />
                </InputGroup>
                <InputGroup>
                  <Label>
                    <Clock size={14} /> 시간
                  </Label>
                  <Input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) =>
                      setFormData({ ...formData, startTime: e.target.value })
                    }
                  />
                </InputGroup>
              </Row>
              <Row>
                <InputGroup>
                  <Label>
                    <CalIcon size={14} /> 종료일
                  </Label>
                  <Input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) =>
                      setFormData({ ...formData, endDate: e.target.value })
                    }
                  />
                </InputGroup>
                <InputGroup>
                  <Label>
                    <Clock size={14} /> 시간
                  </Label>
                  <Input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) =>
                      setFormData({ ...formData, endTime: e.target.value })
                    }
                  />
                </InputGroup>
              </Row>
            </ModalBody>

            <ModalFooter>
              {selectedEvent && selectedEvent.resource && (
                <DeleteButton
                  onClick={handleDelete}
                  disabled={deleteMutation.isPending}
                >
                  {deleteMutation.isPending ? "삭제 중..." : "삭제"}
                </DeleteButton>
              )}
              <SaveButton
                onClick={handleSave}
                disabled={insertMutation.isPending || updateMutation.isPending}
              >
                {insertMutation.isPending || updateMutation.isPending
                  ? "저장 중"
                  : "저장"}
              </SaveButton>
            </ModalFooter>
          </ModalContent>
        </ModalOverlay>
      )}
    </Container>
  );
}

// --- Styles ---

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
  padding: 10px 20px;
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
  &:hover {
    background: #f2f4f6;
    color: #191f28;
  }
  @media (max-width: 600px) {
    width: 100%;
    padding: 10px;
    background-color: #f9f9fb;
    border: none;
  }
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 20px;
`;

const ModalContent = styled.div`
  background: white;
  width: 420px;
  max-width: 100%;
  border-radius: 28px;
  box-shadow: 0 24px 48px rgba(0, 0, 0, 0.12);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  max-height: 90vh; /* 🌟 모달 잘림 방지 */

  animation: slideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1);
  @keyframes slideUp {
    from {
      transform: translateY(40px) scale(0.95);
      opacity: 0;
    }
    to {
      transform: translateY(0) scale(1);
      opacity: 1;
    }
  }
`;

const ModalHeader = styled.div`
  padding: 24px 28px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const ModalTitle = styled.h3`
  font-size: 20px;
  font-weight: 700;
  color: #191f28;
  margin: 0;
`;

const CloseBtn = styled.button`
  background: #f2f4f6;
  border: none;
  cursor: pointer;
  color: #6b7684;
  padding: 8px;
  border-radius: 50%;
  transition: 0.2s;
  &:hover {
    background: #e5e8eb;
    color: #333;
  }
`;

const ModalBody = styled.div`
  padding: 0 28px 28px 28px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  overflow-y: auto;
  flex: 1;

  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-thumb {
    background-color: #ddd;
    border-radius: 4px;
  }

  /* 🌟 [수정] 모바일에서는 양옆 패딩을 줄여서 입력창 공간을 넓힘 */
  @media (max-width: 600px) {
    padding: 0 16px 20px 16px;
    gap: 16px;
  }
`;

const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
`;

/* 2. Row 간격 조절 */
const Row = styled.div`
  display: flex;
  gap: 12px;

  /* 🌟 [수정] 모바일에서 간격을 조금 좁힘 */
  @media (max-width: 600px) {
    gap: 8px;
  }
`;

/* 3. Input 패딩 및 폰트 사이즈 조절 (핵심!) */
const Input = styled.input<{ $error?: boolean }>`
  padding: 14px;
  border: 2px solid transparent;
  border-radius: 14px;
  font-size: 16px;
  outline: none;
  transition: all 0.2s;
  color: #191f28;
  background: #f4f6f8;
  font-family: inherit;
  width: 100%;

  ${({ $error }) =>
    $error &&
    css`
      background: #fff5f5;
      border-color: #ef4444;
      box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.1);
    `}

  &:focus {
    background: white;
    border-color: ${({ $error }) => ($error ? "#ef4444" : "#3182f6")};
    box-shadow: 0 0 0 4px
      ${({ $error }) =>
        $error ? "rgba(239, 68, 68, 0.1)" : "rgba(49, 130, 246, 0.1)"};
  }

  /* 🌟 [수정] 모바일 대응 스타일 추가 */
  @media (max-width: 600px) {
    padding: 12px 8px; /* 좌우 패딩을 줄임 (14px -> 8px) */
    font-size: 13px; /* 폰트 크기를 줄임 (16px -> 13px) */
    border-radius: 10px;

    /* 날짜 아이콘 등 브라우저 기본 UI 간격 확보 */
    &::-webkit-calendar-picker-indicator {
      transform: scale(0.8); /* 아이콘 크기도 살짝 줄임 */
      margin-left: 0;
    }
  }
`;

/* 🌟 한 줄 배치 Row */
const ContentRow = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 10px;
`;

const Label = styled.label`
  font-size: 13px;
  font-weight: 600;
  color: #8b95a1;
  display: flex;
  align-items: center;
  gap: 6px;
`;

const RequiredMark = styled.span`
  color: #ef4444;
  margin-left: 2px;
`;

const ErrorMessage = styled.span`
  font-size: 12px;
  color: #ef4444;
  font-weight: 600;
  margin-top: 6px;
  display: block;
  animation: shake 0.3s ease-in-out;
  @keyframes shake {
    0%,
    100% {
      transform: translateX(0);
    }
    25% {
      transform: translateX(-2px);
    }
    75% {
      transform: translateX(2px);
    }
  }
`;

/* 🌟 휴일 버튼 스타일 */
const HolidayButton = styled.button<{ $active: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 10px 8px;
  border-radius: 12px;
  border: 1px solid ${({ $active }) => ($active ? "#fda4af" : "#e5e8eb")};
  background-color: ${({ $active }) => ($active ? "#fff0f0" : "#f9fafb")};
  color: ${({ $active }) => ($active ? "#e11d48" : "#6b7684")};
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  min-width: 50px;
  height: 52px;

  &:hover {
    background-color: ${({ $active }) => ($active ? "#fee2e2" : "#f2f4f6")};
  }
`;

const ModalFooter = styled.div`
  padding: 20px 28px;
  background-color: white;
  border-top: 1px solid #f2f4f6;
  display: flex;
  gap: 12px;
`;

const Button = styled.button`
  padding: 14px 20px;
  border-radius: 14px;
  font-size: 15px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
`;

const SaveButton = styled(Button)`
  background: #3182f6;
  color: white;
  flex: 1;
  &:hover:not(:disabled) {
    background: #1b64da;
  }
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const DeleteButton = styled(Button)`
  background: #fff0f0;
  color: #e11d48;
  &:hover:not(:disabled) {
    background: #fee2e2;
  }
`;
