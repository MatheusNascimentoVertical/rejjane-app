import type { AppCtx, MsgKey } from '../types';

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
  ['orcamento',   'Envio de orçamento'],
  ['confirmado',  'Pedido confirmado'],
  ['encomendado', 'Pedido encomendado'],
  ['chegou',      'Chegou — pronto para entrega'],
  ['entregue',    'Entregue / pós-venda'],
  ['cobranca',    '💰 Cobrança de pagamento'],
];

export function Config({ ctx }: Props) {
  const { cfg, setCfg, zerarDados, sair } = ctx;
  const upd = (k: string, v: string) => setCfg(c => ({ ...c, [k]: v }));

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
        <Field label="Cidade / Região"><input value={cfg.cidade} onChange={e => upd('cidade', e.target.value)} /></Field>
      </section>

      <section className="card-soft">
        <div className="card-eyebrow">Comunicação</div>
        <h3 className="card-title">Mensagens prontas WhatsApp</h3>
        <p className="config-hint">
          Variáveis:{' '}
          {['{nome}','{produto}','{total}','{restante}','{prazo}','{sinal}','{qtd}','{vUnit}','{instagram}'].map(v => (
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
