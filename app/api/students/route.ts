// app/api/students/route.ts
import { NextResponse } from "next/server";
import path from "path";
import { promises as fs } from "fs";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Student = {
  id: string;
  name: string;
  status: string;
  reason: string;
  approved: boolean;
  seatId?: string;
};

const DATA_DIR = path.join(process.cwd(), "data", "students");

async function ensureDir() {
  try { await fs.mkdir(DATA_DIR, { recursive: true }); } catch {}
}

async function readOne(id: string): Promise<Student | null> {
  try {
    const p = path.join(DATA_DIR, `${id}.json`);
    const raw = await fs.readFile(p, "utf-8");
    return JSON.parse(raw) as Student;
  } catch { return null; }
}

async function writeOne(s: Student) {
  const p = path.join(DATA_DIR, `${s.id}.json`);
  await fs.writeFile(p, JSON.stringify(s, null, 2), "utf-8");
}

async function listAll(): Promise<Student[]> {
  await ensureDir();
  const files = await fs.readdir(DATA_DIR);
  const out: Student[] = [];
  for (const f of files) {
    if (!f.endsWith(".json")) continue;
    try {
      const raw = await fs.readFile(path.join(DATA_DIR, f), "utf-8");
      const s = JSON.parse(raw) as Student;
      out.push(s);
    } catch {}
  }
  // id 숫자 기준 정렬
  out.sort((a, b) => Number(a.id) - Number(b.id));
  return out;
}

function mergeStudent(prev: Student, patch: Partial<Student>): Student {
  // 제공된 필드만 덮어쓰기 (undefined/빈값 강제 초기화 금지)
  const next: Student = { ...prev };
  if (patch.name !== undefined) next.name = patch.name;
  if (patch.status !== undefined) next.status = patch.status;
  if (patch.reason !== undefined) next.reason = patch.reason;
  if (patch.approved !== undefined) next.approved = patch.approved;
  if (patch.seatId !== undefined) next.seatId = patch.seatId;
  return next;
}

/** GET: 전체 학생 목록 */
export async function GET() {
  const students = await listAll();
  return NextResponse.json(students, { status: 200 });
}

/** PATCH: 단건({id,...}) 또는 배열([{id,...}]) */
export async function PATCH(req: Request) {
  await ensureDir();
  const body = await req.json();

  const patches: Array<Partial<Student> & { id: string }> = Array.isArray(body) ? body : [body];

  // 방어: id 없으면 무시
  const valid = patches.filter((p) => typeof p?.id === "string" && p.id.trim() !== "");
  if (valid.length === 0) {
    return NextResponse.json({ message: "no valid payload" }, { status: 400 });
  }

  // 각 학생 파일 읽어서 병합 저장
  for (const p of valid) {
    const id = p.id;
    const existing = (await readOne(id)) ?? {
      id,
      name: p.name ?? "",
      status: p.status ?? "재실",
      reason: p.reason ?? "",
      approved: p.approved ?? false,
      seatId: p.seatId,
    };
    const merged = mergeStudent(existing, p);
    await writeOne(merged);
  }

  const students = await listAll();
  return NextResponse.json({ students }, { status: 200 });
}
