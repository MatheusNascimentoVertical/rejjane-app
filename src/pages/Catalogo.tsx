import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MARCAS } from '../data/constants';
import { fmtR$ } from '../lib/helpers';
import { gerarImagemStatus } from '../lib/statusImage';
import type { AppCtx, Produto } from '../types';

type Props = { ctx: AppCtx };
type Ordem = 'vendidos' | 'az' | 'za' | 'preco_asc' | 'preco_desc' | 'est_desc' | 'est_asc' | 'marca' | 'cat';

// Normaliza texto: minúsculo + sem acentos
const norm = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

export function Catalogo({ ctx }: Props) {
  const { prods, setProds, peds, setModal, cfg } = ctx;
  const [compartilhando, setCompartilhando] = useState<string | null>(null);
  const [marcaAtiva, setMarcaAtiva] = useState('Todos');
  const [catAtiva,   setCatAtiva]   = useState('Todos');
  const [busca,      setBusca]      = useState('');
  const [ordem,      setOrdem]      = useState<Ordem>('az');
  const [page,       setPage]       = useState(1);
  const PAGE_SIZE = 12;

  // Resetar página quando qualquer filtro muda
  useEffect(() => { setPage(1); }, [marcaAtiva, catAtiva, busca, ordem]);

  // Categorias apenas dos produtos da marca selecionada (evita pills inúteis)
  const prodsDaMarca = prods.filter(p =>
    marcaAtiva === 'Todos' || norm(p.marca) === norm(marcaAtiva)
  );
  const catsSeen = new Set<string>();
  const cats = ['Todos', ...prodsDaMarca.map(p => p.cat).filter(c => {
    const n = norm(c);
    if (catsSeen.has(n)) return false;
    catsSeen.add(n);
    return true;
  })];

  // Resetar catAtiva se a categoria sumiu depois de trocar a marca
  useEffect(() => {
    if (catAtiva !== 'Todos' && !cats.includes(catAtiva) &&
        !cats.some(c => norm(c) === norm(catAtiva))) {
      setCatAtiva('Todos');
    }
  }, [marcaAtiva]); // eslint-disable-line react-hooks/exhaustive-deps

  function vendidos(id: string) {
    return peds.reduce((sum, p) => {
      const item = (p.itens ?? []).find(x => x.prodId === id);
      return sum + (item?.qtd ?? 0);
    }, 0);
  }

  const buscaNorm = norm(busca.trim());

  const filtered = prods
    .filter(p => marcaAtiva === 'Todos' || norm(p.marca) === norm(marcaAtiva))
    .filter(p => catAtiva === 'Todos'   || norm(p.cat)   === norm(catAtiva))
    .filter(p => !buscaNorm ||
      norm(p.nome).includes(buscaNorm) ||
      norm(p.marca).includes(buscaNorm) ||
      norm(p.cat).includes(buscaNorm)
    )
    .slice()
    .sort((a, b) => {
      switch (ordem) {
        case 'az':        return norm(a.nome).localeCompare(norm(b.nome));
        case 'za':        return norm(b.nome).localeCompare(norm(a.nome));
        case 'preco_asc': return a.preco - b.preco;
        case 'preco_desc':return b.preco - a.preco;
        case 'est_desc':  return (b.estoque ?? 0) - (a.estoque ?? 0);
        case 'est_asc':   return (a.estoque ?? 0) - (b.estoque ?? 0);
        case 'marca':     return norm(a.marca).localeCompare(norm(b.marca)) || norm(a.nome).localeCompare(norm(b.nome));
        case 'cat':       return norm(a.cat).localeCompare(norm(b.cat))     || norm(a.nome).localeCompare(norm(b.nome));
        default:          return vendidos(b.id) - vendidos(a.id); // 'vendidos'
      }
    });

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
        a.href = url; a.download = file.name; a.click();
        URL.revokeObjectURL(url);
      }
      setProds(ps => ps.map(x => x.id === p.id ? { ...x, ultimoStatus: Date.now() } : x));
    } catch { /* cancelado */ } finally { setCompartilhando(null); }
  };

  const ativos  = prods.filter(p => p.ativo).length;
  const visible = filtered.slice(0, page * PAGE_SIZE);
  const hasMore = filtered.length > page * PAGE_SIZE;

  const ORDEM_OPTS: { value: Ordem; label: string }[] = [
    { value: 'az',        label: 'Nome A → Z' },
    { value: 'za',        label: 'Nome Z → A' },
    { value: 'vendidos',  label: 'Mais vendidos' },
    { value: 'preco_asc', label: 'Menor preço' },
    { value: 'preco_desc',label: 'Maior preço' },
    { value: 'est_desc',  label: 'Maior estoque' },
    { value: 'est_asc',   label: 'Menor estoque' },
    { value: 'marca',     label: 'Por marca' },
    { value: 'cat',       label: 'Por categoria' },
  ];

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

      {/* Busca + ordenação */}
      <div className="cat-search-row">
        <input
          className="cat-search"
          placeholder="Buscar por nome, marca ou categoria…"
          value={busca}
          onChange={e => setBusca(e.target.value)}
        />
        <select className="cat-sort-sel" value={ordem} onChange={e => setOrdem(e.target.value as Ordem)}>
          {ORDEM_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {/* Filtro por marca */}
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

      {/* Filtro por categoria — só mostra cats da marca ativa */}
      {cats.length > 1 && (
        <div className="cat-filter-row">
          {cats.map(cat => (
            <button
              key={cat}
              className={`cat-pill${catAtiva === cat || (catAtiva !== 'Todos' && norm(cat) === norm(catAtiva)) ? ' active' : ''}`}
              onClick={() => setCatAtiva(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

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
            const est  = p.estoque ?? 0;
            const isKit = Boolean(p.componentes?.length);
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
                    {isKit   && <span className="cat-kit-tag">KIT</span>}
                    {p.destaque && <span className="cat-row-star">★</span>}
                    {!p.ativo   && <span className="cat-row-badge-off">inativo</span>}
                  </div>
                  <div className="cat-row-sub">
                    <span className="cat-row-marca">{p.marca}</span>
                    <span className="cat-row-cat">{p.cat}</span>
                    {sold > 0 && <span className="cat-row-sold">{sold} vendidos</span>}
                  </div>
                  {isKit && (
                    <div className="cat-kit-itens">
                      {p.componentes!.map(c => {
                        const cp = ctx.prods.find(x => x.id === c.prodId);
                        return cp ? `${cp.nome} (${c.qtd}x)` : null;
                      }).filter(Boolean).join(' + ')}
                    </div>
                  )}
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
