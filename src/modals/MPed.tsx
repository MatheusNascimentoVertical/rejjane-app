import { useState } from 'react';
import { Sheet, Field } from './Sheet';
import { PRODS, OPS, ST, getProd } from '../data/constants';
import { hoje, dPlus, fmtR$ } from '../lib/helpers';
import type { AppCtx, PedidoForm, PedStatus, OpId } from '../types';

type Props = { dados?: Partial<import('../types').Pedido>; ctx: AppCtx; onClose: () => void };

export function MPed({ dados, ctx, onClose }: Props) {
  const { clis, salvarPed } = ctx;
  const [f, setF] = useState<PedidoForm>({
    cliId:  dados?.cliId  ?? (clis[0]?.id ?? ''),
    prodId: dados?.prodId ?? PRODS[0].id,
    qtd:    dados?.qtd    ?? 1,
    vUnit:  dados?.vUnit  ?? PRODS[0].preco,
    arte:   dados?.arte   ?? '',
    op:     dados?.op     ?? 'bella',
    data:   dados?.data   ?? hoje(),
    prazo:  dados?.prazo  ?? dPlus(7),
    sinal:  dados?.sinal  ?? 0,
    st:     dados?.st     ?? 'orcamento',
    obs:    dados?.obs    ?? '',
    id:     dados?.id,
  });

  const total = (Number(f.qtd) || 1) * (Number(f.vUnit) || 0);
  const upd = <K extends keyof PedidoForm>(k: K, v: PedidoForm[K]) => setF(s => ({ ...s, [k]: v }));

  const setProd = (id: string) => {
    const p = getProd(id);
    setF(s => ({ ...s, prodId: id, vUnit: p?.preco ?? s.vUnit }));
  };

  return (
    <Sheet title={dados?.id ? 'Editar pedido' : 'Novo pedido'} subtitle="Bella Personalizados" onClose={onClose} wide>
      <div className="form-grid">
        <Field label="Cliente">
          <select value={String(f.cliId)} onChange={e => upd('cliId', e.target.value)}>
            {clis.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>
        </Field>
        <Field label="Operadora">
          <select value={f.op} onChange={e => upd('op', e.target.value as OpId)}>
            {OPS.map(o => <option key={o.id} value={o.id}>✿ {o.nome}</option>)}
          </select>
        </Field>
      </div>

      <Field label="Produto">
        <select value={f.prodId} onChange={e => setProd(e.target.value)}>
          {PRODS.map(p => <option key={p.id} value={p.id}>{p.icon} {p.nome} — {fmtR$(p.preco)}</option>)}
        </select>
      </Field>

      <Field label="Descrição da arte">
        <input value={f.arte} onChange={e => upd('arte', e.target.value)} placeholder="Ex: Caneca nome Bia + flores rosas" />
      </Field>

      <div className="form-grid form-grid-3">
        <Field label="Qtd"><input type="number" value={f.qtd} onChange={e => upd('qtd', e.target.value)} /></Field>
        <Field label="Valor unit."><input type="number" value={f.vUnit} onChange={e => upd('vUnit', e.target.value)} /></Field>
        <Field label="Sinal pago"><input type="number" value={f.sinal} onChange={e => upd('sinal', e.target.value)} /></Field>
      </div>

      <div className="total-box">
        <span>Total do pedido</span>
        <strong>{fmtR$(total)}</strong>
      </div>

      <div className="form-grid">
        <Field label="Data do pedido"><input type="date" value={f.data} onChange={e => upd('data', e.target.value)} /></Field>
        <Field label="Prazo de entrega"><input type="date" value={f.prazo} onChange={e => upd('prazo', e.target.value)} /></Field>
      </div>

      <Field label="Status">
        <div className="status-picker">
          {Object.entries(ST).map(([k, v]) => (
            <button
              key={k} type="button"
              className={`status-opt${f.st === k ? ' active' : ''}`}
              onClick={() => upd('st', k as PedStatus)}
              style={f.st === k ? { background: v.bg, color: v.cor, borderColor: v.cor + '55' } : {}}
            >
              <span className="ftab-dot" style={{ background: v.cor }} /> {v.label}
            </button>
          ))}
        </div>
      </Field>

      <Field label="Observações"><textarea rows={2} value={f.obs} onChange={e => upd('obs', e.target.value)} /></Field>

      <div className="sheet-actions">
        <button className="btn-soft" onClick={onClose}>Cancelar</button>
        <button className="btn-primary" onClick={() => salvarPed(f)}>Salvar pedido</button>
      </div>
    </Sheet>
  );
}
