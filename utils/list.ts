/**
 * 학원 리스트
 */
export const ACADEMY_LIST = [
  { code: "0", name: "랑아트 미술학원 본원" },
  { code: "1", name: "랑아트 미술학원 일산점" },
  { code: "2", name: "무료체험" },
];

/**
 * 주중 리스트
 */
export const WEEKDAY_LIST = [
  { value: 0, label: "월" },
  { value: 1, label: "화" },
  { value: 2, label: "수" },
  { value: 3, label: "목" },
  { value: 4, label: "금" },
];

// 회비 테이블 상수
export const FEE_LIST: Record<string, string> = {
  "1": "90000",
  "2": "140000",
  "3": "180000",
  "4": "220000",
  "5": "280000",
};

/**
 * 재원 여부 상태 순서
 */
export const STATE_ORDER: { [key: string]: number } = {
  "0": 1, // 재원
  "3": 2, // 대기
  "1": 3, // 휴원
  "2": 4, // 퇴원
};

/**
 * 상태 리스트
 */
export const STATE_FILTER_OPTIONS = [
  { value: "all", label: "모든 상태" },
  { value: "0", label: "재원" },
  { value: "3", label: "대기" },
  { value: "1", label: "휴원" },
  { value: "2", label: "퇴원" },
];

/**
 * 수강 횟수 리스트
 */
export const COUNT_FILTER_OPTIONS = [
  { value: "all", label: "모든 횟수" },
  { value: "1", label: "주 1회" },
  { value: "2", label: "주 2회" },
  { value: "3", label: "주 3회" },
  { value: "4", label: "주 4회" },
  { value: "5", label: "주 5회" },
];

/**
 * 헤더를 가려야하는 페이지
 */
export const hideHeaderPath = ["/login", "/waiting", "/signup"];

/**
 * 헤더 타이틀을 가려야하는 페이지
 */
export const hideHeaderTitlePath = [
  "/schedule",
  "/pickup",
  "/signup",
  "/temp-schedule",
  "/customers",
  "/employee",
  "/memo",
  "/register",
  "/calendar",
  "/payment",
  "/cash-receipt",
];

// 직급 옵션 (학원 상황에 맞게 수정하세요)
export const LEVEL_OPTIONS = [
  { value: "1", label: "원장" },
  { value: "2", label: "부원장" },
  { value: "3", label: "선생님" },
  { value: "4", label: "아르바이트" },
  { value: "9", label: "관리자" },
];

// 재직 상태 옵션
export const STATE_OPTIONS = [
  { value: "Y", label: "재직" },
  { value: "N", label: "퇴사" },
  { value: "H", label: "휴직" },
];

// 직급 코드 변환 헬퍼 (DB 코드 -> 화면 표시용)
export const getEmployeeLevel = (code: number | string) => {
  // DB에서 숫자로 올 수도, 문자로 올 수도 있어 유연하게 처리
  const levelCode = Number(code);
  switch (levelCode) {
    case 1:
      return "원장님";
    case 2:
      return "부원장님";
    case 3:
      return "선생님";
    case 4:
      return "스탭";
    default:
      return "기타";
  }
};
