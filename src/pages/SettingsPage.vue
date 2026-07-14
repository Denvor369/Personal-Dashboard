<template>
  <main class="dashboard-content-page settings-page">
    <DashboardPageHeader
      eyebrow="Personal setup"
      title="Settings"
      description="Adjust one part of your workspace at a time."
    >
      <template #action
        ><AppButton
          v-if="activeSection !== 'profile'"
          :loading="saving"
          :disabled="!dirty"
          @click="saveSettings"
          >Save changes</AppButton
        ></template
      >
    </DashboardPageHeader>

    <AppCard class="workspace-panel settings-workspace" padding="none" radius="lg">
      <nav class="settings-nav" aria-label="Settings sections">
        <button
          v-for="section in settingsSections"
          :key="section.id"
          type="button"
          :class="{ 'settings-nav__item--active': activeSection === section.id }"
          :aria-current="activeSection === section.id ? 'page' : undefined"
          @click="selectSection(section.id)"
        >
          <q-icon :name="section.icon" /><span
            ><strong>{{ section.label }}</strong
            ><small>{{ section.description }}</small></span
          >
        </button>
      </nav>

      <section class="settings-content" :aria-labelledby="`${activeSection}-heading`">
        <header class="settings-content__header">
          <div>
            <p class="dashboard-eyebrow">Settings section</p>
            <h2 :id="`${activeSection}-heading`">{{ currentSection.label }}</h2>
            <p class="settings-content__description">{{ currentSection.description }}</p>
          </div>
          <AppButton
            v-if="activeSection !== 'privacy' && activeSection !== 'profile'"
            variant="ghost"
            size="small"
            @click="resetSection"
            >Reset section</AppButton
          >
        </header>

        <div class="workspace-scroll settings-form">
          <template v-if="activeSection === 'profile'">
            <ProfileSettingsForm @dirty-change="profileDirty = $event" />
          </template>

          <template v-else-if="activeSection === 'appearance'">
            <div class="appearance-group">
              <div>
                <p class="dashboard-eyebrow">Brand theme</p>
                <h3>Choose your dashboard style</h3>
              </div>
              <div class="theme-card-grid" role="radiogroup" aria-label="Brand theme">
                <button
                  v-for="themeOption in themes"
                  :key="themeOption.id"
                  type="button"
                  class="theme-option"
                  :class="{ 'theme-option--selected': ui.brandTheme === themeOption.id }"
                  role="radio"
                  :aria-checked="ui.brandTheme === themeOption.id"
                  @click="ui.setBrandTheme(themeOption.id)"
                >
                  <span
                    class="theme-option__preview"
                    :style="{
                      '--preview-background': themeOption.preview[0],
                      '--preview-secondary': themeOption.preview[1],
                      '--preview-primary': themeOption.preview[2],
                      '--preview-accent': themeOption.preview[3],
                    }"
                    aria-hidden="true"
                  >
                    <span class="theme-option__preview-nav" />
                    <span class="theme-option__preview-feature" />
                    <span class="theme-option__preview-card" />
                    <span class="theme-option__preview-card" />
                  </span>
                  <span class="theme-option__copy">
                    <strong>{{ themeOption.name }}</strong>
                    <small>{{ themeOption.description }}</small>
                    <span class="theme-option__swatches" aria-hidden="true">
                      <i
                        v-for="color in themeOption.preview"
                        :key="color"
                        :style="{ backgroundColor: color }"
                      />
                    </span>
                  </span>
                  <span
                    class="theme-option__selected"
                    :class="{ 'theme-option__selected--visible': ui.brandTheme === themeOption.id }"
                    aria-hidden="true"
                  >
                    <q-icon name="check" />
                  </span>
                </button>
              </div>
            </div>

            <div class="appearance-group">
              <div>
                <p class="dashboard-eyebrow">Appearance</p>
                <h3>Choose how light and dark surfaces behave</h3>
              </div>
              <div class="appearance-options" role="radiogroup" aria-label="Appearance mode">
                <button
                  v-for="option in appearanceOptions"
                  :key="option.value"
                  type="button"
                  :class="{ 'appearance-option--selected': ui.appearance === option.value }"
                  role="radio"
                  :aria-checked="ui.appearance === option.value"
                  @click="ui.setAppearance(option.value)"
                >
                  <q-icon :name="option.icon" />
                  <span
                    ><strong>{{ option.label }}</strong
                    ><small>{{ option.description }}</small></span
                  >
                </button>
              </div>
              <p class="system-status">
                <q-icon name="computer" /> System currently resolves to
                <strong>{{ ui.theme }}</strong
                >.
              </p>
            </div>

            <div class="setting-row">
              <div>
                <strong>Compact density</strong>
                <p>Keep more useful information in view.</p>
              </div>
              <q-toggle v-model="form.compact" aria-label="Compact density" />
            </div>
            <div class="setting-row">
              <div>
                <strong>Reduced decoration</strong>
                <p>Prefer calmer surfaces and fewer visual effects.</p>
              </div>
              <q-toggle v-model="form.reducedDecoration" aria-label="Reduced decoration" />
            </div>
          </template>

          <template v-else-if="activeSection === 'notifications'">
            <div v-for="item in notificationOptions" :key="item.key" class="setting-row">
              <div>
                <strong>{{ item.label }}</strong>
                <p>{{ item.description }}</p>
              </div>
              <q-toggle v-model="form[item.key]" :aria-label="item.label" />
            </div>
          </template>

          <template v-else-if="activeSection === 'services'">
            <div v-for="service in services" :key="service.name" class="service-row">
              <span><q-icon :name="service.icon" /></span>
              <div>
                <strong>{{ service.name }}</strong>
                <p>{{ service.description }}</p>
              </div>
              <AppButton
                variant="ghost"
                size="small"
                @click="showPlaceholder(`${service.name} connection`)"
                >{{ service.connected ? 'Manage' : 'Connect' }}</AppButton
              >
            </div>
          </template>

          <template v-else-if="activeSection === 'dashboard'">
            <div v-for="item in dashboardOptions" :key="item.key" class="setting-row">
              <div>
                <strong>{{ item.label }}</strong>
                <p>{{ item.description }}</p>
              </div>
              <q-toggle v-model="form[item.key]" :aria-label="item.label" />
            </div>
          </template>

          <template v-else>
            <div class="setting-row">
              <div>
                <strong>Session security</strong>
                <p>Require verification for sensitive changes.</p>
              </div>
              <q-toggle v-model="form.sessionSecurity" aria-label="Session security" />
            </div>
            <div class="privacy-card">
              <q-icon name="download" />
              <div>
                <strong>Export dashboard data</strong>
                <p>Download a copy when data storage is enabled.</p>
              </div>
              <AppButton variant="ghost" size="small" disabled>Export</AppButton>
            </div>
            <div class="privacy-card privacy-card--danger">
              <q-icon name="delete_outline" />
              <div>
                <strong>Reset dashboard</strong>
                <p>Return local preferences to their defaults.</p>
              </div>
              <AppButton variant="ghost" size="small" @click="confirmReset = true">Reset</AppButton>
            </div>
          </template>
        </div>
      </section>
    </AppCard>

    <q-dialog v-model="confirmReset">
      <q-card class="confirm-dialog"
        ><q-card-section
          ><p class="dashboard-eyebrow">Confirmation</p>
          <h2>Reset dashboard preferences?</h2>
          <p>
            This clears local display preferences. Your placeholder content stays unchanged.
          </p></q-card-section
        ><q-card-actions align="right"
          ><AppButton variant="ghost" @click="confirmReset = false">Cancel</AppButton
          ><AppButton variant="dark" @click="resetDashboard"
            >Reset preferences</AppButton
          ></q-card-actions
        ></q-card
      >
    </q-dialog>
  </main>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { onBeforeRouteLeave } from 'vue-router';
import { useQuasar } from 'quasar';
import AppButton from '@/components/ui/AppButton.vue';
import AppCard from '@/components/ui/AppCard.vue';
import DashboardPageHeader from '@/components/layout/DashboardPageHeader.vue';
import ProfileSettingsForm from '@/components/settings/ProfileSettingsForm.vue';
import { settingsSections } from '@/data/workspace.mock';
import type { SettingsSection } from '@/data/workspace.mock';
import { useUiStore } from '@/stores/ui.store';
import { themes } from '@/themes/theme.registry';
import type { AppearancePreference } from '@/themes/theme.types';

type ToggleKey =
  | 'emailReminders'
  | 'desktopAlerts'
  | 'weeklySummary'
  | 'showFocus'
  | 'showSchedule'
  | 'showQuickAccess';
const $q = useQuasar();
const ui = useUiStore();
const activeSection = ref<SettingsSection['id']>('profile');
const dirty = ref(false);
const profileDirty = ref(false);
const saving = ref(false);
const confirmReset = ref(false);
const defaultPreferences = {
  compact: true,
  reducedDecoration: false,
  emailReminders: true,
  desktopAlerts: true,
  weeklySummary: true,
  showFocus: true,
  showSchedule: true,
  showQuickAccess: true,
  sessionSecurity: true,
};
const form = reactive({ ...defaultPreferences });
const appearanceOptions: Array<{
  value: AppearancePreference;
  label: string;
  description: string;
  icon: string;
}> = [
  { value: 'light', label: 'Light', description: 'Always use light surfaces.', icon: 'light_mode' },
  { value: 'dark', label: 'Dark', description: 'Always use dark surfaces.', icon: 'dark_mode' },
  { value: 'system', label: 'System', description: 'Follow this device.', icon: 'computer' },
];
const notificationOptions: Array<{ key: ToggleKey; label: string; description: string }> = [
  {
    key: 'emailReminders',
    label: 'Email reminders',
    description: 'Receive reminders for important deadlines.',
  },
  {
    key: 'desktopAlerts',
    label: 'Desktop alerts',
    description: 'Show time-sensitive notifications while working.',
  },
  {
    key: 'weeklySummary',
    label: 'Weekly summary',
    description: 'Get a short review every Friday afternoon.',
  },
];
const dashboardOptions: Array<{ key: ToggleKey; label: string; description: string }> = [
  { key: 'showFocus', label: 'Current focus', description: 'Show the active project on Home.' },
  {
    key: 'showSchedule',
    label: 'Upcoming schedule',
    description: 'Keep the compact weekly calendar visible.',
  },
  {
    key: 'showQuickAccess',
    label: 'Quick access',
    description: 'Show shortcuts to notes and recent items.',
  },
];
const services = [
  {
    name: 'Google Calendar',
    description: 'Calendar connection placeholder.',
    icon: 'event',
    connected: false,
  },
  {
    name: 'Notion',
    description: 'Knowledge workspace placeholder.',
    icon: 'description',
    connected: false,
  },
  { name: 'GitHub', description: 'Project activity placeholder.', icon: 'code', connected: false },
];
const currentSection = computed(
  () =>
    settingsSections.find((section) => section.id === activeSection.value) ?? settingsSections[0]!,
);
watch(form, () => (dirty.value = true), { deep: true });

function saveSettings() {
  saving.value = true;
  window.setTimeout(() => {
    saving.value = false;
    dirty.value = false;
    $q.notify({ type: 'positive', message: 'Preferences saved', timeout: 1400 });
  }, 450);
}
function resetSection() {
  if (activeSection.value === 'appearance') {
    Object.assign(form, {
      compact: defaultPreferences.compact,
      reducedDecoration: defaultPreferences.reducedDecoration,
    });
    ui.setBrandTheme('botanical');
    ui.setAppearance('system');
  }
  if (activeSection.value === 'notifications')
    Object.assign(form, {
      emailReminders: defaultPreferences.emailReminders,
      desktopAlerts: defaultPreferences.desktopAlerts,
      weeklySummary: defaultPreferences.weeklySummary,
    });
  if (activeSection.value === 'dashboard')
    Object.assign(form, {
      showFocus: defaultPreferences.showFocus,
      showSchedule: defaultPreferences.showSchedule,
      showQuickAccess: defaultPreferences.showQuickAccess,
    });
  dirty.value = true;
  $q.notify({ message: `${currentSection.value.label} reset to defaults`, timeout: 1400 });
}
function selectSection(section: SettingsSection['id']) {
  if (activeSection.value === 'profile' && profileDirty.value) {
    if (!window.confirm('Discard unsaved profile changes?')) return;
    profileDirty.value = false;
  }
  activeSection.value = section;
}
function showPlaceholder(action: string) {
  $q.notify({ message: `${action} will be available with connected services`, timeout: 1800 });
}
function resetDashboard() {
  Object.assign(form, defaultPreferences);
  ui.setBrandTheme('botanical');
  ui.setAppearance('system');
  confirmReset.value = false;
  dirty.value = false;
  $q.notify({ type: 'positive', message: 'Dashboard preferences reset', timeout: 1400 });
}

onBeforeRouteLeave(
  () =>
    (!dirty.value && !profileDirty.value) ||
    window.confirm('You have unsaved settings. Leave without saving?'),
);
</script>

<style scoped lang="scss">
.settings-workspace {
  display: grid;
  grid-template-columns: 250px minmax(0, 1fr);
}
.settings-nav {
  padding: var(--space-2);
  border-right: var(--border-thin);
  overflow-y: auto;
}
.settings-nav button {
  display: grid;
  width: 100%;
  min-height: 58px;
  grid-template-columns: 36px 1fr;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2);
  border-radius: var(--radius-sm);
  text-align: left;
}
.settings-nav button:hover {
  background: var(--color-surface-soft);
}
.settings-nav__item--active {
  color: var(--color-on-primary);
  background: var(--color-primary) !important;
}
.settings-nav button > .q-icon {
  font-size: 1.25rem;
}
.settings-nav button span {
  display: flex;
  min-width: 0;
  flex-direction: column;
}
.settings-nav button strong {
  font-size: 0.8rem;
  font-weight: 700;
}
.settings-nav button small {
  overflow: hidden;
  font-size: 0.68rem;
  opacity: 0.72;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.settings-content {
  display: flex;
  min-width: 0;
  min-height: 0;
  flex-direction: column;
  padding: var(--space-4);
}
.settings-content__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-3);
  margin-bottom: var(--space-4);
}
.settings-content__header h2 {
  margin-top: 2px;
  font-size: 1.5rem;
  font-weight: 700;
}
.settings-content__description {
  margin-top: var(--space-1);
  color: var(--color-text-muted);
  font-size: 0.78rem;
  font-style: italic;
}
.settings-form {
  padding-right: var(--space-2);
}
.appearance-group {
  display: grid;
  gap: var(--space-3);
  padding: 0 0 var(--space-4);
}
.appearance-group + .appearance-group {
  padding-top: var(--space-4);
  border-top: var(--border-thin);
}
.appearance-group h3 {
  margin-top: var(--space-1);
  font-size: 1rem;
}
.theme-card-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-3);
}
.theme-option {
  position: relative;
  display: grid;
  min-width: 0;
  grid-template-columns: 112px minmax(0, 1fr);
  gap: var(--space-3);
  padding: var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  text-align: left;
  transition:
    transform var(--duration-card) var(--ease-smooth-out),
    border-color var(--duration-card) var(--ease-smooth-out),
    box-shadow var(--duration-card) var(--ease-smooth-out);
}
.theme-option:hover {
  transform: translateY(-2px);
  border-color: var(--color-border-strong);
  box-shadow: var(--shadow-md);
}
.theme-option--selected {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--color-primary) 22%, transparent);
}
.theme-option__preview {
  display: grid;
  height: 84px;
  grid-template-columns: 1.3fr 0.7fr;
  grid-template-rows: 18px 1fr;
  gap: 5px;
  padding: 7px;
  border: 1px solid color-mix(in srgb, var(--preview-accent) 28%, transparent);
  border-radius: var(--radius-sm);
  background: var(--preview-background);
  transition: transform var(--duration-card) var(--ease-smooth-out);
}
.theme-option:hover .theme-option__preview {
  transform: scale(1.02);
}
.theme-option__preview > span {
  border-radius: 6px;
}
.theme-option__preview-nav {
  grid-column: 1 / -1;
  background: var(--preview-accent);
}
.theme-option__preview-feature {
  background: var(--preview-secondary);
}
.theme-option__preview-card {
  background: color-mix(in srgb, var(--preview-background) 76%, white);
  border: 1px solid color-mix(in srgb, var(--preview-accent) 34%, transparent);
}
.theme-option__copy {
  display: flex;
  min-width: 0;
  flex-direction: column;
  justify-content: center;
}
.theme-option__copy strong {
  font-size: 0.9rem;
}
.theme-option__copy small {
  margin-top: 2px;
  color: var(--color-text-muted);
  font-family: var(--font-body);
  font-size: 0.72rem;
  line-height: 1.3;
}
.theme-option__swatches {
  display: flex;
  gap: 5px;
  margin-top: var(--space-2);
}
.theme-option__swatches i {
  width: 18px;
  height: 18px;
  border: 1px solid var(--color-border);
  border-radius: 50%;
}
.theme-option__selected {
  position: absolute;
  top: var(--space-2);
  right: var(--space-2);
  display: grid;
  width: 24px;
  height: 24px;
  place-items: center;
  border-radius: 50%;
  color: var(--color-button-primary-text);
  background: var(--color-button-primary-bg);
  opacity: 0;
  transform: scale(0.65);
  transition:
    opacity var(--duration-fast) var(--ease-smooth-out),
    transform var(--duration-fast) var(--ease-smooth-out);
}
.theme-option__selected--visible {
  opacity: 1;
  transform: scale(1);
}
.appearance-options {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--space-2);
}
.appearance-options button {
  display: flex;
  min-height: 64px;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  border: var(--border-thin);
  border-radius: var(--radius-sm);
  text-align: left;
}
.appearance-options button:hover {
  background: var(--color-surface-soft);
}
.appearance-options .q-icon {
  font-size: 1.25rem;
}
.appearance-options button span {
  display: flex;
  flex-direction: column;
}
.appearance-options button small {
  color: var(--color-text-muted);
  font-family: var(--font-body);
  font-size: 0.68rem;
}
.appearance-option--selected {
  color: var(--color-nav-active-text);
  background: var(--color-nav-active-bg) !important;
}
.appearance-option--selected small {
  color: inherit !important;
  opacity: 0.78;
}
.system-status {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  color: var(--color-text-muted);
  font-size: 0.76rem;
}
.setting-row,
.service-row,
.privacy-card {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: var(--space-3);
  min-height: 68px;
  padding: var(--space-3);
  border-bottom: var(--border-thin);
}
.service-row > span {
  display: grid;
  width: 48px;
  height: 48px;
  place-items: center;
  border-radius: 50%;
  color: var(--color-on-primary);
  background: var(--color-primary);
  font-family: var(--font-heading);
}
.setting-row p,
.service-row p,
.privacy-card p {
  color: var(--color-text-muted);
  font-size: 0.78rem;
  font-style: italic;
}
.setting-row {
  grid-template-columns: 1fr auto;
}
.privacy-card {
  margin-top: var(--space-2);
  border: var(--border-thin);
  border-radius: var(--radius-md);
}
.privacy-card--danger {
  border-color: var(--color-danger);
}
.privacy-card > .q-icon {
  color: var(--color-primary);
  font-size: 1.5rem;
}
.confirm-dialog {
  width: min(460px, calc(100vw - 32px));
  color: var(--color-text);
  background: var(--color-surface);
  border: var(--border-thin);
  border-radius: var(--radius-lg);
}
.confirm-dialog h2 {
  margin: var(--space-1) 0 var(--space-2);
  font-size: 1.5rem;
  font-weight: 700;
}
@media (max-width: 767px) {
  .settings-workspace {
    display: flex;
    min-height: 620px;
    flex-direction: column;
    overflow: visible;
  }
  .settings-nav {
    display: flex;
    flex-shrink: 0;
    gap: var(--space-1);
    border-right: 0;
    border-bottom: var(--border-thin);
    overflow-x: auto;
  }
  .settings-nav button {
    width: auto;
    min-width: 120px;
    grid-template-columns: auto 1fr;
  }
  .settings-nav button small {
    display: none;
  }
  .settings-content {
    min-height: 500px;
  }
  .theme-card-grid,
  .appearance-options {
    grid-template-columns: 1fr;
  }
}
</style>
