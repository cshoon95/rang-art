import { Suspense } from "react";
import ScheduleClient from "./_components/ScheduleClient";
import { cookies } from "next/headers";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import ScheduleSkeleton from "./_components/ScheuldeSkeleton";
import {
  getScheduleDataListAction,
  getScheduleTimeListAction,
} from "../_actions";
import { getServerSession } from "next-auth";

export default async function SchedulePage() {
  // 1. 서버 세션 가져오기 (authOptions 필수)
  const session = await getServerSession(authOptions);

  // 2. session.user에서 academyCode 추출
  // (TypeScript 에러가 난다면 as any로 우회하거나 next-auth.d.ts 설정 필요)
  const user = session?.user as any;
  const academyCode = user?.academyCode;
  const userId = user?.id;

  // 병렬로 데이터 Fetching
  const [timeList, dataList] = await Promise.all([
    getScheduleTimeListAction(academyCode),
    getScheduleDataListAction(academyCode),
  ]);

  return (
    <Suspense fallback={<ScheduleSkeleton />}>
      <ScheduleClient
        initialTimeList={timeList}
        initialDataList={dataList}
        academyCode={academyCode}
        userId={userId}
      />
    </Suspense>
  );
}
