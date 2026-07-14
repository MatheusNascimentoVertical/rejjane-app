import type { Produto, Config } from '../types';
import { fmtR$ } from './helpers';

// Layout fixo em zonas absolutas — não colapsa independente do conteúdo
// ZONA A  Logo:     y 0   → 210
// ZONA B  Foto:     y 210 → 1170
// ZONA C  Info:     y 1185 → 1920  (735 px)

export async function gerarImagemStatus(prod: Produto, cfg: Config): Promise<Blob> {
  const W = 1080, H = 1920;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const c = canvas.getContext('2d')!;

  await document.fonts.ready;

  // ── FUNDO ──────────────────────────────────────────────────────────────────
  c.fillStyle = '#fff8f9';
  c.fillRect(0, 0, W, H);

  const wash = c.createLinearGradient(0, H * 0.45, 0, H);
  wash.addColorStop(0, 'rgba(252,228,236,0)');
  wash.addColorStop(1, 'rgba(252,220,232,0.60)');
  c.fillStyle = wash;
  c.fillRect(0, 0, W, H);

  // Círculos decorativos suaves
  softCircle(c, W + 80,   -40,  480, 'rgba(233,30,99,0.08)');
  softCircle(c, -80,       H,   400, 'rgba(194,24,91,0.07)');
  softCircle(c, W * 0.15, H * 0.5, 220, 'rgba(252,228,236,0.45)');

  // ── ZONA A: LOGO  (y 0 → 260, sempre 260px) ──────────────────────────────
  // Logo circle: centro (W/2, 68), r=52  →  topo=16, base=120
  // Nome: y=162 (middle)
  // Slogan: y=200 (se houver)
  // Linha: y=242
  const storeName = cfg.nomeEmpresa || 'Rejjane Vendas';
  const LOGO_R = 52, LOGO_CX = W / 2, LOGO_CY = 68;

  try {
    const logoImg = new Image();
    logoImg.crossOrigin = 'anonymous';
    await new Promise<void>((res, rej) => {
      logoImg.onload = () => res();
      logoImg.onerror = () => rej();
      logoImg.src = '/rejjane-logo.jpeg';
    });
    // Anel rose
    c.save();
    c.beginPath();
    c.arc(LOGO_CX, LOGO_CY, LOGO_R + 5, 0, Math.PI * 2);
    c.fillStyle = '#e91e63';
    c.fill();
    c.restore();
    // Clip circular
    c.save();
    c.beginPath();
    c.arc(LOGO_CX, LOGO_CY, LOGO_R, 0, Math.PI * 2);
    c.clip();
    const s = (LOGO_R * 2) / Math.min(logoImg.width, logoImg.height);
    const lw = logoImg.width * s, lh = logoImg.height * s;
    c.drawImage(logoImg, LOGO_CX - lw / 2, LOGO_CY - lh / 2, lw, lh);
    c.restore();
  } catch {
    c.save();
    c.translate(LOGO_CX, LOGO_CY);
    c.rotate(Math.PI / 4);
    c.fillStyle = '#e91e63';
    c.fillRect(-10, -10, 20, 20);
    c.restore();
  }

  // Nome
  c.font = 'italic bold 64px Georgia, serif';
  c.fillStyle = '#3d1020';
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText(storeName, W / 2, 162);

  // Slogan
  if (cfg.slogan) {
    c.font = '500 30px Nunito, sans-serif';
    c.fillStyle = '#b07a8e';
    c.textBaseline = 'middle';
    c.fillText(cfg.slogan, W / 2, 204);
  }

  // Linha gradiente (y=242 fixo)
  const lg = c.createLinearGradient(W / 2 - 180, 0, W / 2 + 180, 0);
  lg.addColorStop(0, 'transparent');
  lg.addColorStop(0.3, '#e91e63');
  lg.addColorStop(0.7, '#e91e63');
  lg.addColorStop(1, 'transparent');
  c.fillStyle = lg;
  c.fillRect(W / 2 - 180, 242, 360, 2);

  // ── ZONA B: FOTO ──────────────────────────────────────────────────────────
  // ── ZONA B: FOTO  (y 260 → 1140, sempre 880×880 quadrada) ──────────────
  const IMG_SIZE = 880;
  const IMG_Y = 260;
  const PAD = (W - IMG_SIZE) / 2; // 100px cada lado
  const IMG_W = IMG_SIZE, IMG_H = IMG_SIZE;

  // Sombra do card
  c.save();
  c.shadowColor = 'rgba(194,24,91,0.20)';
  c.shadowBlur = 64;
  c.shadowOffsetY = 20;
  c.fillStyle = '#fff';
  rr(c, PAD, IMG_Y, IMG_W, IMG_H, 52);
  c.fill();
  c.restore();

  // Foto do produto
  if (prod.fotoUrl) {
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      await new Promise<void>((res, rej) => {
        img.onload = () => res();
        img.onerror = () => rej();
        img.src = prod.fotoUrl!;
      });
      c.save();
      rr(c, PAD, IMG_Y, IMG_W, IMG_H, 52);
      c.clip();
      const scale = Math.max(IMG_W / img.width, IMG_H / img.height);
      const dw = img.width * scale, dh = img.height * scale;
      c.drawImage(img, PAD + (IMG_W - dw) / 2, IMG_Y + (IMG_H - dh) / 2, dw, dh);
      c.restore();
    } catch {
      emojiBox(c, prod.icon || '🌸', PAD, IMG_Y, IMG_W, IMG_H);
    }
  } else {
    emojiBox(c, prod.icon || '🌸', PAD, IMG_Y, IMG_W, IMG_H);
  }

  // Badge de marketing (canto superior direito da foto)
  const badge = mkBadge(prod);
  if (badge) {
    const isOff = badge.includes('OFF');
    c.font = 'bold 30px Nunito, sans-serif';
    const tw = c.measureText(badge).width;
    const BW = tw + 48, BH = 56;
    const BX = PAD + IMG_W - BW - 16, BY = IMG_Y + 16;
    c.save();
    c.fillStyle = isOff ? '#b71c1c' : badge.includes('⭐') ? '#e65100' : '#1565c0';
    rr(c, BX, BY, BW, BH, 12);
    c.fill();
    c.fillStyle = '#fff';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText(badge, BX + BW / 2, BY + BH / 2);
    c.restore();
  }

  // ── ZONA C: INFO  (y 1168 → 1920, sempre 752px) ─────────────────────────
  const cx = W / 2;

  // Marca · Categoria
  c.font = '700 30px Nunito, sans-serif';
  c.fillStyle = '#b07a8e';
  c.textAlign = 'center';
  c.textBaseline = 'alphabetic';
  c.fillText(`${prod.marca.toUpperCase()}  ·  ${prod.cat.toUpperCase()}`, cx, 1218);

  // Divisor
  const dg = c.createLinearGradient(cx - 140, 0, cx + 140, 0);
  dg.addColorStop(0, 'transparent'); dg.addColorStop(0.5, '#e91e63'); dg.addColorStop(1, 'transparent');
  c.fillStyle = dg;
  c.fillRect(cx - 140, 1232, 280, 2);

  // Nome do produto — máx 2 linhas  (y fixo: 1300, 1388)
  c.font = 'bold 74px Nunito, sans-serif';
  c.fillStyle = '#3d1020';
  const nameLines = clampLines(c, prod.nome, W - 120, 2);
  nameLines.forEach((line, i) => c.fillText(line, cx, 1310 + i * 88));

  // Bloco de preço — posições fixas
  const hasDiscount = Boolean(prod.precoDe && prod.precoDe > prod.preco);

  if (hasDiscount) {
    c.font = '400 40px Nunito, sans-serif';
    c.fillStyle = '#b07a8e';
    const deStr = `De ${fmtR$(prod.precoDe!)}`;
    const dtw = c.measureText(deStr).width;
    c.fillText(deStr, cx, 1502);
    c.fillRect(cx - dtw / 2, 1488, dtw, 2);

    c.font = 'bold 118px Nunito, sans-serif';
    c.fillStyle = '#e91e63';
    c.fillText(fmtR$(prod.preco), cx, 1620);

    const pct = Math.round((1 - prod.preco / prod.precoDe!) * 100);
    c.font = 'bold 32px Nunito, sans-serif';
    c.fillStyle = '#b71c1c';
    c.fillText(`Você economiza ${pct}%`, cx, 1658);
  } else {
    c.font = 'bold 126px Nunito, sans-serif';
    c.fillStyle = '#e91e63';
    c.fillText(fmtR$(prod.preco), cx, 1610);
  }

  // ── BOTÃO "PEDIR AGORA" ────────────────────────────────────────────────────
  const BTN_Y = 1700, BTN_H = 92, BTN_W = 680;
  const BTN_X = (W - BTN_W) / 2;

  c.save();
  // Sombra verde
  c.shadowColor = 'rgba(37,211,102,0.40)';
  c.shadowBlur = 24;
  c.shadowOffsetY = 8;
  c.fillStyle = '#25D366'; // WhatsApp green
  rr(c, BTN_X, BTN_Y, BTN_W, BTN_H, BTN_H / 2);
  c.fill();
  c.restore();

  // Ícone WhatsApp simplificado (círculo branco)
  const ICON_CX = BTN_X + 56, ICON_CY = BTN_Y + BTN_H / 2;
  c.save();
  c.fillStyle = 'rgba(255,255,255,0.25)';
  c.beginPath();
  c.arc(ICON_CX, ICON_CY, 26, 0, Math.PI * 2);
  c.fill();
  c.restore();
  // Balão de fala
  c.font = '38px serif';
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText('💬', ICON_CX, ICON_CY + 2);

  // Texto do botão
  c.font = 'bold 40px Nunito, sans-serif';
  c.fillStyle = '#fff';
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText('PEDIR AGORA', BTN_X + BTN_W / 2 + 16, BTN_Y + BTN_H / 2);

  // ── RODAPÉ ────────────────────────────────────────────────────────────────
  const footerParts: string[] = [];
  if (cfg.telefone) footerParts.push(`📱 ${cfg.telefone}`);
  if (cfg.instagram) footerParts.push(`📸 ${cfg.instagram}`);
  if (footerParts.length) {
    c.font = '500 28px Nunito, sans-serif';
    c.fillStyle = '#b07a8e';
    c.textAlign = 'center';
    c.textBaseline = 'alphabetic';
    c.fillText(footerParts.join('    '), cx, 1888);
  }

  return new Promise(res => canvas.toBlob(b => res(b!), 'image/jpeg', 0.94));
}

// ── Utilitários ──────────────────────────────────────────────────────────────

function mkBadge(prod: Produto): string {
  if (prod.precoDe && prod.precoDe > prod.preco) {
    return `🔥 ${Math.round((1 - prod.preco / prod.precoDe) * 100)}% OFF`;
  }
  if (typeof prod.estoque === 'number' && prod.estoque > 0 && prod.estoque <= 5) {
    return `⚡ Só ${prod.estoque} restante${prod.estoque > 1 ? 's' : ''}`;
  }
  if (prod.destaque) return '⭐ Mais vendido';
  return '';
}

function softCircle(c: CanvasRenderingContext2D, x: number, y: number, r: number, color: string) {
  for (let i = 3; i >= 1; i--) {
    c.save();
    c.globalAlpha = 0.025 * i;
    c.fillStyle = color;
    c.beginPath();
    c.arc(x, y, r + i * 40, 0, Math.PI * 2);
    c.fill();
    c.restore();
  }
}

function rr(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  c.beginPath();
  c.moveTo(x + r, y);
  c.lineTo(x + w - r, y);
  c.quadraticCurveTo(x + w, y, x + w, y + r);
  c.lineTo(x + w, y + h - r);
  c.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  c.lineTo(x + r, y + h);
  c.quadraticCurveTo(x, y + h, x, y + h - r);
  c.lineTo(x, y + r);
  c.quadraticCurveTo(x, y, x + r, y);
  c.closePath();
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
        // Adiciona reticências na última linha se cortou
        let last = lines[maxLines - 1];
        while (c.measureText(last + '…').width > maxW && last.length > 0) {
          last = last.slice(0, -1).trimEnd();
        }
        lines[maxLines - 1] = last + '…';
        return lines;
      }
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function emojiBox(c: CanvasRenderingContext2D, emoji: string, x: number, y: number, w: number, h: number) {
  c.save();
  const bg = c.createLinearGradient(x, y, x + w, y + h);
  bg.addColorStop(0, '#fce8f0');
  bg.addColorStop(1, '#f9d5e3');
  c.fillStyle = bg;
  rr(c, x, y, w, h, 52);
  c.fill();
  c.font = `${Math.floor(Math.min(w, h) * 0.36)}px serif`;
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText(emoji, x + w / 2, y + h / 2);
  c.restore();
}
