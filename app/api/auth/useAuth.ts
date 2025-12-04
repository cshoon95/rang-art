import {
  useMutation,
  UseMutationOptions,
  UseMutationResult,
} from "@tanstack/react-query";
import { insertJoinAction } from "@/app/api/auth/actions";

// 파라미터 타입 정의
export type RegisterBranchParams = {
  email: string;
  name: string;
  academyCode: string;
};

// 서버 액션 리턴 타입 정의
type RegisterResponse = { success: boolean };

/**
 * 지점 등록 Mutation 훅
 */
export const useInsertJoin = (
  options?: UseMutationOptions<RegisterResponse, Error, RegisterBranchParams>
): UseMutationResult<RegisterResponse, Error, RegisterBranchParams> => {
  return useMutation<RegisterResponse, Error, RegisterBranchParams>({
    mutationFn: (param) => {
      return insertJoinAction(param.email, param.name, param.academyCode);
    },
    mutationKey: ["insertJoinAction"],
    ...options,
  });
};
