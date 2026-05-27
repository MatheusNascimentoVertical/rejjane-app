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
  { id: 'Feminino',   nome: 'Feminino',   cor: '#c2185b', bg: '#fce4ec', icon: '👗' },
  { id: 'Masculino',  nome: 'Masculino',  cor: '#1565c0', bg: '#e3f2fd', icon: '👕' },
  { id: 'Acessórios', nome: 'Acessórios', cor: '#6a1b9a', bg: '#f3e5f5', icon: '👜' },
  { id: 'Calçados',   nome: 'Calçados',   cor: '#4e342e', bg: '#efebe9', icon: '👟' },
  { id: 'Infantil',   nome: 'Infantil',   cor: '#f57f17', bg: '#fff8e1', icon: '🧒' },
];

export const getMarca = (id: string) => MARCAS.find(m => m.id === id);

export const PRODS: Prod[] = [
  // Feminino
  { id: 'fem_vestido',  nome: 'Vestido Midi Floral',       marca: 'Feminino',   preco: 129, icon: '👗', cat: 'Vestidos',  descricao: 'Vestido leve estampa floral', estoque: 0, ativo: true, destaque: true },
  { id: 'fem_blusa',    nome: 'Blusa Cropped Básica',      marca: 'Feminino',   preco: 49,  icon: '👚', cat: 'Blusas',    descricao: 'Cropped algodão cores variadas', estoque: 0, ativo: true },
  { id: 'fem_calca',    nome: 'Calça Jeans Skinny',        marca: 'Feminino',   preco: 119, icon: '👖', cat: 'Calças',    descricao: 'Jeans modelagem skinny', estoque: 0, ativo: true },
  { id: 'fem_jaqueta',  nome: 'Jaqueta Jeans Oversized',  marca: 'Feminino',   preco: 159, icon: '🧥', cat: 'Jaquetas',  descricao: 'Jaqueta jeans oversized tendência', estoque: 0, ativo: true, destaque: true },
  // Masculino
  { id: 'mas_camisa',   nome: 'Camisa Social Slim',        marca: 'Masculino',  preco: 89,  icon: '👔', cat: 'Camisas',   descricao: 'Camisa social slim fit', estoque: 0, ativo: true, destaque: true },
  { id: 'mas_camiseta', nome: 'Camiseta Streetwear',       marca: 'Masculino',  preco: 59,  icon: '👕', cat: 'Camisetas', descricao: 'Camiseta oversized estampada', estoque: 0, ativo: true },
  { id: 'mas_bermuda',  nome: 'Bermuda Cargo',             marca: 'Masculino',  preco: 89,  icon: '🩳', cat: 'Calças',    descricao: 'Bermuda cargo com bolsos laterais', estoque: 0, ativo: true },
  { id: 'mas_moletom',  nome: 'Moletom Canguru',           marca: 'Masculino',  preco: 149, icon: '🧥', cat: 'Moletons',  descricao: 'Moletom com bolso canguru', estoque: 0, ativo: true, destaque: true },
  // Acessórios
  { id: 'aces_bolsa',   nome: 'Bolsa Transversal Couro',  marca: 'Acessórios', preco: 139, icon: '👜', cat: 'Bolsas',    descricao: 'Bolsa couro sintético', estoque: 0, ativo: true, destaque: true },
  { id: 'aces_bone',    nome: 'Boné Dad Hat',              marca: 'Acessórios', preco: 45,  icon: '🧢', cat: 'Bonés',     descricao: 'Boné dad hat unissex', estoque: 0, ativo: true },
  { id: 'aces_oculos',  nome: 'Óculos de Sol Retrô',       marca: 'Acessórios', preco: 79,  icon: '🕶️', cat: 'Óculos',    descricao: 'Armação retrô proteção UV', estoque: 0, ativo: true },
  { id: 'aces_cinto',   nome: 'Cinto Couro Reversível',   marca: 'Acessórios', preco: 55,  icon: '🪢', cat: 'Cintos',    descricao: 'Cinto couro preto/marrom', estoque: 0, ativo: true },
  // Calçados
  { id: 'cal_tenis',    nome: 'Tênis Chunky Plataforma',   marca: 'Calçados',   preco: 189, icon: '👟', cat: 'Tênis',     descricao: 'Tênis sola grossa tendência', estoque: 0, ativo: true, destaque: true },
  { id: 'cal_sandalia', nome: 'Sandália Flatform',         marca: 'Calçados',   preco: 99,  icon: '👡', cat: 'Sandálias', descricao: 'Sandália flatform confortável', estoque: 0, ativo: true },
  { id: 'cal_chinelo',  nome: 'Chinelo Slide Premium',     marca: 'Calçados',   preco: 59,  icon: '🩴', cat: 'Chinelos',  descricao: 'Slide com palmilha macia', estoque: 0, ativo: true },
  { id: 'cal_bota',     nome: 'Bota Cano Curto',           marca: 'Calçados',   preco: 219, icon: '🥾', cat: 'Botas',     descricao: 'Bota couro sintético cano curto', estoque: 0, ativo: true, destaque: true },
  // Infantil
  { id: 'inf_conj',     nome: 'Conjunto Infantil Verão',  marca: 'Infantil',   preco: 79,  icon: '🧒', cat: 'Conjuntos', descricao: 'Conjunto short + camiseta', estoque: 0, ativo: true, destaque: true },
  { id: 'inf_vestido',  nome: 'Vestido Infantil Festa',   marca: 'Infantil',   preco: 95,  icon: '👗', cat: 'Vestidos',  descricao: 'Vestido festa com tule', estoque: 0, ativo: true },
  { id: 'inf_camisa',   nome: 'Camisa Polo Infantil',     marca: 'Infantil',   preco: 55,  icon: '👕', cat: 'Camisas',   descricao: 'Polo algodão infantil', estoque: 0, ativo: true },
  { id: 'inf_tenis',    nome: 'Tênis Infantil Sport',     marca: 'Infantil',   preco: 109, icon: '👟', cat: 'Tênis',     descricao: 'Tênis esportivo infantil', estoque: 0, ativo: true, destaque: true },
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
  nomeEmpresa: 'Paizão Moda Jovem',
  slogan: 'Estilo • Atitude • Você na Moda',
  telefone: '(61) 99000-0000',
  instagram: '@paizao_modajovem',
  cidade: 'Brasília — DF',
  msgs: {
    orcamento:   'Olá {nome}! 😎 Orçamento *Paizão Moda Jovem*:\n\nProduto: *{produto}*\nQtd: *{qtd}* un\nUnit.: *{vUnit}*\nTotal: *{total}*\nPrazo: *{prazo}*\n\nPara confirmar, é só responder! 🔥',
    confirmado:  'Olá {nome}! ✅ Seu pedido de *{produto}* foi confirmado! Prazo: *{prazo}*. Total: *{total}*. Sinal: *{sinal}*. Restante: *{restante}*. Obrigado pela preferência! 🔥',
    encomendado: 'Olá {nome}! 📦 Seu pedido de *{produto}* foi encomendado! Em breve chega e eu te aviso. Prazo estimado: *{prazo}*. 😎',
    chegou:      'Olá {nome}! ✨ *CHEGOU!* Seu pedido de *{produto}* está pronto para retirada! Restante: *{restante}*. Retirada em *Brasília — DF*. 🔥',
    entregue:    'Olá {nome}! 🎉 Pedido entregue! Obrigado pela preferência. Siga no Instagram: {instagram}. 😎 Até a próxima!',
    cobranca:    'Olá {nome}! 💰 Passando para lembrar do pagamento de *{produto}*.\n\nValor: *{total}*\nSinal pago: *{sinal}*\nRestante: *{restante}*\nVencimento: *{vencimento}*\n\nQualquer dúvida, é só chamar! 😎',
  },
};

export const CLI0: Cliente[] = [
  { id: 1, nome: 'Lucas Ferreira',    tel: '(61) 99111-2233', obs: 'Gosta de streetwear e moletons.',   fav: true  },
  { id: 2, nome: 'Mariana Oliveira',  tel: '(61) 98222-3344', obs: 'Sempre compra vestidos e bolsas.',  fav: false },
  { id: 3, nome: 'Gabriel Santos',    tel: '(61) 97333-4455', obs: 'Fã de tênis e acessórios.',         fav: false },
  { id: 4, nome: 'Isabela Costa',     tel: '(61) 96444-5566', obs: 'VIP — indica muito. Gosta de jeans.', fav: true },
  { id: 5, nome: 'Pedro Almeida',     tel: '(61) 95555-6677', obs: 'Compra para a família inteira.',    fav: false },
];

export const PED0: Pedido[] = [
  { id: 2001, cliId: 1, cliNome: 'Lucas Ferreira',   itens: [{ prodId: 'mas_moletom', qtd: 1, vUnit: 149 }], vTotal: 149, pagamento: 'pix',      data: hoje(),    prazo: dPlus(5), st: 'encomendado', sinal: 80,  obs: 'Tamanho G.' },
  { id: 2002, cliId: 2, cliNome: 'Mariana Oliveira', itens: [{ prodId: 'fem_vestido', qtd: 1, vUnit: 129 }, { prodId: 'aces_bolsa', qtd: 1, vUnit: 139 }], vTotal: 268, pagamento: 'credito', data: hoje(), prazo: dPlus(7), st: 'confirmado', sinal: 130, obs: '' },
  { id: 2003, cliId: 3, cliNome: 'Gabriel Santos',   itens: [{ prodId: 'cal_tenis',   qtd: 1, vUnit: 189 }], vTotal: 189, pagamento: 'pix',      data: hoje(),    prazo: dPlus(3), st: 'chegou',      sinal: 189, obs: 'Número 42. Pronto para retirar.' },
  { id: 2004, cliId: 4, cliNome: 'Isabela Costa',    itens: [{ prodId: 'fem_jaqueta', qtd: 1, vUnit: 159 }], vTotal: 159, pagamento: 'dinheiro', data: dPlus(-2), prazo: dPlus(2), st: 'orcamento',   sinal: 0,   obs: 'Aguardando confirmação de tamanho.' },
  { id: 2005, cliId: 5, cliNome: 'Pedro Almeida',    itens: [{ prodId: 'inf_conj',    qtd: 2, vUnit: 79  }, { prodId: 'inf_tenis', qtd: 1, vUnit: 109 }], vTotal: 267, pagamento: 'pix', data: dPlus(-1), prazo: dPlus(4), st: 'encomendado', sinal: 150, obs: 'Para os filhos.' },
];

export const FIN0: Lanc[] = [
  { id: 1, tipo: 'entrada', desc: 'Sinal Moletom — Lucas Ferreira',      valor: 80,  data: hoje()    },
  { id: 2, tipo: 'entrada', desc: 'Sinal Vestido + Bolsa — Mariana',     valor: 130, data: hoje()    },
  { id: 3, tipo: 'entrada', desc: 'Tênis Chunky — Gabriel Santos',       valor: 189, data: dPlus(-2) },
  { id: 4, tipo: 'saida',   desc: 'Reposição estoque feminino',          valor: 420, data: dPlus(-3) },
  { id: 5, tipo: 'saida',   desc: 'Frete fornecedor calçados',           valor: 85,  data: dPlus(-4) },
];
