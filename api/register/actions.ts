"use server";

import { createClient } from "@/utils/supabase/server";

// 월별 데이터 조회 및 가공
export async function getRegisterReportAction(
  academyCode: string,
  year: string
) {
  const supabase = await createClient();

  // 1. 해당 연도의 모든 수납 내역 조회
  const { data: rawData, error } = await supabase
    .from("payment")
    .select("id, name, month, day, fee")
    .eq("academy_code", academyCode)
    .eq("year", year)
    .order("name", { ascending: true }); // 이름순 정렬

  if (error) {
    console.error("Get Register Report Error:", error);
    return { list: [], total: {} };
  }

  // 2. 데이터 가공 (학생별, 월별 매핑)
  const reportMap = new Map<string, any>();
  const monthTotals: Record<string, number> = {}; // 월별 합계 저장용

  // 1~12월 초기화
  for (let i = 1; i <= 12; i++) {
    const m = String(i).padStart(2, "0");
    monthTotals[m] = 0;
  }

  rawData.forEach((item: any) => {
    // 학생 데이터 초기화
    if (!reportMap.has(item.name)) {
      reportMap.set(item.name, {
        name: item.name,
        months: {},
        totalSum: 0,
      });
    }

    const studentData = reportMap.get(item.name);
    const monthKey = String(item.month).padStart(2, "0"); // "01", "02"...

    // 해당 월에 데이터가 이미 있으면 합산 (같은 달에 2번 결제한 경우 등)
    if (!studentData.months[monthKey]) {
      studentData.months[monthKey] = {
        fee: 0,
        day: "",
        items: [], // 상세 내역 보관
      };
    }

    const currentMonthData = studentData.months[monthKey];

    // 금액 합산
    const fee = Number(item.fee || 0);
    currentMonthData.fee += fee;

    // 날짜 표시 (여러 건이면 콤마로 구분하거나 가장 최근 것 사용)
    // 여기서는 기존 로직처럼 단순화하여 표시
    if (item.day) {
      currentMonthData.day = item.day; // 마지막 날짜 덮어쓰기 or 로직 수정 가능
    }

    // 학생별 총계 누적
    studentData.totalSum += fee;

    // 전체 월별 합계 누적
    monthTotals[monthKey] += fee;
  });

  // Map -> Array 변환
  const list = Array.from(reportMap.values());

  // 전체 총합 계산
  const grandTotal = Object.values(monthTotals).reduce((a, b) => a + b, 0);

  return {
    list, // 학생별 리스트
    monthTotals, // 월별 총 합계 { "01": 1000, "02": 2000 ... }
    grandTotal, // 전체 총 합계
  };
}

// ✅ 특정 학생 납입증명서용 데이터 조회
export async function getStudentPaymentDataAction(
  academyCode: string,
  year: string,
  name: string
) {
  const supabase = await createClient();

  // 1. 해당 학생의 1년치 결제 내역 조회
  const { data, error } = await supabase
    .from("payment")
    .select("month, fee, day, note, year") // 필요한 컬럼만
    .eq("academy_code", academyCode)
    .eq("year", year)
    .eq("name", name)
    .order("month", { ascending: true });

  if (error) {
    console.error("Get Student Payment Error:", error);
    return [];
  }

  // 2. 1월~12월 데이터 채우기 (빈 달은 0원으로)
  const result = Array.from({ length: 12 }, (_, i) => {
    const month = String(i + 1).padStart(2, "0");
    const payment = data.find(
      (p) => String(p.month).padStart(2, "0") === month
    );

    return {
      month,
      fee: payment ? Number(payment.fee) : 0,
      day: payment?.day || "",
      note: payment?.note || "",
    };
  });

  return result;
}
