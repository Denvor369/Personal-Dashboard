import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';

export function useSlidingRouteIndicator() {
  const route = useRoute();
  const container = ref<HTMLElement | null>(null);
  const indicator = ref<HTMLElement | null>(null);
  let observer: ResizeObserver | undefined;

  function move(animate = true) {
    const active = container.value?.querySelector<HTMLElement>('[aria-current="page"]');
    if (!active || !indicator.value) return;

    if (!animate) indicator.value.style.transition = 'none';
    indicator.value.style.width = `${active.offsetWidth}px`;
    indicator.value.style.height = `${active.offsetHeight}px`;
    indicator.value.style.transform = `translate3d(${active.offsetLeft}px, ${active.offsetTop}px, 0)`;
    indicator.value.style.opacity = '1';
    if (!animate) {
      void indicator.value.offsetWidth;
      indicator.value.style.removeProperty('transition');
    }
  }

  watch(
    () => route.path,
    async () => {
      await nextTick();
      move();
    },
  );

  onMounted(() => {
    requestAnimationFrame(() => move(false));
    if (container.value) {
      observer = new ResizeObserver(() => move(false));
      observer.observe(container.value);
    }
  });
  onBeforeUnmount(() => observer?.disconnect());

  return { container, indicator };
}
