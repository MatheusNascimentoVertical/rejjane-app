import type { AppCtx, MsgKey, Op } from '../types';

type Props = { ctx: AppCtx };

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      {children}
    </label>
  );
}

const MSG_LABELS: [MsgKey, string][] = [
  ['orcamento',  'Envio de orçamento'],
  ['confirmado', 'Pedido confirmado'],
  ['producao',   'Em produção'],
  ['pronto',     'Pronto para entrega'],
  ['entregue',   'Entregue / pós-venda'],
];

export function Config({ ctx }: Props) {
  const { cfg, setCfg, zerarDados, sair } = ctx;
  const upd = (k: string, v: string) => setCfg(c => ({ ...c, [k]: v }));

  const ops = cfg.ops ?? [];

  const updateOp = (idx: number, field: keyof Op, value: string) => {
    const next = ops.map((o, i) => i === idx ? { ...o, [field]: value } : o);
    setCfg(c => ({ ...c, ops: next }));
  };

  const removeOp = (idx: number) => {
    const next = ops.filter((_, i) => i !== idx);
    setCfg(c => ({ ...c, ops: next }));
  };

  const addOp = () => {
    const newOp: Op = { id: `op_${Date.now()}`, nome: 'Nova operadora', cor: '#c97d6e' };
    setCfg(c => ({ ...c, ops: [...(c.ops ?? []), newOp] }));
  };

  return (
    <div className="config">
      <section className="card-soft">
        <div className="card-eyebrow">Identidade</div>
        <h3 className="card-title">Dados da empresa</h3>
        <div className="config-row">
          <Field label="Nome"><input value={cfg.nomeEmpresa} onChange={e => upd('nomeEmpresa', e.target.value)} /></Field>
          <Field label="Slogan"><input value={cfg.slogan} onChange={e => upd('slogan', e.target.value)} /></Field>
        </div>
        <div className="config-row">
          <Field label="WhatsApp"><input value={cfg.telefone} onChange={e => upd('telefone', e.target.value)} /></Field>
          <Field label="Instagram"><input value={cfg.instagram} onChange={e => upd('instagram', e.target.value)} /></Field>
        </div>
        <Field label="Cidade"><input value={cfg.cidade} onChange={e => upd('cidade', e.target.value)} /></Field>
      </section>

      <section className="card-soft">
        <div className="card-eyebrow">Equipe</div>
        <h3 className="card-title">Operadoras ativas</h3>
        <div className="ops-edit-grid">
          {ops.map((op, idx) => (
            <div key={op.id} className="op-edit-card">
              <input
                type="color"
                className="op-color-dot"
                value={op.cor}
                onChange={e => updateOp(idx, 'cor', e.target.value)}
                title="Cor"
              />
              <input
                value={op.nome}
                onChange={e => updateOp(idx, 'nome', e.target.value)}
                style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontWeight: 700, fontSize: 14, color: 'var(--ink)', fontFamily: 'inherit' }}
              />
              <button
                type="button"
                className="btn-ghost-sm"
                onClick={() => removeOp(idx)}
                style={{ color: '#b85050', padding: '4px 8px' }}
              >
                ✕
              </button>
            </div>
          ))}
          <button type="button" className="op-add-btn" onClick={addOp}>
            + Adicionar operadora
          </button>
        </div>
      </section>

      <section className="card-soft">
        <div className="card-eyebrow">Comunicação</div>
        <h3 className="card-title">Mensagens prontas WhatsApp</h3>
        <p className="config-hint">
          Variáveis:{' '}
          {['{nome}','{produto}','{total}','{restante}','{prazo}','{sinal}','{arte}','{qtd}'].map(v => (
            <code key={v}>{v}</code>
          ))}
        </p>
        {MSG_LABELS.map(([k, l]) => (
          <Field key={k} label={l}>
            <textarea
              rows={3}
              value={cfg.msgs[k] || ''}
              onChange={e => setCfg(c => ({ ...c, msgs: { ...c.msgs, [k]: e.target.value } }))}
            />
          </Field>
        ))}
      </section>

      <section className="card-soft danger-zone">
        <div className="card-eyebrow" style={{ color: '#b85050' }}>Zona de Perigo</div>
        <h3 className="card-title">Ações irreversíveis</h3>
        <p style={{ fontSize: 13, color: 'var(--ink-soft)', marginBottom: 16 }}>
          Atenção: estas ações não podem ser desfeitas. Todos os dados serão permanentemente removidos.
        </p>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn-danger"
            onClick={() => { if (confirm('Tem certeza? Todos os pedidos e clientes serão excluídos.')) zerarDados(); }}
          >
            Zerar Pedidos e Clientes
          </button>
          <button type="button" className="config-sair" onClick={sair}>
            Sair da conta
          </button>
        </div>
      </section>
    </div>
  );
}
