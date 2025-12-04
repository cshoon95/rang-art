import { Suspense } from "react";
import TempScheduleClient from "./_components/TempScheduleClient";
import { cookies } from "next/headers";
import {
  getTempScheduleTimeListAction,
  getTempScheduleDataListAction,
} from "@/api/temp-schedule/server";

export default async function SchedulePage() {
  // 쿠키에서 학원 코드 가져오기 (로그인 방식에 따라 다를 수 있음)
  const cookieStore = await cookies();
  const academyCode = cookieStore.get("academyCode")?.value || "2";

  // 병렬로 데이터 Fetching
  const [timeList, dataList] = await Promise.all([
    getTempScheduleTimeListAction(academyCode),
    getTempScheduleDataListAction(academyCode),
  ]);

  return (
    <Suspense fallback={<></>}>
      <TempScheduleClient
        initialTimeList={timeList}
        initialDataList={dataList}
      />
    </Suspense>
  );
}
