import { onBeforeUnmount, ref } from 'vue';

export function useReducedMotion() {
  const query = window.matchMedia('(prefers-reduced-motion: reduce)');
  const reducedMotion = ref(query.matches);
  const update = (event: MediaQueryListEvent) => (reducedMotion.value = event.matches);

  query.addEventListener('change', update);
  onBeforeUnmount(() => query.removeEventListener('change', update));

  return reducedMotion;
}
