import React from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; // ⚠️ authOptions가 정의된 경로로 수정해주세요
import RegisterClient from "./_components/RegisterClient";

export default async function RegisterPage() {
  // 1. 서버 세션 가져오기
  const session = await getServerSession(authOptions);

  // 2. 세션에서 academyCode 추출 (없으면 기본값 '2')
  // 타입스크립트 에러 방지를 위해 any 캐스팅 혹은 커스텀 타입 사용
  // const academyCode = (session?.user as any)?.academyCode;

  return <RegisterClient academyCode={"0"} />;
}
