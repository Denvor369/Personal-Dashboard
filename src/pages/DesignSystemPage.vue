<template>
  <div class="ds container safe-bottom">
    <header class="ds__top">
      <div>
        <p class="text-caption">Development only · /design-system</p>
        <h1 class="text-page-title">Design System</h1>
      </div>
      <AppButton
        variant="dark"
        :icon-left="ui.theme === 'dark' ? 'light_mode' : 'dark_mode'"
        @click="ui.toggleTheme"
      >
        {{ ui.theme === 'dark' ? 'Light' : 'Dark' }} mode
      </AppButton>
    </header>

    <!-- Colors -->
    <section class="ds__section">
      <AppSectionHeader
        title="Brand colors"
        description="The four brand colors that dominate the interface."
      />
      <div class="ds__swatches">
        <div v-for="c in swatches" :key="c.name" class="ds__swatch">
          <span class="ds__chip" :style="{ background: c.hex, color: c.on }">Aa</span>
          <div>
            <strong class="font-interactive">{{ c.name }}</strong>
            <p class="text-caption">{{ c.hex }}</p>
          </div>
        </div>
      </div>
      <div class="ds__tokens">
        <span v-for="t in semanticTokens" :key="t" class="ds__token">
          <span class="ds__token-dot" :style="{ background: `var(${t})` }" />
          <code>{{ t }}</code>
        </span>
      </div>
    </section>

    <!-- Typography -->
    <section class="ds__section">
      <AppSectionHeader
        title="Typography"
        description="Micuale (headings), Charsey (body), Altere (interactive)."
      />
      <AppCard>
        <p class="text-page-title">Page title</p>
        <p class="text-section-title">Section title</p>
        <p class="text-card-title">Card title</p>
        <p class="text-statistic">128</p>
        <p class="text-body">
          Body text set in Charsey — the quick brown fox jumps over the lazy dog. Long-form,
          readable paragraph copy lives here with comfortable line height.
        </p>
        <p class="text-caption">Caption / muted supporting text.</p>
        <p class="font-interactive">Interactive font (Altere) — buttons, links, tabs.</p>
      </AppCard>
    </section>

    <!-- Buttons -->
    <section class="ds__section">
      <AppSectionHeader
        title="Buttons"
        description="Variants, sizes, icons, loading and disabled states."
      />
      <div class="ds__row">
        <AppButton variant="primary">Primary</AppButton>
        <AppButton variant="secondary">Secondary</AppButton>
        <AppButton variant="dark">Dark</AppButton>
        <AppButton variant="ghost">Ghost</AppButton>
      </div>
      <div class="ds__row">
        <AppButton size="small">Small</AppButton>
        <AppButton size="medium">Medium</AppButton>
        <AppButton size="large">Large</AppButton>
      </div>
      <div class="ds__row">
        <AppButton icon-left="add">Leading icon</AppButton>
        <AppButton icon-right="arrow_forward" variant="secondary">Trailing icon</AppButton>
        <AppButton :loading="true">Loading</AppButton>
        <AppButton :disabled="true">Disabled</AppButton>
      </div>
    </section>

    <!-- Icon buttons -->
    <section class="ds__section">
      <AppSectionHeader
        title="Icon buttons"
        description="Accessible label required; tooltip on hover/focus."
      />
      <div class="ds__row">
        <AppIconButton icon="favorite" label="Favorite" size="medium" />
        <AppIconButton icon="share" label="Share" size="medium" />
        <AppIconButton icon="edit" label="Edit" size="small" />
        <AppIconButton icon="delete" label="Delete" size="small" />
        <AppIconButton icon="star" label="Starred" :active="true" />
      </div>
    </section>

    <!-- Cards -->
    <section class="ds__section">
      <AppSectionHeader
        title="Cards"
        description="Four brand variants; optional title and action slot."
      />
      <div class="ds__grid">
        <AppCard title="Cream" variant="cream">
          <template #action><AppBadge variant="mint">New</AppBadge></template>
          <p class="text-body">Default surface card on the cream background.</p>
        </AppCard>
        <AppCard title="Mint" variant="mint">
          <p class="text-body">Mint accent card.</p>
        </AppCard>
        <AppCard title="Teal" variant="teal">
          <p class="text-body">Teal primary card.</p>
        </AppCard>
        <AppCard title="Dark" variant="dark">
          <p class="text-body">Deep-green dark card.</p>
        </AppCard>
      </div>
    </section>

    <!-- Badges -->
    <section class="ds__section">
      <AppSectionHeader title="Badges" />
      <div class="ds__row">
        <AppBadge variant="neutral">Neutral</AppBadge>
        <AppBadge variant="mint">Mint</AppBadge>
        <AppBadge variant="teal">Teal</AppBadge>
        <AppBadge variant="dark">Dark</AppBadge>
        <AppBadge variant="teal" size="compact">Compact</AppBadge>
      </div>
    </section>

    <!-- Progress -->
    <section class="ds__section">
      <AppSectionHeader
        title="Progress"
        description="Brand-color variants with accessible attributes."
      />
      <div class="ds__stack">
        <AppProgress
          :value="72"
          variant="primary"
          :show-percentage="true"
          label="Primary progress"
        />
        <AppProgress :value="45" variant="mint" :show-percentage="true" label="Mint progress" />
        <AppProgress :value="90" variant="dark" :show-percentage="true" label="Dark progress" />
      </div>
    </section>

    <!-- Empty state -->
    <section class="ds__section">
      <AppSectionHeader title="Empty state" />
      <AppCard padding="none">
        <AppEmptyState
          icon="inbox"
          title="Nothing here yet"
          description="When there's no data to show, this is what people see."
        >
          <template #action><AppButton icon-left="add">Create one</AppButton></template>
        </AppEmptyState>
      </AppCard>
    </section>

    <!-- Skeletons -->
    <section class="ds__section">
      <AppSectionHeader
        title="Skeletons"
        description="Card, text and circular loading placeholders."
      />
      <div class="ds__grid">
        <AppCard>
          <div class="ds__skeleton-row">
            <AppSkeleton variant="circular" />
            <AppSkeleton variant="text" :lines="2" width="100%" />
          </div>
        </AppCard>
        <AppCard><AppSkeleton variant="card" /></AppCard>
        <AppCard><AppSkeleton variant="text" :lines="4" /></AppCard>
      </div>
    </section>

    <!-- Focus test -->
    <section class="ds__section">
      <AppSectionHeader
        title="Keyboard focus"
        description="Press Tab to move through the controls — every focused element shows a clear focus ring."
      />
      <div class="ds__row">
        <AppButton>Tab to me</AppButton>
        <AppIconButton icon="settings" label="Settings" />
        <a class="font-interactive ds__link" href="#top">A focusable link</a>
        <input
          class="ds__input font-body"
          placeholder="A focusable input"
          aria-label="Demo input"
        />
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import AppButton from '@/components/ui/AppButton.vue';
import AppCard from '@/components/ui/AppCard.vue';
import AppIconButton from '@/components/ui/AppIconButton.vue';
import AppProgress from '@/components/ui/AppProgress.vue';
import AppBadge from '@/components/ui/AppBadge.vue';
import AppSectionHeader from '@/components/ui/AppSectionHeader.vue';
import AppEmptyState from '@/components/ui/AppEmptyState.vue';
import AppSkeleton from '@/components/ui/AppSkeleton.vue';
import { useUiStore } from '@/stores/ui.store';

const ui = useUiStore();

const swatches = [
  { name: 'Cream', hex: '#FFF4E1', on: '#1A312C' },
  { name: 'Mint', hex: '#89D7B7', on: '#1A312C' },
  { name: 'Teal', hex: '#428475', on: '#FFF4E1' },
  { name: 'Deep green', hex: '#1A312C', on: '#FFF4E1' },
];

const semanticTokens = [
  '--color-background',
  '--color-surface',
  '--color-surface-accent',
  '--color-primary',
  '--color-primary-hover',
  '--color-text',
  '--color-text-muted',
  '--color-border',
  '--color-focus',
  '--color-danger',
  '--color-warning',
];
</script>

<style scoped lang="scss">
.ds {
  padding-block: var(--space-2xl);
}
.ds__top {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--space-lg);
  flex-wrap: wrap;
  margin-bottom: var(--space-3xl);
}
.ds__section {
  margin-bottom: var(--space-4xl);
}
.ds__row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-md);
  margin-bottom: var(--space-md);
}
.ds__stack {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
  max-width: 520px;
}
.ds__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 240px), 1fr));
  gap: var(--space-lg);
}

.ds__swatches {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 160px), 1fr));
  gap: var(--space-lg);
  margin-bottom: var(--space-lg);
}
.ds__swatch {
  display: flex;
  align-items: center;
  gap: var(--space-md);
}
.ds__chip {
  display: grid;
  place-items: center;
  width: 56px;
  height: 56px;
  border-radius: var(--radius-sm);
  border: var(--border-thin);
  font-family: 'Micuale', sans-serif;
  font-weight: 700;
}
.ds__tokens {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-sm) var(--space-lg);
}
.ds__token {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs);
  font-size: 0.75rem;
}
.ds__token-dot {
  width: 14px;
  height: 14px;
  border-radius: 4px;
  border: var(--border-thin);
}

.ds__skeleton-row {
  display: flex;
  align-items: center;
  gap: var(--space-md);
}
.ds__link {
  color: var(--color-primary);
  text-decoration: underline;
  text-underline-offset: 3px;
}
.ds__input {
  padding: var(--space-sm) var(--space-md);
  border: var(--border-thin);
  border-radius: var(--radius-sm);
  background: var(--color-surface);
  color: var(--color-text);
}

.text-page-title,
.text-section-title,
.text-card-title,
.text-statistic {
  margin-bottom: var(--space-sm);
}
</style>
