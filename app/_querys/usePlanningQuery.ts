import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getPlanningAction,
  upsertPlanningAction,
  deletePlanningAction,
} from "../_actions/planning";

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
  return useMutation({
    mutationFn: (formData: FormData) => upsertPlanningAction(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["planning"] });
      if (onSuccess) onSuccess();
    },
  });
};

export const useDeletePlanning = (onSuccess?: () => void) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deletePlanningAction(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["planning"] });
      if (onSuccess) onSuccess();
    },
  });
};
