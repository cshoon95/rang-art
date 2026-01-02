import React, { Suspense } from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getPrevMonthLastDataAction } from "@/app/_actions";
import { startOfMonth, subDays, format } from "date-fns";
import Loading from "../home/_components/Loading";
import AttendanceClient from "./_components/AttendanceClient";

export default async function AttendancePage() {
  // 1. 세션 및 학원 코드 가져오기
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  const academyCode = user?.academyCode;

  // 2. [서버 최적화] 전월 데이터 미리 가져오기
  // 클라이언트 useEffect에서 하던 것을 서버에서 병렬 처리하여 초기 렌더링 시점에 즉시 보여줍니다.
  let initialPrevData: Record<string, string> = {};

  if (academyCode) {
    try {
      const now = new Date();
      const currentStart = startOfMonth(now);
      const prevMonthEnd = format(subDays(currentStart, 1), "yyyy-MM-dd");

      // 서버 액션 직접 호출
      initialPrevData =
        (await getPrevMonthLastDataAction(academyCode, prevMonthEnd)) || {};
    } catch (error) {
      console.error("Initial Prev Data Fetch Error:", error);
    }
  }

  return (
    <Suspense fallback={<Loading />}>
      {/* 3. 클라이언트 컴포넌트에 초기 데이터 전달 */}
      <AttendanceClient
        academyCode={academyCode}
        initialPrevData={initialPrevData}
      />
    </Suspense>
  );
}
