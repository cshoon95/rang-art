import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToastStore } from "@/store/toastStore";
import {
  getServerCustomerList,
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

// === 고객 목록 조회 ===
export const useGetCustomers = (academyCode: string, initialData?: any[]) => {
  return useQuery({
    queryKey: ["customers", academyCode],
    queryFn: () => getServerCustomerList(academyCode),
    initialData: initialData,
    staleTime: 1000 * 60, // 1분 캐시 (추가/삭제 시 invalidateQueries로 즉시 갱신)
    enabled: !!academyCode,
  });
};

// === 1. 등록/수정 (Upsert) 훅 ===
export const useUpsertCustomer = (mode: "add" | "edit") => {
  const queryClient = useQueryClient();
  const { addToast } = useToastStore();

  return useMutation({
    mutationFn: async (data: any) => {
      const action =
        mode === "add" ? createCustomerAction : updateCustomerFullAction;
      const result = await action(data);

      if (!result.success) throw new Error(result.message);
      return result;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["attendance-students"] });
      addToast(data.message, "success");
    },
    onError: (error: Error) => {
      addToast(error.message || "저장에 실패했습니다.", "error");
    },
  });
};

// === 2. 삭제 훅 ===
export const useDeleteCustomer = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToastStore();

  return useMutation({
    mutationFn: async (param) => {
      const result = await deleteCustomerAction(param as any);
      if (!result.success) throw new Error(result.message);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["attendance-students"] });
      addToast("삭제되었습니다.", "success");
    },
    onError: (error: Error) => {
      addToast(error.message || "삭제에 실패했습니다.", "error");
    },
  });
};

// === 1. 직원 등록/수정 (Upsert) 훅 ===
export const useUpsertEmployee = (mode: "add" | "edit") => {
  const queryClient = useQueryClient();
  const { addToast } = useToastStore();

  return useMutation({
    mutationFn: async (data: any) => {
      const action =
        mode === "add" ? createEmployeeAction : updateEmployeeAction;
      const result = await action(data);

      if (!result.success) throw new Error(result.message);
      return result;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      addToast(data.message, "success");
    },
    onError: (error: Error) => {
      addToast(error.message || "저장에 실패했습니다.", "error");
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
  const queryClient = useQueryClient();
  const { addToast } = useToastStore();

  return useMutation({
    mutationFn: async (data: any) => {
      const result = await upsertBranchAction(data);
      if (!result.success) throw new Error(result.message);
      return result;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      addToast(data.message, "success");
    },
    onError: (error: Error) => {
      addToast(error.message, "error");
    },
  });
};

// 삭제
export const useDeleteBranch = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToastStore();

  return useMutation({
    mutationFn: async (code: string) => {
      const result = await deleteBranchAction(code);
      if (!result.success) throw new Error(result.message);
      return result;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
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
    enabled: !!code,
  });
};
