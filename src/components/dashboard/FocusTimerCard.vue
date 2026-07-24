<template>
  <article class="dashboard-card focus-timer-card">
    <header class="dashboard-card__header">
      <div>
        <p class="dashboard-eyebrow">Focus session</p>
        <h2>Focus timer</h2>
      </div>
      <span class="focus-timer-card__status">{{ running ? 'In progress' : 'Ready' }}</span>
    </header>

    <button
      type="button"
      class="focus-timer"
      :aria-label="`${formattedTime} remaining. Change session length`"
    >
      <svg viewBox="0 0 120 120" aria-hidden="true">
        <circle class="focus-timer__track" cx="60" cy="60" r="54" />
        <circle
          class="focus-timer__progress"
          cx="60"
          cy="60"
          r="54"
          :stroke-dashoffset="progressOffset"
        />
      </svg>
      <strong>{{ formattedTime }}</strong>
      <q-tooltip>Set session length</q-tooltip>
      <q-menu anchor="bottom middle" self="top middle">
        <q-list dense class="timer-menu">
          <q-item-label header>Session length</q-item-label>
          <q-item
            v-for="preset in [15, 20, 25, 45, 60]"
            :key="preset"
            v-close-popup
            clickable
            :active="durationSeconds === preset * 60"
            @click="setDuration(preset)"
          >
            <q-item-section>{{ preset }} minutes</q-item-section>
            <q-item-section v-if="durationSeconds === preset * 60" side>
              <q-icon name="check" />
            </q-item-section>
          </q-item>
          <q-separator />
          <q-item class="timer-menu__custom">
            <q-input
              v-model.number="customMinutes"
              dense
              outlined
              type="number"
              :min="1"
              :max="180"
              placeholder="Custom"
              suffix="min"
              aria-label="Custom minutes"
              @keyup.enter="applyCustom"
            />
            <q-btn
              v-close-popup
              flat
              dense
              no-caps
              label="Set"
              :disable="!customMinutes || customMinutes < 1 || customMinutes > 180"
              @click="applyCustom"
            />
          </q-item>
        </q-list>
      </q-menu>
    </button>

    <div class="focus-timer-card__task">
      <span>Working on</span>
      <strong>{{ timer.task }}</strong>
    </div>

    <div class="focus-timer-card__controls" aria-label="Focus timer controls">
      <q-btn
        rounded
        unelevated
        :icon="running ? 'pause' : 'play_arrow'"
        :label="running ? 'Pause' : 'Start focus'"
        :aria-label="running ? 'Pause focus timer' : 'Start focus timer'"
        @click="toggleTimer"
      >
        <q-tooltip>{{ running ? 'Pause focus timer' : 'Start focus timer' }}</q-tooltip>
      </q-btn>
      <q-btn flat round dense icon="restart_alt" aria-label="Reset focus timer" @click="resetTimer">
        <q-tooltip>Reset timer</q-tooltip>
      </q-btn>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue';
import { focusTimer as timer } from '@/data/dashboard.mock';

const circumference = 2 * Math.PI * 54;
const durationSeconds = ref(timer.durationSeconds);
const remaining = ref(timer.remainingSeconds);
const customMinutes = ref<number | null>(null);
const running = ref(false);
let interval: ReturnType<typeof setInterval> | undefined;

const formattedTime = computed(() => {
  const minutes = Math.floor(remaining.value / 60);
  const seconds = remaining.value % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
});

const progressOffset = computed(
  () => circumference * (1 - remaining.value / durationSeconds.value),
);

function stopTimer() {
  running.value = false;
  if (interval) clearInterval(interval);
  interval = undefined;
}

function toggleTimer() {
  if (running.value) {
    stopTimer();
    return;
  }

  if (remaining.value === 0) remaining.value = durationSeconds.value;
  running.value = true;
  interval = setInterval(() => {
    remaining.value -= 1;
    if (remaining.value === 0) stopTimer();
  }, 1000);
}

function resetTimer() {
  stopTimer();
  remaining.value = durationSeconds.value;
}

function setDuration(minutes: number) {
  stopTimer();
  durationSeconds.value = minutes * 60;
  remaining.value = durationSeconds.value;
}

function applyCustom() {
  if (!customMinutes.value || customMinutes.value < 1 || customMinutes.value > 180) return;
  setDuration(customMinutes.value);
}

onBeforeUnmount(stopTimer);
</script>

<style scoped lang="scss">
.focus-timer-card {
  display: flex;
  min-height: 0;
  flex-direction: column;
  align-items: center;
  color: var(--color-text);
  background: var(--color-surface);
}

.focus-timer-card .dashboard-card__header {
  width: 100%;
}

.focus-timer-card h2 {
  margin: 0;
  font-size: clamp(1.125rem, 1.5vw, 1.375rem);
  font-weight: 650;
  line-height: 1.1;
}

.focus-timer-card .dashboard-eyebrow {
  line-height: 1.2;
}

.focus-timer-card__status {
  padding: 0.25rem 0.6rem;
  border: 1px solid color-mix(in srgb, var(--brand-mint) 55%, transparent);
  border-radius: var(--radius-pill);
  color: var(--brand-mint);
  background: color-mix(in srgb, var(--brand-mint) 12%, transparent);
  font-family: var(--font-control);
  font-size: 0.68rem;
  line-height: 1.2;
}

.focus-timer {
  position: relative;
  display: grid;
  width: clamp(84px, 7vw, 108px);
  aspect-ratio: 1;
  place-content: center;
  margin: var(--space-1) auto 0;
  text-align: center;
}

.focus-timer svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}

.focus-timer circle {
  fill: none;
  stroke-width: 4;
}

.focus-timer__track {
  stroke: var(--color-progress-track);
}

.focus-timer__progress {
  stroke: var(--color-progress-fill);
  stroke-dasharray: 339.292;
  stroke-linecap: round;
  transition: stroke-dashoffset 1s linear;
}

.focus-timer strong {
  font-family: var(--font-heading);
  font-size: clamp(1.375rem, 1.8vw, 1.75rem);
  font-weight: 700;
  line-height: 1;
}

.focus-timer span {
  margin-top: var(--space-1);
  font-family: var(--font-control);
  font-size: 0.72rem;
  opacity: 0.7;
  text-transform: uppercase;
}

.focus-timer-card__task {
  display: grid;
  gap: 2px;
  width: 100%;
  padding: var(--space-2) var(--space-3);
  border-radius: 10px;
  background: color-mix(in srgb, var(--color-text) 5%, transparent);
  text-align: center;
}

.focus-timer-card__task span {
  color: var(--color-text-muted);
  font-family: var(--font-control);
  font-size: 0.62rem;
  text-transform: uppercase;
}

.focus-timer-card__task strong {
  font-family: var(--font-body);
  font-size: 0.8rem;
  font-weight: 400;
}

.focus-timer-card__controls {
  display: flex;
  width: 100%;
  gap: var(--space-2);
  margin-top: auto;
  padding-top: var(--space-1);
}

.focus-timer-card__controls .q-btn:first-child {
  flex: 1;
  min-height: 42px;
  color: var(--color-button-primary-text) !important;
  background: var(--color-button-primary-bg) !important;
}

@media (prefers-reduced-motion: reduce) {
  .focus-timer__progress {
    transition: none;
  }
}

@media (max-height: 800px) and (min-width: 1101px) {
  .focus-timer-card {
    gap: var(--space-1);
    padding: var(--space-3);
  }

  .focus-timer {
    width: 60px;
  }

  .focus-timer strong {
    font-size: 1.2rem;
  }

  .focus-timer-card__task {
    padding: var(--space-1) var(--space-2);
  }

  .focus-timer-card__task span {
    display: none;
  }

  .focus-timer-card__controls .q-btn:first-child {
    min-height: 36px;
  }
}
</style>
