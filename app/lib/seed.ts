// app/lib/seed.ts
import { redis } from "./redis";

export const STUDENTS_KEY = "school:students";
export const TEACHERS_KEY = "school:teachers";
export const SCHED_KEY_PREFIX = "school:scheduler:";

// 새로 추가
export const SCHED_ENABLED_KEY = "school:scheduler:enabled";
export const DAILY_RESET_KEY = "school:daily-reset";

/* ────────────────────────────────
   초기 학생 데이터
──────────────────────────────── */
const initialStudents = [
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
  { id: "11128", name: "함주완", status: "재실", reason: "", approved: true, seatId: "11128", password: "12345678" },
  { id: "11127", name: "최준성", status: "재실", reason: "", approved: true, seatId: "11127", password: "12345678" },
  { id: "11103", name: "김서준", status: "재실", reason: "", approved: true, seatId: "11103", password: "12345678" },
  { id: "11107", name: "김주헌", status: "재실", reason: "", approved: true, seatId: "11107", password: "12345678" },

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
];

/* ────────────────────────────────
   초기 교사 데이터
──────────────────────────────── */
const initialTeachers = [
  { id: "윤인하", name: "윤인하 선생님", password: "admin" },
  { id: "이도현", name: "이도현 학생", password: "admin" },
  { id: "함주완", name: "함주완 학생", password: "admin" },
  { id: "최배겸", name: "최배겸 학생", password: "admin" },
  { id: "최준성", name: "최준성 학생", password: "admin" },
];

/* ────────────────────────────────
   Redis에 기본값 보장
──────────────────────────────── */
export async function ensureSeed() {
  const [students, teachers, schedEnabled] = await redis.mget([
    STUDENTS_KEY,
    TEACHERS_KEY,
    SCHED_ENABLED_KEY,
  ]);

  if (!students) await redis.set(STUDENTS_KEY, initialStudents);
  if (!teachers) await redis.set(TEACHERS_KEY, initialTeachers);
  if (schedEnabled === null) await redis.set(SCHED_ENABLED_KEY, true); // 기본 ON
}
