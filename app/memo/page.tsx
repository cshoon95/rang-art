import React, { Suspense } from "react";
import { cookies } from "next/headers";
import MemoClient from "./_components/MemoClient";
import MemoSkeleton from "./_components/MemoSkeleton";
import { getMemosAction } from "@/api/favorites/actions";

export default async function MemoPage() {
  const cookieStore = await cookies();
  const academyCode = cookieStore.get("academyCode")?.value || "2";

  const memos = await getMemosAction(academyCode);

  return (
    <Suspense fallback={<MemoSkeleton />}>
      <MemoClient initialData={memos} academyCode={academyCode} />;
    </Suspense>
  );
}
