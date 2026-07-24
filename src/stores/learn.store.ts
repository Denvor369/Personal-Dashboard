import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '@/boot/supabase';
import { defaultSkills } from '@/data/learn.mock';
import type { LearnSkill } from '@/data/learn.mock';
import type { TableInsert, TableRow } from '@/types/database.types';

const storageKey = 'personal-dashboard-learn';

let channel: RealtimeChannel | undefined;
let initPromise: Promise<void> | undefined;

export interface SkillDraft {
  name: string;
  category: LearnSkill['category'];
  goal: string;
  progress: number;
}

export function clampProgress(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.min(100, Math.max(0, Math.round(value)));
}

// Human-friendly practice time: 45m, 1h 30m, 4h.
export function formatDuration(totalMinutes: number): string {
  const minutes = Math.max(0, Math.round(totalMinutes));
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest}m`;
  return rest === 0 ? `${hours}h` : `${hours}h ${rest}m`;
}

interface PersistState {
  skills: LearnSkill[];
  activeSkillId: string | null;
}

function load(): PersistState {
  try {
    const raw = localStorage.getItem(storageKey);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<PersistState>;
      if (Array.isArray(parsed.skills)) {
        return { skills: parsed.skills, activeSkillId: parsed.activeSkillId ?? null };
      }
    }
  } catch {
    // Corrupt or unavailable storage — fall through to seed data.
  }
  const seed = defaultSkills();
  return { skills: seed, activeSkillId: seed[0]?.id ?? null };
}

function fromRow(row: TableRow<'skills'>): LearnSkill {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    goal: row.goal,
    progress: row.progress,
    practiceMinutes: row.practice_minutes,
    createdAt: row.created_at.slice(0, 10),
  };
}

function toInsert(skill: LearnSkill, ownerId: string): TableInsert<'skills'> {
  return {
    id: skill.id,
    user_id: ownerId,
    name: skill.name,
    category: skill.category,
    goal: skill.goal,
    progress: skill.progress,
    practice_minutes: skill.practiceMinutes,
    created_at: skill.createdAt,
  };
}

export const useLearnStore = defineStore('learn', () => {
  const initial = load();
  const skills = ref<LearnSkill[]>(initial.skills);
  const activeSkillId = ref<string | null>(initial.activeSkillId);
  const loading = ref(false);
  const error = ref('');
  // Signed-in user; null means local-only mode (anonymous keeps the old localStorage behavior).
  let userId: string | null = null;

  // localStorage stays the instant-load cache and the anonymous store.
  // ponytail: single device-global key — this is a single-owner personal app.
  function persist() {
    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify({ skills: skills.value, activeSkillId: activeSkillId.value }),
      );
    } catch {
      // Ignore quota / privacy-mode failures; in-memory state still works.
    }
  }

  const activeSkill = computed(
    () => skills.value.find((skill) => skill.id === activeSkillId.value) ?? null,
  );
  const totalMinutes = computed(() =>
    skills.value.reduce((sum, skill) => sum + skill.practiceMinutes, 0),
  );
  const inProgressCount = computed(
    () => skills.value.filter((skill) => skill.progress < 100).length,
  );
  const masteredCount = computed(
    () => skills.value.filter((skill) => skill.progress >= 100).length,
  );

  function ensureActiveSkill() {
    if (!skills.value.some((skill) => skill.id === activeSkillId.value)) {
      activeSkillId.value = skills.value[0]?.id ?? null;
    }
  }

  /** Fire-and-forget server write; on failure restore the pre-mutation snapshot. */
  function syncRemote(snapshot: LearnSkill[], op: () => PromiseLike<{ error: unknown }>) {
    void (async () => {
      const { error: remoteError } = await op();
      if (remoteError) {
        skills.value = snapshot;
        ensureActiveSkill();
        persist();
        error.value = 'Could not save that change to the server.';
      }
    })();
  }

  function subscribeRealtime(uid: string) {
    if (channel) return;
    channel = supabase
      .channel(`skills:${uid}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'skills', filter: `user_id=eq.${uid}` },
        (payload) => {
          const next = fromRow(payload.new as TableRow<'skills'>);
          if (!skills.value.some((skill) => skill.id === next.id)) {
            skills.value = [next, ...skills.value];
            persist();
          }
        },
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'skills', filter: `user_id=eq.${uid}` },
        (payload) => {
          const next = fromRow(payload.new as TableRow<'skills'>);
          skills.value = skills.value.map((skill) => (skill.id === next.id ? next : skill));
          persist();
        },
      )
      .on(
        // Unfiltered: DELETE payloads only carry the primary key, so a user_id
        // filter would silently drop them. Removing a foreign id is a no-op.
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'skills' },
        (payload) => {
          skills.value = skills.value.filter(
            (skill) => skill.id !== (payload.old as { id: string }).id,
          );
          ensureActiveSkill();
          persist();
        },
      )
      .subscribe();
  }

  function initialize() {
    if (initPromise) return initPromise;
    initPromise = (async () => {
      const { data } = await supabase.auth.getUser();
      userId = data.user?.id ?? null;
      if (!userId) return;
      const uid = userId;
      loading.value = true;
      error.value = '';
      try {
        subscribeRealtime(uid);
        const { data: rows, error: fetchError } = await supabase
          .from('skills')
          .select('*')
          .order('created_at', { ascending: false });
        if (fetchError) throw fetchError;
        if (rows.length === 0) {
          // First sign-in: adopt whatever this device already has (seeds included).
          const local = load().skills;
          if (local.length) {
            const { error: migrateError } = await supabase
              .from('skills')
              .insert(local.map((skill) => toInsert(skill, uid)));
            if (migrateError) throw migrateError;
            skills.value = local;
          }
        } else {
          skills.value = rows.map(fromRow);
        }
        ensureActiveSkill();
        persist();
      } catch {
        error.value = 'Could not load your skills from the server.';
      } finally {
        loading.value = false;
      }
    })();
    return initPromise;
  }

  function clear() {
    if (channel) {
      void supabase.removeChannel(channel);
      channel = undefined;
    }
    initPromise = undefined;
    userId = null;
    const seed = defaultSkills();
    skills.value = seed;
    activeSkillId.value = seed[0]?.id ?? null;
    loading.value = false;
    error.value = '';
  }

  function setActive(id: string) {
    activeSkillId.value = id;
    persist();
  }

  function addSkill(draft: SkillDraft) {
    const skill: LearnSkill = {
      id: crypto.randomUUID(),
      name: draft.name.trim(),
      category: draft.category,
      goal: draft.goal.trim(),
      progress: clampProgress(draft.progress),
      practiceMinutes: 0,
      createdAt: new Date().toISOString().slice(0, 10),
    };
    const snapshot = skills.value;
    skills.value = [skill, ...skills.value];
    if (!activeSkillId.value) activeSkillId.value = skill.id;
    persist();
    const uid = userId;
    if (uid) syncRemote(snapshot, () => supabase.from('skills').insert(toInsert(skill, uid)));
    return skill.id;
  }

  function updateSkill(id: string, draft: SkillDraft) {
    const snapshot = skills.value;
    const changes = {
      name: draft.name.trim(),
      category: draft.category,
      goal: draft.goal.trim(),
      progress: clampProgress(draft.progress),
    };
    skills.value = skills.value.map((skill) =>
      skill.id === id ? { ...skill, ...changes } : skill,
    );
    persist();
    if (userId) syncRemote(snapshot, () => supabase.from('skills').update(changes).eq('id', id));
  }

  function removeSkill(id: string) {
    const snapshot = skills.value;
    skills.value = skills.value.filter((skill) => skill.id !== id);
    ensureActiveSkill();
    persist();
    if (userId) syncRemote(snapshot, () => supabase.from('skills').delete().eq('id', id));
  }

  // Called by the focus timer when a practice session ends.
  function logPractice(id: string, minutes: number) {
    if (minutes <= 0) return;
    const target = skills.value.find((skill) => skill.id === id);
    if (!target) return;
    const snapshot = skills.value;
    // ponytail: last-write-wins total; a server-side increment matters only with concurrent timers.
    const total = target.practiceMinutes + Math.round(minutes);
    skills.value = skills.value.map((skill) =>
      skill.id === id ? { ...skill, practiceMinutes: total } : skill,
    );
    persist();
    if (userId)
      syncRemote(snapshot, () =>
        supabase.from('skills').update({ practice_minutes: total }).eq('id', id),
      );
  }

  return {
    skills,
    activeSkillId,
    activeSkill,
    totalMinutes,
    inProgressCount,
    masteredCount,
    loading,
    error,
    initialize,
    clear,
    setActive,
    addSkill,
    updateSkill,
    removeSkill,
    logPractice,
  };
});

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    if (channel) void supabase.removeChannel(channel);
    channel = undefined;
    initPromise = undefined;
  });
}
