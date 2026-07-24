<template>
  <article class="dashboard-card current-focus-card">
    <header class="current-focus-card__header">
      <p class="dashboard-eyebrow">{{ focus.eyebrow }}</p>
      <span>In progress</span>
    </header>

    <div class="current-focus-card__intro">
      <h2>{{ focus.title }}</h2>
      <p class="current-focus-card__desc">{{ focus.description }}</p>
    </div>

    <div class="current-focus-card__progress-panel">
      <strong class="current-focus-card__progress-value">{{ focus.progress }}%</strong>
      <div class="current-focus-card__progress-content">
        <div class="current-focus-card__progress-meta">
          <span>Project progress</span>
          <small>{{ 100 - focus.progress }}% remaining</small>
        </div>
        <div
          class="current-focus-card__track"
          role="progressbar"
          aria-label="Current focus progress"
          aria-valuemin="0"
          aria-valuemax="100"
          :aria-valuenow="focus.progress"
        >
          <span />
        </div>
      </div>
    </div>

    <q-btn
      no-caps
      unelevated
      rounded
      label="Continue project"
      icon-right="arrow_forward"
      to="/projects"
      aria-label="Continue current project"
    />
  </article>
</template>

<script setup lang="ts">
import { currentFocus as focus } from '@/data/dashboard.mock';
</script>

<style scoped lang="scss">
.current-focus-card {
  gap: var(--space-4);
  border-left: 3px solid var(--color-primary) !important;
  color: var(--color-text);
  background: var(--color-surface);
}

.current-focus-card__header,
.current-focus-card__progress-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
}

.current-focus-card__header > span {
  padding: 0.3rem 0.65rem;
  border-radius: var(--radius-pill);
  color: var(--color-primary);
  background: color-mix(in srgb, var(--color-primary) 12%, transparent);
  font-family: var(--font-control);
  font-size: 0.7rem;
  font-weight: 600;
}

.current-focus-card__intro {
  min-height: 0;
}

.current-focus-card h2 {
  margin: var(--space-2) 0 0;
  font-size: clamp(1.35rem, 1.8vw, 1.75rem);
  font-weight: 650;
  line-height: 1.18;
  letter-spacing: -0.025em;
}

.current-focus-card__desc {
  display: -webkit-box;
  max-width: 44ch;
  margin: var(--space-2) 0 0;
  overflow: hidden;
  color: var(--color-text-secondary);
  font-size: 0.82rem;
  line-height: 1.5;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.current-focus-card__progress-panel {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  gap: var(--space-3);
  margin-top: auto;
  padding-top: var(--space-4);
  border-top: 1px solid color-mix(in srgb, var(--color-text) 16%, transparent);
}

.current-focus-card__progress-value {
  font-family: var(--font-heading);
  font-size: clamp(2rem, 2.7vw, 2.6rem);
  font-weight: 650;
  line-height: 1;
}

.current-focus-card__progress-content {
  display: grid;
  min-width: 0;
  gap: var(--space-2);
}

.current-focus-card__progress-meta > span,
.current-focus-card__progress-meta small {
  font-family: var(--font-control);
  font-size: 0.7rem;
}

.current-focus-card__progress-meta small {
  color: var(--color-text-muted);
}

.current-focus-card > .q-btn {
  align-self: flex-start;
  min-height: 44px;
  color: var(--color-button-primary-text) !important;
  background: var(--color-button-primary-bg) !important;
}

.current-focus-card__track {
  height: 6px;
  overflow: hidden;
  border-radius: var(--radius-pill);
  background: var(--color-progress-track);
}

.current-focus-card__track span {
  display: block;
  width: 72%;
  height: 100%;
  border-radius: inherit;
  background: var(--color-primary);
}

@media (max-width: 767px) {
  .current-focus-card {
    min-height: 200px;
  }

  .current-focus-card > .q-btn {
    align-self: stretch;
  }
}
</style>
