import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import { defaultSkills } from '@/data/learn.mock';
import type { LearnSkill, SkillCategory } from '@/data/learn.mock';

const storageKey = 'personal-dashboard-learn';

export interface SkillDraft {
  name: string;
  category: SkillCategory;
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

export const useLearnStore = defineStore('learn', () => {
  const initial = load();
  const skills = ref<LearnSkill[]>(initial.skills);
  const activeSkillId = ref<string | null>(initial.activeSkillId);

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
    skills.value = [skill, ...skills.value];
    if (!activeSkillId.value) activeSkillId.value = skill.id;
    persist();
    return skill.id;
  }

  function updateSkill(id: string, draft: SkillDraft) {
    skills.value = skills.value.map((skill) =>
      skill.id === id
        ? {
            ...skill,
            name: draft.name.trim(),
            category: draft.category,
            goal: draft.goal.trim(),
            progress: clampProgress(draft.progress),
          }
        : skill,
    );
    persist();
  }

  function removeSkill(id: string) {
    skills.value = skills.value.filter((skill) => skill.id !== id);
    if (activeSkillId.value === id) activeSkillId.value = skills.value[0]?.id ?? null;
    persist();
  }

  // Called by the focus timer when a practice session ends.
  function logPractice(id: string, minutes: number) {
    if (minutes <= 0) return;
    skills.value = skills.value.map((skill) =>
      skill.id === id
        ? { ...skill, practiceMinutes: skill.practiceMinutes + Math.round(minutes) }
        : skill,
    );
    persist();
  }

  return {
    skills,
    activeSkillId,
    activeSkill,
    totalMinutes,
    inProgressCount,
    masteredCount,
    setActive,
    addSkill,
    updateSkill,
    removeSkill,
    logPractice,
  };
});
