"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

const TABLE = "favorites";

// 1. 내 즐겨찾기 목록 조회 (순서대로)
export async function getFavoritesAction(email: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from(TABLE)
    .select("id, path, order_index") // id도 필요함
    .eq("user_id", email)
    .order("order_index", { ascending: true }) // 순서대로 정렬
    .order("created_at", { ascending: true }); // 차순위 정렬

  if (error) {
    console.error("Get Favorites Error:", error);
    return [];
  }

  return data;
}

// 2. 즐겨찾기 토글 (추가 시 맨 마지막 순서로)
export async function toggleFavoriteAction(email: string, path: string) {
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from(TABLE)
    .select("id")
    .eq("user_id", email)
    .eq("path", path)
    .single();

  if (existing) {
    // 삭제
    await supabase.from(TABLE).delete().eq("id", existing.id);
    return { action: "removed" };
  } else {
    // 추가 (현재 최대 order_index + 1)
    const { data: maxOrder } = await supabase
      .from(TABLE)
      .select("order_index")
      .eq("user_id", email)
      .order("order_index", { ascending: false })
      .limit(1)
      .single();

    const nextOrder = (maxOrder?.order_index ?? -1) + 1;

    await supabase.from(TABLE).insert({
      user_id: email,
      path,
      order_index: nextOrder,
    });
    return { action: "added" };
  }
}

// 3. [NEW] 순서 변경 액션
export async function reorderFavoritesAction(
  items: { id: number; order_index: number }[]
) {
  const supabase = await createClient();

  // 여러 건 업데이트 (Promise.all 사용)
  const updates = items.map((item) =>
    supabase
      .from(TABLE)
      .update({ order_index: item.order_index })
      .eq("id", item.id)
  );

  await Promise.all(updates);

  revalidatePath("/"); // 캐시 갱신
  return { success: true };
}
