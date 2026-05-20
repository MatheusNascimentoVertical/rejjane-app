import { PRODS } from '../data/constants';
import { fmtR$ } from '../lib/helpers';
import type { AppCtx } from '../types';
const prodBia       = '/produto-bia.jpg';
const prodCanecas   = '/produto-canecas.jpg';
const prodCamisetas = '/produto-camisetas.jpg';

type Props = { ctx: AppCtx };

const HERO = [
  { img: prodBia,       label: 'Canecas com nome',       sub: 'Vidro & cerâmica' },
  { img: prodCanecas,   label: 'Coleção Mães',            sub: 'Lançamento da estação' },
  { img: prodCamisetas, label: 'Camisetas mãe & filho(a)', sub: 'Combinando' },
];

const CATS = ['Camisetas', 'Canecas', 'Decoração', 'Kits'];

export function Catalogo({ ctx }: Props) {
  const { peds } = ctx;
  return (
    <div className="catalogo">
      <div className="cat-showcase">
        {HERO.map((h, i) => (
          <div key={i} className="cat-showcase-card">
            <img src={h.img} alt={h.label} />
            <div className="cat-showcase-overlay">
              <div className="cat-eyebrow">Vitrine</div>
              <div className="cat-title">{h.label}</div>
              <div className="cat-sub">{h.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {CATS.map(cat => (
        <section key={cat} className="cat-section">
          <header className="cat-section-head">
            <span className="cat-section-line" />
            <h2>{cat}</h2>
            <span className="cat-section-line" />
          </header>
          <div className="cat-grid">
            {PRODS.filter(p => p.cat === cat).map(p => {
              const qtdV = peds.filter(x => x.prodId === p.id).reduce((a, b) => a + b.qtd, 0);
              return (
                <div key={p.id} className="cat-prod">
                  <div className="cat-prod-img"><div className="cat-prod-emoji">{p.icon}</div></div>
                  <div className="cat-prod-body">
                    <div className="cat-prod-name">{p.nome}</div>
                    <div className="cat-prod-meta">{qtdV} vendidos</div>
                  </div>
                  <div className="cat-prod-price">{fmtR$(p.preco)}</div>
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
