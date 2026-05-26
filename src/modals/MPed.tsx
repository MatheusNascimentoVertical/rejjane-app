import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Sheet, Field } from './Sheet';
import { MCli } from './MCli';
import { PRODS, ST, getProd } from '../data/constants';
import { hoje, dPlus, fmtR$ } from '../lib/helpers';
import type { AppCtx, PedidoForm, PedItem, PedStatus, Pagamento, Cliente } from '../types';

type Props = { dados?: Partial<import('../types').Pedido>; ctx: AppCtx; onClose: () => void };

const PAG_OPTS: { value: Pagamento; label: string }[] = [
  { value: 'pix',      label: 'PIX' },
  { value: 'credito',  label: 'Cartão de crédito' },
  { value: 'dinheiro', label: 'Dinheiro' },
];

export function MPed({ dados, ctx, onClose }: Props) {
  const { clis, salvarPed } = ctx;
  const prodList = ctx.prods.length > 0 ? ctx.prods : PRODS;

  const defaultItem = (): PedItem => ({ prodId: prodList[0]?.id ?? '', qtd: 1, vUnit: prodList[0]?.preco ?? 0 });

  const [showNovaCli, setShowNovaCli] = useState(false);

  const [f, setF] = useState<PedidoForm>({
    cliId:     dados?.cliId      ?? (clis[0]?.id ?? ''),
    itens:     dados?.itens?.length ? dados.itens : [defaultItem()],
    pagamento: dados?.pagamento  ?? 'pix',
    data:      dados?.data       ?? hoje(),
    prazo:     dados?.prazo      ?? dPlus(7),
    sinal:     dados?.sinal      ?? 0,
    st:        dados?.st         ?? 'orcamento',
    obs:       dados?.obs        ?? '',
    id:        dados?.id,
    vencimento: dados?.vencimento ?? '',
  });

  const total = f.itens.reduce((s, it) => s + (Number(it.qtd) || 0) * (Number(it.vUnit) || 0), 0);
  const upd = <K extends keyof PedidoForm>(k: K, v: PedidoForm[K]) => setF(s => ({ ...s, [k]: v }));

  // Wrapped ctx for MCli: auto-selects newly created client after save
  const cliCtx: AppCtx = {
    ...ctx,
    setClis: ((updater: React.SetStateAction<Cliente[]>) => {
      ctx.setClis(prev => {
        const next = typeof updater === 'function' ? (updater as (p: Cliente[]) => Cliente[])(prev) : updater;
        const nova = next.find(c => !prev.find(p => p.id === c.id));
        if (nova) setF(s => ({ ...s, cliId: String(nova.id) }));
        return next;
      });
    }) as React.Dispatch<React.SetStateAction<Cliente[]>>,
  };

  const updItem = (i: number, patch: Partial<PedItem>) =>
    setF(s => ({ ...s, itens: s.itens.map((it, idx) => idx === i ? { ...it, ...patch } : it) }));

  const addItem = () => setF(s => ({ ...s, itens: [...s.itens, defaultItem()] }));

  const removeItem = (i: number) =>
    setF(s => ({ ...s, itens: s.itens.filter((_, idx) => idx !== i) }));

  const setProdItem = (i: number, prodId: string) => {
    const p = getProd(prodId);
    updItem(i, { prodId, vUnit: p?.preco ?? 0 });
  };

  return (
    <>
    <Sheet title={dados?.id ? 'Editar pedido' : 'Novo pedido'} subtitle="Rejjanevendas" onClose={onClose} wide>
      <div className="form-grid">
        <Field label="Cliente">
          <div className="ped-cli-row">
            <select value={String(f.cliId)} onChange={e => upd('cliId', e.target.value)}>
              <option value="">Selecionar cliente…</option>
              {clis.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
            <button type="button" className="btn-nova-cli" onClick={() => setShowNovaCli(true)} title="Cadastrar nova cliente">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
              Nova
            </button>
          </div>
        </Field>
        <Field label="Forma de pagamento">
          <select value={f.pagamento} onChange={e => upd('pagamento', e.target.value as Pagamento)}>
            {PAG_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </Field>
      </div>

      <div className="ped-itens-label"><span className="field-label">Produtos do pedido</span></div>
      <div className="ped-itens">
        {f.itens.map((item, i) => {
          const prodAtual = getProd(item.prodId);
          return (
            <div key={i} className="ped-item-card">
              <div className="ped-item-top">
                <span className="ped-item-icon">{prodAtual?.icon ?? '📦'}</span>
                <select className="ped-item-select" value={item.prodId} onChange={e => setProdItem(i, e.target.value)}>
                  {prodList.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                </select>
                {f.itens.length > 1 && (
                  <button className="ped-item-del" onClick={() => removeItem(i)}>×</button>
                )}
              </div>
              <div className="ped-item-bottom">
                <div className="ped-qty-wrap">
                  <span className="ped-item-lbl">Qtd</span>
                  <div className="ped-qty-ctrl">
                    <button type="button" className="ped-qty-btn" onClick={() => updItem(i, { qtd: Math.max(1, Number(item.qtd) - 1) })}>−</button>
                    <span className="ped-qty-num">{item.qtd}</span>
                    <button type="button" className="ped-qty-btn" onClick={() => updItem(i, { qtd: Number(item.qtd) + 1 })}>+</button>
                  </div>
                </div>
                <div className="ped-item-field">
                  <span className="ped-item-lbl">Valor unit.</span>
                  <div className="ped-price-input">
                    <span>R$</span>
                    <input type="number" step="0.01" value={item.vUnit} onChange={e => updItem(i, { vUnit: Number(e.target.value) || 0 })} />
                  </div>
                </div>
                <div className="ped-item-total">
                  <span className="ped-item-lbl">Subtotal</span>
                  <span className="ped-item-sub">{fmtR$(Number(item.qtd) * Number(item.vUnit))}</span>
                </div>
              </div>
            </div>
          );
        })}
        <button className="ped-add-item" onClick={addItem}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
          Adicionar produto
        </button>
      </div>

      <div className="total-box">
        <span>Total do pedido</span>
        <strong>{fmtR$(total)}</strong>
      </div>

      <div className="form-grid">
        <Field label="Sinal pago"><input type="number" value={f.sinal} onChange={e => upd('sinal', e.target.value)} /></Field>
        <Field label="Data do pedido"><input type="date" value={f.data} onChange={e => upd('data', e.target.value)} /></Field>
      </div>

      <Field label="Prazo de entrega"><input type="date" value={f.prazo} onChange={e => upd('prazo', e.target.value)} /></Field>

      {Number(f.sinal) < total && total > 0 && (
        <div className="venc-wrap">
          <div className="venc-label">
            <span>💰</span>
            <span>Vencimento do pagamento restante</span>
          </div>
          <input
            type="date"
            className="venc-input"
            value={f.vencimento || ''}
            onChange={e => upd('vencimento', e.target.value)}
            placeholder="Deixe em branco se pago à vista"
          />
          {f.vencimento && (
            <button type="button" className="venc-clear" onClick={() => upd('vencimento', '')}>
              Remover data de vencimento
            </button>
          )}
        </div>
      )}

      <Field label="Status">
        <div className="status-picker">
          {Object.entries(ST).map(([k, v]) => (
            <button key={k} type="button"
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
    <AnimatePresence>
      {showNovaCli && (
        <MCli dados={{}} ctx={cliCtx} onClose={() => setShowNovaCli(false)} />
      )}
    </AnimatePresence>
    </>
  );
}
