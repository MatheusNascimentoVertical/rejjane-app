import { useState } from 'react';
import { motion } from 'framer-motion';
import { fmtR$ } from '../lib/helpers';
import { gerarImagemStatus } from '../lib/statusImage';
import type { AppCtx, Produto } from '../types';

type Props = { ctx: AppCtx };

function tempoDesde(ts: number): string {
  const diff = Date.now() - ts;
  const min = Math.floor(diff / 60000);
  if (min < 60) return min <= 1 ? 'Agora há pouco' : `${min} min atrás`;
  const h = Math.floor(diff / 3600000);
  if (h < 24) return h === 1 ? '1 hora atrás' : `${h} horas atrás`;
  const dias = Math.floor(diff / 86400000);
  if (dias === 1) return 'Ontem';
  if (dias < 7) return `${dias} dias atrás`;
  if (dias < 30) return `${Math.floor(dias / 7)} sem. atrás`;
  return `${Math.floor(dias / 30)} mês atrás`;
}

export function Postagens({ ctx }: Props) {
  const { prods, setProds, cfg } = ctx;
  const [compartilhando, setCompartilhando] = useState<string | null>(null);
  const [modoEstoque, setModoEstoque] = useState(false);
  const [edits, setEdits] = useState<Record<string, string>>({});

  const salvarEstoques = () => {
    setProds(ps => ps.map(p => {
      const v = edits[p.id];
      if (v === undefined || v === '') return p;
      const n = parseInt(v, 10);
      return isNaN(n) ? p : { ...p, estoque: Math.max(0, n) };
    }));
    setEdits({});
    setModoEstoque(false);
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
        const a = document.createElement('a'); a.href = url; a.download = file.name; a.click();
        URL.revokeObjectURL(url);
      }
      setProds(ps => ps.map(x => x.id === p.id ? { ...x, ultimoStatus: Date.now() } : x));
    } catch { /* cancelled */ } finally { setCompartilhando(null); }
  };

  const sorted = [...prods].sort((a, b) => {
    if (!a.ultimoStatus && !b.ultimoStatus) return 0;
    if (!a.ultimoStatus) return 1;
    if (!b.ultimoStatus) return -1;
    return b.ultimoStatus - a.ultimoStatus;
  });

  const postados   = sorted.filter(p => p.ultimoStatus);
  const aguardando = sorted.filter(p => !p.ultimoStatus);
  const semana     = postados.filter(p => Date.now() - p.ultimoStatus! < 7 * 86400000).length;

  // ── MODO ESTOQUE ──────────────────────────────────────────────────────────
  if (modoEstoque) {
    return (
      <div className="postagens">
        <div className="cat-header">
          <div>
            <div className="card-eyebrow">Atualização em lote</div>
            <h2 className="topbar-title">Estoque</h2>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn-soft" onClick={() => { setEdits({}); setModoEstoque(false); }}>
              Cancelar
            </button>
            <motion.button className="btn-primary" whileTap={{ scale: 0.96 }} onClick={salvarEstoques}>
              Salvar tudo
            </motion.button>
          </div>
        </div>
        <p className="post-hint">Digite as quantidades em mãos e toque em "Salvar tudo".</p>
        <div className="post-bulk-list">
          {prods.map((p, i) => {
            const cur = edits[p.id] !== undefined ? edits[p.id] : String(p.estoque ?? 0);
            const num = parseInt(cur, 10) || 0;
            return (
              <motion.div
                key={p.id}
                className="post-bulk-row"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.018 }}
              >
                <div className="post-bulk-thumb">
                  {p.fotoUrl ? <img src={p.fotoUrl} alt={p.nome} /> : <span>{p.icon}</span>}
                </div>
                <div className="post-bulk-nome">
                  <span className="post-bulk-nome-txt">{p.nome}</span>
                  <span className="cat-row-marca">{p.marca}</span>
                </div>
                <div className="post-bulk-ctrl">
                  <button className="cat-est-btn" onClick={() =>
                    setEdits(e => ({ ...e, [p.id]: String(Math.max(0, num - 1)) }))}>−</button>
                  <input
                    className="post-bulk-input"
                    type="number" min="0"
                    value={cur}
                    onChange={e => setEdits(ev => ({ ...ev, [p.id]: e.target.value }))}
                  />
                  <button className="cat-est-btn" onClick={() =>
                    setEdits(e => ({ ...e, [p.id]: String(num + 1) }))}>+</button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    );
  }

  // ── VISÃO NORMAL ──────────────────────────────────────────────────────────
  return (
    <div className="postagens">
      <div className="cat-header">
        <div>
          <div className="card-eyebrow">WhatsApp Status</div>
          <h2 className="topbar-title">Postagens</h2>
        </div>
        <motion.button
          className="btn-soft post-est-btn"
          whileTap={{ scale: 0.95 }}
          onClick={() => setModoEstoque(true)}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 7H4a2 2 0 00-2 2v9a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z"/>
            <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/>
            <line x1="12" y1="12" x2="12" y2="16"/>
            <line x1="10" y1="14" x2="14" y2="14"/>
          </svg>
          Atualizar estoque
        </motion.button>
      </div>

      <div className="post-summary">
        <div className="post-chip">
          <span className="post-chip-num">{postados.length}</span>
          <span className="post-chip-lbl">postados</span>
        </div>
        <div className="post-chip">
          <span className="post-chip-num post-chip-num-warn">{aguardando.length}</span>
          <span className="post-chip-lbl">aguardando</span>
        </div>
        <div className="post-chip">
          <span className="post-chip-num post-chip-num-ok">{semana}</span>
          <span className="post-chip-lbl">esta semana</span>
        </div>
      </div>

      {postados.length === 0 && aguardando.length === 0 && (
        <div className="empty-state">
          <div className="empty-glyph">📣</div>
          <p>Nenhum produto cadastrado ainda</p>
        </div>
      )}

      {postados.length > 0 && (
        <>
          <div className="post-section-title">Postados recentemente</div>
          {postados.map((p, i) => (
            <PostRow key={p.id} p={p} i={i} compartilhando={compartilhando} onPost={postarStatus} />
          ))}
        </>
      )}

      {aguardando.length > 0 && (
        <>
          <div className="post-section-title" style={{ marginTop: postados.length ? 28 : 0 }}>
            Aguardando postagem
            <span className="post-badge-pending">{aguardando.length}</span>
          </div>
          {aguardando.map((p, i) => (
            <PostRow key={p.id} p={p} i={i} compartilhando={compartilhando} onPost={postarStatus} />
          ))}
        </>
      )}
    </div>
  );
}

function PostRow({ p, i, compartilhando, onPost }: {
  p: Produto; i: number;
  compartilhando: string | null;
  onPost: (p: Produto) => void;
}) {
  const isLoading = compartilhando === p.id;
  return (
    <motion.div
      className="post-row"
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.02, duration: 0.2 }}
    >
      <div className="post-row-thumb">
        {p.fotoUrl ? <img src={p.fotoUrl} alt={p.nome} /> : <span className="post-row-emoji">{p.icon}</span>}
      </div>

      <div className="post-row-info">
        <div className="post-row-nome">{p.nome}</div>
        <div className="post-row-sub">
          <span className="cat-row-marca">{p.marca}</span>
          <span className="cat-row-cat">{p.cat}</span>
        </div>
        {p.ultimoStatus ? (
          <div className="post-row-date">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
            {tempoDesde(p.ultimoStatus)}
          </div>
        ) : (
          <div className="post-row-date never">Nunca postado</div>
        )}
      </div>

      <div className="post-row-right">
        <div className="post-row-price">{fmtR$(p.preco)}</div>
        <motion.button
          className={`cat-row-share post-share-btn${isLoading ? ' loading' : ''}`}
          onClick={() => onPost(p)}
          disabled={isLoading}
          whileTap={{ scale: 0.92 }}
          title="Postar no WhatsApp Status"
        >
          {isLoading ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
          )}
          Postar
        </motion.button>
      </div>
    </motion.div>
  );
}
