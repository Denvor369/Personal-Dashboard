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
  gap: var(--space-3);
  color: var(--color-on-focus-card);
  background: var(--color-focus-card);
}

.current-focus-card__header,
.current-focus-card__progress-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
}

.current-focus-card__header > span {
  padding: 0.25rem 0.65rem;
  border: 1px solid currentColor;
  border-radius: var(--radius-pill);
  font-family: var(--font-control);
  font-size: 0.68rem;
  opacity: 0.82;
}

.current-focus-card__intro {
  min-height: 0;
}

.current-focus-card h2 {
  margin: var(--space-1) 0 0;
  font-size: clamp(1.25rem, 1.8vw, 1.6rem);
  font-weight: 700;
  line-height: 1.1;
  letter-spacing: -0.02em;
}

.current-focus-card__desc {
  display: -webkit-box;
  margin: var(--space-1) 0 0;
  overflow: hidden;
  font-size: 0.84rem;
  font-style: italic;
  line-height: 1.4;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.current-focus-card__progress-panel {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  gap: var(--space-3);
  margin-top: auto;
  padding: var(--space-3);
  border: 1px solid color-mix(in srgb, currentColor 25%, transparent);
  border-radius: var(--radius-sm);
  background: color-mix(in srgb, var(--color-focus-card) 78%, var(--color-shell));
}

.current-focus-card__progress-value {
  font-family: var(--font-heading);
  font-size: clamp(2rem, 3vw, 2.75rem);
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
  opacity: 0.72;
}

.current-focus-card > .q-btn {
  align-self: flex-start;
  min-height: 44px;
  color: var(--color-button-primary-text) !important;
  background: var(--color-button-primary-bg) !important;
}

.current-focus-card__track {
  height: 8px;
  overflow: hidden;
  border-radius: var(--radius-pill);
  border: 1px solid var(--color-border);
  background: var(--color-focus-progress-track);
}

.current-focus-card__track span {
  display: block;
  width: 72%;
  height: 100%;
  border-radius: inherit;
  background: var(--color-focus-progress-fill);
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
