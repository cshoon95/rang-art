import { Suspense } from "react";
import { cookies } from "next/headers";
import { getServerCalendarList } from "@/api/calendar/server";
import CalendarClient from "./_components/CalendarClient"; // 또는 CalendarClient
import { Spinner } from "@/components/Spinner";
export default async function CalendarPage() {
  const cookieStore = await cookies();
  const academyCode = cookieStore.get("academyCode")?.value || "2";

  // 필요하다면 Promise.all로 여러 데이터를 동시에 호출합니다 (예: 휴일정보, 캘린더 등)
  // 현재는 캘린더 리스트만 가져오는 예시입니다.
  const [calendarList] = await Promise.all([
    getServerCalendarList(academyCode),
  ]);

  return (
    <Suspense fallback={<Spinner />}>
      <CalendarClient
        initialCalendarList={calendarList}
        academyCode={academyCode}
      />
    </Suspense>
  );
}
