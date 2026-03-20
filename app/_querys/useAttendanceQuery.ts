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
    staleTime: 1000 * 60, // 1분 캐시 (회원 추가/삭제 시 invalidateQueries로 즉시 갱신)
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
    mutationKey: ["upsertAttendance"],
    mutationFn: upsertAttendanceAction,
    onMutate: async (newRecord) => {
      // 1. 진행 중인 백그라운드 새로고침 잠시 중단
      await queryClient.cancelQueries({ queryKey: ["attendance"] });

      // 2. 만약을 대비해 기존 데이터 캡처 (에러 시 복구용)
      const previousData = queryClient.getQueriesData({
        queryKey: ["attendance"],
      });

      // 3. 서버 응답 기다리지 않고 🌟화면부터 즉시 수정 (낙관적 업데이트)🌟
      queryClient.setQueriesData({ queryKey: ["attendance"] }, (old: any) => {
        if (!Array.isArray(old)) return old;
        let updated = false;
        const next = old.map((item: any) => {
          if (
            item.student_id === newRecord.studentId &&
            item.date === newRecord.date
          ) {
            updated = true;
            return { ...item, content: newRecord.content };
          }
          return item;
        });
        if (!updated) {
          next.push({
            student_id: newRecord.studentId,
            date: newRecord.date,
            content: newRecord.content,
            name: newRecord.name,
          });
        }
        return next;
      });

      return { previousData };
    },
    onSuccess: () => {
      // 마지막 mutation 완료 시에만 토스트 (연속 입력 시 중복 방지)
      if (queryClient.isMutating({ mutationKey: ["upsertAttendance"] }) === 1) {
        addToast("출석이 저장되었어요", "success");
      }
    },
    onError: (err, newRecord, context) => {
      addToast("출석 정보 입력이 실패하였어요", "error");
      console.error(err);
      // 4. 진짜 통신 실패 시 즉시 이전 상태로 화면 롤백
      if (context?.previousData) {
        context.previousData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSettled: () => {
      // 🌟 핵심 최적화: 사용자가 다다닥 연속으로 입력할 때 무한 새로고침 방지
      // 큐에 대기 중인 [마지막] 입력이 끝났을 때만 DB를 전체 새로고침 합니다.
      if (queryClient.isMutating({ mutationKey: ["upsertAttendance"] }) === 1) {
        queryClient.invalidateQueries({ queryKey: ["attendance"] });
      }
    },
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
