import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import CashReceiptClient from "./_components/CashReceiptClient";

export default async function CashReceiptPage() {
  const session = await getServerSession(authOptions);
  // 세션에서 academyCode, userId 가져오기 (구조에 맞게 수정)
  const academyCode = "0";
  const userId = session?.user?.email || "unknown";

  return <CashReceiptClient academyCode={academyCode} userId={userId} />;
}
