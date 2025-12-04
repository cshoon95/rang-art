"use client";

import { useRouter } from "next/navigation";
import {
  Clock,
  Bus,
  CalendarCheck,
  ChevronRight,
  RefreshCw,
} from "lucide-react";

// 공통 카드 컴포넌트
const DashboardCard = ({
  title,
  icon: Icon,
  children,
  onClick,
  onMore,
}: any) => (
  <div
    onClick={onClick}
    className="bg-white rounded-[24px] p-6 shadow-[0_2px_16px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] transition-shadow duration-300 cursor-pointer border border-[#f0f0f0]"
  >
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2.5">
        <div className="w-10 h-10 rounded-full bg-[#f2f4f6] flex items-center justify-center text-[#3182f6]">
          <Icon size={20} strokeWidth={2.5} />
        </div>
        <h2 className="text-lg font-bold text-[#191f28]">{title}</h2>
      </div>
      {onMore && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onMore();
          }}
          className="text-[#8b95a1] hover:text-[#4e5968] transition-colors flex items-center text-sm font-medium"
        >
          전체보기 <ChevronRight size={16} />
        </button>
      )}
    </div>
    <div className="space-y-3">{children}</div>
  </div>
);

// 리스트 아이템 컴포넌트 (시간표 한 줄)
const ScheduleItem = ({ time, content, subContent }: any) => (
  <div className="flex items-start gap-4 py-1">
    <span className="text-[#8b95a1] font-semibold text-sm w-12 pt-1">
      {time}
    </span>
    <div className="flex-1 flex flex-wrap gap-2">
      {/* 메인 컨텐츠 (파란 뱃지) */}
      <span className="px-3 py-1.5 bg-[#e8f3ff] text-[#1b64da] font-semibold text-[15px] rounded-[8px]">
        {content}
      </span>
      {/* 서브 컨텐츠 (회색 뱃지) */}
      {subContent && (
        <span className="px-3 py-1.5 bg-[#f2f4f6] text-[#4e5968] text-[14px] font-medium rounded-[8px]">
          {subContent}
        </span>
      )}
    </div>
  </div>
);

export default function HomeDashboard() {
  const router = useRouter();

  return (
    <div className="space-y-6 pb-20">
      {/* 상단 환영 메시지 */}
      <div className="flex justify-between items-end mb-2 px-2">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-[#191f28] leading-tight">
            반가워요, 원장님 👋
            <br />
            오늘도 힘찬 하루 되세요!
          </h1>
        </div>
        <span className="text-[#8b95a1] font-medium text-sm bg-white px-3 py-1.5 rounded-full shadow-sm border border-[#f0f0f0]">
          2025년 12월 3일 (수)
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* 1. 수업 시간표 */}
        <DashboardCard
          title="수업 시간표"
          icon={Clock}
          onMore={() => router.push("/schedule")}
        >
          {/* 데이터 매핑 예시 */}
          <ScheduleItem
            time="14:00"
            content="이서연"
            subContent="한연우 신하율"
          />
          <ScheduleItem
            time="14:30"
            content="유연서 고은솔"
            subContent="나지유 이재윤"
          />
          <div className="h-px bg-gray-50 my-2" /> {/* 구분선 */}
          <ScheduleItem time="15:00" content="김민준" />
        </DashboardCard>

        <div className="flex flex-col gap-5">
          {/* 2. 픽업 시간표 */}
          <DashboardCard
            title="픽업 시간표"
            icon={Bus}
            onMore={() => router.push("/pickup")}
          >
            <ScheduleItem
              time="14:30"
              content="나지유 유연서"
              subContent="고은솔 이재윤"
            />
            <ScheduleItem
              time="16:00"
              content="조윤지 이유진"
              subContent="조민하 서아진"
            />
          </DashboardCard>

          {/* 3. 오늘의 일정 */}
          <DashboardCard
            title="오늘의 일정"
            icon={CalendarCheck}
            onClick={() => {
              /* 모달 오픈 */
            }}
          >
            <div className="bg-[#f9fafb] rounded-xl p-4 border border-[#f0f0f0]">
              <div className="flex justify-between items-start mb-2">
                <span className="font-bold text-[#333d4b]">주원 5:15 보충</span>
                <span className="text-xs text-red-500 font-bold bg-red-50 px-2 py-1 rounded">
                  중요
                </span>
              </div>
              <div className="text-[#4e5968] text-sm space-y-1">
                <p>• 서우 결석</p>
                <p>• 원우 태우 3:30</p>
              </div>
            </div>
          </DashboardCard>
        </div>
      </div>

      {/* 플로팅 액션 버튼 (새로고침) */}
      <button className="fixed bottom-6 right-6 w-14 h-14 bg-[#3182f6] text-white rounded-full shadow-[0_4px_20px_rgba(49,130,246,0.4)] flex items-center justify-center hover:scale-105 transition-transform active:scale-95">
        <RefreshCw size={24} />
      </button>
    </div>
  );
}
