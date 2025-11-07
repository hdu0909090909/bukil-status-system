// app/lib/data.ts

// 상태 종류
export type Status =
  | "재실"
  | "미디어스페이스"
  | "귀가"
  | "외출"
  | "호실자습"
  | "아단관 강당3"
  | "아단관 강의실"
  | "방과후수업"
  | "동아리 활동"
  | "교내활동"
  | "보건실 요양"
  | "상담"
  | "기타";

export type Student = {
  id: string;
  name: string;
  status: string;
  reason: string;
  approved: boolean;
  seatId?: string;
  password?: string;
};

export type TeacherUser = {
  id: string;
  name: string;
  password: string;
};

// 스케줄에 한 줄
export type SchedulerItem = {
  studentId: string;
  name: string;
  status: string; // "변경안함" 포함
  reason: string;
};

// day|slot 하나에 저장되는 거
export type SchedulerPlan = {
  day: string;   // "mon"
  slot: string;  // "8교시"
  items: SchedulerItem[];
};

// 🔴 개발 중에 hot reload 돼도 데이터 안 날리려고 globalThis에 박아둠
const g = globalThis as unknown as {
  __schoolData?: {
    students: Student[];
    teacherUsers: TeacherUser[];
    schedulerStore: Record<string, SchedulerPlan>;
  };
};

if (!g.__schoolData) {
  g.__schoolData = {
    students: [
      // 1줄
      { id: "11115", name: "이도현", status: "재실", reason: "", approved: true, seatId: "11115", password: "12345678" },
      { id: "11130", name: "황도운", status: "재실", reason: "", approved: true, seatId: "11130", password: "12345678" },
      { id: "11125", name: "진승우", status: "재실", reason: "", approved: true, seatId: "11125", password: "12345678" },
      { id: "11106", name: "김유민", status: "재실", reason: "", approved: true, seatId: "11106", password: "12345678" },
      { id: "11124", name: "조주형", status: "재실", reason: "", approved: true, seatId: "11124", password: "12345678" },
      { id: "11110", name: "박시온", status: "재실", reason: "", approved: true, seatId: "11110", password: "12345678" },

      // 2줄
      { id: "11119", name: "이지온", status: "재실", reason: "", approved: true, seatId: "11119", password: "12345678" },
      { id: "11108", name: "김지섭", status: "재실", reason: "", approved: true, seatId: "11108", password: "12345678" },
      { id: "11120", name: "이진우", status: "재실", reason: "", approved: true, seatId: "11120", password: "12345678" },
      { id: "11118", name: "이예찬", status: "재실", reason: "", approved: true, seatId: "11118", password: "12345678" },
      { id: "11102", name: "김사무엘", status: "재실", reason: "", approved: true, seatId: "11102", password: "12345678" },
      { id: "11126", name: "최배겸", status: "재실", reason: "", approved: true, seatId: "11126", password: "12345678" },

      // 3줄
      { id: "11127", name: "최준성", status: "재실", reason: "", approved: true, seatId: "11127", password: "12345678" },
      { id: "11128", name: "함주완", status: "재실", reason: "", approved: true, seatId: "11128", password: "12345678" },
      { id: "11121", name: "전주형", status: "재실", reason: "", approved: true, seatId: "11121", password: "12345678" },
      { id: "11103", name: "김서준", status: "재실", reason: "", approved: true, seatId: "11103", password: "12345678" },
      { id: "11107", name: "김주헌", status: "재실", reason: "", approved: true, seatId: "11107", password: "12345678" },
      { id: "11111", name: "손지우", status: "재실", reason: "", approved: true, seatId: "11111", password: "12345678" },

      // 4줄
      { id: "11112", name: "송준서", status: "재실", reason: "", approved: true, seatId: "11112", password: "12345678" },
      { id: "11101", name: "김규민", status: "재실", reason: "", approved: true, seatId: "11101", password: "12345678" },
      { id: "11129", name: "허준우", status: "재실", reason: "", approved: true, seatId: "11129", password: "12345678" },
      { id: "11117", name: "이승화", status: "재실", reason: "", approved: true, seatId: "11117", password: "12345678" },
      { id: "11116", name: "이승우", status: "재실", reason: "", approved: true, seatId: "11116", password: "12345678" },

      // 5줄
      { id: "11104", name: "김연수", status: "재실", reason: "", approved: true, seatId: "11104", password: "12345678" },
      { id: "11109", name: "박경민", status: "재실", reason: "", approved: true, seatId: "11109", password: "12345678" },
      { id: "11113", name: "안준영", status: "재실", reason: "", approved: true, seatId: "11113", password: "12345678" },
    ],
    teacherUsers: [
      { id: "윤인하", name: "윤인하 선생님", password: "admin" },
      { id: "이도현", name: "이도현 학생", password: "admin" },
      { id: "함주완", name: "함주완 학생", password: "admin" },
      { id: "최배겸", name: "최배겸 학생", password: "admin" },
    ],
    schedulerStore: {}, // 비어있다가 /api/scheduler 로 채움
  };
}

export const students = g.__schoolData.students;
export const teacherUsers = g.__schoolData.teacherUsers;
export const schedulerStore = g.__schoolData.schedulerStore;
