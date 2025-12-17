import { Suspense } from "react";

import PickupClient from "./_components/PickupClient";
import { cookies } from "next/headers";
import PickupSkeleton from "./_components/PickupSkeleton";
import {
  getServerPickupTimeList,
  getServerPickupDataList,
} from "../_actions/schedule";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export default async function PickupPage() {
  // 1. 서버 세션 가져오기 (authOptions 필수)
  const session = await getServerSession(authOptions);

  // 2. session.user에서 academyCode 추출
  // (TypeScript 에러가 난다면 as any로 우회하거나 next-auth.d.ts 설정 필요)
  const user = session?.user as any;
  const academyCode = user?.academyCode;
  const userId = user?.id;

  const [timeList, dataList] = await Promise.all([
    getServerPickupTimeList(academyCode),
    getServerPickupDataList(academyCode),
  ]);

  return (
    <Suspense fallback={<PickupSkeleton />}>
      <PickupClient
        initialTimeList={timeList}
        initialDataList={dataList}
        academyCode={academyCode}
        userId={userId}
      />
    </Suspense>
  );
}
