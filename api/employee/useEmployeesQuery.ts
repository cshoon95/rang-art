import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useToastStore } from "@/store/toastStore"; // 프로젝트의 Toast 경로 확인 필요
import {
  createEmployeeAction,
  updateEmployeeAction,
  deleteEmployeeAction,
} from "./actions";

// === 1. 직원 등록/수정 (Upsert) 훅 ===
export const useUpsertEmployee = (mode: "add" | "edit") => {
  const router = useRouter();
  const { addToast } = useToastStore();

  return useMutation({
    mutationFn: async (data: any) => {
      // mode에 따라 등록(create) 또는 수정(update) 액션 호출
      const action =
        mode === "add" ? createEmployeeAction : updateEmployeeAction;
      const result = await action(data);

      if (!result.success) throw new Error(result.message);
      return result;
    },
    onSuccess: (data) => {
      router.refresh(); // 서버 컴포넌트 데이터 갱신 (리스트 새로고침)
      addToast(data.message, "success"); // 성공 토스트
    },
    onError: (error: Error) => {
      addToast(error.message || "저장에 실패했습니다.", "error"); // 에러 토스트
    },
  });
};

// === 2. 직원 삭제 훅 ===
export const useDeleteEmployee = () => {
  return useMutation({
    mutationFn: async (param: { id: string; academyCode: string }) => {
      const result = await deleteEmployeeAction(param);

      if (!result.success) throw new Error(result.message);
      return result;
    },
  });
};
