import { useState, useEffect, lazy, Suspense } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { collection, doc, getDocs, setDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { db, auth } from './lib/firebase';
import { CFG0, CLI0, FIN0, PED0, PRODS, PROX, setProdCache } from './data/constants';
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

const DEMO = import.meta.env.VITE_DEMO === 'true';

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
  const [loading, setLoading] = useState(!DEMO);
  const [modal, setModal] = useState<ModalState | null>(null);
  const [fSt,  setFSt]  = useState('todos');
  const [search, setSearch] = useState('');
  const fechar = () => setModal(null);

  useEffect(() => {
    if (!user) return;

    if (DEMO) {
      const ps = PRODS as Produto[];
      setPedsS(PED0);
      setClisS(CLI0);
      setFinS(FIN0);
      setCfgS(CFG0);
      setProdsS(ps);
      setProdCache(ps as Prod[]);
      return;
    }

    Promise.all([
      getDocs(collection(db, 'pedidos')),
      getDocs(collection(db, 'clientes')),
      getDocs(collection(db, 'lancamentos')),
      getDoc(doc(db, 'config', 'main')),
      getDocs(collection(db, 'produtos')),
    ]).then(([ps, cs, fs, cfgSnap, prSnap]) => {
      setPedsS(ps.docs.map(d => {
        const raw = d.data() as any;
        if (!raw.itens && raw.prodId)
          return { ...raw, itens: [{ prodId: raw.prodId, qtd: raw.qtd ?? 1, vUnit: raw.vUnit ?? 0 }] } as Pedido;
        return raw as Pedido;
      }));
      setClisS(cs.docs.map(d => d.data() as Cliente));
      setFinS(fs.docs.map(d => d.data() as Lanc));
      if (cfgSnap.exists()) {
        const loaded = cfgSnap.data() as ConfigType;
        const merged: ConfigType = { ...CFG0, ...loaded, msgs: { ...CFG0.msgs, ...loaded.msgs } };
        setCfgS(merged);
        if (!loaded.msgs?.cobranca) setDoc(doc(db, 'config', 'main'), merged);
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
    setPedsS(prev => {
      const next = typeof upd === 'function' ? upd(prev) : upd;
      if (!DEMO) syncArr('pedidos', prev, next);
      return next;
    });

  const setClis = (upd: React.SetStateAction<Cliente[]>) =>
    setClisS(prev => {
      const next = typeof upd === 'function' ? upd(prev) : upd;
      if (!DEMO) syncArr('clientes', prev, next);
      return next;
    });

  const setFin = (upd: React.SetStateAction<Lanc[]>) =>
    setFinS(prev => {
      const next = typeof upd === 'function' ? upd(prev) : upd;
      if (!DEMO) syncArr('lancamentos', prev, next);
      return next;
    });

  const setCfg = (upd: React.SetStateAction<ConfigType>) =>
    setCfgS(prev => {
      const next = typeof upd === 'function' ? upd(prev) : upd;
      if (!DEMO) setDoc(doc(db, 'config', 'main'), next);
      return next;
    });

  const setProds = (upd: React.SetStateAction<Produto[]>) =>
    setProdsS(prev => {
      const next = typeof upd === 'function' ? upd(prev) : upd;
      if (!DEMO) syncProds(prev, next);
      setProdCache(next as Prod[]);
      return next;
    });

  const zerarDados = async () => {
    if (!DEMO) {
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
    }
    setPedsS([]);
    setClisS([]);
    setFinS([]);
  };

  const sair = () => DEMO ? window.location.reload() : signOut(auth);

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
      if (rest > 0) setFin(f => [{ id: Date.now(), tipo: 'entrada', desc: `Pgto final — ${p.cliNome}`, valor: rest, data: hoje() }, ...f]);
    }
    return { ...p, st: prox };
  }));

  const salvarPed = (f: PedidoForm) => {
    const cli  = clis.find(c => c.id === Number(f.cliId));
    const total = f.itens.reduce((s, it) => s + it.qtd * it.vUnit, 0);
    const obj: Pedido = {
      id:        f.id || Date.now(),
      cliId:     Number(f.cliId),
      cliNome:   cli?.nome || '',
      itens:     f.itens,
      vTotal:    total,
      pagamento: f.pagamento,
      data:      f.data,
      prazo:     f.prazo,
      st:        f.st,
      sinal:     Number(f.sinal) || 0,
      obs:       f.obs,
      ...(f.vencimento ? { vencimento: f.vencimento } : {}),
      ...(f.parcelas?.length ? { parcelas: f.parcelas } : {}),
    };
    if (f.id) {
      setPeds(p => p.map(x => x.id === f.id ? obj : x));
    } else {
      setPeds(p => [obj, ...p]);
      if (obj.sinal > 0) setFin(fn => [{ id: Date.now() + 1, tipo: 'entrada', desc: `Sinal — ${cli?.nome}`, valor: obj.sinal, data: hoje() }, ...fn]);
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

  if (authLoading) return <LoadingScreen />;
  if (!user) return <Login />;
  if (loading) return <LoadingScreen />;

  return (
    <div className="rj-app">
      {DEMO && (
        <div style={{ position: 'fixed', bottom: 16, right: 16, zIndex: 9999, background: 'var(--rose)', color: '#fff', fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20, letterSpacing: '0.05em', opacity: 0.85, pointerEvents: 'none' }}>
          MODO DEMO
        </div>
      )}
      <BackgroundDecor />
      <Sidebar aba={aba} setAba={setAba} atrasados={atrasados} cfg={cfg} />
      <main className="rj-main">
        <Topbar aba={aba} ctx={ctx} />
        <Suspense fallback={<div className="page-loading" />}>
          <AnimatePresence mode="wait">
            <motion.div
              key={aba}
              className="page-transition"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            >
              {aba === 'dash'     && <Dashboard ctx={ctx} setAba={setAba} />}
              {aba === 'pedidos'  && <Pedidos   ctx={ctx} />}
              {aba === 'clientes' && <Clientes  ctx={ctx} />}
              {aba === 'catalogo' && <Catalogo  ctx={ctx} />}
              {aba === 'caixa'    && <Caixa     ctx={ctx} />}
              {aba === 'config'   && <Config    ctx={ctx} />}
            </motion.div>
          </AnimatePresence>
        </Suspense>
      </main>
      <BottomNav aba={aba} setAba={setAba} atrasados={atrasados} />
      <ModalRoot ctx={ctx} />
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="rj-loading">
      <motion.div
        animate={{ scale: [1, 1.06, 1], rotate: [0, 3, -3, 0] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
      >
        <img src="/rejjane-logo.jpeg" alt="Rejjanevendas" className="rj-loading-logo" />
      </motion.div>
      <motion.div
        style={{ display: 'flex', gap: 6 }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        {[0, 1, 2].map(i => (
          <motion.span
            key={i}
            style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--rose)', display: 'block' }}
            animate={{ y: [0, -8, 0], opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.18, ease: 'easeInOut' }}
          />
        ))}
      </motion.div>
    </div>
  );
}
