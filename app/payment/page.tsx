// 실제로는 세션(NextAuth 등)에서 가져와야 하는 정보입니다.

import PaymentClient from "./_components/PaymentClient";

// 예시로 고정된 값을 사용합니다.
const MOCK_USER = {
  academyCode: "ACADEMY_001",
  id: "admin_user",
};

export default function PaymentPage() {
  return (
    <main style={{ backgroundColor: "#f9f9fb", minHeight: "100vh" }}>
      <PaymentClient academyCode={"2"} userId={MOCK_USER.id} />
    </main>
  );
}
