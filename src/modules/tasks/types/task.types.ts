import type { TableRow } from '@/types/database.types';

export const TASK_STATUSES = ['today', 'upcoming', 'completed'] as const;
export const TASK_PRIORITIES = ['high', 'medium', 'low'] as const;
export const TITLE_MAX_LENGTH = 200;

export type TaskStatus = (typeof TASK_STATUSES)[number];
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

/** App-facing task. Fields mirror the DB row but camelCased. */
export interface Task {
  id: string;
  title: string;
  description: string;
  project: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueAt: string | null; // ISO timestamp
  completedAt: string | null;
  position: number;
  createdAt: string;
  updatedAt: string;
}

/** Values accepted when creating/updating a task. user_id is never part of this. */
export interface TaskDraft {
  title: string;
  description: string;
  project: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueAt: string | null;
}

export function isTaskStatus(value: unknown): value is TaskStatus {
  return TASK_STATUSES.includes(value as TaskStatus);
}

export function isTaskPriority(value: unknown): value is TaskPriority {
  return TASK_PRIORITIES.includes(value as TaskPriority);
}

/** Map a raw Supabase row into the app model. */
export function fromRow(row: TableRow<'tasks'>): Task {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? '',
    project: row.project ?? '',
    status: row.status,
    priority: row.priority,
    dueAt: row.due_at,
    completedAt: row.completed_at,
    position: row.position,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
