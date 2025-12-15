import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getPlanningAction,
  upsertPlanningAction,
  deletePlanningAction,
} from "../_actions/planning";
import { useToastStore } from "@/store/toastStore";

export const useGetPlanning = (params: any) => {
  return useQuery({
    queryKey: [
      "planning",
      params.academyCode,
      params.year,
      params.month,
      params.type,
    ],
    queryFn: () => getPlanningAction(params),
  });
};

export const useUpsertPlanning = (onSuccess?: () => void) => {
  const queryClient = useQueryClient();
  const { addToast } = useToastStore();

  return useMutation({
    mutationFn: (formData: FormData) => upsertPlanningAction(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["planning"] });
      if (onSuccess) onSuccess();
      addToast("계획안 등록이 완료되었어요.");
    },
  });
};

export const useDeletePlanning = (onSuccess?: () => void) => {
  const queryClient = useQueryClient();
  const { addToast } = useToastStore();

  return useMutation({
    mutationFn: (id: number) => deletePlanningAction(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["planning"] });
      if (onSuccess) onSuccess();
      addToast("계획안 삭제가 완료되었어요.");
    },
  });
};
