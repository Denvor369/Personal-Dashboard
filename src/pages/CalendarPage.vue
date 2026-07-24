<template>
  <main class="dashboard-content-page calendar-page">
    <DashboardPageHeader
      eyebrow="Khmer calendar"
      title="Calendar · ប្រតិទិនខ្មែរ"
      :description="todayLunar.fullText"
    >
      <template #action
        ><AppButton variant="dark" icon-left="add" @click="openCreate"
          >New event</AppButton
        ></template
      >
    </DashboardPageHeader>

    <div class="workspace-panel calendar-workspace">
      <AppCard class="calendar-panel" padding="medium" radius="lg">
        <header class="calendar-toolbar">
          <div class="calendar-toolbar__month">
            <AppIconButton icon="chevron_left" label="Previous month" @click="changeMonth(-1)" />
            <div class="calendar-toolbar__label">
              <h2>{{ monthLabel }}</h2>
              <p lang="km">{{ lunarMonthsLabel }}</p>
            </div>
            <AppIconButton icon="chevron_right" label="Next month" @click="changeMonth(1)" />
            <AppButton variant="ghost" size="small" @click="goToToday">Today</AppButton>
          </div>
          <nav class="dashboard-pill-nav" aria-label="Calendar view">
            <button
              v-for="view in views"
              :key="view"
              type="button"
              class="dashboard-pill"
              :class="{ 'dashboard-pill--active': activeView === view }"
              :aria-pressed="activeView === view"
              @click="activeView = view"
            >
              {{ view }}
            </button>
          </nav>
        </header>

        <div v-if="activeView === 'Month'" class="calendar-legend" aria-label="Calendar legend">
          <span><q-icon name="celebration" /> Holiday</span>
          <span><q-icon name="brightness_2" /> ថ្ងៃសីល</span>
          <span><q-icon name="event" /> Personal event</span>
        </div>

        <div
          v-if="activeView === 'Month'"
          class="month-grid"
          :aria-label="`${monthLabel} calendar`"
        >
          <span v-for="day in weekdays" :key="day" class="month-grid__weekday">{{ day }}</span>
          <button
            v-for="day in monthDays"
            :key="day.key"
            type="button"
            class="month-day"
            :class="{
              'month-day--muted': day.muted,
              'month-day--today': day.today,
              'month-day--weekend': day.weekend,
              'month-day--sil': day.lunar.isSilDay,
            }"
            :aria-label="dayLabel(day)"
            @click="openDay(day)"
          >
            <span class="month-day__top">
              <strong>{{ day.date }}</strong>
              <q-icon
                v-if="day.lunar.isSilDay && !day.muted"
                class="month-day__moon"
                name="brightness_2"
                aria-label="Sil day"
              />
            </span>
            <template v-if="!day.muted">
              <small class="month-day__lunar" lang="km">
                {{ day.lunar.moonDayKhmer }}{{ day.lunar.moonStatus }}
              </small>
              <span class="month-day__footer">
                <span
                  v-if="day.holidays[0]"
                  class="month-day__chip month-day__chip--holiday"
                  lang="km"
                >
                  {{ day.holidays[0].nameKm }}
                </span>
                <span v-else-if="day.events[0]" class="month-day__chip month-day__chip--event">
                  {{ day.events[0].title }}
                </span>
                <span v-else-if="day.lunar.isSilDay" class="month-day__chip month-day__chip--sil" lang="km">
                  ថ្ងៃសីល
                </span>
                <span v-if="extraOccasions(day)" class="month-day__more"
                  >+{{ extraOccasions(day) }}</span
                >
              </span>
            </template>
          </button>
        </div>

        <div v-else class="workspace-scroll calendar-alternate-view">
          <article
            v-for="occasion in monthOccasions"
            :key="occasion.key"
            class="agenda-row"
            @click="openDay(occasion.day)"
          >
            <span class="occasion-icon" :class="`occasion-icon--${occasion.tone}`">
              <q-icon :name="occasion.icon" />
            </span>
            <time
              >{{ occasion.date }}<strong>{{ occasion.day.lunar.dayOfWeek }}</strong></time
            >
            <div>
              <h3 :lang="occasion.isKhmer ? 'km' : undefined">{{ occasion.title }}</h3>
              <p>{{ occasion.subtitle }}</p>
            </div>
            <AppBadge :variant="occasion.tone">{{ occasion.kind }}</AppBadge>
          </article>
          <p v-if="monthOccasions.length === 0" class="calendar-empty">
            No holidays or observances this month.
          </p>
        </div>
      </AppCard>

      <AppCard class="upcoming-panel" padding="medium" radius="lg">
        <header class="upcoming-panel__header">
          <div>
            <p class="dashboard-eyebrow">This month</p>
            <h2>Holidays & observances</h2>
          </div>
          <span>{{ monthOccasions.length }}</span>
        </header>
        <div class="workspace-scroll upcoming-list">
          <button
            v-for="occasion in monthOccasions"
            :key="occasion.key"
            type="button"
            class="upcoming-event"
            @click="openDay(occasion.day)"
          >
            <span class="upcoming-event__date"
              ><strong>{{ occasion.day.date }}</strong
              ><small>{{ monthShortLabel }}</small></span
            >
            <span class="upcoming-event__body"
              ><strong :lang="occasion.isKhmer ? 'km' : undefined">{{ occasion.title }}</strong
              ><small>{{ occasion.subtitle }}</small></span
            >
            <span class="occasion-icon" :class="`occasion-icon--${occasion.tone}`">
              <q-icon :name="occasion.icon" />
            </span>
          </button>
        </div>
      </AppCard>
    </div>

    <AppDetailPanel
      v-model="detailOpen"
      :eyebrow="selectedDay ? 'Khmer lunar date' : 'Event'"
      :title="detailTitle"
      :description="selectedDay?.lunar.fullText ?? 'Reserve time for what matters.'"
    >
      <dl v-if="selectedDay" class="workspace-detail-stack">
        <div class="workspace-detail-row">
          <dt>Gregorian</dt>
          <dd>{{ selectedDay.lunar.gregorianDateText }}</dd>
        </div>
        <div class="workspace-detail-row">
          <dt>Lunar</dt>
          <dd>{{ selectedDay.lunar.lunarDateText }}</dd>
        </div>
        <div class="workspace-detail-row">
          <dt>Observance</dt>
          <dd>{{ selectedDay.lunar.observanceText ?? '—' }}</dd>
        </div>
        <div
          v-for="holiday in selectedDay.holidays"
          :key="holiday.nameKm"
          class="workspace-detail-row"
        >
          <dt>{{ holiday.type }}</dt>
          <dd>
            {{ holiday.nameKm }}<br /><small>{{ holiday.nameEn }}</small>
          </dd>
        </div>
        <div v-for="event in selectedDay.events" :key="event.id" class="workspace-detail-row">
          <dt>{{ event.time }}</dt>
          <dd>
            {{ event.title }}<br /><small>{{ event.description }}</small>
          </dd>
        </div>
      </dl>
      <form v-else id="new-event-form" @submit.prevent="saveEvent">
        <label class="workspace-field"
          ><span class="workspace-field__label">Event title</span
          ><q-input v-model="draft.title" outlined autofocus
        /></label>
        <label class="workspace-field"
          ><span class="workspace-field__label">Date and time</span
          ><q-input v-model="draft.date" outlined type="datetime-local"
        /></label>
        <label class="workspace-field"
          ><span class="workspace-field__label">Duration</span
          ><q-select v-model="draft.duration" outlined :options="durations"
        /></label>
      </form>
      <template #actions
        ><AppButton
          v-if="!selectedDay"
          type="submit"
          form="new-event-form"
          :disabled="!draft.title.trim()"
          >Create event</AppButton
        ></template
      >
    </AppDetailPanel>
  </main>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { useQuasar } from 'quasar';
import { toKhmerLunarDate } from 'khmer-chhankitek-calendar';
import type { KhmerHoliday, KhmerLunarDate } from 'khmer-chhankitek-calendar';
import AppBadge from '@/components/ui/AppBadge.vue';
import AppButton from '@/components/ui/AppButton.vue';
import AppCard from '@/components/ui/AppCard.vue';
import AppDetailPanel from '@/components/ui/AppDetailPanel.vue';
import AppIconButton from '@/components/ui/AppIconButton.vue';
import DashboardPageHeader from '@/components/layout/DashboardPageHeader.vue';
import { workspaceEvents } from '@/data/workspace.mock';
import type { WorkspaceEvent } from '@/data/workspace.mock';

type CalendarView = 'Month' | 'Agenda';
type LocalEvent = WorkspaceEvent & { isoDate: string };
type CalendarDay = {
  key: string;
  isoDate: string;
  date: number;
  muted: boolean;
  today: boolean;
  weekend: boolean;
  lunar: KhmerLunarDate;
  holidays: KhmerHoliday[];
  events: LocalEvent[];
};
type CalendarOccasion = {
  key: string;
  day: CalendarDay;
  date: string;
  title: string;
  subtitle: string;
  kind: string;
  tone: 'mint' | 'teal' | 'dark';
  icon: string;
  isKhmer: boolean;
};

const holidayIcons: Record<string, string> = {
  "International New Year's Day": 'celebration',
  'Victory over Genocide Day': 'local_florist',
  'Meak Bochea': 'temple_buddhist',
  "International Women's Day": 'female',
  'Khmer New Year': 'festival',
  'International Labour Day': 'engineering',
  'Visak Bochea Day': 'temple_buddhist',
  'Royal Ploughing Ceremony': 'agriculture',
  "King's Birthday": 'workspace_premium',
  "Queen Mother's Birthday": 'workspace_premium',
  'Constitution Day': 'account_balance',
  'Pchum Ben Festival': 'temple_buddhist',
  'Pchum Ben': 'temple_buddhist',
  "Commemoration Day of King's Father": 'local_florist',
  'Coronation Day': 'workspace_premium',
  'Independence Day': 'flag',
  'Water Festival': 'rowing',
  'Peace Day in Cambodia': 'handshake',
};

const $q = useQuasar();
const views: CalendarView[] = ['Month', 'Agenda'];
const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const durations = ['30 min', '45 min', '1 hour', '2 hours'];
const now = new Date();
const todayIso = toIsoDate(now);
const activeView = ref<CalendarView>('Month');
const viewedMonth = ref(new Date(now.getFullYear(), now.getMonth(), 1, 12));
const events = ref<LocalEvent[]>(
  workspaceEvents.map((event, index) => ({
    ...event,
    isoDate: `2026-07-${String(13 + index * 2).padStart(2, '0')}`,
  })),
);
const detailOpen = ref(false);
const selectedDay = ref<CalendarDay | null>(null);
const draft = reactive({ title: '', date: '', duration: '30 min' });

const todayLunar = toKhmerLunarDate(todayIso);
const monthLabel = computed(() =>
  viewedMonth.value.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
);
const monthShortLabel = computed(() =>
  viewedMonth.value.toLocaleDateString('en-US', { month: 'short' }),
);
// Lunar month(s) spanned by the Gregorian month — shown once in the toolbar
// instead of repeated in all 42 day cells.
const lunarMonthsLabel = computed(() =>
  [
    ...new Set(monthDays.value.filter((day) => !day.muted).map((day) => day.lunar.khmerMonth)),
  ].join(' · '),
);
const monthDays = computed<CalendarDay[]>(() => {
  const year = viewedMonth.value.getFullYear();
  const month = viewedMonth.value.getMonth();
  const first = new Date(year, month, 1, 12);
  const mondayOffset = (first.getDay() + 6) % 7;

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(year, month, index - mondayOffset + 1, 12);
    const isoDate = toIsoDate(date);
    const lunar = toKhmerLunarDate(isoDate);
    return {
      key: isoDate,
      isoDate,
      date: date.getDate(),
      muted: date.getMonth() !== month,
      today: isoDate === todayIso,
      weekend: date.getDay() === 0 || date.getDay() === 6,
      lunar,
      holidays: lunar.holidays,
      events: events.value.filter((event) => event.isoDate === isoDate),
    };
  });
});
const monthOccasions = computed<CalendarOccasion[]>(() =>
  monthDays.value
    .filter((day) => !day.muted && (day.holidays.length || day.lunar.isSilDay || day.events.length))
    .flatMap((day) => {
      const date = new Date(`${day.isoDate}T12:00:00`).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
      const items: CalendarOccasion[] = day.holidays.map((holiday, index) => ({
        key: `${day.isoDate}-holiday-${index}`,
        day,
        date,
        title: holiday.nameKm,
        subtitle: holiday.nameEn ?? day.lunar.lunarDateText,
        kind: holiday.type,
        tone: holiday.type === 'public' ? ('dark' as const) : ('teal' as const),
        icon: holidayIcon(holiday),
        isKhmer: true,
      }));
      if (day.lunar.isSilDay) {
        items.push({
          key: `${day.isoDate}-sil`,
          day,
          date,
          title: 'ថ្ងៃសីល',
          subtitle: day.lunar.lunarDateText,
          kind: 'observance',
          tone: 'mint',
          icon: 'brightness_2',
          isKhmer: true,
        });
      }
      day.events.forEach((event) =>
        items.push({
          key: `${day.isoDate}-event-${event.id}`,
          day,
          date,
          title: event.title,
          subtitle: `${event.time} · ${event.duration}`,
          kind: 'personal',
          tone: event.tone,
          icon: 'event',
          isKhmer: false,
        }),
      );
      return items;
    }),
);
const detailTitle = computed(
  () =>
    selectedDay.value?.holidays[0]?.nameKm ??
    selectedDay.value?.events[0]?.title ??
    (selectedDay.value?.lunar.isSilDay ? 'ថ្ងៃសីល' : 'New event'),
);

function toIsoDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
function dayLabel(day: CalendarDay) {
  const occasions = [...day.holidays.map((holiday) => holiday.nameEn ?? holiday.nameKm)];
  if (day.lunar.isSilDay) occasions.push('Sil day');
  occasions.push(...day.events.map((event) => event.title));
  return `${day.isoDate}, ${day.lunar.lunarDateText}${occasions.length ? `, ${occasions.join(', ')}` : ''}`;
}
function extraOccasions(day: CalendarDay) {
  return Math.max(0, day.holidays.length + day.events.length - 1);
}
function holidayIcon(holiday: KhmerHoliday) {
  return (
    holidayIcons[holiday.nameEn ?? ''] ??
    (holiday.type === 'religious' ? 'temple_buddhist' : 'celebration')
  );
}
function openDay(day: CalendarDay) {
  selectedDay.value = day;
  detailOpen.value = true;
}
function openCreate() {
  selectedDay.value = null;
  Object.assign(draft, { title: '', date: '', duration: '30 min' });
  detailOpen.value = true;
}
function changeMonth(offset: number) {
  viewedMonth.value = new Date(
    viewedMonth.value.getFullYear(),
    viewedMonth.value.getMonth() + offset,
    1,
    12,
  );
}
function goToToday() {
  viewedMonth.value = new Date(now.getFullYear(), now.getMonth(), 1, 12);
}
function saveEvent() {
  if (!draft.title.trim()) return;
  const date = draft.date ? new Date(draft.date) : null;
  events.value.unshift({
    id: Date.now(),
    title: draft.title.trim(),
    isoDate: date ? toIsoDate(date) : todayIso,
    date: date ? date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' }) : 'Today',
    time: date ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—',
    duration: draft.duration,
    tone: 'mint',
    description: 'Created locally in this prototype.',
  });
  detailOpen.value = false;
  $q.notify({ type: 'positive', message: 'Event added to your calendar', timeout: 1400 });
}
</script>

<style scoped lang="scss">
.calendar-page :deep(.dashboard-page-header h1),
.calendar-page :deep(.dashboard-page-header__description),
.calendar-page [lang='km'] {
  font-family: 'Kantumruy Pro', var(--font-body);
}
.calendar-page :deep(.dashboard-page-header__description) {
  max-width: 76ch;
  font-size: 0.95rem;
  font-style: normal;
  line-height: 1.65;
  overflow-wrap: anywhere;
}
.calendar-workspace {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(300px, 340px);
  gap: var(--space-3);
}
.calendar-panel,
.upcoming-panel {
  display: flex;
  min-height: 0;
  flex-direction: column;
}
.calendar-toolbar,
.calendar-toolbar__month {
  display: flex;
  align-items: center;
}
.calendar-toolbar {
  justify-content: space-between;
  gap: var(--space-3);
  margin-bottom: var(--space-2);
}
.calendar-toolbar__month {
  gap: var(--space-1);
}
.calendar-toolbar__label {
  display: flex;
  min-width: 0;
  flex-direction: column;
  padding-inline: var(--space-1);
}
.calendar-toolbar__label p {
  overflow: hidden;
  color: var(--color-text-secondary);
  font-family: 'Kantumruy Pro', var(--font-body);
  font-size: 0.74rem;
  line-height: 1.5;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.calendar-toolbar h2,
.upcoming-panel h2 {
  font-size: 1.3rem;
  font-weight: 700;
  white-space: nowrap;
}
.calendar-legend {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: var(--space-1) var(--space-2);
  margin-bottom: var(--space-2);
  font-family: var(--font-control);
  font-size: 0.72rem;
}
.calendar-legend span {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: var(--color-text-secondary);
}
.calendar-legend .q-icon {
  color: var(--color-primary);
  font-size: 0.95rem;
}
.month-grid {
  display: grid;
  flex: 1;
  min-height: 0;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  grid-template-rows: auto repeat(6, minmax(86px, 1fr));
  gap: 6px;
}
.month-grid__weekday {
  padding: 4px 2px 8px;
  color: var(--color-text-secondary);
  font-family: var(--font-control);
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.09em;
  text-align: center;
  text-transform: uppercase;
}
.month-day {
  display: flex;
  min-width: 0;
  min-height: 0;
  align-items: flex-start;
  flex-direction: column;
  gap: 2px;
  padding: 8px 9px;
  border-radius: var(--radius-md);
  background: color-mix(in srgb, var(--color-text) 5%, transparent);
  text-align: left;
  overflow: hidden;
  transition:
    background-color 150ms ease,
    box-shadow 150ms ease;
}
.month-day--weekend {
  background: color-mix(in srgb, var(--color-text) 2.5%, transparent);
}
.month-day:hover {
  background: var(--color-surface-soft);
  box-shadow: inset 0 0 0 1px var(--color-primary);
}
.month-day__top {
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-1);
}
.month-day__top > strong {
  display: grid;
  width: 26px;
  height: 26px;
  place-items: center;
  border-radius: 50%;
  color: var(--color-text);
  font-family: var(--font-heading);
  font-size: 0.95rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}
.month-day__moon {
  color: var(--color-primary);
  font-size: 0.95rem;
}
.month-day__lunar {
  overflow: hidden;
  color: var(--color-text-muted);
  font-size: 0.72rem;
  font-weight: 500;
  line-height: 1.4;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.month-day__footer {
  display: flex;
  width: 100%;
  min-width: 0;
  align-items: center;
  gap: 4px;
  margin-top: auto;
}
.month-day__chip {
  display: block;
  min-width: 0;
  padding: 2px 8px;
  border-radius: var(--radius-pill);
  font-size: 0.7rem;
  font-weight: 600;
  line-height: 1.5;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.month-day__chip--holiday {
  color: var(--color-on-secondary);
  background: var(--color-secondary);
}
.month-day__chip--event {
  color: var(--brand-deep);
  background: var(--brand-mint);
}
.month-day__chip--sil {
  color: var(--color-primary);
  background: color-mix(in srgb, var(--brand-mint) 18%, transparent);
}
.month-day__more {
  flex: 0 0 auto;
  color: var(--color-text-muted);
  font-family: var(--font-control);
  font-size: 0.66rem;
  font-weight: 700;
}
.month-day--today {
  background: color-mix(in srgb, var(--brand-mint) 14%, transparent);
  box-shadow: inset 0 0 0 2px var(--color-primary);
}
.month-day--today .month-day__top > strong {
  color: var(--color-on-primary);
  background: var(--color-primary);
}
.month-day--muted {
  background: transparent;
  opacity: 0.4;
}
.month-day--sil:not(.month-day--today) {
  background: color-mix(in srgb, var(--brand-mint) 8%, transparent);
}
.upcoming-panel__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-3);
  margin-bottom: var(--space-3);
}
.upcoming-panel__header > span {
  display: grid;
  width: 34px;
  height: 34px;
  place-items: center;
  border-radius: 50%;
  color: var(--color-on-primary);
  background: var(--color-primary);
  font-family: var(--font-heading);
}
.upcoming-list {
  display: grid;
  align-content: start;
  gap: var(--space-2);
  scrollbar-width: none;
}
.upcoming-list::-webkit-scrollbar {
  display: none;
}
.occasion-icon {
  display: grid;
  width: 40px;
  height: 40px;
  flex: 0 0 auto;
  place-items: center;
  border-radius: 13px;
  font-size: 1.25rem;
}
.occasion-icon--mint {
  color: var(--brand-deep);
  background: var(--brand-mint);
}
.occasion-icon--teal {
  color: var(--color-on-secondary);
  background: var(--color-secondary);
}
.occasion-icon--dark {
  color: var(--color-on-strong-surface);
  background: var(--color-strong-surface);
}
.upcoming-event {
  display: grid;
  grid-template-columns: 44px minmax(0, 1fr) 30px;
  align-items: center;
  gap: var(--space-2);
  padding: 10px var(--space-2);
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  background: color-mix(in srgb, var(--color-text) 4%, transparent);
  text-align: left;
  transition:
    border-color 150ms ease,
    background-color 150ms ease,
    transform 150ms ease;
}
.upcoming-event:hover {
  border-color: var(--color-primary);
  background: var(--color-surface-soft);
  transform: translateX(2px);
}
.upcoming-event .occasion-icon {
  width: 30px;
  height: 30px;
  border-radius: 10px;
  font-size: 1rem;
}
.upcoming-event__body {
  display: flex;
  min-width: 0;
  flex-direction: column;
}
.upcoming-event__body strong {
  overflow: hidden;
  font-size: 0.88rem;
  font-weight: 600;
  line-height: 1.45;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.upcoming-event__date {
  display: flex;
  align-items: center;
  flex-direction: column;
  justify-content: center;
  gap: 1px;
  width: 44px;
  padding: 6px 0;
  border-radius: var(--radius-sm);
  color: var(--color-primary);
  background: color-mix(in srgb, var(--brand-mint) 16%, transparent);
  font-family: var(--font-heading);
  line-height: 1;
}
.upcoming-event__date strong {
  font-size: 1.05rem;
  font-variant-numeric: tabular-nums;
}
.upcoming-event__date small {
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.upcoming-event small {
  overflow: hidden;
  color: var(--color-text-muted);
  font-size: 0.72rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.calendar-alternate-view {
  display: grid;
  align-content: start;
  gap: var(--space-2);
}
.calendar-empty {
  padding: var(--space-5);
  color: var(--color-text-muted);
  text-align: center;
}
.agenda-row {
  display: grid;
  grid-template-columns: 40px 90px 1fr auto;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3);
  border: var(--border-thin);
  border-radius: var(--radius-md);
  cursor: pointer;
}
.agenda-row time {
  display: flex;
  flex-direction: column;
  font-family: var(--font-control);
}
.agenda-row h3 {
  font-size: 1rem;
  font-weight: 600;
  line-height: 1.5;
}
.agenda-row p {
  color: var(--color-text-muted);
  font-size: 0.78rem;
  font-style: italic;
}
.agenda-row:hover {
  border-color: var(--color-primary);
}
.month-day:focus-visible,
.upcoming-event:focus-visible,
.agenda-row:focus-visible {
  outline: 2px solid var(--color-focus);
  outline-offset: 2px;
}
@media (prefers-reduced-motion: reduce) {
  .month-day,
  .upcoming-event {
    transition: none;
  }
  .month-day:hover,
  .upcoming-event:hover {
    transform: none;
  }
}
@media (max-width: 900px) {
  .calendar-workspace {
    grid-template-columns: minmax(0, 1fr) 280px;
  }
  .calendar-toolbar {
    align-items: flex-start;
    flex-direction: column;
  }
}
@media (max-width: 767px) {
  .calendar-workspace {
    display: flex;
    flex-direction: column;
    overflow: visible;
  }
  .calendar-panel {
    width: 100%;
    min-width: 0;
    min-height: 560px;
  }
  .upcoming-panel {
    min-height: 300px;
  }
  .month-grid {
    width: 100%;
    grid-template-rows: auto repeat(6, 72px);
    gap: 3px;
  }
  .calendar-toolbar {
    align-items: stretch;
  }
  .calendar-toolbar__month {
    display: grid;
    width: 100%;
    grid-template-columns: 40px minmax(0, 1fr) 40px;
    gap: var(--space-1);
  }
  .calendar-toolbar__month h2 {
    overflow: hidden;
    text-align: center;
    text-overflow: ellipsis;
  }
  .calendar-toolbar__label {
    text-align: center;
  }
  .calendar-toolbar__month :deep(.app-btn) {
    width: 100%;
    grid-column: 1 / -1;
  }
  .calendar-toolbar .dashboard-pill-nav {
    width: 100%;
  }
  .calendar-toolbar .dashboard-pill {
    min-width: 0;
    flex: 1 1 0;
    padding-inline: var(--space-2);
  }
  .month-day__chip,
  .month-day__more {
    display: none;
  }
  .calendar-legend {
    justify-content: flex-start;
    gap: var(--space-1) var(--space-2);
    font-size: 0.64rem;
  }
  .month-grid__weekday {
    font-size: 0.58rem;
  }
  .month-day {
    padding: 4px;
  }
  .month-day__top > strong {
    width: 24px;
    height: 24px;
    font-size: 0.8rem;
  }
  .month-day__moon {
    font-size: 0.8rem;
  }
  .month-day__lunar {
    font-size: 0.6rem;
  }
}
</style>
