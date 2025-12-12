import React, { Suspense } from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import HomeClient from "./_components/HomeClient";
import Loading from "./_components/Loading";

export default async function HomePage() {
  // 1. 서버 세션 가져오기 (authOptions 필수)
  const session = await getServerSession(authOptions);

  // 2. session.user에서 academyCode 추출
  // (TypeScript 에러가 난다면 as any로 우회하거나 next-auth.d.ts 설정 필요)
  const user = session?.user as any;
  const academyCode = user?.academyCode;
  const userId = user?.id;

  // userId 부분에 오타가 있어 수정했습니다 ("serId={userI" -> userId)
  return (
    <Suspense fallback={<Loading />}>
      <HomeClient academyCode={academyCode} userId={userId} />
    </Suspense>
  );
}
