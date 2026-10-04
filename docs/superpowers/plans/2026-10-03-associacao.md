# A Associação (página institucional, diretoria e páginas de texto) — plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `/associacao`, `/associacao/diretoria` e as páginas de texto (`/associacao/seja-associado`, `/associacao/estatuto`, `/associacao/politica-editorial`, `/associacao/beneficios`, `/politica-de-privacidade`, `/termos-de-uso`, `/politica-de-cookies`) ficam iguais ao desenho aprovado (`docs/desenho-aprovado/associacao/`), sem `Cabeceira`, sem trilha e sem `BreadcrumbList`, com as molduras "a entrar" só no modo demonstração e nenhum "[PROVISÓRIO]" na tela.

**Architecture:**
- As decisões do grupo viram funções puras, em três arquivos novos:
  - `lib/nestaPagina.ts`: a âncora de cada título, quando o índice "Nesta página" aparece e qual seção está sendo lida. Sem import nenhum, porque vai para o navegador;
  - `lib/paginaDeTexto.ts`: o link de volta, o ícone de cada página, o rascunho transformado em texto rico (com a marca "[PROVISÓRIO]" virando moldura só na demonstração), e o conteúdo vindo do Studio ou do rascunho;
  - `lib/associacao.ts`: os atalhos de "Saiba mais", a diretoria em destaque, os números da faixa, a apresentação e o texto do convite.
- O rascunho em código passa a ser desenhado pelo mesmo caminho do texto do Studio: vira blocos de texto rico, e um componente só (`CorpoDoTexto`) desenha os dois. Assim o índice sai dos h2 nos dois casos, e `RascunhoLegalNaTela` deixa de existir.
- As faixas verdes curtas (diretoria e páginas de texto) são um componente novo, `FaixaCurta`, que reaproveita o CSS da faixa da busca e o da faixa da especialidade, como o desenho pede ("na composição de especialidade.html").
- O cartão de diretor é um componente irmão do `CartaoMedico` (`CartaoDiretor`, reescrito), com o CSS dele, mais o cargo e o "Ver perfil".
- O CSS novo é **transcrito das regras do desenho** (o trecho do `<style>` depois do comentário "Fatia B · A Associação"), trocando código de cor por token.

**Tech Stack:** Next.js 16 (App Router), React 19, Tailwind 4 (`@theme`), CSS Modules, Supabase, Sanity 6 (`next-sanity`, `@portabletext/react`), Vitest, `@phosphor-icons/react/dist/ssr`.

**Spec:** `docs/superpowers/specs/2026-10-03-associacao-design.md` — leia inteira antes de começar. É a autoridade.
- O desenho é a referência de todo valor visual. Quando o plano e o desenho discordarem num valor, vale o desenho. Ele está em:
  - `docs/desenho-aprovado/associacao/associacao.html` (com `?sem-conteudo`, a página fora da demonstração);
  - `docs/desenho-aprovado/associacao/diretoria.html` (também `?sem-conteudo` e `?sem-perfil`);
  - `docs/desenho-aprovado/associacao/seja-associado.html` (também `?sem-conteudo`);
  - as fotos `.jpg` da mesma pasta.
- O relatório do desenho (`.superpowers/brainstorm/fatia-b-associacao/relatorio.md`) tem as medidas (x=172, irmãos alinhados, ritmo), os contrastes e a tabela de molduras.
- As specs `2026-10-03-redesign-visual-design.md`, `2026-10-03-encontre-um-medico-design.md` e `2026-10-03-especialidades-design.md` continuam valendo.

**Diários:**
- grupo 1: `.superpowers/sdd/2026-10-03-encontre-um-medico/progress.md`;
- grupo 2: `.superpowers/sdd/2026-10-03-especialidades/progress.md`;
- fatia A: `.superpowers/sdd/2026-10-03-redesign-fatia-a/progress.md`.

**Ramo:** `paginas-encontre`. Nada vai para a `main` antes de todos os grupos ficarem prontos.

**Ordem em relação ao plano Especialidades.** Este plano é executado **depois** de `docs/superpowers/plans/2026-10-03-especialidades.md` terminar (as sete tarefas e a correção final). Ele parte do estado que aquele plano deixa e consome:
- `components/especialidades/FaixaDaEspecialidade.module.css` (classes `especialidade`, `volta`, `selo`), criado na Task 5 de lá;
- `components/especialidades/GradeDeEspecialidades.module.css` (classes `grade`, `cartao`, `nome`, `pe`, `conta`, `seta`), criado na Task 4 de lá;
- `components/base/Icone.tsx` com 33 nomes (Task 1 de lá);
- os comentários de `components/layout/Cabeceira.tsx`, `app/(site)/encontre.module.css` e `components/layout/Rodape.module.css` na forma que a Task 6 de lá escreveu;
- `scripts/auditoria-visual.js` com a conferência 14, `vitest.config.ts`, `docs/estado-do-projeto.md` e `docs/decisoes-sem-o-cliente.md` na forma que a Task 7 de lá deixou.

**Antes da Task 1, confira** que esses arquivos existem e estão como descrito (`git log --oneline -12` deve mostrar os commits de Especialidades). Se algum texto que um passo daqui manda trocar não estiver lá, **pare e pergunte**: o plano de lá mudou.

## Global Constraints

Valem para toda tarefa, sem exceção.

**Do projeto (vêm da fatia A e dos grupos 1 e 2, e continuam):**

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
  - CRLF, entre os desta fatia: `app/(site)/associacao/diretoria/page.tsx`, `app/(site)/associacao/[pagina]/page.tsx`, `components/editorial/PaginaDeTexto.tsx`, `components/diretorio/CartaoDiretor.tsx`, `lib/rascunhosLegais.ts`, `lib/ami.ts`, `lib/molduras.ts`, `components/base/Icone.tsx`, `testes/icones.test.ts`, `testes/tom-quente.test.ts`, `app/globals.css`, `components/layout/Cabeceira.tsx`, `components/layout/Rodape.module.css`, `components/home/SejaAssociado.tsx`, `components/painel/FormularioEntrar.tsx`, `scripts/auditoria-visual.js`, `vitest.config.ts`, `docs/estado-do-projeto.md`.
  - LF: `app/(site)/associacao/page.tsx`, `app/(site)/page.tsx`, `app/(site)/politica-de-privacidade/page.tsx`, `app/(site)/termos-de-uso/page.tsx`, `app/(site)/politica-de-cookies/page.tsx`, `app/(site)/encontre.module.css`, `lib/contato.ts`, `lib/encontre.ts`, `components/home/SejaAssociado.module.css`, `components/painel/FormularioMedico.tsx`, `scripts/gerar-doc-legal.ts`, `testes/paleta.test.ts`, `testes/contato.test.ts`, `testes/aviso-do-rascunho.test.ts`, `testes/caminhos-de-filiacao.test.ts`, `docs/decisoes-sem-o-cliente.md` e os arquivos novos.
  - Edite de forma cirúrgica (Edit). Arquivo existente só se regrava inteiro depois de lido, e só onde o passo manda.
  - Antes de cada commit, `git status --short` só pode listar arquivos da tarefa.
  - Um arquivo listado sem mudança de conteúdo (`git diff --ignore-cr-at-eol -- <arquivo>` vazio) é diferença só de fim de linha: regrave-o com o fim de linha original.
  - Faça `git add` arquivo por arquivo, nunca `git add -A`.
- **BOM:** `lib/dados/filtros.ts`, `lib/dados/medicos.ts`, `lib/dados/especialidades.ts` e `lib/dados/sinonimos.ts` começam com BOM (`﻿`). Este plano não os edita; se precisar, mantenha.
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
- **`sizes` das imagens pela largura desenhada.** Os cartões de diretor usam a grade da busca, com o `SIZES_DO_CARTAO` que já existe; a foto da sede tem a conta própria escrita na Task 6.
- **Cores:**
  - nenhum tom creme ou quente (`testes/tom-quente.test.ts` varre o site);
  - efeito de mouse é borda mais escura, sombra neutra e 1px de subida; **nunca** verde claro.
- **Contraste:** todo texto a pelo menos 4,5:1.
- **Trava:** `NEXT_PUBLIC_DADOS_DEMONSTRACAO` só desliga com `"false"` exato (`lib/demonstracao.ts`).
- **"[PROVISÓRIO]" nunca aparece no site.** Moldura "a entrar" aparece só na demonstração.
- **BreadcrumbList sai de página que não mostra trilha.**
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
  - quebras em 1180, 980, 700 e 400px, como no desenho.
- **Tradução de cor do desenho para o site.** Use o token, nunca o código:

  | No desenho | No site |
  |---|---|
  | `--chao #EEF1EF` | `var(--color-canvas)` |
  | `--painel #FFFFFF` / `#fff` | `var(--color-surface)` |
  | `--painel-2 #F6F7F8`, `#F3F4F6` (fundo da etiqueta) e `#F0F1F3` (fio entre os itens do índice recolhido) | `var(--color-surface-fundo)`, o cinza mais perto, como `SuaAmi.module.css` já faz com `#F3F4F6` |
  | `--linha #E5E7EB` | `var(--color-line)` |
  | `#D1D5DB`, `#D5D9DF` | `var(--color-line-strong)` |
  | `#C9CED6` e `#C4C9D1` (bordas no mouse) | `var(--color-line-strong)` |
  | `--tinta #0c0e12` | `var(--color-ink-900)` |
  | `--tinta-2 #4F5661` | `var(--color-ink-600)` |
  | `--tinta-3 #646B75` | `var(--color-ink-400)` |
  | `--v800` / `--v600` | `var(--color-ami-green-800)` / `var(--color-ami-green-600)` |
  | `--lima #A8D470` | `var(--color-ami-lima-400)` |
  | `--sombra` | `var(--shadow-erguido)` |
  | `#fff` do texto sobre o verde | `var(--color-white)` |

  - Sombras com `rgba(16,24,40,…)` e `rgba(0,0,0,…)`, o vidro branco translúcido (`rgba(255,255,255,…)`), o fio lima tracejado da pílula (`rgba(168,212,112,.5)`) e o degradê do botão no mouse (`#22751F` → `#1A5E18`, o mesmo de `.botao:hover` em `app/globals.css`) vão como estão.
  - As duas cores novas sobre o verde vão como estão, porque não têm token: `#DDE7D6` (rótulo dos números e "Gestão") e `#B9C6B2` ("(período a entrar)"). O relatório do desenho mediu 8,73, 8,61 e 6,42:1.

**Da spec nova (fatia B, grupo 3):**

- **Toda decisão [sem o cliente] vai para `docs/decisoes-sem-o-cliente.md`.**
- As três páginas e as páginas de texto ficam **sem `Cabeceira`, sem breadcrumb visível e sem `BreadcrumbList`**.
- **O texto vem de onde vem hoje:** o documento do Sanity (tipo "Página institucional") ou o rascunho em código (`lib/rascunhosLegais.ts`). O revisado sempre vence.
- **A diretoria vem de onde vem hoje** (`listarDiretoria`, `lib/dados/diretoria.ts`, tabela `diretoria` do Supabase).
- **Mandato:** só na demonstração, como moldura "Gestão (período a entrar)". O plano não cria campo nem lê coluna nova (ver a dúvida 1).
- **Sem WhatsApp** em "Fale com a AMI" enquanto `lib/ami.ts` não confirmar o número.
- **"Saiba mais":** Seja associado, Estatuto e Política editorial; cada um só se a página existir; na demonstração, o que não existe aparece com "texto a entrar"; sobrando só um, o bloco sai; "Benefícios" não entra.
- **Missão, visão e valores** em `/associacao`: os três cartões da home, pela mesma trava (`quemEhAmi`); sem texto e fora da demonstração, o bloco sai inteiro.
- **Marcas para a auditoria:**
  - todo bloco de primeiro nível leva `data-bloco`:
    - `/associacao`: `topo`, `quem-somos`, `diretoria`, `saiba-mais`, `associe`;
    - `/associacao/diretoria`: `topo`, `diretoria`;
    - página de texto: `topo`, `texto`;
  - o primeiro texto de cada bloco que fica na coluna do texto leva `data-coluna`;
  - a faixa de ponta a ponta leva `data-faixa`;
  - o que é moldura "a entrar" leva `data-a-entrar`;
  - o botão do cartão de diretor, ou o espaço dele, leva `data-ligar` (a conferência 13 os alinha);
  - o atalho leva `data-atalho`, o título dele `data-nome` e a seta `data-seta`;
  - o índice da lateral leva `data-nesta-pagina`.

---

## Mapa de arquivos

| Arquivo | O que é | Tarefa |
|---|---|---|
| `lib/nestaPagina.ts` (novo) | âncora, índice e seção lida, sem import | 1 |
| `lib/paginaDeTexto.ts` (novo) | volta, ícone da página, rascunho em blocos, conteúdo | 1 |
| `lib/associacao.ts` (novo) | atalhos, diretoria em destaque, números, apresentação, convite | 1 |
| `lib/contato.ts`, `lib/ami.ts`, `lib/encontre.ts` | `buscaNoMapa`, `linkDoMapaDaAmi`; `linkDoMapa` usa a nova | 1 |
| `components/base/Icone.tsx` | 11 ícones novos | 1 |
| `lib/rascunhosLegais.ts` | `tituloDaLista` (1); comentários (3); Seja associado (4) | 1, 3, 4 |
| `components/layout/FaixaCurta.tsx` (novo) | a faixa verde curta | 2 |
| `components/editorial/IndiceNestaPagina.tsx` + `.module.css` (novos) | o índice, lateral e recolhido | 2 |
| `components/editorial/PaginaDeTexto.tsx` | reescrita | 3 |
| `components/editorial/PaginaDeTexto.module.css` (novo) | a coluna de leitura; o quadro "Fale com a AMI" | 3, 4 |
| `components/editorial/CorpoDoTexto.tsx` (novo) | o texto rico, do Studio ou do rascunho | 3 |
| `components/editorial/RascunhoLegalNaTela.tsx` | apagado | 3 |
| `app/(site)/associacao/[pagina]/page.tsx` | reescrita (3); o "Fale com a AMI" (4) | 3, 4 |
| `app/(site)/politica-de-privacidade/page.tsx`, `termos-de-uso/page.tsx`, `politica-de-cookies/page.tsx` | o modelo novo | 3 |
| `components/painel/FormularioEntrar.tsx`, `FormularioMedico.tsx` (comentários) | citavam `RascunhoLegalNaTela` | 3 |
| `app/(site)/encontre.module.css`, `components/layout/Rodape.module.css` (comentários) | quem usa | 3, 7 |
| `components/associacao/FaleComAmi.tsx` (novo) | o quadro de chamada | 4 |
| `scripts/gerar-doc-legal.ts` | o subtítulo da lista | 4 |
| `components/diretorio/CartaoDiretor.tsx` (reescrito) + `.module.css` (novo) | o cartão de diretor | 5 |
| `components/diretorio/GradeDeDiretores.tsx` (novo) | a grade | 5 |
| `components/associacao/FaixaDaDiretoria.tsx` + `.module.css` (novos) | a faixa com a pílula do mandato | 5 |
| `app/(site)/associacao/diretoria/page.tsx` | reescrita | 5 |
| `components/diretorio/Placa.tsx` | apagado | 5 |
| `app/globals.css` (comentário) | citava `Placa.tsx` | 5 |
| `components/layout/Cabeceira.tsx` (comentário) | quem usa | 5, 7 |
| `lib/molduras.ts`, `app/(site)/page.tsx` | `TEXTO_INSTITUCIONAL` sai da home para a lib | 6 |
| `components/home/PrincipiosDaAmi.tsx` (novo), `SejaAssociado.tsx`, `SejaAssociado.module.css` | os cartões de Missão, visão e valores, num componente só | 6 |
| `components/associacao/FaixaDaAssociacao.tsx` + `.module.css` (novos) | a faixa com os números | 6 |
| `components/associacao/QuemSomos.tsx` + `.module.css` (novos) | sede, apresentação e princípios | 6 |
| `components/associacao/DiretoriaEmDestaque.tsx`, `SaibaMais.tsx`, `FechoAssocie.tsx`, `SecoesDaAssociacao.module.css` (novos) | os blocos de baixo | 7 |
| `app/(site)/associacao/page.tsx` | reescrita | 7 |
| `scripts/auditoria-visual.js` | conferências 15 (atalhos) e 16 (índice) | 8 |
| `vitest.config.ts` (comentário), `docs/estado-do-projeto.md`, `docs/decisoes-sem-o-cliente.md` | conferência e registro | 8 |

Testes novos:

| Teste | Tarefa |
|---|---|
| `testes/nesta-pagina.test.ts` | 1 |
| `testes/paginas-de-texto.test.ts` | 1 |
| `testes/associacao-funcoes.test.ts` | 1 |
| `testes/faixa-curta-e-indice.test.ts` | 2 |
| `testes/modelo-de-texto.test.ts` | 3 |
| `testes/seja-associado.test.ts` | 4 |
| `testes/diretoria-na-tela.test.ts` | 5 |
| `testes/associacao-topo.test.ts` | 6 |
| `testes/associacao.test.ts` | 7 |

Testes alterados:

| Teste | Tarefa |
|---|---|
| `testes/icones.test.ts`, `testes/contato.test.ts` | 1 |
| `testes/aviso-do-rascunho.test.ts` (reescrito), `testes/paleta.test.ts` | 3 |
| `testes/tom-quente.test.ts`, `testes/paleta.test.ts` | 5 |
| `testes/caminhos-de-filiacao.test.ts` | 7 |

**Ordem das tarefas, e por que difere da decomposição sugerida:**
- O ordinal 01/02/03 de Missão, visão e valores **já está em `ink-400` na home** desde a fatia A (`components/home/SejaAssociado.module.css`, `.ordem`, e a asserção em `testes/sua-ami-e-associe.test.ts`). O relatório do desenho mediu o arquivo do desenho, não o site. Não há tarefa para isso: a página nova usa o mesmo componente (Task 6).
- `Cabeceira` e `Breadcrumb` **não saem**: o contato (`app/(site)/contato/page.tsx`) e as notícias (`app/(site)/noticias/page.tsx` e `[slug]/page.tsx`) ainda usam os dois. Só o comentário da `Cabeceira` muda (Tasks 5 e 7).
- `Placa.tsx` sai (Task 5): o único que a usava era o cartão de diretor antigo.
- A página institucional foi partida em duas tarefas (6 e 7), como a da especialidade no plano anterior: os blocos de cima numa, os de baixo e a ligação da página na outra.

---

### Task 1: Funções puras, ícones novos e o link do mapa

**Files:**
- Create: `lib/nestaPagina.ts`, `lib/paginaDeTexto.ts`, `lib/associacao.ts`
- Create: `testes/nesta-pagina.test.ts`, `testes/paginas-de-texto.test.ts`, `testes/associacao-funcoes.test.ts`
- Modify: `lib/rascunhosLegais.ts` (o tipo `SecaoLegal` ganha `tituloDaLista`)
- Modify: `lib/contato.ts` (`buscaNoMapa`), `lib/ami.ts` (`linkDoMapaDaAmi`), `lib/encontre.ts` (`linkDoMapa` usa `buscaNoMapa`)
- Modify: `components/base/Icone.tsx`, `testes/icones.test.ts`, `testes/contato.test.ts`

**Interfaces:**
- Produces (`lib/nestaPagina.ts`):

```ts
export type ItemDoIndice = { id: string; titulo: string };
export function ancoraDoTitulo(titulo: string): string; // "O que é a AMI" -> "secao-o-que-e-a-ami"
export function ancorasUnicas(titulos: string[]): ItemDoIndice[];
export const MINIMO_DO_INDICE = 2;
export function indiceNestaPagina(itens: ItemDoIndice[]): ItemDoIndice[]; // [] com menos de dois
export const LINHA_DE_LEITURA = 140;
export function secaoAtual(topos: number[], linha: number, noFim: boolean): number; // -1 sem títulos
```

- Produces (`lib/paginaDeTexto.ts`):

```ts
export type VoltaDaPagina = { href: string; rotulo: string };
export const VOLTA_ASSOCIACAO: VoltaDaPagina; // { href: "/associacao", rotulo: "A Associação" }
export const VOLTA_INICIO: VoltaDaPagina;     // { href: "/", rotulo: "Início" }
export const ICONE_DE_PAGINA_PADRAO: NomeIcone; // "documento"
export function iconeDaPagina(slug: string): NomeIcone;
export const MARCA_PROVISORIA = "[PROVISÓRIO] ";
export type ParagrafoNaTela = { estilo: "normal" | "aEntrar"; texto: string };
export function paragrafoDoRascunho(texto: string, demonstracao: boolean): ParagrafoNaTela | null;
export function blocosDoRascunho(rascunho: RascunhoLegal, demonstracao: boolean): PortableTextBlock[];
export type ConteudoDaPagina = { titulo: string; resumo: string; atualizadoEm: string; aviso: AvisoDoRascunho | null; corpo: PortableTextBlock[] };
export function conteudoDoRascunho(rascunho: RascunhoLegal, demonstracao: boolean): ConteudoDaPagina;
export function conteudoDoSanity(pagina: PaginaInstitucional): ConteudoDaPagina;
export function conteudoDaPagina(revisado: PaginaInstitucional | null, rascunho: RascunhoLegal | null | undefined, demonstracao: boolean): ConteudoDaPagina | null;
export type AncoraDoCorpo = ItemDoIndice & { chave: string };
export function ancorasDoCorpo(corpo: PortableTextBlock[]): AncoraDoCorpo[];
```

- Produces (`lib/associacao.ts`):

```ts
export const CONVITE_PARA_ASSOCIAR: { readonly titulo: string; readonly texto: string };
export type Atalho = { titulo: string; frase: string; caminho: string; icone: NomeIcone; aEntrar: boolean };
export const MINIMO_DE_ATALHOS = 2;
export function atalhosDoSaibaMais(demonstracao: boolean, existentes: readonly string[]): Atalho[];
export const LIMITE_DA_DIRETORIA_EM_DESTAQUE = 4;
export function diretoriaEmDestaque(diretoria: Diretor[]): Diretor[];
export type NumeroDaAssociacao = { icone: NomeIcone; valor: number; rotulo: string };
export function numerosDaAssociacao(n: { anos: number; medicos: number; especialidades: number }): NumeroDaAssociacao[];
export type ApresentacaoNaTela = { tipo: "texto"; blocos: PortableTextBlock[] } | { tipo: "a-entrar" };
export function apresentacaoDaAssociacao(demonstracao: boolean, corpo: PortableTextBlock[] | null | undefined): ApresentacaoNaTela | null;
```

- Produces: `buscaNoMapa(endereco: string): string` (`lib/contato.ts`); `linkDoMapaDaAmi(): string` (`lib/ami.ts`).
- Produces (`lib/rascunhosLegais.ts`): `SecaoLegal` ganha `tituloDaLista?: string`.
- Produces (`components/base/Icone.tsx`): `NomeIcone` ganha 11 nomes:

  | Nome | Phosphor | Uso |
  |---|---|---|
  | `"pergaminho"` | `Scroll` | Estatuto |
  | `"artigo"` | `Article` | Política editorial |
  | `"escudo"` | `ShieldCheck` | Política de privacidade |
  | `"biscoito"` | `Cookie` | Política de cookies |
  | `"documento"` | `FileText` | Termos de uso, e o padrão |
  | `"pessoas"` | `UsersThree` | Diretoria |
  | `"calendario"` | `CalendarBlank` | pílula do mandato |
  | `"informacao"` | `Info` | quadro de aviso |
  | `"relogio"` | `ClockCounterClockwise` | "Atualizado em" |
  | `"chamada"` | `PhoneCall` | "Fale com a AMI" |
  | `"celular"` | `DeviceMobile` | o celular da AMI |

  Os 11 existem no `@phosphor-icons/react` instalado (conferido em `node_modules/@phosphor-icons/react/dist/ssr/`). Seja associado usa `"parceria"` (`Handshake`), que já existe.

- [ ] **Step 1: Os testes do índice**

`testes/nesta-pagina.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  LINHA_DE_LEITURA,
  MINIMO_DO_INDICE,
  ancoraDoTitulo,
  ancorasUnicas,
  indiceNestaPagina,
  secaoAtual,
} from "@/lib/nestaPagina";

/*
  O índice "Nesta página" das páginas de texto, em funções puras: a âncora
  de cada título de seção, quando o índice aparece e qual seção está sendo
  lida. A ligação com a rolagem do navegador é conferida pela auditoria
  visual (scripts/auditoria-visual.js, conferência 16).
*/

describe("a âncora de cada título", () => {
  it("sem acento, em minúsculas, com hífen no lugar do resto e o prefixo secao-", () => {
    expect(ancoraDoTitulo("O que é a AMI")).toBe("secao-o-que-e-a-ami");
    expect(ancoraDoTitulo("Quem pode se associar")).toBe("secao-quem-pode-se-associar");
    expect(ancoraDoTitulo("Como exercer esses direitos, e como falar sobre dados")).toBe(
      "secao-como-exercer-esses-direitos-e-como-falar-sobre-dados",
    );
    expect(ancoraDoTitulo("  Lei 13.709/2018 — artigo 41  ")).toBe("secao-lei-13-709-2018-artigo-41");
  });

  it("título sem letra nem número fica só com o prefixo", () => {
    expect(ancoraDoTitulo("¿?")).toBe("secao");
    expect(ancoraDoTitulo("")).toBe("secao");
  });

  it("título repetido ganha -2, -3, e uma âncora nunca se repete", () => {
    expect(ancorasUnicas(["Alterações", "Alterações", "Alterações 2", "Alterações"])).toEqual([
      { id: "secao-alteracoes", titulo: "Alterações" },
      { id: "secao-alteracoes-2", titulo: "Alterações" },
      { id: "secao-alteracoes-2-2", titulo: "Alterações 2" },
      { id: "secao-alteracoes-3", titulo: "Alterações" },
    ]);
  });
});

describe("quando o índice aparece", () => {
  const itens = ancorasUnicas(["Um", "Dois", "Três"]);

  it("com dois títulos ou mais: todos, na ordem", () => {
    expect(MINIMO_DO_INDICE).toBe(2);
    expect(indiceNestaPagina(itens)).toEqual(itens);
    expect(indiceNestaPagina(itens.slice(0, 2))).toEqual(itens.slice(0, 2));
  });

  it("com menos de dois: nenhum", () => {
    expect(indiceNestaPagina(itens.slice(0, 1))).toEqual([]);
    expect(indiceNestaPagina([])).toEqual([]);
  });
});

describe("a seção que está sendo lida", () => {
  it("a linha de leitura é a do desenho: 140px do topo da janela", () => {
    expect(LINHA_DE_LEITURA).toBe(140);
  });

  it("no alto da página, nenhum título passou da linha: a primeira", () => {
    expect(secaoAtual([300, 900, 1500], 140, false)).toBe(0);
  });

  it("a última cujo título já passou da linha, inclusive o que está em cima dela", () => {
    expect(secaoAtual([-500, 120, 1500], 140, false)).toBe(1);
    expect(secaoAtual([-900, -400, 140], 140, false)).toBe(2);
    expect(secaoAtual([-900, 141, 900], 140, false)).toBe(0);
  });

  it("no fim da página, a última, mesmo que o título dela não chegue à linha", () => {
    expect(secaoAtual([-900, 300, 700], 140, true)).toBe(2);
  });

  it("título que não está na página (topo infinito) não conta", () => {
    expect(secaoAtual([-900, Infinity, 700], 140, false)).toBe(0);
  });

  it("sem títulos, nenhuma", () => {
    expect(secaoAtual([], 140, false)).toBe(-1);
    expect(secaoAtual([], 140, true)).toBe(-1);
  });
});
```

- [ ] **Step 2: Os testes das páginas de texto**

`testes/paginas-de-texto.test.ts`:

```ts
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { Icon } from "@phosphor-icons/react";
import { Article, Cookie, FileText, Handshake, Scroll, ShieldCheck } from "@phosphor-icons/react/dist/ssr";
import type { PortableTextBlock } from "@portabletext/react";
import { Icone } from "@/components/base/Icone";
import {
  ICONE_DE_PAGINA_PADRAO,
  MARCA_PROVISORIA,
  VOLTA_ASSOCIACAO,
  VOLTA_INICIO,
  ancorasDoCorpo,
  blocosDoRascunho,
  conteudoDaPagina,
  conteudoDoRascunho,
  conteudoDoSanity,
  iconeDaPagina,
  paragrafoDoRascunho,
} from "@/lib/paginaDeTexto";
import { COOKIES, PRIVACIDADE, SEJA_ASSOCIADO, TERMOS, type RascunhoLegal } from "@/lib/rascunhosLegais";
import type { PaginaInstitucional } from "@/lib/sanity/tipos";

/*
  O que o modelo de página de texto decide, em funções puras: o link de
  volta, o ícone de cada página, o rascunho em código transformado em texto
  rico (o mesmo formato do Studio) e qual dos dois textos a página mostra.
  O desenho de cada bloco é testado por renderização em
  testes/modelo-de-texto.test.ts.
*/

/* Um bloco de texto rico, como o Studio grava e como `blocosDoRascunho` monta. */
function b(chave: string, estilo: string, texto: string, lista = false): PortableTextBlock {
  return {
    _type: "block",
    _key: chave,
    style: estilo,
    markDefs: [],
    children: [{ _type: "span", _key: `${chave}s`, text: texto, marks: [] }],
    ...(lista ? { listItem: "bullet", level: 1 } : {}),
  } as PortableTextBlock;
}

describe("o link de volta", () => {
  it("as páginas da associação voltam a ela; as legais, ao início", () => {
    expect(VOLTA_ASSOCIACAO).toEqual({ href: "/associacao", rotulo: "A Associação" });
    expect(VOLTA_INICIO).toEqual({ href: "/", rotulo: "Início" });
  });
});

describe("o ícone de cada página", () => {
  /* A lista da spec, seção 3.1, escrita aqui de novo, do slug ao componente
     Phosphor: comparar o desenho que sai com o do componente é o que pega
     dois ícones trocados de lugar. */
  const TABELA: [string, Icon][] = [
    ["seja-associado", Handshake],
    ["estatuto", Scroll],
    ["politica-editorial", Article],
    ["politica-de-privacidade", ShieldCheck],
    ["politica-de-cookies", Cookie],
    ["termos-de-uso", FileText],
  ];
  const desenho = (Componente: Icon) =>
    renderToString(createElement(Componente, { size: 84, weight: "duotone", className: "", "aria-hidden": "true" }));

  it("cada página da lista desenha o ícone dela, em duotone", () => {
    for (const [slug, Componente] of TABELA) {
      const nosso = renderToString(createElement(Icone, { nome: iconeDaPagina(slug), duotone: true, tamanho: 84 }));
      expect(nosso, slug).toBe(desenho(Componente));
    }
  });

  it("página fora da lista (Benefícios, uma nova) fica com o documento", () => {
    expect(ICONE_DE_PAGINA_PADRAO).toBe("documento");
    for (const slug of ["beneficios", "", "constructor", "toString"]) {
      expect(iconeDaPagina(slug), slug).toBe(ICONE_DE_PAGINA_PADRAO);
    }
  });
});

describe("um parágrafo do rascunho na tela", () => {
  it("a marca é a que o documento do advogado usa", () => {
    expect(MARCA_PROVISORIA).toBe("[PROVISÓRIO] ");
  });

  it("parágrafo comum sai igual, nos dois modos", () => {
    for (const demo of [true, false]) {
      expect(paragrafoDoRascunho("Texto comum.", demo)).toEqual({ estilo: "normal", texto: "Texto comum." });
    }
  });

  it("parágrafo marcado: na demonstração, a entrar e sem a marca", () => {
    expect(paragrafoDoRascunho("[PROVISÓRIO] Prazo de guarda: texto da AMI a entrar.", true)).toEqual({
      estilo: "aEntrar",
      texto: "Prazo de guarda: texto da AMI a entrar.",
    });
  });

  it("parágrafo marcado, fora da demonstração: não existe", () => {
    expect(paragrafoDoRascunho("[PROVISÓRIO] Prazo de guarda: texto da AMI a entrar.", false)).toBeNull();
  });
});

describe("o rascunho em texto rico", () => {
  const RASCUNHO: RascunhoLegal = {
    slug: "seja-associado",
    titulo: "Título",
    resumo: "Resumo.",
    atualizadoEm: "2026-08-23",
    aviso: { titulo: "Aviso", texto: "Texto do aviso." },
    secoes: [
      {
        titulo: "Primeira",
        paragrafos: ["Um.", "[PROVISÓRIO] Falta: texto da AMI a entrar."],
        tituloDaLista: "Dados",
        lista: ["A.", "B."],
      },
      { titulo: "Segunda", paragrafos: ["Dois."] },
    ],
  };

  it("cada seção vira um h2, cada parágrafo um bloco, o subtítulo um h3 e a lista itens com marcador", () => {
    expect(blocosDoRascunho(RASCUNHO, true)).toEqual([
      b("r0", "h2", "Primeira"),
      b("r1", "normal", "Um."),
      b("r2", "aEntrar", "Falta: texto da AMI a entrar."),
      b("r3", "h3", "Dados"),
      b("r4", "normal", "A.", true),
      b("r5", "normal", "B.", true),
      b("r6", "h2", "Segunda"),
      b("r7", "normal", "Dois."),
    ]);
  });

  it("fora da demonstração, o parágrafo marcado não existe, e as chaves continuam únicas", () => {
    expect(blocosDoRascunho(RASCUNHO, false)).toEqual([
      b("r0", "h2", "Primeira"),
      b("r1", "normal", "Um."),
      b("r2", "h3", "Dados"),
      b("r3", "normal", "A.", true),
      b("r4", "normal", "B.", true),
      b("r5", "h2", "Segunda"),
      b("r6", "normal", "Dois."),
    ]);
  });

  it("o conteúdo do rascunho: título, resumo, data, aviso e os blocos", () => {
    expect(conteudoDoRascunho(RASCUNHO, false)).toEqual({
      titulo: "Título",
      resumo: "Resumo.",
      atualizadoEm: "2026-08-23",
      aviso: { titulo: "Aviso", texto: "Texto do aviso." },
      corpo: blocosDoRascunho(RASCUNHO, false),
    });
  });

  const DOC: PaginaInstitucional = {
    titulo: "Estatuto",
    slug: "estatuto",
    resumo: "As regras que organizam a associação.",
    atualizadoEm: "2026-09-10T12:00:00Z",
    corpo: [b("a", "h2", "Capítulo um")],
  };

  it("o conteúdo do Studio: sem quadro de aviso, o texto como veio", () => {
    expect(conteudoDoSanity(DOC)).toEqual({
      titulo: "Estatuto",
      resumo: "As regras que organizam a associação.",
      atualizadoEm: "2026-09-10T12:00:00Z",
      aviso: null,
      corpo: DOC.corpo,
    });
  });

  it("o revisado sempre vence; sem ele, o rascunho; sem os dois, nada", () => {
    expect(conteudoDaPagina(DOC, RASCUNHO, true)).toEqual(conteudoDoSanity(DOC));
    expect(conteudoDaPagina(null, RASCUNHO, true)).toEqual(conteudoDoRascunho(RASCUNHO, true));
    expect(conteudoDaPagina(null, RASCUNHO, false)).toEqual(conteudoDoRascunho(RASCUNHO, false));
    expect(conteudoDaPagina(null, undefined, true)).toBeNull();
    expect(conteudoDaPagina(null, null, false)).toBeNull();
  });
});

describe("as âncoras dos títulos de seção", () => {
  it("só os h2 com texto, na ordem, com a âncora única e a chave do bloco", () => {
    const dois = {
      ...b("g", "h2", ""),
      children: [
        { _type: "span", _key: "g1", text: "O que ", marks: [] },
        { _type: "span", _key: "g2", text: "é", marks: ["strong"] },
      ],
    } as PortableTextBlock;
    const corpo = [
      b("a", "h2", "Quem é o responsável"),
      b("b", "normal", "Texto."),
      b("c", "h3", "Subtítulo"),
      b("d", "h2", "Alterações"),
      b("e", "h2", "   "),
      b("f", "h2", "Alterações"),
      dois,
    ];
    expect(ancorasDoCorpo(corpo)).toEqual([
      { id: "secao-quem-e-o-responsavel", titulo: "Quem é o responsável", chave: "a" },
      { id: "secao-alteracoes", titulo: "Alterações", chave: "d" },
      { id: "secao-alteracoes-2", titulo: "Alterações", chave: "f" },
      { id: "secao-o-que-e", titulo: "O que é", chave: "g" },
    ]);
  });

  it("sem h2, nenhuma", () => {
    expect(ancorasDoCorpo([b("a", "normal", "Só texto.")])).toEqual([]);
  });
});

describe("nenhum PROVISÓRIO na tela, vindo dos rascunhos", () => {
  const RASCUNHOS: RascunhoLegal[] = [PRIVACIDADE, TERMOS, COOKIES, SEJA_ASSOCIADO];

  it("a marca só aparece no começo de um parágrafo, e em nenhum outro texto", () => {
    for (const r of RASCUNHOS) {
      for (const t of [r.titulo, r.resumo, r.aviso.titulo, r.aviso.texto]) {
        expect(t, r.slug).not.toContain("PROVISÓRIO");
      }
      for (const s of r.secoes) {
        for (const t of [s.titulo, s.tituloDaLista ?? "", ...(s.lista ?? [])]) {
          expect(t, `${r.slug}: ${s.titulo}`).not.toContain("PROVISÓRIO");
        }
        for (const p of s.paragrafos) {
          const resto = p.startsWith(MARCA_PROVISORIA) ? p.slice(MARCA_PROVISORIA.length) : p;
          expect(resto, `${r.slug}: ${p}`).not.toContain("PROVISÓRIO");
        }
      }
    }
  });

  it("em nenhum dos dois modos o texto rico leva a palavra", () => {
    for (const r of RASCUNHOS) {
      for (const demo of [true, false]) {
        expect(JSON.stringify(blocosDoRascunho(r, demo)), `${r.slug} ${demo}`).not.toContain("PROVISÓRIO");
      }
    }
  });

  it("a política de privacidade tem dois trechos a entrar, que só existem na demonstração", () => {
    const aEntrar = (demo: boolean) => blocosDoRascunho(PRIVACIDADE, demo).filter((x) => x.style === "aEntrar");
    expect(aEntrar(true)).toHaveLength(2);
    expect(aEntrar(false)).toHaveLength(0);
  });
});
```

- [ ] **Step 3: Os testes de A Associação**

`testes/associacao-funcoes.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import type { PortableTextBlock } from "@portabletext/react";
import {
  CONVITE_PARA_ASSOCIAR,
  LIMITE_DA_DIRETORIA_EM_DESTAQUE,
  MINIMO_DE_ATALHOS,
  apresentacaoDaAssociacao,
  atalhosDoSaibaMais,
  diretoriaEmDestaque,
  numerosDaAssociacao,
} from "@/lib/associacao";
import type { Diretor } from "@/lib/dados/diretoria";

/*
  O que a página A Associação decide, em funções puras: os atalhos de
  "Saiba mais", a diretoria em destaque, os números da faixa verde, a
  apresentação e o texto do convite. Os textos esperados são os da spec
  (docs/superpowers/specs/2026-10-03-associacao-design.md) e do desenho.
*/

const SEJA = "/associacao/seja-associado";
const ESTATUTO = "/associacao/estatuto";
const EDITORIAL = "/associacao/politica-editorial";

describe("os atalhos de Saiba mais", () => {
  it("na demonstração, os três, na ordem; o que não existe vai como texto a entrar", () => {
    expect(atalhosDoSaibaMais(true, [SEJA])).toEqual([
      {
        titulo: "Seja associado",
        frase: "Quem pode se associar à AMI e como fazer isso.",
        caminho: SEJA,
        icone: "parceria",
        aEntrar: false,
      },
      {
        titulo: "Estatuto",
        frase: "As regras que organizam a associação.",
        caminho: ESTATUTO,
        icone: "pergaminho",
        aEntrar: true,
      },
      {
        titulo: "Política editorial",
        frase: "Como o site escolhe, apura e revisa o que publica.",
        caminho: EDITORIAL,
        icone: "artigo",
        aEntrar: true,
      },
    ]);
  });

  it("fora da demonstração, só os que existem", () => {
    expect(atalhosDoSaibaMais(false, [SEJA, ESTATUTO]).map((a) => [a.caminho, a.aEntrar])).toEqual([
      [SEJA, false],
      [ESTATUTO, false],
    ]);
  });

  it("com as três páginas no ar, nenhum a entrar, nos dois modos", () => {
    for (const demo of [true, false]) {
      expect(atalhosDoSaibaMais(demo, [EDITORIAL, SEJA, ESTATUTO]).map((a) => a.aEntrar), String(demo)).toEqual([
        false,
        false,
        false,
      ]);
    }
  });

  it("sobrando um só (Seja associado, que o fecho repete logo abaixo), nenhum", () => {
    expect(MINIMO_DE_ATALHOS).toBe(2);
    expect(atalhosDoSaibaMais(false, [SEJA])).toEqual([]);
    expect(atalhosDoSaibaMais(false, [ESTATUTO])).toEqual([]);
    expect(atalhosDoSaibaMais(false, [])).toEqual([]);
  });

  it("Benefícios não entra, mesmo publicada", () => {
    const titulos = atalhosDoSaibaMais(true, [SEJA, "/associacao/beneficios"]).map((a) => a.titulo);
    expect(titulos).toEqual(["Seja associado", "Estatuto", "Política editorial"]);
  });
});

function diretor(id: number): Diretor {
  return {
    id,
    nome: `Diretor ${id}`,
    cargo: "Diretor",
    ordem: id * 10,
    slugDoPerfil: null,
    crm: String(10000 + id),
    crmUf: "MA",
    medico: true,
    foto: null,
  };
}

describe("a diretoria em destaque", () => {
  it("os quatro primeiros, na ordem da AMI", () => {
    expect(LIMITE_DA_DIRETORIA_EM_DESTAQUE).toBe(4);
    const seis = [1, 2, 3, 4, 5, 6].map(diretor);
    expect(diretoriaEmDestaque(seis).map((d) => d.id)).toEqual([1, 2, 3, 4]);
  });

  it("com menos de quatro, todos; sem nenhum, nenhum", () => {
    expect(diretoriaEmDestaque([diretor(1), diretor(2)]).map((d) => d.id)).toEqual([1, 2]);
    expect(diretoriaEmDestaque([])).toEqual([]);
  });

  it("não mexe na lista recebida", () => {
    const lista = [1, 2, 3, 4, 5].map(diretor);
    diretoriaEmDestaque(lista);
    expect(lista).toHaveLength(5);
  });
});

describe("os números da faixa verde", () => {
  it("anos, médicos e especialidades, com o ícone e o rótulo da home", () => {
    expect(numerosDaAssociacao({ anos: 51, medicos: 24, especialidades: 14 })).toEqual([
      { icone: "selo", valor: 51, rotulo: "anos de AMI" },
      { icone: "estetoscopio", valor: 24, rotulo: "médicos no diretório" },
      { icone: "batimento", valor: 14, rotulo: "especialidades" },
    ]);
  });

  it("concorda o singular", () => {
    expect(numerosDaAssociacao({ anos: 1, medicos: 1, especialidades: 1 }).map((n) => n.rotulo)).toEqual([
      "ano de AMI",
      "médico no diretório",
      "especialidade",
    ]);
  });
});

describe("a apresentação oficial", () => {
  const CORPO = [
    {
      _type: "block",
      _key: "a",
      style: "normal",
      markDefs: [],
      children: [{ _type: "span", _key: "s", text: "A AMI é…", marks: [] }],
    },
  ] as PortableTextBlock[];

  it("com o texto da AMI no Studio, sai nos dois modos", () => {
    expect(apresentacaoDaAssociacao(true, CORPO)).toEqual({ tipo: "texto", blocos: CORPO });
    expect(apresentacaoDaAssociacao(false, CORPO)).toEqual({ tipo: "texto", blocos: CORPO });
  });

  it("sem texto: a entrar na demonstração, nada fora dela", () => {
    for (const vazio of [null, undefined, []]) {
      expect(apresentacaoDaAssociacao(true, vazio)).toEqual({ tipo: "a-entrar" });
      expect(apresentacaoDaAssociacao(false, vazio)).toBeNull();
    }
  });
});

describe("o convite para se associar", () => {
  it("o texto aprovado da faixa da home, que o fecho de A Associação repete", () => {
    expect(CONVITE_PARA_ASSOCIAR).toEqual({
      titulo: "Associe-se à AMI e fortaleça a medicina em Imperatriz",
      texto: "Médico com inscrição no CRM pode se associar. Fale com a AMI para saber como.",
    });
  });
});
```

Em `testes/contato.test.ts` (LF):

1. Troque as duas linhas de import

```ts
import { hrefTelefone } from "@/lib/ami";
import { linkDoWhatsapp, numeroNacional } from "@/lib/contato";
```

por

```ts
import { hrefTelefone, linkDoMapaDaAmi } from "@/lib/ami";
import { buscaNoMapa, linkDoWhatsapp, numeroNacional } from "@/lib/contato";
```

2. Acrescente, no fim do arquivo:

```ts

describe("Como chegar", () => {
  it("a busca do Google Maps pelo endereço escrito", () => {
    expect(buscaNoMapa("Rua A, 1, Centro")).toBe(
      "https://www.google.com/maps/search/?api=1&query=Rua%20A%2C%201%2C%20Centro",
    );
  });

  it("a sede da AMI: o endereço em uma linha, com o CEP, o mesmo link do desenho", () => {
    expect(linkDoMapaDaAmi()).toBe(
      "https://www.google.com/maps/search/?api=1&query=" +
        "Rua%20Coriolano%20Milhomem%2C%2039%2C%20Centro%2C%20Imperatriz%20-%20MA%2C%2065900-330",
    );
  });
});
```

Em `testes/icones.test.ts` (CRLF):

1. Acrescente ao import de `@phosphor-icons/react/dist/ssr`, em ordem alfabética, os nomes `Article, CalendarBlank, ClockCounterClockwise, Cookie, DeviceMobile, FileText, Info, PhoneCall, Scroll, ShieldCheck, UsersThree`.
2. Acrescente ao objeto `esperado`, depois de `gota: Drop,`:

```ts
      pergaminho: Scroll,
      artigo: Article,
      escudo: ShieldCheck,
      biscoito: Cookie,
      documento: FileText,
      pessoas: UsersThree,
      calendario: CalendarBlank,
      informacao: Info,
      relogio: ClockCounterClockwise,
      chamada: PhoneCall,
      celular: DeviceMobile,
```

3. Troque o fim do teste:

```ts
    /* E os 33 são diferentes entre si: nenhum par repetido na tabela. */
    const htmls = Object.keys(esperado).map((nome) => renderToString(createElement(Icone, { nome: nome as NomeIcone })));
    expect(new Set(htmls).size).toBe(33);
```

por

```ts
    /* E os 44 são diferentes entre si: nenhum par repetido na tabela. */
    const htmls = Object.keys(esperado).map((nome) => renderToString(createElement(Icone, { nome: nome as NomeIcone })));
    expect(new Set(htmls).size).toBe(44);
```

- [ ] **Step 4: Rodar e ver falhar**

Run: `npx vitest run testes/nesta-pagina.test.ts testes/paginas-de-texto.test.ts testes/associacao-funcoes.test.ts testes/contato.test.ts testes/icones.test.ts`
Expected: FAIL. Os três módulos novos não existem, `buscaNoMapa` e `linkDoMapaDaAmi` não existem, e os ícones novos não estão no `Icone`.

- [ ] **Step 5: Os ícones**

Em `components/base/Icone.tsx` (CRLF):

1. Acrescente ao import de `@phosphor-icons/react/dist/ssr`, depois de `Drop,`:

```ts
  Scroll,
  Article,
  ShieldCheck,
  Cookie,
  FileText,
  UsersThree,
  CalendarBlank,
  Info,
  ClockCounterClockwise,
  PhoneCall,
  DeviceMobile,
```

2. No tipo `NomeIcone`, troque a última linha, `  | "gota";`, por:

```ts
  | "gota"
  | "pergaminho"
  | "artigo"
  | "escudo"
  | "biscoito"
  | "documento"
  | "pessoas"
  | "calendario"
  | "informacao"
  | "relogio"
  | "chamada"
  | "celular";
```

3. Acrescente ao `mapaDeIcones`, depois de `gota: Drop,`:

```ts
  pergaminho: Scroll,
  artigo: Article,
  escudo: ShieldCheck,
  biscoito: Cookie,
  documento: FileText,
  pessoas: UsersThree,
  calendario: CalendarBlank,
  informacao: Info,
  relogio: ClockCounterClockwise,
  chamada: PhoneCall,
  celular: DeviceMobile,
```

- [ ] **Step 6: O subtítulo da lista no tipo do rascunho**

Em `lib/rascunhosLegais.ts` (CRLF), troque:

```ts
export type SecaoLegal = {
  titulo: string;
  paragrafos: string[];
  lista?: string[];
};
```

por

```ts
export type SecaoLegal = {
  titulo: string;
  paragrafos: string[];
  /** Um subtítulo antes da lista, quando ela precisa de nome ("Dados da entidade"). */
  tituloDaLista?: string;
  lista?: string[];
};
```

- [ ] **Step 7: `lib/nestaPagina.ts`**

```ts
/*
  O índice "Nesta página" das páginas de texto, em funções puras:
  - a âncora de cada título de seção;
  - quando o índice aparece;
  - qual seção está sendo lida.

  Sem import nenhum, de propósito: o índice da lateral é componente de
  navegador (components/editorial/IndiceNestaPagina.tsx) e leva este
  arquivo junto para lá.
*/

export type ItemDoIndice = { id: string; titulo: string };

/**
 * A âncora de um título: sem acento, em minúsculas, com hífen no lugar do
 * resto, e o prefixo "secao-". O prefixo não deixa a âncora colidir com um
 * id fixo da página, como o `conteudo` do `<main>` ou a `gaveta` do menu.
 */
export function ancoraDoTitulo(titulo: string): string {
  const base = titulo
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return base ? `secao-${base}` : "secao";
}

/** Os títulos com âncora única, na ordem: a repetida ganha "-2", "-3". */
export function ancorasUnicas(titulos: string[]): ItemDoIndice[] {
  const usadas = new Set<string>();
  return titulos.map((titulo) => {
    const base = ancoraDoTitulo(titulo);
    let id = base;
    for (let n = 2; usadas.has(id); n++) id = `${base}-${n}`;
    usadas.add(id);
    return { id, titulo };
  });
}

/** Com menos de dois títulos, um índice não ajuda a ler. */
export const MINIMO_DO_INDICE = 2;

/** O índice "Nesta página": os itens, ou nenhum quando são menos de dois. */
export function indiceNestaPagina(itens: ItemDoIndice[]): ItemDoIndice[] {
  return itens.length >= MINIMO_DO_INDICE ? itens : [];
}

/**
 * A linha de leitura, em pixels do topo da janela: o título que passou
 * dela abre a seção que está sendo lida. É a do desenho aprovado, abaixo
 * do cabeçalho preso.
 */
export const LINHA_DE_LEITURA = 140;

/**
 * A seção que está sendo lida, pela posição de cada título (`topos`, o
 * topo de cada um em relação à janela, na ordem da página): a última cujo
 * título já chegou à linha de leitura; nenhuma passou, a primeira. No fim
 * da página (`noFim`), a última, porque o título dela pode nunca chegar à
 * linha. Sem títulos, -1.
 */
export function secaoAtual(topos: number[], linha: number, noFim: boolean): number {
  if (topos.length === 0) return -1;
  if (noFim) return topos.length - 1;
  let atual = 0;
  topos.forEach((topo, i) => {
    if (topo <= linha) atual = i;
  });
  return atual;
}
```

- [ ] **Step 8: `lib/paginaDeTexto.ts`**

```ts
import type { PortableTextBlock } from "@portabletext/react";
import type { NomeIcone } from "@/components/base/Icone";
import { ancorasUnicas, type ItemDoIndice } from "@/lib/nestaPagina";
import type { AvisoDoRascunho, RascunhoLegal } from "@/lib/rascunhosLegais";
import type { PaginaInstitucional } from "@/lib/sanity/tipos";

/*
  O que o modelo de página de texto decide, em funções puras
  (testes/paginas-de-texto.test.ts):
  - o link de volta da faixa verde;
  - o ícone de cada página;
  - o rascunho em código transformado em texto rico, o mesmo formato do
    Studio, para um componente só desenhar os dois
    (components/editorial/CorpoDoTexto.tsx);
  - qual texto a página mostra: o do Studio, quando a AMI publicou, ou o
    rascunho;
  - as âncoras dos títulos de seção, para o índice "Nesta página".
*/

export type VoltaDaPagina = { href: string; rotulo: string };

/** As páginas sob /associacao voltam à página da associação. */
export const VOLTA_ASSOCIACAO: VoltaDaPagina = { href: "/associacao", rotulo: "A Associação" };

/** As páginas legais, que o rodapé de toda página linka, voltam ao início. */
export const VOLTA_INICIO: VoltaDaPagina = { href: "/", rotulo: "Início" };

/** O ícone da página sem ícone próprio: Benefícios, ou uma nova. */
export const ICONE_DE_PAGINA_PADRAO: NomeIcone = "documento";

/*
  O ícone de cada página de texto, pelo slug, como a spec escolheu
  (Phosphor, duotone). É um `Map`, e não um objeto: num objeto,
  "constructor" e "toString" existiriam como chave.
*/
const ICONES_DAS_PAGINAS = new Map<string, NomeIcone>([
  ["seja-associado", "parceria"],
  ["estatuto", "pergaminho"],
  ["politica-editorial", "artigo"],
  ["politica-de-privacidade", "escudo"],
  ["politica-de-cookies", "biscoito"],
  ["termos-de-uso", "documento"],
]);

export function iconeDaPagina(slug: string): NomeIcone {
  return ICONES_DAS_PAGINAS.get(slug) ?? ICONE_DE_PAGINA_PADRAO;
}

/**
 * A marca do que falta num rascunho, no começo do parágrafo. É a mesma do
 * documento que vai ao advogado (scripts/gerar-doc-legal.ts), onde ela
 * fica; na tela, ela nunca aparece.
 */
export const MARCA_PROVISORIA = "[PROVISÓRIO] ";

export type ParagrafoNaTela = { estilo: "normal" | "aEntrar"; texto: string };

/**
 * Um parágrafo do rascunho na tela. O comum sai como está. O marcado sai
 * sem a marca, desenhado como moldura "a entrar", só na demonstração; fora
 * dela, não existe (null).
 */
export function paragrafoDoRascunho(texto: string, demonstracao: boolean): ParagrafoNaTela | null {
  if (!texto.startsWith(MARCA_PROVISORIA)) return { estilo: "normal", texto };
  return demonstracao ? { estilo: "aEntrar", texto: texto.slice(MARCA_PROVISORIA.length) } : null;
}

/**
 * O rascunho em texto rico, no formato do Studio: cada seção vira um h2,
 * cada parágrafo um bloco (o marcado, no estilo "aEntrar"), o subtítulo da
 * lista um h3 e cada item da lista um bloco com marcador. As chaves
 * ("r0", "r1"…) são únicas na página: o índice acha os h2 por elas.
 */
export function blocosDoRascunho(rascunho: RascunhoLegal, demonstracao: boolean): PortableTextBlock[] {
  const blocos: PortableTextBlock[] = [];
  const bloco = (estilo: string, texto: string, lista = false) => {
    const chave = `r${blocos.length}`;
    blocos.push({
      _type: "block",
      _key: chave,
      style: estilo,
      markDefs: [],
      children: [{ _type: "span", _key: `${chave}s`, text: texto, marks: [] }],
      ...(lista ? { listItem: "bullet", level: 1 } : {}),
    });
  };

  for (const secao of rascunho.secoes) {
    bloco("h2", secao.titulo);
    for (const paragrafo of secao.paragrafos) {
      const naTela = paragrafoDoRascunho(paragrafo, demonstracao);
      if (naTela) bloco(naTela.estilo, naTela.texto);
    }
    if (secao.tituloDaLista) bloco("h3", secao.tituloDaLista);
    for (const item of secao.lista ?? []) bloco("normal", item, true);
  }
  return blocos;
}

/** O que a página de texto desenha, venha do Studio ou do rascunho. */
export type ConteudoDaPagina = {
  titulo: string;
  resumo: string;
  /** "2026-08-23" no rascunho; data e hora no Studio. */
  atualizadoEm: string;
  /** O quadro no alto do texto. Só o rascunho tem. */
  aviso: AvisoDoRascunho | null;
  corpo: PortableTextBlock[];
};

export function conteudoDoRascunho(rascunho: RascunhoLegal, demonstracao: boolean): ConteudoDaPagina {
  return {
    titulo: rascunho.titulo,
    resumo: rascunho.resumo,
    atualizadoEm: rascunho.atualizadoEm,
    aviso: rascunho.aviso,
    corpo: blocosDoRascunho(rascunho, demonstracao),
  };
}

export function conteudoDoSanity(pagina: PaginaInstitucional): ConteudoDaPagina {
  return {
    titulo: pagina.titulo,
    resumo: pagina.resumo,
    atualizadoEm: pagina.atualizadoEm,
    aviso: null,
    corpo: pagina.corpo,
  };
}

/**
 * O texto da página: o revisado, do Studio, sempre vence; sem ele, o
 * rascunho em código; sem os dois, a página não existe (null).
 */
export function conteudoDaPagina(
  revisado: PaginaInstitucional | null,
  rascunho: RascunhoLegal | null | undefined,
  demonstracao: boolean,
): ConteudoDaPagina | null {
  if (revisado) return conteudoDoSanity(revisado);
  if (rascunho) return conteudoDoRascunho(rascunho, demonstracao);
  return null;
}

export type AncoraDoCorpo = ItemDoIndice & { chave: string };

/* O texto de um bloco, das partes dele, sem os espaços das pontas. */
function textoDoBloco(bloco: PortableTextBlock): string {
  return (bloco.children ?? [])
    .map((parte) => {
      const texto = (parte as { text?: unknown }).text;
      return typeof texto === "string" ? texto : "";
    })
    .join("")
    .trim();
}

/**
 * Os títulos de seção (h2) do texto, na ordem, com a âncora única de cada
 * um e a chave do bloco, por onde o h2 recebe o `id`. Título em branco não
 * entra.
 */
export function ancorasDoCorpo(corpo: PortableTextBlock[]): AncoraDoCorpo[] {
  const titulos = corpo
    .filter((bloco) => bloco._type === "block" && bloco.style === "h2")
    .map((bloco) => ({ chave: bloco._key ?? "", titulo: textoDoBloco(bloco) }))
    .filter((t) => t.titulo !== "");
  return ancorasUnicas(titulos.map((t) => t.titulo)).map((item, i) => ({ ...item, chave: titulos[i].chave }));
}
```

- [ ] **Step 9: `lib/associacao.ts`**

```ts
import type { PortableTextBlock } from "@portabletext/react";
import type { NomeIcone } from "@/components/base/Icone";
import type { Diretor } from "@/lib/dados/diretoria";
import { iconeDaPagina } from "@/lib/paginaDeTexto";

/*
  O que a página A Associação (/associacao) decide, em funções puras
  (testes/associacao-funcoes.test.ts):
  - os atalhos de "Saiba mais";
  - a diretoria em destaque;
  - os números da faixa verde;
  - a apresentação oficial;
  - o texto do convite para se associar, o mesmo da home.
*/

/** O texto aprovado da faixa "Seja associado" da home, repetido no fecho de A Associação. */
export const CONVITE_PARA_ASSOCIAR = {
  titulo: "Associe-se à AMI e fortaleça a medicina em Imperatriz",
  texto: "Médico com inscrição no CRM pode se associar. Fale com a AMI para saber como.",
} as const;

export type Atalho = {
  titulo: string;
  frase: string;
  caminho: string;
  icone: NomeIcone;
  /** A página ainda não existe: o atalho só sai na demonstração, com "texto a entrar". */
  aEntrar: boolean;
};

/* Os candidatos, na ordem da tela. "Benefícios" não entra (spec, seção 1.5). */
const CANDIDATOS = [
  { slug: "seja-associado", titulo: "Seja associado", frase: "Quem pode se associar à AMI e como fazer isso." },
  { slug: "estatuto", titulo: "Estatuto", frase: "As regras que organizam a associação." },
  { slug: "politica-editorial", titulo: "Política editorial", frase: "Como o site escolhe, apura e revisa o que publica." },
] as const;

/** Com um atalho só (Seja associado), o bloco repetiria o fecho logo abaixo: não sai. */
export const MINIMO_DE_ATALHOS = 2;

/**
 * Os atalhos de "Saiba mais". `existentes` são os endereços das páginas que
 * existem: publicadas no Studio ou com rascunho em código.
 * - A que existe sai nos dois modos.
 * - A que não existe sai só na demonstração, como "texto a entrar".
 * - Com menos de dois, nenhum.
 */
export function atalhosDoSaibaMais(demonstracao: boolean, existentes: readonly string[]): Atalho[] {
  const atalhos: Atalho[] = [];
  for (const c of CANDIDATOS) {
    const caminho = `/associacao/${c.slug}`;
    const existe = existentes.includes(caminho);
    if (!existe && !demonstracao) continue;
    atalhos.push({ titulo: c.titulo, frase: c.frase, caminho, icone: iconeDaPagina(c.slug), aEntrar: !existe });
  }
  return atalhos.length >= MINIMO_DE_ATALHOS ? atalhos : [];
}

/** Quantos diretores a página da associação mostra; a lista inteira está em /associacao/diretoria. */
export const LIMITE_DA_DIRETORIA_EM_DESTAQUE = 4;

/** Os primeiros da diretoria, na ordem da AMI (`ordenarDiretoria`, lib/dados/diretoria.ts). */
export function diretoriaEmDestaque(diretoria: Diretor[]): Diretor[] {
  return diretoria.slice(0, LIMITE_DA_DIRETORIA_EM_DESTAQUE);
}

export type NumeroDaAssociacao = { icone: NomeIcone; valor: number; rotulo: string };

/** Os três números da home, na faixa verde de A Associação: anos, médicos e especialidades. */
export function numerosDaAssociacao(n: {
  anos: number;
  medicos: number;
  especialidades: number;
}): NumeroDaAssociacao[] {
  return [
    { icone: "selo", valor: n.anos, rotulo: n.anos === 1 ? "ano de AMI" : "anos de AMI" },
    {
      icone: "estetoscopio",
      valor: n.medicos,
      rotulo: n.medicos === 1 ? "médico no diretório" : "médicos no diretório",
    },
    {
      icone: "batimento",
      valor: n.especialidades,
      rotulo: n.especialidades === 1 ? "especialidade" : "especialidades",
    },
  ];
}

export type ApresentacaoNaTela = { tipo: "texto"; blocos: PortableTextBlock[] } | { tipo: "a-entrar" };

/**
 * A apresentação oficial, o texto do documento "associacao" do Studio. A
 * mesma trava das outras molduras (lib/molduras.ts): com texto, sai nos
 * dois modos; sem texto, "a entrar" só na demonstração; fora dela, nada.
 */
export function apresentacaoDaAssociacao(
  demonstracao: boolean,
  corpo: PortableTextBlock[] | null | undefined,
): ApresentacaoNaTela | null {
  if (corpo && corpo.length > 0) return { tipo: "texto", blocos: corpo };
  return demonstracao ? { tipo: "a-entrar" } : null;
}
```

- [ ] **Step 10: O link do mapa**

Em `lib/contato.ts` (LF), acrescente no fim do arquivo:

```ts

/** "Como chegar": a busca do Google Maps por um endereço escrito, sem chave nem serviço novo. */
export function buscaNoMapa(endereco: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(endereco)}`;
}
```

E, no comentário do topo do mesmo arquivo, troque

```
  Os números de contato (telefone e WhatsApp), em funções puras e sem
```

por

```
  Os números de contato (telefone e WhatsApp) e o link do mapa, em funções puras e sem
```

Em `lib/encontre.ts` (LF):

1. Troque `import { numeroPreenchido } from "@/lib/contato";` por `import { buscaNoMapa, numeroPreenchido } from "@/lib/contato";`.
2. Troque o corpo de `linkDoMapa`:

```ts
  const endereco = enderecoDoLocal(l).join(", ");
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(endereco)}`;
```

por

```ts
  return buscaNoMapa(enderecoDoLocal(l).join(", "));
```

Em `lib/ami.ts` (CRLF):

1. Troque `import { numeroNacional } from "@/lib/contato";` por `import { buscaNoMapa, numeroNacional } from "@/lib/contato";`.
2. Depois da função `enderecoEmLinha`, acrescente:

```ts

/**
 * "Como chegar" à sede, na página da associação e em Seja associado: o
 * endereço em uma linha, com o CEP, na busca do Google Maps.
 */
export function linkDoMapaDaAmi(): string {
  return buscaNoMapa(`${enderecoEmLinha()}, ${AMI.endereco.cep}`);
}
```

- [ ] **Step 11: Rodar, provar por mutação, commit**

Run: `npx vitest run` · `npx tsc --noEmit` · `npm run build` → verde. `testes/encontre.test.ts` continua verde: o `linkDoMapa` do consultório dá o mesmo endereço de antes.

Mutações, uma de cada vez, regravando o original depois. Cada uma deixa um teste vermelho:

1. Em `ancoraDoTitulo`, tire o `.normalize("NFD")`.
2. Em `ancoraDoTitulo`, tire o prefixo (`base` no lugar de `` `secao-${base}` ``).
3. Em `ancorasUnicas`, troque o `for` por ``if (usadas.has(id)) id = `${base}-2`;``.
4. Em `indiceNestaPagina`, troque `>=` por `>`.
5. Em `secaoAtual`, troque `topo <= linha` por `topo < linha`.
6. Em `secaoAtual`, tire a linha do `noFim`.
7. Em `paragrafoDoRascunho`, troque `demonstracao ?` por `true ?`.
8. Em `paragrafoDoRascunho`, devolva `texto` inteiro no lugar de `texto.slice(MARCA_PROVISORIA.length)`.
9. Em `blocosDoRascunho`, tire a linha do `tituloDaLista`.
10. Em `conteudoDaPagina`, troque a ordem dos dois `if`.
11. Em `ancorasDoCorpo`, tire o `.filter((t) => t.titulo !== "")`.
12. Troque `"politica-editorial", "artigo"` por `"politica-editorial", "documento"` no `Map` de ícones.
13. Em `atalhosDoSaibaMais`, troque `>= MINIMO_DE_ATALHOS` por `> 0`.
14. Em `atalhosDoSaibaMais`, tire o `continue` (o que não existe sai também fora da demonstração).
15. Em `numerosDaAssociacao`, troque `n.medicos === 1` por `n.medicos === 0`.
16. Em `apresentacaoDaAssociacao`, tire `&& corpo.length > 0`.
17. Em `linkDoMapaDaAmi`, tire o CEP.
18. Troque `relogio: ClockCounterClockwise` por `relogio: CalendarBlank` no `Icone.tsx`.

```bash
git add lib/nestaPagina.ts lib/paginaDeTexto.ts lib/associacao.ts testes/nesta-pagina.test.ts testes/paginas-de-texto.test.ts testes/associacao-funcoes.test.ts lib/rascunhosLegais.ts lib/contato.ts lib/encontre.ts lib/ami.ts components/base/Icone.tsx testes/icones.test.ts testes/contato.test.ts
git commit -m "Funcoes puras de A Associacao: indice Nesta pagina, rascunho em texto rico com a moldura no lugar do PROVISORIO, atalhos, diretoria em destaque, numeros, link do mapa e onze icones"
```

---

### Task 2: A faixa curta e o índice "Nesta página"

**Files:**
- Create: `components/layout/FaixaCurta.tsx`
- Create: `components/editorial/IndiceNestaPagina.tsx`, `components/editorial/IndiceNestaPagina.module.css`
- Create: `testes/faixa-curta-e-indice.test.ts`

**Interfaces:**
- Consumes:
  - `VoltaDaPagina` (`lib/paginaDeTexto.ts`) e `ItemDoIndice`, `LINHA_DE_LEITURA`, `secaoAtual` (`lib/nestaPagina.ts`) (Task 1);
  - `Icone`, `NomeIcone` com `"voltar"` e `"abaixo"` (`components/base/Icone.tsx`);
  - as classes `faixa`, `sobre`, `titulo`, `texto` de `components/busca/FaixaDaBusca.module.css`;
  - as classes `especialidade`, `volta`, `selo` de `components/especialidades/FaixaDaEspecialidade.module.css` (plano Especialidades, Task 5).
- Produces:

```ts
// components/layout/FaixaCurta.tsx
export function FaixaCurta(props: {
  volta: VoltaDaPagina;
  titulo: string;
  texto: string;
  icone: NomeIcone;
  children?: ReactNode; // entra logo depois do texto (a pílula do mandato)
}): JSX.Element; // <section data-bloco="topo" data-faixa="" data-abertura="" aria-labelledby="pagina-titulo" …>
// components/editorial/IndiceNestaPagina.tsx ("use client")
export function IndiceNestaPagina(props: { itens: ItemDoIndice[] }): JSX.Element; // <aside data-nesta-pagina …>, preso à direita
export function IndiceRecolhido(props: { itens: ItemDoIndice[] }): JSX.Element;   // <details …>, no alto da coluna, no celular
```

- [ ] **Step 1: Os testes**

`testes/faixa-curta-e-indice.test.ts`:

```ts
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { Icon } from "@phosphor-icons/react";
import { ArrowLeft, CaretDown, UsersThree } from "@phosphor-icons/react/dist/ssr";
import estilosBusca from "@/components/busca/FaixaDaBusca.module.css";
import { IndiceNestaPagina, IndiceRecolhido } from "@/components/editorial/IndiceNestaPagina";
import estilosIndice from "@/components/editorial/IndiceNestaPagina.module.css";
import estilosFaixa from "@/components/especialidades/FaixaDaEspecialidade.module.css";
import { FaixaCurta } from "@/components/layout/FaixaCurta";
import { ancorasUnicas } from "@/lib/nestaPagina";
import { VOLTA_ASSOCIACAO, VOLTA_INICIO } from "@/lib/paginaDeTexto";
import { fonte, semComentarios } from "@/testes/apoio";
import { base, bloco, regra, semNotas } from "@/testes/css";

/*
  A faixa verde curta (a diretoria e as páginas de texto) e o índice "Nesta
  página", no HTML de servidor. O CSS se lê do arquivo. A marcação da seção
  lida, ao rolar, é conferida no navegador pela auditoria
  (scripts/auditoria-visual.js, conferência 16); aqui, a ligação do
  componente com a rolagem se lê do código.
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

describe("a faixa curta", () => {
  const html = renderToString(
    createElement(
      FaixaCurta,
      {
        volta: VOLTA_ASSOCIACAO,
        titulo: "Diretoria da AMI",
        texto: "Quem responde pela associação.",
        icone: "pessoas",
      },
      createElement("p", { className: "extra" }, "Logo depois do texto"),
    ),
  );

  it("faixa verde de ponta a ponta que abre a página, com a forma da faixa da especialidade", () => {
    expect(html).toMatch(
      new RegExp(
        `^<section data-bloco="topo" data-faixa="" data-abertura="" aria-labelledby="pagina-titulo" class="textura-verde ${estilosBusca.faixa} ${estilosFaixa.especialidade}">`,
      ),
    );
    expect(html).toContain('<div class="brilho" aria-hidden="true"></div>');
    expect(html).not.toContain("<form");
    expect(html).not.toContain('id="encontre"');
  });

  it("no lugar do rótulo, o link de volta, na coluna do texto, com a seta para a esquerda", () => {
    const link = /<a [^>]*href="\/associacao"[^>]*>/.exec(html)![0];
    expect(link).toContain(`class="rotulo-secao ${estilosBusca.sobre} ${estilosFaixa.volta}"`);
    expect(link).toContain('data-coluna=""');
    const ini = html.indexOf(link) + link.length;
    const dentro = html.slice(ini, html.indexOf("</a>", ini));
    expect(dentro.startsWith(desenho(ArrowLeft, 20, "regular"))).toBe(true);
    expect(tela(dentro)).toBe("A Associação");

    const legal = renderToString(
      createElement(FaixaCurta, { volta: VOLTA_INICIO, titulo: "Termos de uso", texto: "x", icone: "documento" }),
    );
    expect(tela(/<a [^>]*href="\/"[^>]*>[\s\S]*?<\/a>/.exec(legal)![0])).toBe("Início");
  });

  it("o título, o texto, e o que vier junto logo depois do texto", () => {
    expect(html).toContain(
      `<h1 id="pagina-titulo" class="${estilosBusca.titulo}">Diretoria da AMI</h1>` +
        `<p class="${estilosBusca.texto}">Quem responde pela associação.</p>` +
        `<p class="extra">Logo depois do texto</p></div>`,
    );
  });

  it("à direita, o ícone da página no ladrilho de vidro, fora do leitor de tela", () => {
    expect(html).toContain(
      `<div class="${estilosFaixa.selo}" aria-hidden="true">${desenho(UsersThree, 84, "duotone")}</div></section>`,
    );
  });
});

describe("o índice Nesta página", () => {
  const itens = ancorasUnicas(["O que é a AMI", "Quem pode se associar", "Como se associar"]);
  const lateral = renderToString(createElement(IndiceNestaPagina, { itens }));
  const recolhido = renderToString(createElement(IndiceRecolhido, { itens }));

  it("à direita: o título e um link por seção, para a âncora dela", () => {
    expect(lateral).toMatch(
      new RegExp(
        `^<aside class="${estilosIndice.lateral}" aria-labelledby="nesta-pagina-titulo" data-nesta-pagina="">` +
          `<p id="nesta-pagina-titulo" class="${estilosIndice.titulo}">Nesta página</p>` +
          `<ol class="${estilosIndice.lista}">`,
      ),
    );
    expect([...lateral.matchAll(/<a href="#([^"]+)"[^>]*>([^<]+)<\/a>/g)].map((m) => [m[1], m[2]])).toEqual([
      ["secao-o-que-e-a-ami", "O que é a AMI"],
      ["secao-quem-pode-se-associar", "Quem pode se associar"],
      ["secao-como-se-associar", "Como se associar"],
    ]);
  });

  it("no HTML do servidor, nenhum item se diz o atual: quem marca é o navegador, ao rolar", () => {
    expect(lateral).not.toContain("aria-current");
    expect(lateral).not.toContain(estilosIndice.atual);
  });

  it("no celular: recolhido, com a seta para baixo, e os mesmos links", () => {
    expect(recolhido).toMatch(
      new RegExp(`^<details class="${estilosIndice.recolhido}"><summary>Nesta página <svg`),
    );
    expect(recolhido).toContain(`${desenho(CaretDown, 20, "regular")}</summary>`);
    expect([...recolhido.matchAll(/<a href="#([^"]+)"/g)].map((m) => m[1])).toEqual(itens.map((i) => i.id));
  });

  it("a ligação com o navegador: a rolagem chama a função pura, com a linha de leitura", () => {
    const codigo = semComentarios(fonte("../components/editorial/IndiceNestaPagina.tsx"));
    expect(codigo.startsWith('"use client";')).toBe(true);
    expect(codigo).toContain('window.addEventListener("scroll", marcar, { passive: true });');
    expect(codigo).toContain("secaoAtual(topos, LINHA_DE_LEITURA, noFim)");
    expect(codigo).toContain('window.removeEventListener("scroll", marcar);');
  });
});

describe("o CSS do índice", () => {
  const css = semNotas(fonte("../components/editorial/IndiceNestaPagina.module.css"));
  const tablet = () => bloco(css, "@media (max-width: 980px)");

  it("no computador, preso à direita ao rolar; o recolhido não aparece", () => {
    expect(regra(base(css), ".lateral")).toMatch(/position: sticky;/);
    expect(regra(base(css), ".lateral")).toMatch(/top: 104px;/);
    expect(regra(base(css), ".recolhido")).toMatch(/display: none;/);
  });

  it("o item atual: verde escuro, em negrito, com o fio verde à esquerda; nada lima", () => {
    const r = regra(base(css), ".lista a.atual");
    expect(r).toMatch(/color: var\(--color-ami-green-800\);/);
    expect(r).toMatch(/font-weight: 600;/);
    expect(r).toMatch(/border-left-color: var\(--color-ami-green-600\);/);
    expect(css).not.toMatch(/lima/);
  });

  it("do tablet para baixo, o da lateral sai e o recolhido entra, já com a borda e o fundo", () => {
    expect(regra(tablet(), ".lateral")).toMatch(/display: none;/);
    const r = regra(tablet(), ".recolhido");
    expect(r).toMatch(/display: block;/);
    expect(r).toMatch(/border: 1px solid var\(--color-line\);/);
    expect(r).toMatch(/background: var\(--color-surface\);/);
    expect(regra(tablet(), ".recolhido[open] summary svg")).toMatch(/rotate\(180deg\)/);
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run testes/faixa-curta-e-indice.test.ts`
Expected: FAIL. Os componentes não existem.

- [ ] **Step 3: A faixa curta**

`components/layout/FaixaCurta.tsx`:

```tsx
import Link from "next/link";
import type { ReactNode } from "react";
import { Icone, type NomeIcone } from "@/components/base/Icone";
import busca from "@/components/busca/FaixaDaBusca.module.css";
import faixa from "@/components/especialidades/FaixaDaEspecialidade.module.css";
import type { VoltaDaPagina } from "@/lib/paginaDeTexto";

/*
  A faixa verde curta de ponta a ponta que abre a diretoria e as páginas
  de texto (o desenho aprovado: docs/desenho-aprovado/associacao/,
  `.busca-topo.esp-topo`).
  - No lugar do rótulo, o link de volta ("← A ASSOCIAÇÃO", "← INÍCIO").
  - O título e o resumo.
  - `children` entra logo depois do resumo: a pílula do mandato, na
    diretoria.
  - À direita, o ícone da página num ladrilho de vidro, que some no
    celular.

  Sem campo de busca, sem `Cabeceira` e sem trilha.

  O CSS é o da faixa da busca (components/busca/FaixaDaBusca.module.css) e
  o da faixa da especialidade
  (components/especialidades/FaixaDaEspecialidade.module.css), que já tem
  a mesma composição: texto à esquerda e o ladrilho à direita.

  - `data-abertura`: a barra do pé do celular aparece quando esta faixa sai
    da tela (components/layout/BarraDoPe.tsx).
  - `data-faixa`: a faixa fica fora da coluna da página
    (app/(site)/encontre.module.css).
*/
export function FaixaCurta({
  volta,
  titulo,
  texto,
  icone,
  children,
}: {
  volta: VoltaDaPagina;
  titulo: string;
  texto: string;
  icone: NomeIcone;
  children?: ReactNode;
}) {
  return (
    <section
      data-bloco="topo"
      data-faixa=""
      data-abertura=""
      aria-labelledby="pagina-titulo"
      className={`textura-verde ${busca.faixa} ${faixa.especialidade}`}
    >
      <div className="brilho" aria-hidden="true"></div>

      <div>
        <Link href={volta.href} className={`rotulo-secao ${busca.sobre} ${faixa.volta}`} data-coluna="">
          <Icone nome="voltar" /> {volta.rotulo}
        </Link>
        <h1 id="pagina-titulo" className={busca.titulo}>
          {titulo}
        </h1>
        <p className={busca.texto}>{texto}</p>
        {children}
      </div>

      <div className={faixa.selo} aria-hidden="true">
        <Icone nome={icone} duotone tamanho={84} />
      </div>
    </section>
  );
}
```

- [ ] **Step 4: O CSS do índice**

`components/editorial/IndiceNestaPagina.module.css`:

```css
/*
  O índice "Nesta página", transcrito do desenho aprovado
  (docs/desenho-aprovado/associacao/seja-associado.html: `.indice`,
  `.indice-titulo`, `.indice ol`, `.indice a`, `.indice a:hover`,
  `.indice a.atual`, `.indice-celular` e o que vem dentro dele, e os @media
  de 980 e 700px).

  No computador, preso à direita ao rolar, marcando a seção que está sendo
  lida. Do tablet para baixo, recolhido num `<details>` no alto da coluna.

  Uma diferença do desenho, de propósito: o desenho mostra o recolhido a
  partir de 980px, mas só o desenha (borda, fundo, a seta) abaixo de 700px;
  entre os dois, sairia o `<details>` cru do navegador. Aqui ele já sai
  desenhado a partir de 980px.

  #F0F1F3, o fio entre os itens do recolhido, não tem token: vai o
  `surface-fundo`, o cinza mais perto.
*/

.lateral {
  position: sticky;
  top: 104px;
}

.titulo {
  margin: 0 0 12px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--color-ink-400);
}

.lista {
  list-style: none;
  margin: 0;
  padding: 0;
  border-left: 1px solid var(--color-line);
}

.lista a {
  display: block;
  margin-left: -1px;
  padding: 7px 0 7px 16px;
  border-left: 2px solid transparent;
  font-size: 14.5px;
  line-height: 1.45;
  color: var(--color-ink-600);
  transition:
    color 0.2s,
    border-color 0.2s;
}

.lista a:hover {
  color: var(--color-ami-green-800);
}

.lista a.atual {
  color: var(--color-ami-green-800);
  font-weight: 600;
  border-left-color: var(--color-ami-green-600);
}

.recolhido {
  display: none;
}

@media (max-width: 980px) {
  .lateral {
    display: none;
  }

  .recolhido {
    display: block;
    border: 1px solid var(--color-line);
    border-radius: 14px;
    background: var(--color-surface);
  }

  .recolhido summary {
    list-style: none;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    height: 48px;
    padding: 0 16px;
    font-size: 14.5px;
    font-weight: 600;
    color: var(--color-ami-green-800);
    cursor: pointer;
  }

  .recolhido summary::-webkit-details-marker {
    display: none;
  }

  .recolhido summary svg {
    width: 16px;
    height: 16px;
    color: var(--color-ink-400);
    transition: transform 0.25s;
  }

  .recolhido[open] summary svg {
    transform: rotate(180deg);
  }

  .recolhido ol {
    list-style: none;
    margin: 0;
    padding: 4px 16px 12px;
    border-top: 1px solid var(--color-line);
  }

  .recolhido a {
    display: block;
    padding: 10px 0;
    font-size: 15px;
    color: var(--color-ink-600);
  }

  .recolhido li + li a {
    border-top: 1px solid var(--color-surface-fundo);
  }
}
```

- [ ] **Step 5: O índice**

`components/editorial/IndiceNestaPagina.tsx`:

```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { Icone } from "@/components/base/Icone";
import styles from "@/components/editorial/IndiceNestaPagina.module.css";
import { LINHA_DE_LEITURA, secaoAtual, type ItemDoIndice } from "@/lib/nestaPagina";

/*
  O índice "Nesta página" das páginas de texto, montado dos títulos de
  seção (h2) pela página (components/editorial/PaginaDeTexto.tsx).

  `IndiceNestaPagina` fica à direita, preso à rolagem, e marca a seção que
  está sendo lida (`aria-current="location"` e a classe `atual`). A cada
  rolagem, ele mede o topo de cada título e pergunta à função pura qual é
  a seção (`secaoAtual`, lib/nestaPagina.ts), com a linha de leitura do
  desenho. É a mesma regra do desenho aprovado, que marca pela rolagem, e
  não por IntersectionObserver: a seção lida é a do último título que
  passou da linha, e no fim da página é a última.

  Sem JavaScript, ou antes de ele rodar, nenhum item se diz o atual: o HTML
  do servidor não sabe onde a pessoa está.

  `IndiceRecolhido` é o do celular, num `<details>` no alto da coluna; ao
  tocar num item, ele se fecha.
*/
export function IndiceNestaPagina({ itens }: { itens: ItemDoIndice[] }) {
  const [atual, setAtual] = useState(-1);

  useEffect(() => {
    const titulos = itens.map((item) => document.getElementById(item.id));

    function marcar() {
      const noFim =
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
      const topos = titulos.map((t) => (t ? t.getBoundingClientRect().top : Infinity));
      setAtual(secaoAtual(topos, LINHA_DE_LEITURA, noFim));
    }

    marcar();
    window.addEventListener("scroll", marcar, { passive: true });
    window.addEventListener("resize", marcar);
    return () => {
      window.removeEventListener("scroll", marcar);
      window.removeEventListener("resize", marcar);
    };
  }, [itens]);

  return (
    <aside className={styles.lateral} aria-labelledby="nesta-pagina-titulo" data-nesta-pagina="">
      <p id="nesta-pagina-titulo" className={styles.titulo}>
        Nesta página
      </p>
      <ol className={styles.lista}>
        {itens.map((item, i) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              className={i === atual ? styles.atual : undefined}
              aria-current={i === atual ? "location" : undefined}
            >
              {item.titulo}
            </a>
          </li>
        ))}
      </ol>
    </aside>
  );
}

export function IndiceRecolhido({ itens }: { itens: ItemDoIndice[] }) {
  const detalhes = useRef<HTMLDetailsElement>(null);

  return (
    <details ref={detalhes} className={styles.recolhido}>
      <summary>
        Nesta página <Icone nome="abaixo" />
      </summary>
      <ol>
        {itens.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              onClick={() => {
                if (detalhes.current) detalhes.current.open = false;
              }}
            >
              {item.titulo}
            </a>
          </li>
        ))}
      </ol>
    </details>
  );
}
```

- [ ] **Step 6: Rodar, provar por mutação, commit**

Run: `npx vitest run` · `npx tsc --noEmit` · `npm run build` → verde.

Os componentes ainda não estão em página nenhuma: a Task 3 os liga.

Mutações, uma de cada vez, regravando o original depois:

1. Na faixa, tire `data-coluna=""` do link.
2. Na faixa, troque `{children}` de lugar com o `<p>` do texto.
3. No índice, comece o estado em `0` no lugar de `-1`.
4. No índice, troque `LINHA_DE_LEITURA` por `0` na chamada de `secaoAtual`.
5. No CSS, troque `top: 104px;` por `top: 0;`.
6. No CSS, tire o `display: none;` do `.lateral` no bloco de 980px.

```bash
git add components/layout/FaixaCurta.tsx components/editorial/IndiceNestaPagina.tsx components/editorial/IndiceNestaPagina.module.css testes/faixa-curta-e-indice.test.ts
git commit -m "Faixa verde curta com volta e icone, e o indice Nesta pagina, preso a direita e recolhido no celular"
```

---

### Task 3: O modelo de página de texto

**Files:**
- Modify: `components/editorial/PaginaDeTexto.tsx` (reescrita; CRLF)
- Create: `components/editorial/PaginaDeTexto.module.css`
- Create: `components/editorial/CorpoDoTexto.tsx`
- Delete: `components/editorial/RascunhoLegalNaTela.tsx`
- Modify: `app/(site)/associacao/[pagina]/page.tsx` (reescrita; CRLF)
- Modify: `app/(site)/politica-de-privacidade/page.tsx`, `app/(site)/termos-de-uso/page.tsx`, `app/(site)/politica-de-cookies/page.tsx` (LF)
- Modify: `lib/rascunhosLegais.ts` (comentários; CRLF)
- Modify: `components/painel/FormularioEntrar.tsx` (CRLF), `components/painel/FormularioMedico.tsx` (LF) (comentários)
- Modify: `app/(site)/encontre.module.css` (LF), `components/layout/Rodape.module.css` (CRLF) (comentários)
- Modify: `testes/aviso-do-rascunho.test.ts` (reescrita), `testes/paleta.test.ts`
- Create: `testes/modelo-de-texto.test.ts`

**Interfaces:**
- Consumes:
  - `ConteudoDaPagina`, `VoltaDaPagina`, `VOLTA_ASSOCIACAO`, `VOLTA_INICIO`, `conteudoDaPagina`, `iconeDaPagina`, `ancorasDoCorpo` (`lib/paginaDeTexto.ts`) e `indiceNestaPagina` (`lib/nestaPagina.ts`) (Task 1);
  - `FaixaCurta`, `IndiceNestaPagina`, `IndiceRecolhido` (Task 2);
  - `ehLinkInterno` (`lib/sanity/link.ts`), `dataPorExtenso` (`lib/formato.ts`), `DADOS_DEMONSTRACAO` (`lib/demonstracao.ts`);
  - `pagina` de `app/(site)/encontre.module.css`.
- Produces:

```ts
// components/editorial/PaginaDeTexto.tsx
export function PaginaDeTexto(props: {
  conteudo: ConteudoDaPagina;
  volta: VoltaDaPagina;
  icone: NomeIcone;
  children?: ReactNode; // entra no fim da coluna
}): JSX.Element; // <div class={pagina}> <FaixaCurta/> <section data-bloco="texto" data-faixa …> </div>
// components/editorial/CorpoDoTexto.tsx
export function CorpoDoTexto(props: {
  blocos: PortableTextBlock[];
  ancoras?: Record<string, string>; // chave do bloco -> id do h2
}): JSX.Element;
// components/editorial/PaginaDeTexto.module.css: faixa, grade, coluna, atualizado, quadro, quadroTitulo, falta, link
```

- [ ] **Step 1: Os testes**

`testes/modelo-de-texto.test.ts`:

```ts
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Icon } from "@phosphor-icons/react";
import { Cookie, FileText, Handshake, Scroll, ShieldCheck } from "@phosphor-icons/react/dist/ssr";
import type { PortableTextBlock } from "@portabletext/react";
import estilosPagina from "@/app/(site)/encontre.module.css";
import { PaginaDeTexto } from "@/components/editorial/PaginaDeTexto";
import estilos from "@/components/editorial/PaginaDeTexto.module.css";
import { VOLTA_ASSOCIACAO, type ConteudoDaPagina } from "@/lib/paginaDeTexto";
import type { PaginaInstitucional } from "@/lib/sanity/tipos";
import { fonte } from "@/testes/apoio";
import { base, bloco, regra, semNotas } from "@/testes/css";
import { htmlDe } from "@/testes/renderizar";

/*
  O modelo de página de texto, de duas formas:
  - o componente, renderizado com um texto escrito aqui;
  - as rotas de verdade (/associacao/[pagina] e as três legais), com o
    Sanity trocado por um dublê e as duas chaves de demonstração.

  A chave de demonstração é lida quando lib/demonstracao.ts é importado:
  cada caso troca a chave e importa a rota de novo, como
  testes/pagina-de-especialidade.test.ts.

  O CSS se lê do arquivo; o alinhamento e o ritmo são medidos pela
  auditoria (scripts/auditoria-visual.js).
*/

vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));

const dados = vi.hoisted(() => ({ paginas: {} as Record<string, unknown> }));

vi.mock("@/lib/sanity/consultas", () => ({
  paginaPorSlug: async (slug: string) => dados.paginas[slug] ?? null,
}));

afterEach(() => {
  vi.unstubAllEnvs();
  dados.paginas = {};
});

const desenho = (Componente: Icon) =>
  renderToString(createElement(Componente, { size: 84, weight: "duotone", className: "", "aria-hidden": "true" }));

function b(chave: string, estilo: string, texto: string, extra: Record<string, unknown> = {}): PortableTextBlock {
  return {
    _type: "block",
    _key: chave,
    style: estilo,
    markDefs: [],
    children: [{ _type: "span", _key: `${chave}s`, text: texto, marks: [] }],
    ...extra,
  } as PortableTextBlock;
}

const CONTEUDO: ConteudoDaPagina = {
  titulo: "Estatuto",
  resumo: "As regras que organizam a associação.",
  atualizadoEm: "2026-09-10T12:00:00Z",
  aviso: null,
  corpo: [
    b("a", "h2", "Capítulo um"),
    b("b", "normal", "Texto um."),
    b("c", "h3", "Seção"),
    b("d", "normal", "Item.", { listItem: "bullet", level: 1 }),
    b("e", "h2", "Capítulo dois"),
    {
      ...b("f", "normal", ""),
      markDefs: [{ _type: "link", _key: "l", href: "/associacao/diretoria" }],
      children: [
        { _type: "span", _key: "f1", text: "Veja ", marks: [] },
        { _type: "span", _key: "f2", text: "a diretoria", marks: ["l"] },
        { _type: "span", _key: "f3", text: " e o ", marks: [] },
        { _type: "span", _key: "f4", text: "presidente", marks: ["strong"] },
        { _type: "span", _key: "f5", text: ".", marks: [] },
      ],
    } as PortableTextBlock,
  ],
};

const componente = (conteudo: ConteudoDaPagina, filho?: string) =>
  renderToString(
    createElement(
      PaginaDeTexto,
      { conteudo, volta: VOLTA_ASSOCIACAO, icone: "pergaminho" },
      filho ? createElement("p", { className: "fim" }, filho) : undefined,
    ),
  );

describe("o modelo, renderizado", () => {
  const html = componente(CONTEUDO, "Fim da coluna");

  it("a faixa verde curta e o corpo numa faixa branca de ponta a ponta, no invólucro de coluna e ritmo", () => {
    expect(html).toMatch(new RegExp(`^<div class="${estilosPagina.pagina}"><section data-bloco="topo"`));
    expect(html).toContain('<h1 id="pagina-titulo"');
    expect(html).toContain(">Estatuto</h1>");
    expect(html).toContain(desenho(Scroll));
    expect(html).toContain(
      `<section data-bloco="texto" data-faixa="" aria-label="Texto da página" class="${estilos.faixa}"><div class="${estilos.grade}"><article class="${estilos.coluna}" data-coluna="">`,
    );
  });

  it("a data por extenso, com o relógio, no alto da coluna", () => {
    expect(html).toMatch(
      new RegExp(
        `<article class="${estilos.coluna}" data-coluna=""><p class="${estilos.atualizado}"><svg[^]*?</svg>Atualizado em <time dateTime="2026-09-10T12:00:00Z">10 de setembro de 2026</time></p>`,
        "i",
      ),
    );
  });

  it("o texto: h2 com âncora, h3, lista, link interno e negrito", () => {
    expect(html).toContain(
      '<h2 id="secao-capitulo-um">Capítulo um</h2><p>Texto um.</p><h3>Seção</h3><ul><li>Item.</li></ul>' +
        '<h2 id="secao-capitulo-dois">Capítulo dois</h2>',
    );
    const link = /<a [^>]*href="\/associacao\/diretoria"[^>]*>a diretoria<\/a>/.exec(html)![0];
    expect(link).toContain(`class="${estilos.link}"`);
    expect(html).toContain("<strong>presidente</strong>");
  });

  it("o que vem junto entra no fim da coluna, depois do texto", () => {
    expect(html).toContain('<p class="fim">Fim da coluna</p></article>');
  });

  it("com dois títulos de seção ou mais: o índice à direita e o recolhido no alto da coluna", () => {
    expect(html).toContain('data-nesta-pagina=""');
    expect(html).toMatch(/<\/time><\/p><details /);
    expect(html).toMatch(/<\/article><aside [^>]*data-nesta-pagina=""/);
    expect([...html.matchAll(/<a href="#(secao-[^"]+)"/g)].map((m) => m[1])).toEqual([
      "secao-capitulo-um",
      "secao-capitulo-dois",
      "secao-capitulo-um",
      "secao-capitulo-dois",
    ]);
  });

  it("com um só, nenhum índice; o título continua com a âncora", () => {
    const um = componente({ ...CONTEUDO, corpo: CONTEUDO.corpo.slice(0, 2) });
    expect(um).not.toContain("data-nesta-pagina");
    expect(um).not.toContain("<details");
    expect(um).toContain('<h2 id="secao-capitulo-um">');
  });

  it("sem aviso, sem quadro", () => {
    expect(html).not.toContain('role="note"');
  });

  it("com aviso: o quadro cinza, com o ícone, o título e o texto, antes do texto", () => {
    const comAviso = componente({ ...CONTEUDO, aviso: { titulo: "Esta página é provisória", texto: "Texto do aviso." } });
    expect(comAviso).toMatch(
      new RegExp(
        `<div class="${estilos.quadro}" role="note"><svg[^]*?</svg><div><p class="${estilos.quadroTitulo}">Esta página é provisória</p><p>Texto do aviso.</p></div></div><h2 id="secao-capitulo-um">`,
      ),
    );
  });

  it("nenhuma Cabeceira, trilha ou BreadcrumbList", () => {
    expect(html).not.toContain("Trilha de navegação");
    expect(html).not.toContain("-mt-32");
    expect(html).not.toContain("BreadcrumbList");
  });
});

const PRIVACIDADE_REVISADA: PaginaInstitucional = {
  titulo: "Política de privacidade",
  slug: "politica-de-privacidade",
  resumo: "O texto revisado pelo advogado.",
  atualizadoEm: "2026-11-01T12:00:00Z",
  corpo: [b("a", "h2", "Quem trata os dados"), b("b", "normal", "A AMI.")],
};

const ROTAS = {
  privacidade: () => import("@/app/(site)/politica-de-privacidade/page"),
  termos: () => import("@/app/(site)/termos-de-uso/page"),
  cookies: () => import("@/app/(site)/politica-de-cookies/page"),
};

async function legal(qual: keyof typeof ROTAS, chave: string) {
  vi.stubEnv("NEXT_PUBLIC_DADOS_DEMONSTRACAO", chave);
  vi.resetModules();
  const { default: Pagina } = await ROTAS[qual]();
  return htmlDe(await Pagina());
}

async function daAssociacao(pagina: string, chave: string) {
  vi.stubEnv("NEXT_PUBLIC_DADOS_DEMONSTRACAO", chave);
  vi.resetModules();
  const { default: Pagina } = await import("@/app/(site)/associacao/[pagina]/page");
  return htmlDe(await Pagina({ params: Promise.resolve({ pagina }) }));
}

describe("as páginas legais", () => {
  it("com o rascunho: voltam ao início, com o ícone de cada uma, o aviso de advogado e a data", async () => {
    const html = await legal("privacidade", "true");
    expect(/<a [^>]*href="\/"[^>]*>/.exec(html)![0]).toContain('data-coluna=""');
    expect(html).toContain(">Política de privacidade</h1>");
    expect(html).toContain(desenho(ShieldCheck));
    expect(html).toContain("Este texto é um rascunho e ainda não foi revisado por advogado");
    expect(html).toMatch(/<time dateTime="2026-08-21">21 de agosto de 2026<\/time>/i);
    expect(html).toContain('<h2 id="secao-quem-e-o-responsavel">Quem é o responsável</h2>');
    expect(await legal("termos", "true")).toContain(desenho(FileText));
    expect(await legal("cookies", "true")).toContain(desenho(Cookie));
  });

  it("na demonstração, o que falta no rascunho sai como moldura a entrar, sem a marca", async () => {
    const html = await legal("privacidade", "true");
    const aEntrar = [...html.matchAll(new RegExp(`<p class="${estilos.falta}" data-a-entrar="">([^<]+)</p>`, "g"))];
    expect(aEntrar.map((m) => m[1].slice(0, 40))).toEqual([
      "A AMI precisa designar formalmente um en",
      "O prazo de guarda desses registros depen",
    ]);
  });

  it("fora da demonstração, o que falta não existe", async () => {
    const html = await legal("privacidade", "false");
    expect(html).not.toContain("data-a-entrar");
    expect(html).not.toContain("encarregado pelo tratamento");
  });

  it("nenhum PROVISÓRIO, Cabeceira, trilha ou BreadcrumbList, nos dois modos", async () => {
    for (const qual of ["privacidade", "termos", "cookies"] as const) {
      for (const chave of ["true", "false"]) {
        const html = await legal(qual, chave);
        expect(html, `${qual} ${chave}`).not.toContain("PROVISÓRIO");
        expect(html, `${qual} ${chave}`).not.toContain("Trilha de navegação");
        expect(html, `${qual} ${chave}`).not.toContain("-mt-32");
        expect(html, `${qual} ${chave}`).not.toContain("BreadcrumbList");
      }
    }
  });

  it("publicado o texto revisado, ele vence: sem o quadro de aviso, com o texto e a data dele", async () => {
    dados.paginas["politica-de-privacidade"] = PRIVACIDADE_REVISADA;
    const html = await legal("privacidade", "true");
    expect(html).not.toContain('role="note"');
    expect(html).not.toContain("rascunho");
    expect(html).toContain("<p>A AMI.</p>");
    expect(html).toContain("1 de novembro de 2026");
    expect(html).toContain("O texto revisado pelo advogado.");
  });

  it("o corpo é o último bloco: o rodapé emenda nele", async () => {
    const html = await legal("termos", "true");
    expect(html).toMatch(/<section data-bloco="texto" data-faixa=""[\s\S]*<\/section><\/div>$/);
    expect([...html.matchAll(/data-bloco="([^"]+)"/g)].map((m) => m[1])).toEqual(["topo", "texto"]);
  });
});

describe("as páginas da associação", () => {
  it("Seja associado, do rascunho: volta à associação, com o aperto de mãos", async () => {
    const html = await daAssociacao("seja-associado", "true");
    expect(/<a [^>]*href="\/associacao"/.test(html)).toBe(true);
    expect(html).toContain(">Seja associado</h1>");
    expect(html).toContain(desenho(Handshake));
    expect(html).toContain("Esta página é provisória");
    expect(html).not.toContain("PROVISÓRIO");
  });

  it("Estatuto sem documento nem rascunho, e um endereço que não existe: página não encontrada", async () => {
    await expect(daAssociacao("estatuto", "true")).rejects.toThrow("NEXT_NOT_FOUND");
    await expect(daAssociacao("nao-existe", "true")).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("Estatuto publicado no Studio: a página, com o pergaminho", async () => {
    dados.paginas.estatuto = { ...PRIVACIDADE_REVISADA, titulo: "Estatuto", slug: "estatuto" };
    const html = await daAssociacao("estatuto", "false");
    expect(html).toContain(">Estatuto</h1>");
    expect(html).toContain(desenho(Scroll));
  });
});

describe("o CSS da página de texto", () => {
  const css = semNotas(fonte("../components/editorial/PaginaDeTexto.module.css"));
  const cel = () => bloco(css, "@media (max-width: 700px)");

  it("faixa branca de ponta a ponta: 96px, 64px no tablet, 44px no celular, sem margem embaixo", () => {
    const f = regra(base(css), ".faixa");
    expect(f).toMatch(/padding: 96px var\(--borda-faixa\);/);
    expect(f).toMatch(/background: var\(--color-surface\);/);
    expect(f).not.toMatch(/margin/);
    expect(regra(bloco(css, "@media (max-width: 980px)"), ".faixa")).toMatch(/padding-top: 64px;/);
    expect(regra(cel(), ".faixa")).toMatch(/padding: 44px var\(--borda-faixa\);/);
  });

  it("coluna de leitura de 680px e o índice de 248px; 220px até 1180px; uma coluna do tablet para baixo", () => {
    expect(regra(base(css), ".grade")).toMatch(/grid-template-columns: minmax\(0, 680px\) 248px;/);
    expect(regra(base(css), ".grade")).toMatch(/justify-content: space-between;/);
    expect(regra(base(css), ".grade")).toMatch(/align-items: start;/);
    expect(regra(bloco(css, "@media (max-width: 1180px)"), ".grade")).toMatch(/minmax\(0, 1fr\) 220px/);
    expect(regra(bloco(css, "@media (max-width: 980px)"), ".grade")).toMatch(/grid-template-columns: minmax\(0, 1fr\);/);
  });

  it("o texto em 17,5px com entrelinha de 1,7, como a leitura do perfil; 16px no celular", () => {
    expect(regra(base(css), ".coluna p,\n.coluna li")).toMatch(/font-size: 17\.5px;/);
    expect(regra(base(css), ".coluna p,\n.coluna li")).toMatch(/line-height: 1\.7;/);
    expect(regra(cel(), ".coluna p,\n  .coluna li")).toMatch(/font-size: 16px;/);
  });

  it("o quadro de aviso é cinza neutro, sem tom quente", () => {
    const q = regra(base(css), ".quadro");
    expect(q).toMatch(/background: var\(--color-surface-fundo\);/);
    expect(q).toMatch(/border: 1px solid var\(--color-line\);/);
    expect(css).not.toMatch(/warn/);
  });

  it("o texto a entrar: cinza e em itálico, como nas outras molduras", () => {
    const r = regra(base(css), ".coluna .falta");
    expect(r).toMatch(/color: var\(--color-ink-400\);/);
    expect(r).toMatch(/font-style: italic;/);
  });

  it("a lista com o ponto verde do desenho", () => {
    expect(regra(base(css), ".coluna ul")).toMatch(/list-style: none;/);
    expect(regra(base(css), ".coluna ul > li::before")).toMatch(/background: var\(--color-ami-green-600\);/);
  });
});
```

Reescreva `testes/aviso-do-rascunho.test.ts` (LF) inteiro, depois de lido:

```ts
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PaginaDeTexto } from "@/components/editorial/PaginaDeTexto";
import { conteudoDoRascunho, VOLTA_INICIO } from "@/lib/paginaDeTexto";
import {
  COOKIES,
  PRIVACIDADE,
  SEJA_ASSOCIADO,
  TERMOS,
  type RascunhoLegal,
} from "@/lib/rascunhosLegais";

/*
  O aviso no alto da página de texto vem do rascunho e é trocável por
  rascunho. As três páginas legais mantêm, palavra por palavra, o aviso de
  "não revisado por advogado"; Seja associado, que não é peça jurídica e não
  vai a advogado nenhum, não pode dizer ao público que espera um.

  Renderiza com `renderToString` e lê o texto do HTML, sem clicar nem medir
  pixel (ver vitest.config.ts): a pergunta é o que a pessoa lê na tela, e
  isso inclui o componente usar mesmo o aviso do rascunho.
*/

function textoNaTela(rascunho: RascunhoLegal) {
  const html = renderToString(
    createElement(PaginaDeTexto, {
      conteudo: conteudoDoRascunho(rascunho, true),
      volta: VOLTA_INICIO,
      icone: "documento",
    }),
  );
  return html
    .replace(/<!-- -->/g, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ");
}

describe("aviso do rascunho na tela", () => {
  it.each([PRIVACIDADE, TERMOS, COOKIES])(
    "$slug mantém o aviso de texto legal de antes",
    (rascunho) => {
      const texto = textoNaTela(rascunho);
      expect(texto).toContain(
        "Este texto é um rascunho e ainda não foi revisado por advogado",
      );
      expect(texto).toContain(
        "Ele foi redigido a partir do funcionamento real deste site, para " +
          "servir de ponto de partida à revisão jurídica, e está publicado " +
          "para que a página não fique vazia. Não use como peça definitiva.",
      );
    },
  );

  it("Seja associado diz que é provisória e não fala de advogado", () => {
    const texto = textoNaTela(SEJA_ASSOCIADO);
    expect(texto).toContain("Esta página é provisória");
    expect(texto).toContain("A AMI ainda vai escrever o texto desta página.");
    expect(texto).not.toMatch(/advogad|jurídic/i);
  });

  it("Seja associado não afirma o que a AMI ainda vai decidir", () => {
    /* A AMI existe desde 1975; dizer que anuidade e critérios "ainda serão
       definidos" seria afirmar um fato sobre ela que ninguém conferiu. */
    expect(textoNaTela(SEJA_ASSOCIADO)).not.toMatch(/serão definidos/);
  });
});
```

Em `testes/paleta.test.ts` (LF), apague a entrada `warn` inteira de `FUNDOS_FORA_DO_TESTE` (as quatro linhas):

```ts
  warn:
    "só aparece como bg-warn/5 (components/editorial/RascunhoLegalNaTela.tsx), " +
    "5% de opacidade — a cor renderizada nunca é o tom cheio do token, então " +
    "medir --color-warn opaco testaria uma cor que a tela nunca mostra",
```

O quadro do aviso passa a cinza neutro, e nenhum outro lugar usa `bg-warn`: a exceção ficaria morta, com motivo falso. O `--color-warn` continua no `@theme`, como texto de erro do painel (`text-warn`).

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run testes/modelo-de-texto.test.ts testes/aviso-do-rascunho.test.ts`
Expected: FAIL. `PaginaDeTexto` tem outra assinatura, o CSS não existe e as rotas usam `RascunhoLegalNaTela`.

- [ ] **Step 3: O CSS da página de texto**

`components/editorial/PaginaDeTexto.module.css`:

```css
/*
  O modelo de página de texto, transcrito do desenho aprovado
  (docs/desenho-aprovado/associacao/seja-associado.html: `.faixa-branca`,
  `.leitura-grade`, `.coluna`, `.coluna > * + *`, `.coluna .atualizado`,
  `.atualizado i`, `.coluna h2`, `.coluna h3`, `.coluna h2 + *`,
  `.coluna p`, `.coluna ul` e o ponto da lista, `.coluna .falta`,
  `.quadro`, `.quadro > i`, `.coluna .quadro p`,
  `.coluna .quadro .quadro-titulo`, `.quadro-titulo + p`, e os @media de
  1180, 980 e 700px). O índice é de IndiceNestaPagina.module.css.

  O corpo numa faixa branca de ponta a ponta, sem canto nem sombra, com a
  margem lateral das faixas (`--borda-faixa`, app/globals.css) e sem
  margem embaixo: o rodapé emenda nele (components/layout/Rodape.module.css).
  A coluna de leitura tem 680px e começa na linha do texto de todos os
  blocos; o texto corre em 17,5px com entrelinha de 1,7, como a leitura do
  perfil (components/perfil/Perfil.module.css).

  O quadro do aviso é cinza neutro (`surface-fundo`), e não o âmbar de
  antes: nenhum tom quente no site.

  Fora do desenho, porque o texto do Studio pode ter e o desenho não mostra:
  a lista numerada (`ol`), o negrito (`strong`) e o link (`.link`, no verde
  de ação e sublinhado, como o texto rico das notícias).

  Os seletores começam por `.coluna`, como no desenho: assim o que vale
  para um parágrafo comum (`.coluna p`) não passa por cima da data, do
  quadro nem do texto a entrar, que têm o próprio tamanho.
*/

.faixa {
  padding: 96px var(--borda-faixa);
  background: var(--color-surface);
}

.grade {
  display: grid;
  grid-template-columns: minmax(0, 680px) 248px;
  justify-content: space-between;
  align-items: start;
  column-gap: var(--m);
}

.coluna {
  min-width: 0;
}

.coluna > * + * {
  margin-top: 20px;
}

.coluna .atualizado {
  padding-bottom: 24px;
  border-bottom: 1px solid var(--color-line);
  font-size: 13.5px;
  line-height: 1.5;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: var(--color-ink-400);
}

.atualizado svg {
  width: 16px;
  height: 16px;
  vertical-align: -2px;
  margin-right: 6px;
}

.coluna h2 {
  font-size: clamp(28px, 2.6vw, 34px);
  line-height: 1.1;
  margin-top: 56px;
}

.coluna h3 {
  font-size: 22px;
  line-height: 1.2;
  letter-spacing: -0.025em;
  margin-top: 32px;
}

.coluna h2 + *,
.coluna h3 + * {
  margin-top: 14px;
}

.coluna p,
.coluna li {
  font-size: 17.5px;
  line-height: 1.7;
  color: var(--color-ink-600);
}

.coluna ul {
  margin: 0;
  padding: 0;
  list-style: none;
}

.coluna ul > li {
  position: relative;
  padding-left: 22px;
}

.coluna ul > li::before {
  content: "";
  position: absolute;
  left: 3px;
  top: 0.74em;
  width: 6px;
  height: 6px;
  border-radius: 99px;
  background: var(--color-ami-green-600);
}

.coluna ul > li + li {
  margin-top: 8px;
}

.coluna ol {
  margin: 0;
  padding-left: 22px;
}

.coluna ol > li + li {
  margin-top: 8px;
}

.coluna strong {
  font-weight: 600;
  color: var(--color-ink-900);
}

.coluna .falta {
  font-size: 16.5px;
  color: var(--color-ink-400);
  font-style: italic;
}

.link {
  font-weight: 600;
  color: var(--color-ami-green-600);
  text-decoration: underline;
  text-underline-offset: 2px;
}

.link:hover {
  color: var(--color-ami-green-700);
}

.quadro {
  display: grid;
  grid-template-columns: 24px minmax(0, 1fr);
  column-gap: 14px;
  padding: 20px 24px 22px;
  border-radius: 16px;
  background: var(--color-surface-fundo);
  border: 1px solid var(--color-line);
}

.quadro > svg {
  width: 22px;
  height: 22px;
  margin-top: 1px;
  color: var(--color-ami-green-600);
}

.coluna .quadro p {
  font-size: 15.5px;
  line-height: 1.6;
}

.coluna .quadro .quadroTitulo {
  font-size: 16px;
  font-weight: 700;
  line-height: 1.4;
  color: var(--color-ami-green-800);
}

.quadroTitulo + p {
  margin-top: 4px;
}

@media (max-width: 1180px) {
  .grade {
    grid-template-columns: minmax(0, 1fr) 220px;
  }
}

@media (max-width: 980px) {
  .faixa {
    padding-top: 64px;
    padding-bottom: 64px;
  }

  .grade {
    grid-template-columns: minmax(0, 1fr);
  }
}

@media (max-width: 700px) {
  .faixa {
    padding: 44px var(--borda-faixa);
  }

  .coluna > * + * {
    margin-top: 16px;
  }

  .coluna .atualizado {
    padding-bottom: 16px;
    font-size: 13px;
  }

  .coluna h2 {
    font-size: 25px;
    margin-top: 40px;
  }

  .coluna h3 {
    font-size: 19px;
    margin-top: 24px;
  }

  .coluna h2 + *,
  .coluna h3 + * {
    margin-top: 10px;
  }

  .coluna p,
  .coluna li {
    font-size: 16px;
    line-height: 1.65;
  }

  .coluna .falta {
    font-size: 15px;
  }

  .quadro {
    grid-template-columns: 20px minmax(0, 1fr);
    column-gap: 12px;
    padding: 16px 16px 18px;
  }

  .quadro > svg {
    width: 20px;
    height: 20px;
  }

  .coluna .quadro p {
    font-size: 14.5px;
  }

  .coluna .quadro .quadroTitulo {
    font-size: 15px;
  }
}
```

- [ ] **Step 4: O texto rico**

`components/editorial/CorpoDoTexto.tsx`:

```tsx
import Link from "next/link";
import {
  PortableText,
  type PortableTextBlock,
  type PortableTextComponents,
} from "@portabletext/react";
import styles from "@/components/editorial/PaginaDeTexto.module.css";
import { ehLinkInterno } from "@/lib/sanity/link";

/*
  O texto de uma página de texto, do Studio ou do rascunho em código (que
  chega no mesmo formato: `blocosDoRascunho`, lib/paginaDeTexto.ts).

  Cada nó sai como tag simples, e o CSS da coluna desenha
  (PaginaDeTexto.module.css). As exceções:
  - o h2 ganha o `id` da âncora dele (`ancoras`, pela chave do bloco), para
    o índice "Nesta página" levar até ele;
  - o estilo "aEntrar" é o que falta no rascunho: a moldura "a entrar", em
    cinza e itálico, que só existe na demonstração;
  - o link é o do texto rico das notícias: interno pelo roteador do Next,
    externo na mesma aba (a regra de qual é qual está em lib/sanity/link.ts).

  O schema da página institucional (sanity/schemas/paginaInstitucional.ts)
  só aceita parágrafo, h2, h3, as duas listas, negrito, itálico e link.
  `onMissingComponent={false}`: o que vier fora disso sai sem aviso no
  console.
*/
function componentes(ancoras: Record<string, string>): PortableTextComponents {
  return {
    block: {
      normal: ({ children }) => <p>{children}</p>,
      h2: ({ value, children }) => (
        <h2 id={value._key ? ancoras[value._key] : undefined}>{children}</h2>
      ),
      h3: ({ children }) => <h3>{children}</h3>,
      aEntrar: ({ children }) => (
        <p className={styles.falta} data-a-entrar="">
          {children}
        </p>
      ),
    },
    list: {
      bullet: ({ children }) => <ul>{children}</ul>,
      number: ({ children }) => <ol>{children}</ol>,
    },
    listItem: {
      bullet: ({ children }) => <li>{children}</li>,
      number: ({ children }) => <li>{children}</li>,
    },
    marks: {
      strong: ({ children }) => <strong>{children}</strong>,
      em: ({ children }) => <em>{children}</em>,
      link: ({ value, children }) => {
        const href: string = value?.href ?? "#";
        return ehLinkInterno(href) ? (
          <Link href={href} className={styles.link}>
            {children}
          </Link>
        ) : (
          <a href={href} className={styles.link}>
            {children}
          </a>
        );
      },
    },
  };
}

export function CorpoDoTexto({
  blocos,
  ancoras = {},
}: {
  blocos: PortableTextBlock[];
  ancoras?: Record<string, string>;
}) {
  return <PortableText value={blocos} components={componentes(ancoras)} onMissingComponent={false} />;
}
```

- [ ] **Step 5: A página de texto**

Reescreva `components/editorial/PaginaDeTexto.tsx` (CRLF; leia antes) inteiro:

```tsx
import type { ReactNode } from "react";
import paginas from "@/app/(site)/encontre.module.css";
import { Icone, type NomeIcone } from "@/components/base/Icone";
import { CorpoDoTexto } from "@/components/editorial/CorpoDoTexto";
import { IndiceNestaPagina, IndiceRecolhido } from "@/components/editorial/IndiceNestaPagina";
import styles from "@/components/editorial/PaginaDeTexto.module.css";
import { FaixaCurta } from "@/components/layout/FaixaCurta";
import { dataPorExtenso } from "@/lib/formato";
import { indiceNestaPagina } from "@/lib/nestaPagina";
import { ancorasDoCorpo, type ConteudoDaPagina, type VoltaDaPagina } from "@/lib/paginaDeTexto";

/*
  O modelo das páginas de texto: Seja associado, Estatuto, Política
  editorial, Benefícios e os três textos legais (privacidade, cookies e
  termos de uso).
  - A faixa verde curta (components/layout/FaixaCurta.tsx), com o link de
    volta (`volta`), o título, o resumo e o ícone da página.
  - O corpo numa faixa branca de ponta a ponta, em coluna de leitura de
    680px: a data de atualização, o quadro de aviso, quando há, e o texto.
  - O índice "Nesta página", montado dos títulos de seção (h2): à direita e
    preso à rolagem no computador, recolhido no alto da coluna no celular.
    Com menos de dois títulos, não aparece (lib/nestaPagina.ts).
  - `children` entra no fim da coluna: o "Fale com a AMI" de Seja associado.

  O texto chega pronto (`ConteudoDaPagina`, lib/paginaDeTexto.ts), do
  documento do Studio ou do rascunho em código. O rascunho existe porque a
  alternativa era pior: sem ele, os três textos legais, linkados do rodapé
  de toda página, e o "Seja associado" da home davam 404 até a AMI publicar
  o texto dela; num site que lida com saúde, a falta de política de
  privacidade é falha mais visível do que um rascunho assinalado. O quadro
  de aviso diz isso a quem lê, antes do primeiro parágrafo. Ele é
  `role="note"`, e não `alert`: alerta interrompe quem usa leitor de tela,
  e isto é contexto para ler antes do texto, não emergência.

  A data de atualização sai visível, e não só no metadado: numa política de
  privacidade, saber de quando é a versão que se está lendo é a informação
  mais importante da página depois do próprio texto.

  Sem `Cabeceira`, sem trilha e sem BreadcrumbList: dado estruturado sem o
  equivalente visível é marcação enganosa (lib/seo/jsonld.ts). Os dois
  blocos são filhos diretos de `.pagina` (app/(site)/encontre.module.css);
  o corpo é faixa (`data-faixa`), e o rodapé emenda nele
  (components/layout/Rodape.module.css).
*/
export function PaginaDeTexto({
  conteudo,
  volta,
  icone,
  children,
}: {
  conteudo: ConteudoDaPagina;
  volta: VoltaDaPagina;
  icone: NomeIcone;
  children?: ReactNode;
}) {
  const ancoras = ancorasDoCorpo(conteudo.corpo);
  const indice = indiceNestaPagina(ancoras.map(({ id, titulo }) => ({ id, titulo })));
  const idDoBloco = Object.fromEntries(ancoras.map((a) => [a.chave, a.id]));
  const data = dataPorExtenso(conteudo.atualizadoEm);

  return (
    <div className={paginas.pagina}>
      <FaixaCurta volta={volta} titulo={conteudo.titulo} texto={conteudo.resumo} icone={icone} />

      <section data-bloco="texto" data-faixa="" aria-label="Texto da página" className={styles.faixa}>
        <div className={styles.grade}>
          <article className={styles.coluna} data-coluna="">
            {data ? (
              <p className={styles.atualizado}>
                <Icone nome="relogio" />
                Atualizado em <time dateTime={conteudo.atualizadoEm}>{data}</time>
              </p>
            ) : null}

            {indice.length > 0 ? <IndiceRecolhido itens={indice} /> : null}

            {conteudo.aviso ? (
              <div className={styles.quadro} role="note">
                <Icone nome="informacao" duotone />
                <div>
                  <p className={styles.quadroTitulo}>{conteudo.aviso.titulo}</p>
                  <p>{conteudo.aviso.texto}</p>
                </div>
              </div>
            ) : null}

            <CorpoDoTexto blocos={conteudo.corpo} ancoras={idDoBloco} />

            {children}
          </article>

          {indice.length > 0 ? <IndiceNestaPagina itens={indice} /> : null}
        </div>
      </section>
    </div>
  );
}
```

- [ ] **Step 6: A rota das páginas da associação**

Reescreva `app/(site)/associacao/[pagina]/page.tsx` (CRLF; leia antes) inteiro:

```tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PaginaDeTexto } from "@/components/editorial/PaginaDeTexto";
import { DADOS_DEMONSTRACAO } from "@/lib/demonstracao";
import { conteudoDaPagina, iconeDaPagina, VOLTA_ASSOCIACAO } from "@/lib/paginaDeTexto";
import { RASCUNHOS_DE_ASSOCIACAO } from "@/lib/rascunhosLegais";
import { paginaPorSlug } from "@/lib/sanity/consultas";
import { slugsDePaginasSobAssociacao } from "@/lib/sanity/paginas";
import { tituloDePagina } from "@/lib/seo/metadados";

export const revalidate = 3600;

/*
  As páginas de texto sob /associacao: Seja associado, Estatuto, Política
  editorial e Benefícios. A lista deriva de `CAMINHO_DAS_PAGINAS`
  (lib/sanity/paginas.ts), a mesma do sitemap e do schema do Studio.

  "diretoria" e "associacao" não entram: a primeira é a rota estática de
  app/(site)/associacao/diretoria/page.tsx (o Next resolve segmento
  estático antes de dinâmico, então esta rota nunca a vê), e a segunda é a
  página institucional, app/(site)/associacao/page.tsx.

  Exportada só para o teste que cruza esta lista com `CAMINHO_DAS_PAGINAS`
  (testes/sanity-paginas.test.ts): é o jeito de o teste verificar a rota
  de verdade, e não uma cópia do cálculo escrita de novo ali.
*/
export const PAGINAS = slugsDePaginasSobAssociacao();

type Props = { params: Promise<{ pagina: string }> };

export function generateStaticParams() {
  return PAGINAS.map((pagina) => ({ pagina }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { pagina } = await params;
  const conteudo = await paginaPorSlug(pagina);
  if (conteudo) {
    return {
      title: tituloDePagina(conteudo.titulo),
      description: conteudo.resumo,
      alternates: { canonical: `/associacao/${pagina}` },
    };
  }

  /* Sem documento no Sanity: o título e a descrição saem do rascunho em
     código, quando existir. Sem rascunho, a página não existe, e não há o
     que anunciar. */
  const rascunho = RASCUNHOS_DE_ASSOCIACAO[pagina];
  if (!rascunho) return {};

  return {
    title: tituloDePagina(rascunho.titulo),
    description: rascunho.resumo,
    alternates: { canonical: `/associacao/${pagina}` },
  };
}

/*
  O texto vem do documento do Studio, quando a AMI publicou; senão, do
  rascunho em código (hoje só "seja-associado", em lib/rascunhosLegais.ts);
  sem os dois, página não encontrada. O revisado sempre vence
  (`conteudoDaPagina`, lib/paginaDeTexto.ts).

  O desenho é o modelo de página de texto
  (components/editorial/PaginaDeTexto.tsx), com o link de volta para A
  Associação.
*/
export default async function SubpaginaDaAssociacao({ params }: Props) {
  const { pagina } = await params;
  if (!PAGINAS.includes(pagina)) notFound();

  const conteudo = conteudoDaPagina(
    await paginaPorSlug(pagina),
    RASCUNHOS_DE_ASSOCIACAO[pagina],
    DADOS_DEMONSTRACAO,
  );
  if (!conteudo) notFound();

  return <PaginaDeTexto conteudo={conteudo} volta={VOLTA_ASSOCIACAO} icone={iconeDaPagina(pagina)} />;
}
```

- [ ] **Step 7: As três páginas legais**

Em `app/(site)/politica-de-privacidade/page.tsx` (LF):

1. Troque as quatro linhas de import

```tsx
import { PaginaDeTexto } from "@/components/editorial/PaginaDeTexto";
import { RascunhoLegalNaTela } from "@/components/editorial/RascunhoLegalNaTela";
import { paginaPorSlug } from "@/lib/sanity/consultas";
import { PRIVACIDADE } from "@/lib/rascunhosLegais";
```

por

```tsx
import { notFound } from "next/navigation";
import { PaginaDeTexto } from "@/components/editorial/PaginaDeTexto";
import { DADOS_DEMONSTRACAO } from "@/lib/demonstracao";
import { conteudoDaPagina, iconeDaPagina, VOLTA_INICIO } from "@/lib/paginaDeTexto";
import { PRIVACIDADE } from "@/lib/rascunhosLegais";
import { paginaPorSlug } from "@/lib/sanity/consultas";
```

2. Apague o bloco `TRILHA` e a linha em branco depois dele:

```tsx
const TRILHA = [
  { nome: "Início", caminho: "/" },
  { nome: "Política de privacidade", caminho: `/${SLUG}` },
];

```

3. Troque o fim do comentário e a função:

```tsx
  Publicado o texto revisado, `paginaPorSlug` passa a devolver algo e o ramo
  de cima assume: o rascunho some da tela sem ninguém precisar apagar nada, e
  o aviso some junto com ele.
*/
export default async function PaginaPrivacidade() {
  const revisado = await paginaPorSlug(SLUG);

  if (revisado) return <PaginaDeTexto slug={SLUG} trilha={TRILHA} />;

  return <RascunhoLegalNaTela rascunho={PRIVACIDADE} trilha={TRILHA} />;
}
```

por

```tsx
  Publicado o texto revisado, `paginaPorSlug` passa a devolver algo e ele
  vence (`conteudoDaPagina`, lib/paginaDeTexto.ts): o rascunho some da tela
  sem ninguém precisar apagar nada, e o aviso some junto com ele.

  O desenho é o modelo de página de texto
  (components/editorial/PaginaDeTexto.tsx), com o link de volta para o
  início.
*/
export default async function PaginaPrivacidade() {
  const conteudo = conteudoDaPagina(await paginaPorSlug(SLUG), PRIVACIDADE, DADOS_DEMONSTRACAO);
  if (!conteudo) notFound();

  return <PaginaDeTexto conteudo={conteudo} volta={VOLTA_INICIO} icone={iconeDaPagina(SLUG)} />;
}
```

Em `app/(site)/termos-de-uso/page.tsx` (LF), os mesmos três passos, com `TERMOS` no lugar de `PRIVACIDADE`, `"Termos de uso"` no `TRILHA` que sai, e `PaginaTermos` no nome da função:

1. imports:

```tsx
import { notFound } from "next/navigation";
import { PaginaDeTexto } from "@/components/editorial/PaginaDeTexto";
import { DADOS_DEMONSTRACAO } from "@/lib/demonstracao";
import { conteudoDaPagina, iconeDaPagina, VOLTA_INICIO } from "@/lib/paginaDeTexto";
import { TERMOS } from "@/lib/rascunhosLegais";
import { paginaPorSlug } from "@/lib/sanity/consultas";
```

2. apague:

```tsx
const TRILHA = [
  { nome: "Início", caminho: "/" },
  { nome: "Termos de uso", caminho: `/${SLUG}` },
];

```

3. o fim do comentário e a função:

```tsx
  Publicado o texto revisado, `paginaPorSlug` passa a devolver algo e ele
  vence (`conteudoDaPagina`, lib/paginaDeTexto.ts): o rascunho some da tela
  sem ninguém precisar apagar nada, e o aviso some junto com ele.

  O desenho é o modelo de página de texto
  (components/editorial/PaginaDeTexto.tsx), com o link de volta para o
  início.
*/
export default async function PaginaTermos() {
  const conteudo = conteudoDaPagina(await paginaPorSlug(SLUG), TERMOS, DADOS_DEMONSTRACAO);
  if (!conteudo) notFound();

  return <PaginaDeTexto conteudo={conteudo} volta={VOLTA_INICIO} icone={iconeDaPagina(SLUG)} />;
}
```

Em `app/(site)/politica-de-cookies/page.tsx` (LF), o mesmo, com `COOKIES`, `"Política de cookies"` e `PaginaCookies`:

1. imports:

```tsx
import { notFound } from "next/navigation";
import { PaginaDeTexto } from "@/components/editorial/PaginaDeTexto";
import { DADOS_DEMONSTRACAO } from "@/lib/demonstracao";
import { conteudoDaPagina, iconeDaPagina, VOLTA_INICIO } from "@/lib/paginaDeTexto";
import { COOKIES } from "@/lib/rascunhosLegais";
import { paginaPorSlug } from "@/lib/sanity/consultas";
```

2. apague:

```tsx
const TRILHA = [
  { nome: "Início", caminho: "/" },
  { nome: "Política de cookies", caminho: `/${SLUG}` },
];

```

3. o fim do comentário e a função:

```tsx
  Publicado o texto revisado, `paginaPorSlug` passa a devolver algo e ele
  vence (`conteudoDaPagina`, lib/paginaDeTexto.ts): o rascunho some da tela
  sem ninguém precisar apagar nada, e o aviso some junto com ele.

  O desenho é o modelo de página de texto
  (components/editorial/PaginaDeTexto.tsx), com o link de volta para o
  início.
*/
export default async function PaginaCookies() {
  const conteudo = conteudoDaPagina(await paginaPorSlug(SLUG), COOKIES, DADOS_DEMONSTRACAO);
  if (!conteudo) notFound();

  return <PaginaDeTexto conteudo={conteudo} volta={VOLTA_INICIO} icone={iconeDaPagina(SLUG)} />;
}
```

- [ ] **Step 8: O componente antigo sai, e os comentários que falavam dele**

1. Apague `components/editorial/RascunhoLegalNaTela.tsx`.
2. Em `lib/rascunhosLegais.ts` (CRLF):
   - troque a linha

     ```ts
       /** O aviso que `RascunhoLegalNaTela` põe antes do texto. */
     ```

     por

     ```ts
       /** O aviso que a página de texto põe no quadro antes do texto (`PaginaDeTexto`). */
     ```

   - troque as duas linhas

     ```
     /* O dos três textos legais: ainda não revisados por advogado. Ver o porquê
        no comentário de components/editorial/RascunhoLegalNaTela.tsx. */
     ```

     por

     ```
     /* O dos três textos legais: ainda não revisados por advogado. Ver o porquê
        no comentário de components/editorial/PaginaDeTexto.tsx. */
     ```
   - troque a linha `` `components/editorial/RascunhoLegalNaTela.tsx` explica no próprio`` por `` `components/editorial/PaginaDeTexto.tsx` explica no próprio``;
   - no tipo `SecaoLegal`, acrescente o comentário do campo `paragrafos`. Troque `  paragrafos: string[];` (a do tipo `SecaoLegal`) por:

     ```ts
       /**
        * Um parágrafo que começa com "[PROVISÓRIO] " é o que ainda falta. No
        * documento do advogado ele sai com a marca; na tela, sem ela, como
        * moldura "a entrar", e só no modo demonstração
        * (`paragrafoDoRascunho`, lib/paginaDeTexto.ts).
        */
       paragrafos: string[];
     ```
3. Em `components/painel/FormularioEntrar.tsx` (CRLF), troque as duas linhas

```
        emergência — mesma razão que levou `RascunhoLegalNaTela` a preferir
        `note` a `alert`.
```

por

```
        emergência — mesma razão que levou o quadro de aviso de `PaginaDeTexto`
        a preferir `note` a `alert`.
```

4. Em `components/painel/FormularioMedico.tsx` (LF), troque a linha

```
  `components/editorial/RascunhoLegalNaTela.tsx`.
```

por

```
  `components/editorial/PaginaDeTexto.tsx` (o quadro de aviso).
```

5. Em `app/(site)/encontre.module.css` (LF), troque o comentário do topo inteiro (o que a Task 6 do plano Especialidades escreveu) por:

```css
/*
  A coluna e o ritmo das páginas do desenho novo que não são a home (a
  home tem o dela, app/(site)/inicio.module.css, com a mesma regra):
  - os blocos são filhos diretos de `.pagina`, a --ritmo um do outro e do
    cabeçalho;
  - os que não são faixa de ponta a ponta (`data-faixa`) ficam na caixa de
    1240px do desenho, com 24px de folga de cada lado (12px no celular).

  O rodapé fica a --ritmo do último bloco quando ele não é faixa; quando é,
  o rodapé emenda nele (components/layout/Rodape.module.css).
*/
```

6. Em `components/layout/Rodape.module.css` (CRLF), troque (o texto da Task 6 do plano Especialidades):

```
  Faixa é o bloco que leva `data-faixa`: na home, a busca verde, "Seja
  associado" e os parceiros; na página de cada especialidade, o "Sobre". A
  regra pergunta se o último elemento do `<main>` é uma faixa, ou se o
  último elemento do último filho dele é: a home e as páginas do diretório
  põem os blocos dentro de um invólucro (app/(site)/page.tsx e
  app/(site)/encontre.module.css). Quando o
```

por

```
  Faixa é o bloco que leva `data-faixa`: na home, a busca verde, "Seja
  associado" e os parceiros; na página de cada especialidade, o "Sobre";
  nas páginas de texto, o corpo. A regra pergunta se o último elemento do
  `<main>` é uma faixa, ou se o último elemento do último filho dele é: a
  home e as outras páginas do desenho novo põem os blocos dentro de um
  invólucro (app/(site)/page.tsx e app/(site)/encontre.module.css). Quando o
```

7. `grep -rn "RascunhoLegalNaTela" app components lib testes scripts sanity`. Não pode sobrar nada.
8. `grep -rn "trilha=" app components`. Só podem sobrar o contato e as notícias, que ainda usam a `Cabeceira`.

- [ ] **Step 9: Rodar, provar por mutação, conferir, commit**

Run: `npx vitest run` · `npx tsc --noEmit` · `npm run build` → verde. `testes/sanity-paginas.test.ts` continua verde: `PAGINAS` é o mesmo.

No resumo do `npm run build`, `/associacao/[pagina]` e as três legais continuam geradas no build (●/○), e não ƒ.

Mutações, uma de cada vez, regravando o original depois:

1. Na página de texto, tire `ancoras={idDoBloco}` do `CorpoDoTexto`.
2. Na página de texto, troque `indice.length > 0` por `true` no índice da lateral.
3. Na página de texto, tire `role="note"` do quadro.
4. No texto rico, troque o `aEntrar` por um `<p>` sem a classe nem o `data-a-entrar`.
5. Na rota da associação, troque `DADOS_DEMONSTRACAO` por `true`.
6. Na página de privacidade, troque `VOLTA_INICIO` por `VOLTA_ASSOCIACAO`.
7. No CSS, troque `minmax(0, 680px) 248px` por `minmax(0, 720px) 248px`.
8. No CSS, troque o fundo do `.quadro` por `rgba(124, 95, 0, 0.05)` (o âmbar de antes): `testes/tom-quente.test.ts` e o teste do quadro ficam vermelhos.

Conferência rápida no navegador:
1. `npm run build` e `npx next start -p 3300`.
2. Abra `/associacao/seja-associado` e `/politica-de-privacidade` a 1440 e a 390px.
3. Expected:
   - a faixa e a coluna como em `docs/desenho-aprovado/associacao/seja-associado-1440-parte-1.jpg` e `seja-associado-390-parte-1.jpg` (sem o "Fale com a AMI" e com a frase antiga de identificação, que a Task 4 troca);
   - a 1440, rolando, o item do índice muda de marcado conforme a seção;
   - a 390, o índice recolhido abre e fecha, como `seja-associado-390-indice-aberto.jpg`;
   - a faixa branca encostada no rodapé.
4. Derrube o 3300 pelo PID.

```bash
git add components/editorial/PaginaDeTexto.tsx components/editorial/PaginaDeTexto.module.css components/editorial/CorpoDoTexto.tsx components/editorial/RascunhoLegalNaTela.tsx "app/(site)/associacao/[pagina]/page.tsx" "app/(site)/politica-de-privacidade/page.tsx" "app/(site)/termos-de-uso/page.tsx" "app/(site)/politica-de-cookies/page.tsx" lib/rascunhosLegais.ts components/painel/FormularioEntrar.tsx components/painel/FormularioMedico.tsx "app/(site)/encontre.module.css" components/layout/Rodape.module.css testes/modelo-de-texto.test.ts testes/aviso-do-rascunho.test.ts testes/paleta.test.ts
git commit -m "Modelo de pagina de texto: faixa verde curta, corpo branco em coluna de leitura, indice Nesta pagina e aviso em cinza neutro; associacao e textos legais sem Cabeceira nem BreadcrumbList"
```

---

### Task 4: Seja associado — "Fale com a AMI", a lista "Dados da entidade" e a moldura

**Files:**
- Create: `components/associacao/FaleComAmi.tsx`
- Modify: `components/editorial/PaginaDeTexto.module.css` (o quadro de chamada)
- Modify: `app/(site)/associacao/[pagina]/page.tsx` (CRLF; o quadro no fim de Seja associado)
- Modify: `lib/rascunhosLegais.ts` (CRLF; o texto de Seja associado)
- Modify: `scripts/gerar-doc-legal.ts` (LF; o subtítulo da lista)
- Create: `testes/seja-associado.test.ts`

**Interfaces:**
- Consumes: `AMI`, `hrefTelefone`, `linkDoMapaDaAmi` (`lib/ami.ts`, Task 1); `LadrilhoIcone`, `Icone` com `"chamada"`, `"telefone"`, `"celular"`, `"comoChegar"`; `PaginaDeTexto` com `children` (Task 3).
- Produces:

```ts
// components/associacao/FaleComAmi.tsx
export function FaleComAmi(): JSX.Element; // <div class={chamada} data-fale-com-ami="">
// PaginaDeTexto.module.css ganha: chamada, acoes, numero
```

- [ ] **Step 1: Os testes**

`testes/seja-associado.test.ts`:

```ts
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Icon } from "@phosphor-icons/react";
import { DeviceMobile, MapPin, Phone, PhoneCall } from "@phosphor-icons/react/dist/ssr";
import { FaleComAmi } from "@/components/associacao/FaleComAmi";
import estilos from "@/components/editorial/PaginaDeTexto.module.css";
import { SEJA_ASSOCIADO } from "@/lib/rascunhosLegais";
import { fonte } from "@/testes/apoio";
import { base, bloco, regra, semNotas } from "@/testes/css";
import { htmlDe } from "@/testes/renderizar";

/*
  Seja associado: o rascunho em código, a página renderizada nas duas chaves
  de demonstração (com o Sanity trocado por um dublê) e o quadro "Fale com
  a AMI". Os dados da entidade vêm de lib/ami.ts.
*/

vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));

const dados = vi.hoisted(() => ({ paginas: {} as Record<string, unknown> }));

vi.mock("@/lib/sanity/consultas", () => ({
  paginaPorSlug: async (slug: string) => dados.paginas[slug] ?? null,
}));

afterEach(() => {
  vi.unstubAllEnvs();
  dados.paginas = {};
});

async function pagina(slug: string, chave: string) {
  vi.stubEnv("NEXT_PUBLIC_DADOS_DEMONSTRACAO", chave);
  vi.resetModules();
  const { default: Pagina } = await import("@/app/(site)/associacao/[pagina]/page");
  return htmlDe(await Pagina({ params: Promise.resolve({ pagina: slug }) }));
}

const desenho = (Componente: Icon, size: number, weight: "duotone" | "regular") =>
  renderToString(createElement(Componente, { size, weight, className: "", "aria-hidden": "true" }));

/** O texto que aparece, sem tags, num espaço só. */
const tela = (html: string) =>
  html
    .replace(/<!-- -->/g, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const DOC = {
  titulo: "Seja associado",
  slug: "seja-associado",
  resumo: "O texto da AMI.",
  atualizadoEm: "2026-11-01T12:00:00Z",
  corpo: [
    {
      _type: "block",
      _key: "a",
      style: "normal",
      markDefs: [],
      children: [{ _type: "span", _key: "s", text: "Texto escrito pela AMI.", marks: [] }],
    },
  ],
};

describe("o rascunho de Seja associado", () => {
  it("as três seções, na ordem do desenho", () => {
    expect(SEJA_ASSOCIADO.secoes.map((s) => s.titulo)).toEqual([
      "O que é a AMI",
      "Quem pode se associar",
      "Como se associar",
    ]);
  });

  it("O que é a AMI: uma frase e a lista Dados da entidade, com os mesmos dados de antes", () => {
    expect(SEJA_ASSOCIADO.secoes[0]).toEqual({
      titulo: "O que é a AMI",
      paragrafos: ["A Associação Médica de Imperatriz está em atividade desde 1975."],
      tituloDaLista: "Dados da entidade",
      lista: [
        "Associação privada.",
        "Inscrita no CNPJ sob o número 06.651.376/0001-42.",
        "Sede na Rua Coriolano Milhomem, 39, Centro, Imperatriz - MA, CEP 65900-330.",
      ],
    });
  });

  it("o que falta está marcado, com a frase do desenho", () => {
    expect(SEJA_ASSOCIADO.secoes[1].paragrafos).toEqual([
      "A associação é aberta a médicos com inscrição regular no Conselho Regional de Medicina.",
      "[PROVISÓRIO] Valor de anuidade, benefícios do quadro associativo e demais critérios de admissão: texto da AMI a entrar.",
    ]);
  });
});

describe("a página, renderizada", () => {
  it("o h2 com a âncora, a frase, o subtítulo e a lista", async () => {
    const html = await pagina("seja-associado", "false");
    expect(html).toContain(
      '<h2 id="secao-o-que-e-a-ami">O que é a AMI</h2>' +
        "<p>A Associação Médica de Imperatriz está em atividade desde 1975.</p>" +
        "<h3>Dados da entidade</h3>" +
        "<ul><li>Associação privada.</li>" +
        "<li>Inscrita no CNPJ sob o número 06.651.376/0001-42.</li>" +
        "<li>Sede na Rua Coriolano Milhomem, 39, Centro, Imperatriz - MA, CEP 65900-330.</li></ul>",
    );
  });

  it("na demonstração, a moldura a entrar, sem a marca", async () => {
    const html = await pagina("seja-associado", "true");
    expect(html).toContain(
      `<p class="${estilos.falta}" data-a-entrar="">Valor de anuidade, benefícios do quadro associativo e demais critérios de admissão: texto da AMI a entrar.</p>`,
    );
  });

  it("fora dela, sem a moldura", async () => {
    const html = await pagina("seja-associado", "false");
    expect(html).not.toContain("data-a-entrar");
    expect(html).not.toContain("Valor de anuidade");
  });

  it("nenhum PROVISÓRIO, nos dois modos", async () => {
    for (const chave of ["true", "false"]) {
      expect(await pagina("seja-associado", chave), chave).not.toContain("PROVISÓRIO");
    }
  });

  it("o quadro Fale com a AMI fecha a coluna, nos dois modos, e também com o texto do Studio", async () => {
    for (const chave of ["true", "false"]) {
      expect(await pagina("seja-associado", chave), chave).toMatch(/data-fale-com-ami=""[\s\S]*<\/div><\/div><\/article>/);
    }
    dados.paginas["seja-associado"] = DOC;
    const doStudio = await pagina("seja-associado", "false");
    expect(doStudio).toContain("<p>Texto escrito pela AMI.</p>");
    expect(doStudio).toContain('data-fale-com-ami=""');
  });

  it("as outras páginas de texto não têm o quadro", async () => {
    dados.paginas.estatuto = { ...DOC, titulo: "Estatuto", slug: "estatuto" };
    expect(await pagina("estatuto", "true")).not.toContain("data-fale-com-ami");
  });
});

describe("o quadro Fale com a AMI", () => {
  const html = renderToString(createElement(FaleComAmi));

  it("o ícone num ladrilho branco, o título e a frase", () => {
    expect(html).toMatch(
      new RegExp(
        `^<div class="${estilos.chamada}" data-fale-com-ami="">` +
          `<span class="ladrilho-icone ladrilho-icone--pequeno" aria-hidden="true">`,
      ),
    );
    expect(html).toContain(desenho(PhoneCall, 23, "duotone"));
    expect(html).toContain("<div><h3>Fale com a AMI</h3><p>Pelo telefone ou na sede, no Centro de Imperatriz.</p></div>");
  });

  it("Ligar para o fixo, o celular e Como chegar, nessa ordem", () => {
    const links = [...html.matchAll(/<a class="([^"]+)" href="([^"]+)" aria-label="([^"]+)">([\s\S]*?)<\/a>/g)];
    expect(links.map((m) => [m[1], m[2], m[3], tela(m[4])])).toEqual([
      ["botao", "tel:+559935243716", "Ligar para a AMI, (99) 3524-3716", "Ligar (99) 3524-3716"],
      ["botao-contorno", "tel:+5599988020205", "Ligar para a AMI, (99) 98802-0205", "(99) 98802-0205"],
      [
        "botao-contorno",
        "https://www.google.com/maps/search/?api=1&amp;query=Rua%20Coriolano%20Milhomem%2C%2039%2C%20Centro%2C%20Imperatriz%20-%20MA%2C%2065900-330",
        "Como chegar à sede da AMI (abre o mapa)",
        "Como chegar",
      ],
    ]);
    expect(links[0][4].startsWith(desenho(Phone, 20, "regular"))).toBe(true);
    expect(links[1][4].startsWith(desenho(DeviceMobile, 20, "regular"))).toBe(true);
    expect(links[2][4].startsWith(desenho(MapPin, 20, "regular"))).toBe(true);
    expect(html).toContain(`<span class="${estilos.numero}">(99) 3524-3716</span>`);
  });

  it("sem WhatsApp, enquanto a AMI não confirmar o número", () => {
    expect(html).not.toMatch(/whatsapp|wa\.me/i);
  });
});

describe("o CSS do quadro", () => {
  const css = semNotas(fonte("../components/editorial/PaginaDeTexto.module.css"));
  const cel = () => bloco(css, "@media (max-width: 700px)");

  it("no fundo da página, a 40px do texto, com o ícone à esquerda e os botões embaixo", () => {
    const r = regra(base(css), ".coluna .chamada");
    expect(r).toMatch(/margin-top: 40px;/);
    expect(r).toMatch(/background: var\(--color-canvas\);/);
    expect(r).toMatch(/grid-template-columns: 44px minmax\(0, 1fr\);/);
    expect(regra(base(css), ".chamada :global(.ladrilho-icone)")).toMatch(/background: var\(--color-surface\);/);
    expect(regra(base(css), ".chamada .acoes")).toMatch(/grid-column: 1 \/ -1;/);
  });

  it("no celular, um botão por linha, na largura toda", () => {
    expect(regra(cel(), ".chamada .acoes")).toMatch(/grid-template-columns: 1fr;/);
    expect(regra(cel(), ".chamada .acoes > a")).toMatch(/width: 100%;/);
    expect(regra(cel(), ".chamada .acoes > a")).toMatch(/height: 46px;/);
  });
});
```

O `&amp;` do endereço do mapa é o `&` como o HTML o escreve dentro de um atributo.

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run testes/seja-associado.test.ts`
Expected: FAIL. O quadro não existe, o rascunho tem a frase longa e a página não tem a lista.

- [ ] **Step 3: O texto de Seja associado**

Em `lib/rascunhosLegais.ts` (CRLF):

1. Troque as duas primeiras seções de `SEJA_ASSOCIADO`:

```ts
    {
      titulo: "O que é a AMI",
      paragrafos: [`A ${identificacao}, está em atividade desde ${AMI.fundadaEm}.`],
    },
    {
      titulo: "Quem pode se associar",
      paragrafos: [
        "A associação é aberta a médicos com inscrição regular no Conselho Regional de Medicina.",
        "[PROVISÓRIO] Valor de anuidade, benefícios do quadro associativo e demais critérios de admissão ainda não foram publicados nesta página.",
      ],
    },
```

por

```ts
    {
      titulo: "O que é a AMI",
      paragrafos: [`A ${AMI.razaoSocial} está em atividade desde ${AMI.fundadaEm}.`],
      tituloDaLista: "Dados da entidade",
      lista: [
        `${AMI.naturezaJuridica}.`,
        `Inscrita no CNPJ sob o número ${AMI.cnpj}.`,
        `Sede na ${enderecoEmLinha()}, CEP ${AMI.endereco.cep}.`,
      ],
    },
    {
      titulo: "Quem pode se associar",
      paragrafos: [
        "A associação é aberta a médicos com inscrição regular no Conselho Regional de Medicina.",
        "[PROVISÓRIO] Valor de anuidade, benefícios do quadro associativo e demais critérios de admissão: texto da AMI a entrar.",
      ],
    },
```

2. No comentário de `SEJA_ASSOCIADO`, troque as duas últimas linhas

```
  esta página ainda não traz, e está marcado [PROVISÓRIO] em vez de
  estimado, sem afirmar se a AMI já decidiu ou não.
*/
```

por

```
  esta página ainda não traz, e está marcado [PROVISÓRIO] em vez de
  estimado, sem afirmar se a AMI já decidiu ou não. Na tela, a marca vira
  a moldura "a entrar", só no modo demonstração.

  A identificação da entidade sai em lista ("Dados da entidade"), com os
  mesmos dados de lib/ami.ts que a frase corrida trazia.
*/
```

`identificacao` continua em uso pelos três textos legais.

Em `scripts/gerar-doc-legal.ts` (LF), troque

```ts
    for (const p of s.paragrafos) linhas.push(p, "");
    if (s.lista) {
```

por

```ts
    for (const p of s.paragrafos) linhas.push(p, "");
    if (s.tituloDaLista) linhas.push(`#### ${s.tituloDaLista}`, "");
    if (s.lista) {
```

Nenhum dos três textos legais tem subtítulo de lista hoje, então `docs/rascunhos-textos-legais.md` não muda: não o gere de novo.

- [ ] **Step 4: O CSS do quadro**

Em `components/editorial/PaginaDeTexto.module.css`:

1. No comentário do topo, troque

```
  `.coluna .quadro .quadro-titulo`, `.quadro-titulo + p`, e os @media de
  1180, 980 e 700px). O índice é de IndiceNestaPagina.module.css.
```

por

```
  `.coluna .quadro .quadro-titulo`, `.quadro-titulo + p`, `.chamada` e o
  que vem dentro dele, e os @media de 1180, 980 e 700px). O índice é de
  IndiceNestaPagina.module.css.
```

2. Depois da regra `.quadroTitulo + p { … }`, acrescente:

```css

/* O quadro de chamada "Fale com a AMI", no fim da coluna de Seja
   associado (components/associacao/FaleComAmi.tsx). O ladrilho é o global
   (`.ladrilho-icone--pequeno`, 44px), branco sobre o fundo da página. */
.coluna .chamada {
  margin-top: 40px;
  padding: 28px;
  border-radius: 18px;
  background: var(--color-canvas);
  display: grid;
  grid-template-columns: 44px minmax(0, 1fr);
  column-gap: 16px;
}

.chamada :global(.ladrilho-icone) {
  background: var(--color-surface);
  box-shadow:
    0 1px 2px rgba(16, 24, 40, 0.05),
    inset 0 0 0 1px rgba(16, 24, 40, 0.06);
}

.coluna .chamada h3 {
  margin: 0;
  font-family: var(--font-titulo);
  font-size: 24px;
  line-height: 1.15;
}

.coluna .chamada p {
  margin-top: 6px;
  font-size: 15.5px;
  line-height: 1.6;
}

.chamada .acoes {
  grid-column: 1 / -1;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 22px;
}

.numero {
  font-variant-numeric: tabular-nums;
}
```

3. No bloco `@media (max-width: 700px)`, troque o fim dele

```css
  .coluna .quadro .quadroTitulo {
    font-size: 15px;
  }
}
```

por

```css
  .coluna .quadro .quadroTitulo {
    font-size: 15px;
  }

  .coluna .chamada {
    margin-top: 32px;
    padding: 20px;
    grid-template-columns: 40px minmax(0, 1fr);
    column-gap: 14px;
  }

  .chamada :global(.ladrilho-icone) {
    width: 40px;
    height: 40px;
    border-radius: 12px;
  }

  .coluna .chamada h3 {
    font-size: 21px;
  }

  .coluna .chamada p {
    font-size: 14.5px;
  }

  .chamada .acoes {
    display: grid;
    grid-template-columns: 1fr;
    gap: 8px;
    margin-top: 18px;
  }

  .chamada .acoes > a {
    width: 100%;
    height: 46px;
    font-size: 14px;
  }
}
```

- [ ] **Step 5: O quadro**

`components/associacao/FaleComAmi.tsx`:

```tsx
import { Icone, LadrilhoIcone } from "@/components/base/Icone";
import styles from "@/components/editorial/PaginaDeTexto.module.css";
import { AMI, hrefTelefone, linkDoMapaDaAmi } from "@/lib/ami";

/*
  "Fale com a AMI", o quadro de chamada no fim de Seja associado: ligar
  para o fixo da sede, ligar para o celular e "Como chegar" à sede.

  Sem WhatsApp: lib/ami.ts diz que nenhum dos dois números está confirmado
  como WhatsApp, e um botão para uma linha que não atende por lá é pior que
  não ter botão. Quando a AMI confirmar, ele entra ao lado de "Ligar".

  "Como chegar" abre o mapa na mesma aba, como o do consultório no perfil
  (components/perfil/OndeAtende.tsx).

  O desenho mora na folha da página de texto (PaginaDeTexto.module.css,
  `.chamada`), porque o quadro vive dentro da coluna de leitura e as regras
  dele precisam valer sobre as da coluna.
*/
export function FaleComAmi() {
  const [fixo, celular] = AMI.telefones;

  return (
    <div className={styles.chamada} data-fale-com-ami="">
      <LadrilhoIcone nome="chamada" pequeno />
      <div>
        <h3>Fale com a AMI</h3>
        <p>{`Pelo telefone ou na sede, no ${AMI.endereco.bairro} de ${AMI.endereco.cidade}.`}</p>
      </div>
      <div className={styles.acoes}>
        <a className="botao" href={hrefTelefone(fixo)} aria-label={`Ligar para a AMI, ${fixo}`}>
          <Icone nome="telefone" /> Ligar <span className={styles.numero}>{fixo}</span>
        </a>
        <a className="botao-contorno" href={hrefTelefone(celular)} aria-label={`Ligar para a AMI, ${celular}`}>
          <Icone nome="celular" /> {celular}
        </a>
        <a className="botao-contorno" href={linkDoMapaDaAmi()} aria-label="Como chegar à sede da AMI (abre o mapa)">
          <Icone nome="comoChegar" /> Como chegar
        </a>
      </div>
    </div>
  );
}
```

- [ ] **Step 6: O quadro na página**

Em `app/(site)/associacao/[pagina]/page.tsx` (CRLF):

1. Acrescente, antes de `import { PaginaDeTexto } from "@/components/editorial/PaginaDeTexto";`:

```tsx
import { FaleComAmi } from "@/components/associacao/FaleComAmi";
```

2. No comentário de cima de `SubpaginaDaAssociacao`, troque as três últimas linhas

```
  O desenho é o modelo de página de texto
  (components/editorial/PaginaDeTexto.tsx), com o link de volta para A
  Associação.
*/
```

por

```
  O desenho é o modelo de página de texto
  (components/editorial/PaginaDeTexto.tsx), com o link de volta para A
  Associação. Seja associado fecha a coluna com o quadro "Fale com a AMI"
  (components/associacao/FaleComAmi.tsx), venha o texto do Studio ou do
  rascunho.
*/
```

3. Troque

```tsx
  return <PaginaDeTexto conteudo={conteudo} volta={VOLTA_ASSOCIACAO} icone={iconeDaPagina(pagina)} />;
```

por

```tsx
  return (
    <PaginaDeTexto conteudo={conteudo} volta={VOLTA_ASSOCIACAO} icone={iconeDaPagina(pagina)}>
      {pagina === "seja-associado" ? <FaleComAmi /> : null}
    </PaginaDeTexto>
  );
```

- [ ] **Step 7: Rodar, provar por mutação, conferir, commit**

Run: `npx vitest run` · `npx tsc --noEmit` · `npm run build` → verde. `testes/aviso-do-rascunho.test.ts` continua verde ("não afirma o que a AMI ainda vai decidir").

Mutações, uma de cada vez, regravando o original depois:

1. No rascunho, tire o `tituloDaLista`.
2. No rascunho, tire o `[PROVISÓRIO] ` da frase da anuidade.
3. No quadro, troque `hrefTelefone(celular)` por `hrefTelefone(fixo)`.
4. No quadro, troque `linkDoMapaDaAmi()` por `"#"`.
5. Na página, troque `pagina === "seja-associado"` por `true`.
6. No CSS, troque `.coluna .chamada {` por `.chamada {` na regra de cima (a margem de 40px perde para `.coluna h2 + *`, e o teste do CSS pega a mudança do seletor).

Conferência rápida no navegador:
1. `npm run build` e `npx next start -p 3300`.
2. Abra `/associacao/seja-associado` a 1440 e a 390px.
3. Expected: igual a `docs/desenho-aprovado/associacao/seja-associado-1440-parte-1.jpg`, `-parte-2.jpg`, `seja-associado-390-parte-1.jpg` e `-parte-2.jpg`.
4. Derrube o 3300 pelo PID.

```bash
git add components/associacao/FaleComAmi.tsx components/editorial/PaginaDeTexto.module.css "app/(site)/associacao/[pagina]/page.tsx" lib/rascunhosLegais.ts scripts/gerar-doc-legal.ts testes/seja-associado.test.ts
git commit -m "Seja associado: quadro Fale com a AMI sem WhatsApp, lista Dados da entidade e a anuidade como moldura so na demonstracao"
```

---

### Task 5: A diretoria

**Files:**
- Modify: `components/diretorio/CartaoDiretor.tsx` (reescrita; CRLF)
- Create: `components/diretorio/CartaoDiretor.module.css`
- Create: `components/diretorio/GradeDeDiretores.tsx`
- Create: `components/associacao/FaixaDaDiretoria.tsx`, `components/associacao/FaixaDaDiretoria.module.css`
- Modify: `app/(site)/associacao/diretoria/page.tsx` (reescrita; CRLF)
- Delete: `components/diretorio/Placa.tsx`
- Modify: `app/globals.css` (comentário; CRLF), `components/layout/Cabeceira.tsx` (comentário; CRLF)
- Modify: `testes/tom-quente.test.ts` (CRLF), `testes/paleta.test.ts` (LF)
- Create: `testes/diretoria-na-tela.test.ts`

**Interfaces:**
- Consumes:
  - `Diretor`, `listarDiretoria` (`lib/dados/diretoria.ts`, sem mudança);
  - `FotoDoMedico` e `SIZES_DO_CARTAO` (`components/diretorio/`), e as classes `medico`, `foto`, `corpo`, `texto`, `nome`, `crm`, `ligar`, `semLigar` de `CartaoMedico.module.css` e `grade` de `GradeMedicos.module.css`;
  - `FaixaCurta` (Task 2), `VOLTA_ASSOCIACAO` (Task 1), `Icone` com `"pessoas"`, `"calendario"`, `"seta"`;
  - `EstadoVazio` (`components/base/EstadoVazio.tsx`), `identificacaoMedica` (`lib/formato.ts`).
- Produces:

```ts
// components/diretorio/CartaoDiretor.tsx
export function CartaoDiretor(props: { diretor: Diretor; imediata?: boolean }): JSX.Element; // <li data-diretor …>
// components/diretorio/GradeDeDiretores.tsx
export function GradeDeDiretores(props: { diretores: Diretor[]; imediatos?: number }): JSX.Element; // <ul class={grade}>
// components/associacao/FaixaDaDiretoria.tsx
export function FaixaDaDiretoria(props: { demonstracao: boolean }): JSX.Element;
```

**Por que um componente irmão, e não o `CartaoMedico` com mais propriedades.** O `CartaoMedico` recebe um `Medico` (especialidade com RQE, consultórios, o telefone do "Ligar") e é da busca, do perfil e das especialidades; o diretor tem cargo, um link que pode faltar e um "Ver perfil" que só desenha. Juntar os dois poria três propriedades opcionais e três ramos no cartão da busca. O irmão usa a mesma folha (`CartaoMedico.module.css`), a mesma foto (`FotoDoMedico`) e a mesma grade, então a forma é a mesma; e o cartão da busca, que o plano Especialidades acabou de mexer, fica como está.

- [ ] **Step 1: Os testes**

`testes/diretoria-na-tela.test.ts`:

```ts
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Icon } from "@phosphor-icons/react";
import { ArrowRight, CalendarBlank, UsersThree } from "@phosphor-icons/react/dist/ssr";
import estilosPagina from "@/app/(site)/encontre.module.css";
import { FaixaDaDiretoria } from "@/components/associacao/FaixaDaDiretoria";
import estilosFaixa from "@/components/associacao/FaixaDaDiretoria.module.css";
import { CartaoDiretor } from "@/components/diretorio/CartaoDiretor";
import estilosDiretor from "@/components/diretorio/CartaoDiretor.module.css";
import { SIZES_DO_CARTAO } from "@/components/diretorio/CartaoMedico";
import estilosCartao from "@/components/diretorio/CartaoMedico.module.css";
import { GradeDeDiretores } from "@/components/diretorio/GradeDeDiretores";
import estilosGrade from "@/components/diretorio/GradeMedicos.module.css";
import type { Diretor } from "@/lib/dados/diretoria";
import { fonte } from "@/testes/apoio";
import { base, bloco, regra, semNotas } from "@/testes/css";
import { htmlDe } from "@/testes/renderizar";

/*
  A diretoria: o cartão de diretor, a grade, a faixa com a pílula do
  mandato e a página de verdade (app/(site)/associacao/diretoria/page.tsx),
  com a diretoria trocada por um dublê e as duas chaves de demonstração.
  Nomes e CRMs de mentira, os mesmos da diretoria de teste do banco.
*/

const dados = vi.hoisted(() => ({ diretoria: [] as Diretor[] }));

vi.mock("@/lib/dados/diretoria", () => ({ listarDiretoria: async () => dados.diretoria }));

afterEach(() => {
  vi.unstubAllEnvs();
  dados.diretoria = [];
});

const desenho = (Componente: Icon, size: number, weight: "duotone" | "regular") =>
  renderToString(createElement(Componente, { size, weight, className: "", "aria-hidden": "true" }));

function diretor(p: Partial<Diretor> = {}): Diretor {
  return {
    id: 1,
    nome: "Mayara Viana",
    cargo: "Presidente",
    ordem: 10,
    slugDoPerfil: "mayara-viana",
    crm: "10000",
    crmUf: "MA",
    medico: true,
    foto: null,
    ...p,
  };
}

const QUATRO = [
  diretor(),
  diretor({ id: 2, nome: "Rafael Coelho", cargo: "Vice-presidente", ordem: 20, slugDoPerfil: "rafael-coelho", crm: "10137" }),
  diretor({ id: 3, nome: "Larissa Nogueira", cargo: "Diretora científica", ordem: 30, slugDoPerfil: "larissa-nogueira", crm: "10274" }),
  diretor({ id: 4, nome: "Tiago Barbosa", cargo: "Tesoureiro", ordem: 40, slugDoPerfil: "tiago-barbosa", crm: "10411" }),
];

describe("o cartão de diretor", () => {
  const html = renderToString(createElement(CartaoDiretor, { diretor: diretor() }));

  it("é o cartão da busca, com a marca de diretor", () => {
    expect(html).toMatch(
      new RegExp(`^<li class="${estilosCartao.medico} ${estilosDiretor.diretor}" data-diretor="">`),
    );
    expect(html).not.toContain("data-sem-perfil");
  });

  it("sem foto, as iniciais no espaço da foto", () => {
    expect(html).toContain(`${estilosCartao.foto} ${estilosDiretor.foto}"`);
    expect(html).toContain(">MV</span>");
  });

  it("o cargo em cima do nome, o nome levando ao perfil, e MÉDICO · CRM/UF", () => {
    expect(html).toContain(
      `<div class="${estilosCartao.texto}"><p class="${estilosDiretor.cargo}">Presidente</p>` +
        `<h3 class="${estilosCartao.nome}"><a href="/medico/mayara-viana">Mayara Viana</a></h3>` +
        `<p class="${estilosCartao.crm}">MÉDICO · CRM/MA 10000</p></div>`,
    );
  });

  it("Ver perfil no lugar de Ligar: só desenha, fora do leitor de tela, porque o cartão inteiro é o link", () => {
    expect(html).toContain(
      `<span class="botao ${estilosCartao.ligar} ${estilosDiretor.verPerfil}" aria-hidden="true" data-ligar="">Ver perfil ${desenho(ArrowRight, 20, "regular")}</span>`,
    );
    expect(html).not.toContain("tel:");
    expect(html).not.toContain(">Ligar");
  });

  it("sem perfil publicado: sem link e sem botão, mas o espaço do botão fica", () => {
    const sem = renderToString(createElement(CartaoDiretor, { diretor: diretor({ slugDoPerfil: null }) }));
    expect(sem).toMatch(/^<li [^>]*data-sem-perfil=""/);
    expect(sem).not.toContain("<a ");
    expect(sem).toContain(`<h3 class="${estilosCartao.nome}">Mayara Viana</h3>`);
    expect(sem).not.toContain("Ver perfil");
    expect(sem).toContain(`<div class="${estilosCartao.semLigar}" aria-hidden="true" data-ligar=""></div>`);
  });

  it("quem não tem CRM (não é médico) fica sem a linha do CRM", () => {
    const contador = renderToString(
      createElement(CartaoDiretor, { diretor: diretor({ medico: false, crm: null, crmUf: null }) }),
    );
    expect(contador).not.toContain("CRM");
  });

  it("com foto: o retrato com a largura desenhada da grade da busca; logo ou só ao rolar", () => {
    const comFoto = (imediata: boolean) =>
      renderToString(createElement(CartaoDiretor, { diretor: diretor({ foto: "https://exemplo.test/m.jpg" }), imediata }));
    expect(comFoto(false)).toContain(`sizes="${SIZES_DO_CARTAO}"`);
    expect(comFoto(false)).toContain('loading="lazy"');
    expect(comFoto(true)).not.toContain('loading="lazy"');
    expect(comFoto(false)).toContain('alt=""');
  });
});

describe("a grade de diretores", () => {
  it("a grade da busca, um cartão por diretor, na ordem; os primeiros baixam a foto logo", () => {
    const seis = [1, 2, 3, 4, 5, 6].map((n) => diretor({ id: n, nome: `Diretor ${n}`, foto: `https://exemplo.test/${n}.jpg` }));
    const html = renderToString(createElement(GradeDeDiretores, { diretores: seis, imediatos: 4 }));
    expect(html).toMatch(new RegExp(`^<ul class="${estilosGrade.grade}">`));
    expect(html.match(/data-diretor=""/g)).toHaveLength(6);
    expect(html.match(/loading="lazy"/g)).toHaveLength(2);
    expect([...html.matchAll(/>(Diretor \d)</g)].map((m) => m[1])).toEqual(seis.map((d) => d.nome));
  });
});

describe("a faixa da diretoria", () => {
  const demo = renderToString(createElement(FaixaDaDiretoria, { demonstracao: true }));
  const real = renderToString(createElement(FaixaDaDiretoria, { demonstracao: false }));

  it("a faixa curta: volta à associação, o título, a frase e as pessoas no ladrilho", () => {
    for (const html of [demo, real]) {
      expect(/<a [^>]*href="\/associacao"/.test(html)).toBe(true);
      expect(html).toContain(">Diretoria da AMI</h1>");
      expect(html).toContain(">Quem responde pela associação. Cada nome traz o número de inscrição no CRM.</p>");
      expect(html).toContain(desenho(UsersThree, 84, "duotone"));
    }
  });

  it("na demonstração, a pílula do mandato, como moldura, logo depois da frase", () => {
    expect(demo).toContain(
      `<p class="${estilosFaixa.pilula}" data-a-entrar="mandato">${desenho(CalendarBlank, 20, "regular")} Gestão <em>(período a entrar)</em></p></div>`,
    );
  });

  it("fora dela, sem a pílula", () => {
    expect(real).not.toContain("data-a-entrar");
    expect(real).not.toContain("Gestão");
  });
});

async function pagina(chave: string) {
  vi.stubEnv("NEXT_PUBLIC_DADOS_DEMONSTRACAO", chave);
  vi.resetModules();
  const modulo = await import("@/app/(site)/associacao/diretoria/page");
  return { html: await htmlDe(await modulo.default()), metadata: modulo.metadata };
}

describe("a página da diretoria", () => {
  it("a faixa e a grade, no invólucro de coluna e ritmo, sem Cabeceira, trilha nem BreadcrumbList", async () => {
    dados.diretoria = QUATRO;
    const { html } = await pagina("true");
    expect(html).toMatch(new RegExp(`^<div class="${estilosPagina.pagina}"><section data-bloco="topo"`));
    expect([...html.matchAll(/data-bloco="([^"]+)"/g)].map((m) => m[1])).toEqual(["topo", "diretoria"]);
    expect(html).toContain('<h2 id="membros-titulo" class="sr-only">Membros da diretoria</h2>');
    expect(html).not.toContain("Trilha de navegação");
    expect(html).not.toContain("-mt-32");
    expect(html).not.toContain("BreadcrumbList");
    expect(html.match(/<h1\b/g)).toHaveLength(1);
  });

  it("os quatro, na ordem, a presidência primeiro, todos do mesmo tamanho", async () => {
    dados.diretoria = QUATRO;
    const { html } = await pagina("false");
    expect([...html.matchAll(/class="[^"]*" data-diretor=""/g)]).toHaveLength(4);
    expect([...html.matchAll(/<p class="[^"]+">(Presidente|Vice-presidente|Diretora científica|Tesoureiro)<\/p>/g)].map((m) => m[1])).toEqual([
      "Presidente",
      "Vice-presidente",
      "Diretora científica",
      "Tesoureiro",
    ]);
  });

  it("a grade fecha a página: o rodapé fica a --ritmo", async () => {
    dados.diretoria = QUATRO;
    const { html } = await pagina("true");
    expect(html).toMatch(/<\/ul><\/section><\/div>$/);
  });

  it("a pílula só na demonstração; nenhum PROVISÓRIO", async () => {
    dados.diretoria = QUATRO;
    expect((await pagina("true")).html).toContain('data-a-entrar="mandato"');
    const fora = (await pagina("false")).html;
    expect(fora).not.toContain("data-a-entrar");
    expect(fora).not.toContain("PROVISÓRIO");
  });

  it("sem diretoria cadastrada, o aviso de vazio no lugar da grade", async () => {
    const { html } = await pagina("false");
    expect(html).toContain("Diretoria ainda não cadastrada");
    expect(html).not.toContain("data-diretor");
  });

  it("os metadados continuam os de antes", async () => {
    const { metadata } = await pagina("true");
    expect(metadata.description).toBe(
      "Quem responde pela Associação Médica de Imperatriz, com cargo, nome e número de inscrição no CRM.",
    );
    expect(metadata.alternates).toEqual({ canonical: "/associacao/diretoria" });
  });
});

describe("o CSS do cartão de diretor", () => {
  const css = semNotas(fonte("../components/diretorio/CartaoDiretor.module.css"));
  const cel = () => bloco(css, "@media (max-width: 700px)");

  it("o cargo: rótulo verde pequeno, em caixa alta, 8px acima do nome", () => {
    const r = regra(base(css), ".cargo");
    expect(r).toMatch(/font-size: 12px;/);
    expect(r).toMatch(/text-transform: uppercase;/);
    expect(r).toMatch(/color: var\(--color-ami-green-600\);/);
    expect(r).toMatch(/margin-bottom: 8px;/);
    expect(regra(cel(), ".cargo")).toMatch(/font-size: 10\.5px;/);
  });

  it("Ver perfil não recebe o clique, e escurece quando o mouse está no cartão", () => {
    expect(regra(base(css), ".verPerfil")).toMatch(/pointer-events: none;/);
    expect(regra(base(css), ".diretor:hover .verPerfil")).toMatch(/#22751F 0%, #1A5E18 100%/);
  });

  it("sem perfil, o cartão não sobe nem amplia a foto, qualquer que seja a ordem das folhas", () => {
    expect(regra(base(css), ".diretor[data-sem-perfil]:hover")).toMatch(/transform: none;/);
    expect(regra(base(css), ".diretor[data-sem-perfil][data-diretor]:hover img")).toMatch(/transform: none;/);
  });

  it("no celular, o espaço da foto com 150px de altura mínima", () => {
    expect(regra(cel(), ".diretor .foto")).toMatch(/min-height: 150px;/);
  });
});

describe("o CSS da pílula do mandato", () => {
  const css = semNotas(fonte("../components/associacao/FaixaDaDiretoria.module.css"));

  it("tracejada em lima, com o texto claro do desenho", () => {
    const r = regra(base(css), ".pilula");
    expect(r).toMatch(/border: 1px dashed rgba\(168, 212, 112, 0\.5\);/);
    expect(r).toMatch(/color: #DDE7D6;/);
    expect(regra(base(css), ".pilula em")).toMatch(/color: #B9C6B2;/);
  });
});
```

Em `testes/tom-quente.test.ts` (CRLF):

`arbitrarios` já é uma função do próprio arquivo, e `arquivosDoSite`, `coresNoTexto` e `ehQuente` já vêm do import de `@/testes/cores`. No primeiro `it`, troque a linha

```ts
    expect(arquivosComCor).toContain("components/diretorio/Placa.tsx");
```

por

```ts
    /* E os valores arbitrários dos `.tsx`: nenhum componente do site precisa
       ter um, então a prova de que a varredura os lê é um escrito aqui, com
       um tom creme que a regra tem de achar. */
    expect(arquivosDoSite(".tsx").length).toBeGreaterThan(50);
    const doTsx = coresNoTexto(arbitrarios('className="shadow-[0_1px_0_rgba(168,212,112,0.22)] bg-[#FAF0E6]"'));
    expect(doTsx).toHaveLength(2);
    expect(doTsx.filter((c) => ehQuente(c.rgb)).map((c) => c.rgb)).toEqual([[250, 240, 230]]);
```

Em `testes/paleta.test.ts` (LF), apague a entrada `"ami-green-800"` inteira de `FUNDOS_FORA_DO_TESTE` (as quatro linhas):

```ts
  "ami-green-800":
    "fundo da plaqueta de iniciais (components/diretorio/Placa.tsx), com " +
    "text-ami-lima-400 — o par real já é medido no describe texto sobre fundo " +
    "escuro, junto com canvas/surface sobre ami-green-800",
```

Sem a `Placa`, nenhum componente usa `bg-ami-green-800`: a exceção ficaria morta, com motivo falso.

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run testes/diretoria-na-tela.test.ts`
Expected: FAIL. Os componentes novos não existem e o cartão é o antigo.

- [ ] **Step 3: O CSS do cartão de diretor**

`components/diretorio/CartaoDiretor.module.css`:

```css
/*
  O cartão de diretor, transcrito do desenho aprovado
  (docs/desenho-aprovado/associacao/diretoria.html: `.diretor-cargo`,
  `.diretor .medico-nome`, `.diretor .medico-crm`, `.diretor .botao-ligar`,
  `.diretor:hover .botao-ligar`, `.botao-ligar.reserva`,
  `.diretor:not(:has(a))`, e o @media de 700px).

  O resto é o cartão da busca (CartaoMedico.module.css), que o cartão de
  diretor usa junto: o nome e o CRM do desenho têm os mesmos valores de lá,
  e por isso não se repetem aqui.

  "Ver perfil" é o botão verde do "Ligar", mas só desenha: o cartão inteiro
  é o link, pelo nome esticado. Ele escurece quando o mouse está em
  qualquer ponto do cartão, como o botão escurece sozinho; o degradê é o
  de `.botao:hover` (app/globals.css).

  O cartão sem perfil não sobe nem amplia a foto. As duas regras levam
  atributos a mais (`[data-sem-perfil]`, `[data-diretor]`) para pesarem
  mais que as do cartão da busca (`.medico:hover` e
  `.medico:hover .foto img`), qualquer que seja a ordem das folhas.
*/

.cargo {
  display: block;
  margin-bottom: 8px;
  font-size: 12px;
  font-weight: 700;
  line-height: 1.3;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--color-ami-green-600);
}

.verPerfil {
  pointer-events: none;
}

.diretor:hover .verPerfil {
  background: linear-gradient(180deg, #22751F 0%, #1A5E18 100%);
}

.diretor:hover .verPerfil svg {
  transform: translateX(4px);
}

.diretor[data-sem-perfil] {
  cursor: default;
}

.diretor[data-sem-perfil]:hover {
  transform: none;
  box-shadow: var(--shadow-erguido);
}

.diretor[data-sem-perfil][data-diretor]:hover img {
  transform: none;
}

@media (max-width: 700px) {
  .cargo {
    margin-bottom: 5px;
    font-size: 10.5px;
    letter-spacing: 0.12em;
  }

  .diretor .foto {
    min-height: 150px;
  }
}
```

- [ ] **Step 4: O cartão e a grade**

Reescreva `components/diretorio/CartaoDiretor.tsx` (CRLF; leia antes) inteiro:

```tsx
import Link from "next/link";
import { Icone } from "@/components/base/Icone";
import styles from "@/components/diretorio/CartaoDiretor.module.css";
import { SIZES_DO_CARTAO } from "@/components/diretorio/CartaoMedico";
import cartao from "@/components/diretorio/CartaoMedico.module.css";
import { FotoDoMedico } from "@/components/diretorio/FotoDoMedico";
import type { Diretor } from "@/lib/dados/diretoria";
import { identificacaoMedica } from "@/lib/formato";

/*
  O cartão de um membro da diretoria: o cartão do médico da busca
  (CartaoMedico.module.css, com a mesma foto, o mesmo nome e o mesmo
  "MÉDICO · CRM/UF"), com o cargo acima do nome e "Ver perfil" no lugar do
  "Ligar". Num cartão de diretoria a pergunta é "quem é o presidente", e
  não "onde está a Mayara": o cargo vem antes da pessoa.

  - Com perfil publicado no diretório, o cartão inteiro leva a ele, pelo
    link do nome, esticado em CSS. "Ver perfil" só desenha (`aria-hidden`):
    o teclado não para duas vezes no mesmo destino.
  - Sem perfil, o cartão não é link (um link que leva a 404 é pior que
    texto) e não tem botão, mas o espaço do botão fica, para os pés dos
    cartões de uma fileira continuarem na mesma linha. `data-ligar` marca o
    botão ou o espaço dele para a auditoria visual, como no cartão da busca.

  A linha do CRM sai só com CRM e UF: `lib/dados/diretoria` já os resolve
  entre as duas origens, e quem não é médico (um contador na tesouraria)
  não tem inscrição. A palavra MÉDICO ao lado do CRM é exigência da
  Resolução CFM 2.336/2023, Art. 4º, I (`identificacaoMedica`).
*/
export function CartaoDiretor({ diretor, imediata = false }: { diretor: Diretor; imediata?: boolean }) {
  const perfil = diretor.slugDoPerfil;

  return (
    <li
      className={`${cartao.medico} ${styles.diretor}`}
      data-diretor=""
      data-sem-perfil={perfil ? undefined : ""}
    >
      <FotoDoMedico
        nome={diretor.nome}
        foto={diretor.foto}
        alt=""
        sizes={SIZES_DO_CARTAO}
        carga={imediata ? "imediata" : "preguicosa"}
        className={`${cartao.foto} ${styles.foto}`}
      />
      <div className={cartao.corpo}>
        <div className={cartao.texto}>
          <p className={styles.cargo}>{diretor.cargo}</p>
          <h3 className={cartao.nome}>
            {perfil ? <Link href={`/medico/${perfil}`}>{diretor.nome}</Link> : diretor.nome}
          </h3>
          {diretor.crm && diretor.crmUf ? (
            <p className={cartao.crm}>{identificacaoMedica(diretor.crm, diretor.crmUf)}</p>
          ) : null}
        </div>
        {perfil ? (
          <span className={`botao ${cartao.ligar} ${styles.verPerfil}`} aria-hidden="true" data-ligar="">
            Ver perfil <Icone nome="seta" />
          </span>
        ) : (
          <div className={cartao.semLigar} aria-hidden="true" data-ligar=""></div>
        )}
      </div>
    </li>
  );
}
```

`components/diretorio/GradeDeDiretores.tsx`:

```tsx
import { CartaoDiretor } from "@/components/diretorio/CartaoDiretor";
import styles from "@/components/diretorio/GradeMedicos.module.css";
import type { Diretor } from "@/lib/dados/diretoria";

/*
  A grade dos cartões de diretor: a mesma da busca (GradeMedicos.module.css),
  4 por linha no computador e o cartão deitado no celular, na ordem da AMI
  (presidência primeiro, sem cartão maior).
  - `imediatos`: quantos dos primeiros cartões baixam a foto logo, sem
    `loading="lazy"`, porque ficam na primeira tela.
*/
export function GradeDeDiretores({ diretores, imediatos = 0 }: { diretores: Diretor[]; imediatos?: number }) {
  return (
    <ul className={styles.grade}>
      {diretores.map((d, i) => (
        <CartaoDiretor key={d.id} diretor={d} imediata={i < imediatos} />
      ))}
    </ul>
  );
}
```

- [ ] **Step 5: A faixa com a pílula**

`components/associacao/FaixaDaDiretoria.module.css`:

```css
/*
  A pílula do mandato na faixa verde da diretoria, transcrita do desenho
  aprovado (docs/desenho-aprovado/associacao/diretoria.html:
  `.a-entrar-pilula`, `.a-entrar-pilula i`, `.a-entrar-pilula em`, e o
  @media de 700px).

  É moldura "a entrar": sai só no modo demonstração. As duas cores claras
  sobre o verde não têm token; o relatório do desenho mediu 8,61:1
  ("Gestão", #DDE7D6) e 6,42:1 ("(período a entrar)", #B9C6B2). O fio
  tracejado é o lima translúcido, como o vidro do ladrilho.
*/

.pilula {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-top: 22px;
  height: 34px;
  padding: 0 14px;
  border: 1px dashed rgba(168, 212, 112, 0.5);
  border-radius: 999px;
  font-size: 13px;
  font-weight: 600;
  color: #DDE7D6;
}

.pilula svg {
  width: 16px;
  height: 16px;
  color: var(--color-ami-lima-400);
}

.pilula em {
  font-style: italic;
  font-weight: 500;
  color: #B9C6B2;
}

@media (max-width: 700px) {
  .pilula {
    margin-top: 16px;
    height: 32px;
    font-size: 12.5px;
  }
}
```

`components/associacao/FaixaDaDiretoria.tsx`:

```tsx
import { Icone } from "@/components/base/Icone";
import styles from "@/components/associacao/FaixaDaDiretoria.module.css";
import { FaixaCurta } from "@/components/layout/FaixaCurta";
import { VOLTA_ASSOCIACAO } from "@/lib/paginaDeTexto";

/*
  A faixa verde da diretoria: a faixa curta (components/layout/FaixaCurta.tsx)
  com "← A ASSOCIAÇÃO", o título, a frase e as pessoas no ladrilho de vidro.

  Embaixo da frase, a pílula do mandato. O período da gestão não está em
  lugar nenhum que o site leia, então ela é moldura "a entrar"
  (`data-a-entrar`): sai só no modo demonstração, e fora dele não existe.
*/
export function FaixaDaDiretoria({ demonstracao }: { demonstracao: boolean }) {
  return (
    <FaixaCurta
      volta={VOLTA_ASSOCIACAO}
      titulo="Diretoria da AMI"
      texto="Quem responde pela associação. Cada nome traz o número de inscrição no CRM."
      icone="pessoas"
    >
      {demonstracao ? (
        <p className={styles.pilula} data-a-entrar="mandato">
          <Icone nome="calendario" /> Gestão <em>(período a entrar)</em>
        </p>
      ) : null}
    </FaixaCurta>
  );
}
```

O teste espera `… Gestão <em>`: no JSX, o texto entre o ícone e o `<em>` é um nó só (" Gestão "), sem o `<!-- -->` que o React põe entre dois textos vizinhos.

- [ ] **Step 6: A página**

Reescreva `app/(site)/associacao/diretoria/page.tsx` (CRLF; leia antes) inteiro:

```tsx
import type { Metadata } from "next";
import paginas from "@/app/(site)/encontre.module.css";
import { FaixaDaDiretoria } from "@/components/associacao/FaixaDaDiretoria";
import { EstadoVazio } from "@/components/base/EstadoVazio";
import { GradeDeDiretores } from "@/components/diretorio/GradeDeDiretores";
import { listarDiretoria } from "@/lib/dados/diretoria";
import { DADOS_DEMONSTRACAO } from "@/lib/demonstracao";
import { tituloDePagina } from "@/lib/seo/metadados";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: tituloDePagina("Diretoria da Associação Médica de Imperatriz"),
  description:
    "Quem responde pela Associação Médica de Imperatriz, com cargo, nome e " +
    "número de inscrição no CRM.",
  alternates: { canonical: "/associacao/diretoria" },
};

/* Os cartões da primeira fileira do computador: baixam a foto logo. */
const IMEDIATOS = 4;

/*
  A diretoria da AMI:
  - a faixa verde curta, com a volta para A Associação e, só no modo
    demonstração, a pílula do mandato;
  - os cartões de diretor na grade da busca, na ordem da AMI.

  Os nomes, cargos e CRMs vêm da tabela `diretoria` do banco
  (`listarDiretoria`, lib/dados/diretoria.ts). Sem diretor publicado, o
  aviso de vazio fica no lugar da grade.

  Sem `Cabeceira`, sem trilha e sem BreadcrumbList: dado estruturado sem o
  equivalente visível é marcação enganosa (lib/seo/jsonld.ts). Os blocos
  são filhos diretos de `.pagina` (app/(site)/encontre.module.css), a
  --ritmo um do outro; a grade fecha a página, a --ritmo do rodapé.
*/
export default async function PaginaDiretoria() {
  const diretoria = await listarDiretoria();

  return (
    <div className={paginas.pagina}>
      <FaixaDaDiretoria demonstracao={DADOS_DEMONSTRACAO} />

      <section data-bloco="diretoria" aria-labelledby="membros-titulo">
        <h2 id="membros-titulo" className="sr-only">
          Membros da diretoria
        </h2>
        {diretoria.length === 0 ? (
          <EstadoVazio
            titulo="Diretoria ainda não cadastrada"
            descricao="A composição da diretoria aparece aqui assim que a AMI a registrar."
          />
        ) : (
          <GradeDeDiretores diretores={diretoria} imediatos={IMEDIATOS} />
        )}
      </section>
    </div>
  );
}
```

- [ ] **Step 7: A placa sai, e os comentários que falavam dela**

1. Apague `components/diretorio/Placa.tsx`.
2. Em `app/globals.css` (CRLF), no comentário de `--color-ami-green-800`, apague as duas linhas

```
     - a placa de iniciais do médico, de 76 a 108px
       (components/diretorio/Placa.tsx);
```

3. Em `components/layout/Cabeceira.tsx` (CRLF), troque o primeiro parágrafo do comentário (o que a Task 6 do plano Especialidades escreveu):

```
  Cabeceira das páginas internas que ainda não ganharam o desenho novo, como
  A Associação, a diretoria, o contato e as notícias. A busca, o perfil do
  médico e as páginas de especialidades não a usam: o cliente a recusou, e
  elas abrem com o desenho delas.
```

por

```
  Cabeceira das páginas internas que ainda não ganharam o desenho novo, como
  A Associação, o contato e as notícias. A busca, o perfil do médico, as
  páginas de especialidades, a diretoria e as páginas de texto não a usam:
  o cliente a recusou, e elas abrem com o desenho delas.
```

4. `grep -rn "Placa" app components lib testes scripts`. Não pode sobrar nada.

- [ ] **Step 8: Rodar, provar por mutação, conferir, commit**

Run: `npx vitest run` · `npx tsc --noEmit` · `npm run build` → verde. `testes/diretoria.test.ts` continua verde: a fonte dos dados não mudou.

Mutações, uma de cada vez, regravando o original depois:

1. No cartão, troque `perfil ? <Link …>` por sempre o texto, sem link.
2. No cartão, troque o espaço vazio do sem perfil por `null`.
3. No cartão, tire `aria-hidden="true"` do "Ver perfil".
4. Na faixa, troque `demonstracao ?` por `true ?`.
5. Na página, troque `IMEDIATOS` por `0`.
6. No CSS do cartão, troque `.diretor[data-sem-perfil]:hover {` por `.diretor:hover {`.
7. Em `testes/tom-quente.test.ts`, troque `bg-[#FAF0E6]` por `bg-[#FFFFFF]` no texto de prova: o próprio teste fica vermelho (a prova não acha o quente). Desfaça.

Conferência rápida no navegador:
1. `npm run build` e `npx next start -p 3300`.
2. Abra `/associacao/diretoria` a 1440 e a 390px.
3. Expected: igual a `docs/desenho-aprovado/associacao/diretoria-1440-parte-1.jpg` e `diretoria-390-parte-1.jpg`, com as iniciais no lugar das fotos do Unsplash; os quatro "Ver perfil" na mesma linha.
4. Derrube o 3300 pelo PID.

```bash
git add components/diretorio/CartaoDiretor.tsx components/diretorio/CartaoDiretor.module.css components/diretorio/GradeDeDiretores.tsx components/associacao/FaixaDaDiretoria.tsx components/associacao/FaixaDaDiretoria.module.css "app/(site)/associacao/diretoria/page.tsx" components/diretorio/Placa.tsx app/globals.css components/layout/Cabeceira.tsx testes/tom-quente.test.ts testes/paleta.test.ts testes/diretoria-na-tela.test.ts
git commit -m "Diretoria: faixa verde curta com a pilula do mandato so na demonstracao, cartao da busca com cargo e Ver perfil, sem Cabeceira nem BreadcrumbList; a Placa sai"
```

---

### Task 6: A Associação — a faixa com os números e "Quem somos"

**Files:**
- Modify: `lib/molduras.ts` (CRLF; `TEXTO_INSTITUCIONAL`), `app/(site)/page.tsx` (LF; usa a de lá)
- Create: `components/home/PrincipiosDaAmi.tsx`
- Modify: `components/home/SejaAssociado.tsx` (reescrita; CRLF), `components/home/SejaAssociado.module.css` (LF)
- Create: `components/associacao/FaixaDaAssociacao.tsx`, `components/associacao/FaixaDaAssociacao.module.css`
- Create: `components/associacao/QuemSomos.tsx`, `components/associacao/QuemSomos.module.css`
- Create: `testes/associacao-topo.test.ts`

**Interfaces:**
- Consumes:
  - `numerosDaAssociacao`, `ApresentacaoNaTela`, `CONVITE_PARA_ASSOCIAR` (`lib/associacao.ts`), `linkDoMapaDaAmi` (`lib/ami.ts`) (Task 1);
  - `CorpoDoTexto` (Task 3);
  - `quemEhAmi`, `desenhoDaFotografia`, `TEXTO_A_ENTRAR`, `TextoInstitucional`, `CartaoInstitucional` (`lib/molduras.ts`); `ESPACOS.sede` (`lib/imagens.ts`); `Fotografia`;
  - as classes `faixa`, `duplo`, `comFoto`, `corpo`, `titulo`, `foto`, `fotografia`, `quem`, `soIntro`, `intro`, `introTitulo`, `introTexto`, `cartao`, `ordem`, `cartaoTitulo`, `cartaoTexto`, `falta` de `components/home/SejaAssociado.module.css`;
  - as classes `faixa`, `sobre`, `titulo`, `texto` de `components/busca/FaixaDaBusca.module.css`.
- Produces:

```ts
// lib/molduras.ts
export const TEXTO_INSTITUCIONAL: TextoInstitucional; // os três null
// components/home/PrincipiosDaAmi.tsx
export function PrincipiosDaAmi(props: {
  cartoes: CartaoInstitucional[];
  rotulo: string;
  titulo: string;
  texto?: string;
}): JSX.Element; // <div class={quem}>
// components/associacao/FaixaDaAssociacao.tsx
export function FaixaDaAssociacao(props: { anos: number; medicos: number; especialidades: number }): JSX.Element; // <section data-bloco="topo" …>
// components/associacao/QuemSomos.tsx
export const SIZES_DA_SEDE: string;
export function QuemSomos(props: {
  demonstracao: boolean;
  apresentacao: ApresentacaoNaTela | null;
  texto: TextoInstitucional;
}): JSX.Element; // <section data-bloco="quem-somos" data-faixa …>
```

`PrincipiosDaAmi` sai de dentro de `SejaAssociado`, sem mudar o HTML da home: `testes/sua-ami-e-associe.test.ts` e `testes/home-renderizada.test.ts`, que leem o HTML exato da faixa, continuam verdes sem mudança, e são a prova de que a extração não mexeu na home.

- [ ] **Step 1: Os testes**

`testes/associacao-topo.test.ts`:

```ts
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { Icon } from "@phosphor-icons/react";
import { ArrowUpRight, Heartbeat, MapPin, Phone, SealCheck, Stethoscope } from "@phosphor-icons/react/dist/ssr";
import type { PortableTextBlock } from "@portabletext/react";
import { FaixaDaAssociacao } from "@/components/associacao/FaixaDaAssociacao";
import estilosFaixa from "@/components/associacao/FaixaDaAssociacao.module.css";
import { QuemSomos, SIZES_DA_SEDE } from "@/components/associacao/QuemSomos";
import estilosQuem from "@/components/associacao/QuemSomos.module.css";
import estilosBusca from "@/components/busca/FaixaDaBusca.module.css";
import { PrincipiosDaAmi } from "@/components/home/PrincipiosDaAmi";
import estilosAssocie from "@/components/home/SejaAssociado.module.css";
import { TEXTO_INSTITUCIONAL, quemEhAmi } from "@/lib/molduras";
import { fonte } from "@/testes/apoio";
import { base, bloco, regra, semNotas } from "@/testes/css";

/*
  Os dois blocos de cima de A Associação, no HTML de servidor: a faixa verde
  com os três números e "Quem somos" (a sede, a apresentação e Missão,
  visão e valores), nos dois modos.

  A foto da sede é trocada por um dublê que mostra o que recebeu: o desenho
  da moldura "Fotografia a entrar" já é testado em testes/molduras.test.ts,
  e aqui interessa o que "Quem somos" pede a ela.
*/

vi.mock("@/components/base/Fotografia", () => ({
  Fotografia: (p: { espaco: string; sizes: string; demonstracao: boolean; className: string }) =>
    createElement("span", {
      "data-fotografia": p.espaco,
      "data-sizes": p.sizes,
      "data-demonstracao": String(p.demonstracao),
      className: p.className,
    }),
}));

const desenho = (Componente: Icon, size: number, weight: "duotone" | "regular") =>
  renderToString(createElement(Componente, { size, weight, className: "", "aria-hidden": "true" }));

/** O texto que aparece, sem tags, num espaço só. */
const tela = (html: string) =>
  html
    .replace(/<!-- -->/g, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

describe("a faixa verde de A Associação", () => {
  const html = renderToString(createElement(FaixaDaAssociacao, { anos: 51, medicos: 24, especialidades: 14 }));

  it("faixa de ponta a ponta que abre a página, sem Cabeceira nem trilha", () => {
    expect(html).toMatch(
      new RegExp(
        `^<section data-bloco="topo" data-faixa="" data-abertura="" aria-labelledby="associacao-titulo" class="textura-verde ${estilosBusca.faixa} ${estilosFaixa.inst}"><div class="brilho" aria-hidden="true"></div>`,
      ),
    );
    expect(html).not.toContain("Trilha de navegação");
  });

  it("o rótulo, o título com o ano de fundação e o parágrafo verdadeiro", () => {
    expect(html).toContain(
      `<div><span class="rotulo-secao ${estilosBusca.sobre}" data-coluna="">A Associação</span>` +
        `<h1 id="associacao-titulo" class="${estilosBusca.titulo}">Desde 1975 com os médicos de Imperatriz</h1>` +
        `<p class="${estilosBusca.texto}">A Associação Médica de Imperatriz está em atividade desde 1975 e representa a classe médica na região sul do Maranhão. Mantém este diretório para que a população encontre quem atende perto de casa, com informação correta e verificada.</p></div>`,
    );
  });

  it("à direita, os três números da home, cada um com o ícone num ladrilho de vidro", () => {
    expect(html).toContain(`<ul class="${estilosFaixa.numeros}" aria-label="A AMI em números">`);
    const numeros = [...html.matchAll(/<li>([\s\S]*?)<\/li>/g)].map((m) => m[1]);
    expect(numeros.map(tela)).toEqual(["51 anos de AMI", "24 médicos no diretório", "14 especialidades"]);
    expect(numeros[0]).toBe(
      `<span class="${estilosFaixa.vidro}" aria-hidden="true">${desenho(SealCheck, 20, "duotone")}</span>` +
        `<span class="${estilosFaixa.grande}">51</span><span class="${estilosFaixa.rotulo}">anos de AMI</span>`,
    );
    expect(numeros[1]).toContain(desenho(Stethoscope, 20, "duotone"));
    expect(numeros[2]).toContain(desenho(Heartbeat, 20, "duotone"));
  });
});

const BLOCOS = [
  {
    _type: "block",
    _key: "a",
    style: "normal",
    markDefs: [],
    children: [{ _type: "span", _key: "s", text: "A AMI reúne os médicos da região.", marks: [] }],
  },
] as PortableTextBlock[];

const quem = (demonstracao: boolean, apresentacao: Parameters<typeof QuemSomos>[0]["apresentacao"], texto = TEXTO_INSTITUCIONAL) =>
  renderToString(createElement(QuemSomos, { demonstracao, apresentacao, texto }));

describe("Quem somos, na demonstração e sem o texto da AMI", () => {
  const html = quem(true, { tipo: "a-entrar" });

  it("faixa branca de ponta a ponta, que entra ao rolar, com o texto e a foto lado a lado", () => {
    expect(html).toMatch(
      new RegExp(
        `^<section data-bloco="quem-somos" data-faixa="" aria-labelledby="quem-somos-titulo" class="revelar ${estilosAssocie.faixa}">` +
          `<div class="${estilosAssocie.duplo} ${estilosAssocie.comFoto}"><div class="${estilosAssocie.corpo} ${estilosQuem.corpo}">`,
      ),
    );
  });

  it("o rótulo na coluna do texto, o título e a apresentação a entrar", () => {
    expect(html).toContain(
      `<span class="rotulo-secao" data-coluna="">Quem somos</span>` +
        `<h2 id="quem-somos-titulo" class="${estilosAssocie.titulo}">A Associação Médica de Imperatriz</h2>` +
        `<p class="${estilosQuem.apresentacao} ${estilosQuem.falta}" data-a-entrar="apresentação">Texto da AMI a entrar.</p>`,
    );
  });

  it("o quadro da sede: o pino, o endereço em três linhas, Como chegar e o telefone fixo", () => {
    expect(html).toContain(
      `<div class="${estilosQuem.sede}"><span class="ladrilho-icone ladrilho-icone--pequeno" aria-hidden="true">${desenho(MapPin, 23, "duotone")}</span>` +
        `<div><h3 class="${estilosQuem.sedeTitulo}">Sede da AMI</h3>` +
        `<address class="${estilosQuem.endereco}">Rua Coriolano Milhomem, 39<br/>Centro, Imperatriz – MA<br/>CEP 65900-330</address></div>`,
    );
    expect(html).toContain(
      `<div class="${estilosQuem.acoes}"><a class="botao" href="https://www.google.com/maps/search/?api=1&amp;query=Rua%20Coriolano%20Milhomem%2C%2039%2C%20Centro%2C%20Imperatriz%20-%20MA%2C%2065900-330" aria-label="Como chegar à sede da AMI (abre o mapa)">Como chegar ${desenho(ArrowUpRight, 20, "regular")}</a>` +
        `<a class="botao-contorno" href="tel:+559935243716" aria-label="Ligar para a AMI, (99) 3524-3716">${desenho(Phone, 20, "regular")} <!-- -->(99) 3524-3716</a></div>`,
    );
  });

  it("à direita, a foto da sede, com a largura desenhada", () => {
    expect(html).toContain(
      `<div class="${estilosAssocie.foto}"><span data-fotografia="sede" data-sizes="${SIZES_DA_SEDE}" data-demonstracao="true" class="${estilosAssocie.fotografia}"></span></div>`,
    );
    expect(SIZES_DA_SEDE).toBe(
      "(max-width: 700px) calc(100vw - 64px), (max-width: 980px) calc(100vw - 104px), " +
        "(max-width: 1240px) calc(50vw - 96px), 524px",
    );
  });

  it("depois do fio, Princípios: Missão, visão e valores a entrar, sem texto de introdução", () => {
    expect(html).toContain(
      `<div class="${estilosAssocie.quem}" style="--cartoes:3"><div class="${estilosAssocie.intro}"><span class="rotulo-secao">Princípios</span><h3 class="${estilosAssocie.introTitulo}">Missão, visão e valores</h3></div>`,
    );
    expect(html.match(/Texto da AMI a entrar\./g)).toHaveLength(4);
  });
});

describe("Quem somos, fora da demonstração", () => {
  const html = quem(false, null);

  it("sem a foto, o texto em duas colunas; sem nenhuma moldura", () => {
    expect(html).toContain(
      `<div class="${estilosAssocie.duplo}"><div class="${estilosAssocie.corpo} ${estilosQuem.corpo} ${estilosQuem.semFoto}">`,
    );
    expect(html).not.toContain("data-fotografia");
    expect(html).not.toContain("data-a-entrar");
    expect(html).not.toContain("a entrar");
  });

  it("sem o texto de Missão, visão e valores, o bloco sai inteiro; a sede fica", () => {
    expect(html).not.toContain(estilosAssocie.quem);
    expect(html).not.toContain("Princípios");
    expect(html).toContain("Sede da AMI");
  });

  it("com a apresentação da AMI no Studio, ela sai, nos dois modos", () => {
    for (const demonstracao of [true, false]) {
      expect(quem(demonstracao, { tipo: "texto", blocos: BLOCOS })).toContain(
        `<div class="${estilosQuem.apresentacao}"><p>A AMI reúne os médicos da região.</p></div>`,
      );
    }
  });

  it("com o texto de um princípio, só o cartão dele", () => {
    const html = quem(false, null, { missao: "Representar os médicos.", visao: null, valores: null });
    expect(html).toContain('style="--cartoes:1"');
    expect(html).toContain("Representar os médicos.");
  });
});

describe("Missão, visão e valores, num componente só para a home e para A Associação", () => {
  it("com texto de introdução (a home), o parágrafo dele sai depois do título", () => {
    const html = renderToString(
      createElement(PrincipiosDaAmi, {
        cartoes: quemEhAmi(true, TEXTO_INSTITUCIONAL).cartoes,
        rotulo: "Quem somos",
        titulo: "Quem é a AMI?",
        texto: "Introdução.",
      }),
    );
    expect(html).toContain(
      `<h3 class="${estilosAssocie.introTitulo}">Quem é a AMI?</h3><p class="${estilosAssocie.introTexto}">Introdução.</p></div>`,
    );
    expect([...html.matchAll(new RegExp(`<span class="${estilosAssocie.ordem}" aria-hidden="true">(\\d+)</span>`, "g"))].map((m) => m[1])).toEqual([
      "01",
      "02",
      "03",
    ]);
  });

  it("o texto da AMI é um só, nulo até ela entregar", () => {
    expect(TEXTO_INSTITUCIONAL).toEqual({ missao: null, visao: null, valores: null });
  });
});

describe("o CSS da faixa verde", () => {
  const css = semNotas(fonte("../components/associacao/FaixaDaAssociacao.module.css"));
  const cel = () => bloco(css, "@media (max-width: 700px)");

  it("os números à direita, presos ao pé do texto, valendo sobre a regra da busca", () => {
    const r = regra(base(css), ".inst[data-faixa]");
    expect(r).toMatch(/grid-template-columns: minmax\(0, 1fr\) auto;/);
    expect(r).toMatch(/gap: 72px;/);
    expect(r).toMatch(/align-items: end;/);
    expect(regra(bloco(css, "@media (max-width: 1180px)"), ".inst[data-faixa]")).toMatch(/grid-template-columns: 1fr;/);
  });

  it("título até 12ch e parágrafo até 31em", () => {
    expect(regra(base(css), ".inst h1")).toMatch(/max-width: 12ch;/);
    expect(regra(base(css), ".inst h1 + p")).toMatch(/max-width: 31em;/);
  });

  it("três colunas com fio; no celular, uma fileira de três, sem ícone", () => {
    expect(regra(base(css), ".numeros")).toMatch(/grid-template-columns: repeat\(3, auto\);/);
    expect(regra(base(css), ".numeros li")).toMatch(/border-left: 1px solid rgba\(255, 255, 255, 0\.16\);/);
    expect(regra(base(css), ".grande")).toMatch(/font-size: 48px;/);
    expect(regra(base(css), ".rotulo")).toMatch(/color: #DDE7D6;/);
    expect(regra(cel(), ".vidro")).toMatch(/display: none;/);
    expect(regra(cel(), ".grande")).toMatch(/font-size: 32px;/);
    expect(regra(cel(), ".numeros")).toMatch(/border-top: 1px solid rgba\(255, 255, 255, 0\.16\);/);
  });
});

describe("o CSS de Quem somos", () => {
  const css = semNotas(fonte("../components/associacao/QuemSomos.module.css"));
  const cel = () => bloco(css, "@media (max-width: 700px)");

  it("o quadro da sede: fio em cima, o ícone à esquerda e os botões embaixo do endereço", () => {
    const r = regra(base(css), ".sede");
    expect(r).toMatch(/border-top: 1px solid var\(--color-line\);/);
    expect(r).toMatch(/grid-template-columns: 44px minmax\(0, 1fr\);/);
    expect(regra(base(css), ".acoes")).toMatch(/grid-column: 2;/);
  });

  it("sem a foto: o título à esquerda e a sede à direita, sem o fio", () => {
    expect(regra(base(css), ".corpo.semFoto")).toMatch(/grid-template-columns: minmax\(0, 1\.15fr\) minmax\(0, 1fr\);/);
    const r = regra(base(css), ".semFoto .sede");
    expect(r).toMatch(/grid-column: 2;/);
    expect(r).toMatch(/border: 0;/);
  });

  it("no celular, os dois botões lado a lado, na largura toda", () => {
    expect(regra(cel(), ".acoes")).toMatch(/grid-template-columns: 1fr 1fr;/);
    expect(regra(cel(), ".acoes > a")).toMatch(/width: 100%;/);
    expect(regra(cel(), ".corpo.semFoto")).toMatch(/display: block;/);
  });

  it("a introdução sem texto (Princípios) não deixa espaço embaixo do título", () => {
    const associe = semNotas(fonte("../components/home/SejaAssociado.module.css"));
    expect(regra(base(associe), ".introTitulo:last-child")).toMatch(/margin-bottom: 0;/);
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run testes/associacao-topo.test.ts`
Expected: FAIL. Os componentes novos e `TEXTO_INSTITUCIONAL` não existem.

- [ ] **Step 3: O texto institucional, num lugar só**

Em `lib/molduras.ts` (CRLF), no fim do arquivo:

```ts

/*
  O texto de Missão, visão e valores. A AMI ainda não entregou os três, e
  não há campo no Studio para eles: com `null`, os cartões saem como "Texto
  da AMI a entrar." na demonstração e não saem fora dela (`quemEhAmi`,
  acima). A home ("Quem é a AMI?") e A Associação ("Princípios") leem
  daqui; quando a AMI entregar, o texto entra aqui.
*/
export const TEXTO_INSTITUCIONAL: TextoInstitucional = { missao: null, visao: null, valores: null };
```

Em `app/(site)/page.tsx` (LF):

1. Troque `import { moldurasDaHome, type TextoInstitucional } from "@/lib/molduras";` por `import { moldurasDaHome, TEXTO_INSTITUCIONAL } from "@/lib/molduras";`.
2. Apague o comentário e a constante (e a linha em branco depois):

```tsx
/* Missão, visão e valores: a AMI ainda não entregou os textos, e não há
   onde guardá-los. Com `null`, "Quem é a AMI?" mostra "Texto da AMI a
   entrar." na demonstração e nenhum cartão fora dela (`quemEhAmi`, em
   lib/molduras.ts). */
const TEXTO_DA_AMI: TextoInstitucional = { missao: null, visao: null, valores: null };

```

3. Troque `texto={TEXTO_DA_AMI}` por `texto={TEXTO_INSTITUCIONAL}`.

- [ ] **Step 4: Missão, visão e valores num componente só**

`components/home/PrincipiosDaAmi.tsx`:

```tsx
import type { CSSProperties } from "react";
import { LadrilhoIcone, type NomeIcone } from "@/components/base/Icone";
import styles from "@/components/home/SejaAssociado.module.css";
import type { CartaoInstitucional } from "@/lib/molduras";

const ICONES: Record<CartaoInstitucional["titulo"], NomeIcone> = {
  Missão: "bandeira",
  Visão: "olho",
  Valores: "maoCoracao",
};

/*
  Missão, visão e valores: a introdução numa coluna mais larga e um cartão
  por texto, com o ordinal, o ícone, o título e o texto. Na home, debaixo
  de "Seja associado", com a introdução "Quem é a AMI?" e um parágrafo; em
  A Associação, debaixo da sede, com "Princípios" e sem parágrafo (a
  apresentação está logo acima).

  Os cartões vêm de `quemEhAmi` (lib/molduras.ts), e quem chama decide o
  que fazer sem nenhum: a home deixa a introdução sozinha, na largura toda
  (`soIntro`); A Associação nem monta este bloco.

  A grade tem uma coluna por cartão (`--cartoes`), e por isso dois cartões
  não deixam uma coluna vazia à direita. O desenho é o de "Quem é a AMI?"
  (SejaAssociado.module.css), inclusive o ordinal em `ink-400`.
*/
export function PrincipiosDaAmi({
  cartoes,
  rotulo,
  titulo,
  texto,
}: {
  cartoes: CartaoInstitucional[];
  rotulo: string;
  titulo: string;
  texto?: string;
}) {
  return (
    <div
      className={`${styles.quem}${cartoes.length === 0 ? ` ${styles.soIntro}` : ""}`}
      style={cartoes.length > 0 ? ({ "--cartoes": cartoes.length } as CSSProperties) : undefined}
    >
      <div className={styles.intro}>
        <span className="rotulo-secao">{rotulo}</span>
        <h3 className={styles.introTitulo}>{titulo}</h3>
        {texto ? <p className={styles.introTexto}>{texto}</p> : null}
      </div>

      {cartoes.map((c, i) => (
        <div key={c.titulo} className={styles.cartao}>
          <span className={styles.ordem} aria-hidden="true">
            {String(i + 1).padStart(2, "0")}
          </span>
          <LadrilhoIcone nome={ICONES[c.titulo]} pequeno />
          <h4 className={styles.cartaoTitulo}>{c.titulo}</h4>
          <p className={c.provisorio ? `${styles.cartaoTexto} ${styles.falta}` : styles.cartaoTexto}>
            {c.texto}
          </p>
        </div>
      ))}
    </div>
  );
}
```

Reescreva `components/home/SejaAssociado.tsx` (CRLF; leia antes) inteiro:

```tsx
import Link from "next/link";
import { Fotografia } from "@/components/base/Fotografia";
import { Icone } from "@/components/base/Icone";
import { PrincipiosDaAmi } from "@/components/home/PrincipiosDaAmi";
import styles from "@/components/home/SejaAssociado.module.css";
import { AMI } from "@/lib/ami";
import { CONVITE_PARA_ASSOCIAR } from "@/lib/associacao";
import { ESPACOS } from "@/lib/imagens";
import { desenhoDaFotografia, quemEhAmi, type TextoInstitucional } from "@/lib/molduras";

/*
  "Seja associado" e "Quem é a AMI?": a faixa branca de ponta a ponta da
  home, logo depois de "Sua AMI" (app/(site)/page.tsx).

  A faixa fica fora da caixa centralizada, como a busca verde, e leva
  `data-faixa`, a marca das faixas de ponta a ponta (o rodapé a lê); o texto
  fica na mesma linha vertical do resto porque a margem lateral é
  `--borda-faixa` (app/globals.css).

  Entra na tela com a `.revelar` global, como no desenho. Sem carrossel,
  numa tela alta, esta faixa pode abrir na primeira tela, e aí fica parada:
  só o bloco que abre abaixo da tela anima (components/layout/Revelar.tsx).

  A foto dos associados obedece a trava de `desenhoDaFotografia`: sem foto
  real e fora da demonstração não sai nada, e então a grade não ganha a
  segunda coluna e o texto ocupa a largura toda. A pergunta é feita aqui,
  antes da casca, porque `Fotografia` devolvendo `null` deixaria a casca
  vazia.

  O título e o texto do convite são os de `CONVITE_PARA_ASSOCIAR`
  (lib/associacao.ts), que o fecho de A Associação repete.

  Os cartões de missão, visão e valores vêm de `quemEhAmi` (lib/molduras.ts)
  e são desenhados por `PrincipiosDaAmi`. Sem cartão nenhum (fora da
  demonstração e sem texto da AMI), a introdução "Quem é a AMI?" fica
  sozinha, na largura toda: o texto dela é verdadeiro.

  O ano da frase de apresentação vem de `AMI.fundadaEm`, o mesmo de que
  `anosDeAmi` calcula o número da home.
*/
export function SejaAssociado({
  demonstracao,
  texto,
}: {
  demonstracao: boolean;
  texto: TextoInstitucional;
}) {
  const temFoto = desenhoDaFotografia(ESPACOS.associados.provisoria, demonstracao) !== "nada";
  const { cartoes } = quemEhAmi(demonstracao, texto);

  return (
    <section
      data-bloco="associe"
      data-faixa=""
      aria-labelledby="associe-titulo"
      className={`revelar ${styles.faixa}`}
    >
      <div className={`${styles.duplo}${temFoto ? ` ${styles.comFoto}` : ""}`}>
        <div className={styles.corpo}>
          <span className="rotulo-secao" data-coluna="">
            Seja associado
          </span>
          <h2 id="associe-titulo" className={styles.titulo}>
            {CONVITE_PARA_ASSOCIAR.titulo}
          </h2>
          <p className={styles.texto}>{CONVITE_PARA_ASSOCIAR.texto}</p>
          <Link className={`botao ${styles.acao}`} href="/associacao/seja-associado">
            Quero me associar <Icone nome="seta" />
          </Link>
        </div>

        {temFoto ? (
          <div className={styles.foto}>
            <Fotografia
              espaco="associados"
              demonstracao={demonstracao}
              sizes="(min-width: 981px) 50vw, 100vw"
              className={styles.fotografia}
            />
          </div>
        ) : null}
      </div>

      <PrincipiosDaAmi
        cartoes={cartoes}
        rotulo="Quem somos"
        titulo="Quem é a AMI?"
        texto={`A Associação Médica de Imperatriz reúne os profissionais que atendem em Imperatriz e na região sul do Maranhão, em atividade desde ${AMI.fundadaEm}.`}
      />
    </section>
  );
}
```

Em `components/home/SejaAssociado.module.css` (LF), depois da regra `.introTitulo { … }`, acrescente:

```css

/* Sem parágrafo depois (os Princípios de A Associação), o título não deixa
   espaço embaixo. */
.introTitulo:last-child {
  margin-bottom: 0;
}
```

- [ ] **Step 5: A faixa verde com os números**

`components/associacao/FaixaDaAssociacao.module.css`:

```css
/*
  A faixa verde de A Associação, transcrita do desenho aprovado
  (docs/desenho-aprovado/associacao/associacao.html: `.inst-topo`,
  `.inst-topo h1`, `.inst-topo .texto`, `.inst-numeros` e o que vem dentro
  dele, `.ladrilho-vidro`, e os @media de 1180, 700 e 400px).

  O resto da faixa é o da busca (components/busca/FaixaDaBusca.module.css:
  `.faixa`, `.sobre`, `.titulo`, `.texto`).

  À direita, os três números da home, presos ao pé do texto, com fio entre
  eles. Abaixo de 1180px, embaixo do texto; no celular, uma fileira de
  três colunas estreitas, sem o ícone.

  As regras daqui valem sobre as da busca qualquer que seja a ordem em que
  as duas folhas chegam ao navegador:
  - `.inst[data-faixa]` (classe e atributo) pesa mais que `.faixa`;
  - `.inst h1` e `.inst h1 + p` pesam mais que `.titulo` e `.texto`.

  O vidro do ladrilho é branco translúcido, sem tom. O rótulo dos números
  (#DDE7D6) não tem token; o relatório do desenho mediu 8,73:1 sobre o
  verde.
*/

.inst[data-faixa] {
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 72px;
  align-items: end;
}

.inst h1 {
  max-width: 12ch;
}

.inst h1 + p {
  max-width: 31em;
}

.numeros {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(3, auto);
}

.numeros li {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  min-width: 150px;
  padding: 4px 32px;
  border-left: 1px solid rgba(255, 255, 255, 0.16);
}

.numeros li:first-child {
  border-left: 0;
  padding-left: 0;
}

.numeros li:last-child {
  padding-right: 0;
}

.vidro {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border-radius: 14px;
  background: linear-gradient(150deg, rgba(255, 255, 255, 0.11) 0%, rgba(255, 255, 255, 0.03) 100%);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.14);
  color: var(--color-ami-lima-400);
}

.vidro svg {
  width: 23px;
  height: 23px;
}

.grande {
  margin: 22px 0 8px;
  font-family: var(--font-titulo);
  font-weight: 500;
  letter-spacing: -0.035em;
  font-size: 48px;
  line-height: 1;
  font-variant-numeric: tabular-nums;
  color: var(--color-white);
}

.rotulo {
  font-size: 14.5px;
  font-weight: 600;
  white-space: nowrap;
  color: #DDE7D6;
}

@media (max-width: 1180px) {
  .inst[data-faixa] {
    grid-template-columns: 1fr;
    gap: 44px;
  }

  .numeros {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    max-width: 620px;
  }
}

@media (max-width: 700px) {
  .inst[data-faixa] {
    gap: 28px;
  }

  .numeros {
    max-width: none;
    padding-top: 20px;
    border-top: 1px solid rgba(255, 255, 255, 0.16);
  }

  .numeros li {
    min-width: 0;
    padding: 0 12px;
  }

  .vidro {
    display: none;
  }

  .grande {
    margin: 0 0 4px;
    font-size: 32px;
  }

  .rotulo {
    font-size: 12.5px;
    line-height: 1.3;
    white-space: normal;
  }
}

@media (max-width: 400px) {
  .numeros li {
    padding: 0 10px;
  }

  .rotulo {
    font-size: 12px;
  }
}
```

`components/associacao/FaixaDaAssociacao.tsx`:

```tsx
import { Icone } from "@/components/base/Icone";
import styles from "@/components/associacao/FaixaDaAssociacao.module.css";
import busca from "@/components/busca/FaixaDaBusca.module.css";
import { AMI } from "@/lib/ami";
import { numerosDaAssociacao } from "@/lib/associacao";

/*
  A faixa verde de ponta a ponta que abre A Associação (/associacao):
  - o rótulo, o título com o ano de fundação (`AMI.fundadaEm`) e o
    parágrafo de apresentação;
  - à direita, os três números da home: anos, médicos e especialidades
    (`numerosDaAssociacao`, lib/associacao.ts), sem a contagem animada da
    home, que lá serve para chamar o olho logo abaixo do carrossel.

  Sem `Cabeceira` e sem trilha.

  - `data-abertura`: a barra do pé do celular aparece quando esta faixa sai
    da tela (components/layout/BarraDoPe.tsx).
  - `data-faixa`: a faixa fica fora da coluna da página
    (app/(site)/encontre.module.css).
*/
export function FaixaDaAssociacao({
  anos,
  medicos,
  especialidades,
}: {
  anos: number;
  medicos: number;
  especialidades: number;
}) {
  return (
    <section
      data-bloco="topo"
      data-faixa=""
      data-abertura=""
      aria-labelledby="associacao-titulo"
      className={`textura-verde ${busca.faixa} ${styles.inst}`}
    >
      <div className="brilho" aria-hidden="true"></div>

      <div>
        <span className={`rotulo-secao ${busca.sobre}`} data-coluna="">
          A Associação
        </span>
        <h1 id="associacao-titulo" className={busca.titulo}>
          {`Desde ${AMI.fundadaEm} com os médicos de Imperatriz`}
        </h1>
        <p className={busca.texto}>
          {`A ${AMI.razaoSocial} está em atividade desde ${AMI.fundadaEm} e representa a classe médica na região sul do Maranhão. Mantém este diretório para que a população encontre quem atende perto de casa, com informação correta e verificada.`}
        </p>
      </div>

      <ul className={styles.numeros} aria-label="A AMI em números">
        {numerosDaAssociacao({ anos, medicos, especialidades }).map((n) => (
          <li key={n.icone}>
            <span className={styles.vidro} aria-hidden="true">
              <Icone nome={n.icone} duotone />
            </span>
            <span className={styles.grande}>{n.valor}</span>
            <span className={styles.rotulo}>{n.rotulo}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
```

`AMI.razaoSocial` é "Associação Médica de Imperatriz": o parágrafo começa com "A Associação Médica…", como hoje.

- [ ] **Step 6: Quem somos**

`components/associacao/QuemSomos.module.css`:

```css
/*
  "Quem somos" de A Associação, transcrito do desenho aprovado
  (docs/desenho-aprovado/associacao/associacao.html: `.inst-sede .corpo`,
  `.inst-sede .corpo > .falta`, `.sede` e o que vem dentro dele, as regras
  `.inst-sede .duplo:not(:has(.foto))`, e o @media de 700px).

  A faixa branca, o texto ao lado da foto e os cartões de Missão, visão e
  valores são os de "Seja associado" da home
  (components/home/SejaAssociado.module.css: `.faixa`, `.duplo`,
  `.comFoto`, `.corpo`, `.titulo`, `.foto`, `.fotografia`, `.quem`).

  Sem a foto (fora da demonstração, enquanto a AMI não manda), o bloco
  vira duas colunas de texto: o título à esquerda e a sede à direita. O
  desenho decide isso com `:has`; aqui, quem decide é o componente, com a
  classe `.semFoto`.

  Uma regra não está no desenho, que mostra a apresentação só como "a
  entrar": o espaço entre dois parágrafos do texto da AMI, 16px, o mesmo da
  leitura do perfil.
*/

.corpo {
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.apresentacao {
  margin-top: 16px;
  max-width: 30em;
  color: var(--color-ink-600);
}

.apresentacao p + p {
  margin-top: 16px;
}

.falta {
  color: var(--color-ink-400);
  font-style: italic;
}

.sede {
  display: grid;
  grid-template-columns: 44px minmax(0, 1fr);
  column-gap: 16px;
  margin-top: 36px;
  padding-top: 28px;
  border-top: 1px solid var(--color-line);
}

.sedeTitulo {
  margin-top: 1px;
  font-family: var(--font-corpo);
  font-size: 16px;
  font-weight: 700;
  letter-spacing: 0;
  line-height: 1.3;
  color: var(--color-ami-green-800);
}

.endereco {
  margin-top: 4px;
  font-style: normal;
  font-size: 15.5px;
  line-height: 1.6;
  color: var(--color-ink-600);
}

.acoes {
  grid-column: 2;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 20px;
}

.corpo.semFoto {
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr);
  column-gap: var(--m);
  align-items: end;
}

.semFoto > :not(.sede) {
  grid-column: 1;
}

.semFoto .sede {
  grid-column: 2;
  grid-row: 1 / span 3;
  margin: 0;
  padding: 0;
  border: 0;
}

@media (max-width: 700px) {
  .sede {
    grid-template-columns: 40px minmax(0, 1fr);
    column-gap: 14px;
    margin-top: 24px;
    padding-top: 22px;
  }

  .sede :global(.ladrilho-icone) {
    width: 40px;
    height: 40px;
    border-radius: 12px;
  }

  .sede :global(.ladrilho-icone) svg {
    width: 21px;
    height: 21px;
  }

  .endereco {
    font-size: 15px;
  }

  .acoes {
    grid-column: 1 / -1;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    margin-top: 18px;
  }

  .acoes > a {
    width: 100%;
    height: 46px;
    padding: 0 12px;
    font-size: 14px;
    gap: 8px;
  }

  .corpo.semFoto {
    display: block;
  }

  .semFoto .sede {
    margin-top: 24px;
    padding-top: 22px;
    border-top: 1px solid var(--color-line);
  }
}
```

`components/associacao/QuemSomos.tsx`:

```tsx
import { Fotografia } from "@/components/base/Fotografia";
import { Icone, LadrilhoIcone } from "@/components/base/Icone";
import styles from "@/components/associacao/QuemSomos.module.css";
import { CorpoDoTexto } from "@/components/editorial/CorpoDoTexto";
import { PrincipiosDaAmi } from "@/components/home/PrincipiosDaAmi";
import associe from "@/components/home/SejaAssociado.module.css";
import { AMI, hrefTelefone, linkDoMapaDaAmi } from "@/lib/ami";
import type { ApresentacaoNaTela } from "@/lib/associacao";
import { ESPACOS } from "@/lib/imagens";
import { desenhoDaFotografia, quemEhAmi, TEXTO_A_ENTRAR, type TextoInstitucional } from "@/lib/molduras";

/*
  A largura desenhada da foto da sede, pelas réguas da faixa branca
  (`--borda-faixa`, app/globals.css) e da grade de "Seja associado"
  (SejaAssociado.module.css: duas colunas com --m de vão acima de 980px,
  uma abaixo):
  - acima de 1240px, a caixa de 1096px menos o vão de 48px, ao meio: 524px;
  - de 981 a 1240px, a faixa tem 72px de cada lado: (100vw − 192px) / 2;
  - de 701 a 980px, uma coluna, com 52px de cada lado;
  - no celular, uma coluna, com 32px de cada lado.
*/
export const SIZES_DA_SEDE =
  "(max-width: 700px) calc(100vw - 64px), (max-width: 980px) calc(100vw - 104px), " +
  "(max-width: 1240px) calc(50vw - 96px), 524px";

/*
  "Quem somos", a faixa branca de ponta a ponta logo abaixo da faixa verde
  de A Associação.
  - À esquerda: "QUEM SOMOS", o nome da associação, a apresentação oficial
    e o quadro da sede (o endereço de lib/ami.ts, "Como chegar" e o
    telefone fixo).
  - À direita, a foto da sede (`ESPACOS.sede`, lib/imagens.ts).
  - Depois do fio, "Princípios": Missão, visão e valores, os cartões da
    home (`PrincipiosDaAmi`).

  As molduras seguem a trava de sempre:
  - a apresentação (`apresentacaoDaAssociacao`, lib/associacao.ts): o texto
    da AMI nos dois modos; sem ele, "Texto da AMI a entrar." só na
    demonstração;
  - a foto (`desenhoDaFotografia`): sem material, a moldura só na
    demonstração; fora dela, o bloco vira duas colunas de texto;
  - os cartões (`quemEhAmi`): sem texto e fora da demonstração, nenhum, e
    então o bloco "Princípios" sai inteiro: sem texto verdadeiro, a
    introdução não tem o que dizer sozinha.

  `data-faixa`: o rodapé lê a marca. Entra na tela com a `.revelar`.
*/
export function QuemSomos({
  demonstracao,
  apresentacao,
  texto,
}: {
  demonstracao: boolean;
  apresentacao: ApresentacaoNaTela | null;
  texto: TextoInstitucional;
}) {
  const temFoto = desenhoDaFotografia(ESPACOS.sede.provisoria, demonstracao) !== "nada";
  const { cartoes } = quemEhAmi(demonstracao, texto);
  const [fixo] = AMI.telefones;
  const e = AMI.endereco;

  return (
    <section
      data-bloco="quem-somos"
      data-faixa=""
      aria-labelledby="quem-somos-titulo"
      className={`revelar ${associe.faixa}`}
    >
      <div className={`${associe.duplo}${temFoto ? ` ${associe.comFoto}` : ""}`}>
        <div className={`${associe.corpo} ${styles.corpo}${temFoto ? "" : ` ${styles.semFoto}`}`}>
          <span className="rotulo-secao" data-coluna="">
            Quem somos
          </span>
          <h2 id="quem-somos-titulo" className={associe.titulo}>
            {`A ${AMI.razaoSocial}`}
          </h2>

          {apresentacao?.tipo === "texto" ? (
            <div className={styles.apresentacao}>
              <CorpoDoTexto blocos={apresentacao.blocos} />
            </div>
          ) : apresentacao?.tipo === "a-entrar" ? (
            <p className={`${styles.apresentacao} ${styles.falta}`} data-a-entrar="apresentação">
              {TEXTO_A_ENTRAR}
            </p>
          ) : null}

          <div className={styles.sede}>
            <LadrilhoIcone nome="comoChegar" pequeno />
            <div>
              <h3 className={styles.sedeTitulo}>Sede da AMI</h3>
              <address className={styles.endereco}>
                {`${e.logradouro}, ${e.numero}`}
                <br />
                {`${e.bairro}, ${e.cidade} – ${e.uf}`}
                <br />
                {`CEP ${e.cep}`}
              </address>
            </div>
            <div className={styles.acoes}>
              <a className="botao" href={linkDoMapaDaAmi()} aria-label="Como chegar à sede da AMI (abre o mapa)">
                Como chegar <Icone nome="setaDiagonal" />
              </a>
              <a className="botao-contorno" href={hrefTelefone(fixo)} aria-label={`Ligar para a AMI, ${fixo}`}>
                <Icone nome="telefone" /> {fixo}
              </a>
            </div>
          </div>
        </div>

        {temFoto ? (
          <div className={associe.foto}>
            <Fotografia
              espaco="sede"
              demonstracao={demonstracao}
              sizes={SIZES_DA_SEDE}
              className={associe.fotografia}
            />
          </div>
        ) : null}
      </div>

      {cartoes.length > 0 ? (
        <PrincipiosDaAmi cartoes={cartoes} rotulo="Princípios" titulo="Missão, visão e valores" />
      ) : null}
    </section>
  );
}
```

O endereço em três linhas usa o travessão curto ("Imperatriz – MA"), como o desenho e o cartão do consultório (`enderecoDoLocal`, lib/encontre.ts).

- [ ] **Step 7: Rodar, provar por mutação, commit**

Run: `npx vitest run` · `npx tsc --noEmit` · `npm run build` → verde. `testes/sua-ami-e-associe.test.ts`, `testes/home-renderizada.test.ts`, `testes/home.test.ts` e `testes/molduras.test.ts` continuam verdes sem mudança: a home sai igual.

Os blocos ainda não estão na página: a Task 7 os liga.

Mutações, uma de cada vez, regravando o original depois:

1. Em `PrincipiosDaAmi`, troque `{texto ? <p className={styles.introTexto}>{texto}</p> : null}` por `<p className={styles.introTexto}>{texto}</p>`: os Princípios ganham um parágrafo vazio, e o teste deles fica vermelho.
2. Em `QuemSomos`, troque `apresentacao?.tipo === "a-entrar"` por `demonstracao`.
3. Em `QuemSomos`, tire ``${temFoto ? "" : ` ${styles.semFoto}`}`` da classe do corpo.
4. Em `QuemSomos`, troque `cartoes.length > 0 ?` por `true ?`.
5. Em `QuemSomos`, troque `sizes={SIZES_DA_SEDE}` por `sizes="100vw"`.
6. Na faixa, troque `numerosDaAssociacao({ anos, medicos, especialidades })` por `numerosDaAssociacao({ anos, medicos: especialidades, especialidades: medicos })`.
7. No CSS da faixa, troque `.inst[data-faixa]` por `.inst` (nas três regras).
8. No CSS de Quem somos, tire `border: 0;` de `.semFoto .sede`.

```bash
git add lib/molduras.ts "app/(site)/page.tsx" components/home/PrincipiosDaAmi.tsx components/home/SejaAssociado.tsx components/home/SejaAssociado.module.css components/associacao/FaixaDaAssociacao.tsx components/associacao/FaixaDaAssociacao.module.css components/associacao/QuemSomos.tsx components/associacao/QuemSomos.module.css testes/associacao-topo.test.ts
git commit -m "A Associacao, blocos de cima: faixa verde com os tres numeros, Quem somos com sede, apresentacao e foto a entrar, e Missao visao e valores num componente so com a home"
```

---

### Task 7: A Associação — diretoria em destaque, "Saiba mais", fecho e a página

**Files:**
- Create: `components/associacao/DiretoriaEmDestaque.tsx`, `components/associacao/SaibaMais.tsx`, `components/associacao/FechoAssocie.tsx`, `components/associacao/SecoesDaAssociacao.module.css`
- Modify: `app/(site)/associacao/page.tsx` (reescrita; LF)
- Modify: `components/layout/Cabeceira.tsx` (CRLF), `components/layout/Rodape.module.css` (CRLF) (comentários)
- Modify: `testes/caminhos-de-filiacao.test.ts` (LF)
- Create: `testes/associacao.test.ts`

**Interfaces:**
- Consumes:
  - `atalhosDoSaibaMais`, `diretoriaEmDestaque`, `apresentacaoDaAssociacao`, `CONVITE_PARA_ASSOCIAR`, `Atalho` (Task 1);
  - `GradeDeDiretores` (Task 5);
  - `FaixaDaAssociacao`, `QuemSomos`, `TEXTO_INSTITUCIONAL` (Task 6);
  - as classes `grade`, `cartao`, `nome`, `pe`, `conta`, `seta` de `components/especialidades/GradeDeEspecialidades.module.css` (plano Especialidades, Task 4) e `faixa` de `components/home/SejaAssociado.module.css`;
  - `paginaPorSlug`, `caminhosDePaginasPublicadas` (`lib/sanity/consultas.ts`, sem mudança), `listarDiretoria`, `especialidadesComContagem`, `buscarMedicos`, `anosDeAmi`, `RASCUNHOS_DE_ASSOCIACAO`, `DADOS_DEMONSTRACAO`.
- Produces:

```ts
// components/associacao/DiretoriaEmDestaque.tsx
export function DiretoriaEmDestaque(props: { diretores: Diretor[] }): JSX.Element; // <section data-bloco="diretoria">
// components/associacao/SaibaMais.tsx
export function SaibaMais(props: { atalhos: Atalho[] }): JSX.Element; // <section data-bloco="saiba-mais">
// components/associacao/FechoAssocie.tsx
export function FechoAssocie(): JSX.Element; // <section data-bloco="associe" data-faixa …>
```

- Marcas: `data-atalho` no `<li>`, `data-nome` no `<h3>`, `data-seta` na seta. A Task 8 as mede.

- [ ] **Step 1: Os testes**

`testes/associacao.test.ts`:

```ts
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Icon } from "@phosphor-icons/react";
import { ArrowRight, Article, Handshake, Scroll } from "@phosphor-icons/react/dist/ssr";
import estilosPagina from "@/app/(site)/encontre.module.css";
import { DiretoriaEmDestaque } from "@/components/associacao/DiretoriaEmDestaque";
import { FechoAssocie } from "@/components/associacao/FechoAssocie";
import { SaibaMais } from "@/components/associacao/SaibaMais";
import estilos from "@/components/associacao/SecoesDaAssociacao.module.css";
import estilosMedicos from "@/components/diretorio/GradeMedicos.module.css";
import estilosEsp from "@/components/especialidades/GradeDeEspecialidades.module.css";
import estilosAssocie from "@/components/home/SejaAssociado.module.css";
import { anosDeAmi } from "@/lib/ami";
import { atalhosDoSaibaMais } from "@/lib/associacao";
import type { Diretor } from "@/lib/dados/diretoria";
import { tituloDePagina } from "@/lib/seo/metadados";
import { fonte } from "@/testes/apoio";
import { base, bloco, regra, semNotas } from "@/testes/css";
import { htmlDe } from "@/testes/renderizar";

/*
  A Associação: os três blocos de baixo (a diretoria em destaque, "Saiba
  mais" e o fecho) e a página de verdade (app/(site)/associacao/page.tsx),
  com o Sanity, a diretoria e o banco trocados por dublês, nas duas chaves
  de demonstração.

  A chave de demonstração é lida quando lib/demonstracao.ts é importado:
  cada caso troca a chave e importa a página de novo.
*/

const dados = vi.hoisted(() => ({
  associacao: null as unknown,
  publicadas: [] as string[],
  diretoria: [] as Diretor[],
}));

vi.mock("@/lib/sanity/consultas", () => ({
  paginaPorSlug: async (slug: string) => (slug === "associacao" ? dados.associacao : null),
  caminhosDePaginasPublicadas: async () => dados.publicadas,
}));
vi.mock("@/lib/dados/diretoria", () => ({ listarDiretoria: async () => dados.diretoria }));
vi.mock("@/lib/dados/medicos", () => ({
  buscarMedicos: async () => Array.from({ length: 24 }, (_, i) => ({ id: i + 1 })),
}));
vi.mock("@/lib/dados/especialidades", () => ({
  especialidadesComContagem: async () =>
    Array.from({ length: 14 }, (_, i) => ({ nome: `Especialidade ${i}`, slug: `especialidade-${i}`, total: 1 })),
}));

function diretor(id: number): Diretor {
  return {
    id,
    nome: `Diretor ${id}`,
    cargo: `Cargo ${id}`,
    ordem: id * 10,
    slugDoPerfil: `diretor-${id}`,
    crm: String(10000 + id),
    crmUf: "MA",
    medico: true,
    foto: null,
  };
}
const SEIS = [1, 2, 3, 4, 5, 6].map(diretor);

afterEach(() => {
  vi.unstubAllEnvs();
  dados.associacao = null;
  dados.publicadas = [];
  dados.diretoria = SEIS;
});
dados.diretoria = SEIS;

const desenho = (Componente: Icon, size: number, weight: "duotone" | "regular") =>
  renderToString(createElement(Componente, { size, weight, className: "", "aria-hidden": "true" }));

/** A tag de abertura do link para `href`. */
const link = (html: string, href: string) => new RegExp(`<a [^>]*href="${href}"[^>]*>`).exec(html)?.[0] ?? "";

describe("a diretoria em destaque", () => {
  const html = renderToString(createElement(DiretoriaEmDestaque, { diretores: SEIS.slice(0, 4) }));

  it("o cabeçalho de seção da home, com o botão-linha à direita", () => {
    expect(html).toMatch(
      new RegExp(
        `^<section data-bloco="diretoria" aria-labelledby="diretoria-titulo"><div class="${estilos.cabSecao}"><div>` +
          `<span class="rotulo-secao" data-coluna="">Diretoria</span>` +
          `<h2 id="diretoria-titulo" class="${estilos.titulo}">Quem responde pela AMI</h2>` +
          `<p class="${estilos.texto}">Cada nome traz o número de inscrição no CRM.</p></div>`,
      ),
    );
    expect(link(html, "/associacao/diretoria")).toContain('class="botao-linha"');
    expect(html).toContain(`Ver a diretoria ${desenho(ArrowRight, 20, "regular")}</a></div>`);
  });

  it("os cartões de diretor, na grade da busca", () => {
    expect(html).toContain(`<ul class="${estilosMedicos.grade}">`);
    expect(html.match(/data-diretor=""/g)).toHaveLength(4);
  });
});

describe("Saiba mais", () => {
  const atalhos = atalhosDoSaibaMais(true, ["/associacao/seja-associado"]);
  const html = renderToString(createElement(SaibaMais, { atalhos }));
  const cartoes = [...html.matchAll(/<li [^>]*data-atalho=""[\s\S]*?<\/li>/g)].map((m) => m[0]);

  it("o cabeçalho de seção e a grade do índice de especialidades, em três colunas", () => {
    expect(html).toMatch(
      new RegExp(
        `^<section data-bloco="saiba-mais" aria-labelledby="saiba-mais-titulo"><div class="${estilos.cabSecao}"><div>` +
          `<span class="rotulo-secao" data-coluna="">A Associação</span>` +
          `<h2 id="saiba-mais-titulo" class="${estilos.titulo}">Saiba mais</h2></div></div>` +
          `<ul class="${estilosEsp.grade} ${estilos.atalhos}" data-atalhos="">`,
      ),
    );
    expect(cartoes).toHaveLength(3);
  });

  it("o atalho da página que existe: ladrilho, título com o link, frase e seta", () => {
    expect(cartoes[0]).toMatch(new RegExp(`^<li class="${estilosEsp.cartao} ${estilos.atalho}" data-atalho="">`));
    expect(cartoes[0]).toContain(`<span class="ladrilho-icone" aria-hidden="true">${desenho(Handshake, 28, "duotone")}</span>`);
    expect(cartoes[0]).toContain(`<h3 class="${estilosEsp.nome} ${estilos.nome}" data-nome=""><a href="/associacao/seja-associado">Seja associado</a></h3>`);
    expect(cartoes[0]).toContain(
      `<p class="${estilosEsp.pe} ${estilos.pe}"><span class="${estilosEsp.conta} ${estilos.frase}">Quem pode se associar à AMI e como fazer isso.</span>` +
        `<span class="${estilosEsp.seta} ${estilos.seta}" aria-hidden="true" data-seta="">${desenho(ArrowRight, 20, "regular")}</span></p>`,
    );
  });

  it("a página que ainda não existe: sem link, com a etiqueta texto a entrar", () => {
    expect(cartoes[1]).toMatch(/^<li [^>]*data-atalho="" data-a-entrar="">/);
    expect(cartoes[1]).toContain(desenho(Scroll, 28, "duotone"));
    expect(cartoes[1]).toContain(`data-nome="">Estatuto<span class="${estilos.etiqueta}">texto a entrar</span></h3>`);
    expect(cartoes[1]).not.toContain("<a ");
    expect(cartoes[2]).toContain(desenho(Article, 28, "duotone"));
    expect(cartoes[2]).toContain(">Política editorial<span");
  });
});

describe("o fecho", () => {
  const html = renderToString(createElement(FechoAssocie));

  it("faixa branca de ponta a ponta, que entra ao rolar, em duas colunas", () => {
    expect(html).toMatch(
      new RegExp(
        `^<section data-bloco="associe" data-faixa="" aria-labelledby="associe-titulo" class="revelar ${estilosAssocie.faixa}"><div class="${estilos.fecho}">`,
      ),
    );
  });

  it("o texto aprovado da faixa da home e o botão Quero me associar", () => {
    expect(html).toContain(
      `<div><span class="rotulo-secao" data-coluna="">Seja associado</span>` +
        `<h2 id="associe-titulo" class="${estilos.fechoTitulo}">Associe-se à AMI e fortaleça a medicina em Imperatriz</h2></div>` +
        `<div><p class="${estilos.fechoTexto}">Médico com inscrição no CRM pode se associar. Fale com a AMI para saber como.</p>`,
    );
    expect(link(html, "/associacao/seja-associado")).toContain(`class="botao ${estilos.fechoAcao}"`);
    expect(html).toContain(`Quero me associar ${desenho(ArrowRight, 20, "regular")}</a></div></div></section>`);
  });

  it("não traz Missão, visão e valores junto, como o bloco da home traria", () => {
    expect(html).not.toContain("Quem é a AMI?");
  });
});

async function pagina(chave: string) {
  vi.stubEnv("NEXT_PUBLIC_DADOS_DEMONSTRACAO", chave);
  vi.resetModules();
  const modulo = await import("@/app/(site)/associacao/page");
  return { html: await htmlDe(await modulo.default()), modulo };
}

const blocos = (html: string) => [...html.matchAll(/data-bloco="([^"]+)"/g)].map((m) => m[1]);

describe("a página A Associação", () => {
  it("na demonstração: os cinco blocos, na ordem do desenho", async () => {
    const { html } = await pagina("true");
    expect(html).toMatch(new RegExp(`^<div class="${estilosPagina.pagina}"><section data-bloco="topo"`));
    expect(blocos(html)).toEqual(["topo", "quem-somos", "diretoria", "saiba-mais", "associe"]);
    expect(html.match(/<h1\b/g)).toHaveLength(1);
  });

  it("os números da faixa saem dos dados: os anos de lib/ami.ts, os médicos e as especialidades do banco", async () => {
    const { html } = await pagina("true");
    expect(html).toContain(`>${anosDeAmi(new Date())}</span>`);
    expect(html).toContain(">24</span>");
    expect(html).toContain(">14</span>");
  });

  it("a diretoria em destaque: os quatro primeiros, e o link para a diretoria inteira", async () => {
    const { html } = await pagina("true");
    expect(html.match(/data-diretor=""/g)).toHaveLength(4);
    expect(html).toContain(">Diretor 4<");
    expect(html).not.toContain(">Diretor 5<");
  });

  it("na demonstração, as molduras: a apresentação, a foto, os três princípios e dois atalhos a entrar", async () => {
    const { html } = await pagina("true");
    expect(html).toContain('data-a-entrar="apresentação"');
    expect(html).toContain("Fotografia a entrar");
    expect(html.match(/Texto da AMI a entrar\./g)).toHaveLength(4);
    expect(html.match(/texto a entrar</g)).toHaveLength(2);
  });

  it("fora da demonstração, sem o Studio: nenhuma moldura, sem Princípios e sem Saiba mais (sobraria só Seja associado)", async () => {
    const { html } = await pagina("false");
    expect(blocos(html)).toEqual(["topo", "quem-somos", "diretoria", "associe"]);
    expect(html).not.toContain("data-a-entrar");
    expect(html).not.toContain("a entrar");
    expect(html).not.toContain("Princípios");
  });

  it("fora da demonstração, com o Estatuto publicado: Saiba mais com os dois que existem", async () => {
    dados.publicadas = ["/associacao/estatuto"];
    const { html } = await pagina("false");
    expect(blocos(html)).toContain("saiba-mais");
    expect(html.match(/data-atalho=""/g)).toHaveLength(2);
    expect(html).not.toContain("texto a entrar");
  });

  it("com a apresentação da AMI no Studio, ela sai nos dois modos", async () => {
    dados.associacao = {
      titulo: "A Associação Médica de Imperatriz",
      slug: "associacao",
      resumo: "A AMI, desde 1975.",
      atualizadoEm: "2026-11-01T12:00:00Z",
      corpo: [
        { _type: "block", _key: "a", style: "normal", markDefs: [], children: [{ _type: "span", _key: "s", text: "Texto oficial da AMI.", marks: [] }] },
      ],
    };
    for (const chave of ["true", "false"]) {
      expect((await pagina(chave)).html, chave).toContain("<p>Texto oficial da AMI.</p>");
    }
  });

  it("sem diretor publicado, o bloco da diretoria sai", async () => {
    dados.diretoria = [];
    const { html } = await pagina("true");
    expect(blocos(html)).not.toContain("diretoria");
  });

  it("o fecho é o último bloco: o rodapé emenda nele", async () => {
    for (const chave of ["true", "false"]) {
      expect((await pagina(chave)).html, chave).toMatch(/<section data-bloco="associe" data-faixa=""[\s\S]*<\/section><\/div>$/);
    }
  });

  it("nenhum PROVISÓRIO, Cabeceira, trilha ou BreadcrumbList", async () => {
    for (const chave of ["true", "false"]) {
      const { html } = await pagina(chave);
      expect(html, chave).not.toContain("PROVISÓRIO");
      expect(html, chave).not.toContain("Trilha de navegação");
      expect(html, chave).not.toContain("-mt-32");
      expect(html, chave).not.toContain("BreadcrumbList");
    }
  });

  it("os metadados continuam os de antes", async () => {
    const { modulo } = await pagina("true");
    const m = await modulo.generateMetadata();
    expect(m.title).toBe(tituloDePagina("A Associação Médica de Imperatriz"));
    expect(m.description).toBe("Quem é a AMI, o que faz e como se associar.");
    expect(m.alternates).toEqual({ canonical: "/associacao" });
  });
});

describe("o CSS dos blocos de baixo", () => {
  const css = semNotas(fonte("../components/associacao/SecoesDaAssociacao.module.css"));
  const cel = () => bloco(css, "@media (max-width: 700px)");

  it("os atalhos em três colunas, duas no tablet e uma no celular, valendo sobre a grade do índice", () => {
    expect(regra(base(css), ".atalhos[data-atalhos]")).toMatch(/grid-template-columns: repeat\(3, minmax\(0, 1fr\)\);/);
    expect(regra(bloco(css, "@media (max-width: 980px)"), ".atalhos[data-atalhos]")).toMatch(/repeat\(2, minmax\(0, 1fr\)\)/);
    expect(regra(cel(), ".atalhos[data-atalhos]")).toMatch(/grid-template-columns: 1fr;/);
    expect(regra(cel(), ".atalhos[data-atalhos]")).toMatch(/grid-auto-rows: auto;/);
  });

  it("a frase no pé, no cinza do texto, e a seta presa embaixo", () => {
    const r = regra(base(css), ".atalho .frase");
    expect(r).toMatch(/color: var\(--color-ink-600\);/);
    expect(r).toMatch(/font-weight: 500;/);
    expect(regra(base(css), ".atalho .pe")).toMatch(/align-items: flex-end;/);
  });

  it("o atalho a entrar não é link: o mouse não o ergue", () => {
    expect(regra(base(css), ".atalhos .atalho[data-a-entrar]:hover")).toMatch(/transform: none;/);
  });

  it("no celular, cada atalho numa linha: ícone, título com a frase embaixo, e a seta", () => {
    expect(regra(cel(), ".atalhos .atalho")).toMatch(/grid-template-columns: 40px minmax\(0, 1fr\) 28px;/);
    expect(regra(cel(), ".atalho .pe")).toMatch(/display: contents;/);
  });

  it("o fecho em duas colunas, uma do tablet para baixo", () => {
    expect(regra(base(css), ".fecho")).toMatch(/grid-template-columns: minmax\(0, 1\.15fr\) minmax\(0, 1fr\);/);
    expect(regra(bloco(css, "@media (max-width: 980px)"), ".fecho")).toMatch(/grid-template-columns: 1fr;/);
  });

  it("a etiqueta: cinza neutro, sem tom quente", () => {
    expect(regra(base(css), ".etiqueta")).toMatch(/background: var\(--color-surface-fundo\);/);
  });
});
```

Em `testes/caminhos-de-filiacao.test.ts` (LF):

1. Troque o comentário do topo e o dublê

```ts
  `/associacao` lê o documento "associacao" do Sanity; o dublê devolve
  `null`, que é o estado de hoje (dataset vazio) e o caso em que a página
  mostra o texto de reserva. Os caminhos saem nos dois casos.
*/

vi.mock("@/lib/sanity/consultas", () => ({
  paginaPorSlug: async () => null,
}));
```

por

```ts
  `/associacao` lê o Sanity (a apresentação e as páginas publicadas), a
  diretoria e o banco; os dublês devolvem tudo vazio, o estado de hoje do
  Sanity. O fecho da página leva a Seja associado em qualquer caso.
*/

vi.mock("@/lib/sanity/consultas", () => ({
  paginaPorSlug: async () => null,
  caminhosDePaginasPublicadas: async () => [],
}));
vi.mock("@/lib/dados/diretoria", () => ({ listarDiretoria: async () => [] }));
vi.mock("@/lib/dados/medicos", () => ({ buscarMedicos: async () => [] }));
vi.mock("@/lib/dados/especialidades", () => ({ especialidadesComContagem: async () => [] }));
```

2. Troque o nome do segundo `it`, `"/associacao lista Seja associado entre os caminhos"`, por `"/associacao leva a Seja associado"`. O corpo dele fica.

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run testes/associacao.test.ts testes/caminhos-de-filiacao.test.ts`
Expected: FAIL. Os blocos não existem, e a página é a antiga, com `Cabeceira`.

- [ ] **Step 3: O CSS dos blocos de baixo**

`components/associacao/SecoesDaAssociacao.module.css`:

```css
/*
  Os três blocos de baixo de A Associação, transcritos do desenho aprovado
  (docs/desenho-aprovado/associacao/associacao.html):
  - o cabeçalho de seção da home na versão aberta (`.cab-secao`,
    `.aberta .cab-secao`, `.cab-secao p`), da diretoria em destaque e de
    "Saiba mais";
  - os atalhos (`.atalhos`, `.atalho .esp-pe`, `.atalho .esp-conta`,
    `.atalho .etiqueta` com a `.etiqueta` da home, e o @media de 700px);
  - o fecho (`.fecho`, `.fecho h2`, `.fecho .texto`, `.fecho .acao`).
  E os @media de 980 e 700px.

  O atalho é o cartão do índice de especialidades
  (components/especialidades/GradeDeEspecialidades.module.css: `.grade`,
  `.cartao`, `.nome`, `.pe`, `.conta`, `.seta`), com uma frase no pé no
  lugar da contagem. As regras daqui valem sobre as de lá qualquer que seja
  a ordem das folhas: levam duas classes, ou classe e atributo
  (`.atalhos[data-atalhos]`), contra uma de lá.

  O atalho da página que ainda não existe ("texto a entrar", só na
  demonstração) não é link: ao passar o mouse, ele não sobe nem escurece a
  borda.

  A etiqueta usa o `surface-fundo` no lugar do #F3F4F6 do desenho, como a
  etiqueta de "Sua AMI" (components/home/SuaAmi.module.css).
*/

.cabSecao {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--gap);
  padding: 0 var(--m) 32px;
}

.cabSecao > div {
  min-width: 0;
}

.titulo {
  margin-top: 14px;
}

.texto {
  max-width: 34em;
  margin-top: 16px;
  color: var(--color-ink-600);
}

.atalhos[data-atalhos] {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.atalho .pe {
  align-items: flex-end;
}

.atalho .frase {
  max-width: 24em;
  font-size: 14.5px;
  font-weight: 500;
  line-height: 1.5;
  color: var(--color-ink-600);
}

.etiqueta {
  display: inline-block;
  margin-left: 8px;
  padding: 4px 10px;
  border-radius: 999px;
  background: var(--color-surface-fundo);
  color: var(--color-ink-600);
  font-family: var(--font-corpo);
  font-size: 11.5px;
  font-weight: 700;
  line-height: 1.4;
  letter-spacing: 0;
  vertical-align: 3px;
}

.atalhos .atalho[data-a-entrar]:hover {
  transform: none;
  border-color: var(--color-surface);
  box-shadow: var(--shadow-erguido);
}

.atalhos .atalho[data-a-entrar]:hover .seta {
  border-color: var(--color-line);
}

.atalhos .atalho[data-a-entrar]:hover .seta svg {
  transform: none;
}

.fecho {
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr);
  gap: var(--m);
  align-items: end;
}

.fecho > div {
  min-width: 0;
}

.fechoTitulo {
  max-width: 18ch;
  margin-top: 14px;
}

.fechoTexto {
  max-width: 28em;
  color: var(--color-ink-600);
}

.fechoAcao {
  margin-top: 24px;
}

@media (max-width: 980px) {
  .cabSecao {
    flex-direction: column;
    align-items: flex-start;
    padding-bottom: 24px;
  }

  .atalhos[data-atalhos] {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .fecho {
    grid-template-columns: 1fr;
    gap: 20px;
  }
}

@media (max-width: 700px) {
  .cabSecao {
    gap: 14px;
    padding: 0 var(--m) 20px;
  }

  .atalhos[data-atalhos] {
    grid-template-columns: 1fr;
    grid-auto-rows: auto;
    gap: 10px;
  }

  .atalhos .atalho {
    display: grid;
    grid-template-columns: 40px minmax(0, 1fr) 28px;
    column-gap: 14px;
    align-items: center;
    padding: 16px;
    border-radius: 16px;
  }

  .atalho :global(.ladrilho-icone) {
    grid-row: 1 / 3;
    align-self: start;
  }

  .atalho .nome {
    grid-column: 2;
    margin: 0;
    font-size: 17px;
    line-height: 1.2;
  }

  .atalho .pe {
    display: contents;
  }

  .atalho .frase {
    grid-column: 2;
    grid-row: 2;
    margin-top: 4px;
    font-size: 14px;
    line-height: 1.45;
  }

  .atalho .seta {
    grid-column: 3;
    grid-row: 1 / 3;
    width: 28px;
    height: 28px;
  }

  .etiqueta {
    margin-left: 6px;
    vertical-align: 2px;
  }

  .fechoAcao {
    margin-top: 18px;
  }
}
```

- [ ] **Step 4: Os três blocos**

`components/associacao/DiretoriaEmDestaque.tsx`:

```tsx
import Link from "next/link";
import { Icone } from "@/components/base/Icone";
import styles from "@/components/associacao/SecoesDaAssociacao.module.css";
import { GradeDeDiretores } from "@/components/diretorio/GradeDeDiretores";
import type { Diretor } from "@/lib/dados/diretoria";

/*
  A diretoria em destaque, aberta sobre o fundo da página de A Associação:
  o cabeçalho de seção da home ("DIRETORIA", "Quem responde pela AMI", a
  frase e o botão-linha "Ver a diretoria") e os cartões de diretor, os
  mesmos da página da diretoria. Quem escolhe os diretores é a página
  (`diretoriaEmDestaque`, lib/associacao.ts).
*/
export function DiretoriaEmDestaque({ diretores }: { diretores: Diretor[] }) {
  return (
    <section data-bloco="diretoria" aria-labelledby="diretoria-titulo">
      <div className={styles.cabSecao}>
        <div>
          <span className="rotulo-secao" data-coluna="">
            Diretoria
          </span>
          <h2 id="diretoria-titulo" className={styles.titulo}>
            Quem responde pela AMI
          </h2>
          <p className={styles.texto}>Cada nome traz o número de inscrição no CRM.</p>
        </div>
        <Link className="botao-linha" href="/associacao/diretoria">
          Ver a diretoria <Icone nome="seta" />
        </Link>
      </div>
      <GradeDeDiretores diretores={diretores} />
    </section>
  );
}
```

`components/associacao/SaibaMais.tsx`:

```tsx
import Link from "next/link";
import { Icone, LadrilhoIcone } from "@/components/base/Icone";
import styles from "@/components/associacao/SecoesDaAssociacao.module.css";
import grade from "@/components/especialidades/GradeDeEspecialidades.module.css";
import type { Atalho } from "@/lib/associacao";

/*
  "Saiba mais": atalhos para as páginas de texto da associação, no desenho
  do cartão do índice de especialidades (ladrilho, título, uma frase e a
  seta no pé). Quem decide quais aparecem é a página
  (`atalhosDoSaibaMais`, lib/associacao.ts).

  O atalho de uma página que existe leva a ela pelo cartão inteiro (o link
  do título, esticado em CSS). O de uma página que ainda não existe, que só
  sai na demonstração, não é link, e leva a etiqueta "texto a entrar"
  (`data-a-entrar`).

  Marcas para a auditoria visual: `data-atalho`, `data-nome` e `data-seta`.
*/
export function SaibaMais({ atalhos }: { atalhos: Atalho[] }) {
  return (
    <section data-bloco="saiba-mais" aria-labelledby="saiba-mais-titulo">
      <div className={styles.cabSecao}>
        <div>
          <span className="rotulo-secao" data-coluna="">
            A Associação
          </span>
          <h2 id="saiba-mais-titulo" className={styles.titulo}>
            Saiba mais
          </h2>
        </div>
      </div>

      <ul className={`${grade.grade} ${styles.atalhos}`} data-atalhos="">
        {atalhos.map((a) => (
          <li
            key={a.caminho}
            className={`${grade.cartao} ${styles.atalho}`}
            data-atalho=""
            data-a-entrar={a.aEntrar ? "" : undefined}
          >
            <LadrilhoIcone nome={a.icone} />
            <h3 className={`${grade.nome} ${styles.nome}`} data-nome="">
              {a.aEntrar ? a.titulo : <Link href={a.caminho}>{a.titulo}</Link>}
              {a.aEntrar ? <span className={styles.etiqueta}>texto a entrar</span> : null}
            </h3>
            <p className={`${grade.pe} ${styles.pe}`}>
              <span className={`${grade.conta} ${styles.frase}`}>{a.frase}</span>
              <span className={`${grade.seta} ${styles.seta}`} aria-hidden="true" data-seta="">
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

`components/associacao/FechoAssocie.tsx`:

```tsx
import Link from "next/link";
import { Icone } from "@/components/base/Icone";
import styles from "@/components/associacao/SecoesDaAssociacao.module.css";
import associe from "@/components/home/SejaAssociado.module.css";
import { CONVITE_PARA_ASSOCIAR } from "@/lib/associacao";

/*
  O fecho de A Associação: uma faixa branca de ponta a ponta, curta, em
  duas colunas, com o texto aprovado da faixa "Seja associado" da home
  (`CONVITE_PARA_ASSOCIAR`, lib/associacao.ts) e o botão "Quero me
  associar".

  Não é o componente `SejaAssociado` inteiro: ele traz junto "Quem é a
  AMI?" e os cartões de Missão, visão e valores, que esta página já mostra
  em "Quem somos".

  É o último bloco da página e é faixa (`data-faixa`): o rodapé emenda nele
  (components/layout/Rodape.module.css). Entra na tela com a `.revelar`.
*/
export function FechoAssocie() {
  return (
    <section
      data-bloco="associe"
      data-faixa=""
      aria-labelledby="associe-titulo"
      className={`revelar ${associe.faixa}`}
    >
      <div className={styles.fecho}>
        <div>
          <span className="rotulo-secao" data-coluna="">
            Seja associado
          </span>
          <h2 id="associe-titulo" className={styles.fechoTitulo}>
            {CONVITE_PARA_ASSOCIAR.titulo}
          </h2>
        </div>
        <div>
          <p className={styles.fechoTexto}>{CONVITE_PARA_ASSOCIAR.texto}</p>
          <Link className={`botao ${styles.fechoAcao}`} href="/associacao/seja-associado">
            Quero me associar <Icone nome="seta" />
          </Link>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 5: A página**

Reescreva `app/(site)/associacao/page.tsx` (LF; leia antes) inteiro:

```tsx
import type { Metadata } from "next";
import paginas from "@/app/(site)/encontre.module.css";
import { DiretoriaEmDestaque } from "@/components/associacao/DiretoriaEmDestaque";
import { FaixaDaAssociacao } from "@/components/associacao/FaixaDaAssociacao";
import { FechoAssocie } from "@/components/associacao/FechoAssocie";
import { QuemSomos } from "@/components/associacao/QuemSomos";
import { SaibaMais } from "@/components/associacao/SaibaMais";
import { anosDeAmi } from "@/lib/ami";
import { apresentacaoDaAssociacao, atalhosDoSaibaMais, diretoriaEmDestaque } from "@/lib/associacao";
import { listarDiretoria } from "@/lib/dados/diretoria";
import { especialidadesComContagem } from "@/lib/dados/especialidades";
import { buscarMedicos } from "@/lib/dados/medicos";
import { DADOS_DEMONSTRACAO } from "@/lib/demonstracao";
import { TEXTO_INSTITUCIONAL } from "@/lib/molduras";
import { RASCUNHOS_DE_ASSOCIACAO } from "@/lib/rascunhosLegais";
import { caminhosDePaginasPublicadas, paginaPorSlug } from "@/lib/sanity/consultas";
import { tituloDePagina } from "@/lib/seo/metadados";

export const revalidate = 3600;

/* Título e resumo de reserva. O documento "associacao" do Studio tem
   `titulo` e `resumo` obrigatórios, e eles mandam quando existem: sem isso
   a AMI preencheria dois campos obrigatórios e não veria efeito nenhum. */
const TITULO = "A Associação Médica de Imperatriz";
const RESUMO_PADRAO = "Quem é a AMI, o que faz e como se associar.";

/* As páginas da associação que têm rascunho em código: existem mesmo sem
   documento no Studio (hoje, Seja associado). */
const COM_RASCUNHO = Object.keys(RASCUNHOS_DE_ASSOCIACAO).map((slug) => `/associacao/${slug}`);

export async function generateMetadata(): Promise<Metadata> {
  const conteudo = await paginaPorSlug("associacao");
  return {
    title: tituloDePagina(conteudo?.titulo ?? TITULO),
    description: conteudo?.resumo ?? RESUMO_PADRAO,
    alternates: { canonical: "/associacao" },
  };
}

/*
  A página institucional (item "A Associação" do menu), na ordem do desenho
  aprovado:
  - a faixa verde, com o título, a apresentação curta e os três números;
  - "Quem somos": a apresentação oficial, a sede e Missão, visão e valores;
  - a diretoria em destaque, com o link para a diretoria inteira;
  - "Saiba mais": atalhos para Seja associado, Estatuto e Política
    editorial;
  - o fecho, com o convite para se associar.

  Ela nunca dá 404: a navegação da seção existe mesmo no dia em que a AMI
  não publicou texto nenhum. O que falta segue a trava da demonstração
  (lib/associacao.ts e lib/molduras.ts): na demonstração, sai como moldura
  "a entrar"; fora dela, some, e os blocos que ficam sem conteúdo saem
  inteiros.

  A apresentação oficial é o texto do documento "associacao" do Studio
  (tipo "Página institucional"); o título e o resumo dele vão para os
  metadados. Uma página existe, para "Saiba mais", quando está publicada no
  Studio ou tem rascunho em código.

  Sem `Cabeceira`, sem trilha e sem BreadcrumbList: dado estruturado sem o
  equivalente visível é marcação enganosa (lib/seo/jsonld.ts). Os blocos
  são filhos diretos de `.pagina` (app/(site)/encontre.module.css), a
  --ritmo um do outro; o fecho é faixa, e o rodapé emenda nele.
*/
export default async function PaginaAssociacao() {
  /* O total de médicos vem da contagem de profissionais, e não da soma por
     especialidade, que conta duas vezes quem tem duas, como na home. */
  const [conteudo, publicadas, diretoria, especialidades, medicos] = await Promise.all([
    paginaPorSlug("associacao"),
    caminhosDePaginasPublicadas(),
    listarDiretoria(),
    especialidadesComContagem(),
    buscarMedicos().then((m) => m.length),
  ]);

  const destaque = diretoriaEmDestaque(diretoria);
  const atalhos = atalhosDoSaibaMais(DADOS_DEMONSTRACAO, [...publicadas, ...COM_RASCUNHO]);

  return (
    <div className={paginas.pagina}>
      <FaixaDaAssociacao
        anos={anosDeAmi(new Date())}
        medicos={medicos}
        especialidades={especialidades.length}
      />
      <QuemSomos
        demonstracao={DADOS_DEMONSTRACAO}
        apresentacao={apresentacaoDaAssociacao(DADOS_DEMONSTRACAO, conteudo?.corpo)}
        texto={TEXTO_INSTITUCIONAL}
      />
      {destaque.length > 0 ? <DiretoriaEmDestaque diretores={destaque} /> : null}
      {atalhos.length > 0 ? <SaibaMais atalhos={atalhos} /> : null}
      <FechoAssocie />
    </div>
  );
}
```

- [ ] **Step 6: Os comentários que falam das páginas**

1. Em `components/layout/Cabeceira.tsx` (CRLF), troque o primeiro parágrafo do comentário (o que a Task 5 escreveu):

```
  Cabeceira das páginas internas que ainda não ganharam o desenho novo, como
  A Associação, o contato e as notícias. A busca, o perfil do médico, as
  páginas de especialidades, a diretoria e as páginas de texto não a usam:
  o cliente a recusou, e elas abrem com o desenho delas.
```

por

```
  Cabeceira das páginas internas que ainda não ganharam o desenho novo: o
  contato e as notícias. A busca, o perfil do médico, as páginas de
  especialidades, as de A Associação e as páginas de texto não a usam: o
  cliente a recusou, e elas abrem com o desenho delas.
```

2. Em `components/layout/Rodape.module.css` (CRLF), troque (o texto da Task 3):

```
  nas páginas de texto, o corpo. A regra pergunta se o último elemento do
```

por

```
  nas páginas de texto, o corpo; em A Associação, o fecho. A regra
  pergunta se o último elemento do
```

3. `grep -rn "Cabeceira" app components`. Só podem sobrar o contato, as notícias, o próprio `Cabeceira.tsx` e comentários que dizem que a página **não** a usa.

- [ ] **Step 7: Rodar, provar por mutação, conferir, commit**

Run: `npx vitest run` · `npx tsc --noEmit` · `npm run build` → verde.

Mutações, uma de cada vez, regravando o original depois:

1. Na página, troque `atalhosDoSaibaMais(DADOS_DEMONSTRACAO, …)` por `atalhosDoSaibaMais(true, …)`.
2. Na página, tire `...COM_RASCUNHO`.
3. Na página, troque `diretoriaEmDestaque(diretoria)` por `diretoria`.
4. Na página, troque `destaque.length > 0 ?` por `true ?` (com a diretoria vazia, o bloco sai sem cartão).
5. Em `SaibaMais`, troque `a.aEntrar ? a.titulo : <Link…>` por sempre o `<Link>`.
6. No fecho, tire `data-faixa=""`.
7. No CSS, troque `.atalhos[data-atalhos]` por `.atalhos` (nas quatro regras).
8. No CSS, tire a regra `.atalhos .atalho[data-a-entrar]:hover`.

Conferência rápida no navegador:
1. `npm run build` e `npx next start -p 3300`.
2. Abra `/associacao` a 1440 e a 390px.
3. Expected: igual a `docs/desenho-aprovado/associacao/associacao-1440-parte-1.jpg` a `-parte-3.jpg` e `associacao-390-parte-1.jpg` a `-parte-3.jpg`, com as iniciais no lugar das fotos do Unsplash e "Ver a diretoria" no lugar de "Ver a diretoria completa".
4. Derrube o 3300 pelo PID.

```bash
git add components/associacao/DiretoriaEmDestaque.tsx components/associacao/SaibaMais.tsx components/associacao/FechoAssocie.tsx components/associacao/SecoesDaAssociacao.module.css "app/(site)/associacao/page.tsx" components/layout/Cabeceira.tsx components/layout/Rodape.module.css testes/caminhos-de-filiacao.test.ts testes/associacao.test.ts
git commit -m "A Associacao: diretoria em destaque, Saiba mais com os atalhos que existem, fecho Seja associado e a pagina sem Cabeceira nem BreadcrumbList"
```

---

### Task 8: A conferência

**Files:**
- Modify: `scripts/auditoria-visual.js` (CRLF)
- Modify: `vitest.config.ts` (CRLF; só o comentário)
- Modify: `docs/estado-do-projeto.md` (CRLF)
- Modify: `docs/decisoes-sem-o-cliente.md` (LF)

- [ ] **Step 1: A auditoria confere os atalhos e o índice**

Em `scripts/auditoria-visual.js`:

(a) No comentário do topo:
- Troque a linha (que a Task 7 do plano Especialidades escreveu)

```
  Nas páginas com `data-bloco` (a home, a busca, o perfil e as de especialidades):
```

por

```
  Nas páginas com `data-bloco` (a home, a busca, o perfil, as de
  especialidades, as de A Associação e as de texto):
```

- Depois do item dos cartões do índice de especialidades, que termina na linha ``    (`data-cartao-de-especialidade`, `data-nome`, `data-contagem`);``, acrescente:

```
  - os atalhos de "Saiba mais" (A Associação): em cada fileira, a mesma
    altura, e o título e a seta na mesma linha (`data-atalho`, `data-nome`,
    `data-seta`);
  - o índice "Nesta página" das páginas de texto: rolando até cada título,
    o item dele fica marcado (`aria-current`), e no fim da página o último
    (`data-nesta-pagina`);
```

(b) Logo depois de `info.alturaDosCartoesDeEspecialidade = [...new Set(alturasDeEsp)].join("/");` (o fim da conferência 14), acrescente:

```js

  /* 15. Os atalhos de "Saiba mais": em cada fileira, a mesma altura, e o
     título e a seta na mesma linha. No celular cada atalho é uma fileira,
     e a altura acompanha a frase. */
  const fileirasDeAtalhos = new Map();
  for (const c of document.querySelectorAll("[data-atalho]")) {
    if (R(c).height === 0) continue;
    const topo = Math.round(topoAbs(c));
    if (!fileirasDeAtalhos.has(topo)) fileirasDeAtalhos.set(topo, []);
    fileirasDeAtalhos.get(topo).push({
      altura: Math.round(R(c).height * 10) / 10,
      nome: Math.round(topoAbs(c.querySelector("[data-nome]")) * 10) / 10,
      seta: Math.round(topoAbs(c.querySelector("[data-seta]")) * 10) / 10,
    });
  }
  for (const [topo, cs] of fileirasDeAtalhos) {
    for (const medida of ["altura", "nome", "seta"]) {
      const xs = cs.map((c) => c[medida]);
      if (espalha(xs) > 0.5)
        problemas.push(`atalhos com ${medida} desigual na fileira de ${topo}px: ${xs.join("/")}`);
    }
  }
  info.fileirasDeAtalhos = fileirasDeAtalhos.size;

  /* 16. O índice "Nesta página" das páginas de texto: rolando até cada
     título (20px acima da linha de leitura, 140px, lib/nestaPagina.ts), o
     item dele fica marcado; no fim da página, o último. Só onde o índice
     da lateral aparece (acima de 980px). */
  const indice = document.querySelector("[data-nesta-pagina]");
  if (indice && visivel(indice)) {
    const links = [...indice.querySelectorAll("a")];
    const marcado = () => links.findIndex((l) => l.getAttribute("aria-current") === "location");
    const marcados = [];
    for (const [i, a] of links.entries()) {
      const alvo = document.getElementById(a.hash.slice(1));
      if (!alvo) {
        problemas.push(`índice aponta para âncora que não existe: ${a.hash}`);
        continue;
      }
      await rolar(topoAbs(alvo) - 120, 250);
      const noFim = innerHeight + scrollY >= raiz.scrollHeight - 4;
      marcados.push(marcado());
      if (marcado() !== i && !noFim)
        problemas.push(`índice: rolando até "${a.textContent}", o marcado é o ${marcado()}`);
    }
    await rolar(raiz.scrollHeight, 250);
    if (marcado() !== links.length - 1)
      problemas.push(`índice: no fim da página, o marcado é o ${marcado()}`);
    await rolar(0, 250);
    info.nestaPagina = marcados.join("/");
  }
```

`espalha`, `R`, `topoAbs`, `visivel`, `rolar` e `raiz` já existem no script (a `espalha` é da conferência 14).

- [ ] **Step 2: O comentário do Vitest**

Em `vitest.config.ts`, no fim do comentário, troque (o texto da Task 7 do plano Especialidades)

```
   trocadas por dublês; `testes/blocos-da-especialidade.test.ts`, os três
   blocos da página da especialidade, com `renderToString`. */
```

por

```
   trocadas por dublês; `testes/blocos-da-especialidade.test.ts`, os três
   blocos da página da especialidade, com `renderToString`.
   `testes/modelo-de-texto.test.ts`, `testes/seja-associado.test.ts`,
   `testes/diretoria-na-tela.test.ts` e `testes/associacao.test.ts`
   renderizam as páginas de A Associação e as de texto com `htmlDe`, com o
   Sanity, a diretoria e o banco trocados por dublês. */
```

- [ ] **Step 3: Produção, nas 8 larguras, com as duas chaves**

`npm run build` e `npx next start -p 3300`.

Rode a auditoria em cada página e largura:
- Cole `scripts/auditoria-visual.js` no console ou use a ferramenta de navegador, esperando a promessa.
- A página precisa estar recém-aberta, sem rolar.
- Abra cada página por endereço, e não pelo menu, antes de cada rodada: a conferência 12 navega e termina noutra página.

Com a chave de hoje (demonstração):
- Páginas:
  - `/associacao`;
  - `/associacao/diretoria`;
  - `/associacao/seja-associado`;
  - `/politica-de-privacidade`, `/termos-de-uso`, `/politica-de-cookies`;
  - para conferir que nada regrediu: `/`, `/busca`, `/medicos`, `/medicos/cardiologia` e `/contato`.
- Larguras: 375, 390, 430, 768, 1024, 1280, 1440, 1920.

Depois, `NEXT_PUBLIC_DADOS_DEMONSTRACAO=false npm run build` e `npx next start -p 3300`. Rode a auditoria em `/associacao`, `/associacao/diretoria`, `/associacao/seja-associado` e `/politica-de-privacidade` nas mesmas 8 larguras. No fim, refaça o build com a chave de hoje.

**Expected: `problemas: []` em todas.**

| Medida | O que conferir |
|---|---|
| `colunaTexto` | o mesmo número em todos os blocos e no rodapé: 172 a 1440, 72 a 1024, 52 a 768, 32 a 390 (relatório do desenho) |
| `espacosEntreBlocos` | a `--ritmo` (72, 56 ou 32) entre todos os blocos (relatório: `72 · 72 · 72 · 72 · 72` em `/associacao`) |
| `ultimoAoRodape` | 0 em `/associacao` e nas páginas de texto (faixa); a `--ritmo` em `/associacao/diretoria` |
| `fileirasDeCartoes` | os "Ver perfil" (ou o espaço deles) de cada fileira na mesma altura, em `/associacao` e na diretoria |
| `fileirasDeAtalhos` | os atalhos de `/associacao` alinhados (1 fileira acima de 980px; 2 de 701 a 980px; 3 no celular) |
| `nestaPagina` | `0/1/2…` nas páginas de texto acima de 980px; nas de menos de dois títulos, ausente |
| `aberturas` | 0 em todas |

Guarde estes números para o estado do projeto:
- `espacosEntreBlocos`;
- `colunaTexto`;
- `colunaDoLogo`;
- `ultimoAoRodape`;
- `fileirasDeCartoes`;
- `fileirasDeAtalhos`;
- `nestaPagina`;
- `aberturas`.

Corrija o que aparecer na tarefa de origem, com um commit de correção com o nome dela.

- [ ] **Step 4: Contraste medido**

1. A régua do desenho mede cada trecho de texto contra os pixels de verdade atrás dele: rode `node .superpowers/brainstorm/fatia-b-associacao/ferramentas/contraste.mjs http://localhost:3300/<página> <largura>` em `/associacao`, `/associacao/diretoria` e `/associacao/seja-associado`, a 1440 e a 390, com as duas chaves. Expected: nenhum trecho abaixo de 4,5:1 (3:1 para texto grande).
2. A régua para a luz parada na posição inicial. Para o pior caso, use o método da fatia A, a 1440, 768, 430 e 320px: a luz parada no ponto mais claro do caminho dela, com o grão médio. Meça:
   - o rótulo "A ASSOCIAÇÃO" e o link "← A ASSOCIAÇÃO" / "← INÍCIO" (o lima, e o lima clareado abaixo de 700px);
   - o parágrafo `#cfd8c9` da faixa de A Associação (31em) e o das faixas curtas (34em), que passam mais perto da luz do canto que o texto da busca;
   - os rótulos dos números (`#DDE7D6`);
   - na pílula do mandato, "Gestão" (`#DDE7D6`) e "(período a entrar)" (`#B9C6B2`).
3. No branco e no cinza claro, meça: `ink-400` da data, do título do índice e do texto a entrar (o relatório mediu 5,38); `ink-600` sobre o `surface-fundo` do quadro e da etiqueta; `ink-600` e `ami-green-800` sobre o `canvas` do quadro "Fale com a AMI".

Expected: ≥ 4,5:1 em todos. Se o parágrafo `#cfd8c9` ficar abaixo, vale o Ruling 7 do diário de Especialidades: suba a opacidade do texto na folha da busca, sem parar, e registre a medida. Se for uma das cores novas desta fatia (`#DDE7D6`, `#B9C6B2`), clareie-a na folha desta fatia e registre.

- [ ] **Step 5: Fotos comparadas com o desenho**

Fotos da página inteira, com `node .superpowers/brainstorm/fatia-b-associacao/ferramentas/foto.mjs <url> <largura> <altura-máxima-da-parte> <prefixo>` (1600 no computador, 2000 no celular; o prefixo numa pasta do scratchpad). Para o índice aberto, rode com `ANTES='document.querySelector("details").open=true'`. Compare, seção por seção:

| Foto do site | Desenho |
|---|---|
| `/associacao` a 1440, demonstração | `docs/desenho-aprovado/associacao/associacao-1440-parte-1.jpg` a `-parte-3.jpg` |
| `/associacao` a 390, demonstração | `associacao-390-parte-1.jpg` a `-parte-3.jpg` |
| `/associacao` a 1440, chave `false` | `associacao-1440-sem-conteudo-parte-1.jpg` e `-parte-2.jpg` |
| `/associacao` a 390, chave `false` | `associacao-390-sem-conteudo-parte-1.jpg` e `-parte-2.jpg` |
| `/associacao/diretoria` a 1440 e a 390 | `diretoria-1440-parte-1.jpg`, `-parte-2.jpg` e `diretoria-390-parte-1.jpg` |
| `/associacao/seja-associado` a 1440 e a 390 | `seja-associado-1440-parte-1.jpg`, `-parte-2.jpg`, `seja-associado-390-parte-1.jpg` e `-parte-2.jpg` |
| `/associacao/seja-associado` a 390, índice aberto | `seja-associado-390-indice-aberto.jpg` |

Não são diferença:
- o desenho tem fotos do Unsplash nos diretores, e o site tem as iniciais de quem não mandou foto;
- o desenho tem a faixa escura "Desenho para aprovação" no alto, que não existe no site;
- o botão da diretoria em destaque diz "Ver a diretoria", e não "Ver a diretoria completa" (spec, seção 1.4);
- a tarja da foto da sede diz "Fotografia a entrar: Fachada da sede da AMI", o rótulo do pedido de foto (`lib/imagens.ts`);
- os atalhos "texto a entrar" não são links (no desenho, `href="#"`): a aparência parada é a mesma.

O cartão de diretor sem perfil (`diretoria-1440-sem-perfil.jpg`) não tem foto nesta fatia: a diretoria de teste tem perfil para os quatro. O que prova o desenho dele é o teste de renderização (Task 5) e o CSS transcrito.

Qualquer outra diferença é defeito: medida, cor, ordem, alinhamento, quebra ou texto. Corrija na tarefa de origem.

- [ ] **Step 6: As varreduras**

No 3300, com a chave de hoje, `curl -s` de `/associacao`, `/associacao/diretoria`, `/associacao/seja-associado`, `/politica-de-privacidade`, `/termos-de-uso` e `/politica-de-cookies`. Tirando o `<script type="application/ld+json">`, nenhuma ocorrência de:
- "PROVISÓRIO";
- "Trilha de navegação";
- "BreadcrumbList" (nem dentro do JSON-LD).

Com a chave `false`, nas mesmas páginas, também nenhuma de:
- `data-a-entrar`;
- "a entrar".

Derrube o 3300 pelo PID.

- [ ] **Step 7: O estado do projeto**

Em `docs/estado-do-projeto.md`:

(a) Depois da seção "### Especialidades — fatia B, grupo 2 (o índice e a página de cada especialidade)" (que a Task 7 do plano Especialidades escreveu) e antes de "## O que falta", acrescente a seção "### A Associação — fatia B, grupo 3 (a página institucional, a diretoria e as páginas de texto)". Ela tem:

- **Onde está:** ramo `paginas-encontre`, desenho em [`docs/desenho-aprovado/associacao/`](desenho-aprovado/associacao/), decisões em [`docs/superpowers/specs/2026-10-03-associacao-design.md`](superpowers/specs/2026-10-03-associacao-design.md) e em [`docs/decisoes-sem-o-cliente.md`](decisoes-sem-o-cliente.md).
- **O que mudou no site:**
  - `/associacao`, `/associacao/diretoria`, Seja associado e os três textos legais novos, sem a cabeceira cinza, sem trilha e sem `BreadcrumbList`;
  - A Associação: faixa verde com os três números, "Quem somos" com a sede, "Como chegar" e o telefone, Missão, visão e valores, a diretoria em destaque, "Saiba mais" e o convite para se associar;
  - a diretoria nos cartões da busca, com o cargo e "Ver perfil";
  - as páginas de texto num modelo só: faixa verde curta, corpo em coluna de leitura, índice "Nesta página" e o aviso de rascunho em cinza neutro;
  - Seja associado com o quadro "Fale com a AMI" e os dados da entidade em lista;
  - nenhum "[PROVISÓRIO]" na tela: o que falta nos rascunhos aparece como "a entrar" só no modo demonstração;
  - a `Cabeceira` e o `Breadcrumb` continuam só no contato e nas notícias; a `Placa` saiu.
- **O que a AMI precisa saber:**
  - "Saiba mais" mostra Estatuto e Política editorial só quando a página existir no Studio;
  - fora do modo demonstração, o que a AMI ainda não entregou some da página em vez de aparecer vazio: a apresentação, a foto da sede, Missão, visão e valores e o período da gestão;
  - o WhatsApp entra em "Fale com a AMI" quando a AMI confirmar o número.
- **Pendências do cliente.** Passo a passo, com o nome de cada botão, no mesmo formato da seção do grupo 1:
  1. **A apresentação oficial.** Abrir `/studio`, entrar com a conta do Sanity, clicar em **Página institucional** e, no alto da lista, no botão de criar documento novo. Preencher **Título** ("A Associação Médica de Imperatriz"), **Endereço** (`associacao`), **Resumo** (de 60 a 220 caracteres; aparece na busca do Google), **Atualizado em** e **Texto** (a apresentação), e clicar em **Publicar**. Abrir `/associacao`: o texto aparece em "Quem somos", no lugar de "Texto da AMI a entrar.".
  2. **Estatuto e Política editorial.** Os mesmos passos, com **Endereço** `estatuto` e, depois, `politica-editorial`. Publicada, a página ganha o link em "Saiba mais".
  3. **O webhook.** Em [sanity.io/manage](https://www.sanity.io/manage), projeto da AMI, **API**, **Webhooks**, o webhook do site, campo **Filter**: vazio, nada a fazer; com uma lista de tipos, conferir que `"paginaInstitucional"` está nela, e acrescentar se não estiver. Sem isso, a página publicada demora até uma hora para aparecer.
  4. **A foto da sede.** Pedir à AMI a foto descrita em `lib/imagens.ts` (`ESPACOS.sede`, campo `precisa`). Quem receber salva em `public/imagens/sede-ami.jpg` e troca `provisoria` para `false` no mesmo lugar.
  5. **Missão, visão e valores.** Pedir à AMI os três textos. Eles entram em `lib/molduras.ts` (`TEXTO_INSTITUCIONAL`), e aparecem na home e em A Associação.
  6. **O período da gestão** da diretoria atual (ver a dúvida 1 abaixo).
  7. **O WhatsApp:** perguntar se o celular (99) 98802-0205 atende por WhatsApp.
- **Os números medidos** no Step 3, colados da saída, e os contrastes do Step 4.
- **As dúvidas em aberto:** a lista do fim deste plano, com o que o controlador ou o cliente decidiram, se já decidiram.

(b) Na seção "## O que falta", item "### 1. Conteúdo da AMI":
- troque

```
**Três páginas de texto** ainda não existem, criadas em `/studio`, tipo "Página institucional". Enquanto não existirem, três endereços dão 404 e há links quebrados na página da associação.
```

por

```
**Três páginas de texto** ainda não existem, criadas em `/studio`, tipo "Página institucional". Enquanto não existirem, os três endereços dão 404, e a página A Associação não leva a eles: no modo demonstração, Estatuto e Política editorial aparecem em "Saiba mais" com a etiqueta "texto a entrar", sem link; fora dele, não aparecem.
```

- troque o fim do item de Missão, Visão e Valores

  ```
  Ainda não há campo no Studio para eles: o texto entra hoje em `app/(site)/page.tsx` (`TEXTO_DA_AMI`)
  ```

  por

  ```
  A página A Associação mostra os mesmos três cartões em "Princípios", e sem texto, fora do modo demonstração, o bloco some. Ainda não há campo no Studio para eles: o texto entra hoje em `lib/molduras.ts` (`TEXTO_INSTITUCIONAL`)
  ```

- troque `- **O texto de Seja associado**, que hoje é provisório e marcado como tal` por `- **O texto de Seja associado**, que hoje é provisório e marcado como tal. O valor da anuidade, os benefícios e os critérios de admissão aparecem como "texto da AMI a entrar." no modo demonstração e somem fora dele`;
- acrescente, depois desse item:

  ```
  - **A apresentação oficial da AMI**, em `/studio`, tipo "Página institucional", endereço `associacao`: o texto de "Quem somos" na página A Associação
  ```

- troque o parágrafo

```
As fotos da **fachada da sede** (`sede`) e da **vista de Imperatriz** (`cidade`) continuam declaradas em `lib/imagens.ts`, mas **saíram da home** na reforma. Elas ficam para a página da Associação, na fatia B, e **não entram no pedido de material à AMI agora**: pedir foto que nenhuma página usa é pedir trabalho à toa.
```

por

```
A foto da **fachada da sede** (`sede`) voltou a ter lugar: é a de "Quem somos", na página A Associação, e **entra no pedido de material à AMI** (o que ela precisa ter está em `lib/imagens.ts`). Sem ela, fora do modo demonstração, o bloco fica só com o texto, em duas colunas. A **vista de Imperatriz** (`cidade`) continua declarada e sem uso, e **não entra no pedido agora**: pedir foto que nenhuma página usa é pedir trabalho à toa.
```

(c) No item "### 2. Dados reais da AMI", troque `- **Qual dos dois telefones é WhatsApp**, se algum for. Não foi suposto: botão apontando para linha que não atende por lá é pior que não ter botão` por `- **Qual dos dois telefones é WhatsApp**, se algum for. Não foi suposto: botão apontando para linha que não atende por lá é pior que não ter botão. Confirmado, o botão entra em "Fale com a AMI", em Seja associado` e acrescente, depois dele, `- **O período da gestão da diretoria atual**: a faixa da diretoria tem o lugar dele, e hoje mostra "Gestão (período a entrar)" só no modo demonstração`.

Números medidos, não lembrados: cada número que entrar ali saiu de uma rodada desta tarefa.

- [ ] **Step 8: As decisões sem o cliente**

Em `docs/decisoes-sem-o-cliente.md`, na seção "## Grupo 3: A Associação":

1. Troque o item 3

```
3. **Mandato da diretoria:** o campo não existe, e não criei. Ele aparece só no modo demonstração, como moldura.
```

por

```
3. **Mandato da diretoria:** o banco já tem as colunas de início e fim do mandato (`mandato_inicio` e `mandato_fim`, na tabela `diretoria`), vazias; o site não as lê, e não criei campo novo. O período aparece só no modo demonstração, como moldura "Gestão (período a entrar)".
```

2. Troque o item 7

```
7. **Números 01/02/03 de Missão, visão e valores:** ficaram mais escuros, também na home, para ficarem legíveis.
```

por

```
7. **Números 01/02/03 de Missão, visão e valores:** mais escuros, para ficarem legíveis. Na home eles já estavam assim desde a reforma visual; a página A Associação usa os mesmos cartões.
```

3. Depois do item 8, acrescente:

```
9. **Diretoria em destaque:** a página A Associação mostra os quatro primeiros da diretoria, na ordem da AMI. A lista inteira fica em "Ver a diretoria".
10. **"Saiba mais" no modo demonstração:** Estatuto e Política editorial aparecem com a etiqueta "texto a entrar", sem link, porque as páginas ainda não existem.
11. **Textos legais:** usam o mesmo modelo das páginas de texto (faixa verde, coluna de leitura, índice "Nesta página"), com o link "← Início". A data diz "Atualizado em", como no desenho, e não mais "Rascunho de".
12. **O que falta nos rascunhos:** o que estava marcado "[PROVISÓRIO]" (o encarregado de dados e o prazo de guarda, na política de privacidade; a anuidade, em Seja associado) aparece em cinza e itálico só no modo demonstração, e some fora dele. O documento para o advogado continua com a marca.
13. **Ícones:** Política editorial com o ícone de artigo, como no desenho; privacidade com o escudo com o visto.
14. **"Como chegar":** abre o mapa na mesma aba, como no perfil do médico.
15. **Índice "Nesta página" no tablet:** recolhido e já desenhado a partir de 980px (o desenho só o desenhava abaixo de 700px).
16. **Números da faixa verde de A Associação:** sem a contagem animada da home.
```

Se o Step 3 ou o Step 4 levaram a alguma outra decisão visível ao cliente, acrescente-a com o próximo número.

- [ ] **Step 9: Rodar tudo e commit**

Run: `npx vitest run` · `npx tsc --noEmit` · `npm run build` → verde.

```bash
git add scripts/auditoria-visual.js vitest.config.ts docs/estado-do-projeto.md docs/decisoes-sem-o-cliente.md
git commit -m "Conferencia de A Associacao: auditoria nas 8 larguras com e sem demonstracao, atalhos e indice Nesta pagina conferidos, fotos, estado do projeto e decisoes"
```

---

## Autorrevisão do plano

**1. Cobertura da spec**

| Spec | Onde |
|---|---|
| 1.1 Faixa verde: rótulo, h1 com `AMI.fundadaEm`, o parágrafo verdadeiro, os três números com divisória, fileira de três sem ícone no celular; sem `Cabeceira` e sem breadcrumb | Tasks 1 (`numerosDaAssociacao`), 6 (`FaixaDaAssociacao` e CSS) e 7 (página, teste dos números) |
| 1.2 Sede e apresentação: "QUEM SOMOS", h2, apresentação com moldura, quadro do endereço, "Como chegar" pelo Google Maps e o telefone fixo; foto `ESPACOS.sede` com moldura; sem foto e fora da demonstração, duas colunas de texto | Tasks 1 (`linkDoMapaDaAmi`, `apresentacaoDaAssociacao`) e 6 (`QuemSomos`, CSS `.semFoto`) |
| 1.3 Princípios: os cartões da home por `quemEhAmi`; sem texto e fora da demonstração, sai inteiro | Task 6 (`PrincipiosDaAmi`, `QuemSomos`, `TEXTO_INSTITUCIONAL`) |
| 1.4 Diretoria em destaque: rótulo, h2, frase, "Ver a diretoria", os quatro cartões | Tasks 1 (`diretoriaEmDestaque`), 5 (cartão) e 7 (`DiretoriaEmDestaque`) |
| 1.5 Saiba mais: três candidatos, só se a página existir, "texto a entrar" na demonstração, sai com um só, sem Benefícios | Tasks 1 (`atalhosDoSaibaMais`) e 7 (`SaibaMais`, página com `caminhosDePaginasPublicadas` e os rascunhos) |
| 1.6 Fecho em faixa branca curta, duas colunas, texto da home e "Quero me associar", sem o `SejaAssociado` inteiro | Tasks 1 (`CONVITE_PARA_ASSOCIAR`), 6 (a home lê o mesmo texto) e 7 (`FechoAssocie`) |
| 1.7 Metadados de hoje; o `Organization` só existe na home, e fica lá | Task 7 (teste dos metadados) |
| 2.1 Faixa curta da diretoria: "← A ASSOCIAÇÃO", h1, frase, pílula do mandato só na demonstração (sem campo), ladrilho de pessoas que some no celular | Tasks 2 (`FaixaCurta`) e 5 (`FaixaDaDiretoria`) |
| 2.2 a 2.5 Cartões da busca com cargo, "Ver perfil", cartão como link; sem perfil, o espaço fica; cartão deitado no celular; presidência primeiro, sem cartão maior | Task 5 (`CartaoDiretor`, `GradeDeDiretores`, testes de ordem) e 8 (conferência 13) |
| 2.6 A fonte dos dados é a mesma | Task 5 (`listarDiretoria` sem mudança; `testes/diretoria.test.ts` intacto) |
| 3.1 Faixa curta com a volta certa e o ícone de cada página | Tasks 1 (`VOLTA_*`, `iconeDaPagina`), 2 e 3 |
| 3.2 Corpo branco de ponta a ponta, coluna de 680px em x=172, 17,5px e 1,7; "Atualizado em"; quadro cinza neutro; h2, h3, listas e links | Task 3 (CSS, `CorpoDoTexto`) e 8 (`colunaTexto`) |
| 3.3 Índice: sticky e marcando a seção, `<details>` no celular, dos h2, só com dois ou mais | Tasks 1 (`ancorasUnicas`, `indiceNestaPagina`, `secaoAtual`), 2 (componentes), 3 (`ancorasDoCorpo` na página) e 8 (conferência 16) |
| 3.4 "Fale com a AMI": Ligar, celular, Como chegar; sem WhatsApp | Task 4 |
| 3.5 O texto de onde vem hoje; "Dados da entidade"; "[PROVISÓRIO]" como moldura só na demonstração; nenhum "[PROVISÓRIO]" no site | Tasks 1 (`paragrafoDoRascunho`, varredura dos rascunhos), 3 (rotas nas duas chaves) e 4 (Seja associado) |
| 4 Ordinal em `ink-400` também na home | Já feito desde a fatia A (ver "Ordem das tarefas"); a página nova usa o mesmo componente (Task 6) |
| 4 `Cabeceira` e `Breadcrumb` saem se ninguém mais usar | Continuam em uso pelo contato e pelas notícias; os comentários dizem isso (Tasks 5 e 7) |
| 5 Fora do escopo: textos da AMI, campo de mandato, WhatsApp | Não tocados; pendências no estado do projeto (Task 8) |
| 6 Ruling 11, 8 larguras com as duas chaves, fotos, contraste, índice por função pura e no navegador | Tasks 1 a 7 (render e função pura) e 8 |

**2. Placeholders:** nenhum "TBD" nem "implementar depois"; todo passo de código traz o código. O que o plano não traz só existe depois de medir: os números e os contrastes da Task 8.

Achados desta revisão, já corrigidos no texto:
1. **O ordinal 01/02/03 já está em `ink-400` na home** (`SejaAssociado.module.css` e `testes/sua-ami-e-associe.test.ts`); o relatório mediu o arquivo do desenho. Não há tarefa para isso, e a decisão 7 do documento das decisões é corrigida (Task 8).
2. **`Cabeceira` e `Breadcrumb` não ficam sem uso:** o contato e as notícias continuam com eles. Saem só da lista de quem usa, nos comentários.
3. **A `Placa` ficaria sem uso** quando o cartão de diretor passa a ser o da busca. Ela sai na Task 5, junto com a sentinela de `testes/tom-quente.test.ts` que dependia dela e a exceção `ami-green-800` de `testes/paleta.test.ts`, que ficaria morta.
4. **A exceção `warn` de `testes/paleta.test.ts`** ficaria morta, com motivo falso, quando o aviso passa a cinza. Sai na Task 3.
5. **O mandato:** a spec diz que o dado não existe; o banco tem as colunas `mandato_inicio` e `mandato_fim` (`supabase/migrations/0003_diretoria.sql`), vazias. O plano segue a spec (não lê) e leva a dúvida 1; a decisão 3 do documento é corrigida para dizer a verdade.
6. **Os textos legais também têm "[PROVISÓRIO]"** (dois, na política de privacidade). Como o modelo novo vale para eles, a mesma regra da moldura vale lá; o documento do advogado fica igual.
7. **O desenho mostra o índice recolhido a partir de 980px, mas só o desenha abaixo de 700px.** O plano o desenha a partir de 980px (decisão D8).
8. **`caminhos-de-filiacao.test.ts` quebraria na Task 7**, porque a página passa a ler a diretoria, o banco e as páginas publicadas. A Task 7 põe os dublês nele.

**3. Consistência de nomes:**

| Nome | Tarefas |
|---|---|
| `ItemDoIndice`, `ancoraDoTitulo`, `ancorasUnicas`, `indiceNestaPagina`, `MINIMO_DO_INDICE`, `LINHA_DE_LEITURA`, `secaoAtual` | 1 → 2, 3 |
| `VoltaDaPagina`, `VOLTA_ASSOCIACAO`, `VOLTA_INICIO` | 1 → 2, 3, 5 |
| `iconeDaPagina`, `ICONE_DE_PAGINA_PADRAO` | 1 → 3, `lib/associacao.ts` |
| `MARCA_PROVISORIA`, `paragrafoDoRascunho`, `blocosDoRascunho` | 1 → 3, 4 |
| `ConteudoDaPagina`, `conteudoDoRascunho`, `conteudoDoSanity`, `conteudoDaPagina` | 1 → 3 |
| `AncoraDoCorpo`, `ancorasDoCorpo` | 1 → 3 |
| `CONVITE_PARA_ASSOCIAR` | 1 → 6, 7 |
| `Atalho`, `atalhosDoSaibaMais`, `MINIMO_DE_ATALHOS` | 1 → 7 |
| `diretoriaEmDestaque`, `LIMITE_DA_DIRETORIA_EM_DESTAQUE` | 1 → 7 |
| `numerosDaAssociacao`, `NumeroDaAssociacao` | 1 → 6 |
| `ApresentacaoNaTela`, `apresentacaoDaAssociacao` | 1 → 6, 7 |
| `buscaNoMapa`, `linkDoMapaDaAmi` | 1 → 4, 6 |
| `SecaoLegal.tituloDaLista` | 1 → 4 |
| ícones `pergaminho`, `artigo`, `escudo`, `biscoito`, `documento`, `pessoas`, `calendario`, `informacao`, `relogio`, `chamada`, `celular` | 1 → 2, 3, 4, 5 |
| `FaixaCurta` | 2 → 3, 5 |
| `IndiceNestaPagina`, `IndiceRecolhido`; classes `lateral`, `titulo`, `lista`, `atual`, `recolhido` | 2 → 3 |
| `PaginaDeTexto` (`conteudo`, `volta`, `icone`, `children`); classes `faixa`, `grade`, `coluna`, `atualizado`, `quadro`, `quadroTitulo`, `falta`, `link` | 3 → 4 |
| `CorpoDoTexto` (`blocos`, `ancoras`) | 3 → 6 |
| classes `chamada`, `acoes`, `numero` (PaginaDeTexto.module.css) | 4 |
| `FaleComAmi` | 4 |
| `CartaoDiretor` (`diretor`, `imediata`); classes `diretor`, `cargo`, `verPerfil`, `foto` | 5 |
| `GradeDeDiretores` (`diretores`, `imediatos`) | 5 → 7 |
| `FaixaDaDiretoria`; classe `pilula` | 5 |
| `TEXTO_INSTITUCIONAL` | 6 → 7 |
| `PrincipiosDaAmi` (`cartoes`, `rotulo`, `titulo`, `texto`) | 6 |
| `FaixaDaAssociacao`; classes `inst`, `numeros`, `vidro`, `grande`, `rotulo` | 6 → 7 |
| `QuemSomos`, `SIZES_DA_SEDE`; classes `corpo`, `apresentacao`, `falta`, `sede`, `sedeTitulo`, `endereco`, `acoes`, `semFoto` | 6 → 7 |
| `DiretoriaEmDestaque`, `SaibaMais`, `FechoAssocie`; classes `cabSecao`, `titulo`, `texto`, `atalhos`, `atalho`, `nome`, `pe`, `frase`, `seta`, `etiqueta`, `fecho`, `fechoTitulo`, `fechoTexto`, `fechoAcao` | 7 |
| marcas `data-bloco` (`topo`, `texto`, `diretoria`, `quem-somos`, `saiba-mais`, `associe`), `data-faixa`, `data-coluna`, `data-a-entrar`, `data-ligar`, `data-atalho`, `data-nome`, `data-seta`, `data-nesta-pagina`, `data-diretor`, `data-sem-perfil`, `data-fale-com-ami` | 2–7 → 8 |

### Pares de tarefas que tocam o mesmo arquivo

Para o executor conferir conflitos: a tarefa de número maior parte do estado que a menor deixou. A coluna do plano Especialidades diz o que aquele plano, executado antes, já fez no arquivo; os Edits daqui partem do texto que ele deixou.

| Arquivo | Tarefas deste plano | Plano Especialidades | O que cada uma faz |
|---|---|---|---|
| `lib/rascunhosLegais.ts` | 1, 3, 4 | — | 1: `tituloDaLista` no tipo; 3: os comentários que citavam `RascunhoLegalNaTela` e o da marca no `paragrafos`; 4: o texto de Seja associado e o comentário dele |
| `components/editorial/PaginaDeTexto.module.css` | 3, 4 | — | 3: cria; 4: o quadro de chamada e uma linha do comentário |
| `app/(site)/associacao/[pagina]/page.tsx` | 3, 4 | — | 3: reescreve; 4: o "Fale com a AMI" e o comentário |
| `testes/paleta.test.ts` | 3, 5 | — | 3: tira a exceção `warn`; 5: tira a `ami-green-800` |
| `components/layout/Cabeceira.tsx` (só o primeiro parágrafo do comentário) | 5, 7 | 4, 6 | lá: tira `/medicos` e "cada especialidade"; 5: tira "a diretoria"; 7: tira "A Associação" |
| `components/layout/Rodape.module.css` (só o comentário) | 3, 7 | 6 | lá: o "Sobre"; 3: o corpo das páginas de texto e o invólucro; 7: o fecho de A Associação |
| `app/(site)/encontre.module.css` (só o comentário do topo) | 3 | 4, 6 | lá: o índice e a especialidade; 3: o texto fica genérico (as páginas do desenho novo) |
| `components/base/Icone.tsx`, `testes/icones.test.ts` | 1 | 1 | lá: 11 ícones de especialidade (33 no total); 1: mais 11 (44) |
| `lib/encontre.ts` | 1 | 1 | lá: `especialidadeDoCartao` e `opcoesDeEspecialidade`; 1: `linkDoMapa` usa `buscaNoMapa` |
| `scripts/auditoria-visual.js` | 8 | 7 | lá: conferência 14 e o comentário; 8: conferências 15 e 16, depois da 14 |
| `vitest.config.ts` (só o comentário) | 8 | 7 | os dois acrescentam frases no fim |
| `docs/estado-do-projeto.md` | 8 | 7 | lá: a seção de Especialidades e um item em "O que falta"; 8: a seção de A Associação, depois daquela, e as trocas em "O que falta" |
| `docs/decisoes-sem-o-cliente.md` | 8 | 7 | lá: itens 8 a 11 do grupo 2; 8: correções e itens 9 a 16 do grupo 3 |
| `components/home/SejaAssociado.tsx` e `.module.css` | 6 | — | 6: extrai `PrincipiosDaAmi`, lê `CONVITE_PARA_ASSOCIAR`, e a regra `.introTitulo:last-child` |
| `lib/molduras.ts` | 6 | — (a Task 5 de lá só lê `TEXTO_A_ENTRAR`) | 6: `TEXTO_INSTITUCIONAL` no fim |

Arquivos que este plano só **lê** e que o plano Especialidades criou ou mudou: `components/especialidades/FaixaDaEspecialidade.module.css` (Tasks 2 e 5, pela `FaixaCurta`), `components/especialidades/GradeDeEspecialidades.module.css` (Task 7), `components/diretorio/CartaoMedico.tsx` (Task 5 importa `SIZES_DO_CARTAO`; lá a Task 3 mudou o componente, não a constante) e `lib/sanity/consultas.ts` (Tasks 3 e 7 leem `paginaPorSlug` e `caminhosDePaginasPublicadas`; lá a Task 2 acrescentou o texto de especialidade). Este plano não toca `lib/especialidades.ts`, `lib/sanity/*` (além de ler), `app/(site)/medicos/*`, `CartaoMedico` nem `GradeMedicos`.

## Decisões deste plano que a spec não fixava

Registrar no diário ao executar. As visíveis ao cliente vão para `docs/decisoes-sem-o-cliente.md` (Task 8, Step 8).

- **D1. O cartão de diretor é um componente irmão do `CartaoMedico`**, com a folha, a foto e a grade dele (ver a justificativa na Task 5). O `CartaoMedico` não muda.
- **D2. Uma faixa verde curta só (`FaixaCurta`)** para a diretoria e as páginas de texto, com o CSS da faixa da busca e o da faixa da especialidade, que já tem a composição do desenho. A `FaixaDaEspecialidade` fica como o plano anterior a deixou; ver a dúvida 6.
- **D3. O rascunho em código vira texto rico** (`blocosDoRascunho`) e é desenhado pelo mesmo componente do texto do Studio (`CorpoDoTexto`). O índice sai dos h2 nos dois casos, pela chave do bloco. `RascunhoLegalNaTela` sai.
- **D4. A marca "[PROVISÓRIO] " no começo de um parágrafo do rascunho vira moldura** (cinza e itálico, `data-a-entrar`) só na demonstração, e some fora dela. Vale para os quatro rascunhos, inclusive os dois trechos da política de privacidade. A fonte não muda: o documento do advogado (`scripts/gerar-doc-legal.ts`) continua com a marca. Ver a dúvida 3.
- **D5. A âncora de cada título leva o prefixo `secao-`** ("secao-o-que-e-a-ami"), para não colidir com um id fixo da página.
- **D6. A seção lida é marcada pela rolagem, como no desenho**, e não por IntersectionObserver: a função pura `secaoAtual` com a linha de leitura de 140px. Sem JavaScript, nenhum item se diz o atual.
- **D7. "Atualizado em" também no rascunho** (antes, "Rascunho de"), como no desenho.
- **D8. O índice recolhido já sai desenhado a partir de 980px.** O desenho o mostrava a partir de 980px e só o desenhava abaixo de 700px.
- **D9. Atalho "texto a entrar" não é link** (a página dá 404) e não sobe ao passar o mouse; a aparência parada é a do desenho.
- **D10. "Saiba mais" some com menos de dois atalhos**, como o script do desenho faz.
- **D11. A diretoria em destaque mostra os quatro primeiros** (`LIMITE_DA_DIRETORIA_EM_DESTAQUE`); sem diretor publicado, o bloco sai. Na `/associacao/diretoria`, sem diretor, fica o aviso de vazio de hoje.
- **D12. "Como chegar" abre o mapa na mesma aba**, como o do consultório no perfil, e não em aba nova como no desenho. O link é o mesmo do desenho, com o CEP.
- **D13. Os números da faixa de A Associação não fazem a contagem animada da home.**
- **D14. A tarja da foto da sede é a do manifesto** ("Fotografia a entrar: Fachada da sede da AMI"), e não "sede da AMI": o rótulo de `lib/imagens.ts` é o mesmo do pedido de foto e já está testado.
- **D15. `TEXTO_DA_AMI` da home vira `TEXTO_INSTITUCIONAL` em `lib/molduras.ts`**, lido pela home e por A Associação.
- **D16. A apresentação oficial é o texto do documento "associacao" do Studio**; o título e o resumo dele continuam nos metadados, e o h1 é o fixo da spec.
- **D17. Ícones:** Política editorial com `Article` (o do desenho, que a spec chama de "caneta ou jornal"); privacidade com `ShieldCheck`; termos e página sem ícone próprio com `FileText`.
- **D18. Só as faixas brancas de A Associação ("Quem somos" e o fecho) entram ao rolar** (`.revelar`). As grades e o corpo das páginas de texto, que abrem logo abaixo da faixa verde, não.
- **D19. A frase da diretoria é a do desenho** ("Quem responde pela associação. Cada nome traz o número de inscrição no CRM."), mais curta que a de hoje.
- **D20. O texto do convite (`CONVITE_PARA_ASSOCIAR`) mora em `lib/associacao.ts`** e é lido pela home e pelo fecho: os dois não divergem.
- **D21. A `Placa` sai** (só o cartão de diretor antigo a usava), e a sentinela de `testes/tom-quente.test.ts` passa a provar a leitura dos `.tsx` com um texto escrito no próprio teste.
- **D22. A foto da sede tem `sizes` próprio** (`SIZES_DA_SEDE`), pela largura desenhada; o de "Seja associado" da home ("50vw") não foi mexido.

## Dúvidas para o cliente

1. **Mandato.** A spec diz que o dado não existe, mas a tabela `diretoria` já tem `mandato_inicio` e `mandato_fim` (`supabase/migrations/0003_diretoria.sql`), vazias. O plano segue a spec: não lê, e a pílula só sai na demonstração. Ler essas colunas pede uma regra de qual linha dá o período (a da presidência?) e uma tarefa pequena. Vale fazer agora?
2. **Diretoria em destaque com quatro.** Hoje a diretoria tem quatro nomes, e o destaque mostra todos. Se a diretoria real tiver mais, o destaque fica com os quatro primeiros. Está certo, ou a página A Associação deve mostrar todos?
3. **O encarregado de dados na política de privacidade.** Com a regra da moldura, fora do modo demonstração a frase sobre o encarregado (o artigo 41 da Lei 13.709/2018 exige designar um) some da política publicada, em vez de aparecer com "[PROVISÓRIO]". Como o site só sai do modo demonstração com a revisão do advogado feita, não deve chegar a acontecer. Prefere que, fora da demonstração, a página legal mostre a frase em texto comum?
4. **"Atualizado em" num rascunho legal.** O desenho usa "Atualizado em"; antes o site dizia "Rascunho de". O quadro de aviso logo abaixo já diz que é rascunho. Fica assim?
5. **Ícone de Política editorial.** O desenho usa o de artigo (`Article`); a spec fala em "caneta ou jornal". O plano segue o desenho. Trocar por `Newspaper` ou `PenNib`?
6. **Unificar a faixa da especialidade.** A `FaixaDaEspecialidade` (grupo 2) e a `FaixaCurta` (esta fatia) têm a mesma forma. Vale uma tarefa pequena, depois, para a da especialidade usar a `FaixaCurta`?

