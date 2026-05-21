import { useState, useRef } from 'react';
import { uploadFoto } from '../lib/cloudinary';
import { Sheet, Field } from './Sheet';
import type { AppCtx, Produto } from '../types';

type Props = { dados?: Partial<Produto>; ctx: AppCtx; onClose: () => void };

const CATS_DEFAULT = ['Camisetas', 'Canecas', 'Decoração', 'Kits'];

export function MCatalogo({ dados, ctx, onClose }: Props) {
  const { prods, setProds } = ctx;
  const isEdit = Boolean(dados?.id);

  const existCats = Array.from(new Set([...CATS_DEFAULT, ...prods.map(p => p.cat)]));

  const [nome,     setNome]     = useState(dados?.nome     ?? '');
  const [cat,      setCat]      = useState(dados?.cat      ?? existCats[0]);
  const [catCustom, setCatCustom] = useState('');
  const [preco,    setPreco]    = useState(String(dados?.preco    ?? ''));
  const [precoDe,  setPrecoDe]  = useState(String(dados?.precoDe ?? ''));
  const [estoque,  setEstoque]  = useState(String(dados?.estoque  ?? '0'));
  const [desc,     setDesc]     = useState(dados?.descricao ?? '');
  const [icon,     setIcon]     = useState(dados?.icon      ?? '🎁');
  const [destaque, setDestaque] = useState(dados?.destaque  ?? false);
  const [ativo,    setAtivo]    = useState(dados?.ativo     ?? true);
  const [fotoUrl,  setFotoUrl]  = useState(dados?.fotoUrl   ?? '');
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState(dados?.fotoUrl ?? '');
  const [saving,   setSaving]   = useState(false);
  const [erro,     setErro]     = useState('');
  const [confirmDel, setConfirmDel] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const catFinal = cat === '__custom__' ? catCustom : cat;

  const handleFoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFotoFile(f);
    setFotoPreview(URL.createObjectURL(f));
  };

  const salvar = async () => {
    if (!nome.trim()) return;
    setSaving(true);
    setErro('');
    try {
      const id = dados?.id || `prod_${Date.now()}`;
      let finalFotoUrl = fotoUrl;

      if (fotoFile) {
        try {
          finalFotoUrl = await uploadFoto(fotoFile);
        } catch {
          setErro('Foto não enviada. Verifique sua conexão ou tente sem foto.');
        }
      }

      const prod: Produto = {
        id,
        nome: nome.trim(),
        cat: catFinal,
        icon,
        preco: parseFloat(preco) || 0,
        ...(precoDe ? { precoDe: parseFloat(precoDe) } : {}),
        descricao: desc,
        estoque: parseInt(estoque) || 0,
        ...(finalFotoUrl ? { fotoUrl: finalFotoUrl } : {}),
        ativo,
        destaque,
      };

      if (isEdit) {
        setProds(ps => ps.map(p => p.id === id ? prod : p));
      } else {
        setProds(ps => [prod, ...ps]);
      }
      onClose();
    } catch {
      setErro('Erro ao salvar. Tente novamente.');
      setSaving(false);
    } finally {
      setSaving(false);
    }
  };

  const deletar = () => {
    if (!dados?.id) return;
    setProds(ps => ps.filter(p => p.id !== dados.id));
    onClose();
  };

  return (
    <Sheet title={isEdit ? 'Editar produto' : 'Novo produto'} subtitle="Catálogo" onClose={onClose} wide>
      <div
        className="foto-upload"
        onClick={() => fileRef.current?.click()}
        style={{ backgroundImage: fotoPreview ? `url(${fotoPreview})` : undefined }}
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
        <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFoto} />
      </div>

      <div className="form-grid">
        <Field label="Nome">
          <input value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: Caneca Cerâmica" />
        </Field>
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
      </div>

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
      </div>

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
        <button className="btn-primary" onClick={salvar} disabled={saving}>
          {saving ? 'Salvando…' : 'Salvar produto'}
        </button>
      </div>
    </Sheet>
  );
}
