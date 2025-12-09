// src/api/calendar/type.ts

export interface CalendarRow {
  id: number;
  content: string;
  start_date: string;
  start_time: string;
  end_date: string;
  end_time: string;
  created_at: string;

  // 🌟 [추가] DB 컬럼과 매칭
  type: string; // 'event' | 'school_holiday'

  register_id?: string;
  updater_id?: string;
}

export interface CalendarFormData {
  content: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  // 👇 여기에 type이 없으면 API 함수가 값을 무시할 수 있습니다.
  type?: string;
  isHoliday?: boolean;
}
export interface MappedEvent {
  id: number | string;
  title: string;
  start: Date;
  end: Date;
  resource: any;
  type: "event" | "holiday"; // 캘린더 라이브러리용 타입
  substitute?: boolean;
}
