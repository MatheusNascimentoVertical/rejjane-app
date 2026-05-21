import { useState, useEffect } from 'react';
import { collection, doc, getDocs, setDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { db } from './lib/firebase';
import { CFG0, PROX, getProd } from './data/constants';
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

function syncArr<T extends { id: number }>(col: string, prev: T[], next: T[]) {
  const prevMap = new Map(prev.map(x => [x.id, x]));
  const nextMap = new Map(next.map(x => [x.id, x]));
  for (const [id, item] of nextMap) {
    const old = prevMap.get(id);
    if (!old || JSON.stringify(old) !== JSON.stringify(item))
      setDoc(doc(db, col, String(id)), item);
  }
  for (const [id] of prevMap)
    if (!nextMap.has(id)) deleteDoc(doc(db, col, String(id)));
}

export default function App() {
  const [aba, setAba] = useState<Aba>('dash');
  const [peds, setPedsS] = useState<Pedido[]>([]);
  const [clis, setClisS] = useState<Cliente[]>([]);
  const [fin,  setFinS]  = useState<Lanc[]>([]);
  const [cfg,  setCfgS]  = useState<ConfigType>(CFG0);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<ModalState | null>(null);
  const [fSt,  setFSt]  = useState('todos');
  const [search, setSearch] = useState('');
  const fechar = () => setModal(null);

  useEffect(() => {
    Promise.all([
      getDocs(collection(db, 'pedidos')),
      getDocs(collection(db, 'clientes')),
      getDocs(collection(db, 'lancamentos')),
      getDoc(doc(db, 'config', 'main')),
    ]).then(([ps, cs, fs, cfgSnap]) => {
      setPedsS(ps.docs.map(d => d.data() as Pedido));
      setClisS(cs.docs.map(d => d.data() as Cliente));
      setFinS(fs.docs.map(d => d.data() as Lanc));
      if (cfgSnap.exists()) setCfgS(cfgSnap.data() as ConfigType);
      else setDoc(doc(db, 'config', 'main'), CFG0);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const setPeds = (upd: React.SetStateAction<Pedido[]>) =>
    setPedsS(prev => { const next = typeof upd === 'function' ? upd(prev) : upd; syncArr('pedidos', prev, next); return next; });

  const setClis = (upd: React.SetStateAction<Cliente[]>) =>
    setClisS(prev => { const next = typeof upd === 'function' ? upd(prev) : upd; syncArr('clientes', prev, next); return next; });

  const setFin = (upd: React.SetStateAction<Lanc[]>) =>
    setFinS(prev => { const next = typeof upd === 'function' ? upd(prev) : upd; syncArr('lancamentos', prev, next); return next; });

  const setCfg = (upd: React.SetStateAction<ConfigType>) =>
    setCfgS(prev => { const next = typeof upd === 'function' ? upd(prev) : upd; setDoc(doc(db, 'config', 'main'), next); return next; });

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
    peds, setPeds: setPeds as React.Dispatch<React.SetStateAction<Pedido[]>>,
    clis, setClis: setClis as React.Dispatch<React.SetStateAction<Cliente[]>>,
    fin,  setFin:  setFin  as React.Dispatch<React.SetStateAction<Lanc[]>>,
    cfg,  setCfg:  setCfg  as React.Dispatch<React.SetStateAction<ConfigType>>,
    modal, setModal, avancar, salvarPed,
    ativos, atrasados, recMes, despMes,
    fSt, setFSt, search, setSearch, fechar,
  };

  if (loading) return (
    <div className="bella-loading">
      <img src="/bella-logo.jpeg" alt="Bella" className="bella-loading-logo" />
      <p>Carregando…</p>
    </div>
  );

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
