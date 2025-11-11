// app/lib/store.ts
import fs from "fs/promises";
import path from "path";

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

type DataFileShape = {
  students: Student[];
  teacherUsers: TeacherUser[];
};

// data 폴더에 json 하나 두고 그걸로 읽고쓰기
const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "data.json");

// 너 원래 data.ts 에 있던 초기값을 여기에도 박아둔다
const INITIAL_DATA: DataFileShape = {
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
  teacherUsers: [
    { id: "윤인하", name: "윤인하 선생님", password: "admin" },
    { id: "이도현", name: "이도현 학생", password: "admin" },
    { id: "함주완", name: "함주완 학생", password: "admin" },
    { id: "최배겸", name: "최배겸 학생", password: "admin" },
  ],
};

async function ensureFile() {
  try {
    await fs.access(DATA_FILE);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(
      DATA_FILE,
      JSON.stringify(INITIAL_DATA, null, 2),
      "utf-8"
    );
  }
}

export async function getStudents(): Promise<Student[]> {
  await ensureFile();
  const raw = await fs.readFile(DATA_FILE, "utf-8");
  const json = JSON.parse(raw) as DataFileShape;
  return json.students ?? [];
}

export async function saveStudents(students: Student[]) {
  await ensureFile();
  const raw = await fs.readFile(DATA_FILE, "utf-8");
  const json = JSON.parse(raw) as DataFileShape;
  json.students = students;
  await fs.writeFile(DATA_FILE, JSON.stringify(json, null, 2), "utf-8");
}

export async function getTeacherUsers(): Promise<TeacherUser[]> {
  await ensureFile();
  const raw = await fs.readFile(DATA_FILE, "utf-8");
  const json = JSON.parse(raw) as DataFileShape;
  return json.teacherUsers ?? [];
}

export async function saveTeacherUsers(teacherUsers: TeacherUser[]) {
  await ensureFile();
  const raw = await fs.readFile(DATA_FILE, "utf-8");
  const json = JSON.parse(raw) as DataFileShape;
  json.teacherUsers = teacherUsers;
  await fs.writeFile(DATA_FILE, JSON.stringify(json, null, 2), "utf-8");
}
