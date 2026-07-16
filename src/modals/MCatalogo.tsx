import { useState, useRef } from 'react';
import { uploadFoto } from '../lib/cloudinary';
import { Sheet, Field } from './Sheet';
import { MARCAS } from '../data/constants';
import type { AppCtx, Produto, KitItem } from '../types';

type Props = { dados?: Partial<Produto>; ctx: AppCtx; onClose: () => void };

const CATS_DEFAULT = ['Beleza', 'Casa', 'Cuidado', 'Conforto'];

const norm = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

export function MCatalogo({ dados, ctx, onClose }: Props) {
  const { prods, setProds } = ctx;
  const isEdit = Boolean(dados?.id);

  const existCats = Array.from(new Set([...CATS_DEFAULT, ...prods.map(p => p.cat)]));

  const [nome,       setNome]       = useState(dados?.nome      ?? '');
  const [marca,      setMarca]      = useState(dados?.marca     ?? MARCAS[0].id);
  const [cat,        setCat]        = useState(dados?.cat       ?? existCats[0]);
  const [catCustom,  setCatCustom]  = useState('');
  const [preco,      setPreco]      = useState(String(dados?.preco   ?? ''));
  const [precoDe,    setPrecoDe]    = useState(String(dados?.precoDe ?? ''));
  const [estoque,    setEstoque]    = useState(String(dados?.estoque ?? '0'));
  const [desc,       setDesc]       = useState(dados?.descricao  ?? '');
  const [icon,       setIcon]       = useState(dados?.icon       ?? '🎁');
  const [destaque,   setDestaque]   = useState(dados?.destaque   ?? false);
  const [ativo,      setAtivo]      = useState(dados?.ativo      ?? true);
  const [fotoUrl,    setFotoUrl]    = useState(dados?.fotoUrl    ?? '');
  const [fotoFile,   setFotoFile]   = useState<File | null>(null);
  const [fotoPreview,setFotoPreview]= useState(dados?.fotoUrl    ?? '');
  const [saving,     setSaving]     = useState(false);
  const [uploadando, setUploadando] = useState(false);
  const [erro,       setErro]       = useState('');
  const [confirmDel, setConfirmDel] = useState(false);

  // Kit
  const [isKit,        setIsKit]      = useState(Boolean(dados?.componentes?.length));
  const [componentes,  setComponentes]= useState<KitItem[]>(dados?.componentes ?? []);
  const [compSel,      setCompSel]    = useState('');
  const [compQtd,      setCompQtd]    = useState('1');

  const fileRef = useRef<HTMLInputElement>(null);
  const catFinal = cat === '__custom__' ? catCustom : cat;

  const handleFoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFotoFile(f);
    setFotoPreview(URL.createObjectURL(f));
  };

  const addComp = () => {
    if (!compSel) return;
    const qtd = Math.max(1, parseInt(compQtd) || 1);
    setComponentes(cs => {
      const idx = cs.findIndex(c => c.prodId === compSel);
      if (idx >= 0) {
        const next = [...cs];
        next[idx] = { ...next[idx], qtd: next[idx].qtd + qtd };
        return next;
      }
      return [...cs, { prodId: compSel, qtd }];
    });
    setCompSel('');
    setCompQtd('1');
  };

  const removeComp = (prodId: string) =>
    setComponentes(cs => cs.filter(c => c.prodId !== prodId));

  const updateCompQtd = (prodId: string, qtd: number) =>
    setComponentes(cs => cs.map(c => c.prodId === prodId ? { ...c, qtd: Math.max(1, qtd) } : c));

  const salvar = async () => {
    if (!nome.trim()) { setErro('Informe o nome do produto.'); return; }
    if (isKit && componentes.length === 0) { setErro('Adicione ao menos um produto ao kit.'); return; }
    setSaving(true); setErro('');
    try {
      const id = dados?.id || `prod_${Date.now()}`;
      let finalFotoUrl = fotoUrl;

      if (fotoFile) {
        setUploadando(true);
        try {
          finalFotoUrl = await uploadFoto(fotoFile);
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          if (msg.includes('VITE_CLOUDINARY'))
            setErro('Configuração de imagem ausente. Salve sem foto por enquanto e contate o suporte.');
          else if (msg.includes('400') || msg.includes('401'))
            setErro('Preset de upload inválido no Cloudinary. Verifique as configurações.');
          else
            setErro(`Foto não enviada: ${msg}. Verifique sua conexão ou salve sem foto.`);
          setSaving(false); setUploadando(false);
          return;
        } finally { setUploadando(false); }
      }

      const prod: Produto = {
        id,
        nome: nome.trim(),
        marca,
        cat: catFinal,
        icon,
        preco: parseFloat(preco) || 0,
        ...(precoDe ? { precoDe: parseFloat(precoDe) } : {}),
        descricao: desc,
        estoque: parseInt(estoque) || 0,
        ...(finalFotoUrl ? { fotoUrl: finalFotoUrl } : {}),
        ativo,
        destaque,
        ...(isKit && componentes.length ? { componentes } : {}),
      };

      if (isEdit) {
        setProds(ps => ps.map(p => p.id === id ? prod : p));
      } else {
        setProds(ps => [prod, ...ps]);
      }
      onClose();
    } catch (e) {
      setErro(`Erro ao salvar: ${e instanceof Error ? e.message : 'tente novamente.'}`);
    } finally {
      setSaving(false); setUploadando(false);
    }
  };

  const deletar = () => {
    if (!dados?.id) return;
    setProds(ps => ps.filter(p => p.id !== dados.id));
    onClose();
  };

  // Produtos disponíveis para adicionar ao kit (exclui o próprio produto e kits)
  const prodsDisponiveis = prods.filter(p =>
    p.id !== dados?.id &&
    !p.componentes?.length &&
    !componentes.find(c => c.prodId === p.id)
  );

  return (
    <Sheet title={isEdit ? 'Editar produto' : 'Novo produto'} subtitle="Catálogo" onClose={onClose} wide>
      <div
        className={`foto-upload${uploadando ? ' foto-upload-loading' : ''}`}
        onClick={() => !uploadando && fileRef.current?.click()}
      >
        {fotoPreview
          ? <img src={fotoPreview} alt="foto" className="foto-preview" />
          : (
            <div className="foto-placeholder">
              <div style={{ fontSize: 40 }}>{icon}</div>
              <div>Clique para adicionar foto</div>
            </div>
          )
        }
        {uploadando && (
          <div className="foto-upload-overlay">
            <div className="foto-upload-spinner" />
            <span>Enviando foto…</span>
          </div>
        )}
        <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFoto} />
      </div>

      <div className="form-grid">
        <Field label="Nome">
          <input value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: Kit Coffee Woman Duo" />
        </Field>
        <Field label="Marca">
          <select value={marca} onChange={e => setMarca(e.target.value)}>
            {MARCAS.map(m => <option key={m.id} value={m.id}>{m.icon} {m.nome}</option>)}
          </select>
        </Field>
      </div>

      <Field label="Categoria">
        <select value={cat} onChange={e => setCat(e.target.value)}>
          {existCats.map(c => <option key={c} value={c}>{c}</option>)}
          <option value="__custom__">+ Nova categoria</option>
        </select>
        {cat === '__custom__' && (
          <input
            value={catCustom}
            onChange={e => setCatCustom(e.target.value)}
            placeholder="Nome da nova categoria"
            style={{ marginTop: 6 }}
          />
        )}
      </Field>

      <div className="form-grid form-grid-3">
        <Field label="Preço (R$)">
          <input type="number" value={preco} onChange={e => setPreco(e.target.value)} placeholder="0,00" step="0.01" />
        </Field>
        <Field label="Preço original (opcional)">
          <input type="number" value={precoDe} onChange={e => setPrecoDe(e.target.value)} placeholder="0,00" step="0.01" />
        </Field>
        <Field label="Estoque">
          <input type="number" value={estoque} onChange={e => setEstoque(e.target.value)} placeholder="0" min="0" />
        </Field>
      </div>

      <Field label="Ícone (emoji)">
        <input value={icon} onChange={e => setIcon(e.target.value)} placeholder="🎁" maxLength={4} style={{ maxWidth: 80 }} />
      </Field>

      <Field label="Descrição">
        <textarea rows={3} value={desc} onChange={e => setDesc(e.target.value)} placeholder="Breve descrição do produto..." />
      </Field>

      <div className="toggle-row">
        <div className="toggle-switch" onClick={() => setDestaque(s => !s)}>
          <div className={`toggle-track${destaque ? ' on' : ''}`}>
            <div className="toggle-thumb" />
          </div>
          <span>Destaque</span>
        </div>
        <div className="toggle-switch" onClick={() => setAtivo(s => !s)}>
          <div className={`toggle-track${ativo ? ' on' : ''}`}>
            <div className="toggle-thumb" />
          </div>
          <span>Ativo</span>
        </div>
        <div className="toggle-switch" onClick={() => { setIsKit(s => !s); if (isKit) setComponentes([]); }}>
          <div className={`toggle-track${isKit ? ' on' : ''}`}>
            <div className="toggle-thumb" />
          </div>
          <span>É um kit</span>
        </div>
      </div>

      {/* Editor de componentes do kit */}
      {isKit && (
        <div className="cat-comp-editor">
          <div className="cat-comp-title">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/></svg>
            Produtos do kit
          </div>

          {componentes.length > 0 && (
            <div className="cat-comp-list">
              {componentes.map(comp => {
                const cp = prods.find(x => x.id === comp.prodId);
                return (
                  <div key={comp.prodId} className="cat-comp-row">
                    <div className="cat-comp-thumb">
                      {cp?.fotoUrl ? <img src={cp.fotoUrl} alt={cp.nome} /> : <span>{cp?.icon ?? '📦'}</span>}
                    </div>
                    <div className="cat-comp-nome">
                      <span>{cp?.nome ?? comp.prodId}</span>
                      <span className="cat-comp-marca">{cp?.marca}</span>
                    </div>
                    <div className="cat-comp-qtd-wrap">
                      <button className="cat-est-btn" onClick={() => updateCompQtd(comp.prodId, comp.qtd - 1)}>−</button>
                      <span className="cat-comp-qtd">{comp.qtd}x</span>
                      <button className="cat-est-btn" onClick={() => updateCompQtd(comp.prodId, comp.qtd + 1)}>+</button>
                    </div>
                    <button className="cat-comp-del" onClick={() => removeComp(comp.prodId)} title="Remover">×</button>
                  </div>
                );
              })}
            </div>
          )}

          <div className="cat-comp-add-row">
            <select
              className="cat-comp-sel"
              value={compSel}
              onChange={e => setCompSel(e.target.value)}
            >
              <option value="">Selecionar produto…</option>
              {prodsDisponiveis
                .sort((a, b) => norm(a.nome).localeCompare(norm(b.nome)))
                .map(p => (
                  <option key={p.id} value={p.id}>{p.nome} — {p.marca}</option>
                ))
              }
            </select>
            <input
              type="number" min="1" value={compQtd}
              onChange={e => setCompQtd(e.target.value)}
              className="cat-comp-qtd-input"
              placeholder="Qtd"
            />
            <button className="btn-soft-sm cat-comp-add-btn" onClick={addComp} disabled={!compSel}>
              + Add
            </button>
          </div>
        </div>
      )}

      {erro && (
        <div style={{ fontSize: 12, color: '#b85050', background: 'rgba(217,64,64,0.07)', border: '1px solid rgba(217,64,64,0.2)', borderRadius: 10, padding: '8px 12px', marginTop: 12 }}>
          {erro}
        </div>
      )}

      <div className="sheet-actions">
        {isEdit && !confirmDel && (
          <button className="btn-danger-sm" onClick={() => setConfirmDel(true)}>Excluir</button>
        )}
        {isEdit && confirmDel && (
          <>
            <span style={{ fontSize: 12, color: '#b85050', fontWeight: 700 }}>Confirmar exclusão?</span>
            <button className="btn-danger-sm" onClick={deletar}>Sim, excluir</button>
            <button className="btn-soft-sm" onClick={() => setConfirmDel(false)}>Não</button>
          </>
        )}
        <button className="btn-soft" onClick={onClose}>Cancelar</button>
        <button className="btn-primary" onClick={salvar} disabled={saving || uploadando}>
          {uploadando ? 'Enviando foto…' : saving ? 'Salvando…' : 'Salvar produto'}
        </button>
      </div>
    </Sheet>
  );
}
