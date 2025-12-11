import React, { Suspense } from "react";
import AttendanceClient from "./_components/AttendanceClient";
import { getSession } from "next-auth/react";
import Loading from "../home/_components/Loading";

export default async function AttendancePage() {
  const session = await getSession();
  const academyCode = "0";

  return (
    <Suspense fallback={<Loading />}>
      <AttendanceClient academyCode={academyCode} />
    </Suspense>
  );
}
