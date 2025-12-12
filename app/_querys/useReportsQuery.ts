import { useMutation, useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useToastStore } from "@/store/toastStore";
import { getBranchesCount, getBranches } from "../_actions/customers";

// ✅ [신규] 지점 상세 조회 훅
export const useBranchCount = (code: string) => {
  return useQuery({
    queryKey: ["branchCount", code],
    queryFn: () => getBranchesCount(code),
    enabled: !!code, // 코드가 있을 때만 실행
  });
};

export const useBranchList = () => {
  return useQuery({
    queryKey: ["branchList"],
    queryFn: () => getBranches(),
  });
};
