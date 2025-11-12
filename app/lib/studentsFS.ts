// lib/studentsFS.ts
import path from "path";
import { promises as fs } from "fs";

export type Student = {
  id: string;
  name: string;
  status: string;
  reason: string;
  approved: boolean;
  seatId?: string;
};

const ROOT = path.join(process.cwd(), "data", "students");

export async function ensureDir() {
  await fs.mkdir(ROOT, { recursive: true });
}

function fileOf(id: string) {
  return path.join(ROOT, `${id}.json`);
}

export async function readOne(id: string): Promise<Student | null> {
  await ensureDir();
  try {
    const raw = await fs.readFile(fileOf(id), "utf-8");
    return JSON.parse(raw) as Student;
  } catch {
    return null;
  }
}

export async function writeOne(s: Student) {
  await ensureDir();
  await fs.writeFile(fileOf(s.id), JSON.stringify(s, null, 2), "utf-8");
}

export async function readAll(): Promise<Student[]> {
  await ensureDir();
  try {
    const files = await fs.readdir(ROOT);
    const out: Student[] = [];
    for (const f of files) {
      if (!f.endsWith(".json")) continue;
      try {
        const raw = await fs.readFile(path.join(ROOT, f), "utf-8");
        const s = JSON.parse(raw);
        if (s && typeof s.id === "string") out.push(s);
      } catch {}
    }
    return out.sort((a, b) => Number(a.id) - Number(b.id));
  } catch {
    return [];
  }
}

export function merge(prev: Student, patch: Partial<Student>): Student {
  return {
    ...prev,
    ...(patch.name     !== undefined ? { name:     patch.name }     : {}),
    ...(patch.status   !== undefined ? { status:   patch.status }   : {}),
    ...(patch.reason   !== undefined ? { reason:   patch.reason }   : {}),
    ...(patch.approved !== undefined ? { approved: patch.approved } : {}),
    ...(patch.seatId   !== undefined ? { seatId:   patch.seatId }   : {}),
  };
}

export async function upsertMany(
  patches: Array<Partial<Student> & { id: string }>
): Promise<Student[]> {
  // 개별 파일에 저장
  const seen = new Set<string>();
  for (const p of patches) {
    if (!p?.id) continue;
    seen.add(p.id);
    const existing =
      (await readOne(p.id)) ??
      ({
        id: p.id,
        name: p.name ?? "",
        status: p.status ?? "재실",
        reason: p.reason ?? "",
        approved: p.approved ?? false,
        seatId: p.seatId,
      } as Student);
    const merged = merge(existing, p);
    await writeOne(merged);
  }
  // 최신 목록 리턴
  return await readAll();
}
