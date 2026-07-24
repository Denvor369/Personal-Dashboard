import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '@/boot/supabase';
import { fromRow, type Task, type TaskDraft } from '@/modules/tasks/types/task.types';
import * as tasksService from '@/modules/tasks/services/tasks.service';
import { taskErrorMessage, TaskValidationError } from '@/modules/tasks/services/tasks.service';

let channel: RealtimeChannel | undefined;
let initPromise: Promise<void> | undefined;
let onlineListenersBound = false;

function cacheKey(userId: string) {
  return `dashboard:tasks:${userId}`;
}

export const useTasksStore = defineStore('tasks', () => {
  const tasks = ref<Task[]>([]);
  const loading = ref(false);
  const initialized = ref(false);
  const saving = ref(false);
  const error = ref('');
  const lastSyncedAt = ref<string | null>(null);
  const pendingChanges = ref(0); // mutations currently being persisted
  const online = ref(typeof navigator === 'undefined' ? true : navigator.onLine);

  // ---- getters ----------------------------------------------------------
  const todayTasks = computed(() => tasks.value.filter((task) => task.status === 'today'));
  const upcomingTasks = computed(() => tasks.value.filter((task) => task.status === 'upcoming'));
  const completedTasks = computed(() => tasks.value.filter((task) => task.status === 'completed'));
  const highPriorityTasks = computed(() =>
    tasks.value.filter((task) => task.priority === 'high' && task.status !== 'completed'),
  );
  const taskCounts = computed(() => ({
    total: tasks.value.length,
    today: todayTasks.value.length,
    upcoming: upcomingTasks.value.length,
    completed: completedTasks.value.length,
    highPriority: highPriorityTasks.value.length,
  }));

  // ---- helpers ----------------------------------------------------------
  async function currentUserId() {
    const { data } = await supabase.auth.getUser();
    return data.user?.id ?? null;
  }

  function requireOnline() {
    if (!online.value)
      throw new TaskValidationError('You are offline — this change can not be saved yet.');
  }

  function writeCache(userId: string) {
    try {
      localStorage.setItem(cacheKey(userId), JSON.stringify(tasks.value));
    } catch {
      /* storage may be full or unavailable; caching is best-effort */
    }
  }

  function readCache(userId: string): Task[] | null {
    try {
      const raw = localStorage.getItem(cacheKey(userId));
      return raw ? (JSON.parse(raw) as Task[]) : null;
    } catch {
      return null;
    }
  }

  function upsertLocal(task: Task) {
    const index = tasks.value.findIndex((item) => item.id === task.id);
    if (index === -1) tasks.value = [task, ...tasks.value];
    else tasks.value = tasks.value.map((item) => (item.id === task.id ? task : item));
  }

  function removeLocal(id: string) {
    tasks.value = tasks.value.filter((item) => item.id !== id);
  }

  function bindOnlineListeners() {
    if (onlineListenersBound || typeof window === 'undefined') return;
    window.addEventListener('online', () => {
      online.value = true;
      void refresh();
    });
    window.addEventListener('offline', () => (online.value = false));
    onlineListenersBound = true;
  }

  function subscribeRealtime(userId: string) {
    if (channel) return; // never create duplicate subscriptions
    channel = supabase
      .channel(`tasks:${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks', filter: `user_id=eq.${userId}` },
        (payload) => {
          if (payload.eventType === 'DELETE') removeLocal((payload.old as { id: string }).id);
          else upsertLocal(fromRow(payload.new as Parameters<typeof fromRow>[0]));
          writeCache(userId);
        },
      )
      .on(
        // Unfiltered: DELETE payloads only carry the primary key, so the user_id
        // filter above silently drops them. Removing a foreign id is a no-op.
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'tasks' },
        (payload) => {
          removeLocal((payload.old as { id: string }).id);
          writeCache(userId);
        },
      )
      .subscribe();
  }

  /** Run a mutation optimistically: apply now, persist, roll back on failure. */
  async function persist<T>(remote: () => Promise<T>, rollback: () => void): Promise<T> {
    requireOnline();
    saving.value = true;
    pendingChanges.value += 1;
    error.value = '';
    try {
      const result = await remote();
      lastSyncedAt.value = new Date().toISOString();
      const id = await currentUserId();
      if (id) writeCache(id);
      return result;
    } catch (caught) {
      rollback();
      error.value = taskErrorMessage(caught);
      throw new Error(error.value);
    } finally {
      pendingChanges.value = Math.max(0, pendingChanges.value - 1);
      saving.value = pendingChanges.value > 0;
    }
  }

  // ---- actions ----------------------------------------------------------
  function initialize() {
    if (initPromise) return initPromise;
    initPromise = (async () => {
      loading.value = true;
      error.value = '';
      try {
        const userId = await currentUserId();
        if (!userId) return; // not signed in yet
        bindOnlineListeners();
        subscribeRealtime(userId);
        try {
          tasks.value = await tasksService.fetchTasks();
          lastSyncedAt.value = new Date().toISOString();
          writeCache(userId);
        } catch (caught) {
          const cached = readCache(userId);
          if (cached) tasks.value = cached;
          error.value = taskErrorMessage(caught);
        }
      } finally {
        initialized.value = true;
        loading.value = false;
      }
    })();
    return initPromise;
  }

  async function refresh() {
    const userId = await currentUserId();
    if (!userId) return;
    loading.value = true;
    error.value = '';
    try {
      tasks.value = await tasksService.fetchTasks();
      lastSyncedAt.value = new Date().toISOString();
      writeCache(userId);
    } catch (caught) {
      error.value = taskErrorMessage(caught);
    } finally {
      loading.value = false;
    }
  }

  async function createTask(draft: TaskDraft): Promise<Task> {
    const tempId = `temp-${crypto.randomUUID()}`;
    const now = new Date().toISOString();
    const optimistic: Task = {
      id: tempId,
      title: draft.title.trim(),
      description: draft.description.trim(),
      project: draft.project.trim(),
      status: draft.status,
      priority: draft.priority,
      dueAt: draft.dueAt,
      completedAt: draft.status === 'completed' ? now : null,
      position: 0,
      createdAt: now,
      updatedAt: now,
    };
    tasks.value = [optimistic, ...tasks.value];
    const saved = await persist(
      () => tasksService.createTask(draft),
      () => removeLocal(tempId),
    );
    // Replace the temp row with the server row (same list position).
    tasks.value = tasks.value.map((item) => (item.id === tempId ? saved : item));
    return saved;
  }

  async function updateTask(id: string, draft: TaskDraft): Promise<Task> {
    const previous = tasks.value.find((task) => task.id === id);
    if (!previous) throw new Error('Task not found.');
    upsertLocal({ ...previous, ...draft, dueAt: draft.dueAt, updatedAt: new Date().toISOString() });
    const saved = await persist(
      () => tasksService.updateTask(id, draft),
      () => upsertLocal(previous),
    );
    upsertLocal(saved);
    return saved;
  }

  async function deleteTask(id: string): Promise<void> {
    const snapshot = tasks.value;
    removeLocal(id);
    await persist(
      () => tasksService.deleteTask(id),
      () => (tasks.value = snapshot),
    );
  }

  async function toggleComplete(id: string): Promise<void> {
    const previous = tasks.value.find((task) => task.id === id);
    if (!previous) return;
    const completed = previous.status !== 'completed';
    upsertLocal({
      ...previous,
      status: completed ? 'completed' : 'today',
      completedAt: completed ? new Date().toISOString() : null,
    });
    const saved = await persist(
      () => tasksService.completeTask(id, completed),
      () => upsertLocal(previous),
    );
    upsertLocal(saved);
  }

  async function reorderTasks(orderedIds: string[]): Promise<void> {
    const snapshot = tasks.value;
    const byId = new Map(tasks.value.map((task) => [task.id, task]));
    tasks.value = orderedIds
      .map((id, index) => {
        const task = byId.get(id);
        return task ? { ...task, position: index } : null;
      })
      .filter((task): task is Task => task !== null);
    await persist(
      () => tasksService.reorderTasks(orderedIds),
      () => (tasks.value = snapshot),
    );
  }

  function clear() {
    if (channel) {
      void supabase.removeChannel(channel);
      channel = undefined;
    }
    tasks.value = [];
    initialized.value = false;
    loading.value = false;
    saving.value = false;
    error.value = '';
    lastSyncedAt.value = null;
    pendingChanges.value = 0;
    initPromise = undefined;
  }

  return {
    tasks,
    loading,
    initialized,
    saving,
    error,
    lastSyncedAt,
    pendingChanges,
    online,
    todayTasks,
    upcomingTasks,
    completedTasks,
    highPriorityTasks,
    taskCounts,
    initialize,
    refresh,
    createTask,
    updateTask,
    deleteTask,
    toggleComplete,
    reorderTasks,
    clear,
  };
});

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    if (channel) void supabase.removeChannel(channel);
    channel = undefined;
    initPromise = undefined;
    onlineListenersBound = false;
  });
}
