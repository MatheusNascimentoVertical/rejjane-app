import type { AppCtx } from '../types';
import type { Aba } from '../App';

const titulos: Record<string, string> = {
  dash: 'Início', pedidos: 'Pedidos', clientes: 'Clientes',
  catalogo: 'Catálogo', caixa: 'Caixa & Finanças', config: 'Ajustes',
};

type Props = { aba: Aba; ctx: AppCtx };

export function Topbar({ aba, ctx }: Props) {
  return (
    <div className="topbar">
      <div className="topbar-l">
        <div className="topbar-eyebrow">Rejjanevendas</div>
        <h1 className="topbar-title">{titulos[aba]}</h1>
      </div>
      <div className="topbar-r">
        <div className="topbar-search">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#b89a8e" strokeWidth="2">
            <circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>
          </svg>
          <input
            placeholder="Buscar cliente, pedido…"
            value={ctx.search}
            onChange={e => ctx.setSearch(e.target.value)}
          />
        </div>
        <button className="btn-primary" onClick={() => ctx.setModal({ tipo: 'ped' })}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
            <path d="M12 5v14M5 12h14"/>
          </svg>
          Novo pedido
        </button>
      </div>
    </div>
  );
}
