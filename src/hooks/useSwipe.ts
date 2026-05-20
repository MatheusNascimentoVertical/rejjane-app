import { useRef, useEffect, RefObject } from 'react';

type Options = {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  threshold?: number;
};

export function useSwipe({ onSwipeLeft, onSwipeRight, threshold = 80 }: Options): RefObject<HTMLDivElement> {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let startX = 0, startY = 0, dx = 0, active = false, axis: 'x' | 'y' | null = null;

    const onStart = (ev: TouchEvent) => {
      const t = ev.touches[0];
      startX = t.clientX; startY = t.clientY; dx = 0; active = true; axis = null;
      el.style.transition = 'none';
    };

    const onMove = (ev: TouchEvent) => {
      if (!active) return;
      const t = ev.touches[0];
      dx = t.clientX - startX;
      const dy = t.clientY - startY;
      if (!axis) axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
      if (axis === 'x') {
        if (ev.cancelable) ev.preventDefault();
        el.style.transform = `translateX(${dx}px) rotate(${dx * 0.02}deg)`;
        el.style.opacity = String(Math.max(0.4, 1 - Math.abs(dx) / 320));
        el.style.setProperty('--swipe-x', String(dx));
      }
    };

    const onEnd = () => {
      if (!active) return;
      active = false;
      el.style.transition = 'transform 0.32s cubic-bezier(0.34,1.56,0.64,1), opacity 0.3s';
      if (axis === 'x' && dx <= -threshold) onSwipeLeft?.();
      else if (axis === 'x' && dx >= threshold) onSwipeRight?.();
      el.style.transform = '';
      el.style.opacity = '';
      el.style.setProperty('--swipe-x', '0');
    };

    el.addEventListener('touchstart', onStart, { passive: true });
    el.addEventListener('touchmove', onMove, { passive: false });
    el.addEventListener('touchend', onEnd);
    el.addEventListener('touchcancel', onEnd);

    return () => {
      el.removeEventListener('touchstart', onStart);
      el.removeEventListener('touchmove', onMove);
      el.removeEventListener('touchend', onEnd);
      el.removeEventListener('touchcancel', onEnd);
    };
  }, [onSwipeLeft, onSwipeRight, threshold]);

  return ref;
}
