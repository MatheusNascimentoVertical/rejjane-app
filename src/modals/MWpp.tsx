import { useState, useEffect } from 'react';
import { Sheet, Field } from './Sheet';
import { ST } from '../data/constants';
import { aplicarMsg } from '../lib/helpers';
import type { AppCtx, Pedido, MsgKey } from '../types';

type Props = { ped: Pedido; ctx: AppCtx; onClose: () => void };

function WppIcon() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="#fff"><path d="M17.5 14.4c-.3-.1-1.7-.8-1.9-.9-.3-.1-.5-.1-.7.1-.2.3-.7.9-.9 1.1-.2.2-.3.2-.6.1-.3-.1-1.2-.5-2.3-1.4-.9-.7-1.4-1.7-1.6-2-.2-.3 0-.4.1-.5.1-.1.3-.3.4-.5.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5l-.8-2c-.2-.5-.4-.5-.6-.5h-.6c-.2 0-.5.1-.7.4-.3.3-1 .9-1 2.3 0 1.4 1 2.7 1.2 2.9.2.2 2 3 4.8 4.2 1.7.7 2.3.8 3.1.6.5-.1 1.6-.6 1.8-1.3.2-.6.2-1.2.2-1.3-.1-.1-.3-.2-.6-.3zM12 2C6.5 2 2 6.5 2 12c0 1.7.5 3.4 1.3 4.8L2 22l5.3-1.3c1.4.7 2.9 1.1 4.5 1.1h.2c5.5 0 10-4.5 10-10S17.5 2 12 2z"/></svg>;
}

export function MWpp({ ped, ctx, onClose }: Props) {
  const { cfg, clis } = ctx;
  const msgKeys = Object.keys(cfg.msgs) as MsgKey[];
  const defaultKey: MsgKey = msgKeys.includes(ped.st as MsgKey) ? ped.st as MsgKey : 'confirmado';
  const [tipo, setTipo] = useState<MsgKey>(defaultKey);
  const [msg, setMsg] = useState(() => aplicarMsg(cfg.msgs[defaultKey], ped, cfg));

  useEffect(() => {
    setMsg(aplicarMsg(cfg.msgs[tipo], ped, cfg));
  }, [tipo]);

  const cli = clis.find(c => c.id === ped.cliId);

  const enviar = () => {
    const tel = (cli?.tel || '').replace(/\D/g, '');
    window.open(`https://wa.me/55${tel}?text=${encodeURIComponent(msg)}`, '_blank');
    onClose();
  };

  return (
    <Sheet title={`Mensagem para ${ped.cliNome}`} subtitle="WhatsApp" onClose={onClose} wide>
      <div className="wpp-tipos">
        {msgKeys.map(k => (
          <button key={k} className={`wpp-tipo${tipo === k ? ' active' : ''}`} onClick={() => setTipo(k)}>
            {ST[k]?.label || k}
          </button>
        ))}
      </div>
      <Field label="Mensagem (edite à vontade)">
        <textarea rows={8} value={msg} onChange={e => setMsg(e.target.value)} />
      </Field>
      <div className="wpp-preview">
        <div className="wpp-bubble">{msg}</div>
      </div>
      <div className="sheet-actions">
        <button className="btn-soft" onClick={onClose}>Cancelar</button>
        <button className="btn-wpp" onClick={enviar}><WppIcon /> Enviar pelo WhatsApp</button>
      </div>
    </Sheet>
  );
}
