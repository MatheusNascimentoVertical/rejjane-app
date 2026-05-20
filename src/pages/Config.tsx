import { OPS } from '../data/constants';
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
  ['orcamento',  'Envio de orçamento'],
  ['confirmado', 'Pedido confirmado'],
  ['producao',   'Em produção'],
  ['pronto',     'Pronto para entrega'],
  ['entregue',   'Entregue / pós-venda'],
];

export function Config({ ctx }: Props) {
  const { cfg, setCfg } = ctx;
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
        <Field label="Cidade"><input value={cfg.cidade} onChange={e => upd('cidade', e.target.value)} /></Field>
      </section>

      <section className="card-soft">
        <div className="card-eyebrow">Equipe</div>
        <h3 className="card-title">Operadoras ativas</h3>
        <div className="ops-grid">
          {OPS.map(op => (
            <div key={op.id} className="op-chip">
              <div className="op-chip-flower" style={{ color: op.cor }}>✿</div>
              <div>
                <div className="op-chip-name">{op.nome}</div>
                <div className="op-chip-sub">Operadora</div>
              </div>
              <span className="op-chip-status">Ativa</span>
            </div>
          ))}
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
    </div>
  );
}
