import { GridValidRowModel } from "@mui/x-data-grid";
import Hangul from "hangul-js";
import { hideHeaderPath, hideHeaderTitlePath } from "./list";

/**
 * 빈 배열 여부
 * @param {Array} 배열
 * @returns
 */
export const isEmptyArr = (array: any[] | GridValidRowModel): boolean => {
  if (!array) return true;
  if (array.length > 0) return false;
  return true;
};

/**
 * 리스트의 value 가져오기.
 */
export const getLabel = (list: any[], value: any) => {
  return list.filter((item: any) => item.value === value)[0]?.label;
};

// 초성검색 (검색어, 비교할 단어)
export const extractInitialConsonants = (search: string): string => {
  // 2번째 인자로 true를 전달하면 글자마다 독립된 배열을 만들어준다
  const disassemble = Hangul.disassemble(search, true);
  let cho = "";

  for (let i = 0; i < disassemble.length; i++) {
    cho += disassemble[i][0];
  }

  return cho;
};

export const getColumnVisibilityModel = (arr: any[]) => {
  return arrayToObject(getHideColumns(arr));
};

/**
 * 배열을 오브젝트 형태로.
 * @param {Array} 배열
 * @returns {Object} 오브젝트
 */
export const arrayToObject = (arr: any[]) => {
  return arr.reduce((obj: any, item: any) => {
    const key = Object.keys(item)[0]; // 각 객체의 키를 가져옴
    obj[key] = item[key]; // 새로운 객체에 키와 값 추가
    return obj;
  }, {});
};

export const getHideColumns = (arr: any[]) => {
  const newArray = arr
    .filter((item) => {
      return item.hide === true;
    })
    .map((item) => {
      return { [item.field]: false };
    });

  return newArray;
};
/**
 * 빈 오브젝트 여부
 * @param {Object} 객체
 * @returns
 */
export const isEmptyObj = (obj: Object) => {
  if (!obj || (obj.constructor === Object && Object.keys(obj).length === 0)) {
    return true;
  }

  return false;
};

export const calculateStartDate = (year: string, month: string) => {
  // 현재 월을 숫자로 변환
  const numericMonth = Number(month);

  // 두 달 전 계산
  let startMonth = numericMonth - 2;
  let startYear = Number(year);

  // 월이 1 이하일 경우, 작년으로 이동
  if (startMonth <= 0) {
    startMonth += 12; // 12개월을 더해 작년의 해당 월로 변환
    startYear -= 1; // 연도를 작년으로 변경
  }

  // 월을 두 자리로 맞춤 (예: 1 -> "01")
  const formattedMonth =
    startMonth < 10 ? `0${startMonth}` : String(startMonth);

  // 시작 날짜 반환 (형식: "YYYYMM01")
  return `${startYear}${formattedMonth}01`;
};

/**
 * 헤더 숨김 페이지 여부
 */
export const isHiddenHeaderPage = (path: string) => {
  return hideHeaderPath.includes(path);
};

/**
 * 헤더 타이틀 숨김 페이지 여부
 */
export const isHiddenHeaderTitlePage = (path: string) => {
  return hideHeaderTitlePath.includes(path);
};

/**
 * 재원여부 상태 한글값 가져오기
 */
export const getStateLabel = (state: string) => {
  switch (state) {
    case "0":
      return "재원";
    case "1":
      return "휴원";
    case "2":
      return "퇴원";
    case "3":
      return "대기";
    default:
      return "미정";
  }
};

/**
 * 재직여부 상태 한글명 가져오기
 */
export const getEmployeeTenure = (state: string) => {
  let result = "";

  switch (state) {
    case "0":
      result = "재직";
      break;
    case "1":
      result = "퇴직";
      break;
    case "2":
      result = "휴직";
      break;
    default:
      break;
  }

  return result;
};
