import type { Produto, Config } from '../types';
import { fmtR$ } from './helpers';

export async function gerarImagemStatus(prod: Produto, cfg: Config): Promise<Blob> {
  const W = 1080, H = 1920;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  await document.fonts.ready;

  // ── Background: pure cream, very clean ──
  ctx.fillStyle = '#fff8f9';
  ctx.fillRect(0, 0, W, H);

  // Subtle blush wash on bottom half
  const wash = ctx.createLinearGradient(0, H * 0.5, 0, H);
  wash.addColorStop(0, 'rgba(252,228,236,0)');
  wash.addColorStop(1, 'rgba(252,228,236,0.55)');
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, W, H);

  // Two large decorative circles (blurred-look via low alpha fills)
  for (let i = 0; i < 3; i++) {
    ctx.save();
    ctx.globalAlpha = 0.07 - i * 0.02;
    ctx.fillStyle = '#e91e63';
    ctx.beginPath();
    ctx.arc(W + 60, 0, 520 + i * 80, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  for (let i = 0; i < 3; i++) {
    ctx.save();
    ctx.globalAlpha = 0.055 - i * 0.015;
    ctx.fillStyle = '#c2185b';
    ctx.beginPath();
    ctx.arc(-60, H, 420 + i * 70, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // ── WORDMARK / LOGO at top ──
  const storeName = cfg.nomeEmpresa || 'Rejjane Vendas';
  const LOGO_CY = 130;

  // Small rose diamond accent above name
  ctx.save();
  ctx.translate(W / 2, LOGO_CY - 68);
  ctx.rotate(Math.PI / 4);
  ctx.fillStyle = '#e91e63';
  ctx.fillRect(-10, -10, 20, 20);
  ctx.restore();

  // Store name — elegant script style
  ctx.font = 'italic 800 72px Georgia, "Times New Roman", serif';
  ctx.fillStyle = '#3d1020';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(storeName, W / 2, LOGO_CY);

  // Slogan if available
  if (cfg.slogan) {
    ctx.font = '600 32px Nunito, sans-serif';
    ctx.fillStyle = '#b07a8e';
    ctx.textBaseline = 'top';
    ctx.fillText(cfg.slogan, W / 2, LOGO_CY + 46);
  }

  // Thin rose underline below name
  const lineGrad = ctx.createLinearGradient(W / 2 - 160, 0, W / 2 + 160, 0);
  lineGrad.addColorStop(0, 'transparent');
  lineGrad.addColorStop(0.2, '#e91e63');
  lineGrad.addColorStop(0.8, '#e91e63');
  lineGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = lineGrad;
  ctx.fillRect(W / 2 - 160, LOGO_CY + (cfg.slogan ? 88 : 48), 320, 2);

  // ── PRODUCT IMAGE ──
  const imgPad = 56;
  const imgY = cfg.slogan ? 310 : 272;
  const imgSize = W - imgPad * 2; // 968px

  // White card behind photo with strong shadow
  ctx.save();
  ctx.shadowColor = 'rgba(194,24,91,0.18)';
  ctx.shadowBlur = 72;
  ctx.shadowOffsetY = 24;
  ctx.fillStyle = '#fff';
  rRect(ctx, imgPad, imgY, imgSize, imgSize, 52);
  ctx.fill();
  ctx.restore();

  // Photo
  if (prod.fotoUrl) {
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      await new Promise<void>((res, rej) => {
        img.onload = () => res();
        img.onerror = () => rej(new Error('img'));
        img.src = prod.fotoUrl!;
      });
      ctx.save();
      rRect(ctx, imgPad, imgY, imgSize, imgSize, 52);
      ctx.clip();
      const scale = Math.max(imgSize / img.width, imgSize / img.height);
      const dw = img.width * scale, dh = img.height * scale;
      ctx.drawImage(img, imgPad + (imgSize - dw) / 2, imgY + (imgSize - dh) / 2, dw, dh);
      ctx.restore();
    } catch {
      drawEmojiBox(ctx, prod.icon || '🌸', imgPad, imgY, imgSize);
    }
  } else {
    drawEmojiBox(ctx, prod.icon || '🌸', imgPad, imgY, imgSize);
  }

  // ── MARKETING BADGE (corner of photo) ──
  const badge = marketingBadge(prod);
  if (badge) {
    const isDiscount = badge.includes('OFF');
    const badgeColor = isDiscount ? '#b71c1c' : badge.includes('⭐') ? '#e65100' : '#1b5e20';
    ctx.font = 'bold 30px Nunito, sans-serif';
    const bTw = ctx.measureText(badge).width;
    const bW = bTw + 48, bH = 56, bR = 12;
    const bX = imgPad + imgSize - bW - 20, bY = imgY + 20;
    ctx.save();
    ctx.fillStyle = badgeColor;
    rRect(ctx, bX, bY, bW, bH, bR);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(badge, bX + bW / 2, bY + bH / 2);
    ctx.restore();
  }

  // ── INFO SECTION ──
  const infoY = imgY + imgSize + 44;
  const cx = W / 2;

  // Brand · Category
  ctx.font = '700 32px Nunito, sans-serif';
  ctx.fillStyle = '#b07a8e';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(`${prod.marca.toUpperCase()}  ·  ${prod.cat.toUpperCase()}`, cx, infoY + 40);

  // Product name
  ctx.font = 'bold 76px Nunito, sans-serif';
  ctx.fillStyle = '#3d1020';
  const nameLines = wrapTextLines(ctx, prod.nome, W - 120, 88);
  nameLines.forEach((line, i) => ctx.fillText(line, cx, infoY + 140 + i * 88));
  const afterName = infoY + 140 + nameLines.length * 88;

  // Price block
  if (prod.precoDe && prod.precoDe > prod.preco) {
    // Crossed-out original price
    ctx.font = '500 40px Nunito, sans-serif';
    ctx.fillStyle = '#b07a8e';
    const deStr = `De ${fmtR$(prod.precoDe)}`;
    const deTw = ctx.measureText(deStr).width;
    ctx.fillText(deStr, cx, afterName + 56);
    // Strikethrough line
    ctx.fillStyle = '#b07a8e';
    ctx.fillRect(cx - deTw / 2, afterName + 56 - 14, deTw, 2);

    ctx.font = 'bold 128px Nunito, sans-serif';
    ctx.fillStyle = '#e91e63';
    ctx.fillText(fmtR$(prod.preco), cx, afterName + 180);

    const pct = Math.round((1 - prod.preco / prod.precoDe) * 100);
    ctx.font = 'bold 34px Nunito, sans-serif';
    ctx.fillStyle = '#b71c1c';
    ctx.fillText(`Você economiza ${pct}%`, cx, afterName + 218);
  } else {
    ctx.font = 'bold 128px Nunito, sans-serif';
    ctx.fillStyle = '#e91e63';
    ctx.fillText(fmtR$(prod.preco), cx, afterName + 148);
  }

  // ── CTA pill button ──
  const hasDiscount = prod.precoDe && prod.precoDe > prod.preco;
  const ctaY = afterName + (hasDiscount ? 270 : 210);

  ctx.save();
  const ctaGrad = ctx.createLinearGradient(cx - 300, ctaY, cx + 300, ctaY + 80);
  ctaGrad.addColorStop(0, '#e91e63');
  ctaGrad.addColorStop(1, '#c2185b');
  ctx.fillStyle = ctaGrad;
  ctx.shadowColor = 'rgba(194,24,91,0.35)';
  ctx.shadowBlur = 20;
  ctx.shadowOffsetY = 6;
  rRect(ctx, cx - 310, ctaY, 620, 84, 42);
  ctx.fill();
  ctx.restore();

  ctx.font = 'bold 38px Nunito, sans-serif';
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('💬  Peça agora pelo WhatsApp', cx, ctaY + 42);

  // ── FOOTER ──
  const footerY = H - 54;
  const footerParts: string[] = [];
  if (cfg.telefone) footerParts.push(`📱 ${cfg.telefone}`);
  if (cfg.instagram) footerParts.push(`📸 ${cfg.instagram}`);
  if (footerParts.length) {
    ctx.font = '500 30px Nunito, sans-serif';
    ctx.fillStyle = '#b07a8e';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(footerParts.join('     '), cx, footerY);
  }

  return new Promise(res => canvas.toBlob(b => res(b!), 'image/jpeg', 0.94));
}

function marketingBadge(prod: Produto): string {
  if (prod.precoDe && prod.precoDe > prod.preco) {
    const pct = Math.round((1 - prod.preco / prod.precoDe) * 100);
    return `🔥 ${pct}% OFF`;
  }
  if (typeof prod.estoque === 'number' && prod.estoque > 0 && prod.estoque <= 5) {
    return `⚡ Só ${prod.estoque} restante${prod.estoque > 1 ? 's' : ''}`;
  }
  if (prod.destaque) return '⭐ Mais vendido';
  return '';
}

function rRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function wrapTextLines(ctx: CanvasRenderingContext2D, text: string, maxW: number, _lineH: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxW && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function drawEmojiBox(ctx: CanvasRenderingContext2D, emoji: string, x: number, y: number, size: number) {
  ctx.save();
  const bg = ctx.createLinearGradient(x, y, x + size, y + size);
  bg.addColorStop(0, '#fce8f0');
  bg.addColorStop(1, '#f9d5e3');
  ctx.fillStyle = bg;
  rRect(ctx, x, y, size, size, 52);
  ctx.fill();
  ctx.font = `${Math.floor(size * 0.38)}px serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(emoji, x + size / 2, y + size / 2);
  ctx.restore();
}
