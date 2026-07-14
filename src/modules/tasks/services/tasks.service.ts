import { supabase } from '@/boot/supabase';
import type { TableInsert, TableUpdate } from '@/types/database.types';
import {
  fromRow,
  isTaskPriority,
  isTaskStatus,
  TITLE_MAX_LENGTH,
  type Task,
  type TaskDraft,
} from '@/modules/tasks/types/task.types';

/** Thrown for client-side validation so the store can surface the message verbatim. */
export class TaskValidationError extends Error {}

/** Turn any thrown value into a clear, non-technical message. Never leaks Supabase internals. */
export function taskErrorMessage(error: unknown): string {
  if (error instanceof TaskValidationError) return error.message;
  const code = typeof error === 'object' && error && 'code' in error ? String(error.code) : '';
  const message = error instanceof Error ? error.message.toLocaleLowerCase() : '';
  if (message.includes('sign in') || message.includes('authentication'))
    return 'Sign in to view and save your tasks.';
  if (code === '23514') return 'That task has an invalid value. Please review and try again.';
  if (code === '42501' || message.includes('row-level security'))
    return 'You do not have access to that task.';
  if (message.includes('failed to fetch') || message.includes('network'))
    return 'You appear to be offline. Changes will sync when you reconnect.';
  return 'Something went wrong with your tasks. Please try again.';
}

async function currentUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new TaskValidationError('Sign in to view and save your tasks.');
  return data.user.id;
}

function validateDraft(draft: TaskDraft): void {
  const title = draft.title.trim();
  if (title.length < 1 || title.length > TITLE_MAX_LENGTH)
    throw new TaskValidationError(`Task title must be 1 to ${TITLE_MAX_LENGTH} characters.`);
  if (!isTaskStatus(draft.status)) throw new TaskValidationError('Choose a valid task status.');
  if (!isTaskPriority(draft.priority))
    throw new TaskValidationError('Choose a valid task priority.');
}

/** Shared payload for insert/update. Text is trimmed; empty strings become null. */
function draftToColumns(draft: TaskDraft) {
  return {
    title: draft.title.trim(),
    description: draft.description.trim() || null,
    project: draft.project.trim() || null,
    status: draft.status,
    priority: draft.priority,
    due_at: draft.dueAt || null,
    completed_at: draft.status === 'completed' ? new Date().toISOString() : null,
  };
}

export async function fetchTasks(): Promise<Task[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .order('position', { ascending: true })
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data.map(fromRow);
}

export async function createTask(draft: TaskDraft): Promise<Task> {
  validateDraft(draft);
  const userId = await currentUserId();
  const payload: TableInsert<'tasks'> = { user_id: userId, ...draftToColumns(draft) };
  const { data, error } = await supabase.from('tasks').insert(payload).select('*').single();
  if (error) throw error;
  return fromRow(data);
}

export async function updateTask(id: string, draft: TaskDraft): Promise<Task> {
  validateDraft(draft);
  const payload: TableUpdate<'tasks'> = draftToColumns(draft);
  const { data, error } = await supabase
    .from('tasks')
    .update(payload)
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return fromRow(data);
}

export async function deleteTask(id: string): Promise<void> {
  const { error } = await supabase.from('tasks').delete().eq('id', id);
  if (error) throw error;
}

export async function completeTask(id: string, completed: boolean): Promise<Task> {
  const payload: TableUpdate<'tasks'> = completed
    ? { status: 'completed', completed_at: new Date().toISOString() }
    : { status: 'today', completed_at: null };
  const { data, error } = await supabase
    .from('tasks')
    .update(payload)
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return fromRow(data);
}

/** Persist a new ordering. Positions are the index in `orderedIds`. */
export async function reorderTasks(orderedIds: string[]): Promise<void> {
  // ponytail: one update per row — fine for a personal list. Move to a single
  // RPC (unnest + update from) if a user ever has thousands of tasks.
  const results = await Promise.all(
    orderedIds.map((id, index) =>
      supabase.from('tasks').update({ position: index }).eq('id', id),
    ),
  );
  const failed = results.find((result) => result.error);
  if (failed?.error) throw failed.error;
}
