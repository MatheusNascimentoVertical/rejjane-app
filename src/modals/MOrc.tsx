import { getProd } from '../data/constants';
import { fmtDataLong, fmtR$ } from '../lib/helpers';
import type { AppCtx, Pedido } from '../types';
const bellaLogo = '/bella-logo.jpeg';

type Props = { ped: Pedido; ctx: AppCtx; onClose: () => void };

export function MOrc({ ped, ctx, onClose }: Props) {
  const { cfg } = ctx;
  const num = String(ped.id).padStart(4, '0');
  const rest = ped.vTotal - ped.sinal;

  return (
    <div className="orc-bg">
      <div className="orc-toolbar">
        <span>Orçamento #{num} · {ped.cliNome}</span>
        <div>
          <button className="btn-soft" onClick={onClose}>Fechar</button>
          <button className="btn-primary" onClick={() => window.print()}>🖨️ Imprimir / PDF</button>
        </div>
      </div>

      <div id="orc-doc" className="orc-doc">
        <header className="orc-head">
          <div className="orc-head-l">
            <img src={bellaLogo} className="orc-logo" alt="Bella" />
            <div>
              <div className="orc-brand">{cfg.nomeEmpresa}</div>
              <div className="orc-tag">{cfg.slogan}</div>
              <div className="orc-meta">{cfg.telefone} · {cfg.instagram}</div>
              <div className="orc-meta">{cfg.cidade}</div>
            </div>
          </div>
          <div className="orc-head-r">
            <div className="orc-num-eyebrow">Orçamento</div>
            <div className="orc-num">#{num}</div>
            <div className="orc-meta">Emitido em {new Date().toLocaleDateString('pt-BR')}</div>
            <span className="orc-valid">válido por 7 dias</span>
          </div>
        </header>

        <div className="orc-client">
          <div>
            <div className="orc-section-eyebrow">Cliente</div>
            <div className="orc-client-name">{ped.cliNome}</div>
          </div>
          <div>
            <div className="orc-section-eyebrow">Entrega prevista</div>
            <div className="orc-client-name">{fmtDataLong(ped.prazo)}</div>
          </div>
        </div>

        <table className="orc-tbl">
          <thead>
            <tr><th>Descrição da arte</th><th>Produto</th><th>Qtd</th><th>Unit.</th><th>Total</th></tr>
          </thead>
          <tbody>
            {(ped.itens ?? []).map((item, i) => {
              const prod = getProd(item.prodId);
              const sub = item.qtd * item.vUnit;
              return (
                <tr key={i}>
                  {i === 0 && <td rowSpan={ped.itens?.length ?? 1}>{ped.arte}</td>}
                  <td>{prod?.icon} {prod?.nome}</td>
                  <td className="ctr">{item.qtd}</td>
                  <td className="rt">{fmtR$(item.vUnit)}</td>
                  <td className="rt strong">{fmtR$(sub)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className="orc-totals">
          <div className="orc-totals-card">
            <div className="orc-tot-row"><span>Subtotal</span><span>{fmtR$(ped.vTotal)}</span></div>
            {ped.sinal > 0 && <div className="orc-tot-row sage"><span>Sinal pago</span><span>− {fmtR$(ped.sinal)}</span></div>}
            <div className="orc-tot-row grand"><span>{ped.sinal > 0 ? 'Restante' : 'Total'}</span><span>{fmtR$(ped.sinal > 0 ? rest : ped.vTotal)}</span></div>
          </div>
        </div>

        {ped.obs && <div className="orc-obs"><strong>Obs:</strong> {ped.obs}</div>}

        <div className="orc-signs">
          <div><div className="orc-sign-line" /><span>{cfg.nomeEmpresa}</span></div>
          <div><div className="orc-sign-line" /><span>{ped.cliNome}</span></div>
        </div>

        <footer className="orc-foot">
          <span>♡</span>
          <span>{cfg.nomeEmpresa} · {cfg.instagram} · {cfg.cidade}</span>
          <span>♡</span>
        </footer>
      </div>
    </div>
  );
}
