import { hoje, fmtData, fmtR$ } from '../lib/helpers';
import { MARCAS } from '../data/constants';
import type { AppCtx } from '../types';

type Props = { ctx: AppCtx };

export function Caixa({ ctx }: Props) {
  const { fin, recMes, despMes, setModal, peds } = ctx;
  const saldo = recMes - despMes;
  const mes = hoje().slice(0, 7);

  const recPorMarca = MARCAS.map(m => {
    const total = peds
      .filter(p => p.data.startsWith(mes) && p.st !== 'cancelado')
      .reduce((sum, p) => {
        const contrib = (p.itens ?? []).reduce((s, it) => {
          const prod = it.prodId;
          const isMarca = prod.startsWith(m.id.toLowerCase().slice(0, 3));
          return s + (isMarca ? it.qtd * it.vUnit : 0);
        }, 0);
        return sum + contrib;
      }, 0);
    const entradas = fin
      .filter(f => f.tipo === 'entrada' && f.data.startsWith(mes) && f.desc.toLowerCase().includes(m.nome.toLowerCase()))
      .reduce((a, b) => a + b.valor, 0);
    return { ...m, total: entradas };
  });

  const totalEntradas = recPorMarca.reduce((a, b) => a + b.total, 0);

  return (
    <div className="caixa">
      <div className="caixa-hero">
        <div className="caixa-hero-l">
          <div className="card-eyebrow">Saldo do mês</div>
          <div className={`caixa-saldo${saldo >= 0 ? ' sage' : ' red'}`}>{fmtR$(saldo)}</div>
          <div className="caixa-saldo-sub">Entradas {fmtR$(recMes)} · Saídas {fmtR$(despMes)}</div>
        </div>
        <div className="caixa-hero-actions">
          <button className="btn-primary" onClick={() => setModal({ tipo: 'fin', dados: { tipo: 'entrada' } })}>+ Entrada</button>
          <button className="btn-soft"    onClick={() => setModal({ tipo: 'fin', dados: { tipo: 'saida'   } })}>+ Saída</button>
        </div>
      </div>

      <div className="caixa-split">
        <div className="card-soft">
          <div className="card-head">
            <div>
              <div className="card-eyebrow">Por marca</div>
              <h3 className="card-title">Entradas do mês</h3>
            </div>
          </div>
          {recPorMarca.map(m => {
            const pct = totalEntradas > 0 ? (m.total / totalEntradas) * 100 : 0;
            return (
              <div key={m.id} className="op-row">
                <div className="op-row-head">
                  <span className="op-name" style={{ color: m.cor }}>{m.icon} {m.nome}</span>
                  <strong>{fmtR$(m.total)}</strong>
                </div>
                <div className="op-bar"><div className="op-bar-fill" style={{ width: pct + '%', background: m.cor }} /></div>
              </div>
            );
          })}
        </div>

        <div className="card-soft">
          <div className="card-head">
            <div>
              <div className="card-eyebrow">Histórico</div>
              <h3 className="card-title">Lançamentos</h3>
            </div>
          </div>
          <div className="lanc-list">
            {[...fin].sort((a, b) => b.data.localeCompare(a.data)).slice(0, 15).map(f => (
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
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
