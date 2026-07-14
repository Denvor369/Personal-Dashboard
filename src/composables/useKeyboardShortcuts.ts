// Global keyboard shortcuts. Cmd+K (mac) / Ctrl+K (win/linux) toggles the palette.
import { onBeforeUnmount, onMounted } from 'vue';
import { useCommandPalette } from './useCommandPalette';

export function useKeyboardShortcuts() {
  const { toggle } = useCommandPalette();

  function onKeydown(event: KeyboardEvent) {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      toggle();
    }
  }

  onMounted(() => window.addEventListener('keydown', onKeydown));
  onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown));
}
