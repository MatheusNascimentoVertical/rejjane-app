import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MARCAS, getMarca } from '../data/constants';
import { fmtR$ } from '../lib/helpers';
import type { AppCtx } from '../types';

type Props = { ctx: AppCtx };

export function Catalogo({ ctx }: Props) {
  const { prods, peds, setModal } = ctx;
  const [marcaAtiva, setMarcaAtiva] = useState('Todos');
  const [catAtiva, setCatAtiva] = useState('Todos');

  const cats = ['Todos', ...Array.from(new Set(prods.map(p => p.cat)))];

  const filtered = prods
    .filter(p => marcaAtiva === 'Todos' || p.marca === marcaAtiva)
    .filter(p => catAtiva === 'Todos' || p.cat === catAtiva)
    .slice()
    .sort((a, b) => vendidos(b.id) - vendidos(a.id));

  const totalMarcas = new Set(prods.map(p => p.marca)).size;
  const totalCats = new Set(prods.map(p => p.cat)).size;

  function vendidos(id: string) {
    return peds.reduce((sum, p) => {
      const item = (p.itens ?? []).find(x => x.prodId === id);
      return sum + (item?.qtd ?? 0);
    }, 0);
  }

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
            <span className="cat-v2-stat-val">{totalMarcas}</span>
            <span className="cat-v2-stat-lbl">Marcas</span>
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

      <div className="cat-filter-section">
        <div className="cat-filter-label">Marca</div>
        <div className="cat-filter-row">
          <button
            className={`cat-pill${marcaAtiva === 'Todos' ? ' active' : ''}`}
            onClick={() => setMarcaAtiva('Todos')}
          >
            Todas
          </button>
          {MARCAS.map(m => (
            <button
              key={m.id}
              className={`cat-pill cat-pill-marca${marcaAtiva === m.id ? ' active' : ''}`}
              onClick={() => setMarcaAtiva(m.id)}
              style={marcaAtiva === m.id ? { background: m.bg, color: m.cor, borderColor: m.cor + '55' } : {}}
            >
              {m.icon} {m.nome}
            </button>
          ))}
        </div>
      </div>

      <div className="cat-filter-section">
        <div className="cat-filter-label">Categoria</div>
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
      </div>

      <div className="cat-grid-v2">
        <AnimatePresence mode="popLayout">
          {filtered.map((p, i) => {
            const sold = vendidos(p.id);
            const est  = estoqueLabel(p.estoque ?? 0);
            const marca = getMarca(p.marca);
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
                  {marca && (
                    <div className="cat-marca-badge" style={{ color: marca.cor, background: marca.bg }}>
                      {marca.icon} {marca.nome}
                    </div>
                  )}
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
