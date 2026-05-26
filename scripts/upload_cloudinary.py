"""
Upload em lote das fotos de estudio para o Cloudinary.

Pre-requisito:
  py -m pip install requests

Uso:
  py scripts/upload_cloudinary.py

Resultado: scripts/urls_cloudinary.json
"""

import json
import sys
import time
from pathlib import Path

try:
    import requests
except ImportError:
    print("Execute: py -m pip install requests")
    sys.exit(1)

CLOUD_NAME   = "dxpanl3xs"
UPLOAD_PRESET = "rejjane_produtos"
FOLDER       = "rejjane_vendas"
STUDIO_DIR   = Path(__file__).parent.parent / "public" / "produtos" / "studio"
OUT_FILE     = Path(__file__).parent / "urls_cloudinary.json"
URL          = f"https://api.cloudinary.com/v1_1/{CLOUD_NAME}/image/upload"


def upload(img: Path) -> str | None:
    with open(img, "rb") as f:
        resp = requests.post(
            URL,
            data={"upload_preset": UPLOAD_PRESET, "folder": FOLDER},
            files={"file": f},
            timeout=60,
        )
    if resp.status_code == 200:
        return resp.json()["secure_url"]
    print(f"\n  ERRO {resp.status_code}: {resp.text[:200]}")
    return None


def main():
    if not STUDIO_DIR.exists():
        print(f"Pasta nao encontrada: {STUDIO_DIR}")
        sys.exit(1)

    fotos = sorted(STUDIO_DIR.glob("*.png"))
    if not fotos:
        print("Nenhum PNG em", STUDIO_DIR)
        sys.exit(0)

    # retoma upload se ja existe progresso anterior
    if OUT_FILE.exists():
        with open(OUT_FILE) as f:
            resultados = json.load(f)
        feitos = {r["arquivo"] for r in resultados}
        print(f"Retomando — {len(feitos)} ja enviados")
    else:
        resultados = []
        feitos = set()

    pendentes = [f for f in fotos if f.name not in feitos]
    print(f"\nEnviando {len(pendentes)} fotos para o Cloudinary...\n")

    for i, foto in enumerate(pendentes, 1):
        print(f"  [{i:>3}/{len(pendentes)}] {foto.name}", end=" ... ", flush=True)
        url = upload(foto)
        if url:
            resultados.append({"arquivo": foto.name, "url": url})
            print("OK")
        else:
            print("FALHOU (sera tentada novamente na proxima execucao)")

        # salva progresso a cada 10 uploads
        if i % 10 == 0:
            with open(OUT_FILE, "w", encoding="utf-8") as f:
                json.dump(resultados, f, ensure_ascii=False, indent=2)

        time.sleep(0.3)  # evita rate-limit

    with open(OUT_FILE, "w", encoding="utf-8") as f:
        json.dump(resultados, f, ensure_ascii=False, indent=2)

    print(f"\n{len(resultados)}/{len(fotos)} fotos enviadas")
    print(f"URLs salvas em: {OUT_FILE}")
    print("\nProximo passo: py scripts/importar_produtos.js")


if __name__ == "__main__":
    main()
