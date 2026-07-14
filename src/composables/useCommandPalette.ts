// Shared UI state for the command palette + quick-add sheet (module-level
// singleton — no Pinia store needed). Holds open/mode/query and recent-command
// history; command definitions live in command.registry.ts.
import { ref } from 'vue';

export type PaletteMode = 'all' | 'create';

const RECENT_KEY = 'personal-dashboard-command-recent';
const MAX_RECENT = 5;

function loadRecent(): string[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]');
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string').slice(0, MAX_RECENT) : [];
  } catch {
    return [];
  }
}

const open = ref(false);
const mode = ref<PaletteMode>('all');
const query = ref('');
const quickAddSheetOpen = ref(false);
const recentIds = ref<string[]>(loadRecent());

export function useCommandPalette() {
  function openPalette(nextMode: PaletteMode = 'all') {
    mode.value = nextMode;
    query.value = '';
    open.value = true;
  }
  function close() {
    open.value = false;
  }
  function toggle() {
    if (open.value) close();
    else openPalette('all');
  }
  function rememberCommand(id: string) {
    // Data-search hits are ephemeral; only remember reusable commands.
    if (id.startsWith('data-')) return;
    const next = [id, ...recentIds.value.filter((x) => x !== id)].slice(0, MAX_RECENT);
    recentIds.value = next;
    try {
      localStorage.setItem(RECENT_KEY, JSON.stringify(next));
    } catch {
      /* localStorage unavailable — recents just won't persist */
    }
  }
  function openQuickAddSheet() {
    quickAddSheetOpen.value = true;
  }
  function closeQuickAddSheet() {
    quickAddSheetOpen.value = false;
  }

  return {
    open,
    mode,
    query,
    quickAddSheetOpen,
    recentIds,
    openPalette,
    close,
    toggle,
    rememberCommand,
    openQuickAddSheet,
    closeQuickAddSheet,
  };
}
