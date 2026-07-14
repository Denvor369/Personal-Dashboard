<template>
  <section class="welcome-overview" aria-labelledby="welcome-heading">
    <div class="welcome-overview__intro">
      <p class="dashboard-eyebrow">Daily overview</p>
      <h1 id="welcome-heading">{{ overview.greeting }}</h1>
      <p class="welcome-overview__context">
        <span>{{ currentDate }}</span>
        <span aria-hidden="true">•</span>
        <span>{{ dailyPrompt }}</span>
      </p>
    </div>

    <div class="welcome-overview__stats" aria-label="Daily statistics">
      <article v-for="stat in displayStats" :key="stat.label" class="overview-stat">
        <span class="overview-stat__label">{{ stat.label }}</span>
        <strong>{{ stat.value }}</strong>
        <small>{{ stat.detail }}</small>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { dashboardOverview as overview } from '@/data/dashboard.mock';
import { useReducedMotion } from '@/composables/useReducedMotion';

const props = withDefaults(defineProps<{ animate?: boolean }>(), { animate: false });
const reducedMotion = useReducedMotion();
const displayStats = ref(
  overview.stats.map((stat) => ({
    ...stat,
    value: props.animate && !reducedMotion.value && /^\d+$/.test(stat.value) ? '0' : stat.value,
  })),
);
let animationFrame: number | undefined;

const currentDate = computed(() => overview.message.split('·')[0]?.trim() ?? '');
const dailyPrompt = computed(() => overview.message.split('·')[1]?.trim() ?? '');

onMounted(() => {
  if (!props.animate || reducedMotion.value) return;
  const started = performance.now();
  const tick = (now: number) => {
    const progress = Math.min(1, (now - started) / 500);
    const eased = 1 - Math.pow(1 - progress, 3);
    displayStats.value = overview.stats.map((stat) => ({
      ...stat,
      value: /^\d+$/.test(stat.value) ? String(Math.round(Number(stat.value) * eased)) : stat.value,
    }));
    if (progress < 1) animationFrame = requestAnimationFrame(tick);
  };
  animationFrame = requestAnimationFrame(tick);
});

onBeforeUnmount(() => animationFrame && cancelAnimationFrame(animationFrame));
</script>

<style scoped lang="scss">
.welcome-overview {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4) var(--space-6);
  flex-wrap: wrap;
  padding: clamp(4px, 0.6vw, 10px) clamp(4px, 0.8vw, 12px);
}

.welcome-overview__intro {
  min-width: 0;
}

.welcome-overview__intro h1 {
  margin: 2px 0 0;
  font-size: clamp(1.85rem, 2.7vw, 2.65rem);
  font-weight: 700;
  line-height: 1.02;
  letter-spacing: -0.03em;
}

.welcome-overview__context {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin: 4px 0 0;
  color: var(--color-text-secondary);
  font-family: var(--font-body);
  font-size: 0.78rem;
  font-style: italic;
}

.welcome-overview__stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  overflow: hidden;
  border: var(--border-thin);
  border-radius: var(--radius-md);
}

.overview-stat {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 108px;
  padding: var(--space-2) var(--space-3);
  color: var(--color-text);
  background: var(--color-surface);
}

.overview-stat + .overview-stat {
  border-left: var(--border-thin);
}

.overview-stat__label {
  font-family: var(--font-control);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  white-space: nowrap;
}

.overview-stat strong {
  font-family: var(--font-heading);
  font-size: clamp(1.75rem, 2.2vw, 2.25rem);
  font-weight: 700;
  line-height: 1;
}

.overview-stat small {
  font-family: var(--font-body);
  font-size: 0.72rem;
  font-style: italic;
  color: var(--color-text-muted);
  white-space: nowrap;
}

@media (max-width: 767px) {
  .welcome-overview {
    align-items: stretch;
    flex-direction: column;
    gap: var(--space-3);
    padding-top: var(--space-2);
  }

  .welcome-overview__stats {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .overview-stat {
    min-width: 0;
  }
}

@media (max-width: 420px) {
  .welcome-overview__context {
    align-items: flex-start;
    gap: 2px;
    flex-direction: column;
  }

  .welcome-overview__context span[aria-hidden='true'] {
    display: none;
  }

  .overview-stat {
    padding: var(--space-2);
  }

  .overview-stat__label {
    font-size: 0.6rem;
    white-space: normal;
  }

  .overview-stat strong {
    font-size: 1.5rem;
  }

  .overview-stat small {
    overflow: hidden;
    font-size: 0.62rem;
    text-overflow: ellipsis;
  }
}
</style>
