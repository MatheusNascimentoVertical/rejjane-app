import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { hoje, fmtR$, fmtData, diasAte } from '../lib/helpers';
import { MARCAS, ST } from '../data/constants';
import type { AppCtx } from '../types';

type Props = { ctx: AppCtx };

const MES_NOMES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

function fmtMes(s: string) {
  const [, m] = s.split('-').map(Number);
  return MES_NOMES[m - 1];
}

function addMes(s: string, delta: number) {
  const [y, m] = s.split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function Analiticos({ ctx }: Props) {
  const { peds, clis, prods, setModal } = ctx;
  const hoje_    = hoje();
  const meAtual  = hoje_.slice(0, 7);
  const mesAnt   = addMes(meAtual, -1);

  // ── Faturamento ──────────────────────────────────────────────────
  const pedsSemCanc   = peds.filter(p => p.st !== 'cancelado');
  const totalFaturado = pedsSemCanc.reduce((s, p) => s + p.vTotal, 0);
  const pedsMes       = pedsSemCanc.filter(p => p.data.startsWith(meAtual));
  const recMes        = pedsMes.reduce((s, p) => s + p.vTotal, 0);
  const recMesAnt     = pedsSemCanc.filter(p => p.data.startsWith(mesAnt)).reduce((s, p) => s + p.vTotal, 0);
  const crescimento   = recMesAnt > 0 ? ((recMes - recMesAnt) / recMesAnt) * 100 : null;
  const ticketGeral   = pedsSemCanc.length > 0 ? totalFaturado / pedsSemCanc.length : 0;
  const ticketMes     = pedsMes.length > 0 ? recMes / pedsMes.length : 0;

  // ── 6 meses ──────────────────────────────────────────────────────
  const ultimos6 = Array.from({ length: 6 }, (_, i) => addMes(meAtual, -(5 - i)));
  const recPorMes = ultimos6.map(mes => ({
    mes,
    label: fmtMes(mes),
    valor:   pedsSemCanc.filter(p => p.data.startsWith(mes)).reduce((s, p) => s + p.vTotal, 0),
    pedidos: pedsSemCanc.filter(p => p.data.startsWith(mes)).length,
  }));
  const maxBarVal = Math.max(...recPorMes.map(m => m.valor), 1);

  // ── Clientes ─────────────────────────────────────────────────────
  const cliStats = useMemo(() => clis.map(c => {
    const cp        = pedsSemCanc.filter(p => p.cliId === c.id);
    const total     = cp.reduce((s, p) => s + p.vTotal, 0);
    const saldoDev  = cp.filter(p => p.st !== 'pago').reduce((s, p) => s + Math.max(0, p.vTotal - p.sinal), 0);
    const ultimoPed = [...cp].sort((a, b) => b.data.localeCompare(a.data))[0];
    return { ...c, total, pedidos: cp.length, saldoDev, ultimo: ultimoPed?.data ?? '' };
  }), [clis, peds]);

  const melhores    = [...cliStats].sort((a, b) => b.total - a.total).slice(0, 6);
  const devedores   = cliStats.filter(c => c.saldoDev > 0).sort((a, b) => b.saldoDev - a.saldoDev);
  const totalDevido = devedores.reduce((s, c) => s + c.saldoDev, 0);

  const cutoff    = new Date(hoje_); cutoff.setDate(cutoff.getDate() - 60);
  const cutoffStr = cutoff.toISOString().slice(0, 10);
  const inativos  = cliStats.filter(c => c.pedidos > 0 && c.ultimo < cutoffStr);

  const novosEsteMes = cliStats.filter(c => {
    const primeiro = pedsSemCanc.filter(p => p.cliId === c.id).sort((a, b) => a.data.localeCompare(b.data))[0];
    return primeiro?.data?.startsWith(meAtual);
  }).length;

  const recorrentes   = cliStats.filter(c => c.pedidos >= 2).length;
  const taxaRecompra  = clis.length > 0 ? (recorrentes / clis.length) * 100 : 0;
  const taxaInadimp   = totalFaturado > 0 ? (totalDevido / totalFaturado) * 100 : 0;

  // ── Produtos ─────────────────────────────────────────────────────
  const prodVendas = useMemo(() => {
    const map: Record<string, { nome: string; icon: string; total: number; qtd: number }> = {};
    pedsSemCanc.forEach(p =>
      (p.itens ?? []).forEach(it => {
        const pr = prods.find(x => x.id === it.prodId);
        if (!pr) return;
        if (!map[it.prodId]) map[it.prodId] = { nome: pr.nome, icon: pr.icon, total: 0, qtd: 0 };
        map[it.prodId].total += it.qtd * it.vUnit;
        map[it.prodId].qtd   += it.qtd;
      })
    );
    return Object.values(map).sort((a, b) => b.total - a.total);
  }, [peds, prods]);
  const topProds = prodVendas.slice(0, 5);
  const maxProd  = topProds[0]?.total ?? 1;

  // ── Marcas ───────────────────────────────────────────────────────
  const marcaStats = MARCAS.map(m => ({
    ...m,
    total: pedsSemCanc.reduce((sum, p) =>
      sum + (p.itens ?? []).reduce((s, it) => {
        const pr = prods.find(x => x.id === it.prodId);
        return s + (pr?.marca === m.id ? it.qtd * it.vUnit : 0);
      }, 0), 0),
  })).filter(m => m.total > 0).sort((a, b) => b.total - a.total);
  const maxMarca = marcaStats[0]?.total ?? 1;

  // ── Formas de pagamento ──────────────────────────────────────────
  const pagStats = { pix: 0, credito: 0, dinheiro: 0 };
  pedsSemCanc.forEach(p => { (pagStats as Record<string, number>)[p.pagamento] = ((pagStats as Record<string, number>)[p.pagamento] ?? 0) + p.vTotal; });
  const totalPag = pagStats.pix + pagStats.credito + pagStats.dinheiro;

  // ── Insights ─────────────────────────────────────────────────────
  const insights: { icon: string; text: string }[] = [];
  if (melhores[0]?.total > 0)     insights.push({ icon: '🏆', text: `Sua melhor cliente é ${melhores[0].nome} com ${fmtR$(melhores[0].total)} em pedidos.` });
  if (crescimento !== null)        insights.push({ icon: crescimento >= 0 ? '📈' : '📉', text: `Faturamento ${crescimento >= 0 ? 'cresceu' : 'caiu'} ${Math.abs(crescimento).toFixed(0)}% em relação ao mês passado.` });
  if (inativos.length > 0)        insights.push({ icon: '😴', text: `${inativos.length} cliente${inativos.length > 1 ? 's' : ''} não compra${inativos.length > 1 ? 'm' : ''} há mais de 60 dias — hora de um oi!` });
  if (taxaRecompra > 50)          insights.push({ icon: '🔁', text: `${taxaRecompra.toFixed(0)}% das suas clientes já compraram mais de uma vez. Ótima fidelização!` });
  if (marcaStats[0])              insights.push({ icon: '🌟', text: `${marcaStats[0].nome} é sua marca mais forte com ${fmtR$(marcaStats[0].total)} em vendas.` });
  if (devedores.length > 0)       insights.push({ icon: '💰', text: `Você tem ${fmtR$(totalDevido)} a receber de ${devedores.length} cliente${devedores.length > 1 ? 's' : ''}.` });
  if (novosEsteMes > 0)           insights.push({ icon: '🌸', text: `${novosEsteMes} nova${novosEsteMes > 1 ? 's' : ''} cliente${novosEsteMes > 1 ? 's' : ''} este mês!` });

  return (
    <div className="analiticos">

      <div className="cat-header">
        <div>
          <div className="card-eyebrow">Visão completa do negócio</div>
          <h2 className="topbar-title">Análise</h2>
        </div>
      </div>

      {/* ── Insights ── */}
      {insights.length > 0 && (
        <div className="an-insights">
          <div className="an-insights-title">💡 Insights automáticos</div>
          {insights.map((ins, i) => (
            <motion.div key={i} className="an-insight-row"
              initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}>
              <span className="an-insight-icon">{ins.icon}</span>
              <span>{ins.text}</span>
            </motion.div>
          ))}
        </div>
      )}

      {/* ── KPIs ── */}
      <div className="an-kpi-row">
        <div className="an-kpi">
          <div className="an-kpi-icon">💰</div>
          <div className="an-kpi-val">{fmtR$(totalFaturado)}</div>
          <div className="an-kpi-label">Faturamento total</div>
          <div className="an-kpi-sub">{pedsSemCanc.length} pedidos</div>
        </div>
        <div className="an-kpi">
          <div className="an-kpi-icon">📅</div>
          <div className="an-kpi-val">{fmtR$(recMes)}</div>
          <div className="an-kpi-label">Este mês</div>
          {crescimento !== null
            ? <div className={`an-kpi-sub${crescimento >= 0 ? ' sage' : ' red'}`}>{crescimento >= 0 ? '▲' : '▼'} {Math.abs(crescimento).toFixed(0)}% vs anterior</div>
            : <div className="an-kpi-sub">primeiro mês</div>}
        </div>
        <div className="an-kpi">
          <div className="an-kpi-icon">🎯</div>
          <div className="an-kpi-val">{fmtR$(ticketGeral)}</div>
          <div className="an-kpi-label">Ticket médio</div>
          <div className="an-kpi-sub">do mês: {fmtR$(ticketMes)}</div>
        </div>
        <div className="an-kpi an-kpi-alerta">
          <div className="an-kpi-icon">⏳</div>
          <div className="an-kpi-val">{fmtR$(totalDevido)}</div>
          <div className="an-kpi-label">A receber</div>
          <div className="an-kpi-sub">{taxaInadimp.toFixed(1)}% do faturado</div>
        </div>
      </div>

      {/* ── Gráfico mensal ── */}
      <div className="card-soft">
        <div className="card-head">
          <div>
            <div className="card-eyebrow">Últimos 6 meses</div>
            <h3 className="card-title">Faturamento mensal</h3>
          </div>
        </div>
        <div className="an-chart">
          {recPorMes.map((m, i) => (
            <div key={i} className={`an-bar-col${m.mes === meAtual ? ' current' : ''}`}>
              <div className="an-bar-val">{m.valor > 0 ? fmtR$(m.valor) : ''}</div>
              <div className="an-bar-wrap">
                <motion.div
                  className="an-bar-fill"
                  initial={{ height: 0 }}
                  animate={{ height: `${(m.valor / maxBarVal) * 100}%` }}
                  transition={{ delay: i * 0.07, duration: 0.5, type: 'spring' }}
                />
              </div>
              <div className="an-bar-label">{m.label}</div>
              <div className="an-bar-pedidos">{m.pedidos > 0 ? `${m.pedidos}p` : ''}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Clientes + Devedores ── */}
      <div className="an-split">

        <div className="card-soft">
          <div className="card-head">
            <div>
              <div className="card-eyebrow">Clientes</div>
              <h3 className="card-title">Resumo geral</h3>
            </div>
          </div>

          <div className="an-cli-stats">
            <div className="an-cli-stat">
              <span className="an-cli-num">{clis.length}</span>
              <span className="an-cli-lbl">total</span>
            </div>
            <div className="an-cli-stat">
              <span className="an-cli-num sage">{recorrentes}</span>
              <span className="an-cli-lbl">recorrentes</span>
            </div>
            <div className="an-cli-stat">
              <span className="an-cli-num" style={{ color: 'var(--rose-d)' }}>{novosEsteMes}</span>
              <span className="an-cli-lbl">novos este mês</span>
            </div>
            <div className="an-cli-stat">
              <span className={`an-cli-num${inativos.length > 0 ? ' red' : ''}`}>{inativos.length}</span>
              <span className="an-cli-lbl">inativos +60d</span>
            </div>
          </div>

          <div className="an-section-title">🏆 Melhores clientes</div>
          {melhores.map((c, i) => (
            <div key={c.id} className="an-cli-row">
              <span className={`an-rank an-rank-${Math.min(i + 1, 4)}`}>{i + 1}</span>
              <div className="an-cli-info">
                <span className="an-cli-nome">{c.nome}</span>
                <span className="an-cli-meta">{c.pedidos} pedido{c.pedidos !== 1 ? 's' : ''}</span>
              </div>
              <strong className="an-cli-total">{fmtR$(c.total)}</strong>
            </div>
          ))}
          {melhores.length === 0 && <div className="an-empty">Nenhum pedido ainda.</div>}

          {inativos.length > 0 && (
            <>
              <div className="an-section-title" style={{ marginTop: 18 }}>😴 Clientes dormindo</div>
              {inativos.slice(0, 5).map(c => (
                <div key={c.id} className="an-cli-row">
                  <span className="an-inativo-dot" />
                  <div className="an-cli-info">
                    <span className="an-cli-nome">{c.nome}</span>
                    <span className="an-cli-meta">último: {c.ultimo ? fmtData(c.ultimo) : '—'}</span>
                  </div>
                  <button className="btn-soft-sm" style={{ fontSize: 11, padding: '4px 10px' }}
                    onClick={() => {
                      const ped = [...peds].filter(p => p.cliId === c.id).sort((a, b) => b.data.localeCompare(a.data))[0];
                      if (ped) setModal({ tipo: 'wpp', ped });
                    }}>💬 Oi</button>
                </div>
              ))}
              {inativos.length > 5 && <div className="an-empty" style={{ paddingTop: 6 }}>+{inativos.length - 5} mais</div>}
            </>
          )}
        </div>

        <div className="card-soft">
          <div className="card-head">
            <div>
              <div className="card-eyebrow">Cobranças</div>
              <h3 className="card-title">Devedoras <span className="cx-badge-val">{fmtR$(totalDevido)}</span></h3>
            </div>
          </div>
          {devedores.length === 0 ? (
            <div className="an-empty">🎉 Nenhuma devedora! Todas em dia.</div>
          ) : devedores.map((c, i) => {
            const cpAtivos = peds.filter(p => p.cliId === c.id && p.st !== 'cancelado' && p.st !== 'pago');
            const refData  = cpAtivos.map(p => p.vencimento || p.prazo).sort()[0] ?? '';
            const dias     = refData ? diasAte(refData) : null;
            return (
              <div key={c.id} className={`an-dev-row${dias !== null && dias < 0 ? ' late' : ''}`}>
                <span className="an-dev-pos">{i + 1}</span>
                <div className="an-cli-info">
                  <span className="an-cli-nome">{c.nome}</span>
                  <span className="an-cli-meta">
                    {cpAtivos.length} pedido{cpAtivos.length !== 1 ? 's' : ''}
                    {dias !== null && (
                      <span className={dias < 0 ? ' red' : ''}>
                        {dias < 0 ? ` · ${Math.abs(dias)}d atraso` : ` · em ${dias}d`}
                      </span>
                    )}
                  </span>
                </div>
                <div className="an-dev-r">
                  <strong className="an-dev-val">{fmtR$(c.saldoDev)}</strong>
                  <motion.button className="btn-cobrar-sm" style={{ fontSize: 11, padding: '4px 8px' }}
                    whileTap={{ scale: 0.94 }}
                    onClick={() => { if (cpAtivos[0]) setModal({ tipo: 'wpp', ped: cpAtivos[0], msgTipo: 'cobranca' }); }}>
                    💰
                  </motion.button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Top produtos ── */}
      <div className="card-soft">
        <div className="card-head">
          <div>
            <div className="card-eyebrow">Todos os tempos</div>
            <h3 className="card-title">Produtos mais vendidos</h3>
          </div>
        </div>
        {topProds.length === 0 ? (
          <div className="an-empty">Nenhuma venda ainda.</div>
        ) : topProds.map((p, i) => (
          <div key={i} className="an-prod-row">
            <span className="an-prod-icon">{p.icon}</span>
            <div className="an-prod-info">
              <span className="an-prod-nome">{p.nome}</span>
              <div className="an-prod-bar-wrap">
                <motion.div className="an-prod-bar"
                  initial={{ width: 0 }}
                  animate={{ width: `${(p.total / maxProd) * 100}%` }}
                  transition={{ delay: i * 0.06, duration: 0.5 }} />
              </div>
            </div>
            <div className="an-prod-r">
              <strong>{fmtR$(p.total)}</strong>
              <span>{p.qtd} unid.</span>
            </div>
          </div>
        ))}
      </div>

      {/* ── Marcas + Pagamentos + Status ── */}
      <div className="an-split">
        <div className="card-soft">
          <div className="card-head">
            <div>
              <div className="card-eyebrow">Vendas por marca</div>
              <h3 className="card-title">Todos os tempos</h3>
            </div>
          </div>
          {marcaStats.length === 0 ? (
            <div className="an-empty">Sem dados.</div>
          ) : marcaStats.map(m => {
            const pct = (m.total / maxMarca) * 100;
            return (
              <div key={m.id} className="op-row">
                <div className="op-row-head">
                  <span className="op-name" style={{ color: m.cor }}>{m.icon} {m.nome}</span>
                  <div className="op-row-r">
                    <strong>{fmtR$(m.total)}</strong>
                    <span className="op-pct">{totalFaturado > 0 ? ((m.total / totalFaturado) * 100).toFixed(0) : 0}%</span>
                  </div>
                </div>
                <div className="op-bar"><div className="op-bar-fill" style={{ width: pct + '%', background: m.cor }} /></div>
              </div>
            );
          })}
        </div>

        <div className="card-soft">
          <div className="card-head">
            <div>
              <div className="card-eyebrow">Como pagam</div>
              <h3 className="card-title">Formas de pagamento</h3>
            </div>
          </div>
          {([['pix', '⚡ PIX', '#4caf50'], ['credito', '💳 Cartão', '#7c4dff'], ['dinheiro', '💵 Dinheiro', '#c98b3e']] as const).map(([k, label, cor]) => {
            const val = (pagStats as Record<string, number>)[k] ?? 0;
            const pct = totalPag > 0 ? (val / totalPag) * 100 : 0;
            return (
              <div key={k} className="op-row">
                <div className="op-row-head">
                  <span className="op-name">{label}</span>
                  <div className="op-row-r">
                    <strong>{fmtR$(val)}</strong>
                    <span className="op-pct">{pct.toFixed(0)}%</span>
                  </div>
                </div>
                <div className="op-bar"><div className="op-bar-fill" style={{ width: pct + '%', background: cor }} /></div>
              </div>
            );
          })}

          <div className="an-section-title" style={{ marginTop: 20 }}>📊 Status dos pedidos</div>
          {Object.entries(ST).map(([k, v]) => {
            const n = peds.filter(p => p.st === k).length;
            if (n === 0) return null;
            const pct = peds.length > 0 ? (n / peds.length) * 100 : 0;
            return (
              <div key={k} className="op-row">
                <div className="op-row-head">
                  <span className="op-name"><span style={{ color: v.cor }}>● </span>{v.label}</span>
                  <div className="op-row-r">
                    <strong>{n}</strong>
                    <span className="op-pct">{pct.toFixed(0)}%</span>
                  </div>
                </div>
                <div className="op-bar"><div className="op-bar-fill" style={{ width: pct + '%', background: v.cor }} /></div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
