import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCountUp } from '../hooks/useCountUp';
import { PRODS, ST, getProd } from '../data/constants';
import { hoje, fmtR$, fmtData, diasAte } from '../lib/helpers';
import type { AppCtx } from '../types';
import type { Aba } from '../App';
const bellaLogo = '/bella-logo.jpeg';

type Props = { ctx: AppCtx; setAba: (a: Aba) => void };

export function Dashboard({ ctx, setAba }: Props) {
  const { ativos, atrasados, peds, fin, recMes, despMes, prods } = ctx;
  const saldo = recMes - despMes;
  const producaoAgora = peds.filter(p => p.st === 'producao').length;
  const prontos = peds.filter(p => p.st === 'pronto').length;
  const semanaPeds = peds.filter(p => {
    const d = new Date(p.data + 'T00:00:00');
    const w = new Date(); w.setDate(w.getDate() - 7);
    return d >= w;
  }).length;

  const rankProd = useMemo(() => {
    const map = new Map<string, number>();
    peds.forEach(p => {
      (p.itens ?? []).forEach(it => {
        map.set(it.prodId, (map.get(it.prodId) ?? 0) + it.qtd * it.vUnit);
      });
    });
    const lista = prods.length > 0 ? prods : PRODS;
    return lista.map(p => ({ ...p, total: map.get(p.id) ?? 0 }))
      .sort((a, b) => b.total - a.total).slice(0, 5);
  }, [peds, prods]);

  return (
    <div className="dash">
      <HeroCard ctx={ctx} setAba={setAba} />

      <AnimatePresence>
        {atrasados.length > 0 && (
          <motion.div className="alert-card" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
            <motion.div className="alert-icon" animate={{ scale: [1, 1.12, 1] }} transition={{ duration: 1.6, repeat: Infinity, repeatDelay: 2 }}>!</motion.div>
            <div className="alert-body">
              <div className="alert-title">{atrasados.length} pedido{atrasados.length > 1 ? 's' : ''} com prazo vencido</div>
              <div className="alert-sub">{atrasados.map(p => p.cliNome).join(' · ')}</div>
            </div>
            <motion.button className="btn-ghost-sm" onClick={() => setAba('pedidos')} whileHover={{ x: 3 }} whileTap={{ scale: 0.95 }}>Ver →</motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="stat-row">
        <StatCard index={0} label="Em aberto"   value={ativos.length}    sub="pedidos ativos"      tone="rose" />
        <StatCard index={1} label="Em produção" value={producaoAgora}    sub="agora na bancada"    tone="peach" />
        <StatCard index={2} label="Prontos"     value={prontos}          sub="aguardando retirada" tone="sage" />
        <StatCard index={3} label="Esta semana" value={semanaPeds}       sub="pedidos novos"       tone="mauve" />
      </div>

      <div className="dash-grid">
        <section className="card-soft fila">
          <div className="card-head">
            <div>
              <div className="card-eyebrow">Bancada</div>
              <h3 className="card-title">Fila de produção</h3>
            </div>
            <button className="btn-ghost-sm" onClick={() => setAba('pedidos')}>Ver tudo</button>
          </div>
          <div className="fila-list">
            {ativos.sort((a, b) => a.prazo.localeCompare(b.prazo)).slice(0, 5).map(p => {
              const prod = getProd(p.itens?.[0]?.prodId ?? '');
              const stCfg = ST[p.st];
              const dias = diasAte(p.prazo);
              return (
                <div key={p.id} className="fila-row">
                  <div className="fila-icon" style={{ background: stCfg.bg }}>{prod?.icon}</div>
                  <div className="fila-body">
                    <div className="fila-name">{p.cliNome}</div>
                    <div className="fila-meta">
                      {(p.itens ?? []).map(it => { const pr = getProd(it.prodId); return `${pr?.nome ?? ''}×${it.qtd}`; }).join(' · ')} · {fmtR$(p.vTotal)}
                    </div>
                  </div>
                  <div className="fila-right">
                    <span className="status-pill" style={{ color: stCfg.cor, background: stCfg.bg }}>{stCfg.label}</span>
                    <div className={`fila-prazo${dias < 0 ? ' late' : dias <= 2 ? ' warn' : ''}`}>
                      {dias < 0 ? `${Math.abs(dias)}d atrasado` : dias === 0 ? 'hoje' : `em ${dias}d`}
                    </div>
                  </div>
                </div>
              );
            })}
            {ativos.length === 0 && <div style={{ padding: '20px 0', color: 'var(--ink-mute)', textAlign: 'center' }}>Nenhum pedido ativo ✿</div>}
          </div>
        </section>

        <section className="card-soft side-stack">
          <div className="mini-card mini-mes">
            <div className="card-eyebrow">Este mês</div>
            <div className="mini-row">
              <div><div className="mini-label">Entradas</div><div className="mini-val sage">{fmtR$(recMes)}</div></div>
              <div><div className="mini-label">Saídas</div><div className="mini-val peach">{fmtR$(despMes)}</div></div>
            </div>
            <div className="mini-saldo">
              <span>Saldo</span>
              <strong className={saldo >= 0 ? 'sage' : 'red'}>{fmtR$(saldo)}</strong>
            </div>
            <button className="btn-ghost-sm full" onClick={() => setAba('caixa')}>Abrir caixa →</button>
          </div>

          <div className="mini-card">
            <div className="card-eyebrow">Top vendidos</div>
            {rankProd.slice(0, 4).map((p, i) => (
              <div key={p.id} className="rank-row">
                <span className={`rank-pos rank-${i + 1}`}>{i + 1}</span>
                <span className="rank-icon">{p.icon}</span>
                <span className="rank-name">{p.nome}</span>
                <span className="rank-val">{fmtR$(p.total)}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function HeroCard({ ctx, setAba }: Props) {
  const hora = new Date().getHours();
  const sauda = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite';
  const data = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
  return (
    <motion.div className="hero-card" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, type: 'spring' }}>
      <div className="hero-watermark"><img src={bellaLogo} alt="" /></div>
      <div className="hero-body">
        <div className="hero-eyebrow">{data}</div>
        <h2 className="hero-title">{sauda}, <span className="script">Bella</span> ✿</h2>
        <p className="hero-sub">
          Você tem <strong>{ctx.ativos.length}</strong> pedidos em andamento e{' '}
          <strong>{ctx.peds.filter(p => p.st === 'pronto').length}</strong> prontos para entrega.
        </p>
        <div className="hero-actions">
          <motion.button className="btn-primary" onClick={() => ctx.setModal({ tipo: 'ped' })} whileHover={{ y: -2, scale: 1.02 }} whileTap={{ scale: 0.96 }}>
            + Novo pedido
          </motion.button>
          <motion.button className="btn-soft" onClick={() => setAba('clientes')} whileHover={{ y: -2 }} whileTap={{ scale: 0.96 }}>
            Ver clientes
          </motion.button>
        </div>
      </div>
      <div className="hero-deco">
        <motion.div className="petal petal-1" animate={{ y: [0, -8, 0], rotate: [0, 5, 0] }} transition={{ duration: 4.2, repeat: Infinity, ease: 'easeInOut' }} />
        <motion.div className="petal petal-2" animate={{ y: [0, 6, 0], rotate: [0, -6, 0] }} transition={{ duration: 5.4, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }} />
        <div className="petal petal-3" />
      </div>
    </motion.div>
  );
}

type StatProps = { label: string; value: number; sub: string; tone: string; index: number };
function StatCard({ label, value, sub, tone, index }: StatProps) {
  const counted = useCountUp(value);
  return (
    <motion.div
      className={`stat-card tone-${tone}`}
      initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, type: 'spring', delay: 0.08 + index * 0.07 }}
      whileHover={{ y: -3, scale: 1.015 }}
    >
      <div className="stat-glyph">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
          <path d="M12 2c2.5 3 5 4.5 5 8a5 5 0 0 1-10 0c0-3.5 2.5-5 5-8z" />
        </svg>
      </div>
      <div className="stat-value">{counted}</div>
      <div className="stat-label">{label}</div>
      <div className="stat-sub">{sub}</div>
    </motion.div>
  );
}
