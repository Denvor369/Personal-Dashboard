<template>
  <div class="avatar-uploader">
    <div class="avatar-uploader__preview">
      <img v-if="auth.avatarUrl" :src="auth.avatarUrl" alt="Profile picture preview" />
      <span v-else>{{ initials }}</span>
    </div>
    <div class="avatar-uploader__content">
      <strong>Profile picture</strong>
      <p>JPEG, PNG or WebP. Maximum 2 MB.</p>
      <div class="avatar-uploader__actions">
        <AppButton variant="ghost" size="small" :disabled="busy" @click="input?.click()">
          {{ auth.avatarUrl ? 'Replace' : 'Upload' }}
        </AppButton>
        <AppButton
          v-if="auth.profile?.avatar_url"
          variant="ghost"
          size="small"
          :disabled="busy"
          @click="remove"
          >Remove</AppButton
        >
      </div>
      <q-linear-progress
        v-if="auth.uploadProgress"
        rounded
        size="6px"
        :value="auth.uploadProgress"
        color="primary"
        aria-label="Avatar upload progress"
      />
    </div>
    <input
      ref="input"
      class="sr-only"
      type="file"
      accept="image/jpeg,image/png,image/webp"
      @change="upload"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useQuasar } from 'quasar';
import AppButton from '@/components/ui/AppButton.vue';
import { useAuthStore } from '@/stores/auth.store';

const auth = useAuthStore();
const $q = useQuasar();
const input = ref<HTMLInputElement>();
const busy = ref(false);
const initials = computed(() =>
  (auth.profile?.display_name ?? auth.user?.email ?? 'You')
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toLocaleUpperCase())
    .join(''),
);

async function upload(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;
  busy.value = true;
  try {
    await auth.uploadAvatar(file);
    $q.notify({ type: 'positive', message: 'Profile picture updated' });
  } catch {
    $q.notify({ type: 'negative', message: auth.error });
  } finally {
    busy.value = false;
    if (input.value) input.value.value = '';
  }
}

async function remove() {
  busy.value = true;
  try {
    await auth.removeAvatar();
    $q.notify({ type: 'positive', message: 'Profile picture removed' });
  } catch {
    $q.notify({ type: 'negative', message: auth.error });
  } finally {
    busy.value = false;
  }
}
</script>

<style scoped lang="scss">
.avatar-uploader {
  display: grid;
  grid-template-columns: auto 1fr;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3);
  border: var(--border-thin);
  border-radius: var(--radius-md);
  background: var(--color-surface-raised);
}
.avatar-uploader__preview {
  display: grid;
  width: 76px;
  height: 76px;
  place-items: center;
  overflow: hidden;
  border-radius: 50%;
  color: var(--color-on-primary);
  background: var(--color-primary);
  font-family: var(--font-heading);
  font-size: 1.25rem;
}
.avatar-uploader__preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.avatar-uploader__content {
  display: grid;
  gap: var(--space-1);
}
.avatar-uploader__content p {
  color: var(--color-text-muted);
  font-size: 0.75rem;
}
.avatar-uploader__actions {
  display: flex;
  gap: var(--space-2);
  flex-wrap: wrap;
}
@media (max-width: 420px) {
  .avatar-uploader {
    grid-template-columns: 1fr;
  }
}
</style>
