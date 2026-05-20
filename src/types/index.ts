import type { Dispatch, SetStateAction } from 'react';

export type PedStatus = 'orcamento' | 'confirmado' | 'producao' | 'pronto' | 'entregue' | 'cancelado';
export type OpId = 'bella' | 'filha';
export type MsgKey = 'orcamento' | 'confirmado' | 'producao' | 'pronto' | 'entregue';

export type Cliente = {
  id: number;
  nome: string;
  tel: string;
  obs: string;
  fav: boolean;
};

export type Pedido = {
  id: number;
  cliId: number;
  cliNome: string;
  prodId: string;
  qtd: number;
  vUnit: number;
  vTotal: number;
  arte: string;
  op: OpId;
  data: string;
  prazo: string;
  st: PedStatus;
  sinal: number;
  obs: string;
};

export type Lanc = {
  id: number;
  tipo: 'entrada' | 'saida';
  desc: string;
  valor: number;
  data: string;
  op: string;
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
  | { tipo: 'ped'; dados?: Partial<Pedido> }
  | { tipo: 'cli'; dados: Partial<Cliente> }
  | { tipo: 'fin'; dados: { tipo: 'entrada' | 'saida' } }
  | { tipo: 'wpp'; ped: Pedido }
  | { tipo: 'oc'; ped: Pedido };

export type PedidoForm = {
  id?: number;
  cliId: string | number;
  prodId: string;
  qtd: number | string;
  vUnit: number | string;
  arte: string;
  op: OpId;
  data: string;
  prazo: string;
  sinal: number | string;
  st: PedStatus;
  obs: string;
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
};
