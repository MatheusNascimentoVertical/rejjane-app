import { useState, useEffect, lazy, Suspense } from 'react';
import { collection, doc, getDocs, setDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { db, auth } from './lib/firebase';
import { CFG0, PRODS, PROX, setProdCache } from './data/constants';
import type { Prod } from './data/constants';
import { hoje } from './lib/helpers';
import { useAuth } from './hooks/useAuth';
import { BackgroundDecor } from './components/BackgroundDecor';
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { BottomNav } from './components/BottomNav';
import { Login } from './pages/Login';
import { ModalRoot } from './modals/ModalRoot';

const Dashboard = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const Pedidos   = lazy(() => import('./pages/Pedidos').then(m => ({ default: m.Pedidos })));
const Clientes  = lazy(() => import('./pages/Clientes').then(m => ({ default: m.Clientes })));
const Catalogo  = lazy(() => import('./pages/Catalogo').then(m => ({ default: m.Catalogo })));
const Caixa     = lazy(() => import('./pages/Caixa').then(m => ({ default: m.Caixa })));
const Config    = lazy(() => import('./pages/Config').then(m => ({ default: m.Config })));
import type { Cliente, Pedido, Lanc, Config as ConfigType, ModalState, AppCtx, PedidoForm, Produto } from './types';

export type Aba = 'dash' | 'pedidos' | 'clientes' | 'catalogo' | 'caixa' | 'config';

function clean<T extends object>(obj: T): T {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined)
  ) as T;
}

function syncArr<T extends { id: number }>(col: string, prev: T[], next: T[]) {
  const prevMap = new Map(prev.map(x => [x.id, x]));
  const nextMap = new Map(next.map(x => [x.id, x]));
  for (const [id, item] of nextMap) {
    const old = prevMap.get(id);
    if (!old || JSON.stringify(old) !== JSON.stringify(item))
      setDoc(doc(db, col, String(id)), clean(item));
  }
  for (const [id] of prevMap)
    if (!nextMap.has(id)) deleteDoc(doc(db, col, String(id)));
}

function syncProds(prev: Produto[], next: Produto[]) {
  const prevMap = new Map(prev.map(x => [x.id, x]));
  const nextMap = new Map(next.map(x => [x.id, x]));
  for (const [id, item] of nextMap) {
    const old = prevMap.get(id);
    if (!old || JSON.stringify(old) !== JSON.stringify(item))
      setDoc(doc(db, 'produtos', id), clean(item));
  }
  for (const [id] of prevMap)
    if (!nextMap.has(id)) deleteDoc(doc(db, 'produtos', id));
}

export default function App() {
  const { user, loading: authLoading } = useAuth();

  const [aba, setAba] = useState<Aba>('dash');
  const [peds, setPedsS]   = useState<Pedido[]>([]);
  const [clis, setClisS]   = useState<Cliente[]>([]);
  const [fin,  setFinS]    = useState<Lanc[]>([]);
  const [cfg,  setCfgS]    = useState<ConfigType>(CFG0);
  const [prodsS, setProdsS] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<ModalState | null>(null);
  const [fSt,  setFSt]  = useState('todos');
  const [search, setSearch] = useState('');
  const fechar = () => setModal(null);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      getDocs(collection(db, 'pedidos')),
      getDocs(collection(db, 'clientes')),
      getDocs(collection(db, 'lancamentos')),
      getDoc(doc(db, 'config', 'main')),
      getDocs(collection(db, 'produtos')),
    ]).then(([ps, cs, fs, cfgSnap, prSnap]) => {
      setPedsS(ps.docs.map(d => {
        const raw = d.data() as any;
        if (!raw.itens && raw.prodId) {
          return { ...raw, itens: [{ prodId: raw.prodId, qtd: raw.qtd ?? 1, vUnit: raw.vUnit ?? 0 }] } as Pedido;
        }
        return raw as Pedido;
      }));
      setClisS(cs.docs.map(d => d.data() as Cliente));
      setFinS(fs.docs.map(d => d.data() as Lanc));
      if (cfgSnap.exists()) {
        const cfgData = cfgSnap.data() as ConfigType;
        if (!cfgData.ops) cfgData.ops = CFG0.ops;
        setCfgS(cfgData);
      } else {
        setDoc(doc(db, 'config', 'main'), CFG0);
      }
      let loadedProds: Produto[];
      if (prSnap.empty) {
        loadedProds = PRODS.map(p => ({ ...p } as Produto));
        loadedProds.forEach(p => setDoc(doc(db, 'produtos', p.id), clean(p)));
      } else {
        loadedProds = prSnap.docs.map(d => d.data() as Produto);
      }
      setProdsS(loadedProds);
      setProdCache(loadedProds as Prod[]);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [user]);

  const setPeds = (upd: React.SetStateAction<Pedido[]>) =>
    setPedsS(prev => { const next = typeof upd === 'function' ? upd(prev) : upd; syncArr('pedidos', prev, next); return next; });

  const setClis = (upd: React.SetStateAction<Cliente[]>) =>
    setClisS(prev => { const next = typeof upd === 'function' ? upd(prev) : upd; syncArr('clientes', prev, next); return next; });

  const setFin = (upd: React.SetStateAction<Lanc[]>) =>
    setFinS(prev => { const next = typeof upd === 'function' ? upd(prev) : upd; syncArr('lancamentos', prev, next); return next; });

  const setCfg = (upd: React.SetStateAction<ConfigType>) =>
    setCfgS(prev => { const next = typeof upd === 'function' ? upd(prev) : upd; setDoc(doc(db, 'config', 'main'), next); return next; });

  const setProds = (upd: React.SetStateAction<Produto[]>) =>
    setProdsS(prev => {
      const next = typeof upd === 'function' ? upd(prev) : upd;
      syncProds(prev, next);
      setProdCache(next as Prod[]);
      return next;
    });

  const zerarDados = async () => {
    const [ps, cs, fs] = await Promise.all([
      getDocs(collection(db, 'pedidos')),
      getDocs(collection(db, 'clientes')),
      getDocs(collection(db, 'lancamentos')),
    ]);
    await Promise.all([
      ...ps.docs.map(d => deleteDoc(d.ref)),
      ...cs.docs.map(d => deleteDoc(d.ref)),
      ...fs.docs.map(d => deleteDoc(d.ref)),
    ]);
    setPedsS([]);
    setClisS([]);
    setFinS([]);
  };

  const sair = () => signOut(auth);

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
    const cli  = clis.find(c => c.id === Number(f.cliId));
    const total = f.itens.reduce((s, it) => s + it.qtd * it.vUnit, 0);
    const obj: Pedido = {
      id:      f.id || Date.now(),
      cliId:   Number(f.cliId),
      cliNome: cli?.nome || '',
      itens:   f.itens,
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
    prods: prodsS, setProds: setProds as React.Dispatch<React.SetStateAction<Produto[]>>,
    zerarDados, sair,
  };

  if (authLoading) return (
    <div className="bella-loading">
      <img src="/bella-logo.jpeg" alt="Bella" className="bella-loading-logo" />
      <p>Carregando…</p>
    </div>
  );

  if (!user) return <Login />;

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
        <Suspense fallback={<div className="page-loading" />}>
          {aba === 'dash'     && <Dashboard ctx={ctx} setAba={setAba} />}
          {aba === 'pedidos'  && <Pedidos   ctx={ctx} />}
          {aba === 'clientes' && <Clientes  ctx={ctx} />}
          {aba === 'catalogo' && <Catalogo  ctx={ctx} />}
          {aba === 'caixa'    && <Caixa     ctx={ctx} />}
          {aba === 'config'   && <Config    ctx={ctx} />}
        </Suspense>
      </main>
      <BottomNav aba={aba} setAba={setAba} atrasados={atrasados} />
      <ModalRoot ctx={ctx} />
    </div>
  );
}
