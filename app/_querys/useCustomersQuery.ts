import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
// 토스트 스토어 경로에 맞게 수정해주세요
import { useToastStore } from "@/store/toastStore";
import {
  createCustomerAction,
  updateCustomerFullAction,
  deleteCustomerAction,
  createEmployeeAction,
  updateEmployeeAction,
  deleteEmployeeAction,
  upsertBranchAction,
  deleteBranchAction,
  getBranchDetailAction,
} from "../_actions/customers";

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

// 등록/수정
export const useUpsertBranch = () => {
  const router = useRouter();
  const { addToast } = useToastStore();

  return useMutation({
    mutationFn: async (data: any) => {
      const result = await upsertBranchAction(data);
      if (!result.success) throw new Error(result.message);
      return result;
    },
    onSuccess: (data) => {
      router.refresh();
      addToast(data.message, "success");
    },
    onError: (error: Error) => {
      addToast(error.message, "error");
    },
  });
};

// 삭제
export const useDeleteBranch = () => {
  const router = useRouter();
  const { addToast } = useToastStore();

  return useMutation({
    mutationFn: async (code: string) => {
      const result = await deleteBranchAction(code);
      if (!result.success) throw new Error(result.message);
      return result;
    },
    onSuccess: (data) => {
      router.refresh();
      addToast(data.message, "success");
    },
    onError: (error: Error) => {
      addToast(error.message, "error");
    },
  });
};

// ✅ [신규] 지점 상세 조회 훅
export const useBranchDetail = (code: string) => {
  return useQuery({
    queryKey: ["branchDetail", code],
    queryFn: () => getBranchDetailAction(code),
    enabled: !!code, // 코드가 있을 때만 실행
  });
};
