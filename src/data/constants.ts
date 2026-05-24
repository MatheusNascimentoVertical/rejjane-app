import { hoje, dPlus } from '../lib/helpers';
import type { Cliente, Pedido, Lanc, Config, PedStatus } from '../types';

export type Prod = {
  id: string;
  nome: string;
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

export type Op = { id: string; nome: string; cor: string };
export type StCfg = { label: string; cor: string; bg: string };

export const PRODS: Prod[] = [
  { id: 'cam_a', nome: 'Camiseta Adulto',     preco: 35,  icon: '👕',    cat: 'Camisetas', descricao: '', estoque: 0, ativo: true },
  { id: 'cam_i', nome: 'Camiseta Infantil',   preco: 30,  icon: '👕',    cat: 'Camisetas', descricao: '', estoque: 0, ativo: true },
  { id: 'body',  nome: 'Body Bebê',            preco: 30,  icon: '🍼',    cat: 'Camisetas', descricao: '', estoque: 0, ativo: true },
  { id: 'can_c', nome: 'Caneca Cerâmica',      preco: 35,  icon: '☕',    cat: 'Canecas',   descricao: '', estoque: 0, ativo: true },
  { id: 'can_v', nome: 'Caneca de Vidro',      preco: 30,  icon: '🥛',    cat: 'Canecas',   descricao: '', estoque: 0, ativo: true },
  { id: 'can_m', nome: 'Caneca Mágica',        preco: 40,  icon: '✨',    cat: 'Canecas',   descricao: '', estoque: 0, ativo: true },
  { id: 'almo',  nome: 'Almofada',             preco: 45,  icon: '🛋️',   cat: 'Decoração', descricao: '', estoque: 0, ativo: true },
  { id: 'sque',  nome: 'Squeeze',              preco: 40,  icon: '🧴',    cat: 'Decoração', descricao: '', estoque: 0, ativo: true },
  { id: 'placa', nome: 'Placa Decorativa',     preco: 35,  icon: '🖼️',   cat: 'Decoração', descricao: '', estoque: 0, ativo: true },
  { id: 'quad',  nome: 'Quadro A4',            preco: 50,  icon: '🖼️',   cat: 'Decoração', descricao: '', estoque: 0, ativo: true },
  { id: 'mouse', nome: 'Mousepad',             preco: 30,  icon: '🖱️',   cat: 'Decoração', descricao: '', estoque: 0, ativo: true },
  { id: 'k_mae', nome: 'Kit Mãe (cam+caneca)', preco: 65,  icon: '🎁',    cat: 'Kits',      descricao: '', estoque: 0, ativo: true },
  { id: 'k_cas', nome: 'Kit Casal',            preco: 70,  icon: '💑',    cat: 'Kits',      descricao: '', estoque: 0, ativo: true },
  { id: 'k_fam', nome: 'Kit Família',          preco: 120, icon: '👨‍👩‍👧', cat: 'Kits',      descricao: '', estoque: 0, ativo: true },
];

let _prodCache: Prod[] = [...PRODS];

export function setProdCache(prods: Prod[]) {
  _prodCache = prods;
}

export const getProd = (id: string): Prod | undefined => _prodCache.find(p => p.id === id);

export const OPS: Op[] = [
  { id: 'bella', nome: 'Bella', cor: '#c97d6e' },
  { id: 'filha', nome: 'Filha', cor: '#b8826a' },
];

export const ST: Record<string, StCfg> = {
  orcamento:  { label: 'Orçamento',   cor: '#9a7cb5', bg: '#efe7f5' },
  confirmado: { label: 'Confirmado',  cor: '#c98b3e', bg: '#fbf2e3' },
  producao:   { label: 'Em Produção', cor: '#d97a4a', bg: '#fbeadf' },
  pronto:     { label: 'Pronto',      cor: '#5a9b7a', bg: '#e6f1ea' },
  entregue:   { label: 'Entregue',    cor: '#7a96b8', bg: '#e8eef5' },
  cancelado:  { label: 'Cancelado',   cor: '#b87878', bg: '#f5e4e4' },
};

export const PROX: Partial<Record<PedStatus, PedStatus>> = {
  orcamento: 'confirmado',
  confirmado: 'producao',
  producao: 'pronto',
  pronto: 'entregue',
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
  nomeEmpresa: 'Bella Personalizados',
  slogan: 'Personalizados com amor',
  telefone: '(61) 99999-9999',
  instagram: '@bellapersonalizados',
  cidade: 'Valparaíso de Goiás - GO',
  ops: [
    { id: 'bella', nome: 'Bella', cor: '#c97d6e' },
    { id: 'filha', nome: 'Filha', cor: '#b8826a' },
  ],
  msgs: {
    confirmado: 'Olá {nome}! 🌸 Seu pedido de *{produto}* foi confirmado! Prazo: *{prazo}*. Total: *{total}*. Sinal: *{sinal}*. Restante: *{restante}*. Qualquer dúvida, é só chamar! 💕',
    producao:   'Olá {nome}! 🎨 Seu pedido de *{produto}* entrou em produção! Prazo: *{prazo}*. 🌸',
    pronto:     'Olá {nome}! ✨ Seu pedido de *{produto}* está *PRONTO*! Restante: *{restante}*. Te aguardamos! 💕',
    entregue:   'Olá {nome}! 🌹 Pedido entregue! Obrigada pela confiança. Avaliação: {instagram}. 💕',
    orcamento:  'Olá {nome}! 🌸 Orçamento Bella:\n\nProduto: *{produto}*\nQtd: *{qtd}* un\nArte: _{arte}_\nUnit.: *{vUnit}*\nTotal: *{total}*\nPrazo: *{prazo}*\n\nPara confirmar, basta responder! 💕',
  },
};

export const CLI0: Cliente[] = [
  { id: 1, nome: 'Ana Paula Souza',   tel: '(61) 99111-2233', obs: 'Prefere kits. Aniversário em julho.',  fav: true  },
  { id: 2, nome: 'Carla Santos',      tel: '(61) 98222-3344', obs: 'Canecas todo mês das Mães.',           fav: false },
  { id: 3, nome: 'Renata Lima',       tel: '(61) 97333-4455', obs: 'Camisetas família.',                   fav: false },
  { id: 4, nome: 'Juliana Costa',     tel: '(61) 96444-5566', obs: 'VIP — indica muito.',                  fav: true  },
  { id: 5, nome: 'Bia Carvalho',      tel: '(61) 95555-6677', obs: 'Caneca vidro com nome.',               fav: false },
  { id: 6, nome: 'Marina Oliveira',   tel: '(61) 94444-7788', obs: 'Aniversário do filho — Setembro.',     fav: false },
];

export const PED0: Pedido[] = [
  { id: 1024, cliId: 1, cliNome: 'Ana Paula Souza',  itens: [{ prodId: 'k_mae', qtd: 2, vUnit: 65  }], vTotal: 130, arte: 'Kit mãe e filho — coração azul com flores',         op: 'bella', data: hoje(),    prazo: dPlus(3),  st: 'producao',   sinal: 65, obs: 'Arte aprovada. Urgente!' },
  { id: 1023, cliId: 2, cliNome: 'Carla Santos',     itens: [{ prodId: 'can_c', qtd: 3, vUnit: 35  }], vTotal: 105, arte: 'Canecas Dia das Mães — 3 modelos coloridos',         op: 'filha', data: hoje(),    prazo: dPlus(5),  st: 'confirmado', sinal: 50, obs: '' },
  { id: 1022, cliId: 3, cliNome: 'Renata Lima',      itens: [{ prodId: 'cam_a', qtd: 5, vUnit: 35  }], vTotal: 175, arte: 'Camisetas família — nomes + emoji',                  op: 'bella', data: hoje(),    prazo: dPlus(7),  st: 'orcamento',  sinal: 0,  obs: 'Aguardando arte final.' },
  { id: 1021, cliId: 4, cliNome: 'Juliana Costa',    itens: [{ prodId: 'can_v', qtd: 1, vUnit: 30  }], vTotal: 30,  arte: 'Caneca vidro — nome Bia em script + flores rosas',   op: 'filha', data: dPlus(-2), prazo: dPlus(-1), st: 'pronto',     sinal: 30, obs: 'Pronto pra retirar.' },
  { id: 1020, cliId: 5, cliNome: 'Bia Carvalho',     itens: [{ prodId: 'cam_i', qtd: 2, vUnit: 30  }], vTotal: 60,  arte: 'Camisetas chicletinho da mamãe',                     op: 'bella', data: dPlus(-1), prazo: dPlus(2),  st: 'producao',   sinal: 30, obs: '' },
  { id: 1019, cliId: 6, cliNome: 'Marina Oliveira',  itens: [{ prodId: 'almo',  qtd: 1, vUnit: 45  }], vTotal: 45,  arte: 'Almofada coração — foto família',                    op: 'filha', data: dPlus(-3), prazo: dPlus(4),  st: 'confirmado', sinal: 20, obs: 'Cliente envia foto até quinta.' },
  { id: 1018, cliId: 1, cliNome: 'Ana Paula Souza',  itens: [{ prodId: 'can_m', qtd: 2, vUnit: 40  }], vTotal: 80,  arte: 'Caneca mágica — surpresa aniversário',               op: 'bella', data: dPlus(-5), prazo: dPlus(-4), st: 'entregue',   sinal: 80, obs: '' },
];

export const FIN0: Lanc[] = [
  { id: 1, tipo: 'entrada', desc: 'Sinal Kit Mãe — Ana Paula',      valor: 65,  data: hoje(),    op: 'bella' },
  { id: 2, tipo: 'entrada', desc: 'Sinal Canecas — Carla Santos',   valor: 50,  data: hoje(),    op: 'filha' },
  { id: 3, tipo: 'entrada', desc: 'Caneca Vidro — Juliana Costa',   valor: 30,  data: dPlus(-2), op: 'filha' },
  { id: 4, tipo: 'entrada', desc: 'Caneca Mágica — Ana Paula',      valor: 80,  data: dPlus(-4), op: 'bella' },
  { id: 5, tipo: 'saida',   desc: 'Papel sublimático A4 (500fls)',   valor: 120, data: dPlus(-3), op: 'bella' },
  { id: 6, tipo: 'saida',   desc: 'Tinta sublimática (kit cores)',   valor: 180, data: dPlus(-5), op: 'bella' },
  { id: 7, tipo: 'saida',   desc: 'Canecas em branco (cx 36un)',     valor: 90,  data: dPlus(-4), op: 'filha' },
  { id: 8, tipo: 'saida',   desc: 'Camisetas brancas (15un)',        valor: 165, data: dPlus(-7), op: 'bella' },
];
