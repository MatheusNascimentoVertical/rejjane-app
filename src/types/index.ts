import type { Dispatch, SetStateAction } from 'react';

export type PedStatus = 'orcamento' | 'confirmado' | 'encomendado' | 'chegou' | 'entregue' | 'cancelado';
export type MsgKey = 'orcamento' | 'confirmado' | 'encomendado' | 'chegou' | 'entregue' | 'cobranca';
export type Pagamento = 'pix' | 'credito' | 'dinheiro';

export type Produto = {
  id: string;
  nome: string;
  cat: string;
  marca: string;
  icon: string;
  preco: number;
  precoDe?: number;
  descricao: string;
  estoque: number;
  fotoUrl?: string;
  ativo: boolean;
  destaque?: boolean;
};

export type Cliente = {
  id: number;
  nome: string;
  tel: string;
  obs: string;
  fav: boolean;
};

export type PedItem = {
  prodId: string;
  qtd: number;
  vUnit: number;
};

export type Parcela = {
  valor: number;
  data: string;
  pago: boolean;
};

export type Pedido = {
  id: number;
  cliId: number;
  cliNome: string;
  itens: PedItem[];
  vTotal: number;
  pagamento: Pagamento;
  data: string;
  prazo: string;
  st: PedStatus;
  sinal: number;
  obs: string;
  vencimento?: string;
  parcelas?: Parcela[];
};

export type Lanc = {
  id: number;
  tipo: 'entrada' | 'saida';
  desc: string;
  valor: number;
  data: string;
};

export type Config = {
  nomeEmpresa: string;
  slogan: string;
  telefone: string;
  instagram: string;
  cidade: string;
  msgs: Record<MsgKey, string>;
};

export type ModalState =
  | { tipo: 'ped';  dados?: Partial<Pedido> }
  | { tipo: 'cli';  dados: Partial<Cliente> }
  | { tipo: 'fin';  dados: { tipo: 'entrada' | 'saida' } }
  | { tipo: 'wpp';  ped: Pedido; msgTipo?: MsgKey }
  | { tipo: 'oc';   ped: Pedido }
  | { tipo: 'prod'; dados?: Partial<Produto> };

export type PedidoForm = {
  id?: number;
  cliId: string | number;
  itens: PedItem[];
  pagamento: Pagamento;
  data: string;
  prazo: string;
  sinal: number | string;
  st: PedStatus;
  obs: string;
  vencimento?: string;
  parcelas?: Parcela[];
};


export type AppCtx = {
  peds: Pedido[];
  setPeds: Dispatch<SetStateAction<Pedido[]>>;
  clis: Cliente[];
  setClis: Dispatch<SetStateAction<Cliente[]>>;
  fin: Lanc[];
  setFin: Dispatch<SetStateAction<Lanc[]>>;
  cfg: Config;
  setCfg: Dispatch<SetStateAction<Config>>;
  modal: ModalState | null;
  setModal: Dispatch<SetStateAction<ModalState | null>>;
  avancar: (id: number) => void;
  salvarPed: (f: PedidoForm) => void;
  ativos: Pedido[];
  atrasados: Pedido[];
  recMes: number;
  despMes: number;
  fSt: string;
  setFSt: Dispatch<SetStateAction<string>>;
  search: string;
  setSearch: Dispatch<SetStateAction<string>>;
  fechar: () => void;
  prods: Produto[];
  setProds: Dispatch<SetStateAction<Produto[]>>;
  zerarDados: () => Promise<void>;
  sair: () => void;
};
