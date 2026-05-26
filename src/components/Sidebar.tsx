import { useRef } from 'react';
import { motion } from 'framer-motion';
import { SlidingIndicator } from './SlidingIndicator';
import { NavIcon } from './NavIcon';
import { NAV } from '../data/constants';
import type { Config, Pedido } from '../types';
import type { Aba } from '../App';
const rjLogo = '/rejjane-logo.jpeg';

type Props = { aba: Aba; setAba: (a: Aba) => void; atrasados: Pedido[]; cfg: Config };

export function Sidebar({ aba, setAba, atrasados, cfg }: Props) {
  const navRef = useRef<HTMLElement | null>(null);

  return (
    <aside className="rj-sb">
      <div className="sb-logo">
        <div className="sb-logo-frame">
          <img src={rjLogo} alt="Rejjanevendas" />
        </div>
        <div className="sb-tag">
          <span className="ribbon-line" /><span>{cfg.slogan || 'Beleza • Casa • Cuidado • Você'}</span><span className="ribbon-line" />
        </div>
      </div>

      <nav className="sb-nav" ref={navRef}>
        <SlidingIndicator activeKey={aba} containerRef={navRef} />
        {NAV.map(([id, label]) => (
          <motion.button
            key={id}
            data-key={id}
            className={`sb-item${aba === id ? ' active' : ''}`}
            onClick={() => setAba(id as Aba)}
            whileHover={{ x: 2 }}
            whileTap={{ scale: 0.97 }}
          >
            <NavIcon id={id} active={aba === id} />
            <span>{label}</span>
            {id === 'pedidos' && atrasados.length > 0 && (
              <span className="sb-badge">{atrasados.length}</span>
            )}
          </motion.button>
        ))}
      </nav>

      <div className="sb-foot">
        <div className="sb-foot-card">
          <div className="sb-foot-icon">🌸</div>
          <div>
            <div className="sb-foot-title">Olá, Rejane!</div>
            <div className="sb-foot-sub">{new Date().toLocaleDateString('pt-BR', { weekday: 'long' })}</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
