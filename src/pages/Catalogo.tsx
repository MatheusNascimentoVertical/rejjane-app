import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { fmtR$ } from '../lib/helpers';
import type { AppCtx } from '../types';

type Props = { ctx: AppCtx };

export function Catalogo({ ctx }: Props) {
  const { prods, peds, setModal } = ctx;
  const [catAtiva, setCatAtiva] = useState('Todos');

  const cats = ['Todos', ...Array.from(new Set(prods.map(p => p.cat)))];
  const filtered = (catAtiva === 'Todos' ? prods : prods.filter(p => p.cat === catAtiva))
    .slice()
    .sort((a, b) => vendidos(b.id) - vendidos(a.id));

  const totalEstoque = prods.reduce((a, b) => a + (b.estoque || 0), 0);
  const totalCats = new Set(prods.map(p => p.cat)).size;

  const vendidos = (id: string) =>
    peds.reduce((sum, p) => {
      const item = (p.itens ?? []).find(x => x.prodId === id);
      return sum + (item?.qtd ?? 0);
    }, 0);

  const estoqueLabel = (est: number) => {
    if (est === 0) return { label: 'ESGOTADO', cls: 'red' };
    if (est <= 5)  return { label: `${est} un`, cls: 'yellow' };
    return { label: `${est} un`, cls: 'green' };
  };

  return (
    <div className="catalogo cat-v2">
      <div className="cat-v2-header">
        <div>
          <div className="card-eyebrow">Gestão de Produtos</div>
          <h2 className="topbar-title">Catálogo</h2>
        </div>
        <div className="cat-v2-stats">
          <div className="cat-v2-stat">
            <span className="cat-v2-stat-val">{prods.length}</span>
            <span className="cat-v2-stat-lbl">Produtos</span>
          </div>
          <div className="cat-v2-stat">
            <span className="cat-v2-stat-val">{totalEstoque}</span>
            <span className="cat-v2-stat-lbl">Em estoque</span>
          </div>
          <div className="cat-v2-stat">
            <span className="cat-v2-stat-val">{totalCats}</span>
            <span className="cat-v2-stat-lbl">Categorias</span>
          </div>
          <motion.button
            className="btn-primary cat-fab"
            onClick={() => setModal({ tipo: 'prod' })}
            whileHover={{ translateY: -2 }}
            whileTap={{ scale: 0.96 }}
          >
            + Produto
          </motion.button>
        </div>
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

      <div className="cat-grid-v2">
        <AnimatePresence mode="popLayout">
          {filtered.map((p, i) => {
            const sold = vendidos(p.id);
            const est  = estoqueLabel(p.estoque ?? 0);
            return (
              <motion.div
                key={p.id}
                className="cat-card-v2"
                layout
                initial={{ opacity: 0, y: 20, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.92 }}
                transition={{ delay: i * 0.04, type: 'spring', stiffness: 320, damping: 26 }}
              >
                <div className="cat-photo">
                  <div className="cat-photo-inner">
                    {p.fotoUrl
                      ? <img src={p.fotoUrl} alt={p.nome} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <div className="cat-photo-emoji">{p.icon}</div>
                    }
                    {p.destaque && <div className="cat-destaque-badge">DESTAQUE</div>}
                    <div className={`cat-stock-badge ${est.cls}`}>{est.label}</div>
                    {!p.ativo && <div className="cat-inativo-overlay">INATIVO</div>}
                  </div>
                </div>
                <div className="cat-card-body">
                  <div className="cat-cat-chip">{p.cat}</div>
                  <div className="cat-card-name">{p.nome}</div>
                  <div className="cat-price-row">
                    <span className="cat-price">{fmtR$(p.preco)}</span>
                    {p.precoDe && <span className="cat-price-de">{fmtR$(p.precoDe)}</span>}
                  </div>
                  <div className="cat-sold">{sold} vendidos</div>
                </div>
                <div className="cat-card-actions">
                  <button
                    className="btn-soft-sm"
                    onClick={() => setModal({ tipo: 'prod', dados: p })}
                  >
                    Editar
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
