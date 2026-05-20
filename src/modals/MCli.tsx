import { useState } from 'react';
import { Sheet, Field } from './Sheet';
import type { AppCtx, Cliente } from '../types';

type Props = { dados: Partial<Cliente>; ctx: AppCtx; onClose: () => void };

export function MCli({ dados, ctx, onClose }: Props) {
  const { setClis } = ctx;
  const [f, setF] = useState({ nome: dados.nome ?? '', tel: dados.tel ?? '', obs: dados.obs ?? '', fav: dados.fav ?? false, id: dados.id });

  const salvar = () => {
    if (f.id) {
      setClis(p => p.map(c => c.id === f.id ? { ...c, ...f, id: f.id! } : c));
    } else {
      setClis(p => [{ ...f, id: Date.now() }, ...p]);
    }
    onClose();
  };

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
        <button className="btn-soft" onClick={onClose}>Cancelar</button>
        <button className="btn-primary" onClick={salvar}>Salvar</button>
      </div>
    </Sheet>
  );
}
