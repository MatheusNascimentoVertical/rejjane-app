import { useRef } from 'react';
import { motion } from 'framer-motion';
import { SlidingIndicator } from './SlidingIndicator';
import { NavIcon } from './NavIcon';
import { NAV } from '../data/constants';
import type { Pedido } from '../types';
import type { Aba } from '../App';

type Props = { aba: Aba; setAba: (a: Aba) => void; atrasados: Pedido[] };

export function BottomNav({ aba, setAba, atrasados }: Props) {
  const navRef = useRef<HTMLElement>(null);

  return (
    <nav className="rj-bn" ref={navRef}>
      <SlidingIndicator activeKey={aba} containerRef={navRef} color="rgba(233,30,99,0.14)" />
      {NAV.map(([id, label]) => (
        <motion.button
          key={id}
          data-key={id}
          className={`bn-item${aba === id ? ' active' : ''}`}
          onClick={() => setAba(id as Aba)}
          whileTap={{ scale: 0.9 }}
        >
          <NavIcon id={id} active={aba === id} />
          <span>{label}</span>
          {id === 'pedidos' && atrasados.length > 0 && (
            <span className="bn-badge">{atrasados.length}</span>
          )}
        </motion.button>
      ))}
    </nav>
  );
}
