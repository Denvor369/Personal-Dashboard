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
  gap: clamp(10px, 1vw, 16px);
  height: 100%;
  min-height: 0;
  padding: clamp(4px, 0.6vw, 10px) clamp(4px, 0.8vw, 12px);
}

.dashboard-grid {
  display: grid;
  flex: 1;
  min-height: 0;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  grid-template-rows: minmax(200px, 1fr) minmax(212px, 0.82fr);
  grid-template-areas:
    'focus focus focus focus progress progress progress progress tasks tasks tasks tasks'
    'calendar calendar calendar calendar calendar calendar timer timer timer quick quick quick';
  gap: clamp(10px, 0.9vw, 14px);
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
