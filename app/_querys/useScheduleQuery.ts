"use client";

import {
  useMutation,
  useQueryClient,
  UseMutationOptions,
  UseMutationResult,
  useQuery,
} from "@tanstack/react-query";

import { useToastStore } from "@/store/toastStore";
import { useRouter } from "next/navigation";
import {
  upsertScheduleAction,
  insertScheduleTimeAction,
  deleteScheduleTimeAction,
  upsertTempScheduleAction,
  insertTempScheduleTimeAction,
  deleteTempScheduleTimeAction,
  upsertPickupAction,
  insertPickupTimeAction,
  deletePickupTimeAction,
  getTodayScheduleAction,
  getTodayTempScheduleAction,
  getTodayPickupAction,
  getTodayEventsAction,
} from "../_actions/schedule";

interface IPickupTimeTypes {
  time: string;
  academyCode?: string;
  registerID?: string;
}

// 응답 타입 정의 (서버 액션의 리턴 타입)
interface ActionResponse {
  success: boolean;
  message: string;
}

interface IPickupTimeTypes {
  time: string;
  academyCode?: string;
  registerID?: string;
}

// 파라미터 타입 정의
interface IUpsertScheduleParams {
  content: string;
  time: string;
  day: string; // 또는 number
  type: string;
  academyCode: string;
  registerID: string;
}

interface ActionResponse {
  success: boolean;
  message: string;
}

export const SCHEDULE_KEYS = {
  all: ["schedule"] as const,
  timeList: (academyCode: string) =>
    [...SCHEDULE_KEYS.all, "timeList", academyCode] as const,
  dataList: (academyCode: string) =>
    [...SCHEDULE_KEYS.all, "dataList", academyCode] as const,
};

export const useUpsertSchedule = (
  options?: UseMutationOptions<ActionResponse, Error, IUpsertScheduleParams>
) => {
  const router = useRouter();
  const { addToast } = useToastStore();

  return useMutation({
    mutationFn: async (param: IUpsertScheduleParams) => {
      const result = await upsertScheduleAction(param);
      if (!result.success) throw new Error(result.message);
      return result;
    },
    onSuccess: () => {
      // ✅ 저장 성공 시 데이터 목록 갱신! (이게 없으면 화면이 안 바뀝니다)
      router.refresh();
      addToast("내용이 저장되었어요.", "success");
    },
    onError: (error) => {
      console.error(error);
      addToast("저장에 실패했습니다.", "error"); // alert 대신 Toast 사용 추천
    },
    ...options,
  });
};

/**
 * 수업 시간표 시간 추가 (React Query + Server Action)
 */
export const useInsertScheduleTime = (
  options?: UseMutationOptions<ActionResponse, Error, IPickupTimeTypes>
): UseMutationResult<ActionResponse, Error, IPickupTimeTypes> => {
  return useMutation<ActionResponse, Error, IPickupTimeTypes>({
    mutationFn: async (param) => {
      // Server Action 호출
      const result = await insertScheduleTimeAction({
        time: param.time,
        academyCode: param.academyCode || "2", // 기본값 처리
        registerID: param.registerID || "admin",
      });

      // 서버 액션 논리적 에러 처리
      if (!result.success) {
        throw new Error(result.message);
      }
      return result;
    },
    mutationKey: ["insertScheduleTime"], // 키 설정
    ...options, // 외부 옵션 적용 (onSuccess, onError 등)
  });
};

/**
 * 수업 시간표 시간 삭제 (React Query + Server Action)
 */
export const useDeleteScheduleTime = (
  options?: UseMutationOptions<ActionResponse, Error, IPickupTimeTypes>
): UseMutationResult<ActionResponse, Error, IPickupTimeTypes> => {
  const router = useRouter();
  const { addToast } = useToastStore();

  return useMutation<ActionResponse, Error, IPickupTimeTypes>({
    mutationFn: async (param) => {
      // Server Action 호출
      const result = await deleteScheduleTimeAction({
        time: param.time,
        academyCode: param.academyCode || "2",
      });

      if (!result.success) {
        throw new Error(result.message);
      }
      return result;
    },
    mutationKey: ["deleteScheduleTime"], // 키 설정
    ...options, // 외부 옵션 적용
  });
};

export const useUpsertTempSchedule = (
  options?: UseMutationOptions<ActionResponse, Error, IUpsertScheduleParams>
) => {
  const router = useRouter();
  const { addToast } = useToastStore();

  return useMutation({
    mutationFn: async (param: IUpsertScheduleParams) => {
      const result = await upsertTempScheduleAction(param);
      if (!result.success) throw new Error(result.message);
      return result;
    },
    onSuccess: () => {
      // ✅ 저장 성공 시 데이터 목록 갱신! (이게 없으면 화면이 안 바뀝니다)
      router.refresh();
      addToast("내용이 저장되었어요.", "success");
    },
    onError: (error) => {
      console.error(error);
      addToast("저장에 실패했습니다.", "error"); // alert 대신 Toast 사용 추천
    },
    ...options,
  });
};

/**
 * 수업 시간표 시간 추가 (React Query + Server Action)
 */
export const useInsertTempScheduleTime = (
  options?: UseMutationOptions<ActionResponse, Error, IPickupTimeTypes>
): UseMutationResult<ActionResponse, Error, IPickupTimeTypes> => {
  return useMutation<ActionResponse, Error, IPickupTimeTypes>({
    mutationFn: async (param) => {
      // Server Action 호출
      const result = await insertTempScheduleTimeAction({
        time: param.time,
        academyCode: param.academyCode || "2", // 기본값 처리
        registerID: param.registerID || "admin",
      });

      // 서버 액션 논리적 에러 처리
      if (!result.success) {
        throw new Error(result.message);
      }
      return result;
    },
    mutationKey: ["insertTempScheduleTimeAction"], // 키 설정
    ...options, // 외부 옵션 적용 (onSuccess, onError 등)
  });
};

/**
 * 수업 시간표 시간 삭제 (React Query + Server Action)
 */
export const useDeleteTempScheduleTime = (
  options?: UseMutationOptions<ActionResponse, Error, IPickupTimeTypes>
): UseMutationResult<ActionResponse, Error, IPickupTimeTypes> => {
  return useMutation<ActionResponse, Error, IPickupTimeTypes>({
    mutationFn: async (param) => {
      // Server Action 호출
      const result = await deleteTempScheduleTimeAction({
        time: param.time,
        academyCode: param.academyCode || "2",
      });

      if (!result.success) {
        throw new Error(result.message);
      }
      return result;
    },
    mutationKey: ["deleteTempScheduleTimeAction"], // 키 설정
    ...options, // 외부 옵션 적용
  });
};

interface IPickupTimeTypes {
  time: string;
  academyCode?: string;
  registerID?: string;
}

// 응답 타입 정의 (서버 액션의 리턴 타입)
interface ActionResponse {
  success: boolean;
  message: string;
}

interface IPickupTimeTypes {
  time: string;
  academyCode?: string;
  registerID?: string;
}

// 파라미터 타입 정의
interface IUpsertScheduleParams {
  content: string;
  time: string;
  day: string;
  academyCode: string;
  registerID: string;
}

interface ActionResponse {
  success: boolean;
  message: string;
}

export const useUpsertPickup = (
  options?: UseMutationOptions<ActionResponse, Error, IUpsertScheduleParams>
) => {
  const router = useRouter();
  const { addToast } = useToastStore();

  return useMutation({
    mutationFn: async (param: IUpsertScheduleParams) => {
      const result = await upsertPickupAction(param);
      if (!result.success) throw new Error(result.message);
      return result;
    },
    onSuccess: () => {
      // ✅ 저장 성공 시 데이터 목록 갱신! (이게 없으면 화면이 안 바뀝니다)
      router.refresh();
      addToast("내용이 저장되었어요.", "success");
    },
    onError: (error) => {
      console.error(error);
      addToast("저장에 실패했습니다.", "error"); // alert 대신 Toast 사용 추천
    },
    ...options,
  });
};

/**
 * 수업 시간표 시간 추가 (React Query + Server Action)
 */
export const useInsertPickupTime = (
  options?: UseMutationOptions<ActionResponse, Error, IPickupTimeTypes>
): UseMutationResult<ActionResponse, Error, IPickupTimeTypes> => {
  return useMutation<ActionResponse, Error, IPickupTimeTypes>({
    mutationFn: async (param) => {
      // Server Action 호출
      const result = await insertPickupTimeAction({
        time: param.time,
        academyCode: param.academyCode || "2", // 기본값 처리
        registerID: param.registerID || "admin",
      });

      // 서버 액션 논리적 에러 처리
      if (!result.success) {
        throw new Error(result.message);
      }
      return result;
    },
    mutationKey: ["insertPickupTimeAction"], // 키 설정
    ...options, // 외부 옵션 적용 (onSuccess, onError 등)
  });
};

/**
 * 수업 시간표 시간 삭제 (React Query + Server Action)
 */
export const useDeletePickupTime = (
  options?: UseMutationOptions<ActionResponse, Error, IPickupTimeTypes>
): UseMutationResult<ActionResponse, Error, IPickupTimeTypes> => {
  return useMutation<ActionResponse, Error, IPickupTimeTypes>({
    mutationFn: async (param) => {
      // Server Action 호출
      const result = await deletePickupTimeAction({
        time: param.time,
        academyCode: param.academyCode || "2",
      });

      if (!result.success) {
        throw new Error(result.message);
      }
      return result;
    },
    mutationKey: ["deletePickupTimeAction"], // 키 설정
    ...options, // 외부 옵션 적용
  });
};

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
