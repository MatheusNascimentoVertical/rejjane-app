import { useState, useRef } from 'react';
import type { AppCtx, MsgKey } from '../types';

type Props = { ctx: AppCtx };
type Tab = 'loja' | 'mensagens' | 'dicas' | 'conta';

const MSG_CFG: { key: MsgKey; label: string; icon: string; hint: string }[] = [
  { key: 'orcamento',   label: 'Orçamento enviado',      icon: '📋', hint: 'Enviada quando você cria um orçamento para a cliente' },
  { key: 'confirmado',  label: 'Pedido confirmado',       icon: '✅', hint: 'Enviada quando a cliente confirma o pedido' },
  { key: 'encomendado', label: 'Produto encomendado',     icon: '📦', hint: 'Enviada ao encomendar o produto no catálogo' },
  { key: 'chegou',      label: 'Produto chegou!',         icon: '✨', hint: 'Enviada quando o produto chega e está pronto para retirada' },
  { key: 'entregue',    label: 'Entregue — pós-venda',    icon: '🌹', hint: 'Enviada após a entrega — ótima para fidelizar a cliente!' },
  { key: 'cobranca',    label: 'Cobrança de pagamento',   icon: '💰', hint: 'Enviada para lembrar sobre pagamento em atraso' },
];

const VARS: { v: string; desc: string }[] = [
  { v: '{nome}',       desc: 'Nome da cliente' },
  { v: '{produto}',    desc: 'Nome do produto' },
  { v: '{total}',      desc: 'Valor total do pedido' },
  { v: '{sinal}',      desc: 'Valor do sinal pago' },
  { v: '{restante}',   desc: 'Valor que ainda falta pagar' },
  { v: '{prazo}',      desc: 'Data de entrega combinada' },
  { v: '{vencimento}', desc: 'Data de vencimento do pagamento' },
  { v: '{qtd}',        desc: 'Quantidade de produtos' },
  { v: '{vUnit}',      desc: 'Valor unitário do produto' },
  { v: '{instagram}',  desc: 'Seu @ do Instagram' },
];

const DICAS: { icon: string; titulo: string; linhas: string[] }[] = [
  {
    icon: '🏠', titulo: 'Início (Painel)',
    linhas: [
      'O Início mostra um resumo rápido do seu dia: pedidos pendentes, entradas do mês e alertas.',
      'Os cartões coloridos são clicáveis — toque para ir direto à seção.',
      'Pedidos atrasados aparecem em vermelho. Atenção especial a eles!',
      'Deslize para baixo para ver os pedidos mais recentes.',
    ],
  },
  {
    icon: '📦', titulo: 'Pedidos',
    linhas: [
      'Use o botão + para criar um novo pedido. Escolha a cliente, o produto e o prazo.',
      'Os filtros de status (Orçamento, Confirmado, etc.) mostram pedidos em cada etapa.',
      'Deslize um cartão de pedido para avançar o status — por exemplo, de Confirmado para Encomendado.',
      'O badge vermelho no menu mostra quantos pedidos estão atrasados.',
      'Use "A cobrar" para ver pedidos com pagamento pendente.',
    ],
  },
  {
    icon: '👤', titulo: 'Clientes',
    linhas: [
      'Cadastre todas as suas clientes com nome e WhatsApp.',
      'Toque na estrela ⭐ para marcar as mais especiais como favoritas.',
      'Use o botão do WhatsApp para abrir uma conversa direta.',
      'O campo "Observações" é ótimo para anotar preferências: ex. "Gosta de Natura".',
    ],
  },
  {
    icon: '📚', titulo: 'Catálogo',
    linhas: [
      'Adicione os produtos que você vende com preço e foto.',
      'Ative/Desative produtos — os inativos não aparecem ao criar pedidos.',
      'Marque como "destaque" para aparecer em primeiro.',
      'Mantenha o estoque atualizado para facilitar o controle.',
    ],
  },
  {
    icon: '💵', titulo: 'Caixa',
    linhas: [
      'Registre todas as entradas (vendas, sinais) e saídas (compras de catálogo).',
      'Use as setas ‹ › para navegar entre meses e ver o histórico.',
      'A seção "A Receber" lista clientes com pagamento pendente.',
      '"Cobranças próximas" mostra parcelas e vencimentos nos próximos 14 dias.',
    ],
  },
  {
    icon: '📊', titulo: 'Análise',
    linhas: [
      'Acompanhe faturamento, ticket médio e crescimento mês a mês.',
      'O gráfico de barras mostra a evolução dos últimos 6 meses.',
      'A lista de devedoras ajuda a priorizar suas cobranças.',
      'Veja seus melhores produtos e marcas por faturamento.',
      'Insights automáticos aparecem quando há algo importante para sua atenção.',
    ],
  },
  {
    icon: '💬', titulo: 'Mensagens do WhatsApp',
    linhas: [
      'Quando você avança um pedido de status, o app sugere uma mensagem pronta.',
      'Toque em "Enviar WhatsApp" no cartão do pedido para abrir a mensagem.',
      'Você pode editar as mensagens aqui em Ajustes → Mensagens.',
      'As variáveis {nome}, {produto} etc. são substituídas automaticamente pelos dados do pedido.',
    ],
  },
];

export function Config({ ctx }: Props) {
  const { cfg, setCfg, zerarDados, sair } = ctx;
  const [aba, setAba] = useState<Tab>('loja');
  const [dicaAberta, setDicaAberta] = useState<number | null>(null);
  const [varAberta, setVarAberta] = useState<MsgKey | null>(null);
  const textareaRefs = useRef<Record<string, HTMLTextAreaElement | null>>({});

  const upd = (k: string, v: string) => setCfg(c => ({ ...c, [k]: v }));
  const updMsg = (k: MsgKey, v: string) => setCfg(c => ({ ...c, msgs: { ...c.msgs, [k]: v } }));

  const inserirVar = (key: MsgKey, v: string) => {
    const el = textareaRefs.current[key];
    if (!el) return;
    const s = el.selectionStart ?? el.value.length;
    const e = el.selectionEnd ?? s;
    const next = el.value.slice(0, s) + v + el.value.slice(e);
    updMsg(key, next);
    setTimeout(() => { el.focus(); el.setSelectionRange(s + v.length, s + v.length); }, 0);
  };

  const TABS: [Tab, string, string][] = [
    ['loja',      '🏪', 'Minha Loja'],
    ['mensagens', '💬', 'Mensagens'],
    ['dicas',     '💡', 'Como Usar'],
    ['conta',     '🔐', 'Conta'],
  ];

  return (
    <div className="config">
      {/* Tab bar */}
      <div className="cfg-tabs">
        {TABS.map(([id, icon, label]) => (
          <button
            key={id}
            className={`cfg-tab${aba === id ? ' active' : ''}`}
            onClick={() => setAba(id)}
          >
            <span className="cfg-tab-icon">{icon}</span>
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* ── MINHA LOJA ── */}
      {aba === 'loja' && (
        <div className="cfg-section">
          <div className="cfg-tip">
            <span>ℹ️</span>
            <span>Essas informações aparecem nas mensagens enviadas para suas clientes e nos orçamentos.</span>
          </div>

          {/* Live preview card */}
          <div className="cfg-preview">
            <div className="cfg-preview-label">Pré-visualização do seu cartão</div>
            <div className="cfg-preview-card">
              <div className="cfg-prev-logo">💄</div>
              <div>
                <div className="cfg-prev-nome">{cfg.nomeEmpresa || 'Nome da sua loja'}</div>
                <div className="cfg-prev-slogan">{cfg.slogan || 'Seu slogan aqui'}</div>
                <div className="cfg-prev-info">📱 {cfg.telefone || '(XX) 99999-9999'}</div>
                <div className="cfg-prev-info">📸 {cfg.instagram || '@sua_loja'}</div>
                <div className="cfg-prev-info">📍 {cfg.cidade || 'Sua cidade'}</div>
              </div>
            </div>
          </div>

          <div className="card-soft cfg-card">
            <div className="cfg-card-title">
              <span>🏪</span> Nome e slogan
            </div>
            <div className="config-row">
              <label className="field">
                <span className="field-label">Nome da loja / negócio</span>
                <input
                  value={cfg.nomeEmpresa}
                  placeholder="ex: Rejjanevendas"
                  onChange={e => upd('nomeEmpresa', e.target.value)}
                />
                <span className="cfg-field-hint">Como suas clientes vão te reconhecer</span>
              </label>
              <label className="field">
                <span className="field-label">Slogan / frase</span>
                <input
                  value={cfg.slogan}
                  placeholder="ex: Beleza • Casa • Cuidado"
                  onChange={e => upd('slogan', e.target.value)}
                />
                <span className="cfg-field-hint">Uma frase curta e marcante</span>
              </label>
            </div>
          </div>

          <div className="card-soft cfg-card">
            <div className="cfg-card-title">
              <span>📱</span> Contato e localização
            </div>
            <div className="config-row">
              <label className="field">
                <span className="field-label">WhatsApp / Telefone</span>
                <input
                  value={cfg.telefone}
                  placeholder="ex: (61) 98294-9194"
                  onChange={e => upd('telefone', e.target.value)}
                />
                <span className="cfg-field-hint">Número que aparece nas mensagens</span>
              </label>
              <label className="field">
                <span className="field-label">Instagram</span>
                <input
                  value={cfg.instagram}
                  placeholder="ex: @rejane_vendas"
                  onChange={e => upd('instagram', e.target.value)}
                />
                <span className="cfg-field-hint">Incluído nas mensagens de pós-venda</span>
              </label>
            </div>
            <label className="field">
              <span className="field-label">Cidade / Bairro de atendimento</span>
              <input
                value={cfg.cidade}
                placeholder="ex: Gama / Céu Azul — DF"
                onChange={e => upd('cidade', e.target.value)}
              />
              <span className="cfg-field-hint">Aparece no orçamento e nas informações da loja</span>
            </label>
          </div>
        </div>
      )}

      {/* ── MENSAGENS ── */}
      {aba === 'mensagens' && (
        <div className="cfg-section">
          <div className="cfg-tip">
            <span>💡</span>
            <span>
              Essas mensagens são enviadas automaticamente quando você avança um pedido de status.
              Use as variáveis para personalizar cada mensagem com os dados da cliente.
            </span>
          </div>

          {/* Variables reference */}
          <div className="card-soft cfg-card">
            <div className="cfg-card-title"><span>🔤</span> Variáveis disponíveis</div>
            <p className="cfg-vars-intro">Toque em uma variável para ver o que ela representa. Para inserir, coloque o cursor na mensagem e toque na variável.</p>
            <div className="cfg-vars-grid">
              {VARS.map(({ v, desc }) => (
                <div key={v} className="cfg-var-chip" title={desc}>
                  <code>{v}</code>
                  <span>{desc}</span>
                </div>
              ))}
            </div>
          </div>

          {MSG_CFG.map(({ key, label, icon, hint }) => (
            <div key={key} className="card-soft cfg-card cfg-msg-card">
              <div className="cfg-msg-head">
                <div className="cfg-card-title"><span>{icon}</span> {label}</div>
                <p className="cfg-msg-hint">{hint}</p>
              </div>

              {/* Variable insert bar */}
              <div className="cfg-insert-bar">
                <span className="cfg-insert-label">Inserir:</span>
                {VARS.map(({ v }) => (
                  <button
                    key={v}
                    className="cfg-insert-btn"
                    onClick={() => inserirVar(key, v)}
                    type="button"
                  >
                    {v}
                  </button>
                ))}
              </div>

              <label className="field">
                <textarea
                  ref={el => { textareaRefs.current[key] = el; }}
                  rows={4}
                  value={cfg.msgs[key] || ''}
                  placeholder={`Mensagem para ${label.toLowerCase()}...`}
                  onChange={e => updMsg(key, e.target.value)}
                />
              </label>

              {/* Preview */}
              {cfg.msgs[key] && (
                <div className="cfg-msg-preview">
                  <div className="cfg-msg-preview-label">Prévia (com dados de exemplo):</div>
                  <div className="cfg-wpp-bubble">
                    {cfg.msgs[key]
                      .replace(/{nome}/g, 'Ana Paula')
                      .replace(/{produto}/g, 'Kit Ekos Natura')
                      .replace(/{total}/g, 'R$ 145,00')
                      .replace(/{sinal}/g, 'R$ 70,00')
                      .replace(/{restante}/g, 'R$ 75,00')
                      .replace(/{prazo}/g, '20/07/2026')
                      .replace(/{vencimento}/g, '25/07/2026')
                      .replace(/{qtd}/g, '1')
                      .replace(/{vUnit}/g, 'R$ 145,00')
                      .replace(/{instagram}/g, cfg.instagram || '@rejane_vendas')
                    }
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── DICAS ── */}
      {aba === 'dicas' && (
        <div className="cfg-section">
          <div className="cfg-tip">
            <span>🌟</span>
            <span>Guia rápido de como usar cada parte do aplicativo. Toque em cada seção para expandir.</span>
          </div>

          {DICAS.map((d, i) => (
            <div key={i} className="card-soft cfg-card cfg-dica-card">
              <button
                className="cfg-dica-toggle"
                onClick={() => setDicaAberta(dicaAberta === i ? null : i)}
              >
                <span className="cfg-dica-icon">{d.icon}</span>
                <span className="cfg-dica-titulo">{d.titulo}</span>
                <span className={`cfg-dica-chevron${dicaAberta === i ? ' open' : ''}`}>›</span>
              </button>
              {dicaAberta === i && (
                <ul className="cfg-dica-lista">
                  {d.linhas.map((linha, j) => (
                    <li key={j}>{linha}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}

          <div className="card-soft cfg-card">
            <div className="cfg-card-title"><span>📲</span> Adicionar à tela inicial</div>
            <div className="cfg-dica-lista" style={{ display: 'block', marginTop: 0 }}>
              <p style={{ marginBottom: 8, lineHeight: 1.6 }}>
                Para usar o app como se fosse baixado da loja, adicione à tela inicial do celular:
              </p>
              <div className="cfg-steps">
                <div className="cfg-step"><span className="cfg-step-n">1</span><span>Abra o app no navegador Chrome (Android) ou Safari (iPhone)</span></div>
                <div className="cfg-step"><span className="cfg-step-n">2</span><span>Toque nos 3 pontinhos ⋮ (Chrome) ou no botão compartilhar ↑ (Safari)</span></div>
                <div className="cfg-step"><span className="cfg-step-n">3</span><span>Toque em <strong>"Adicionar à tela inicial"</strong></span></div>
                <div className="cfg-step"><span className="cfg-step-n">4</span><span>Confirme e pronto! O ícone aparece na sua tela inicial 🎉</span></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── CONTA ── */}
      {aba === 'conta' && (
        <div className="cfg-section">
          <div className="cfg-tip">
            <span>⚠️</span>
            <span>Cuidado com as ações abaixo — algumas não têm como desfazer.</span>
          </div>

          <div className="card-soft cfg-card">
            <div className="cfg-card-title"><span>🔐</span> Sua conta</div>
            <p className="cfg-body-text">
              Você está logada no aplicativo. Para sair da sua conta ou trocar de usuário, use o botão abaixo.
            </p>
            <button type="button" className="config-sair" onClick={sair}>
              🚪 Sair da conta
            </button>
          </div>

          <div className="card-soft cfg-card danger-zone">
            <div className="cfg-card-title" style={{ color: '#b85050' }}>
              <span>⚠️</span> Zona de perigo
            </div>
            <p className="cfg-body-text">
              Essas ações são <strong>irreversíveis</strong>. Os dados apagados não poderão ser recuperados.
              Use com muito cuidado.
            </p>
            <div className="cfg-danger-actions">
              <div className="cfg-danger-item">
                <div>
                  <div className="cfg-danger-title">Zerar pedidos e clientes</div>
                  <div className="cfg-danger-desc">Remove todos os pedidos, clientes e lançamentos. Produtos e configurações são mantidos.</div>
                </div>
                <button
                  type="button"
                  className="btn-danger"
                  onClick={() => {
                    if (confirm('Tem certeza? Todos os pedidos e clientes serão excluídos permanentemente.'))
                      zerarDados();
                  }}
                >
                  Zerar dados
                </button>
              </div>
            </div>
          </div>

          <div className="card-soft cfg-card">
            <div className="cfg-card-title"><span>ℹ️</span> Sobre o app</div>
            <div className="cfg-about">
              <div className="cfg-about-logo">💄</div>
              <div className="cfg-about-nome">Rejjanevendas</div>
              <div className="cfg-about-desc">Portal de gestão de vendas diretas</div>
              <div className="cfg-about-versao">Versão 2.0 — Feito com 💕 para Rejane</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
