"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useToastStore } from "@/store/toastStore";
import {
  getCalendarListAction,
  createCalendarAction,
  updateCalendarAction,
  deleteCalendarAction,
} from "../_actions/calendar";
import { CalendarFormData } from "../_types/type";

// 1. 캘린더 리스트 조회
export const useGetCalendarList = (academyCode: string) => {
  return useQuery({
    queryKey: ["calendar", academyCode],
    queryFn: () => getCalendarListAction(academyCode),
    enabled: !!academyCode, // academyCode가 있을 때만 실행
    // 🌟 [최적화 3] 한 번 불러온 캘린더 데이터는 5분간 캐싱하여 탭 전환 시 즉시 렌더링
    staleTime: 1000 * 60 * 5,
  });
};

// 2. 일정 추가
export const useInsertCalendar = (
  academyCode: string,
  onSuccessCallback?: () => void,
) => {
  const queryClient = useQueryClient();
  const { addToast } = useToastStore();

  return useMutation({
    mutationFn: (data: CalendarFormData & { register_id: string }) =>
      createCalendarAction({ ...data, academy_code: academyCode }),
    onSuccess: (response) => {
      if (response.success) {
        // 성공 시 쿼리 무효화 (데이터 다시 불러오기)
        queryClient.invalidateQueries({ queryKey: ["calendar", academyCode] });
        queryClient.invalidateQueries({
          queryKey: ["todayEvents", academyCode],
        });
        if (onSuccessCallback) onSuccessCallback();
        addToast("일정 등록이 완료되었어요.");
      } else {
        addToast(response.message);
      }
    },
    onError: (err) => {
      console.error(err);
      addToast("등록 중 오류가 발생했어요");
    },
  });
};

// 3. 일정 수정
export const useUpdateCalendar = (
  academyCode: string,
  onSuccessCallback?: () => void,
) => {
  const queryClient = useQueryClient();
  const { addToast } = useToastStore();

  return useMutation({
    // 👈 [변경] id -> idx 로 변경
    mutationFn: (
      data: CalendarFormData & { idx: number; updater_id: string },
    ) => updateCalendarAction({ ...data, academy_code: academyCode }),
    onSuccess: (response) => {
      if (response.success) {
        queryClient.invalidateQueries({ queryKey: ["calendar", academyCode] });
        queryClient.invalidateQueries({
          queryKey: ["todayEvents", academyCode],
        });

        if (onSuccessCallback) onSuccessCallback();
        addToast("일정이 변경되었습니다.");
      } else {
        alert(response.message);
      }
    },
    onError: (err) => {
      console.error(err);
      addToast("일정 수정 중 오류가 발생했어요");
    },
  });
};

// 4. 일정 삭제
export const useDeleteCalendar = (
  academyCode: string,
  onSuccessCallback?: () => void,
) => {
  const queryClient = useQueryClient();
  const { addToast } = useToastStore();

  return useMutation({
    // 👈 [변경] id -> idx 로 변경
    mutationFn: (idx: number) => deleteCalendarAction(idx, academyCode),
    onSuccess: (response) => {
      if (response.success) {
        queryClient.invalidateQueries({ queryKey: ["calendar", academyCode] });
        if (onSuccessCallback) onSuccessCallback();
        addToast("일정 삭제가 완료되었어요.");
      } else {
        alert(response.message);
      }
    },
    onError: (err) => {
      console.error(err);
      addToast("일정 삭제 중 오류가 발생했어요");
    },
  });
};
