import { useState } from 'react';
import { useLocalStorage } from './hooks/useLocalStorage';
import { CLI0, PED0, FIN0, CFG0, PROX, getProd } from './data/constants';
import { hoje } from './lib/helpers';
import { BackgroundDecor } from './components/BackgroundDecor';
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { BottomNav } from './components/BottomNav';
import { Dashboard } from './pages/Dashboard';
import { Pedidos } from './pages/Pedidos';
import { Clientes } from './pages/Clientes';
import { Catalogo } from './pages/Catalogo';
import { Caixa } from './pages/Caixa';
import { Config } from './pages/Config';
import { ModalRoot } from './modals/ModalRoot';
import type { Cliente, Pedido, Lanc, Config as ConfigType, ModalState, AppCtx, PedidoForm } from './types';

export type Aba = 'dash' | 'pedidos' | 'clientes' | 'catalogo' | 'caixa' | 'config';

export default function App() {
  const [aba, setAba] = useState<Aba>('dash');
  const [peds, setPeds] = useLocalStorage<Pedido[]>('bella_peds', PED0);
  const [clis, setClis] = useLocalStorage<Cliente[]>('bella_clis', CLI0);
  const [fin,  setFin]  = useLocalStorage<Lanc[]>('bella_fin', FIN0);
  const [cfg,  setCfg]  = useLocalStorage<ConfigType>('bella_cfg', CFG0);
  const [modal, setModal] = useState<ModalState | null>(null);
  const [fSt,  setFSt]  = useState('todos');
  const [search, setSearch] = useState('');
  const fechar = () => setModal(null);

  const mes = hoje().slice(0, 7);
  const recMes  = fin.filter(f => f.tipo === 'entrada' && f.data.startsWith(mes)).reduce((a, b) => a + b.valor, 0);
  const despMes = fin.filter(f => f.tipo === 'saida'   && f.data.startsWith(mes)).reduce((a, b) => a + b.valor, 0);
  const ativos    = peds.filter(p => p.st !== 'entregue' && p.st !== 'cancelado');
  const atrasados = ativos.filter(p => p.prazo < hoje());

  const avancar = (id: number) => setPeds(prev => prev.map(p => {
    if (p.id !== id) return p;
    const prox = PROX[p.st];
    if (!prox) return p;
    if (prox === 'entregue') {
      const rest = p.vTotal - p.sinal;
      if (rest > 0) setFin(f => [{ id: Date.now(), tipo: 'entrada', desc: `Pgto final — ${p.cliNome}`, valor: rest, data: hoje(), op: p.op }, ...f]);
    }
    return { ...p, st: prox };
  }));

  const salvarPed = (f: PedidoForm) => {
    const prod = getProd(String(f.prodId));
    const cli  = clis.find(c => c.id === Number(f.cliId));
    const total = (Number(f.qtd) || 1) * (Number(f.vUnit) || prod?.preco || 0);
    const obj: Pedido = {
      id:      f.id || Date.now(),
      cliId:   Number(f.cliId),
      cliNome: cli?.nome || '',
      prodId:  String(f.prodId),
      qtd:     Number(f.qtd),
      vUnit:   Number(f.vUnit),
      vTotal:  total,
      arte:    f.arte,
      op:      f.op,
      data:    f.data,
      prazo:   f.prazo,
      st:      f.st,
      sinal:   Number(f.sinal) || 0,
      obs:     f.obs,
    };
    if (f.id) {
      setPeds(p => p.map(x => x.id === f.id ? obj : x));
    } else {
      setPeds(p => [obj, ...p]);
      if (obj.sinal > 0) setFin(fn => [{ id: Date.now() + 1, tipo: 'entrada', desc: `Sinal — ${cli?.nome}`, valor: obj.sinal, data: hoje(), op: obj.op }, ...fn]);
    }
    fechar();
  };

  const ctx: AppCtx = {
    peds, setPeds, clis, setClis, fin, setFin, cfg, setCfg,
    modal, setModal, avancar, salvarPed,
    ativos, atrasados, recMes, despMes,
    fSt, setFSt, search, setSearch, fechar,
  };

  return (
    <div className="bella-app">
      <BackgroundDecor />
      <Sidebar aba={aba} setAba={setAba} atrasados={atrasados} cfg={cfg} />
      <main className="bella-main">
        <Topbar aba={aba} ctx={ctx} />
        {aba === 'dash'     && <Dashboard ctx={ctx} setAba={setAba} />}
        {aba === 'pedidos'  && <Pedidos   ctx={ctx} />}
        {aba === 'clientes' && <Clientes  ctx={ctx} />}
        {aba === 'catalogo' && <Catalogo  ctx={ctx} />}
        {aba === 'caixa'    && <Caixa     ctx={ctx} />}
        {aba === 'config'   && <Config    ctx={ctx} />}
      </main>
      <BottomNav aba={aba} setAba={setAba} atrasados={atrasados} />
      <ModalRoot ctx={ctx} />
    </div>
  );
}
