import type { Produto, Config } from '../types';
import { fmtR$ } from './helpers';

export async function gerarImagemStatus(prod: Produto, cfg: Config): Promise<Blob> {
  const W = 1080, H = 1920;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  // Background gradient cream → blush
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, '#fff5f8');
  bg.addColorStop(0.5, '#fce8f0');
  bg.addColorStop(1, '#f9d5e3');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Decorative blurred circles
  drawCircle(ctx, W + 80, -80, 480, 'rgba(233,30,99,0.12)');
  drawCircle(ctx, -80, H + 80, 380, 'rgba(194,24,91,0.09)');
  drawCircle(ctx, W * 0.5, H * 0.42, 300, 'rgba(252,228,236,0.6)');

  // ── Top pill badge (store name) ──
  const storeName = cfg.nomeEmpresa || 'Minha Loja';
  ctx.save();
  ctx.fillStyle = '#e91e63';
  rRect(ctx, W / 2 - 260, 68, 520, 96, 48);
  ctx.fill();
  ctx.restore();
  await document.fonts.ready;
  ctx.font = '800 46px Nunito, sans-serif';
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(storeName, W / 2, 68 + 48);

  // ── Product image ──
  const imgX = 90, imgY = 230, imgSize = W - 180;
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
      ctx.beginPath();
      rRect(ctx, imgX, imgY, imgSize, imgSize, 56);
      ctx.clip();
      // draw cover-fit
      const scale = Math.max(imgSize / img.width, imgSize / img.height);
      const dw = img.width * scale, dh = img.height * scale;
      ctx.drawImage(img, imgX + (imgSize - dw) / 2, imgY + (imgSize - dh) / 2, dw, dh);
      ctx.restore();
    } catch {
      drawEmojiBox(ctx, prod.icon || '🌸', imgX, imgY, imgSize);
    }
  } else {
    drawEmojiBox(ctx, prod.icon || '🌸', imgX, imgY, imgSize);
  }

  // ── Bottom info card ──
  const cardY = imgY + imgSize + 32;
  const cardH = H - cardY - 44;
  ctx.save();
  ctx.shadowColor = 'rgba(194,24,91,0.16)';
  ctx.shadowBlur = 48;
  ctx.shadowOffsetY = 8;
  ctx.fillStyle = '#fff';
  rRect(ctx, 44, cardY, W - 88, cardH, 44);
  ctx.fill();
  ctx.restore();

  const cx = W / 2;

  // Brand / category tag
  ctx.font = '700 34px Nunito, sans-serif';
  ctx.fillStyle = '#b07a8e';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(`${prod.marca}  ·  ${prod.cat}`.toUpperCase(), cx, cardY + 66);

  // Rose separator
  ctx.fillStyle = '#e91e63';
  ctx.fillRect(cx - 56, cardY + 80, 112, 3);

  // Product name (wraps if long)
  ctx.font = '800 72px Nunito, sans-serif';
  ctx.fillStyle = '#3d1020';
  wrapText(ctx, prod.nome, cx, cardY + 160, W - 160, 84);

  // Price
  ctx.font = '900 118px Nunito, sans-serif';
  ctx.fillStyle = '#e91e63';
  const precoY = cardY + cardH - 148;
  ctx.fillText(fmtR$(prod.preco), cx, precoY);

  // WhatsApp CTA
  ctx.font = '600 38px Nunito, sans-serif';
  ctx.fillStyle = '#7a3a52';
  ctx.fillText('💬 Disponível! Me chame para encomendar', cx, precoY + 60);

  // Footer phone/instagram if available
  const footer: string[] = [];
  if (cfg.telefone) footer.push(`📱 ${cfg.telefone}`);
  if (cfg.instagram) footer.push(`📸 ${cfg.instagram}`);
  if (footer.length) {
    ctx.font = '500 32px Nunito, sans-serif';
    ctx.fillStyle = '#b07a8e';
    ctx.fillText(footer.join('   '), cx, H - 56);
  }

  return new Promise(res => canvas.toBlob(b => res(b!), 'image/jpeg', 0.93));
}

function drawCircle(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.filter = 'blur(60px)';
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
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

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string, x: number, y: number, maxW: number, lineH: number,
) {
  const words = text.split(' ');
  let line = '';
  let lineY = y;
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxW && line) {
      ctx.fillText(line, x, lineY);
      line = word;
      lineY += lineH;
    } else {
      line = test;
    }
  }
  ctx.fillText(line, x, lineY);
}

function drawEmojiBox(
  ctx: CanvasRenderingContext2D, emoji: string, x: number, y: number, size: number,
) {
  ctx.save();
  const bg = ctx.createLinearGradient(x, y, x + size, y + size);
  bg.addColorStop(0, '#fce8f0');
  bg.addColorStop(1, '#f9d5e3');
  ctx.fillStyle = bg;
  rRect(ctx, x, y, size, size, 56);
  ctx.fill();
  ctx.font = `${Math.floor(size * 0.42)}px serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(emoji, x + size / 2, y + size / 2);
  ctx.restore();
}
