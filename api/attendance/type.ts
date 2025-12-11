export interface AttendanceRecord {
  id: number;
  student_id: string;
  date: string;
  content: string; // '1', '2', 'L', '1.2' 등
  note?: string;
}

export interface StudentSimple {
  id: string;
  name: string;
  state: string; // '0': 재원, '1': 휴원 등
  count: number; // 주 1회, 2회 등 (기준 데이터)
}
