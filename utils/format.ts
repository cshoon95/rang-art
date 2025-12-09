import Hangul from "hangul-js";

/** 한화로 */
export function replaceMoneyKr(
  money: string | number | undefined,
  hideSymbol?: boolean
) {
  if (typeof money === "undefined") {
    return;
  }

  if (typeof money === "string") {
    money = Number(money);
  }

  if (hideSymbol) {
    return money?.toLocaleString("ko-KR");
  }

  return "₩" + money?.toLocaleString("ko-KR");
}

/**
 * 단어의 마지막 음절에 따라 '을' 또는 '를'을 반환
 */
export const getParticle = (word: string) => {
  const lastChar = word[word.length - 1];
  const code = lastChar.charCodeAt(0) - 44032;
  const finalConsonant = code % 28;

  return finalConsonant !== 0 ? "을" : "를";
};

/** 오직 영문+숫자만 */
export const replaceOnlyEngNum = (str: string): string => {
  return str.replace(/[^a-zA-Z0-9]/g, "");
};

/** 오직 숫자만 */
export const replaceOnlyNum = (str: string | number): string => {
  if (!str) return "";

  if (typeof str === "number") {
    return str.toString();
  }

  return str.replace(/[^0-9]/g, "");
};

/** 첫글자 0인 경우 0 제거. */
export const replaceFirstRemoveZero = (str?: string | number): string => {
  if (!str) return "";
  if (typeof str === "number") {
    str = str.toString();
  }

  return str.replace(/(^0+)/, "");
};

/** 첫글자에 0 추가 */
export const replaceFirstPadZero = (str: string | number): string => {
  if (typeof str === "number") {
    str = str.toString();
  }

  // 기존 코드에서 substring의 매개변수를 바르게 조정합니다.
  if (str.substring(0, 1) === "0") {
    return str;
  }

  if (str.length === 2) {
    return str;
  }

  // 기존 코드에서 조건식을 수정합니다.
  if (str.length === 0) {
    return "0";
  }

  return "0" + str;
};

/** 돈 단위 포맷. */
export const replaceUnitMoney = (money: number) => {
  const unitWords = ["", "만", "억", "조", "경"];
  const splitUnit = 10000;
  const resultArray: any = [];
  let resultString = "";

  unitWords.forEach((item: any, i: number) => {
    let unitResult =
      (money % Math.pow(splitUnit, i + 1)) / Math.pow(splitUnit, i);
    unitResult = Math.floor(unitResult);

    if (unitResult > 0) {
      resultArray[i] = unitResult;
    }
  });

  for (let i = 0; i < resultArray.length; i++) {
    const resultArrayStr = String(resultArray[i]);

    if (!resultArray[i]) {
      continue;
    }

    resultString = resultArrayStr + unitWords[i] + resultString;
  }

  if (!resultString) {
    resultString = "0";
  }

  return `${resultString}원`;
};

export const replacePhoneType = (value: string) => {
  value = value.replace(/[^0-9]/g, "");

  let result = [];
  let restNumber = "";

  // 지역번호와 나머지 번호로 나누기
  if (value.startsWith("02")) {
    // 서울 02 지역번호
    result.push(value.substr(0, 2));
    restNumber = value.substring(2);
  } else if (value.startsWith("1")) {
    // 지역 번호가 없는 경우
    // 1xxx-yyyy
    restNumber = value;
  } else {
    // 나머지 3자리 지역번호
    // 0xx-yyyy-zzzz
    result.push(value.substr(0, 3));
    restNumber = value.substring(3);
  }

  if (restNumber.length === 7) {
    // 7자리만 남았을 때는 xxx-yyyy
    result.push(restNumber.substring(0, 3));
    result.push(restNumber.substring(3));
  } else {
    result.push(restNumber.substring(0, 4));
    result.push(restNumber.substring(4));
  }

  return result.filter((val) => val).join("-");
};

/** 입력한 숫자 이후부터는 ...으로 표기. */
export const replaceTextAbbreviation = (str: string, num: number) => {
  if (str.length < num) {
    return str;
  }

  return str.substring(0, num) + "...";
};

/** 시간 형식으로 */
export const replaceTimeFormat = (str: any): string => {
  if (!str) return "";
  if (typeof str === "number") {
    str = str.toString();
  }
  return str.replace(/(\d{2})(\d{2})/, "$1:$2");
};

/**
 * 시간 형식으로
 * 1800 -> 18:00
 */
export const replaceTimePattern = (time: string) => {
  if (!time) return "";

  // "0400" 처럼 4자리 숫자 문자열인 경우
  if (time.length === 4 && !time.includes(":")) {
    return `${time.substring(0, 2)}:${time.substring(2, 4)}`;
  }

  // 이미 "04:00" 형식이거나 다른 형식이면 그대로 반환
  return time;
};

/**
 * 일반 형식으로
 * 18:00 -> 1800
 */
export const removeTimePattern = (time: string) => {
  if (!time) return "";

  // ":" 가 있으면 제거하여 반환 (예: "18:00" -> "1800")
  return time.replace(":", "");
};

/**
 * 휴대폰, 날짜 포맷
 */
export const replaceHyphenFormat = (str: string, type: string): string => {
  let result = str;

  switch (type) {
    case "phone":
      result = str?.replace(/(\d{3})(\d{4})(\d{2})/, "$1-$2-$3");
      break;
    case "date":
      result = str?.replace(/(\d{4})(\d{2})(\d{2})/, "$1-$2-$3");
      break;
  }

  return result;
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
