import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useToastStore } from "@/store/toastStore";
import { upsertMemoAction, deleteMemoAction } from "./actions";

export const useUpsertMemo = () => {
  const router = useRouter();
  const { addToast } = useToastStore();

  return useMutation({
    mutationFn: async (data: any) => {
      const result = await upsertMemoAction(data);
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

export const useDeleteMemo = () => {
  const router = useRouter();
  const { addToast } = useToastStore();

  return useMutation({
    mutationFn: async (id: number) => {
      const result = await deleteMemoAction(id);
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
