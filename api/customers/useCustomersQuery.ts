import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
// 토스트 스토어 경로에 맞게 수정해주세요
import { useToastStore } from "@/store/toastStore";
import {
  createCustomerAction,
  updateCustomerFullAction,
  deleteCustomerAction,
} from "./server";

// === 1. 등록/수정 (Upsert) 훅 ===
export const useUpsertCustomer = (mode: "add" | "edit") => {
  const router = useRouter();
  const { addToast } = useToastStore(); // 토스트 메시지

  return useMutation({
    mutationFn: async (data: any) => {
      // mode에 따라 다른 액션 호출
      const action =
        mode === "add" ? createCustomerAction : updateCustomerFullAction;
      const result = await action(data);

      if (!result.success) throw new Error(result.message);
      return result;
    },
    onSuccess: (data) => {
      router.refresh(); // 서버 컴포넌트 데이터 갱신
      addToast(data.message, "success");
    },
    onError: (error: Error) => {
      addToast(error.message || "저장에 실패했습니다.", "error");
    },
  });
};

// === 2. 삭제 훅 ===
export const useDeleteCustomer = () => {
  return useMutation({
    mutationFn: async (param) => {
      const result = await deleteCustomerAction(param as any);
      if (!result.success) throw new Error(result.message);
      return result;
    },
  });
};
