"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

const TABLE = "memo";

// 1. 메모 리스트 조회
export async function getMemosAction(academyCode: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("academy_code", academyCode)
    .eq("show_yn", "Y")
    // 정렬: 고정(Y) 우선 -> 수정일(최신순)
    .order("fixed_yn", { ascending: false })
    .order("update_date", { ascending: false });

  if (error) {
    console.error("Get Memos Error:", error);
    return [];
  }

  return data;
}

// 2. 메모 추가/수정 (Upsert)
export async function upsertMemoAction(formData: any) {
  const supabase = await createClient();
  const now = new Date().toISOString();

  const memoData = {
    title: formData.title,
    content: formData.content,
    show_yn: "Y",
    fixed_yn: formData.fixedYn ? "Y" : "N",
    academy_code: formData.academyCode,
    updater_id: formData.userId, // 수정자
    update_date: now,
  };

  let error;

  if (formData.id) {
    // 수정
    const { error: updateError } = await supabase
      .from(TABLE)
      .update(memoData)
      .eq("id", formData.id);
    error = updateError;
  } else {
    // 추가
    const { error: insertError } = await supabase.from(TABLE).insert({
      ...memoData,
      register_id: formData.userId, // 등록자
      regist_date: now,
    });
    error = insertError;
  }

  if (error) {
    console.error("Upsert Memo Error:", error);
    return { success: false, message: "저장에 실패했습니다." };
  }

  revalidatePath("/memo");
  return { success: true, message: "저장되었습니다." };
}

// 3. 메모 삭제 (Soft Delete: show_yn = 'N')
export async function deleteMemoAction(id: number) {
  const supabase = await createClient();

  const { error } = await supabase
    .from(TABLE)
    .update({ show_yn: "N" })
    .eq("id", id);

  if (error) {
    console.error("Delete Memo Error:", error);
    return { success: false, message: "삭제에 실패했습니다." };
  }

  revalidatePath("/memo");
  return { success: true, message: "삭제되었습니다." };
}
