// 실제로는 세션(NextAuth 등)에서 가져와야 하는 정보입니다.

import { id } from "date-fns/locale";
import { Suspense } from "react";
import PaymentClient from "./_components/PaymentClient";
import PaymentSkeleton from "./_components/PaymentSkeleton";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export default async function PaymentPage() {
  // 1. 서버 세션 가져오기 (authOptions 필수)
  const session = await getServerSession(authOptions);

  // 2. session.user에서 academyCode 추출
  // (TypeScript 에러가 난다면 as any로 우회하거나 next-auth.d.ts 설정 필요)
  const user = session?.user as any;
  const academyCode = user?.academyCode;
  const userId = user?.id;

  return (
    <Suspense fallback={<PaymentSkeleton />}>
      <PaymentClient academyCode={academyCode} userId={userId} />
    </Suspense>
  );
}
