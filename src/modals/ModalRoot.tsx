import { AnimatePresence } from 'framer-motion';
import { MPed } from './MPed';
import { MCli } from './MCli';
import { MFin } from './MFin';
import { MWpp } from './MWpp';
import { MOrc } from './MOrc';
import { MCatalogo } from './MCatalogo';
import type { AppCtx } from '../types';

type Props = { ctx: AppCtx };

export function ModalRoot({ ctx }: Props) {
  const { modal, fechar } = ctx;
  return (
    <AnimatePresence>
      {modal && (
        <div key={modal.tipo + ('dados' in modal && modal.dados && 'id' in modal.dados ? modal.dados.id : 'ped' in modal ? modal.ped.id : 'new')}>
          {modal.tipo === 'ped'  && <MPed      dados={modal.dados} ctx={ctx} onClose={fechar} />}
          {modal.tipo === 'cli'  && <MCli      dados={modal.dados} ctx={ctx} onClose={fechar} />}
          {modal.tipo === 'fin'  && <MFin      dados={modal.dados} ctx={ctx} onClose={fechar} />}
          {modal.tipo === 'wpp'  && <MWpp      ped={modal.ped}     ctx={ctx} onClose={fechar} tipoPadrao={modal.msgTipo} />}
          {modal.tipo === 'oc'   && <MOrc      ped={modal.ped}     ctx={ctx} onClose={fechar} />}
          {modal.tipo === 'prod' && <MCatalogo dados={modal.dados} ctx={ctx} onClose={fechar} />}
        </div>
      )}
    </AnimatePresence>
  );
}
