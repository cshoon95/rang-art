// import { Suspense } from "react";
// import { getServerCustomerList } from "@/api/customers/server";
// import CustomerClient from "./_components/CustomerClient";
// import { cookies } from "next/headers";
// import { Spinner } from "@/shared-components"; // 로딩 스피너

// export default async function CustomerPage() {
//   const cookieStore = await cookies();
//   const academyCode = cookieStore.get("academyCode")?.value || "2"; // 기본값 설정

//   // 서버에서 데이터 가져오기
//   const customers = await getServerCustomerList(academyCode);

//   return (
//     <Suspense fallback={<Spinner />}>
//       <CustomerClient initialCustomers={customers} />
//     </Suspense>
//   );
// }
