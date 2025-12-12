import React, { Suspense } from "react";
import AttendanceClient from "./_components/AttendanceClient";
import { getServerSession } from "next-auth"; // ✅ 서버용 함수
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; // ✅ 설정 파일 import
import Loading from "../home/_components/Loading";

export default async function AttendancePage() {
  // 1. 서버 세션 가져오기 (authOptions 필수)
  const session = await getServerSession(authOptions);

  // 2. session.user에서 academyCode 추출
  // (TypeScript 에러가 난다면 as any로 우회하거나 next-auth.d.ts 설정 필요)
  const user = session?.user as any;
  const academyCode = user?.academyCode;

  return (
    <Suspense fallback={<Loading />}>
      {/* 3. Client Component로 전달 */}
      <AttendanceClient academyCode={academyCode} />
    </Suspense>
  );
}
