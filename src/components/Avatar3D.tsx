import { useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

const LOGO = '/rejjane-logo.jpeg';

const ORBITERS = [
  { emoji: '🌸', r: 80, dur: 7,  start: 0   },
  { emoji: '💕', r: 92, dur: 11, start: 72  },
  { emoji: '✨', r: 72, dur: 9,  start: 144 },
  { emoji: '🌹', r: 86, dur: 13, start: 216 },
  { emoji: '💫', r: 76, dur: 10, start: 288 },
  { emoji: '🎀', r: 88, dur: 8,  start: 36  },
];

export function Avatar3D() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rotateX = useSpring(useTransform(my, [-120, 120], [22, -22]), { stiffness: 160, damping: 25 });
  const rotateY = useSpring(useTransform(mx, [-120, 120], [-22, 22]), { stiffness: 160, damping: 25 });

  function onMove(e: React.MouseEvent) {
    const el = wrapRef.current;
    if (!el) return;
    const { left, top, width, height } = el.getBoundingClientRect();
    mx.set(e.clientX - left - width / 2);
    my.set(e.clientY - top - height / 2);
  }

  return (
    <div ref={wrapRef} className="av3d-wrap" onMouseMove={onMove} onMouseLeave={() => { mx.set(0); my.set(0); }}>
      {/* Pulse rings */}
      {[0, 1].map(i => (
        <motion.div
          key={i}
          className="av3d-ring"
          animate={{ scale: [1, 1.18, 1], opacity: [0.5, 0, 0.5] }}
          transition={{ duration: 3.2, repeat: Infinity, ease: 'easeOut', delay: i * 1.6 }}
        />
      ))}

      {/* Orbiting emojis */}
      {ORBITERS.map((o, i) => (
        <motion.div
          key={i}
          className="av3d-orbit-arm"
          animate={{ rotate: [o.start, o.start + 360] }}
          transition={{ duration: o.dur, repeat: Infinity, ease: 'linear' }}
        >
          <motion.span
            className="av3d-orbiter"
            style={{ left: o.r }}
            animate={{ rotate: [-o.start, -(o.start + 360)] }}
            transition={{ duration: o.dur, repeat: Infinity, ease: 'linear' }}
          >
            {o.emoji}
          </motion.span>
        </motion.div>
      ))}

      {/* 3D Card */}
      <motion.div
        className="av3d-card"
        style={{ rotateX, rotateY, transformPerspective: 900 }}
        animate={{ y: [0, -12, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        whileHover={{ scale: 1.04 }}
      >
        <img src={LOGO} alt="Rejjanevendas" className="av3d-img" />
        {/* Shine overlay that moves with tilt */}
        <div className="av3d-shine" />
        {/* Bottom glow */}
        <div className="av3d-glow-base" />
      </motion.div>
    </div>
  );
}
