import React from "react";
import { cookies } from "next/headers";
import { getMemosAction } from "@/api/memo/actions";
import MemoClient from "./_components/MemoClient";

export default async function MemoPage() {
  const cookieStore = await cookies();
  const academyCode = cookieStore.get("academyCode")?.value || "2";

  const memos = await getMemosAction(academyCode);

  return <MemoClient initialData={memos} academyCode={academyCode} />;
}
