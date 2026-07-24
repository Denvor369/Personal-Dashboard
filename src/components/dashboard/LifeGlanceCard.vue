<template>
  <article class="dashboard-card life-glance-card">
    <header class="life-glance-card__header">
      <div>
        <p class="dashboard-eyebrow">Your world</p>
        <h2>Life at a glance</h2>
      </div>
      <span class="life-glance-card__streak" :title="`${cleanDays}-day money streak`">
        <q-icon name="bolt" />{{ cleanDays }}d
      </span>
    </header>

    <div class="life-glance-card__list">
      <RouterLink to="/bank" class="glance-row glance-row--money">
        <span class="glance-row__icon"><q-icon name="savings" /></span>
        <span class="glance-row__body">
          <strong>{{ savings.name }}</strong>
          <small>{{ money(savings.saved) }} of {{ money(savings.target) }}</small>
          <span class="glance-row__bar"
            ><span :style="{ inlineSize: `${savings.percent}%` }"
          /></span>
        </span>
        <span class="glance-row__value">{{ savings.percent }}%</span>
      </RouterLink>

      <RouterLink to="/learn" class="glance-row glance-row--learn">
        <span class="glance-row__icon"><q-icon name="school" /></span>
        <span class="glance-row__body">
          <strong>{{ learn.activeSkill?.name ?? 'Pick a skill' }}</strong>
          <small
            >{{ formatDuration(learn.totalMinutes) }} practiced ·
            {{ learn.skills.length }} skills</small
          >
        </span>
        <q-icon class="glance-row__go" name="arrow_forward" />
      </RouterLink>

      <RouterLink to="/notes" class="glance-row glance-row--notes">
        <span class="glance-row__icon"><q-icon name="description" /></span>
        <span class="glance-row__body">
          <strong>{{ noteCount }} document{{ noteCount === 1 ? '' : 's' }}</strong>
          <small>Captured in your notes</small>
        </span>
        <q-icon class="glance-row__go" name="arrow_forward" />
      </RouterLink>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { formatDuration, useLearnStore } from '@/stores/learn.store';

const learn = useLearnStore();

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

const money = (value: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);

// Savings goal lives in the Bank coach's local store.
const savings = computed(() => {
  const coach = readJson<{ goal?: { name?: string; saved?: number; target?: number } }>(
    'personal-dashboard-bank-coach-v1',
    {},
  );
  const goal = coach.goal ?? {};
  const saved = goal.saved ?? 640;
  const target = goal.target ?? 1500;
  return {
    name: goal.name ?? 'Emergency Fund',
    saved,
    target,
    percent: target > 0 ? Math.min(100, Math.round((saved / target) * 100)) : 0,
  };
});

// No-unnecessary-spend streak: days since the last impulse/optional expense.
const cleanDays = computed(() => {
  const records = readJson<Array<{ kind?: string; tier?: string; date?: string }>>(
    'personal-dashboard-bank-records-v1',
    [],
  );
  const slips = records
    .filter((r) => r.kind === 'expense' && (r.tier === 'impulse' || r.tier === 'optional'))
    .map((r) => r.date ?? '')
    .filter(Boolean)
    .sort();
  const last = slips[slips.length - 1];
  if (!last) return records.length ? 7 : 0;
  const diff = Math.round((Date.now() - Date.parse(`${last}T00:00:00`)) / 86_400_000);
  return Math.max(0, diff);
});

const noteCount = computed(
  () => readJson<unknown[]>('personal-dashboard-word-notes', []).length || 7,
);
</script>

<style scoped lang="scss">
.life-glance-card {
  display: flex;
  min-height: 0;
  flex-direction: column;
  gap: var(--space-3);
  background: var(--color-surface);
}
.life-glance-card__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-2);
}
.life-glance-card h2 {
  margin: 2px 0 0;
  font-size: clamp(1.125rem, 1.5vw, 1.375rem);
  font-weight: 650;
}
.life-glance-card__streak {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 3px 10px;
  border-radius: var(--radius-pill);
  color: var(--color-warning);
  background: color-mix(in srgb, var(--color-warning) 14%, transparent);
  font-family: var(--font-control);
  font-size: 0.72rem;
  font-weight: 700;
}
.life-glance-card__list {
  display: flex;
  flex: 1;
  min-height: 0;
  flex-direction: column;
  gap: 0;
}
.glance-row {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex: 1;
  padding: var(--space-2) 0;
  border-bottom: 1px solid color-mix(in srgb, var(--color-text) 14%, transparent);
  color: var(--color-text);
  text-decoration: none;
  transition:
    background-color var(--duration-fast) var(--ease-smooth-out),
    transform var(--duration-fast) var(--ease-smooth-out);
}
.glance-row:hover {
  background: var(--color-surface-soft);
}
.glance-row:last-child {
  border-bottom: 0;
}
.glance-row__icon {
  display: grid;
  width: 34px;
  height: 34px;
  flex-shrink: 0;
  place-items: center;
  border-radius: 10px;
  font-size: 1.1rem;
}
.glance-row--money .glance-row__icon {
  color: var(--color-primary);
  background: color-mix(in srgb, var(--color-primary) 12%, transparent);
}
.glance-row--learn .glance-row__icon {
  color: var(--color-primary);
  background: color-mix(in srgb, var(--color-primary) 12%, transparent);
}
.glance-row--notes .glance-row__icon {
  color: var(--color-primary);
  background: color-mix(in srgb, var(--color-primary) 12%, transparent);
}
.glance-row__body {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  gap: 1px;
}
.glance-row__body strong {
  overflow: hidden;
  font-family: var(--font-control);
  font-size: 0.82rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.glance-row__body small {
  overflow: hidden;
  color: var(--color-text-muted);
  font-size: 0.66rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.glance-row__bar {
  display: block;
  height: 4px;
  margin-top: 3px;
  border-radius: var(--radius-pill);
  background: color-mix(in srgb, var(--color-text) 10%, transparent);
  overflow: hidden;
}
.glance-row__bar > span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: var(--color-primary);
  transition: inline-size var(--duration-slow) var(--ease-smooth-out);
}
.glance-row__value {
  flex-shrink: 0;
  font-family: var(--font-heading);
  font-size: 1.1rem;
  font-weight: 700;
}
.glance-row__go {
  flex-shrink: 0;
  color: var(--color-text-muted);
  font-size: 1.1rem;
}
</style>
