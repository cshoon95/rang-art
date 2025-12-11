import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import CashReceiptClient from "./_components/CashReceiptClient";
import { cookies } from "next/headers";

export default async function CashReceiptPage() {
  const cookieStore = await cookies();
  const academyCode = cookieStore.get("academyCode")?.value || "0";
  const userId = cookieStore.get("userRole")?.value || "admin";

  return <CashReceiptClient academyCode={academyCode} userId={userId} />;
}
