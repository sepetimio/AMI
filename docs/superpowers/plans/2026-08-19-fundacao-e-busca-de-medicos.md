# Fundação e busca de médicos — plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Colocar no ar o diretório de médicos da AMI — busca com filtros, perfil, páginas de faceta e sitemap — sobre um banco real e com a lógica de domínio coberta por testes.

**Architecture:** Next.js 16 com App Router e renderização no servidor. O Supabase guarda o diretório e as políticas de acesso vivem no banco, não na tela. Nenhuma página consulta o Supabase direto: tudo passa por `lib/dados/`, que separa as funções puras — filtros, horários, moldes de SEO — das que tocam o banco, para que a lógica de domínio seja testável sem infraestrutura.

**Tech Stack:** Next.js 16.3.1 · React 19 · TypeScript 5 · Tailwind CSS 4.1 · Supabase (Postgres + RLS) 2.112 · Vitest 4.1

## Global Constraints

Todas as tarefas herdam estas regras. Valores copiados literalmente da spec.

**Plataforma**
- Node.js 20.9 ou superior; TypeScript 5.1 ou superior
- Turbopack é o padrão no Next 16 — **não** passe `--turbopack` nos scripts
- `params` e `searchParams` são `Promise` e precisam de `await`
- Não habilite `cacheComponents`; usamos `export const revalidate`
- Nunca use `localStorage` nem `sessionStorage`

**Cor — inegociável**
- Menta `#A5DCAF` tem contraste 1,56:1 sobre branco. **Nunca** como texto, ícone informativo, borda de campo ou botão sobre fundo claro. Só sobre verde 700/800/900, ou como preenchimento decorativo
- Ação sobre fundo claro é sempre `--ami-green-600` `#1F6B3A` (6,51:1)
- Verde da marca `#00A457` mede 3,26:1 sobre branco: serve para o símbolo e preenchimentos grandes, nunca para texto
- Todo texto tem no mínimo 4,5:1 sobre a superfície em que está
- Fundo é branco e cinza-esverdeado frio `#F4F7F4`, nunca bege

**Tipografia**
- **H1 e H2** em Archivo, comprimida pelo eixo `wdth` entre 80% e 87,5%, peso 700
- **H3** em Archivo, peso 600, **sem compressão** — a 21px a compressão prejudica
  a leitura em vez de ajudar, e a escala da direção de arte pede `H3 21/28 · 600`
- Corpo em Source Sans 3, 400 e 600
- Corpo em 17px, entrelinha 1,65. Nada abaixo de 15px em texto de leitura — parágrafo, item de lista, célula de tabela, rótulo de campo. Kicker, tag e legenda curta podem ir a 12px
- `font-variant-numeric: tabular-nums` em telefone, CRM e contagem
- Texto corrido em coluna de no máximo 580px

**Forma**
- Raios por função: botões e campos 6px · cartões e tabelas 10px · chips 999px · faixas de largura total 0px
- Fio de 1px em `--line` é o separador padrão. **Nenhum** cartão tem sombra em repouso, exceto o cartão de busca da home
- Chevron no máximo duas vezes por página, sempre estrutural
- Cabeçalho é **claro**, com a marca em verde sobre branco. Rodapé é verde-900 e leva só o nome em texto, sem símbolo

**Movimento**
- Foco visível obrigatório: anel de 2px em `--ami-green-600`, offset 2px. Nunca `outline:none`
- Proibido: animação de entrada em rolagem, `scale` no hover de cartão, número que conta subindo, parallax, carrossel automático
- Respeite `prefers-reduced-motion`

**Conformidade**
- Nome e CRM acompanhados da palavra **MÉDICO** em todo perfil e em **toda linha de resultado** (CFM 2.336/2023, Art. 4º, I)
- RQE exibido junto da especialidade **apenas** quando houver especialidade registrada (Art. 4º, II). Clínico geral sem RQE é caso normal e não pode ser bloqueado
- Nenhum ranking, prêmio, "top 10" ou "melhor médico" (Art. 11, XIII)
- Nenhum formulário coleta sintoma, condição, diagnóstico ou motivo de consulta

**Escopo — o que não existe neste projeto**
- Sem convênio, sem preço de consulta, sem avaliações ou notas
- Sem destaque pago, selo comparativo ou promoção editorial de associado

**Conteúdo**
- Todo número vem de contagem do banco. O que não vier dos dados aparece marcado `[PROVISÓRIO]`
- Banidas no texto: transformar, revolucionar, potencializar, impulsionar, elevar, descomplicar, jornada, ecossistema, solução completa, na palma da mão, cuidado humanizado, excelência, referência em, o melhor da, sua saúde em primeiro lugar
- Rótulo de botão diz o que acontece: "Ver perfil", "Filtrar por bairro". Nunca "Saiba mais", "Comece agora", "Explorar"

**Acessibilidade**
- Um `<h1>` por página, sem salto de nível de heading
- Landmarks reais: `header`, `nav`, `main`, `aside`, `footer`
- Alvos de toque de 44 × 44px no mobile; zoom nunca bloqueado
- Alt de imagem descritivo e específico
- Projete 390px primeiro; nada quebra entre 320px e 1920px

---

## Estrutura de arquivos

Cada arquivo tem uma responsabilidade. As funções **puras** ficam separadas das que tocam o banco — é isso que permite testar a lógica de domínio sem infraestrutura, e é a razão de `filtros.ts` e `medicos.ts` serem arquivos diferentes.

```
app/
  layout.tsx                          raiz: <html lang="pt-BR">, fontes, metadataBase
  globals.css                         tokens da direção de arte
  icon.svg                            favicon
  sitemap.ts                          gerado do banco
  robots.ts
  (site)/
    layout.tsx                        cabeçalho claro + rodapé
    page.tsx                          home mínima
    medicos/page.tsx                  índice de especialidades
    medicos/[especialidade]/page.tsx
    medicos/[especialidade]/[bairro]/page.tsx
    medico/[slug]/page.tsx

components/
  marca/Marca.tsx                     lockup completo, para o cabeçalho
  marca/Simbolo.tsx                   só o símbolo, para marca d'água e favicon
  layout/Cabecalho.tsx
  layout/Rodape.tsx
  layout/Breadcrumb.tsx               visível, casado com o BreadcrumbList
  base/Kicker.tsx  base/Chip.tsx  base/EstadoVazio.tsx
  diretorio/LinhaMedico.tsx           uma linha de resultado
  diretorio/ListaMedicos.tsx          <ul> de linhas + estado vazio
  diretorio/PainelFiltros.tsx         cliente: filtros sincronizados com a URL
  diretorio/GradeHorarios.tsx         horários por dia, hoje destacado
  seo/JsonLd.tsx                      <script type="application/ld+json">

lib/
  formato.ts                          PURO: telefone, CRM, contagem
  dados/tipos.ts                      tipos do domínio
  dados/cliente.ts                    cliente Supabase, só no servidor
  dados/horarios.ts                   PURO: aberto agora, agrupamento por dia
  dados/filtros.ts                    PURO: aplicar filtros, ordenar
  dados/facetas.ts                    PURO: regra de indexação, parágrafo gerado
  dados/medicos.ts                    consultas ao banco
  dados/especialidades.ts             consultas ao banco
  seo/metadados.ts                    PURO: moldes de title e description
  seo/jsonld.ts                       PURO: construtores de JSON-LD

supabase/
  migrations/0001_diretorio.sql
  migrations/0002_rls.sql
  seed/gerar-seed.ts                  gera o SQL de demonstração, determinístico
  seed/seed.sql                       saída do gerador

testes/
  formato.test.ts  horarios.test.ts  filtros.test.ts
  facetas.test.ts  metadados.test.ts  jsonld.test.ts
```

---

### Task 1: Esqueleto do projeto

Instala o Next 16, o Tailwind 4 e o Vitest, e deixa `npm run dev` e `npm test` funcionando. Tudo o mais depende disto.

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `postcss.config.mjs`, `vitest.config.ts`, `eslint.config.mjs`, `app/layout.tsx`, `app/globals.css`, `testes/sanidade.test.ts`
- Modify: nenhum

**Interfaces:**
- Consumes: nada
- Produces: alias `@/*` apontando para a raiz; scripts `dev`, `build`, `start`, `test`, `lint`

- [ ] **Step 1: Criar o projeto numa pasta limpa e trazer para cá**

A pasta já tem `.git`, `docs/` e `marca/`, e o `create-next-app` se recusa a
gerar sobre um diretório ocupado. Gerar ao lado e mover é mais previsível do
que discutir com as flags dele — e não arrisca o repositório que já existe.

```bash
cd "C:/Users/maron/Desktop/site-ami" && npx --yes create-next-app@16.3.1 andaime-scratch --ts --tailwind --app --no-src-dir --import-alias "@/*" --no-git --skip-install --yes
```

```bash
cd "C:/Users/maron/Desktop/site-ami" && cp -r andaime-scratch/app andaime-scratch/public . 2>/dev/null; cp andaime-scratch/package.json andaime-scratch/tsconfig.json andaime-scratch/next.config.ts andaime-scratch/postcss.config.mjs andaime-scratch/eslint.config.mjs andaime-scratch/next-env.d.ts . && rm -rf andaime-scratch && ls
```

Esperado: `app/`, `public/`, `package.json`, `tsconfig.json`, `next.config.ts`,
`postcss.config.mjs`, `eslint.config.mjs` na raiz, junto de `docs/` e `marca/`.
O `.gitignore` do projeto **não** deve ter sido substituído — confira que ele
ainda contém a linha `marca/_estudo-restauracao-recusado/`.

- [ ] **Step 2: Instalar as dependências nas versões travadas**

```bash
cd "C:/Users/maron/Desktop/site-ami" && npm install next@16.3.1 react@19 react-dom@19 @supabase/supabase-js@2.112.3 && npm install -D typescript@5 @types/node@20 @types/react@19 @types/react-dom@19 tailwindcss@4.1.11 @tailwindcss/postcss@4.1.11 vitest@4.1.11 eslint@9 eslint-config-next@16.3.1
```

- [ ] **Step 3: Fixar os scripts**

Substitua o bloco `scripts` do `package.json`. Note que **não** há `--turbopack`: no Next 16 ele é o padrão, e passar a flag é redundante.

```json
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint .",
    "test": "vitest run",
    "test:watch": "vitest"
  },
```

- [ ] **Step 4: Configurar o Vitest**

Crie `vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

/* Os testes cobrem só a lógica pura de `lib/`. Não há teste de interface:
   o custo de manter não se paga num site deste porte. */
export default defineConfig({
  test: {
    include: ["testes/**/*.test.ts"],
    environment: "node",
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL(".", import.meta.url)),
    },
  },
});
```

- [ ] **Step 5: Escrever o teste de sanidade**

Crie `testes/sanidade.test.ts`. Ele existe para provar que o executor de testes e o alias `@/` estão de pé — sem isso, um erro de configuração se disfarça de erro de código na primeira tarefa que importar algo.

```ts
import { describe, expect, it } from "vitest";

describe("ambiente de testes", () => {
  it("executa e resolve o alias @/", async () => {
    const pacote = await import("@/package.json");
    expect(pacote.default.name).toBeTruthy();
  });
});
```

- [ ] **Step 6: Rodar o teste**

```bash
cd "C:/Users/maron/Desktop/site-ami" && npm test
```

Esperado: `1 passed`.

- [ ] **Step 7: Subir o servidor e conferir**

```bash
cd "C:/Users/maron/Desktop/site-ami" && npm run dev
```

Esperado: `Ready` em `http://localhost:3000`, sem erro no terminal. Interrompa com Ctrl+C.

- [ ] **Step 8: Commit**

```bash
cd "C:/Users/maron/Desktop/site-ami" && git add -A && git commit -m "Esqueleto do projeto: Next 16, Tailwind 4 e Vitest"
```

---

### Task 2: Tokens da direção de arte e tipografia

Traduz a paleta e a escala tipográfica para variáveis CSS, e carrega as duas fontes. Toda tarefa visual daqui em diante consome estes tokens, e nenhuma inventa cor fora desta lista.

**Files:**
- Create: `lib/fontes.ts`
- Modify: `app/globals.css` (substituir por completo), `app/layout.tsx` (substituir por completo)

**Interfaces:**
- Consumes: Task 1
- Produces: `fonteTitulo` e `fonteCorpo` de `@/lib/fontes`, expondo as variáveis CSS `--fonte-titulo` e `--fonte-corpo`; os tokens `--ami-green-900|800|700|600|500`, `--ami-mint-400|100`, `--ink-900|600|400|300`, `--line`, `--line-strong`, `--surface`, `--canvas`, `--warn`, `--danger`

- [ ] **Step 1: Carregar as fontes**

Crie `lib/fontes.ts`. O `next/font/google` baixa e **auto-hospeda** os arquivos no build — é isso que satisfaz o requisito de fontes auto-hospedadas, sem download manual.

```ts
import { Archivo, Source_Sans_3 } from "next/font/google";

/* Archivo é variável e tem eixo de largura (wdth). É por ele que os títulos
   são comprimidos entre 80% e 87,5%, ecoando o letreiro condensado da marca.
   Não existe família "Archivo Condensed" — a compressão vem do eixo. */
export const fonteTitulo = Archivo({
  subsets: ["latin-ext"],
  axes: ["wdth"],
  display: "swap",
  variable: "--fonte-titulo",
});

/* Source Sans 3: escolhida pela legibilidade em corpo pequeno e pela
   cobertura de acentuação portuguesa. latin-ext cobre ã, ç, é, ô. */
export const fonteCorpo = Source_Sans_3({
  subsets: ["latin-ext"],
  weight: ["400", "600"],
  display: "swap",
  variable: "--fonte-corpo",
});
```

- [ ] **Step 2: Escrever os tokens**

Substitua **todo** o conteúdo de `app/globals.css`:

```css
@import "tailwindcss";

/* =========================================================
   DIREÇÃO DE ARTE — ASSOCIAÇÃO MÉDICA DE IMPERATRIZ
   Mudou aqui, muda no site inteiro. Nenhum componente
   inventa cor fora desta lista.
   ========================================================= */

@theme {
  /* --- VERDES: estruturais, não decorativos --- */
  --color-ami-green-900: #06210f; /* rodapé, faixas de máxima ênfase */
  --color-ami-green-800: #0b3018; /* faixas institucionais */
  --color-ami-green-700: #123d24; /* superfícies escuras secundárias */
  --color-ami-green-600: #1f6b3a; /* AÇÃO: botões e links (6,51:1 sobre branco) */
  --color-ami-green-500: #00a457; /* verde da marca — símbolo e preenchimento, NUNCA texto */

  /* --- MENTA: só sobre verde escuro, ou decorativa --- */
  --color-ami-mint-400: #a5dcaf; /* 1,56:1 sobre branco — jamais texto em fundo claro */
  --color-ami-mint-100: #e6f4e9; /* wash de fundo */

  /* --- TINTA --- */
  --color-ink-900: #14201a;
  --color-ink-600: #4b5a51;
  --color-ink-400: #657268; /* legendas (5,0:1 sobre branco) */
  --color-ink-300: #8a968f; /* SÓ placeholder e ícone desabilitado */

  /* --- SUPERFÍCIES E FIOS --- */
  --color-line: #e1e8e3; /* separador padrão do site */
  --color-line-strong: #c3d0c7; /* fios de seção */
  --color-surface: #ffffff;
  --color-canvas: #f4f7f4; /* cinza-esverdeado frio, nunca bege */
  --color-warn: #8a6a00;
  --color-danger: #a33232;

  /* --- FONTES --- */
  --font-titulo: var(--fonte-titulo), "Archivo Narrow", system-ui, sans-serif;
  --font-corpo: var(--fonte-corpo), system-ui, sans-serif;

  /* --- RAIOS: por função, não um valor para tudo --- */
  --radius-controle: 6px; /* botões e campos */
  --radius-bloco: 10px; /* cartões e tabelas */
  --radius-chip: 999px;
}

@layer base {
  html {
    /* Zoom nunca bloqueado. */
    -webkit-text-size-adjust: 100%;
  }

  body {
    background-color: var(--color-canvas);
    color: var(--color-ink-900);
    font-family: var(--font-corpo);
    font-size: 17px;
    line-height: 1.65;
    /* Palavra gigante sem espaço — link longo, e-mail comprido — empurraria
       a página e criaria rolagem horizontal. */
    overflow-wrap: break-word;
  }

  h1,
  h2,
  h3 {
    font-family: var(--font-titulo);
    color: var(--color-ink-900);
    text-wrap: balance;
  }

  /* O salto entre níveis é grande de propósito: título e subtítulo com
     tamanhos próximos é uma das marcas mais visíveis de layout automático. */
  h1 {
    font-size: 34px;
    line-height: 38px;
    font-weight: 700;
    font-stretch: 82%;
    letter-spacing: -0.02em;
  }

  h2 {
    font-size: 26px;
    line-height: 30px;
    font-weight: 700;
    font-stretch: 85%;
    letter-spacing: -0.01em;
  }

  h3 {
    font-size: 21px;
    line-height: 28px;
    font-weight: 600;
    font-stretch: 100%;
  }

  @media (min-width: 768px) {
    h1 {
      font-size: 48px;
      line-height: 52px;
    }
    h2 {
      font-size: 32px;
      line-height: 36px;
    }
  }

  /* Foco visível obrigatório em tudo que recebe foco. Nunca outline:none. */
  :focus-visible {
    outline: 2px solid var(--color-ami-green-600);
    outline-offset: 2px;
    border-radius: 2px;
  }

  /* Movimento só comunica estado. Quem pediu menos movimento, recebe menos. */
  @media (prefers-reduced-motion: reduce) {
    *,
    *::before,
    *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
      scroll-behavior: auto !important;
    }
  }
}

@utility numero-tabular {
  font-variant-numeric: tabular-nums;
}

/* Coluna de texto corrido: 580px rende cerca de 68 caracteres por linha em
   17px. Acima de 80 caracteres a leitura cansa. */
@utility coluna-leitura {
  max-width: 580px;
}
```

- [ ] **Step 3: Montar o layout raiz**

Substitua **todo** o conteúdo de `app/layout.tsx`:

```tsx
import type { Metadata } from "next";
import { fonteCorpo, fonteTitulo } from "@/lib/fontes";
import "./globals.css";

/* O endereço final entra em NEXT_PUBLIC_SITE_URL. metadataBase é o que
   transforma caminhos relativos em URL absoluta no canonical e no Open Graph. */
export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  ),
  /*
    Sem `template`. Os títulos vêm de lib/seo/metadados.ts, que já termina
    cada um com "| AMI" e mede o resultado contra o limite de 60 caracteres.
    Um template acrescentando o sufixo de novo produziria "… | AMI | AMI" e
    estouraria justamente o limite que aquele módulo existe para respeitar.

    `default` continua valendo para qualquer página que não defina título.
  */
  title: {
    default: "Associação Médica de Imperatriz",
  },
};

export default function LayoutRaiz({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="pt-BR"
      className={`${fonteTitulo.variable} ${fonteCorpo.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Step 4: Conferir no navegador**

```bash
cd "C:/Users/maron/Desktop/site-ami" && npm run dev
```

Abra `http://localhost:3000`. Esperado: fundo `#F4F7F4`, texto em Source Sans 3, sem erro de fonte no terminal. Dê Tab em qualquer link: o anel verde de foco precisa aparecer.

- [ ] **Step 5: Commit**

```bash
cd "C:/Users/maron/Desktop/site-ami" && git add -A && git commit -m "Tokens da direção de arte e tipografia"
```

---

### Task 3: Formatação em português

Funções puras de apresentação. Uma delas carrega uma exigência legal: a palavra **MÉDICO** ao lado do CRM não é decoração de texto, é o Art. 4º, I da Resolução CFM 2.336/2023. Ficar num único lugar impede que alguém esqueça dela numa tela.

**Files:**
- Create: `lib/formato.ts`, `testes/formato.test.ts`

**Interfaces:**
- Consumes: Task 1
- Produces:
  - `formatarTelefone(bruto: string): string`
  - `identificacaoMedica(crm: string, uf: string): string`
  - `contagem(n: number, singular: string, plural: string): string`

- [ ] **Step 1: Escrever os testes que falham**

Crie `testes/formato.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  contagem,
  formatarTelefone,
  identificacaoMedica,
} from "@/lib/formato";

describe("formatarTelefone", () => {
  it("formata celular de 11 dígitos", () => {
    expect(formatarTelefone("99988887777")).toBe("(99) 98888-7777");
  });

  it("formata fixo de 10 dígitos", () => {
    expect(formatarTelefone("9933334444")).toBe("(99) 3333-4444");
  });

  it("ignora o que não for dígito na entrada", () => {
    expect(formatarTelefone("+55 (99) 98888-7777")).toBe("(99) 98888-7777");
  });

  it("devolve a entrada quando o tamanho não é reconhecido", () => {
    expect(formatarTelefone("123")).toBe("123");
  });
});

describe("identificacaoMedica", () => {
  it("acompanha o CRM da palavra MÉDICO, como exige a CFM 2.336/2023", () => {
    expect(identificacaoMedica("12345", "MA")).toBe("MÉDICO · CRM/MA 12345");
  });

  it("normaliza a UF para maiúscula", () => {
    expect(identificacaoMedica("999", "ma")).toBe("MÉDICO · CRM/MA 999");
  });
});

describe("contagem", () => {
  it("usa o singular quando há exatamente um", () => {
    expect(contagem(1, "médico", "médicos")).toBe("1 médico");
  });

  it("usa o plural nos demais casos, inclusive zero", () => {
    expect(contagem(0, "médico", "médicos")).toBe("0 médicos");
    expect(contagem(24, "médico", "médicos")).toBe("24 médicos");
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

```bash
cd "C:/Users/maron/Desktop/site-ami" && npm test -- testes/formato.test.ts
```

Esperado: FAIL, com erro de resolução do módulo `@/lib/formato`.

- [ ] **Step 3: Implementar**

Crie `lib/formato.ts`:

```ts
/* Apresentação de dados em português. Funções puras: entram valores,
   saem strings, sem tocar em banco nem em data do sistema. */

/** Formata telefone brasileiro. Devolve a entrada intacta se não reconhecer. */
export function formatarTelefone(bruto: string): string {
  const digitos = bruto.replace(/\D/g, "");
  const nacional = digitos.length > 11 ? digitos.slice(-11) : digitos;

  if (nacional.length === 11) {
    return `(${nacional.slice(0, 2)}) ${nacional.slice(2, 7)}-${nacional.slice(7)}`;
  }
  if (nacional.length === 10) {
    return `(${nacional.slice(0, 2)}) ${nacional.slice(2, 6)}-${nacional.slice(6)}`;
  }
  return bruto;
}

/**
 * Identificação do profissional.
 *
 * A palavra MÉDICO ao lado do CRM é exigência da Resolução CFM 2.336/2023,
 * Art. 4º, I, e precisa aparecer em todo perfil e em toda linha de resultado.
 * Mora aqui para que nenhuma tela consiga esquecer dela.
 */
export function identificacaoMedica(crm: string, uf: string): string {
  return `MÉDICO · CRM/${uf.toUpperCase()} ${crm}`;
}

/** Concorda o substantivo com o número. Zero vai para o plural, em português. */
export function contagem(n: number, singular: string, plural: string): string {
  return `${n} ${n === 1 ? singular : plural}`;
}
```

- [ ] **Step 4: Rodar e ver passar**

```bash
cd "C:/Users/maron/Desktop/site-ami" && npm test -- testes/formato.test.ts
```

Esperado: `9 passed`.

- [ ] **Step 5: Commit**

```bash
cd "C:/Users/maron/Desktop/site-ami" && git add lib/formato.ts testes/formato.test.ts && git commit -m "Formatação em português, com a identificação exigida pela CFM"
```

---

### Task 4: Horários e o selo "Aberto agora"

O portal anterior guardava horário como texto dentro de imagem, e por isso não dava para filtrar nem indexar. Aqui o horário é dado estruturado, e estas funções o transformam em resposta. São puras: recebem o instante como argumento em vez de ler o relógio, para que o teste seja determinístico.

**Files:**
- Create: `lib/dados/horarios.ts`, `testes/horarios.test.ts`

**Interfaces:**
- Consumes: Task 1
- Produces:
  - `type Horario = { diaSemana: number; abre: string; fecha: string }` — `diaSemana` 0 = domingo
  - `estaAbertoAgora(horarios: Horario[], instante: Date): boolean`
  - `agruparPorDia(horarios: Horario[]): { dia: number; nome: string; faixas: string[] }[]` — sempre 7 posições, de domingo a sábado
  - `atendeNoDia(horarios: Horario[], diaSemana: number): boolean`

- [ ] **Step 1: Escrever os testes que falham**

Crie `testes/horarios.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  agruparPorDia,
  atendeNoDia,
  estaAbertoAgora,
  type Horario,
} from "@/lib/dados/horarios";

/* Terça-feira, 19/08/2026. Datas fixas: o teste não pode depender do dia
   em que roda. */
const terca = (hora: string) => new Date(`2026-08-18T${hora}:00`);

const comercial: Horario[] = [
  { diaSemana: 2, abre: "08:00", fecha: "12:00" },
  { diaSemana: 2, abre: "14:00", fecha: "18:00" },
  { diaSemana: 6, abre: "08:00", fecha: "12:00" },
];

describe("estaAbertoAgora", () => {
  it("está aberto dentro da faixa da manhã", () => {
    expect(estaAbertoAgora(comercial, terca("09:30"))).toBe(true);
  });

  it("está fechado no intervalo do almoço", () => {
    expect(estaAbertoAgora(comercial, terca("12:30"))).toBe(false);
  });

  it("está aberto dentro da faixa da tarde", () => {
    expect(estaAbertoAgora(comercial, terca("17:59"))).toBe(true);
  });

  it("fecha no minuto de fechamento", () => {
    expect(estaAbertoAgora(comercial, terca("18:00"))).toBe(false);
  });

  it("abre no minuto de abertura", () => {
    expect(estaAbertoAgora(comercial, terca("08:00"))).toBe(true);
  });

  it("está fechado num dia sem atendimento", () => {
    const domingo = new Date("2026-08-16T10:00:00");
    expect(estaAbertoAgora(comercial, domingo)).toBe(false);
  });

  it("está fechado quando não há horário nenhum", () => {
    expect(estaAbertoAgora([], terca("10:00"))).toBe(false);
  });
});

describe("atendeNoDia", () => {
  it("reconhece atendimento no sábado", () => {
    expect(atendeNoDia(comercial, 6)).toBe(true);
  });

  it("nega atendimento no domingo", () => {
    expect(atendeNoDia(comercial, 0)).toBe(false);
  });
});

describe("agruparPorDia", () => {
  it("devolve os sete dias, de domingo a sábado", () => {
    const dias = agruparPorDia(comercial);
    expect(dias).toHaveLength(7);
    expect(dias[0].nome).toBe("Domingo");
    expect(dias[6].nome).toBe("Sábado");
  });

  it("junta as faixas do mesmo dia em ordem", () => {
    const dias = agruparPorDia(comercial);
    expect(dias[2].faixas).toEqual(["08:00 às 12:00", "14:00 às 18:00"]);
  });

  it("deixa vazio o dia sem atendimento", () => {
    expect(agruparPorDia(comercial)[0].faixas).toEqual([]);
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

```bash
cd "C:/Users/maron/Desktop/site-ami" && npm test -- testes/horarios.test.ts
```

Esperado: FAIL, com erro de resolução do módulo `@/lib/dados/horarios`.

- [ ] **Step 3: Implementar**

Crie `lib/dados/horarios.ts`:

```ts
/* Horário é tabela relacional, nunca texto livre e jamais dentro de imagem —
   foi exatamente isso que inviabilizou filtro e SEO no portal anterior.
   Estas funções são puras e recebem o instante por argumento, para que o
   resultado não dependa do relógio da máquina que roda o teste. */

export type Horario = {
  /** 0 = domingo, 6 = sábado. Mesma convenção de Date.getDay(). */
  diaSemana: number;
  /** "HH:MM" */
  abre: string;
  /** "HH:MM" */
  fecha: string;
};

const NOMES = [
  "Domingo",
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
] as const;

/** "08:30" vira 510 minutos. Comparar número é mais simples que comparar texto. */
function emMinutos(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

/**
 * Aberto no instante dado.
 *
 * A abertura é inclusiva e o fechamento é exclusivo: às 18:00 de um
 * expediente que fecha às 18:00, o consultório já fechou.
 */
export function estaAbertoAgora(horarios: Horario[], instante: Date): boolean {
  const dia = instante.getDay();
  const agora = instante.getHours() * 60 + instante.getMinutes();

  return horarios.some(
    (h) =>
      h.diaSemana === dia &&
      agora >= emMinutos(h.abre) &&
      agora < emMinutos(h.fecha),
  );
}

/** Alimenta o filtro "atende no sábado" e afins. */
export function atendeNoDia(horarios: Horario[], diaSemana: number): boolean {
  return horarios.some((h) => h.diaSemana === diaSemana);
}

/**
 * Sempre sete posições, de domingo a sábado, mesmo nos dias sem atendimento —
 * a tabela do perfil precisa das linhas vazias para não mentir sobre a semana.
 */
export function agruparPorDia(
  horarios: Horario[],
): { dia: number; nome: string; faixas: string[] }[] {
  return NOMES.map((nome, dia) => ({
    dia,
    nome,
    faixas: horarios
      .filter((h) => h.diaSemana === dia)
      .sort((a, b) => emMinutos(a.abre) - emMinutos(b.abre))
      .map((h) => `${h.abre} às ${h.fecha}`),
  }));
}
```

- [ ] **Step 4: Rodar e ver passar**

```bash
cd "C:/Users/maron/Desktop/site-ami" && npm test -- testes/horarios.test.ts
```

Esperado: `12 passed`.

- [ ] **Step 5: Commit**

```bash
cd "C:/Users/maron/Desktop/site-ami" && git add lib/dados/horarios.ts testes/horarios.test.ts && git commit -m "Horários por dia e selo Aberto agora"
```

---

### Task 5: Esquema do banco e políticas de acesso

Cria as tabelas do diretório e escreve as permissões como políticas RLS **no banco**, não como regra de tela. Um erro de front não pode vazar dado de outro médico.

**Pré-requisito:** um projeto no Supabase precisa existir. Anote `Project URL` e `anon public key` em Project Settings → API.

**Files:**
- Create: `supabase/migrations/0001_diretorio.sql`, `supabase/migrations/0002_rls.sql`, `.env.example`, `.env.local`

**Interfaces:**
- Consumes: Task 1
- Produces: tabelas `especialidade`, `bairro`, `profissional`, `profissional_especialidade`, `formacao`, `estabelecimento`, `local`, `local_acessibilidade`, `atendimento`, `horario`; variáveis `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`

- [ ] **Step 1: Escrever a migração do diretório**

Crie `supabase/migrations/0001_diretorio.sql`:

```sql
-- Diretório médico da AMI.
-- Convênio, preço e avaliação não existem neste projeto, por decisão de escopo.

create extension if not exists unaccent;
create extension if not exists pg_trgm;

create table especialidade (
  id              bigint generated always as identity primary key,
  nome            text not null unique,
  slug            text not null unique,
  o_que_faz       text,
  quando_procurar text,
  revisado_por    bigint,
  revisado_em     date
);

create table bairro (
  id     bigint generated always as identity primary key,
  nome   text not null,
  slug   text not null unique,
  cidade text not null default 'Imperatriz',
  uf     text not null default 'MA'
);

create table profissional (
  id            bigint generated always as identity primary key,
  slug          text not null unique,
  nome          text not null,
  -- CRM é bloqueante para publicar: sem ele o perfil não vai ao ar.
  crm           text not null,
  crm_uf        text not null default 'MA',
  foto          text,
  bio           text,
  telemedicina  boolean not null default false,
  associado_ami boolean not null default false,
  situacao      text not null default 'ativo'
                check (situacao in ('ativo', 'inativo')),
  verificado_em date,
  publicado     boolean not null default false,
  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  unique (crm, crm_uf)
);

alter table especialidade
  add constraint especialidade_revisor_fk
  foreign key (revisado_por) references profissional (id) on delete set null;

create table profissional_especialidade (
  profissional_id  bigint not null references profissional (id) on delete cascade,
  especialidade_id bigint not null references especialidade (id) on delete cascade,
  -- RQE só existe quando há especialidade registrada no CRM.
  -- Clínico geral sem RQE é caso normal: por isso aceita nulo.
  rqe       text,
  principal boolean not null default false,
  primary key (profissional_id, especialidade_id)
);

create table formacao (
  id              bigint generated always as identity primary key,
  profissional_id bigint not null references profissional (id) on delete cascade,
  instituicao     text not null,
  curso           text not null,
  tipo            text not null
                  check (tipo in ('graduacao', 'residencia', 'titulo')),
  ano             int
);

create table estabelecimento (
  id        bigint generated always as identity primary key,
  slug      text not null unique,
  nome      text not null,
  cnpj      text,
  categoria text not null
            check (categoria in ('clinica', 'laboratorio', 'hospital', 'centro_diagnostico')),
  sobre     text,
  publicado boolean not null default false
);

create table local (
  id                 bigint generated always as identity primary key,
  estabelecimento_id bigint references estabelecimento (id) on delete cascade,
  logradouro         text not null,
  numero             text,
  complemento        text,
  bairro_id          bigint not null references bairro (id),
  cep                text,
  lat                numeric(9, 6),
  lng                numeric(9, 6),
  telefone           text,
  whatsapp           text,
  estacionamento     boolean not null default false
);

create table local_acessibilidade (
  local_id bigint not null references local (id) on delete cascade,
  recurso  text not null
           check (recurso in ('acesso_cadeirante', 'banheiro_adaptado',
                              'elevador', 'piso_tatil', 'interprete_libras')),
  primary key (local_id, recurso)
);

create table atendimento (
  id              bigint generated always as identity primary key,
  profissional_id bigint not null references profissional (id) on delete cascade,
  local_id        bigint not null references local (id) on delete cascade,
  unique (profissional_id, local_id)
);

create table horario (
  id             bigint generated always as identity primary key,
  atendimento_id bigint not null references atendimento (id) on delete cascade,
  dia_semana     smallint not null check (dia_semana between 0 and 6),
  abre           time not null,
  fecha          time not null,
  check (fecha > abre)
);

-- Busca por nome em português: sem unaccent, "jose" não acha "José", que é
-- exatamente o caso em que o usuário mais precisa da busca.
--
-- O unaccent() da extensão é STABLE, e o Postgres só indexa expressão
-- IMMUTABLE. Daí este invólucro: mesma função, marcada corretamente, com
-- o dicionário nomeado explicitamente para que o resultado não dependa do
-- search_path de quem consulta.
create function sem_acento(texto text) returns text
  language sql immutable strict parallel safe
  as $$ select public.unaccent('public.unaccent', texto) $$;

create index profissional_nome_trgm
  on profissional using gin (sem_acento(nome) gin_trgm_ops);

create index profissional_publicado on profissional (publicado);
create index local_bairro on local (bairro_id);
create index atendimento_profissional on atendimento (profissional_id);
create index horario_atendimento on horario (atendimento_id);
```

- [ ] **Step 2: Escrever as políticas de acesso**

Crie `supabase/migrations/0002_rls.sql`:

```sql
-- Permissões vivem no banco. O visitante só enxerga o que está publicado,
-- e nenhum erro de tela consegue expor rascunho.

alter table especialidade               enable row level security;
alter table bairro                      enable row level security;
alter table profissional                enable row level security;
alter table profissional_especialidade  enable row level security;
alter table formacao                    enable row level security;
alter table estabelecimento             enable row level security;
alter table local                       enable row level security;
alter table local_acessibilidade        enable row level security;
alter table atendimento                 enable row level security;
alter table horario                     enable row level security;

-- Tabelas de referência: leitura livre, são catálogo público.
create policy leitura_especialidade on especialidade for select using (true);
create policy leitura_bairro        on bairro        for select using (true);

-- Só perfis publicados aparecem.
create policy leitura_profissional on profissional
  for select using (publicado = true);

create policy leitura_estabelecimento on estabelecimento
  for select using (publicado = true);

-- As tabelas dependentes herdam a condição do dono. Sem isto, alguém
-- listaria os horários de um perfil que ainda não foi ao ar.
create policy leitura_prof_esp on profissional_especialidade
  for select using (exists (
    select 1 from profissional p
    where p.id = profissional_id and p.publicado = true));

create policy leitura_formacao on formacao
  for select using (exists (
    select 1 from profissional p
    where p.id = profissional_id and p.publicado = true));

/*
  Um local é público quando pertence a um estabelecimento publicado OU quando
  algum profissional publicado atende nele.

  A condição vive numa função porque as duas políticas abaixo precisam dela e
  duplicá-las deixaria uma delas para trás na primeira alteração. SECURITY
  DEFINER evita que a RLS das tabelas consultadas aqui dispare recursivamente
  dentro da própria política, e o search_path fixo impede que alguém troque o
  significado de "local" por um objeto homônimo.

  Sem isto, o consultório próprio de um médico não publicado — que tem
  estabelecimento_id nulo — ficaria legível para qualquer visitante, expondo
  endereço, telefone e coordenadas de um perfil que ainda não foi ao ar.
*/
create function local_publicado(id_local bigint) returns boolean
  language sql stable security definer set search_path = public
  as $$
    select exists (
             select 1 from local l
             join estabelecimento e on e.id = l.estabelecimento_id
             where l.id = id_local and e.publicado = true)
        or exists (
             select 1 from atendimento a
             join profissional p on p.id = a.profissional_id
             where a.local_id = id_local and p.publicado = true);
  $$;

create policy leitura_local on local
  for select using (local_publicado(id));

create policy leitura_acessibilidade on local_acessibilidade
  for select using (local_publicado(local_id));

create policy leitura_atendimento on atendimento
  for select using (exists (
    select 1 from profissional p
    where p.id = profissional_id and p.publicado = true));

create policy leitura_horario on horario
  for select using (exists (
    select 1 from atendimento a
    join profissional p on p.id = a.profissional_id
    where a.id = atendimento_id and p.publicado = true));
```

- [ ] **Step 3: Aplicar as duas migrações**

Abra o SQL Editor do projeto no Supabase, cole `0001_diretorio.sql`, execute. Repita com `0002_rls.sql`.

Esperado: `Success. No rows returned` nas duas vezes.

- [ ] **Step 4: Guardar as chaves**

Crie `.env.example` — este vai para o git, sem valores:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Crie `.env.local` com os valores reais do painel do Supabase. O `.gitignore` já o exclui — confirme com `git status` que ele **não** aparece.

- [ ] **Step 5: Conferir que a política funciona**

No SQL Editor:

```sql
insert into profissional (slug, nome, crm, publicado)
values ('teste-rls', 'Teste RLS', '00000', false)
returning id;

-- use o id devolvido acima nos dois inserts seguintes
insert into local (logradouro, bairro_id, telefone)
values ('Rua do Teste', 1, '9999999999') returning id;

insert into atendimento (profissional_id, local_id)
values (:id_profissional, :id_local);

set role anon;
select
  (select count(*) from profissional where slug = 'teste-rls') as perfil,
  (select count(*) from local where logradouro = 'Rua do Teste') as endereco;
reset role;

delete from profissional where slug = 'teste-rls';
delete from local where logradouro = 'Rua do Teste';
```

Esperado: **as duas contagens devolvem `0`**. O endereço importa tanto quanto o
perfil: um consultório próprio tem `estabelecimento_id` nulo, e uma política
mal escrita ali expõe endereço, telefone e coordenadas de quem ainda não foi ao
ar. Se qualquer uma devolver `1`, a RLS não está fechada e é preciso rever o
passo 3 antes de seguir.

- [ ] **Step 6: Commit**

```bash
git add supabase/ .env.example && git commit -m "Esquema do diretório e políticas de acesso no banco"
```

---

### Task 6: Dados de demonstração

A planilha dos cerca de 500 associados ainda não existe. Estes dados seguram o desenvolvimento e, mais importante, dão aos filtros o que filtrar: sem variação de bairro, dia de atendimento e acessibilidade, um filtro quebrado passa despercebido.

O gerador é determinístico — mesma entrada, mesmo SQL — para que rodá-lo de novo não embaralhe o banco.

**Files:**
- Create: `supabase/seed/gerar-seed.ts`, `supabase/seed/seed.sql` (gerado)

**Interfaces:**
- Consumes: Task 5
- Produces: 24 profissionais publicados, 8 bairros reais de Imperatriz, 14 especialidades, locais com horários variados

- [ ] **Step 1: Escrever o gerador**

Crie `supabase/seed/gerar-seed.ts`:

```ts
/*
  Gera supabase/seed/seed.sql. Determinístico: sem Math.random e sem Date.now,
  para que rodar duas vezes produza exatamente o mesmo arquivo.

  Rode com:  npx tsx supabase/seed/gerar-seed.ts
*/
import { writeFileSync } from "node:fs";

const BAIRROS = [
  "Centro",
  "Nova Imperatriz",
  "Bacuri",
  "Juçara",
  "Maranhão Novo",
  "Parque do Buriti",
  "Vila Lobão",
  "Santa Rita",
];

const ESPECIALIDADES = [
  "Clínica Médica",
  "Cardiologia",
  "Dermatologia",
  "Ginecologia e Obstetrícia",
  "Ortopedia e Traumatologia",
  "Pediatria",
  "Oftalmologia",
  "Psiquiatria",
  "Endocrinologia",
  "Gastroenterologia",
  "Neurologia",
  "Otorrinolaringologia",
  "Urologia",
  "Reumatologia",
];

const NOMES = [
  "Mayara Viana", "Rafael Coelho", "Larissa Nogueira", "Tiago Barbosa",
  "Camila Freitas", "Otávio Lemos", "Beatriz Sampaio", "Henrique Portela",
  "Juliana Marques", "Diego Aragão", "Patrícia Cordeiro", "Fábio Rocha",
  "Renata Bastos", "Marcelo Tavares", "Aline Peixoto", "Gustavo Serra",
  "Vanessa Quirino", "Leonardo Prata", "Simone Andrade", "Rodrigo Meireles",
  "Cristina Bezerra", "Anderson Vilela", "Tatiane Furtado", "Bruno Cavalcante",
];

const semAcento = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

const slug = (s: string) =>
  semAcento(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const aspas = (s: string) => "'" + s.replace(/'/g, "''") + "'";

const linhas: string[] = [
  "-- Dados de demonstração. Fictícios, mas verossímeis para Imperatriz-MA.",
  "-- Gerado por supabase/seed/gerar-seed.ts — não edite à mão.",
  "",
  "truncate horario, atendimento, local_acessibilidade, local,",
  "  formacao, profissional_especialidade, profissional, estabelecimento,",
  "  bairro, especialidade restart identity cascade;",
  "",
];

linhas.push("insert into bairro (nome, slug) values");
linhas.push(
  BAIRROS.map((b) => "  (" + aspas(b) + ", " + aspas(slug(b)) + ")").join(",\n") + ";",
  "",
);

linhas.push(
  "insert into especialidade (nome, slug, o_que_faz, quando_procurar) values",
);
linhas.push(
  ESPECIALIDADES.map((e) => {
    const oQueFaz =
      "[PROVISÓRIO] Texto sobre a atuação em " + e.toLowerCase() +
      ", a ser escrito e revisado por médico associado.";
    const quando =
      "[PROVISÓRIO] Sinais e situações que levam à consulta em " +
      e.toLowerCase() + ", a ser escrito e revisado por médico associado.";
    return (
      "  (" + aspas(e) + ", " + aspas(slug(e)) + ", " +
      aspas(oQueFaz) + ", " + aspas(quando) + ")"
    );
  }).join(",\n") + ";",
  "",
);

/* Profissionais. A variação é proposital e distribuída por índice:
   telemedicina em 1 de 3, associado em 3 de 4, sábado em 1 de 4. */
linhas.push(
  "insert into profissional (slug, nome, crm, crm_uf, bio, telemedicina, " +
    "associado_ami, publicado, verificado_em) values",
);
linhas.push(
  NOMES.map((nome, i) => {
    const bio =
      "[PROVISÓRIO] Biografia de " + nome +
      ", a ser substituída por texto enviado pelo profissional.";
    return (
      "  (" + aspas(slug(nome)) + ", " + aspas(nome) + ", " +
      aspas(String(10000 + i * 137)) + ", 'MA', " + aspas(bio) + ", " +
      (i % 3 === 0) + ", " + (i % 4 !== 0) + ", true, '2026-08-19')"
    );
  }).join(",\n") + ";",
  "",
);

/* Cada profissional recebe uma especialidade. Os que caem em Clínica Médica
   ficam sem RQE — caso normal que o site precisa saber exibir. */
linhas.push(
  "insert into profissional_especialidade " +
    "(profissional_id, especialidade_id, rqe, principal) values",
);
linhas.push(
  NOMES.map((_, i) => {
    const esp = (i % ESPECIALIDADES.length) + 1;
    const rqe = esp === 1 ? "null" : aspas(String(20000 + i * 91));
    return "  (" + (i + 1) + ", " + esp + ", " + rqe + ", true)";
  }).join(",\n") + ";",
  "",
);

linhas.push(
  "insert into local (logradouro, numero, bairro_id, telefone, whatsapp, " +
    "estacionamento) values",
);
linhas.push(
  NOMES.map((_, i) => {
    const bairro = (i % BAIRROS.length) + 1;
    const tel = "99" + String(30000000 + i * 13571).slice(0, 8);
    return (
      "  (" + aspas("Rua Projetada " + (100 + i)) + ", " +
      aspas(String(100 + i * 7)) + ", " + bairro + ", " +
      aspas(tel) + ", " + aspas(tel) + ", " + (i % 2 === 0) + ")"
    );
  }).join(",\n") + ";",
  "",
);

linhas.push("insert into local_acessibilidade (local_id, recurso) values");
linhas.push(
  NOMES.flatMap((_, i) => {
    const r: string[] = [];
    if (i % 2 === 0) r.push("  (" + (i + 1) + ", 'acesso_cadeirante')");
    if (i % 3 === 0) r.push("  (" + (i + 1) + ", 'banheiro_adaptado')");
    if (i % 5 === 0) r.push("  (" + (i + 1) + ", 'elevador')");
    return r;
  }).join(",\n") + ";",
  "",
);

linhas.push("insert into atendimento (profissional_id, local_id) values");
linhas.push(
  NOMES.map((_, i) => "  (" + (i + 1) + ", " + (i + 1) + ")").join(",\n") + ";",
  "",
);

/* Horários: todos atendem de segunda a sexta; 1 em cada 4 atende sábado.
   Sem essa variação, o filtro de sábado não teria o que filtrar. */
linhas.push("insert into horario (atendimento_id, dia_semana, abre, fecha) values");
linhas.push(
  NOMES.flatMap((_, i) => {
    const f: string[] = [];
    for (let d = 1; d <= 5; d++) {
      f.push("  (" + (i + 1) + ", " + d + ", '08:00', '12:00')");
      f.push("  (" + (i + 1) + ", " + d + ", '14:00', '18:00')");
    }
    if (i % 4 === 0) f.push("  (" + (i + 1) + ", 6, '08:00', '12:00')");
    return f;
  }).join(",\n") + ";",
  "",
);

writeFileSync(
  new URL("./seed.sql", import.meta.url),
  linhas.join("\n") + "\n",
  "utf8",
);

console.log(
  "seed.sql gerado: " + NOMES.length + " profissionais, " +
    ESPECIALIDADES.length + " especialidades, " + BAIRROS.length + " bairros",
);
```

- [ ] **Step 2: Gerar o arquivo**

```bash
npx --yes tsx supabase/seed/gerar-seed.ts
```

Esperado: `seed.sql gerado: 24 profissionais, 14 especialidades, 8 bairros`.

- [ ] **Step 3: Aplicar no banco**

Cole o conteúdo de `supabase/seed/seed.sql` no SQL Editor do Supabase e execute.

- [ ] **Step 4: Conferir a contagem**

No SQL Editor:

```sql
select
  (select count(*) from profissional where publicado) as medicos,
  (select count(*) from especialidade)                as especialidades,
  (select count(*) from bairro)                       as bairros,
  (select count(*) from horario)                      as horarios;
```

Esperado: 24 · 14 · 8 · 246.

- [ ] **Step 5: Commit**

```bash
git add supabase/seed/ && git commit -m "Gerador determinístico dos dados de demonstração"
```

---

### Task 7: Tipos do domínio e cliente do banco

Define a forma dos dados que o resto do plano consome e abre a única porta para o Supabase. Nenhuma página importa `@supabase/supabase-js` diretamente — se importar, a troca de banco vira reescrita de telas.

**Files:**
- Create: `lib/dados/tipos.ts`, `lib/dados/cliente.ts`

**Interfaces:**
- Consumes: Task 4 (`Horario`), Task 5 (variáveis de ambiente)
- Produces:
  - `type RecursoAcessibilidade = "acesso_cadeirante" | "banheiro_adaptado" | "elevador" | "piso_tatil" | "interprete_libras"`
  - `type Bairro = { id: number; nome: string; slug: string }`
  - `type EspecialidadeDoMedico = { nome: string; slug: string; rqe: string | null; principal: boolean }`
  - `type LocalAtendimento = { id: number; logradouro: string; numero: string | null; bairro: Bairro; telefone: string | null; whatsapp: string | null; estacionamento: boolean; acessibilidade: RecursoAcessibilidade[]; horarios: Horario[] }`
  - `type Medico = { id: number; slug: string; nome: string; crm: string; crmUf: string; foto: string | null; bio: string | null; telemedicina: boolean; associadoAmi: boolean; especialidades: EspecialidadeDoMedico[]; locais: LocalAtendimento[] }`
  - `type Ordem = "relevancia" | "nome"`
  - `type Filtros = { termo?: string; especialidade?: string; bairro?: string; telemedicina?: boolean; atendeSabado?: boolean; acessibilidade?: RecursoAcessibilidade[]; somenteAssociados?: boolean; ordem?: Ordem }`
  - `clienteServidor(): SupabaseClient`

- [ ] **Step 1: Escrever os tipos**

Crie `lib/dados/tipos.ts`:

```ts
import type { Horario } from "@/lib/dados/horarios";

/* A forma do domínio, em português e independente do formato de tabela.
   O que muda de nome aqui — `crmUf` em vez de `crm_uf` — é de propósito:
   as telas falam a língua do domínio, não a do banco. */

export type RecursoAcessibilidade =
  | "acesso_cadeirante"
  | "banheiro_adaptado"
  | "elevador"
  | "piso_tatil"
  | "interprete_libras";

export const ROTULO_ACESSIBILIDADE: Record<RecursoAcessibilidade, string> = {
  acesso_cadeirante: "Acesso para cadeirante",
  banheiro_adaptado: "Banheiro adaptado",
  elevador: "Elevador",
  piso_tatil: "Piso tátil",
  interprete_libras: "Intérprete de Libras",
};

export type Bairro = { id: number; nome: string; slug: string };

export type EspecialidadeDoMedico = {
  nome: string;
  slug: string;
  /** Nulo quando o profissional não tem especialidade registrada no CRM. */
  rqe: string | null;
  principal: boolean;
};

export type LocalAtendimento = {
  id: number;
  logradouro: string;
  numero: string | null;
  bairro: Bairro;
  telefone: string | null;
  whatsapp: string | null;
  estacionamento: boolean;
  acessibilidade: RecursoAcessibilidade[];
  horarios: Horario[];
};

export type Medico = {
  id: number;
  slug: string;
  nome: string;
  crm: string;
  crmUf: string;
  foto: string | null;
  bio: string | null;
  telemedicina: boolean;
  associadoAmi: boolean;
  especialidades: EspecialidadeDoMedico[];
  locais: LocalAtendimento[];
};

export type EspecialidadeComContagem = {
  nome: string;
  slug: string;
  total: number;
};

/** Relevância e nome. Nenhuma ordenação por reputação existe neste site. */
export type Ordem = "relevancia" | "nome";

export type Filtros = {
  termo?: string;
  /** slug da especialidade */
  especialidade?: string;
  /** slug do bairro */
  bairro?: string;
  telemedicina?: boolean;
  atendeSabado?: boolean;
  acessibilidade?: RecursoAcessibilidade[];
  somenteAssociados?: boolean;
  ordem?: Ordem;
};
```

- [ ] **Step 2: Abrir o cliente**

Crie `lib/dados/cliente.ts`:

```ts
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/*
  Único ponto do projeto que fala com o Supabase.

  Usa a chave anônima de propósito: com ela, as políticas RLS do banco valem,
  e o visitante só enxerga o que está publicado. Uma chave de serviço aqui
  ignoraria a RLS e transformaria qualquer descuido de consulta em vazamento.

  `persistSession: false` porque isto roda no servidor, sem navegador para
  guardar sessão — e o projeto não usa localStorage nem sessionStorage.
*/
export function clienteServidor(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const chave = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !chave) {
    throw new Error(
      "Faltam NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY. " +
        "Copie .env.example para .env.local e preencha com as chaves do projeto.",
    );
  }

  return createClient(url, chave, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
```

- [ ] **Step 3: Conferir que compila**

```bash
npx tsc --noEmit
```

Esperado: nenhum erro.

- [ ] **Step 4: Commit**

```bash
git add lib/dados/tipos.ts lib/dados/cliente.ts && git commit -m "Tipos do domínio e cliente do Supabase"
```

---

### Task 8: Filtros e ordenação

O portal anterior não tinha filtro nenhum. Aqui está o núcleo da correção — e ele é função pura, testável sem banco.

A ordenação merece atenção: numa entidade que representa **todos** os médicos da cidade, qualquer critério que favoreça alguém vira problema político antes de virar problema jurídico. Por isso "relevância" é definida de forma verificável e não considera completude, antiguidade nem qualquer nota.

**Files:**
- Create: `lib/dados/filtros.ts`, `testes/filtros.test.ts`

**Interfaces:**
- Consumes: Task 4, Task 7
- Produces:
  - `aplicarFiltros(medicos: Medico[], filtros: Filtros): Medico[]`
  - `ordenar(medicos: Medico[], ordem: Ordem, termo?: string): Medico[]`

- [ ] **Step 1: Escrever os testes que falham**

Crie `testes/filtros.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { aplicarFiltros, ordenar } from "@/lib/dados/filtros";
import type { Medico } from "@/lib/dados/tipos";

function medico(over: Partial<Medico> & { nome: string }): Medico {
  return {
    id: 1,
    slug: "x",
    crm: "1",
    crmUf: "MA",
    foto: null,
    bio: null,
    telemedicina: false,
    associadoAmi: false,
    especialidades: [],
    locais: [],
    ...over,
  };
}

const local = (bairroSlug: string, extras: Partial<Medico["locais"][0]> = {}) => ({
  id: 1,
  logradouro: "Rua A",
  numero: "1",
  bairro: { id: 1, nome: bairroSlug, slug: bairroSlug },
  telefone: null,
  whatsapp: null,
  estacionamento: false,
  acessibilidade: [],
  horarios: [{ diaSemana: 2, abre: "08:00", fecha: "12:00" }],
  ...extras,
});

const josé = medico({
  nome: "José Andrade",
  slug: "jose-andrade",
  especialidades: [
    { nome: "Cardiologia", slug: "cardiologia", rqe: "1", principal: true },
  ],
  locais: [local("centro")],
});

const ana = medico({
  nome: "Ana Bezerra",
  slug: "ana-bezerra",
  telemedicina: true,
  associadoAmi: true,
  especialidades: [
    { nome: "Pediatria", slug: "pediatria", rqe: null, principal: true },
  ],
  locais: [
    local("bacuri", {
      acessibilidade: ["acesso_cadeirante"],
      horarios: [{ diaSemana: 6, abre: "08:00", fecha: "12:00" }],
    }),
  ],
});

const todos = [josé, ana];

describe("aplicarFiltros", () => {
  it("sem filtro, devolve todos", () => {
    expect(aplicarFiltros(todos, {})).toHaveLength(2);
  });

  it("filtra por especialidade", () => {
    const r = aplicarFiltros(todos, { especialidade: "pediatria" });
    expect(r.map((m) => m.nome)).toEqual(["Ana Bezerra"]);
  });

  it("filtra por bairro", () => {
    const r = aplicarFiltros(todos, { bairro: "centro" });
    expect(r.map((m) => m.nome)).toEqual(["José Andrade"]);
  });

  it("filtra por telemedicina", () => {
    expect(aplicarFiltros(todos, { telemedicina: true })).toHaveLength(1);
  });

  it("filtra por atendimento no sábado", () => {
    const r = aplicarFiltros(todos, { atendeSabado: true });
    expect(r.map((m) => m.nome)).toEqual(["Ana Bezerra"]);
  });

  it("filtra por acessibilidade", () => {
    const r = aplicarFiltros(todos, { acessibilidade: ["acesso_cadeirante"] });
    expect(r.map((m) => m.nome)).toEqual(["Ana Bezerra"]);
  });

  /* Os dois testes seguintes andam em par. Com um recurso só, uma
     implementação errada — que aceitasse cada recurso em qualquer local —
     passaria igual. O primeiro prova que ela recusa o caso partido; o
     segundo prova que ainda aceita quando deve, e não apenas devolve vazio. */
  it("não retorna médico com acessibilidades em locais diferentes", () => {
    const marcus = medico({
      nome: "Marcus Silva",
      slug: "marcus-silva",
      locais: [
        local("centro", { acessibilidade: ["elevador"] }),
        local("bacuri", { acessibilidade: ["acesso_cadeirante"] }),
      ],
    });
    const r = aplicarFiltros([marcus], {
      acessibilidade: ["elevador", "acesso_cadeirante"],
    });
    expect(r).toHaveLength(0);
  });

  it("retorna médico com múltiplas acessibilidades no mesmo local", () => {
    const lucia = medico({
      nome: "Lucia Costa",
      slug: "lucia-costa",
      locais: [
        local("centro", { acessibilidade: ["elevador", "acesso_cadeirante"] }),
      ],
    });
    const r = aplicarFiltros([lucia], {
      acessibilidade: ["elevador", "acesso_cadeirante"],
    });
    expect(r.map((m) => m.nome)).toEqual(["Lucia Costa"]);
  });

  it("filtra somente associados", () => {
    expect(aplicarFiltros(todos, { somenteAssociados: true })).toHaveLength(1);
  });

  it("acha por nome ignorando acento e caixa", () => {
    expect(aplicarFiltros(todos, { termo: "jose" })).toHaveLength(1);
    expect(aplicarFiltros(todos, { termo: "JOSÉ" })).toHaveLength(1);
  });

  it("acha por nome da especialidade", () => {
    const r = aplicarFiltros(todos, { termo: "cardio" });
    expect(r.map((m) => m.nome)).toEqual(["José Andrade"]);
  });

  it("combina filtros com E, não com OU", () => {
    const r = aplicarFiltros(todos, {
      especialidade: "pediatria",
      bairro: "centro",
    });
    expect(r).toHaveLength(0);
  });
});

describe("ordenar", () => {
  it("por nome, em ordem alfabética que respeita acento", () => {
    const r = ordenar(todos, "nome");
    expect(r.map((m) => m.nome)).toEqual(["Ana Bezerra", "José Andrade"]);
  });

  it("sem termo, relevância é ordem alfabética", () => {
    const r = ordenar(todos, "relevancia");
    expect(r.map((m) => m.nome)).toEqual(["Ana Bezerra", "José Andrade"]);
  });

  it("com termo, quem casa no nome vem antes de quem casa na especialidade", () => {
    const r = ordenar(todos, "relevancia", "pediatria");
    expect(r[0].nome).toBe("Ana Bezerra");
  });

  it("não altera a lista recebida", () => {
    const copia = [...todos];
    ordenar(todos, "nome");
    expect(todos).toEqual(copia);
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

```bash
npm test -- testes/filtros.test.ts
```

Esperado: FAIL, com erro de resolução do módulo `@/lib/dados/filtros`.

- [ ] **Step 3: Implementar**

Crie `lib/dados/filtros.ts`:

```ts
import { atendeNoDia } from "@/lib/dados/horarios";
import type { Filtros, Medico, Ordem } from "@/lib/dados/tipos";

/*
  Filtragem e ordenação em código, sobre a lista já trazida do banco.

  Com a ordem de 500 profissionais o conjunto inteiro cabe na memória do
  servidor e é percorrido em milissegundos. Se um dia a AMI virar plataforma
  regional com dezenas de milhares de perfis, estas funções são o ponto único
  a migrar para SQL — e nenhuma tela precisa mudar.
*/

/** "José" e "jose" precisam se encontrar: sem isto a busca falha em português. */
function normalizar(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function casaNoNome(m: Medico, termo: string): boolean {
  return normalizar(m.nome).includes(termo);
}

function casaNaEspecialidade(m: Medico, termo: string): boolean {
  return m.especialidades.some((e) => normalizar(e.nome).includes(termo));
}

export function aplicarFiltros(medicos: Medico[], filtros: Filtros): Medico[] {
  const termo = filtros.termo ? normalizar(filtros.termo) : "";

  return medicos.filter((m) => {
    if (termo && !casaNoNome(m, termo) && !casaNaEspecialidade(m, termo)) {
      return false;
    }

    if (
      filtros.especialidade &&
      !m.especialidades.some((e) => e.slug === filtros.especialidade)
    ) {
      return false;
    }

    if (
      filtros.bairro &&
      !m.locais.some((l) => l.bairro.slug === filtros.bairro)
    ) {
      return false;
    }

    if (filtros.telemedicina && !m.telemedicina) return false;
    if (filtros.somenteAssociados && !m.associadoAmi) return false;

    if (
      filtros.atendeSabado &&
      !m.locais.some((l) => atendeNoDia(l.horarios, 6))
    ) {
      return false;
    }

    /* Acessibilidade exige TODOS os recursos pedidos no mesmo local: de nada
       adianta o elevador ficar num endereço e a rampa em outro. */
    if (filtros.acessibilidade?.length) {
      const atende = m.locais.some((l) =>
        filtros.acessibilidade!.every((r) => l.acessibilidade.includes(r)),
      );
      if (!atende) return false;
    }

    return true;
  });
}

/** Alfabética em português: "Ângela" cai junto de "Angela", não no fim. */
const porNome = (a: Medico, b: Medico) =>
  a.nome.localeCompare(b.nome, "pt-BR");

/**
 * Ordenação.
 *
 * Relevância é definida de forma verificável, para que ninguém possa alegar
 * favorecimento: casar no nome vale mais que casar na especialidade, e o
 * desempate é alfabético. Sem termo digitado, relevância É a ordem alfabética.
 * Nenhum critério de qualidade, completude ou antiguidade entra na conta, e
 * não existe destaque pago nem selo comparativo neste site.
 */
export function ordenar(
  medicos: Medico[],
  ordem: Ordem,
  termo?: string,
): Medico[] {
  const lista = [...medicos];

  if (ordem === "nome" || !termo?.trim()) {
    return lista.sort(porNome);
  }

  const t = normalizar(termo);
  const peso = (m: Medico) =>
    casaNoNome(m, t) ? 0 : casaNaEspecialidade(m, t) ? 1 : 2;

  return lista.sort((a, b) => peso(a) - peso(b) || porNome(a, b));
}
```

- [ ] **Step 4: Rodar e ver passar**

```bash
npm test -- testes/filtros.test.ts
```

Esperado: `22 passed`.

- [ ] **Step 5: Commit**

```bash
git add lib/dados/filtros.ts testes/filtros.test.ts && git commit -m "Filtros e ordenação, com relevância definida de forma verificável"
```

---

### Task 9: Regra de indexação e parágrafo de faceta

Aqui mora o erro que mata diretório. Com 14 especialidades e 8 bairros o cruzamento gera 112 endereços; com o catálogo completo de especialidades passa de 400. A maioria teria zero, um ou dois profissionais, e publicar tudo isso indexável faz o Google classificar o site como conteúdo raso — derrubando junto as páginas boas.

O parágrafo de abertura existe pelo mesmo motivo: uma faceta sem texto próprio é uma lista pelada. Ele é **gerado dos dados reais**, nunca um molde com a palavra trocada.

**Files:**
- Create: `lib/dados/facetas.ts`, `testes/facetas.test.ts`

**Interfaces:**
- Consumes: Task 7
- Produces:
  - `const MINIMO_PARA_INDEXAR = 3`
  - `type ResumoFaceta = { especialidade: string; bairro?: string; total: number; bairrosComOferta: { nome: string; total: number }[]; totalLocais: number; atendemSabado: number; comTelemedicina: number; locaisComAcessoCadeirante: number; associados: number; comMaisDeUmEndereco: number }`
  - `facetaEhIndexavel(total: number): boolean`
  - `paragrafoDeAbertura(r: ResumoFaceta): string`
  - `resumirFaceta(medicos: Medico[], especialidade: string, bairro?: string): ResumoFaceta`

- [ ] **Step 1: Escrever os testes que falham**

Crie `testes/facetas.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  MINIMO_PARA_INDEXAR,
  facetaEhIndexavel,
  paragrafoDeAbertura,
  resumirFaceta,
  type ResumoFaceta,
} from "@/lib/dados/facetas";
import type { Medico } from "@/lib/dados/tipos";

const base: ResumoFaceta = {
  especialidade: "Cardiologia",
  total: 7,
  bairrosComOferta: [
    { nome: "Centro", total: 4 },
    { nome: "Bacuri", total: 2 },
    { nome: "Juçara", total: 1 },
  ],
  totalLocais: 9,
  atendemSabado: 2,
  comTelemedicina: 3,
  locaisComAcessoCadeirante: 5,
  associados: 5,
  comMaisDeUmEndereco: 2,
};

/* A faceta mais pobre que ainda entra no índice: exatamente no corte, sem
   sábado, sem telemedicina, sem acessibilidade, sem associado. É onde o
   texto encolhe, então é onde o piso de palavras precisa valer. */
const pobreIndexavel: ResumoFaceta = {
  especialidade: "Reumatologia",
  total: MINIMO_PARA_INDEXAR,
  bairrosComOferta: [{ nome: "Centro", total: MINIMO_PARA_INDEXAR }],
  totalLocais: MINIMO_PARA_INDEXAR,
  atendemSabado: 0,
  comTelemedicina: 0,
  locaisComAcessoCadeirante: 0,
  associados: 0,
  comMaisDeUmEndereco: 0,
};

describe("facetaEhIndexavel", () => {
  it("indexa a partir do mínimo", () => {
    expect(facetaEhIndexavel(MINIMO_PARA_INDEXAR)).toBe(true);
    expect(facetaEhIndexavel(10)).toBe(true);
  });

  it("não indexa abaixo do mínimo", () => {
    expect(facetaEhIndexavel(2)).toBe(false);
    expect(facetaEhIndexavel(0)).toBe(false);
  });

  it("o mínimo é 3", () => {
    expect(MINIMO_PARA_INDEXAR).toBe(3);
  });
});

describe("paragrafoDeAbertura", () => {
  it("traz os números reais, não redondos", () => {
    const p = paragrafoDeAbertura(base);
    expect(p).toContain("7 cardiologistas");
    expect(p).toContain("9 endereços");
    expect(p).toContain("Centro");
    expect(p).toContain("2 atendem aos sábados");
  });

  it("muda de conteúdo quando os dados mudam — não é molde com palavra trocada", () => {
    const outro = paragrafoDeAbertura({
      ...base,
      especialidade: "Pediatria",
      total: 3,
      atendemSabado: 0,
      comTelemedicina: 0,
      bairrosComOferta: [{ nome: "Santa Rita", total: 3 }],
    });
    expect(outro).not.toBe(paragrafoDeAbertura(base));
    expect(outro).toContain("Santa Rita");
    expect(outro).not.toContain("sábados");
  });

  it("nomeia o bairro quando a faceta é de cruzamento", () => {
    const p = paragrafoDeAbertura({ ...base, bairro: "Centro", total: 4 });
    expect(p).toContain("no Centro");
  });

  it("concorda o singular", () => {
    /* Dados coerentes: um profissional, um endereço — logo não pode
       atender em mais de um. A fixture anterior dizia totalLocais 1 e
       comMaisDeUmEndereco 1 ao mesmo tempo, o que não existe. */
    const p = paragrafoDeAbertura({
      ...base,
      total: 1,
      totalLocais: 1,
      bairrosComOferta: [{ nome: "Centro", total: 1 }],
      atendemSabado: 1,
      comTelemedicina: 1,
      locaisComAcessoCadeirante: 1,
      associados: 1,
      comMaisDeUmEndereco: 0,
    });
    expect(p).toContain("1 cardiologista ");
    expect(p).not.toContain("1 cardiologistas");
    expect(p).toContain("um único endereço de atendimento");
    /* No singular a frase é reescrita, não tem a contagem trocada. */
    expect(p).toContain("O atendimento inclui os sábados");
    expect(p).toContain("Há atendimento por telemedicina");
    expect(p).toContain("O atendimento acontece em um endereço só");
    /* Com um endereço só, "Entre os endereços" também é partitivo plural
       sobre um conjunto de um. O mesmo defeito, outro antecedente. */
    expect(p).toContain("O único endereço informa acesso");
    expect(p).not.toContain("Entre os endereços");
    expect(p).toContain("O único profissional listado é associado");
  });

  it("no singular, nenhuma frase usa partitivo plural", () => {
    /* Este é o caso que escapou de duas rodadas de correção: um
       profissional só que TEM sábado, telemedicina e mais de um endereço.
       Os exemplos lidos à mão tinham esses campos zerados, então os ramos
       defeituosos nunca apareciam no texto conferido. */
    const p = paragrafoDeAbertura({
      ...base,
      total: 1,
      totalLocais: 2,
      bairrosComOferta: [{ nome: "Centro", total: 1 }],
      atendemSabado: 1,
      comTelemedicina: 1,
      locaisComAcessoCadeirante: 1,
      associados: 1,
      comMaisDeUmEndereco: 1,
    });
    for (const partitivo of ["Desses,", "deles", "Entre eles", "Cada um"]) {
      expect(p).not.toContain(partitivo);
    }
    expect(p).toContain("O atendimento inclui os sábados");
    expect(p).toContain("Há atendimento por telemedicina");
    expect(p).toContain("O atendimento acontece em mais de um endereço");
  });

  it("um profissional com endereços em dois bairros lê corretamente", () => {
    const p = paragrafoDeAbertura({
      ...base,
      total: 1,
      totalLocais: 2,
      bairrosComOferta: [
        { nome: "Centro", total: 1 },
        { nome: "Bacuri", total: 1 },
      ],
      atendemSabado: 0,
      comTelemedicina: 0,
      locaisComAcessoCadeirante: 0,
      associados: 1,
      comMaisDeUmEndereco: 1,
    });
    expect(p).toContain("A oferta se distribui pelos bairros Centro e Bacuri");
    expect(p).toContain("1 cardiologista no Centro");
    expect(p).toContain("Nenhum dos endereços informa acesso");
    for (const partitivo of ["Desses,", "deles", "Entre eles", "Cada um"]) {
      expect(p).not.toContain(partitivo);
    }
  });

  it("com parte dos profissionais associados, usa o ramo do meio", () => {
    const p = paragrafoDeAbertura({ ...base, total: 7, associados: 1 });
    expect(p).toContain("Do total, 1 é associado");
    expect(p).not.toContain("Todos são associados");
  });

  it("no plural, mantém os partitivos", () => {
    const p = paragrafoDeAbertura(base);
    expect(p).toContain("Desses, 2 atendem aos sábados");
    expect(p).toContain("por 3 deles");
    expect(p).toContain("Entre eles, 2 atendem em mais de um endereço");
  });

  it("no singular sem associado, não diz 'nenhum deles'", () => {
    const p = paragrafoDeAbertura({
      ...base,
      total: 1,
      totalLocais: 1,
      bairrosComOferta: [{ nome: "Centro", total: 1 }],
      atendemSabado: 0,
      comTelemedicina: 0,
      locaisComAcessoCadeirante: 0,
      associados: 0,
      comMaisDeUmEndereco: 0,
    });
    expect(p).toContain("O profissional listado não consta como associado");
    expect(p).toContain("O atendimento acontece em um endereço só");
    expect(p).toContain("O único endereço não informa acesso");
    expect(p).not.toContain("Nenhum dos endereços");
    expect(p).not.toContain("Nenhum deles");
    expect(p).not.toContain("Cada um atende");
  });

  it("concorda o plural", () => {
    const p = paragrafoDeAbertura(base);
    expect(p).toContain("2 atendem aos sábados");
    expect(p).toContain("5 informam acesso");
    expect(p).toContain("2 atendem em mais de um endereço");
  });

  /* O piso de 120 palavras protege página indexável de ser rasa. Abaixo do
     corte a página sai noindex, e ali o parágrafo pode ter o tamanho que a
     verdade permitir — forçar palavras numa página que não vai ao índice
     seria encher linguiça sem ganho nenhum. */
  it("cumpre 120 a 200 palavras na faceta mais pobre que ainda indexa", () => {
    const palavras = paragrafoDeAbertura(pobreIndexavel).split(/\s+/).length;
    expect(palavras).toBeGreaterThanOrEqual(120);
    expect(palavras).toBeLessThanOrEqual(200);
  });

  it("cumpre 120 a 200 palavras também na faceta rica", () => {
    const palavras = paragrafoDeAbertura(base).split(/\s+/).length;
    expect(palavras).toBeGreaterThanOrEqual(120);
    expect(palavras).toBeLessThanOrEqual(200);
  });

  /* Começar frase com algarismo é uma das marcas mais visíveis de texto
     gerado, e em português corrido não se faz. */
  it("nenhuma frase começa com algarismo", () => {
    for (const resumo of [base, pobreIndexavel]) {
      const frases = paragrafoDeAbertura(resumo).split(/(?<=\.)\s+/);
      for (const f of frases) {
        expect(f.trimStart()).not.toMatch(/^\d/);
      }
    }
  });
});

describe("resumirFaceta", () => {
  const local = (
    id: number,
    bairro: string,
    acessibilidade: Medico["locais"][0]["acessibilidade"] = [],
  ) => ({
    id,
    logradouro: "Rua A",
    numero: "1",
    bairro: { id: 1, nome: bairro, slug: bairro.toLowerCase() },
    telefone: null,
    whatsapp: null,
    estacionamento: false,
    acessibilidade,
    horarios: [{ diaSemana: 2, abre: "08:00", fecha: "12:00" }],
  });

  const medico = (over: Partial<Medico> & { id: number }): Medico => ({
    slug: `m${over.id}`,
    nome: `Médico ${over.id}`,
    crm: String(over.id),
    crmUf: "MA",
    foto: null,
    bio: null,
    telemedicina: false,
    associadoAmi: false,
    especialidades: [],
    locais: [],
    ...over,
  });

  it("conta profissionais por bairro, não registros de local", () => {
    /* Um médico com dois consultórios no mesmo bairro é UM profissional
       atendendo ali. Contar linhas de local devolveria 2 e a frase diria
       "2 cardiologistas no Centro", o que é falso. */
    const r = resumirFaceta(
      [medico({ id: 1, locais: [local(1, "Centro"), local(2, "Centro")] })],
      "Cardiologia",
    );
    expect(r.bairrosComOferta).toEqual([{ nome: "Centro", total: 1 }]);
  });

  it("conta o mesmo profissional em cada bairro onde atende", () => {
    const r = resumirFaceta(
      [medico({ id: 1, locais: [local(1, "Centro"), local(2, "Bacuri")] })],
      "Cardiologia",
    );
    expect(r.bairrosComOferta).toEqual([
      { nome: "Bacuri", total: 1 },
      { nome: "Centro", total: 1 },
    ]);
  });

  it("conta endereços distintos, sem duplicar o consultório compartilhado", () => {
    const r = resumirFaceta(
      [
        medico({ id: 1, locais: [local(7, "Centro")] }),
        medico({ id: 2, locais: [local(7, "Centro")] }),
      ],
      "Cardiologia",
    );
    expect(r.total).toBe(2);
    expect(r.totalLocais).toBe(1);
  });

  it("conta locais com acesso para cadeirante, não profissionais", () => {
    const r = resumirFaceta(
      [
        medico({
          id: 1,
          locais: [
            local(1, "Centro", ["acesso_cadeirante"]),
            local(2, "Bacuri", ["acesso_cadeirante"]),
          ],
        }),
      ],
      "Cardiologia",
    );
    expect(r.locaisComAcessoCadeirante).toBe(2);
  });

  it("conta associados e quem atende em mais de um endereço", () => {
    const r = resumirFaceta(
      [
        medico({ id: 1, associadoAmi: true, locais: [local(1, "Centro"), local(2, "Bacuri")] }),
        medico({ id: 2, associadoAmi: false, locais: [local(3, "Centro")] }),
      ],
      "Cardiologia",
    );
    expect(r.associados).toBe(1);
    expect(r.comMaisDeUmEndereco).toBe(1);
  });

  it("ordena os bairros do mais ofertado para o menos", () => {
    const r = resumirFaceta(
      [
        medico({ id: 1, locais: [local(1, "Centro")] }),
        medico({ id: 2, locais: [local(2, "Centro")] }),
        medico({ id: 3, locais: [local(3, "Bacuri")] }),
      ],
      "Cardiologia",
    );
    expect(r.bairrosComOferta.map((b) => b.nome)).toEqual(["Centro", "Bacuri"]);
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

```bash
npm test -- testes/facetas.test.ts
```

Esperado: FAIL, com erro de resolução do módulo `@/lib/dados/facetas`.

- [ ] **Step 3: Implementar**

Crie `lib/dados/facetas.ts`:

```ts
import type { Medico } from "@/lib/dados/tipos";

/**
 * Corte de indexação.
 *
 * Uma página com um ou dois profissionais existe, funciona e é navegável,
 * mas sai como `noindex, follow` com canonical para a especialidade. Conforme
 * a AMI cadastra mais gente, ela entra no índice sozinha — a contagem vem do
 * banco, não de uma lista escrita à mão.
 */
export const MINIMO_PARA_INDEXAR = 3;

export function facetaEhIndexavel(total: number): boolean {
  return total >= MINIMO_PARA_INDEXAR;
}

export type ResumoFaceta = {
  especialidade: string;
  /** Nome do bairro, quando a faceta é de cruzamento. */
  bairro?: string;
  /** Profissionais distintos. */
  total: number;
  /**
   * Profissionais distintos por bairro — não registros de local. Um médico
   * com dois consultórios no mesmo bairro conta uma vez; um com consultórios
   * em bairros diferentes conta em cada um, que é o que o leitor espera ao
   * perguntar "quantos atendem no Centro".
   */
  bairrosComOferta: { nome: string; total: number }[];
  /** Endereços distintos, que é sempre >= total quando alguém tem dois. */
  totalLocais: number;
  atendemSabado: number;
  comTelemedicina: number;
  /** Conta LOCAIS, não profissionais — o nome diz isso para não derivar. */
  locaisComAcessoCadeirante: number;
  /** Quantos são associados da AMI. */
  associados: number;
  /** Quantos atendem em mais de um endereço. */
  comMaisDeUmEndereco: number;
};

/* "Cardiologia" vira "cardiologista". Cobre os casos do catálogo; o que não
   casar cai no rótulo neutro, que continua correto em português. */
function comoProfissional(especialidade: string): [string, string] {
  const mapa: Record<string, [string, string]> = {
    Cardiologia: ["cardiologista", "cardiologistas"],
    Dermatologia: ["dermatologista", "dermatologistas"],
    Pediatria: ["pediatra", "pediatras"],
    Oftalmologia: ["oftalmologista", "oftalmologistas"],
    Psiquiatria: ["psiquiatra", "psiquiatras"],
    Endocrinologia: ["endocrinologista", "endocrinologistas"],
    Gastroenterologia: ["gastroenterologista", "gastroenterologistas"],
    Neurologia: ["neurologista", "neurologistas"],
    Otorrinolaringologia: ["otorrinolaringologista", "otorrinolaringologistas"],
    Urologia: ["urologista", "urologistas"],
    Reumatologia: ["reumatologista", "reumatologistas"],
    "Clínica Médica": ["clínico geral", "clínicos gerais"],
    "Ginecologia e Obstetrícia": ["ginecologista", "ginecologistas"],
    "Ortopedia e Traumatologia": ["ortopedista", "ortopedistas"],
  };
  return (
    mapa[especialidade] ?? [
      `médico de ${especialidade}`,
      `médicos de ${especialidade}`,
    ]
  );
}

function lista(nomes: string[]): string {
  if (nomes.length === 1) return nomes[0];
  return nomes.slice(0, -1).join(", ") + " e " + nomes[nomes.length - 1];
}

/**
 * Parágrafo de abertura da página de faceta.
 *
 * Gerado a partir dos dados reais: quantos profissionais, em quantos
 * endereços, onde se concentram, quantos atendem aos sábados, quantos fazem
 * telemedicina, quantos locais têm acesso para cadeirante. Nunca um
 * texto-modelo com a palavra trocada — é exatamente isso que o Google
 * classifica como conteúdo raso.
 *
 * Nenhuma frase começa com algarismo: em texto corrido em português isso não
 * se faz, e é um dos sinais mais visíveis de texto gerado.
 */
export function paragrafoDeAbertura(r: ResumoFaceta): string {
  const [sing, plur] = comoProfissional(r.especialidade);
  const nomeProf = r.total === 1 ? sing : plur;
  const onde = r.bairro ? `no ${r.bairro}` : "em Imperatriz";

  /* Com um profissional só, todo partitivo plural — "desses", "deles",
     "entre eles" — passa a se referir a um grupo de uma pessoa, o que soa
     errado. E "ele" resolveria o número acertando o gênero só na metade dos
     casos. Por isso o singular reescreve a frase inteira em vez de trocar a
     palavra. */
  const umSo = r.total === 1;
  const umEnderecoSo = r.totalLocais === 1;

  const frases: string[] = [];

  frases.push(
    `A Associação Médica de Imperatriz reúne ${r.total} ${nomeProf} ` +
      `${onde}, no Maranhão, ` +
      (r.totalLocais === 1
        ? `com um único endereço de atendimento.`
        : `somando ${r.totalLocais} endereços de atendimento.`),
  );

  if (!r.bairro && r.bairrosComOferta.length) {
    const principais = r.bairrosComOferta.slice(0, 3);
    if (principais.length === 1) {
      frases.push(
        `Todo o atendimento se concentra no bairro ${principais[0].nome}.`,
      );
    } else {
      frases.push(
        `A oferta se distribui pelos bairros ` +
          `${lista(principais.map((b) => b.nome))}, sendo ` +
          `${principais[0].total} ${principais[0].total === 1 ? sing : plur} ` +
          `no ${principais[0].nome}.`,
      );
    }
  }

  if (r.atendemSabado > 0) {
    frases.push(
      umSo
        ? `O atendimento inclui os sábados, o que costuma resolver a consulta ` +
            `de quem trabalha em horário comercial durante a semana.`
        : `Desses, ${r.atendemSabado} ` +
            `${r.atendemSabado === 1 ? "atende" : "atendem"} aos sábados, o ` +
            `que costuma resolver a consulta de quem trabalha em horário ` +
            `comercial durante a semana.`,
    );
  } else {
    frases.push(
      `Por enquanto, os atendimentos acontecem apenas em dias úteis, de ` +
        `segunda a sexta-feira, o que vale considerar ao pedir dispensa no ` +
        `trabalho para a consulta.`,
    );
  }

  if (r.comTelemedicina > 0) {
    frases.push(
      umSo
        ? `Há atendimento por telemedicina, alternativa para quem vem de ` +
            `outras cidades da região sul do Maranhão e do sudeste do Pará.`
        : `A telemedicina é oferecida por ${r.comTelemedicina} deles, ` +
            `alternativa para quem vem de outras cidades da região sul do ` +
            `Maranhão e do sudeste do Pará.`,
    );
  } else {
    frases.push(
      `Não há registro de atendimento por telemedicina, então a consulta ` +
        `é presencial.`,
    );
  }

  if (r.locaisComAcessoCadeirante === 0) {
    frases.push(
      umEnderecoSo
        ? `O único endereço não informa acesso para cadeirante no cadastro ` +
            `da associação, o que vale confirmar por telefone antes de ir.`
        : `Nenhum dos endereços informa acesso para cadeirante no cadastro ` +
            `da associação, o que vale confirmar por telefone antes de ir.`,
    );
  } else {
    frases.push(
      umEnderecoSo
        ? `O único endereço informa acesso para cadeirante no cadastro da ` +
            `associação.`
        : `Entre os endereços, ${r.locaisComAcessoCadeirante} ` +
            `${r.locaisComAcessoCadeirante === 1 ? "informa" : "informam"} ` +
            `acesso para cadeirante no cadastro da associação.`,
    );
  }

  /* O singular não usa pronome: "ele" erraria o gênero em metade dos
     casos, e "todos" para uma pessoa só soa errado em português. */
  if (r.associados === 0) {
    frases.push(
      r.total === 1
        ? `O profissional listado não consta como associado da AMI no ` +
            `cadastro atual.`
        : `Nenhum deles consta como associado da AMI no cadastro atual.`,
    );
  } else if (r.associados === r.total) {
    frases.push(
      r.total === 1
        ? `O único profissional listado é associado da Associação Médica de ` +
            `Imperatriz, com cadastro conferido e mantido pela entidade.`
        : `Todos são associados da Associação Médica de Imperatriz, o que ` +
            `significa cadastro conferido e mantido pela entidade.`,
    );
  } else {
    frases.push(
      `Do total, ${r.associados} ` +
        `${r.associados === 1 ? "é associado" : "são associados"} da ` +
        `Associação Médica de Imperatriz, com cadastro conferido pela entidade.`,
    );
  }

  if (r.comMaisDeUmEndereco > 0) {
    frases.push(
      umSo
        ? `O atendimento acontece em mais de um endereço, o que costuma ` +
            `ampliar as opções de dia e horário.`
        : `Entre eles, ${r.comMaisDeUmEndereco} ` +
            `${r.comMaisDeUmEndereco === 1 ? "atende" : "atendem"} em mais de ` +
            `um endereço, o que costuma ampliar as opções de dia e horário.`,
    );
  } else {
    frases.push(
      r.total === 1
        ? `O atendimento acontece em um endereço só, sem alternativa de local.`
        : `Cada um atende em um endereço só, sem alternativa de local.`,
    );
  }

  /* Fecho comum a toda página de faceta. É curto de propósito: informação
     que não varia com os dados é a que faz duas facetas parecerem a mesma
     página, e é o que o Google trata como conteúdo raso. */
  frases.push(
    `Cada perfil abaixo traz endereço, telefone, horários por dia da semana e ` +
      `o número de registro no Conselho Regional de Medicina, como exige a ` +
      `Resolução CFM 2.336/2023.`,
  );

  return frases.join(" ");
}

/** Monta o resumo a partir da lista já filtrada. */
export function resumirFaceta(
  medicos: Medico[],
  especialidade: string,
  bairro?: string,
): ResumoFaceta {
  /* Conjuntos, não contadores: o mesmo profissional aparece uma vez por
     bairro mesmo com dois consultórios lá, e o mesmo endereço compartilhado
     por dois médicos conta como um endereço. */
  const profissionaisPorBairro = new Map<string, { nome: string; ids: Set<number> }>();
  const locais = new Set<number>();
  const locaisComAcesso = new Set<number>();

  for (const m of medicos) {
    for (const l of m.locais) {
      /* Chaveado pelo slug: dois bairros de nome igual se fundiriam. */
      const chave = l.bairro.slug;
      if (!profissionaisPorBairro.has(chave)) {
        profissionaisPorBairro.set(chave, { nome: l.bairro.nome, ids: new Set() });
      }
      profissionaisPorBairro.get(chave)!.ids.add(m.id);
      locais.add(l.id);
      if (l.acessibilidade.includes("acesso_cadeirante")) {
        locaisComAcesso.add(l.id);
      }
    }
  }

  return {
    especialidade,
    bairro,
    total: medicos.length,
    bairrosComOferta: [...profissionaisPorBairro.values()]
      .map(({ nome, ids }) => ({ nome, total: ids.size }))
      .sort(
        (a, b) => b.total - a.total || a.nome.localeCompare(b.nome, "pt-BR"),
      ),
    totalLocais: locais.size,
    atendemSabado: medicos.filter((m) =>
      m.locais.some((l) => l.horarios.some((h) => h.diaSemana === 6)),
    ).length,
    comTelemedicina: medicos.filter((m) => m.telemedicina).length,
    locaisComAcessoCadeirante: locaisComAcesso.size,
    associados: medicos.filter((m) => m.associadoAmi).length,
    comMaisDeUmEndereco: medicos.filter((m) => m.locais.length > 1).length,
  };
}
```

- [ ] **Step 4: Rodar e ver passar**

```bash
npm test -- testes/facetas.test.ts
```

Esperado: `16 passed`.

- [ ] **Step 5: Commit**

```bash
git add lib/dados/facetas.ts testes/facetas.test.ts && git commit -m "Corte de indexação de faceta e parágrafo gerado dos dados"
```

---

### Task 10: Moldes de título e descrição

Title e description únicos por página, montados por molde com número contado do banco. O limite de tamanho não é capricho: acima de cerca de 60 caracteres o Google corta o título, e acima de 155 corta a descrição — e o que sobra vira frase pela metade no resultado de busca.

**Files:**
- Create: `lib/seo/metadados.ts`, `testes/metadados.test.ts`

**Interfaces:**
- Consumes: Task 7
- Produces:
  - `const LIMITE_TITULO = 60`, `const LIMITE_DESCRICAO = 155`
  - `tituloEspecialidade(nome: string, total: number): string`
  - `tituloFaceta(especialidade: string, bairro: string, total: number): string`
  - `tituloMedico(nome: string, especialidade: string | null): string`
  - `descricaoEspecialidade(nome: string, total: number, bairros: string[]): string`
  - `descricaoMedico(nome: string, especialidade: string | null, bairros: string[]): string`

- [ ] **Step 1: Escrever os testes que falham**

Crie `testes/metadados.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  LIMITE_DESCRICAO,
  LIMITE_TITULO,
  descricaoEspecialidade,
  descricaoMedico,
  tituloEspecialidade,
  tituloFaceta,
  tituloMedico,
} from "@/lib/seo/metadados";

describe("tituloEspecialidade", () => {
  it("traz a especialidade, a cidade e a contagem real", () => {
    expect(tituloEspecialidade("Cardiologia", 7)).toBe(
      "Cardiologia em Imperatriz - MA | 7 médicos | AMI",
    );
  });

  it("concorda o singular", () => {
    expect(tituloEspecialidade("Cardiologia", 1)).toContain("1 médico |");
  });

  it("abre mão do sufixo da marca antes de estourar o limite", () => {
    const t = tituloEspecialidade("Otorrinolaringologia pediátrica", 12);
    expect(t.length).toBeLessThanOrEqual(LIMITE_TITULO);
    expect(t).toContain("Otorrinolaringologia pediátrica");
  });
});

describe("tituloFaceta", () => {
  it("nomeia o bairro", () => {
    expect(tituloFaceta("Cardiologia", "Centro", 4)).toBe(
      "Cardiologia no Centro, Imperatriz - MA | 4 médicos | AMI",
    );
  });

  it("respeita o limite", () => {
    const t = tituloFaceta("Ginecologia e Obstetrícia", "Parque do Buriti", 3);
    expect(t.length).toBeLessThanOrEqual(LIMITE_TITULO);
  });
});

describe("tituloMedico", () => {
  it("junta nome e especialidade", () => {
    expect(tituloMedico("Mayara Viana", "Cardiologia")).toBe(
      "Mayara Viana - Cardiologia em Imperatriz - MA | AMI",
    );
  });

  it("sem especialidade registrada, omite o papel em vez de chutar o gênero", () => {
    const t = tituloMedico("Mayara Viana", null);
    expect(t).toBe("Mayara Viana em Imperatriz - MA | AMI");
    expect(t).not.toContain("Médica");
    expect(t).not.toContain("Médico");
  });

  it("encurta nome longo sem amputar palavra", () => {
    const t = tituloMedico(
      "Maria Aparecida de Vasconcelos Nascimento",
      "Ginecologia e Obstetrícia",
    );
    expect(t.length).toBeLessThanOrEqual(LIMITE_TITULO);
    expect(t).not.toMatch(/[\s,;:–-]$/);
    /* Toda palavra do resultado tem de ser palavra inteira da entrada. */
    const fonte =
      "Maria Aparecida de Vasconcelos Nascimento - Ginecologia e Obstetrícia em Imperatriz - MA | AMI";
    for (const palavra of t.split(/[\s|]+/).filter(Boolean)) {
      expect(fonte.split(/[\s|]+/)).toContain(palavra);
    }
  });
});

describe("truncamento", () => {
  /* Os piores casos reais do catálogo: as especialidades e os bairros mais
     longos de Imperatriz. É onde o molde estoura. */
  const casos: [string, string][] = [
    ["Ginecologia e Obstetrícia", "Parque do Buriti"],
    ["Ortopedia e Traumatologia", "Nova Imperatriz"],
    ["Otorrinolaringologia", "Maranhão Novo"],
  ];

  it("nunca termina em palavra cortada, hífen solto ou pontuação", () => {
    for (const [esp, bairro] of casos) {
      for (const t of [
        tituloFaceta(esp, bairro, 3),
        tituloEspecialidade(esp, 12),
      ]) {
        expect(t.length).toBeLessThanOrEqual(LIMITE_TITULO);
        expect(t).not.toMatch(/[\s,;:–-]$/);
        /* "Imperatriz - M" seria pior que um título curto. */
        expect(t).not.toMatch(/\bM$/);
      }
    }
  });

  it("prefere encurtar a cabeça a amputar a palavra", () => {
    const t = tituloFaceta("Ginecologia e Obstetrícia", "Parque do Buriti", 3);
    expect(t).toContain("Ginecologia e Obstetrícia");
    expect(t).toContain("Parque do Buriti");
  });
});

describe("descricaoEspecialidade", () => {
  it("cita a contagem e os bairros", () => {
    const d = descricaoEspecialidade("Cardiologia", 7, ["Centro", "Bacuri"]);
    expect(d).toContain("7 cardiologistas");
    expect(d).toContain("Centro");
    expect(d.length).toBeLessThanOrEqual(LIMITE_DESCRICAO);
  });

  it("não repete a mesma descrição para dados diferentes", () => {
    const a = descricaoEspecialidade("Cardiologia", 7, ["Centro"]);
    const b = descricaoEspecialidade("Pediatria", 3, ["Bacuri"]);
    expect(a).not.toBe(b);
  });
});

describe("descricaoMedico", () => {
  it("cabe no limite mesmo com nome e bairros longos", () => {
    const d = descricaoMedico(
      "Maria Aparecida de Vasconcelos Nascimento",
      "Ginecologia e Obstetrícia",
      ["Parque do Buriti", "Nova Imperatriz"],
    );
    expect(d.length).toBeLessThanOrEqual(LIMITE_DESCRICAO);
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

```bash
npm test -- testes/metadados.test.ts
```

Esperado: FAIL, com erro de resolução do módulo `@/lib/seo/metadados`.

- [ ] **Step 3: Implementar**

Crie `lib/seo/metadados.ts`:

```ts
/*
  Moldes de title e description. O número vem sempre da contagem do banco,
  nunca escrito à mão — se o dataset tem 7 cardiologistas, a frase diz 7.
*/

export const LIMITE_TITULO = 60;
export const LIMITE_DESCRICAO = 155;

const CIDADE = "Imperatriz - MA";
const MARCA = "AMI";

const plural = (n: number, s: string, p: string) => (n === 1 ? s : p);

/**
 * Monta o título e o encurta quando não cabe, nesta ordem:
 * primeiro descarta as partes da direita, que são as menos importantes;
 * depois troca a cabeça por uma versão mais curta.
 *
 * `cabecas` vem da mais longa para a mais curta. Cortar no meio de uma
 * palavra é o último recurso e mesmo aí o corte respeita o espaço: um título
 * terminando em "Imperatriz - M" no resultado de busca é pior que um curto.
 */
function montar(cabecas: string[], resto: string[], limite: number): string {
  for (const cabeca of cabecas) {
    for (let corte = resto.length; corte >= 0; corte--) {
      const texto = [cabeca, ...resto.slice(0, corte)].join(" | ");
      if (texto.length <= limite) return texto;
    }
  }
  const fatia = cabecas[cabecas.length - 1].slice(0, limite);
  const espaco = fatia.lastIndexOf(" ");
  return (espaco > 0 ? fatia.slice(0, espaco) : fatia).replace(
    /[\s,;:–-]+$/,
    "",
  );
}

export function tituloEspecialidade(nome: string, total: number): string {
  return montar(
    [`${nome} em ${CIDADE}`, `${nome} em Imperatriz`, nome],
    [`${total} ${plural(total, "médico", "médicos")}`, MARCA],
    LIMITE_TITULO,
  );
}

export function tituloFaceta(
  especialidade: string,
  bairro: string,
  total: number,
): string {
  return montar(
    [
      `${especialidade} no ${bairro}, ${CIDADE}`,
      `${especialidade} no ${bairro}`,
    ],
    [`${total} ${plural(total, "médico", "médicos")}`, MARCA],
    LIMITE_TITULO,
  );
}

/**
 * Sem especialidade registrada, o título omite o papel em vez de escrever
 * "Médico" ou "Médica": qualquer um dos dois erra o gênero em metade dos
 * casos, e o nome com a cidade já identifica a página.
 */
export function tituloMedico(
  nome: string,
  especialidade: string | null,
): string {
  const cabecas = especialidade
    ? [
        `${nome} - ${especialidade} em ${CIDADE}`,
        `${nome} - ${especialidade}`,
        nome,
      ]
    : [`${nome} em ${CIDADE}`, nome];
  return montar(cabecas, [MARCA], LIMITE_TITULO);
}

/* Mesmo dicionário de nomes de profissional usado nas facetas, em versão
   reduzida: a descrição só precisa do plural. */
function comoProfissional(especialidade: string, total: number): string {
  const mapa: Record<string, [string, string]> = {
    Cardiologia: ["cardiologista", "cardiologistas"],
    Dermatologia: ["dermatologista", "dermatologistas"],
    Pediatria: ["pediatra", "pediatras"],
    Oftalmologia: ["oftalmologista", "oftalmologistas"],
    Psiquiatria: ["psiquiatra", "psiquiatras"],
    Endocrinologia: ["endocrinologista", "endocrinologistas"],
    Gastroenterologia: ["gastroenterologista", "gastroenterologistas"],
    Neurologia: ["neurologista", "neurologistas"],
    Otorrinolaringologia: ["otorrinolaringologista", "otorrinolaringologistas"],
    Urologia: ["urologista", "urologistas"],
    Reumatologia: ["reumatologista", "reumatologistas"],
    "Clínica Médica": ["clínico geral", "clínicos gerais"],
    "Ginecologia e Obstetrícia": ["ginecologista", "ginecologistas"],
    "Ortopedia e Traumatologia": ["ortopedista", "ortopedistas"],
  };
  const par = mapa[especialidade];
  if (!par) return `${plural(total, "médico", "médicos")} de ${especialidade}`;
  return plural(total, par[0], par[1]);
}

function cortarNaPalavra(texto: string, limite: number): string {
  if (texto.length <= limite) return texto;
  const fatia = texto.slice(0, limite - 1);
  return fatia.slice(0, fatia.lastIndexOf(" ")).replace(/[.,;]$/, "") + ".";
}

export function descricaoEspecialidade(
  nome: string,
  total: number,
  bairros: string[],
): string {
  const onde = bairros.slice(0, 2).join(" e ");
  const texto =
    `${total} ${comoProfissional(nome, total)} em Imperatriz` +
    (onde ? `, com atendimento em ${onde}` : "") +
    `. Endereço, telefone e horários. Associação Médica de Imperatriz.`;
  return cortarNaPalavra(texto, LIMITE_DESCRICAO);
}

export function descricaoMedico(
  nome: string,
  especialidade: string | null,
  bairros: string[],
): string {
  const papel = especialidade ? `, ${especialidade}` : "";
  const onde = bairros.slice(0, 2).join(" e ");
  const texto =
    `${nome}${papel}, em Imperatriz - MA` +
    (onde ? `. Atende em ${onde}` : "") +
    `. Veja CRM, endereço, telefone e horários de atendimento.`;
  return cortarNaPalavra(texto, LIMITE_DESCRICAO);
}
```

> O sufixo "— página N" e o canonical próprio da paginação entram no Plano 2,
> junto com os links `<a href>` reais. Não há paginação enquanto a lista couber
> numa tela — e com 24 registros ela cabe.

- [ ] **Step 4: Rodar e ver passar**

```bash
npm test -- testes/metadados.test.ts
```

Esperado: `13 passed`.

- [ ] **Step 5: Commit**

```bash
git add lib/seo/metadados.ts testes/metadados.test.ts && git commit -m "Moldes de title e description com contagem real"
```

---

### Task 11: Dados estruturados

Perfis fora do sitemap e sem dados estruturados foi uma das falhas centrais do portal anterior. Estes construtores são puros e testados porque um JSON-LD malformado falha em silêncio: a página continua bonita e o Google simplesmente ignora.

**Files:**
- Create: `lib/seo/jsonld.ts`, `components/seo/JsonLd.tsx`, `testes/jsonld.test.ts`

**Interfaces:**
- Consumes: Task 7
- Produces:
  - `physician(m: Medico, siteUrl: string): object`
  - `organizationAmi(siteUrl: string): object`
  - `itemList(medicos: Medico[], siteUrl: string): object`
  - `breadcrumbList(itens: { nome: string; caminho: string }[], siteUrl: string): object`
  - `faqPage(perguntas: { pergunta: string; resposta: string }[]): object`
  - componente `<JsonLd dados={...} />`

- [ ] **Step 1: Escrever os testes que falham**

Crie `testes/jsonld.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  breadcrumbList,
  faqPage,
  itemList,
  organizationAmi,
  physician,
} from "@/lib/seo/jsonld";
import type { Medico } from "@/lib/dados/tipos";

const SITE = "https://ami.org.br";

const medico: Medico = {
  id: 1,
  slug: "mayara-viana",
  nome: "Mayara Viana",
  crm: "12345",
  crmUf: "MA",
  foto: null,
  bio: "Bio",
  telemedicina: true,
  associadoAmi: true,
  especialidades: [
    { nome: "Cardiologia", slug: "cardiologia", rqe: "678", principal: true },
  ],
  locais: [
    {
      id: 1,
      logradouro: "Rua Projetada 100",
      numero: "100",
      bairro: { id: 1, nome: "Centro", slug: "centro" },
      telefone: "9933334444",
      whatsapp: "9933334444",
      estacionamento: true,
      acessibilidade: ["acesso_cadeirante"],
      horarios: [{ diaSemana: 2, abre: "08:00", fecha: "12:00" }],
    },
  ],
};

describe("physician", () => {
  const p = physician(medico, SITE) as Record<string, unknown>;

  it("declara o tipo e a URL canônica do perfil", () => {
    expect(p["@type"]).toBe("Physician");
    expect(p.url).toBe(`${SITE}/medico/mayara-viana`);
  });

  it("leva o CRM como identifier", () => {
    expect(JSON.stringify(p.identifier)).toContain("12345");
  });

  it("leva o endereço completo, não só a cidade", () => {
    const e = p.address as Record<string, string>;
    expect(e["@type"]).toBe("PostalAddress");
    expect(e.addressLocality).toBe("Imperatriz");
    expect(e.addressRegion).toBe("MA");
    expect(e.streetAddress).toContain("Rua Projetada 100");
  });

  it("declara horário de funcionamento", () => {
    expect(Array.isArray(p.openingHoursSpecification)).toBe(true);
  });

  it("aponta a AMI como organização de origem", () => {
    expect(JSON.stringify(p.memberOf)).toContain("Associação Médica");
  });

  it("nunca traz nota agregada — não existem avaliações neste site", () => {
    expect(p.aggregateRating).toBeUndefined();
  });

  it("declara apenas o horário do endereço que declarou", () => {
    /* Dois consultórios: o segundo abre num dia em que o primeiro não abre.
       Se o horário do segundo aparecer sob o endereço do primeiro, o Google
       lê expediente que não acontece ali. */
    const comDois = physician(
      {
        ...medico,
        locais: [
          medico.locais[0],
          {
            ...medico.locais[0],
            id: 2,
            logradouro: "Rua Segunda",
            horarios: [{ diaSemana: 5, abre: "14:00", fecha: "18:00" }],
          },
        ],
      },
      SITE,
    ) as Record<string, unknown>;

    const dias = (comDois.openingHoursSpecification as { dayOfWeek: string }[])
      .map((h) => h.dayOfWeek);
    expect(dias).toEqual(["Tuesday"]);
    expect(dias).not.toContain("Friday");
    expect(
      (comDois.address as Record<string, string>).streetAddress,
    ).toContain("Rua Projetada 100");
  });

  it("descarta dia da semana fora da faixa em vez de emitir indefinido", () => {
    const torto = physician(
      {
        ...medico,
        locais: [
          {
            ...medico.locais[0],
            horarios: [
              { diaSemana: 2, abre: "08:00", fecha: "12:00" },
              { diaSemana: 9, abre: "08:00", fecha: "12:00" },
            ],
          },
        ],
      },
      SITE,
    ) as Record<string, unknown>;

    const horas = torto.openingHoursSpecification as { dayOfWeek: string }[];
    expect(horas).toHaveLength(1);
    for (const h of horas) expect(h.dayOfWeek).toBeDefined();
  });
});

describe("organizationAmi", () => {
  it("é uma organização com endereço", () => {
    const o = organizationAmi(SITE) as Record<string, unknown>;
    expect(o["@type"]).toBe("Organization");
    expect(o.url).toBe(SITE);
    expect(o.address).toBeDefined();
  });
});

describe("itemList", () => {
  it("preserva a ordem dos resultados", () => {
    const l = itemList([medico, { ...medico, slug: "outro" }], SITE) as {
      itemListElement: { position: number; url: string }[];
    };
    expect(l.itemListElement[0].position).toBe(1);
    expect(l.itemListElement[1].url).toBe(`${SITE}/medico/outro`);
  });
});

describe("breadcrumbList", () => {
  it("numera as posições a partir de 1", () => {
    const b = breadcrumbList(
      [
        { nome: "Início", caminho: "/" },
        { nome: "Médicos", caminho: "/medicos" },
      ],
      SITE,
    ) as { itemListElement: { position: number; item: string }[] };
    expect(b.itemListElement[0].position).toBe(1);
    expect(b.itemListElement[1].item).toBe(`${SITE}/medicos`);
  });
});

describe("faqPage", () => {
  it("monta pergunta e resposta", () => {
    const f = faqPage([{ pergunta: "P?", resposta: "R." }]) as {
      mainEntity: { name: string; acceptedAnswer: { text: string } }[];
    };
    expect(f.mainEntity[0].name).toBe("P?");
    expect(f.mainEntity[0].acceptedAnswer.text).toBe("R.");
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

```bash
npm test -- testes/jsonld.test.ts
```

Esperado: FAIL, com erro de resolução do módulo `@/lib/seo/jsonld`.

- [ ] **Step 3: Implementar os construtores**

Crie `lib/seo/jsonld.ts`:

```ts
import type { Medico } from "@/lib/dados/tipos";

/*
  Construtores de JSON-LD. Puros, e testados porque erro aqui falha calado:
  a página continua bonita e o Google apenas ignora o bloco.

  Não existe AggregateRating em lugar nenhum: o site não tem avaliações, o que
  também afasta o Art. 11, XIII da Resolução CFM 2.336/2023, que veda ranking
  e premiação.
*/

const DIAS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

function enderecoDaAmi() {
  return {
    "@type": "PostalAddress",
    streetAddress: "[PROVISÓRIO] endereço da sede",
    addressLocality: "Imperatriz",
    addressRegion: "MA",
    addressCountry: "BR",
  };
}

export function organizationAmi(siteUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Associação Médica de Imperatriz",
    alternateName: "AMI",
    url: siteUrl,
    logo: `${siteUrl}/marca/ami-marca-2400.png`,
    address: enderecoDaAmi(),
    areaServed: "Imperatriz, MA, Brasil",
  };
}

export function physician(m: Medico, siteUrl: string) {
  const principal = m.especialidades.find((e) => e.principal) ?? m.especialidades[0];
  const local = m.locais[0];

  /*
    Horário sai APENAS do local cujo endereço está sendo declarado.
    Agregar os horários de todos os consultórios sob um endereço só faria o
    Google ler expediente que não acontece naquele lugar — dado estruturado
    errado é pior que dado estruturado ausente.

    Dia fora de 0..6 é descartado em vez de virar dayOfWeek indefinido, que
    JSON.stringify apagaria sem avisar. A coluna tem CHECK no banco, então
    isto é cinto e suspensório.
  */
  const horarios = (local?.horarios ?? [])
    .filter((h) => DIAS[h.diaSemana] !== undefined)
    .map((h) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: DIAS[h.diaSemana],
      opens: h.abre,
      closes: h.fecha,
    }));

  return {
    "@context": "https://schema.org",
    "@type": "Physician",
    name: m.nome,
    url: `${siteUrl}/medico/${m.slug}`,
    ...(m.foto ? { image: m.foto } : {}),
    ...(principal ? { medicalSpecialty: principal.nome } : {}),
    identifier: [
      {
        "@type": "PropertyValue",
        propertyID: "CRM",
        value: `${m.crmUf}-${m.crm}`,
      },
      ...(principal?.rqe
        ? [{ "@type": "PropertyValue", propertyID: "RQE", value: principal.rqe }]
        : []),
    ],
    ...(local
      ? {
          address: {
            "@type": "PostalAddress",
            streetAddress: [local.logradouro, local.numero]
              .filter(Boolean)
              .join(", "),
            addressLocality: "Imperatriz",
            addressRegion: "MA",
            addressCountry: "BR",
          },
          ...(local.telefone ? { telephone: local.telefone } : {}),
        }
      : {}),
    ...(horarios.length ? { openingHoursSpecification: horarios } : {}),
    ...(m.telemedicina
      ? { availableService: { "@type": "MedicalTherapy", name: "Telemedicina" } }
      : {}),
    memberOf: {
      "@type": "Organization",
      name: "Associação Médica de Imperatriz",
      url: siteUrl,
    },
  };
}

/** Entra em toda página de listagem, com a ordem exata dos resultados. */
export function itemList(medicos: Medico[], siteUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    numberOfItems: medicos.length,
    itemListElement: medicos.map((m, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: m.nome,
      url: `${siteUrl}/medico/${m.slug}`,
    })),
  };
}

/** Sempre acompanhado de um breadcrumb visível na tela, nunca sozinho. */
export function breadcrumbList(
  itens: { nome: string; caminho: string }[],
  siteUrl: string,
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: itens.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.nome,
      item: `${siteUrl}${it.caminho === "/" ? "" : it.caminho}`,
    })),
  };
}

export function faqPage(perguntas: { pergunta: string; resposta: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: perguntas.map((p) => ({
      "@type": "Question",
      name: p.pergunta,
      acceptedAnswer: { "@type": "Answer", text: p.resposta },
    })),
  };
}
```

- [ ] **Step 4: Criar o componente que renderiza**

Crie `components/seo/JsonLd.tsx`:

```tsx
/**
 * Renderiza um bloco de dados estruturados.
 *
 * O conteúdo vem sempre dos nossos construtores, nunca de entrada de usuário —
 * é por isso que dangerouslySetInnerHTML é seguro aqui. Ainda assim, `<` é
 * escapado: uma barra de fechamento dentro do JSON encerraria o <script>.
 */
export function JsonLd({ dados }: { dados: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(dados).replace(/</g, "\\u003c"),
      }}
    />
  );
}
```

- [ ] **Step 5: Rodar e ver passar**

```bash
npm test -- testes/jsonld.test.ts
```

Esperado: `12 passed`.

- [ ] **Step 6: Commit**

```bash
git add lib/seo/jsonld.ts components/seo/JsonLd.tsx testes/jsonld.test.ts && git commit -m "Construtores de JSON-LD, sem nota agregada"
```

---

### Task 12: Consultas ao banco

A única camada que fala com o Supabase. Traz os dados no formato de tabela e devolve no formato do domínio — as telas nunca veem `crm_uf` nem uma junção.

**Files:**
- Create: `lib/dados/medicos.ts`, `lib/dados/especialidades.ts`

**Interfaces:**
- Consumes: Task 7, Task 8
- Produces:
  - `buscarMedicos(filtros?: Filtros): Promise<Medico[]>`
  - `medicoPorSlug(slug: string): Promise<Medico | null>`
  - `slugsDeMedicos(): Promise<string[]>`
  - `especialidadesComContagem(): Promise<EspecialidadeComContagem[]>`
  - `especialidadePorSlug(slug: string): Promise<{ nome: string; slug: string; oQueFaz: string | null; quandoProcurar: string | null } | null>`
  - `bairrosComContagem(especialidadeSlug?: string): Promise<{ nome: string; slug: string; total: number }[]>`

- [ ] **Step 1: Escrever as consultas de médicos**

Crie `lib/dados/medicos.ts`:

```ts
import { clienteServidor } from "@/lib/dados/cliente";
import { aplicarFiltros, ordenar } from "@/lib/dados/filtros";
import type {
  Filtros,
  Medico,
  RecursoAcessibilidade,
} from "@/lib/dados/tipos";

/* Uma seleção só, com as junções aninhadas. Trazer tudo de uma vez evita o
   problema de N+1 consultas — 24 perfis não podem virar 97 idas ao banco. */
const SELECAO = `
  id, slug, nome, crm, crm_uf, foto, bio, telemedicina, associado_ami,
  profissional_especialidade (
    rqe, principal,
    especialidade ( nome, slug )
  ),
  atendimento (
    horario ( dia_semana, abre, fecha ),
    local (
      id, logradouro, numero, telefone, whatsapp, estacionamento,
      bairro ( id, nome, slug ),
      local_acessibilidade ( recurso )
    )
  )
`;

/* O Postgres devolve `time` como "08:00:00"; a interface e os testes
   trabalham com "HH:MM". */
const hhmm = (t: string) => t.slice(0, 5);

/* eslint-disable @typescript-eslint/no-explicit-any */
function paraDominio(linha: any): Medico {
  return {
    id: linha.id,
    slug: linha.slug,
    nome: linha.nome,
    crm: linha.crm,
    crmUf: linha.crm_uf,
    foto: linha.foto,
    bio: linha.bio,
    telemedicina: linha.telemedicina,
    associadoAmi: linha.associado_ami,
    especialidades: (linha.profissional_especialidade ?? []).map((pe: any) => ({
      nome: pe.especialidade.nome,
      slug: pe.especialidade.slug,
      rqe: pe.rqe,
      principal: pe.principal,
    })),
    locais: (linha.atendimento ?? []).map((a: any) => ({
      id: a.local.id,
      logradouro: a.local.logradouro,
      numero: a.local.numero,
      bairro: a.local.bairro,
      telefone: a.local.telefone,
      whatsapp: a.local.whatsapp,
      estacionamento: a.local.estacionamento,
      acessibilidade: (a.local.local_acessibilidade ?? []).map(
        (r: any) => r.recurso as RecursoAcessibilidade,
      ),
      horarios: (a.horario ?? []).map((h: any) => ({
        diaSemana: h.dia_semana,
        abre: hhmm(h.abre),
        fecha: hhmm(h.fecha),
      })),
    })),
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

/**
 * Busca com filtros.
 *
 * A publicação é filtrada no banco — e a RLS garante isso de novo, mesmo que
 * alguém remova esta linha. O restante é filtrado em memória por
 * `aplicarFiltros`, que é puro e testado. Com a ordem de 500 registros a
 * diferença de desempenho é irrelevante, e a lógica fica testável sem banco.
 */
export async function buscarMedicos(filtros: Filtros = {}): Promise<Medico[]> {
  const { data, error } = await clienteServidor()
    .from("profissional")
    .select(SELECAO)
    .eq("publicado", true)
    .eq("situacao", "ativo");

  if (error) throw new Error(`Falha ao buscar médicos: ${error.message}`);

  const todos = (data ?? []).map(paraDominio);
  return ordenar(
    aplicarFiltros(todos, filtros),
    filtros.ordem ?? "relevancia",
    filtros.termo,
  );
}

/**
 * Perfil por slug.
 *
 * Filtra por `situacao` igual à busca, de propósito: sem isso um
 * profissional inativo sumiria da listagem e continuaria alcançável pela URL
 * direta, o que é pior que qualquer um dos dois comportamentos inteiros.
 *
 * A pergunta mais funda — o que deve acontecer com a URL de quem parou de
 * atender, já que endereço publicado não deveria desaparecer — pede uma
 * resposta desenhada, com a página no ar dizendo que o profissional não
 * atende mais. Isso é trabalho do Plano 2. Aqui o que importa é que os dois
 * caminhos concordem.
 */
export async function medicoPorSlug(slug: string): Promise<Medico | null> {
  const { data, error } = await clienteServidor()
    .from("profissional")
    .select(SELECAO)
    .eq("slug", slug)
    .eq("publicado", true)
    .eq("situacao", "ativo")
    .maybeSingle();

  if (error) throw new Error(`Falha ao buscar o perfil: ${error.message}`);
  return data ? paraDominio(data) : null;
}

/**
 * Alimenta o sitemap e a geração estática das rotas de perfil.
 *
 * Mesmo par de condições das outras duas consultas: um slug no sitemap que
 * devolve 404 é um convite que o site não honra.
 */
export async function slugsDeMedicos(): Promise<string[]> {
  const { data, error } = await clienteServidor()
    .from("profissional")
    .select("slug")
    .eq("publicado", true)
    .eq("situacao", "ativo");

  if (error) throw new Error(`Falha ao listar slugs: ${error.message}`);
  return (data ?? []).map((l) => l.slug as string);
}
```

- [ ] **Step 2: Escrever as consultas de especialidade e bairro**

Crie `lib/dados/especialidades.ts`:

```ts
import { buscarMedicos } from "@/lib/dados/medicos";
import { clienteServidor } from "@/lib/dados/cliente";
import type { EspecialidadeComContagem } from "@/lib/dados/tipos";

/**
 * Especialidades com quantos profissionais publicados cada uma tem.
 *
 * A contagem sai da mesma fonte que a listagem, de propósito: se o título da
 * página diz 7 e a lista mostra 6, o número está sendo escrito à mão em algum
 * lugar — e é isso que esta função existe para impedir.
 *
 * Especialidade sem nenhum profissional publicado não entra: uma página vazia
 * indexada é conteúdo raso.
 */
export async function especialidadesComContagem(): Promise<
  EspecialidadeComContagem[]
> {
  const medicos = await buscarMedicos();
  const contagem = new Map<string, EspecialidadeComContagem>();

  for (const m of medicos) {
    for (const e of m.especialidades) {
      const atual = contagem.get(e.slug);
      if (atual) atual.total += 1;
      else contagem.set(e.slug, { nome: e.nome, slug: e.slug, total: 1 });
    }
  }

  return [...contagem.values()].sort(
    (a, b) => b.total - a.total || a.nome.localeCompare(b.nome, "pt-BR"),
  );
}

export async function especialidadePorSlug(slug: string) {
  const { data, error } = await clienteServidor()
    .from("especialidade")
    .select("nome, slug, o_que_faz, quando_procurar")
    .eq("slug", slug)
    .maybeSingle();

  if (error) throw new Error(`Falha ao buscar a especialidade: ${error.message}`);
  if (!data) return null;

  return {
    nome: data.nome as string,
    slug: data.slug as string,
    oQueFaz: data.o_que_faz as string | null,
    quandoProcurar: data.quando_procurar as string | null,
  };
}

/** Bairros com oferta, opcionalmente dentro de uma especialidade. */
export async function bairrosComContagem(especialidadeSlug?: string) {
  const medicos = await buscarMedicos(
    especialidadeSlug ? { especialidade: especialidadeSlug } : {},
  );
  const contagem = new Map<string, { nome: string; slug: string; total: number }>();

  for (const m of medicos) {
    /* Um médico com dois consultórios no mesmo bairro conta uma vez só. */
    const bairrosDoMedico = new Set(m.locais.map((l) => l.bairro.slug));
    for (const slug of bairrosDoMedico) {
      const bairro = m.locais.find((l) => l.bairro.slug === slug)!.bairro;
      const atual = contagem.get(slug);
      if (atual) atual.total += 1;
      else contagem.set(slug, { nome: bairro.nome, slug, total: 1 });
    }
  }

  return [...contagem.values()].sort(
    (a, b) => b.total - a.total || a.nome.localeCompare(b.nome, "pt-BR"),
  );
}
```

- [ ] **Step 3: Conferir contra o banco real**

Crie um arquivo temporário `verificar.mts` na raiz. Ele existe só para provar
que a consulta real devolve o que os tipos prometem — o teste automatizado
cobre a lógica pura, não a ida ao banco.

```ts
process.loadEnvFile(".env.local");
const { buscarMedicos } = await import("./lib/dados/medicos.js");
const todos = await buscarMedicos();
console.log("total:", todos.length);
console.log("primeiro:", todos[0]?.nome, "-", todos[0]?.especialidades[0]?.nome);
console.log("locais do primeiro:", todos[0]?.locais.length);
console.log("horários do primeiro local:", todos[0]?.locais[0]?.horarios.length);
console.log("com telemedicina:", (await buscarMedicos({ telemedicina: true })).length);
console.log("no centro:", (await buscarMedicos({ bairro: "centro" })).length);
```

```bash
npx --yes tsx verificar.mts
```

Esperado: `total: 24`, um nome real, `locais do primeiro: 1`, `horários do primeiro local: 11` ou `10`, e contagens diferentes de zero nos dois filtros.

- [ ] **Step 4: Remover o arquivo temporário**

```bash
rm verificar.mts
```

- [ ] **Step 5: Commit**

```bash
git add lib/dados/medicos.ts lib/dados/especialidades.ts && git commit -m "Consultas ao banco, com a contagem saindo da mesma fonte da listagem"
```

---

### Task 13: Marca, cabeçalho, rodapé e breadcrumb

O casco do site. O cabeçalho é **claro** por uma razão concreta: a marca da AMI é verde-escura e desaparece sobre a faixa verde-800 que a direção de arte previa. O verde continua estruturando o site nas demais faixas.

**Files:**
- Create: `public/marca/ami-marca.svg`, `public/marca/ami-simbolo.svg`, `app/icon.svg`, `components/marca/Marca.tsx`, `components/layout/Cabecalho.tsx`, `components/layout/Rodape.tsx`, `components/layout/Breadcrumb.tsx`, `app/(site)/layout.tsx`

**Interfaces:**
- Consumes: Task 2, Task 12 (`especialidadesComContagem`, `bairrosComContagem`)
- Produces: `<Marca />`, `<Cabecalho />`, `<Rodape />`, `<Breadcrumb itens={[{ nome, caminho }]} />`

- [ ] **Step 1: Publicar os arquivos da marca**

```bash
mkdir -p public/marca && cp marca/ami-marca.svg marca/ami-simbolo.svg public/marca/ && cp marca/ami-simbolo.svg app/icon.svg
```

- [ ] **Step 2: Componente da marca**

Crie `components/marca/Marca.tsx`:

```tsx
/*
  A marca entra como <img> apontando para o SVG estático, não embutida no JSX:
  o traçado tem cerca de 55 KB e embutir isso em toda página desperdiçaria
  banda em cada navegação. Como arquivo, o navegador guarda em cache uma vez.

  width e height declarados evitam deslocamento de layout no carregamento.
*/
export function Marca({
  className = "",
  altura = 42,
}: {
  className?: string;
  altura?: number;
}) {
  const proporcao = 602 / 480;
  return (
    <img
      src="/marca/ami-marca.svg"
      alt="Associação Médica de Imperatriz"
      width={Math.round(altura * proporcao)}
      height={altura}
      className={className}
    />
  );
}
```

- [ ] **Step 3: Cabeçalho**

Crie `components/layout/Cabecalho.tsx`:

```tsx
import Link from "next/link";
import { Marca } from "@/components/marca/Marca";

const MENU = [
  { rotulo: "Buscar médicos", href: "/medicos" },
  { rotulo: "A Associação", href: "/associacao" },
];

/*
  Cabeçalho claro. A marca da AMI é verde-escura e sumiria sobre a faixa
  verde-800 prevista na direção de arte — o verde segue estruturando o site
  no herói da home, no bloco institucional e no rodapé.

  Separado do conteúdo por um fio de 1px, não por sombra.
*/
export function Cabecalho() {
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-surface">
      <div className="mx-auto flex max-w-[1200px] items-center gap-6 px-4 py-3 md:px-6">
        <Link
          href="/"
          className="flex shrink-0 items-center"
          aria-label="Ir para a página inicial da AMI"
        >
          <Marca altura={40} />
        </Link>

        <nav aria-label="Principal" className="ml-auto">
          <ul className="flex items-center gap-1">
            {MENU.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  /* min-h-11 = 44px, o alvo mínimo de toque no mobile */
                  className="flex min-h-11 items-center rounded-controle px-3 text-[15px] font-semibold text-ami-green-600 hover:bg-ami-mint-100"
                >
                  {item.rotulo}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
```

- [ ] **Step 4: Rodapé**

Crie `components/layout/Rodape.tsx`:

```tsx
import Link from "next/link";
import { bairrosComContagem, especialidadesComContagem } from "@/lib/dados/especialidades";

/*
  Rodapé em verde-900. A marca não entra aqui: sendo verde-escura sobre fundo
  verde-escuro, ela sumiria. No lugar, o nome da associação em texto, na
  Archivo condensada — que é legível e acessível, o que uma imagem não seria.

  As listas de especialidade e bairro são o bloco de linkagem interna mais
  forte do site: garantem que nenhuma página de faceta fique a mais de dois
  cliques de qualquer outra.
*/
export async function Rodape() {
  const [especialidades, bairros] = await Promise.all([
    especialidadesComContagem(),
    bairrosComContagem(),
  ]);

  return (
    <footer className="mt-20 bg-ami-green-900 text-ami-mint-400">
      <div className="mx-auto max-w-[1200px] px-4 py-14 md:px-6">
        <p className="font-titulo text-[22px] font-bold uppercase leading-[1.05] tracking-[0.01em] text-white [font-stretch:80%]">
          Associação Médica
          <br />
          de Imperatriz
        </p>

        <div className="mt-10 grid gap-10 md:grid-cols-4">
          {/* Coluna só existe se houver o que listar: título sobre lista
              vazia promete navegação que não está lá. Acontece de verdade
              quando o projeto gratuito do Supabase hiberna. */}
          {especialidades.length > 0 ? (
            <nav aria-labelledby="rodape-especialidades">
              <h2
                id="rodape-especialidades"
                className="font-titulo text-xs font-bold uppercase tracking-[0.12em] text-white"
              >
                Especialidades
              </h2>
              <ul className="mt-3">
                {especialidades.slice(0, 20).map((e) => (
                  <li key={e.slug}>
                    <Link
                      href={`/medicos/${e.slug}`}
                      /* O alvo de 44px é regra de toque, então vale abaixo de
                         md. No desktop a lista fica densa de propósito: vinte
                         itens a 44px dariam quase novecentos pixels de coluna. */
                      className="flex items-center py-1 text-[15px] hover:text-white hover:underline max-md:min-h-11 max-md:py-0"
                    >
                      {e.nome}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ) : null}

          {bairros.length > 0 ? (
            <nav aria-labelledby="rodape-bairros">
              <h2
                id="rodape-bairros"
                className="font-titulo text-xs font-bold uppercase tracking-[0.12em] text-white"
              >
                Bairros
              </h2>
              <ul className="mt-3">
                {bairros.map((b) => (
                  <li key={b.slug}>
                    <Link
                      href={`/busca?bairro=${b.slug}`}
                      className="flex items-center py-1 text-[15px] hover:text-white hover:underline max-md:min-h-11 max-md:py-0"
                    >
                      {b.nome}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ) : null}

          <nav aria-labelledby="rodape-institucional">
            <h2
              id="rodape-institucional"
              className="font-titulo text-xs font-bold uppercase tracking-[0.12em] text-white"
            >
              A Associação
            </h2>
            <ul className="mt-3 text-[15px]">
              <li>
                <Link
                  href="/associacao"
                  className="flex items-center py-1 hover:text-white hover:underline max-md:min-h-11 max-md:py-0"
                >
                  Quem somos
                </Link>
              </li>
              <li>
                <Link
                  href="/medicos"
                  className="flex items-center py-1 hover:text-white hover:underline max-md:min-h-11 max-md:py-0"
                >
                  Buscar médicos
                </Link>
              </li>
            </ul>
          </nav>

          <div>
            <h2 className="font-titulo text-xs font-bold uppercase tracking-[0.12em] text-white">
              Contato
            </h2>
            <address className="mt-3 space-y-1.5 text-[15px] not-italic">
              <p>[PROVISÓRIO] Endereço da sede</p>
              <p>Imperatriz - MA</p>
              <p className="numero-tabular">[PROVISÓRIO] (99) 0000-0000</p>
            </address>
          </div>
        </div>

        <div className="mt-12 border-t border-ami-green-700 pt-6 text-[15px]">
          <p>
            Associação Médica de Imperatriz · CNPJ [PROVISÓRIO]
          </p>
          <p className="mt-2">
            O conteúdo deste site é informativo e não substitui a consulta
            médica.
          </p>
          <p className="mt-2 text-ami-mint-400/80">
            Os dados de profissionais exibidos são fictícios, para
            demonstração, até a carga do cadastro oficial da AMI.
          </p>
        </div>
      </div>
    </footer>
  );
}
```

- [ ] **Step 5: Breadcrumb**

Crie `components/layout/Breadcrumb.tsx`:

```tsx
import Link from "next/link";

export type ItemTrilha = { nome: string; caminho: string };

/*
  Breadcrumb visível no topo de toda página interna. Existe em par com o
  BreadcrumbList do JSON-LD: dado estruturado sem o correspondente visível
  na tela é justamente o que o Google trata como marcação enganosa.
*/
export function Breadcrumb({ itens }: { itens: ItemTrilha[] }) {
  return (
    <nav aria-label="Trilha de navegação" className="py-3">
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[15px] text-ink-600">
        {itens.map((item, i) => {
          const ultimo = i === itens.length - 1;
          return (
            <li key={item.caminho} className="flex items-center gap-2">
              {ultimo ? (
                <span aria-current="page">{item.nome}</span>
              ) : (
                <>
                  <Link
                    href={item.caminho}
                    className="text-ami-green-600 hover:underline"
                  >
                    {item.nome}
                  </Link>
                  <span aria-hidden="true" className="text-ink-300">
                    /
                  </span>
                </>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
```

- [ ] **Step 6: Layout do site**

Crie `app/(site)/layout.tsx`:

```tsx
import { Cabecalho } from "@/components/layout/Cabecalho";
import { Rodape } from "@/components/layout/Rodape";

export default function LayoutSite({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* Primeiro alvo do Tab: quem navega por teclado não precisa
          atravessar o menu inteiro a cada página. */}
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-controle focus:bg-ami-green-600 focus:px-4 focus:py-2 focus:text-white"
      >
        Pular para o conteúdo
      </a>
      <Cabecalho />
      <main id="conteudo">{children}</main>
      <Rodape />
    </>
  );
}
```

- [ ] **Step 7: Mover a página inicial para dentro do grupo**

```bash
mkdir -p "app/(site)" && git mv app/page.tsx "app/(site)/page.tsx" 2>/dev/null || mv app/page.tsx "app/(site)/page.tsx"
```

- [ ] **Step 8: Conferir no navegador**

```bash
npm run dev
```

Abra `http://localhost:3000`. Esperado: cabeçalho branco com a marca em verde e fio embaixo; rodapé verde-escuro com as especialidades e bairros vindos do banco. Dê Tab a partir do topo: o primeiro foco precisa ser "Pular para o conteúdo".

- [ ] **Step 9: Commit**

```bash
git add -A && git commit -m "Marca, cabeçalho claro, rodapé e breadcrumb"
```

---

### Task 14: Linha de resultado e lista

A tela de resultados é a mais importante do site, e existe para **comparar**. Por isso o resultado é uma linha, não um cartão: linha comparativa vence cartão bonito quando o usuário precisa decidir.

O selo "Aberto agora" é o único pedaço que roda no navegador. O motivo é concreto: ele depende do relógio, e calculado no servidor ficaria congelado junto com a página em cache — mostrando "aberto" às onze da noite.

**Files:**
- Create: `components/base/Chip.tsx`, `components/base/EstadoVazio.tsx`, `components/diretorio/SeloAbertoAgora.tsx`, `components/diretorio/LinhaMedico.tsx`, `components/diretorio/ListaMedicos.tsx`

**Interfaces:**
- Consumes: Task 3 (`identificacaoMedica`, `formatarTelefone`), Task 4 (`estaAbertoAgora`), Task 7
- Produces: `<Chip>`, `<EstadoVazio titulo descricao acao? />`, `<LinhaMedico medico={} />`, `<ListaMedicos medicos={} />`

- [ ] **Step 1: Peças de base**

Crie `components/base/Chip.tsx`:

```tsx
export function Chip({
  children,
  tom = "neutro",
}: {
  children: React.ReactNode;
  tom?: "neutro" | "associado";
}) {
  /* Sobre fundo claro a ação e o destaque usam verde-600. A menta só entra
     como preenchimento, nunca como cor de texto. */
  const cores =
    tom === "associado"
      ? "bg-ami-mint-100 text-ami-green-700 border-ami-green-600/30"
      : "bg-canvas text-ink-600 border-line";

  return (
    <span
      className={`inline-flex items-center rounded-chip border px-2.5 py-0.5 text-xs font-semibold ${cores}`}
    >
      {children}
    </span>
  );
}
```

Crie `components/base/EstadoVazio.tsx`:

```tsx
/*
  Todo container de lista tem estado vazio desenhado. Lista em branco sem
  explicação é um dos sinais mais visíveis de protótipo inacabado — e aqui
  também é um beco sem saída para o usuário.
*/
export function EstadoVazio({
  titulo,
  descricao,
  acao,
}: {
  titulo: string;
  descricao: string;
  acao?: React.ReactNode;
}) {
  return (
    <div className="rounded-bloco border border-line bg-surface px-6 py-12 text-center">
      <h2 className="text-[21px] font-semibold">{titulo}</h2>
      <p className="coluna-leitura mx-auto mt-2 text-ink-600">{descricao}</p>
      {acao ? <div className="mt-5">{acao}</div> : null}
    </div>
  );
}
```

- [ ] **Step 2: Selo "Aberto agora"**

Crie `components/diretorio/SeloAbertoAgora.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import { estaAbertoAgora, type Horario } from "@/lib/dados/horarios";

/*
  Roda no navegador de propósito.

  Calculado no servidor, o selo congelaria junto com a página em cache e
  mostraria "Aberto agora" de madrugada. Aqui ele nasce oculto e aparece
  depois da montagem, então o HTML servido é sempre honesto — e não há
  divergência entre o que o servidor gerou e o que o cliente renderiza.
*/
export function SeloAbertoAgora({ horarios }: { horarios: Horario[] }) {
  const [aberto, setAberto] = useState<boolean | null>(null);

  useEffect(() => {
    const avaliar = () => setAberto(estaAbertoAgora(horarios, new Date()));
    avaliar();
    /* Meia hora basta: o expediente muda em blocos, não a cada minuto. */
    const id = setInterval(avaliar, 30 * 60 * 1000);
    return () => clearInterval(id);
  }, [horarios]);

  if (aberto === null) return null;

  return (
    <span
      className={`inline-flex items-center rounded-chip border px-2.5 py-0.5 text-xs font-semibold ${
        aberto
          ? "border-ami-green-600/30 bg-ami-mint-100 text-ami-green-700"
          : "border-line bg-canvas text-ink-600"
      }`}
    >
      {aberto ? "Aberto agora" : "Fechado agora"}
    </span>
  );
}
```

- [ ] **Step 3: A linha de resultado**

Crie `components/diretorio/LinhaMedico.tsx`:

```tsx
import Link from "next/link";
import { Chip } from "@/components/base/Chip";
import { SeloAbertoAgora } from "@/components/diretorio/SeloAbertoAgora";
import { formatarTelefone, identificacaoMedica } from "@/lib/formato";
import { ROTULO_ACESSIBILIDADE, type Medico } from "@/lib/dados/tipos";

/* Nome de uma palavra só devolvia a mesma letra duas vezes ("JJ"). */
function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return "?";
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
}

/*
  Linha, não cartão: a tela existe para comparar, e comparação se faz lendo
  na vertical. Sem sombra em repouso — o separador é um fio de 1px.
*/
export function LinhaMedico({ medico }: { medico: Medico }) {
  const principal =
    medico.especialidades.find((e) => e.principal) ?? medico.especialidades[0];
  /*
    Tudo nesta linha fala do MESMO consultório: o bairro, o telefone, a
    acessibilidade e o selo de aberto. Agregar o horário de todos os
    endereços faria a linha dizer "Aberto agora" por causa de um consultório
    que não é o do telefone exibido — quem liga cai na secretária eletrônica.

    Quem atende em mais de um lugar tem todos eles no perfil, com o horário
    de cada um. A linha de resultado mostra um, inteiro e coerente.
  */
  const local = medico.locais[0];
  const horarios = local?.horarios ?? [];
  const acessibilidade = local?.acessibilidade ?? [];
  const temOutrosLocais = medico.locais.length > 1;

  return (
    <li className="border-b border-line py-5 last:border-b-0">
      <div className="flex gap-4">
        {/* Sem foto real, iniciais em bloco verde. Nunca avatar ilustrado. */}
        {medico.foto ? (
          <img
            src={medico.foto}
            alt={`Retrato de ${medico.nome}`}
            width={72}
            height={72}
            className="size-[72px] shrink-0 rounded-bloco object-cover"
          />
        ) : (
          <span
            aria-hidden="true"
            className="flex size-[72px] shrink-0 items-center justify-center rounded-bloco bg-ami-green-800 font-titulo text-2xl font-bold text-ami-mint-400"
          >
            {iniciais(medico.nome)}
          </span>
        )}

        <div className="min-w-0 flex-1">
          <h3 className="text-[21px] font-semibold leading-tight">
            <Link
              href={`/medico/${medico.slug}`}
              className="text-ink-900 hover:text-ami-green-600 hover:underline"
            >
              {medico.nome}
            </Link>
          </h3>

          {/* Nome e CRM acompanhados da palavra MÉDICO: exigência da
              Resolução CFM 2.336/2023, Art. 4º, I. */}
          <p className="numero-tabular mt-0.5 text-[15px] font-semibold text-ink-600">
            {identificacaoMedica(medico.crm, medico.crmUf)}
          </p>

          {principal ? (
            <p className="mt-1 text-[15px] text-ink-600">
              {principal.nome}
              {/* RQE só aparece quando há especialidade registrada.
                  Clínico geral sem RQE é caso normal. */}
              {principal.rqe ? (
                <span className="numero-tabular"> · RQE {principal.rqe}</span>
              ) : null}
            </p>
          ) : null}

          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            {medico.associadoAmi ? (
              <Chip tom="associado">Associado AMI</Chip>
            ) : null}
            {local ? <Chip>{local.bairro.nome}</Chip> : null}
            {medico.telemedicina ? <Chip>Telemedicina</Chip> : null}
            {acessibilidade.includes("acesso_cadeirante") ? (
              <Chip>{ROTULO_ACESSIBILIDADE.acesso_cadeirante}</Chip>
            ) : null}
            {/* Avisa que há mais, para o bairro exibido não parecer o único. */}
            {temOutrosLocais ? (
              <Chip>
                {medico.locais.length === 2
                  ? "e mais 1 endereço"
                  : `e mais ${medico.locais.length - 1} endereços`}
              </Chip>
            ) : null}
            {/* Sem consultório cadastrado não há o que afirmar. "Fechado
                agora" pareceria informação e seria chute. */}
            {local ? <SeloAbertoAgora horarios={horarios} /> : null}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href={`/medico/${medico.slug}`}
              className="inline-flex min-h-11 items-center rounded-controle bg-ami-green-600 px-4 text-[15px] font-semibold text-white hover:bg-ami-green-700"
            >
              Ver perfil
            </Link>
            {local?.telefone ? (
              <a
                href={`tel:+55${local.telefone.replace(/\D/g, "")}`}
                className="numero-tabular inline-flex min-h-11 items-center rounded-controle border border-line px-4 text-[15px] font-semibold text-ami-green-600 hover:bg-ami-mint-100"
              >
                Ligar {formatarTelefone(local.telefone)}
              </a>
            ) : null}
          </div>
        </div>
      </div>
    </li>
  );
}
```

- [ ] **Step 4: A lista**

Crie `components/diretorio/ListaMedicos.tsx`:

```tsx
import Link from "next/link";
import { EstadoVazio } from "@/components/base/EstadoVazio";
import { LinhaMedico } from "@/components/diretorio/LinhaMedico";
import type { Medico } from "@/lib/dados/tipos";

export function ListaMedicos({
  medicos,
  filtroMaisRestritivo,
  saida,
}: {
  medicos: Medico[];
  /** Nome do filtro a sugerir remover quando não há resultado. */
  filtroMaisRestritivo?: string;
  /**
   * Para onde mandar quem não achou nada. Cada tela sabe qual é a saída útil
   * dali: de uma especialidade sem resultado no bairro, o caminho é ver a
   * especialidade inteira, não a lista de especialidades.
   */
  saida?: { rotulo: string; href: string };
}) {
  if (medicos.length === 0) {
    const destino = saida ?? {
      rotulo: "Ver todas as especialidades",
      href: "/medicos",
    };
    return (
      <EstadoVazio
        titulo="Nenhum médico com esses filtros"
        descricao={
          filtroMaisRestritivo
            ? `Tente remover o filtro de ${filtroMaisRestritivo} — costuma ser o que mais reduz a lista.`
            : "Tente remover um dos filtros para ampliar a busca."
        }
        acao={
          <Link
            href={destino.href}
            className="inline-flex min-h-11 items-center rounded-controle bg-ami-green-600 px-4 font-semibold text-white hover:bg-ami-green-700"
          >
            {destino.rotulo}
          </Link>
        }
      />
    );
  }

  return (
    <ul className="rounded-bloco border border-line bg-surface px-5">
      {medicos.map((m) => (
        <LinhaMedico key={m.id} medico={m} />
      ))}
    </ul>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add components/ && git commit -m "Linha de resultado, lista e selo Aberto agora"
```

---

### Task 15: Painel de filtros sincronizado com a URL

Filtro que não vive na URL não pode ser compartilhado nem indexado. Aqui está a divisão que a camada de SEO exige: o que é indexável mora no **caminho** da URL, o resto mora em **querystring** e sai `noindex, follow`.

**Files:**
- Create: `components/diretorio/PainelFiltros.tsx`, `lib/dados/urlFiltros.ts`, `testes/urlFiltros.test.ts`

**Interfaces:**
- Consumes: Task 7
- Produces:
  - `filtrosDaQuery(sp: Record<string, string | string[] | undefined>): Filtros`
  - `queryDosFiltros(f: Filtros): string`
  - `<PainelFiltros bairros={} filtros={} total={} />`

- [ ] **Step 1: Escrever os testes que falham**

Crie `testes/urlFiltros.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { filtrosDaQuery, queryDosFiltros } from "@/lib/dados/urlFiltros";

describe("filtrosDaQuery", () => {
  it("lê os filtros não indexáveis da querystring", () => {
    expect(
      filtrosDaQuery({
        termo: "cardio",
        bairro: "centro",
        telemedicina: "1",
        sabado: "1",
        acessibilidade: "acesso_cadeirante",
        associados: "1",
        ordem: "nome",
      }),
    ).toEqual({
      termo: "cardio",
      bairro: "centro",
      telemedicina: true,
      atendeSabado: true,
      acessibilidade: ["acesso_cadeirante"],
      somenteAssociados: true,
      ordem: "nome",
    });
  });

  it("devolve objeto vazio quando não há query", () => {
    expect(filtrosDaQuery({})).toEqual({});
  });

  it("aceita acessibilidade repetida", () => {
    const f = filtrosDaQuery({
      acessibilidade: ["acesso_cadeirante", "elevador"],
    });
    expect(f.acessibilidade).toEqual(["acesso_cadeirante", "elevador"]);
  });

  it("ignora ordem desconhecida em vez de confiar na entrada", () => {
    expect(filtrosDaQuery({ ordem: "melhores" }).ordem).toBeUndefined();
  });
});

describe("queryDosFiltros", () => {
  it("omite o que está desligado, para não sujar a URL", () => {
    expect(queryDosFiltros({ telemedicina: false })).toBe("");
  });

  it("monta a query na ordem estável", () => {
    expect(
      queryDosFiltros({ termo: "cardio", telemedicina: true, ordem: "nome" }),
    ).toBe("?termo=cardio&telemedicina=1&ordem=nome");
  });

  it("descarta recurso de acessibilidade inventado", () => {
    /* A entrada vem da URL e pode ser qualquer coisa. */
    expect(
      filtrosDaQuery({ acessibilidade: ["elevador", "teleporte"] })
        .acessibilidade,
    ).toEqual(["elevador"]);
    expect(
      filtrosDaQuery({ acessibilidade: "inventado" }).acessibilidade,
    ).toBeUndefined();
  });

  it("dois conjuntos iguais em ordem diferente geram a mesma URL", () => {
    /* Marcar e desmarcar caixas reordenava os parâmetros. O mesmo filtro
       com dois endereços é conteúdo duplicado. */
    const a = queryDosFiltros({
      acessibilidade: ["elevador", "acesso_cadeirante"],
    });
    const b = queryDosFiltros({
      acessibilidade: ["acesso_cadeirante", "elevador"],
    });
    expect(a).toBe(b);
    expect(a).toBe(
      "?acessibilidade=acesso_cadeirante&acessibilidade=elevador",
    );
  });

  it("faz o caminho de ida e volta", () => {
    const original = {
      termo: "jose",
      bairro: "bacuri",
      atendeSabado: true,
      acessibilidade: ["elevador" as const],
    };
    const query = queryDosFiltros(original);
    const sp = Object.fromEntries(new URLSearchParams(query.slice(1)));
    expect(filtrosDaQuery({ ...sp, acessibilidade: ["elevador"] })).toEqual(
      original,
    );
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

```bash
npm test -- testes/urlFiltros.test.ts
```

Esperado: FAIL, com erro de resolução do módulo `@/lib/dados/urlFiltros`.

- [ ] **Step 3: Implementar**

Crie `lib/dados/urlFiltros.ts`:

```ts
import type { Filtros, Ordem, RecursoAcessibilidade } from "@/lib/dados/tipos";

/*
  Tradução entre a URL e os filtros.

  Regra da camada de SEO: o que é indexável vive no CAMINHO da URL —
  especialidade e o cruzamento especialidade + bairro. Todo o resto vive em
  QUERYSTRING e a página sai como `noindex, follow`. Filtros combinados geram
  milhares de endereços quase iguais, e indexar isso derruba o site inteiro.
*/

const RECURSOS: RecursoAcessibilidade[] = [
  "acesso_cadeirante",
  "banheiro_adaptado",
  "elevador",
  "piso_tatil",
  "interprete_libras",
];

const ORDENS: Ordem[] = ["relevancia", "nome"];

type Query = Record<string, string | string[] | undefined>;

const texto = (v: string | string[] | undefined) =>
  Array.isArray(v) ? v[0] : v;

export function filtrosDaQuery(sp: Query): Filtros {
  const f: Filtros = {};

  const termo = texto(sp.termo)?.trim();
  if (termo) f.termo = termo;

  const bairro = texto(sp.bairro)?.trim();
  if (bairro) f.bairro = bairro;

  if (texto(sp.telemedicina) === "1") f.telemedicina = true;
  if (texto(sp.sabado) === "1") f.atendeSabado = true;
  if (texto(sp.associados) === "1") f.somenteAssociados = true;

  const bruto = sp.acessibilidade;
  const recursos = (Array.isArray(bruto) ? bruto : bruto ? [bruto] : []).filter(
    (r): r is RecursoAcessibilidade =>
      RECURSOS.includes(r as RecursoAcessibilidade),
  );
  if (recursos.length) f.acessibilidade = recursos;

  /* A entrada vem da URL e pode ser qualquer coisa: só passa o que está na
     lista conhecida. */
  const ordem = texto(sp.ordem);
  if (ordem && ORDENS.includes(ordem as Ordem)) f.ordem = ordem as Ordem;

  return f;
}

/**
 * Serializa os filtros numa querystring.
 *
 * A ordem das chaves é fixa e a lista de acessibilidade é reordenada pela
 * ordem canônica de `RECURSOS`. Sem isso, marcar e desmarcar caixas produz
 * URLs diferentes para o mesmo conjunto de filtros — e o mesmo resultado com
 * dois endereços é conteúdo duplicado, exatamente o que o controle de facetas
 * existe para evitar.
 *
 * Toda construção de URL do painel passa por aqui, para que a garantia valha
 * na tela e não só no teste.
 */
export function queryDosFiltros(f: Filtros): string {
  const p = new URLSearchParams();

  if (f.termo) p.set("termo", f.termo);
  if (f.bairro) p.set("bairro", f.bairro);
  if (f.telemedicina) p.set("telemedicina", "1");
  if (f.atendeSabado) p.set("sabado", "1");
  for (const r of RECURSOS) {
    if (f.acessibilidade?.includes(r)) p.append("acessibilidade", r);
  }
  if (f.somenteAssociados) p.set("associados", "1");
  if (f.ordem) p.set("ordem", f.ordem);

  const s = p.toString();
  return s ? `?${s}` : "";
}
```

- [ ] **Step 4: Rodar e ver passar**

```bash
npm test -- testes/urlFiltros.test.ts
```

Esperado: `9 passed`.

- [ ] **Step 5: O painel**

Crie `components/diretorio/PainelFiltros.tsx`:

```tsx
"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { filtrosDaQuery, queryDosFiltros } from "@/lib/dados/urlFiltros";
import {
  ROTULO_ACESSIBILIDADE,
  type Filtros,
  type RecursoAcessibilidade,
} from "@/lib/dados/tipos";

type Bairro = { nome: string; slug: string };

/*
  Filtros como formulário de verdade: cada campo tem label visível, não só
  placeholder. No mobile o painel vira gaveta, com a contagem de filtros
  ativos no botão — sem isso o usuário não sabe por que a lista está curta.
*/
export function PainelFiltros({
  bairros,
  total,
}: {
  bairros: Bairro[];
  total: number;
}) {
  const router = useRouter();
  const caminho = usePathname();
  const sp = useSearchParams();
  const [aberto, setAberto] = useState(false);

  /*
    O contador cobre os controles deste painel, e nada mais.

    `termo` fica de fora de propósito: quem digitou "cardiologia" na home vê
    isso no H1 da página, e não veio deste painel. `ordem` também: ordenar
    não encurta a lista, então não explica por que ela está curta.

    Como consequência, "Limpar" preserva os dois — apagar o que não se conta
    seria remover a busca do usuário sem aviso.
  */
  const ativos = [
    sp.get("bairro"),
    sp.get("telemedicina"),
    sp.get("sabado"),
    sp.get("associados"),
    ...sp.getAll("acessibilidade"),
  ].filter(Boolean).length;

  function limpar() {
    const { termo, ordem } = filtrosAtuais();
    router.push(`${caminho}${queryDosFiltros({ termo, ordem })}`, {
      scroll: false,
    });
  }

  /* Lê a URL de volta para o formato do domínio, para que toda alteração
     saia serializada por queryDosFiltros — a função que garante ordem
     estável e é a que os testes cobrem. */
  function filtrosAtuais(): Filtros {
    const q: Record<string, string | string[]> = {};
    for (const chave of new Set(sp.keys())) {
      const valores = sp.getAll(chave);
      q[chave] = valores.length > 1 ? valores : valores[0];
    }
    return filtrosDaQuery(q);
  }

  function aplicar(mudanca: Partial<Filtros>) {
    const q = queryDosFiltros({ ...filtrosAtuais(), ...mudanca });
    router.push(`${caminho}${q}`, { scroll: false });
  }

  function alternarRecurso(recurso: RecursoAcessibilidade, marcado: boolean) {
    const atuais = filtrosAtuais().acessibilidade ?? [];
    const lista = marcado
      ? [...atuais.filter((r) => r !== recurso), recurso]
      : atuais.filter((r) => r !== recurso);
    aplicar({ acessibilidade: lista.length ? lista : undefined });
  }

  return (
    <aside aria-labelledby="titulo-filtros">
      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        aria-expanded={aberto}
        aria-controls="campos-filtros"
        className="flex min-h-11 w-full items-center justify-between rounded-controle border border-line bg-surface px-4 font-semibold text-ami-green-600 md:hidden"
      >
        Filtros
        {ativos > 0 ? (
          <span className="numero-tabular rounded-chip bg-ami-green-600 px-2 py-0.5 text-xs text-white">
            {ativos}
          </span>
        ) : null}
      </button>

      <div
        id="campos-filtros"
        className={`${aberto ? "block" : "hidden"} mt-3 space-y-6 rounded-bloco border border-line bg-surface p-5 md:mt-0 md:block`}
      >
        <h2 id="titulo-filtros" className="text-[21px] font-semibold">
          Filtrar
        </h2>

        <div>
          <label
            htmlFor="filtro-bairro"
            className="block text-[15px] font-semibold"
          >
            Bairro
          </label>
          <select
            id="filtro-bairro"
            value={sp.get("bairro") ?? ""}
            onChange={(e) => aplicar({ bairro: e.target.value || undefined })}
            className="mt-1.5 min-h-11 w-full rounded-controle border border-line bg-surface px-3 text-[15px]"
          >
            <option value="">Todos os bairros</option>
            {bairros.map((b) => (
              <option key={b.slug} value={b.slug}>
                {b.nome}
              </option>
            ))}
          </select>
        </div>

        <fieldset>
          <legend className="text-[15px] font-semibold">Atendimento</legend>
          <label className="mt-2 flex min-h-11 items-center gap-2.5 text-[15px]">
            <input
              type="checkbox"
              checked={sp.get("telemedicina") === "1"}
              onChange={(e) => aplicar({ telemedicina: e.target.checked })}
              className="size-5 accent-ami-green-600"
            />
            Atende por telemedicina
          </label>
          <label className="flex min-h-11 items-center gap-2.5 text-[15px]">
            <input
              type="checkbox"
              checked={sp.get("sabado") === "1"}
              onChange={(e) => aplicar({ atendeSabado: e.target.checked })}
              className="size-5 accent-ami-green-600"
            />
            Atende aos sábados
          </label>
        </fieldset>

        <fieldset>
          <legend className="text-[15px] font-semibold">Acessibilidade</legend>
          {(Object.keys(ROTULO_ACESSIBILIDADE) as RecursoAcessibilidade[]).map(
            (r) => (
              <label
                key={r}
                className="flex min-h-11 items-center gap-2.5 text-[15px]"
              >
                <input
                  type="checkbox"
                  checked={sp.getAll("acessibilidade").includes(r)}
                  onChange={(e) => alternarRecurso(r, e.target.checked)}
                  className="size-5 accent-ami-green-600"
                />
                {ROTULO_ACESSIBILIDADE[r]}
              </label>
            ),
          )}
        </fieldset>

        <label className="flex min-h-11 items-center gap-2.5 text-[15px] font-semibold">
          <input
            type="checkbox"
            checked={sp.get("associados") === "1"}
            onChange={(e) => aplicar({ somenteAssociados: e.target.checked })}
            className="size-5 accent-ami-green-600"
          />
          Somente associados AMI
        </label>

        <div>
          <label
            htmlFor="filtro-ordem"
            className="block text-[15px] font-semibold"
          >
            Ordenar por
          </label>
          <select
            id="filtro-ordem"
            value={sp.get("ordem") ?? "relevancia"}
            onChange={(e) => aplicar({ ordem: e.target.value as Filtros["ordem"] })}
            className="mt-1.5 min-h-11 w-full rounded-controle border border-line bg-surface px-3 text-[15px]"
          >
            <option value="relevancia">Relevância</option>
            <option value="nome">Nome (A–Z)</option>
          </select>
        </div>

        {ativos > 0 ? (
          <button
            type="button"
            onClick={limpar}
            className="min-h-11 text-[15px] font-semibold text-ami-green-600 underline"
          >
            Limpar todos os filtros
          </button>
        ) : null}

        <p className="numero-tabular border-t border-line pt-4 text-[15px] text-ink-600">
          {total === 1 ? "1 resultado" : `${total} resultados`}
        </p>
      </div>
    </aside>
  );
}
```

- [ ] **Step 6: Commit**

```bash
git add lib/dados/urlFiltros.ts components/diretorio/PainelFiltros.tsx testes/urlFiltros.test.ts && git commit -m "Filtros sincronizados com a URL, indexáveis no caminho e o resto em query"
```

---

### Task 16: Índice de especialidades e busca livre

Duas portas de entrada. `/medicos` é a lista densa em duas colunas com a contagem de cada especialidade — a página que distribui autoridade para todas as facetas, sem a qual nenhuma faceta fica a menos de três cliques da home.

`/busca` atende o termo digitado no formulário da home. Ela existe separada de propósito: busca por texto livre gera um endereço diferente a cada digitação, e indexar isso encheria o índice de páginas quase iguais. Por isso ela sai `noindex, follow` — navegável e útil, invisível para o robô.

**Files:**
- Create: `app/(site)/medicos/page.tsx`, `app/(site)/busca/page.tsx`

**Interfaces:**
- Consumes: Task 11 (`breadcrumbList`), Task 12 (`especialidadesComContagem`, `bairrosComContagem`, `buscarMedicos`), Task 13, Task 14 (`ListaMedicos`), Task 15 (`PainelFiltros`, `filtrosDaQuery`)
- Produces: rotas `/medicos` e `/busca`

- [ ] **Step 1: Escrever a página**

Crie `app/(site)/medicos/page.tsx`:

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbList } from "@/lib/seo/jsonld";
import {
  bairrosComContagem,
  especialidadesComContagem,
} from "@/lib/dados/especialidades";
import { contagem } from "@/lib/formato";

/* Revalidação a cada hora: o cadastro muda algumas vezes por semana, e servir
   HTML pronto é o que segura o LCP abaixo de 2,5s em 4G. */
export const revalidate = 3600;

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export async function generateMetadata(): Promise<Metadata> {
  const especialidades = await especialidadesComContagem();
  const total = especialidades.reduce((s, e) => s + e.total, 0);

  return {
    title: `Médicos em Imperatriz - MA | ${total} profissionais | AMI`,
    description:
      `${total} médicos em ${especialidades.length} especialidades em ` +
      `Imperatriz - MA. Veja endereço, telefone e horários de atendimento.`,
    alternates: { canonical: "/medicos" },
  };
}

export default async function PaginaMedicos() {
  const [especialidades, bairros] = await Promise.all([
    especialidadesComContagem(),
    bairrosComContagem(),
  ]);
  const total = especialidades.reduce((s, e) => s + e.total, 0);

  const trilha = [
    { nome: "Início", caminho: "/" },
    { nome: "Médicos", caminho: "/medicos" },
  ];

  return (
    <div className="mx-auto max-w-[1200px] px-4 md:px-6">
      <JsonLd dados={breadcrumbList(trilha, SITE)} />
      <Breadcrumb itens={trilha} />

      {/* Ritmo vertical variado de propósito: bloco de abertura com respiro,
          lista densa logo abaixo. */}
      <div className="pb-10 pt-4">
        <h1>Médicos em Imperatriz</h1>
        <p className="coluna-leitura mt-4 text-ink-600">
          {contagem(total, "profissional", "profissionais")} em{" "}
          {contagem(especialidades.length, "especialidade", "especialidades")},
          com endereço, telefone e horários por dia da semana. Todos os
          registros trazem o CRM, conforme exige a Resolução CFM 2.336/2023.
        </p>
      </div>

      <section aria-labelledby="por-especialidade" className="pb-14">
        <h2 id="por-especialidade" className="border-b border-line-strong pb-3">
          Por especialidade
        </h2>
        {/* Lista em duas colunas, separada por fios — não grade de cartões. */}
        <ul className="mt-1 gap-x-10 md:columns-2">
          {especialidades.map((e) => (
            <li key={e.slug} className="break-inside-avoid border-b border-line">
              <Link
                href={`/medicos/${e.slug}`}
                className="flex min-h-11 items-center justify-between gap-4 py-2.5 text-ami-green-600 hover:bg-ami-mint-100"
              >
                <span className="font-semibold">{e.nome}</span>
                <span className="numero-tabular text-[15px] text-ink-400">
                  {e.total}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="por-bairro" className="pb-16">
        <h2 id="por-bairro" className="border-b border-line-strong pb-3">
          Por bairro
        </h2>
        <ul className="mt-4 flex flex-wrap gap-2">
          {bairros.map((b) => (
            <li key={b.slug}>
              <Link
                href={`/medicos?bairro=${b.slug}`}
                className="numero-tabular inline-flex min-h-11 items-center rounded-chip border border-line bg-surface px-4 text-[15px] font-semibold text-ami-green-600 hover:bg-ami-mint-100"
              >
                {b.nome} · {b.total}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
```

- [ ] **Step 2: Conferir no navegador**

```bash
npm run dev
```

Abra `http://localhost:3000/medicos`. Esperado: 14 especialidades com contagem, 8 bairros, breadcrumb no topo. Confira que a soma das contagens bate com o número do parágrafo de abertura.

- [ ] **Step 3: Escrever a busca livre**

Crie `app/(site)/busca/page.tsx`:

```tsx
import type { Metadata } from "next";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { ListaMedicos } from "@/components/diretorio/ListaMedicos";
import { PainelFiltros } from "@/components/diretorio/PainelFiltros";
import { filtrosDaQuery } from "@/lib/dados/urlFiltros";
import { buscarMedicos } from "@/lib/dados/medicos";
import { bairrosComContagem } from "@/lib/dados/especialidades";
import { contagem } from "@/lib/formato";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/*
  Busca livre. Fora do índice de propósito: cada termo digitado geraria um
  endereço novo e quase idêntico aos outros, e é exatamente esse tipo de
  página que faz o Google classificar um diretório como conteúdo raso.
  `follow` mantém os links de resultado rastreáveis.
*/
export const metadata: Metadata = {
  title: "Buscar médicos em Imperatriz - MA | AMI",
  robots: { index: false, follow: true },
};

export default async function PaginaBusca({ searchParams }: Props) {
  const filtros = filtrosDaQuery(await searchParams);
  const temFiltro = Object.keys(filtros).some((c) => c !== "ordem");
  const [medicos, bairros] = await Promise.all([
    buscarMedicos(filtros),
    bairrosComContagem(),
  ]);

  const trilha = [
    { nome: "Início", caminho: "/" },
    { nome: "Buscar", caminho: "/busca" },
  ];

  return (
    <div className="mx-auto max-w-[1200px] px-4 md:px-6">
      <Breadcrumb itens={trilha} />

      <div className="pb-8 pt-4">
        {/* H1 dinâmico: quem chegou por uma busca precisa ver o que buscou. */}
        <h1>
          {filtros.termo
            ? `Resultados para “${filtros.termo}”`
            : "Buscar médicos em Imperatriz"}
        </h1>
        <p className="numero-tabular mt-3 text-ink-600">
          {contagem(
            medicos.length,
            "profissional encontrado",
            "profissionais encontrados",
          )}
          {filtros.termo || temFiltro
            ? "."
            : " no diretório. Use os filtros ao lado ou escolha uma especialidade."}
        </p>
      </div>

      <div className="grid gap-8 pb-16 md:grid-cols-[260px_1fr]">
        <PainelFiltros bairros={bairros} total={medicos.length} />
        <div>
          <h2 className="sr-only">Resultados</h2>
          <ListaMedicos
            medicos={medicos}
            filtroMaisRestritivo={filtros.termo ? "termo digitado" : "bairro"}
            saida={{
              rotulo: "Ver todas as especialidades",
              href: "/medicos",
            }}
          />
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Conferir a busca ponta a ponta**

```bash
npm run dev
```

Na home, digite "cardio" e envie. Esperado: chegar em `/busca?termo=cardio`, com o H1 mostrando o termo e a lista filtrada. No código-fonte, confirme `<meta name="robots" content="noindex, follow">`.

Busque por "jose" sem acento: precisa encontrar profissionais com "José" no nome. Se não encontrar, a normalização de acento em `lib/dados/filtros.ts` está errada.

- [ ] **Step 5: Commit**

```bash
git add "app/(site)/medicos/page.tsx" "app/(site)/busca/page.tsx" && git commit -m "Índice de especialidades e busca livre"
```

---

### Task 17: Página de especialidade

A primeira das duas famílias de URL que trazem busca orgânica. Sem o parágrafo gerado dos dados e os blocos informativos, é uma lista pelada — e o Google trata lista pelada como conteúdo raso.

**Files:**
- Create: `app/(site)/medicos/[especialidade]/page.tsx`

**Interfaces:**
- Consumes: Tasks 9, 10, 11, 12, 14, 15
- Produces: rota `/medicos/{especialidade}` com `generateStaticParams`

- [ ] **Step 1: Escrever a página**

Crie `app/(site)/medicos/[especialidade]/page.tsx`:

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { ListaMedicos } from "@/components/diretorio/ListaMedicos";
import { PainelFiltros } from "@/components/diretorio/PainelFiltros";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbList, itemList } from "@/lib/seo/jsonld";
import {
  MINIMO_PARA_INDEXAR,
  facetaEhIndexavel,
  paragrafoDeAbertura,
  resumirFaceta,
} from "@/lib/dados/facetas";
import { filtrosDaQuery } from "@/lib/dados/urlFiltros";
import { buscarMedicos } from "@/lib/dados/medicos";
import {
  bairrosComContagem,
  especialidadePorSlug,
  especialidadesComContagem,
} from "@/lib/dados/especialidades";
import { descricaoEspecialidade, tituloEspecialidade } from "@/lib/seo/metadados";

export const revalidate = 3600;

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

/* No Next 16, params e searchParams são Promise e precisam de await. */
type Props = {
  params: Promise<{ especialidade: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateStaticParams() {
  const especialidades = await especialidadesComContagem();
  return especialidades.map((e) => ({ especialidade: e.slug }));
}

export async function generateMetadata({
  params,
  searchParams,
}: Props): Promise<Metadata> {
  const { especialidade } = await params;
  const esp = await especialidadePorSlug(especialidade);
  if (!esp) return {};

  const sp = await searchParams;
  const temFiltroDeQuery = Object.keys(sp).length > 0;

  const medicos = await buscarMedicos({ especialidade });
  const bairros = [
    ...new Set(medicos.flatMap((m) => m.locais.map((l) => l.bairro.nome))),
  ];

  return {
    title: tituloEspecialidade(esp.nome, medicos.length),
    description: descricaoEspecialidade(esp.nome, medicos.length, bairros),
    alternates: { canonical: `/medicos/${especialidade}` },
    /* Filtro em querystring nunca entra no índice: combinações geram milhares
       de endereços quase iguais. O canonical continua apontando para a página
       limpa, e `follow` mantém os links rastreáveis. */
    ...(temFiltroDeQuery
      ? { robots: { index: false, follow: true } }
      : {}),
  };
}

export default async function PaginaEspecialidade({
  params,
  searchParams,
}: Props) {
  const { especialidade } = await params;
  const esp = await especialidadePorSlug(especialidade);
  if (!esp) notFound();

  const filtros = filtrosDaQuery(await searchParams);
  const [todosDaEspecialidade, bairros, relacionadas] = await Promise.all([
    buscarMedicos({ especialidade }),
    bairrosComContagem(especialidade),
    especialidadesComContagem(),
  ]);
  const medicos = await buscarMedicos({ ...filtros, especialidade });

  const resumo = resumirFaceta(todosDaEspecialidade, esp.nome);

  const trilha = [
    { nome: "Início", caminho: "/" },
    { nome: "Médicos", caminho: "/medicos" },
    { nome: esp.nome, caminho: `/medicos/${especialidade}` },
  ];

  return (
    <div className="mx-auto max-w-[1200px] px-4 md:px-6">
      <JsonLd dados={breadcrumbList(trilha, SITE)} />
      <JsonLd dados={itemList(medicos, SITE)} />
      <Breadcrumb itens={trilha} />

      <div className="pb-8 pt-4">
        <h1>{esp.nome} em Imperatriz - MA</h1>
        {/* Gerado dos dados reais, nunca texto-modelo com a palavra trocada. */}
        <p className="coluna-leitura mt-4 text-ink-600">
          {paragrafoDeAbertura(resumo)}
        </p>
      </div>

      <div className="grid gap-8 pb-14 md:grid-cols-[260px_1fr]">
        <PainelFiltros bairros={bairros} total={medicos.length} />
        <div>
          <h2 className="sr-only">Resultados</h2>
          <ListaMedicos
            medicos={medicos}
            filtroMaisRestritivo={
              filtros.acessibilidade?.length
                ? "acessibilidade"
                : filtros.bairro
                  ? "bairro"
                  : undefined
            }
          />
        </div>
      </div>

      {/* Conteúdo informativo com autoria creditada: sem isso, um site de
          saúde não passa no critério YMYL do Google. */}
      {esp.oQueFaz || esp.quandoProcurar ? (
        <section
          aria-labelledby="sobre-a-especialidade"
          className="border-t border-line-strong py-14"
        >
          <h2 id="sobre-a-especialidade">Sobre {esp.nome.toLowerCase()}</h2>
          <div className="coluna-leitura mt-5 space-y-5 text-ink-600">
            {esp.oQueFaz ? (
              <div>
                <h3>O que faz este especialista</h3>
                <p className="mt-2">{esp.oQueFaz}</p>
              </div>
            ) : null}
            {esp.quandoProcurar ? (
              <div>
                <h3>Quando procurar</h3>
                <p className="mt-2">{esp.quandoProcurar}</p>
              </div>
            ) : null}
            <p className="text-[15px] text-ink-400">
              Revisão médica [PROVISÓRIO — creditar nome, CRM e data da
              revisão]. Conteúdo informativo; não substitui a consulta.
            </p>
          </div>
        </section>
      ) : null}

      <section
        aria-labelledby="links-internos"
        className="border-t border-line-strong py-14"
      >
        <h2 id="links-internos" className="sr-only">
          Navegação relacionada
        </h2>

        <h3>{esp.nome} por bairro</h3>
        <ul className="mt-3 flex flex-wrap gap-2">
          {bairros.map((b) => (
            <li key={b.slug}>
              <Link
                href={`/medicos/${especialidade}/${b.slug}`}
                className="numero-tabular inline-flex min-h-11 items-center rounded-chip border border-line bg-surface px-4 text-[15px] font-semibold text-ami-green-600 hover:bg-ami-mint-100"
              >
                {b.nome} · {b.total}
                {/* O usuário merece saber que a página existe mesmo quando é
                    pequena demais para entrar no índice. */}
                {!facetaEhIndexavel(b.total) ? (
                  <span className="ml-1 text-ink-400">
                    (menos de {MINIMO_PARA_INDEXAR})
                  </span>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>

        <h3 className="mt-10">Outras especialidades</h3>
        <ul className="mt-3 flex flex-wrap gap-2">
          {relacionadas
            .filter((e) => e.slug !== especialidade)
            .slice(0, 12)
            .map((e) => (
              <li key={e.slug}>
                <Link
                  href={`/medicos/${e.slug}`}
                  className="inline-flex min-h-11 items-center rounded-chip border border-line bg-surface px-4 text-[15px] font-semibold text-ami-green-600 hover:bg-ami-mint-100"
                >
                  {e.nome}
                </Link>
              </li>
            ))}
        </ul>
      </section>
    </div>
  );
}
```

- [ ] **Step 2: Conferir no navegador**

```bash
npm run dev
```

Abra `http://localhost:3000/medicos/cardiologia`. Esperado: H1 com o nome da especialidade, parágrafo com números reais, lista de médicos, filtros na esquerda.

Marque "Atende aos sábados": a URL vira `?sabado=1` e a lista encurta. Veja o código-fonte da página (Ctrl+U) e confirme que há uma `<meta name="robots" content="noindex, follow">` **só** quando há filtro na query.

- [ ] **Step 3: Commit**

```bash
git add "app/(site)/medicos/[especialidade]/page.tsx" && git commit -m "Página de especialidade com parágrafo gerado dos dados"
```

---

### Task 18: Página de cruzamento especialidade e bairro

O corte de indexação vive aqui. Com 14 especialidades e 8 bairros são 112 endereços; com o catálogo completo passa de 400, e a maioria teria zero, um ou dois profissionais. Publicar tudo isso indexável faz o Google classificar o site como conteúdo raso e derruba junto as páginas boas.

**Files:**
- Create: `app/(site)/medicos/[especialidade]/[bairro]/page.tsx`

**Interfaces:**
- Consumes: Tasks 9, 10, 11, 12, 14
- Produces: rota `/medicos/{especialidade}/{bairro}`

- [ ] **Step 1: Escrever a página**

Crie `app/(site)/medicos/[especialidade]/[bairro]/page.tsx`:

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { ListaMedicos } from "@/components/diretorio/ListaMedicos";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbList, itemList } from "@/lib/seo/jsonld";
import {
  facetaEhIndexavel,
  paragrafoDeAbertura,
  resumirFaceta,
} from "@/lib/dados/facetas";
import { buscarMedicos } from "@/lib/dados/medicos";
import {
  bairrosComContagem,
  especialidadePorSlug,
} from "@/lib/dados/especialidades";
import { descricaoEspecialidade, tituloFaceta } from "@/lib/seo/metadados";

export const revalidate = 3600;

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

type Props = {
  params: Promise<{ especialidade: string; bairro: string }>;
};

/* Sem generateStaticParams: são centenas de combinações e a maioria não tem
   ninguém. As páginas nascem sob demanda e a revalidação cuida do resto. */

async function carregar(especialidadeSlug: string, bairroSlug: string) {
  const [esp, medicos, bairros] = await Promise.all([
    especialidadePorSlug(especialidadeSlug),
    buscarMedicos({ especialidade: especialidadeSlug, bairro: bairroSlug }),
    bairrosComContagem(especialidadeSlug),
  ]);
  const bairro = bairros.find((b) => b.slug === bairroSlug);
  return { esp, medicos, bairro, bairros };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { especialidade, bairro } = await params;
  const { esp, medicos, bairro: b } = await carregar(especialidade, bairro);
  if (!esp || !b) return {};

  const indexavel = facetaEhIndexavel(medicos.length);

  return {
    title: tituloFaceta(esp.nome, b.nome, medicos.length),
    description: descricaoEspecialidade(esp.nome, medicos.length, [b.nome]),
    /*
      Abaixo do corte, a página existe, funciona e é navegável — mas sai
      `noindex, follow`, com o canonical apontando para a especialidade.
      Conforme a AMI cadastra mais gente, ela entra no índice sozinha: a
      contagem vem do banco, não de uma lista escrita à mão.
    */
    alternates: {
      canonical: indexavel
        ? `/medicos/${especialidade}/${bairro}`
        : `/medicos/${especialidade}`,
    },
    ...(indexavel ? {} : { robots: { index: false, follow: true } }),
  };
}

export default async function PaginaFaceta({ params }: Props) {
  const { especialidade, bairro } = await params;
  const { esp, medicos, bairro: b, bairros } = await carregar(
    especialidade,
    bairro,
  );
  if (!esp || !b) notFound();

  const resumo = resumirFaceta(medicos, esp.nome, b.nome);

  const trilha = [
    { nome: "Início", caminho: "/" },
    { nome: "Médicos", caminho: "/medicos" },
    { nome: esp.nome, caminho: `/medicos/${especialidade}` },
    { nome: b.nome, caminho: `/medicos/${especialidade}/${bairro}` },
  ];

  return (
    <div className="mx-auto max-w-[1200px] px-4 md:px-6">
      <JsonLd dados={breadcrumbList(trilha, SITE)} />
      <JsonLd dados={itemList(medicos, SITE)} />
      <Breadcrumb itens={trilha} />

      <div className="pb-8 pt-4">
        <h1>
          {esp.nome} no {b.nome}, Imperatriz - MA
        </h1>
        <p className="coluna-leitura mt-4 text-ink-600">
          {paragrafoDeAbertura(resumo)}
        </p>
      </div>

      <div className="pb-14">
        <h2 className="sr-only">Resultados</h2>
        <ListaMedicos medicos={medicos} filtroMaisRestritivo="bairro" />
      </div>

      <section
        aria-labelledby="outros-bairros"
        className="border-t border-line-strong py-14"
      >
        <h2 id="outros-bairros">
          {esp.nome} em outros bairros de Imperatriz
        </h2>
        <ul className="mt-4 flex flex-wrap gap-2">
          {bairros
            .filter((outro) => outro.slug !== bairro)
            .map((outro) => (
              <li key={outro.slug}>
                <Link
                  href={`/medicos/${especialidade}/${outro.slug}`}
                  className="numero-tabular inline-flex min-h-11 items-center rounded-chip border border-line bg-surface px-4 text-[15px] font-semibold text-ami-green-600 hover:bg-ami-mint-100"
                >
                  {outro.nome} · {outro.total}
                </Link>
              </li>
            ))}
        </ul>
        <p className="mt-6">
          <Link
            href={`/medicos/${especialidade}`}
            className="font-semibold text-ami-green-600 underline"
          >
            Ver todos os profissionais de {esp.nome.toLowerCase()} em Imperatriz
          </Link>
        </p>
      </section>
    </div>
  );
}
```

- [ ] **Step 2: Conferir os dois lados do corte**

```bash
npm run dev
```

Abra uma faceta com 3 ou mais profissionais e outra com menos — a página de especialidade mostra a contagem em cada chip de bairro, e marca "(menos de 3)" nas pequenas.

No código-fonte de cada uma, confirme:
- com 3 ou mais: canonical aponta para si mesma, sem `noindex`
- com menos de 3: `<meta name="robots" content="noindex, follow">` e canonical apontando para `/medicos/{especialidade}`

- [ ] **Step 3: Commit**

```bash
git add "app/(site)/medicos/[especialidade]/[bairro]/page.tsx" && git commit -m "Cruzamento especialidade e bairro, com corte de indexação"
```

---

### Task 19: Perfil do profissional

O ativo mais valioso do site e o que estava invisível no portal anterior: perfis fora do sitemap e sem dados estruturados. Aqui ele nasce indexável.

**Files:**
- Create: `components/diretorio/GradeHorarios.tsx`, `app/(site)/medico/[slug]/page.tsx`

**Interfaces:**
- Consumes: Tasks 3, 4, 10, 11, 12, 14
- Produces: rota `/medico/{slug}`; `<GradeHorarios horarios={} />`

- [ ] **Step 1: Grade de horários**

Crie `components/diretorio/GradeHorarios.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import { agruparPorDia, type Horario } from "@/lib/dados/horarios";

/*
  Tabela real, não <div> soltas: leitor de tela anuncia linha e coluna, e o
  Google entende a estrutura.

  O destaque de "hoje" roda no navegador pelo mesmo motivo do selo Aberto
  agora — no servidor ele congelaria junto com a página em cache e apontaria
  o dia errado.
*/
export function GradeHorarios({ horarios }: { horarios: Horario[] }) {
  const [hoje, setHoje] = useState<number | null>(null);
  useEffect(() => setHoje(new Date().getDay()), []);

  const dias = agruparPorDia(horarios);

  return (
    <table className="w-full max-w-md border-collapse overflow-hidden rounded-bloco border border-line bg-surface">
      <caption className="sr-only">Horários de atendimento por dia</caption>
      <tbody>
        {dias.map((d) => (
          <tr
            key={d.dia}
            className={`border-b border-line last:border-b-0 ${
              hoje === d.dia ? "bg-ami-mint-100" : ""
            }`}
          >
            <th
              scope="row"
              className="px-4 py-2.5 text-left text-[15px] font-semibold"
            >
              {d.nome}
              {hoje === d.dia ? (
                <span className="ml-2 text-xs font-bold uppercase tracking-[0.08em] text-ami-green-700">
                  Hoje
                </span>
              ) : null}
            </th>
            <td className="numero-tabular px-4 py-2.5 text-right text-[15px] text-ink-600">
              {d.faixas.length ? d.faixas.join(" · ") : "Não atende"}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

- [ ] **Step 2: A página de perfil**

Crie `app/(site)/medico/[slug]/page.tsx`:

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { Chip } from "@/components/base/Chip";
import { GradeHorarios } from "@/components/diretorio/GradeHorarios";
import { LinhaMedico } from "@/components/diretorio/LinhaMedico";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbList, physician } from "@/lib/seo/jsonld";
import { buscarMedicos, medicoPorSlug, slugsDeMedicos } from "@/lib/dados/medicos";
import { descricaoMedico, tituloMedico } from "@/lib/seo/metadados";
import { formatarTelefone, identificacaoMedica } from "@/lib/formato";
import { ROTULO_ACESSIBILIDADE } from "@/lib/dados/tipos";

export const revalidate = 3600;

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const slugs = await slugsDeMedicos();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const m = await medicoPorSlug(slug);
  if (!m) return {};

  const principal = m.especialidades.find((e) => e.principal) ?? m.especialidades[0];
  const bairros = [...new Set(m.locais.map((l) => l.bairro.nome))];

  return {
    title: tituloMedico(m.nome, principal?.nome ?? null),
    description: descricaoMedico(m.nome, principal?.nome ?? null, bairros),
    alternates: { canonical: `/medico/${slug}` },
  };
}

export default async function PaginaPerfil({ params }: Props) {
  const { slug } = await params;
  const m = await medicoPorSlug(slug);
  if (!m) notFound();

  const principal = m.especialidades.find((e) => e.principal) ?? m.especialidades[0];
  const bairroPrincipal = m.locais[0]?.bairro;

  /* Profissionais relacionados: linkam para a especialidade e o bairro, o que
     costura a malha interna do site. */
  const relacionados = principal
    ? (await buscarMedicos({ especialidade: principal.slug }))
        .filter((outro) => outro.slug !== m.slug)
        .slice(0, 4)
    : [];

  const trilha = [
    { nome: "Início", caminho: "/" },
    { nome: "Médicos", caminho: "/medicos" },
    ...(principal
      ? [{ nome: principal.nome, caminho: `/medicos/${principal.slug}` }]
      : []),
    { nome: m.nome, caminho: `/medico/${m.slug}` },
  ];

  return (
    <div className="mx-auto max-w-[1200px] px-4 md:px-6">
      <JsonLd dados={physician(m, SITE)} />
      <JsonLd dados={breadcrumbList(trilha, SITE)} />
      <Breadcrumb itens={trilha} />

      <header className="border-b border-line-strong pb-8 pt-4">
        <h1>{m.nome}</h1>
        {/* Nome e CRM com a palavra MÉDICO — CFM 2.336/2023, Art. 4º, I. */}
        <p className="numero-tabular mt-2 text-[17px] font-semibold text-ink-600">
          {identificacaoMedica(m.crm, m.crmUf)}
        </p>
        {principal ? (
          <p className="mt-1 text-[17px] text-ink-600">
            {principal.nome}
            {principal.rqe ? (
              <span className="numero-tabular"> · RQE {principal.rqe}</span>
            ) : null}
          </p>
        ) : null}
        <div className="mt-4 flex flex-wrap gap-2">
          {m.associadoAmi ? <Chip tom="associado">Associado AMI</Chip> : null}
          {m.telemedicina ? <Chip>Atende por telemedicina</Chip> : null}
        </div>
      </header>

      <section aria-labelledby="locais" className="border-b border-line py-12">
        <h2 id="locais">Onde atende</h2>
        <div className="mt-6 space-y-10">
          {m.locais.map((l) => (
            <div key={l.id} className="grid gap-6 md:grid-cols-2">
              <div>
                <h3>{l.bairro.nome}</h3>
                <address className="mt-2 not-italic text-ink-600">
                  {[l.logradouro, l.numero].filter(Boolean).join(", ")}
                  <br />
                  {l.bairro.nome}, Imperatriz - MA
                </address>

                {l.telefone ? (
                  <p className="mt-4">
                    <a
                      href={`tel:+55${l.telefone.replace(/\D/g, "")}`}
                      className="numero-tabular inline-flex min-h-11 items-center rounded-controle bg-ami-green-600 px-4 font-semibold text-white hover:bg-ami-green-700"
                    >
                      Ligar {formatarTelefone(l.telefone)}
                    </a>
                  </p>
                ) : null}

                {l.acessibilidade.length || l.estacionamento ? (
                  <ul className="mt-5 space-y-1 text-[15px] text-ink-600">
                    {l.acessibilidade.map((r) => (
                      <li key={r}>{ROTULO_ACESSIBILIDADE[r]}</li>
                    ))}
                    {l.estacionamento ? <li>Estacionamento</li> : null}
                  </ul>
                ) : null}
              </div>

              <div>
                <h3 className="sr-only">Horários em {l.bairro.nome}</h3>
                <GradeHorarios horarios={l.horarios} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {m.bio ? (
        <section aria-labelledby="sobre" className="border-b border-line py-12">
          <h2 id="sobre">Sobre</h2>
          <p className="coluna-leitura mt-4 text-ink-600">{m.bio}</p>
        </section>
      ) : null}

      {relacionados.length ? (
        <section aria-labelledby="relacionados" className="py-12">
          <h2 id="relacionados">
            Outros profissionais de {principal!.nome.toLowerCase()}
          </h2>
          <ul className="mt-4 rounded-bloco border border-line bg-surface px-5">
            {relacionados.map((outro) => (
              <LinhaMedico key={outro.id} medico={outro} />
            ))}
          </ul>
          <p className="mt-6 flex flex-wrap gap-4">
            <Link
              href={`/medicos/${principal!.slug}`}
              className="font-semibold text-ami-green-600 underline"
            >
              Todos de {principal!.nome.toLowerCase()}
            </Link>
            {bairroPrincipal ? (
              <Link
                href={`/medicos/${principal!.slug}/${bairroPrincipal.slug}`}
                className="font-semibold text-ami-green-600 underline"
              >
                {principal!.nome} no {bairroPrincipal.nome}
              </Link>
            ) : null}
          </p>
        </section>
      ) : null}

      <p className="coluna-leitura pb-14 text-[15px] text-ink-400">
        As informações desta página são fornecidas pelo profissional e revisadas
        pela Associação Médica de Imperatriz. Conteúdo informativo; não
        substitui a consulta médica.
      </p>
    </div>
  );
}
```

- [ ] **Step 3: Conferir no navegador**

```bash
npm run dev
```

Abra `http://localhost:3000/medico/mayara-viana`. Esperado: nome, "MÉDICO · CRM/MA ...", especialidade, tabela de horários com o dia de hoje destacado, e links para a especialidade e o bairro.

Cole o código-fonte no [Rich Results Test](https://search.google.com/test/rich-results) e confirme que o bloco `Physician` é reconhecido sem erro.

- [ ] **Step 4: Commit**

```bash
git add components/diretorio/GradeHorarios.tsx "app/(site)/medico/[slug]/page.tsx" && git commit -m "Perfil do profissional com Physician e horários por dia"
```

---

### Task 20: Home

Herói assimétrico, não centralizado: o texto ocupa 7 das 12 colunas e o cartão de busca invade a borda inferior da faixa verde. Esse encaixe é a assinatura visual da home, e o cartão é o **único** elemento do site com sombra em repouso — porque é a única camada que de fato flutua.

**Files:**
- Create: `components/marca/Simbolo.tsx`
- Modify: `app/(site)/page.tsx` (substituir por completo)

**Interfaces:**
- Consumes: Tasks 12, 13
- Produces: rota `/`

- [ ] **Step 1: Símbolo para a marca d'água**

Crie `components/marca/Simbolo.tsx`:

```tsx
/* Só o símbolo, sem letreiro. Decorativo aqui, então alt vazio e
   aria-hidden: quem usa leitor de tela não ganha nada ouvindo "chevron". */
export function Simbolo({ className = "" }: { className?: string }) {
  return (
    <img
      src="/marca/ami-simbolo.svg"
      alt=""
      aria-hidden="true"
      width={529}
      height={292}
      className={className}
    />
  );
}
```

- [ ] **Step 2: A home**

Substitua **todo** o conteúdo de `app/(site)/page.tsx`:

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import { Simbolo } from "@/components/marca/Simbolo";
import { JsonLd } from "@/components/seo/JsonLd";
import { organizationAmi } from "@/lib/seo/jsonld";
import {
  bairrosComContagem,
  especialidadesComContagem,
} from "@/lib/dados/especialidades";
import { contagem } from "@/lib/formato";

export const revalidate = 3600;

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export async function generateMetadata(): Promise<Metadata> {
  const especialidades = await especialidadesComContagem();
  const total = especialidades.reduce((s, e) => s + e.total, 0);

  return {
    title: "Associação Médica de Imperatriz",
    description:
      `${total} médicos e ${especialidades.length} especialidades em ` +
      `Imperatriz - MA. Filtre por especialidade e bairro, e veja horários.`,
    alternates: { canonical: "/" },
  };
}

export default async function Home() {
  const [especialidades, bairros] = await Promise.all([
    especialidadesComContagem(),
    bairrosComContagem(),
  ]);
  const total = especialidades.reduce((s, e) => s + e.total, 0);

  return (
    <>
      <JsonLd dados={organizationAmi(SITE)} />

      {/* --- 1. Herói assimétrico em faixa verde-800 --- */}
      <section className="relative overflow-hidden bg-ami-green-800 pb-24 pt-14 md:pb-32">
        {/* Marca d'água: uso estrutural do símbolo, cortado pela borda.
            É a primeira das no máximo duas aparições por página. */}
        <Simbolo className="pointer-events-none absolute -right-16 top-0 h-full w-auto opacity-[0.05]" />

        <div className="mx-auto grid max-w-[1200px] grid-cols-12 px-4 md:px-6">
          <div className="col-span-12 md:col-span-7">
            <p className="font-titulo text-xs font-bold uppercase tracking-[0.12em] text-ami-mint-400">
              Associação Médica de Imperatriz
            </p>
            <h1 className="mt-3 text-white">
              Encontre o médico certo em Imperatriz
            </h1>
            {/* Números contados do banco. Nunca escritos à mão. */}
            <p className="numero-tabular mt-5 max-w-[46ch] text-[19px] text-ami-mint-400">
              {contagem(total, "médico", "médicos")} em{" "}
              {contagem(especialidades.length, "especialidade", "especialidades")}
              , atendendo em {contagem(bairros.length, "bairro", "bairros")}.
              Filtre por especialidade e bairro.
            </p>
          </div>
        </div>
      </section>

      {/* --- 2. Cartão de busca invadindo a faixa: única sombra do site --- */}
      <div className="mx-auto max-w-[1200px] px-4 md:px-6">
        {/* Formulário HTML de verdade, com method GET: funciona sem
            JavaScript e o resultado vira uma URL compartilhável. */}
        <form
          action="/busca"
          method="get"
          className="-mt-14 rounded-bloco bg-surface p-5 shadow-[0_8px_24px_rgba(6,33,15,.14)] md:p-6"
        >
          <h2 className="text-[21px] font-semibold">Buscar</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-[1fr_240px_auto]">
            <div>
              <label
                htmlFor="busca-termo"
                className="block text-[15px] font-semibold"
              >
                Especialidade ou nome
              </label>
              <input
                id="busca-termo"
                name="termo"
                type="search"
                placeholder="Cardiologia, Mayara Viana…"
                className="mt-1.5 min-h-11 w-full rounded-controle border border-line px-3 text-[15px] placeholder:text-ink-300"
              />
            </div>
            <div>
              <label
                htmlFor="busca-bairro"
                className="block text-[15px] font-semibold"
              >
                Bairro
              </label>
              <select
                id="busca-bairro"
                name="bairro"
                className="mt-1.5 min-h-11 w-full rounded-controle border border-line bg-surface px-3 text-[15px]"
              >
                <option value="">Todos</option>
                {bairros.map((b) => (
                  <option key={b.slug} value={b.slug}>
                    {b.nome}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              className="mt-auto min-h-11 rounded-controle bg-ami-green-600 px-6 font-semibold text-white hover:bg-ami-green-700"
            >
              Buscar
            </button>
          </div>
        </form>
      </div>

      {/* --- 3. Chips das especialidades com mais profissionais --- */}
      <section
        aria-labelledby="mais-buscadas"
        className="mx-auto max-w-[1200px] px-4 py-12 md:px-6"
      >
        <h2 id="mais-buscadas" className="sr-only">
          Especialidades com mais profissionais
        </h2>
        <ul className="flex flex-wrap gap-2">
          {especialidades.slice(0, 8).map((e) => (
            <li key={e.slug}>
              <Link
                href={`/medicos/${e.slug}`}
                className="numero-tabular inline-flex min-h-11 items-center rounded-chip border border-line bg-surface px-4 text-[15px] font-semibold text-ami-green-600 hover:bg-ami-mint-100"
              >
                {e.nome} · {e.total}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* --- 4. Acesso rápido em fios, não em cartões --- */}
      <section
        aria-labelledby="acesso-rapido"
        className="mx-auto max-w-[1200px] px-4 pb-14 md:px-6"
      >
        <h2 id="acesso-rapido" className="border-b border-line-strong pb-3">
          Acesso rápido
        </h2>
        <ul className="grid md:grid-cols-3">
          {[
            {
              titulo: "Por especialidade",
              texto: `${especialidades.length} especialidades com profissional publicado.`,
              href: "/medicos",
            },
            {
              titulo: "Por bairro",
              texto: `Atendimento em ${bairros.length} bairros de Imperatriz.`,
              href: "/medicos",
            },
            {
              titulo: "A Associação",
              texto: "Quem é a AMI, diretoria e como se associar.",
              href: "/associacao",
            },
          ].map((item) => (
            <li key={item.titulo} className="border-b border-line">
              <Link
                href={item.href}
                className="block py-5 pr-4 hover:bg-ami-mint-100 md:pr-8"
              >
                <span className="block font-semibold text-ami-green-600">
                  {item.titulo}
                </span>
                <span className="mt-1 block text-[15px] text-ink-600">
                  {item.texto}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* --- 5. Faixa institucional em verde-900, respiro maior --- */}
      <section
        aria-labelledby="institucional"
        className="bg-ami-green-900 py-20 text-ami-mint-400"
      >
        <div className="mx-auto max-w-[1200px] px-4 md:px-6">
          <h2 id="institucional" className="text-white">
            A entidade que representa os médicos de Imperatriz
          </h2>
          <p className="coluna-leitura mt-4">
            A AMI reúne os profissionais que atendem em Imperatriz e na região
            sul do Maranhão. Este diretório existe para que a população encontre
            quem atende perto de casa, com informação correta e verificada.
          </p>
          <p className="mt-6">
            <Link
              href="/associacao"
              className="inline-flex min-h-11 items-center font-semibold text-white underline"
            >
              Conhecer a Associação
            </Link>
          </p>
        </div>
      </section>
    </>
  );
}
```

- [ ] **Step 3: Conferir**

```bash
npm run dev
```

Abra `http://localhost:3000` em 390px e em 1440px. Esperado: herói com texto à esquerda e cartão de busca cavalgando a borda verde; nenhum outro cartão com sombra na página; o símbolo aparecendo uma única vez, como marca d'água.

- [ ] **Step 4: Commit**

```bash
git add "app/(site)/page.tsx" components/marca/Simbolo.tsx && git commit -m "Home com herói assimétrico e cartão de busca invadindo a faixa"
```

---

### Task 21: Sitemap e robots

O portal anterior tinha 28 URLs no sitemap e nenhum perfil de médico entre elas — o ativo mais valioso era invisível. Aqui o sitemap é gerado do banco, então todo perfil publicado entra sozinho.

**Files:**
- Create: `app/sitemap.ts`, `app/robots.ts`

**Interfaces:**
- Consumes: Task 9 (`facetaEhIndexavel`), Task 12
- Produces: `/sitemap.xml`, `/robots.txt`

- [ ] **Step 1: Sitemap**

Crie `app/sitemap.ts`:

```ts
import type { MetadataRoute } from "next";
import { buscarMedicos, slugsDeMedicos } from "@/lib/dados/medicos";
import {
  bairrosComContagem,
  especialidadesComContagem,
} from "@/lib/dados/especialidades";
import { facetaEhIndexavel } from "@/lib/dados/facetas";

export const revalidate = 3600;

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

/*
  Gerado do banco. Só entram as URLs que são de fato indexáveis — o mesmo
  corte que a página aplica no seu robots. Sitemap e meta em desacordo é
  sinal contraditório: o sitemap convida, a página recusa.
*/
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [especialidades, slugs] = await Promise.all([
    especialidadesComContagem(),
    slugsDeMedicos(),
  ]);

  const fixas: MetadataRoute.Sitemap = [
    { url: `${SITE}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE}/medicos`, changeFrequency: "weekly", priority: 0.9 },
  ];

  const porEspecialidade: MetadataRoute.Sitemap = especialidades.map((e) => ({
    url: `${SITE}/medicos/${e.slug}`,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  /* Cruzamento só entra acima do corte de indexação. */
  const cruzamentos: MetadataRoute.Sitemap = [];
  for (const e of especialidades) {
    const bairros = await bairrosComContagem(e.slug);
    for (const b of bairros) {
      if (facetaEhIndexavel(b.total)) {
        cruzamentos.push({
          url: `${SITE}/medicos/${e.slug}/${b.slug}`,
          changeFrequency: "monthly",
          priority: 0.6,
        });
      }
    }
  }

  const perfis: MetadataRoute.Sitemap = slugs.map((slug) => ({
    url: `${SITE}/medico/${slug}`,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  return [...fixas, ...porEspecialidade, ...cruzamentos, ...perfis];
}
```

- [ ] **Step 2: Robots**

Crie `app/robots.ts`:

```ts
import type { MetadataRoute } from "next";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      /* /painel entra na Fase 4 e já fica bloqueado desde agora, para que
         nenhuma tela autenticada apareça no índice por descuido. */
      disallow: ["/api/", "/painel/", "/_next/"],
    },
    sitemap: `${SITE}/sitemap.xml`,
  };
}
```

- [ ] **Step 3: Conferir**

```bash
npm run dev
```

Abra `http://localhost:3000/sitemap.xml`. Esperado: as duas URLs fixas, 14 de especialidade, 24 de perfil e os cruzamentos que passaram do corte — nenhum com menos de 3 profissionais.

Abra `http://localhost:3000/robots.txt`. Esperado: `Disallow: /painel/` e a linha do sitemap.

- [ ] **Step 4: Commit**

```bash
git add app/sitemap.ts app/robots.ts && git commit -m "Sitemap gerado do banco e robots.txt"
```

---

### Task 22: Verificação e auditoria de entrega

Nada aqui se resolve dizendo que está certo. Cada item tem um comando ou uma medição, e a saída é um relatório escrito.

**Files:**
- Create: `docs/verificacao-fase-1.md`

**Interfaces:**
- Consumes: todas as tarefas anteriores
- Produces: `docs/verificacao-fase-1.md` com as tabelas preenchidas

- [ ] **Step 1: Suíte completa e build de produção**

```bash
npm test && npx tsc --noEmit && npm run lint && npm run build
```

Esperado: todos os testes passando, nenhum erro de tipo, nenhum aviso de lint, e o build concluído. Anote no relatório quantas rotas foram geradas estaticamente.

- [ ] **Step 2: Tabela de contraste**

Meça cada par de cor usado no site. Use qualquer verificador WCAG; os valores de referência estão abaixo e precisam bater.

Escreva em `docs/verificacao-fase-1.md`:

```markdown
## Contraste

| Texto | Fundo | Medido | Mínimo | Situação |
|---|---|---|---|---|
| `--ink-900` #14201A | `--surface` #FFFFFF | 15,8:1 | 4,5:1 | aprovado |
| `--ink-600` #4B5A51 | `--surface` #FFFFFF | 7,4:1 | 4,5:1 | aprovado |
| `--ink-400` #657268 | `--surface` #FFFFFF | 5,0:1 | 4,5:1 | aprovado |
| `--ami-green-600` #1F6B3A | `--surface` #FFFFFF | 6,5:1 | 4,5:1 | aprovado |
| `--ami-mint-400` #A5DCAF | `--ami-green-800` #0B3018 | 9,3:1 | 4,5:1 | aprovado |
| `--ami-mint-400` #A5DCAF | `--ami-green-900` #06210F | 10,9:1 | 4,5:1 | aprovado |
| `#FFFFFF` | `--ami-green-600` #1F6B3A | 6,5:1 | 4,5:1 | aprovado |
| `--ami-green-700` #123D24 | `--ami-mint-100` #E6F4E9 | 10,1:1 | 4,5:1 | aprovado |
```

- [ ] **Step 3: Provar que a menta não virou texto em fundo claro**

Esta é a armadilha específica do projeto: menta sobre branco mede 1,56:1 e reprova em qualquer critério.

```bash
grep -rn "text-ami-mint" app components | grep -v "green-800\|green-900\|green-700"
```

Esperado: **nenhuma linha**. Se aparecer alguma, confira se o elemento está de fato dentro de um bloco verde-escuro; se não estiver, troque por `text-ami-green-600`.

- [ ] **Step 4: Teclado**

Percorra `/`, `/medicos`, `/medicos/cardiologia`, `/medicos/cardiologia/centro` e um perfil, usando só Tab, Shift+Tab e Enter. Confirme e registre:

- o primeiro Tab de cada página revela "Pular para o conteúdo"
- todo elemento focado tem anel verde visível, sem exceção
- a gaveta de filtros no mobile abre pelo teclado e o `aria-expanded` acompanha
- nenhum ponto prende o foco

- [ ] **Step 5: Estrutura de headings**

Em cada uma das cinco páginas, rode no console do navegador:

```js
copy([...document.querySelectorAll("h1,h2,h3,h4")]
  .map((h) => h.tagName + " · " + h.textContent.trim().slice(0, 60)).join("\n"));
```

Esperado: exatamente um `H1` por página e nenhum salto de nível — nunca um `H3` sem `H2` antes. Cole o resultado de cada página no relatório.

- [ ] **Step 6: Responsividade**

Nas ferramentas de desenvolvedor, percorra as larguras 320, 360, 390, 768, 1024, 1440 e 1920 px em todas as cinco páginas.

Esperado: nenhuma barra de rolagem horizontal, nenhum texto transbordando, nenhum alvo de toque abaixo de 44px. Para detectar transbordo:

```js
[...document.querySelectorAll("*")]
  .filter((e) => e.scrollWidth > document.documentElement.clientWidth)
  .map((e) => e.tagName + "." + e.className);
```

Esperado: array vazio.

- [ ] **Step 7: Zoom e viewport**

```bash
grep -rn "maximum-scale\|user-scalable" app/
```

Esperado: **nenhuma linha**. Bloquear zoom é uma barreira séria para o público idoso deste site.

- [ ] **Step 8: Tabela de SEO das telas**

Acrescente ao relatório, preenchendo com o que o site realmente gera:

```markdown
## SEO por tela

| URL canônica | Title | Description | H1 | JSON-LD | Indexável |
|---|---|---|---|---|---|
| `/` | | | | Organization | sim |
| `/medicos` | | | | BreadcrumbList | sim |
| `/medicos/{esp}` | | | | ItemList + BreadcrumbList | sim |
| `/medicos/{esp}?sabado=1` | | | | idem | **não** — noindex, follow |
| `/medicos/{esp}/{bairro}` com 3+ | | | | ItemList + BreadcrumbList | sim |
| `/medicos/{esp}/{bairro}` com menos de 3 | | | | idem | **não** — canonical para a especialidade |
| `/medico/{slug}` | | | | Physician + BreadcrumbList | sim |
```

- [ ] **Step 9: Auto-auditoria anti-IA**

Percorra os sete grupos da blindagem e escreva, para cada um, o que foi verificado e o que foi ajustado. Corrija o que encontrar **antes** de fechar a tarefa — não entregue com ressalva.

1. **Cor** — nenhum gradiente azul-roxo, nenhum texto com gradiente, nenhum blob ou mesh, nenhuma paleta padrão de framework, nenhum glow
2. **Layout** — a home não começa com herói centralizado; nenhuma seção repete a anatomia kicker → H2 centralizado → três cartões; há pelo menos quatro estruturas de seção diferentes; o respiro vertical varia entre seções
3. **Componentes** — nenhum cartão de feature com ícone em quadradinho arredondado, nenhum depoimento inventado, nenhuma faixa de logos, nenhuma estatística sem origem no banco ou sem marca `[PROVISÓRIO]`, nenhum acordeão de FAQ genérico, nenhum bloco de CTA "Pronto para começar?"
4. **Tipografia** — Archivo e Source Sans 3, nada de Inter, Geist ou Poppins; salto evidente entre H1, H2 e corpo; texto corrido alinhado à esquerda
5. **Movimento** — nenhuma animação de entrada em rolagem, nenhum `scale` no hover, nenhum número animado, nenhum carrossel
6. **Texto** — nenhuma palavra da lista banida; nenhum título que serviria para outro setor; nenhum rótulo de botão vago
7. **Código** — nada transborda entre 320 e 1920px; escala de espaçamento consistente; nenhum alt genérico; nenhum contraste abaixo do mínimo; todo estado vazio desenhado

Depois, responda em uma frase cada:

- Qual decisão de layout desta home só faz sentido para uma associação médica de Imperatriz, e para nenhum outro site?
- Removendo a marca e o texto, ainda dá para reconhecer que é este projeto? Por quê?
- Qual é o elemento mais genérico que sobrou, e por que foi mantido?

- [ ] **Step 10: Commit**

```bash
git add docs/verificacao-fase-1.md && git commit -m "Relatório de verificação da Fase 1"
```

---

## O que fica para os planos seguintes

Registrado aqui para que ninguém confunda "fora deste plano" com "esquecido":

| Item | Plano |
|---|---|
| Demais seções da home: lista densa de especialidades em duas colunas, bloco "Você é médico?", últimas notícias | 2 |
| `/clinicas`, `/clinicas/{categoria}`, `/clinica/{slug}` — e as tabelas `estabelecimento` e `formacao`, já criadas na migração mas ainda sem tela | 2 |
| Paginação com `<a href>` reais e sufixo "— página N", quando a lista passar de 50 resultados | 2 |
| FAQ por especialidade com `FAQPage` | 2 |
| Banner de cookies com três categorias, Política de Privacidade, Termos de Uso e Política de Cookies — **bloqueadores de lançamento** pela LGPD | 2 |
| Sanity, Studio em `/studio`, blog e páginas institucionais — inclusive `/associacao`, hoje apenas linkada no cabeçalho e no rodapé | 3 |
| Painel, login por link no e-mail, fila de revisões e importador de planilha | 4 |
| Tabelas da vida associativa: `perfil_usuario`, `revisao_perfil`, `anuidade`, `comunicado`, `evento`, `inscricao_evento`, `beneficio`, `visualizacao_perfil` | 4 |
| Espaços de arquivo no Storage: `fotos` público e `documentos` privado | 4 |
| Políticas RLS de associado e admin — este plano cria apenas as de leitura pública | 4 |
| Área do associado: anuidade, carteirinha, comunicados, eventos | 4 |

**Uma dívida assumida:** o cabeçalho e o rodapé linkam para `/associacao`, que
só existe no Plano 3. Até lá o link leva a um 404. A alternativa seria uma
página vazia com texto de espera, o que é pior: promete conteúdo que não
existe. Se o site for ao ar antes do Plano 3, remova os dois links.
