"use server";

import { createClient } from "@/utils/supabase/server";
import { v4 as uuidv4 } from "uuid";

// 1. 조회
export async function getPlanningAction(params: {
  year: number;
  month: number;
  type: string;
  academyCode: string;
}) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("planning")
    .select("*")
    .eq("academy_code", params.academyCode)
    .eq("year", params.year)
    .eq("month", params.month)
    .eq("type", params.type)
    .single();

  if (error && error.code !== "PGRST116") return null;
  return data;
}

// 2. 저장 (등록/수정)
export async function upsertPlanningAction(formData: FormData) {
  const supabase = await createClient();

  const id = formData.get("id") as string;
  const academyCode = formData.get("academyCode") as string;
  const year = Number(formData.get("year"));
  const month = Number(formData.get("month"));
  const type = formData.get("type") as string;
  const title = formData.get("title") as string;
  const content = formData.get("content") as string;
  const userId = formData.get("userId") as string;
  const file = formData.get("file") as File | null;
  const currentImageUrl = formData.get("currentImageUrl") as string;

  let imageUrl = currentImageUrl;

  // 이미지 업로드 로직
  if (file && file.size > 0) {
    const fileExt = file.name.split(".").pop();
    const fileName = `${academyCode}/${year}_${month}_${type}_${uuidv4()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("planning-images")
      .upload(fileName, file, { upsert: true });

    if (uploadError) throw new Error("이미지 업로드 실패");

    const { data: publicUrlData } = supabase.storage
      .from("planning-images")
      .getPublicUrl(fileName);

    imageUrl = publicUrlData.publicUrl;
  }

  const payload: any = {
    academy_code: academyCode,
    year,
    month,
    type,
    title,
    content,
    image_url: imageUrl,
    register_id: userId,
    updated_at: new Date().toISOString(),
  };

  if (id) payload.id = Number(id);

  const { data, error } = await supabase
    .from("planning")
    .upsert(payload)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

// 3. 삭제
export async function deletePlanningAction(id: number) {
  const supabase = await createClient();
  const { error } = await supabase.from("planning").delete().eq("id", id);
  if (error) throw new Error(error.message);
  return true;
}
