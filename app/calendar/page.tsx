import { getServerSession } from "next-auth"; // Auth 설정에 맞게 변경
import CalendarClient from "./_components/CalendarClient";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// React Query Hydration을 위해 필요하다면 여기서 Prefetching 가능
// 하지만 지금은 Client Component에서 데이터를 fetching하도록 구성했습니다.

export default async function CalendarPage() {
  // 1. 서버 세션 가져오기 (authOptions 필수)
  const session = await getServerSession(authOptions);

  // 2. session.user에서 academyCode 추출
  // (TypeScript 에러가 난다면 as any로 우회하거나 next-auth.d.ts 설정 필요)
  const user = session?.user as any;
  const academyCode = user?.academyCode;
  const userId = user?.id;

  return <CalendarClient academyCode={academyCode} userId={userId} />;
}
