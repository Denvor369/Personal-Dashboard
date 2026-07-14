<template>
  <article class="dashboard-card weekly-calendar-card">
    <header class="dashboard-card__header">
      <div>
        <p class="dashboard-eyebrow">Upcoming schedule</p>
        <h2>Weekly calendar</h2>
      </div>
      <q-btn
        no-caps
        rounded
        outline
        label="Open calendar"
        icon-right="arrow_forward"
        to="/calendar"
      />
    </header>

    <div class="weekly-calendar" aria-label="Calendar for July 13 to July 19">
      <section
        v-for="day in calendarDays"
        :key="day.label"
        class="calendar-day"
        :class="{ 'calendar-day--current': day.current }"
      >
        <header>
          <span>{{ day.label }}</span>
          <strong>{{ day.date }}</strong>
        </header>
        <div class="calendar-day__events">
          <RouterLink
            v-for="event in day.events"
            :key="event.id"
            to="/calendar"
            class="calendar-event"
            :class="`calendar-event--${event.tone}`"
            :aria-label="`Open ${event.title} at ${event.time}`"
          >
            <time>{{ event.time }}</time>
            <span>{{ event.title }}</span>
          </RouterLink>
          <span v-if="day.events.length === 0" class="calendar-day__empty">Open space</span>
        </div>
      </section>
    </div>
  </article>
</template>

<script setup lang="ts">
import { calendarDays } from '@/data/dashboard.mock';
</script>

<style scoped lang="scss">
.weekly-calendar-card {
  gap: var(--space-2);
  background: var(--color-surface);
}

.weekly-calendar-card h2 {
  margin: 2px 0 0;
  font-size: clamp(1.125rem, 1.5vw, 1.375rem);
  font-weight: 700;
}

.weekly-calendar-card > header .q-btn {
  color: var(--color-primary);
  border-color: var(--color-border-strong);
}

.weekly-calendar {
  display: grid;
  flex: 1;
  min-height: 0;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: var(--space-1);
}

.calendar-day {
  display: flex;
  min-height: 0;
  flex-direction: column;
  overflow: hidden;
  border: var(--border-thin);
  border-radius: var(--radius-sm);
  background: var(--color-surface-raised);
}

.calendar-day > header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px var(--space-2);
  font-family: var(--font-control);
  font-size: 0.72rem;
}

.calendar-day > header strong {
  display: grid;
  width: 24px;
  height: 24px;
  place-items: center;
  border-radius: 50%;
  font-family: var(--font-heading);
  font-size: 0.82rem;
  font-weight: 700;
}

.calendar-day--current > header strong {
  color: var(--color-on-primary);
  background: var(--color-primary);
}

.calendar-day--current {
  border-color: var(--color-primary);
  background: color-mix(in srgb, var(--color-surface) 72%, var(--brand-mint));
}

.calendar-day__events {
  display: flex;
  flex: 1;
  min-height: 0;
  flex-direction: column;
  gap: var(--space-1);
  padding: 0 4px 4px;
  overflow: hidden;
}

.calendar-event {
  display: flex;
  flex-direction: column;
  gap: 1px;
  padding: 4px var(--space-1);
  border-radius: var(--radius-sm);
  text-decoration: none;
}

.calendar-event:hover {
  filter: brightness(0.94);
}

.calendar-event span {
  overflow: hidden;
  font-size: 0.74rem;
  line-height: 1.2;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.calendar-event time {
  font-family: var(--font-control);
  font-size: 0.68rem;
  opacity: 0.75;
}

.calendar-event--deep {
  color: var(--color-on-strong-surface);
  background: var(--color-strong-surface);
}

.calendar-event--teal {
  color: var(--color-on-secondary);
  background: var(--color-secondary);
}

.calendar-event--mint {
  color: var(--color-on-primary);
  background: var(--color-primary);
}

.calendar-day__empty {
  padding: var(--space-2);
  font-size: 0.68rem;
  text-align: center;
  opacity: 0.45;
}

@media (max-width: 767px) {
  .weekly-calendar-card {
    min-height: 260px;
  }

  .weekly-calendar-card > header .q-btn {
    display: none;
  }

  .weekly-calendar {
    grid-template-columns: repeat(7, minmax(128px, 1fr));
    overflow-x: auto;
  }
}
</style>
