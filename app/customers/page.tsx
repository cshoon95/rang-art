import { Suspense } from "react";
import { cookies } from "next/headers";
import { Spinner } from "@/components/Spinner";
import CustomersClient from "./_components/CustomerClient";
import { getServerCustomerList } from "../_actions";

export default async function CustomersPage() {
  const cookieStore = await cookies();
  const academyCode = cookieStore.get("academyCode")?.value || "2";
  const userRole = cookieStore.get("userRole")?.value || "admin";

  const customerList = await getServerCustomerList(academyCode);

  return (
    <Suspense fallback={<Spinner />}>
      <CustomersClient
        initialData={customerList}
        academyCode={academyCode}
        userRole={userRole}
      />
    </Suspense>
  );
}
