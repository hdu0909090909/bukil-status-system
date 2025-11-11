// app/lib/store.ts
import fs from "node:fs/promises";
import path from "node:path";

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

export type SchedulerPlan = {
  day: string;
  slot: string;
  items: Array<{
    studentId: string;
    name: string;
    status: string;
    reason: string;
  }>;
};

type FileShape = {
  students: Student[];
  teachers: TeacherUser[];
  scheduler: Record<string, SchedulerPlan>;
};

// 프로젝트 루트 기준으로 저장할 파일 하나 정해두기
const DATA_FILE = path.join(process.cwd(), "data.json");

// 최초 기본값
const DEFAULT_DATA: FileShape = {
  students: [
    { id: "11115", name: "이도현", status: "재실", reason: "", approved: true, seatId: "11115", password: "12345678" },
    { id: "11130", name: "황도운", status: "재실", reason: "", approved: true, seatId: "11130", password: "12345678" },
    { id: "11125", name: "진승우", status: "재실", reason: "", approved: true, seatId: "11125", password: "12345678" },
    { id: "11106", name: "김유민", status: "재실", reason: "", approved: true, seatId: "11106", password: "12345678" },
    { id: "11124", name: "조주형", status: "재실", reason: "", approved: true, seatId: "11124", password: "12345678" },
    { id: "11110", name: "박시온", status: "재실", reason: "", approved: true, seatId: "11110", password: "12345678" },

    { id: "11119", name: "이지온", status: "재실", reason: "", approved: true, seatId: "11119", password: "12345678" },
    { id: "11108", name: "김지섭", status: "재실", reason: "", approved: true, seatId: "11108", password: "12345678" },
    { id: "11120", name: "이진우", status: "재실", reason: "", approved: true, seatId: "11120", password: "12345678" },
    { id: "11118", name: "이예찬", status: "재실", reason: "", approved: true, seatId: "11118", password: "12345678" },
    { id: "11102", name: "김사무엘", status: "재실", reason: "", approved: true, seatId: "11102", password: "12345678" },
    { id: "11126", name: "최배겸", status: "재실", reason: "", approved: true, seatId: "11126", password: "12345678" },

    { id: "11127", name: "최준성", status: "재실", reason: "", approved: true, seatId: "11127", password: "12345678" },
    { id: "11128", name: "함주완", status: "재실", reason: "", approved: true, seatId: "11128", password: "12345678" },
    { id: "11121", name: "전주형", status: "재실", reason: "", approved: true, seatId: "11121", password: "12345678" },
    { id: "11103", name: "김서준", status: "재실", reason: "", approved: true, seatId: "11103", password: "12345678" },
    { id: "11107", name: "김주헌", status: "재실", reason: "", approved: true, seatId: "11107", password: "12345678" },
    { id: "11111", name: "손지우", status: "재실", reason: "", approved: true, seatId: "11111", password: "12345678" },

    { id: "11112", name: "송준서", status: "재실", reason: "", approved: true, seatId: "11112", password: "12345678" },
    { id: "11101", name: "김규민", status: "재실", reason: "", approved: true, seatId: "11101", password: "12345678" },
    { id: "11129", name: "허준우", status: "재실", reason: "", approved: true, seatId: "11129", password: "12345678" },
    { id: "11117", name: "이승화", status: "재실", reason: "", approved: true, seatId: "11117", password: "12345678" },
    { id: "11116", name: "이승우", status: "재실", reason: "", approved: true, seatId: "11116", password: "12345678" },

    { id: "11104", name: "김연수", status: "재실", reason: "", approved: true, seatId: "11104", password: "12345678" },
    { id: "11109", name: "박경민", status: "재실", reason: "", approved: true, seatId: "11109", password: "12345678" },
    { id: "11113", name: "안준영", status: "재실", reason: "", approved: true, seatId: "11113", password: "12345678" },
  ],
  teachers: [
    { id: "윤인하", name: "윤인하 선생님", password: "admin" },
    { id: "이도현", name: "이도현 학생", password: "admin" },
    { id: "함주완", name: "함주완 학생", password: "admin" },
    { id: "최배겸", name: "최배겸 학생", password: "admin" },
  ],
  scheduler: {},
};

async function readFile(): Promise<FileShape> {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf8");
    const json = JSON.parse(raw) as FileShape;
    // 필드 빠졌을 때 대비
    return {
      students: json.students ?? DEFAULT_DATA.students,
      teachers: json.teachers ?? DEFAULT_DATA.teachers,
      scheduler: json.scheduler ?? {},
    };
  } catch {
    // 파일이 없으면 새로 만들어준다
    await fs.writeFile(DATA_FILE, JSON.stringify(DEFAULT_DATA, null, 2), "utf8");
    return DEFAULT_DATA;
  }
}

export async function getStudents(): Promise<Student[]> {
  const data = await readFile();
  return data.students;
}

export async function saveStudents(students: Student[]) {
  const data = await readFile();
  data.students = students;
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), "utf8");
}

export async function getTeachers(): Promise<TeacherUser[]> {
  const data = await readFile();
  return data.teachers;
}

export async function saveTeachers(teachers: TeacherUser[]) {
  const data = await readFile();
  data.teachers = teachers;
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), "utf8");
}

// 필요하면 스케줄러도 여기서 같이
export async function getScheduler() {
  const data = await readFile();
  return data.scheduler;
}
export async function saveScheduler(scheduler: Record<string, SchedulerPlan>) {
  const data = await readFile();
  data.scheduler = scheduler;
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), "utf8");
}
