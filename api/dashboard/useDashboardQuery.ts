import { useQuery } from "@tanstack/react-query";
import {
  getTodayScheduleAction,
  getTodayPickupAction,
  getTodayEventsAction,
  getTodayTempScheduleAction,
} from "./actions";

// 수업 시간표
export const useTodaySchedule = (academyCode: string, day: string) => {
  return useQuery({
    queryKey: ["todaySchedule", academyCode, day],
    queryFn: () => getTodayScheduleAction(academyCode, day),
    refetchInterval: 60000,
    enabled: !!academyCode,
  });
};
// 임시 수업 시간표
export const useTodayTempSchedule = (academyCode: string, day: string) => {
  return useQuery({
    queryKey: ["todayTempSchedule", academyCode, day],
    queryFn: () => getTodayTempScheduleAction(academyCode, day),
    refetchInterval: 60000,
    enabled: !!academyCode,
  });
};

// 픽업 시간표
export const useTodayPickup = (academyCode: string, day: string) => {
  return useQuery({
    queryKey: ["todayPickup", academyCode, day],
    queryFn: () => getTodayPickupAction(academyCode, day),
    refetchInterval: 60000,
    enabled: !!academyCode,
  });
};

// [변경] 오늘의 일정
export const useTodayEvents = (academyCode: string) => {
  return useQuery({
    queryKey: ["todayEvents", academyCode], // 키 변경
    queryFn: () => getTodayEventsAction(academyCode), // 액션 변경
    refetchInterval: 60000, // 1분마다 갱신 (오늘 일정이므로 자주 확인)
    enabled: !!academyCode,
  });
};
