import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MARCAS } from '../data/constants';
import { fmtR$ } from '../lib/helpers';
import type { AppCtx } from '../types';

type Props = { ctx: AppCtx };

export function Catalogo({ ctx }: Props) {
  const { prods, setProds, peds, setModal } = ctx;
  const [marcaAtiva, setMarcaAtiva] = useState('Todos');
  const [catAtiva, setCatAtiva] = useState('Todos');
  const [busca, setBusca] = useState('');

  const cats = ['Todos', ...Array.from(new Set(prods.map(p => p.cat)))];

  function vendidos(id: string) {
    return peds.reduce((sum, p) => {
      const item = (p.itens ?? []).find(x => x.prodId === id);
      return sum + (item?.qtd ?? 0);
    }, 0);
  }

  const filtered = prods
    .filter(p => marcaAtiva === 'Todos' || p.marca === marcaAtiva)
    .filter(p => catAtiva === 'Todos' || p.cat === catAtiva)
    .filter(p => !busca.trim() || p.nome.toLowerCase().includes(busca.toLowerCase()) || p.marca.toLowerCase().includes(busca.toLowerCase()))
    .slice()
    .sort((a, b) => vendidos(b.id) - vendidos(a.id));

  const updEstoque = (id: string, delta: number) =>
    setProds(ps => ps.map(p => p.id === id ? { ...p, estoque: Math.max(0, (p.estoque ?? 0) + delta) } : p));

  const toggleAtivo = (id: string) =>
    setProds(ps => ps.map(p => p.id === id ? { ...p, ativo: !p.ativo } : p));

  const excluir = (id: string, nome: string, qtdPedidos: number) => {
    const aviso = qtdPedidos > 0
      ? `"${nome}" já foi vendido em ${qtdPedidos} pedido(s). O histórico de pedidos é mantido, mas o produto será removido do catálogo permanentemente.\n\nDeseja excluir mesmo assim?`
      : `Excluir "${nome}" do catálogo permanentemente?`;
    if (confirm(aviso)) setProds(ps => ps.filter(p => p.id !== id));
  };

  const ativos = prods.filter(p => p.ativo).length;

  return (
    <div className="catalogo">
      <div className="cat-header">
        <div>
          <div className="card-eyebrow">Gestão de Produtos</div>
          <h2 className="topbar-title">Catálogo</h2>
        </div>
        <div className="cat-header-right">
          <div className="cat-stats">
            <span><b>{prods.length}</b> produtos</span>
            <span><b>{ativos}</b> ativos</span>
          </div>
          <motion.button
            className="btn-primary"
            onClick={() => setModal({ tipo: 'prod' })}
            whileHover={{ translateY: -2 }}
            whileTap={{ scale: 0.96 }}
          >
            + Produto
          </motion.button>
        </div>
      </div>

      <input
        className="cat-search"
        placeholder="Buscar produto ou marca..."
        value={busca}
        onChange={e => setBusca(e.target.value)}
      />

      <div className="cat-filter-row">
        <button className={`cat-pill${marcaAtiva === 'Todos' ? ' active' : ''}`} onClick={() => setMarcaAtiva('Todos')}>Todas</button>
        {MARCAS.map(m => (
          <button
            key={m.id}
            className={`cat-pill${marcaAtiva === m.id ? ' active' : ''}`}
            onClick={() => setMarcaAtiva(m.id)}
            style={marcaAtiva === m.id ? { background: m.bg, color: m.cor, borderColor: m.cor + '55' } : {}}
          >
            {m.icon} {m.nome}
          </button>
        ))}
      </div>

      <div className="cat-filter-row">
        {cats.map(cat => (
          <button
            key={cat}
            className={`cat-pill${catAtiva === cat ? ' active' : ''}`}
            onClick={() => setCatAtiva(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="cat-list">
        {filtered.length === 0 && (
          <div className="empty-state">
            <div className="empty-glyph">🌸</div>
            <p>Nenhum produto encontrado</p>
          </div>
        )}
        <AnimatePresence mode="popLayout">
          {filtered.map((p, i) => {
            const sold = vendidos(p.id);
            const est = p.estoque ?? 0;
            return (
              <motion.div
                key={p.id}
                className={`cat-row${!p.ativo ? ' cat-row-inativo' : ''}`}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -40 }}
                transition={{ delay: i * 0.025, duration: 0.22 }}
              >
                <div className="cat-row-thumb">
                  {p.fotoUrl
                    ? <img src={p.fotoUrl} alt={p.nome} />
                    : <span className="cat-row-emoji">{p.icon}</span>
                  }
                </div>

                <div className="cat-row-info">
                  <div className="cat-row-nome">
                    {p.nome}
                    {p.destaque && <span className="cat-row-star">★</span>}
                    {!p.ativo && <span className="cat-row-badge-off">inativo</span>}
                  </div>
                  <div className="cat-row-sub">
                    <span className="cat-row-marca">{p.marca}</span>
                    <span className="cat-row-cat">{p.cat}</span>
                    {sold > 0 && <span className="cat-row-sold">{sold} vendidos</span>}
                  </div>
                </div>

                <div className="cat-row-preco">{fmtR$(p.preco)}</div>

                <div className="cat-row-est">
                  <button className="cat-est-btn" onClick={() => updEstoque(p.id, -1)}>−</button>
                  <span className={`cat-est-num${est === 0 ? ' zero' : ''}`} title="Unidades em mãos">{est}</span>
                  <button className="cat-est-btn" onClick={() => updEstoque(p.id, 1)}>+</button>
                </div>

                <button
                  className={`cat-row-toggle${p.ativo ? ' on' : ''}`}
                  onClick={() => toggleAtivo(p.id)}
                  title={p.ativo ? 'Desativar produto' : 'Ativar produto'}
                >
                  {p.ativo ? 'Ativo' : 'Inativo'}
                </button>

                <button
                  className="btn-soft-sm cat-row-edit"
                  onClick={() => setModal({ tipo: 'prod', dados: p })}
                >
                  Editar
                </button>

                <button
                  className="cat-row-del"
                  onClick={() => excluir(p.id, p.nome, sold)}
                  title="Excluir produto do catálogo"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
                  </svg>
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
