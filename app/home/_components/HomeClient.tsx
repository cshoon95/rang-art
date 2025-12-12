"use client";

import React, { useState, useEffect, useMemo } from "react";
import styled, { css } from "styled-components";
import {
  Clock,
  CalendarCheck,
  Bus,
  School,
  AlertCircle,
  MoreHorizontal,
  Palette,
  Hammer,
  CheckCircle2,
  ArrowLeftRight,
  CalendarOff,
} from "lucide-react";
import { useRouter } from "next/navigation";
import ModalCalendarAdd from "@/components/modals/ModalCalendarAdd";
import {
  ScheduleListSkeleton,
  PickupListSkeleton,
  EventListSkeleton,
} from "./DashboardSkeletons";
import {
  useTodaySchedule,
  useTodayTempSchedule,
  useTodayPickup,
  useTodayEvents,
} from "@/app/_querys";
import { MappedEvent } from "@/app/_types/type";

// ✅ [추가] 스켈레톤 컴포넌트 import (경로를 실제 파일 위치에 맞게 수정해주세요)

interface Props {
  academyCode: string;
  userId: string;
}

export default function DashboardClient({ academyCode, userId }: Props) {
  const router = useRouter();
  const [currentDay, setCurrentDay] = useState("0");
  const [currentTime, setCurrentTime] = useState("");
  const [isTempView, setIsTempView] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<MappedEvent | null>(null);

  // 현재 시간 및 요일 업데이트
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const jsDay = now.getDay();

      let dbDay = jsDay - 1;
      if (dbDay < 0 || dbDay > 4) {
        dbDay = 0;
      }

      setCurrentDay(String(dbDay));

      const hours = now.getHours();
      const minutes = now.getMinutes();
      const ampm = hours >= 12 ? "PM" : "AM";
      const displayHour = hours % 12 || 12;
      const displayMinute = String(minutes).padStart(2, "0");

      setCurrentTime(
        `${ampm === "PM" ? "오후" : "오전"} ${displayHour}시 ${displayMinute}분`
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  // 데이터 Fetching Hook
  const { data: regularData, isLoading: isRegularLoading } = useTodaySchedule(
    academyCode,
    currentDay
  );
  const { data: tempData, isLoading: isTempLoading } = useTodayTempSchedule(
    academyCode,
    currentDay
  );
  const { data: pickupData, isLoading: isPickupLoading } = useTodayPickup(
    academyCode,
    currentDay
  );
  const {
    data: eventData,
    isLoading: isEventLoading,
    refetch: refetchEvents,
  } = useTodayEvents(academyCode);

  // 시간표 데이터 처리 (일반/임시 전환)
  const currentSchedules = isTempView
    ? tempData?.data || []
    : regularData?.data || [];
  const isScheduleLoading = isTempView ? isTempLoading : isRegularLoading;
  const isTempActive = false;

  const formatTime = (timeStr: string) => {
    if (!timeStr || timeStr.length < 4) return timeStr;
    if (/^\d{4}$/.test(timeStr)) {
      return `${timeStr.slice(0, 2)}:${timeStr.slice(2, 4)}`;
    }
    return timeStr;
  };

  const renderNameChips = (
    content: string | null,
    theme: "blue" | "orange"
  ) => {
    if (!content) return <EmptyDash>-</EmptyDash>;
    const names = content.split(/[\n,\s]+/).filter((str) => str.trim() !== "");
    return (
      <ChipContainer>
        {names.map((name, idx) => (
          <NameChip key={idx} $theme={theme}>
            {name}
          </NameChip>
        ))}
      </ChipContainer>
    );
  };

  const handleAddEvent = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedEvent(null);
    setIsModalOpen(true);
  };

  const handleEditEvent = (eventItem: any) => {
    const mapped: MappedEvent = {
      id: eventItem.id,
      title: eventItem.title || eventItem.content,
      start: new Date(`${eventItem.start_date}T${eventItem.start_time}`),
      end: new Date(`${eventItem.end_date}T${eventItem.end_time}`),
      resource: eventItem,
      type: "event",
    };
    setSelectedEvent(mapped);
    setIsModalOpen(true);
  };

  return (
    <Container>
      <GridContainer>
        {/* ------------------------------------------ */}
        {/* 1. 수업/임시 시간표 카드 */}
        {/* ------------------------------------------ */}
        <ScheduleCard>
          <CardHeader>
            <HeaderLeft>
              <TitleWithIcon>
                <IconWrapper $bg={isTempView ? "#fff1f2" : "#e8f3ff"}>
                  <School
                    size={20}
                    color={isTempView ? "#e11d48" : "#3182f6"}
                  />
                </IconWrapper>
                <CardTitle>
                  {isTempView ? "임시 시간표" : "수업 시간표"}
                </CardTitle>
              </TitleWithIcon>
              {!isTempView && isTempActive && (
                <TempBadge>
                  <AlertCircle size={12} />
                  임시노출중
                </TempBadge>
              )}
            </HeaderLeft>
            <ToggleButton
              $isTemp={isTempView}
              onClick={(e) => {
                e.stopPropagation();
                setIsTempView(!isTempView);
              }}
            >
              <ArrowLeftRight size={14} />
              {isTempView ? "수업시간표 보기" : "임시시간표 보기"}
            </ToggleButton>
          </CardHeader>

          <ScrollContent
            onClick={() =>
              router.push(isTempView ? "/temp-schedule" : "schedule")
            }
          >
            <ScheduleTableHeader>
              <div style={{ width: 60, textAlign: "center" }}>TIME</div>
              <div
                style={{
                  flex: 1.5,
                  paddingLeft: 16,
                  justifyContent: "center",
                  display: "flex",
                }}
              >
                <Hammer size={14} color="#f59e0b" style={{ marginRight: 4 }} />
                만들기
              </div>
              <div
                style={{
                  flex: 1.5,
                  paddingLeft: 16,
                  justifyContent: "center",
                  display: "flex",
                }}
              >
                <Palette size={14} color="#ec4899" style={{ marginRight: 4 }} />
                드로잉
              </div>
            </ScheduleTableHeader>

            {/* ✅ [수정] 스켈레톤 적용 */}
            {isScheduleLoading ? (
              <ScheduleListSkeleton />
            ) : currentSchedules.length > 0 ? (
              <ScheduleList>
                {currentSchedules.map((item: any, idx: number) => (
                  <ScheduleRow key={idx}>
                    <TimeWrapper>
                      <ScheduleTime>{formatTime(item.time)}</ScheduleTime>
                      <ScheduleLine />
                    </TimeWrapper>
                    <ClassCell $type="M">
                      {renderNameChips(item.M, "blue")}
                    </ClassCell>
                    <ClassCell $type="D">
                      {renderNameChips(item.D, "blue")}
                    </ClassCell>
                  </ScheduleRow>
                ))}
              </ScheduleList>
            ) : (
              <EmptyState>
                {isTempView
                  ? "등록된 임시 시간표가 없습니다."
                  : "오늘 예정된 수업이 없습니다."}
              </EmptyState>
            )}
          </ScrollContent>
        </ScheduleCard>

        <RightColumn>
          {/* ------------------------------------------ */}
          {/* 2. 픽업 시간표 카드 */}
          {/* ------------------------------------------ */}
          <PickupCard onClick={() => router.push("/pickup")}>
            <CardHeader>
              <TitleWithIcon>
                <IconWrapper $bg="#fff7ed">
                  <Bus size={20} color="#f97316" />
                </IconWrapper>
                <CardTitle>픽업 시간표</CardTitle>
              </TitleWithIcon>
              <HeaderRight>
                <TimeBox>
                  <Clock size={16} color="#3182f6" />
                  <span>{currentTime}</span>
                </TimeBox>
              </HeaderRight>
            </CardHeader>

            <ScrollContent>
              {/* ✅ [수정] 스켈레톤 적용 */}
              {isPickupLoading ? (
                <PickupListSkeleton />
              ) : pickupData ? (
                <PickupList>
                  {pickupData?.map((item: any, idx: number) => (
                    <PickupItem key={idx}>
                      <PickupTime>{formatTime(item.time)}</PickupTime>
                      <PickupLine />
                      <PickupContent>
                        {renderNameChips(item.content, "orange")}
                      </PickupContent>
                    </PickupItem>
                  ))}
                </PickupList>
              ) : (
                <EmptyState>오늘 픽업 일정이 없습니다.</EmptyState>
              )}
            </ScrollContent>
          </PickupCard>

          {/* ------------------------------------------ */}
          {/* 3. 오늘의 일정 카드 */}
          {/* ------------------------------------------ */}
          <CalendarCard onClick={() => router.push("/schedule")}>
            <CardHeader>
              <TitleWithIcon>
                <IconWrapper $bg="#f0fdf4">
                  <CalendarCheck size={20} color="#16a34a" />
                </IconWrapper>
                <CardTitle>오늘의 일정</CardTitle>
              </TitleWithIcon>
              <MoreIcon onClick={handleAddEvent}>
                <MoreHorizontal size={20} />
              </MoreIcon>
            </CardHeader>

            <EventContent>
              {/* ✅ [수정] 스켈레톤 적용 */}
              {isEventLoading ? (
                <EventListSkeleton />
              ) : eventData ? (
                <EventList>
                  {eventData?.map((event: any, idx: number) => {
                    const isHoliday = event.type === "school_holiday";
                    return (
                      <EventItem
                        key={idx}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditEvent(event);
                        }}
                      >
                        <EventIconBox $isHoliday={isHoliday}>
                          {isHoliday ? (
                            <CalendarOff size={18} color="#e11d48" />
                          ) : (
                            <CheckCircle2 size={18} color="#16a34a" />
                          )}
                        </EventIconBox>
                        <EventInfo>
                          <EventTitle>{event.title}</EventTitle>
                          <EventSub>
                            {event.content || "상세 내용 없음"}
                          </EventSub>
                        </EventInfo>
                      </EventItem>
                    );
                  })}
                </EventList>
              ) : (
                <EmptyState>오늘 예정된 일정이 없습니다.</EmptyState>
              )}
            </EventContent>
          </CalendarCard>
        </RightColumn>
      </GridContainer>

      <ModalCalendarAdd
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          refetchEvents();
        }}
        academyCode={academyCode}
        userId={userId}
        selectedEvent={selectedEvent}
        initialDate={new Date()}
      />
    </Container>
  );
}

// --------------------------------------------------------------------------
// ✨ Styled Components
// --------------------------------------------------------------------------

const Container = styled.div`
  padding: 24px;
  background-color: #f4f6f8;
  min-height: 90vh;
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding-bottom: 100px;

  @media (max-width: 768px) {
    padding: 16px;
    height: auto;
    margin-bottom: 60px;
  }
`;
const TimeBox = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  background: #fff;
  padding: 8px 14px;
  border-radius: 20px;
  font-weight: 700;
  color: #333;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  font-family: monospace;
  font-size: 16px;
`;
const GridContainer = styled.div`
  display: grid;
  grid-template-columns: 1.8fr 1.2fr;
  gap: 20px;
  flex: 1;
  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
    grid-template-rows: auto auto;
  }
`;
const RightColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  height: 100%;
`;
const CardBase = styled.div`
  background: white;
  border-radius: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.02);
  border: 1px solid rgba(224, 224, 224, 0.4);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition: transform 0.2s, box-shadow 0.2s;
  cursor: pointer;
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06);
  }
`;
const CardHeader = styled.div`
  padding: 20px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #f2f4f6;
  background-color: #fff;
`;
const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;
const TitleWithIcon = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;
const IconWrapper = styled.div<{ $bg: string }>`
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background-color: ${(props) => props.$bg};
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
`;
const CardTitle = styled.h2`
  font-size: 18px;
  font-weight: 700;
  color: #333;
  margin: 0;
`;
const ScrollContent = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 0;
  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-thumb {
    background-color: #e5e8eb;
    border-radius: 3px;
  }
`;
const EmptyState = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 150px;
  color: #b0b8c1;
  font-size: 14px;
`;
const ScheduleCard = styled(CardBase)`
  min-height: 700px;
  @media (max-width: 1024px) {
    min-height: 400px;
  }
`;
const TempBadge = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 20px;
  background-color: #fff1f2;
  color: #e11d48;
  font-size: 11px;
  font-weight: 700;
`;
const ToggleButton = styled.button<{ $isTemp: boolean }>`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid;
  ${(props) =>
    props.$isTemp
      ? css`
          background-color: #3182f6;
          color: white;
          border-color: #3182f6;
          &:hover {
            background-color: #1b64da;
          }
        `
      : css`
          background-color: white;
          color: #3182f6;
          border-color: #e5e8eb;
          &:hover {
            background-color: #f2f9ff;
            border-color: #3182f6;
          }
        `}
`;
const ScheduleTableHeader = styled.div`
  display: flex;
  padding: 12px 24px;
  background-color: #f9fafb;
  font-size: 13px;
  font-weight: 600;
  color: #64748b;
  border-bottom: 1px solid #f2f4f6;
  position: sticky;
  top: 0;
  z-index: 10;
  justify-content: center;
`;
const ScheduleList = styled.div`
  display: flex;
  flex-direction: column;
  padding: 0 16px;
`;
const TimeWrapper = styled.div`
  position: relative;
  width: 60px;
  display: flex;
  justify-content: center;
  padding-top: 20px;
  flex-shrink: 0;
`;
const ScheduleTime = styled.span`
  font-size: 13px;
  font-weight: 700;
  color: #3182f6;
  z-index: 1;
  background-color: white;
  padding-bottom: 4px;
`;
const ScheduleRow = styled.div`
  display: flex;
  align-items: flex-start;
  min-height: 60px;
  position: relative;
  &:last-child {
    padding-bottom: 20px;
  }
`;
const ScheduleLine = styled.div`
  position: absolute;
  top: 40px;
  bottom: -20px;
  width: 2px;
  background-color: #dbeafe;
  left: 50%;
  transform: translateX(-50%);
  z-index: 0;
  ${ScheduleRow}:last-child & {
    display: none;
  }
  &::before {
    content: "";
    position: absolute;
    top: -12px;
    left: 50%;
    transform: translateX(-50%);
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background-color: #3182f6;
    z-index: 2;
    box-shadow: 0 0 0 2px white;
  }
`;
const ClassCell = styled.div<{ $type: "D" | "M" }>`
  flex: 1.5;
  padding: 16px 12px;
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  font-size: 14px;
  color: #333;
  border-right: ${(props) =>
    props.$type === "M" ? "1px dashed #f0f0f0" : "none"};
  color: ${(props) => (props.children ? "#333" : "#d1d5db")};
`;
const EmptyDash = styled.span`
  color: #e5e7eb;
  font-weight: 300;
`;
const ChipContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  width: 100%;
`;
const NameChip = styled.span<{ $theme: "blue" | "orange" }>`
  display: inline-flex;
  align-items: center;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  line-height: 1.4;
  white-space: nowrap;
  ${(props) =>
    props.$theme === "blue"
      ? css`
          background-color: #f0f9ff;
          color: #0369a1;
          border: 1px solid #e0f2fe;
        `
      : css`
          background-color: #fff7ed;
          color: #c2410c;
          border: 1px solid #ffedd5;
        `}
`;
const PickupCard = styled(CardBase)`
  flex: 1;
  max-height: 350px;
  min-height: 300px;
`;
const PickupList = styled.div`
  padding: 20px 24px;
  display: flex;
  flex-direction: column;
`;
const PickupItem = styled.div`
  display: flex;
  align-items: flex-start;
  position: relative;
  padding-bottom: 24px;
  &:last-child {
    padding-bottom: 0;
  }
`;
const PickupTime = styled.span`
  font-size: 14px;
  font-weight: 700;
  color: #f97316;
  width: 50px;
  flex-shrink: 0;
  padding-top: 4px;
`;
const PickupLine = styled.div`
  width: 2px;
  background-color: #fed7aa;
  position: absolute;
  left: 60px;
  top: 6px;
  bottom: -6px;
  ${PickupItem}:last-child & {
    display: none;
  }
  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: -3px;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background-color: #f97316;
  }
`;
const PickupContent = styled.div`
  margin-left: 36px;
  flex: 1;
`;
const CalendarCard = styled(CardBase)`
  flex: 1;
  max-height: 400px;
`;
const MoreIcon = styled.div`
  color: #b0b8c1;
  cursor: pointer;
  padding: 4px;
  border-radius: 50%;
  transition: all 0.2s;
  &:hover {
    background-color: #f2f4f6;
    color: #333;
  }
`;
const EventContent = styled.div`
  padding: 0;
`;
const EventList = styled.div`
  display: flex;
  flex-direction: column;
`;
const EventItem = styled.div`
  display: flex;
  align-items: center;
  padding: 16px 24px;
  border-bottom: 1px solid #f9f9f9;
  gap: 12px;
  cursor: pointer;
  transition: background-color 0.2s;
  &:last-child {
    border-bottom: none;
  }
  &:hover {
    background-color: #f9fafb;
  }
`;
const EventIconBox = styled.div<{ $isHoliday?: boolean }>`
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background-color: ${(props) => (props.$isHoliday ? "#fff1f2" : "#f0fdf4")};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;
const EventInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;
const EventTitle = styled.span`
  font-size: 14px;
  font-weight: 700;
  color: #333;
`;
const EventSub = styled.span`
  font-size: 13px;
  color: #64748b;
`;
const HeaderRight = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  @media (max-width: 768px) {
    gap: 8px;
  }
`;
