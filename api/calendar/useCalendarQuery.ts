import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getCalendarListAction,
  createCalendarAction,
  updateCalendarAction,
  deleteCalendarAction,
  ICreateCalendarParams,
  IUpdateCalendarParams,
} from "./actions";

// Query Keys
const QUERY_KEY = {
  list: (academyCode: string) => ["calendar", "list", academyCode],
};

/**
 * 캘린더 리스트 조회 훅
 */
export const useGetCalendarList = (
  academyCode: string = "2", // 기본값 혹은 전역 상태
  startDate?: string,
  endDate?: string
) => {
  return useQuery({
    queryKey: QUERY_KEY.list(academyCode),
    queryFn: () => getCalendarListAction(academyCode, startDate, endDate),
    staleTime: 1000 * 60 * 5, // 5분 캐시
  });
};

/**
 * 캘린더 등록 훅
 */
export const useCreateCalendar = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: ICreateCalendarParams) => createCalendarAction(params),
    onSuccess: (_, variables) => {
      // 리스트 갱신
      queryClient.invalidateQueries({
        queryKey: QUERY_KEY.list(variables.academyCode),
      });
    },
    onError: (err) => {
      console.error("일정 등록 실패:", err);
      alert("일정 등록에 실패했습니다.");
    },
  });
};

/**
 * 캘린더 수정 훅
 */
export const useUpdateCalendar = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: IUpdateCalendarParams) => updateCalendarAction(params),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEY.list(variables.academyCode),
      });
    },
    onError: (err) => {
      console.error("일정 수정 실패:", err);
      alert("일정 수정에 실패했습니다.");
    },
  });
};

/**
 * 캘린더 삭제 훅
 */
export const useDeleteCalendar = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, academyCode }: { id: number; academyCode: string }) =>
      deleteCalendarAction(id, academyCode),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEY.list(variables.academyCode),
      });
    },
    onError: (err) => {
      console.error("일정 삭제 실패:", err);
      alert("일정 삭제에 실패했습니다.");
    },
  });
};
