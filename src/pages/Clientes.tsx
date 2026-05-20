import { motion, AnimatePresence } from 'framer-motion';
import { ini, fmtR$ } from '../lib/helpers';
import type { AppCtx } from '../types';

type Props = { ctx: AppCtx };

export function Clientes({ ctx }: Props) {
  const { clis, peds, setModal, search } = ctx;
  const filt = clis.filter(c => !search || c.nome.toLowerCase().includes(search.toLowerCase()) || c.tel.includes(search));

  return (
    <div className="clientes">
      <div className="cli-grid">
        <AnimatePresence>
          {filt.map((c, i) => {
            const cp = peds.filter(p => p.cliId === c.id);
            const gasto = cp.reduce((a, b) => a + b.vTotal, 0);
            const ab = cp.filter(p => p.st !== 'entregue' && p.st !== 'cancelado').length;
            return (
              <motion.article
                key={c.id} layout className="cli-card"
                onClick={() => setModal({ tipo: 'cli', dados: { ...c } })}
                initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.94, transition: { duration: 0.2 } }}
                transition={{ duration: 0.42, type: 'spring', delay: Math.min(i, 8) * 0.05 }}
                whileHover={{ y: -3, scale: 1.012 }} whileTap={{ scale: 0.98 }}
              >
                <div className="cli-head">
                  <div className="cli-avatar">
                    <span>{ini(c.nome)}</span>
                    {c.fav && <div className="cli-fav" title="VIP">★</div>}
                  </div>
                  <div className="cli-head-info">
                    <h3>{c.nome}</h3>
                    <div className="cli-tel">{c.tel}</div>
                  </div>
                </div>
                <div className="cli-stats">
                  <div><strong>{cp.length}</strong><span>pedidos</span></div>
                  <div className="cli-divider" />
                  <div><strong>{fmtR$(gasto)}</strong><span>total</span></div>
                  <div className="cli-divider" />
                  <div><strong className={ab > 0 ? 'peach' : ''}>{ab}</strong><span>abertos</span></div>
                </div>
                {c.obs && <div className="cli-obs">💬 {c.obs}</div>}
              </motion.article>
            );
          })}
        </AnimatePresence>

        <motion.button
          className="cli-add"
          onClick={() => setModal({ tipo: 'cli', dados: { nome: '', tel: '', obs: '', fav: false } })}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
        >
          <div className="cli-add-plus">+</div>
          <span>Nova cliente</span>
        </motion.button>
      </div>
    </div>
  );
}
