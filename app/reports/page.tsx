import { Metadata } from "next";
import { getServerSession } from "next-auth"; // [참고] 서버 컴포넌트 권장
// import { authOptions } from "@/utils/auth"; // authOptions 경로에 맞게 수정 필요
import ReportsClient from "./_components/ReportsClient";
import {
  getMonthlyTotalAction,
  getCustomerStatsAction,
  getServerCustomerList,
} from "../_actions";
import { authOptions } from "@/lib/auth";
export const metadata: Metadata = {
  title: "통계",
};

// ✅ [수정 1] 데이터 타입 정의
interface PaymentData {
  month: string;
  total: number;
  count?: number;
}

interface ReportData {
  month: string;
  join: number;
  leave: number;
  total: number;
}

export default async function ReportsPage() {
  // 1. 서버 세션 가져오기 (authOptions 필수)
  const session = await getServerSession(authOptions);

  // 2. session.user에서 academyCode 추출
  // (TypeScript 에러가 난다면 as any로 우회하거나 next-auth.d.ts 설정 필요)
  const user = session?.user as any;
  const academyCode = user?.academyCode;
  const userId = user?.id;

  // 2. 현재 연도 기준 데이터 조회
  const currentYear = new Date().getFullYear().toString();

  // 3. 서버 액션 병렬 호출 및 ✅ [수정 2] 타입 단언(as) 적용
  // 결과 배열의 순서대로 타입을 명시해줍니다.
  const [incomeData, expenditureData, customerData, originCustomerData] =
    (await Promise.all([
      getMonthlyTotalAction(currentYear, "income", academyCode),
      getMonthlyTotalAction(currentYear, "expenditure", academyCode),
      getCustomerStatsAction(currentYear, academyCode),
      getServerCustomerList(academyCode),
    ])) as [PaymentData[], PaymentData[], ReportData[], any[]];

  // 4. 데이터 병합
  const chartData = Array.from({ length: 12 }, (_, i) => {
    const monthStr = String(i + 1).padStart(2, "0"); // "01", "02"...

    // ✅ [수정 3] 위에서 타입을 지정했으므로 이제 .find() 결과가 PaymentData | undefined 가 됩니다.
    // 따라서 .total 접근 시 에러가 발생하지 않습니다.
    const incomeItem = incomeData.find((d) => d.month === monthStr);
    const expendItem = expenditureData.find((d) => d.month === monthStr);
    const customerItem = customerData.find((d) => d.month === monthStr);

    return {
      month: `${i + 1}월`,
      income: incomeItem?.total || 0,
      incomeCount: incomeItem?.count || 0, // [추가] Client 컴포넌트에서 쓰길래 추가함
      expenditure: expendItem?.total || 0,
      join: customerItem?.join || 0,
      leave: customerItem?.leave || 0,
      totalMembers: customerItem?.total || 0,
    };
  });

  // 5. 클라이언트 컴포넌트에 데이터 전달
  return (
    <ReportsClient
      academyCode={academyCode}
      initialChartData={chartData}
      currentServerYear={Number(currentYear)}
      customerList={originCustomerData}
    />
  );
}
