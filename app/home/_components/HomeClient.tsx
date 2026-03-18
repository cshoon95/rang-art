"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
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
  PlusCircle,
  Bell,
} from "lucide-react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { useSession } from "next-auth/react";
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
  usePaymentMessageList,
} from "@/app/_querys";
import { MappedEvent } from "@/app/_types/type";

interface Props {
  academyCode: string;
  userId: string;
}

const ModalCalendarAdd = dynamic(
  () => import("@/components/modals/ModalCalendarAdd"),
  {
    ssr: false,
    loading: () => null, // 로딩 중에 보여줄 컴포넌트 (없으면 null)
  },
);

// --------------------------------------------------------------------------
// 🧩 Sub Components (Memoization for Performance)
// --------------------------------------------------------------------------

// 1. 스케줄 리스트 컴포넌트
const ScheduleListView = React.memo(
  ({
    data,
    isLoading,
    isTempView,
  }: {
    data: any[];
    isLoading: boolean;
    isTempView: boolean;
  }) => {
    if (isLoading) return <ScheduleListSkeleton />;
    if (!data || data.length === 0)
      return (
        <EmptyState>
          {isTempView
            ? "등록된 임시 시간표가 없습니다."
            : "오늘 예정된 수업이 없습니다."}
        </EmptyState>
      );

    return (
      <ScheduleList>
        {data.map((item: any, idx: number) => (
          <ScheduleRow key={idx}>
            <TimeWrapper>
              <ScheduleTime>
                {item.time?.length >= 4
                  ? `${item.time.slice(0, 2)}:${item.time.slice(2, 4)}`
                  : item.time}
              </ScheduleTime>
              <ScheduleLine />
            </TimeWrapper>
            <ClassCell $type="M">
              <NameChipList content={item.M} theme="blue" />
            </ClassCell>
            <ClassCell $type="D">
              <NameChipList content={item.D} theme="blue" />
            </ClassCell>
          </ScheduleRow>
        ))}
      </ScheduleList>
    );
  },
);
ScheduleListView.displayName = "ScheduleListView";

// 2. 픽업 리스트 컴포넌트
const PickupListView = React.memo(
  ({ data, isLoading }: { data: any[]; isLoading: boolean }) => {
    if (isLoading) return <PickupListSkeleton />;
    if (!data || data.length === 0)
      return <EmptyState>오늘 픽업 일정이 없습니다.</EmptyState>;

    return (
      <PickupList>
        {data.map((item: any, idx: number) => (
          <PickupItem key={idx}>
            <PickupTime>
              {item.time?.length >= 4
                ? `${item.time.slice(0, 2)}:${item.time.slice(2, 4)}`
                : item.time}
            </PickupTime>
            <PickupLine />
            <PickupContent>
              <NameChipList content={item.content} theme="orange" />
            </PickupContent>
          </PickupItem>
        ))}
      </PickupList>
    );
  },
);
PickupListView.displayName = "PickupListView";

// 3. 칩 리스트 (공통)
const NameChipList = React.memo(
  ({
    content,
    theme,
  }: {
    content: string | null;
    theme: "blue" | "orange";
  }) => {
    if (!content) return <EmptyDash>-</EmptyDash>;
    // useMemo로 문자열 파싱 최적화
    const names = useMemo(
      () => content.split(/[\n,\s]+/).filter((str) => str.trim() !== ""),
      [content],
    );

    return (
      <ChipContainer>
        {names.map((name, idx) => (
          <NameChip key={idx} $theme={theme}>
            {name}
          </NameChip>
        ))}
      </ChipContainer>
    );
  },
);
NameChipList.displayName = "NameChipList";

// --------------------------------------------------------------------------
// 🧩 Main Component
// --------------------------------------------------------------------------

// 🕒 시계 컴포넌트 분리
const DigitalClock = React.memo(() => {
  const [timeStr, setTimeStr] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();
      const ampm = hours >= 12 ? "PM" : "AM";
      const displayHour = hours % 12 || 12;
      const displayMinute = String(minutes).padStart(2, "0");
      setTimeStr(
        `${ampm === "PM" ? "오후" : "오전"} ${displayHour}시 ${displayMinute}분`,
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 60000); // 1분마다
    return () => clearInterval(interval);
  }, []);

  return (
    <TimeBox>
      <Clock size={16} color="#3182f6" />
      <span>{timeStr}</span>
    </TimeBox>
  );
});
DigitalClock.displayName = "DigitalClock";

// 🌟 [최적화] 독립 위젯 컴포넌트 분리 (데이터 의존성 코로케이션)
// 각 위젯이 스스로 API를 호출하므로 부모 화면(전체 대시보드)의 리렌더링을 유발하지 않습니다.
const PickupWidget = React.memo(
  ({
    academyCode,
    currentDay,
    isWeekend,
  }: {
    academyCode: string;
    currentDay: string;
    isWeekend: boolean;
  }) => {
    const router = useRouter();
    // 스스로 픽업 데이터를 불러옵니다.
    const { data: pickupData, isLoading: isPickupLoading } = useTodayPickup(
      academyCode,
      currentDay,
    );

    return (
      <PickupCard onClick={() => router.push("/pickup")}>
        <CardHeader>
          <TitleWithIcon>
            <IconWrapper $bg="#fff7ed">
              <Bus size={20} color="#f97316" />
            </IconWrapper>
            <CardTitle>픽업 시간표</CardTitle>
          </TitleWithIcon>
          <HeaderRight>
            <DigitalClock />
          </HeaderRight>
        </CardHeader>

        <ScrollContent>
          {isWeekend ? (
            <EmptyState>주말은 픽업 운행이 없습니다.</EmptyState>
          ) : (
            <PickupListView
              data={pickupData || []}
              isLoading={isPickupLoading}
            />
          )}
        </ScrollContent>
      </PickupCard>
    );
  },
);
PickupWidget.displayName = "PickupWidget";

const UnpaidWidget = React.memo(({ academyCode }: { academyCode: string }) => {
  const router = useRouter();
  // 스스로 결제 알림 데이터를 불러옵니다.
  const { data: paymentMessageList = [], isLoading: isMessageLoading } =
    usePaymentMessageList(academyCode);

  return (
    <UnpaidCard onClick={() => router.push("/payment")}>
      <CardHeader>
        <TitleWithIcon>
          <IconWrapper $bg="#fef2f2">
            <Bell size={20} color="#ef4444" />
          </IconWrapper>
          <CardTitle>결제 알림 대상</CardTitle>
        </TitleWithIcon>
        <HeaderRight>
          <UnpaidTotalBadge>총 {paymentMessageList.length}명</UnpaidTotalBadge>
        </HeaderRight>
      </CardHeader>

      <ScrollContent>
        {isMessageLoading ? (
          <EmptyState>데이터를 불러오는 중...</EmptyState>
        ) : paymentMessageList.length === 0 ? (
          <EmptyState>
            <span style={{ fontSize: "24px", marginBottom: "8px" }}>🎉</span>
            결제 알림을 보낼 대상이 없습니다.
          </EmptyState>
        ) : (
          <UnpaidList>
            {paymentMessageList.map((student: any) => (
              <UnpaidItem key={student.id}>
                <UnpaidInfo>
                  <UnpaidName>{student.name}</UnpaidName>
                  <UnpaidSubText>주 {student.count || 1}회</UnpaidSubText>
                </UnpaidInfo>
                <UnpaidBadge>발송 대기</UnpaidBadge>
              </UnpaidItem>
            ))}
          </UnpaidList>
        )}
      </ScrollContent>
    </UnpaidCard>
  );
});
UnpaidWidget.displayName = "UnpaidWidget";

// 🌟 [최적화] 수업/임시 시간표 위젯
const ScheduleWidget = React.memo(
  ({
    academyCode,
    currentDay,
    isWeekend,
  }: {
    academyCode: string;
    currentDay: string;
    isWeekend: boolean;
  }) => {
    const router = useRouter();
    const [isTempView, setIsTempView] = useState(false);

    const { data: regularData, isLoading: isRegularLoading } = useTodaySchedule(
      academyCode,
      currentDay,
    );
    const { data: tempData, isLoading: isTempLoading } = useTodayTempSchedule(
      academyCode,
      currentDay,
    );

    const currentSchedules = useMemo(
      () => (isTempView ? tempData?.data || [] : regularData?.data || []),
      [isTempView, tempData, regularData],
    );

    const isScheduleLoading = isTempView ? isTempLoading : isRegularLoading;

    const handleToggleTempView = useCallback((e: React.MouseEvent) => {
      e.stopPropagation();
      setIsTempView((prev) => !prev);
    }, []);

    return (
      <ScheduleCard>
        <CardHeader>
          <HeaderLeft>
            <TitleWithIcon>
              <IconWrapper $bg={isTempView ? "#fff1f2" : "#e8f3ff"}>
                <School size={20} color={isTempView ? "#e11d48" : "#3182f6"} />
              </IconWrapper>
              <CardTitle>
                {isTempView ? "임시 시간표" : "수업 시간표"}
              </CardTitle>
            </TitleWithIcon>
          </HeaderLeft>
          <ToggleButton $isTemp={isTempView} onClick={handleToggleTempView}>
            <ArrowLeftRight size={14} />
            {isTempView ? "수업시간표 보기" : "임시시간표 보기"}
          </ToggleButton>
        </CardHeader>

        <ScrollContent
          onClick={() =>
            router.push(isTempView ? "/temp-schedule" : "schedule")
          }
        >
          {isWeekend ? (
            <EmptyState
              style={{ height: "100%", flexDirection: "column", gap: "10px" }}
            >
              <span style={{ fontSize: "40px" }}>🏖️</span>
              <span>주말은 수업이 없습니다. 푹 쉬세요!</span>
            </EmptyState>
          ) : (
            <>
              <ScheduleTableHeader>
                <div style={{ width: 60, textAlign: "center" }}>TIME</div>
                <div
                  style={{
                    flex: 1.5,
                    display: "flex",
                    justifyContent: "center",
                  }}
                >
                  <Hammer
                    size={14}
                    color="#f59e0b"
                    style={{ marginRight: 4 }}
                  />
                  만들기
                </div>
                <div
                  style={{
                    flex: 1.5,
                    display: "flex",
                    justifyContent: "center",
                  }}
                >
                  <Palette
                    size={14}
                    color="#ec4899"
                    style={{ marginRight: 4 }}
                  />
                  드로잉
                </div>
              </ScheduleTableHeader>
              <ScheduleListView
                data={currentSchedules}
                isLoading={isScheduleLoading}
                isTempView={isTempView}
              />
            </>
          )}
        </ScrollContent>
      </ScheduleCard>
    );
  },
);
ScheduleWidget.displayName = "ScheduleWidget";

// 🌟 [최적화] 오늘의 일정 위젯
const EventWidget = React.memo(
  ({ academyCode, userId }: { academyCode: string; userId: string }) => {
    const router = useRouter();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<MappedEvent | null>(
      null,
    );

    const {
      data: eventData,
      isLoading: isEventLoading,
      refetch: refetchEvents,
    } = useTodayEvents(academyCode);

    const handleAddEvent = useCallback((e: React.MouseEvent) => {
      e.stopPropagation();
      setSelectedEvent(null);
      setIsModalOpen(true);
    }, []);

    const handleEditEvent = useCallback((eventItem: any) => {
      const mapped: MappedEvent = {
        idx: eventItem.idx,
        title: eventItem.title || eventItem.content,
        start: new Date(`${eventItem.start_date}T${eventItem.start_time}`),
        end: new Date(`${eventItem.end_date}T${eventItem.end_time}`),
        resource: eventItem,
        type: "event",
        id: "",
      };
      setSelectedEvent(mapped);
      setIsModalOpen(true);
    }, []);

    return (
      <>
        <CalendarCard onClick={() => router.push("/calendar")}>
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
            {isEventLoading ? (
              <EventListSkeleton />
            ) : eventData && eventData.length > 0 ? (
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
                        <EventSub>{event.content || "상세 내용 없음"}</EventSub>
                      </EventInfo>
                    </EventItem>
                  );
                })}
              </EventList>
            ) : (
              <EmptyStateWrapper>
                <EmptyIcon>🍃</EmptyIcon>
                <EmptyText>
                  오늘은 예정된 일정이 없어요.
                  <br />
                  새로운 일정을 등록하시겠어요?
                </EmptyText>
                <AddEventButton onClick={handleAddEvent}>
                  <PlusCircle size={16} />
                  일정 등록하기
                </AddEventButton>
              </EmptyStateWrapper>
            )}
          </EventContent>
        </CalendarCard>

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
      </>
    );
  },
);
EventWidget.displayName = "EventWidget";

export default function DashboardClient({ academyCode, userId }: Props) {
  // 🌟 세션 정보에서 직급(levelName) 확인
  const { data: session } = useSession();
  const userLevelName = session?.user?.levelName || "";
  const userLevelCode = String((session?.user as any)?.level || "");

  // 🌟 [수정] 텍스트나 코드로 '기타', '원장', '스탭'을 모두 잡아내도록 강력하게 처리
  const canViewPaymentMsg =
    userLevelName.includes("원장") ||
    userLevelName.includes("기타") ||
    userLevelName.includes("스탭") ||
    userLevelCode === "1" || // 원장 코드
    userLevelCode === "4" || // 스탭 코드
    userLevelCode === "5"; // 기타 코드

  // 상태 관리

  // 날짜 계산 로직 (useMemo로 최적화)
  const { currentDay, isWeekend } = useMemo(() => {
    // SSR 불일치 방지를 위해 클라이언트에서만 날짜 계산하도록 할 수도 있지만,
    // 초기 렌더링 속도를 위해 여기서는 직접 계산합니다.
    const now = new Date();
    const jsDay = now.getDay();
    const isWknd = jsDay === 0 || jsDay === 6;
    const dayCode = isWknd ? "99" : String(jsDay - 1);

    return { currentDay: dayCode, isWeekend: isWknd };
  }, []); // 의존성 배열 비움 (컴포넌트 마운트 시 1회 계산)

  return (
    <Container>
      <GridContainer>
        {/* 1. 수업/임시 시간표 */}
        <ScheduleWidget
          academyCode={academyCode}
          currentDay={currentDay}
          isWeekend={isWeekend}
        />

        <RightColumn>
          {/* 2. 픽업 시간표 */}
          <PickupWidget
            academyCode={academyCode}
            currentDay={currentDay}
            isWeekend={isWeekend}
          />

          {/* 3. 오늘의 일정 */}
          <EventWidget academyCode={academyCode} userId={userId} />

          {/* 🌟 4. 결제 알림 카드 추가 (원장 및 기타 권한자만 보임) */}
          {canViewPaymentMsg && <UnpaidWidget academyCode={academyCode} />}
        </RightColumn>
      </GridContainer>
    </Container>
  );
}

// --------------------------------------------------------------------------
// ✨ Styled Components (동일 유지)
// --------------------------------------------------------------------------

const Container = styled.div`
  background-color: #f4f6f8;
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding-bottom: 100px;

  @media (max-width: 768px) {
    padding: 0px;
    height: auto;
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
  transition:
    transform 0.2s,
    box-shadow 0.2s;
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
  font-weight: 500;
`;
const ScheduleCard = styled(CardBase)`
  min-height: 700px;
  @media (max-width: 1024px) {
    min-height: 400px;
  }
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

  @media (max-width: 768px) {
    padding: 16px 6px;
  }
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
          border: 1px solid #e0f2fe;ㅎ
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
  margin-left: 25px;
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
  overflow-y: auto;
  max-height: 320px;

  /* ✅ [수정] 마지막 아이템이 잘리지 않도록 하단 여백 추가 */
  padding-bottom: 50px;

  /* (선택사항) 스크롤바 디자인을 예쁘게 다듬기 */
  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-thumb {
    background-color: #e5e7eb;
    border-radius: 3px;
  }
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
const EmptyStateWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  gap: 16px;
  text-align: center;
`;
const EmptyIcon = styled.div`
  font-size: 32px;
`;
const EmptyText = styled.p`
  font-size: 14px;
  color: #8b95a1;
  line-height: 1.5;
`;
const AddEventButton = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background-color: #e8f3ff;
  color: #3182f6;
  font-size: 13px;
  font-weight: 700;
  border-radius: 20px;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  &:hover {
    background-color: #dbeafe;
  }
`;

// 🌟 [추가] 미납자 카드 전용 스타일
const UnpaidCard = styled(CardBase)`
  flex: 1;
  min-height: 220px;
  max-height: 300px;
`;
const UnpaidTotalBadge = styled.span`
  font-size: 13px;
  color: #ef4444;
  font-weight: 700;
  background-color: #fee2e2;
  padding: 4px 10px;
  border-radius: 12px;
`;
const UnpaidList = styled.div`
  display: flex;
  flex-direction: column;
  padding: 16px 24px;
  gap: 10px;
`;
const UnpaidItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  background: #fafafa;
  border-radius: 12px;
  border: 1px solid #f0f0f0;
`;
const UnpaidInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;
const UnpaidName = styled.span`
  font-size: 14px;
  font-weight: 700;
  color: #333d4b;
`;
const UnpaidSubText = styled.span`
  font-size: 12px;
  color: #8b95a1;
`;
const UnpaidBadge = styled.span`
  font-size: 11px;
  font-weight: 700;
  color: #ef4444;
  background: #fee2e2;
  padding: 4px 8px;
  border-radius: 6px;
`;
