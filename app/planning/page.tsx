import React from "react";
import PlanningClient from "./_components/PlanningClient";
import { getSession } from "next-auth/react";

export default async function PlanningPage() {
  const session = await getSession();
  const academyCode = "0";

  if (!academyCode) {
    return <div>로그인이 필요합니다.</div>;
  }

  return <PlanningClient academyCode={academyCode} userId={""} />;
}
