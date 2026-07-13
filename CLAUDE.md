# CLAUDE.md — Rejjanevendas App

Guia técnico para desenvolvedores e assistentes de IA trabalhando neste repositório.

## Visão geral

PWA de gestão de vendas diretas para revendedoras independentes (Avon, Boticário, Natura, Eudora, Tupperware). A usuária final (Rejane) cadastra clientes, cria pedidos, controla o caixa e acompanha métricas de venda pelo celular.

**Stack:** React 18 + TypeScript + Vite + Firebase (Auth, Firestore, Storage) + Framer Motion  
**Deploy:** Vercel (auto-deploy no push para `main`)  
**URL:** https://rejjane-app.vercel.app

---

## Comandos essenciais

```bash
npm run dev      # dev server em :5174
npm run build    # tsc + vite build (sempre roda antes de commitar)
npm run preview  # preview do build de produção
```

O build (`tsc && vite build`) é o único gate de qualidade — não há testes automatizados. **Sempre rodar antes de fazer push.**

---

## Arquitetura

### Layout geral

```
src/
  App.tsx              # raiz: estado global, roteamento por aba, sync Firestore
  app.css              # todo o CSS (design tokens, componentes, responsivo)
  types/index.ts       # todos os tipos TypeScript do domínio
  data/constants.ts    # dados seed, constantes de navegação, cache de produtos
  lib/
    firebase.ts        # inicialização Firebase (db, auth, storage)
    helpers.ts         # utilitários de data, formatação, aplicarMsg()
    cloudinary.ts      # upload de imagens via Cloudinary
  hooks/
    useAuth.ts         # observador de autenticação Firebase
    useSwipe.ts        # gesto de swipe para avançar status de pedido
    useCountUp.ts      # animação numérica
    useLocalStorage.ts # persistência local simples
  pages/               # páginas lazy-loaded (uma por aba)
  components/          # componentes de layout compartilhados
  modals/              # modais em sheet bottom
```

### Roteamento

Não há React Router. A navegação é controlada pelo estado `aba: Aba` em `App.tsx`. O tipo `Aba` é:

```ts
type Aba = 'dash' | 'pedidos' | 'clientes' | 'catalogo' | 'caixa' | 'analiticos' | 'config';
```

Todas as páginas são `lazy()` + `<Suspense>`. `AnimatePresence` do Framer Motion faz a transição entre abas.

### Estado global — AppCtx

Todo o estado da aplicação vive em `App.tsx` e é passado para os filhos via prop `ctx: AppCtx`. **Não há Context API nem Zustand.**

```ts
type AppCtx = {
  peds, setPeds       // Pedido[]
  clis, setClis       // Cliente[]
  fin,  setFin        // Lanc[]
  cfg,  setCfg        // Config (dados da empresa + mensagens)
  prods, setProds     // Produto[]
  modal, setModal     // ModalState | null
  ativos, atrasados   // pedidos derivados
  recMes, despMes     // totais financeiros do mês corrente
  fSt, search         // estado de filtros compartilhados
  avancar, salvarPed, zerarDados, sair, fechar
}
```

### Sync com Firestore

Cada setter chama `syncArr` / `syncProds` / `setDoc` **em toda mutação**. Isso significa que qualquer `setPeds(...)` dispara writes no Firestore imediatamente — não há debounce nem batching.

```ts
// Padrão de setter (App.tsx)
const setPeds = (upd) =>
  setPedsS(prev => {
    const next = typeof upd === 'function' ? upd(prev) : upd;
    if (!DEMO) syncArr('pedidos', prev, next);
    return next;
  });
```

`syncArr` faz diff entre `prev` e `next`: chama `setDoc` para itens novos/alterados e `deleteDoc` para removidos.

### Modo DEMO

Variável de ambiente `VITE_DEMO=true` ativa o modo demo: carrega dados seed de `constants.ts` em vez do Firestore, e ignora todos os writes. Útil para apresentações.

---

## Domínio de dados

### Coleções Firestore

| Coleção        | Tipo TS      | Chave       |
|--------------- |------------- |------------ |
| `pedidos`      | `Pedido`     | `id` (number) |
| `clientes`     | `Cliente`    | `id` (number) |
| `lancamentos`  | `Lanc`       | `id` (number) |
| `produtos`     | `Produto`    | `id` (string, ex: `'nat_ekos'`) |
| `config/main`  | `Config`     | documento único |

### Status de pedido (`PedStatus`)

```
orcamento → confirmado → encomendado → chegou → entregue → pago
                                                          ↘ cancelado
```

`PROX` em `constants.ts` mapeia cada status para o próximo. O hook `useSwipe` dispara `avancar(id)` que avança via esse mapa.

### Mensagens WhatsApp

`Config.msgs` tem um template por `MsgKey`. A função `aplicarMsg(template, ped, cfg)` em `helpers.ts` substitui variáveis `{nome}`, `{produto}`, `{total}` etc. com os dados reais do pedido.

---

## Componentes de UI

### Modais (bottom sheets)

Todos os modais usam `<Sheet>` (slide-up). O tipo `ModalState` em `types/index.ts` discrimina qual modal está aberto:

```ts
type ModalState =
  | { tipo: 'ped';  dados?: Partial<Pedido> }  // MPed.tsx
  | { tipo: 'cli';  dados: Partial<Cliente> }  // MCli.tsx
  | { tipo: 'fin';  dados: { tipo: ... } }     // MFin.tsx
  | { tipo: 'wpp';  ped: Pedido; msgTipo? }    // MWpp.tsx
  | { tipo: 'oc';   ped: Pedido }              // MOrc.tsx
  | { tipo: 'prod'; dados?: Partial<Produto> } // MCatalogo.tsx
```

`ModalRoot.tsx` renderiza o modal correto com base em `ctx.modal`.

### Navegação

- **Desktop (>720px):** `<Sidebar>` com todos os 7 itens via `NAV`
- **Mobile (≤720px):** `<BottomNav>` com todos os 7 itens via `BOTTOM_NAV`, scroll horizontal
- `SlidingIndicator` anima o fundo do item ativo em ambos

### Design tokens (CSS)

Todos em `app.css` dentro de `:root`:

```css
--cream / --cream-2 / --cream-3   /* fundos */
--ink / --ink-soft / --ink-mute   /* texto */
--rose / --rose-d / --rose-l / --rose-pale  /* cor primária */
--line / --line-2                 /* bordas */
--shadow-1 / --shadow-2           /* sombras */
```

---

## Boas práticas para mudanças

### Adicionar uma nova aba

1. Adicionar o literal ao tipo `Aba` em `App.tsx`
2. Criar `src/pages/MinhaAba.tsx` com `export function MinhaAba({ ctx })`
3. Adicionar `lazy()` import em `App.tsx`
4. Adicionar `{aba === 'minha-aba' && <MinhaAba ctx={ctx} />}` no JSX
5. Adicionar entrada em `NAV` e `BOTTOM_NAV` em `constants.ts`
6. Adicionar ícone SVG em `NavIcon.tsx`

### Adicionar campo ao Config

`Config` em `types/index.ts` → atualizar `CFG0` em `constants.ts` (valor padrão) → adicionar input em `Config.tsx`.

### Lookup de produto

**Nunca usar `getProd()` dentro de componentes React** — o cache de módulo pode estar desatualizado. Usar sempre:

```ts
const prod = ctx.prods.find(x => x.id === prodId);
// ou, em modais:
const prodList = ctx.prods.length > 0 ? ctx.prods : PRODS;
```

### CSS

Não há CSS modules nem Tailwind. Tudo é CSS global em `app.css`. Convenção de nomes:
- `.rj-*` — layout raiz
- `.sb-*` — sidebar
- `.bn-*` — bottom nav
- `.ped-*` — cards de pedido
- `.cx-*` — caixa
- `.an-*` — analiticos
- `.cfg-*` — config
- `.card-soft` — card base reutilizável

---

## Variáveis de ambiente

| Variável              | Obrigatória | Descrição |
|---------------------- |------------ |---------- |
| `VITE_DEMO`           | Não         | `'true'` ativa modo demo sem Firebase |
| Firebase config       | Sim         | Hardcoded em `src/lib/firebase.ts` (projeto `rejjanevendas-9d679`) |

---

## Deploy

Push para `main` → Vercel detecta e faz build automático. Não há CI/CD adicional. O build deve passar (`npm run build` sem erros) antes do push.
