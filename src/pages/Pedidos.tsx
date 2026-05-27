import { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SlidingIndicator } from '../components/SlidingIndicator';
import { useSwipe } from '../hooks/useSwipe';
import { ST, PROX, getProd } from '../data/constants';
import { hoje, fmtR$, fmtData, diasAte } from '../lib/helpers';
import type { AppCtx, Pedido, Pagamento, Parcela } from '../types';

type Props = { ctx: AppCtx };

const PAG_LABEL: Record<Pagamento, string> = {
  pix:      'PIX',
  credito:  'Cartão',
  dinheiro: 'Dinheiro',
};

export function Pedidos({ ctx }: Props) {
  const { peds, fSt, setFSt, search, setModal, avancar } = ctx;
  const tabsRef = useRef<HTMLDivElement>(null);

  const filt = peds
    .filter(p => fSt === 'todos' || p.st === fSt)
    .filter(p => !search || p.cliNome.toLowerCase().includes(search.toLowerCase()) || String(p.id).includes(search))
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
            <div className="empty-glyph">🌸</div>
            <p>Nenhum pedido encontrado</p>
          </div>
        )}
        <AnimatePresence>
          {filt.map((p, i) => (
            <PedidoCard key={p.id} p={p} setModal={ctx.setModal} avancar={avancar} setPeds={ctx.setPeds} index={i} />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

function WppIcon() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="#5a9b7a"><path d="M17.5 14.4c-.3-.1-1.7-.8-1.9-.9-.3-.1-.5-.1-.7.1-.2.3-.7.9-.9 1.1-.2.2-.3.2-.6.1-.3-.1-1.2-.5-2.3-1.4-.9-.7-1.4-1.7-1.6-2-.2-.3 0-.4.1-.5.1-.1.3-.3.4-.5.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5l-.8-2c-.2-.5-.4-.5-.6-.5h-.6c-.2 0-.5.1-.7.4-.3.3-1 .9-1 2.3 0 1.4 1 2.7 1.2 2.9.2.2 2 3 4.8 4.2 1.7.7 2.3.8 3.1.6.5-.1 1.6-.6 1.8-1.3.2-.6.2-1.2.2-1.3-.1-.1-.3-.2-.6-.3zM12 2C6.5 2 2 6.5 2 12c0 1.7.5 3.4 1.3 4.8L2 22l5.3-1.3c1.4.7 2.9 1.1 4.5 1.1h.2c5.5 0 10-4.5 10-10S17.5 2 12 2z"/></svg>;
}

type CardProps = { p: Pedido; setModal: AppCtx['setModal']; avancar: (id: number) => void; setPeds: AppCtx['setPeds']; index: number };
function PedidoCard({ p, setModal, avancar, setPeds, index }: CardProps) {
  const [confirmDel, setConfirmDel] = useState(false);
  const firstProd = getProd(p.itens?.[0]?.prodId ?? '');
  const stCfg = ST[p.st];
  const dias = diasAte(p.prazo);
  const rest = p.vTotal - p.sinal;

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

        <div className="ped-vals">
          <div className="ped-val"><span className="val-label">Total</span><strong>{fmtR$(p.vTotal)}</strong></div>
          <div className="ped-val"><span className="val-label">Sinal</span><strong className="sage">{fmtR$(p.sinal)}</strong></div>
          <div className="ped-val"><span className="val-label">Restante</span><strong className={rest > 0 ? 'peach' : ''}>{fmtR$(rest)}</strong></div>
          <div className="ped-val">
            <span className="val-label">Pagamento</span>
            <span className={`pag-badge pag-${p.pagamento}`}>{PAG_LABEL[p.pagamento] ?? p.pagamento}</span>
          </div>
        </div>

        {rest > 0 && p.parcelas && p.parcelas.length > 0 ? (
          <div className="parcelas-card">
            <div className="parcelas-card-title">📅 Parcelas</div>
            {p.parcelas.map((parc, i) => {
              const dv = diasAte(parc.data);
              return (
                <div key={i} className={`parcela-card-row${parc.pago ? ' pago' : dv < 0 ? ' venc-late' : dv <= 3 ? ' venc-warn' : ''}`}>
                  <span className="parc-card-icon">{parc.pago ? '✅' : dv < 0 ? '🔴' : dv <= 3 ? '🟡' : '🟢'}</span>
                  <span className="parc-card-info">
                    <strong>{fmtR$(parc.valor)}</strong>
                    <span> — {fmtData(parc.data)}</span>
                    {!parc.pago && dv < 0 && <span className="parc-late"> ({Math.abs(dv)}d atrasado)</span>}
                  </span>
                  {!parc.pago && (
                    <div className="parc-card-actions">
                      <motion.button className="btn-cobrar-sm" style={{ fontSize: 11, padding: '4px 8px' }}
                        onClick={() => setModal({ tipo: 'wpp', ped: { ...p, vTotal: parc.valor, sinal: 0, vencimento: parc.data }, msgTipo: 'cobranca' })}
                        whileTap={{ scale: 0.94 }}>💰</motion.button>
                      <motion.button className="btn-soft-sm" style={{ fontSize: 11, padding: '4px 8px' }}
                        onClick={() => setPeds(ps => ps.map(x => x.id !== p.id ? x : { ...x, parcelas: x.parcelas?.map((pc, idx) => idx === i ? { ...pc, pago: true } : pc) }))}
                        whileTap={{ scale: 0.94 }}>✓ Pago</motion.button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : rest > 0 && p.vencimento ? (() => {
          const dv = diasAte(p.vencimento);
          return (
            <div className={`ped-vencimento${dv < 0 ? ' venc-late' : dv <= 3 ? ' venc-warn' : ''}`}>
              <span className="venc-icon">{dv < 0 ? '🔴' : dv <= 3 ? '🟡' : '🟢'}</span>
              <span>
                {dv < 0
                  ? `Pagamento vencido há ${Math.abs(dv)} dia${Math.abs(dv) > 1 ? 's' : ''}`
                  : dv === 0
                    ? 'Vence hoje!'
                    : `Vence em ${dv} dia${dv > 1 ? 's' : ''}`}
                {' — '}<strong>{fmtData(p.vencimento)}</strong>
              </span>
            </div>
          );
        })() : null}

        {p.obs && <div className="ped-obs">💬 {p.obs}</div>}

        <div className="ped-actions">
          {PROX[p.st] && (
            <motion.button className="btn-primary-sm" onClick={() => avancar(p.id)} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.94 }}>
              Avançar para {ST[PROX[p.st]!].label} →
            </motion.button>
          )}
          <motion.button className="btn-soft-sm" onClick={() => setModal({ tipo: 'ped', dados: { ...p } })} whileTap={{ scale: 0.94 }}>Editar</motion.button>
          <motion.button className="btn-soft-sm" onClick={() => setModal({ tipo: 'wpp', ped: p })} whileTap={{ scale: 0.94 }}><WppIcon /> WhatsApp</motion.button>
          {rest > 0 && (
            <motion.button className="btn-cobrar-sm" onClick={() => setModal({ tipo: 'wpp', ped: p, msgTipo: 'cobranca' })} whileTap={{ scale: 0.94 }}>💰 Cobrar</motion.button>
          )}
          <motion.button className="btn-soft-sm" onClick={() => setModal({ tipo: 'oc', ped: p })} whileTap={{ scale: 0.94 }}>📄 Orçamento</motion.button>
          {confirmDel ? (
            <>
              <span style={{ fontSize: 12, color: '#b85050', fontWeight: 700 }}>Excluir pedido?</span>
              <motion.button className="btn-danger-sm" onClick={() => setPeds(ps => ps.filter(x => x.id !== p.id))} whileTap={{ scale: 0.94 }}>Sim</motion.button>
              <motion.button className="btn-soft-sm" onClick={() => setConfirmDel(false)} whileTap={{ scale: 0.94 }}>Não</motion.button>
            </>
          ) : (
            <motion.button className="btn-danger-sm" onClick={() => setConfirmDel(true)} whileTap={{ scale: 0.94 }}>🗑 Excluir</motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
