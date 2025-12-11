import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getAttendanceListAction,
  getActiveStudentsAction,
  upsertAttendanceAction,
  getStudentAttendanceHistoryAction,
} from "./actions";
// 학생 목록
export const useGetStudents = (academyCode: string) => {
  return useQuery({
    queryKey: ["attendance-students", academyCode],
    queryFn: () => getActiveStudentsAction(academyCode),
  });
};

// 출석 데이터
export const useGetAttendance = (
  academyCode: string,
  startDate: string,
  endDate: string
) => {
  return useQuery({
    queryKey: ["attendance", academyCode, startDate, endDate],
    queryFn: () => getAttendanceListAction(academyCode, startDate, endDate),
  });
};

// 출석 입력
export const useUpsertAttendance = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: upsertAttendanceAction,
    onSuccess: () => {
      // 쿼리 무효화로 데이터 최신화
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
    },
  });
};

export const useGetStudentAttendanceHistory = (
  academyCode: string,
  name: string,
  isOpen: boolean // 모달이 열려있을 때만 실행하기 위한 조건
) => {
  return useQuery({
    // 캐싱 키: 학생 ID나 학원 코드가 바뀌면 데이터를 다시 가져옵니다.
    queryKey: ["student-attendance-history", name, academyCode],

    queryFn: async () => {
      // 방어 코드: 필수 값이 없으면 서버 요청을 보내지 않고 빈 배열 반환
      if (!name) {
        return [];
      }

      // 서버 액션 호출
      return await getStudentAttendanceHistoryAction(academyCode, name);
    },

    // 🌟 실행 조건: 모달 Open + 학생정보 존재 + 학원코드 유효
    enabled: isOpen && !!name,
  });
};
