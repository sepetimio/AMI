# Reforma visual — Fatia A (base + home) — plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** O site passa a ter a base visual aprovada (cores, fontes, botões, cabeçalho, rodapé, barra do pé) e a home fica igual ao desenho `docs/desenho-aprovado/home-aprovada.html`, no computador, no tablet e no celular.

**Architecture:** Os nomes de cor do `@theme` ficam e mudam de valor, para o site inteiro trocar de tom de uma vez. Cada seção nova da home é um componente com seu próprio CSS Module, **transcrito das regras do desenho aprovado** (que já foram medidas em 12 rodadas), trocando código de cor por `var(--color-…)`. As peças repetidas (botão, rótulo, ladrilho de ícone, textura verde) viram classes em `app/globals.css`. Lógica que pode ser testada sem navegador (fita do carrossel, trava das molduras, dados do banner, anos de AMI) fica em funções puras em `lib/`.

**Tech Stack:** Next.js 16 (App Router), React 19, Tailwind 4 (`@theme`), CSS Modules, Sanity 6, Vitest, `next/font/google`, `@phosphor-icons/react` (novo).

**Spec:** `docs/superpowers/specs/2026-10-03-redesign-visual-design.md` — leia inteiro antes de começar. O desenho `docs/desenho-aprovado/home-aprovada.html` abre no navegador e é a referência de todo valor visual; quando o plano e o desenho discordarem num valor, vale o desenho.

## Global Constraints

- Texto que o usuário lê: português. Mensagens de commit: português **sem acento**.
- Este Next.js tem mudanças em relação ao que você conhece: antes de usar API do Next, leia o guia em `node_modules/next/dist/docs/`.
- **Nenhum número de contraste escrito de memória.** Os da spec foram medidos em 03/10/2026; qualquer outro, meça.
- **Nenhum comentário promete o que o código não faz.** Este projeto já teve oito casos.
- **Prove por mutação** toda asserção nova: quebre o código de propósito, veja o teste ficar vermelho, desfaça (`git checkout -- <arquivo>`), confira `git status`.
- Rodar em toda tarefa: `npx vitest run` · `npx tsc --noEmit` · `npm run build`.
- Nunca use `Write` num arquivo existente sem ler antes. O repositório mistura CRLF e LF: edições cirúrgicas.
- Servidor de desenvolvimento do controlador na porta 3000: não derrube. Precisando de produção: `npx next start -p 3300`, e derrube pelo PID no fim (no Windows o filho sobrevive ao stop: `Get-NetTCPConnection -LocalPort 3300`).
- Você **não** despacha subagentes.
- **O que o cliente recusou e não pode voltar** (spec, seção 2): fundo creme; verde-limão claro como fundo; sombra com tom de verde; passar o mouse e ficar verde claro; botão verde chapado ou quase preto; caixa atrás de caixa; celular que só empilha; nada cortado na borda do celular; espaços desiguais; desalinhamento.
- **Tradução de cor do desenho para o site** (use sempre o token, nunca o código):

  | No desenho | No site |
  |---|---|
  | `--chao #EEF1EF` | `var(--color-canvas)` |
  | `--painel #FFFFFF` | `var(--color-surface)` |
  | `--painel-2 #F6F7F8` | `var(--color-surface-fundo)` |
  | `--linha #E5E7EB` | `var(--color-line)` |
  | `#D1D5DB` / `#C4C9D1` (borda no hover) | `var(--color-line-strong)` |
  | `--tinta #0c0e12` | `var(--color-ink-900)` |
  | `--tinta-2 #4F5661` | `var(--color-ink-600)` |
  | `--tinta-3 #646B75` | `var(--color-ink-400)` |
  | `--v900` … `--v600` | `var(--color-ami-green-900)` … `-600` |
  | `--lima #A8D470` | `var(--color-ami-lima-400)` |

  Sombras do desenho usam `rgba(16,24,40,…)`: copie como estão (são neutras).
- **Réguas** (spec seção 4): margem interna `--m` 48/28/20px; espaço entre blocos `--ritmo` 72/56/32px; pontos de quebra 1180px (menu), 980px (tablet), 700px (celular), 560px e 400px como no desenho.
- **Marcas para a auditoria visual** (tarefa 11 depende delas): todo bloco de primeiro nível da home leva `data-bloco="<nome>"` (`carrossel`, `numeros`, `encontre`, `sua-ami`, `associe`, `noticias`, `bairros`); o primeiro texto de cada seção (o rótulo pequeno) leva `data-coluna`.

---

### Task 1: A base visual — cores, fontes, botões, textura

**Files:**
- Modify: `app/globals.css` (valores do `@theme`, base de `h1-h3`, classes novas em `@layer components`)
- Modify: `lib/fontes.ts`
- Modify: `app/layout.tsx` (variáveis das fontes no `<html>`, se mudarem de nome)
- Modify: `components/base/Chip.tsx`
- Modify: os arquivos que usam `ami-lima-100` (lista abaixo)
- Create: `public/textura/grao.png` e `scripts/gerar-grao.mjs`
- Test: `testes/paleta.test.ts`, `testes/base-visual.test.ts` (novo)

**Interfaces:**
- Produces (classes de `app/globals.css`, usadas por todas as tarefas seguintes):
  - `.botao` — pílula principal, 48px, degradê `#2B8229 → #1F6B1D`, hover `#22751F → #1A5E18`
  - `.botao-linha` — pílula secundária, 38px, branca, borda `line`
  - `.botao-arte` — pílula verde-limão de 48px, das artes do carrossel
  - `.rotulo-secao` — o rótulo pequeno em caixa alta (`.sobre` do desenho)
  - `.ladrilho-icone` — o ladrilho cinza de 52px com ícone verde (variante `.ladrilho-icone--pequeno` de 44px)
  - `.textura-verde` — fundo verde com degradê, brilho e grão (o `.encontre` do desenho, sem o layout)
  - `.brilho` — o círculo de luz que passeia
  - utilitários de régua: `--m`, `--ritmo`, `--gap` em `:root`, com os pontos de quebra

- [ ] **Step 1: Escrever os testes que travam a base nova**

Em `testes/paleta.test.ts`, nas listas curadas de pares que ele já tem, troque os valores esperados para os da spec (seção 4) e acrescente:

```ts
describe("a base aprovada em 03/10/2026", () => {
  it("os fundos sao os novos, nao o creme", () => {
    expect(T["canvas"]).toBe("#EEF1EF");
    expect(T["surface"]).toBe("#FFFFFF");
    expect(T["surface-fundo"]).toBe("#F6F7F8");
    expect(T["line"]).toBe("#E5E7EB");
    expect(T["line-strong"]).toBe("#D1D5DB");
  });

  it("o lima-100 deixou de existir: o cliente leu como amarelado", () => {
    expect(T["ami-lima-100"]).toBeUndefined();
  });

  it("o texto mais apertado continua passando", () => {
    /* ink-400 sobre o fundo da pagina: 4,73:1 medido em 03/10/2026. */
    expect(razaoDeContraste(T["ink-400"], T["canvas"])).toBeGreaterThanOrEqual(4.5);
  });

  it("branco passa nos dois extremos do degrade do botao", () => {
    for (const fundo of ["#2B8229", "#1F6B1D", "#22751F", "#1A5E18"]) {
      expect(razaoDeContraste("#FFFFFF", fundo), fundo).toBeGreaterThanOrEqual(4.5);
    }
  });
});
```

E crie `testes/base-visual.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { fonte } from "@/testes/apoio";

const CSS = fonte("../app/globals.css");
const FONTES = fonte("../lib/fontes.ts");

describe("a base visual", () => {
  it("titulo em Bricolage Grotesque e texto em Plus Jakarta Sans", () => {
    expect(FONTES).toMatch(/Bricolage_Grotesque\(/);
    expect(FONTES).toMatch(/Plus_Jakarta_Sans\(/);
  });

  it("o CRM continua em Geist Mono", () => {
    expect(FONTES).toMatch(/Geist_Mono\(/);
  });

  it("existem as pecas que as secoes usam", () => {
    for (const c of [".botao", ".botao-linha", ".botao-arte", ".rotulo-secao", ".ladrilho-icone", ".textura-verde", ".brilho"]) {
      expect(CSS, `falta ${c}`).toContain(`${c} {`);
    }
  });

  it("nenhuma sombra tem tom de verde", () => {
    const sombras = CSS.match(/box-shadow:[^;]*;/g) ?? [];
    for (const s of sombras) {
      expect(s, s).not.toMatch(/rgba\(\s*(7|13|26|36)\s*,\s*(26|46|94|131)\s*,/);
    }
  });

  it("a textura e uma imagem pequena, nao filtro SVG", () => {
    expect(CSS).toContain("/textura/grao.png");
    expect(CSS).not.toContain("feTurbulence");
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run testes/paleta.test.ts testes/base-visual.test.ts`
Expected: FAIL (valores antigos, fontes antigas, classes inexistentes).

- [ ] **Step 3: Trocar os valores do `@theme`**

Em `app/globals.css`, troque só os valores (os nomes ficam), conforme a tabela da spec, seção 4. **Apague** `--color-ami-lima-100`. Reescreva o comentário de cada token para dizer o que é hoje (fundo branco-gelo, não creme), sem números escritos de memória — os números estão medidos na spec e o teste recalcula. Troque os raios: `--radius-controle: 999px` (botões viram pílula), `--radius-bloco: 18px`, `--radius-painel: 22px`. As sombras `--shadow-*` já são neutras (`rgba(12,14,18,…)`); troque para `rgba(16,24,40,…)` com os mesmos valores do `--sombra` do desenho: `0 1px 2px rgba(16,24,40,.04), 0 12px 32px rgba(16,24,40,.06)` para `--shadow-erguido`.

Na base (`@layer base`): `h1, h2, h3` passam a `font-weight: 500` e `letter-spacing: -0.035em`, com os tamanhos do desenho (`h2` = `clamp(30px, 3.2vw, 42px)`, `line-height: 1.08`, `max-width: 19ch`); `body` com `font-size: 16px` e `line-height: 1.65`.

- [ ] **Step 4: Trocar as fontes**

`lib/fontes.ts`:

```ts
import { Bricolage_Grotesque, Geist_Mono, Plus_Jakarta_Sans } from "next/font/google";

/* Texto corrido. Escolhida pelo cliente em 03/10/2026, junto da
   Bricolage nos títulos: "as fontes do site estão muito simples". */
export const fonteCorpo = Plus_Jakarta_Sans({
  subsets: ["latin-ext"],
  display: "swap",
  variable: "--fonte-corpo",
});

/* Títulos. Opção C de três mostradas lado a lado no desenho. */
export const fonteTitulo = Bricolage_Grotesque({
  subsets: ["latin-ext"],
  display: "swap",
  variable: "--fonte-titulo",
});

/* Mantenha aqui o comentário que já existe sobre o CRM em monoespaçada:
   o motivo continua valendo. */
export const fonteRegistro = Geist_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
  variable: "--fonte-registro",
});
```

Em `app/globals.css`: `--font-titulo: var(--fonte-titulo), system-ui, sans-serif;`. Em `app/layout.tsx`, acrescente `fonteTitulo.variable` ao `className` do `<html>` (hoje só há corpo e registro). Confira com `next/font` se `Bricolage_Grotesque` aceita `subsets: ["latin-ext"]`; se não, `["latin"]`.

- [ ] **Step 5: As peças compartilhadas**

Em `app/globals.css`, `@layer components`, transcreva do desenho (`docs/desenho-aprovado/home-aprovada.html`, bloco `<style>`), trocando cor por token:

- `.botao` ← regras `.botao`, `.botao:hover`, `.botao i` e `.botao:hover i` do desenho (versão final, com o degradê `#2B8229 → #1F6B1D`, hover `#22751F → #1A5E18`, `box-shadow: inset 0 1px 0 rgba(255,255,255,.16), 0 1px 2px rgba(16,24,40,.22)`, `white-space: nowrap`, altura 48px). O ícone dentro do botão é `svg`, não `i`: use `.botao svg`.
- `.botao-linha` ← `.botao-linha` e `.botao-linha:hover` (sem verde no hover).
- `.botao-arte` ← `.arte-cta` (verde-limão, texto `ami-green-900`, 48px, `nowrap`).
- `.rotulo-secao` ← `.sobre`.
- `.ladrilho-icone` ← `.icone` e `.icone i` (versão neutra: `linear-gradient(150deg, #F3F4F6 0%, #FAFAFB 100%)` com `inset 0 0 0 1px rgba(16,24,40,.07)`); `.ladrilho-icone--pequeno` ← `.quem .icone`/`.cartao .icone` (44px, raio 14px).
- `.textura-verde` ← o `background` de `.encontre` (três camadas: dois brilhos radiais e o degradê `#123F11 → #0D2E0C → #071A07`) mais um `::before` com `background-image: url("/textura/grao.png")`, `opacity: .22`, `mix-blend-mode: overlay`.
- `.brilho` ← `.brilho` e o `@keyframes deriva`.
- `:root` com `--m: 48px; --ritmo: 72px; --gap: 24px;` e os `@media` de 980px (`28px / 56px / 16px`) e 700px (`20px / 32px / 12px`).

Foco visível: a regra `:focus-visible` que já existe fica; acrescente, para fundo escuro, `.textura-verde :focus-visible, footer :focus-visible { outline-color: var(--color-ami-lima-400); }`.

- [ ] **Step 6: A textura em PNG**

Crie `scripts/gerar-grao.mjs`, que escreve `public/textura/grao.png` (240 × 240, cinza com alfa, ruído aleatório com semente fixa, para o arquivo sair igual a cada vez), usando só `node:zlib` e `node:fs`:

```js
import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";

/* Textura granulada do verde (bloco de busca e rodapé). O desenho usava um
   filtro SVG; no site é PNG pequeno repetido, porque o filtro é redesenhado
   a cada rolagem. Semente fixa: rodar de novo gera o mesmo arquivo. */
const L = 240;
let s = 20261003;
const aleatorio = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32);

const linhas = Buffer.alloc((L * 2 + 1) * L);
for (let y = 0; y < L; y++) {
  linhas[y * (L * 2 + 1)] = 0; // filtro "nenhum" da linha
  for (let x = 0; x < L; x++) {
    const i = y * (L * 2 + 1) + 1 + x * 2;
    linhas[i] = 255;                               // cinza: branco
    linhas[i + 1] = Math.round(aleatorio() * 230); // alfa: o grão
  }
}

const crc = (b) => {
  let c = ~0;
  for (const byte of b) { c ^= byte; for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1)); }
  return ~c >>> 0;
};
const pedaco = (tipo, dados) => {
  const t = Buffer.from(tipo);
  const tam = Buffer.alloc(4); tam.writeUInt32BE(dados.length);
  const c = Buffer.alloc(4); c.writeUInt32BE(crc(Buffer.concat([t, dados])));
  return Buffer.concat([tam, t, dados, c]);
};
const cabeca = Buffer.alloc(13);
cabeca.writeUInt32BE(L, 0); cabeca.writeUInt32BE(L, 4);
cabeca[8] = 8; cabeca[9] = 4; // 8 bits, cinza com alfa

mkdirSync("public/textura", { recursive: true });
writeFileSync("public/textura/grao.png", Buffer.concat([
  Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
  pedaco("IHDR", cabeca),
  pedaco("IDAT", deflateSync(linhas)),
  pedaco("IEND", Buffer.alloc(0)),
]));
console.log("public/textura/grao.png");
```

Run: `node scripts/gerar-grao.mjs` e confira que o arquivo abre como imagem (Read do arquivo mostra o grão).

- [ ] **Step 7: Tirar o `ami-lima-100` de todo lugar**

A rede de `testes/paleta.test.ts` reprova classe que aponta para token inexistente: depois do Step 3, ela lista cada uso. Os usos de hoje, conferidos por grep em 03/10/2026:
`app/(site)/associacao/page.tsx:149`, `app/(site)/medico/[slug]/page.tsx:159,214,221`, `app/(site)/medicos/[especialidade]/page.tsx:228`, `app/(site)/medicos/[especialidade]/[bairro]/page.tsx:138`, `app/(site)/noticias/[slug]/page.tsx:191`, `components/base/Chip.tsx:29`, `components/diretorio/IndiceEspecialidades.tsx:43`, `components/diretorio/LinhaMedico.tsx:116`, `components/diretorio/PainelFiltros.tsx:207,224,238`.

Regra para cada um: se é **efeito de mouse** (`hover:bg-ami-lima-100`), troque por `hover:border-line-strong` mais a sombra neutra que o elemento já tenha — **nunca outro verde**. Se é **fundo permanente**, troque por `bg-surface-fundo`. O `Chip` tom "associado" vira contorno:

```ts
associado: "bg-transparent text-ami-green-700 border-ami-green-600",
```

e reescreva o comentário do `Chip` (o atual fala de `lima-100`).

- [ ] **Step 8: A rede também enxerga CSS Module**

Em `testes/paleta.test.ts`, a lista `FONTES` lê `.tsx` de `app` e `components`. Acrescente os `*.module.css` e o próprio `app/globals.css`, procurando `var(--color-<token>)`, para que um token apagado usado num CSS Module também reprove. Prove: crie um `components/x.module.css` temporário com `color: var(--color-ami-lima-100)`, veja vermelho, apague.

- [ ] **Step 9: Rodar tudo**

Run: `npx vitest run` · `npx tsc --noEmit` · `npm run build`
Expected: tudo verde. Abra 2 ou 3 páginas no servidor da porta 3000 e confira que a fonte e o fundo mudaram.

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "Base visual aprovada: fundo branco-gelo, Bricolage e Plus Jakarta, botoes em pilula e textura do verde"
```

---

### Task 2: Ícones de dois tons

**Files:**
- Modify: `package.json` (dependência `@phosphor-icons/react`)
- Create: `components/base/Icone.tsx`
- Test: `testes/icones.test.ts`

**Interfaces:**
- Produces: `Icone` e `LadrilhoIcone`:

```tsx
export type NomeIcone =
  | "selo" | "estetoscopio" | "batimento" | "mapa" | "bandeira" | "olho"
  | "maoCoracao" | "predio" | "lupa" | "seta" | "setaDiagonal" | "anterior"
  | "proximo" | "pausar" | "retomar" | "menu" | "fechar" | "telefone";
export function Icone(props: { nome: NomeIcone; tamanho?: number; duotone?: boolean; className?: string }): JSX.Element;
export function LadrilhoIcone(props: { nome: NomeIcone; pequeno?: boolean }): JSX.Element;
```

- [ ] **Step 1: Instalar**

Run: `npm install @phosphor-icons/react`

- [ ] **Step 2: Teste**

```ts
import { describe, expect, it } from "vitest";
import { renderToString } from "react-dom/server";
import { createElement } from "react";
import { fonte } from "@/testes/apoio";
import { Icone, LadrilhoIcone } from "@/components/base/Icone";

describe("os icones", () => {
  it("saem como SVG no servidor, sem fonte de icones", () => {
    const html = renderToString(createElement(Icone, { nome: "estetoscopio" }));
    expect(html).toMatch(/^<svg/);
  });

  it("decorativos ficam fora do leitor de tela", () => {
    const html = renderToString(createElement(LadrilhoIcone, { nome: "selo" }));
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain("ladrilho-icone");
  });

  it("importa so os icones usados, pelo caminho de servidor", () => {
    const src = fonte("../components/base/Icone.tsx");
    expect(src).toContain("@phosphor-icons/react/dist/ssr");
    expect(src).not.toMatch(/from "@phosphor-icons\/react"\s*;/);
  });
});
```

- [ ] **Step 3: Implementar**

`components/base/Icone.tsx` importa de `@phosphor-icons/react/dist/ssr` exatamente: `SealCheck, Stethoscope, Heartbeat, MapPinArea, FlagBanner, Eye, HandHeart, Buildings, MagnifyingGlass, ArrowRight, ArrowUpRight, CaretLeft, CaretRight, Pause, Play, List, X, Phone` (confira os nomes exportados em `node_modules/@phosphor-icons/react/dist/ssr/index.d.ts`; o desenho usa as classes `ph-seal-check`, `ph-stethoscope`, `ph-heartbeat`, `ph-map-pin-area`, `ph-flag-banner`, `ph-eye`, `ph-hand-heart`, `ph-buildings`). Mapa `NomeIcone → componente`; `Icone` passa `weight={duotone ? "duotone" : "regular"}`, `size={tamanho ?? 20}`, `aria-hidden`. `LadrilhoIcone` = `<span className={"ladrilho-icone" + (pequeno ? " ladrilho-icone--pequeno" : "")} aria-hidden="true"><Icone nome={nome} duotone tamanho={pequeno ? 23 : 28} /></span>`.

- [ ] **Step 4: Rodar, provar por mutação (troque o caminho do import para o de cliente), commit**

```bash
git add -A
git commit -m "Icones de dois tons como SVG, so os usados"
```

---

### Task 3: Cabeçalho e menu em gaveta

**Files:**
- Modify: `components/layout/Cabecalho.tsx`, `components/layout/MenuPrincipal.tsx`
- Test: `testes/cabecalho.test.ts` (novo)

**Interfaces:**
- Consumes: `.botao` (Task 1), `Icone` (Task 2).
- Produces: `MENU` exportado de `MenuPrincipal.tsx`:

```ts
export const MENU: { rotulo: string; href: string }[] = [
  { rotulo: "Início", href: "/" },
  { rotulo: "A Associação", href: "/associacao" },
  { rotulo: "Encontre um médico", href: "/busca" },
  { rotulo: "Especialidades", href: "/medicos" },
  { rotulo: "Sua AMI", href: "/#sua-ami" },
  { rotulo: "Notícias", href: "/noticias" },
  { rotulo: "Contato", href: "/contato" },
];
```

- [ ] **Step 1: Teste**

```ts
import { describe, expect, it } from "vitest";
import { fonte, semComentarios } from "@/testes/apoio";
import { MENU } from "@/components/layout/MenuPrincipal";

const MENU_SRC = semComentarios(fonte("../components/layout/MenuPrincipal.tsx"));
const CAB = semComentarios(fonte("../components/layout/Cabecalho.tsx"));
const LAYOUT = semComentarios(fonte("../app/(site)/layout.tsx"));

describe("o cabecalho", () => {
  it("tem os sete itens aprovados, nesta ordem", () => {
    expect(MENU.map((m) => m.rotulo)).toEqual([
      "Início", "A Associação", "Encontre um médico", "Especialidades", "Sua AMI", "Notícias", "Contato",
    ]);
  });

  it("e filho direto do layout, para ficar preso a pagina inteira", () => {
    /* O defeito achado no desenho: preso a um bloco, sumia quando o bloco acabava. */
    expect(LAYOUT).toMatch(/<Cabecalho \/>\s*<main/);
  });

  it("vira gaveta abaixo de 1180px, com aria-expanded e fecha com Esc", () => {
    expect(MENU_SRC).toContain("aria-expanded");
    expect(MENU_SRC).toContain('"Escape"');
    expect(MENU_SRC).toMatch(/1180/);
  });

  it("tem o botao Seja associado", () => {
    expect(CAB).toContain("Seja associado");
    expect(CAB).toContain("/associacao/seja-associado");
  });
});
```

- [ ] **Step 2: Rodar e ver falhar.**

- [ ] **Step 3: Implementar**

`Cabecalho.tsx` (servidor): mantém `sticky top-0 z-30` no `<header>` (já é filho direto do corpo pelo layout — confira em `app/(site)/layout.tsx`, e não embrulhe em nada que termine antes do fim da página). Dentro: bloco branco com `rounded-painel`, altura útil do desenho (`.cabeca`: `padding: 10px 12px 10px var(--m)`), `<Marca altura={40} />` (32 no celular), `<MenuPrincipal />`, link `.botao` compacto "Seja associado" (o `.seja` do desenho: 40px, 36px no celular).
O vidro ao rolar do desenho (`.cabeca.rolou`) é feito **sem JavaScript**, com linha do tempo de rolagem, dentro de `@supports (animation-timeline: scroll())`:

```css
@keyframes vidro-ao-rolar { to { background: rgba(255,255,255,.82); box-shadow: 0 10px 34px rgba(16,24,40,.12); backdrop-filter: saturate(1.5) blur(16px); } }
.cabeca-bloco { animation: vidro-ao-rolar linear both; animation-timeline: scroll(root); animation-range: 0 40px; }
```

`MenuPrincipal.tsx` (cliente): em linha acima de 1180px (os sete itens com `white-space: nowrap`, sublinhado fino `ami-green-800` que cresce da esquerda, item atual marcado com `aria-current="page"`; "Início" só é atual em `/` exato). Abaixo de 1180px, botão `.abre-menu` de 40px (36 no celular) com `Icone nome="menu"`/`"fechar"`, `aria-expanded`, `aria-controls="gaveta"`, e a gaveta (`.gaveta` do desenho: bloco branco abaixo do cabeçalho, links de 14px de respiro). Fecha com X, `Escape` (devolve o foco ao botão), clique fora e escolha de item. Transcreva as regras `.menu`, `.menu a::after`, `.abre-menu`, `.gaveta` do desenho para `components/layout/Cabecalho.module.css`.

- [ ] **Step 4: Rodar, provar por mutação (tire o `"Escape"`), conferir no servidor da 3000 em 1440px e 390px que o cabeçalho fica no topo do começo ao fim da página. Commit.**

```bash
git add -A
git commit -m "Cabecalho fino com os sete itens e menu em gaveta abaixo de 1180px"
```

---

### Task 4: Rodapé verde e barra do pé no celular

**Files:**
- Modify: `components/layout/Rodape.tsx`
- Create: `components/layout/BarraDoPe.tsx`, `components/layout/Rodape.module.css`, `components/layout/BarraDoPe.module.css`
- Modify: `app/(site)/layout.tsx`
- Test: `testes/rodape.test.ts` (novo)

**Interfaces:**
- Consumes: `.textura-verde`, `.brilho` (Task 1), `Icone` (Task 2), `AMI`, `hrefTelefone` de `lib/ami.ts`, `DADOS_DEMONSTRACAO`.
- Produces: `<BarraDoPe />` (cliente, sem props).

- [ ] **Step 1: Teste**

```ts
import { describe, expect, it } from "vitest";
import { fonte, semComentarios } from "@/testes/apoio";

const ROD = semComentarios(fonte("../components/layout/Rodape.tsx"));
const BARRA = semComentarios(fonte("../components/layout/BarraDoPe.tsx"));
const LAYOUT = semComentarios(fonte("../app/(site)/layout.tsx"));

describe("o rodape", () => {
  it("tem as tres colunas do desenho", () => {
    for (const t of ["A Associação", "Encontre um médico", "Fale com a AMI"]) expect(ROD).toContain(t);
  });
  it("le endereco, telefones e CNPJ de lib/ami.ts, nao escreve a mao", () => {
    expect(ROD).toContain("AMI.endereco");
    expect(ROD).toContain("AMI.telefones");
    expect(ROD).toContain("AMI.cnpj");
    expect(ROD).not.toMatch(/3524-3716/);
  });
  it("mantem o aviso de demonstracao e o aviso informativo", () => {
    expect(ROD).toContain("DADOS_DEMONSTRACAO");
    expect(ROD).toContain("não substitui a consulta");
  });
  it("tem a textura do verde", () => {
    expect(ROD).toContain("textura-verde");
  });
});

describe("a barra do pe", () => {
  it("existe em todas as paginas publicas", () => {
    expect(LAYOUT).toContain("<BarraDoPe");
  });
  it("leva a busca da home na home e a /busca fora dela", () => {
    expect(BARRA).toContain("#encontre");
    expect(BARRA).toContain("/busca");
  });
  it("liga pelo telefone de lib/ami.ts", () => {
    expect(BARRA).toContain("hrefTelefone");
  });
});
```

- [ ] **Step 2: Rodar e ver falhar.**

- [ ] **Step 3: Rodapé.** Transcreva `footer`, `.rod`, `.rod h4`, `.rod a`, `.lema`, `.base` do desenho para `Rodape.module.css`, com a classe `textura-verde` no `<footer>` e um `<div className="brilho" aria-hidden />` dentro. Conteúdo: coluna 1 = nome (fonte de título) + `CNPJ {AMI.cnpj}` em `registro`; "A Associação" = Quem somos (`/associacao`), Diretoria (`/associacao/diretoria`), Seja associado (`/associacao/seja-associado`), Sua AMI (`/#sua-ami`); "Encontre um médico" = Buscar (`/busca`), Especialidades (`/medicos`), Bairros (`/medicos`); "Fale com a AMI" = endereço de `AMI.endereco`, os telefones com `hrefTelefone`, Instagram. Linha de baixo = © + links legais (os três de hoje) + o aviso informativo + o aviso de demonstração com a mesma condição de hoje. Links do rodapé ficam brancos no hover (não verde). Remova o `mt-24`: o rodapé emenda no bloco anterior (a home termina numa faixa branca; outras páginas, ajuste com `margin-top: var(--ritmo)` quando o anterior não for faixa). **Decisão registrada:** as listas longas de especialidades e bairros saem do rodapé, como no desenho; a ligação interna dessas páginas continua pelo índice `/medicos` e pelas pílulas da busca.

- [ ] **Step 4: Barra do pé.** `BarraDoPe.tsx` (cliente): só aparece abaixo de 700px (CSS). Link "Encontrar médico" (`.ba-buscar` do desenho) para `#encontre` quando `usePathname() === "/"` e para `/busca` fora dela; ao tocar na home, depois do pulo, foca o campo de busca (`setTimeout` de 600ms, como no desenho). Link "Ligar" (`.ba-ligar`) para `hrefTelefone(AMI.telefones[0])`. Mostra depois que `window.scrollY` passa de 600px (fora da home) ou que o carrossel saiu da tela (na home, `[data-bloco="carrossel"]`), e some enquanto `#encontre` está na tela (`IntersectionObserver`, `threshold: .2`). Transcreva `.barra-acao` e filhos do desenho, com `env(safe-area-inset-bottom)`. No `<footer>`, abaixo de 700px, `padding-bottom: calc(100px + env(safe-area-inset-bottom))` para a barra não cobrir o fim do rodapé.

- [ ] **Step 5: Rodar, provar por mutação, conferir na 3000 em 390px (barra aparece ao rolar, some na busca) e em 1440px (barra não existe). Commit.**

```bash
git add -A
git commit -m "Rodape verde com textura e barra de atalhos no pe do celular"
```

---

### Task 5: O banner com dois tipos — dados

**Files:**
- Modify: `sanity/schemas/banner.ts`, `lib/sanity/banners.ts`, `lib/sanity/tipos.ts`, `lib/molduras.ts`
- Test: `testes/banners.test.ts`, `testes/molduras.test.ts`, `testes/sanity-schemas.test.ts`

**Interfaces:**
- Produces (em `lib/sanity/tipos.ts`):

```ts
export type BannerArte = {
  tipo: "arte";
  id: string;
  nome: string;
  /** Arte larga, 3000 × 1288 (proporção 2,33:1 do carrossel no computador). */
  imagem: string;
  /** Arte de celular, 1080 × 1350 (4:5). Null: o site recorta a larga. */
  imagemCelular: string | null;
  alt: string;
  /** "escuro" (padrão) ou "claro": decide a cor dos controles sobre a arte. */
  tema: "escuro" | "claro";
  destino: string | null;
  ordem: number;
};

export type BannerComposto = {
  tipo: "composto";
  id: string;
  nome: string;
  /** Null: a área da foto vira moldura no modo demonstração (ver lib/molduras.ts). */
  foto: string | null;
  fotoAlt: string;
  rotulo: string | null;
  titulo: string;
  texto: string | null;
  botao: string | null;
  destino: string | null;
  ordem: number;
};

export type Banner = BannerArte | BannerComposto;
```

- Produces (em `lib/sanity/banners.ts`): `paraBanner(cru): Banner | null` cobrindo os dois tipos; constantes `ARTE_LARGA = { largura: 3000, altura: 1288 }` e `ARTE_CELULAR = { largura: 1080, altura: 1350 }`.
- Produces (em `lib/molduras.ts`): `BannerProvisorio` ganha `tipo: "provisorio"` no lugar de `provisorio: true`; `ItemDoCarrossel = Banner | BannerProvisorio`.

- [ ] **Step 1: Testes** (acrescente, não apague os de `estaNoAr`):

```ts
describe("paraBanner, dois tipos", () => {
  it("banner sem tipo e com imagem e arte (os ja cadastrados continuam valendo)", () => {
    const b = paraBanner({ id: "a", nome: "x", imagem: IMAGEM_OK, destino: null, ordem: 10, expiraEm: null } as never);
    expect(b?.tipo).toBe("arte");
  });
  it("arte sem versao de celular sai com imagemCelular null", () => {
    const b = paraBanner({ id: "a", nome: "x", tipo: "arte", imagem: IMAGEM_OK, destino: null, ordem: 10, expiraEm: null } as never);
    expect(b && b.tipo === "arte" && b.imagemCelular).toBeNull();
  });
  it("arte sem tema vale escuro", () => {
    const b = paraBanner({ id: "a", nome: "x", tipo: "arte", imagem: IMAGEM_OK, destino: null, ordem: 10, expiraEm: null } as never);
    expect(b && b.tipo === "arte" && b.tema).toBe("escuro");
  });
  it("composto sem foto continua valendo, com foto null", () => {
    const b = paraBanner({ id: "c", nome: "y", tipo: "composto", titulo: "Os médicos de Imperatriz", destino: "/x", ordem: 20, expiraEm: null } as never);
    expect(b).toMatchObject({ tipo: "composto", titulo: "Os médicos de Imperatriz", foto: null });
  });
  it("composto sem titulo e descartado", () => {
    expect(paraBanner({ id: "c", nome: "y", tipo: "composto", destino: null, ordem: 20, expiraEm: null } as never)).toBeNull();
  });
});
```

(`IMAGEM_OK` = o objeto de imagem válido que `testes/banners.test.ts` já usa no teste "monta o banner quando a imagem resolve"; reaproveite.)

Em `testes/sanity-schemas.test.ts`, confira que o schema `banner` tem os campos `tipo` (com `initialValue: "arte"` e opções `arte`/`composto`), `imagemCelular`, `tema`, `foto`, `rotulo`, `titulo`, `texto`, `botao`, e que a descrição da arte larga diz "3000 × 1288" e a de celular "1080 × 1350".

- [ ] **Step 2: Rodar e ver falhar.**

- [ ] **Step 3: Schema.** Em `sanity/schemas/banner.ts`: campo `tipo` (radio, "Arte pronta" / "Foto com texto montado no site", `initialValue: "arte"`). Campos de arte com `hidden: ({ document }) => document?.tipo === "composto"`: `imagem` (descrição "3000 × 1288 pixels…", `alt` obrigatório como hoje), `imagemCelular` (opcional, "1080 × 1350 pixels, para o celular…"), `tema` (radio escuro/claro, padrão escuro, "Se o fundo da arte é escuro ou claro: muda a cor das bolinhas e das setas"). Campos de composto, ocultos quando arte: `foto` (image com `alt` obrigatório), `rotulo` (até 40), `titulo` (obrigatório quando composto, até 70), `texto` (até 160), `botao` (até 28). A validação de obrigatório depende do tipo: `r.custom((v, ctx) => ctx.document?.tipo === "composto" && !v ? "O título é obrigatório" : true)`. Reescreva o comentário do topo: o banner deixou de ser só arte pronta.

- [ ] **Step 4: Consulta e montagem.** GROQ: `*[_type == "banner" && (defined(imagem.asset) || (tipo == "composto" && defined(titulo)))] | order(ordem asc) { "id": _id, nome, tipo, imagem{asset, alt}, imagemCelular{asset}, tema, foto{asset, alt}, rotulo, titulo, texto, botao, destino, ordem, expiraEm }`. `paraBanner`: `tipo ?? "arte"`; arte exige URL da `imagem` (3000) — sem ela, `null` como hoje; `imagemCelular` em 1080 ou `null`; composto exige `titulo`; `foto` em 1600 ou `null`. `Banner` deixa de ser o tipo único: atualize os importadores (`grep -rn "Banner" lib components app testes`).

- [ ] **Step 5: Molduras.** `BannerProvisorio` passa a `{ tipo: "provisorio"; id; rotulo; destino }`. Os três provisórios continuam os mesmos. Atualize `testes/molduras.test.ts` onde ele procura `provisorio: true`/`"provisorio" in b`.

- [ ] **Step 6: Rodar tudo (o carrossel antigo vai reclamar do tipo: ajuste o mínimo para compilar — `b.tipo === "provisorio"` no lugar de `"provisorio" in b`, e desenhe só a `imagem` da arte —, porque a Task 6 o reescreve). Provar por mutação. Commit.**

```bash
git add -A
git commit -m "Banner com dois tipos: arte pronta com versao de celular, ou foto com texto montado no site"
```

---

### Task 6: O carrossel novo

**Files:**
- Create: `lib/carrossel.ts`, `components/home/Carrossel.module.css`
- Modify: `components/home/Carrossel.tsx` (reescrita)
- Keep: `lib/pausaDoCarrossel.ts` (sem mudança)
- Test: `testes/fita-do-carrossel.test.ts` (novo), `testes/carrossel.test.ts`, `testes/pausa-do-carrossel.test.ts`

**Interfaces:**
- Consumes: `ItemDoCarrossel` (Task 5), `.botao`, `.botao-arte`, `.rotulo-secao` (Task 1), `Icone` (Task 2), `aplicarEvento`/`parado`/`rotuloDoBotao`/`SEM_PAUSA` de `lib/pausaDoCarrossel.ts`.
- Produces: `<Carrossel itens={ItemDoCarrossel[]} />` (substitui a prop `banners`), e em `lib/carrossel.ts`:

```ts
/** Fita com cópia do último antes e do primeiro depois: n reais viram n + 2 posições. */
export function posicaoNaFita(indice: number): number;               // indice real (pode ser -1 ou n) → posição
export function indiceReal(destino: number, n: number): number;      // (destino + n) % n
export function precisaSaltar(posicao: number, n: number): number | null; // 0 → n; n+1 → 1; senão null
export const INTERVALO = 6000;
export const LIMIAR_DO_DEDO = 45;
export function direcaoDoDedo(dx: number, dy: number): -1 | 0 | 1;   // |dx| > 45 e |dx| > 1,5·|dy|
```

- [ ] **Step 1: Testes da fita (lógica pura)**

```ts
import { describe, expect, it } from "vitest";
import { direcaoDoDedo, indiceReal, posicaoNaFita, precisaSaltar } from "@/lib/carrossel";

describe("a fita do carrossel", () => {
  it("o primeiro real fica na posicao 1, depois da copia do ultimo", () => {
    expect(posicaoNaFita(0)).toBe(1);
  });
  it("do ultimo, proximo anda para a copia do primeiro, sempre para a direita", () => {
    expect(posicaoNaFita(4)).toBe(5); // n = 4: destino 4 é a cópia do primeiro
    expect(indiceReal(4, 4)).toBe(0);
  });
  it("chegando na copia do primeiro, salta sem animacao para o primeiro de verdade", () => {
    expect(precisaSaltar(5, 4)).toBe(1);
  });
  it("chegando na copia do ultimo, salta para o ultimo de verdade", () => {
    expect(precisaSaltar(0, 4)).toBe(4);
  });
  it("posicoes reais nao saltam", () => {
    for (const p of [1, 2, 3, 4]) expect(precisaSaltar(p, 4)).toBeNull();
  });
  it("deslizar o dedo para o lado troca; para cima e para baixo, nao", () => {
    expect(direcaoDoDedo(-80, 10)).toBe(1);
    expect(direcaoDoDedo(80, 10)).toBe(-1);
    expect(direcaoDoDedo(30, 0)).toBe(0);
    expect(direcaoDoDedo(60, 50)).toBe(0);
  });
});
```

Em `testes/carrossel.test.ts`, mantenha os dois testes de servidor (botão de pausa existe e árvore igual com e sem "menos movimento") adaptados à prop `itens`, e acrescente:
- com 2+ itens, saem `n + 2` slides, e os dois das pontas têm `aria-hidden="true"` e nenhum link focável (`tabindex="-1"`);
- um item `composto` sai com título, texto e `.botao`; um `arte` sai com `<picture>` contendo `<source media="(max-width: 700px)">` quando há `imagemCelular`;
- um `provisorio` sai com `MolduraProvisoria` "Arte a entrar: …";
- com 1 item, sem controles e sem cópias.

- [ ] **Step 2: Rodar e ver falhar.**

- [ ] **Step 3: `lib/carrossel.ts`** com as funções acima (pequenas, puras, comentadas com o porquê — o comentário do desenho em `home-aprovada.html`, procurando "Giro contínuo", explica as cópias).

- [ ] **Step 4: Reescrever `Carrossel.tsx`** transcrevendo do desenho `.carrossel`, `.slides`, `.slide`, `.slide .h1`, `.slide p`, `.slide .foto`, `.controles`, `.bolinhas`, `.bolinha` (com o `<span>` interno e a barra de progresso em `::after`), `.ctl`, `.arte-*` (as duas artes de exemplo NÃO vêm: a arte real é imagem; leve só o que serve a qualquer arte — `.arte-link`, `.arte-rotulo` não), e os blocos `@media` de 980px, 700px e 400px do carrossel. Comportamento (copie a lógica do `<script>` do desenho, em React):

  - fita com cópias nas pontas (`lib/carrossel.ts`), `transform: translateX(-posição × 100%)`, transição `.95s cubic-bezier(.7,0,.2,1)`; ao fim do movimento (`transitionend` da própria fita e propriedade `transform`, **e** um relógio de 1200ms de reserva para aba oculta), salta sem animação se `precisaSaltar` mandar; clique durante o movimento conclui o atual e atende;
  - classe `ativo` no slide visível **e** no real correspondente (as animações de entrada não se repetem no salto);
  - a bolinha ativa enche em `INTERVALO` (`animation: progresso 6s linear`), e o `animationend` dela passa o slide; parada = `animation-play-state: paused` com a classe `parado` no carrossel, ligada por `parado(pausa)`, aba oculta ou "menos movimento" (os dois `useSyncExternalStore` de hoje continuam, com o mesmo comentário);
  - pausa por mouse só com `pointerType === "mouse"`; por foco só quando `:focus-visible`; deslizar o dedo com `touchstart`/`touchend` e `direcaoDoDedo`;
  - controles: centro alinhado ao centro do botão do slide atual (medido com `getBoundingClientRect`, recalculado em `resize` e em `document.fonts.ready`), classe `escuro` quando o slide atual é arte de tema escuro, `claro` quando claro; no celular, anterior/próximo somem e as bolinhas ficam 7px de respiro;
  - slide `composto`: no computador, texto à esquerda e foto à direita (`next/image` não: a foto vem do CDN do Sanity como hoje, `<img>` com `width`/`height` e `loading="lazy"` exceto no primeiro); no celular, a foto cobre o cartão 4:5 e o texto fica por cima com o degradê `.anima` do desenho (`z-index: 2`, que foi o defeito achado na revisão);
  - slide `arte`: `<picture>` com a arte de celular para `max-width: 700px` quando houver; sem ela, a larga com `object-fit: cover` e `object-position` do ponto de interesse; link no slide inteiro quando há `destino`;
  - slide `provisorio`: `MolduraProvisoria` cobrindo o slide com "Arte a entrar: <rótulo>";
  - proporção: computador `aspect-ratio: 1192 / 512` no slide; celular `4 / 5`.

- [ ] **Step 5: Rodar, provar por mutação (tire a cópia do primeiro; troque `pointerType` por qualquer ponteiro), conferir na 3000 com os três provisórios (modo demonstração): do último para o primeiro sempre para a direita; tocar no celular não pausa. Commit.**

```bash
git add -A
git commit -m "Carrossel novo: giro continuo, arte ou foto com texto, controles centrados e dedo no celular"
```

---

### Task 7: Números e "Encontre um médico"

**Files:**
- Create: `components/home/NumerosDaAmi.tsx` (+ `.module.css`), `components/home/Contador.tsx`, `components/home/EncontreUmMedico.tsx` (+ `.module.css`)
- Modify: `lib/ami.ts` (anos de AMI)
- Test: `testes/numeros-e-busca.test.ts` (novo)

**Interfaces:**
- Consumes: `LadrilhoIcone`, `Icone`, `.botao`, `.botao-linha`, `.textura-verde`, `.brilho`, `.rotulo-secao`.
- Produces:

```ts
// lib/ami.ts
export function anosDeAmi(agora: Date): number; // agora.getFullYear() - Number(AMI.fundadaEm)
// components
export function NumerosDaAmi(props: { anos: number; medicos: number; especialidades: number; bairros: number }): JSX.Element;
export function EncontreUmMedico(props: { especialidades: { nome: string; slug: string; total: number }[] }): JSX.Element;
```

- [ ] **Step 1: Testes**

```ts
import { describe, expect, it } from "vitest";
import { renderToString } from "react-dom/server";
import { createElement } from "react";
import { anosDeAmi } from "@/lib/ami";
import { NumerosDaAmi } from "@/components/home/NumerosDaAmi";
import { EncontreUmMedico } from "@/components/home/EncontreUmMedico";

describe("anos de AMI", () => {
  it("e calculado do ano de fundacao, nao escrito a mao", () => {
    expect(anosDeAmi(new Date("2026-10-03T12:00:00-03:00"))).toBe(51);
    expect(anosDeAmi(new Date("2030-01-02T12:00:00-03:00"))).toBe(55);
  });
});

describe("os numeros", () => {
  const html = renderToString(createElement(NumerosDaAmi, { anos: 51, medicos: 24, especialidades: 14, bairros: 8 }));
  it("saem com o valor final no HTML (sem JavaScript, o numero certo ja esta la)", () => {
    for (const n of ["51", "24", "14", "8"]) expect(html).toContain(`>${n}<`);
  });
  it("com os rotulos aprovados", () => {
    for (const r of ["anos de AMI", "médicos no diretório", "especialidades", "bairros atendidos"]) expect(html).toContain(r);
  });
  it("marca o bloco para a auditoria", () => {
    expect(html).toContain('data-bloco="numeros"');
  });
});

describe("encontre um medico", () => {
  const itens = Array.from({ length: 14 }, (_, i) => ({ nome: `E${i}`, slug: `e${i}`, total: 14 - i }));
  const html = renderToString(createElement(EncontreUmMedico, { especialidades: itens }));
  it("e um formulario de verdade para /busca, com o campo termo", () => {
    expect(html).toMatch(/<form[^>]*action="\/busca"/);
    expect(html).toContain('name="termo"');
  });
  it("mostra as sete especialidades com mais medicos e o link para todas", () => {
    expect(html.match(/href="\/medicos\/e\d+"/g)?.length).toBe(7);
    expect(html).toContain("veja todas as 14 especialidades");
  });
  it("tem o id que a barra do pe e o menu usam", () => {
    expect(html).toContain('id="encontre"');
  });
});
```

- [ ] **Step 2: Rodar e ver falhar.**

- [ ] **Step 3: Implementar.** `NumerosDaAmi` transcreve `.numeros`, `.numero`, `.numero .grande`, `.numero .rot`, `.numero p`, `.numero .botao-linha` e as variantes `.numeros.aberta` do desenho (seção sem caixa, direto no fundo), mais os `@media` (dois por linha no tablet; no celular, quatro cartõezinhos brancos sem `p` e sem botão). Ícones: `selo`, `estetoscopio`, `batimento`, `mapa`. Os quatro botões: "Conheça a história" (`/associacao`), "Ver os médicos" (`/busca`), "Ver especialidades" (`/medicos`), "Ver bairros" (`/medicos`); textos de apoio do desenho (o de bairros diz "do Centro à Vila Lobão" — **troque** por "Encontre quem atende perto de casa." porque os bairros vêm do banco e não devem ser escritos à mão). Botões alinhados no pé da coluna (`margin-top: auto`).
`Contador` (cliente): recebe o número final, renderiza o número final; quando o número entra na tela (`IntersectionObserver`), e sem "menos movimento", anima de 0 até o valor em 1,4s (`easeOutCubic`, como no desenho). Um `<span className="so-leitor">` não é necessário: o texto final está no HTML.
`EncontreUmMedico` transcreve `.encontre` (layout de duas colunas, que vira uma abaixo de 1180px), `.campo`, `.chips`, `.chip`, `.rodape-busca` e o comportamento do celular (fileira que desliza com `scroll-padding-inline`, botão só com a seta, texto de exemplo "Nome ou especialidade" abaixo de 700px — faça com dois `<span>`? Não: `placeholder` não aceita isso; use o mesmo `matchMedia` do desenho num efeito de cliente, ou um texto único que caiba: **use "Nome ou especialidade" sempre**, que cabe em todas as larguras, e registre a decisão no relatório). `<section id="encontre" data-bloco="encontre" className="textura-verde …">` com o `<div className="brilho">`. É faixa de ponta a ponta: o componente fica **fora** do contêiner centralizado, com `padding-inline` pela fórmula `--borda-faixa` do desenho (`max(calc(24px + var(--m)), calc((100% - 1240px) / 2 + 24px + var(--m)))`; no celular `calc(12px + var(--m))`).

- [ ] **Step 4: Rodar, provar por mutação, commit.**

```bash
git add -A
git commit -m "Numeros da AMI sem caixa e busca de medico em faixa verde de ponta a ponta"
```

---

### Task 8: Sua AMI, Seja associado e Quem é a AMI

**Files:**
- Create: `components/home/SuaAmi.tsx` (+ `.module.css`), `components/home/SejaAssociado.tsx` (+ `.module.css`)
- Modify: `lib/imagens.ts` (dois espaços novos), `lib/molduras.ts` (missão, visão, valores)
- Test: `testes/molduras.test.ts`, `testes/sua-ami-e-associe.test.ts` (novo)

**Interfaces:**
- Consumes: `Fotografia` (com a trava de hoje), `LadrilhoIcone`, `.botao`, `.rotulo-secao`.
- Produces:

```ts
// lib/imagens.ts — dois espaços novos, provisórios
ESPACOS.salao   // foto do auditório/hall, 2000 × 1125, rótulo "Auditório da AMI"
ESPACOS.associados // foto de associados reunidos, 1600 × 1100, rótulo "Associados da AMI"
// lib/molduras.ts
export type TextoInstitucional = { missao: string | null; visao: string | null; valores: string | null };
export function quemEhAmi(demonstracao: boolean, texto: TextoInstitucional):
  { cartoes: Array<{ titulo: "Missão" | "Visão" | "Valores"; texto: string; provisorio: boolean }> };
// componentes
export function SuaAmi(props: { demonstracao: boolean }): JSX.Element | null;
export function SejaAssociado(props: { demonstracao: boolean; texto: TextoInstitucional }): JSX.Element;
```

- [ ] **Step 1: Testes**

```ts
describe("quem e a AMI", () => {
  const vazio = { missao: null, visao: null, valores: null };
  it("sem texto e em demonstracao, os tres cartoes saem como 'Texto da AMI a entrar'", () => {
    expect(quemEhAmi(true, vazio).cartoes.map((c) => [c.titulo, c.texto, c.provisorio])).toEqual([
      ["Missão", "Texto da AMI a entrar.", true],
      ["Visão", "Texto da AMI a entrar.", true],
      ["Valores", "Texto da AMI a entrar.", true],
    ]);
  });
  it("sem texto e fora da demonstracao, nenhum cartao sai", () => {
    expect(quemEhAmi(false, vazio).cartoes).toEqual([]);
  });
  it("com texto, sai o texto, nos dois modos", () => {
    const t = { missao: "M", visao: null, valores: "V" };
    expect(quemEhAmi(false, t).cartoes.map((c) => c.titulo)).toEqual(["Missão", "Valores"]);
  });
});
```

E em `testes/sua-ami-e-associe.test.ts` (renderização no servidor): Sua AMI tem `id="sua-ami"`, `data-bloco="sua-ami"`, o texto aprovado "Auditório e hall de eventos da AMI para alugar." (do desenho: título "O auditório e o hall de eventos da AMI", texto "Espaços da sede para congressos, cursos, reuniões e confraternizações. Fale com a AMI para conhecer as datas livres."), botão "Consultar disponibilidade" para `/contato`, etiqueta "em breve", e **nenhum** número de capacidade, preço, metragem ou horário (procure dígitos no texto visível); fora da demonstração, `SuaAmi` devolve `null` (é provisório inteiro, como o cartão de hoje). Seja associado tem o título e o texto do desenho, botão "Quero me associar" para `/associacao/seja-associado`, o "Quem é a AMI?" com o texto verdadeiro (o mesmo de hoje do bloco institucional: "A Associação Médica de Imperatriz reúne os profissionais que atendem em Imperatriz e na região sul do Maranhão, em atividade desde 1975."), e os números 01/02/03 com `aria-hidden="true"`.

- [ ] **Step 2: Rodar e ver falhar.**

- [ ] **Step 3: Implementar.** `SuaAmi` transcreve `.vitrine`, `.vitrine > img`, `.vitrine::after`, `.vitrine-cartao` e o `@media` do celular (foto em cima, cartão sobreposto com `margin: -40px 12px 12px`). A foto é `Fotografia espaco="salao"` (com a trava: fora da demonstração e sem foto real, o componente inteiro já não sai). `SejaAssociado` é a faixa branca de ponta a ponta (`.faixa-branca` com a mesma fórmula de borda da Task 7), com `.duplo` (texto à esquerda, `Fotografia espaco="associados"` à direita; no celular a foto vai para cima) e `.quem` (intro + três `.cartao` com `LadrilhoIcone pequeno` `bandeira`/`olho`/`maoCoracao`, título, texto, ordinal; no celular viram linhas compactas). Textos de missão, visão e valores: hoje não existe fonte — passe `{ missao: null, visao: null, valores: null }` da página e deixe a decisão em `quemEhAmi`.

- [ ] **Step 4: Rodar, provar por mutação (deixe `quemEhAmi` devolver cartões com a chave falsa), commit.**

```bash
git add -A
git commit -m "Sua AMI com foto e cartao de vidro, Seja associado e Quem e a AMI em faixa branca"
```

---

### Task 9: Notícias, bairros e parceiros

**Files:**
- Modify: `components/editorial/UltimasNoticias.tsx`, `components/diretorio/LadrilhosBairros.tsx`, `components/home/EmpresasParceiras.tsx`
- Create: `components/editorial/UltimasNoticias.module.css`, `components/home/BairrosEParceiros.tsx` (+ `.module.css`)
- Test: `testes/molduras.test.ts`, `testes/noticias-da-home.test.ts` (novo)

**Interfaces:**
- Produces: `UltimasNoticias({ provisorias })` com a mesma assinatura de hoje; `BairrosEParceiros(props: { bairros: Item[]; parceiros: boolean })`.

- [ ] **Step 1: Testes** (servidor): notícias com `data-bloco="noticias"`; com 1 real + 3 provisórias pedidas, só a real; com 4 reais, a primeira é o destaque (título sobre a foto, `<h3>`) e as outras três ficam na lista com `.sep` entre elas; "Ver todas as notícias" para `/noticias`. Bairros e parceiros: `data-bloco="bairros"`, `id="bairros"`, cada bairro com link `/busca?bairro=<slug>` e a contagem; parceiros só com `parceiros: true`, seis "Logotipo a entrar", nenhum nome de empresa.

- [ ] **Step 2: Rodar e ver falhar.**

- [ ] **Step 3: Implementar.** `UltimasNoticias` transcreve `.cab-secao`, `.noticias`, `.destaque`, `.destaque .sobre-foto`, `.lista`, `.lista .sep`, `.item` do desenho, **com a regra de altura igual**: a coluna da direita com `aspect-ratio: 32 / 25` e `justify-content: space-between` (o comentário do desenho explica a conta 0,8/0,625); abaixo de 1180px, destaque em cima e as três lado a lado; no celular, destaque grande e lista com miniatura quadrada de 88px (a versão final do desenho, **não** a fileira que desliza). Seção sem caixa (`.aberta`). A notícia real usa a capa do Sanity como hoje (`LinhaNoticia` mostra como pegar a URL).
`LadrilhosBairros` ganha o desenho do `.bairro` (nome à esquerda, contagem à direita; abaixo de 1180px, contagem embaixo) — ele também é usado em `/medicos` e `/medicos/[especialidade]`: confira as duas páginas depois.
`BairrosEParceiros`: faixa branca de ponta a ponta com bairros, `.separa` e parceiros (`EmpresasParceiras` passa a desenhar os espaços com `.logo-vazio` do desenho: tracejado, "Logotipo a entrar"; 6 lado a lado no computador, 3 por linha abaixo de 980px, 3 por linha no celular — a versão final). O rodapé emenda nela (sem espaço).

- [ ] **Step 4: Rodar, provar por mutação, conferir `/medicos` e uma especialidade na 3000, commit.**

```bash
git add -A
git commit -m "Noticias com destaque e coluna da mesma altura, bairros e parceiros numa faixa branca"
```

---

### Task 10: A home montada

**Files:**
- Modify: `app/(site)/page.tsx`
- Delete: `components/home/FaixaDaAmi.tsx`, `components/home/ServicosDaAmi.tsx` (antes, `grep` de importadores: `Cabeceira.tsx` cita `FaixaDaAmi` — se for só comentário, corrija o comentário; se for import, não apague e avise)
- Modify: `testes/home.test.ts`, `testes/home-renderizada.test.ts`, `testes/molduras.test.ts`, `testes/paleta.test.ts`, `testes/porta-da-busca.test.ts` (os que citam componentes que saíram)

**Interfaces:**
- Consumes: tudo das tarefas 1 a 9.

- [ ] **Step 1: Atualizar os testes da home para a ordem nova**

Em `testes/home-renderizada.test.ts`, `SEMPRE` passa a `['<h1', 'data-bloco="numeros"', 'data-bloco="encontre"', 'data-bloco="associe"', 'data-bloco="bairros"']`; o caso da chave verdadeira confere a ordem `<h1` → "Arte a entrar: <!-- -->Seja associado" → … → `data-bloco="numeros"` → `id="encontre"` → `id="sua-ami"` → `data-bloco="associe"` → "Texto da AMI a entrar." (×3) → `data-bloco="noticias"` → "Notícia a entrar" → `data-bloco="bairros"` → "Logotipo a entrar"; o caso da chave falsa confere que não sai "a entrar", nem `id="sua-ami"`, nem `aria-label="Destaques da AMI"`, nem "Logotipo", nem `role="img"`. Acrescente: **um único `<h1`** e ele contém "Associação Médica de Imperatriz" com a classe de só-leitor. Em `testes/home.test.ts`, troque as listas de componentes pelas novas. Remova dos outros testes as referências a `FaixaDaAmi`/`ServicosDaAmi` (o que eles protegiam — o cartão Sua AMI sem inventar números, a busca com porta de entrada — já está coberto nas tarefas 7 e 8: confira e diga no relatório onde).

- [ ] **Step 2: Rodar e ver falhar.**

- [ ] **Step 3: Montar.** `page.tsx`, na ordem da spec (seção 6): `<h1 className="so-leitor">Associação Médica de Imperatriz</h1>` (a classe `.so-leitor` existe? use a `sr-only` do Tailwind), dentro do contêiner centralizado `Carrossel` e `NumerosDaAmi`; fora dele `EncontreUmMedico`; contêiner com `SuaAmi`; fora `SejaAssociado`; contêiner com `UltimasNoticias`; fora `BairrosEParceiros`. Espaços: `margin-top: var(--ritmo)` entre todos os blocos (inclusive carrossel → números), **nenhuma exceção**. `generateMetadata` fica. `moldurasDaHome` recebe `ItemDoCarrossel` e devolve o que o carrossel e as seções pedem; acrescente o que faltar (`suaAmi`, `parceiros` já existem).

- [ ] **Step 4: Rodar tudo, provar por mutação (embrulhe `EncontreUmMedico` em `{false && …}` e veja o teste renderizado ficar vermelho), commit.**

```bash
git add -A
git commit -m "A home montada como no desenho aprovado"
```

---

### Task 11: A conferência

**Files:**
- Create: `scripts/auditoria-visual.js` (roda no console do navegador ou via ferramenta de navegador)
- Modify: `docs/estado-do-projeto.md`

- [ ] **Step 1: Produção.** `npm run build` e `npx next start -p 3300` (com a chave de demonstração ligada, a de hoje).

- [ ] **Step 2: A auditoria.** `scripts/auditoria-visual.js` é a bateria da revisão final do desenho, trocada para as marcas `data-bloco`/`data-coluna`: nada passa da borda (exceto o que está dentro de fileira que desliza); nenhum `.botao`/`.botao-linha`/`.botao-arte` com mais de uma linha; texto de todas as seções na mesma linha vertical (`[data-coluna]`); espaços entre `[data-bloco]` consecutivos todos iguais; cada slide real mostra o título e os controles centrados sob o botão (diferença ≤ 2px, medida **depois** de 1,5s parado); menu em linha acima de 1180px e em gaveta abaixo; barra do pé só até 700px; cabeçalho no topo em cinco pontos de rolagem; um único `h1`; nenhum `id` repetido; nenhuma imagem quebrada. Rode nas larguras 375, 390, 430, 768, 1024, 1280, 1440 e 1920. **Esperado: nenhum problema.** Corrija o que aparecer na tarefa de origem.

- [ ] **Step 3: Comparar com o desenho.** Foto da página inteira em 1440px e em 390px (o método está em `.superpowers/captura/` do controlador: Chrome sem janela, e para 390px um `iframe` de 390px, porque o Chrome sem janela não aceita menos de ~500px) e compare, seção por seção, com `docs/desenho-aprovado/*.jpg`. Diferença que não seja foto (o site usa molduras no lugar das fotos de banco) é defeito.

- [ ] **Step 4: A trava.** `NEXT_PUBLIC_DADOS_DEMONSTRACAO=false npm run build`, `next start`, e confira: nenhum "a entrar", nenhum `role="img"` de moldura, sem Sua AMI, sem parceiros, sem Missão/Visão/Valores, sem carrossel (não há banner real). Depois refaça o build com a chave de hoje.

- [ ] **Step 5: Volta pelas outras páginas e pelo painel.** Abra cada rota de `app/(site)` e `/painel/entrar` em 390px e 1440px: nada passa da borda, nenhum texto ilegível (o `paleta.test` cuida dos pares; aqui é o olho). O que estiver feio mas legível espera a fatia B: liste no estado do projeto.

- [ ] **Step 6: Estado do projeto.** Em `docs/estado-do-projeto.md`: a reforma visual (fatia A), o que mudou para a AMI (banner com dois tipos e as medidas novas das artes, Missão/Visão/Valores e fotos pendentes), e a fatia B a seguir. Números medidos, não lembrados.

- [ ] **Step 7: Commit.**

```bash
git add -A
git commit -m "Conferencia da fatia A da reforma visual"
```

---

## Autorrevisão do plano

- **Cobertura da spec:** seção 4 (cores, fontes, botões, espaços, formas, textura, ícones, movimento) → tarefas 1, 2, 6, 7; seção 5 (cabeçalho, menu, rodapé, barra do pé, acessibilidade) → 3, 4, 10; seção 6 (home) → 6 a 10; seção 7 (carrossel) → 5 e 6; seção 8 (molduras e trava) → 5, 8, 9, 10, 11; seção 9 (desempenho) → 1 (textura), 2 (ícones), 6 (imagens), 1 (fontes); seção 10 (provar) → 11. O movimento de "blocos surgem ao rolar" usa a `.revelar` que já existe em `app/globals.css` (sem JavaScript); cada componente novo põe `revelar` no bloco.
- **Nomes que atravessam tarefas:** `ItemDoCarrossel`, `BannerArte`, `BannerComposto`, `BannerProvisorio.tipo = "provisorio"` (5 → 6, 10); `LadrilhoIcone`/`Icone`/`NomeIcone` (2 → 3, 4, 6, 7, 8); `.botao`/`.botao-linha`/`.botao-arte`/`.rotulo-secao`/`.textura-verde`/`.brilho` (1 → todas); `anosDeAmi` (7 → 10); `quemEhAmi`/`TextoInstitucional` (8 → 10); `data-bloco`/`data-coluna` (7–10 → 11).
- **Decisões deste plano que a spec não fixou** (registrar no diário ao executar): as listas longas de especialidades e bairros saem do rodapé; o texto de exemplo da busca é "Nome ou especialidade" em todas as larguras; o texto de apoio de bairros não cita bairros pelo nome; `SuaAmi` inteiro some fora da demonstração (não há conteúdo real).
