"""
Processamento de fotos de produtos — Rejjanevendas
Remove fundo com IA e compõe em fundo estilo estúdio (gradiente creme).

Uso:
  py scripts/processar_fotos.py

Saída: public/produtos/studio/  (originais preservados)
"""

import os
import sys
from pathlib import Path
from io import BytesIO

try:
    from rembg import remove
    from PIL import Image, ImageDraw, ImageFilter
    import numpy as np
except ImportError as e:
    print(f"Dependência faltando: {e}")
    print("Execute: py -m pip install rembg pillow numpy")
    sys.exit(1)

# ── configuração ────────────────────────────────────────────────────────────
ENTRADA = Path(__file__).parent.parent / "public" / "produtos"
SAIDA   = ENTRADA / "studio"
CANVAS  = 800          # px — lado do quadrado final
PADDING = 0.10         # 10% de margem em cada lado
SHADOW  = True         # sombra suave embaixo do produto

# cores da marca (creme → rosa bem pálido)
BG_CENTER = (255, 245, 248)   # --cream  #fff5f8
BG_EDGE   = (252, 232, 240)   # --cream-2 #fce8f0
# ────────────────────────────────────────────────────────────────────────────


def make_studio_background(size: int) -> Image.Image:
    """Fundo com gradiente radial suave — centro claro, bordas levemente rosadas."""
    bg = Image.new("RGBA", (size, size), BG_CENTER + (255,))
    center = size / 2

    # gradiente radial por camadas de elipses
    overlay = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    steps = 40
    for i in range(steps, 0, -1):
        t = i / steps                          # 1 = borda, 0 = centro
        r = int(BG_CENTER[0] * (1-t) + BG_EDGE[0] * t)
        g = int(BG_CENTER[1] * (1-t) + BG_EDGE[1] * t)
        b = int(BG_CENTER[2] * (1-t) + BG_EDGE[2] * t)
        alpha = int(200 * t)
        radius = int(size * 0.7 * (i / steps))
        x0 = int(center - radius)
        y0 = int(center - radius * 0.85)
        x1 = int(center + radius)
        y1 = int(center + radius * 0.85)
        draw.ellipse([x0, y0, x1, y1], fill=(r, g, b, alpha))

    bg = Image.alpha_composite(bg, overlay)
    return bg


def add_shadow(product: Image.Image, canvas: Image.Image, pos: tuple, spread: int = 18) -> Image.Image:
    """Sombra elíptica suave embaixo do produto (efeito estúdio)."""
    w, h = product.size
    cx, cy = pos

    shadow_w = int(w * 0.80)
    shadow_h = int(h * 0.08)
    shadow_x = cx + (w - shadow_w) // 2
    shadow_y = cy + h - shadow_h // 2

    shadow = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(shadow)
    draw.ellipse(
        [shadow_x, shadow_y, shadow_x + shadow_w, shadow_y + shadow_h],
        fill=(194, 24, 91, 38)   # rosa escuro, bem transparente
    )
    # suaviza a sombra
    for _ in range(spread):
        shadow = shadow.filter(ImageFilter.BLUR)

    return Image.alpha_composite(canvas, shadow)


def processar(img_path: Path) -> Image.Image | None:
    print(f"  > {img_path.name}", end="", flush=True)

    with open(img_path, "rb") as f:
        data = f.read()

    # remoção de fundo com IA
    try:
        sem_fundo = remove(data)
    except Exception as e:
        print(f"  ERRO rembg: {e}")
        return None

    produto = Image.open(BytesIO(sem_fundo)).convert("RGBA")

    # redimensiona mantendo proporção, com padding
    area = int(CANVAS * (1 - PADDING * 2))
    produto.thumbnail((area, area), Image.LANCZOS)
    pw, ph = produto.size

    # posição centralizada
    px = (CANVAS - pw) // 2
    py = (CANVAS - ph) // 2

    # monta canvas
    bg = make_studio_background(CANVAS)

    if SHADOW:
        bg = add_shadow(produto, bg, (px, py))

    bg.paste(produto, (px, py), produto)

    print("  ✓")
    return bg


def main():
    if not ENTRADA.exists():
        print(f"Pasta não encontrada: {ENTRADA}")
        sys.exit(1)

    SAIDA.mkdir(exist_ok=True)

    extensions = {".jpg", ".jpeg", ".png", ".webp"}
    fotos = sorted([
        f for f in ENTRADA.iterdir()
        if f.is_file() and f.suffix.lower() in extensions
    ])

    if not fotos:
        print("Nenhuma imagem encontrada em", ENTRADA)
        sys.exit(0)

    print(f"\nProcessando {len(fotos)} fotos -> {SAIDA}\n")
    ok = 0
    for foto in fotos:
        resultado = processar(foto)
        if resultado:
            nome_saida = SAIDA / (foto.stem + ".png")
            resultado.save(nome_saida, "PNG", optimize=True)
            ok += 1

    print(f"\n✅ {ok}/{len(fotos)} fotos processadas")
    print(f"📁 Salvas em: {SAIDA}")
    print("\nPróximo passo: no catálogo do app, faça upload das fotos da pasta 'studio/'")


if __name__ == "__main__":
    main()
