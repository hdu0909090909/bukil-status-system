// app/api/scheduler/store.ts

export type SchedulerItem = {
  studentId: string;
  name: string;
  status: string; // "변경안함" 포함
  reason: string;
};

export type SchedulerPlan = {
  day: string;
  slot: string;
  items: SchedulerItem[];
};

export const schedulerStore: Record<string, SchedulerPlan> = {};
// key 예: "mon|8교시"
