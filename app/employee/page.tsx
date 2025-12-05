import React from "react";
import EmployeesClient from "./_components/EmployeesClient";
import { cookies } from "next/headers";
import { getEmployees } from "@/api/employee/server";

export default async function EmployeesPage() {
  const cookieStore = await cookies();
  const academyCode = cookieStore.get("academyCode")?.value || "2";

  // 이미 포맷팅된 데이터를 가져옴
  const formattedData = await getEmployees(academyCode);

  return (
    <EmployeesClient initialData={formattedData} academyCode={academyCode} />
  );
}
