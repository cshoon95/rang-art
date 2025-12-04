"use client";

import {
  useMutation,
  useQueryClient,
  UseMutationOptions,
  UseMutationResult,
} from "@tanstack/react-query";
import {
  insertScheduleTimeAction,
  deleteScheduleTimeAction,
  upsertScheduleAction,
} from "@/api/schedule/actions";
import { useToastStore } from "@/store/toastStore";
import { useRouter } from "next/navigation";
import {
  deletePickupTimeAction,
  insertPickupTimeAction,
  upsertPickupAction,
} from "./actions";

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

export const SCHEDULE_KEYS = {
  all: ["schedule"] as const,
  timeList: (academyCode: string) =>
    [...SCHEDULE_KEYS.all, "timeList", academyCode] as const,
  dataList: (academyCode: string) =>
    [...SCHEDULE_KEYS.all, "dataList", academyCode] as const,
};

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
