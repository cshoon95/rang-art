import React, { Suspense } from "react";
import { cookies } from "next/headers";
import MemoClient from "./_components/MemoClient";
import MemoSkeleton from "./_components/MemoSkeleton";
import { getMemosAction } from "../_actions";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getServerSession } from "next-auth";

export default async function MemoPage() {
  // 1. 서버 세션 가져오기 (authOptions 필수)
  const session = await getServerSession(authOptions);

  // 2. session.user에서 academyCode 추출
  // (TypeScript 에러가 난다면 as any로 우회하거나 next-auth.d.ts 설정 필요)
  const user = session?.user as any;
  const academyCode = user?.academyCode;
  const userId = user?.id;

  const memos = await getMemosAction(academyCode);

  return (
    <Suspense fallback={<MemoSkeleton />}>
      <MemoClient initialData={memos} academyCode={academyCode} />
    </Suspense>
  );
}
