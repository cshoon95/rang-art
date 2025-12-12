import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getServerSession } from "next-auth";
import CashReceiptClient from "./_components/CashReceiptClient";
import { cookies } from "next/headers";

export default async function CashReceiptPage() {
  // 1. 서버 세션 가져오기 (authOptions 필수)
  const session = await getServerSession(authOptions);

  // 2. session.user에서 academyCode 추출
  // (TypeScript 에러가 난다면 as any로 우회하거나 next-auth.d.ts 설정 필요)
  const user = session?.user as any;
  const academyCode = user?.academyCode;
  const userId = user?.id;

  return <CashReceiptClient academyCode={academyCode} userId={userId} />;
}
