// app/lib/data.ts

// ─────────────────────────────
// 공통 타입
// ─────────────────────────────
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
  status: string;   // 위 Status 중 하나지만, 혹시 몰라 string
  reason: string;
  approved: boolean;
  seatId?: string;
  password?: string;
};

export type TeacherUser = {
  id: string;       // 로그인할 때 쓰는 값 (ex. "윤인하")
  name: string;     // 표시용
  password: string;
};

export type SchedulerItem = {
  studentId: string;
  name: string;
  status: string;   // "변경안함" 포함
  reason: string;
};

export type SchedulerPlan = {
  day: string;      // "mon" ...
  slot: string;     // "8교시" ...
  items: SchedulerItem[];
};

// ─────────────────────────────
// 전역에 한 번만 만들어두기
// ─────────────────────────────
const g = globalThis as unknown as {
  __schoolData?: {
    students: Student[];
    teacherUsers: TeacherUser[];
    schedulerStore: Record<string, SchedulerPlan>;
    schedulerEnabled: boolean;
    lastDailyReset: string | null;
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
    schedulerStore: {},          // "mon|8교시": { ... } 이런 식으로 들어감
    schedulerEnabled: true,      // 자동 적용 켜짐
    lastDailyReset: null,        // 오늘 8시에 재실로 초기화 했는지 표시
  };
}

// ─────────────────────────────
// 외부에서 쓸 수 있게 export
// ─────────────────────────────
export const students = g.__schoolData.students;
export const teacherUsers = g.__schoolData.teacherUsers;
export const schedulerStore = g.__schoolData.schedulerStore;
export const schedulerEnabledRef = g.__schoolData; // enabled, lastDailyReset 둘 다 있음

// ─────────────────────────────
// (필요하면) 하루 한 번 08:00 이후에 전체 재실로 돌리는 유틸
// 지금은 GET에서 안 부르게 해도 되고, 나중에 다시 쓰면 됨.
// ─────────────────────────────
export function ensureDailyReset() {
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10); // "2025-11-11"
  const hour = now.getHours();

  if (hour >= 8 && g.__schoolData!.lastDailyReset !== todayStr) {
    for (const s of g.__schoolData!.students) {
      s.status = "재실";
      s.reason = "";
      // approved는 그대로
    }
    g.__schoolData!.lastDailyReset = todayStr;
  }
}
