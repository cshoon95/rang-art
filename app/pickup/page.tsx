import { Suspense } from "react";
import {
  getServerPickupTimeList,
  getServerPickupDataList,
} from "@/api/pickup/server";
import PickupClient from "./_components/PickupClient";
import { cookies } from "next/headers";
import PickupSkeleton from "./_components/PickupSkeleton";

export default async function PickupPage() {
  const cookieStore = await cookies();
  const academyCode = "0";

  const [timeList, dataList] = await Promise.all([
    getServerPickupTimeList(academyCode),
    getServerPickupDataList(academyCode),
  ]);

  return (
    <Suspense fallback={<PickupSkeleton />}>
      <PickupClient initialTimeList={timeList} initialDataList={dataList} />
    </Suspense>
  );
}
