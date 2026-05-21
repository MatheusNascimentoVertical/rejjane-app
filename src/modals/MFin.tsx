import { useState } from 'react';
import { Sheet, Field } from './Sheet';
import { hoje } from '../lib/helpers';
import type { AppCtx } from '../types';

type Props = { dados: { tipo: 'entrada' | 'saida' }; ctx: AppCtx; onClose: () => void };

export function MFin({ dados, ctx, onClose }: Props) {
  const { setFin, cfg } = ctx;
  const ops = cfg.ops ?? [];
  const [f, setF] = useState({ tipo: dados.tipo, desc: '', valor: '', data: hoje(), op: ops[0]?.id ?? 'bella' });

  const salvar = () => {
    setFin(p => [{ ...f, id: Date.now(), valor: Number(f.valor) }, ...p]);
    onClose();
  };

  return (
    <Sheet title={f.tipo === 'entrada' ? 'Nova entrada' : 'Nova saída'} subtitle="Caixa" onClose={onClose}>
      <Field label="Descrição">
        <input value={f.desc} onChange={e => setF(s => ({ ...s, desc: e.target.value }))} placeholder="Ex: Compra de canecas" />
      </Field>
      <div className="form-grid">
        <Field label="Valor">
          <input type="number" value={f.valor} onChange={e => setF(s => ({ ...s, valor: e.target.value }))} placeholder="0,00" />
        </Field>
        <Field label="Data">
          <input type="date" value={f.data} onChange={e => setF(s => ({ ...s, data: e.target.value }))} />
        </Field>
      </div>
      <Field label="Operadora">
        <select value={f.op} onChange={e => setF(s => ({ ...s, op: e.target.value }))}>
          {ops.map(o => <option key={o.id} value={o.id}>✿ {o.nome}</option>)}
        </select>
      </Field>
      <div className="sheet-actions">
        <button className="btn-soft" onClick={onClose}>Cancelar</button>
        <button className="btn-primary" onClick={salvar}>Salvar</button>
      </div>
    </Sheet>
  );
}
