# Rejjanevendas — Portal de Gestão de Vendas Diretas

PWA mobile-first para revendedoras independentes gerenciarem pedidos, clientes, caixa e métricas de venda. Desenvolvido para Rejane, revendedora de Avon, Boticário, Natura, Eudora e Tupperware.

**URL:** https://rejjane-app.vercel.app

---

## Funcionalidades

| Aba | Descrição |
|-----|-----------|
| 🏠 Início | Painel com resumo do dia, pedidos ativos, alertas de atraso e atalhos |
| 📦 Pedidos | Criação e gestão de pedidos com filtros, status e envio de mensagem WhatsApp |
| 👤 Clientes | Cadastro de clientes com histórico, favoritos e contato direto |
| 📚 Catálogo | Produtos por marca com preço, estoque, destaque e ativo/inativo |
| 💵 Caixa | Lançamentos, navegação por mês, métricas e lista de A Receber |
| 📊 Análise | Faturamento, gráficos, devedoras, top produtos e insights automáticos |
| ⚙️ Ajustes | Dados da loja, templates de mensagem WhatsApp, guia de uso |

---

## Stack técnica

| Tecnologia | Uso |
|-----------|-----|
| React 18 + TypeScript | Interface |
| Vite | Build e dev server |
| Firebase Firestore | Banco de dados em tempo real |
| Firebase Auth | Autenticação por e-mail/senha |
| Firebase Storage | Upload de fotos de produto |
| Framer Motion | Animações e transições de página |
| Cloudinary | CDN de imagens (via `lib/cloudinary.ts`) |
| Vercel | Hospedagem e deploy contínuo |

---

## Estrutura do projeto

```
src/
├── App.tsx                 # Estado global, roteamento por aba, sync Firestore
├── app.css                 # CSS completo (design tokens → componentes → responsivo)
├── types/index.ts          # Tipos TypeScript de domínio
├── data/constants.ts       # Seed data, NAV, BOTTOM_NAV, status, mensagens padrão
├── lib/
│   ├── firebase.ts         # Instância Firebase (db, auth, storage)
│   ├── helpers.ts          # Formatação, datas, aplicarMsg()
│   └── cloudinary.ts       # Upload de imagens
├── hooks/
│   ├── useAuth.ts          # Observador de sessão Firebase
│   ├── useSwipe.ts         # Gesto de swipe em cards de pedido
│   ├── useCountUp.ts       # Animação numérica progressiva
│   └── useLocalStorage.ts  # Persistência local
├── pages/                  # Páginas (lazy-loaded)
│   ├── Dashboard.tsx
│   ├── Pedidos.tsx
│   ├── Clientes.tsx
│   ├── Catalogo.tsx
│   ├── Caixa.tsx
│   ├── Analiticos.tsx
│   ├── Config.tsx
│   └── Login.tsx
├── modals/                 # Bottom sheets
│   ├── ModalRoot.tsx       # Roteador de modais
│   ├── Sheet.tsx           # Componente base de sheet
│   ├── MPed.tsx            # Modal de pedido
│   ├── MCli.tsx            # Modal de cliente
│   ├── MFin.tsx            # Modal de lançamento financeiro
│   ├── MWpp.tsx            # Modal de mensagem WhatsApp
│   ├── MOrc.tsx            # Modal de orçamento (PDF)
│   └── MCatalogo.tsx       # Modal de produto
└── components/
    ├── Sidebar.tsx
    ├── BottomNav.tsx
    ├── Topbar.tsx
    ├── NavIcon.tsx
    ├── SlidingIndicator.tsx
    ├── BackgroundDecor.tsx
    └── Avatar3D.tsx
```

---

## Arquitetura de estado

Não há Context API, Redux nem Zustand. Todo o estado vive em `App.tsx` e é propagado por props via `AppCtx`:

```ts
// ctx passado para todas as páginas e modais
{ peds, setPeds, clis, setClis, fin, setFin, cfg, setCfg, prods, setProds,
  modal, setModal, ativos, atrasados, recMes, despMes,
  avancar, salvarPed, zerarDados, sair, fechar, fSt, search }
```

Cada setter envolve `syncArr` / `setDoc` do Firestore — qualquer mutação persiste **imediatamente**, sem debounce.

---

## Status de pedido

```
orcamento → confirmado → encomendado → chegou → entregue → pago
                                                          ↘ cancelado
```

O swipe horizontal em um card de pedido avança para o próximo status. Ao chegar em `pago`, o valor restante (vTotal − sinal) é registrado automaticamente como lançamento de entrada no Caixa.

---

## Mensagens WhatsApp

Templates configuráveis por status em **Ajustes → Mensagens**. Variáveis disponíveis:

| Variável | Substituído por |
|---------|----------------|
| `{nome}` | Nome da cliente |
| `{produto}` | Nome(s) do(s) produto(s) |
| `{total}` | Valor total do pedido |
| `{sinal}` | Valor do sinal pago |
| `{restante}` | Valor ainda devido |
| `{prazo}` | Data de entrega |
| `{vencimento}` | Data de vencimento do pagamento |
| `{qtd}` | Quantidade |
| `{vUnit}` | Valor unitário |
| `{instagram}` | @ do Instagram configurado |

---

## Desenvolvimento local

```bash
git clone <repo>
cd rejjane-app
npm install
npm run dev          # http://localhost:5174
npm run build        # verificar antes de commitar
```

### Variáveis de ambiente

| Variável | Padrão | Descrição |
|---------|--------|-----------|
| `VITE_DEMO` | — | Definir como `true` para modo demo (sem Firebase, com dados seed) |

A configuração do Firebase está hardcoded em `src/lib/firebase.ts` (projeto `rejjanevendas-9d679`).

---

## Deploy

Push para `main` → Vercel faz build e deploy automaticamente. Não há CI adicional. O build deve passar (`npm run build` sem erros TypeScript) antes do push.

---

## Instalação como app (PWA)

**Android (Chrome):**
1. Abrir https://rejjane-app.vercel.app no Chrome
2. Menu ⋮ → "Adicionar à tela inicial"
3. Confirmar — o ícone aparece na tela inicial

**iPhone (Safari):**
1. Abrir o link no Safari
2. Botão compartilhar ↑ → "Adicionar à Tela de Início"
3. Confirmar

---

## Licença

Uso privado — desenvolvido sob encomenda para uso exclusivo de Rejane.
