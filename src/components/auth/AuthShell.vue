<template>
  <main class="auth-page">
    <section class="auth-shell">
      <aside class="auth-brand-panel" aria-label="Personal Dashboard introduction">
        <RouterLink class="auth-brand" to="/">
          <img class="auth-brand__mark" src="/logo-mark.png" alt="" aria-hidden="true" />
          <strong>Personal Dashboard</strong>
        </RouterLink>

        <div class="auth-brand-copy">
          <p class="dashboard-eyebrow">Your space, kept personal</p>
          <h1>One calm place for everything that matters.</h1>
          <p>Plan your days, keep ideas close, and shape a dashboard that belongs only to you.</p>
        </div>

        <div class="auth-preview" aria-hidden="true">
          <div class="auth-preview__header">
            <span>Today’s overview</span><span class="auth-preview__avatar">YOU</span>
          </div>
          <div class="auth-preview__cards">
            <div class="auth-preview__card"><span>Current focus</span><strong>72%</strong></div>
            <div class="auth-preview__card"><span>Tasks done</span><strong>3/6</strong></div>
          </div>
        </div>
      </aside>

      <section class="auth-form-panel">
        <q-btn
          class="auth-form-panel__top"
          flat
          round
          :icon="ui.theme === 'dark' ? 'light_mode' : 'dark_mode'"
          :aria-label="`Switch to ${ui.theme === 'dark' ? 'light' : 'dark'} mode`"
          @click="ui.toggleTheme"
        />
        <div class="auth-card"><slot /></div>
      </section>
    </section>
  </main>
</template>

<script setup lang="ts">
import { useUiStore } from '@/stores/ui.store';

const ui = useUiStore();
</script>
