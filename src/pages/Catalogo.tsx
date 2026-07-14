import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MARCAS } from '../data/constants';
import { fmtR$ } from '../lib/helpers';
import { gerarImagemStatus } from '../lib/statusImage';
import type { AppCtx, Produto } from '../types';

type Props = { ctx: AppCtx };

export function Catalogo({ ctx }: Props) {
  const { prods, setProds, peds, setModal, cfg } = ctx;
  const [compartilhando, setCompartilhando] = useState<string | null>(null);
  const [marcaAtiva, setMarcaAtiva] = useState('Todos');
  const [catAtiva, setCatAtiva] = useState('Todos');
  const [busca, setBusca] = useState('');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 12;

  useEffect(() => { setPage(1); }, [marcaAtiva, catAtiva, busca]);

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
  const visible = filtered.slice(0, page * PAGE_SIZE);
  const hasMore = filtered.length > page * PAGE_SIZE;

  const postarStatus = async (p: Produto) => {
    setCompartilhando(p.id);
    try {
      const blob = await gerarImagemStatus(p, cfg);
      const file = new File([blob], `${p.nome.replace(/\s+/g, '_')}.jpg`, { type: 'image/jpeg' });
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: p.nome });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.name;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch {
      // user cancelled or error — silently ignore
    } finally {
      setCompartilhando(null);
    }
  };

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
        <button
          className={`cat-pill${marcaAtiva === 'Todos' ? ' active' : ''}`}
          onClick={() => { setMarcaAtiva('Todos'); setCatAtiva('Todos'); }}
        >
          Todas
        </button>
        {MARCAS.map(m => (
          <button
            key={m.id}
            className={`cat-pill${marcaAtiva === m.id ? ' active' : ''}`}
            onClick={() => { setMarcaAtiva(m.id); setCatAtiva('Todos'); }}
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

      {(marcaAtiva !== 'Todos' || catAtiva !== 'Todos' || busca) && (
        <div className="cat-result-count">
          {filtered.length === 0
            ? 'Nenhum produto encontrado'
            : `${filtered.length} produto${filtered.length > 1 ? 's' : ''} encontrado${filtered.length > 1 ? 's' : ''}`
          }
          <button className="cat-clear-btn" onClick={() => { setMarcaAtiva('Todos'); setCatAtiva('Todos'); setBusca(''); }}>
            Limpar filtros ×
          </button>
        </div>
      )}

      <div className="cat-list">
        {filtered.length === 0 && (
          <div className="empty-state">
            <div className="empty-glyph">🌸</div>
            <p>Nenhum produto encontrado</p>
          </div>
        )}
        <AnimatePresence mode="popLayout">
          {visible.map((p, i) => {
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

                <div className="cat-row-actions">
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
                    className={`cat-row-share${compartilhando === p.id ? ' loading' : ''}`}
                    onClick={() => postarStatus(p)}
                    title="Gerar imagem para Status do WhatsApp"
                    disabled={compartilhando === p.id}
                  >
                    {compartilhando === p.id
                      ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                      : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
                    }
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
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {hasMore && (
        <button className="cat-load-more" onClick={() => setPage(p => p + 1)}>
          Ver mais {filtered.length - page * PAGE_SIZE} produto{filtered.length - page * PAGE_SIZE > 1 ? 's' : ''}
        </button>
      )}
    </div>
  );
}
