# Especialidades (índice e página de cada especialidade) — plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `/medicos` e `/medicos/[especialidade]` ficam iguais ao desenho aprovado (`docs/desenho-aprovado/especialidades/`). O "Sobre a especialidade" passa a vir de um tipo novo do Sanity, "Texto de especialidade", com a trava da demonstração. O site deixa de ler `o_que_faz` e `quando_procurar` do Supabase.

**Architecture:**
- As decisões do grupo viram funções puras:
  - em `lib/especialidades.ts`: o ícone por slug, a ordem do índice, os pontos de quebra do nome, a linha de apoio, o título do "Sobre", o mês da revisão e a trava do "Sobre";
  - em `lib/encontre.ts`: a especialidade que o cartão do médico mostra.
- As duas faixas verdes reaproveitam o CSS da faixa da busca (`FaixaDaBusca.module.css`). Cada uma ganha uma folha própria com as diferenças do desenho, escritas com seletor mais pesado (`.indice[data-faixa]`, `.especialidade h1`), para valer qualquer que seja a ordem das folhas.
- A página da especialidade usa a `GradeMedicos` da busca, que passa a aceitar a especialidade a mostrar.
- O texto do "Sobre" é lido do Sanity por uma consulta com etiqueta de cache própria, invalidada pelo webhook.
- O CSS novo é **transcrito das regras do desenho** (o trecho do `<style>` depois do comentário "Fatia B · Especialidades"), trocando código de cor por token.

**Tech Stack:** Next.js 16 (App Router), React 19, Tailwind 4 (`@theme`), CSS Modules, Supabase, Sanity 6 (`next-sanity`, `@portabletext/react`), `groq-js`, Vitest, `@phosphor-icons/react/dist/ssr`.

**Spec:** `docs/superpowers/specs/2026-10-03-especialidades-design.md` — leia inteira antes de começar. É a autoridade.
- O desenho é a referência de todo valor visual. Quando o plano e o desenho discordarem num valor, vale o desenho. Ele está em:
  - `docs/desenho-aprovado/especialidades/especialidades.html`;
  - `docs/desenho-aprovado/especialidades/especialidade.html` (com `?sem-sobre` no endereço, a versão sem o "Sobre");
  - as fotos `.jpg` da mesma pasta.
- O relatório do desenho (`.superpowers/brainstorm/fatia-b-especialidades/relatorio.md`) tem as medidas: x=172, alturas dos cartões, ritmo e contrastes.
- As specs `2026-10-03-redesign-visual-design.md` e `2026-10-03-encontre-um-medico-design.md` continuam valendo.

**Diários:**
- grupo 1: `.superpowers/sdd/2026-10-03-encontre-um-medico/progress.md` (rulings 1 a 16);
- fatia A: `.superpowers/sdd/2026-10-03-redesign-fatia-a/progress.md`.

Os rulings que pesam aqui estão nas Global Constraints.

**Ramo:** `paginas-encontre`. Nada vai para a `main` antes de todos os grupos ficarem prontos.

## Global Constraints

Valem para toda tarefa, sem exceção.

**Do projeto (vêm da fatia A e do grupo 1 e continuam):**

- Texto que o usuário lê: português. Mensagens de commit: português **sem acento**.
- Este Next.js tem mudanças em relação ao que você conhece: antes de usar API do Next, leia o guia em `node_modules/next/dist/docs/`.
- **Nenhum número de contraste escrito de memória.** Os do relatório do desenho foram medidos em 03/10/2026; qualquer outro, meça.
- **Nenhum comentário promete o que o código não faz.**
  - Nenhum comentário aponta para `.superpowers/` nem para "tarefa N" deste plano.
  - Comentário que cita arquivo apagado nesta fatia é comentário falso: `grep` antes do commit.
- **Prove por mutação** toda asserção nova: quebre o código de propósito, veja o teste ficar vermelho, desfaça.
  - **Desfazer = regravar o conteúdo original** (Edit de volta, ou Write com o conteúdo que você leu antes).
  - **Nunca** `git checkout -- <arquivo>` nem `git restore`.
- **`core.autocrlf=true`, e o repositório mistura CRLF e LF.**
  - CRLF, entre os desta fatia: `lib/dados/especialidades.ts`, `lib/dados/facetas.ts`, `lib/sanity/consultas.ts`, `lib/sanity/tipos.ts`, `lib/sanity/etiquetasDoDocumento.ts`, `sanity/schemas/index.ts`, `components/base/Icone.tsx`, `testes/icones.test.ts`, `testes/rodape.test.ts`, `components/layout/Cabeceira.tsx`, `components/layout/BarraDoPe.tsx`, `components/layout/Rodape.module.css`, `app/(site)/medicos/page.tsx`, `vitest.config.ts`, `scripts/auditoria-visual.js`, `docs/estado-do-projeto.md`.
  - LF: `lib/encontre.ts`, `lib/barra-do-pe.ts`, `app/(site)/medicos/[especialidade]/page.tsx`, `app/(site)/encontre.module.css` e os testes novos.
  - Edite de forma cirúrgica (Edit). Arquivo existente só se regrava inteiro depois de lido, e só onde o passo manda.
  - Antes de cada commit, `git status --short` só pode listar arquivos da tarefa.
  - Um arquivo listado sem mudança de conteúdo (`git diff --ignore-cr-at-eol -- <arquivo>` vazio) é diferença só de fim de linha: regrave-o com o fim de linha original.
  - Faça `git add` arquivo por arquivo, nunca `git add -A`.
- **BOM:** `lib/dados/filtros.ts`, `lib/dados/medicos.ts`, `lib/dados/especialidades.ts` e `lib/dados/sinonimos.ts` começam com BOM (`﻿`). Mantenha.
- Rodar em toda tarefa: `npx vitest run` · `npx tsc --noEmit` · `npm run build`. Tudo verde antes do commit.
  - O `testTimeout` de 30s (`vitest.config.ts`) já cobre os testes que passam de 5s a frio. Não mexa nele.
- **O servidor de desenvolvimento da porta 3000 é do cliente: não derrube, não reinicie.** Só leitura nele.
  - Para medir em produção: `npm run build` e `npx next start -p 3300`.
  - No fim, derrube pelo PID. No Windows o filho sobrevive: `Get-NetTCPConnection -LocalPort 3300` acha o PID.
- Você **não** despacha subagentes.
- **Ruling 11:**
  - componente se testa por **renderização** (`renderToString`, ou `htmlDe` de `testes/renderizar.ts` para página com parte assíncrona);
  - lógica, por **função pura**;
  - ler o código como texto só vale para CSS e para a ligação com o navegador.
- **`sizes` das imagens pela largura desenhada.** A página da especialidade usa a grade da busca, com o `SIZES_DO_CARTAO` que já existe; nenhuma imagem nova nesta fatia.
- **Cores:**
  - nenhum tom creme ou quente (`testes/tom-quente.test.ts` varre o site);
  - efeito de mouse é borda mais escura, sombra neutra e 1px de subida; **nunca** verde claro.
- **Contraste:** todo texto a pelo menos 4,5:1.
- **Trava:** `NEXT_PUBLIC_DADOS_DEMONSTRACAO` só desliga com `"false"` exato (`lib/demonstracao.ts`).
- **"[PROVISÓRIO]" nunca aparece no site.**
- **O que o cliente recusou e não volta:**
  - fundo creme;
  - verde-limão claro como fundo;
  - sombra com tom de verde;
  - passar o mouse e ficar verde claro;
  - botão verde chapado ou quase preto;
  - caixa atrás de caixa;
  - celular que só empilha;
  - nada cortado na borda do celular;
  - espaços desiguais;
  - desalinhamento;
  - **a `Cabeceira` cinza nas páginas internas**.
- **Réguas:**
  - `--m` 48/28/20px, `--ritmo` 72/56/32px, `--gap` 24/16/12px;
  - `--borda-faixa` para as faixas de ponta a ponta;
  - quebras em 1180, 980, 700, 400 e 380px, como no desenho.
- **Tradução de cor do desenho para o site.** Use o token, nunca o código:

  | No desenho | No site |
  |---|---|
  | `--chao #EEF1EF` | `var(--color-canvas)` |
  | `--painel #FFFFFF` / `#fff` (inclusive a borda branca do `.esp`) | `var(--color-surface)` |
  | `--linha #E5E7EB` | `var(--color-line)` |
  | `#D1D5DB`, `#D5D9DF`, `#D9DDE3` (bordas e fios) | `var(--color-line-strong)` |
  | `#C9CED6` (borda do `.esp` no mouse) e `#C4C9D1` (borda da `.esp-seta` no mouse) | `var(--color-line-strong)`, como o `.botao-linha` (`app/globals.css`) e as parceiras (`EmpresasParceiras.module.css`) já fazem com `#C4C9D1` |
  | `--tinta #0c0e12` | `var(--color-ink-900)` |
  | `--tinta-2 #4F5661` | `var(--color-ink-600)` |
  | `--tinta-3 #646B75` | `var(--color-ink-400)` |
  | `--v800` / `--v600` | `var(--color-ami-green-800)` / `var(--color-ami-green-600)` |
  | `--lima #A8D470` | `var(--color-ami-lima-400)` |
  | `--sombra` | `var(--shadow-erguido)` |

  - Sombras do desenho com `rgba(16,24,40,…)`, `rgba(0,0,0,…)` e o vidro branco translúcido do `.esp-selo` (`rgba(255,255,255,…)`) vão como estão: são neutros.
  - O texto sobre o verde (`#cfd8c9`, o lima, o branco) não se escreve nesta fatia: vem das classes da faixa da busca.

**Da spec nova (fatia B, grupo 2):**

- **Toda decisão [sem o cliente] vai para `docs/decisoes-sem-o-cliente.md`.** Quem decide e executa é o cliente na volta; nada desta fatia vai para a `main`.
- `/medicos` e `/medicos/[especialidade]` ficam **sem `Cabeceira` e sem breadcrumb visível**.
- O índice fica **em ordem alfabética** e mostra só especialidade com médico.
- **Ícones por especialidade** (Phosphor duotone) pela tabela da spec, seção 1.4, ligados pelo `slug`. Especialidade sem ícone na tabela, inclusive uma nova, usa Stethoscope.
- **O cartão do médico mostra a especialidade DA PÁGINA**, com o RQE dela, quando o médico a tem.
  - Na busca e em "Outros médicos" do perfil, continua a principal.
  - O resto do cartão do grupo 1 não muda: só foto, nome, "MÉDICO · CRM/UF nnnnn", a especialidade com RQE e "Ligar".
- **Texto do "Sobre"**: tipo novo no Sanity, "Texto de especialidade". Campos, todos obrigatórios:
  - `especialidade` (o slug, único);
  - `oQueFaz`;
  - `quandoProcurar`;
  - `revisorNome`;
  - `revisorCrm` ("CRM/MA 12345");
  - `revisadoEm` (data).
- **O site deixa de ler `o_que_faz` e `quando_procurar` do Supabase.** As colunas ficam no banco.
- **Trava do "Sobre":**
  - com o texto completo no Sanity, o bloco aparece nos dois modos;
  - sem texto, aparece só na demonstração, com "Texto da AMI a entrar." no lugar dos dois textos e sem a linha do revisor;
  - fora da demonstração e sem texto, o bloco não existe, e a grade termina a `--ritmo` do rodapé.
- **Sem "Outras especialidades".**
- **Metadados:**
  - o título, a descrição e o canonical das duas páginas ficam;
  - a página da especialidade continua pré-renderizada (`generateStaticParams` e `revalidate`), sem ler `searchParams`.
- **Marcas para a auditoria:**
  - todo bloco de primeiro nível leva `data-bloco`:
    - índice: `topo`, `especialidades`;
    - especialidade: `topo`, `medicos`, `sobre`;
  - o primeiro texto de cada bloco que fica na coluna do texto leva `data-coluna`;
  - a faixa de ponta a ponta leva `data-faixa`;
  - o cartão de especialidade leva `data-cartao-de-especialidade`, o nome dele `data-nome` e a contagem `data-contagem`.

---

## Mapa de arquivos

| Arquivo | O que é | Tarefa |
|---|---|---|
| `lib/especialidades.ts` (novo) | funções puras do índice e da página da especialidade | 1 |
| `lib/encontre.ts` | `especialidadeDoCartao`; `opcoesDeEspecialidade` usa `especialidadesComMedico` | 1 |
| `lib/sanity/tipos.ts` | tipo `TextoDeEspecialidade` | 1 |
| `components/base/Icone.tsx` | 11 ícones novos | 1 |
| `sanity/schemas/textoDeEspecialidade.ts` (novo), `sanity/schemas/index.ts` | o tipo novo no Studio | 2 |
| `lib/sanity/consultas.ts` | GROQ, etiqueta, `paraTextoDeEspecialidade`, `textoDaEspecialidade` | 2 |
| `lib/sanity/etiquetasDoDocumento.ts` | webhook invalida os textos | 2 |
| `components/diretorio/CartaoMedico.tsx`, `GradeMedicos.tsx` | aceitam `especialidade` | 3 |
| `components/especialidades/FaixaDoIndice.tsx` + `.module.css` (novos) | faixa do índice | 4 |
| `components/especialidades/GradeDeEspecialidades.tsx` + `.module.css` (novos) | contagem e cartões do índice | 4 |
| `app/(site)/medicos/page.tsx` | reescrita | 4 |
| `components/diretorio/IndiceEspecialidades.tsx` | apagado | 4 |
| `lib/barra-do-pe.ts`, `components/layout/BarraDoPe.tsx` | `/medicos` leva ao campo da própria página | 4 |
| `components/especialidades/FaixaDaEspecialidade.tsx` + `.module.css` (novos) | faixa da especialidade | 5 |
| `components/especialidades/MedicosDaEspecialidade.tsx` (novo) | contagem e grade de médicos | 5 |
| `components/especialidades/SobreAEspecialidade.tsx` + `.module.css` (novos) | "Sobre a {especialidade}" | 5 |
| `app/(site)/medicos/[especialidade]/page.tsx` | reescrita | 6 |
| `lib/dados/facetas.ts` | parágrafo curto da spec | 6 |
| `lib/dados/especialidades.ts` | `especialidadePorSlug` só com nome e slug | 6 |
| `app/(site)/encontre.module.css`, `components/layout/Cabeceira.tsx` (comentários) | quem usa | 4, 6 |
| `components/layout/Rodape.module.css` (comentário) | o "Sobre" é faixa | 6 |
| `scripts/auditoria-visual.js` | conferência 14 (cartões de especialidade) | 7 |
| `vitest.config.ts` (comentário), `docs/estado-do-projeto.md`, `docs/decisoes-sem-o-cliente.md` | conferência e registro | 7 |

Testes novos:

| Teste | Tarefa |
|---|---|
| `testes/especialidades.test.ts` | 1 |
| `testes/textos-de-especialidade.test.ts` | 2 |
| `testes/indice-de-especialidades.test.ts` | 4 |
| `testes/blocos-da-especialidade.test.ts` | 5 |
| `testes/pagina-de-especialidade.test.ts` | 6 |
| `testes/especialidade-por-slug.test.ts` | 6 |

Testes alterados:

| Teste | Tarefa |
|---|---|
| `testes/encontre.test.ts` | 1 |
| `testes/icones.test.ts` | 1 |
| `testes/sanity-schemas.test.ts` | 2 |
| `testes/revalidar.test.ts` | 2 |
| `testes/cartao-medico.test.ts` | 3 |
| `testes/rodape.test.ts` | 4 |
| `testes/facetas.test.ts` | 6 |
| `testes/sem-bairros.test.ts` | 6 |
| `testes/porta-da-busca.test.ts` | 6 |
| `testes/especialidade-metadados.test.ts` | 6 |

**Ordem das tarefas, e por que difere da decomposição sugerida:**
- A página da especialidade foi partida em duas tarefas. A 5 faz os três blocos como componentes, com teste de renderização e CSS. A 6 liga a página, o parágrafo e a leitura do banco.
- O parágrafo de abertura e o fim da leitura de `o_que_faz` só podem mudar junto com a página, porque a página de hoje usa os dois. Sem isso, a compilação quebra entre as tarefas.

---

### Task 1: Funções puras e os ícones novos

**Files:**
- Create: `lib/especialidades.ts`
- Create: `testes/especialidades.test.ts`
- Modify: `lib/encontre.ts` (`especialidadeDoCartao`, e `opcoesDeEspecialidade` passa a usar `especialidadesComMedico`)
- Modify: `testes/encontre.test.ts`
- Modify: `lib/sanity/tipos.ts` (tipo `TextoDeEspecialidade`, no fim)
- Modify: `components/base/Icone.tsx`, `testes/icones.test.ts`

**Interfaces:**
- Produces (`lib/sanity/tipos.ts`):

```ts
export type TextoDeEspecialidade = {
  oQueFaz: PortableTextBlock[];
  quandoProcurar: PortableTextBlock[];
  revisorNome: string;
  revisorCrm: string;
  /** O mês da revisão por extenso: "setembro de 2026". */
  mesDaRevisao: string;
};
```

- Produces (`lib/especialidades.ts`):

```ts
export const ICONE_PADRAO: NomeIcone; // "estetoscopio"
export function iconeDaEspecialidade(slug: string): NomeIcone;
export function especialidadesComMedico(lista: EspecialidadeComContagem[]): EspecialidadeComContagem[];
export function nomeComQuebras(nome: string): string;
export function linhaDeApoioDoIndice(medicos: number): string;
export function tituloDoSobre(especialidade: string): string;
export function mesDeAno(data: string | null | undefined): string | null;
export type SobreNaTela = { tipo: "texto"; texto: TextoDeEspecialidade } | { tipo: "a-entrar" };
export function sobreDaEspecialidade(demonstracao: boolean, texto: TextoDeEspecialidade | null): SobreNaTela | null;
```

- Produces (`lib/encontre.ts`): `export function especialidadeDoCartao(m: Pick<Medico, "especialidades">, slug?: string | null): EspecialidadeDoMedico | null;`
- Produces (`components/base/Icone.tsx`): `NomeIcone` ganha 11 nomes:

  | Nome | Phosphor |
  |---|---|
  | `"palma"` | `HandPalm` |
  | `"meiaGota"` | `DropHalf` |
  | `"garfoEFaca"` | `ForkKnife` |
  | `"feminino"` | `GenderFemale` |
  | `"cerebro"` | `Brain` |
  | `"osso"` | `Bone` |
  | `"orelha"` | `Ear` |
  | `"bebe"` | `Baby` |
  | `"conversa"` | `ChatsCircle` |
  | `"mao"` | `Hand` |
  | `"gota"` | `Drop` |

  Os 11 existem no `@phosphor-icons/react` 2.1.10 instalado (conferido em `node_modules/@phosphor-icons/react/dist/ssr/`).

- [ ] **Step 1: Os testes das funções puras**

`testes/especialidades.test.ts`:

```ts
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { Icon } from "@phosphor-icons/react";
import {
  Baby,
  Bone,
  Brain,
  ChatsCircle,
  Drop,
  DropHalf,
  Ear,
  Eye,
  ForkKnife,
  GenderFemale,
  Hand,
  HandPalm,
  Heartbeat,
  Stethoscope,
} from "@phosphor-icons/react/dist/ssr";
import type { PortableTextBlock } from "@portabletext/react";
import { Icone } from "@/components/base/Icone";
import {
  ICONE_PADRAO,
  especialidadesComMedico,
  iconeDaEspecialidade,
  linhaDeApoioDoIndice,
  mesDeAno,
  nomeComQuebras,
  sobreDaEspecialidade,
  tituloDoSobre,
} from "@/lib/especialidades";
import type { TextoDeEspecialidade } from "@/lib/sanity/tipos";

/*
  As decisões do índice de especialidades e da página de cada uma, em
  funções puras. Os textos esperados são os da spec de Especialidades
  (docs/superpowers/specs/2026-10-03-especialidades-design.md).
*/

describe("o ícone de cada especialidade", () => {
  /* A tabela da spec, seção 1.4, escrita aqui de novo, do slug ao componente
     Phosphor: comparar o desenho que sai com o do componente é o que pega
     dois ícones trocados de lugar. */
  const TABELA: [string, Icon][] = [
    ["cardiologia", Heartbeat],
    ["clinica-medica", Stethoscope],
    ["dermatologia", HandPalm],
    ["endocrinologia", DropHalf],
    ["gastroenterologia", ForkKnife],
    ["ginecologia-e-obstetricia", GenderFemale],
    ["neurologia", Brain],
    ["oftalmologia", Eye],
    ["ortopedia-e-traumatologia", Bone],
    ["otorrinolaringologia", Ear],
    ["pediatria", Baby],
    ["psiquiatria", ChatsCircle],
    ["reumatologia", Hand],
    ["urologia", Drop],
  ];
  const desenho = (Componente: Icon) =>
    renderToString(
      createElement(Componente, { size: 20, weight: "duotone", className: "", "aria-hidden": "true" }),
    );

  it("cada especialidade da tabela desenha o ícone dela, em duotone", () => {
    for (const [slug, Componente] of TABELA) {
      const nosso = renderToString(createElement(Icone, { nome: iconeDaEspecialidade(slug), duotone: true }));
      expect(nosso, slug).toBe(desenho(Componente));
    }
  });

  it("especialidade sem ícone na tabela, inclusive uma nova, fica com o estetoscópio", () => {
    expect(ICONE_PADRAO).toBe("estetoscopio");
    /* "constructor" e "toString" existem em todo objeto comum do JavaScript:
       uma tabela feita de objeto devolveria uma função, e não um ícone. */
    for (const slug of ["angiologia", "medicina-do-trabalho", "", "constructor", "toString"]) {
      expect(iconeDaEspecialidade(slug), slug).toBe(ICONE_PADRAO);
    }
  });
});

describe("as especialidades do índice", () => {
  const lista = [
    { nome: "Pediatria", slug: "pediatria", total: 3 },
    { nome: "Ortopedia e Traumatologia", slug: "ortopedia-e-traumatologia", total: 2 },
    { nome: "Urologia", slug: "urologia", total: 0 },
    { nome: "Clínica Médica", slug: "clinica-medica", total: 4 },
    { nome: "Cardiologia", slug: "cardiologia", total: 3 },
  ];

  it("em ordem alfabética do português, só as que têm médico", () => {
    expect(especialidadesComMedico(lista).map((e) => e.slug)).toEqual([
      "cardiologia",
      "clinica-medica",
      "ortopedia-e-traumatologia",
      "pediatria",
    ]);
  });

  it("não mexe na lista recebida", () => {
    const copia = structuredClone(lista);
    especialidadesComMedico(lista);
    expect(lista).toEqual(copia);
  });
});

describe("o nome com os pontos de quebra", () => {
  it("os seis nomes longos do desenho ganham o hífen opcional no lugar dele", () => {
    expect(nomeComQuebras("Dermatologia")).toBe("Dermato­logia");
    expect(nomeComQuebras("Endocrinologia")).toBe("Endocrino­logia");
    expect(nomeComQuebras("Gastroenterologia")).toBe("Gastro­enterologia");
    expect(nomeComQuebras("Oftalmologia")).toBe("Oftalmo­logia");
    expect(nomeComQuebras("Otorrinolaringologia")).toBe("Otorrino­laringologia");
    expect(nomeComQuebras("Reumatologia")).toBe("Reumato­logia");
  });

  it("os outros ficam como estão; nome de várias palavras quebra no espaço", () => {
    for (const nome of ["Cardiologia", "Neurologia", "Pediatria", "Ginecologia e Obstetrícia", "Angiologia"]) {
      expect(nomeComQuebras(nome), nome).toBe(nome);
    }
  });

  it("tirado o hífen opcional, o nome volta a ser o mesmo", () => {
    for (const nome of ["Otorrinolaringologia", "Clínica Médica", "Gastroenterologia"]) {
      expect(nomeComQuebras(nome).replaceAll("­", "")).toBe(nome);
    }
  });
});

describe("as frases geradas dos dados", () => {
  it("a linha de apoio do índice, a da spec", () => {
    expect(linhaDeApoioDoIndice(24)).toBe(
      "24 médicos associados, cada um com o número de registro no CRM. Escolha a área para ver quem atende.",
    );
  });

  it("com um médico só, sem o partitivo", () => {
    expect(linhaDeApoioDoIndice(1)).toBe(
      "1 médico associado, com o número de registro no CRM. Escolha a área para ver quem atende.",
    );
  });

  it("o título do Sobre, com o nome da especialidade em minúsculas", () => {
    expect(tituloDoSobre("Cardiologia")).toBe("Sobre a cardiologia");
    expect(tituloDoSobre("Ginecologia e Obstetrícia")).toBe("Sobre a ginecologia e obstetrícia");
    expect(tituloDoSobre("Clínica Médica")).toBe("Sobre a clínica médica");
  });
});

describe("o mês da revisão", () => {
  it("a data do Studio vira mês e ano por extenso", () => {
    expect(mesDeAno("2026-09-15")).toBe("setembro de 2026");
    expect(mesDeAno("2026-01-01")).toBe("janeiro de 2026");
    expect(mesDeAno("2025-12-31")).toBe("dezembro de 2025");
    expect(mesDeAno("2026-03-10")).toBe("março de 2026");
  });

  it("sem data, ou data fora do formato do Studio, nada", () => {
    for (const ruim of [null, undefined, "", "2026-13-01", "2026-00-10", "15/09/2026", "2026-9-1", "2026-09-15T10:00:00Z"]) {
      expect(mesDeAno(ruim), String(ruim)).toBeNull();
    }
  });
});

describe("a trava do Sobre", () => {
  const bloco = (texto: string) =>
    ({
      _type: "block",
      _key: "b",
      style: "normal",
      markDefs: [],
      children: [{ _type: "span", _key: "s", text: texto, marks: [] }],
    }) as PortableTextBlock;
  const TEXTO: TextoDeEspecialidade = {
    oQueFaz: [bloco("Cuida do coração.")],
    quandoProcurar: [bloco("Falta de ar.")],
    revisorNome: "Dra. Exemplo Revisora",
    revisorCrm: "CRM/MA 10000",
    mesDaRevisao: "setembro de 2026",
  };

  it("com o texto completo, o bloco sai nos dois modos", () => {
    expect(sobreDaEspecialidade(true, TEXTO)).toEqual({ tipo: "texto", texto: TEXTO });
    expect(sobreDaEspecialidade(false, TEXTO)).toEqual({ tipo: "texto", texto: TEXTO });
  });

  it("sem texto, só na demonstração, e como texto a entrar", () => {
    expect(sobreDaEspecialidade(true, null)).toEqual({ tipo: "a-entrar" });
  });

  it("sem texto e fora da demonstração, o bloco não existe", () => {
    expect(sobreDaEspecialidade(false, null)).toBeNull();
  });
});
```

Em `testes/encontre.test.ts`:

1. Acrescente `especialidadeDoCartao,` ao import de `@/lib/encontre`, em ordem alfabética, depois de `enderecoDoLocal,`.
2. Acrescente, no fim do arquivo:

```ts
describe("a especialidade do cartão", () => {
  const aline = medico("Aline Peixoto", null, {
    especialidades: [
      { nome: "Neurologia", slug: "neurologia", rqe: "12222", principal: true },
      { nome: "Ortopedia e Traumatologia", slug: "ortopedia-e-traumatologia", rqe: "30111", principal: false },
    ],
  });

  it("na página de uma especialidade que o médico tem, a dela, com o RQE dela", () => {
    expect(especialidadeDoCartao(aline, "ortopedia-e-traumatologia")).toEqual({
      nome: "Ortopedia e Traumatologia",
      slug: "ortopedia-e-traumatologia",
      rqe: "30111",
      principal: false,
    });
  });

  it("fora de uma página de especialidade (a busca, o perfil), a principal", () => {
    expect(especialidadeDoCartao(aline)?.slug).toBe("neurologia");
    expect(especialidadeDoCartao(aline, null)?.slug).toBe("neurologia");
  });

  it("na página de uma especialidade que ele não tem, a principal", () => {
    expect(especialidadeDoCartao(aline, "pediatria")?.slug).toBe("neurologia");
  });

  it("sem especialidade nenhuma, null", () => {
    expect(especialidadeDoCartao(medico("Sem Nada", null), "pediatria")).toBeNull();
  });
});
```

Em `testes/icones.test.ts`:

1. Acrescente ao import de `@phosphor-icons/react/dist/ssr`, em ordem alfabética, os nomes `Baby, Bone, Brain, ChatsCircle, Drop, DropHalf, Ear, ForkKnife, GenderFemale, Hand, HandPalm`.
2. Acrescente ao objeto `esperado`, depois de `abaixo: CaretDown,`:

```ts
      palma: HandPalm,
      meiaGota: DropHalf,
      garfoEFaca: ForkKnife,
      feminino: GenderFemale,
      cerebro: Brain,
      osso: Bone,
      orelha: Ear,
      bebe: Baby,
      conversa: ChatsCircle,
      mao: Hand,
      gota: Drop,
```

3. Troque o fim do teste:

```ts
    /* E os 22 são diferentes entre si: nenhum par repetido na tabela. */
    const htmls = Object.keys(esperado).map((nome) => renderToString(createElement(Icone, { nome: nome as NomeIcone })));
    expect(new Set(htmls).size).toBe(22);
```

por

```ts
    /* E os 33 são diferentes entre si: nenhum par repetido na tabela. */
    const htmls = Object.keys(esperado).map((nome) => renderToString(createElement(Icone, { nome: nome as NomeIcone })));
    expect(new Set(htmls).size).toBe(33);
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run testes/especialidades.test.ts testes/encontre.test.ts testes/icones.test.ts`
Expected: FAIL. `lib/especialidades` não existe, `especialidadeDoCartao` não existe, e os ícones novos não estão no `Icone`.

- [ ] **Step 3: O tipo do texto**

Em `lib/sanity/tipos.ts` (CRLF), no fim do arquivo:

```ts

/*
  O texto "Sobre a {especialidade}" da página de cada especialidade, como o
  site o desenha: o que o especialista faz e quando procurar, em texto rico
  (parágrafos e lista), quem revisou, o CRM dele e o mês da revisão, já por
  extenso.
*/
export type TextoDeEspecialidade = {
  oQueFaz: PortableTextBlock[];
  quandoProcurar: PortableTextBlock[];
  /** Como a AMI escreveu no Studio: "Dra. Maria da Silva". */
  revisorNome: string;
  /** "CRM/MA 10822". */
  revisorCrm: string;
  /** O mês da revisão por extenso: "setembro de 2026". */
  mesDaRevisao: string;
};
```

- [ ] **Step 4: Os ícones**

Em `components/base/Icone.tsx` (CRLF):

1. Acrescente ao import de `@phosphor-icons/react/dist/ssr`, depois de `CaretDown,`:

```ts
  HandPalm,
  DropHalf,
  ForkKnife,
  GenderFemale,
  Brain,
  Bone,
  Ear,
  Baby,
  ChatsCircle,
  Hand,
  Drop,
```

2. Acrescente ao tipo `NomeIcone`, depois de `| "abaixo"`, e mova o `;` para a última linha:

```ts
  | "palma"
  | "meiaGota"
  | "garfoEFaca"
  | "feminino"
  | "cerebro"
  | "osso"
  | "orelha"
  | "bebe"
  | "conversa"
  | "mao"
  | "gota";
```

3. Acrescente ao `mapaDeIcones`, depois de `abaixo: CaretDown,`:

```ts
  palma: HandPalm,
  meiaGota: DropHalf,
  garfoEFaca: ForkKnife,
  feminino: GenderFemale,
  cerebro: Brain,
  osso: Bone,
  orelha: Ear,
  bebe: Baby,
  conversa: ChatsCircle,
  mao: Hand,
  gota: Drop,
```

- [ ] **Step 5: `lib/especialidades.ts`**

```ts
import type { NomeIcone } from "@/components/base/Icone";
import type { EspecialidadeComContagem } from "@/lib/dados/tipos";
import type { TextoDeEspecialidade } from "@/lib/sanity/tipos";

/*
  O que o índice de especialidades (/medicos) e a página de cada
  especialidade decidem, em funções puras. Ficam fora dos componentes para
  serem testadas sem navegador (testes/especialidades.test.ts):
  - o ícone;
  - a ordem;
  - os pontos de quebra do nome;
  - as frases geradas dos dados;
  - o mês da revisão;
  - a trava do "Sobre".

  Não confundir com lib/dados/especialidades.ts, que lê o banco.
*/

/** O ícone de especialidade sem ícone próprio, inclusive de uma nova que a AMI cadastrar. */
export const ICONE_PADRAO: NomeIcone = "estetoscopio";

/*
  O ícone de cada especialidade, pelo slug, como a spec escolheu (Phosphor,
  duotone). Clínica Médica usa o estetoscópio, que também é o padrão.
  É um `Map`, e não um objeto: num objeto, "constructor" e "toString"
  existiriam como chave e devolveriam uma função no lugar do ícone.
*/
const ICONES = new Map<string, NomeIcone>([
  ["cardiologia", "batimento"],
  ["clinica-medica", "estetoscopio"],
  ["dermatologia", "palma"],
  ["endocrinologia", "meiaGota"],
  ["gastroenterologia", "garfoEFaca"],
  ["ginecologia-e-obstetricia", "feminino"],
  ["neurologia", "cerebro"],
  ["oftalmologia", "olho"],
  ["ortopedia-e-traumatologia", "osso"],
  ["otorrinolaringologia", "orelha"],
  ["pediatria", "bebe"],
  ["psiquiatria", "conversa"],
  ["reumatologia", "mao"],
  ["urologia", "gota"],
]);

export function iconeDaEspecialidade(slug: string): NomeIcone {
  return ICONES.get(slug) ?? ICONE_PADRAO;
}

/**
 * As especialidades que têm médico, em ordem alfabética do português: o
 * índice de especialidades e a lista "Todas as especialidades" da busca.
 */
export function especialidadesComMedico(
  lista: EspecialidadeComContagem[],
): EspecialidadeComContagem[] {
  return lista
    .filter((e) => e.total > 0)
    .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
}

/*
  Os nomes longos que o desenho quebra com hífen opcional (U+00AD), no
  ponto em que a palavra se divide bem. Sem ele, a 375px "Otorrinolaringologia"
  não cabe no cartão. Um nome que não está aqui quebra no espaço, e uma
  palavra que não caiba quebra onde der (`overflow-wrap` do `body`,
  app/globals.css).
*/
const QUEBRAS = new Map<string, string>([
  ["Dermatologia", "Dermato­logia"],
  ["Endocrinologia", "Endocrino­logia"],
  ["Gastroenterologia", "Gastro­enterologia"],
  ["Oftalmologia", "Oftalmo­logia"],
  ["Otorrinolaringologia", "Otorrino­laringologia"],
  ["Reumatologia", "Reumato­logia"],
]);

/** O nome da especialidade com o hífen opcional nas palavras longas. */
export function nomeComQuebras(nome: string): string {
  return nome
    .split(" ")
    .map((palavra) => QUEBRAS.get(palavra) ?? palavra)
    .join(" ");
}

/** A linha de apoio da faixa do índice, com o total de médicos. */
export function linhaDeApoioDoIndice(medicos: number): string {
  const quem =
    medicos === 1
      ? "1 médico associado, com o número de registro no CRM."
      : `${medicos} médicos associados, cada um com o número de registro no CRM.`;
  return `${quem} Escolha a área para ver quem atende.`;
}

/** "Sobre a cardiologia": o nome em minúsculas, como no desenho. */
export function tituloDoSobre(especialidade: string): string {
  return `Sobre a ${especialidade.toLocaleLowerCase("pt-BR")}`;
}

const MESES = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
];

/**
 * "2026-09-15", a data do campo de data do Studio, vira "setembro de 2026".
 * Lê o texto, sem `Date`: data sem hora lida como instante muda de dia
 * conforme o fuso de quem roda, e aqui só interessam o mês e o ano. Fora do
 * formato do Studio, null.
 */
export function mesDeAno(data: string | null | undefined): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(data ?? "");
  if (!m) return null;
  const mes = Number(m[2]);
  if (mes < 1 || mes > 12) return null;
  return `${MESES[mes - 1]} de ${m[1]}`;
}

/** O que o bloco "Sobre a {especialidade}" desenha: o texto da AMI, ou o "a entrar". */
export type SobreNaTela =
  | { tipo: "texto"; texto: TextoDeEspecialidade }
  | { tipo: "a-entrar" };

/**
 * A trava do "Sobre", a mesma das outras molduras (lib/molduras.ts):
 * - com o texto completo, ele sai nos dois modos;
 * - sem texto, só na demonstração, e como "a entrar";
 * - fora dela, o bloco não existe (null).
 */
export function sobreDaEspecialidade(
  demonstracao: boolean,
  texto: TextoDeEspecialidade | null,
): SobreNaTela | null {
  if (texto) return { tipo: "texto", texto };
  return demonstracao ? { tipo: "a-entrar" } : null;
}
```

- [ ] **Step 6: A especialidade do cartão**

Em `lib/encontre.ts` (LF):

1. Acrescente ao topo, depois de `import { contagem } from "@/lib/formato";`:

```ts
import { especialidadesComMedico } from "@/lib/especialidades";
```

2. Depois da função `especialidadePrincipal`, acrescente:

```ts

/**
 * A especialidade que o cartão do médico mostra. Na página de uma
 * especialidade (`slug`), é a dela, com o RQE dela, quando o médico a tem;
 * fora dela, ou se ele não a tem, é a principal.
 */
export function especialidadeDoCartao(
  m: Pick<Medico, "especialidades">,
  slug: string | null = null,
): EspecialidadeDoMedico | null {
  const daPagina = slug ? m.especialidades.find((e) => e.slug === slug) : undefined;
  return daPagina ?? especialidadePrincipal(m);
}
```

3. Troque o corpo de `opcoesDeEspecialidade`:

```ts
  return lista
    .filter((e) => e.total > 0)
    .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"))
    .map((e) => ({ valor: e.slug, rotulo: `${e.nome} (${e.total})` }));
```

por

```ts
  return especialidadesComMedico(lista).map((e) => ({
    valor: e.slug,
    rotulo: `${e.nome} (${e.total})`,
  }));
```

- [ ] **Step 7: Rodar, provar por mutação, commit**

Run: `npx vitest run` · `npx tsc --noEmit` · `npm run build` → verde.

Mutações, uma de cada vez, regravando o original depois. Cada uma deixa um teste vermelho:

1. Troque `"osso"` e `"mao"` de lugar no `Map` de ícones.
2. Troque o `Map` de ícones por um objeto comum, com `ICONES[slug] ?? ICONE_PADRAO`.
3. Tire o `.filter` de `especialidadesComMedico`.
4. Tire o `.sort` de `especialidadesComMedico`.
5. Troque `MESES[mes - 1]` por `MESES[mes]`.
6. Em `sobreDaEspecialidade`, troque `demonstracao ?` por `true ?`.
7. Tire a linha de `"Gastroenterologia"` de `QUEBRAS`.
8. Em `especialidadeDoCartao`, devolva sempre `especialidadePrincipal(m)`.
9. Troque `gota: Drop` por `gota: DropHalf` no `Icone.tsx`.
10. Em `linhaDeApoioDoIndice`, troque `medicos === 1` por `medicos === 0`.

```bash
git add lib/especialidades.ts testes/especialidades.test.ts lib/encontre.ts testes/encontre.test.ts lib/sanity/tipos.ts components/base/Icone.tsx testes/icones.test.ts
git commit -m "Funcoes puras de Especialidades: icone por slug, ordem, quebras, frases, mes da revisao, trava do Sobre e especialidade do cartao"
```

---

### Task 2: O tipo "Texto de especialidade" no Sanity

**Files:**
- Create: `sanity/schemas/textoDeEspecialidade.ts`
- Modify: `sanity/schemas/index.ts`
- Modify: `lib/sanity/consultas.ts` (GROQ, etiqueta, tipo cru, `paraTextoDeEspecialidade`, `textoDaEspecialidade`)
- Modify: `lib/sanity/etiquetasDoDocumento.ts`
- Create: `testes/textos-de-especialidade.test.ts`
- Modify: `testes/sanity-schemas.test.ts`, `testes/revalidar.test.ts`

**Interfaces:**
- Consumes: `TextoDeEspecialidade` (`lib/sanity/tipos.ts`); `mesDeAno` (`lib/especialidades.ts`) (Task 1).
- Produces (`lib/sanity/consultas.ts`):

```ts
export const ETIQUETA_TEXTOS_DE_ESPECIALIDADE = "textos-de-especialidade";
export const GROQ_TEXTO_DE_ESPECIALIDADE: string; // parâmetro $especialidade
export type TextoDeEspecialidadeCru = {
  oQueFaz: PortableTextBlock[] | null;
  quandoProcurar: PortableTextBlock[] | null;
  revisorNome: string | null;
  revisorCrm: string | null;
  revisadoEm: string | null;
};
export function paraTextoDeEspecialidade(cru: TextoDeEspecialidadeCru | null): TextoDeEspecialidade | null;
export async function textoDaEspecialidade(especialidade: string): Promise<TextoDeEspecialidade | null>;
```

- Produces (`sanity/schemas/textoDeEspecialidade.ts`): `export const textoDeEspecialidade`.
  - `name: "textoDeEspecialidade"`, `title: "Texto de especialidade"`.
  - Campos, nesta ordem:

    | Campo | Tipo |
    |---|---|
    | `especialidade` | `slug` |
    | `oQueFaz` | `array` de `block` |
    | `quandoProcurar` | `array` de `block` |
    | `revisorNome` | `string` |
    | `revisorCrm` | `string` |
    | `revisadoEm` | `date` |

- Produces (`etiquetasDoDocumento`): `{ _type: "textoDeEspecialidade" }` → `["textos-de-especialidade"]`.

- [ ] **Step 1: Os testes da consulta e da montagem**

`testes/textos-de-especialidade.test.ts`:

```ts
import { evaluate, parse } from "groq-js";
import { describe, expect, it } from "vitest";
import {
  ETIQUETA_TEXTOS_DE_ESPECIALIDADE,
  GROQ_TEXTO_DE_ESPECIALIDADE,
  paraTextoDeEspecialidade,
  type TextoDeEspecialidadeCru,
} from "@/lib/sanity/consultas";

/*
  O texto "Sobre a especialidade", do banco do Sanity até o que a página
  desenha.

  A consulta é executada de verdade com `groq-js`, sobre documentos que o
  teste escreve, como em testes/parceiras-consulta.test.ts. Assim se vê
  QUAL documento o filtro escolhe e O QUE a projeção devolve. Depois,
  `paraTextoDeEspecialidade` (função pura) confere se o texto está completo
  e escreve o mês da revisão. Não prova o Sanity de verdade (cache,
  permissões, rascunhos): só o GROQ e a montagem.

  Nomes e textos de mentira, todos.
*/

const bloco = (texto: string, extra: Record<string, unknown> = {}) => ({
  _type: "block",
  _key: `b-${texto.length}`,
  style: "normal",
  markDefs: [],
  children: [{ _type: "span", _key: "s", text: texto, marks: [] }],
  ...extra,
});
const item = (texto: string) => bloco(texto, { listItem: "bullet", level: 1 });

const COMPLETO = {
  oQueFaz: [bloco("Cuida do coração e dos vasos.")],
  quandoProcurar: [item("Falta de ar."), item("Pressão alta."), bloco("Dor forte no peito: ligue 192.")],
  revisorNome: "Dra. Exemplo Revisora",
  revisorCrm: "CRM/MA 10000",
  revisadoEm: "2026-09-15",
};

const slug = (current: string) => ({ _type: "slug", current });

const DOCUMENTOS = [
  {
    _type: "textoDeEspecialidade",
    _id: "cardio",
    _updatedAt: "2026-09-20T10:00:00Z",
    especialidade: slug("cardiologia"),
    ...COMPLETO,
  },
  /* Dois da mesma especialidade (o Studio recusa, mas um documento pode
     chegar por fora dele): vale o atualizado por último. */
  {
    _type: "textoDeEspecialidade",
    _id: "pediatria-antigo",
    _updatedAt: "2026-09-01T10:00:00Z",
    especialidade: slug("pediatria"),
    ...COMPLETO,
    revisorNome: "Revisora Antiga",
  },
  {
    _type: "textoDeEspecialidade",
    _id: "pediatria-novo",
    _updatedAt: "2026-09-10T10:00:00Z",
    especialidade: slug("pediatria"),
    ...COMPLETO,
    revisorNome: "Revisora Nova",
  },
  /* Incompleto: só o "O que faz". */
  {
    _type: "textoDeEspecialidade",
    _id: "urologia",
    _updatedAt: "2026-09-10T10:00:00Z",
    especialidade: slug("urologia"),
    oQueFaz: [bloco("Cuida do trato urinário.")],
  },
  /* Outro tipo de documento, com os mesmos campos. */
  { _type: "banner", _id: "banner", especialidade: slug("neurologia"), ...COMPLETO },
];

async function consultar(especialidade: string): Promise<TextoDeEspecialidadeCru | null> {
  const valor = await evaluate(parse(GROQ_TEXTO_DE_ESPECIALIDADE), {
    dataset: DOCUMENTOS,
    params: { especialidade },
  });
  return (await valor.get()) as TextoDeEspecialidadeCru | null;
}

describe("a consulta do texto (GROQ_TEXTO_DE_ESPECIALIDADE)", () => {
  it("devolve o texto da especialidade pedida, com os cinco campos que a página usa", async () => {
    expect(await consultar("cardiologia")).toEqual(COMPLETO);
  });

  it("outra especialidade e outro tipo de documento não entram", async () => {
    expect(await consultar("neurologia")).toBeNull();
    expect(await consultar("inexistente")).toBeNull();
  });

  it("com dois textos da mesma especialidade, vale o atualizado por último", async () => {
    expect((await consultar("pediatria"))?.revisorNome).toBe("Revisora Nova");
  });

  it("o que falta sai nulo, e não some do objeto", async () => {
    expect(await consultar("urologia")).toEqual({
      oQueFaz: [bloco("Cuida do trato urinário.")],
      quandoProcurar: null,
      revisorNome: null,
      revisorCrm: null,
      revisadoEm: null,
    });
  });

  it("a etiqueta de cache é a que o webhook invalida", () => {
    expect(ETIQUETA_TEXTOS_DE_ESPECIALIDADE).toBe("textos-de-especialidade");
  });
});

describe("paraTextoDeEspecialidade", () => {
  const cru = (o: Partial<TextoDeEspecialidadeCru> = {}): TextoDeEspecialidadeCru =>
    ({ ...COMPLETO, ...o }) as unknown as TextoDeEspecialidadeCru;

  it("completo: os textos como vieram, os nomes aparados e o mês por extenso", () => {
    expect(paraTextoDeEspecialidade(cru({ revisorNome: "  Dra. Exemplo Revisora \n" }))).toEqual({
      oQueFaz: COMPLETO.oQueFaz,
      quandoProcurar: COMPLETO.quandoProcurar,
      revisorNome: "Dra. Exemplo Revisora",
      revisorCrm: "CRM/MA 10000",
      mesDaRevisao: "setembro de 2026",
    });
  });

  it("sem documento, nada", () => {
    expect(paraTextoDeEspecialidade(null)).toBeNull();
  });

  it("qualquer um dos cinco faltando, nada: o texto só sai completo", () => {
    for (const campo of ["oQueFaz", "quandoProcurar", "revisorNome", "revisorCrm", "revisadoEm"] as const) {
      expect(paraTextoDeEspecialidade(cru({ [campo]: null } as Partial<TextoDeEspecialidadeCru>)), campo).toBeNull();
    }
  });

  it("nome ou CRM em branco valem como faltando", () => {
    expect(paraTextoDeEspecialidade(cru({ revisorNome: "   " }))).toBeNull();
    expect(paraTextoDeEspecialidade(cru({ revisorCrm: "" }))).toBeNull();
  });

  it("texto sem nenhuma letra vale como faltando: lista vazia, bloco em branco", () => {
    expect(paraTextoDeEspecialidade(cru({ oQueFaz: [] }))).toBeNull();
    expect(
      paraTextoDeEspecialidade(
        cru({ quandoProcurar: [bloco("   ")] as unknown as TextoDeEspecialidadeCru["quandoProcurar"] }),
      ),
    ).toBeNull();
  });

  it("data fora do formato do Studio vale como faltando", () => {
    expect(paraTextoDeEspecialidade(cru({ revisadoEm: "2026-13-01" }))).toBeNull();
  });
});
```

Em `testes/revalidar.test.ts`, depois do `it` "uma empresa parceira invalida a lista de parceiras da home", acrescente:

```ts
  it("um texto de especialidade invalida os textos de todas as especialidades", () => {
    /* O webhook não manda a especialidade do texto, e são poucas páginas: a
       etiqueta é uma só, `ETIQUETA_TEXTOS_DE_ESPECIALIDADE`
       (lib/sanity/consultas.ts), como a dos banners e a das parceiras. */
    expect(etiquetasDoDocumento({ _type: "textoDeEspecialidade" })).toEqual(["textos-de-especialidade"]);
  });
```

Em `testes/sanity-schemas.test.ts`:

1. Troque o primeiro `it`:

```ts
  it("registra os cinco tipos de documento", () => {
    expect(tipos.map((t) => t.name).sort()).toEqual([
      "autor",
      "banner",
      "empresaParceira",
      "noticia",
      "paginaInstitucional",
    ]);
  });
```

por

```ts
  it("registra os seis tipos de documento", () => {
    expect(tipos.map((t) => t.name).sort()).toEqual([
      "autor",
      "banner",
      "empresaParceira",
      "noticia",
      "paginaInstitucional",
      "textoDeEspecialidade",
    ]);
  });
```

2. Depois do `describe("empresa parceira", …)` inteiro, acrescente:

```ts
  describe("texto de especialidade", () => {
    type Campo = {
      name: string;
      type: string;
      options?: { isUnique?: unknown; dateFormat?: string };
      of?: {
        type: string;
        styles?: { value: string }[];
        lists?: { value: string }[];
        marks?: { decorators?: unknown[]; annotations?: unknown[] };
      }[];
      validation?: (r: unknown) => unknown;
    };
    const campos = () => porNome("textoDeEspecialidade").fields as unknown as Campo[];
    const campo = (nome: string): Campo => {
      const c = campos().find((f) => f.name === nome);
      if (!c) throw new Error(`textoDeEspecialidade sem o campo "${nome}"`);
      return c;
    };
    /* Uma regra de mentira: conta os `.required()`, guarda os `.min()` e os
       padrões de `.regex()`, e roda as funções `custom` com o valor dado. */
    function rodar(c: Campo, valor: unknown) {
      const saida = { obrigatorio: 0, min: [] as number[], regex: [] as RegExp[], erros: [] as unknown[] };
      const regra: Record<string, unknown> = {
        required: () => (saida.obrigatorio++, regra),
        min: (n: number) => (saida.min.push(n), regra),
        max: () => regra,
        regex: (p: RegExp) => (saida.regex.push(p), regra),
        custom: (f: (v: unknown) => unknown) => (saida.erros.push(f(valor)), regra),
      };
      c.validation?.(regra);
      return saida;
    }

    it("tem os seis campos da spec, com os tipos que a consulta lê", () => {
      expect((porNome("textoDeEspecialidade") as unknown as { title?: string }).title).toBe("Texto de especialidade");
      expect(campos().map((c) => [c.name, c.type])).toEqual([
        ["especialidade", "slug"],
        ["oQueFaz", "array"],
        ["quandoProcurar", "array"],
        ["revisorNome", "string"],
        ["revisorCrm", "string"],
        ["revisadoEm", "date"],
      ]);
    });

    it("os seis são obrigatórios, e cada texto tem pelo menos um bloco", () => {
      for (const c of campos()) expect(rodar(c, undefined).obrigatorio, c.name).toBe(1);
      expect(rodar(campo("oQueFaz"), undefined).min).toEqual([1]);
      expect(rodar(campo("quandoProcurar"), undefined).min).toEqual([1]);
    });

    it("a especialidade é única pela regra do próprio Sanity para slug", () => {
      /* O tipo `slug` confere sozinho que nenhum outro documento do mesmo
         tipo usa o mesmo valor (`defaultIsUnique`, no pacote sanity). Um
         `isUnique` nosso trocaria essa conferência. */
      expect(campo("especialidade").options?.isUnique).toBeUndefined();
    });

    it("a especialidade só aceita o fim do endereço: minúsculas sem acento, números e hífen", () => {
      const erros = (current: string) => rodar(campo("especialidade"), { _type: "slug", current }).erros;
      expect(erros("ortopedia-e-traumatologia")).toEqual([true]);
      for (const ruim of ["Cardiologia", "clínica-medica", "cardio logia", "/medicos/cardiologia", "-cardiologia", "cardiologia-"]) {
        expect(erros(ruim), ruim).not.toEqual([true]);
      }
    });

    it("o CRM do revisor no formato CRM/UF número", () => {
      const [padrao] = rodar(campo("revisorCrm"), "").regex;
      for (const bom of ["CRM/MA 12345", "CRM/PI 7"]) expect(padrao.test(bom), bom).toBe(true);
      for (const ruim of ["CRM MA 12345", "12345", "CRM/ma 12345", "CRM/MA12345", "CRM/MA 12345 "]) {
        expect(padrao.test(ruim), ruim).toBe(false);
      }
    });

    it("os dois textos aceitam só parágrafo e lista com marcadores, sem negrito nem link", () => {
      for (const nome of ["oQueFaz", "quandoProcurar"]) {
        const [b] = campo(nome).of ?? [];
        expect(b?.type, nome).toBe("block");
        expect(b?.styles?.map((s) => s.value), nome).toEqual(["normal"]);
        expect(b?.lists?.map((l) => l.value), nome).toEqual(["bullet"]);
        expect(b?.marks, nome).toEqual({ decorators: [], annotations: [] });
      }
    });

    it("a data se escreve como no Brasil", () => {
      expect(campo("revisadoEm").options?.dateFormat).toBe("DD/MM/YYYY");
    });
  });
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run testes/textos-de-especialidade.test.ts testes/sanity-schemas.test.ts testes/revalidar.test.ts`
Expected: FAIL. As constantes e funções novas não existem, o tipo não está registrado, e o webhook devolve `[]`.

- [ ] **Step 3: O schema**

`sanity/schemas/textoDeEspecialidade.ts`:

```ts
import { defineArrayMember, defineField, defineType } from "sanity";

/*
  O texto "Sobre a {especialidade}" da página de cada especialidade
  (/medicos/{especialidade}). Ele traz:
  - o que o especialista faz;
  - quando procurar;
  - quem revisou e quando.

  É texto de saúde, escrito e revisado por médico, e por isso fica no
  Studio, onde a AMI já escreve, e não no banco do diretório.

  O site lê estes campos por `GROQ_TEXTO_DE_ESPECIALIDADE`, em
  lib/sanity/consultas.ts. Com algum dos seis em branco, o texto não sai: na
  demonstração a página mostra "Texto da AMI a entrar." no lugar dele, e fora
  dela o bloco não existe.

  `especialidade` é do tipo `slug` porque o Sanity confere sozinho que dois
  documentos deste tipo não usam o mesmo valor.
*/

/* O fim do endereço da página: minúsculas sem acento, números e hífen. */
const FIM_DO_ENDERECO = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/* Parágrafos e lista com marcadores, e nada mais: o desenho da página só
   prevê os dois. */
const PARAGRAFOS_E_LISTA = defineArrayMember({
  type: "block",
  styles: [{ title: "Parágrafo", value: "normal" }],
  lists: [{ title: "Lista", value: "bullet" }],
  marks: { decorators: [], annotations: [] },
});

export const textoDeEspecialidade = defineType({
  name: "textoDeEspecialidade",
  title: "Texto de especialidade",
  type: "document",
  fields: [
    defineField({
      name: "especialidade",
      title: "Especialidade",
      type: "slug",
      description:
        "O fim do endereço da página da especialidade no site. Para a página " +
        "/medicos/ortopedia-e-traumatologia, escreva ortopedia-e-traumatologia. " +
        "Cada especialidade tem um texto só.",
      validation: (r) =>
        r.required().custom((v) => {
          const atual = (v as { current?: string } | undefined)?.current ?? "";
          return atual === "" || FIM_DO_ENDERECO.test(atual)
            ? true
            : "Use só letras minúsculas sem acento, números e hífen, como em ortopedia-e-traumatologia";
        }),
    }),
    defineField({
      name: "oQueFaz",
      title: "O que faz",
      type: "array",
      of: [PARAGRAFOS_E_LISTA],
      description: "O que o especialista faz, em um ou dois parágrafos.",
      validation: (r) => r.required().min(1),
    }),
    defineField({
      name: "quandoProcurar",
      title: "Quando procurar",
      type: "array",
      of: [PARAGRAFOS_E_LISTA],
      description:
        "Quando procurar o especialista. Pode ter uma lista e, depois dela, um parágrafo.",
      validation: (r) => r.required().min(1),
    }),
    defineField({
      name: "revisorNome",
      title: "Revisado por",
      type: "string",
      description:
        'O nome do médico que revisou o texto, como deve aparecer no site: "Dra. Maria da Silva".',
      validation: (r) => r.required().max(80),
    }),
    defineField({
      name: "revisorCrm",
      title: "CRM do revisor",
      type: "string",
      description: 'No formato "CRM/MA 12345".',
      validation: (r) => r.required().regex(/^CRM\/[A-Z]{2} \d+$/, { name: "CRM/UF número" }),
    }),
    defineField({
      name: "revisadoEm",
      title: "Data da revisão",
      type: "date",
      options: { dateFormat: "DD/MM/YYYY" },
      description: 'O site mostra só o mês e o ano: "revisão em setembro de 2026".',
      validation: (r) => r.required(),
    }),
  ],
  preview: {
    select: { title: "especialidade.current", subtitle: "revisorNome" },
  },
});
```

Em `sanity/schemas/index.ts` (CRLF):

1. Acrescente `import { textoDeEspecialidade } from "./textoDeEspecialidade";` depois do import de `paginaInstitucional`.
2. Acrescente `textoDeEspecialidade,` depois de `paginaInstitucional,` na lista `tipos`.

- [ ] **Step 4: A consulta e a montagem**

Em `lib/sanity/consultas.ts` (CRLF):

1. No topo, acrescente `import type { PortableTextBlock } from "@portabletext/react";` e `import { mesDeAno } from "@/lib/especialidades";`.
2. Acrescente `TextoDeEspecialidade,` ao import de tipos de `@/lib/sanity/tipos`, em ordem alfabética.
3. Depois de `export const ETIQUETA_PARCEIRAS = "parceiras";`, acrescente:

```ts
export const ETIQUETA_TEXTOS_DE_ESPECIALIDADE = "textos-de-especialidade";
```

4. No fim do arquivo, acrescente:

```ts

/* --- textos de especialidade --- */

/*
  O "Sobre a {especialidade}" de uma especialidade, pelo slug. Com dois
  documentos da mesma especialidade, o que o Studio recusa mas pode chegar
  por fora dele, vale o atualizado por último.
*/
export const GROQ_TEXTO_DE_ESPECIALIDADE = defineQuery(`
  *[_type == "textoDeEspecialidade" && especialidade.current == $especialidade]
  | order(_updatedAt desc)[0]{
    oQueFaz,
    quandoProcurar,
    revisorNome,
    revisorCrm,
    revisadoEm
  }
`);

export type TextoDeEspecialidadeCru = {
  oQueFaz: PortableTextBlock[] | null;
  quandoProcurar: PortableTextBlock[] | null;
  revisorNome: string | null;
  revisorCrm: string | null;
  revisadoEm: string | null;
};

/* Um texto rico tem texto quando algum trecho de algum bloco dele não está
   em branco. */
function temTexto(blocos: PortableTextBlock[] | null): blocos is PortableTextBlock[] {
  if (!Array.isArray(blocos)) return false;
  return blocos.some((b) => {
    const { _type, children } = b as { _type?: unknown; children?: unknown };
    return (
      _type === "block" &&
      Array.isArray(children) &&
      children.some((t) => {
        const texto = (t as { text?: unknown } | null)?.text;
        return typeof texto === "string" && texto.trim() !== "";
      })
    );
  });
}

/*
  Pura, como `paraEmpresasParceiras`, para testar sem rede. Monta o texto a
  partir do que o GROQ devolveu, só se estiver completo:
  - os dois textos com alguma letra;
  - o nome e o CRM do revisor preenchidos;
  - a data no formato do Studio.

  Faltando qualquer um, devolve null, e a página trata como especialidade
  sem texto (`sobreDaEspecialidade`, lib/especialidades.ts).
*/
export function paraTextoDeEspecialidade(
  cru: TextoDeEspecialidadeCru | null,
): TextoDeEspecialidade | null {
  if (!cru) return null;
  const revisorNome = cru.revisorNome?.trim() ?? "";
  const revisorCrm = cru.revisorCrm?.trim() ?? "";
  const mesDaRevisao = mesDeAno(cru.revisadoEm);
  if (
    !temTexto(cru.oQueFaz) ||
    !temTexto(cru.quandoProcurar) ||
    !revisorNome ||
    !revisorCrm ||
    !mesDaRevisao
  ) {
    return null;
  }
  return {
    oQueFaz: cru.oQueFaz,
    quandoProcurar: cru.quandoProcurar,
    revisorNome,
    revisorCrm,
    mesDaRevisao,
  };
}

export async function textoDaEspecialidade(
  especialidade: string,
): Promise<TextoDeEspecialidade | null> {
  const cliente = await obterCliente();
  const cru: TextoDeEspecialidadeCru | null = await cliente.fetch(
    GROQ_TEXTO_DE_ESPECIALIDADE,
    { especialidade },
    { next: { tags: [ETIQUETA_TEXTOS_DE_ESPECIALIDADE] } },
  );
  return paraTextoDeEspecialidade(cru ?? null);
}
```

- [ ] **Step 5: O webhook**

Em `lib/sanity/etiquetasDoDocumento.ts` (CRLF):

1. Acrescente `ETIQUETA_TEXTOS_DE_ESPECIALIDADE,` ao import de `@/lib/sanity/consultas`, depois de `ETIQUETA_PARCEIRAS,`.
2. Depois do `case "empresaParceira":` e do `return` dele, acrescente:

```ts

    case "textoDeEspecialidade":
      /* Uma etiqueta para os textos de todas as especialidades: o corpo do
         webhook não traz a especialidade do texto, e são poucas páginas. */
      return [ETIQUETA_TEXTOS_DE_ESPECIALIDADE];
```

- [ ] **Step 6: Rodar, provar por mutação, commit**

Run: `npx vitest run` · `npx tsc --noEmit` · `npm run build` → verde.

O teste "passa na validação de schema do próprio Sanity" (`testes/sanity-schemas.test.ts`) tem de continuar verde com o tipo novo.

Mutações, uma de cada vez, regravando o original depois:

1. Tire `| order(_updatedAt desc)` do GROQ.
2. Troque `especialidade.current == $especialidade` por `especialidade == $especialidade`.
3. Tire `revisorCrm,` da projeção.
4. Em `paraTextoDeEspecialidade`, tire `!temTexto(cru.quandoProcurar) ||`.
5. Em `temTexto`, troque `texto.trim() !== ""` por `texto !== undefined`.
6. Em `paraTextoDeEspecialidade`, troque `cru.revisorNome?.trim()` por `cru.revisorNome`.
7. Troque `lists: [{ title: "Lista", value: "bullet" }]` por `lists: []`.
8. Tire o `textoDeEspecialidade` da lista `tipos`.
9. Apague o `case "textoDeEspecialidade"` do webhook.

```bash
git add sanity/schemas/textoDeEspecialidade.ts sanity/schemas/index.ts lib/sanity/consultas.ts lib/sanity/etiquetasDoDocumento.ts testes/textos-de-especialidade.test.ts testes/sanity-schemas.test.ts testes/revalidar.test.ts
git commit -m "Sanity: tipo Texto de especialidade, consulta com etiqueta propria, montagem que so aceita o texto completo, e o webhook invalida os textos"
```

---

### Task 3: O cartão e a grade mostram a especialidade pedida

**Files:**
- Modify: `components/diretorio/CartaoMedico.tsx`
- Modify: `components/diretorio/GradeMedicos.tsx`
- Modify: `testes/cartao-medico.test.ts`

**Interfaces:**
- Consumes: `especialidadeDoCartao` (Task 1).
- Produces:

```ts
// components/diretorio/CartaoMedico.tsx
export function CartaoMedico(props: { medico: Medico; imediata?: boolean; especialidade?: string | null }): JSX.Element;
// components/diretorio/GradeMedicos.tsx
export function GradeMedicos(props: { medicos: Medico[]; imediatos?: number; especialidade?: string | null }): JSX.Element;
```

`especialidade` é o slug da especialidade da página. Omitido (a busca e o perfil), o cartão mostra a principal, como hoje.

- [ ] **Step 1: Os testes**

Em `testes/cartao-medico.test.ts`, no fim do arquivo:

```ts
describe("a especialidade que o cartão mostra", () => {
  /* Aline, principal Neurologia, com Ortopedia como secundária: o exemplo da
     spec de Especialidades, seção 2.3. */
  const ALINE_DUAS: Medico = {
    ...ALINE,
    especialidades: [
      { nome: "Neurologia", slug: "neurologia", rqe: "12222", principal: true },
      { nome: "Ortopedia e Traumatologia", slug: "ortopedia-e-traumatologia", rqe: "30111", principal: false },
    ],
  };

  it("sem especialidade pedida (a busca e o perfil): a principal, com o RQE dela", () => {
    const html = renderToString(createElement(CartaoMedico, { medico: ALINE_DUAS }));
    expect(visivel(html)).toEqual(["AP", "Aline Peixoto", "MÉDICO · CRM/MA 11918", "Neurologia", "RQE 12222", "Ligar"]);
    expect(html).not.toContain("Ortopedia");
  });

  it("na página de uma especialidade que o médico tem: a dela, com o RQE dela", () => {
    const html = renderToString(
      createElement(CartaoMedico, { medico: ALINE_DUAS, especialidade: "ortopedia-e-traumatologia" }),
    );
    expect(visivel(html)).toEqual([
      "AP",
      "Aline Peixoto",
      "MÉDICO · CRM/MA 11918",
      "Ortopedia e Traumatologia",
      "RQE 30111",
      "Ligar",
    ]);
  });

  it("a grade passa a especialidade da página a todos os cartões", () => {
    const html = renderToString(
      createElement(GradeMedicos, {
        medicos: [ALINE_DUAS, { ...ALINE_DUAS, id: 2, slug: "outra-aline" }],
        especialidade: "ortopedia-e-traumatologia",
      }),
    );
    expect(html.match(/>Ortopedia e Traumatologia</g)).toHaveLength(2);
    expect(html).not.toContain("Neurologia");
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run testes/cartao-medico.test.ts`
Expected: FAIL nos dois últimos `it`: o cartão mostra "Neurologia". O primeiro passa.

- [ ] **Step 3: O cartão**

Em `components/diretorio/CartaoMedico.tsx` (LF):

1. Troque `import { especialidadePrincipal, telefoneDoCartao } from "@/lib/encontre";` por `import { especialidadeDoCartao, telefoneDoCartao } from "@/lib/encontre";`.
2. No comentário de cima do componente, troque:

```
  O cartão do médico, na busca, em "Outros médicos" do perfil e na página de
  especialidade. Só foto, nome, "MÉDICO · CRM/UF", a especialidade principal
  com RQE e o "Ligar": nada de bairro, selo, telemedicina ou acessibilidade.
```

por

```
  O cartão do médico, na busca, em "Outros médicos" do perfil e na página de
  especialidade. Só foto, nome, "MÉDICO · CRM/UF", uma especialidade com RQE
  e o "Ligar": nada de bairro, selo, telemedicina ou acessibilidade.

  A especialidade é a principal; na página de uma especialidade
  (`especialidade`, o slug dela), é a da página, com o RQE dela, quando o
  médico a tem (`especialidadeDoCartao`, lib/encontre.ts).
```

3. Troque a assinatura e a primeira linha do corpo:

```tsx
export function CartaoMedico({ medico, imediata = false }: { medico: Medico; imediata?: boolean }) {
  const principal = especialidadePrincipal(medico);
```

por

```tsx
export function CartaoMedico({
  medico,
  imediata = false,
  especialidade = null,
}: {
  medico: Medico;
  imediata?: boolean;
  especialidade?: string | null;
}) {
  const mostrada = especialidadeDoCartao(medico, especialidade);
```

4. No JSX, troque as quatro ocorrências de `principal` por `mostrada`: `{principal ? (`, `{principal.nome}`, `{principal.rqe ? (` e `` `RQE ${principal.rqe}` ``.

- [ ] **Step 4: A grade**

Em `components/diretorio/GradeMedicos.tsx` (LF), troque o arquivo inteiro, depois de lido, por:

```tsx
import { CartaoMedico } from "@/components/diretorio/CartaoMedico";
import styles from "@/components/diretorio/GradeMedicos.module.css";
import type { Medico } from "@/lib/dados/tipos";

/*
  A grade de cartões.
  - `imediatos`: quantos dos primeiros cartões baixam a foto logo, sem
    `loading="lazy"`, porque ficam na primeira tela; os outros esperam a
    rolagem.
  - `especialidade`: o slug da especialidade da página, que cada cartão
    mostra no lugar da principal (components/diretorio/CartaoMedico.tsx).
*/
export function GradeMedicos({
  medicos,
  imediatos = 0,
  especialidade = null,
}: {
  medicos: Medico[];
  imediatos?: number;
  especialidade?: string | null;
}) {
  return (
    <ul className={styles.grade}>
      {medicos.map((m, i) => (
        <CartaoMedico key={m.id} medico={m} imediata={i < imediatos} especialidade={especialidade} />
      ))}
    </ul>
  );
}
```

- [ ] **Step 5: Rodar, provar por mutação, commit**

Run: `npx vitest run` · `npx tsc --noEmit` · `npm run build` → verde. `testes/busca.test.ts` e `testes/perfil.test.ts` continuam verdes: eles não passam `especialidade`.

Mutações, uma de cada vez, regravando o original depois:

1. No cartão, troque `especialidadeDoCartao(medico, especialidade)` por `especialidadeDoCartao(medico)`.
2. Na grade, tire `especialidade={especialidade}`.

```bash
git add components/diretorio/CartaoMedico.tsx components/diretorio/GradeMedicos.tsx testes/cartao-medico.test.ts
git commit -m "Cartao e grade de medicos: mostram a especialidade da pagina, com o RQE dela; na busca e no perfil, a principal"
```

---

### Task 4: O índice `/medicos`

**Files:**
- Create: `components/especialidades/FaixaDoIndice.tsx`, `components/especialidades/FaixaDoIndice.module.css`
- Create: `components/especialidades/GradeDeEspecialidades.tsx`, `components/especialidades/GradeDeEspecialidades.module.css`
- Modify: `app/(site)/medicos/page.tsx` (reescrita)
- Delete: `components/diretorio/IndiceEspecialidades.tsx`
- Modify: `lib/barra-do-pe.ts`, `components/layout/BarraDoPe.tsx` (comentários), `testes/rodape.test.ts`
- Modify: `app/(site)/encontre.module.css` (comentário), `components/layout/Cabeceira.tsx` (comentário)
- Create: `testes/indice-de-especialidades.test.ts`

**Interfaces:**
- Consumes:
  - `linhaDeApoioDoIndice`, `especialidadesComMedico`, `iconeDaEspecialidade`, `nomeComQuebras` (Task 1);
  - `Icone`, `LadrilhoIcone` (`components/base/Icone.tsx`);
  - `contagem` (`lib/formato.ts`);
  - as classes `faixa`, `sobre`, `titulo`, `texto` de `components/busca/FaixaDaBusca.module.css`;
  - `cab`, `contagem`, `ordem` de `components/busca/ResultadosDaBusca.module.css`;
  - `campo`, `lupa`, `buscar` de `components/home/EncontreUmMedico.module.css`;
  - `pagina` de `app/(site)/encontre.module.css`.
- Produces:

```ts
// components/especialidades/FaixaDoIndice.tsx
export function FaixaDoIndice(props: { medicos: number }): JSX.Element; // <section id="encontre" data-bloco="topo" …>
// components/especialidades/GradeDeEspecialidades.tsx
export function GradeDeEspecialidades(props: { especialidades: EspecialidadeComContagem[] }): JSX.Element; // <section data-bloco="especialidades">
// lib/barra-do-pe.ts
destinoDaBusca("/medicos") === "#encontre"
```

- Marcas: `data-cartao-de-especialidade` no `<li>`, `data-nome` no `<h3>`, `data-contagem` na contagem. A Task 7 as mede.

- [ ] **Step 1: Os testes**

`testes/indice-de-especialidades.test.ts`:

```ts
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { Icon } from "@phosphor-icons/react";
import { Baby, Heartbeat, Stethoscope } from "@phosphor-icons/react/dist/ssr";
import estilosPagina from "@/app/(site)/encontre.module.css";
import estilosBusca from "@/components/busca/FaixaDaBusca.module.css";
import estilosResultados from "@/components/busca/ResultadosDaBusca.module.css";
import estilosIndice from "@/components/especialidades/FaixaDoIndice.module.css";
import estilosGrade from "@/components/especialidades/GradeDeEspecialidades.module.css";
import estilosCampo from "@/components/home/EncontreUmMedico.module.css";
import { fonte } from "@/testes/apoio";
import { base, bloco, regra, semNotas } from "@/testes/css";
import { htmlDe } from "@/testes/renderizar";

/*
  O índice de especialidades de verdade, renderizado: app/(site)/medicos/page.tsx
  com as duas fontes de dados trocadas por dublês. A lista chega fora de
  ordem e com uma especialidade sem médico, como o banco nunca devolve, para
  a página mostrar que ordena e filtra sozinha. O CSS se lê do arquivo; a
  altura igual dos cartões e o alinhamento do nome e da contagem são medidos
  pela auditoria (scripts/auditoria-visual.js).
*/

vi.mock("@/lib/dados/medicos", () => ({
  buscarMedicos: async () => Array.from({ length: 24 }, (_, i) => ({ id: i + 1 })),
}));
vi.mock("@/lib/dados/especialidades", () => ({
  especialidadesComContagem: async () => [
    { nome: "Pediatria", slug: "pediatria", total: 3 },
    { nome: "Clínica Médica", slug: "clinica-medica", total: 4 },
    { nome: "Otorrinolaringologia", slug: "otorrinolaringologia", total: 1 },
    { nome: "Cardiologia", slug: "cardiologia", total: 3 },
    { nome: "Urologia", slug: "urologia", total: 0 },
    { nome: "Angiologia", slug: "angiologia", total: 2 },
  ],
}));

const pagina = await import("@/app/(site)/medicos/page");
const HTML = await htmlDe(await pagina.default());

/* Cada cartão, do `<li` ao `</li>`. */
const cartoes = [...HTML.matchAll(/<li [^>]*data-cartao-de-especialidade=""[\s\S]*?<\/li>/g)].map((m) => m[0]);
const desenho = (Componente: Icon, size: number) =>
  renderToString(createElement(Componente, { size, weight: "duotone", className: "", "aria-hidden": "true" }));

describe("o índice de especialidades", () => {
  it("abre com a faixa verde de ponta a ponta, no invólucro de coluna e ritmo, sem Cabeceira nem trilha", () => {
    expect(HTML).toMatch(
      new RegExp(
        `^<div class="${estilosPagina.pagina}"><section id="encontre" data-bloco="topo" data-faixa="" data-abertura="" aria-labelledby="especialidades-titulo" class="textura-verde ${estilosBusca.faixa} ${estilosIndice.indice}">`,
      ),
    );
    expect(HTML).toContain('<div class="brilho" aria-hidden="true"></div>');
    expect(HTML).not.toContain("Trilha de navegação");
    expect(HTML).not.toContain("-mt-32");
    /* Sem trilha na tela, sem BreadcrumbList: dado estruturado sem o
       equivalente visível é marcação enganosa (lib/seo/jsonld.ts). */
    expect(HTML).not.toContain("BreadcrumbList");
  });

  it("o rótulo, o título e a linha de apoio com o total de médicos", () => {
    expect(HTML.match(/<h1\b/g)).toHaveLength(1);
    expect(HTML).toContain(`<span class="rotulo-secao ${estilosBusca.sobre}" data-coluna="">Especialidades</span>`);
    expect(HTML).toContain(
      `<h1 id="especialidades-titulo" class="${estilosBusca.titulo}">Especialidades em Imperatriz</h1>`,
    );
    expect(HTML).toContain(
      `<p class="${estilosBusca.texto}">24 médicos associados, cada um com o número de registro no CRM. Escolha a área para ver quem atende.</p>`,
    );
  });

  it("o campo: o da busca da home, GET para /busca com o termo, sem lista de especialidades", () => {
    const form = /<form [^>]*>/.exec(HTML)![0];
    for (const attr of ['action="/busca"', 'method="get"', 'role="search"', `class="${estilosCampo.campo} ${estilosIndice.campo}"`]) {
      expect(form, attr).toContain(attr);
    }
    const campo = /<input[^>]*name="termo"[^>]*>/.exec(HTML)![0];
    expect(campo).toContain('type="search"');
    expect(campo).toContain('placeholder="Nome ou especialidade"');
    expect(HTML).toMatch(new RegExp(`<button type="submit" class="botao ${estilosCampo.buscar}">Buscar`));
    expect(HTML).not.toContain("<select");
  });

  it("a contagem das especialidades com médico e a frase da ordem, longa e curta", () => {
    expect(HTML).toContain(
      `<h2 id="contagem-de-especialidades" class="${estilosResultados.contagem}" data-coluna="">5 especialidades</h2>`,
    );
    expect(HTML).toContain(
      `<p class="${estilosResultados.ordem}"><span class="${estilosGrade.ordemLonga}">Em ordem alfabética</span><span class="${estilosGrade.ordemCurta}">De A a Z</span></p>`,
    );
  });

  it("um cartão por especialidade com médico, em ordem alfabética, cada um levando à página dela", () => {
    const links = [...HTML.matchAll(/<a href="\/medicos\/([^"]+)">([^<]*)<\/a>/g)].map((m) => [m[1], m[2]]);
    expect(links).toEqual([
      ["angiologia", "Angiologia"],
      ["cardiologia", "Cardiologia"],
      ["clinica-medica", "Clínica Médica"],
      ["otorrinolaringologia", "Otorrino­laringologia"],
      ["pediatria", "Pediatria"],
    ]);
    expect(cartoes).toHaveLength(5);
  });

  it("cada cartão: o ladrilho com o ícone, o nome, a contagem e a seta", () => {
    const cardio = cartoes[1];
    expect(cardio).toMatch(new RegExp(`^<li class="${estilosGrade.cartao}" data-cartao-de-especialidade="">`));
    expect(cardio).toContain(`<span class="ladrilho-icone" aria-hidden="true">${desenho(Heartbeat, 28)}</span>`);
    expect(cardio).toContain(
      `<h3 class="${estilosGrade.nome}" data-nome=""><a href="/medicos/cardiologia">Cardiologia</a></h3>`,
    );
    expect(cardio).toContain(`<span class="${estilosGrade.conta}" data-contagem="">3 médicos</span>`);
    expect(cardio).toMatch(new RegExp(`<span class="${estilosGrade.seta}" aria-hidden="true"><svg`));
  });

  it("a contagem concorda; o ícone vem da tabela, e quem não está nela fica com o estetoscópio", () => {
    expect(cartoes[3]).toContain(">1 médico<");
    expect(cartoes[4]).toContain(desenho(Baby, 28));
    expect(cartoes[0]).toContain(desenho(Stethoscope, 28));
  });

  it("os dois blocos da página, na ordem", () => {
    expect([...HTML.matchAll(/data-bloco="([^"]+)"/g)].map((m) => m[1])).toEqual(["topo", "especialidades"]);
  });

  it("sem os cartões antigos do índice nem a lista de bairros", () => {
    expect(HTML).not.toContain("Por especialidade");
    expect(HTML).not.toContain("por-bairro");
  });
});

describe("os metadados do índice continuam os de antes", () => {
  it("título, descrição e canonical", async () => {
    const m = await pagina.generateMetadata();
    expect(m.title).toBe("Médicos em Imperatriz - MA | 24 profissionais | AMI");
    expect(m.description).toBe(
      "24 médicos em 6 especialidades em Imperatriz - MA. Veja endereço, telefone e especialidade de cada médico.",
    );
    expect(m.alternates).toEqual({ canonical: "/medicos" });
  });
});

describe("o CSS da faixa do índice", () => {
  const css = semNotas(fonte("../components/especialidades/FaixaDoIndice.module.css"));

  it("a coluna do texto vai a 440px, e vale sobre a da busca pelo peso do seletor", () => {
    /* `.indice[data-faixa]` (classe e atributo) pesa mais que `.faixa`
       (FaixaDaBusca.module.css), qualquer que seja a ordem das folhas. */
    expect(regra(base(css), ".indice[data-faixa]")).toMatch(/grid-template-columns: minmax\(0, 440px\) minmax\(0, 1fr\);/);
    expect(regra(bloco(css, "@media (max-width: 1180px)"), ".indice[data-faixa]")).toMatch(/grid-template-columns: 1fr;/);
  });

  it("título até 12ch e linha de apoio até 24em, em toda largura", () => {
    expect(regra(base(css), ".indice h1")).toMatch(/max-width: 12ch;/);
    expect(regra(base(css), ".indice h1 + p")).toMatch(/max-width: 24em;/);
  });

  it("o campo na largura da coluna, até 760px abaixo de 1180px", () => {
    expect(regra(base(css), ".campo")).toMatch(/width: 100%;/);
    expect(regra(bloco(css, "@media (max-width: 1180px)"), ".campo")).toMatch(/max-width: 760px;/);
  });
});

describe("o CSS da grade de especialidades", () => {
  const css = semNotas(fonte("../components/especialidades/GradeDeEspecialidades.module.css"));
  const cel = () => bloco(css, "@media (max-width: 700px)");

  it("4 por linha, 3 até 1179px, 2 até 980px e 2 no celular", () => {
    expect(regra(base(css), ".grade")).toMatch(/grid-template-columns: repeat\(4, minmax\(0, 1fr\)\);/);
    expect(regra(bloco(css, "@media (max-width: 1180px)"), ".grade")).toMatch(/repeat\(3, minmax\(0, 1fr\)\)/);
    expect(regra(bloco(css, "@media (max-width: 980px)"), ".grade")).toMatch(/repeat\(2, minmax\(0, 1fr\)\)/);
    expect(regra(cel(), ".grade")).toMatch(/grid-template-columns: repeat\(2, minmax\(0, 1fr\)\);/);
    expect(regra(cel(), ".grade")).toMatch(/gap: 10px;/);
  });

  it("todos os cartões com a mesma altura, e a contagem presa ao pé", () => {
    expect(regra(base(css), ".grade")).toMatch(/grid-auto-rows: 1fr;/);
    expect(regra(base(css), ".cartao")).toMatch(/flex-direction: column;/);
    expect(regra(base(css), ".pe")).toMatch(/margin-top: auto;/);
  });

  it("o cartão inteiro leva à especialidade: o link do nome se estica por ele", () => {
    const r = regra(base(css), ".nome a::after");
    expect(r).toMatch(/inset: 0;/);
    expect(r).toMatch(/z-index: 1;/);
    expect(regra(base(css), ".cartao")).toMatch(/position: relative;/);
  });

  it("no mouse: borda mais escura, sombra neutra e 1px de subida; nada verde", () => {
    const r = regra(base(css), ".cartao:hover");
    expect(r).toMatch(/translateY\(-1px\)/);
    expect(r).toMatch(/border-color: var\(--color-line-strong\);/);
    expect(r).toMatch(/rgba\(16, 24, 40, 0\.09\)/);
    expect(r).not.toMatch(/lima|green/);
    expect(regra(base(css), ".cartao:hover .seta")).toMatch(/border-color: var\(--color-line-strong\);/);
  });

  it("no celular: cartões compactos, ladrilho de 40px e a frase curta da ordem", () => {
    expect(regra(cel(), ".cartao")).toMatch(/padding: 16px 16px 14px;/);
    expect(regra(cel(), ".cartao :global(.ladrilho-icone)")).toMatch(/width: 40px;/);
    expect(regra(cel(), ".nome")).toMatch(/font-size: 17px;/);
    expect(regra(base(css), ".ordemCurta")).toMatch(/display: none;/);
    expect(regra(cel(), ".ordemLonga")).toMatch(/display: none;/);
    expect(regra(cel(), ".ordemCurta")).toMatch(/display: inline;/);
  });
});
```

Em `testes/rodape.test.ts` (CRLF), troque:

```ts
  it("leva à busca da própria página na home e em /busca, e a /busca fora delas", () => {
```

por

```ts
  it("leva à busca da própria página na home, em /busca e no índice de especialidades, e a /busca fora deles", () => {
```

e troque `expect(destinoDaBusca("/medicos")).toBe("/busca");` por:

```ts
    expect(destinoDaBusca("/medicos")).toBe("#encontre");
    expect(destinoDaBusca("/medicos/cardiologia")).toBe("/busca");
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run testes/indice-de-especialidades.test.ts testes/rodape.test.ts`
Expected: FAIL. Os componentes novos não existem, a página é a antiga, e `/medicos` leva a `/busca`.

- [ ] **Step 3: O CSS da faixa**

`components/especialidades/FaixaDoIndice.module.css`:

```css
/*
  A faixa verde do índice de especialidades, transcrita do desenho aprovado
  (docs/desenho-aprovado/especialidades/especialidades.html: `.indice-topo`,
  `.indice-topo h1`, `.indice-topo .texto`, `.indice-topo .campo`, e o
  @media de 1180px).

  O resto da faixa é o da busca (components/busca/FaixaDaBusca.module.css:
  `.faixa`, `.sobre`, `.titulo`, `.texto`). O campo é o da busca da home
  (components/home/EncontreUmMedico.module.css: `.campo`, `.lupa`,
  `.buscar`).

  "Especialidades" é palavra longa: a coluna do texto cresce de 340px para
  440px, e o título e a linha de apoio ficam mais estreitos.

  As regras daqui valem sobre as da busca qualquer que seja a ordem em que
  as duas folhas chegam ao navegador:
  - `.indice[data-faixa]` (classe e atributo) pesa mais que `.faixa`;
  - `.indice h1` e `.indice h1 + p` pesam mais que `.titulo` e `.texto`.
*/

.indice[data-faixa] {
  grid-template-columns: minmax(0, 440px) minmax(0, 1fr);
}

.indice h1 {
  max-width: 12ch;
}

.indice h1 + p {
  max-width: 24em;
}

.campo {
  width: 100%;
}

@media (max-width: 1180px) {
  .indice[data-faixa] {
    grid-template-columns: 1fr;
  }

  .campo {
    max-width: 760px;
  }
}
```

- [ ] **Step 4: A faixa**

`components/especialidades/FaixaDoIndice.tsx`:

```tsx
import { Icone } from "@/components/base/Icone";
import busca from "@/components/busca/FaixaDaBusca.module.css";
import styles from "@/components/especialidades/FaixaDoIndice.module.css";
import campo from "@/components/home/EncontreUmMedico.module.css";
import { linhaDeApoioDoIndice } from "@/lib/especialidades";

/*
  A faixa verde de ponta a ponta que abre o índice de especialidades
  (/medicos): o rótulo, o título, a linha de apoio e o campo "Nome ou
  especialidade". Sem a `Cabeceira` das páginas antigas e sem trilha.

  A faixa é a da busca (FaixaDaBusca.module.css), com a coluna do texto
  mais larga (FaixaDoIndice.module.css).

  O campo é um formulário HTML de verdade, GET para `/busca`, o mesmo da
  busca da home: funciona sem JavaScript, e o resultado vira uma URL. Não
  leva a lista de especialidades: a lista é a grade logo abaixo.

  - `id="encontre"`: a barra do pé do celular leva a ele e põe o cursor no
    campo, como na home e na busca (components/layout/BarraDoPe.tsx).
  - `data-abertura`: a barra aparece quando esta faixa sai da tela.
  - `data-faixa`: a faixa fica fora da coluna da página
    (app/(site)/encontre.module.css).
*/
export function FaixaDoIndice({ medicos }: { medicos: number }) {
  return (
    <section
      id="encontre"
      data-bloco="topo"
      data-faixa=""
      data-abertura=""
      aria-labelledby="especialidades-titulo"
      className={`textura-verde ${busca.faixa} ${styles.indice}`}
    >
      <div className="brilho" aria-hidden="true"></div>

      <div>
        <span className={`rotulo-secao ${busca.sobre}`} data-coluna="">
          Especialidades
        </span>
        <h1 id="especialidades-titulo" className={busca.titulo}>
          Especialidades em Imperatriz
        </h1>
        <p className={busca.texto}>{linhaDeApoioDoIndice(medicos)}</p>
      </div>

      <div>
        <form
          action="/busca"
          method="get"
          role="search"
          aria-label="Buscar médicos"
          className={`${campo.campo} ${styles.campo}`}
        >
          <Icone nome="lupa" className={campo.lupa} />
          <label htmlFor="indice-termo" className="sr-only">
            Nome do médico ou especialidade
          </label>
          <input
            id="indice-termo"
            name="termo"
            type="search"
            placeholder="Nome ou especialidade"
            enterKeyHint="search"
            autoComplete="off"
          />
          <button type="submit" className={`botao ${campo.buscar}`}>
            Buscar <Icone nome="seta" />
          </button>
        </form>
      </div>
    </section>
  );
}
```

- [ ] **Step 5: O CSS da grade**

`components/especialidades/GradeDeEspecialidades.module.css`:

```css
/*
  A grade do índice de especialidades, transcrita do desenho aprovado
  (docs/desenho-aprovado/especialidades/especialidades.html: `.grade-esp`,
  `.esp`, `.esp:hover`, `.esp-nome`, `.esp-nome a::after`,
  `.esp-nome a:focus-visible`, `.esp:has(.esp-nome a:focus-visible)`,
  `.esp-pe`, `.esp-conta`, `.esp-seta`, `.esp:hover .esp-seta`,
  `.ordem-curta`, `.esp .icone`, e os @media de 1180, 980 e 700px).

  Vêm de outros arquivos:
  - a contagem e a frase da ordem: da busca
    (components/busca/ResultadosDaBusca.module.css: `.cab`, `.contagem`,
    `.ordem`);
  - o ladrilho do ícone: o global `.ladrilho-icone` (app/globals.css), que
    o celular encolhe.

  Todos os cartões têm a altura do mais alto (`grid-auto-rows: 1fr`), e a
  contagem e a seta ficam presas ao pé (`margin-top: auto`). Assim o nome
  começa na mesma altura e a contagem cai na mesma linha em toda a fileira.

  Ao passar o mouse: borda mais escura, sombra neutra e 1px de subida; nada
  fica verde. As bordas escuras do desenho (#C9CED6 no cartão, #C4C9D1 na
  seta) são o `line-strong`, como no `.botao-linha` (app/globals.css).
*/

.grade {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  grid-auto-rows: 1fr;
  gap: var(--gap);
}

.cartao {
  position: relative;
  display: flex;
  flex-direction: column;
  background: var(--color-surface);
  border: 1px solid var(--color-surface);
  border-radius: 18px;
  box-shadow: var(--shadow-erguido);
  padding: 24px 24px 22px;
  transition:
    transform 0.3s cubic-bezier(0.2, 0.7, 0.2, 1),
    box-shadow 0.3s,
    border-color 0.3s;
}

.cartao:hover {
  transform: translateY(-1px);
  border-color: var(--color-line-strong);
  box-shadow:
    0 1px 2px rgba(16, 24, 40, 0.05),
    0 16px 34px rgba(16, 24, 40, 0.09);
}

.ordemCurta {
  display: none;
}

.nome {
  margin-top: 28px;
  font-size: 22px;
  line-height: 1.15;
  letter-spacing: -0.025em;
}

/* O cartão inteiro leva à especialidade: o link do nome se estica por ele. */
.nome a::after {
  content: "";
  position: absolute;
  inset: 0;
  z-index: 1;
  border-radius: inherit;
}

/* O anel de foco vai no cartão inteiro, e não só no nome. */
.nome a:focus-visible {
  outline: none;
}

.cartao:has(.nome a:focus-visible) {
  outline: 2px solid var(--color-ami-green-600);
  outline-offset: 3px;
}

.pe {
  margin-top: auto;
  padding-top: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.conta {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-ink-400);
  font-variant-numeric: tabular-nums;
}

.seta {
  flex: none;
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border-radius: 999px;
  border: 1px solid var(--color-line);
  color: var(--color-ami-green-800);
  transition: border-color 0.3s;
}

.seta svg {
  width: 16px;
  height: 16px;
  transition: transform 0.3s cubic-bezier(0.2, 0.7, 0.2, 1);
}

.cartao:hover .seta {
  border-color: var(--color-line-strong);
}

.cartao:hover .seta svg {
  transform: translateX(2px);
}

@media (max-width: 1180px) {
  .grade {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 980px) {
  .grade {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

/* Celular: duas por linha, cartões compactos. "14 especialidades" e "Em
   ordem alfabética" não cabem numa linha a 375px: a frase fica "De A a Z". */
@media (max-width: 700px) {
  .ordemLonga {
    display: none;
  }

  .ordemCurta {
    display: inline;
  }

  .grade {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
  }

  .cartao {
    padding: 16px 16px 14px;
    border-radius: 16px;
  }

  .cartao:hover {
    transform: none;
  }

  .cartao :global(.ladrilho-icone) {
    width: 40px;
    height: 40px;
    border-radius: 12px;
  }

  .cartao :global(.ladrilho-icone) svg {
    width: 22px;
    height: 22px;
  }

  .nome {
    margin-top: 16px;
    font-size: 17px;
    line-height: 1.2;
  }

  .pe {
    padding-top: 10px;
    gap: 8px;
  }

  .conta {
    font-size: 13px;
  }

  .seta {
    width: 28px;
    height: 28px;
  }

  .seta svg {
    width: 13px;
    height: 13px;
  }
}
```

- [ ] **Step 6: A grade**

`components/especialidades/GradeDeEspecialidades.tsx`:

```tsx
import Link from "next/link";
import { Icone, LadrilhoIcone } from "@/components/base/Icone";
import resultados from "@/components/busca/ResultadosDaBusca.module.css";
import styles from "@/components/especialidades/GradeDeEspecialidades.module.css";
import { especialidadesComMedico, iconeDaEspecialidade, nomeComQuebras } from "@/lib/especialidades";
import { contagem } from "@/lib/formato";
import type { EspecialidadeComContagem } from "@/lib/dados/tipos";

/*
  A grade do índice de especialidades.
  - Em cima, a contagem ("14 especialidades") e a frase da ordem, como na
    busca.
  - Embaixo, um cartão por especialidade com médico, em ordem alfabética
    (`especialidadesComMedico`).
  - Cada cartão tem o ícone num ladrilho, o nome, "N médicos" e a seta.
  - O cartão inteiro leva à página da especialidade, pelo link do nome,
    esticado em CSS.

  O nome sai com o hífen opcional nas palavras longas (`nomeComQuebras`).

  Marcas para a auditoria visual: `data-cartao-de-especialidade`,
  `data-nome` e `data-contagem`.
*/
export function GradeDeEspecialidades({
  especialidades,
}: {
  especialidades: EspecialidadeComContagem[];
}) {
  const itens = especialidadesComMedico(especialidades);

  return (
    <section data-bloco="especialidades" aria-labelledby="contagem-de-especialidades">
      <div className={resultados.cab}>
        <h2 id="contagem-de-especialidades" className={resultados.contagem} data-coluna="">
          {contagem(itens.length, "especialidade", "especialidades")}
        </h2>
        <p className={resultados.ordem}>
          <span className={styles.ordemLonga}>Em ordem alfabética</span>
          <span className={styles.ordemCurta}>De A a Z</span>
        </p>
      </div>

      <ul className={styles.grade}>
        {itens.map((e) => (
          <li key={e.slug} className={styles.cartao} data-cartao-de-especialidade="">
            <LadrilhoIcone nome={iconeDaEspecialidade(e.slug)} />
            <h3 className={styles.nome} data-nome="">
              <Link href={`/medicos/${e.slug}`}>{nomeComQuebras(e.nome)}</Link>
            </h3>
            <p className={styles.pe}>
              <span className={styles.conta} data-contagem="">
                {contagem(e.total, "médico", "médicos")}
              </span>
              <span className={styles.seta} aria-hidden="true">
                <Icone nome="seta" />
              </span>
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
```

- [ ] **Step 7: A página**

Reescreva `app/(site)/medicos/page.tsx` (CRLF; leia antes) inteiro:

```tsx
import type { Metadata } from "next";
import paginas from "@/app/(site)/encontre.module.css";
import { FaixaDoIndice } from "@/components/especialidades/FaixaDoIndice";
import { GradeDeEspecialidades } from "@/components/especialidades/GradeDeEspecialidades";
import { especialidadesComContagem } from "@/lib/dados/especialidades";
import { buscarMedicos } from "@/lib/dados/medicos";

/* Revalidação a cada hora: o cadastro muda algumas vezes por semana, e servir
   HTML pronto é o que segura o LCP abaixo de 2,5s em 4G. */
export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  /* Contagem de profissionais, não soma por especialidade: quem tem duas
     especialidades entraria duas vezes na soma. `buscarMedicos` é memoizada
     por requisição, então isto não é uma segunda ida ao banco. */
  const [especialidades, total] = await Promise.all([
    especialidadesComContagem(),
    buscarMedicos().then((m) => m.length),
  ]);

  return {
    title: `Médicos em Imperatriz - MA | ${total} profissionais | AMI`,
    description:
      `${total} médicos em ${especialidades.length} especialidades em ` +
      `Imperatriz - MA. Veja endereço, telefone e especialidade de cada médico.`,
    alternates: { canonical: "/medicos" },
  };
}

/*
  O índice de especialidades (item "Especialidades" do menu):
  - a faixa verde com o campo de busca;
  - a contagem e um cartão por especialidade com médico, em ordem
    alfabética.

  Sem a `Cabeceira` das páginas internas antigas e sem trilha. Sem o
  BreadcrumbList também: dado estruturado sem o equivalente visível é
  marcação enganosa (lib/seo/jsonld.ts).

  Os blocos são filhos diretos de `.pagina` (app/(site)/encontre.module.css),
  a --ritmo um do outro.
*/
export default async function PaginaMedicos() {
  /* Mesmo raciocínio do `generateMetadata`: total = profissionais
     publicados, não a soma das contagens por especialidade. */
  const [especialidades, total] = await Promise.all([
    especialidadesComContagem(),
    buscarMedicos().then((m) => m.length),
  ]);

  return (
    <div className={paginas.pagina}>
      <FaixaDoIndice medicos={total} />
      <GradeDeEspecialidades especialidades={especialidades} />
    </div>
  );
}
```

- [ ] **Step 8: A barra do pé leva ao campo do índice**

Em `lib/barra-do-pe.ts` (LF):

1. No comentário do topo, troque a linha

```
  abertura (o carrossel da home, a faixa verde da busca, `data-abertura`):
```

por

```
  abertura (o carrossel da home, ou a faixa verde do topo, `data-abertura`):
```
2. Troque:

```ts
/** Para onde "Encontrar médico" leva: à busca da própria página, na home e em /busca; senão à página de busca. */
export function destinoDaBusca(caminho: string): "#encontre" | "/busca" {
  return caminho === "/" || caminho === "/busca" ? "#encontre" : "/busca";
}
```

por

```ts
/* As páginas que têm o campo de busca (`#encontre`) na própria faixa. */
const COM_CAMPO_DE_BUSCA = new Set(["/", "/busca", "/medicos"]);

/**
 * Para onde "Encontrar médico" leva: ao campo de busca da própria página,
 * na home, em /busca e no índice de especialidades; senão, à página de
 * busca.
 */
export function destinoDaBusca(caminho: string): "#encontre" | "/busca" {
  return COM_CAMPO_DE_BUSCA.has(caminho) ? "#encontre" : "/busca";
}
```

Em `components/layout/BarraDoPe.tsx` (CRLF), só comentários:

1. Troque a linha

```
  faixa da busca, `[data-abertura]`), quanto a página rolou e se o bloco de
```

por

```
  faixa verde do topo, `[data-abertura]`), quanto a página rolou e se o bloco de
```

2. Troque as três linhas

```
  Na home e na busca o botão leva ao bloco de busca da própria página e, passado o
  tempo do pulo, põe o cursor no campo para a pessoa já poder digitar. Fora
  da home e da busca leva a `/busca`, e a página nova cuida do próprio foco.
```

por

```
  Na home, na busca e no índice de especialidades o botão leva ao campo de
  busca da própria página e, passado o tempo do pulo, põe o cursor nele
  para a pessoa já poder digitar. Fora delas leva a `/busca`, e a página
  nova cuida do próprio foco.
```

3. No `useEffect`, troque

```
    /* O bloco que abre a página: o carrossel da home ou a faixa verde da
       busca (`data-abertura`). */
```

por

```
    /* O bloco que abre a página: o carrossel da home ou a faixa verde do
       topo (`data-abertura`). */
```

- [ ] **Step 9: O índice antigo sai, e os comentários que falam das páginas**

1. Apague `components/diretorio/IndiceEspecialidades.tsx`.
2. `grep -rn "IndiceEspecialidades" app components lib testes scripts`. Só pode sobrar `testes/home.test.ts`, que confere que a home NÃO o monta. Nenhum comentário pode citá-lo como existente.
3. Em `components/layout/Cabeceira.tsx` (CRLF), troque:

```
  Cabeceira das páginas internas que ainda não ganharam o desenho novo, como
  /medicos e cada especialidade. A busca e o perfil do médico não a usam: o
  cliente a recusou, e as duas abrem com o desenho delas.
```

por

```
  Cabeceira das páginas internas que ainda não ganharam o desenho novo, como
  cada especialidade, A Associação, o contato e as notícias. A busca, o
  perfil do médico e o índice de especialidades não a usam: o cliente a
  recusou, e os três abrem com o desenho deles.
```

4. Em `app/(site)/encontre.module.css` (LF), troque o comentário do topo inteiro por:

```css
/*
  A coluna e o ritmo das páginas de "Encontre um médico" (a busca e o
  perfil) e do índice de especialidades (/medicos), com a mesma regra da
  home (app/(site)/inicio.module.css):
  - os blocos são filhos diretos de `.pagina`, a --ritmo um do outro e do
    cabeçalho;
  - os que não são faixa de ponta a ponta (`data-faixa`) ficam na caixa de
    1240px do desenho, com 24px de folga de cada lado (12px no celular).

  O rodapé fica a --ritmo do último bloco, porque nenhuma das três páginas
  termina numa faixa (components/layout/Rodape.module.css).
*/
```

- [ ] **Step 10: Rodar, provar por mutação, conferir, commit**

Run: `npx vitest run` · `npx tsc --noEmit` · `npm run build` → verde.

`testes/sem-bairros.test.ts` continua verde: ele renderiza `/medicos` e acha `href="/medicos/cardiologia"`.

Mutações, uma de cada vez, regravando o original depois:

1. Na grade, troque `especialidadesComMedico(especialidades)` por `especialidades`.
2. Tire `grid-auto-rows: 1fr;` da `.grade`.
3. Troque `.indice[data-faixa]` por `.indice` (nas duas regras).
4. Na grade, tire `nomeComQuebras(...)` e deixe `e.nome`.
5. Troque `border-color: var(--color-line-strong);` do `.cartao:hover` por `border-color: var(--color-ami-lima-400);`.
6. Em `destinoDaBusca`, tire `"/medicos"` do conjunto.
7. Na faixa, tire `id="encontre"`.

Conferência rápida no navegador:
1. `npm run build` e `npx next start -p 3300`.
2. Abra `/medicos` a 1440 e a 390px.
3. Expected:
   - a faixa e a grade como em `docs/desenho-aprovado/especialidades/especialidades-1440-parte-1.jpg` e `especialidades-390-parte-1.jpg`;
   - a 390px, a barra do pé aparece depois que a faixa sai da tela, e "Encontrar médico" volta ao campo.
4. Derrube o 3300 pelo PID.

```bash
git add components/especialidades/FaixaDoIndice.tsx components/especialidades/FaixaDoIndice.module.css components/especialidades/GradeDeEspecialidades.tsx components/especialidades/GradeDeEspecialidades.module.css "app/(site)/medicos/page.tsx" components/diretorio/IndiceEspecialidades.tsx lib/barra-do-pe.ts components/layout/BarraDoPe.tsx testes/rodape.test.ts "app/(site)/encontre.module.css" components/layout/Cabeceira.tsx testes/indice-de-especialidades.test.ts
git commit -m "Indice de especialidades: faixa verde com o campo de busca, contagem e cartoes em ordem alfabetica com icone; sem Cabeceira nem BreadcrumbList"
```

---

### Task 5: Os blocos da página da especialidade

**Files:**
- Create: `components/especialidades/FaixaDaEspecialidade.tsx`, `components/especialidades/FaixaDaEspecialidade.module.css`
- Create: `components/especialidades/MedicosDaEspecialidade.tsx`
- Create: `components/especialidades/SobreAEspecialidade.tsx`, `components/especialidades/SobreAEspecialidade.module.css`
- Create: `testes/blocos-da-especialidade.test.ts`

**Interfaces:**
- Consumes:
  - `iconeDaEspecialidade`, `tituloDoSobre`, `SobreNaTela` (Task 1);
  - `GradeMedicos` com `especialidade` (Task 3);
  - `textoDaContagem` (`lib/encontre.ts`);
  - `TEXTO_A_ENTRAR` (`lib/molduras.ts`, "Texto da AMI a entrar.");
  - as classes da faixa da busca e da contagem da busca.
- Produces:

```ts
// components/especialidades/FaixaDaEspecialidade.tsx
export function FaixaDaEspecialidade(props: { nome: string; slug: string; paragrafo: string }): JSX.Element; // <section data-bloco="topo" …>
// components/especialidades/MedicosDaEspecialidade.tsx
export function MedicosDaEspecialidade(props: { medicos: Medico[]; especialidade: string }): JSX.Element; // <section data-bloco="medicos">
// components/especialidades/SobreAEspecialidade.tsx
export function SobreAEspecialidade(props: { nome: string; sobre: SobreNaTela }): JSX.Element; // <section data-bloco="sobre" data-faixa>
```

- [ ] **Step 1: Os testes**

`testes/blocos-da-especialidade.test.ts`:

```ts
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { Icon } from "@phosphor-icons/react";
import { ArrowLeft, Bone, Stethoscope } from "@phosphor-icons/react/dist/ssr";
import type { PortableTextBlock } from "@portabletext/react";
import estilosBusca from "@/components/busca/FaixaDaBusca.module.css";
import estilosResultados from "@/components/busca/ResultadosDaBusca.module.css";
import estilosGrade from "@/components/diretorio/GradeMedicos.module.css";
import { FaixaDaEspecialidade } from "@/components/especialidades/FaixaDaEspecialidade";
import estilosFaixa from "@/components/especialidades/FaixaDaEspecialidade.module.css";
import { MedicosDaEspecialidade } from "@/components/especialidades/MedicosDaEspecialidade";
import { SobreAEspecialidade } from "@/components/especialidades/SobreAEspecialidade";
import estilosSobre from "@/components/especialidades/SobreAEspecialidade.module.css";
import type { Medico } from "@/lib/dados/tipos";
import type { TextoDeEspecialidade } from "@/lib/sanity/tipos";
import { fonte } from "@/testes/apoio";
import { base, bloco, regra, semNotas } from "@/testes/css";

/*
  Os três blocos da página de cada especialidade, no HTML de servidor: a
  faixa verde, a contagem com a grade de médicos e o "Sobre". O CSS se lê
  do arquivo; o alinhamento e o ritmo são medidos pela auditoria
  (scripts/auditoria-visual.js).
*/

const desenho = (Componente: Icon, size: number, weight: "duotone" | "regular") =>
  renderToString(createElement(Componente, { size, weight, className: "", "aria-hidden": "true" }));

/** O texto que aparece, sem tags, num espaço só. */
const tela = (html: string) =>
  html
    .replace(/<!-- -->/g, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

describe("a faixa da especialidade", () => {
  const html = renderToString(
    createElement(FaixaDaEspecialidade, {
      nome: "Ortopedia e Traumatologia",
      slug: "ortopedia-e-traumatologia",
      paragrafo: "Parágrafo de abertura.",
    }),
  );

  it("faixa verde de ponta a ponta que abre a página", () => {
    expect(html).toMatch(
      new RegExp(
        `^<section data-bloco="topo" data-faixa="" data-abertura="" aria-labelledby="especialidade-titulo" class="textura-verde ${estilosBusca.faixa} ${estilosFaixa.especialidade}">`,
      ),
    );
    expect(html).toContain('<div class="brilho" aria-hidden="true"></div>');
    /* Sem campo de busca, sem o id que a barra do pé procura. */
    expect(html).not.toContain('id="encontre"');
    expect(html).not.toContain("<form");
    expect(html).not.toContain("<input");
  });

  it("no lugar do rótulo, o link de volta para o índice, na coluna do texto", () => {
    const link = /<a [^>]*href="\/medicos"[^>]*>/.exec(html)![0];
    expect(link).toContain(`class="rotulo-secao ${estilosBusca.sobre} ${estilosFaixa.volta}"`);
    expect(link).toContain('data-coluna=""');
    const ini = html.indexOf(link) + link.length;
    const dentro = html.slice(ini, html.indexOf("</a>", ini));
    expect(dentro.startsWith(desenho(ArrowLeft, 20, "regular"))).toBe(true);
    expect(tela(dentro)).toBe("Especialidades");
  });

  it("o título com o nome e Imperatriz, e o parágrafo de abertura", () => {
    expect(html).toContain(
      `<h1 id="especialidade-titulo" class="${estilosBusca.titulo}">Ortopedia e Traumatologia em Imperatriz</h1>`,
    );
    expect(html).toContain(`<p class="${estilosBusca.texto}">Parágrafo de abertura.</p>`);
  });

  it("à direita, o ícone da especialidade no ladrilho de vidro, fora do leitor de tela", () => {
    expect(html).toContain(`<div class="${estilosFaixa.selo}" aria-hidden="true">${desenho(Bone, 84, "duotone")}</div>`);
    const nova = renderToString(
      createElement(FaixaDaEspecialidade, { nome: "Angiologia", slug: "angiologia", paragrafo: "x" }),
    );
    expect(nova).toContain(desenho(Stethoscope, 84, "duotone"));
  });
});

function medico(id: number, nome: string, foto: string | null = null): Medico {
  return {
    id,
    slug: `medico-${id}`,
    nome,
    crm: String(10000 + id),
    crmUf: "MA",
    foto,
    bio: null,
    telemedicina: false,
    associadoAmi: true,
    especialidades: [
      { nome: "Neurologia", slug: "neurologia", rqe: "12222", principal: true },
      { nome: "Ortopedia e Traumatologia", slug: "ortopedia-e-traumatologia", rqe: "30111", principal: false },
    ],
    locais: [],
  };
}

describe("a contagem e a grade de médicos", () => {
  const html = renderToString(
    createElement(MedicosDaEspecialidade, {
      medicos: [medico(1, "Aline Peixoto"), medico(2, "Gustavo Serra")],
      especialidade: "ortopedia-e-traumatologia",
    }),
  );

  it("a contagem, na coluna do texto, e a frase da ordem", () => {
    expect(html).toMatch(/^<section data-bloco="medicos" aria-labelledby="contagem">/);
    expect(html).toContain(`<h2 id="contagem" class="${estilosResultados.contagem}" data-coluna="">2 médicos</h2>`);
    expect(html).toContain(`<p class="${estilosResultados.ordem}">Em ordem alfabética</p>`);
    const um = renderToString(
      createElement(MedicosDaEspecialidade, { medicos: [medico(1, "Aline Peixoto")], especialidade: "neurologia" }),
    );
    expect(um).toContain(">1 médico</h2>");
  });

  it("a grade da busca, com a especialidade da página em cada cartão", () => {
    expect(html).toContain(`<ul class="${estilosGrade.grade}">`);
    expect(html.match(/>Ortopedia e Traumatologia</g)).toHaveLength(2);
    expect(html).toContain("RQE 30111");
    expect(html).not.toContain("Neurologia");
  });

  it("os quatro primeiros cartões baixam a foto logo; os outros esperam a rolagem", () => {
    const seis = [1, 2, 3, 4, 5, 6].map((n) => medico(n, `Médico ${n}`, `https://exemplo.test/${n}.jpg`));
    const comFotos = renderToString(
      createElement(MedicosDaEspecialidade, { medicos: seis, especialidade: "ortopedia-e-traumatologia" }),
    );
    expect(comFotos.match(/<img /g)).toHaveLength(6);
    expect(comFotos.match(/loading="lazy"/g)).toHaveLength(2);
  });
});

describe("o Sobre a especialidade", () => {
  const bloco_ = (texto: string, extra: Record<string, unknown> = {}) =>
    ({
      _type: "block",
      _key: `b-${texto.length}`,
      style: "normal",
      markDefs: [],
      children: [{ _type: "span", _key: "s", text: texto, marks: [] }],
      ...extra,
    }) as PortableTextBlock;
  const item = (texto: string) => bloco_(texto, { listItem: "bullet", level: 1 });
  const TEXTO: TextoDeEspecialidade = {
    oQueFaz: [bloco_("O ortopedista cuida dos ossos e das articulações.")],
    quandoProcurar: [item("Dor nas articulações."), item("Entorse."), bloco_("Fratura pede pronto-socorro.")],
    revisorNome: "Dra. Exemplo Revisora",
    revisorCrm: "CRM/MA 10000",
    mesDaRevisao: "setembro de 2026",
  };
  const comTexto = renderToString(
    createElement(SobreAEspecialidade, { nome: "Ortopedia e Traumatologia", sobre: { tipo: "texto", texto: TEXTO } }),
  );
  const aEntrar = renderToString(
    createElement(SobreAEspecialidade, { nome: "Ortopedia e Traumatologia", sobre: { tipo: "a-entrar" } }),
  );

  it("faixa branca de ponta a ponta, que entra ao rolar", () => {
    for (const html of [comTexto, aEntrar]) {
      expect(html).toMatch(
        new RegExp(
          `^<section data-bloco="sobre" data-faixa="" aria-labelledby="sobre-titulo" class="revelar ${estilosSobre.faixa}">`,
        ),
      );
      expect(html).toContain('<h2 id="sobre-titulo" data-coluna="">Sobre a ortopedia e traumatologia</h2>');
    }
  });

  it("com o texto da AMI: as duas colunas com parágrafo e lista, como o Studio guardou", () => {
    expect(comTexto).toContain(`<div class="${estilosSobre.colunas}">`);
    expect(comTexto).toContain("<h3>O que faz</h3><p>O ortopedista cuida dos ossos e das articulações.</p>");
    expect(comTexto).toContain(
      "<h3>Quando procurar</h3><ul><li>Dor nas articulações.</li><li>Entorse.</li></ul><p>Fratura pede pronto-socorro.</p>",
    );
  });

  it("com o texto da AMI: quem revisou, o CRM, o mês, e o aviso", () => {
    const revisao = comTexto.slice(comTexto.indexOf(`<div class="${estilosSobre.revisao}">`));
    expect(tela(revisao)).toBe(
      "Revisado por Dra. Exemplo Revisora · CRM/MA 10000 · revisão em setembro de 2026 " +
        "Conteúdo informativo; não substitui a consulta médica.",
    );
    expect(revisao).toContain("<b>Dra. Exemplo Revisora</b>");
    expect(revisao).toContain(`<span class="${estilosSobre.crm}">CRM/MA 10000</span>`);
  });

  it("a entrar: a frase no lugar dos dois textos, sem a linha do revisor", () => {
    expect(aEntrar.match(new RegExp(`<p class="${estilosSobre.falta}">Texto da AMI a entrar\\.</p>`, "g"))).toHaveLength(2);
    expect(aEntrar).toContain(`<h3>O que faz</h3><p class="${estilosSobre.falta}">`);
    expect(aEntrar).toContain(`<h3>Quando procurar</h3><p class="${estilosSobre.falta}">`);
    expect(aEntrar).not.toContain("Revisado por");
    expect(aEntrar).toContain("Conteúdo informativo; não substitui a consulta médica.");
  });

  it("nenhum texto provisório", () => {
    for (const html of [comTexto, aEntrar]) expect(html).not.toContain("PROVISÓRIO");
  });
});

describe("o CSS da faixa da especialidade", () => {
  const css = semNotas(fonte("../components/especialidades/FaixaDaEspecialidade.module.css"));

  it("texto à esquerda e o ícone à direita até o celular, valendo sobre a regra da busca", () => {
    /* `.especialidade[data-faixa]` pesa mais que `.faixa`
       (FaixaDaBusca.module.css), que abaixo de 1180px vira uma coluna só. */
    expect(regra(base(css), ".especialidade[data-faixa]")).toMatch(/grid-template-columns: minmax\(0, 1fr\) auto;/);
    expect(regra(bloco(css, "@media (max-width: 700px)"), ".especialidade[data-faixa]")).toMatch(
      /grid-template-columns: 1fr;/,
    );
  });

  it("título até 14ch e parágrafo até 34em", () => {
    expect(regra(base(css), ".especialidade h1")).toMatch(/max-width: 14ch;/);
    expect(regra(base(css), ".especialidade h1 + p")).toMatch(/max-width: 34em;/);
  });

  it("o ladrilho de vidro: 168px, 128px no tablet, fora no celular", () => {
    const selo = regra(base(css), ".selo");
    expect(selo).toMatch(/width: 168px;/);
    expect(selo).toMatch(/border-radius: 40px;/);
    expect(selo).toMatch(/color: var\(--color-ami-lima-400\);/);
    expect(regra(base(css), ".selo svg")).toMatch(/width: 84px;/);
    expect(regra(bloco(css, "@media (max-width: 980px)"), ".selo")).toMatch(/width: 128px;/);
    expect(regra(bloco(css, "@media (max-width: 980px)"), ".selo svg")).toMatch(/width: 64px;/);
    expect(regra(bloco(css, "@media (max-width: 700px)"), ".selo")).toMatch(/display: none;/);
  });

  it("a seta do link de volta anda para a esquerda no mouse", () => {
    expect(regra(base(css), ".volta")).toMatch(/display: inline-flex;/);
    expect(regra(base(css), ".volta:hover svg")).toMatch(/translateX\(-3px\)/);
  });
});

describe("o CSS do Sobre", () => {
  const css = semNotas(fonte("../components/especialidades/SobreAEspecialidade.module.css"));
  const cel = () => bloco(css, "@media (max-width: 700px)");

  it("faixa branca de ponta a ponta: 96px, 64px no tablet, 44px no celular, sem margem embaixo", () => {
    const f = regra(base(css), ".faixa");
    expect(f).toMatch(/padding: 96px var\(--borda-faixa\);/);
    expect(f).toMatch(/background: var\(--color-surface\);/);
    expect(f).not.toMatch(/margin/);
    expect(regra(bloco(css, "@media (max-width: 980px)"), ".faixa")).toMatch(/padding-top: 64px;/);
    expect(regra(cel(), ".faixa")).toMatch(/padding: 44px var\(--borda-faixa\);/);
  });

  it("duas colunas, uma no celular", () => {
    expect(regra(base(css), ".colunas")).toMatch(/grid-template-columns: repeat\(2, minmax\(0, 1fr\)\);/);
    expect(regra(base(css), ".colunas")).toMatch(/gap: 40px 64px;/);
    expect(regra(cel(), ".colunas")).toMatch(/grid-template-columns: 1fr;/);
  });

  it("a lista com o ponto verde do desenho, sem marcador do navegador", () => {
    expect(regra(base(css), ".colunas ul")).toMatch(/list-style: none;/);
    expect(regra(base(css), ".colunas li::before")).toMatch(/background: var\(--color-ami-green-600\);/);
  });

  it("a linha da revisão: fio em cima, cinza do texto de apoio; empilhada no celular", () => {
    const r = regra(base(css), ".revisao");
    expect(r).toMatch(/border-top: 1px solid var\(--color-line\);/);
    expect(r).toMatch(/color: var\(--color-ink-400\);/);
    expect(regra(cel(), ".revisao")).toMatch(/flex-direction: column;/);
  });

  it("o texto a entrar, como em Quem é a AMI?: cinza e em itálico", () => {
    const r = regra(base(css), ".colunas .falta");
    expect(r).toMatch(/color: var\(--color-ink-400\);/);
    expect(r).toMatch(/font-style: italic;/);
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run testes/blocos-da-especialidade.test.ts`
Expected: FAIL. Os componentes não existem.

- [ ] **Step 3: O CSS da faixa**

`components/especialidades/FaixaDaEspecialidade.module.css`:

```css
/*
  A faixa verde da página de cada especialidade, transcrita do desenho
  aprovado (docs/desenho-aprovado/especialidades/especialidade.html:
  `.esp-topo`, `.esp-topo h1`, `.esp-topo .texto`, `.esp-topo .volta`,
  `.esp-selo`, `.esp-selo i`, o `.volta` do perfil, e os @media de 980 e
  700px).

  O resto da faixa é o da busca (components/busca/FaixaDaBusca.module.css:
  `.faixa`, `.sobre`, `.titulo`, `.texto`). O link de volta tem a cor do
  rótulo dela (`.sobre`).

  Sem campo de busca. À direita, o ícone da especialidade num ladrilho de
  vidro, alinhado à borda direita do texto. As duas colunas ficam até o
  celular, onde o ícone sai e a faixa fica curta.

  As regras daqui valem sobre as da busca qualquer que seja a ordem em que
  as duas folhas chegam ao navegador:
  - `.especialidade[data-faixa]` pesa mais que `.faixa`;
  - `.especialidade h1` e `.especialidade h1 + p` pesam mais que `.titulo`
    e `.texto`.

  O vidro do ladrilho é branco translúcido e a sombra é preta: nenhum dos
  dois tem tom.
*/

.especialidade[data-faixa] {
  grid-template-columns: minmax(0, 1fr) auto;
}

.especialidade h1 {
  max-width: 14ch;
}

.especialidade h1 + p {
  max-width: 34em;
}

.volta {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.volta svg {
  width: 15px;
  height: 15px;
  transition: transform 0.3s cubic-bezier(0.2, 0.7, 0.2, 1);
}

.volta:hover svg {
  transform: translateX(-3px);
}

.selo {
  display: grid;
  place-items: center;
  width: 168px;
  height: 168px;
  border-radius: 40px;
  background: linear-gradient(150deg, rgba(255, 255, 255, 0.11) 0%, rgba(255, 255, 255, 0.03) 100%);
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.14),
    0 24px 60px rgba(0, 0, 0, 0.22);
  color: var(--color-ami-lima-400);
}

.selo svg {
  width: 84px;
  height: 84px;
}

@media (max-width: 980px) {
  .selo {
    width: 128px;
    height: 128px;
    border-radius: 32px;
  }

  .selo svg {
    width: 64px;
    height: 64px;
  }
}

@media (max-width: 700px) {
  .especialidade[data-faixa] {
    grid-template-columns: 1fr;
  }

  .selo {
    display: none;
  }
}
```

- [ ] **Step 4: A faixa**

`components/especialidades/FaixaDaEspecialidade.tsx`:

```tsx
import Link from "next/link";
import { Icone } from "@/components/base/Icone";
import busca from "@/components/busca/FaixaDaBusca.module.css";
import styles from "@/components/especialidades/FaixaDaEspecialidade.module.css";
import { iconeDaEspecialidade } from "@/lib/especialidades";

/*
  A faixa verde de ponta a ponta que abre a página de cada especialidade.
  - No lugar do rótulo, o link de volta ao índice ("← ESPECIALIDADES", como
    o "← ENCONTRE UM MÉDICO" do perfil).
  - O título e o parágrafo de abertura, gerado dos dados
    (`paragrafoDeAbertura`, lib/dados/facetas.ts).
  - À direita, o ícone da especialidade, que some no celular.

  Sem campo de busca, sem `Cabeceira` e sem trilha.

  - `data-abertura`: a barra do pé do celular aparece quando esta faixa sai
    da tela; o "Encontrar médico" dela leva a `/busca`.
  - `data-faixa`: a faixa fica fora da coluna da página
    (app/(site)/encontre.module.css).
*/
export function FaixaDaEspecialidade({
  nome,
  slug,
  paragrafo,
}: {
  nome: string;
  slug: string;
  paragrafo: string;
}) {
  return (
    <section
      data-bloco="topo"
      data-faixa=""
      data-abertura=""
      aria-labelledby="especialidade-titulo"
      className={`textura-verde ${busca.faixa} ${styles.especialidade}`}
    >
      <div className="brilho" aria-hidden="true"></div>

      <div>
        <Link href="/medicos" className={`rotulo-secao ${busca.sobre} ${styles.volta}`} data-coluna="">
          <Icone nome="voltar" /> Especialidades
        </Link>
        <h1 id="especialidade-titulo" className={busca.titulo}>
          {`${nome} em Imperatriz`}
        </h1>
        <p className={busca.texto}>{paragrafo}</p>
      </div>

      <div className={styles.selo} aria-hidden="true">
        <Icone nome={iconeDaEspecialidade(slug)} duotone tamanho={84} />
      </div>
    </section>
  );
}
```

- [ ] **Step 5: A contagem e a grade**

`components/especialidades/MedicosDaEspecialidade.tsx`:

```tsx
import resultados from "@/components/busca/ResultadosDaBusca.module.css";
import { GradeMedicos } from "@/components/diretorio/GradeMedicos";
import { textoDaContagem } from "@/lib/encontre";
import type { Medico } from "@/lib/dados/tipos";

/* Os cartões da primeira fileira do computador: baixam a foto logo. */
const IMEDIATOS = 4;

/*
  A contagem ("3 médicos"), a frase da ordem e a grade de cartões da busca,
  na página de uma especialidade.
  - Cada cartão mostra a especialidade da página, com o RQE dela, e não a
    principal do médico (`especialidade`, o slug).
  - A lista chega em ordem alfabética (`buscarMedicos`, lib/dados/medicos.ts).
*/
export function MedicosDaEspecialidade({
  medicos,
  especialidade,
}: {
  medicos: Medico[];
  especialidade: string;
}) {
  return (
    <section data-bloco="medicos" aria-labelledby="contagem">
      <div className={resultados.cab}>
        <h2 id="contagem" className={resultados.contagem} data-coluna="">
          {textoDaContagem(medicos.length, null)}
        </h2>
        <p className={resultados.ordem}>Em ordem alfabética</p>
      </div>
      <GradeMedicos medicos={medicos} imediatos={IMEDIATOS} especialidade={especialidade} />
    </section>
  );
}
```

- [ ] **Step 6: O CSS do Sobre**

`components/especialidades/SobreAEspecialidade.module.css`:

```css
/*
  "Sobre a {especialidade}", transcrito do desenho aprovado
  (docs/desenho-aprovado/especialidades/especialidade.html:
  `.faixa-branca`, `.sobre-esp h2`, `.sobre-colunas` e o que vem dentro
  dela, `.revisao`, `.revisao b`, e os @media de 980 e 700px).

  Faixa branca de ponta a ponta, o mesmo recurso da home: sem canto nem
  sombra, com a margem lateral das faixas (`--borda-faixa`, app/globals.css)
  e sem margem embaixo. O rodapé emenda nela
  (components/layout/Rodape.module.css).

  Duas regras não estão no desenho, que só mostra um parágrafo por coluna:
  o espaço entre dois parágrafos, e entre um parágrafo e uma lista que vem
  depois dele. São 16px, o mesmo do `ul + p` do desenho.

  O "Texto da AMI a entrar." usa o cinza e o itálico de "Quem é a AMI?"
  (components/home/SejaAssociado.module.css, `.falta`).
*/

.faixa {
  padding: 96px var(--borda-faixa);
  background: var(--color-surface);
}

.colunas {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 40px 64px;
  margin-top: 40px;
}

.colunas h3 {
  font-size: 24px;
  line-height: 1.15;
}

.colunas p,
.colunas li {
  font-size: 16.5px;
  line-height: 1.7;
  color: var(--color-ink-600);
}

.colunas h3 + p,
.colunas h3 + ul {
  margin-top: 12px;
}

.colunas ul {
  margin: 0;
  padding: 0;
  list-style: none;
}

.colunas li {
  position: relative;
  padding-left: 20px;
}

.colunas li::before {
  content: "";
  position: absolute;
  left: 2px;
  top: 0.72em;
  width: 6px;
  height: 6px;
  border-radius: 99px;
  background: var(--color-ami-green-600);
}

.colunas li + li {
  margin-top: 6px;
}

.colunas ul + p,
.colunas p + p,
.colunas p + ul {
  margin-top: 16px;
}

.colunas .falta {
  color: var(--color-ink-400);
  font-style: italic;
}

.revisao {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 6px 24px;
  margin-top: 56px;
  padding-top: 24px;
  border-top: 1px solid var(--color-line);
  font-size: 13.5px;
  line-height: 1.6;
  color: var(--color-ink-400);
}

.revisao b {
  font-weight: 600;
  color: var(--color-ink-600);
}

.crm {
  font-variant-numeric: tabular-nums;
}

@media (max-width: 980px) {
  .faixa {
    padding-top: 64px;
    padding-bottom: 64px;
  }
}

@media (max-width: 700px) {
  .faixa {
    padding: 44px var(--borda-faixa);
  }

  .colunas {
    grid-template-columns: 1fr;
    gap: 28px;
    margin-top: 24px;
  }

  .colunas h3 {
    font-size: 21px;
  }

  .colunas p,
  .colunas li {
    font-size: 15.5px;
    line-height: 1.65;
  }

  .revisao {
    flex-direction: column;
    gap: 4px;
    margin-top: 32px;
    padding-top: 18px;
    font-size: 13px;
  }
}
```

- [ ] **Step 7: O Sobre**

`components/especialidades/SobreAEspecialidade.tsx`:

```tsx
import { PortableText, type PortableTextComponents } from "@portabletext/react";
import styles from "@/components/especialidades/SobreAEspecialidade.module.css";
import { tituloDoSobre, type SobreNaTela } from "@/lib/especialidades";
import { TEXTO_A_ENTRAR } from "@/lib/molduras";

/* O texto do Studio só tem parágrafo e lista com marcadores
   (sanity/schemas/textoDeEspecialidade.ts). Cada um sai como tag simples, e
   o CSS do bloco desenha. */
const COMPONENTES: PortableTextComponents = {
  block: { normal: ({ children }) => <p>{children}</p> },
  list: { bullet: ({ children }) => <ul>{children}</ul> },
  listItem: { bullet: ({ children }) => <li>{children}</li> },
};

/*
  "Sobre a {especialidade}": a faixa branca de ponta a ponta que fecha a
  página da especialidade.
  - Duas colunas, "O que faz" e "Quando procurar".
  - Embaixo, quem revisou, o CRM e o mês da revisão, e o aviso de que o
    conteúdo é informativo.

  Conteúdo de saúde é avaliado sob o critério YMYL do Google: sem autoria
  creditada e data de revisão, não ranqueia.

  O que sai é decidido por `sobreDaEspecialidade` (lib/especialidades.ts):
  - com o texto da AMI no Sanity, ele sai;
  - na demonstração sem texto, sai "Texto da AMI a entrar." no lugar dos
    dois textos, e sem a linha do revisor, que não existe;
  - fora dela, a página nem monta este bloco.

  Leva `data-faixa`: o rodapé emenda nele quando ele fecha a página
  (components/layout/Rodape.module.css). Entra na tela com a `.revelar`.
*/
export function SobreAEspecialidade({ nome, sobre }: { nome: string; sobre: SobreNaTela }) {
  const texto = sobre.tipo === "texto" ? sobre.texto : null;

  return (
    <section
      data-bloco="sobre"
      data-faixa=""
      aria-labelledby="sobre-titulo"
      className={`revelar ${styles.faixa}`}
    >
      <h2 id="sobre-titulo" data-coluna="">
        {tituloDoSobre(nome)}
      </h2>

      <div className={styles.colunas}>
        <div>
          <h3>O que faz</h3>
          {texto ? (
            <PortableText value={texto.oQueFaz} components={COMPONENTES} onMissingComponent={false} />
          ) : (
            <p className={styles.falta}>{TEXTO_A_ENTRAR}</p>
          )}
        </div>
        <div>
          <h3>Quando procurar</h3>
          {texto ? (
            <PortableText value={texto.quandoProcurar} components={COMPONENTES} onMissingComponent={false} />
          ) : (
            <p className={styles.falta}>{TEXTO_A_ENTRAR}</p>
          )}
        </div>
      </div>

      <div className={styles.revisao}>
        {texto ? (
          <p>
            Revisado por <b>{texto.revisorNome}</b>
            {" · "}
            <span className={styles.crm}>{texto.revisorCrm}</span>
            {` · revisão em ${texto.mesDaRevisao}`}
          </p>
        ) : null}
        <p>Conteúdo informativo; não substitui a consulta médica.</p>
      </div>
    </section>
  );
}
```

- [ ] **Step 8: Rodar, provar por mutação, commit**

Run: `npx vitest run` · `npx tsc --noEmit` · `npm run build` → verde.

Os três componentes ainda não estão em página nenhuma. O build passa porque nada os importa; a Task 6 os liga.

Mutações, uma de cada vez, regravando o original depois:

1. Na faixa, troque `iconeDaEspecialidade(slug)` por `"estetoscopio"`.
2. Na faixa, tire `data-coluna=""` do link.
3. Em `MedicosDaEspecialidade`, tire `especialidade={especialidade}`.
4. No Sobre, troque o `{texto ? (<p>Revisado por …</p>) : null}` da `.revisao` por um `<p>Revisado por</p>` fixo, que sai também no "a entrar".
5. No Sobre, troque `listItem: { bullet: … <li> }` por `<p>`.
6. Troque `.especialidade[data-faixa]` por `.especialidade` (nas duas regras).
7. Tire `display: none;` do `.selo` no celular.

```bash
git add components/especialidades/FaixaDaEspecialidade.tsx components/especialidades/FaixaDaEspecialidade.module.css components/especialidades/MedicosDaEspecialidade.tsx components/especialidades/SobreAEspecialidade.tsx components/especialidades/SobreAEspecialidade.module.css testes/blocos-da-especialidade.test.ts
git commit -m "Pagina da especialidade, os blocos: faixa verde com volta e icone, contagem e grade com a especialidade da pagina, e o Sobre com texto ou a entrar"
```

---

### Task 6: A página `/medicos/[especialidade]`

**Files:**
- Modify: `app/(site)/medicos/[especialidade]/page.tsx` (reescrita)
- Modify: `lib/dados/facetas.ts` (reescrita), `testes/facetas.test.ts` (reescrita)
- Modify: `lib/dados/especialidades.ts` (`especialidadePorSlug`)
- Create: `testes/pagina-de-especialidade.test.ts`, `testes/especialidade-por-slug.test.ts`
- Modify: `testes/sem-bairros.test.ts`, `testes/porta-da-busca.test.ts`, `testes/especialidade-metadados.test.ts` (dublês)
- Modify: `app/(site)/encontre.module.css`, `components/layout/Cabeceira.tsx`, `components/layout/Rodape.module.css` (comentários)

**Interfaces:**
- Consumes:
  - `FaixaDaEspecialidade`, `MedicosDaEspecialidade`, `SobreAEspecialidade` (Task 5);
  - `sobreDaEspecialidade` (Task 1);
  - `textoDaEspecialidade` (Task 2);
  - `DADOS_DEMONSTRACAO` (`lib/demonstracao.ts`);
  - `itemList`, `comoItensDeLista` (`lib/seo/jsonld.ts`).
- Produces:
  - `export function paragrafoDeAbertura(especialidade: string, total: number): string` (`lib/dados/facetas.ts`). Saem `ResumoFaceta` e `resumirFaceta`, que só a página antiga usava.
  - `especialidadePorSlug(slug: string): Promise<{ nome: string; slug: string } | null>` (`lib/dados/especialidades.ts`).

- [ ] **Step 1: Os testes**

Reescreva `testes/facetas.test.ts` inteiro:

```ts
import { describe, expect, it } from "vitest";
import { paragrafoDeAbertura } from "@/lib/dados/facetas";

describe("paragrafoDeAbertura", () => {
  it("o texto da spec, com o número e o nome do profissional", () => {
    expect(paragrafoDeAbertura("Cardiologia", 3)).toBe(
      "A Associação Médica de Imperatriz reúne 3 cardiologistas em Imperatriz, no Maranhão. " +
        "Cada perfil traz o número de registro no Conselho Regional de Medicina.",
    );
  });

  it("concorda o singular", () => {
    expect(paragrafoDeAbertura("Cardiologia", 1)).toContain("reúne 1 cardiologista em Imperatriz");
  });

  it("o nome do profissional vem da tabela de sinônimos; fora dela, o rótulo neutro", () => {
    expect(paragrafoDeAbertura("Clínica Médica", 4)).toContain("reúne 4 clínicos gerais em");
    expect(paragrafoDeAbertura("Ortopedia e Traumatologia", 2)).toContain("reúne 2 ortopedistas em");
    expect(paragrafoDeAbertura("Angiologia", 2)).toContain("reúne 2 médicos de Angiologia em");
  });

  it("não fala de bairro, telemedicina, acessibilidade nem associado", () => {
    /* Os quatro saíram do site em 03/10/2026. */
    const p = paragrafoDeAbertura("Cardiologia", 3).toLowerCase();
    for (const fora of ["bairro", "telemedicina", "cadeirante", "acessibilidade", "associad"]) {
      expect(p, fora).not.toContain(fora);
    }
  });
});
```

`testes/especialidade-por-slug.test.ts`:

```ts
import { describe, expect, it, vi } from "vitest";

/*
  `especialidadePorSlug` com o cliente do Supabase trocado por um dublê que
  anota o que foi pedido. O "Sobre a especialidade" vem do Sanity, e as
  colunas `o_que_faz` e `quando_procurar` deixaram de ser lidas pelo site.
  Elas continuam no banco: o dublê as devolve, e a função não as repassa.
*/

const pedido = vi.hoisted(() => ({ tabela: "", colunas: "", slug: "" }));

vi.mock("@/lib/dados/cliente", () => {
  const consulta: Record<string, unknown> = {};
  consulta.select = (colunas: string) => {
    pedido.colunas = colunas;
    return consulta;
  };
  consulta.eq = (_coluna: string, valor: string) => {
    pedido.slug = valor;
    return consulta;
  };
  consulta.maybeSingle = () =>
    Promise.resolve({
      data: {
        nome: "Cardiologia",
        slug: "cardiologia",
        o_que_faz: "[PROVISÓRIO] texto antigo",
        quando_procurar: "[PROVISÓRIO] texto antigo",
      },
      error: null,
    });
  return {
    clienteServidor: () => ({
      from: (tabela: string) => {
        pedido.tabela = tabela;
        return consulta;
      },
    }),
  };
});

const { especialidadePorSlug } = await import("@/lib/dados/especialidades");

describe("especialidadePorSlug", () => {
  it("lê do banco só o nome e o slug da especialidade pedida", async () => {
    expect(await especialidadePorSlug("cardiologia")).toEqual({ nome: "Cardiologia", slug: "cardiologia" });
    expect(pedido).toEqual({ tabela: "especialidade", colunas: "nome, slug", slug: "cardiologia" });
  });
});
```

`testes/pagina-de-especialidade.test.ts`:

```ts
import { afterEach, describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { Bone } from "@phosphor-icons/react/dist/ssr";
import type { PortableTextBlock } from "@portabletext/react";
import estilosPagina from "@/app/(site)/encontre.module.css";
import type { Medico } from "@/lib/dados/tipos";
import type { TextoDeEspecialidade } from "@/lib/sanity/tipos";
import { fonte, semComentarios } from "@/testes/apoio";
import { htmlDe } from "@/testes/renderizar";

/*
  A página de uma especialidade de verdade, renderizada:
  app/(site)/medicos/[especialidade]/page.tsx com as três fontes trocadas
  por dublês (os médicos, a especialidade e o texto do Sanity).

  A chave de demonstração é lida quando lib/demonstracao.ts é importado:
  cada caso troca a chave e importa a página de novo, como
  testes/renderizar.ts faz com o cabeçalho.

  O exemplo é o da spec, seção 2.3: na página de Ortopedia, Aline Peixoto
  (principal Neurologia, secundária Ortopedia) aparece como ortopedista.
*/

vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));

const dados = vi.hoisted(() => ({
  medicos: [] as Medico[],
  texto: null as TextoDeEspecialidade | null,
  pedidos: [] as string[],
}));

vi.mock("@/lib/dados/medicos", () => ({ buscarMedicos: async () => dados.medicos }));
vi.mock("@/lib/dados/especialidades", () => ({
  especialidadesComContagem: async () => [
    { nome: "Ortopedia e Traumatologia", slug: "ortopedia-e-traumatologia", total: 2 },
  ],
  especialidadePorSlug: async (slug: string) =>
    slug === "ortopedia-e-traumatologia" ? { nome: "Ortopedia e Traumatologia", slug } : null,
}));
vi.mock("@/lib/sanity/consultas", () => ({
  textoDaEspecialidade: async (slug: string) => {
    dados.pedidos.push(slug);
    return dados.texto;
  },
}));

const ORTOPEDIA = { nome: "Ortopedia e Traumatologia", slug: "ortopedia-e-traumatologia" };

function medico(id: number, nome: string, especialidades: Medico["especialidades"]): Medico {
  return {
    id,
    slug: `medico-${id}`,
    nome,
    crm: String(10000 + id),
    crmUf: "MA",
    foto: null,
    bio: null,
    telemedicina: false,
    associadoAmi: true,
    especialidades,
    locais: [],
  };
}

const ALINE = medico(1, "Aline Peixoto", [
  { nome: "Neurologia", slug: "neurologia", rqe: "12222", principal: true },
  { ...ORTOPEDIA, rqe: "30111", principal: false },
]);
const GUSTAVO = medico(2, "Gustavo Serra", [{ ...ORTOPEDIA, rqe: "30222", principal: true }]);

const bloco = (texto: string) =>
  ({
    _type: "block",
    _key: "b",
    style: "normal",
    markDefs: [],
    children: [{ _type: "span", _key: "s", text: texto, marks: [] }],
  }) as PortableTextBlock;

const TEXTO: TextoDeEspecialidade = {
  oQueFaz: [bloco("O ortopedista cuida dos ossos e das articulações.")],
  quandoProcurar: [bloco("Dor nas articulações que não passa.")],
  revisorNome: "Dra. Exemplo Revisora",
  revisorCrm: "CRM/MA 10000",
  mesDaRevisao: "setembro de 2026",
};

async function pagina(chave: string, especialidade = "ortopedia-e-traumatologia") {
  vi.stubEnv("NEXT_PUBLIC_DADOS_DEMONSTRACAO", chave);
  vi.resetModules();
  const { default: Pagina } = await import("@/app/(site)/medicos/[especialidade]/page");
  return htmlDe(await Pagina({ params: Promise.resolve({ especialidade }) }));
}

const blocos = (html: string) => [...html.matchAll(/data-bloco="([^"]+)"/g)].map((m) => m[1]);
const tela = (html: string) =>
  html
    .replace(/<script[\s\S]*?<\/script>/g, "")
    .replace(/<!-- -->/g, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

afterEach(() => {
  vi.unstubAllEnvs();
  dados.medicos = [ALINE, GUSTAVO];
  dados.texto = null;
  dados.pedidos = [];
});
dados.medicos = [ALINE, GUSTAVO];

describe("a página de uma especialidade", () => {
  it("abre com a faixa verde, sem Cabeceira, sem trilha e sem BreadcrumbList", async () => {
    const html = await pagina("true");
    expect(html).toMatch(new RegExp(`<div class="${estilosPagina.pagina}"><section data-bloco="topo"`));
    expect(html.match(/<h1\b/g)).toHaveLength(1);
    expect(html).toMatch(/<h1 id="especialidade-titulo"[^>]*>Ortopedia e Traumatologia em Imperatriz<\/h1>/);
    expect(html).not.toContain("Trilha de navegação");
    expect(html).not.toContain("-mt-32");
    expect(html).not.toContain("BreadcrumbList");
  });

  it("o parágrafo de abertura curto, gerado dos dados, e o ícone da especialidade", async () => {
    const html = await pagina("true");
    expect(tela(html)).toContain(
      "A Associação Médica de Imperatriz reúne 2 ortopedistas em Imperatriz, no Maranhão. " +
        "Cada perfil traz o número de registro no Conselho Regional de Medicina.",
    );
    expect(html).toContain(
      renderToString(createElement(Bone, { size: 84, weight: "duotone", className: "", "aria-hidden": "true" })),
    );
  });

  it("a contagem e a grade, com a especialidade da página no cartão de quem a tem como secundária", async () => {
    const html = await pagina("true");
    expect(html).toMatch(/<h2 id="contagem"[^>]*>2 médicos<\/h2>/);
    const aline = html.slice(html.indexOf(">Aline Peixoto<"), html.indexOf(">Gustavo Serra<"));
    /* No HTML, o RQE tem o espaço que não quebra; `tela` o troca por espaço
       comum (`\s` do JavaScript inclui o U+00A0). */
    expect(aline).toContain("RQE 30111");
    expect(tela(aline)).toContain("Ortopedia e Traumatologia RQE 30111");
    expect(aline).not.toContain("Neurologia");
  });

  it("o ItemList dos médicos continua", async () => {
    const html = await pagina("true");
    expect(html).toContain('"@type":"ItemList"');
    expect(html).toContain('"name":"Aline Peixoto"');
  });

  it("pede ao Sanity o texto da especialidade da página", async () => {
    await pagina("true");
    expect(dados.pedidos).toEqual(["ortopedia-e-traumatologia"]);
  });

  it("com o texto da AMI, o Sobre sai nos dois modos, e é o último bloco: o rodapé emenda nele", async () => {
    for (const chave of ["true", "false"]) {
      dados.texto = TEXTO;
      const html = await pagina(chave);
      expect(blocos(html), chave).toEqual(["topo", "medicos", "sobre"]);
      expect(tela(html), chave).toContain("O ortopedista cuida dos ossos e das articulações.");
      expect(tela(html), chave).toContain("Revisado por Dra. Exemplo Revisora · CRM/MA 10000 · revisão em setembro de 2026");
      /* O último elemento do invólucro, que é o último do `<main>`, é a faixa
         do Sobre (components/layout/Rodape.module.css). */
      expect(html, chave).toMatch(/<section data-bloco="sobre" data-faixa=""[\s\S]*<\/section><\/div>$/);
    }
  });

  it("sem texto, na demonstração: o Sobre com o texto a entrar e sem revisor", async () => {
    const html = await pagina("true");
    expect(blocos(html)).toEqual(["topo", "medicos", "sobre"]);
    expect(html.match(/Texto da AMI a entrar\./g)).toHaveLength(2);
    expect(html).not.toContain("Revisado por");
  });

  it("sem texto, fora da demonstração: sem o Sobre, e a grade fecha a página", async () => {
    const html = await pagina("false");
    expect(blocos(html)).toEqual(["topo", "medicos"]);
    expect(html).not.toContain("Sobre a ");
    expect(html).not.toContain("a entrar");
    expect(html).toMatch(/<section data-bloco="medicos"[\s\S]*<\/ul><\/section><\/div>$/);
  });

  it("nenhum texto provisório, nem Outras especialidades", async () => {
    for (const chave of ["true", "false"]) {
      const html = await pagina(chave);
      expect(html, chave).not.toContain("PROVISÓRIO");
      expect(html, chave).not.toContain("Outras especialidades");
    }
  });

  it("especialidade que não existe: página não encontrada", async () => {
    await expect(pagina("true", "nao-existe")).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("especialidade sem médico: página não encontrada", async () => {
    dados.medicos = [];
    await expect(pagina("true")).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("continua pronta no build: sem searchParams, com generateStaticParams e revalidate", async () => {
    /* Ligação com o Next: é a leitura de `searchParams` que tira a página
       do pré-render. */
    expect(semComentarios(fonte("../app/(site)/medicos/[especialidade]/page.tsx"))).not.toContain("searchParams");
    vi.resetModules();
    const modulo = await import("@/app/(site)/medicos/[especialidade]/page");
    expect(modulo.revalidate).toBe(3600);
    expect(await modulo.generateStaticParams()).toEqual([{ especialidade: "ortopedia-e-traumatologia" }]);
  });
});
```

Nos três testes antigos que importam a página:

1. `testes/sem-bairros.test.ts`:
   - Troque o dublê `especialidadePorSlug: async () => ({ nome: "Cardiologia", slug: "cardiologia", oQueFaz: null, quandoProcurar: null }),` por `especialidadePorSlug: async () => ({ nome: "Cardiologia", slug: "cardiologia" }),`.
   - Logo depois do `vi.mock("@/lib/dados/especialidades", …)`, acrescente:

     ```ts
     vi.mock("@/lib/sanity/consultas", () => ({ textoDaEspecialidade: async () => null }));
     ```

2. `testes/porta-da-busca.test.ts`:
   - No dublê de `@/lib/dados/especialidades`, troque o objeto devolvido por `especialidadePorSlug` (o de quatro linhas, com `oQueFaz: null` e `quandoProcurar: null`) por `({ nome: "Cardiologia", slug: "cardiologia" })`.
   - Logo depois desse `vi.mock`, acrescente a mesma linha do dublê de `@/lib/sanity/consultas`.

3. `testes/especialidade-metadados.test.ts`: troque `{ nome: "Cardiologia", slug, oQueFaz: null, quandoProcurar: null }` por `{ nome: "Cardiologia", slug }`.

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run testes/facetas.test.ts testes/especialidade-por-slug.test.ts testes/pagina-de-especialidade.test.ts`
Expected: FAIL. O parágrafo é o longo e tem outra assinatura, a consulta lê `o_que_faz`, e a página é a antiga, com `Cabeceira`.

- [ ] **Step 3: O parágrafo**

Reescreva `lib/dados/facetas.ts` (CRLF; leia antes) inteiro:

```ts
import { comoProfissional } from "@/lib/dados/sinonimos";

/**
 * Parágrafo de abertura da página de especialidade, na faixa verde do topo.
 *
 * Duas frases, as da spec de Especialidades: quantos profissionais a AMI
 * reúne na especialidade, com o nome que o paciente usa ("cardiologistas",
 * de lib/dados/sinonimos.ts), e o registro no CRM de cada perfil. O número
 * sai dos dados; nunca é escrito à mão.
 *
 * Bairro, telemedicina, acessibilidade e associados não entram: saíram do
 * site em 03/10/2026.
 */
export function paragrafoDeAbertura(especialidade: string, total: number): string {
  const [singular, plural] = comoProfissional(especialidade);
  return (
    `A Associação Médica de Imperatriz reúne ${total} ${total === 1 ? singular : plural} ` +
    `em Imperatriz, no Maranhão. Cada perfil traz o número de registro no ` +
    `Conselho Regional de Medicina.`
  );
}
```

- [ ] **Step 4: A especialidade, só com nome e slug**

Em `lib/dados/especialidades.ts` (CRLF, com BOM), troque o bloco inteiro de `especialidadePorSlug`, do comentário `/* Memoizada:` até o fim do arquivo, por:

```ts
/* Memoizada: a página chama isto no generateMetadata e de novo no corpo,
   e sem cache seriam duas idas ao banco por requisição. O argumento é uma
   string, então a comparação por identidade do cache funciona.

   Só o nome e o slug. O "Sobre a especialidade" (o que faz, quando
   procurar, o revisor) vem do Sanity (`textoDaEspecialidade`,
   lib/sanity/consultas.ts). As colunas `o_que_faz` e `quando_procurar`
   continuam no banco, sem uso no site. */
export const especialidadePorSlug = cache(
  async (slug: string): Promise<{ nome: string; slug: string } | null> => {
    const { data, error } = await clienteServidor()
      .from("especialidade")
      .select("nome, slug")
      .eq("slug", slug)
      .maybeSingle();

    if (error) throw new Error(`Falha ao buscar a especialidade: ${error.message}`);
    if (!data) return null;

    return { nome: data.nome as string, slug: data.slug as string };
  },
);
```

- [ ] **Step 5: A página**

Reescreva `app/(site)/medicos/[especialidade]/page.tsx` (LF; leia antes) inteiro:

```tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import paginas from "@/app/(site)/encontre.module.css";
import { FaixaDaEspecialidade } from "@/components/especialidades/FaixaDaEspecialidade";
import { MedicosDaEspecialidade } from "@/components/especialidades/MedicosDaEspecialidade";
import { SobreAEspecialidade } from "@/components/especialidades/SobreAEspecialidade";
import { JsonLd } from "@/components/seo/JsonLd";
import { paragrafoDeAbertura } from "@/lib/dados/facetas";
import { buscarMedicos } from "@/lib/dados/medicos";
import {
  especialidadePorSlug,
  especialidadesComContagem,
} from "@/lib/dados/especialidades";
import { DADOS_DEMONSTRACAO } from "@/lib/demonstracao";
import { sobreDaEspecialidade } from "@/lib/especialidades";
import { textoDaEspecialidade } from "@/lib/sanity/consultas";
import { comoItensDeLista, itemList } from "@/lib/seo/jsonld";
import { descricaoEspecialidade, tituloEspecialidade } from "@/lib/seo/metadados";

export const revalidate = 3600;

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

/* No Next 16, params é Promise e precisa de await. Nada aqui lê
   `searchParams`: ler a querystring, mesmo só nos metadados, faz a página
   ser montada a cada visita, e ela deixaria de sair pronta do build
   (`generateStaticParams`) e de ser refeita só a cada `revalidate`. */
type Props = {
  params: Promise<{ especialidade: string }>;
};

export async function generateStaticParams() {
  const especialidades = await especialidadesComContagem();
  return especialidades.map((e) => ({ especialidade: e.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { especialidade } = await params;
  const esp = await especialidadePorSlug(especialidade);
  if (!esp) return {};

  const medicos = await buscarMedicos({ especialidade });
  /* Mesma condição da página: uma especialidade cadastrada sem nenhum
     profissional publicado não pode gerar metadados — title e description
     afirmariam "0 médicos" para um endereço que nem deveria existir. */
  if (medicos.length === 0) return {};

  const bairros = [
    ...new Set(medicos.flatMap((m) => m.locais.map((l) => l.bairro.nome))),
  ];

  return {
    title: tituloEspecialidade(esp.nome, medicos.length),
    description: descricaoEspecialidade(esp.nome, medicos.length, bairros),
    /* O mesmo endereço com qualquer querystring mostra a mesma página: o
       canonical aponta para o endereço limpo, e é ele que entra no índice. */
    alternates: { canonical: `/medicos/${especialidade}` },
  };
}

/*
  A página de uma especialidade:
  - a faixa verde com o link de volta ao índice, o título, o parágrafo de
    abertura e o ícone;
  - a contagem e a grade de cartões da busca, cada um com a especialidade
    da página;
  - "Sobre a {especialidade}", com o texto da AMI no Sanity.

  Sem a `Cabeceira` das páginas internas antigas, sem trilha e sem "Outras
  especialidades". Os blocos são filhos diretos de `.pagina`
  (app/(site)/encontre.module.css), a --ritmo um do outro.

  O "Sobre" segue a trava (`sobreDaEspecialidade`, lib/especialidades.ts):
  - com o texto completo, sai nos dois modos;
  - sem texto, só na demonstração, como "a entrar";
  - fora dela, não existe, e a grade fecha a página a --ritmo do rodapé.

  Uma especialidade cadastrada sem nenhum profissional publicado (a linha
  existe, mas ninguém a preenche ainda) dá página não encontrada, e não um
  título sobre "0 médicos", indexável e canônico para si mesmo.

  O JSON-LD é a lista dos médicos (ItemList). Sem o BreadcrumbList: a
  trilha não aparece na tela, e dado estruturado sem o equivalente visível
  é marcação enganosa (lib/seo/jsonld.ts).
*/
export default async function PaginaEspecialidade({ params }: Props) {
  const { especialidade } = await params;
  const [esp, medicos, texto] = await Promise.all([
    especialidadePorSlug(especialidade),
    buscarMedicos({ especialidade }),
    textoDaEspecialidade(especialidade),
  ]);
  if (!esp || medicos.length === 0) notFound();

  const sobre = sobreDaEspecialidade(DADOS_DEMONSTRACAO, texto);

  return (
    <>
      <JsonLd dados={itemList(comoItensDeLista(medicos), SITE)} />
      <div className={paginas.pagina}>
        <FaixaDaEspecialidade
          nome={esp.nome}
          slug={esp.slug}
          paragrafo={paragrafoDeAbertura(esp.nome, medicos.length)}
        />
        <MedicosDaEspecialidade medicos={medicos} especialidade={esp.slug} />
        {sobre ? <SobreAEspecialidade nome={esp.nome} sobre={sobre} /> : null}
      </div>
    </>
  );
}
```

- [ ] **Step 6: Os comentários que falam das páginas**

1. Em `components/layout/Cabeceira.tsx` (CRLF), troque o primeiro parágrafo (o que a Task 4 escreveu) por:

```
  Cabeceira das páginas internas que ainda não ganharam o desenho novo, como
  A Associação, a diretoria, o contato e as notícias. A busca, o perfil do
  médico e as páginas de especialidades não a usam: o cliente a recusou, e
  elas abrem com o desenho delas.
```

2. Em `app/(site)/encontre.module.css` (LF), troque o comentário do topo (o que a Task 4 escreveu) por:

```css
/*
  A coluna e o ritmo das páginas de "Encontre um médico" (a busca e o
  perfil) e das de especialidades (o índice e a página de cada uma), com a
  mesma regra da home (app/(site)/inicio.module.css):
  - os blocos são filhos diretos de `.pagina`, a --ritmo um do outro e do
    cabeçalho;
  - os que não são faixa de ponta a ponta (`data-faixa`) ficam na caixa de
    1240px do desenho, com 24px de folga de cada lado (12px no celular).

  O rodapé fica a --ritmo do último bloco quando ele não é faixa. A página
  de especialidade que termina no "Sobre", faixa branca de ponta a ponta,
  emenda nele (components/layout/Rodape.module.css).
*/
```

3. Em `components/layout/Rodape.module.css` (CRLF), troque:

```
  Faixa é o bloco que leva `data-faixa` (a busca verde, "Seja associado" e
  os parceiros, na home). A regra pergunta se o último elemento do
  `<main>` é uma faixa, ou se o último elemento do último filho dele é (a
  home põe os blocos dentro de um invólucro, app/(site)/page.tsx). Quando o
```

por

```
  Faixa é o bloco que leva `data-faixa`: na home, a busca verde, "Seja
  associado" e os parceiros; na página de cada especialidade, o "Sobre". A
  regra pergunta se o último elemento do `<main>` é uma faixa, ou se o
  último elemento do último filho dele é: a home e as páginas do diretório
  põem os blocos dentro de um invólucro (app/(site)/page.tsx e
  app/(site)/encontre.module.css). Quando o
```

4. `grep -rn "resumirFaceta\|ResumoFaceta\|oQueFaz\|quandoProcurar\|o_que_faz\|quando_procurar" app components lib testes`. O que pode sobrar:
   - `oQueFaz`/`quandoProcurar` do Sanity: `lib/sanity/`, `sanity/schemas/`, `components/especialidades/` e os testes deles;
   - `o_que_faz`/`quando_procurar` só no comentário de `lib/dados/especialidades.ts` e no dublê de `testes/especialidade-por-slug.test.ts`.

   Nada de `resumirFaceta` nem `ResumoFaceta`.

- [ ] **Step 7: Rodar, provar por mutação, conferir, commit**

Run: `npx vitest run` · `npx tsc --noEmit` · `npm run build` → verde.

No resumo do `npm run build`, `/medicos/[especialidade]` continua marcada como gerada no build (●, SSG), e não ƒ (dinâmica), com as especialidades listadas.

Mutações, uma de cada vez, regravando o original depois:

1. Na página, troque `sobreDaEspecialidade(DADOS_DEMONSTRACAO, texto)` por `sobreDaEspecialidade(true, texto)`.
2. Na página, tire `especialidade={esp.slug}` do `MedicosDaEspecialidade`.
3. Na página, troque `textoDaEspecialidade(especialidade)` por `Promise.resolve(null)`.
4. Na página, tire `|| medicos.length === 0`.
5. Em `especialidadePorSlug`, volte o `.select` para `"nome, slug, o_que_faz, quando_procurar"`.
6. Em `paragrafoDeAbertura`, troque `total === 1 ? singular : plural` por `plural`.

Conferência rápida no navegador:
1. `npm run build` e `npx next start -p 3300`.
2. Abra `/medicos/cardiologia` a 1440 e a 390px.
3. Expected:
   - igual a `docs/desenho-aprovado/especialidades/especialidade-1440-parte-1.jpg` e `especialidade-390-parte-1.jpg`, com as iniciais no lugar das fotos do Unsplash;
   - o "Sobre" com "Texto da AMI a entrar.", porque o Sanity ainda não tem texto;
   - a faixa branca encostada no rodapé.
4. Derrube o 3300 pelo PID.

```bash
git add "app/(site)/medicos/[especialidade]/page.tsx" lib/dados/facetas.ts testes/facetas.test.ts lib/dados/especialidades.ts testes/pagina-de-especialidade.test.ts testes/especialidade-por-slug.test.ts testes/sem-bairros.test.ts testes/porta-da-busca.test.ts testes/especialidade-metadados.test.ts "app/(site)/encontre.module.css" components/layout/Cabeceira.tsx components/layout/Rodape.module.css
git commit -m "Pagina da especialidade: faixa verde, paragrafo curto, grade com a especialidade da pagina e Sobre pelo Sanity com a trava; o site deixa de ler o_que_faz e quando_procurar"
```

---

### Task 7: A conferência

**Files:**
- Modify: `scripts/auditoria-visual.js` (CRLF)
- Modify: `vitest.config.ts` (só o comentário)
- Modify: `docs/estado-do-projeto.md` (CRLF)
- Modify: `docs/decisoes-sem-o-cliente.md`

- [ ] **Step 1: A auditoria confere os cartões do índice**

Em `scripts/auditoria-visual.js`:

(a) No comentário do topo:
- Troque a linha

```
  Nas páginas com `data-bloco` (a home, a busca e o perfil):
```

por

```
  Nas páginas com `data-bloco` (a home, a busca, o perfil e as de especialidades):
```

- Depois do item dos "Ligar", que termina na linha `    (`data-ligar`, o botão ou o espaço dele);`, acrescente:

```
  - os cartões do índice de especialidades: todos com a mesma altura, e em
    cada fileira o nome e a contagem na mesma linha
    (`data-cartao-de-especialidade`, `data-nome`, `data-contagem`);
```

(b) Logo depois de `info.fileirasDeCartoes = fileiras.size;` (o fim da conferência 13), acrescente:

```js

  /* 14. Os cartões do índice de especialidades: todos com a altura do mais
     alto, e em cada fileira o nome e a contagem na mesma linha. */
  const fileirasDeEsp = new Map();
  for (const c of document.querySelectorAll("[data-cartao-de-especialidade]")) {
    if (R(c).height === 0) continue;
    const topo = Math.round(topoAbs(c));
    if (!fileirasDeEsp.has(topo)) fileirasDeEsp.set(topo, []);
    fileirasDeEsp.get(topo).push({
      altura: Math.round(R(c).height * 10) / 10,
      nome: Math.round(topoAbs(c.querySelector("[data-nome]")) * 10) / 10,
      conta: Math.round(topoAbs(c.querySelector("[data-contagem]")) * 10) / 10,
    });
  }
  const espalha = (xs) => Math.max(...xs) - Math.min(...xs);
  const alturasDeEsp = [];
  for (const [topo, cs] of fileirasDeEsp) {
    for (const medida of ["nome", "conta"]) {
      const xs = cs.map((c) => c[medida]);
      if (espalha(xs) > 0.5)
        problemas.push(`cartões de especialidade com ${medida} desalinhado na fileira de ${topo}px: ${xs.join("/")}`);
    }
    alturasDeEsp.push(...cs.map((c) => c.altura));
  }
  if (alturasDeEsp.length && espalha(alturasDeEsp) > 0.5)
    problemas.push(`cartões de especialidade de alturas diferentes: ${[...new Set(alturasDeEsp)].join("/")}`);
  info.fileirasDeEspecialidades = fileirasDeEsp.size;
  info.alturaDosCartoesDeEspecialidade = [...new Set(alturasDeEsp)].join("/");
```

- [ ] **Step 2: O comentário do Vitest**

Em `vitest.config.ts`, no fim do comentário, troque

```
   `testes/cabecalho.test.ts`, o menu. */
```

por

```
   `testes/cabecalho.test.ts`, o menu. `testes/indice-de-especialidades.test.ts`
   e `testes/pagina-de-especialidade.test.ts` renderizam `/medicos` e uma
   especialidade, com `htmlDe` e as fontes de dados (o banco e o Sanity)
   trocadas por dublês; `testes/blocos-da-especialidade.test.ts`, os três
   blocos da página da especialidade, com `renderToString`. */
```

- [ ] **Step 3: Produção, nas 8 larguras, com as duas chaves**

`npm run build` e `npx next start -p 3300`.

Rode a auditoria em cada página e largura:
- Cole `scripts/auditoria-visual.js` no console ou use a ferramenta de navegador, esperando a promessa.
- A página precisa estar recém-aberta, sem rolar.
- Abra cada página por endereço, e não pelo menu, antes de cada rodada: a conferência 12 navega e termina noutra página.

Com a chave de hoje (demonstração):
- Páginas:
  - `/medicos`;
  - `/medicos/cardiologia` (três médicos);
  - `/medicos/ortopedia-e-traumatologia` (Aline como secundária);
  - `/medicos/clinica-medica` (quatro);
  - para conferir que nada regrediu: `/busca`, `/medico/<slug com dois consultórios>` e `/`.
- Larguras: 375, 390, 430, 768, 1024, 1280, 1440, 1920.

Depois, `NEXT_PUBLIC_DADOS_DEMONSTRACAO=false npm run build` e `npx next start -p 3300`. Rode a auditoria em `/medicos` e `/medicos/cardiologia` nas mesmas 8 larguras. No fim, refaça o build com a chave de hoje.

**Expected: `problemas: []` em todas.**

| Medida | O que conferir |
|---|---|
| `colunaTexto` | o mesmo número em todos os blocos: 172 a 1440, 72 a 1024, 52 a 768, 32 a 390 (relatório do desenho) |
| `espacosEntreBlocos` | a `--ritmo` |
| `ultimoAoRodape` | 0 com o "Sobre" (faixa); a `--ritmo` sem ele (chave `false`) |
| `fileirasDeEspecialidades` e `alturaDosCartoesDeEspecialidade` | um número só de altura: 231 a 1440 e 1024, 205 a 768, 167 a 390 e 375 (relatório). Diferença de até 1px por fonte é aceita; registre a medida |
| `fileirasDeCartoes` | os "Ligar" da página da especialidade alinhados |
| `aberturas` | 0 em todas |

Guarde estes números para o estado do projeto:
- `espacosEntreBlocos`;
- `colunaTexto`;
- `colunaDoLogo`;
- `ultimoAoRodape`;
- `fileirasDeEspecialidades`;
- `alturaDosCartoesDeEspecialidade`;
- `fileirasDeCartoes`;
- `aberturas`.

Corrija o que aparecer na tarefa de origem, com um commit de correção com o nome dela.

- [ ] **Step 4: Contraste medido nas faixas novas**

No navegador, a 1440, 768, 430 e 320px:
1. Ache o ponto mais claro do fundo verde atrás da linha de apoio do índice, do parágrafo da especialidade, do rótulo "ESPECIALIDADES" e do link "← ESPECIALIDADES". Use o método da fatia A: a luz parada no ponto mais claro do caminho dela, com o grão médio.
2. Meça `#cfd8c9` e o lima (o clareado, abaixo de 700px) sobre ele.

Expected: ≥ 4,5:1. O parágrafo da especialidade vai até 34em e passa mais perto da luz do canto que o texto da busca: é o caso a olhar com mais cuidado.

Se algum ficar abaixo, **não** mude a cor na folha da busca. Registre a medida e pare: a correção mexe na busca aprovada e é decisão do controlador.

No branco, meça `#646B75` da contagem do cartão, da linha da revisão e do "Texto da AMI a entrar.". O relatório do desenho mediu 5,38.

- [ ] **Step 5: Fotos comparadas com o desenho**

Fotos da página inteira, com `.superpowers/brainstorm/fatia-b-especialidades/fotos.mjs`. A 390px ele usa a moldura de 390px. Compare, seção por seção:

| Foto do site | Desenho |
|---|---|
| `/medicos` a 1440 | `docs/desenho-aprovado/especialidades/especialidades-1440-parte-1.jpg` e `-parte-2.jpg` |
| `/medicos` a 390 | `especialidades-390-parte-1.jpg` e `-parte-2.jpg` |
| `/medicos/cardiologia` a 1440, demonstração | `especialidade-1440-parte-1.jpg`; a parte 2 só pela forma do "Sobre": colunas, fio, linha de baixo |
| `/medicos/cardiologia` a 390, demonstração | `especialidade-390-parte-1.jpg` e `-parte-2.jpg` |
| `/medicos/cardiologia` a 1440, chave `false` | `especialidade-1440-sem-sobre.jpg` |

Não são diferença:
- o desenho tem fotos do Unsplash, e o site tem as iniciais de quem não mandou foto;
- o desenho tem o texto de exemplo do "Sobre", e o site tem "Texto da AMI a entrar." (o Sanity ainda não tem texto).

Qualquer outra diferença é defeito: medida, cor, ordem, alinhamento, quebra de nome ou texto. Corrija na tarefa de origem.

O "Sobre" com texto real não tem foto nesta fatia: ele só existe quando a AMI cadastrar. O que prova o desenho dele são os testes de renderização (Tasks 5 e 6) e o CSS transcrito.

- [ ] **Step 6: As varreduras**

No 3300, com a chave de hoje, `curl -s` de `/medicos` e de `/medicos/cardiologia`. Tirando o `<script type="application/ld+json">`, nenhuma ocorrência de:
- "PROVISÓRIO";
- "Outras especialidades";
- "Trilha de navegação";
- "Por especialidade";
- "/busca?bairro".

Também:
- em nenhuma das duas: "BreadcrumbList";
- em `/medicos/cardiologia`: tem "ItemList".

Derrube o 3300 pelo PID.

- [ ] **Step 7: O estado do projeto**

Em `docs/estado-do-projeto.md`, depois da seção "### Encontre um médico — fatia B, grupo 1 (a busca e o perfil)" e antes de "## O que falta", acrescente a seção "### Especialidades — fatia B, grupo 2 (o índice e a página de cada especialidade)". Ela tem:

- **O que mudou no site:**
  - o índice e a página de cada especialidade novos, sem a cabeceira cinza;
  - o índice em ordem alfabética, com ícone por especialidade e o campo de busca;
  - a página de cada especialidade com o ícone grande, o parágrafo curto, a grade de cartões da busca com a especialidade da página no cartão, e o "Sobre" vindo do Sanity;
  - sem "Outras especialidades";
  - o site deixou de ler `o_que_faz` e `quando_procurar` do banco, mas as colunas continuam lá.
- **O que a AMI precisa saber:**
  - o "Sobre" de cada especialidade é escrito e revisado por médico e cadastrado no Studio;
  - enquanto não houver texto, a página mostra "Texto da AMI a entrar." na demonstração e não mostra o bloco fora dela;
  - especialidade nova recebe o estetoscópio como ícone, e o nome do profissional ("cardiologista") precisa entrar na tabela de sinônimos para o parágrafo dizer "3 cardiologistas" em vez de "3 médicos de X".
- **Pendências do cliente.** Passo a passo, com o nome de cada botão, no mesmo formato da seção do grupo 1:
  1. Abrir `/studio`, entrar com a conta do Sanity e conferir que aparece **"Texto de especialidade"** na coluna da esquerda, junto de "Empresa parceira".
  2. Em [sanity.io/manage](https://www.sanity.io/manage), projeto da AMI, **API**, **Webhooks**, o webhook do site, campo **Filter**:
     - vazio: nada a fazer;
     - com uma lista de tipos: acrescentar `"textoDeEspecialidade"`.
  3. No `/studio`, em **Texto de especialidade**, criar um documento por especialidade. Preencher:
     - **Especialidade**: o fim do endereço, como `cardiologia`;
     - **O que faz**;
     - **Quando procurar**;
     - **Revisado por**;
     - **CRM do revisor** ("CRM/MA 12345");
     - **Data da revisão**.

     Depois, clicar em **Publicar**. Repetir para cada especialidade: são as 14 do índice.
- **Os números medidos** no Step 3, colados da saída, e os contrastes do Step 4.
- **As dúvidas em aberto:** a lista do fim deste plano, com o que o controlador ou o cliente decidiram, se já decidiram.

Na seção "## O que falta", item "### 1. Conteúdo da AMI", acrescente um item: "Os textos "Sobre a especialidade" das 14 especialidades, com o médico revisor, o CRM dele e a data da revisão, cadastrados no Studio (tipo "Texto de especialidade")."

Números medidos, não lembrados: cada número que entrar ali saiu de uma rodada desta tarefa.

- [ ] **Step 8: As decisões sem o cliente**

Em `docs/decisoes-sem-o-cliente.md`, na seção "## Grupo 2: Especialidades", depois do item 7, acrescente:

```
8. **Formato do texto "Sobre":** cada um dos dois textos ("O que faz" e "Quando procurar") aceita parágrafos e lista com marcadores, sem negrito nem link, como no desenho. Um texto só aparece com os seis campos preenchidos.
9. **Sem texto cadastrado:** no modo demonstração, o bloco "Sobre" aparece com "Texto da AMI a entrar." no lugar dos dois textos, sem a linha do revisor, e mantém a frase "Conteúdo informativo; não substitui a consulta médica."; fora da demonstração, o bloco não aparece.
10. **Barra do pé no índice:** no celular, o botão "Encontrar médico" do índice leva ao campo de busca da própria faixa, como na home e na busca. Na página de cada especialidade, que não tem campo, leva à busca.
11. **Nomes longos no cartão:** os seis nomes do desenho quebram com hífen no ponto escolhido ("Otorrino-laringologia"). Uma especialidade nova de nome muito longo quebra onde couber.
```

Se o Step 3 ou o Step 4 levaram a alguma outra decisão visível ao cliente, acrescente-a com o próximo número.

- [ ] **Step 9: Rodar tudo e commit**

Run: `npx vitest run` · `npx tsc --noEmit` · `npm run build` → verde.

```bash
git add scripts/auditoria-visual.js vitest.config.ts docs/estado-do-projeto.md docs/decisoes-sem-o-cliente.md
git commit -m "Conferencia de Especialidades: auditoria nas 8 larguras com e sem demonstracao, cartoes do indice alinhados, fotos, estado do projeto e decisoes"
```

---

## Autorrevisão do plano

**1. Cobertura da spec**

| Spec | Onde |
|---|---|
| 1.1 Faixa verde com rótulo, h1, linha de apoio, campo para `/busca?termo=`; sem Cabeceira e sem breadcrumb | Tasks 1 (`linhaDeApoioDoIndice`) e 4 (`FaixaDoIndice`, testes "abre com a faixa verde…" e "o campo…") |
| 1.2 "{N} especialidades" e "Em ordem alfabética" / "De A a Z" no celular | Task 4 (teste da contagem e CSS `.ordemCurta`/`.ordemLonga`) |
| 1.3 Cartões em ordem alfabética, só com médico; ladrilho, nome, "N médicos", seta; cartão inteiro clicável; mouse; mesma altura e alinhamento; 4/3/2/2 colunas; hífen opcional | Tasks 1 (`especialidadesComMedico`, `nomeComQuebras`), 4 (render e CSS) e 7 (conferência 14 e fotos) |
| 1.4 Ícones por slug; Stethoscope como padrão | Tasks 1 (tabela da spec contra o Phosphor) e 4 (ícone no cartão) |
| 1.5 Metadados do índice mantidos, sem bairro | Task 4 (`generateMetadata` intacta e teste "os metadados do índice continuam") |
| 2.1 Faixa com "← ESPECIALIDADES", h1, parágrafo curto, ícone de 168px que some no celular; sem campo, sem Cabeceira, sem breadcrumb | Tasks 5 (`FaixaDaEspecialidade` e CSS) e 6 (`paragrafoDeAbertura`, página) |
| 2.2 Contagem, "Em ordem alfabética" e a grade da busca | Tasks 3 (prop `especialidade`) e 5 (`MedicosDaEspecialidade`) |
| 2.3 Cartão com a especialidade da página e o RQE dela; busca e perfil com a principal | Tasks 1 (`especialidadeDoCartao`), 3 (cartão e grade) e 6 (Aline em Ortopedia) |
| 2.4 "Sobre" em faixa branca que encosta no rodapé; duas colunas, uma no celular; revisão e aviso | Tasks 5 (componente e CSS) e 6 (último bloco, comentário do rodapé), 7 (`ultimoAoRodape` 0) |
| 2.5 Tipo "Texto de especialidade" no Sanity com os seis campos; Supabase deixa de ser lido | Tasks 2 (schema, consulta, webhook) e 6 (`especialidadePorSlug`) |
| 2.6 Trava: completo nos dois modos; sem texto, a entrar só na demonstração e sem revisor; fora dela, sem bloco; nunca "[PROVISÓRIO]" | Tasks 1 (`sobreDaEspecialidade`), 2 (`paraTextoDeEspecialidade` só aceita completo), 5 (render dos dois desenhos) e 6 (página nas duas chaves, varredura de "PROVISÓRIO") |
| 2.7 Sem "Outras especialidades" | Task 6 (teste e varredura) e 7 (curl) |
| 2.8 Título, descrição e canonical ficam; pré-renderizada, sem `searchParams` | Task 6 (`generateMetadata` intacta, teste de `generateStaticParams`/`revalidate`/`searchParams`, resumo do build) e `testes/especialidade-metadados.test.ts` |
| 3. Fora do escopo: textos reais, apagar colunas, foto | Não tocados; pendência do cliente no estado do projeto (Task 7) |
| 4. Ruling 11, auditoria nas 8 larguras com as duas chaves, fotos, contraste, GROQ com `groq-js` | Tasks 1 a 6 (render e função pura), 2 (`groq-js`) e 7 |

**2. Placeholders:** nenhum "TBD" nem "implementar depois"; todo passo de código traz o código. O que o plano não traz só existe depois de medir:
- os números do Step 7 da Task 7, que saem do Step 3;
- os contrastes do Step 4.

Achados desta revisão, já corrigidos no texto:
1. **A tabela de ícones como objeto devolvia uma função** para os slugs "constructor" e "toString". Agora é `Map`, e o teste pega a troca de volta.
2. **O comentário da `Cabeceira` diria "como /medicos" depois da Task 4.** Agora a Task 4 o atualiza, e a Task 6 de novo.
3. **Os três testes antigos que renderizam a página da especialidade quebrariam na Task 6**, porque a página passa a chamar o Sanity e, sem as variáveis de ambiente, `obterCliente` lança. A Task 6 põe o dublê de `@/lib/sanity/consultas` neles.
4. **`especialidadesComMedico` e `opcoesDeEspecialidade` repetiam a mesma regra.** A da busca agora usa a nova.
5. **A frase "cada um com o número" com um médico só** virou "1 médico associado, com o número".

**3. Consistência de nomes:**

| Nome | Tarefas |
|---|---|
| `TextoDeEspecialidade` com `mesDaRevisao` | 1 → 2, 5, 6 |
| `mesDeAno` | 1 → 2 |
| `sobreDaEspecialidade` / `SobreNaTela` | 1 → 5, 6 |
| `iconeDaEspecialidade` | 1 → 4, 5 |
| `especialidadesComMedico` | 1 → `lib/encontre.ts`, 4 |
| `nomeComQuebras`, `linhaDeApoioDoIndice` | 1 → 4 |
| `tituloDoSobre` | 1 → 5 |
| `especialidadeDoCartao` | 1 → 3 |
| `ETIQUETA_TEXTOS_DE_ESPECIALIDADE`, `GROQ_TEXTO_DE_ESPECIALIDADE`, `TextoDeEspecialidadeCru`, `paraTextoDeEspecialidade`, `textoDaEspecialidade` | 2 → 6 |
| prop `especialidade` de `CartaoMedico`/`GradeMedicos` | 3 → 5 |
| `FaixaDoIndice`, `GradeDeEspecialidades` | 4 |
| `FaixaDaEspecialidade`, `MedicosDaEspecialidade`, `SobreAEspecialidade` | 5 → 6 |
| `paragrafoDeAbertura(especialidade, total)` | 6 |
| `especialidadePorSlug` → `{ nome, slug }` | 6 |
| classes `indice`, `campo` (FaixaDoIndice) | 4 |
| classes `cartao`, `nome`, `pe`, `conta`, `seta`, `grade`, `ordemLonga`, `ordemCurta` (GradeDeEspecialidades) | 4 |
| classes `especialidade`, `volta`, `selo` (FaixaDaEspecialidade) | 5 |
| classes `faixa`, `colunas`, `falta`, `revisao`, `crm` (Sobre) | 5 |
| marcas `data-cartao-de-especialidade`, `data-nome`, `data-contagem` | 4 → 7 |
| blocos `topo`, `especialidades`, `medicos`, `sobre` | 4, 5 → 6, 7 |
| ícones `palma`, `meiaGota`, `garfoEFaca`, `feminino`, `cerebro`, `osso`, `orelha`, `bebe`, `conversa`, `mao`, `gota` | 1 |

### Pares de tarefas que tocam o mesmo arquivo

Para o executor conferir conflitos: a tarefa de número maior parte do estado que a menor deixou.

| Arquivo | Tarefas | O que cada uma faz |
|---|---|---|
| `app/(site)/encontre.module.css` (só o comentário do topo) | 4, 6 | 4: acrescenta o índice; 6: as duas páginas de especialidades e a emenda do rodapé no "Sobre" |
| `components/layout/Cabeceira.tsx` (só o primeiro parágrafo do comentário) | 4, 6 | 4: tira `/medicos` dos exemplos; 6: tira "cada especialidade" |

Nenhum outro arquivo é tocado por duas tarefas. Os que uma tarefa só lê, e que outra criou, estão nos blocos **Interfaces**.

## Decisões deste plano que a spec não fixava

Registrar no diário ao executar. As visíveis ao cliente vão para `docs/decisoes-sem-o-cliente.md` (Task 7, Step 8).

- **D1. As faixas reaproveitam o CSS da faixa da busca** (`FaixaDaBusca.module.css`). As diferenças do desenho vão em folhas próprias com seletor mais pesado (`.indice[data-faixa]`, `.especialidade h1`, `.especialidade h1 + p`): valem qualquer que seja a ordem em que o Next junta as folhas. O arquivo da busca e o teste dele não mudam.
- **D2. O campo do índice é o formulário GET simples da home**, com as classes da home. Não é o `FormularioDaBusca`, que traz a lista de especialidades e o estado do roteador da busca: no índice, a lista é a própria grade.
- **D3. No celular, "Encontrar médico" do índice leva ao campo da própria faixa** (`#encontre`), como na home e na busca. O desenho faz o mesmo (`href="#conteudo"` e foco no campo). Na página da especialidade, que não tem campo, leva a `/busca`.
- **D4. Sai o BreadcrumbList das duas páginas.** Elas não têm trilha na tela, e o próprio projeto proíbe o dado sem o visível: o comentário de `breadcrumbList` em `lib/seo/jsonld.ts` e o Ruling 2 do grupo 1, que fez o mesmo no perfil. O ItemList dos médicos fica na página da especialidade. Ver a dúvida 1.
- **D5. As bordas escuras do mouse viram `line-strong`:** `#C9CED6` no cartão e `#C4C9D1` na seta. Segue o precedente do `.botao-linha` e das parceiras, em vez de criar dois cinzas novos.
- **D6. O hífen opcional vem de uma tabela de palavras:** as seis do desenho. Nome novo e muito longo quebra onde couber (`overflow-wrap` do `body`).
- **D7. Os cartões do índice não entram um a um ao rolar**, como os cartões da busca no site. O "Sobre" entra com a `.revelar`, como as faixas da home.
- **D8. No Sanity:**
  - `especialidade` é do tipo `slug`, cuja unicidade o próprio Sanity confere;
  - os dois textos são texto rico restrito a parágrafo e lista com marcadores, porque o "Quando procurar" do desenho tem lista;
  - `revisorCrm` é validado por `^CRM/[A-Z]{2} \d+$`;
  - `revisadoEm` é campo de data, mostrado como "mês de ano".
- **D9. "Texto completo" são os seis campos com conteúdo:**
  - um texto rico só com espaços conta como vazio;
  - incompleto vale como sem texto;
  - dois documentos da mesma especialidade (por fora do Studio): vale o atualizado por último.
- **D10. Uma etiqueta de cache só** (`textos-de-especialidade`) para os textos de todas as especialidades, como banners e parceiras. O corpo do webhook não traz a especialidade.
- **D11. "A entrar":**
  - "Texto da AMI a entrar." sob cada título, no cinza e itálico de "Quem é a AMI?";
  - sem a linha do revisor (a spec);
  - **com** a frase "Conteúdo informativo; não substitui a consulta médica.", porque a spec só tira a do revisor.

  Ver a dúvida 2.
- **D12. Espaço entre parágrafos no "Sobre" (`p + p`, `p + ul`): 16px**, o mesmo do `ul + p` do desenho, que só mostra um parágrafo por coluna.
- **D13. O parágrafo de abertura vira só as duas frases da spec;** saem `ResumoFaceta` e `resumirFaceta`. O Ruling 4 do grupo 1 deixou o texto para este grupo, e o desenho aprovado é o curto.
- **D14. A ordem alfabética é decidida na grade** (`especialidadesComMedico`), e não em `especialidadesComContagem`, que continua por quantidade. As pílulas da home ("as especialidades com mais médicos") dependem dela.
- **D15. A página da especialidade pede ao Sanity e ao banco ao mesmo tempo** (`Promise.all`). Para um slug que não existe, a pergunta ao Sanity é feita à toa e devolve null.
- **D16. "Sobre a {nome em minúsculas}"**, como no desenho. As 14 especialidades de hoje são todas femininas. Ver a dúvida 3.
- **D17. Com um médico só, a linha de apoio do índice perde o "cada um"** ("1 médico associado, com o número de registro no CRM.").

## Dúvidas para o cliente

1. **BreadcrumbList.** Sai das duas páginas (D4), pela mesma razão do perfil. Se o cliente quiser a trilha de volta no Google, ela precisa voltar à tela.
2. **O aviso "Conteúdo informativo; não substitui a consulta médica." no "Sobre" sem texto** (demonstração). Fica (D11). Tirar junto com a linha do revisor?
3. **Especialidade de nome masculino.** "Sobre a {nome}" supõe nome feminino, o que vale para as 14 de hoje. Se a AMI cadastrar uma de nome masculino, o título precisa de outra regra.
4. **As duas gotas** (dúvida 2 do relatório do desenho). Endocrinologia (`DropHalf`) e Urologia (`Drop`) ficam como a spec manda. Se ficarem parecidas demais na tela, a Urologia pode passar ao estetoscópio padrão.
5. **Os menores que o Ruling 15 do grupo 1 deixou "para o grupo 2"** não estão na spec deste grupo e este plano não os toca:
   - as barras sem `:has`;
   - o 0 em `NumerosDaAmi`;
   - o teste do `limite`;
   - o `trim` do endereço;
   - o "Como chegar" de meia largura;
   - o mesmo bairro;
   - a régua `--coluna`.

   Entram numa tarefa à parte, depois desta?
6. **Contraste do parágrafo da especialidade.** Ele é mais largo (34em) que o texto da busca e pode passar mais perto da luz do canto da faixa. Se a medida do Step 4 da Task 7 der menos de 4,5:1, a correção mexe na folha da busca, já aprovada. O plano manda parar e perguntar.
