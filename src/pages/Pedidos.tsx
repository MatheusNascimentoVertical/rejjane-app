import { useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SlidingIndicator } from '../components/SlidingIndicator';
import { useSwipe } from '../hooks/useSwipe';
import { ST, PROX, OPS, getProd } from '../data/constants';
import { hoje, fmtR$, fmtData, diasAte } from '../lib/helpers';
import type { AppCtx, Pedido } from '../types';

type Props = { ctx: AppCtx };

export function Pedidos({ ctx }: Props) {
  const { peds, fSt, setFSt, search, setModal, avancar } = ctx;
  const tabsRef = useRef<HTMLDivElement>(null);

  const filt = peds
    .filter(p => fSt === 'todos' || p.st === fSt)
    .filter(p => !search || p.cliNome.toLowerCase().includes(search.toLowerCase()) || p.arte.toLowerCase().includes(search.toLowerCase()) || String(p.id).includes(search))
    .sort((a, b) => a.prazo.localeCompare(b.prazo));

  return (
    <div className="pedidos">
      <div className="filter-tabs" ref={tabsRef}>
        <SlidingIndicator activeKey={fSt} containerRef={tabsRef} />
        <motion.button className={`ftab${fSt === 'todos' ? ' active' : ''}`} data-key="todos" onClick={() => setFSt('todos')} whileTap={{ scale: 0.96 }}>
          Todos <span className="ftab-count">{peds.length}</span>
        </motion.button>
        {Object.entries(ST).map(([k, v]) => {
          const n = peds.filter(p => p.st === k).length;
          return (
            <motion.button
              key={k} data-key={k}
              className={`ftab${fSt === k ? ' active' : ''}`}
              onClick={() => setFSt(k)}
              whileTap={{ scale: 0.96 }}
              style={fSt === k ? { borderColor: v.cor + '55', color: v.cor } : {}}
            >
              <span className="ftab-dot" style={{ background: v.cor }} />
              {v.label} <span className="ftab-count">{n}</span>
            </motion.button>
          );
        })}
      </div>

      <div className="pedidos-list">
        {filt.length === 0 && (
          <div className="empty-state">
            <div className="empty-glyph">✿</div>
            <p>Nenhum pedido encontrado</p>
          </div>
        )}
        <AnimatePresence>
          {filt.map((p, i) => (
            <PedidoCard key={p.id} p={p} setModal={ctx.setModal} avancar={avancar} index={i} />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

function WppIcon() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="#5a9b7a"><path d="M17.5 14.4c-.3-.1-1.7-.8-1.9-.9-.3-.1-.5-.1-.7.1-.2.3-.7.9-.9 1.1-.2.2-.3.2-.6.1-.3-.1-1.2-.5-2.3-1.4-.9-.7-1.4-1.7-1.6-2-.2-.3 0-.4.1-.5.1-.1.3-.3.4-.5.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5l-.8-2c-.2-.5-.4-.5-.6-.5h-.6c-.2 0-.5.1-.7.4-.3.3-1 .9-1 2.3 0 1.4 1 2.7 1.2 2.9.2.2 2 3 4.8 4.2 1.7.7 2.3.8 3.1.6.5-.1 1.6-.6 1.8-1.3.2-.6.2-1.2.2-1.3-.1-.1-.3-.2-.6-.3zM12 2C6.5 2 2 6.5 2 12c0 1.7.5 3.4 1.3 4.8L2 22l5.3-1.3c1.4.7 2.9 1.1 4.5 1.1h.2c5.5 0 10-4.5 10-10S17.5 2 12 2z"/></svg>;
}

type CardProps = { p: Pedido; setModal: AppCtx['setModal']; avancar: (id: number) => void; index: number };
function PedidoCard({ p, setModal, avancar, index }: CardProps) {
  const firstProd = getProd(p.itens?.[0]?.prodId ?? '');
  const stCfg = ST[p.st];
  const dias = diasAte(p.prazo);
  const rest = p.vTotal - p.sinal;
  const op = OPS.find(o => o.id === p.op);

  const swipeRef = useSwipe({
    onSwipeLeft:  () => setModal({ tipo: 'wpp', ped: p }),
    onSwipeRight: () => { if (PROX[p.st]) avancar(p.id); },
    threshold: 80,
  });

  return (
    <motion.div
      ref={swipeRef}
      className="ped-card"
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100, transition: { duration: 0.22 } }}
      transition={{ duration: 0.42, type: 'spring', delay: Math.min(index, 6) * 0.045 }}
      whileHover={{ y: -3 }}
    >
      <div className="swipe-action swipe-left"><span>← WhatsApp</span></div>
      <div className="swipe-action swipe-right"><span>Avançar →</span></div>

      <div className="ped-stripe" style={{ background: stCfg.cor }} />
      <div className="ped-main">
        <div className="ped-head">
          <div className="ped-prod-icon" style={{ background: stCfg.bg }}>{firstProd?.icon ?? '📦'}</div>
          <div className="ped-head-info">
            <div className="ped-num">#{p.id}</div>
            <h3 className="ped-cli">{p.cliNome}</h3>
            <div className="ped-prod-line">
              {(p.itens ?? []).map((it, idx) => {
                const pr = getProd(it.prodId);
                return <span key={idx}>{pr?.nome ?? it.prodId} ×{it.qtd}{idx < (p.itens?.length ?? 0) - 1 ? ' · ' : ''}</span>;
              })}
            </div>
          </div>
          <div className="ped-head-r">
            <span className="status-pill" style={{ color: stCfg.cor, background: stCfg.bg }}>{stCfg.label}</span>
            <div className={`ped-prazo${dias < 0 ? ' late' : dias <= 2 ? ' warn' : ''}`}>
              {dias < 0
                ? <strong>{Math.abs(dias)}d atrasado</strong>
                : dias === 0
                  ? <strong>hoje</strong>
                  : <><strong>{fmtData(p.prazo)}</strong><span> · em {dias}d</span></>}
            </div>
          </div>
        </div>

        <div className="ped-arte">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#c97d6e" strokeWidth="2"><path d="M12 2 9 9l-7 1 5 5-1 7 6-3 6 3-1-7 5-5-7-1z"/></svg>
          <span>{p.arte}</span>
        </div>

        <div className="ped-vals">
          <div className="ped-val"><span className="val-label">Total</span><strong>{fmtR$(p.vTotal)}</strong></div>
          <div className="ped-val"><span className="val-label">Sinal</span><strong className="sage">{fmtR$(p.sinal)}</strong></div>
          <div className="ped-val"><span className="val-label">Restante</span><strong className={rest > 0 ? 'peach' : ''}>{fmtR$(rest)}</strong></div>
          <div className="ped-val"><span className="val-label">Operadora</span><strong style={{ color: op?.cor }}>✨ {op?.nome}</strong></div>
        </div>

        {p.obs && <div className="ped-obs">💬 {p.obs}</div>}

        <div className="ped-actions">
          {PROX[p.st] && (
            <motion.button className="btn-primary-sm" onClick={() => avancar(p.id)} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.94 }}>
              Avançar para {ST[PROX[p.st]!].label} →
            </motion.button>
          )}
          <motion.button className="btn-soft-sm" onClick={() => setModal({ tipo: 'ped', dados: { ...p } })} whileTap={{ scale: 0.94 }}>Editar</motion.button>
          <motion.button className="btn-soft-sm" onClick={() => setModal({ tipo: 'wpp', ped: p })} whileTap={{ scale: 0.94 }}><WppIcon /> WhatsApp</motion.button>
          <motion.button className="btn-soft-sm" onClick={() => setModal({ tipo: 'oc', ped: p })} whileTap={{ scale: 0.94 }}>📄 Orçamento</motion.button>
        </div>
      </div>
    </motion.div>
  );
}
