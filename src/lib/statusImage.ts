import type { Produto, Config } from '../types';
import { fmtR$ } from './helpers';

/**
 * Layout — todo conteúdo entre y=50 e y=1650 ("zona segura" do WhatsApp Stories)
 *
 *  A  Logo       y  50 → 215   (165px)
 *  B  Foto       y 226 → 966   (740×740 px)
 *  C  Info       y 984 → 1650  (666px)
 *     Decorativo y 1650 → 1920 (fundo)
 */
export async function gerarImagemStatus(prod: Produto, cfg: Config): Promise<Blob> {
  const W = 1080, H = 1920;
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const c = canvas.getContext('2d')!;

  await document.fonts.ready;

  // ── FUNDO ─────────────────────────────────────────────────────────────────
  c.fillStyle = '#fff8f9';
  c.fillRect(0, 0, W, H);

  // Degradê blush no fundo
  const bg = c.createLinearGradient(0, H * 0.5, 0, H);
  bg.addColorStop(0, 'rgba(252,228,236,0)');
  bg.addColorStop(1, 'rgba(249,213,227,0.65)');
  c.fillStyle = bg;
  c.fillRect(0, 0, W, H);

  // Círculos decorativos
  softCircle(c, W + 60, -40, 440, 'rgba(233,30,99,0.07)');
  softCircle(c, -60, H, 380, 'rgba(194,24,91,0.06)');

  // ── A: LOGO  (y 50–215) ───────────────────────────────────────────────────
  const storeName = cfg.nomeEmpresa || 'Rejjane Vendas';
  const LR = 50, LCX = W / 2, LCY = 104; // logo circle

  // Tenta carregar /rejjane-logo.jpeg
  try {
    const li = new Image();
    li.crossOrigin = 'anonymous';
    await new Promise<void>((res, rej) => { li.onload = () => res(); li.onerror = () => rej(); li.src = '/rejjane-logo.jpeg'; });
    // Anel rose
    c.save(); c.beginPath(); c.arc(LCX, LCY, LR + 5, 0, Math.PI * 2); c.fillStyle = '#e91e63'; c.fill(); c.restore();
    // Clip + imagem
    c.save(); c.beginPath(); c.arc(LCX, LCY, LR, 0, Math.PI * 2); c.clip();
    const s = (LR * 2) / Math.min(li.width, li.height);
    c.drawImage(li, LCX - li.width * s / 2, LCY - li.height * s / 2, li.width * s, li.height * s);
    c.restore();
  } catch {
    // fallback diamond
    c.save(); c.translate(LCX, LCY); c.rotate(Math.PI / 4); c.fillStyle = '#e91e63'; c.fillRect(-10, -10, 20, 20); c.restore();
  }

  // Nome da loja
  c.font = 'italic bold 60px Georgia, serif';
  c.fillStyle = '#3d1020'; c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillText(storeName, W / 2, 174);

  // Slogan (opcional)
  if (cfg.slogan) {
    c.font = '500 28px Nunito, sans-serif';
    c.fillStyle = '#b07a8e'; c.textBaseline = 'middle';
    c.fillText(cfg.slogan, W / 2, 207);
  }

  // Linha rose
  const lg = c.createLinearGradient(W / 2 - 160, 0, W / 2 + 160, 0);
  lg.addColorStop(0, 'transparent'); lg.addColorStop(0.3, '#e91e63'); lg.addColorStop(0.7, '#e91e63'); lg.addColorStop(1, 'transparent');
  c.fillStyle = lg; c.fillRect(W / 2 - 160, 222, 320, 2);

  // ── B: FOTO  (y 226–966, 740×740 quadrada) ────────────────────────────────
  const IPAD = (W - 740) / 2; // 170px cada lado
  const IY = 226, IS = 740;

  // Sombra
  c.save(); c.shadowColor = 'rgba(194,24,91,0.18)'; c.shadowBlur = 56; c.shadowOffsetY = 18;
  c.fillStyle = '#fff'; rr(c, IPAD, IY, IS, IS, 44); c.fill(); c.restore();

  // Foto ou emoji
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

  // Badge (canto superior direito)
  const badge = mkBadge(prod);
  if (badge) {
    c.font = 'bold 28px Nunito, sans-serif';
    const bTw = c.measureText(badge).width;
    const BW = bTw + 44, BH = 52, BX = IPAD + IS - BW - 14, BY = IY + 14;
    c.save(); c.fillStyle = badge.includes('OFF') ? '#b71c1c' : badge.includes('⭐') ? '#e65100' : '#1565c0';
    rr(c, BX, BY, BW, BH, 10); c.fill();
    c.fillStyle = '#fff'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText(badge, BX + BW / 2, BY + BH / 2); c.restore();
  }

  // ── C: INFO  (y 984–1650) ─────────────────────────────────────────────────
  const cx = W / 2;

  // Marca · Categoria
  c.font = '700 29px Nunito, sans-serif'; c.fillStyle = '#b07a8e';
  c.textAlign = 'center'; c.textBaseline = 'alphabetic';
  c.fillText(`${prod.marca.toUpperCase()}  ·  ${prod.cat.toUpperCase()}`, cx, 1022);

  // Divisor
  const dg = c.createLinearGradient(cx - 120, 0, cx + 120, 0);
  dg.addColorStop(0, 'transparent'); dg.addColorStop(0.5, '#e91e63'); dg.addColorStop(1, 'transparent');
  c.fillStyle = dg; c.fillRect(cx - 120, 1035, 240, 2);

  // Nome (máx 2 linhas, 68px)
  c.font = 'bold 68px Nunito, sans-serif'; c.fillStyle = '#3d1020';
  const nameLines = clampLines(c, prod.nome, W - 120, 2);
  nameLines.forEach((line, i) => c.fillText(line, cx, 1104 + i * 80));
  const nameEndY = 1104 + (nameLines.length - 1) * 80;

  // Preço — posição relativa ao fim do nome, mas com mínimo fixo
  const priceTopY = Math.max(nameEndY + 44, 1220);
  const hasDiscount = Boolean(prod.precoDe && prod.precoDe > prod.preco);

  if (hasDiscount) {
    // De R$ (riscado)
    c.font = '400 36px Nunito, sans-serif'; c.fillStyle = '#b07a8e';
    const deStr = `De ${fmtR$(prod.precoDe!)}`;
    const dtw = c.measureText(deStr).width;
    c.fillText(deStr, cx, priceTopY);
    c.fillRect(cx - dtw / 2, priceTopY - 13, dtw, 2);

    // Preço atual
    c.font = 'bold 108px Nunito, sans-serif'; c.fillStyle = '#e91e63';
    c.fillText(fmtR$(prod.preco), cx, priceTopY + 108);

    // Economia
    const pct = Math.round((1 - prod.preco / prod.precoDe!) * 100);
    c.font = 'bold 30px Nunito, sans-serif'; c.fillStyle = '#b71c1c';
    c.fillText(`Você economiza ${pct}%`, cx, priceTopY + 146);
  } else {
    c.font = 'bold 112px Nunito, sans-serif'; c.fillStyle = '#e91e63';
    c.fillText(fmtR$(prod.preco), cx, priceTopY + 104);
  }

  // Botão PEDIR AGORA
  const btnTopY = hasDiscount ? priceTopY + 176 : priceTopY + 134;
  const BTN_H = 88, BTN_W = 660, BTN_X = (W - BTN_W) / 2;

  c.save();
  c.shadowColor = 'rgba(37,211,102,0.38)'; c.shadowBlur = 20; c.shadowOffsetY = 6;
  c.fillStyle = '#25D366'; rr(c, BTN_X, btnTopY, BTN_W, BTN_H, BTN_H / 2); c.fill();
  c.restore();

  // Ícone bolha
  c.font = '34px serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillText('💬', BTN_X + 52, btnTopY + BTN_H / 2 + 2);

  c.font = 'bold 38px Nunito, sans-serif'; c.fillStyle = '#fff';
  c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillText('PEDIR AGORA', BTN_X + BTN_W / 2 + 14, btnTopY + BTN_H / 2);

  // Rodapé
  const footerParts: string[] = [];
  if (cfg.telefone) footerParts.push(`📱 ${cfg.telefone}`);
  if (cfg.instagram) footerParts.push(`📸 ${cfg.instagram}`);
  if (footerParts.length) {
    const footerY = btnTopY + BTN_H + 52;
    c.font = '500 27px Nunito, sans-serif'; c.fillStyle = '#b07a8e';
    c.textAlign = 'center'; c.textBaseline = 'alphabetic';
    c.fillText(footerParts.join('    '), cx, footerY);
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
  c.fillStyle = bg; rr(c, x, y, w, h, 44); c.fill();
  c.font = `${Math.floor(Math.min(w, h) * 0.36)}px serif`;
  c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillText(emoji, x + w / 2, y + h / 2); c.restore();
}
