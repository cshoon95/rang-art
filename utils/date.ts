import dayjs from "dayjs";
import "dayjs/locale/ko";
import weekOfYear from "dayjs/plugin/weekOfYear";
import { replaceFirstPadZero } from "./format";

export interface ISelectAttendDayTypes {
  SOL_STR_DATE: string;
  SOL_MM: string;
  SOL_DD: string;
  NUM_WEEK: number;
  STR_WEEK: string;
  HOLIDAY: number | string;
  SOL_PLAN: string;
  SHOW_YN: string;
}

dayjs.extend(weekOfYear);
dayjs.locale("ko");

/** 오늘 일자 가져오기. */
export const getTodayDay = () => {
  return (new Date().getDay() - 1).toString();
};

/** 오늘 월 가져오기. */
export const getTodayMonth = () => {
  return ("00" + (new Date().getMonth() + 1).toString()).slice(-2);
};

/** 오늘 연도 가져오기. */
export const getTodayYear = () => {
  return new Date().getFullYear().toString();
};

export const getTodayDate = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = ("0" + (today.getMonth() + 1)).slice(-2);
  const day = ("0" + today.getDate()).slice(-2);

  return year + "-" + month + "-" + day;
};

/** 현재 시간 가져오기 */
export const getTodayTime = () => {
  const today = new Date();
  const hours = today.getHours(); // 시
  const minutes = today.getMinutes(); // 분

  return replaceFirstPadZero(hours) + ":" + replaceFirstPadZero(minutes);
};

/**
 * 날짜 포멧팅
 * @param {string} date 날짜 형식의 문자열 {yyyymmdd || mmdd}
 * @param {boolean} isSplit 연도 형식 날짜의 문자열 월일형식 날짜열로 변경
 * @param {string} type 'md'의 경우 일자만 가져옴
 * @returns {string} 날짜 포맷
 * @see
 * 20220101 -> 2022년01월01일
 * 0101 -> 01월01일
 */
export const replaceDateFormat = (
  date: string,
  isSplit: boolean = false,
  type?: string
): string => {
  if (!date) return date;
  if (date.length > 4) {
    if (type === "md") return date.substring(6, 8) + "일";

    return isSplit
      ? date.substring(4, 6) + "월 " + date.substring(6, 8) + "일"
      : date.substring(0, 4) +
          "년 " +
          date.substring(4, 6) +
          "월 " +
          date.substring(6, 8) +
          "일";
  } else {
    return date.substring(0, 2) + "월 " + date.substring(2, 4) + "일";
  }
};

/**
 * 0을 제거한 날짜 포맷팅
 * @param {string} date 날짜 형식의 문자열 {yyyymmdd}
 * @returns {string} 포맷된 날짜
 * @see
 * 20240801 -> 2024. 8. 1
 * 20241225 -> 2024. 12. 25
 */
export const replaceDateFormatWithoutLeadingZero = (date: string): string => {
  if (!date || date.length !== 8) return date;

  const year = date.substring(0, 4); // 연도 추출
  const month = String(Number(date.substring(4, 6))); // 월 추출 후 0 제거
  const day = String(Number(date.substring(6, 8))); // 일 추출 후 0 제거

  return `${year}. ${month}. ${day}`;
};

/**
 * 학원 등록 D+Day
 * @category 날짜/시간
 * @param {string} strDate "YYYY-MM-DD" 형태의 문자열.
 * @return {number} date2 - date1 일수. date2이 date1보다 이전 날짜면 음수값으로 반환.
 */
export const daysBetween = (strDate: string): number => {
  const yyyy = Number(strDate.substring(0, 4));
  const mm = Number(strDate.substring(4, 6)) - 1;
  const dd = Number(strDate.substring(6, 8));

  const date = new Date(yyyy, mm, dd);
  const today = new Date();

  const elapsedMSec = today.getTime() - date.getTime();
  const elapsedDay = elapsedMSec / 1000 / 60 / 60 / 24;

  // 1일 부터 시작
  return Math.trunc(elapsedDay) + 1;
};

export const getAge = (birthday: string) => {
  birthday = birthday.replace(/-/gi, ""); // '-' 문자 모두 '' 변경
  const birthdate = new Date(
    Number(birthday.substring(0, 4)),
    Number(birthday.substring(4, 6)),
    Number(birthday.substring(6, 8))
  );
  const today = new Date();
  const yearDiff = today.getFullYear() - birthdate.getFullYear();
  const monthDiff = today.getMonth() - birthdate.getMonth();
  const dateDiff = today.getDate() - birthdate.getDate();

  const isBeforeBirthDay = monthDiff < 0 || (monthDiff === 0 && dateDiff < 0);

  return yearDiff + (isBeforeBirthDay ? -1 : 0);
};

/** 날짜 포맷 YYmdd. */
export const sysdate = (date: Date, format?: string): string => {
  const yy = date.getFullYear();
  const mm = ("0" + (date.getMonth() + 1)).slice(-2);
  const dd = ("0" + date.getDate()).slice(-2);

  if (format) return yy + format + mm + format + dd;

  return yy + mm + dd;
};

/** 시간 포맷 hhmmss */
export const systime = (date: Date, format?: string): string => {
  const hh = ("0" + date.getHours()).slice(-2);
  const mm = ("0" + date.getMinutes()).slice(-2);
  const ss = ("0" + date.getSeconds()).slice(-2);

  if (format) return hh + format + mm + format + "00";

  return hh + mm + ss;
};

/** 휴일 set */
export const getHolidayList = (dayListQuery: ISelectAttendDayTypes[]) => {
  return (
    dayListQuery &&
    dayListQuery
      .filter((info: ISelectAttendDayTypes) => info.HOLIDAY === 1)
      .map((data: ISelectAttendDayTypes) => {
        const newData: ISelectAttendDayTypes = { ...data };

        newData.SOL_STR_DATE = replaceDateFormatWithoutLeadingZero(
          data.SOL_STR_DATE
        );
        newData.HOLIDAY = data.HOLIDAY === 1 ? "O" : "X";
        newData.SHOW_YN = data.SHOW_YN === "Y" ? "O" : "X";

        return newData;
      })
  );
};

/** 날짜 포맷팅 2024. 9. 11 -> 20240911 */
export const formatDateString = (dateString: string) => {
  let parts = dateString
    .trim()
    .split(".")
    .map((part) => part.trim());

  // 연도는 그대로, 월과 일이 한 자리라면 앞에 '0'을 추가
  const year = parts[0];
  const month = parts[1].padStart(2, "0");
  const day = parts[2].padStart(2, "0");

  return year + month + day;
};

/** 특정 날짜 가져오기 (YYYY-mm-dd). */
export const getSpecificDayDate = (dayNum: number) => {
  const today = new Date();
  const yesterDay = new Date(today.setDate(today.getDate() - dayNum));
  const year = yesterDay.getFullYear();
  const month = ("0" + (yesterDay.getMonth() + 1)).slice(-2);
  const day = ("0" + yesterDay.getDate()).slice(-2);
  const res = year + "-" + month + "-" + day;

  return res;
};

/**
 * 날짜를 포맷형태로 리턴
 * @param 20200101 string
 * @param 'YYYY.MM.DD
 * @returns 포맷화된 날짜
 */
export const convertDateFormat = (value?: string, format?: string): string => {
  if (!value) {
    return "";
  }
  try {
    return dayjs(value).format(format || "YYYY.MM.DD");
  } catch (err) {
    console.error(err);

    return "";
  }
};

/**
 * 금액 표시
 */
export const getAmountFormat = (
  amount?: number | string,
  options?: Intl.NumberFormatOptions
) => {
  // 변환 객체
  const convert = getNumberFormatObject(undefined, undefined, options);

  let convertAmout = amount;
  if (typeof amount === "string") {
    convertAmout = Number(amount.replaceAll(",", ""));
  }

  // 9007199254740992 ~ -9007199254740992 사이인 숫자인 경우
  return Number.isSafeInteger(convertAmout)
    ? convert.format(Number(convertAmout))
    : "";
};

/**
 * Intl.NumberFormat 객체 생성
 * @param options
 * @returns
 */
export const getNumberFormatObject = (
  locale = "ko-KR",
  currency = "KRW",
  options?: Intl.NumberFormatOptions
): Intl.NumberFormat => {
  return new Intl.NumberFormat(locale, { currency, ...options });
};

export const getTodayFormattedDate = () => {
  const today = new Date();

  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0"); // 월은 0부터 시작하므로 +1
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}${month}${day}`;
};

export const formatTodayDate = (date: string) => {
  const today = new Date(date);
  const dateFormatter = new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(today);

  const dayFormatter = new Intl.DateTimeFormat("ko-KR", {
    weekday: "short",
  }).format(today);

  return `${dateFormatter} (${dayFormatter})`;
};

// 특정 요일의 날짜를 계산하는 함수
export const getMondayOfWeek = (dateString: string, targetDay: number) => {
  const date = new Date(dateString); // 주어진 날짜를 Date 객체로 변환
  const currentDay = date.getDay() - 1; // 현재 요일 (0: 일요일, 1: 월요일, ..., 6: 토요일)
  const diff = targetDay - currentDay; // 목표 요일까지의 차이 계산

  const targetDate = new Date(date);
  targetDate.setDate(date.getDate() + diff); // 날짜를 이동

  return targetDate?.toISOString().split("T")[0]; // "YYYY-MM-DD" 형식으로 반환
};

// string 타입의 Date 문자열을 포멧팅에 맞게 변경
export const formatToKoreanDateTime = (isoString: string): string => {
  if (!isoString) {
    return "";
  }

  const date = new Date(isoString);

  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    timeZone: "Asia/Seoul",
  };

  const formatter = new Intl.DateTimeFormat("ko-KR", options);
  const parts = formatter.formatToParts(date);

  const getValue = (type: string): string => {
    const part = parts.find((p) => p.type === type);
    if (!part) throw new Error(`Missing part for type: ${type}`);
    return part.value;
  };

  const year = getValue("year");
  const month = getValue("month");
  const day = getValue("day");
  const hour = getValue("hour");
  const minute = getValue("minute");

  return `${year}년 ${month}월 ${day}일 ${hour}시 ${minute}분`;
};

// 날짜 포맷 헬퍼 (YYYYMMDD -> YYYY-MM-DD)
export const formatDateToInput = (dateStr: string) => {
  if (!dateStr || dateStr.length !== 8) return "";
  return dateStr.replace(/(\d{4})(\d{2})(\d{2})/, "$1-$2-$3");
};

/**
 * DDay 가져오기
 */
export const getDDay = (dateString: string) => {
  if (!dateString) return "";
  const year = parseInt(dateString.substring(0, 4));
  const month = parseInt(dateString.substring(4, 6)) - 1;
  const day = parseInt(dateString.substring(6, 8));
  const startDate = new Date(year, month, day);
  const today = new Date();
  const diffTime = Math.abs(today.getTime() - startDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return `D+${diffDays}`;
};
