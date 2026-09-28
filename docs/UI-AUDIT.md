# UI Audit — GenLabs Design System → Creator Academy Hub

Referência analisada: `System Design UXUI/genlabs-design-system/`
(`design-system.html` — catálogo de componentes; `assets/overview/design-system.html` — página de overview;
`assets/overview/assets/css/components.css`; `STACK.md`).

## 1. Natureza da referência

- **HTML estático** gerado no editor visual Aura, estilizado com **Tailwind 3.4 via CDN (runtime)**.
- Não há componentes React/Next reaproveitáveis nem CSS custom properties de cor: os tokens são as
  próprias utilities do Tailwind (paleta `zinc`, `neutral`, `orange`, `emerald`, `indigo`) e alguns estilos inline.
- Conclusão: **reproduzimos os princípios visuais em componentes React novos** (Tailwind v4), mapeando cada
  padrão para tokens CSS centralizados em `app/globals.css` e para componentes em `components/ui`.
- Regras de negócio da referência (landing page DeFi, votação, tokenomics, carrossel de depoimentos) **não** foram copiadas.

## 2. Tokens encontrados

### Tipografia
| Papel | Estilo na referência | Uso no produto |
| --- | --- | --- |
| Display | Inter 500, `text-5xl lg:text-[5rem]`, `leading-[0.95]`, `tracking-tighter`, 2ª linha em gradiente `from-zinc-400 to-zinc-200` font-light | Saudação da Home |
| Heading 1 | Inter 500, `text-3xl md:text-5xl`, `tracking-tighter`, `text-zinc-900`; palavra de destaque em gradiente `from-neutral-400 to-neutral-600` | Título de página / título da aula |
| Heading 3 | Inter 600, `text-xl`, `tracking-tight` | Títulos de seção, cards de formulário |
| Heading 4 (card) | Inter 600, `text-lg`, `tracking-tight` | Título de aula em cards |
| Lead | Inter 400, `text-base leading-relaxed text-zinc-500` | Subtítulos de página |
| Lead hero | Inter 500, `text-sm tracking-wide`, `border-l-2 border-zinc-200 pl-6` | Resumo da aula |
| Text 2 | Inter 400, `text-sm leading-relaxed text-zinc-500` | Textos de cards |
| Button | Inter 500, `text-sm tracking-tight` | Botões |
| Nav link | Inter 500, `text-xs uppercase tracking-widest text-zinc-500` → hover `text-zinc-900` | Navegação principal |
| Eyebrow | Inter 600, `text-[10px] uppercase tracking-widest text-zinc-400` | Rótulos ("Aula 03", métricas) |
| Micro badge | `text-[9px]/[10px] font-bold uppercase tracking-wide` | Badges de status |
| Mono | `font-mono` (ui-monospace) | Números de métricas, tamanhos de arquivo |

Família: **Inter** (pesos 200–700). **Não possui glyphs Bengali** → complementada com **Noto Sans Bengali**
(ver §6).

### Cores
- **Fundo da página**: `zinc-500` (#71717a) atrás do frame principal (visível em `xl`).
- **Frame principal**: `.glass-panel` = `rgba(255,255,255,.9)` + `backdrop-blur(12px)`, `xl:rounded-[2.5rem]`,
  `xl:border-white/50`, `xl:shadow-2xl`, com **linhas verticais** `w-px bg-zinc-950/5` (2 no mobile, 5 no xl).
- **Superfícies**: card `white`; hover/well `zinc-50`; trilha `zinc-100`; lattice `zinc-200`; escuro `zinc-900`/`zinc-800`.
- **Texto**: primário `zinc-900`; secundário `zinc-500`; badge `zinc-600`; muted/ícones `zinc-400`.
- **Acento primário**: laranja — `radial-gradient(circle at 10% 0%, #fed7aa, #fb923c)` com sombras internas
  (botão hero); `orange-500` em hovers de links/ícones e pontos pulsantes.
- **Positivo / ao vivo**: `emerald-500` / `emerald-400`.
- **Link de texto**: `zinc-900` → hover `indigo-600`.
- **Bordas**: hairline em gradiente (`--border-gradient`, máscara 1px), `zinc-200` (regra), `zinc-100` (card),
  `white/50–60` (vidro).

### Raios, sombras e espaçamento
- Raios: `rounded-full` (botões, pills, badges), `rounded-lg` (CTA do header), `rounded-xl` (inputs/wells),
  `rounded-2xl` (ring cards), `rounded-[2rem]` (bento, painel escuro, hero card), `rounded-[2.5rem]` (frame).
- **Ring shadow** (assinatura do sistema):
  `0 0 0 1px rgba(0,0,0,.06), 0 1px 1px -.5px …, 0 3px 3px -1.5px …, 0 6px 6px -3px …, 0 12px 12px -6px …, 0 24px 24px -12px rgba(0,0,0,.06)`.
- **Pill nav shadow**: `0 2px 3px -1px rgba(0,0,0,.1), 0 1px 0 0 rgba(25,28,33,.02), 0 0 0 1px rgba(25,28,33,.08)`.
- **Bevel shadow**: `0 18px 35px rgba(31,41,55,.25), 0 0 0 1px rgba(209,213,219,.3)`.
- Padding do frame: `px-6 md:px-10 xl:px-12`, `pt-6 md:pt-10 xl:pt-12`. Container máximo `xl:max-w-[1300px]`.
- Cards: `p-6` (ring card), `p-8` (célula bento, `min-h` generoso). Seções separadas por divisor
  `h-px bg-gradient-to-r from-transparent via-zinc-200 to-transparent opacity-60`.

### Movimento
- `transition-colors` 150–300ms (links, células), **arrow nudge** `group-hover:translate-x-1`,
  **button lift** `hover:-translate-y-0.5 hover:shadow-xl`, `animate-pulse` em pontos de status.
- Mantemos somente micro-interações; nada de carrosséis/3D (não servem ao produto). Respeitamos `prefers-reduced-motion`.

### Breakpoints
Padrão Tailwind (`sm 640`, `md 768`, `lg 1024`, `xl 1280`). Abaixo de `xl` o frame vai de borda a borda
(sem raio/borda/sombra). Nav em pill some abaixo de `md` na referência — no produto ela vira uma linha de pills
horizontal rolável (padrão do próprio catálogo no mobile), **sem depender de hover**.

## 3. Componentes reutilizáveis (padrões) e mapeamento

| Padrão da referência | Componente no produto |
| --- | --- |
| Header: disco do logo `from-black/60 to-black/20` + logotipo "GEN**LABS**" | `components/layout/brand.tsx` ("CREATOR**ACADEMY**") |
| Pill nav (`bg-white/50 border-white/60 rounded-full`, uppercase tracking-widest) | `components/layout/main-nav.tsx`, `components/ui/tabs.tsx` (PT/বাংলা) |
| Botão primário laranja (gradiente radial + poço de ícone `bg-black/10`) | `Button variant="primary"` |
| Botão bevel (`from-black/10 via-black/20 to-black/10` + hairline) | `Button variant="secondary"` |
| Chip escuro (`bg-zinc-900 rounded-full shadow-lg`) | `Button variant="dark"` |
| Link de texto com seta | `TextLink` |
| Frosted pill ("Foundations · 01") | `Eyebrow` (rótulo de página) |
| Audited badge (`bg-white border-zinc-100 rounded-full` + ponto pulsante) | `StatusBadge`, `Badge` |
| Ring card (`bg-white rounded-2xl` + ring shadow) | `Card` |
| Bento lattice (`bg-zinc-200 gap-px rounded-[2rem]`, células brancas `hover:bg-zinc-50`) | Grade de aulas (`LessonGrid`), métricas do dashboard |
| Social list (linhas com borda, chevron laranja no hover) | Lista de materiais, listas administrativas |
| Search bar (`bg-zinc-50 border-zinc-200 rounded-xl`) | `Input`, `Select`, `Textarea`, busca de alunos |
| Newsletter input (sublinhado) | Não usado em formulários longos (baixa affordance); referência para foco |
| Section header (h2 + lead + text link, `md:flex-row md:items-end`) | `PageHeader` |
| Stats row (eyebrow + valor) | Métricas do dashboard |
| Dark panel (`bg-zinc-900 rounded-[2rem]`) | Moldura do player do YouTube |

**Ausentes na referência** (criados seguindo os mesmos princípios): tabela, dialog de confirmação, toast,
select, textarea, estados vazio/erro/loading, menu do usuário, tabs, editor rich text.
- Dialog: `<dialog>` nativo como ring card `rounded-2xl` sobre backdrop `zinc-900/40` com blur.
- Toast: `sonner` com aparência de ring card (branco, texto zinc, ícone de status).
- Tabela: cabeçalho eyebrow (`text-[10px] uppercase tracking-widest zinc-400`), linhas `border-zinc-100`,
  hover `zinc-50`; no mobile vira lista de cards.
- Loading: skeletons `bg-zinc-100 animate-pulse` com os mesmos raios.
- Foco: `ring-2 ring-orange-400/40` + borda `orange-300` (acento da marca), sempre visível via `focus-visible`.
- Disabled: `opacity-50 pointer-events-none`.

## 4. Estrutura de layout

```
body (bg-zinc-500, xl:p-8)
└─ frame .glass-panel (xl:max-w-[1300px] xl:rounded-[2.5rem], linhas verticais de grade)
   ├─ header: brand | pill nav (md+) | idioma + menu do usuário
   ├─ nav mobile: pills horizontais roláveis (< md)
   ├─ main: PageHeader + conteúdo
   └─ footer discreto
```
- Página da aula: coluna editorial `max-w-[70ch]`, player em moldura escura `rounded-[2rem]`, materiais em lista.
- Admin: mesmo frame e header (nav própria), conteúdo em `Card`s e tabelas.

## 5. Decisões reaproveitadas

1. Identidade **zinc + vidro fosco + laranja** mantida integralmente; nenhuma cor nova de marca.
2. Headlines Inter 500 com `tracking-tighter`; corpo `zinc-500` `leading-relaxed`.
3. Todos os botões `rounded-full`; ação principal de cada tela em laranja (uma por tela).
4. Ring shadow como elevação padrão; bento lattice para grades de conteúdo.
5. Ícones: **lucide-react** (a referência declara Lucide) com `strokeWidth 1.5`, tamanhos 14–20px, `zinc-400`.
6. Tokens centralizados em `app/globals.css` (`@theme`) — sombras, fontes e utilitários `.glass-panel` e `.hairline`.

## 6. Bengali

- Inter não cobre o bloco Unicode Bengali (U+0980–09FF). Carregamos **Noto Sans Bengali** via `next/font`
  e a colocamos logo após Inter na pilha (`--font-sans`). O navegador usa Inter para latinos e Noto para Bengali
  — a identidade tipográfica portuguesa não muda.
- Em `html[lang="bn-BD"]`: `letter-spacing` negativo/largo é neutralizado (quebra conjuntos/matras),
  `line-height` do conteúdo é aumentado (1.9) e caixa alta não se aplica (Bengali não tem caixa).
- Escrita LTR — sem RTL.
