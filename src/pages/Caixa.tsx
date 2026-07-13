import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { hoje, fmtData, fmtR$, diasAte } from '../lib/helpers';
import { MARCAS } from '../data/constants';
import type { AppCtx, Pedido } from '../types';

type Props = { ctx: AppCtx };

const MES_NOMES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
const MES_NOMES_LONG = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

function fmtMesLabel(s: string) {
  const [y, m] = s.split('-').map(Number);
  return `${MES_NOMES[m - 1]} ${y}`;
}
function fmtMesLong(s: string) {
  const [, m] = s.split('-').map(Number);
  return MES_NOMES_LONG[m - 1];
}

function addMes(s: string, delta: number) {
  const [y, m] = s.split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function Caixa({ ctx }: Props) {
  const { fin, setFin, setModal, peds, prods } = ctx;
  const meAtual = hoje().slice(0, 7);
  const [mes, setMes] = useState(meAtual);
  const hoje_ = hoje();

  const mesPeds  = peds.filter(p => p.data.startsWith(mes) && p.st !== 'cancelado');
  const lancsMes = [...fin].filter(f => f.data.startsWith(mes)).sort((a, b) => b.data.localeCompare(a.data) || b.id - a.id);

  const recMes  = fin.filter(f => f.tipo === 'entrada' && f.data.startsWith(mes)).reduce((a, b) => a + b.valor, 0);
  const despMes = fin.filter(f => f.tipo === 'saida'   && f.data.startsWith(mes)).reduce((a, b) => a + b.valor, 0);
  const saldo   = recMes - despMes;

  const ticketMedio = mesPeds.length > 0
    ? mesPeds.reduce((s, p) => s + p.vTotal, 0) / mesPeds.length
    : 0;

  const pedsPagos = peds.filter(p => p.st === 'pago' && p.data.startsWith(mes)).length;

  // ── Previsão de recebimentos por mês (próximos 7 meses) ──────────────────
  const previsao = useMemo(() => {
    const meses: { mes: string; label: string; valor: number; nPeds: Set<number> }[] = [];
    for (let i = 0; i < 7; i++) {
      meses.push({ mes: addMes(meAtual, i), label: fmtMesLong(addMes(meAtual, i)), valor: 0, nPeds: new Set() });
    }
    peds.forEach(p => {
      if (p.st === 'cancelado' || p.st === 'pago') return;
      if (p.parcelas && p.parcelas.length > 0) {
        p.parcelas.forEach(parc => {
          if (parc.pago) return;
          const slot = meses.find(m => parc.data.startsWith(m.mes));
          if (slot) { slot.valor += parc.valor; slot.nPeds.add(p.id); }
        });
      } else {
        const rest = p.vTotal - p.sinal;
        if (rest <= 0) return;
        const refData = p.vencimento || p.prazo;
        const slot = meses.find(m => refData.startsWith(m.mes));
        if (slot) { slot.valor += rest; slot.nPeds.add(p.id); }
      }
    });
    return meses;
  }, [peds, meAtual]);

  const maxPrev = Math.max(...previsao.map(m => m.valor), 1);
  const totalPrev = previsao.reduce((s, m) => s + m.valor, 0);

  // A receber geral
  const aReceberList = peds
    .filter(p => p.st !== 'cancelado' && p.st !== 'pago' && (p.vTotal - p.sinal) > 0)
    .sort((a, b) => {
      const da = a.vencimento || (a.parcelas?.find(pc => !pc.pago)?.data) || a.prazo;
      const db = b.vencimento || (b.parcelas?.find(pc => !pc.pago)?.data) || b.prazo;
      return da.localeCompare(db);
    });
  const totalAReceber = aReceberList.reduce((s, p) => s + (p.vTotal - p.sinal), 0);

  // Cobranças próximas (14 dias)
  type ProxItem = { ped: Pedido; data: string; valor: number; tipo: 'vencimento' | 'parcela'; parcelaIdx?: number };
  const proximas: ProxItem[] = [];
  peds.forEach(p => {
    if (p.st === 'cancelado' || p.st === 'pago') return;
    const rest = p.vTotal - p.sinal;
    if (rest <= 0) return;
    if (p.parcelas && p.parcelas.length > 0) {
      p.parcelas.forEach((parc, idx) => {
        if (!parc.pago && parc.data >= hoje_ && diasAte(parc.data) <= 14)
          proximas.push({ ped: p, data: parc.data, valor: parc.valor, tipo: 'parcela', parcelaIdx: idx });
      });
    } else if (p.vencimento && p.vencimento >= hoje_ && diasAte(p.vencimento) <= 14) {
      proximas.push({ ped: p, data: p.vencimento, valor: rest, tipo: 'vencimento' });
    }
  });
  proximas.sort((a, b) => a.data.localeCompare(b.data));

  // Desempenho por marca
  const recPorMarca = MARCAS.map(m => {
    const total = mesPeds.reduce((sum, p) =>
      sum + (p.itens ?? []).reduce((s, it) => {
        const prod = prods.find(x => x.id === it.prodId);
        return s + (prod?.marca === m.id ? it.qtd * it.vUnit : 0);
      }, 0), 0);
    return { ...m, total };
  }).filter(m => m.total > 0).sort((a, b) => b.total - a.total);
  const totalMarca = recPorMarca.reduce((a, b) => a + b.total, 0);

  // Produto destaque
  const prodVendas: Record<string, { nome: string; icon: string; total: number; qtd: number }> = {};
  mesPeds.forEach(p => {
    (p.itens ?? []).forEach(it => {
      const prod = prods.find(x => x.id === it.prodId);
      if (!prod) return;
      if (!prodVendas[it.prodId]) prodVendas[it.prodId] = { nome: prod.nome, icon: prod.icon, total: 0, qtd: 0 };
      prodVendas[it.prodId].total += it.qtd * it.vUnit;
      prodVendas[it.prodId].qtd   += it.qtd;
    });
  });
  const topProd = Object.values(prodVendas).sort((a, b) => b.total - a.total)[0];

  const deleteLanc = (id: number) => setFin(fs => fs.filter(f => f.id !== id));

  return (
    <div className="caixa">

      {/* Month nav */}
      <div className="cx-month-nav">
        <button className="cx-month-btn" onClick={() => setMes(m => addMes(m, -1))}>‹</button>
        <span className="cx-month-label">{fmtMesLabel(mes)}</span>
        <button className="cx-month-btn" onClick={() => setMes(m => addMes(m, 1))}>›</button>
        {mes !== meAtual && (
          <button className="cx-month-hoje" onClick={() => setMes(meAtual)}>Mês atual</button>
        )}
      </div>

      {/* Hero saldo */}
      <div className="caixa-hero">
        <div className="caixa-hero-l">
          <div className="card-eyebrow">Saldo do mês</div>
          <div className={`caixa-saldo${saldo >= 0 ? ' sage' : ' red'}`}>{fmtR$(saldo)}</div>
          <div className="caixa-saldo-sub">
            <span className="sage">▲ {fmtR$(recMes)}</span>
            {' entradas · '}
            <span className="peach">▼ {fmtR$(despMes)}</span>
            {' saídas'}
          </div>
        </div>
        <div className="caixa-hero-actions">
          <button className="btn-primary" onClick={() => setModal({ tipo: 'fin', dados: { tipo: 'entrada' } })}>+ Entrada</button>
          <button className="btn-soft"    onClick={() => setModal({ tipo: 'fin', dados: { tipo: 'saida'   } })}>+ Saída</button>
        </div>
      </div>

      {/* Metrics */}
      <div className="cx-metrics">
        <div className="cx-metric">
          <div className="cx-metric-icon">📦</div>
          <div className="cx-metric-val">{mesPeds.length}</div>
          <div className="cx-metric-label">Pedidos no mês</div>
        </div>
        <div className="cx-metric">
          <div className="cx-metric-icon">🎯</div>
          <div className="cx-metric-val">{ticketMedio > 0 ? fmtR$(ticketMedio) : '—'}</div>
          <div className="cx-metric-label">Ticket médio</div>
        </div>
        <div className="cx-metric cx-metric-destaque">
          <div className="cx-metric-icon">⏳</div>
          <div className="cx-metric-val" style={{ color: 'var(--rose-d)' }}>{fmtR$(totalAReceber)}</div>
          <div className="cx-metric-label">A receber</div>
        </div>
        <div className="cx-metric">
          <div className="cx-metric-icon">✅</div>
          <div className="cx-metric-val sage">{pedsPagos}</div>
          <div className="cx-metric-label">Pedidos pagos</div>
        </div>
      </div>

      {/* ── PREVISÃO DE RECEBIMENTOS POR MÊS ── */}
      {totalPrev > 0 && (
        <div className="card-soft cx-prev-card">
          <div className="card-head" style={{ marginBottom: 16 }}>
            <div>
              <div className="card-eyebrow">Planejamento financeiro</div>
              <h3 className="card-title">
                Previsão de recebimentos
                <span className="cx-badge-val">{fmtR$(totalPrev)}</span>
              </h3>
            </div>
          </div>
          <p className="cx-prev-sub">
            O que você tem a receber mês a mês, contando parcelas e vencimentos dos pedidos em aberto.
          </p>
          <div className="cx-prev-scroll">
            {previsao.map((slot, i) => {
              const pct = maxPrev > 0 ? (slot.valor / maxPrev) * 100 : 0;
              const isCurrent = slot.mes === meAtual;
              const isPast = slot.mes < meAtual;
              return (
                <div key={slot.mes} className={`cx-prev-col${isCurrent ? ' current' : ''}${isPast ? ' past' : ''}`}>
                  <div className="cx-prev-val">
                    {slot.valor > 0 ? fmtR$(slot.valor) : '—'}
                  </div>
                  <div className="cx-prev-bar-wrap">
                    <motion.div
                      className="cx-prev-bar-fill"
                      initial={{ height: 0 }}
                      animate={{ height: pct + '%' }}
                      transition={{ duration: 0.5, delay: i * 0.06, ease: [0.4, 0, 0.2, 1] }}
                    />
                  </div>
                  <div className="cx-prev-mes">{slot.label.slice(0, 3)}</div>
                  {slot.nPeds.size > 0 && (
                    <div className="cx-prev-n">{slot.nPeds.size} ped.</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {topProd && (
        <div className="cx-top-prod">
          <span className="cx-top-prod-icon">{topProd.icon}</span>
          <div className="cx-top-prod-info">
            <div className="cx-top-prod-label">Produto destaque do mês</div>
            <div className="cx-top-prod-nome">{topProd.nome}</div>
          </div>
          <div className="cx-top-prod-val">
            <strong>{fmtR$(topProd.total)}</strong>
            <span>{topProd.qtd} unid.</span>
          </div>
        </div>
      )}

      {/* A receber lista */}
      {aReceberList.length > 0 && (
        <div className="card-soft">
          <div className="card-head">
            <div>
              <div className="card-eyebrow">Cobranças pendentes</div>
              <h3 className="card-title">
                A receber
                <span className="cx-badge-val">{fmtR$(totalAReceber)}</span>
              </h3>
            </div>
          </div>
          <div className="cx-receber-list">
            {aReceberList.slice(0, 8).map(p => {
              const rest = p.vTotal - p.sinal;
              const refData = p.vencimento || (p.parcelas?.find(pc => !pc.pago)?.data) || p.prazo;
              const dias = diasAte(refData);
              return (
                <div key={p.id} className={`cx-receber-row${dias < 0 ? ' late' : dias <= 3 ? ' warn' : ''}`}>
                  <div className="cx-receber-info">
                    <span className="cx-receber-nome">{p.cliNome}</span>
                    <span className="cx-receber-meta">#{p.id} · {p.itens?.length ?? 0} prod.</span>
                  </div>
                  <div className="cx-receber-r">
                    <strong className="cx-receber-val">{fmtR$(rest)}</strong>
                    <span className={`cx-receber-prazo${dias < 0 ? ' late' : dias <= 3 ? ' warn' : ''}`}>
                      {dias < 0 ? `${Math.abs(dias)}d atraso` : dias === 0 ? 'hoje' : `em ${dias}d`}
                    </span>
                  </div>
                  <motion.button
                    className="btn-cobrar-sm"
                    onClick={() => setModal({ tipo: 'wpp', ped: p, msgTipo: 'cobranca' })}
                    whileTap={{ scale: 0.94 }}
                  >💰</motion.button>
                </div>
              );
            })}
            {aReceberList.length > 8 && (
              <div className="cx-receber-more">+{aReceberList.length - 8} mais pendentes</div>
            )}
          </div>
        </div>
      )}

      {/* Cobranças próximas */}
      {proximas.length > 0 && (
        <div className="card-soft">
          <div className="card-head">
            <div>
              <div className="card-eyebrow">Próximos 14 dias</div>
              <h3 className="card-title">Cobranças agendadas</h3>
            </div>
          </div>
          <div className="cx-proximas">
            {proximas.map((item, i) => {
              const d = diasAte(item.data);
              return (
                <div key={i} className="cx-prox-row">
                  <div className={`cx-prox-badge${d === 0 ? ' hoje' : d <= 3 ? ' warn' : ''}`}>
                    {d === 0 ? 'Hoje' : d === 1 ? 'Amanhã' : fmtData(item.data)}
                  </div>
                  <div className="cx-prox-info">
                    <span className="cx-prox-nome">{item.ped.cliNome}</span>
                    <span className="cx-prox-tipo">
                      {item.tipo === 'parcela' ? `${(item.parcelaIdx ?? 0) + 1}ª parcela` : 'Vencimento'}
                    </span>
                  </div>
                  <strong className="cx-prox-val">{fmtR$(item.valor)}</strong>
                  <motion.button
                    className="btn-cobrar-sm"
                    onClick={() => setModal({ tipo: 'wpp', ped: item.ped, msgTipo: 'cobranca' })}
                    whileTap={{ scale: 0.94 }}
                  >💰</motion.button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Desempenho por marca */}
      {recPorMarca.length > 0 && (
        <div className="card-soft">
          <div className="card-head">
            <div>
              <div className="card-eyebrow">Desempenho {fmtMesLabel(mes)}</div>
              <h3 className="card-title">Por marca</h3>
            </div>
          </div>
          {recPorMarca.map(m => {
            const pct = totalMarca > 0 ? (m.total / totalMarca) * 100 : 0;
            return (
              <div key={m.id} className="op-row">
                <div className="op-row-head">
                  <span className="op-name" style={{ color: m.cor }}>{m.icon} {m.nome}</span>
                  <div className="op-row-r">
                    <strong>{fmtR$(m.total)}</strong>
                    <span className="op-pct">{pct.toFixed(0)}%</span>
                  </div>
                </div>
                <div className="op-bar"><div className="op-bar-fill" style={{ width: pct + '%', background: m.cor }} /></div>
              </div>
            );
          })}
        </div>
      )}

      {/* Lançamentos */}
      <div className="card-soft">
        <div className="card-head">
          <div>
            <div className="card-eyebrow">{fmtMesLabel(mes)}</div>
            <h3 className="card-title">
              Lançamentos
              {lancsMes.length > 0 && <span className="cx-badge-count">{lancsMes.length}</span>}
            </h3>
          </div>
        </div>
        {lancsMes.length === 0 ? (
          <div className="cx-empty-lanc">Nenhum lançamento neste mês</div>
        ) : (
          <div className="lanc-list">
            {lancsMes.map(f => (
              <div key={f.id} className="lanc-row">
                <div className={`lanc-icon ${f.tipo}`}>
                  {f.tipo === 'entrada'
                    ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
                    : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M12 5v14M19 12l-7 7-7-7"/></svg>}
                </div>
                <div className="lanc-body">
                  <div className="lanc-desc">{f.desc}</div>
                  <div className="lanc-date">{fmtData(f.data)}</div>
                </div>
                <strong className={`lanc-val ${f.tipo === 'entrada' ? 'sage' : 'peach'}`}>
                  {f.tipo === 'entrada' ? '+' : '−'} {fmtR$(f.valor)}
                </strong>
                <button className="lanc-del" onClick={() => deleteLanc(f.id)} title="Remover">×</button>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
