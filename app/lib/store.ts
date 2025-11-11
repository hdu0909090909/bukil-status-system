// app/lib/store.ts
import {
  students as memoryStudents,
  teacherUsers as memoryTeachers,
} from "@/app/lib/data";

const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

const STUDENTS_KEY = "students_v1";
const TEACHERS_KEY = "teachers_v1";

async function kvGet<T>(key: string): Promise<T | null> {
  if (!REDIS_URL || !REDIS_TOKEN) return null;
  const res = await fetch(`${REDIS_URL}/get/${key}`, {
    headers: { Authorization: `Bearer ${REDIS_TOKEN}` },
    cache: "no-store",
  });
  if (!res.ok) return null;
  const data = await res.json().catch(() => null);
  if (!data || typeof data.result === "undefined") return null;
  try {
    return JSON.parse(data.result) as T;
  } catch {
    return data.result as T;
  }
}

async function kvSet(key: string, value: unknown) {
  if (!REDIS_URL || !REDIS_TOKEN) return;
  await fetch(`${REDIS_URL}/set/${key}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${REDIS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(value),
  });
}

/** 학생 전부 가져오기 */
export async function getStudents() {
  const fromKv = await kvGet<typeof memoryStudents>(STUDENTS_KEY);
  if (fromKv && Array.isArray(fromKv)) {
    // 항상 학번순으로
    return [...fromKv].sort((a, b) => Number(a.id) - Number(b.id));
  }
  // KV 없으면 메모리로
  return [...memoryStudents].sort((a, b) => Number(a.id) - Number(b.id));
}

/** 학생 전부 저장 */
export async function saveStudents(students: typeof memoryStudents) {
  // 메모리에도 반영
  memoryStudents.length = 0;
  memoryStudents.push(...students);
  // KV 있으면 거기도
  await kvSet(STUDENTS_KEY, students);
}

/** 교원 전부 가져오기 */
export async function getTeachers() {
  const fromKv = await kvGet<typeof memoryTeachers>(TEACHERS_KEY);
  if (fromKv && Array.isArray(fromKv)) {
    return fromKv;
  }
  return memoryTeachers;
}

/** 교원 전부 저장 */
export async function saveTeachers(teachers: typeof memoryTeachers) {
  // 메모리 반영
  memoryTeachers.length = 0;
  memoryTeachers.push(...teachers);
  await kvSet(TEACHERS_KEY, teachers);
}
