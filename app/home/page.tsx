import React, { Suspense } from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import HomeClient from "./_components/HomeClient";
import Loading from "./_components/Loading";

export default async function HomePage() {
  // ✅ [테스트용] 스플래쉬 화면을 확인하기 위해 2.5초 대기
  // (개발 확인 후 이 줄은 지우시면 됩니다!)

  const session = await getServerSession(authOptions);

  // 세션에서 학원 코드 가져오기 (없으면 '0')
  const academyCode = "0";
  const userId = session?.user?.email || "";

  // userId 부분에 오타가 있어 수정했습니다 ("serId={userI" -> userId)
  return (
    <Suspense fallback={<Loading />}>
      <HomeClient academyCode={academyCode} userId={userId} />
    </Suspense>
  );
}
