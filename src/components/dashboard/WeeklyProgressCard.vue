<template>
  <article class="dashboard-card weekly-progress-card">
    <header class="dashboard-card__header">
      <div>
        <p class="dashboard-eyebrow">This week</p>
        <h2>Weekly progress</h2>
      </div>
      <q-btn
        flat
        rounded
        dense
        no-caps
        label="Details"
        icon-right="arrow_forward"
        to="/projects"
        aria-label="View project progress details"
      />
    </header>

    <div class="weekly-progress-card__summary">
      <strong>{{ progress.totalHours }}</strong>
      <div>
        <span>productive hours</span>
        <small>{{ progress.change }}</small>
      </div>
    </div>

    <div class="weekly-chart" aria-label="Productive hours by day">
      <div
        v-for="day in progress.days"
        :key="day.label"
        class="weekly-chart__day"
        :aria-label="`${day.label}: ${day.hours} productive hours`"
      >
        <small class="weekly-chart__hours" :class="{ 'weekly-chart__hours--current': day.current }"
          >{{ day.hours }}h</small
        >
        <div class="weekly-chart__track">
          <span
            class="weekly-chart__bar"
            :class="[
              `weekly-chart__bar--${day.level}`,
              { 'weekly-chart__bar--current': day.current },
            ]"
          />
        </div>
        <span class="weekly-chart__label" :class="{ 'weekly-chart__label--current': day.current }">
          {{ day.label }}
        </span>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import { weeklyProgress as progress } from '@/data/dashboard.mock';
</script>

<style scoped lang="scss">
.weekly-progress-card {
  gap: var(--space-3);
  background: var(--color-surface);
}

.weekly-progress-card h2 {
  margin: 2px 0 0;
  font-size: clamp(1.125rem, 1.5vw, 1.375rem);
  font-weight: 650;
}

.weekly-progress-card__summary {
  display: flex;
  align-items: flex-end;
  gap: var(--space-2);
}

.weekly-progress-card__summary strong {
  font-family: var(--font-heading);
  font-size: clamp(1.75rem, 2.6vw, 2.375rem);
  font-weight: 650;
  line-height: 0.9;
}

.weekly-progress-card__summary div {
  display: flex;
  flex-direction: column;
  padding-bottom: 0.2rem;
  font-family: var(--font-control);
  font-size: 0.78rem;
}

.weekly-progress-card__summary small {
  color: var(--color-text-muted);
}

.weekly-chart {
  display: grid;
  flex: 1;
  min-height: 64px;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: var(--space-3);
}

.weekly-chart__day {
  display: grid;
  grid-template-rows: auto 1fr auto;
  gap: var(--space-1);
  min-width: 0;
  text-align: center;
}

.weekly-chart__hours {
  color: var(--color-text-muted);
  font-family: var(--font-control);
  font-size: 0.58rem;
}

.weekly-chart__hours--current {
  color: var(--color-primary);
  font-weight: 700;
}

.weekly-chart__label {
  font-family: var(--font-control);
  font-size: 0.68rem;
}

.weekly-chart__track {
  display: flex;
  align-items: flex-end;
  min-height: 0;
  overflow: hidden;
  border-radius: 6px;
  background: color-mix(in srgb, var(--color-text) 7%, transparent);
}

.weekly-chart__bar {
  width: 100%;
  min-height: 10%;
  border-radius: 6px;
  background: color-mix(in srgb, var(--color-primary) 55%, transparent);
  transition: height var(--duration-slow) var(--ease-smooth-out);
}

@for $level from 1 through 10 {
  .weekly-chart__bar--#{$level} {
    height: $level * 10%;
  }
}

.weekly-chart__bar--current {
  background: var(--color-progress-fill);
}

.weekly-chart__label--current {
  color: var(--color-primary);
  font-weight: 700;
}

@media (max-width: 767px) {
  .weekly-chart {
    min-height: 120px;
  }
}
</style>
