import { Suspense } from "react";
import ScheduleClient from "./_components/ScheduleClient";
import { cookies } from "next/headers";

import ScheduleSkeleton from "./_components/ScheuldeSkeleton";
import {
  getScheduleDataListAction,
  getScheduleTimeListAction,
} from "../_actions";

export default async function SchedulePage() {
  // 쿠키에서 학원 코드 가져오기 (로그인 방식에 따라 다를 수 있음)
  const cookieStore = await cookies();
  const academyCode = "0";

  // 병렬로 데이터 Fetching
  const [timeList, dataList] = await Promise.all([
    getScheduleTimeListAction(academyCode),
    getScheduleDataListAction(academyCode),
  ]);

  return (
    <Suspense fallback={<ScheduleSkeleton />}>
      <ScheduleClient initialTimeList={timeList} initialDataList={dataList} />
    </Suspense>
  );
}
