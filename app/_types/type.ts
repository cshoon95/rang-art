export interface AttendanceRecord {
  id: number;
  student_id: string;
  date: string;
  content: string; // '1', '2', 'L', '1.2' 등
  note?: string;
}

export interface StudentSimple {
  id: string;
  name: string;
  state: string; // '0': 재원, '1': 휴원 등
  count: number; // 주 1회, 2회 등 (기준 데이터)
}

// src/api/calendar/type.ts

export interface CalendarRow {
  id: number;
  content: string;
  start_date: string;
  start_time: string;
  end_date: string;
  end_time: string;
  created_at: string;

  // 🌟 [추가] DB 컬럼과 매칭
  type: string; // 'event' | 'school_holiday'

  register_id?: string;
  updater_id?: string;
}

export interface CalendarFormData {
  content: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  // 👇 여기에 type이 없으면 API 함수가 값을 무시할 수 있습니다.
  type?: string;
  isHoliday?: boolean;
}
export interface MappedEvent {
  id: number | string;
  title: string;
  start: Date;
  end: Date;
  resource: any;
  type: "event" | "holiday"; // 캘린더 라이브러리용 타입
  substitute?: boolean;
}

// src/lib/types.ts
export type PaymentType = "income" | "expenditure";

// 수입/지출 공통 필드 + 개별 필드 통합
export interface PaymentItem {
  id: number;
  year: string;
  month: string;
  day: string;

  // 수입(income) 전용
  name?: string;
  fee?: number;
  card?: string;
  register?: string; // 'Y' | 'N'

  // 지출(expenditure) 전용
  item?: string;
  amount?: number;
  kind?: string;

  // 공통
  note?: string;
  academy_code: string;
  created_at?: string;
  updater_id?: string;
}

// src/lib/utils.ts
export const getTodayYear = () => new Date().getFullYear().toString();
export const getTodayMonth = () =>
  (new Date().getMonth() + 1).toString().padStart(2, "0");

export const replaceOnlyNum = (str: string | number) =>
  String(str).replace(/[^0-9]/g, "");
export const replaceFirstPadZero = (str: string) => str.padStart(2, "0");

// 한글 초성 검색을 위한 간단한 유틸 (외부 라이브러리 없이 구현 예시)
// 실무에서는 'hangul-js' 같은 라이브러리 사용 권장
export const extractInitialConsonants = (str: string) => {
  const CHOSUNG = [
    "ㄱ",
    "ㄲ",
    "ㄴ",
    "ㄷ",
    "ㄸ",
    "ㄹ",
    "ㅁ",
    "ㅂ",
    "ㅃ",
    "ㅅ",
    "ㅆ",
    "ㅇ",
    "ㅈ",
    "ㅉ",
    "ㅊ",
    "ㅋ",
    "ㅌ",
    "ㅍ",
    "ㅎ",
  ];
  return str
    .split("")
    .map((char) => {
      const code = char.charCodeAt(0) - 44032;
      if (code > -1 && code < 11172) return CHOSUNG[Math.floor(code / 588)];
      return char;
    })
    .join("");
};

export type PlanningType = "normal" | "special" | "temporary";

export interface PlanningRow {
  id: number;
  academy_code: string;
  year: number;
  month: number;
  type: PlanningType;
  title: string;
  content: string;
  image_url: string | null;
  register_id: string;
  created_at: string;
}

export interface PlanningParams {
  year: number;
  month: number;
  type: PlanningType;
  academyCode: string;
}
