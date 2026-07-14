import type { Produto, Config } from '../types';
import { fmtR$ } from './helpers';

/**
 * Layout WhatsApp Status 1080×1920
 *
 * y=0–320    Faixa rose (header decorativo — se o chrome cobrir, não importa)
 *   y=210    Logo circular (r=40) — abaixo da zona de risco do chrome (~136px)
 *   y=272    Nome da loja (branco)
 * y=320      Arco branco (transição)
 * y=345–1065 Foto do produto (720×720)
 * y=1085–    Info: marca, nome, preço, botão, rodapé  (max ~y=1620)
 */
export async function gerarImagemStatus(prod: Produto, cfg: Config): Promise<Blob> {
  const W = 1080, H = 1920;
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const c = canvas.getContext('2d')!;
  const cx = W / 2;

  await document.fonts.ready;

  // ── FUNDO GERAL (cream + blush) ───────────────────────────────────────────
  c.fillStyle = '#fff8f9';
  c.fillRect(0, 0, W, H);
  const bgGrad = c.createLinearGradient(0, H * 0.5, 0, H);
  bgGrad.addColorStop(0, 'rgba(252,228,236,0)');
  bgGrad.addColorStop(1, 'rgba(249,213,227,0.65)');
  c.fillStyle = bgGrad;
  c.fillRect(0, 0, W, H);

  // ── FAIXA ROSE (y=0–320) ─────────────────────────────────────────────────
  // Degradê rose do topo para baixo
  const bandGrad = c.createLinearGradient(0, 0, 0, 320);
  bandGrad.addColorStop(0, '#c2185b');
  bandGrad.addColorStop(1, '#e91e63');
  c.fillStyle = bandGrad;
  c.fillRect(0, 0, W, 320);

  // Círculos decorativos dentro da faixa
  c.save(); c.globalAlpha = 0.14; c.fillStyle = '#fff';
  c.beginPath(); c.arc(W * 0.88, -30, 240, 0, Math.PI * 2); c.fill();
  c.restore();
  c.save(); c.globalAlpha = 0.07; c.fillStyle = '#fff';
  c.beginPath(); c.arc(W * 0.12, 290, 180, 0, Math.PI * 2); c.fill();
  c.restore();

  // Arco branco na base da faixa (transição suave)
  c.save();
  c.fillStyle = '#fff8f9';
  c.beginPath();
  c.ellipse(cx, 325, W / 2 + 70, 68, 0, 0, Math.PI);
  c.fill();
  c.restore();

  // Logo circular — centro y=210, raio=40 (topo em y=170, abaixo dos ~136px de risco)
  const LCY = 210, LR = 40;
  // Anel branco
  c.save(); c.beginPath(); c.arc(cx, LCY, LR + 5, 0, Math.PI * 2);
  c.fillStyle = 'rgba(255,255,255,0.9)'; c.fill(); c.restore();
  // Imagem ou fallback
  try {
    const li = new Image(); li.crossOrigin = 'anonymous';
    await new Promise<void>((res, rej) => { li.onload = () => res(); li.onerror = () => rej(); li.src = '/rejjane-logo.jpeg'; });
    c.save(); c.beginPath(); c.arc(cx, LCY, LR, 0, Math.PI * 2); c.clip();
    const ls = (LR * 2) / Math.min(li.width, li.height);
    c.drawImage(li, cx - li.width * ls / 2, LCY - li.height * ls / 2, li.width * ls, li.height * ls);
    c.restore();
  } catch {
    c.save(); c.beginPath(); c.arc(cx, LCY, LR, 0, Math.PI * 2);
    c.fillStyle = '#f8bbd0'; c.fill(); c.restore();
  }

  // Nome da loja
  const storeName = cfg.nomeEmpresa || 'Rejjane Vendas';
  c.font = 'italic bold 52px Georgia, serif';
  c.fillStyle = '#fff'; c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillText(storeName, cx, 272);

  // Slogan (opcional, menor)
  if (cfg.slogan) {
    c.font = '500 22px Nunito, sans-serif';
    c.fillStyle = 'rgba(255,255,255,0.82)'; c.textBaseline = 'middle';
    c.fillText(cfg.slogan, cx, 306);
  }

  // ── FOTO  (y 345–1065, 720×720) ──────────────────────────────────────────
  const IS = 720, IPAD = (W - IS) / 2, IY = 345;

  // Sombra
  c.save();
  c.shadowColor = 'rgba(194,24,91,0.18)'; c.shadowBlur = 56; c.shadowOffsetY = 18;
  c.fillStyle = '#fff'; rr(c, IPAD, IY, IS, IS, 44); c.fill();
  c.restore();

  // Imagem ou emoji
  if (prod.fotoUrl) {
    try {
      const img = new Image(); img.crossOrigin = 'anonymous';
      await new Promise<void>((res, rej) => { img.onload = () => res(); img.onerror = () => rej(); img.src = prod.fotoUrl!; });
      c.save(); rr(c, IPAD, IY, IS, IS, 44); c.clip();
      const sc = Math.max(IS / img.width, IS / img.height);
      c.drawImage(img, IPAD + (IS - img.width * sc) / 2, IY + (IS - img.height * sc) / 2, img.width * sc, img.height * sc);
      c.restore();
    } catch { emojiBox(c, prod.icon || '🌸', IPAD, IY, IS, IS); }
  } else { emojiBox(c, prod.icon || '🌸', IPAD, IY, IS, IS); }

  // Badge (canto superior direito da foto)
  const badge = mkBadge(prod);
  if (badge) {
    c.font = 'bold 30px Nunito, sans-serif';
    const bTw = c.measureText(badge).width;
    const BW = bTw + 48, BH = 56, BX = IPAD + IS - BW - 16, BY = IY + 16;
    c.save();
    c.fillStyle = badge.includes('OFF') ? '#b71c1c' : badge.includes('⭐') ? '#e65100' : '#1565c0';
    rr(c, BX, BY, BW, BH, 12); c.fill();
    c.fillStyle = '#fff'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText(badge, BX + BW / 2, BY + BH / 2);
    c.restore();
  }

  // ── INFO PRODUTO  (y 1085 em diante) ─────────────────────────────────────
  const infoY = 1085;

  // Marca · Categoria
  c.font = '700 27px Nunito, sans-serif'; c.fillStyle = '#b07a8e';
  c.textAlign = 'center'; c.textBaseline = 'alphabetic';
  c.fillText(`${prod.marca.toUpperCase()}  ·  ${prod.cat.toUpperCase()}`, cx, infoY + 28);

  // Divisor
  const dg = c.createLinearGradient(cx - 130, 0, cx + 130, 0);
  dg.addColorStop(0, 'transparent'); dg.addColorStop(0.4, '#e91e63'); dg.addColorStop(0.6, '#e91e63'); dg.addColorStop(1, 'transparent');
  c.fillStyle = dg; c.fillRect(cx - 130, infoY + 44, 260, 2);

  // Nome (máx 2 linhas, 64px)
  c.font = 'bold 64px Nunito, sans-serif'; c.fillStyle = '#3d1020';
  const nameLines = clampLines(c, prod.nome, W - 120, 2);
  const nameStartY = infoY + 90;
  nameLines.forEach((line, i) => c.fillText(line, cx, nameStartY + i * 76));
  const nameEndY = nameStartY + (nameLines.length - 1) * 76;

  // Preço
  const priceTopY = Math.max(nameEndY + 42, infoY + 210);
  const hasDiscount = Boolean(prod.precoDe && prod.precoDe > prod.preco);

  if (hasDiscount) {
    c.font = '400 34px Nunito, sans-serif'; c.fillStyle = '#b07a8e';
    const deStr = `De ${fmtR$(prod.precoDe!)}`;
    const dtw = c.measureText(deStr).width;
    c.fillText(deStr, cx, priceTopY);
    c.fillRect(cx - dtw / 2, priceTopY - 12, dtw, 2);

    c.font = 'bold 104px Nunito, sans-serif'; c.fillStyle = '#e91e63';
    c.fillText(fmtR$(prod.preco), cx, priceTopY + 102);

    const pct = Math.round((1 - prod.preco / prod.precoDe!) * 100);
    c.font = 'bold 28px Nunito, sans-serif'; c.fillStyle = '#b71c1c';
    c.fillText(`Você economiza ${pct}%`, cx, priceTopY + 138);
  } else {
    c.font = 'bold 108px Nunito, sans-serif'; c.fillStyle = '#e91e63';
    c.fillText(fmtR$(prod.preco), cx, priceTopY + 100);
  }

  // ── BOTÃO PEDIR AGORA ─────────────────────────────────────────────────────
  const btnTopY = hasDiscount ? priceTopY + 162 : priceTopY + 122;
  const BTN_H = 88, BTN_W = 660, BTN_X = (W - BTN_W) / 2;

  c.save();
  c.shadowColor = 'rgba(37,211,102,0.38)'; c.shadowBlur = 20; c.shadowOffsetY = 6;
  c.fillStyle = '#25D366'; rr(c, BTN_X, btnTopY, BTN_W, BTN_H, BTN_H / 2); c.fill();
  c.restore();

  c.font = '34px serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillText('💬', BTN_X + 52, btnTopY + BTN_H / 2 + 2);

  c.font = 'bold 38px Nunito, sans-serif'; c.fillStyle = '#fff';
  c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillText('PEDIR AGORA', BTN_X + BTN_W / 2 + 14, btnTopY + BTN_H / 2);

  // ── RODAPÉ ───────────────────────────────────────────────────────────────
  const footerParts: string[] = [];
  if (cfg.telefone) footerParts.push(`📱 ${cfg.telefone}`);
  if (cfg.instagram) footerParts.push(`📸 ${cfg.instagram}`);
  if (footerParts.length) {
    c.font = '500 25px Nunito, sans-serif'; c.fillStyle = '#b07a8e';
    c.textAlign = 'center'; c.textBaseline = 'alphabetic';
    c.fillText(footerParts.join('    '), cx, btnTopY + BTN_H + 46);
  }

  // Círculo decorativo no canto inferior (zona sacrificial)
  softCircle(c, -60, H, 380, 'rgba(194,24,91,0.06)');

  return new Promise(res => canvas.toBlob(b => res(b!), 'image/jpeg', 0.94));
}

// ── Utilitários ──────────────────────────────────────────────────────────────

function mkBadge(prod: Produto): string {
  if (prod.precoDe && prod.precoDe > prod.preco)
    return `🔥 ${Math.round((1 - prod.preco / prod.precoDe) * 100)}% OFF`;
  if (typeof prod.estoque === 'number' && prod.estoque > 0 && prod.estoque <= 5)
    return `⚡ Só ${prod.estoque} restante${prod.estoque > 1 ? 's' : ''}`;
  if (prod.destaque) return '⭐ Mais vendido';
  return '';
}

function softCircle(c: CanvasRenderingContext2D, x: number, y: number, r: number, color: string) {
  [3, 2, 1].forEach(i => {
    c.save(); c.globalAlpha = 0.025 * i; c.fillStyle = color;
    c.beginPath(); c.arc(x, y, r + i * 40, 0, Math.PI * 2); c.fill(); c.restore();
  });
}

function rr(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  c.beginPath();
  c.moveTo(x + r, y); c.lineTo(x + w - r, y); c.quadraticCurveTo(x + w, y, x + w, y + r);
  c.lineTo(x + w, y + h - r); c.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  c.lineTo(x + r, y + h); c.quadraticCurveTo(x, y + h, x, y + h - r);
  c.lineTo(x, y + r); c.quadraticCurveTo(x, y, x + r, y); c.closePath();
}

function clampLines(c: CanvasRenderingContext2D, text: string, maxW: number, maxLines: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (c.measureText(test).width > maxW && line) {
      lines.push(line);
      if (lines.length >= maxLines) {
        let last = lines[maxLines - 1];
        while (c.measureText(last + '…').width > maxW && last.length > 0)
          last = last.slice(0, -1).trimEnd();
        lines[maxLines - 1] = last + '…';
        return lines;
      }
      line = word;
    } else { line = test; }
  }
  if (line) lines.push(line);
  return lines;
}

function emojiBox(c: CanvasRenderingContext2D, emoji: string, x: number, y: number, w: number, h: number) {
  c.save();
  const bg = c.createLinearGradient(x, y, x + w, y + h);
  bg.addColorStop(0, '#fce8f0'); bg.addColorStop(1, '#f9d5e3');
  c.fillStyle = bg; rr(c, x, y, w, h, 44); c.fill();
  c.font = `${Math.floor(Math.min(w, h) * 0.36)}px serif`;
  c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillText(emoji, x + w / 2, y + h / 2); c.restore();
}
