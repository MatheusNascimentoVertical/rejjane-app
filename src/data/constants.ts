import { hoje, dPlus } from '../lib/helpers';
import type { Cliente, Pedido, Lanc, Config, PedStatus } from '../types';

export type Prod = {
  id: string;
  nome: string;
  marca: string;
  preco: number;
  precoDe?: number;
  icon: string;
  cat: string;
  descricao: string;
  estoque: number;
  fotoUrl?: string;
  ativo: boolean;
  destaque?: boolean;
};

export type StCfg = { label: string; cor: string; bg: string };

export const MARCAS: { id: string; nome: string; cor: string; bg: string; icon: string }[] = [
  { id: 'Tupperware', nome: 'Tupperware', cor: '#00838f', bg: '#e0f7fa', icon: '🏠' },
  { id: 'Avon',       nome: 'Avon',       cor: '#546e7a', bg: '#eceff1', icon: '🌹' },
  { id: 'Boticário',  nome: 'Boticário',  cor: '#2e7d32', bg: '#e8f5e9', icon: '🌿' },
  { id: 'Eudora',     nome: 'Eudora',     cor: '#6a1b9a', bg: '#f3e5f5', icon: '💜' },
  { id: 'Natura',     nome: 'Natura',     cor: '#795548', bg: '#efebe9', icon: '🌱' },
];

export const getMarca = (id: string) => MARCAS.find(m => m.id === id);

export const PRODS: Prod[] = [
  // Tupperware
  { id: 'tup_jarra',  nome: 'Jarra Facetada 1,5L',    marca: 'Tupperware', preco: 85,  icon: '🫙', cat: 'Casa',     descricao: 'Jarra com tampa hermética', estoque: 0, ativo: true, destaque: true },
  { id: 'tup_pote',   nome: 'Pote Visual 500ml',       marca: 'Tupperware', preco: 45,  icon: '🥡', cat: 'Casa',     descricao: 'Pote transparente com tampa', estoque: 0, ativo: true },
  { id: 'tup_tigela', nome: 'Tigela Ultra Pro',        marca: 'Tupperware', preco: 120, icon: '🍲', cat: 'Casa',     descricao: 'Tigela multi-uso', estoque: 0, ativo: true },
  { id: 'tup_kit',    nome: 'Kit Básico de Potes',     marca: 'Tupperware', preco: 180, icon: '📦', cat: 'Casa',     descricao: 'Kit com 4 potes sortidos', estoque: 0, ativo: true, destaque: true },
  // Avon
  { id: 'avon_perf',  nome: 'Perfume Lily Flower 75ml', marca: 'Avon',      preco: 89,  icon: '🌸', cat: 'Beleza',   descricao: 'Deo parfum feminino', estoque: 0, ativo: true, destaque: true },
  { id: 'avon_bat',   nome: 'Batom Matte Perfeito',     marca: 'Avon',      preco: 28,  icon: '💄', cat: 'Beleza',   descricao: 'Batom com acabamento matte', estoque: 0, ativo: true },
  { id: 'avon_serum', nome: 'Sérum Vitamina C 30ml',    marca: 'Avon',      preco: 65,  icon: '✨', cat: 'Cuidado',  descricao: 'Sérum iluminador', estoque: 0, ativo: true },
  { id: 'avon_masc',  nome: 'Máscara Volume On',        marca: 'Avon',      preco: 35,  icon: '👁️', cat: 'Beleza',   descricao: 'Máscara volumizadora', estoque: 0, ativo: true },
  // Boticário
  { id: 'bot_malb',   nome: 'Malbec Gold 100ml',        marca: 'Boticário', preco: 149, icon: '🌿', cat: 'Beleza',   descricao: 'Deo colônia', estoque: 0, ativo: true, destaque: true },
  { id: 'bot_nativa', nome: 'Loção Nativa Spa 400ml',   marca: 'Boticário', preco: 49,  icon: '🧴', cat: 'Cuidado',  descricao: 'Hidratante corporal', estoque: 0, ativo: true },
  { id: 'bot_creme',  nome: 'Creme Hands & Nails',      marca: 'Boticário', preco: 32,  icon: '💅', cat: 'Cuidado',  descricao: 'Creme para mãos', estoque: 0, ativo: true },
  { id: 'bot_kit',    nome: 'Kit Presente Floratta',    marca: 'Boticário', preco: 189, icon: '🎁', cat: 'Beleza',   descricao: 'Kit perfume + loção + sabonete', estoque: 0, ativo: true, destaque: true },
  // Eudora
  { id: 'eud_glam',   nome: 'Glamour Intense 95ml',     marca: 'Eudora',    preco: 129, icon: '💜', cat: 'Beleza',   descricao: 'Deo parfum sofisticado', estoque: 0, ativo: true, destaque: true },
  { id: 'eud_base',   nome: 'Base HD Fluida',           marca: 'Eudora',    preco: 79,  icon: '🎨', cat: 'Beleza',   descricao: 'Base alta definição', estoque: 0, ativo: true },
  { id: 'eud_glow',   nome: 'Iluminador Glow Skin',     marca: 'Eudora',    preco: 55,  icon: '🌟', cat: 'Beleza',   descricao: 'Iluminador face e corpo', estoque: 0, ativo: true },
  { id: 'eud_pal',    nome: 'Paleta Sombras Rose',      marca: 'Eudora',    preco: 95,  icon: '🎭', cat: 'Beleza',   descricao: 'Paleta com 9 cores', estoque: 0, ativo: true },
  // Natura
  { id: 'nat_ekos',   nome: 'Ekos Maracujá 400ml',      marca: 'Natura',    preco: 58,  icon: '🌱', cat: 'Cuidado',  descricao: 'Loção hidratante corporal', estoque: 0, ativo: true, destaque: true },
  { id: 'nat_chron',  nome: 'Chronos Creme Dia FPS30',  marca: 'Natura',    preco: 89,  icon: '🌞', cat: 'Cuidado',  descricao: 'Creme anti-idade', estoque: 0, ativo: true },
  { id: 'nat_ess',    nome: 'Essencial 100ml',          marca: 'Natura',    preco: 119, icon: '🌺', cat: 'Beleza',   descricao: 'Deo parfum clássico', estoque: 0, ativo: true },
  { id: 'nat_kit',    nome: 'Kit Presente Ekos',        marca: 'Natura',    preco: 145, icon: '🎁', cat: 'Conforto', descricao: 'Kit sabonete + hidratante + óleo', estoque: 0, ativo: true, destaque: true },
];

let _prodCache: Prod[] = [...PRODS];
export function setProdCache(prods: Prod[]) { _prodCache = prods; }
export const getProd = (id: string): Prod | undefined => _prodCache.find(p => p.id === id);

export const ST: Record<string, StCfg> = {
  orcamento:   { label: 'Orçamento',   cor: '#9a7cb5', bg: '#efe7f5' },
  confirmado:  { label: 'Confirmado',  cor: '#c98b3e', bg: '#fbf2e3' },
  encomendado: { label: 'Encomendado', cor: '#0288d1', bg: '#e1f5fe' },
  chegou:      { label: 'Chegou ✨',   cor: '#c2185b', bg: '#fce4ec' },
  entregue:    { label: 'Entregue',    cor: '#5a9b7a', bg: '#e6f1ea' },
  cancelado:   { label: 'Cancelado',   cor: '#b87878', bg: '#f5e4e4' },
};

export const PROX: Partial<Record<PedStatus, PedStatus>> = {
  orcamento:   'confirmado',
  confirmado:  'encomendado',
  encomendado: 'chegou',
  chegou:      'entregue',
};

export const NAV: [string, string][] = [
  ['dash',     'Início'],
  ['pedidos',  'Pedidos'],
  ['clientes', 'Clientes'],
  ['catalogo', 'Catálogo'],
  ['caixa',    'Caixa'],
  ['config',   'Ajustes'],
];

export const CFG0: Config = {
  nomeEmpresa: 'Rejjanevendas',
  slogan: 'Beleza • Casa • Cuidado • Você',
  telefone: '(61) 98294-9194',
  instagram: '@rejane_vendas',
  cidade: 'Céu Azul / Gama — DF',
  msgs: {
    orcamento:   'Olá {nome}! 🌸 Orçamento *Rejjanevendas*:\n\nProduto: *{produto}*\nQtd: *{qtd}* un\nUnit.: *{vUnit}*\nTotal: *{total}*\nPrazo: *{prazo}*\n\nPara confirmar, é só responder! 💕',
    confirmado:  'Olá {nome}! ✅ Seu pedido de *{produto}* foi confirmado! Prazo: *{prazo}*. Total: *{total}*. Sinal: *{sinal}*. Restante: *{restante}*. Obrigada pela confiança! 💕',
    encomendado: 'Olá {nome}! 📦 Seu pedido de *{produto}* foi encomendado! Em breve chega e eu te aviso. Prazo estimado: *{prazo}*. 🌸',
    chegou:      'Olá {nome}! ✨ *CHEGOU!* Seu pedido de *{produto}* está pronto para retirada! Restante: *{restante}*. Retirada em *Céu Azul ou Gama (DF)*. 💕',
    entregue:    'Olá {nome}! 🌹 Pedido entregue! Obrigada pela confiança. Siga no Instagram: {instagram}. 💕 Até a próxima! 🌸',
    cobranca:    'Olá {nome}! 💰 Passando para lembrar do pagamento de *{produto}*.\n\nValor: *{total}*\nSinal pago: *{sinal}*\nRestante: *{restante}*\nVencimento: *{vencimento}*\n\nQualquer dúvida, é só chamar! 💕',
  },
};

export const CLI0: Cliente[] = [
  { id: 1, nome: 'Ana Paula Souza',  tel: '(61) 99111-2233', obs: 'Gosta de Natura e Boticário.',    fav: true  },
  { id: 2, nome: 'Carla Santos',     tel: '(61) 98222-3344', obs: 'Pede Tupperware todo mês.',       fav: false },
  { id: 3, nome: 'Renata Lima',      tel: '(61) 97333-4455', obs: 'Prefere Eudora — maquiagem.',     fav: false },
  { id: 4, nome: 'Juliana Costa',    tel: '(61) 96444-5566', obs: 'VIP — indica muito.',             fav: true  },
  { id: 5, nome: 'Bia Carvalho',     tel: '(61) 95555-6677', obs: 'Sempre pede kit presente.',      fav: false },
];

export const PED0: Pedido[] = [
  { id: 2001, cliId: 1, cliNome: 'Ana Paula Souza', itens: [{ prodId: 'nat_kit',  qtd: 1, vUnit: 145 }], vTotal: 145, pagamento: 'pix',     data: hoje(),    prazo: dPlus(5), st: 'encomendado', sinal: 70,  obs: 'Presente para a mãe dela.' },
  { id: 2002, cliId: 2, cliNome: 'Carla Santos',    itens: [{ prodId: 'tup_kit',  qtd: 1, vUnit: 180 }], vTotal: 180, pagamento: 'credito', data: hoje(),    prazo: dPlus(7), st: 'confirmado',  sinal: 90,  obs: '' },
  { id: 2003, cliId: 3, cliNome: 'Renata Lima',     itens: [{ prodId: 'eud_glam', qtd: 1, vUnit: 129 }], vTotal: 129, pagamento: 'pix',     data: hoje(),    prazo: dPlus(3), st: 'chegou',      sinal: 129, obs: 'Pronto para retirar.' },
  { id: 2004, cliId: 4, cliNome: 'Juliana Costa',   itens: [{ prodId: 'bot_malb', qtd: 2, vUnit: 149 }], vTotal: 298, pagamento: 'dinheiro',data: dPlus(-2), prazo: dPlus(2), st: 'orcamento',   sinal: 0,   obs: 'Dois Malbec para presente.' },
  { id: 2005, cliId: 5, cliNome: 'Bia Carvalho',    itens: [{ prodId: 'bot_kit',  qtd: 1, vUnit: 189 }], vTotal: 189, pagamento: 'pix',     data: dPlus(-1), prazo: dPlus(4), st: 'encomendado', sinal: 100, obs: '' },
];

export const FIN0: Lanc[] = [
  { id: 1, tipo: 'entrada', desc: 'Sinal Kit Ekos — Ana Paula',      valor: 70,  data: hoje()    },
  { id: 2, tipo: 'entrada', desc: 'Sinal Tupperware — Carla Santos', valor: 90,  data: hoje()    },
  { id: 3, tipo: 'entrada', desc: 'Glamour Intense — Renata Lima',   valor: 129, data: dPlus(-2) },
  { id: 4, tipo: 'saida',   desc: 'Pedido Tupperware campanha 15',   valor: 160, data: dPlus(-3) },
  { id: 5, tipo: 'saida',   desc: 'Pedido Natura campanha 10',       valor: 98,  data: dPlus(-4) },
];
