import { motion } from 'framer-motion';
import { useLayoutEffect, useState, RefObject } from 'react';

type Props = {
  activeKey: string;
  containerRef: RefObject<HTMLElement>;
  color?: string;
};

export function SlidingIndicator({ activeKey, containerRef, color = 'rgba(201,125,110,0.15)' }: Props) {
  const [pos, setPos] = useState({ left: 0, width: 0, top: 0, height: 0 });

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const active = el.querySelector(`[data-key="${activeKey}"]`) as HTMLElement | null;
    if (!active) return;
    const cr = el.getBoundingClientRect();
    const ar = active.getBoundingClientRect();
    setPos({ left: ar.left - cr.left, width: ar.width, top: ar.top - cr.top, height: ar.height });
  }, [activeKey, containerRef]);

  return (
    <motion.div
      animate={{ x: pos.left, y: pos.top, width: pos.width, height: pos.height }}
      transition={{ type: 'spring', stiffness: 400, damping: 35 }}
      style={{ position: 'absolute', top: 0, left: 0, background: color, borderRadius: 12, zIndex: 0, pointerEvents: 'none' }}
    />
  );
}
