import type { Produto, Config } from '../types';
import { fmtR$ } from './helpers';

/**
 * Layout WhatsApp Status 1080×1920
 *
 * y=0–320    Faixa rose   — logo + nome da loja (chrome cobre topo, mas logo fica em y=210)
 * y=320      Arco branco
 * y=345–1065 Foto 720×720
 * y=1085–    Info:  marca | nome | âncora de preço | economize badge | CTA | rodapé
 */
export async function gerarImagemStatus(prod: Produto, cfg: Config): Promise<Blob> {
  const W = 1080, H = 1920;
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const c = canvas.getContext('2d')!;
  const cx = W / 2;

  await document.fonts.ready;

  // ── FUNDO ─────────────────────────────────────────────────────────────────
  c.fillStyle = '#fff8f9';
  c.fillRect(0, 0, W, H);
  const bgG = c.createLinearGradient(0, H * 0.45, 0, H);
  bgG.addColorStop(0, 'rgba(252,228,236,0)');
  bgG.addColorStop(1, 'rgba(249,213,227,0.6)');
  c.fillStyle = bgG; c.fillRect(0, 0, W, H);

  // ── FAIXA ROSE (y=0–340) ──────────────────────────────────────────────────
  const bandG = c.createLinearGradient(0, 0, 0, 340);
  bandG.addColorStop(0, '#ad1457');
  bandG.addColorStop(1, '#e91e63');
  c.fillStyle = bandG; c.fillRect(0, 0, W, 340);

  // Reflexos decorativos dentro da faixa
  c.save(); c.globalAlpha = 0.13; c.fillStyle = '#fff';
  c.beginPath(); c.arc(W * 0.86, -20, 260, 0, Math.PI * 2); c.fill(); c.restore();
  c.save(); c.globalAlpha = 0.06; c.fillStyle = '#fff';
  c.beginPath(); c.arc(W * 0.1, 320, 190, 0, Math.PI * 2); c.fill(); c.restore();

  // Arco branco na base da faixa
  c.save(); c.fillStyle = '#fff8f9';
  c.beginPath(); c.ellipse(cx, 360, W / 2 + 90, 76, 0, 0, Math.PI); c.fill(); c.restore();

  // ── LOGO + NOME DA LOJA ────────────────────────────────────────────────────
  const LCY = 205, LR = 50;
  c.save(); c.beginPath(); c.arc(cx, LCY, LR + 6, 0, Math.PI * 2);
  c.fillStyle = 'rgba(255,255,255,0.88)'; c.fill(); c.restore();

  try {
    const li = new Image(); li.crossOrigin = 'anonymous';
    await new Promise<void>((res, rej) => { li.onload = () => res(); li.onerror = () => rej(); li.src = '/rejjane-logo.jpeg'; });
    c.save(); c.beginPath(); c.arc(cx, LCY, LR, 0, Math.PI * 2); c.clip();
    const ls = (LR * 2) / Math.min(li.width, li.height);
    c.drawImage(li, cx - li.width * ls / 2, LCY - li.height * ls / 2, li.width * ls, li.height * ls);
    c.restore();
  } catch {
    c.save(); c.beginPath(); c.arc(cx, LCY, LR, 0, Math.PI * 2);
    c.fillStyle = '#f48fb1'; c.fill(); c.restore();
  }

  const storeName = cfg.nomeEmpresa || 'Rejjane Vendas';
  c.font = 'italic bold 56px Georgia, serif';
  c.fillStyle = '#fff'; c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillText(storeName, cx, 275);

  if (cfg.slogan) {
    c.font = '500 23px Nunito, sans-serif';
    c.fillStyle = 'rgba(255,255,255,0.82)'; c.textBaseline = 'middle';
    c.fillText(cfg.slogan, cx, 312);
  }

  // ── FOTO (y=378–1098, 720×720) ───────────────────────────────────────────
  const IS = 720, IPAD = (W - IS) / 2, IY = 378;

  c.save();
  c.shadowColor = 'rgba(173,20,87,0.18)'; c.shadowBlur = 22; c.shadowOffsetY = 8;
  c.fillStyle = '#fff'; rr(c, IPAD, IY, IS, IS, 48); c.fill(); c.restore();

  if (prod.fotoUrl) {
    try {
      const img = new Image(); img.crossOrigin = 'anonymous';
      await new Promise<void>((res, rej) => { img.onload = () => res(); img.onerror = () => rej(); img.src = prod.fotoUrl!; });
      c.save(); rr(c, IPAD, IY, IS, IS, 48); c.clip();
      // Contain: produto inteiro sempre visível, independente do tamanho da foto
      const sc = Math.min(IS / img.width, IS / img.height);
      const dw = img.width * sc, dh = img.height * sc;
      c.drawImage(img, IPAD + (IS - dw) / 2, IY + (IS - dh) / 2, dw, dh);
      c.restore();
    } catch { emojiBox(c, prod.icon || '🌸', IPAD, IY, IS, IS); }
  } else { emojiBox(c, prod.icon || '🌸', IPAD, IY, IS, IS); }

  // Badge de desconto/destaque
  const badge = mkBadge(prod);
  if (badge) {
    c.font = 'bold 30px Nunito, sans-serif';
    const bTw = c.measureText(badge).width;
    const BW = bTw + 52, BH = 58, BX = IPAD + IS - BW - 16, BY = IY + 16;
    c.save();
    c.shadowColor = 'rgba(0,0,0,0.25)'; c.shadowBlur = 12; c.shadowOffsetY = 4;
    c.fillStyle = badge.includes('OFF') ? '#b71c1c' : badge.includes('⭐') ? '#e65100' : '#1565c0';
    rr(c, BX, BY, BW, BH, 12); c.fill(); c.restore();
    c.fillStyle = '#fff'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText(badge, BX + BW / 2, BY + BH / 2);
  }

  // ── INFO DO PRODUTO ────────────────────────────────────────────────────────
  const infoY = IY + IS + 18;

  // ① Marca · Categoria — pills separadas
  c.font = '700 23px Nunito, sans-serif';
  const marcaTxt = prod.marca.toUpperCase();
  const catTxt   = prod.cat.toUpperCase();
  const mW = c.measureText(marcaTxt).width + 40;
  const ctW = c.measureText(catTxt).width + 40;
  const pillH = 44, pillGap = 14;
  const pillsStartX = cx - (mW + ctW + pillGap) / 2;
  const pillY = infoY + 20;

  c.save(); c.fillStyle = '#fce8f0'; rr(c, pillsStartX, pillY, mW, pillH, pillH / 2); c.fill();
  c.fillStyle = '#c2185b'; c.textAlign = 'left'; c.textBaseline = 'middle';
  c.fillText(marcaTxt, pillsStartX + 20, pillY + pillH / 2); c.restore();

  c.save(); c.fillStyle = 'rgba(176,122,142,0.13)'; rr(c, pillsStartX + mW + pillGap, pillY, ctW, pillH, pillH / 2); c.fill();
  c.fillStyle = '#b07a8e'; c.textAlign = 'left'; c.textBaseline = 'middle';
  c.fillText(catTxt, pillsStartX + mW + pillGap + 20, pillY + pillH / 2); c.restore();

  // Divisor rose
  const divY = pillY + pillH + 24;
  const dg = c.createLinearGradient(cx - 160, 0, cx + 160, 0);
  dg.addColorStop(0, 'transparent'); dg.addColorStop(0.3, '#e91e63'); dg.addColorStop(0.7, '#e91e63'); dg.addColorStop(1, 'transparent');
  c.fillStyle = dg; c.fillRect(cx - 160, divY, 320, 2.5);

  // ② Nome do produto (máx 2 linhas, 68px, mais espaçamento)
  c.font = 'bold 68px Nunito, sans-serif'; c.fillStyle = '#3d1020';
  c.textAlign = 'center'; c.textBaseline = 'alphabetic';
  const nameLines = clampLines(c, prod.nome, W - 100, 2);
  const nameStartY = divY + 72;
  nameLines.forEach((line, i) => c.fillText(line, cx, nameStartY + i * 82));
  const nameEndY = nameStartY + (nameLines.length - 1) * 82;

  // ③ Bloco de preço — âncora de desconto + preço destaque
  const priceTopY = Math.max(nameEndY + 54, infoY + 238);
  const hasDiscount = Boolean(prod.precoDe && prod.precoDe > prod.preco);

  if (hasDiscount) {
    // De R$ riscado (âncora de preço)
    c.font = '400 36px Nunito, sans-serif'; c.fillStyle = '#b07a8e';
    const deStr = `De ${fmtR$(prod.precoDe!)}`;
    const dtw = c.measureText(deStr).width;
    c.fillText(deStr, cx, priceTopY);
    c.save(); c.strokeStyle = '#b07a8e'; c.lineWidth = 2;
    c.beginPath(); c.moveTo(cx - dtw / 2, priceTopY - 14); c.lineTo(cx + dtw / 2, priceTopY - 14); c.stroke(); c.restore();

    // Preço principal (grande)
    c.font = 'bold 108px Nunito, sans-serif'; c.fillStyle = '#e91e63';
    c.fillText(fmtR$(prod.preco), cx, priceTopY + 108);

    // ④ Badge "Você economiza X%" — destaque real de marketing
    const pct = Math.round((1 - prod.preco / prod.precoDe!) * 100);
    const ecoTxt = `💰 Você economiza ${pct}%`;
    c.font = 'bold 28px Nunito, sans-serif';
    const ew = c.measureText(ecoTxt).width + 56;
    const eX = cx - ew / 2, eY = priceTopY + 124;
    c.save();
    c.shadowColor = 'rgba(183,28,28,0.18)'; c.shadowBlur = 14; c.shadowOffsetY = 4;
    c.fillStyle = '#fde8ee'; rr(c, eX, eY, ew, 52, 26); c.fill(); c.restore();
    // Borda sutil
    c.save(); c.strokeStyle = 'rgba(183,28,28,0.18)'; c.lineWidth = 1.5;
    rr(c, eX, eY, ew, 52, 26); c.stroke(); c.restore();
    c.fillStyle = '#b71c1c'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText(ecoTxt, cx, eY + 26);
  } else {
    // Preço único (mais espaço, centralizado)
    c.font = 'bold 114px Nunito, sans-serif'; c.fillStyle = '#e91e63';
    c.fillText(fmtR$(prod.preco), cx, priceTopY + 108);
  }

  // ── BOTÃO PEDIR AGORA ────────────────────────────────────────────────────
  const btnTopY = hasDiscount ? priceTopY + 198 : priceTopY + 140;
  const BTN_H = 92, BTN_W = 700, BTN_X = (W - BTN_W) / 2;

  c.save();
  c.shadowColor = 'rgba(37,211,102,0.45)'; c.shadowBlur = 28; c.shadowOffsetY = 8;
  c.fillStyle = '#25D366'; rr(c, BTN_X, btnTopY, BTN_W, BTN_H, BTN_H / 2); c.fill();
  c.restore();

  c.font = '36px serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillText('💬', BTN_X + 56, btnTopY + BTN_H / 2 + 2);

  c.font = 'bold 40px Nunito, sans-serif'; c.fillStyle = '#fff';
  c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillText('PEDIR AGORA', BTN_X + BTN_W / 2 + 16, btnTopY + BTN_H / 2);

  // Texto de reforço abaixo do botão
  c.font = '500 24px Nunito, sans-serif'; c.fillStyle = '#b07a8e';
  c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillText('✓ Resposta rápida  ✓ Entrega garantida', cx, btnTopY + BTN_H + 34);

  // ── RODAPÉ ────────────────────────────────────────────────────────────────
  const footerParts: string[] = [];
  if (cfg.telefone) footerParts.push(`📱 ${cfg.telefone}`);
  if (cfg.instagram) footerParts.push(`📸 ${cfg.instagram}`);
  if (footerParts.length) {
    const footerY = btnTopY + BTN_H + 72;
    // Linha tênue antes do rodapé
    c.save(); c.globalAlpha = 0.18; c.fillStyle = '#e91e63';
    c.fillRect(cx - 120, footerY - 18, 240, 1.5); c.restore();
    c.font = '500 26px Nunito, sans-serif'; c.fillStyle = '#b07a8e';
    c.textAlign = 'center'; c.textBaseline = 'alphabetic';
    c.fillText(footerParts.join('    '), cx, footerY);
  }

  // Decoração de fundo (zona sacrificial)
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
  c.fillStyle = bg; rr(c, x, y, w, h, 48); c.fill();
  c.font = `${Math.floor(Math.min(w, h) * 0.36)}px serif`;
  c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillText(emoji, x + w / 2, y + h / 2); c.restore();
}
