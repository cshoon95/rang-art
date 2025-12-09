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
