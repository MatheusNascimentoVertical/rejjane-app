import type { Config, Pedido } from '../types';
import { getProd } from '../data/constants';

export const hoje = (): string => new Date().toISOString().split('T')[0];

export const fmtData = (d: string): string =>
  new Date(d + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });

export const fmtDataLong = (d: string): string =>
  new Date(d + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });

export const fmtR$ = (v: number | string): string =>
  `R$ ${Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

export const ini = (s: string): string =>
  typeof s === 'string' && s.length > 0 ? s[0].toUpperCase() : '?';

export const dPlus = (n: number): string => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
};

export const diasAte = (d: string): number =>
  Math.ceil((new Date(d + 'T00:00:00').getTime() - new Date(hoje() + 'T00:00:00').getTime()) / 86400000);

export function aplicarMsg(template: string, ped: Pedido, cfg: Config): string {
  const itensStr = (ped.itens ?? []).map(item => {
    const prod = getProd(item.prodId);
    return `${prod?.icon ?? ''} ${prod?.nome ?? ''} ×${item.qtd}`;
  }).join(', ');
  const first = ped.itens?.[0];
  const firstProd = getProd(first?.prodId ?? '');
  const rest = ped.vTotal - ped.sinal;
  return (template || '')
    .replace(/{nome}/g, ped.cliNome)
    .replace(/{produto}/g, itensStr || firstProd?.nome || '')
    .replace(/{arte}/g, ped.arte || '')
    .replace(/{qtd}/g, String(first?.qtd ?? ''))
    .replace(/{vUnit}/g, fmtR$(first?.vUnit ?? 0))
    .replace(/{total}/g, fmtR$(ped.vTotal))
    .replace(/{sinal}/g, fmtR$(ped.sinal))
    .replace(/{restante}/g, fmtR$(rest > 0 ? rest : 0))
    .replace(/{prazo}/g, new Date(ped.prazo + 'T00:00:00').toLocaleDateString('pt-BR'))
    .replace(/{instagram}/g, cfg.instagram || '')
    .replace(/{empresa}/g, cfg.nomeEmpresa || '');
}
