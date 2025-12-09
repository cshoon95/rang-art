import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getCashReceiptListAction,
  updateCashReceiptAction,
  updateCashReceiptBatchAction,
} from "./actions";
import { useToastStore } from "@/store/toastStore";

export const useGetCashReceiptList = (
  academyCode: string,
  year: string,
  month: string
) => {
  return useQuery({
    queryKey: ["cash-receipt", academyCode, year, month],
    queryFn: () => getCashReceiptListAction(academyCode, year, month),
    enabled: !!academyCode,
  });
};

export const useUpdateCashReceipt = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateCashReceiptAction,
    onSuccess: () => {
      // 목록 갱신
      queryClient.invalidateQueries({ queryKey: ["cash-receipt"] });
    },
    onError: (err) => {
      console.error(err);
      alert("수정 중 오류가 발생했습니다.");
    },
  });
};

export const useUpdateCashReceiptBatch = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToastStore();

  return useMutation({
    mutationFn: ({
      ids,
      value,
      updaterId,
      academyCode,
    }: {
      ids: number[];
      value: string;
      updaterId: string;
      academyCode: string;
    }) => updateCashReceiptBatchAction(ids, value, updaterId, academyCode),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cash-receipt"] });
      addToast("업데이트가 완료되었습니다.", "success"); // 성공 토스트
    },
    onError: (err) => {
      console.error(err);
      alert("일괄 처리 중 오류가 발생했습니다.");
      addToast("수정 중 오류가 발생했어요.", "error"); // 성공 토스트
    },
  });
};
