<template>
  <div class="home-dashboard">
    <WelcomeOverview :animate="shouldAnimate" :class="{ 'motion-enter-overview': shouldAnimate }" />

    <main
      class="dashboard-grid"
      :class="{ 'motion-enter-cards': shouldAnimate }"
      aria-label="Personal productivity overview"
    >
      <CurrentFocusCard class="dashboard-grid__focus" />
      <WeeklyProgressCard class="dashboard-grid__progress" />
      <TodayTasksCard class="dashboard-grid__tasks" />
      <WeeklyCalendarCard class="dashboard-grid__calendar" />
      <FocusTimerCard class="dashboard-grid__timer" />
      <LifeGlanceCard class="dashboard-grid__quick" />
    </main>
  </div>
</template>

<script setup lang="ts">
import CurrentFocusCard from '@/components/dashboard/CurrentFocusCard.vue';
import FocusTimerCard from '@/components/dashboard/FocusTimerCard.vue';
import LifeGlanceCard from '@/components/dashboard/LifeGlanceCard.vue';
import TodayTasksCard from '@/components/dashboard/TodayTasksCard.vue';
import WeeklyCalendarCard from '@/components/dashboard/WeeklyCalendarCard.vue';
import WeeklyProgressCard from '@/components/dashboard/WeeklyProgressCard.vue';
import WelcomeOverview from '@/components/dashboard/WelcomeOverview.vue';

const motionKey = 'personal-dashboard-home-motion-played';
const shouldAnimate = sessionStorage.getItem(motionKey) !== 'true';
if (shouldAnimate) sessionStorage.setItem(motionKey, 'true');
</script>

<style scoped lang="scss">
.home-dashboard {
  display: flex;
  flex-direction: column;
  gap: clamp(18px, 1.5vw, 24px);
  height: 100%;
  min-height: 0;
  padding: clamp(10px, 1vw, 16px) clamp(2px, 0.5vw, 8px) clamp(20px, 2vw, 32px);
}

.dashboard-grid {
  display: grid;
  flex: 1;
  min-height: 0;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  grid-template-rows: minmax(280px, 1fr) minmax(260px, 0.9fr);
  grid-template-areas:
    'focus focus focus focus focus progress progress progress progress tasks tasks tasks'
    'calendar calendar calendar calendar calendar calendar timer timer timer quick quick quick';
  gap: clamp(14px, 1.2vw, 20px);
}

.home-dashboard :deep(.dashboard-card) {
  padding: clamp(16px, 1.5vw, 24px);
  border-color: color-mix(in srgb, var(--color-text) 18%, transparent);
  border-radius: 18px;
  box-shadow: none;
}

.home-dashboard :deep(.dashboard-card:hover) {
  border-color: color-mix(in srgb, var(--color-text) 28%, transparent);
  box-shadow: none;
  transform: none;
}

.home-dashboard :deep(.dashboard-eyebrow) {
  color: var(--color-text-muted);
  font-size: 0.68rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: none;
}

.dashboard-grid__focus {
  grid-area: focus;
}
.dashboard-grid__progress {
  grid-area: progress;
}
.dashboard-grid__tasks {
  grid-area: tasks;
}
.dashboard-grid__calendar {
  grid-area: calendar;
}
.dashboard-grid__timer {
  grid-area: timer;
}
.dashboard-grid__quick {
  grid-area: quick;
}

// Tablet: two columns, vertical scrolling is acceptable.
@media (max-width: 1100px) {
  .home-dashboard {
    height: auto;
  }

  .dashboard-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    grid-template-rows: none;
    grid-template-areas:
      'focus focus'
      'progress tasks'
      'calendar calendar'
      'timer quick';
  }
}

// Mobile: single column, prioritise focus, tasks, schedule.
@media (max-width: 767px) {
  .home-dashboard {
    gap: var(--space-4);
    padding-inline: 0;
  }

  .dashboard-grid {
    grid-template-columns: 1fr;
    grid-template-areas:
      'focus'
      'tasks'
      'calendar'
      'timer'
      'progress'
      'quick';
  }
}
</style>
