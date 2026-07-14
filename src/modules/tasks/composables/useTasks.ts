import { computed } from 'vue';
import { Notify } from 'quasar';
import { storeToRefs } from 'pinia';
import { useTasksStore } from '@/modules/tasks/stores/tasks.store';
import type { Task, TaskDraft, TaskPriority, TaskStatus } from '@/modules/tasks/types/task.types';

const PRIORITY_LABEL: Record<TaskPriority, string> = { high: 'High', medium: 'Medium', low: 'Low' };
const STATUS_LABEL: Record<TaskStatus, string> = {
  today: 'Today',
  upcoming: 'Upcoming',
  completed: 'Completed',
};
const PRIORITY_FROM_LABEL: Record<string, TaskPriority> = {
  High: 'high',
  Medium: 'medium',
  Low: 'low',
};

/** Display-shaped task for the existing page template (capitalized labels, friendly due). */
export interface TaskView {
  id: string;
  title: string;
  project: string;
  description: string;
  priority: 'High' | 'Medium' | 'Low';
  status: 'Today' | 'Upcoming' | 'Completed';
  completed: boolean;
  due: string;
  dueAt: string | null;
  completedAt: string | null;
  position: number;
}

/** Page form (matches TasksPage draft): capitalized priority, datetime-local `due`. */
export interface TaskForm {
  title: string;
  project: string;
  description: string;
  due: string;
  priority: 'High' | 'Medium' | 'Low';
}

function dueLabel(dueAt: string | null): string {
  if (!dueAt) return 'No deadline';
  const date = new Date(dueAt);
  if (Number.isNaN(date.getTime())) return 'No deadline';
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function toView(task: Task): TaskView {
  return {
    id: task.id,
    title: task.title,
    project: task.project || 'Inbox',
    description: task.description,
    priority: PRIORITY_LABEL[task.priority] as TaskView['priority'],
    status: STATUS_LABEL[task.status] as TaskView['status'],
    completed: task.status === 'completed',
    due: dueLabel(task.dueAt),
    dueAt: task.dueAt,
    completedAt: task.completedAt,
    position: task.position,
  };
}

/** ISO string from a `datetime-local` value, or null if empty/invalid. */
function toIso(due: string): string | null {
  if (!due.trim()) return null;
  const date = new Date(due);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

/** ISO -> `datetime-local` value for prefilling the edit form. */
export function toDatetimeLocal(dueAt: string | null): string {
  if (!dueAt) return '';
  const date = new Date(dueAt);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function toDraft(form: TaskForm, status: TaskStatus): TaskDraft {
  return {
    title: form.title,
    description: form.description,
    project: form.project,
    priority: PRIORITY_FROM_LABEL[form.priority] ?? 'medium',
    status,
    dueAt: toIso(form.due),
  };
}

// Bind online/offline sync toasts exactly once for the whole app.
let syncToastsBound = false;
function bindSyncToasts() {
  if (syncToastsBound || typeof window === 'undefined') return;
  window.addEventListener('offline', () =>
    Notify.create({ type: 'warning', message: 'You are offline. Changes are paused.', timeout: 2000 }),
  );
  window.addEventListener('online', () =>
    Notify.create({ type: 'positive', message: 'Back online. Syncing your tasks…', timeout: 1600 }),
  );
  syncToastsBound = true;
}

export function useTasks() {
  const store = useTasksStore();
  const { loading, initialized, saving, error, lastSyncedAt, pendingChanges, online } =
    storeToRefs(store);
  bindSyncToasts();

  const tasks = computed<TaskView[]>(() => store.tasks.map(toView));
  const counts = computed(() => store.taskCounts);

  function notifyError(message: string) {
    Notify.create({ type: 'negative', message, timeout: 2600 });
  }

  async function createTask(form: TaskForm) {
    try {
      await store.createTask(toDraft(form, 'today'));
      Notify.create({ type: 'positive', message: 'Task saved', timeout: 1400 });
    } catch (caught) {
      notifyError(caught instanceof Error ? caught.message : store.error);
    }
  }

  async function updateTask(id: string, form: TaskForm, currentStatus: TaskView['status']) {
    const status = (Object.keys(STATUS_LABEL) as TaskStatus[]).find(
      (key) => STATUS_LABEL[key] === currentStatus,
    );
    try {
      await store.updateTask(id, toDraft(form, status ?? 'today'));
      Notify.create({ type: 'positive', message: 'Task saved', timeout: 1400 });
    } catch (caught) {
      notifyError(caught instanceof Error ? caught.message : store.error);
    }
  }

  async function removeTask(id: string) {
    try {
      await store.deleteTask(id);
      Notify.create({ type: 'positive', message: 'Task deleted', timeout: 1400 });
    } catch (caught) {
      notifyError(caught instanceof Error ? caught.message : store.error);
    }
  }

  async function toggleComplete(task: TaskView) {
    try {
      await store.toggleComplete(task.id);
      Notify.create({
        type: 'positive',
        message: task.completed ? 'Task reopened' : 'Task completed',
        timeout: 1200,
      });
    } catch (caught) {
      notifyError(caught instanceof Error ? caught.message : store.error);
    }
  }

  async function reorder(orderedIds: string[]) {
    try {
      await store.reorderTasks(orderedIds);
    } catch (caught) {
      notifyError(caught instanceof Error ? caught.message : store.error);
    }
  }

  return {
    // state
    tasks,
    counts,
    loading,
    initialized,
    saving,
    error,
    lastSyncedAt,
    pendingChanges,
    online,
    // actions
    initialize: store.initialize,
    refresh: store.refresh,
    createTask,
    updateTask,
    removeTask,
    toggleComplete,
    reorder,
  };
}
