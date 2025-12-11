import { getServerSession } from "next-auth"; // Auth 설정에 맞게 변경
import CalendarClient from "./_components/CalendarClient";

// React Query Hydration을 위해 필요하다면 여기서 Prefetching 가능
// 하지만 지금은 Client Component에서 데이터를 fetching하도록 구성했습니다.

export default async function CalendarPage() {
  // 실제 세션 정보를 가져오는 로직 (예시)
  // const session = await getServerSession(authOptions);
  // const academyCode = session?.user?.academyCode || "TEST_ACADEMY";
  // const userId = session?.user?.id || "TEST_USER";

  // 더미 데이터
  const academyCode = "0";
  const userId = "TEACHER_01";

  return <CalendarClient academyCode={academyCode} userId={userId} />;
}
