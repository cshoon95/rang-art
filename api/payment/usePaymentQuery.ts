import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getPaymentListAction,
  getMonthlyTotalAction,
  upsertPaymentAction,
} from "./server";
import { PaymentType } from "./type";
import {
  deletePaymentAction,
  getPaymentMessageListAction,
  updatePaymentStatusBatchAction,
} from "./actions";
import { useToastStore } from "@/store/toastStore";

export const usePaymentList = (
  year: string,
  month: string,
  type: PaymentType,
  academyCode: string
) => {
  return useQuery({
    queryKey: ["payment", type, "list", year, month],
    queryFn: () => getPaymentListAction(year, month, type, academyCode),
  });
};

export const usePaymentTotal = (
  year: string,
  type: PaymentType,
  academyCode: string
) => {
  return useQuery({
    queryKey: ["payment", type, "total", year],
    queryFn: () => getMonthlyTotalAction(year, type, academyCode),
  });
};

export const useUpsertPayment = (type: PaymentType) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => upsertPaymentAction(data, type),
    onSuccess: () => {
      // 리스트와 합계 쿼리 모두 갱신
      queryClient.invalidateQueries({ queryKey: ["payment", type] });
    },
  });
};

export const usePaymentMessageList = (academyCode: string) => {
  return useQuery({
    queryKey: ["payment", "message", academyCode],
    queryFn: () => getPaymentMessageListAction(academyCode),
  });
};

/**
 * 출납부 수입 데이터 추가
 */
export const useInsertPaymentIncomeData = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToastStore();

  return useMutation({
    mutationFn: (data: any) => upsertPaymentAction(data, "income"),
    onSuccess: () => {
      // 수입 목록(list)과 합계(total) 쿼리 갱신
      queryClient.invalidateQueries({ queryKey: ["payment", "income"] });
      addToast("수입 정보가 추가되었어요.", "success"); // 성공 토스트
    },
    onError: (err) => {
      console.error("수입 등록 실패:", err);
      addToast("수입 정보 추가 중 오류가 발생했어요.", "error"); // 성공 토스트
    },
  });
};

/**
 * 출납부 지출 데이터 추가
 */
export const useInsertPaymentExpenditureData = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToastStore();

  return useMutation({
    mutationFn: (data: any) => upsertPaymentAction(data, "expenditure"),
    onSuccess: () => {
      // 지출 목록(list)과 합계(total) 쿼리 갱신
      queryClient.invalidateQueries({ queryKey: ["payment", "expenditure"] });
      addToast("지출 정보가 추가되었어요.", "success"); // 성공 토스트
    },
    onError: (err) => {
      console.error("지출 등록 실패:", err);
      addToast("지출 정보 추가 중 오류가 발생했어요.", "error"); // 성공 토스트
    },
  });
};

// --- Delete Hooks ---

/**
 * 출납부 수입 데이터 삭제
 */
export const useDeletePaymentIncomeData = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToastStore();

  return useMutation({
    mutationFn: ({ id, academyCode }: { id: number; academyCode: string }) =>
      deletePaymentAction(id, "income", academyCode),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment", "income"] });
      addToast("수입 정보가 삭제되었어요.", "success"); // 성공 토스트
    },
    onError: (err) => {
      console.error("수입 삭제 실패:", err);
      addToast("지출 정보 삭제 중 오류가 발생했어요.", "error"); // 성공 토스트
    },
  });
};

/**
 * 출납부 지출 데이터 삭제
 */
export const useDeletePaymentExpenditureData = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToastStore();

  return useMutation({
    mutationFn: ({ id, academyCode }: { id: number; academyCode: string }) =>
      deletePaymentAction(id, "expenditure", academyCode),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment", "expenditure"] });
      addToast("지출 정보가 삭제되었어요.", "success"); // 성공 토스트
    },
    onError: (err) => {
      console.error("지출 삭제 실패:", err);
      addToast("지출 정보 삭제 중 오류가 발생했어요.", "error"); // 성공 토스트
    },
  });
};

export const useUpdatePaymentStatusBatch = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToastStore();

  return useMutation({
    mutationFn: ({
      ids,
      key,
      value,
      updaterId,
      academyCode,
    }: {
      ids: number[];
      key: string;
      value: string;
      updaterId: string;
      academyCode: string;
    }) =>
      updatePaymentStatusBatchAction(ids, key, value, updaterId, academyCode),

    onSuccess: () => {
      // 관련된 쿼리(결제 알림 목록 등) 무효화 -> 자동 새로고침
      queryClient.invalidateQueries({ queryKey: ["payment", "message"] });
      addToast("업데이트가 완료되었습니다.", "success"); // 성공 토스트
    },
    onError: (err) => {
      console.error("업데이트 실패:", err);
      addToast("수정 중 오류가 발생했어요.", "error"); // 성공 토스트
    },
  });
};
