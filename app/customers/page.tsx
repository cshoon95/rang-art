import { Suspense } from "react";
import { cookies } from "next/headers";
import { Spinner } from "@/components/Spinner";
import CustomersClient from "./_components/CustomerClient";
import { getServerCustomerList } from "../_actions";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export default async function CustomersPage() {
  const session = await getServerSession(authOptions);

  // 2. session.user에서 academyCode 추출
  // (TypeScript 에러가 난다면 as any로 우회하거나 next-auth.d.ts 설정 필요)
  const user = session?.user as any;
  const academyCode = user?.academyCode;

  const customerList = await getServerCustomerList(academyCode);

  return (
    <Suspense fallback={<Spinner />}>
      <CustomersClient initialData={customerList} academyCode={academyCode} />
    </Suspense>
  );
}
