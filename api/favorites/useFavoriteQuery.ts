import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { useSession } from "next-auth/react";
import {
  getFavoritesAction,
  toggleFavoriteAction,
  reorderFavoritesAction,
  deleteMemoAction,
  upsertMemoAction,
} from "./actions";
import { useToastStore } from "@/store/toastStore";
import { useRouter } from "next/navigation";

// 조회
export const useFavorites = () => {
  const { data: session } = useSession();
  const email = session?.user?.email;

  return useQuery({
    queryKey: ["favorites", email],
    queryFn: () => getFavoritesAction(email!),
    enabled: !!email,
    initialData: [],
  });
};

// 토글
export const useToggleFavorite = () => {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const email = session?.user?.email;
  const { addToast } = useToastStore();

  return useMutation({
    mutationFn: (path: string) => toggleFavoriteAction(email!, path),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["favorites", email] });

      addToast(
        data.action === "added"
          ? "즐겨찾기에 추가되었어요."
          : "즐겨찾기에서 해제되었어요.",
        "success"
      );
    },
  });
};

// [NEW] 순서 변경 (낙관적 업데이트 적용 권장, 여기선 간단히 구현)
export const useReorderFavorites = () => {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const email = session?.user?.email;

  return useMutation({
    mutationFn: (items: { id: number; order_index: number }[]) =>
      reorderFavoritesAction(items),
    onSuccess: () => {
      // 서버 데이터 다시 불러오기 (혹은 setQueryData로 클라이언트 상태만 먼저 바꿔도 됨)
      queryClient.invalidateQueries({ queryKey: ["favorites", email] });
    },
  });
};

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
