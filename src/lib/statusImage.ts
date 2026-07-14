import type { Produto, Config } from '../types';
import { fmtR$ } from './helpers';

/**
 * Layout WhatsApp Status 1080×1920
 *
 * y=0–250    BUFFER TOP  (chrome do WhatsApp cobre ~180px — zona sacrificial)
 * y=250–1010 Foto        760×760 centrada, com sombra
 * y=1020–    Marca       logo + nome da loja, abaixo da foto (zona segura)
 * y=1090+    Info        categoria, nome, preço, botão PEDIR, rodapé
 * y=1640–    BUFFER BOT  (input do WhatsApp cobre o fundo — zona sacrificial)
 */
export async function gerarImagemStatus(prod: Produto, cfg: Config): Promise<Blob> {
  const W = 1080, H = 1920;
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const c = canvas.getContext('2d')!;
  const cx = W / 2;

  await document.fonts.ready;

  // ── FUNDO ──────────────────────────────────────────────────────────────────
  c.fillStyle = '#fff8f9';
  c.fillRect(0, 0, W, H);

  const bgGrad = c.createLinearGradient(0, H * 0.45, 0, H);
  bgGrad.addColorStop(0, 'rgba(252,228,236,0)');
  bgGrad.addColorStop(1, 'rgba(249,213,227,0.7)');
  c.fillStyle = bgGrad;
  c.fillRect(0, 0, W, H);

  // Decoração: topo e base (zonas sacrificiais — OK serem cobertas pelo chrome)
  softCircle(c, W + 80, 0,  480, 'rgba(233,30,99,0.07)');
  softCircle(c, cx,    -60, 300, 'rgba(233,30,99,0.05)');
  softCircle(c, -80,    H,  420, 'rgba(194,24,91,0.06)');

  // ── FOTO  (y 250–1010, 760×760) ────────────────────────────────────────────
  const IS = 760, IPAD = (W - IS) / 2, IY = 250;  // começa ABAIXO do chrome

  // Sombra
  c.save();
  c.shadowColor = 'rgba(194,24,91,0.18)'; c.shadowBlur = 60; c.shadowOffsetY = 20;
  c.fillStyle = '#fff'; rr(c, IPAD, IY, IS, IS, 48); c.fill();
  c.restore();

  // Imagem ou emoji
  if (prod.fotoUrl) {
    try {
      const img = new Image(); img.crossOrigin = 'anonymous';
      await new Promise<void>((res, rej) => { img.onload = () => res(); img.onerror = () => rej(); img.src = prod.fotoUrl!; });
      c.save(); rr(c, IPAD, IY, IS, IS, 48); c.clip();
      const sc = Math.max(IS / img.width, IS / img.height);
      c.drawImage(img, IPAD + (IS - img.width * sc) / 2, IY + (IS - img.height * sc) / 2, img.width * sc, img.height * sc);
      c.restore();
    } catch { emojiBox(c, prod.icon || '🌸', IPAD, IY, IS, IS); }
  } else { emojiBox(c, prod.icon || '🌸', IPAD, IY, IS, IS); }

  // Badge (canto superior direito da foto, y≈266 — zona segura)
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

  // ── NOME DA LOJA + LOGO (abaixo da foto, y≈1030–1080) ─────────────────────
  // Logo pequeno e nome ficam JUNTOS, centralizados como bloco horizontal
  const storeName = cfg.nomeEmpresa || 'Rejjane Vendas';
  const BRAND_R = 26, BRAND_CY = 1046, BRAND_GAP = 14;

  c.font = 'italic bold 46px Georgia, serif';
  const snW = c.measureText(storeName).width;
  const brandTotalW = BRAND_R * 2 + BRAND_GAP + snW;
  const logoX = cx - brandTotalW / 2 + BRAND_R;
  const nameX  = logoX + BRAND_R + BRAND_GAP;

  // Logo circular
  try {
    const li = new Image(); li.crossOrigin = 'anonymous';
    await new Promise<void>((res, rej) => { li.onload = () => res(); li.onerror = () => rej(); li.src = '/rejjane-logo.jpeg'; });
    c.save(); c.beginPath(); c.arc(logoX, BRAND_CY, BRAND_R + 3, 0, Math.PI * 2); c.fillStyle = '#e91e63'; c.fill(); c.restore();
    c.save(); c.beginPath(); c.arc(logoX, BRAND_CY, BRAND_R, 0, Math.PI * 2); c.clip();
    const ls = (BRAND_R * 2) / Math.min(li.width, li.height);
    c.drawImage(li, logoX - li.width * ls / 2, BRAND_CY - li.height * ls / 2, li.width * ls, li.height * ls);
    c.restore();
  } catch {
    // fallback: círculo rose sólido
    c.save(); c.beginPath(); c.arc(logoX, BRAND_CY, BRAND_R + 3, 0, Math.PI * 2); c.fillStyle = '#e91e63'; c.fill(); c.restore();
    c.save(); c.beginPath(); c.arc(logoX, BRAND_CY, BRAND_R, 0, Math.PI * 2); c.fillStyle = '#fce8f0'; c.fill(); c.restore();
  }

  // Nome da loja
  c.font = 'italic bold 46px Georgia, serif';
  c.fillStyle = '#3d1020'; c.textAlign = 'left'; c.textBaseline = 'middle';
  c.fillText(storeName, nameX, BRAND_CY);

  // Slogan (opcional, menor)
  if (cfg.slogan) {
    c.font = '500 22px Nunito, sans-serif';
    c.fillStyle = '#b07a8e'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText(cfg.slogan, cx, BRAND_CY + 36);
  }

  // Linha divisória rose
  const divY = cfg.slogan ? BRAND_CY + 56 : BRAND_CY + 30;
  const dg = c.createLinearGradient(cx - 140, 0, cx + 140, 0);
  dg.addColorStop(0, 'transparent'); dg.addColorStop(0.4, '#e91e63'); dg.addColorStop(0.6, '#e91e63'); dg.addColorStop(1, 'transparent');
  c.fillStyle = dg; c.fillRect(cx - 140, divY, 280, 2);

  // ── INFO PRODUTO  (y≈1090 em diante) ───────────────────────────────────────
  const infoY = divY + 20;

  // Marca · Categoria
  c.font = '700 27px Nunito, sans-serif'; c.fillStyle = '#b07a8e';
  c.textAlign = 'center'; c.textBaseline = 'alphabetic';
  c.fillText(`${prod.marca.toUpperCase()}  ·  ${prod.cat.toUpperCase()}`, cx, infoY + 28);

  // Nome do produto (máx 2 linhas, 64px)
  c.font = 'bold 64px Nunito, sans-serif'; c.fillStyle = '#3d1020';
  const nameLines = clampLines(c, prod.nome, W - 120, 2);
  const nameStartY = infoY + 70;
  nameLines.forEach((line, i) => c.fillText(line, cx, nameStartY + i * 76));
  const nameEndY = nameStartY + (nameLines.length - 1) * 76;

  // Preço — posição relativa ao nome, mas nunca abaixo de um mínimo
  const priceTopY = Math.max(nameEndY + 42, infoY + 188);
  const hasDiscount = Boolean(prod.precoDe && prod.precoDe > prod.preco);

  if (hasDiscount) {
    // De R$ (riscado)
    c.font = '400 34px Nunito, sans-serif'; c.fillStyle = '#b07a8e';
    const deStr = `De ${fmtR$(prod.precoDe!)}`;
    const dtw = c.measureText(deStr).width;
    c.fillText(deStr, cx, priceTopY);
    c.fillRect(cx - dtw / 2, priceTopY - 12, dtw, 2);

    // Preço atual
    c.font = 'bold 104px Nunito, sans-serif'; c.fillStyle = '#e91e63';
    c.fillText(fmtR$(prod.preco), cx, priceTopY + 102);

    // Economia
    const pct = Math.round((1 - prod.preco / prod.precoDe!) * 100);
    c.font = 'bold 28px Nunito, sans-serif'; c.fillStyle = '#b71c1c';
    c.fillText(`Você economiza ${pct}%`, cx, priceTopY + 138);
  } else {
    c.font = 'bold 108px Nunito, sans-serif'; c.fillStyle = '#e91e63';
    c.fillText(fmtR$(prod.preco), cx, priceTopY + 100);
  }

  // ── BOTÃO PEDIR AGORA ──────────────────────────────────────────────────────
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

  // ── RODAPÉ ─────────────────────────────────────────────────────────────────
  const footerParts: string[] = [];
  if (cfg.telefone) footerParts.push(`📱 ${cfg.telefone}`);
  if (cfg.instagram) footerParts.push(`📸 ${cfg.instagram}`);
  if (footerParts.length) {
    c.font = '500 25px Nunito, sans-serif'; c.fillStyle = '#b07a8e';
    c.textAlign = 'center'; c.textBaseline = 'alphabetic';
    c.fillText(footerParts.join('    '), cx, btnTopY + BTN_H + 46);
  }

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
