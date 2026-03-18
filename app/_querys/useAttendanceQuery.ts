import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getActiveStudentsAction,
  getAttendanceListAction,
  upsertAttendanceAction,
  getStudentAttendanceHistoryAction,
  getInActiveStudentsAction,
} from "../_actions/attendance";
import { useToastStore } from "@/store/toastStore";

// 학생 목록 (재원)
export const useGetStudents = (academyCode: string) => {
  return useQuery({
    queryKey: ["attendance-students", academyCode],
    queryFn: () => getActiveStudentsAction(academyCode),
    // 🌟 [최적화 1] 탭을 전환해도 5분 동안은 다시 로딩하지 않고 즉시 보여줌
    staleTime: 1000 * 60 * 5,
  });
};

// 학생 목록 (퇴원)
export const useGetInActiveStudents = (academyCode: string) => {
  return useQuery({
    queryKey: ["in-active-attendance-students", academyCode],
    queryFn: () => getInActiveStudentsAction(academyCode),
    staleTime: 1000 * 60 * 5,
  });
};

// 출석 데이터
export const useGetAttendance = (
  academyCode: string,
  startDate: string,
  endDate: string,
) => {
  return useQuery({
    queryKey: ["attendance", academyCode, startDate, endDate],
    queryFn: () => getAttendanceListAction(academyCode, startDate, endDate),
    // 🌟 [최적화 2] 출석 데이터 역시 5분간 캐싱하여 체감 속도 극대화
    staleTime: 1000 * 60 * 5,
  });
};

// 출석 입력
export const useUpsertAttendance = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToastStore();
  return useMutation({
    mutationFn: upsertAttendanceAction,
    onSuccess: () => {
      // 쿼리 무효화로 데이터 최신화
      addToast("출석 정보가 저장되었어요");
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
    },
    onError: () => addToast("출석 정보 입력이 실패하였어요"),
  });
};

export const useGetStudentAttendanceHistory = (
  academyCode: string,
  studentId: string | number,
  isOpen: boolean, // 모달이 열려있을 때만 실행하기 위한 조건
) => {
  return useQuery({
    // 캐싱 키: 학생 ID나 학원 코드가 바뀌면 데이터를 다시 가져옵니다.
    queryKey: ["student-attendance-history", studentId, academyCode],

    queryFn: async () => {
      // 방어 코드: 필수 값이 없으면 서버 요청을 보내지 않고 빈 배열 반환
      if (!studentId) {
        return [];
      }

      // 서버 액션 호출
      return await getStudentAttendanceHistoryAction(
        academyCode,
        Number(studentId),
      );
    },

    // 🌟 실행 조건: 모달 Open + 학생정보 존재 + 학원코드 유효
    enabled: isOpen && !!studentId,
  });
};
