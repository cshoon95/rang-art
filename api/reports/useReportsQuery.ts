import { useMutation, useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useToastStore } from "@/store/toastStore";
import {
  upsertBranchAction,
  deleteBranchAction,
  getBranchDetailAction,
  getBranchesCount,
} from "../branch/actions";

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

// ✅ [신규] 지점 상세 조회 훅
export const useBranchCount = (code: string) => {
  return useQuery({
    queryKey: ["branchCount", code],
    queryFn: () => getBranchesCount(code),
    enabled: !!code, // 코드가 있을 때만 실행
  });
};
