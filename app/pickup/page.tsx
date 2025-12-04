import { Suspense } from "react";
import {
  getServerPickupTimeList,
  getServerPickupDataList,
} from "@/api/pickup/server";
import PickupClient from "./_components/PickupClient";
import { cookies } from "next/headers";

export default async function PickupPage() {
  const cookieStore = await cookies();
  const academyCode = cookieStore.get("academyCode")?.value || "2";

  const [timeList, dataList] = await Promise.all([
    getServerPickupTimeList(academyCode),
    getServerPickupDataList(academyCode),
  ]);

  return (
    <Suspense fallback={<></>}>
      <PickupClient initialTimeList={timeList} initialDataList={dataList} />
    </Suspense>
  );
}
