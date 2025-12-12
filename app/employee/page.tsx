import React from "react";
import EmployeesClient from "./_components/EmployeesClient";
import { cookies } from "next/headers";
import { getEmployees } from "../_actions";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export default async function EmployeesPage() {
  // 1. 서버 세션 가져오기 (authOptions 필수)
  const session = await getServerSession(authOptions);

  // 2. session.user에서 academyCode 추출
  // (TypeScript 에러가 난다면 as any로 우회하거나 next-auth.d.ts 설정 필요)
  const user = session?.user as any;
  const academyCode = user?.academyCode;
  const userId = user?.id;

  // 이미 포맷팅된 데이터를 가져옴
  const formattedData = await getEmployees(academyCode);

  return (
    <EmployeesClient initialData={formattedData} academyCode={academyCode} />
  );
}
