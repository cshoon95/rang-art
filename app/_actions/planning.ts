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

// 2. 저장 (등록/수정) - 다중 이미지 지원
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

  // ✅ [수정 1] 기존 이미지 리스트 가져오기 (삭제되지 않고 남은 이미지들)
  // 클라이언트에서 JSON.stringify(existingImages) 형태로 보내줘야 함
  const currentImagesJson = formData.get("currentImages") as string;
  let finalImages: string[] = currentImagesJson
    ? JSON.parse(currentImagesJson)
    : [];

  // ✅ [수정 2] 새로 업로드된 파일들 처리 (getAll 사용)
  const files = formData.getAll("files") as File[];

  if (files && files.length > 0) {
    for (const file of files) {
      // 파일 크기가 0인 빈 파일 객체가 들어올 수 있으므로 체크
      if (file.size > 0) {
        const fileExt = file.name.split(".").pop();
        // 파일명 충돌 방지를 위해 uuid 사용
        const fileName = `${academyCode}/${year}_${month}_${type}_${uuidv4()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("planning-images")
          .upload(fileName, file, { upsert: true });

        if (uploadError) {
          console.error("Image Upload Failed:", uploadError);
          continue; // 실패 시 해당 이미지는 건너뜀 (혹은 에러 throw)
        }

        const { data: publicUrlData } = supabase.storage
          .from("planning-images")
          .getPublicUrl(fileName);

        // 새 이미지 URL을 배열에 추가
        finalImages.push(publicUrlData.publicUrl);
      }
    }
  }

  // ✅ [수정 3] Payload 구성
  const payload: any = {
    academy_code: academyCode,
    year,
    month,
    type,
    title,
    content,
    // images 컬럼(배열)에 저장
    images: finalImages,
    // 하위 호환성을 위해 첫 번째 이미지를 image_url에도 넣어줌 (선택 사항)
    image_url: finalImages.length > 0 ? finalImages[0] : null,
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
