import { useState } from 'react';
import { Sheet, Field } from './Sheet';
import { ST } from '../data/constants';
import { fmtR$, fmtData } from '../lib/helpers';
import type { AppCtx, Cliente } from '../types';

type Props = { dados: Partial<Cliente>; ctx: AppCtx; onClose: () => void };

export function MCli({ dados, ctx, onClose }: Props) {
  const { setClis, peds, setModal } = ctx;
  const isExisting = Boolean(dados.id);
  const [mode, setMode] = useState<'view' | 'edit'>(isExisting ? 'view' : 'edit');
  const [f, setF] = useState({ nome: dados.nome ?? '', tel: dados.tel ?? '', obs: dados.obs ?? '', fav: dados.fav ?? false, id: dados.id });

  const salvar = () => {
    if (f.id) {
      setClis(p => p.map(c => c.id === f.id ? { ...c, ...f, id: f.id! } : c));
    } else {
      setClis(p => [{ ...f, id: Date.now() }, ...p]);
    }
    onClose();
  };

  const cliPeds = isExisting ? peds.filter(p => p.cliId === dados.id) : [];
  const ativos = cliPeds.filter(p => p.st !== 'cancelado' && p.st !== 'entregue');
  const totalDeve = ativos.reduce((a, p) => {
    const restParcelas = p.parcelas?.filter(x => !x.pago).reduce((s, x) => s + x.valor, 0);
    return a + (restParcelas !== undefined ? restParcelas : p.vTotal - p.sinal);
  }, 0);

  if (mode === 'view') {
    return (
      <Sheet title={dados.nome!} subtitle="Histórico do cliente" onClose={onClose}>
        <div className="cli-view-header">
          <div className="cli-view-stats">
            <div className="cli-view-stat">
              <span className="cvs-label">Pedidos</span>
              <strong>{cliPeds.length}</strong>
            </div>
            <div className="cli-view-stat">
              <span className="cvs-label">Em aberto</span>
              <strong className={ativos.length > 0 ? 'peach' : ''}>{ativos.length}</strong>
            </div>
            <div className="cli-view-stat deve">
              <span className="cvs-label">Deve</span>
              <strong className={totalDeve > 0 ? 'peach' : 'sage'}>{fmtR$(totalDeve)}</strong>
            </div>
          </div>
          {dados.tel && <div className="cli-view-tel">📱 {dados.tel}</div>}
          {dados.obs && <div className="cli-view-obs">💬 {dados.obs}</div>}
        </div>

        {cliPeds.length === 0 ? (
          <div className="empty-state" style={{ padding: '24px 0' }}>
            <div className="empty-glyph">🛍</div>
            <p>Nenhum pedido ainda</p>
          </div>
        ) : (
          <div className="cli-peds-list">
            <div className="cli-peds-title">Pedidos</div>
            {cliPeds.map(p => {
              const stCfg = ST[p.st];
              const rest = p.parcelas
                ? p.parcelas.filter(x => !x.pago).reduce((s, x) => s + x.valor, 0)
                : p.vTotal - p.sinal;
              return (
                <div key={p.id} className="cli-ped-row" onClick={() => { setModal({ tipo: 'ped', dados: { ...p } }); onClose(); }}>
                  <div className="cli-ped-left">
                    <span className="cli-ped-num">#{p.id}</span>
                    <span className="status-pill" style={{ color: stCfg.cor, background: stCfg.bg }}>{stCfg.label}</span>
                  </div>
                  <div className="cli-ped-mid">
                    <div className="cli-ped-prods">
                      {p.itens?.map((it, i) => <span key={i}>{it.prodId}{i < p.itens.length - 1 ? ' · ' : ''}</span>)}
                    </div>
                    <div className="cli-ped-date">{fmtData(p.prazo)}</div>
                  </div>
                  <div className="cli-ped-right">
                    <strong>{fmtR$(p.vTotal)}</strong>
                    {rest > 0 && <span className="cli-ped-deve">deve {fmtR$(rest)}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="sheet-actions">
          <button className="btn-soft" onClick={onClose}>Fechar</button>
          <button className="btn-primary" onClick={() => setMode('edit')}>✏️ Editar cadastro</button>
        </div>
      </Sheet>
    );
  }

  return (
    <Sheet title={dados.id ? 'Editar cliente' : 'Nova cliente'} subtitle="Cadastro" onClose={onClose}>
      <Field label="Nome">
        <input value={f.nome} onChange={e => setF(s => ({ ...s, nome: e.target.value }))} placeholder="Nome completo" />
      </Field>
      <Field label="WhatsApp">
        <input value={f.tel} onChange={e => setF(s => ({ ...s, tel: e.target.value }))} placeholder="(61) 99999-9999" />
      </Field>
      <Field label="Observações">
        <textarea rows={3} value={f.obs} onChange={e => setF(s => ({ ...s, obs: e.target.value }))} placeholder="Preferências, aniversário, indicações…" />
      </Field>
      <label className="fav-toggle">
        <input type="checkbox" checked={f.fav} onChange={e => setF(s => ({ ...s, fav: e.target.checked }))} />
        <span>★ Marcar como VIP</span>
      </label>
      <div className="sheet-actions">
        {dados.id && <button className="btn-soft" onClick={() => setMode('view')}>← Voltar</button>}
        {!dados.id && <button className="btn-soft" onClick={onClose}>Cancelar</button>}
        <button className="btn-primary" onClick={salvar}>Salvar</button>
      </div>
    </Sheet>
  );
}
