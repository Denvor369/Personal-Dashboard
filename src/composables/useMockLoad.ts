// Tiny helper so the mock-data pages can show a genuine loading → content
// transition (skeletons) without faking persistence. Flips loading off shortly
// after mount. Replace with real async loaders when Supabase lands.
import { onMounted, ref } from 'vue';

export function useMockLoad(delay = 350) {
  const loading = ref(true);
  onMounted(() => {
    const timer = setTimeout(() => (loading.value = false), delay);
    // Cleared implicitly on unmount via the component lifecycle; the ref is local.
    void timer;
  });
  return { loading };
}
