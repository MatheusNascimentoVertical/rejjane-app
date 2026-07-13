import { useState } from 'react';
import { Sheet, Field } from './Sheet';
import { hoje } from '../lib/helpers';
import type { AppCtx } from '../types';

type Props = { dados: { tipo: 'entrada' | 'saida' }; ctx: AppCtx; onClose: () => void };

const PRESETS_SAIDA = [
  { icon: '💳', label: 'Pagar fatura',      desc: 'Pagamento de fatura do catálogo' },
  { icon: '📦', label: 'Compra de estoque', desc: 'Compra de material / estoque' },
  { icon: '🚗', label: 'Transporte',        desc: 'Transporte e entrega' },
  { icon: '🛒', label: 'Campanha',          desc: 'Compra de campanha' },
  { icon: '📱', label: 'Taxa / plano',      desc: 'Taxa ou plano mensal' },
  { icon: '🧾', label: 'Outro gasto',       desc: 'Outros gastos' },
];

const PRESETS_ENTRADA = [
  { icon: '💰', label: 'Pagamento pedido', desc: 'Pagamento de pedido' },
  { icon: '✋', label: 'Sinal recebido',   desc: 'Sinal recebido' },
  { icon: '🛍️', label: 'Venda à vista',   desc: 'Venda à vista' },
  { icon: '🔄', label: 'Devolução',        desc: 'Devolução recebida' },
  { icon: '🎁', label: 'Bonificação',      desc: 'Bonificação / brinde revendido' },
  { icon: '➕', label: 'Outro recebimento', desc: 'Outro recebimento' },
];

export function MFin({ dados, ctx, onClose }: Props) {
  const { setFin } = ctx;
  const [f, setF] = useState({ tipo: dados.tipo, desc: '', valor: '', data: hoje() });

  const presets = f.tipo === 'saida' ? PRESETS_SAIDA : PRESETS_ENTRADA;

  const salvar = () => {
    if (!f.desc.trim() || !f.valor) return;
    setFin(p => [{ ...f, id: Date.now(), valor: Number(f.valor) }, ...p]);
    onClose();
  };

  return (
    <Sheet title={f.tipo === 'entrada' ? 'Nova entrada' : 'Nova saída'} subtitle="Caixa" onClose={onClose}>

      {/* Type toggle */}
      <div className="fin-tipo-row">
        <button
          className={`fin-tipo-btn${f.tipo === 'entrada' ? ' active-entrada' : ''}`}
          onClick={() => setF(s => ({ ...s, tipo: 'entrada', desc: '' }))}
        >
          ▲ Entrada
        </button>
        <button
          className={`fin-tipo-btn${f.tipo === 'saida' ? ' active-saida' : ''}`}
          onClick={() => setF(s => ({ ...s, tipo: 'saida', desc: '' }))}
        >
          ▼ Saída
        </button>
      </div>

      {/* Category quick-pick */}
      <div className="fin-chips-label">Categoria rápida</div>
      <div className="fin-chips">
        {presets.map(p => (
          <button
            key={p.label}
            className={`fin-chip${f.desc === p.desc ? ' active' : ''}`}
            onClick={() => setF(s => ({ ...s, desc: p.desc }))}
            type="button"
          >
            <span>{p.icon}</span>
            <span>{p.label}</span>
          </button>
        ))}
      </div>

      <Field label="Descrição">
        <input
          value={f.desc}
          onChange={e => setF(s => ({ ...s, desc: e.target.value }))}
          placeholder={f.tipo === 'saida' ? 'Ex: Fatura Boticário campanha 14' : 'Ex: Sinal pedido Ana Paula'}
        />
      </Field>

      <div className="form-grid">
        <Field label="Valor (R$)">
          <input
            type="number"
            inputMode="decimal"
            value={f.valor}
            onChange={e => setF(s => ({ ...s, valor: e.target.value }))}
            placeholder="0,00"
          />
        </Field>
        <Field label="Data">
          <input type="date" value={f.data} onChange={e => setF(s => ({ ...s, data: e.target.value }))} />
        </Field>
      </div>

      <div className="sheet-actions">
        <button className="btn-soft" onClick={onClose}>Cancelar</button>
        <button
          className="btn-primary"
          onClick={salvar}
          disabled={!f.desc.trim() || !f.valor}
        >
          {f.tipo === 'entrada' ? 'Registrar entrada' : 'Registrar saída'}
        </button>
      </div>
    </Sheet>
  );
}
