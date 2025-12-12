// 실제로는 세션(NextAuth 등)에서 가져와야 하는 정보입니다.

import { id } from "date-fns/locale";
import { Suspense } from "react";
import PaymentClient from "./_components/PaymentClient";
import PaymentSkeleton from "./_components/PaymentSkeleton";

// 예시로 고정된 값을 사용합니다.
const MOCK_USER = {
  academyCode: "ACADEMY_001",
  id: "admin_user",
};

export default function PaymentPage() {
  return (
    <Suspense fallback={<PaymentSkeleton />}>
      <PaymentClient academyCode={"0"} userId={"ss"} />
    </Suspense>
  );
}
