// app/lib/data.ts

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

export type SchedulerItem = {
  studentId: string;
  name: string;
  status: string;
  reason: string;
};

export type SchedulerPlan = {
  day: string;
  slot: string;
  items: SchedulerItem[];
};

const g = globalThis as unknown as {
  __schoolData?: {
    students: Student[];
    teacherUsers: TeacherUser[];
    schedulerStore: Record<string, SchedulerPlan>;
    schedulerEnabled: boolean;     // ✅ 스케줄러 on/off
    lastDailyReset: string | null; // ✅ "2025-11-10" 이런 포맷
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

      // 5줄 (정민건 제거된 상태라 가정)
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
    schedulerStore: {},
    schedulerEnabled: true,   // 기본 ON
    lastDailyReset: null,     // 아직 안함
  };
}

// 이거 내보내서 api들이 매번 호출하게 할 거야
export const students = g.__schoolData.students;
export const teacherUsers = g.__schoolData.teacherUsers;
export const schedulerStore = g.__schoolData.schedulerStore;
export const schedulerEnabledRef = g.__schoolData; // enabled랑 lastDailyReset 둘 다 여기 있음

// ✅ 하루 한 번, 08:00 이후에 처음 호출됐을 때 전원 재실
export function ensureDailyReset() {
  const now = new Date();

  // 한국시간 기준이면 여기서 +9 해도 되고, 지금은 서버 시간이 한국이라고 가정
  const todayStr = now.toISOString().slice(0, 10); // "2025-11-10"
  const hour = now.getHours();

  // 8시 이후고, 오늘 아직 안했으면
  if (hour >= 8 && g.__schoolData!.lastDailyReset !== todayStr) {
    for (const s of g.__schoolData!.students) {
      s.status = "재실";
      s.reason = "";
      // 허가여부는 그대로 두는게 자연스럽다고 보고 그대로 둠
    }
    g.__schoolData!.lastDailyReset = todayStr;
  }
}
