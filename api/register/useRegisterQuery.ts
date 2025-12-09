import { useQuery } from "@tanstack/react-query";
import {
  getRegisterReportAction,
  getStudentPaymentDataAction,
} from "./actions";

export const useRegisterReport = (academyCode: string, year: string) => {
  return useQuery({
    queryKey: ["registerReport", academyCode, year],
    queryFn: () => getRegisterReportAction(academyCode, year),
    enabled: !!academyCode && !!year,
  });
};

export const useStudentPaymentData = (
  academyCode: string,
  year: string,
  name: string | null // 이름이 있을 때만 조회
) => {
  return useQuery({
    queryKey: ["studentPayment", academyCode, year, name],
    queryFn: () => getStudentPaymentDataAction(academyCode, year, name!),
    enabled: !!academyCode && !!year && !!name, // 조건 충족 시 실행
  });
};
