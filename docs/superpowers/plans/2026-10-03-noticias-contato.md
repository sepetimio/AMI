# Notícias e Contato (a lista, a notícia aberta e o contato) — plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `/noticias`, `/noticias/[slug]` e `/contato` ficam iguais ao desenho aprovado (`docs/desenho-aprovado/noticias-contato/`), sem `Cabeceira`, sem trilha e sem `BreadcrumbList`, com as molduras "a entrar" só no modo demonstração; sem mais ninguém que as use, a `Cabeceira`, o `Breadcrumb`, o `TextoRico` e a `LinhaNoticia` saem do site.

**Architecture:**
- As decisões do grupo viram funções puras:
  - `lib/noticias.ts` (novo): a lista na tela (o destaque, a grade e os dois estados sem notícia), "Outras notícias", a assinatura do autor, a capa em 16:9 pelo ponto de interesse e a imagem no meio do texto;
  - `lib/arranjo-das-noticias.ts`: o arranjo da lista e o `sizes` do destaque e dos cartões, pela regra e pelas réguas que a home já usa;
  - `lib/paginaDeContato.ts` (novo): os três canais, a partir de `lib/ami.ts`;
  - `lib/sanity/imagem.ts`: `urlRecortada`, o endereço do CDN recortado pelo `hotspot` e pelo `crop` que a AMI marca no Studio.
- As peças do plano de A Associação são reaproveitadas e alargadas, sem mudar o HTML que elas já desenham:
  - `FaixaCurta` aceita um rótulo no lugar do link de volta, fica sem ícone quando não recebe um e aceita uma classe a mais (a da notícia aberta);
  - o corpo de `PaginaDeTexto` (a faixa branca com a coluna de leitura e o índice) sai para um componente próprio, `FaixaDoTexto`, que a notícia aberta usa entre a capa e "Outras notícias";
  - `CorpoDoTexto` passa a desenhar também a citação e a imagem com legenda; o CSS da coluna ganha a lista numerada com o número num círculo, o link, a citação, a imagem e o fim da notícia, todos do desenho.
- A lista e "Outras notícias" usam o mesmo cartão (`CartaoNoticia`) e a mesma grade (`GradeDeNoticias`).
- A sede do contato é o "Quem somos" de A Associação (as folhas `SejaAssociado.module.css` e `QuemSomos.module.css`, e o `SIZES_DA_SEDE`), com o CNPJ, o horário como moldura e o fecho.
- O CSS novo é **transcrito das regras do desenho** (o trecho do `<style>` depois do comentário "Fatia B · Notícias e Contato"), trocando código de cor por token.

**Tech Stack:** Next.js 16 (App Router), React 19, Tailwind 4 (`@theme`), CSS Modules, Sanity 6 (`next-sanity`, `@portabletext/react`, `@sanity/image-url`), `groq-js` (testes), Vitest, `@phosphor-icons/react/dist/ssr`.

**Spec:** `docs/superpowers/specs/2026-10-03-noticias-contato-design.md` — leia inteira antes de começar. É a autoridade.
- O desenho é a referência de todo valor visual. Quando o plano e o desenho discordarem num valor, vale o desenho. Ele está em:
  - `docs/desenho-aprovado/noticias-contato/noticias.html` (aceita `?poucas=1|2|3`, `?a-entrar` e `?sem-conteudo`);
  - `docs/desenho-aprovado/noticias-contato/noticia.html` (também `?sem-conteudo`);
  - `docs/desenho-aprovado/noticias-contato/contato.html` (também `?sem-conteudo`);
  - as fotos `.jpg` da mesma pasta.
- O relatório do desenho (`.superpowers/brainstorm/fatia-b-noticias-contato/relatorio.md`) tem as medidas (x=172, borda direita em 1268, painéis de 124 a 1316, irmãos alinhados, ritmo), os contrastes medidos e a tabela de molduras.
- As specs `2026-10-03-redesign-visual-design.md`, `2026-10-03-encontre-um-medico-design.md`, `2026-10-03-especialidades-design.md` e `2026-10-03-associacao-design.md` continuam valendo. O modelo de página de texto é o da spec de A Associação, seção 3.

**Diários** (todos valem):
- fatia A: `.superpowers/sdd/2026-10-03-redesign-fatia-a/progress.md`;
- grupo 1: `.superpowers/sdd/2026-10-03-encontre-um-medico/progress.md`;
- grupo 2: `.superpowers/sdd/2026-10-03-especialidades/progress.md`;
- grupo 3: `.superpowers/sdd/2026-10-03-associacao/progress.md`.

**Ramo:** `paginas-encontre`. Nada vai para a `main` antes de todos os grupos ficarem prontos.

**Ordem em relação aos dois planos anteriores.** Este plano é executado **depois** de:
1. `docs/superpowers/plans/2026-10-03-especialidades.md` (as sete tarefas e a correção final);
2. `docs/superpowers/plans/2026-10-03-associacao.md` (as oito tarefas e a correção final).

Ele parte do estado que os dois deixam e consome, do plano de A Associação:
- `components/layout/FaixaCurta.tsx` (Task 2 de lá), com as props `volta`, `titulo`, `texto`, `icone`, `children`;
- `components/editorial/PaginaDeTexto.tsx` (Task 3 de lá), com as props `conteudo`, `volta`, `icone`, `children`;
- `components/editorial/CorpoDoTexto.tsx` (Task 3 de lá), com as props `blocos`, `ancoras`;
- `components/editorial/PaginaDeTexto.module.css` (Tasks 3 e 4 de lá), com as classes `faixa`, `grade`, `coluna`, `atualizado`, `quadro`, `quadroTitulo`, `falta`, `link`, `chamada`, `acoes`, `numero`;
- `components/editorial/IndiceNestaPagina.tsx` (`IndiceNestaPagina`, `IndiceRecolhido`), `lib/nestaPagina.ts` (`indiceNestaPagina`) e `lib/paginaDeTexto.ts` (`VoltaDaPagina`, `ConteudoDaPagina`, `ancorasDoCorpo`);
- `components/associacao/QuemSomos.tsx` (`SIZES_DA_SEDE`) e `QuemSomos.module.css` (`corpo`, `semFoto`, `sede`, `sedeTitulo`, `endereco`, `acoes`) (Task 6 de lá);
- `lib/ami.ts` com `linkDoMapaDaAmi()` e `lib/contato.ts` com `buscaNoMapa()` (Task 1 de lá);
- os 44 nomes de ícone (os 33 de hoje e os 11 de lá, entre eles `"relogio"`, `"informacao"`, `"celular"`, `"documento"`);
- `scripts/auditoria-visual.js` com as conferências 15 e 16, `vitest.config.ts`, `docs/estado-do-projeto.md` e `docs/decisoes-sem-o-cliente.md` na forma que a Task 8 de lá deixou.

E consome, da correção final do plano Especialidades, **os ícones em dois mapas**:
- `components/base/Icone.tsx` tem só os ícones que algum componente de cliente (`"use client"`) desenha (`mapaDoCliente`, `Icone`, `NomeIconeDoCliente`);
- `components/base/IconeServidor.tsx` tem os demais (`mapaDeTodos`), o `Icone` que aceita todos os nomes, o `LadrilhoIcone` e o tipo `NomeIcone`. Só componente de servidor o importa;
- `testes/icones.test.ts` trava a divisão: nenhum arquivo de cliente, nem o que ele importa, chega a `IconeServidor.tsx`.

Todo componente deste plano é de servidor e importa `Icone`, `LadrilhoIcone` e `NomeIcone` de `@/components/base/IconeServidor`. Os três ícones novos (Task 1) só o servidor desenha: entram em `IconeServidor.tsx`. Se o plano de A Associação, na execução, deixou os 11 ícones dele noutro lugar, ou se os componentes dele (a `FaixaCurta`, a `PaginaDeTexto`) importam de outro arquivo, siga o que estiver no código e avise.

**Antes da Task 1, confira:**
- `git log --oneline -25` mostra os commits de A Associação, inclusive o da conferência ("Conferencia de A Associacao…") e os da correção final, se houve;
- os arquivos acima existem, com as props e as classes listadas;
- `components/base/IconeServidor.tsx` existe e exporta `Icone`, `LadrilhoIcone` e `NomeIcone`; se não existir, ou tiver outros nomes, **pare e pergunte**;
- o Ruling 7 do diário de A Associação mandou a correção final de lá unificar a `FaixaDaEspecialidade` com a `FaixaCurta` "se não mudar o visual". **Se a correção final mudou a assinatura ou o HTML da `FaixaCurta`** (`testes/faixa-curta-e-indice.test.ts` diferente do que o plano de lá escreveu), **pare e pergunte**: a Task 2 daqui reescreve aquele arquivo;
- o Ruling 4 de lá (a moldura dos textos legais nos dois modos) não afeta este plano.

Se algum texto que um passo daqui manda trocar não estiver lá, **pare e pergunte**: um plano anterior mudou.

## Global Constraints

Valem para toda tarefa, sem exceção.

**Do projeto (vêm da fatia A e dos grupos 1, 2 e 3, e continuam):**

- Texto que o usuário lê: português. Mensagens de commit: português **sem acento**.
- Este Next.js tem mudanças em relação ao que você conhece: antes de usar API do Next, leia o guia em `node_modules/next/dist/docs/`.
- **Nenhum número de contraste escrito de memória.** Os do relatório do desenho foram medidos em 03/10/2026; qualquer outro, meça.
- **Nenhum comentário promete o que o código não faz.**
  - Nenhum comentário aponta para `.superpowers/` nem para "tarefa N" deste plano.
  - Comentário que cita arquivo apagado nesta fatia é comentário falso: `grep` antes do commit (as Tasks 3, 4 e 6 apagam arquivos e trazem a lista do que muda).
- **Prove por mutação** toda asserção nova: quebre o código de propósito, veja o teste ficar vermelho, desfaça.
  - **Desfazer = regravar o conteúdo original** (Edit de volta, ou Write com o conteúdo que você leu antes).
  - **Nunca** `git checkout -- <arquivo>` nem `git restore`.
- **`core.autocrlf=true`, e o repositório mistura CRLF e LF.** Confira com `file <arquivo>` antes de editar.
  - CRLF, entre os desta fatia: `lib/arranjo-das-noticias.ts`, `lib/sanity/consultas.ts`, `lib/sanity/imagem.ts`, `lib/sanity/tipos.ts`, `lib/sanity/banners.ts`, `lib/sanity/link.ts`, `lib/seo/jsonld.ts`, `components/base/MolduraProvisoria.tsx`, `components/editorial/UltimasNoticias.tsx`, `components/home/Carrossel.tsx`, `components/layout/Cabeceira.tsx`, `components/layout/Breadcrumb.tsx`, `app/(site)/noticias/page.tsx`, `app/(site)/contato/page.tsx`, `app/(site)/busca/page.tsx`, `app/globals.css`, `testes/icones.test.ts`, `testes/banners.test.ts`, `scripts/auditoria-visual.js`, `vitest.config.ts`, `docs/estado-do-projeto.md`.
  - LF: `app/(site)/noticias/[slug]/page.tsx`, `app/(site)/medico/[slug]/page.tsx`, `components/editorial/TextoRico.tsx`, `components/editorial/LinhaNoticia.tsx`, `testes/jsonld.test.ts`, `testes/paleta.test.ts`, `testes/sanity-imagem.test.ts`, `testes/sanity-schemas.test.ts`, `docs/decisoes-sem-o-cliente.md` e os arquivos novos.
  - Os arquivos que o plano de A Associação criou (`FaixaCurta.tsx`, `PaginaDeTexto.tsx`, `CorpoDoTexto.tsx`, `PaginaDeTexto.module.css`) e `components/base/IconeServidor.tsx` (da correção final de Especialidades): mantenha o fim de linha que estiver lá (`file` diz qual).
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
- **Ícones em dois mapas:** componente de servidor importa `Icone`, `LadrilhoIcone` e `NomeIcone` de `@/components/base/IconeServidor`; componente de cliente, só `Icone` de `@/components/base/Icone`. Ícone novo que só o servidor desenha entra em `IconeServidor.tsx` (a regra está no comentário de `components/base/Icone.tsx`; `testes/icones.test.ts` trava).
- **`sizes` das imagens pela largura desenhada**, calculado pelas réguas (`--m`, `--gap`, a caixa de 1240px, `--borda-faixa`); a conta fica no comentário de quem a escreve.
- **React 19 põe um `<link rel="preload" as="image" …/>` antes do HTML** quando há imagem com `fetchPriority="high"` (o destaque da lista e a capa). Os testes de renderização tiram esse `<link>` antes de ancorar uma asserção no começo do HTML (`semPreload`, escrito em cada arquivo de teste que precisa).
- **Cores:**
  - nenhum tom creme ou quente (`testes/tom-quente.test.ts` varre o site);
  - efeito de mouse é borda mais escura, sombra neutra e subida de 1 a 3px; **nunca** verde claro.
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
  - caixa atrás de caixa (por isso a imagem do texto e a capa ficam **sem** a moldura de 8px com borda do `TextoRico` de hoje);
  - celular que só empilha;
  - nada cortado na borda do celular;
  - espaços desiguais;
  - desalinhamento;
  - **a `Cabeceira` cinza nas páginas internas**.
- **Réguas:**
  - `--m` 48/28/20px, `--ritmo` 72/56/32px, `--gap` 24/16/12px;
  - `--borda-faixa` para as faixas de ponta a ponta;
  - quebras em 1180, 980 e 700px, como no desenho.
- **Tradução de cor do desenho para o site.** Use o token, nunca o código:

  | No desenho | No site |
  |---|---|
  | `--chao #EEF1EF` | `var(--color-canvas)` |
  | `--painel #FFFFFF` / `#fff` | `var(--color-surface)` |
  | `--painel-2 #F6F7F8` (o círculo do número da lista) | `var(--color-surface-fundo)` |
  | `--linha #E5E7EB` | `var(--color-line)` |
  | `--tinta #0c0e12` | `var(--color-ink-900)` |
  | `--tinta-2 #4F5661` | `var(--color-ink-600)` |
  | `--tinta-3 #646B75` | `var(--color-ink-400)` |
  | `--v800` / `--v600` | `var(--color-ami-green-800)` / `var(--color-ami-green-600)` |
  | `--v900` (fundo do destaque) | `var(--color-ami-green-900)` |
  | `--lima #A8D470` | `var(--color-ami-lima-400)` |
  | `--sombra` | `var(--shadow-erguido)` |
  | `--raio` (22px) | `var(--radius-painel)` |
  | `#fff` do texto sobre o verde | `var(--color-white)` |
  | `--f-titulo` / `--t-peso` | `var(--font-titulo)` / `500` (como `FaixaDaAssociacao.module.css`, `.grande`) |
  | `--f-texto` | `var(--font-corpo)` |

  - Vão como estão, porque não têm token:
    - `#DDE2E0`, o cinza atrás da foto enquanto ela carrega (o mesmo de `components/diretorio/FotoDoMedico.module.css`);
    - `#DDE7D6`, a linha "MÉDICO · CRM · data" sobre o verde (a mesma cor dos rótulos dos números de A Associação);
    - o branco translúcido do vidro e do fio sobre o verde (`rgba(255,255,255,…)`), o degradê escuro sobre a foto do destaque (`rgba(8,14,10,…)`) e as sombras com `rgba(16,24,40,…)` e `rgba(12,14,18,…)`.
  - O "sem capa" e a moldura das notícias não se reescrevem: são o `.semCapa` de `components/editorial/UltimasNoticias.module.css` e o `MolduraProvisoria`, os mesmos da home.

**Da spec nova (fatia B, grupos 4 e 5):**

- **Toda decisão [sem o cliente] vai para `docs/decisoes-sem-o-cliente.md`.**
- As três páginas ficam **sem `Cabeceira`, sem breadcrumb visível e sem `BreadcrumbList`**.
- **As notícias vêm de onde vêm hoje** (`listarNoticias`, `noticiaPorSlug`, Sanity). **No máximo 20 na lista, sem paginação.** Sem notícia publicada, `/noticias/[slug]` continua dando 404.
- **A AMI não tem notícia publicada.** As notícias de exemplo existem **só nos testes**: nunca publique notícia de exemplo no Sanity da AMI, nem para conferir no navegador.
- **O contato vem de `lib/ami.ts`.** Sem e-mail, sem WhatsApp, sem formulário e sem mapa embutido. O horário de atendimento não existe: moldura só na demonstração.
- **JSON-LD:** o `NewsArticle` fica como está; o `ItemList` da lista fica; o `BreadcrumbList` sai das três páginas.
- **Marcas para a auditoria:**
  - todo bloco de primeiro nível leva `data-bloco`:
    - `/noticias`: `topo`, `noticias`;
    - `/noticias/[slug]`: `topo`, `capa` (quando há capa), `texto`, `outras` (quando há outras);
    - `/contato`: `topo`, `canais`, `sede`;
  - o primeiro texto de cada bloco que fica na coluna do texto leva `data-coluna`;
  - a faixa de ponta a ponta leva `data-faixa`;
  - o que é moldura "a entrar" leva `data-a-entrar`;
  - o cartão de notícia leva `data-cartao-noticia`, a foto dele `data-foto`, a data `data-data` e o título `data-titulo` (a conferência 17 os alinha);
  - o canal do contato leva `data-canal`, o rótulo `data-rotulo`, o dado `data-dado` e o pé do botão `data-acao` (a conferência 18 os alinha).

---

## Mapa de arquivos

| Arquivo | O que é | Tarefa |
|---|---|---|
| `lib/noticias.ts` (novo) | a lista na tela, "Outras notícias", a assinatura, a capa 16:9, a imagem do texto | 1 |
| `lib/arranjo-das-noticias.ts` | `arranjoDaLista`, `tamanhoDosCartoes` e o `sizes` do destaque | 1 |
| `lib/paginaDeContato.ts` (novo) | os três canais e o perfil do Instagram | 1 |
| `lib/sanity/imagem.ts` | `urlRecortada`, `ConfiguracaoDoSanity`; comentários | 1 |
| `lib/sanity/tipos.ts` | `PontoDeInteresse`, `Recorte`, `CapaSanity`; a capa do resumo | 1 |
| `lib/sanity/consultas.ts` | a capa projeta `hotspot` e `crop` | 1 |
| `components/base/IconeServidor.tsx` | 3 ícones novos, só do servidor | 1 |
| `components/layout/FaixaCurta.tsx` | rótulo, ícone opcional e classe a mais (reescrita) | 2 |
| `components/editorial/FaixaDoTexto.tsx` (novo) | o corpo em faixa branca, saído de `PaginaDeTexto` | 2 |
| `components/editorial/PaginaDeTexto.tsx` | usa `FaixaDoTexto` (reescrita) | 2 |
| `components/editorial/CorpoDoTexto.tsx` | citação e imagem com legenda (reescrita) | 2 |
| `components/editorial/PaginaDeTexto.module.css` | lista numerada, citação, imagem, link (2); o fim da notícia (4) | 2, 4 |
| `components/editorial/FotoDaNoticia.tsx` (novo) | a foto do destaque e do cartão, ou o "sem capa" | 3 |
| `components/editorial/CartaoNoticia.tsx` (novo) | o cartão branco | 3 |
| `components/editorial/GradeDeNoticias.tsx` (novo) | a grade, e a dos cartões "a entrar" | 3 |
| `components/editorial/ListaDeNoticias.tsx` (novo) | o destaque e a grade, ou os estados sem notícia | 3 |
| `components/editorial/Noticias.module.css` (novo) | o destaque, a grade, o cartão, "nenhuma", "Outras notícias" no celular | 3 |
| `app/(site)/noticias/page.tsx` | reescrita | 3 |
| `components/editorial/LinhaNoticia.tsx` | apagado | 4 |
| `components/editorial/UltimasNoticias.tsx`, `components/home/Carrossel.tsx` (comentários) | citavam `LinhaNoticia` e `TextoRico` | 4 |
| `components/editorial/FaixaDaNoticia.tsx` (novo) | a faixa verde com a assinatura | 4 |
| `components/editorial/CapaDaNoticia.tsx` (novo) | a capa em 16:9 | 4 |
| `components/editorial/AutorDaNoticia.tsx` (novo) | quem assina, "Ver perfil" e o aviso de saúde | 4 |
| `components/editorial/OutrasNoticias.tsx` (novo) | "Outras notícias" | 4 |
| `components/editorial/NoticiaAberta.module.css` (novo) | a faixa da notícia, a assinatura e a capa | 4 |
| `app/(site)/noticias/[slug]/page.tsx` | reescrita | 4 |
| `components/editorial/TextoRico.tsx` | apagado | 4 |
| `lib/sanity/banners.ts`, `lib/sanity/link.ts` (comentários) | citavam `TextoRico` | 4 |
| `components/contato/CanaisDeContato.tsx`, `components/contato/SedeDaAmi.tsx`, `components/contato/Contato.module.css` (novos) | os canais e a sede com o fecho | 5 |
| `app/(site)/contato/page.tsx` | reescrita | 5 |
| `components/layout/Cabeceira.tsx`, `components/layout/Breadcrumb.tsx` | apagados | 6 |
| `lib/seo/jsonld.ts` | `breadcrumbList` sai | 6 |
| `app/globals.css`, `components/base/MolduraProvisoria.tsx`, `app/(site)/busca/page.tsx`, `app/(site)/medico/[slug]/page.tsx` (comentários) | citavam a `Cabeceira` ou o `Breadcrumb` | 6 |
| `scripts/auditoria-visual.js` | comentários (6); conferências 17 e 18 (7) | 6, 7 |
| `vitest.config.ts` (comentário), `docs/estado-do-projeto.md`, `docs/decisoes-sem-o-cliente.md` | conferência e registro | 7 |

Testes novos:

| Teste | Tarefa |
|---|---|
| `testes/noticias-funcoes.test.ts` | 1 |
| `testes/contato-funcoes.test.ts` | 1 |
| `testes/noticias-consulta.test.ts` | 1 |
| `testes/pecas-de-texto.test.ts` | 2 |
| `testes/lista-de-noticias.test.ts` | 3 |
| `testes/noticia-aberta.test.ts` | 4 |
| `testes/contato-na-tela.test.ts` | 5 |

Testes alterados:

| Teste | Tarefa |
|---|---|
| `testes/sanity-imagem.test.ts`, `testes/icones.test.ts` | 1 |
| `testes/paleta.test.ts`, `testes/banners.test.ts`, `testes/sanity-schemas.test.ts` (comentários) | 4 |
| `testes/jsonld.test.ts`, `testes/paleta.test.ts` | 6 |

**Testes que não podem mudar, e são a prova de que a extração não mexeu no que já existia:** `testes/faixa-curta-e-indice.test.ts`, `testes/modelo-de-texto.test.ts`, `testes/seja-associado.test.ts`, `testes/aviso-do-rascunho.test.ts`, `testes/associacao-topo.test.ts`, `testes/diretoria-na-tela.test.ts`, `testes/associacao.test.ts`, `testes/noticias-da-home.test.ts`, `testes/caminhos-de-filiacao.test.ts`. Se um deles ficar vermelho, a falha é deste plano.

**Ordem das tarefas, e por que difere da decomposição sugerida:**
- A Task 2 vem antes das páginas: as três páginas usam a `FaixaCurta` alargada, e a notícia aberta usa a `FaixaDoTexto` e o `CorpoDoTexto` novo.
- O fim da notícia (o autor e o aviso de saúde) fica na Task 4, com a página que o usa; o CSS dele mora na folha da página de texto, porque vive dentro da coluna de leitura (a mesma razão do "Fale com a AMI" de A Associação).
- `LinhaNoticia` e `TextoRico` saem juntos na Task 4: a lista deixa de usar a `LinhaNoticia` na Task 3, mas a página da notícia aberta, que só a Task 4 reescreve, cita as duas nos comentários até lá.
- A `Cabeceira` e o `Breadcrumb` saem na Task 6, depois das três páginas, com o `breadcrumbList` do JSON-LD, que fica sem ninguém que o chame.

---

### Task 1: Funções puras, a capa recortada e três ícones

**Files:**
- Create: `lib/noticias.ts`, `lib/paginaDeContato.ts`
- Modify: `lib/arranjo-das-noticias.ts` (CRLF), `lib/sanity/imagem.ts` (CRLF), `lib/sanity/tipos.ts` (CRLF), `lib/sanity/consultas.ts` (CRLF)
- Modify: `components/base/IconeServidor.tsx` (o fim de linha que estiver lá), `testes/icones.test.ts` (CRLF), `testes/sanity-imagem.test.ts` (LF)
- Create: `testes/noticias-funcoes.test.ts`, `testes/contato-funcoes.test.ts`, `testes/noticias-consulta.test.ts`

**Interfaces:**
- Consumes: `arranjoDasNoticias` e os auxiliares privados `coluna` e `sizes` (`lib/arranjo-das-noticias.ts`, no mesmo arquivo); `urlDaImagem`, `dimensoesDoRef` (`lib/sanity/imagem.ts`); `identificacaoMedica` (`lib/formato.ts`); `AMI`, `hrefTelefone` (`lib/ami.ts`); `VoltaDaPagina` (`lib/paginaDeTexto.ts`, plano de A Associação); `NomeIcone` (`components/base/IconeServidor.tsx`).
- Produces (`lib/sanity/tipos.ts`):

```ts
export type PontoDeInteresse = { x: number; y: number; width: number; height: number };
export type Recorte = { top: number; bottom: number; left: number; right: number };
export type CapaSanity = ImagemSanity & { hotspot?: PontoDeInteresse | null; crop?: Recorte | null };
// ResumoNoticia.capa passa de ImagemSanity para CapaSanity
```

- Produces (`lib/sanity/imagem.ts`):

```ts
export type ConfiguracaoDoSanity = { projectId: string; dataset: string };
export function urlRecortada(imagem: CapaSanity, largura: number, altura: number, configuracao?: ConfiguracaoDoSanity): string; // "" com _ref malformado
```

- Produces (`lib/arranjo-das-noticias.ts`):

```ts
export type ArranjoDaLista = { colunas: number; deitado: boolean };
export function arranjoDaLista(quantas: number): ArranjoDaLista | null;
export const SIZES_DO_DESTAQUE_DA_LISTA: string;
export function tamanhoDosCartoes(a: ArranjoDaLista): string; // só com colunas > 0
export const LARGURAS_DO_DESTAQUE_DA_LISTA: readonly number[]; // [480, 640, 960, 1280, 1600, 2400]
export const LARGURAS_DO_CARTAO: readonly number[];            // [160, 320, 480, 640, 960, 1200]
```

- Produces (`lib/noticias.ts`):

```ts
export const LIMITE_DA_LISTA = 20;
export const VOLTA_NOTICIAS: VoltaDaPagina; // { href: "/noticias", rotulo: "Notícias" }
export type ListaNaTela =
  | { tipo: "noticias"; destaque: ResumoNoticia; grade: ResumoNoticia[]; arranjo: ArranjoDaLista }
  | { tipo: "a-entrar" }
  | { tipo: "nenhuma" };
export function listaDeNoticias(demonstracao: boolean, noticias: ResumoNoticia[]): ListaNaTela;
export const LIMITE_DE_OUTRAS = 3;
export const TRES_POR_LINHA: ArranjoDaLista; // { colunas: 3, deitado: false }
export function outrasNoticias(noticias: ResumoNoticia[], slugAtual: string): ResumoNoticia[];
export type Assinatura = { nome: string; perfil: string | null; registro: string };
export function assinaturaDoAutor(autor: Autor): Assinatura;
export type ImagemNaTela = { src: string; srcSet: string; alt: string; largura: number; altura: number };
export const LARGURAS_DA_CAPA: readonly number[]; // [640, 960, 1200, 1600, 2000, 2400]
export const SIZES_DA_CAPA: string;
export function alturaDaCapa(largura: number): number; // 16:9
export function capaDaNoticia(capa: CapaSanity | undefined, configuracao?: ConfiguracaoDoSanity): ImagemNaTela | null;
export const LARGURAS_DA_IMAGEM_DO_TEXTO: readonly number[]; // [480, 720, 960, 1360, 1600]
export const SIZES_DA_IMAGEM_DO_TEXTO: string;
export function imagemDoTexto(imagem: ImagemSanity, configuracao?: ConfiguracaoDoSanity): ImagemNaTela | null;
```

- Produces (`lib/paginaDeContato.ts`):

```ts
export type Canal = {
  chave: "fixo" | "celular" | "instagram";
  icone: NomeIcone;
  rotulo: string;
  dado: string;
  longo: boolean;
  nota: string;
  acao: { tipo: "ligar" | "abrir"; href: string; texto: string; rotulo: string };
};
export function perfilDoInstagram(endereco: string): string; // "@associacaomedicadeimperatriz"
export function canaisDeContato(): Canal[];
```

- Produces (`components/base/IconeServidor.tsx`): `mapaDeTodos`, e com ele `NomeIcone`, ganha 3 nomes, que só componente de servidor desenha:

  | Nome | Phosphor | Uso |
  |---|---|---|
  | `"jornal"` | `Newspaper` | ladrilho da faixa de `/noticias` |
  | `"instagram"` | `InstagramLogo` | canal do Instagram |
  | `"horario"` | `Clock` | o quadro do horário de atendimento |

  Os três existem no `@phosphor-icons/react` instalado (conferido em `node_modules/@phosphor-icons/react/dist/ssr/`). A conversa da faixa do contato é `"conversa"` (`ChatsCircle`), o telefone `"telefone"` (`Phone`), o celular `"celular"` (`DeviceMobile`, do plano de A Associação), o pino `"comoChegar"` (`MapPin`), o aperto de mãos `"parceria"` (`Handshake`) e o estetoscópio `"estetoscopio"` (`Stethoscope`): todos já existem.

- [ ] **Step 1: Os testes das notícias**

`testes/noticias-funcoes.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  LARGURAS_DO_CARTAO,
  LARGURAS_DO_DESTAQUE_DA_LISTA,
  SIZES_DO_DESTAQUE_DA_LISTA,
  arranjoDaLista,
  tamanhoDosCartoes,
} from "@/lib/arranjo-das-noticias";
import {
  LARGURAS_DA_CAPA,
  LARGURAS_DA_IMAGEM_DO_TEXTO,
  LIMITE_DA_LISTA,
  LIMITE_DE_OUTRAS,
  SIZES_DA_CAPA,
  SIZES_DA_IMAGEM_DO_TEXTO,
  TRES_POR_LINHA,
  VOLTA_NOTICIAS,
  alturaDaCapa,
  assinaturaDoAutor,
  capaDaNoticia,
  imagemDoTexto,
  listaDeNoticias,
  outrasNoticias,
} from "@/lib/noticias";
import type { ResumoNoticia } from "@/lib/sanity/tipos";

/*
  O que as páginas de notícias decidem, em funções puras: o arranjo da
  lista, o que ela mostra sem notícia, "Outras notícias", a assinatura do
  autor, a capa em 16:9 pelo ponto de interesse, a imagem no meio do texto
  e o `sizes` de cada imagem. O desenho de cada peça é testado por
  renderização em testes/lista-de-noticias.test.ts e
  testes/noticia-aberta.test.ts.

  Os endereços esperados do CDN foram gerados pelo `@sanity/image-url`
  instalado, com o projeto fixo daqui (`CONFIG`), e não escritos à mão.
*/

const CONFIG = { projectId: "abcd1234", dataset: "production" };
const REF = "image-abc123def456-2000x1333-jpg";
const CDN = "https://cdn.sanity.io/images/abcd1234/production/abc123def456-2000x1333.jpg";

function noticia(n: number): ResumoNoticia {
  return {
    titulo: `Título da notícia ${n}`,
    slug: `noticia-${n}`,
    resumo: `Resumo da notícia ${n}.`,
    autor: { nome: "Rafael Coelho", crm: "10137", crmUf: "MA" },
    publicadoEm: "2026-09-18T12:00:00-03:00",
  };
}

const varias = (quantas: number) => Array.from({ length: quantas }, (_, i) => noticia(i + 1));

describe("o arranjo da lista", () => {
  it("a regra da home: só o destaque, um cartão deitado, duas colunas, três por linha", () => {
    expect([0, 1, 2, 3, 4, 7, 20].map(arranjoDaLista)).toEqual([
      null,
      { colunas: 0, deitado: false },
      { colunas: 1, deitado: true },
      { colunas: 2, deitado: false },
      { colunas: 3, deitado: false },
      { colunas: 3, deitado: false },
      { colunas: 3, deitado: false },
    ]);
  });
});

describe("a lista na tela", () => {
  it("com notícia: a mais recente em destaque e as outras na grade, na ordem", () => {
    expect(listaDeNoticias(true, varias(7))).toEqual({
      tipo: "noticias",
      destaque: noticia(1),
      grade: varias(7).slice(1),
      arranjo: { colunas: 3, deitado: false },
    });
  });

  it("1, 2, 3 e 4 notícias, iguais nos dois modos", () => {
    const casos: [number, { colunas: number; deitado: boolean }][] = [
      [1, { colunas: 0, deitado: false }],
      [2, { colunas: 1, deitado: true }],
      [3, { colunas: 2, deitado: false }],
      [4, { colunas: 3, deitado: false }],
    ];
    for (const demonstracao of [true, false]) {
      for (const [quantas, arranjo] of casos) {
        const lista = listaDeNoticias(demonstracao, varias(quantas));
        if (lista.tipo !== "noticias") throw new Error(`${quantas}: ${lista.tipo}`);
        expect(lista.grade, `${quantas}`).toHaveLength(quantas - 1);
        expect(lista.arranjo, `${quantas}`).toEqual(arranjo);
      }
    }
  });

  it("no máximo 20, como hoje: a 21ª não entra", () => {
    expect(LIMITE_DA_LISTA).toBe(20);
    const lista = listaDeNoticias(false, varias(25));
    if (lista.tipo !== "noticias") throw new Error(lista.tipo);
    expect(lista.grade).toHaveLength(19);
    expect(lista.grade.at(-1)?.slug).toBe("noticia-20");
  });

  it("sem notícia: na demonstração, as molduras; fora dela, a lista vazia", () => {
    expect(listaDeNoticias(true, [])).toEqual({ tipo: "a-entrar" });
    expect(listaDeNoticias(false, [])).toEqual({ tipo: "nenhuma" });
  });
});

describe("o sizes da lista, pela largura desenhada", () => {
  it("o destaque: a largura dos painéis (1192px); no celular, a coluna do texto", () => {
    expect(SIZES_DO_DESTAQUE_DA_LISTA).toBe(
      "(min-width: 1240px) 1192px, (min-width: 701px) calc(100vw - 48px), calc(100vw - 64px)",
    );
  });

  it("três por linha (quatro notícias ou mais, e Outras notícias); duas no tablet; 88px no celular", () => {
    expect(tamanhoDosCartoes({ colunas: 3, deitado: false })).toBe(
      "(min-width: 1240px) 381px, (min-width: 981px) calc((100vw - 48px - 48px) / 3), " +
        "(min-width: 701px) calc((100vw - 48px - 16px) / 2), 88px",
    );
  });

  it("duas colunas (três notícias)", () => {
    expect(tamanhoDosCartoes({ colunas: 2, deitado: false })).toBe(
      "(min-width: 1240px) 584px, (min-width: 981px) calc((100vw - 48px - 24px) / 2), " +
        "(min-width: 701px) calc((100vw - 48px - 16px) / 2), 88px",
    );
  });

  it("o cartão deitado (duas notícias): a foto na largura de uma coluna de três", () => {
    expect(tamanhoDosCartoes({ colunas: 1, deitado: true })).toBe(
      "(min-width: 1240px) 381px, (min-width: 981px) calc((100vw - 48px - 48px) / 3), " +
        "(min-width: 701px) calc((100vw - 48px - 32px) / 3), 88px",
    );
  });

  it("as larguras pedidas ao CDN cobrem a maior caixa em densidade 2, e a miniatura de 88px", () => {
    expect(LARGURAS_DO_DESTAQUE_DA_LISTA.at(-1)).toBeGreaterThanOrEqual(1192 * 2);
    expect(LARGURAS_DO_CARTAO.at(-1)).toBeGreaterThanOrEqual(584 * 2);
    expect(LARGURAS_DO_CARTAO[0]).toBeLessThanOrEqual(88 * 2);
  });
});

describe("Outras notícias", () => {
  it("as três mais recentes que não são a aberta, na ordem", () => {
    expect(LIMITE_DE_OUTRAS).toBe(3);
    expect(outrasNoticias(varias(5), "noticia-2").map((n) => n.slug)).toEqual([
      "noticia-1",
      "noticia-3",
      "noticia-4",
    ]);
  });

  it("com menos, as que houver; sem outra, nenhuma", () => {
    expect(outrasNoticias(varias(2), "noticia-1").map((n) => n.slug)).toEqual(["noticia-2"]);
    expect(outrasNoticias([noticia(1)], "noticia-1")).toEqual([]);
    expect(outrasNoticias([], "noticia-1")).toEqual([]);
  });

  it("três por linha, como a lista com quatro notícias ou mais", () => {
    expect(TRES_POR_LINHA).toEqual({ colunas: 3, deitado: false });
  });
});

describe("a assinatura", () => {
  it("o nome, o link do perfil e MÉDICO · CRM/UF", () => {
    expect(
      assinaturaDoAutor({ nome: "Rafael Coelho", crm: "10137", crmUf: "MA", slugDoPerfil: "rafael-coelho" }),
    ).toEqual({ nome: "Rafael Coelho", perfil: "/medico/rafael-coelho", registro: "MÉDICO · CRM/MA 10137" });
  });

  it("sem perfil, ou com o campo em branco, sem link", () => {
    for (const slugDoPerfil of [undefined, "", "   "]) {
      expect(assinaturaDoAutor({ nome: "Rafael Coelho", crm: "10137", crmUf: "ma", slugDoPerfil })).toEqual({
        nome: "Rafael Coelho",
        perfil: null,
        registro: "MÉDICO · CRM/MA 10137",
      });
    }
  });

  it("a volta da notícia aberta é a lista", () => {
    expect(VOLTA_NOTICIAS).toEqual({ href: "/noticias", rotulo: "Notícias" });
  });
});

describe("a capa da notícia aberta, em 16:9", () => {
  it("a altura de cada largura pedida ao CDN", () => {
    expect(LARGURAS_DA_CAPA.map(alturaDaCapa)).toEqual([360, 540, 675, 900, 1125, 1350]);
  });

  it("sem ponto de interesse marcado, o CDN recorta pelo meio", () => {
    const capa = capaDaNoticia({ asset: { _ref: REF }, alt: "Plateia", hotspot: null, crop: null }, CONFIG);
    expect(capa?.src).toBe(`${CDN}?rect=0,105,2000,1125&w=1600&h=900&fit=crop&auto=format`);
  });

  it("com o ponto de interesse embaixo, o recorte desce até ele, em todas as larguras", () => {
    const capa = capaDaNoticia(
      {
        asset: { _ref: REF },
        alt: "Plateia sentada num auditório escuro",
        hotspot: { x: 0.5, y: 0.9, width: 0.2, height: 0.2 },
      },
      CONFIG,
    );
    expect(capa).toEqual({
      src: `${CDN}?rect=0,208,2000,1125&w=1600&h=900&fit=crop&auto=format`,
      srcSet: LARGURAS_DA_CAPA.map(
        (l) => `${CDN}?rect=0,208,2000,1125&w=${l}&h=${alturaDaCapa(l)}&fit=crop&auto=format ${l}w`,
      ).join(", "),
      alt: "Plateia sentada num auditório escuro",
      largura: 1600,
      altura: 900,
    });
  });

  it("o recorte que a AMI marcou no Studio também vale", () => {
    const capa = capaDaNoticia(
      {
        asset: { _ref: REF },
        alt: "x",
        hotspot: { x: 0.5, y: 0.1, width: 0.2, height: 0.2 },
        crop: { top: 0, bottom: 0, left: 0.25, right: 0 },
      },
      CONFIG,
    );
    expect(capa?.src).toBe(`${CDN}?rect=500,0,1500,844&w=1600&h=900&fit=crop&auto=format`);
  });

  it("sem capa, ou com a referência quebrada, nada", () => {
    expect(capaDaNoticia(undefined, CONFIG)).toBeNull();
    expect(capaDaNoticia({ asset: { _ref: "nao-e-um-ref-valido" }, alt: "" }, CONFIG)).toBeNull();
  });

  it("o sizes: a largura dos painéis; no celular, de 12 a 378", () => {
    expect(SIZES_DA_CAPA).toBe(
      "(min-width: 1240px) 1192px, (min-width: 701px) calc(100vw - 48px), calc(100vw - 24px)",
    );
    expect(LARGURAS_DA_CAPA.at(-1)).toBeGreaterThanOrEqual(1192 * 2);
  });
});

describe("a imagem no meio do texto", () => {
  const CDN_DO_TEXTO = "https://cdn.sanity.io/images/abcd1234/production/fed654cba321-1400x934.jpg";

  it("na proporção do arquivo, sem recorte, com o srcset", () => {
    expect(
      imagemDoTexto({ asset: { _ref: "image-fed654cba321-1400x934-jpg" }, alt: "Auditório vazio" }, CONFIG),
    ).toEqual({
      src: `${CDN_DO_TEXTO}?w=960&fit=crop&auto=format`,
      srcSet: LARGURAS_DA_IMAGEM_DO_TEXTO.map((l) => `${CDN_DO_TEXTO}?w=${l}&fit=crop&auto=format ${l}w`).join(", "),
      alt: "Auditório vazio",
      largura: 1360,
      altura: 907,
    });
  });

  it("referência quebrada: nada", () => {
    expect(imagemDoTexto({ asset: { _ref: "nao-e-um-ref-valido" }, alt: "" }, CONFIG)).toBeNull();
  });

  it("o sizes: a coluna de leitura (680px, mais larga de 981 a 1180px); a coluna do texto no tablet e no celular", () => {
    expect(SIZES_DA_IMAGEM_DO_TEXTO).toBe(
      "(min-width: 1181px) 680px, (min-width: 981px) calc(100vw - 412px), " +
        "(min-width: 701px) calc(100vw - 104px), calc(100vw - 64px)",
    );
  });
});
```

- [ ] **Step 2: Os testes do contato**

`testes/contato-funcoes.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { AMI } from "@/lib/ami";
import { canaisDeContato, perfilDoInstagram } from "@/lib/paginaDeContato";

/*
  Os canais da página de contato, em função pura: os três cartões, na
  ordem do desenho, com os dados de lib/ami.ts. O desenho deles é testado
  por renderização em testes/contato-na-tela.test.ts.
*/

describe("os canais de contato", () => {
  it("telefone da sede, celular e Instagram, nessa ordem, com o texto do desenho", () => {
    expect(canaisDeContato()).toEqual([
      {
        chave: "fixo",
        icone: "telefone",
        rotulo: "Telefone da sede",
        dado: "(99) 3524-3716",
        longo: false,
        nota: "Linha fixa, na sede da AMI.",
        acao: {
          tipo: "ligar",
          href: "tel:+559935243716",
          texto: "Ligar",
          rotulo: "Ligar para a sede da AMI, (99) 3524-3716",
        },
      },
      {
        chave: "celular",
        icone: "celular",
        rotulo: "Celular",
        dado: "(99) 98802-0205",
        longo: false,
        nota: "Linha de celular da AMI.",
        acao: {
          tipo: "ligar",
          href: "tel:+5599988020205",
          texto: "Ligar",
          rotulo: "Ligar para o celular da AMI, (99) 98802-0205",
        },
      },
      {
        chave: "instagram",
        icone: "instagram",
        rotulo: "Instagram",
        dado: "@associacaomedicadeimperatriz",
        longo: true,
        nota: "O perfil da associação.",
        acao: {
          tipo: "abrir",
          href: "https://www.instagram.com/associacaomedicadeimperatriz/",
          texto: "Abrir o Instagram",
          rotulo: "Abrir o Instagram da AMI",
        },
      },
    ]);
  });

  it("sem e-mail e sem WhatsApp, enquanto lib/ami.ts não tiver nenhum dos dois", () => {
    expect(JSON.stringify(canaisDeContato())).not.toMatch(/whatsapp|wa\.me|mailto|e-mail/i);
  });

  it("os dados são os de lib/ami.ts, e não uma cópia", () => {
    const [fixo, celular] = AMI.telefones;
    expect(canaisDeContato().map((c) => c.dado)).toEqual([
      fixo,
      celular,
      perfilDoInstagram(AMI.redes.instagram),
    ]);
  });
});

describe("o perfil do Instagram", () => {
  it("o nome do perfil, tirado do endereço, com a arroba", () => {
    expect(perfilDoInstagram("https://www.instagram.com/associacaomedicadeimperatriz/")).toBe(
      "@associacaomedicadeimperatriz",
    );
    expect(perfilDoInstagram("https://instagram.com/ami")).toBe("@ami");
  });
});
```

- [ ] **Step 3: O teste da consulta e o do endereço recortado**

`testes/noticias-consulta.test.ts`:

```ts
import { evaluate, parse } from "groq-js";
import { describe, expect, it } from "vitest";
import { GROQ_NOTICIA, groqListaNoticias } from "@/lib/sanity/consultas";

/*
  As consultas de notícia, executadas de verdade pelo `groq-js` sobre
  documentos escritos aqui (o mesmo método de testes/banners-consulta.test.ts):
  a capa precisa trazer o ponto de interesse (`hotspot`) e o recorte
  (`crop`) que a AMI marca no Studio, senão a capa da notícia aberta sai
  recortada pelo meio. Texto da consulta conferido por expressão regular
  não mostraria o que a projeção devolve.
*/

const CAPA = {
  _type: "image",
  asset: { _type: "reference", _ref: "image-abc123def456-2000x1333-jpg" },
  alt: "Plateia no auditório",
  hotspot: { _type: "sanity.imageHotspot", x: 0.5, y: 0.9, width: 0.2, height: 0.2 },
  crop: { _type: "sanity.imageCrop", top: 0, bottom: 0, left: 0.25, right: 0 },
};

const DOCUMENTOS = [
  { _type: "autor", _id: "autor-rafael", nome: "Rafael Coelho", crm: "10137", crmUf: "MA", slugDoPerfil: "rafael-coelho" },
  {
    _type: "noticia",
    _id: "jornada",
    titulo: "Jornada",
    slug: { _type: "slug", current: "jornada" },
    resumo: "Resumo.",
    publicadoEm: "2026-09-18T12:00:00Z",
    capa: CAPA,
    autor: { _type: "reference", _ref: "autor-rafael" },
    corpo: [],
  },
  {
    _type: "noticia",
    _id: "comunicado",
    titulo: "Comunicado",
    slug: { _type: "slug", current: "comunicado" },
    resumo: "Resumo.",
    publicadoEm: "2026-07-30T12:00:00Z",
    autor: { _type: "reference", _ref: "autor-rafael" },
    corpo: [],
  },
];

type Linha = { titulo: string; capa: unknown };

async function consultar(consulta: string, params: Record<string, unknown> = {}): Promise<unknown> {
  const valor = await evaluate(parse(consulta), { dataset: DOCUMENTOS, params });
  return valor.get();
}

const ESPERADA = { asset: CAPA.asset, alt: CAPA.alt, hotspot: CAPA.hotspot, crop: CAPA.crop };

describe("a capa nas consultas de notícia", () => {
  it("a notícia aberta traz o ponto de interesse e o recorte da capa", async () => {
    const n = (await consultar(GROQ_NOTICIA, { slug: "jornada" })) as Linha;
    expect(n.capa).toEqual(ESPERADA);
  });

  it("a lista também: o destaque e os cartões usam a mesma projeção", async () => {
    const [primeira] = (await consultar(groqListaNoticias(20))) as Linha[];
    expect(primeira.titulo).toBe("Jornada");
    expect(primeira.capa).toEqual(ESPERADA);
  });

  it("sem capa, a capa volta nula e a notícia vem", async () => {
    const n = (await consultar(GROQ_NOTICIA, { slug: "comunicado" })) as Linha;
    expect(n.titulo).toBe("Comunicado");
    expect(n.capa).toBeNull();
  });
});
```

Em `testes/sanity-imagem.test.ts` (LF):

1. Troque `import { dimensoesDoRef, urlDaImagem } from "@/lib/sanity/imagem";` por `import { dimensoesDoRef, urlDaImagem, urlRecortada } from "@/lib/sanity/imagem";`.
2. Troque o começo do teste do `fit=crop`:

```ts
  it("envia fit=crop, pronto para um chamador que também passe altura", () => {
    /* Sozinho, sem `.height()`, `fit=crop` não recorta nada (ver o
       comentário em lib/sanity/imagem.ts). O parâmetro fica na URL para o
       dia em que um chamador (uma capa de matéria, por exemplo) também pedir
       altura, e ganhar o recorte pelo ponto de interesse de graça. */
```

por

```ts
  it("envia fit=crop, que sem altura não recorta nada", () => {
    /* Sozinho, sem `.height()`, `fit=crop` não recorta nada (ver o
       comentário em lib/sanity/imagem.ts): a foto sai inteira. Quem quer o
       recorte pelo ponto de interesse usa `urlRecortada`, testada logo
       abaixo. */
```

3. Acrescente, depois do `describe("urlDaImagem", …)` inteiro (antes de `describe("configuração padrão de urlDaImagem"`):

```ts
describe("urlRecortada", () => {
  const CAPA = { asset: { _ref: "image-abc123def456-2000x1333-jpg" }, alt: "Plateia" };
  const BASE = "https://cdn.sanity.io/images/abcd1234/production/abc123def456-2000x1333.jpg";

  it("pede largura e altura; sem ponto de interesse, o CDN recorta pelo meio", () => {
    const esperado = `${BASE}?rect=0,105,2000,1125&w=1600&h=900&fit=crop&auto=format`;
    expect(urlRecortada(CAPA, 1600, 900, CONFIG)).toBe(esperado);
    /* O GROQ devolve null quando a AMI não marcou nada. */
    expect(urlRecortada({ ...CAPA, hotspot: null, crop: null }, 1600, 900, CONFIG)).toBe(esperado);
  });

  it("o ponto de interesse move o recorte", () => {
    expect(urlRecortada({ ...CAPA, hotspot: { x: 0.5, y: 0.9, width: 0.2, height: 0.2 } }, 1600, 900, CONFIG)).toBe(
      `${BASE}?rect=0,208,2000,1125&w=1600&h=900&fit=crop&auto=format`,
    );
  });

  it("o recorte marcado no Studio também", () => {
    expect(
      urlRecortada(
        {
          ...CAPA,
          hotspot: { x: 0.5, y: 0.1, width: 0.2, height: 0.2 },
          crop: { top: 0, bottom: 0, left: 0.25, right: 0 },
        },
        1600,
        900,
        CONFIG,
      ),
    ).toBe(`${BASE}?rect=500,0,1500,844&w=1600&h=900&fit=crop&auto=format`);
  });

  it("degrada a referência quebrada em vez de derrubar a página", () => {
    expect(urlRecortada({ asset: { _ref: "nao-e-um-ref-valido" }, alt: "" }, 1600, 900, CONFIG)).toBe("");
  });
});
```

Em `testes/icones.test.ts` (CRLF), no teste "cada nome desenha o icone Phosphor dele" (o `Icone` dele é o de `IconeServidor.tsx`, que aceita todos os nomes):

1. Acrescente ao import de `@phosphor-icons/react/dist/ssr`, em ordem alfabética, os nomes `Clock`, `InstagramLogo` e `Newspaper`.
2. Acrescente ao objeto `esperado`, depois da última entrada (a do plano de A Associação é `celular: DeviceMobile,`):

```ts
      jornal: Newspaper,
      instagram: InstagramLogo,
      horario: Clock,
```

3. No fim do mesmo teste, troque o número de ícones diferentes entre si, no comentário e na asserção, de `44` para `47`:

```ts
    /* E os 47 são diferentes entre si: nenhum par repetido na tabela. */
    const htmls = Object.keys(esperado).map((nome) => renderToString(createElement(Icone, { nome: nome as NomeIcone })));
    expect(new Set(htmls).size).toBe(47);
```

Se o número de lá não for 44, some 3 ao que estiver e avise: o plano de A Associação mudou na execução.

Os três nomes novos não entram em `mapaDoCliente`: nenhum componente de cliente os desenha, e o teste "o mapa do cliente so tem icones que o cliente desenha" reprovaria.

- [ ] **Step 4: Rodar e ver falhar**

Run: `npx vitest run testes/noticias-funcoes.test.ts testes/contato-funcoes.test.ts testes/noticias-consulta.test.ts testes/sanity-imagem.test.ts testes/icones.test.ts`
Expected: FAIL. `lib/noticias.ts` e `lib/paginaDeContato.ts` não existem; `arranjoDaLista`, `tamanhoDosCartoes` e `urlRecortada` não existem; a consulta não traz `hotspot` nem `crop`; os ícones novos não estão em `IconeServidor.tsx`.

- [ ] **Step 5: Os tipos da capa**

Em `lib/sanity/tipos.ts` (CRLF):

1. Depois do tipo `ImagemSanity` (o bloco que termina em `  legenda?: string;\n};`), acrescente:

```ts

/*
  O ponto de interesse e o recorte que a AMI marca na capa da notícia, no
  Studio (o "hotspot" e o "crop" do Sanity), em frações da imagem, de 0 a
  1. O GROQ devolve null quando ela não marcou. Quem os usa é
  `urlRecortada` (lib/sanity/imagem.ts), para a capa sair em 16:9 sem
  cortar o que importa.
*/
export type PontoDeInteresse = { x: number; y: number; width: number; height: number };
export type Recorte = { top: number; bottom: number; left: number; right: number };
export type CapaSanity = ImagemSanity & { hotspot?: PontoDeInteresse | null; crop?: Recorte | null };
```

2. No tipo `ResumoNoticia`, troque `  capa?: ImagemSanity;` por `  capa?: CapaSanity;`.

Em `lib/sanity/consultas.ts` (CRLF), troque:

```ts
const PROJECAO_CAPA = `capa{asset, alt}`;
```

por

```ts
/* `hotspot` e `crop`: a capa da notícia aberta sai em 16:9, recortada pelo
   ponto de interesse que a AMI marcou (`urlRecortada`, lib/sanity/imagem.ts). */
const PROJECAO_CAPA = `capa{asset, alt, hotspot, crop}`;
```

- [ ] **Step 6: O endereço recortado**

Em `lib/sanity/imagem.ts` (CRLF):

1. Troque `import type { ImagemSanity } from "@/lib/sanity/tipos";` por `import type { CapaSanity, ImagemSanity } from "@/lib/sanity/tipos";`.
2. Depois da função `configuracaoPadrao` (antes de `export function urlDaImagem(`), acrescente:

```ts

/** O projeto e o dataset do Sanity, para montar o endereço do CDN. */
export type ConfiguracaoDoSanity = { projectId: string; dataset: string };
```

3. No comentário de dentro de `urlDaImagem`, troque o segundo parágrafo:

```
        Isso é comportamento desejado, não um descuido: quem chama esta
        função sem largura fixa de exibição, como `TextoRico` para imagem no
        corpo do texto, quer a foto exatamente como a AMI enviou, sem
        recortar rosto ou detalhe fora de um retângulo arbitrário. `fit=crop`
        continua na cadeia porque é o parâmetro que o CDN exige para que um
        chamador futuro que também passe altura (uma capa de matéria, por
        exemplo) ganhe o recorte pelo hotspot de graça, sem precisar mudar
        esta função.
```

por

```
        Isso é comportamento desejado, não um descuido: quem chama esta
        função quer a foto exatamente como a AMI enviou, sem recortar rosto
        ou detalhe fora de um retângulo arbitrário (a imagem no meio do
        texto de uma notícia, as miniaturas, os banners). Quem quer o
        recorte numa proporção fixa, pelo ponto de interesse, usa
        `urlRecortada`, logo abaixo: lá vão a altura e o `hotspot`, que
        aqui ficam de fora (`.image()` recebe só o `asset`).
```

4. No comentário do `catch` de `urlDaImagem`, troque as duas linhas

```
      A AMI perde uma foto, não a notícia inteira. Quem chama decide o que
      fazer com uma resposta vazia; ver `TextoRico.tsx`, que descarta o
      bloco de imagem inteiro nesse caso.
```

por

```
      A AMI perde uma foto, não a notícia inteira. Quem chama decide o que
      fazer com uma resposta vazia: a imagem no meio do texto descarta o
      bloco inteiro (`imagemDoTexto`, lib/noticias.ts).
```

5. Depois da função `urlDaImagem` inteira (antes do comentário "Dimensões reais de uma imagem"), acrescente:

```ts

/*
  Endereço de uma imagem recortada numa proporção fixa, pelo ponto de
  interesse e pelo recorte que a AMI marcou no Studio: a capa da notícia
  aberta, em 16:9 (`capaDaNoticia`, lib/noticias.ts).

  Com largura E altura, o `@sanity/image-url` calcula o retângulo (`rect`)
  a partir do `crop` e do `hotspot` da imagem; sem os dois, recorta pelo
  meio. Por isso a imagem vai inteira para `.image()`, e não só o `asset`
  como em `urlDaImagem`. O null do GROQ (a AMI não marcou) fica de fora: o
  construtor espera objeto ou nada.

  Mesmo contrato de `urlDaImagem`: `_ref` malformado devolve "", e quem
  chama decide.
*/
export function urlRecortada(
  imagem: CapaSanity,
  largura: number,
  altura: number,
  configuracao: ConfiguracaoDoSanity = configuracaoPadrao(),
): string {
  try {
    return createImageUrlBuilder(configuracao)
      .image({
        asset: imagem.asset,
        ...(imagem.hotspot ? { hotspot: imagem.hotspot } : {}),
        ...(imagem.crop ? { crop: imagem.crop } : {}),
      })
      .width(largura)
      .height(altura)
      .fit("crop")
      .auto("format")
      .url();
  } catch {
    return "";
  }
}
```

- [ ] **Step 7: O arranjo e o `sizes` da lista**

Em `lib/arranjo-das-noticias.ts` (CRLF), acrescente no fim do arquivo:

```ts

/*
  A lista de /noticias (components/editorial/ListaDeNoticias.tsx): a mais
  recente em destaque, na largura dos painéis, e as outras em cartões
  embaixo. Com poucas, vale a regra da home (`arranjoDasNoticias`, acima),
  para não sobrar coluna vazia:
  - 1: só o destaque;
  - 2: um cartão deitado embaixo, com a foto da largura de uma coluna de
    três;
  - 3: duas colunas;
  - 4 ou mais: três por linha; a última fileira pode ficar incompleta,
    alinhada à esquerda, como numa grade comum.
*/
export type ArranjoDaLista = {
  /** Colunas da grade embaixo do destaque (0 quando não há cartão). */
  colunas: number;
  /** Um cartão só embaixo do destaque: deitado. */
  deitado: boolean;
};

export function arranjoDaLista(quantas: number): ArranjoDaLista | null {
  const a = arranjoDasNoticias(quantas);
  return a ? { colunas: a.colunas, deitado: a.deitado } : null;
}

/*
  O `sizes` da lista, pelo CSS de components/editorial/Noticias.module.css
  e pelas réguas de app/globals.css. A lista é um bloco da caixa da página
  (app/(site)/encontre.module.css): 1192px a partir de 1240px de tela;
  100vw − 48px de 701 a 1239px; no celular, 100vw − 24px, menos `--m`
  (20px) de cada lado, porque a lista fica na coluna do texto.
  - O destaque ocupa o bloco inteiro.
  - Os cartões, com o vão `--gap` (24px; 16px até 980px): três por linha
    acima de 980px, ou tantas colunas quantas o arranjo pedir; duas no
    tablet; no celular, a miniatura de 88px. O cartão deitado é uma
    coluna de três em todas as larguras acima de 700px.
  `100vw` inclui a barra de rolagem e o bloco não: o `sizes` sai uns 15px
  maior que a imagem, o que só pode fazer o navegador escolher o arquivo de
  cima.
*/
const PAINEL: Array<[string, string]> = [
  ["(min-width: 1240px)", "1192px"],
  ["(min-width: 981px)", "100vw - 48px"],
  ["(min-width: 701px)", "100vw - 48px"],
];

export const SIZES_DO_DESTAQUE_DA_LISTA = sizes(
  [
    ["(min-width: 1240px)", "1192px"],
    ["(min-width: 701px)", "calc(100vw - 48px)"],
  ],
  "calc(100vw - 64px)",
);

/** O `sizes` da foto do cartão. Só para arranjo com cartão (`colunas` > 0). */
export function tamanhoDosCartoes(a: ArranjoDaLista): string {
  const porLinha = a.deitado ? 3 : a.colunas;
  return sizes(
    [
      [PAINEL[0][0], coluna(PAINEL[0][1], porLinha, 24)],
      [PAINEL[1][0], coluna(PAINEL[1][1], porLinha, 24)],
      [PAINEL[2][0], coluna(PAINEL[2][1], a.deitado ? 3 : 2, 16)],
    ],
    "88px",
  );
}

/* As larguras pedidas ao CDN para o `srcset`: o destaque chega a 1192px
   (2384 em densidade 2); o cartão de duas colunas, a 584px (1168); a
   miniatura do celular tem 88px (176). */
export const LARGURAS_DO_DESTAQUE_DA_LISTA = [480, 640, 960, 1280, 1600, 2400] as const;
export const LARGURAS_DO_CARTAO = [160, 320, 480, 640, 960, 1200] as const;
```

`sizes` e `coluna` são as funções privadas que o arquivo já tem, mais acima; declaradas com `function`, elas existem quando a constante é avaliada.

- [ ] **Step 8: `lib/noticias.ts`**

```ts
import { arranjoDaLista, type ArranjoDaLista } from "@/lib/arranjo-das-noticias";
import { identificacaoMedica } from "@/lib/formato";
import type { VoltaDaPagina } from "@/lib/paginaDeTexto";
import {
  dimensoesDoRef,
  urlDaImagem,
  urlRecortada,
  type ConfiguracaoDoSanity,
} from "@/lib/sanity/imagem";
import type { Autor, CapaSanity, ImagemSanity, ResumoNoticia } from "@/lib/sanity/tipos";

/*
  O que as páginas de notícias decidem, em funções puras
  (testes/noticias-funcoes.test.ts):
  - o que a lista mostra: o destaque e a grade, ou, sem notícia, as
    molduras (só na demonstração) ou a frase de lista vazia;
  - "Outras notícias", no fim da notícia aberta;
  - a assinatura do autor, com o link do perfil quando há;
  - a capa da notícia aberta em 16:9, pelo ponto de interesse;
  - a imagem no meio do texto, na proporção do arquivo.
*/

/** No máximo 20 na lista, como antes. Sem paginação: "Mais antigas" é outra fatia. */
export const LIMITE_DA_LISTA = 20;

/** A notícia aberta volta à lista (o "← NOTÍCIAS" da faixa). */
export const VOLTA_NOTICIAS: VoltaDaPagina = { href: "/noticias", rotulo: "Notícias" };

export type ListaNaTela =
  | { tipo: "noticias"; destaque: ResumoNoticia; grade: ResumoNoticia[]; arranjo: ArranjoDaLista }
  | { tipo: "a-entrar" }
  | { tipo: "nenhuma" };

/**
 * A lista de /noticias. Com notícia, a mais recente em destaque e as outras
 * na grade, no arranjo da home (`arranjoDaLista`). Sem notícia, a mesma
 * trava das molduras da home (lib/molduras.ts): na demonstração, os cartões
 * "Notícia a entrar"; fora dela, a lista vazia.
 */
export function listaDeNoticias(demonstracao: boolean, noticias: ResumoNoticia[]): ListaNaTela {
  const reais = noticias.slice(0, LIMITE_DA_LISTA);
  const arranjo = arranjoDaLista(reais.length);
  if (!arranjo) return demonstracao ? { tipo: "a-entrar" } : { tipo: "nenhuma" };
  const [destaque, ...grade] = reais;
  return { tipo: "noticias", destaque, grade, arranjo };
}

/** Quantas "Outras notícias" a notícia aberta mostra. */
export const LIMITE_DE_OUTRAS = 3;

/** Três por linha: "Outras notícias" e as molduras da lista. */
export const TRES_POR_LINHA: ArranjoDaLista = { colunas: 3, deitado: false };

/** As mais recentes que não são a notícia aberta, até três; com menos, as que houver. */
export function outrasNoticias(noticias: ResumoNoticia[], slugAtual: string): ResumoNoticia[] {
  return noticias.filter((n) => n.slug !== slugAtual).slice(0, LIMITE_DE_OUTRAS);
}

export type Assinatura = {
  nome: string;
  /** O endereço do perfil no diretório, ou null sem perfil. */
  perfil: string | null;
  /** "MÉDICO · CRM/MA 10137": a Resolução CFM 2.336/2023 pede o CRM junto do nome. */
  registro: string;
};

/**
 * Quem assina a notícia. O laço com o diretório é o `slugDoPerfil` do
 * autor, opcional (sanity/schemas/autor.ts): em branco, o nome sai sem
 * link.
 */
export function assinaturaDoAutor(autor: Autor): Assinatura {
  const slug = autor.slugDoPerfil?.trim() ?? "";
  return {
    nome: autor.nome,
    perfil: slug ? `/medico/${slug}` : null,
    registro: identificacaoMedica(autor.crm, autor.crmUf),
  };
}

/** Uma imagem pronta para o `<img>`: o endereço, o `srcset`, o texto alternativo e o par de medidas. */
export type ImagemNaTela = { src: string; srcSet: string; alt: string; largura: number; altura: number };

/*
  A capa da notícia aberta, em 16:9, na largura dos painéis
  (components/editorial/CapaDaNoticia.tsx): 1192px a partir de 1240px de
  tela, 100vw − 48px até 701px, e no celular de 12 a 378 (100vw − 24px). A
  maior largura pedida cobre 1192px em densidade 2.
*/
export const LARGURAS_DA_CAPA = [640, 960, 1200, 1600, 2000, 2400] as const;
const LARGURA_DA_CAPA = 1600;
export const SIZES_DA_CAPA =
  "(min-width: 1240px) 1192px, (min-width: 701px) calc(100vw - 48px), calc(100vw - 24px)";

/** A altura de uma largura, em 16:9. */
export function alturaDaCapa(largura: number): number {
  return Math.round((largura * 9) / 16);
}

/**
 * A capa recortada em 16:9 pelo ponto de interesse que a AMI marcou no
 * Studio (`urlRecortada`). Sem capa, ou com a referência quebrada em
 * alguma largura, null: a notícia sai sem capa, e não com uma imagem
 * quebrada.
 */
export function capaDaNoticia(
  capa: CapaSanity | undefined,
  configuracao?: ConfiguracaoDoSanity,
): ImagemNaTela | null {
  if (!capa) return null;
  const urls = LARGURAS_DA_CAPA.map((l) => urlRecortada(capa, l, alturaDaCapa(l), configuracao));
  if (urls.some((u) => !u)) return null;
  return {
    src: urls[LARGURAS_DA_CAPA.indexOf(LARGURA_DA_CAPA)],
    srcSet: urls.map((u, i) => `${u} ${LARGURAS_DA_CAPA[i]}w`).join(", "),
    alt: capa.alt,
    largura: LARGURA_DA_CAPA,
    altura: alturaDaCapa(LARGURA_DA_CAPA),
  };
}

/*
  A imagem no meio do texto da notícia (components/editorial/CorpoDoTexto.tsx),
  na largura da coluna de leitura (components/editorial/PaginaDeTexto.module.css):
  - acima de 1180px, 680px;
  - de 981 a 1180px, a coluna é o que sobra do índice de 220px e do vão de
    48px, dentro da faixa com 72px de cada lado: 100vw − 412px;
  - de 701 a 980px, uma coluna, com 52px de cada lado;
  - no celular, 32px de cada lado.
  Sem recorte: a imagem sai na proporção do arquivo que a AMI enviou, e o
  par de medidas (largura 1360, altura proporcional) reserva o espaço antes
  de ela chegar.
*/
export const LARGURAS_DA_IMAGEM_DO_TEXTO = [480, 720, 960, 1360, 1600] as const;
const LARGURA_DA_IMAGEM_DO_TEXTO = 1360;
export const SIZES_DA_IMAGEM_DO_TEXTO =
  "(min-width: 1181px) 680px, (min-width: 981px) calc(100vw - 412px), " +
  "(min-width: 701px) calc(100vw - 104px), calc(100vw - 64px)";

/** A imagem do texto, ou null quando a referência não dá endereço nem medidas. */
export function imagemDoTexto(
  imagem: ImagemSanity,
  configuracao?: ConfiguracaoDoSanity,
): ImagemNaTela | null {
  const dimensoes = dimensoesDoRef(imagem.asset._ref);
  if (!dimensoes) return null;
  const urls = LARGURAS_DA_IMAGEM_DO_TEXTO.map((l) => urlDaImagem(imagem, l, configuracao));
  if (urls.some((u) => !u)) return null;
  return {
    src: urls[LARGURAS_DA_IMAGEM_DO_TEXTO.indexOf(960)],
    srcSet: urls.map((u, i) => `${u} ${LARGURAS_DA_IMAGEM_DO_TEXTO[i]}w`).join(", "),
    alt: imagem.alt,
    largura: LARGURA_DA_IMAGEM_DO_TEXTO,
    altura: Math.round((LARGURA_DA_IMAGEM_DO_TEXTO * dimensoes.altura) / dimensoes.largura),
  };
}
```

`urlDaImagem(imagem, l, configuracao)` e `urlRecortada(…, configuracao)` com `configuracao` `undefined` caem no valor padrão do parâmetro, que lê o ambiente: no site, nada muda; no teste, `CONFIG` fixa o projeto.

- [ ] **Step 9: `lib/paginaDeContato.ts`**

```ts
import type { NomeIcone } from "@/components/base/IconeServidor";
import { AMI, hrefTelefone } from "@/lib/ami";

/*
  Os canais da página de contato (/contato), em funções puras
  (testes/contato-funcoes.test.ts): o telefone fixo da sede, o celular e o
  Instagram, nessa ordem, com os dados de lib/ami.ts, a fonte única que o
  rodapé e o dado estruturado da home também leem.

  Sem e-mail e sem WhatsApp: lib/ami.ts não tem e-mail, e nenhum dos dois
  números está confirmado como WhatsApp. Quando a AMI informar, o canal
  entra aqui.
*/

export type Canal = {
  chave: "fixo" | "celular" | "instagram";
  icone: NomeIcone;
  /** O rótulo pequeno, em caixa alta pelo CSS. */
  rotulo: string;
  /** O número, ou o perfil do Instagram. */
  dado: string;
  /** O dado é longo (o perfil): letra menor, e pode quebrar. */
  longo: boolean;
  /** A linha de apoio, que some no celular. */
  nota: string;
  /**
   * O botão: "ligar" é o verde, com o telefone; "abrir" é o de contorno,
   * com a seta. `rotulo` é o nome do link para o leitor de tela.
   */
  acao: { tipo: "ligar" | "abrir"; href: string; texto: string; rotulo: string };
};

/** O perfil do Instagram, do endereço: "@associacaomedicadeimperatriz". */
export function perfilDoInstagram(endereco: string): string {
  const [perfil] = new URL(endereco).pathname.split("/").filter(Boolean);
  return `@${perfil}`;
}

export function canaisDeContato(): Canal[] {
  const [fixo, celular] = AMI.telefones;
  return [
    {
      chave: "fixo",
      icone: "telefone",
      rotulo: "Telefone da sede",
      dado: fixo,
      longo: false,
      nota: "Linha fixa, na sede da AMI.",
      acao: { tipo: "ligar", href: hrefTelefone(fixo), texto: "Ligar", rotulo: `Ligar para a sede da AMI, ${fixo}` },
    },
    {
      chave: "celular",
      icone: "celular",
      rotulo: "Celular",
      dado: celular,
      longo: false,
      nota: "Linha de celular da AMI.",
      acao: {
        tipo: "ligar",
        href: hrefTelefone(celular),
        texto: "Ligar",
        rotulo: `Ligar para o celular da AMI, ${celular}`,
      },
    },
    {
      chave: "instagram",
      icone: "instagram",
      rotulo: "Instagram",
      dado: perfilDoInstagram(AMI.redes.instagram),
      longo: true,
      nota: "O perfil da associação.",
      acao: {
        tipo: "abrir",
        href: AMI.redes.instagram,
        texto: "Abrir o Instagram",
        rotulo: "Abrir o Instagram da AMI",
      },
    },
  ];
}
```

- [ ] **Step 10: Os ícones**

Em `components/base/IconeServidor.tsx` (mantenha o fim de linha):

1. No import de `@phosphor-icons/react/dist/ssr`, depois do último nome, acrescente:

```ts
  Newspaper,
  InstagramLogo,
  Clock,
```

2. No objeto `mapaDeTodos`, depois da última entrada (antes de `} satisfies Record<string, Icon>;`), acrescente:

```ts
  jornal: Newspaper,
  instagram: InstagramLogo,
  horario: Clock,
```

`NomeIcone` é `keyof typeof mapaDeTodos`: os três nomes entram nele sozinhos. `components/base/Icone.tsx` (o mapa do cliente) não muda.

- [ ] **Step 11: Rodar, provar por mutação, commit**

Run: `npx vitest run` · `npx tsc --noEmit` · `npm run build` → verde. `testes/noticias-da-home.test.ts`, `testes/jsonld.test.ts`, `testes/banners.test.ts` e `testes/sanity-consultas.test.ts` continuam verdes sem mudança: a home e o JSON-LD leem a capa como antes.

Mutações, uma de cada vez, regravando o original depois. Cada uma deixa um teste vermelho:

1. Em `arranjoDaLista`, devolva `deitado: false` sempre.
2. Em `listaDeNoticias`, troque os dois lados de `demonstracao ? … : …`.
3. Em `listaDeNoticias`, tire o `.slice(0, LIMITE_DA_LISTA)`.
4. Em `outrasNoticias`, tire o `.filter(…)`.
5. Em `assinaturaDoAutor`, tire o `.trim()`.
6. Em `tamanhoDosCartoes`, troque o `16` por `24`.
7. Em `tamanhoDosCartoes`, troque `a.deitado ? 3 : a.colunas` por `a.colunas`.
8. Em `urlRecortada`, passe `imagem.asset` para `.image()`, no lugar do objeto.
9. Em `urlRecortada`, tire o `.height(altura)`.
10. Em `alturaDaCapa`, troque `9` por `10`.
11. Em `imagemDoTexto`, troque `indexOf(960)` por `indexOf(1600)`.
12. Em `PROJECAO_CAPA`, tire o `crop`.
13. Em `perfilDoInstagram`, tire a arroba.
14. Em `canaisDeContato`, troque `hrefTelefone(celular)` por `hrefTelefone(fixo)`.
15. Troque `horario: Clock` por `horario: ClockCounterClockwise` no `IconeServidor.tsx`.

```bash
git add lib/noticias.ts lib/paginaDeContato.ts lib/arranjo-das-noticias.ts lib/sanity/imagem.ts lib/sanity/tipos.ts lib/sanity/consultas.ts components/base/IconeServidor.tsx testes/icones.test.ts testes/sanity-imagem.test.ts testes/noticias-funcoes.test.ts testes/contato-funcoes.test.ts testes/noticias-consulta.test.ts
git commit -m "Funcoes puras de Noticias e Contato: lista com destaque e grade, outras noticias, assinatura, capa 16:9 pelo ponto de interesse, imagem do texto, canais do contato e tres icones"
```

---
### Task 2: As peças de A Associação, alargadas: a faixa curta, o corpo em faixa branca e o texto rico

**Files:**
- Modify: `components/layout/FaixaCurta.tsx` (reescrita; leia antes)
- Create: `components/editorial/FaixaDoTexto.tsx`
- Modify: `components/editorial/PaginaDeTexto.tsx` (reescrita; leia antes)
- Modify: `components/editorial/CorpoDoTexto.tsx` (reescrita; leia antes)
- Modify: `components/editorial/PaginaDeTexto.module.css`
- Create: `testes/pecas-de-texto.test.ts`

**Interfaces:**
- Consumes:
  - `VOLTA_NOTICIAS`, `imagemDoTexto`, `SIZES_DA_IMAGEM_DO_TEXTO`, `LARGURAS_DA_IMAGEM_DO_TEXTO` (`lib/noticias.ts`) e o ícone `"jornal"` (Task 1);
  - do plano de A Associação: `VoltaDaPagina`, `ConteudoDaPagina`, `ancorasDoCorpo` (`lib/paginaDeTexto.ts`), `indiceNestaPagina` (`lib/nestaPagina.ts`), `IndiceNestaPagina`, `IndiceRecolhido`, `AvisoDoRascunho` (`lib/rascunhosLegais.ts`), as classes de `PaginaDeTexto.module.css`;
  - `ehLinkInterno` (`lib/sanity/link.ts`), `dataPorExtenso` (`lib/formato.ts`);
  - as classes `faixa`, `sobre`, `titulo`, `texto` de `components/busca/FaixaDaBusca.module.css` e `especialidade`, `volta`, `selo` de `components/especialidades/FaixaDaEspecialidade.module.css`.
- Produces:

```ts
// components/layout/FaixaCurta.tsx (as chamadas de A Associação continuam valendo)
type AltoDaFaixa = { volta: VoltaDaPagina; rotulo?: undefined } | { rotulo: string; volta?: undefined };
export function FaixaCurta(props: AltoDaFaixa & {
  titulo: string;
  texto: string;
  icone?: NomeIcone;      // sem ícone, sem o ladrilho à direita
  className?: string;     // acrescentada no fim da classe da faixa
  children?: ReactNode;   // logo depois do texto
}): JSX.Element; // <section data-bloco="topo" data-faixa="" data-abertura="" aria-labelledby="pagina-titulo" …>
// components/editorial/FaixaDoTexto.tsx
export function FaixaDoTexto(props: {
  rotulo: string;                 // o aria-label da faixa: "Texto da página", "Texto da notícia"
  atualizadoEm?: string;          // sem ela, sem a linha "Atualizado em"
  aviso?: AvisoDoRascunho | null; // o quadro cinza, antes do texto
  corpo: PortableTextBlock[];
  children?: ReactNode;           // no fim da coluna
}): JSX.Element; // <section data-bloco="texto" data-faixa="" aria-label={rotulo} class={faixa}>
// components/editorial/PaginaDeTexto.tsx e CorpoDoTexto.tsx: mesmas props de antes
```

**Por que alargar, e não criar faixas novas.** As três páginas abrem com a mesma faixa verde curta do desenho (`.busca-topo.esp-topo`): a lista e o contato com um rótulo no lugar do link de volta, a notícia aberta sem o ladrilho e com o título menor. Uma faixa nova por página repetiria o mesmo JSX e o mesmo CSS três vezes. O mesmo vale para o corpo: a notícia aberta é, do desenho, a página de texto com outra faixa em cima, a capa no meio e "Outras notícias" embaixo. Como `PaginaDeTexto` desenha a faixa e o corpo juntos, o corpo sai para `FaixaDoTexto`, e `PaginaDeTexto` passa a ser a faixa curta mais a `FaixaDoTexto`. O HTML das páginas de texto não muda: `testes/modelo-de-texto.test.ts`, `testes/seja-associado.test.ts` e `testes/aviso-do-rascunho.test.ts` ficam verdes sem mudança.

- [ ] **Step 1: Os testes**

`testes/pecas-de-texto.test.ts`:

```ts
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Icon } from "@phosphor-icons/react";
import { ArrowLeft, Newspaper } from "@phosphor-icons/react/dist/ssr";
import type { PortableTextBlock } from "@portabletext/react";
import estilosBusca from "@/components/busca/FaixaDaBusca.module.css";
import { CorpoDoTexto } from "@/components/editorial/CorpoDoTexto";
import { FaixaDoTexto } from "@/components/editorial/FaixaDoTexto";
import estilos from "@/components/editorial/PaginaDeTexto.module.css";
import estilosFaixa from "@/components/especialidades/FaixaDaEspecialidade.module.css";
import { FaixaCurta } from "@/components/layout/FaixaCurta";
import { LARGURAS_DA_IMAGEM_DO_TEXTO, SIZES_DA_IMAGEM_DO_TEXTO, VOLTA_NOTICIAS } from "@/lib/noticias";
import { fonte } from "@/testes/apoio";
import { base, bloco, regra, semNotas } from "@/testes/css";

/*
  As peças do plano de A Associação, alargadas para as notícias e o
  contato, no HTML de servidor:
  - a faixa curta com um rótulo no lugar do link de volta (a lista de
    notícias, o contato), e sem o ícone, com uma classe a mais (a notícia
    aberta);
  - o corpo em faixa branca, que saiu de PaginaDeTexto para a notícia
    aberta usar também;
  - o texto rico com a citação, a lista numerada e a imagem com legenda.

  O que essas peças já desenhavam continua provado pelos testes de lá
  (testes/faixa-curta-e-indice.test.ts, testes/modelo-de-texto.test.ts),
  que não mudam. O CSS se lê do arquivo.

  A imagem do texto monta o endereço do CDN com o projeto do ambiente: o
  teste o fixa por `stubEnv`.
*/

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_SANITY_PROJECT_ID", "abcd1234");
  vi.stubEnv("NEXT_PUBLIC_SANITY_DATASET", "production");
});

afterEach(() => {
  vi.unstubAllEnvs();
});

const desenho = (Componente: Icon, size: number, weight: "duotone" | "regular") =>
  renderToString(createElement(Componente, { size, weight, className: "", "aria-hidden": "true" }));

/** O texto que aparece, sem tags, num espaço só. */
const tela = (html: string) =>
  html
    .replace(/<!-- -->/g, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

/** O `&` como o HTML o escreve dentro de um atributo. */
const atributo = (texto: string) => texto.replaceAll("&", "&amp;");

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

describe("a faixa curta com rótulo", () => {
  const html = renderToString(
    createElement(FaixaCurta, {
      rotulo: "Notícias",
      titulo: "Notícias da AMI",
      texto: "Comunicados, eventos e notas da associação.",
      icone: "jornal",
    }),
  );

  it("a mesma faixa de ponta a ponta, que abre a página", () => {
    expect(html).toMatch(
      new RegExp(
        `^<section data-bloco="topo" data-faixa="" data-abertura="" aria-labelledby="pagina-titulo" class="textura-verde ${estilosBusca.faixa} ${estilosFaixa.especialidade}"><div class="brilho" aria-hidden="true"></div>`,
      ),
    );
  });

  it("o rótulo no lugar do link de volta, na coluna do texto, e nenhum link", () => {
    expect(html).toContain(
      `<div><span class="rotulo-secao ${estilosBusca.sobre}" data-coluna="">Notícias</span>` +
        `<h1 id="pagina-titulo" class="${estilosBusca.titulo}">Notícias da AMI</h1>` +
        `<p class="${estilosBusca.texto}">Comunicados, eventos e notas da associação.</p></div>`,
    );
    expect(html).not.toContain("<a ");
  });

  it("à direita, o ícone da página no ladrilho de vidro", () => {
    expect(html).toContain(
      `<div class="${estilosFaixa.selo}" aria-hidden="true">${desenho(Newspaper, 84, "duotone")}</div></section>`,
    );
  });
});

describe("a faixa curta sem ícone, com uma classe a mais", () => {
  const html = renderToString(
    createElement(
      FaixaCurta,
      { volta: VOLTA_NOTICIAS, titulo: "Jornada", texto: "Resumo.", className: "materia" },
      createElement("div", { className: "assinatura" }, "Por Rafael Coelho"),
    ),
  );

  it("a classe entra no fim da classe da faixa", () => {
    expect(html).toMatch(
      new RegExp(
        `^<section [^>]*class="textura-verde ${estilosBusca.faixa} ${estilosFaixa.especialidade} materia">`,
      ),
    );
  });

  it("o link de volta para a lista, com a seta, na coluna do texto", () => {
    const link = /<a [^>]*href="\/noticias"[^>]*>[\s\S]*?<\/a>/.exec(html)![0];
    expect(link).toContain('data-coluna=""');
    expect(link).toContain(desenho(ArrowLeft, 20, "regular"));
    expect(tela(link)).toBe("Notícias");
  });

  it("sem o ladrilho: a faixa termina no que vem junto, logo depois do texto", () => {
    expect(html).not.toContain(estilosFaixa.selo);
    expect(html).toMatch(
      new RegExp(
        `<p class="${estilosBusca.texto}">Resumo\\.</p><div class="assinatura">Por Rafael Coelho</div></div></section>$`,
      ),
    );
  });
});

describe("o corpo em faixa branca", () => {
  const CORPO = [b("a", "h2", "Programação"), b("b", "normal", "Texto."), b("c", "h2", "Como se inscrever")];

  it("a faixa com o nome dado e a coluna de leitura", () => {
    const html = renderToString(createElement(FaixaDoTexto, { rotulo: "Texto da notícia", corpo: CORPO }));
    expect(html).toMatch(
      new RegExp(
        `^<section data-bloco="texto" data-faixa="" aria-label="Texto da notícia" class="${estilos.faixa}"><div class="${estilos.grade}"><article class="${estilos.coluna}" data-coluna="">`,
      ),
    );
  });

  it("sem data de atualização, sem a linha do relógio", () => {
    const html = renderToString(createElement(FaixaDoTexto, { rotulo: "x", corpo: CORPO }));
    expect(html).not.toContain(estilos.atualizado);
    expect(html).not.toContain("Atualizado em");
  });

  it("com ela, a data por extenso no alto da coluna", () => {
    const html = renderToString(
      createElement(FaixaDoTexto, { rotulo: "x", atualizadoEm: "2026-09-20T13:00:00Z", corpo: CORPO }),
    );
    expect(html).toMatch(
      new RegExp(
        `<article class="${estilos.coluna}" data-coluna=""><p class="${estilos.atualizado}"><svg[^]*?</svg>Atualizado em <time dateTime="2026-09-20T13:00:00Z">20 de setembro de 2026</time></p>`,
      ),
    );
  });

  it("com dois títulos de seção, o índice; o que vem junto fecha a coluna", () => {
    const html = renderToString(
      createElement(FaixaDoTexto, { rotulo: "x", corpo: CORPO }, createElement("p", { className: "fim" }, "Fim")),
    );
    expect(html).toContain('<h2 id="secao-programacao">Programação</h2>');
    expect(html).toContain('<p class="fim">Fim</p></article><aside ');
    expect(html).toContain('data-nesta-pagina=""');
  });

  it("sem aviso, sem o quadro", () => {
    expect(renderToString(createElement(FaixaDoTexto, { rotulo: "x", corpo: CORPO }))).not.toContain('role="note"');
  });
});

describe("o texto rico", () => {
  const html = (blocos: PortableTextBlock[]) => renderToString(createElement(CorpoDoTexto, { blocos }));
  const CDN = "https://cdn.sanity.io/images/abcd1234/production/fed654cba321-1400x934.jpg";
  const imagem = (extra: Record<string, unknown> = {}) =>
    ({
      _type: "image",
      _key: "i",
      asset: { _type: "reference", _ref: "image-fed654cba321-1400x934-jpg" },
      alt: "Auditório vazio com mesas redondas",
      ...extra,
    }) as unknown as PortableTextBlock;

  it("a citação: uma tag só, sem aspas escritas", () => {
    expect(html([b("q", "blockquote", "Queremos que o médico saia da jornada com algo que use no consultório.")])).toBe(
      "<blockquote>Queremos que o médico saia da jornada com algo que use no consultório.</blockquote>",
    );
  });

  it("a lista numerada", () => {
    expect(
      html([
        b("1", "normal", "Tenha à mão o número do CRM.", { listItem: "number", level: 1 }),
        b("2", "normal", "Preencha o formulário.", { listItem: "number", level: 1 }),
      ]),
    ).toBe("<ol><li>Tenha à mão o número do CRM.</li><li>Preencha o formulário.</li></ol>");
  });

  it("a imagem: na proporção do arquivo, com o srcset e o sizes da coluna, a legenda embaixo e sem moldura", () => {
    const srcSet = LARGURAS_DA_IMAGEM_DO_TEXTO.map((l) => `${CDN}?w=${l}&fit=crop&auto=format ${l}w`).join(", ");
    expect(html([imagem({ legenda: "Palestras pela manhã, oficinas à tarde." })])).toBe(
      `<figure><img src="${atributo(`${CDN}?w=960&fit=crop&auto=format`)}" srcSet="${atributo(srcSet)}" ` +
        `sizes="${SIZES_DA_IMAGEM_DO_TEXTO}" alt="Auditório vazio com mesas redondas" width="1360" height="907" ` +
        `loading="lazy" decoding="async"/><figcaption>Palestras pela manhã, oficinas à tarde.</figcaption></figure>`,
    );
  });

  it("sem legenda, sem figcaption", () => {
    expect(html([imagem()])).not.toContain("<figcaption");
  });

  it("referência quebrada: a imagem some, e o texto continua", () => {
    const saida = html([imagem({ asset: { _type: "reference", _ref: "nao-e-um-ref-valido" } }), b("p", "normal", "Depois.")]);
    expect(saida).toBe("<p>Depois.</p>");
  });

  it("o link do texto leva a classe do desenho", () => {
    const comLink = {
      ...b("l", "normal", ""),
      markDefs: [{ _type: "link", _key: "k", href: "/associacao/seja-associado" }],
      children: [{ _type: "span", _key: "l1", text: "Seja associado", marks: ["k"] }],
    } as PortableTextBlock;
    expect(html([comLink])).toBe(`<p><a class="${estilos.link}" href="/associacao/seja-associado">Seja associado</a></p>`);
  });
});

describe("o CSS do texto rico", () => {
  const css = semNotas(fonte("../components/editorial/PaginaDeTexto.module.css"));
  const cel = () => bloco(css, "@media (max-width: 700px)");

  it("a lista numerada: sem o número do navegador, o número num círculo cinza com fio", () => {
    const ol = regra(base(css), ".coluna ol");
    expect(ol).toMatch(/list-style: none;/);
    expect(ol).toMatch(/counter-reset: passo;/);
    const numero = regra(base(css), ".coluna ol > li::before");
    expect(numero).toMatch(/content: counter\(passo\);/);
    expect(numero).toMatch(/width: 26px;/);
    expect(numero).toMatch(/border-radius: 99px;/);
    expect(numero).toMatch(/background: var\(--color-surface-fundo\);/);
    expect(numero).toMatch(/box-shadow: inset 0 0 0 1px var\(--color-line\);/);
    expect(numero).toMatch(/color: var\(--color-ami-green-800\);/);
    expect(regra(cel(), ".coluna ol > li::before")).toMatch(/width: 24px;/);
  });

  it("a citação: 20px com o fio verde à esquerda; 17,5px no celular", () => {
    const r = regra(base(css), ".coluna > blockquote");
    expect(r).toMatch(/border-left: 2px solid var\(--color-ami-green-600\);/);
    expect(r).toMatch(/font-size: 20px;/);
    expect(r).not.toMatch(/content/);
    expect(regra(cel(), ".coluna > blockquote")).toMatch(/font-size: 17\.5px;/);
  });

  it("a imagem: na largura da coluna, com canto de 16px, sem borda nem casca; a legenda em cinza", () => {
    const img = regra(base(css), ".coluna > figure img");
    expect(img).toMatch(/width: 100%;/);
    expect(img).toMatch(/border-radius: 16px;/);
    expect(img).not.toMatch(/border:|padding|box-shadow/);
    expect(regra(base(css), ".coluna figcaption")).toMatch(/color: var\(--color-ink-400\);/);
  });

  it("o link: o verde de ação, sublinhado fino; no mouse, o verde escurece", () => {
    const r = regra(base(css), ".link");
    expect(r).toMatch(/color: var\(--color-ami-green-600\);/);
    expect(r).toMatch(/text-decoration-thickness: 1px;/);
    expect(r).toMatch(/text-underline-offset: 3px;/);
    expect(regra(base(css), ".link:hover")).toMatch(/color: var\(--color-ami-green-800\);/);
  });
});
```

`<ol><li>…</li></ol>`, `<blockquote>` e `<p><a …>` saem sem nada entre as tags porque cada componente do `CorpoDoTexto` devolve a tag com os `children` direto, como os testes de A Associação já provam para `<ul>` e `<h2>`. O `&` dos endereços do CDN sai `&amp;` dentro do atributo.

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run testes/pecas-de-texto.test.ts`
Expected: FAIL. A `FaixaCurta` não aceita `rotulo` nem `className` e sempre desenha o ladrilho; `FaixaDoTexto` não existe; o texto rico não desenha a citação nem a imagem; o CSS não tem o número no círculo, a citação nem a imagem.

- [ ] **Step 3: A faixa curta**

Reescreva `components/layout/FaixaCurta.tsx` (leia antes; mantenha o fim de linha) inteiro:

```tsx
import Link from "next/link";
import type { ReactNode } from "react";
import { Icone, type NomeIcone } from "@/components/base/IconeServidor";
import busca from "@/components/busca/FaixaDaBusca.module.css";
import faixa from "@/components/especialidades/FaixaDaEspecialidade.module.css";
import type { VoltaDaPagina } from "@/lib/paginaDeTexto";

/*
  A faixa verde curta de ponta a ponta que abre a diretoria, as páginas de
  texto, a lista de notícias, a notícia aberta e o contato (os desenhos
  aprovados: docs/desenho-aprovado/associacao/ e
  docs/desenho-aprovado/noticias-contato/, `.busca-topo.esp-topo`).
  - No alto, o link de volta (`volta`: "← A ASSOCIAÇÃO", "← INÍCIO",
    "← NOTÍCIAS") ou, na página que abre uma seção do menu, um rótulo
    simples (`rotulo`: "NOTÍCIAS", "CONTATO").
  - O título e o resumo.
  - `children` entra logo depois do resumo: a pílula do mandato, na
    diretoria; a assinatura, na notícia aberta.
  - À direita, o ícone da página num ladrilho de vidro, que some no
    celular. Sem `icone`, sem ladrilho: a notícia aberta precisa da largura
    para o título.
  - `className` vai no fim da classe da faixa: a da notícia aberta
    (components/editorial/NoticiaAberta.module.css), que tira a coluna do
    ladrilho e diminui o título.

  Sem campo de busca e sem trilha.

  O CSS é o da faixa da busca (components/busca/FaixaDaBusca.module.css) e
  o da faixa da especialidade
  (components/especialidades/FaixaDaEspecialidade.module.css), que já tem
  a mesma composição: texto à esquerda e o ladrilho à direita.

  - `data-abertura`: a barra do pé do celular aparece quando esta faixa sai
    da tela (components/layout/BarraDoPe.tsx).
  - `data-faixa`: a faixa fica fora da coluna da página
    (app/(site)/encontre.module.css).
*/
type AltoDaFaixa = { volta: VoltaDaPagina; rotulo?: undefined } | { rotulo: string; volta?: undefined };

export function FaixaCurta({
  volta,
  rotulo,
  titulo,
  texto,
  icone,
  className,
  children,
}: AltoDaFaixa & {
  titulo: string;
  texto: string;
  icone?: NomeIcone;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <section
      data-bloco="topo"
      data-faixa=""
      data-abertura=""
      aria-labelledby="pagina-titulo"
      className={`textura-verde ${busca.faixa} ${faixa.especialidade}${className ? ` ${className}` : ""}`}
    >
      <div className="brilho" aria-hidden="true"></div>

      <div>
        {volta ? (
          <Link href={volta.href} className={`rotulo-secao ${busca.sobre} ${faixa.volta}`} data-coluna="">
            <Icone nome="voltar" /> {volta.rotulo}
          </Link>
        ) : (
          <span className={`rotulo-secao ${busca.sobre}`} data-coluna="">
            {rotulo}
          </span>
        )}
        <h1 id="pagina-titulo" className={busca.titulo}>
          {titulo}
        </h1>
        <p className={busca.texto}>{texto}</p>
        {children}
      </div>

      {icone ? (
        <div className={faixa.selo} aria-hidden="true">
          <Icone nome={icone} duotone tamanho={84} />
        </div>
      ) : null}
    </section>
  );
}
```

O link de volta e o ladrilho saem com o mesmo HTML de antes: `testes/faixa-curta-e-indice.test.ts`, `testes/diretoria-na-tela.test.ts` e `testes/modelo-de-texto.test.ts` são a prova.

- [ ] **Step 4: O corpo em faixa branca**

`components/editorial/FaixaDoTexto.tsx`:

```tsx
import type { PortableTextBlock } from "@portabletext/react";
import type { ReactNode } from "react";
import { Icone } from "@/components/base/IconeServidor";
import { CorpoDoTexto } from "@/components/editorial/CorpoDoTexto";
import { IndiceNestaPagina, IndiceRecolhido } from "@/components/editorial/IndiceNestaPagina";
import styles from "@/components/editorial/PaginaDeTexto.module.css";
import { dataPorExtenso } from "@/lib/formato";
import { indiceNestaPagina } from "@/lib/nestaPagina";
import { ancorasDoCorpo } from "@/lib/paginaDeTexto";
import type { AvisoDoRascunho } from "@/lib/rascunhosLegais";

/*
  O corpo de uma página de texto ou de uma notícia aberta: uma faixa branca
  de ponta a ponta, sem canto nem sombra, com a coluna de leitura de 680px
  (o CSS é PaginaDeTexto.module.css). Na coluna, de cima para baixo:
  - "Atualizado em", com o relógio, quando há data;
  - o índice recolhido, no celular;
  - o quadro de aviso, quando há (só o rascunho das páginas de texto tem);
  - o texto (components/editorial/CorpoDoTexto.tsx);
  - `children`: o "Fale com a AMI" de Seja associado, ou quem assina a
    notícia.

  À direita, o índice "Nesta página", montado dos títulos de seção (h2) e
  preso à rolagem. Com menos de dois títulos, não aparece
  (lib/nestaPagina.ts).

  `rotulo` é o nome da faixa para o leitor de tela ("Texto da página",
  "Texto da notícia"). A faixa leva `data-faixa`: quando ela fecha a
  página, o rodapé emenda nela (components/layout/Rodape.module.css).
*/
export function FaixaDoTexto({
  rotulo,
  atualizadoEm,
  aviso = null,
  corpo,
  children,
}: {
  rotulo: string;
  atualizadoEm?: string;
  aviso?: AvisoDoRascunho | null;
  corpo: PortableTextBlock[];
  children?: ReactNode;
}) {
  const ancoras = ancorasDoCorpo(corpo);
  const indice = indiceNestaPagina(ancoras.map(({ id, titulo }) => ({ id, titulo })));
  const idDoBloco = Object.fromEntries(ancoras.map((a) => [a.chave, a.id]));
  const data = atualizadoEm ? dataPorExtenso(atualizadoEm) : "";

  return (
    <section data-bloco="texto" data-faixa="" aria-label={rotulo} className={styles.faixa}>
      <div className={styles.grade}>
        <article className={styles.coluna} data-coluna="">
          {data ? (
            <p className={styles.atualizado}>
              <Icone nome="relogio" />
              Atualizado em <time dateTime={atualizadoEm}>{data}</time>
            </p>
          ) : null}

          {indice.length > 0 ? <IndiceRecolhido itens={indice} /> : null}

          {aviso ? (
            <div className={styles.quadro} role="note">
              <Icone nome="informacao" duotone />
              <div>
                <p className={styles.quadroTitulo}>{aviso.titulo}</p>
                <p>{aviso.texto}</p>
              </div>
            </div>
          ) : null}

          <CorpoDoTexto blocos={corpo} ancoras={idDoBloco} />

          {children}
        </article>

        {indice.length > 0 ? <IndiceNestaPagina itens={indice} /> : null}
      </div>
    </section>
  );
}
```

É o JSX que estava dentro de `PaginaDeTexto`, com o nome da faixa e a data opcionais.

- [ ] **Step 5: A página de texto, por cima da faixa branca**

Reescreva `components/editorial/PaginaDeTexto.tsx` (leia antes; mantenha o fim de linha) inteiro:

```tsx
import type { ReactNode } from "react";
import paginas from "@/app/(site)/encontre.module.css";
import type { NomeIcone } from "@/components/base/IconeServidor";
import { FaixaDoTexto } from "@/components/editorial/FaixaDoTexto";
import { FaixaCurta } from "@/components/layout/FaixaCurta";
import type { ConteudoDaPagina, VoltaDaPagina } from "@/lib/paginaDeTexto";

/*
  O modelo das páginas de texto: Seja associado, Estatuto, Política
  editorial, Benefícios e os três textos legais (privacidade, cookies e
  termos de uso).
  - A faixa verde curta (components/layout/FaixaCurta.tsx), com o link de
    volta (`volta`), o título, o resumo e o ícone da página.
  - O corpo numa faixa branca de ponta a ponta, em coluna de leitura de
    680px, com a data de atualização, o quadro de aviso, quando há, o texto
    e o índice "Nesta página" (components/editorial/FaixaDoTexto.tsx, a
    mesma da notícia aberta).
  - `children` entra no fim da coluna: o "Fale com a AMI" de Seja associado.

  O texto chega pronto (`ConteudoDaPagina`, lib/paginaDeTexto.ts), do
  documento do Studio ou do rascunho em código. O rascunho existe porque a
  alternativa era pior: sem ele, os três textos legais, linkados do rodapé
  de toda página, e o "Seja associado" da home davam 404 até a AMI publicar
  o texto dela; num site que lida com saúde, a falta de política de
  privacidade é falha mais visível do que um rascunho assinalado. O quadro
  de aviso, que a faixa branca desenha, diz isso a quem lê, antes do
  primeiro parágrafo. Ele é `role="note"`, e não `alert`: alerta interrompe
  quem usa leitor de tela, e isto é contexto para ler antes do texto, não
  emergência.

  A data de atualização sai visível, e não só no metadado: numa política de
  privacidade, saber de quando é a versão que se está lendo é a informação
  mais importante da página depois do próprio texto.

  Sem trilha e sem BreadcrumbList: dado estruturado sem o equivalente
  visível é marcação enganosa (lib/seo/jsonld.ts). Os dois blocos são
  filhos diretos de `.pagina` (app/(site)/encontre.module.css); o corpo é
  faixa (`data-faixa`), e o rodapé emenda nele
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
  return (
    <div className={paginas.pagina}>
      <FaixaCurta volta={volta} titulo={conteudo.titulo} texto={conteudo.resumo} icone={icone} />
      <FaixaDoTexto
        rotulo="Texto da página"
        atualizadoEm={conteudo.atualizadoEm}
        aviso={conteudo.aviso}
        corpo={conteudo.corpo}
      >
        {children}
      </FaixaDoTexto>
    </div>
  );
}
```

O rascunho em código sempre traz data (`atualizadoEm` é obrigatório nele e no Studio): a linha "Atualizado em" continua saindo como antes.

- [ ] **Step 6: O texto rico, com a citação e a imagem**

Reescreva `components/editorial/CorpoDoTexto.tsx` (leia antes; mantenha o fim de linha) inteiro:

```tsx
import Link from "next/link";
import {
  PortableText,
  type PortableTextBlock,
  type PortableTextComponents,
} from "@portabletext/react";
import styles from "@/components/editorial/PaginaDeTexto.module.css";
import { imagemDoTexto, SIZES_DA_IMAGEM_DO_TEXTO } from "@/lib/noticias";
import { ehLinkInterno } from "@/lib/sanity/link";
import type { ImagemSanity } from "@/lib/sanity/tipos";

/*
  O texto rico do site: o das páginas de texto (do Studio, ou do rascunho
  em código, que chega no mesmo formato: `blocosDoRascunho`,
  lib/paginaDeTexto.ts), o da apresentação de A Associação e o das
  notícias.

  Cada nó sai como tag simples, e o CSS da coluna desenha
  (PaginaDeTexto.module.css). As exceções:
  - o h2 ganha o `id` da âncora dele (`ancoras`, pela chave do bloco), para
    o índice "Nesta página" levar até ele;
  - o estilo "aEntrar" é o que falta no rascunho: a moldura "a entrar", em
    cinza e itálico;
  - a imagem (só a notícia tem): na proporção do arquivo que a AMI enviou,
    sem recorte e sem moldura, com a legenda embaixo (`imagemDoTexto`,
    lib/noticias.ts). Sem endereço (`_ref` malformado), o bloco some: a
    notícia perde a foto, não a página. Ela só baixa ao rolar: nunca é a
    primeira coisa da tela;
  - o link: interno pelo roteador do Next, externo na mesma aba (a regra de
    qual é qual está em lib/sanity/link.ts). Abrir em aba nova sem avisar
    tira do leitor o botão voltar.

  O schema da notícia (sanity/schemas/noticia.ts) aceita parágrafo, h2, h3,
  citação, as duas listas, negrito, itálico, link e imagem; o da página
  institucional, o mesmo sem a citação e sem a imagem.
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
      blockquote: ({ children }) => <blockquote>{children}</blockquote>,
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
    types: {
      image: ({ value }: { value: ImagemSanity }) => {
        const imagem = imagemDoTexto(value);
        if (!imagem) return null;
        return (
          <figure>
            {/* eslint-disable-next-line @next/next/no-img-element --
                o CDN do Sanity já redimensiona; ver lib/sanity/imagem.ts. */}
            <img
              src={imagem.src}
              srcSet={imagem.srcSet}
              sizes={SIZES_DA_IMAGEM_DO_TEXTO}
              alt={imagem.alt}
              width={imagem.largura}
              height={imagem.altura}
              loading="lazy"
              decoding="async"
            />
            {value.legenda ? <figcaption>{value.legenda}</figcaption> : null}
          </figure>
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

- [ ] **Step 7: O CSS do texto rico**

Em `components/editorial/PaginaDeTexto.module.css`:

1. No comentário do topo, troque o parágrafo

```
  Fora do desenho, porque o texto do Studio pode ter e o desenho não mostra:
  a lista numerada (`ol`), o negrito (`strong`) e o link (`.link`, no verde
  de ação e sublinhado, como o texto rico das notícias).
```

por

```
  Do desenho da notícia aberta
  (docs/desenho-aprovado/noticias-contato/noticia.html: `.coluna > ol` e o
  número no círculo, `.coluna > blockquote`, `.coluna > figure`,
  `.coluna figcaption`, `.coluna > p a`, `.coluna strong`, e o @media de
  700px): a lista numerada, a citação, a imagem com legenda, o link e o
  negrito. Valem também para as páginas de texto, quando o texto do Studio
  os tiver.
```

2. Troque as duas regras da lista numerada

```css
.coluna ol {
  margin: 0;
  padding-left: 22px;
}

.coluna ol > li + li {
  margin-top: 8px;
}
```

por

```css
.coluna ol {
  margin: 0;
  padding: 0;
  list-style: none;
  counter-reset: passo;
}

.coluna ol > li {
  position: relative;
  padding-left: 38px;
  counter-increment: passo;
}

.coluna ol > li::before {
  content: counter(passo);
  position: absolute;
  left: 0;
  top: 0.28em;
  display: grid;
  place-items: center;
  width: 26px;
  height: 26px;
  border-radius: 99px;
  background: var(--color-surface-fundo);
  box-shadow: inset 0 0 0 1px var(--color-line);
  font-size: 12.5px;
  font-weight: 700;
  line-height: 1;
  font-variant-numeric: tabular-nums;
  color: var(--color-ami-green-800);
}

.coluna ol > li + li {
  margin-top: 10px;
}

.coluna > blockquote {
  margin: 36px 0 0;
  padding: 4px 0 4px 24px;
  border-left: 2px solid var(--color-ami-green-600);
  font-size: 20px;
  line-height: 1.55;
  font-weight: 500;
  color: var(--color-ink-900);
}

.coluna > blockquote + * {
  margin-top: 24px;
}

.coluna > figure {
  margin: 40px 0 0;
}

.coluna > figure + * {
  margin-top: 32px;
}

.coluna > figure img {
  display: block;
  width: 100%;
  height: auto;
  border-radius: 16px;
}

.coluna figcaption {
  margin-top: 12px;
  font-size: 14px;
  line-height: 1.5;
  color: var(--color-ink-400);
}
```

3. Troque as duas regras do link

```css
.link {
  font-weight: 600;
  color: var(--color-ami-green-600);
  text-decoration: underline;
  text-underline-offset: 2px;
}

.link:hover {
  color: var(--color-ami-green-700);
}
```

por

```css
.link {
  font-weight: 600;
  color: var(--color-ami-green-600);
  text-decoration: underline;
  text-decoration-thickness: 1px;
  text-underline-offset: 3px;
  transition: color 0.2s;
}

.link:hover {
  color: var(--color-ami-green-800);
}
```

4. No bloco `@media (max-width: 700px)`, troque o fim dele

```css
  .chamada .acoes > a {
    width: 100%;
    height: 46px;
    font-size: 14px;
  }
}
```

por

```css
  .chamada .acoes > a {
    width: 100%;
    height: 46px;
    font-size: 14px;
  }

  .coluna ol > li {
    padding-left: 34px;
  }

  .coluna ol > li::before {
    top: 0.2em;
    width: 24px;
    height: 24px;
    font-size: 12px;
  }

  .coluna > blockquote {
    margin-top: 28px;
    padding-left: 18px;
    font-size: 17.5px;
  }

  .coluna > figure {
    margin-top: 28px;
  }

  .coluna > figure + * {
    margin-top: 24px;
  }

  .coluna > figure img {
    border-radius: 14px;
  }

  .coluna figcaption {
    font-size: 13.5px;
  }
}
```

A citação, a imagem e o que vem depois delas usam `.coluna > …` (classe e tag, como no desenho): pesam o mesmo que `.coluna h2 + *` e vêm depois dele no arquivo, e pesam mais que `.coluna > * + *`. O link do desenho escurece para o `green-800` (antes, `green-700`), e o sublinhado fica a 3px.

- [ ] **Step 8: Rodar, provar por mutação, conferir, commit**

Run: `npx vitest run` · `npx tsc --noEmit` · `npm run build` → verde. Os testes de A Associação listados no Mapa de arquivos continuam verdes **sem mudança**.

Mutações, uma de cada vez, regravando o original depois:

1. Na faixa, tire o `${className ? … : ""}` da classe.
2. Na faixa, troque `{icone ? (…) : null}` por sempre o ladrilho, com `icone ?? "documento"`.
3. Na faixa, tire o `data-coluna=""` do rótulo.
4. Na faixa do texto, troque `atualizadoEm ? dataPorExtenso(atualizadoEm) : ""` por `dataPorExtenso(atualizadoEm ?? "2026-01-01")`.
5. Na faixa do texto, troque `aria-label={rotulo}` por `aria-label="Texto da página"`.
6. No texto rico, troque a citação por `<p>{children}</p>`.
7. No texto rico, tire a condição da legenda (`<figcaption>{value.legenda}</figcaption>` sempre).
8. No texto rico, tire o `loading="lazy"`.
9. No CSS, tire o `list-style: none;` de `.coluna ol`.
10. No CSS, troque a cor de `.link:hover` de volta para `var(--color-ami-green-700)`.

Conferência rápida no navegador:
1. `npm run build` e `npx next start -p 3300`.
2. Abra `/associacao/seja-associado` e `/politica-de-privacidade` a 1440 e a 390px.
3. Expected: iguais a antes desta tarefa (as fotos `docs/desenho-aprovado/associacao/seja-associado-1440-parte-1.jpg` e `seja-associado-390-parte-1.jpg`).
4. Derrube o 3300 pelo PID.

```bash
git add components/layout/FaixaCurta.tsx components/editorial/FaixaDoTexto.tsx components/editorial/PaginaDeTexto.tsx components/editorial/CorpoDoTexto.tsx components/editorial/PaginaDeTexto.module.css testes/pecas-de-texto.test.ts
git commit -m "Faixa curta com rotulo e sem icone, corpo da pagina de texto em FaixaDoTexto, e texto rico com citacao, lista numerada no circulo e imagem com legenda"
```

---
### Task 3: A lista `/noticias`

**Files:**
- Create: `components/editorial/FotoDaNoticia.tsx`, `components/editorial/CartaoNoticia.tsx`, `components/editorial/GradeDeNoticias.tsx`, `components/editorial/ListaDeNoticias.tsx`, `components/editorial/Noticias.module.css`
- Modify: `app/(site)/noticias/page.tsx` (reescrita; CRLF)
- Create: `testes/lista-de-noticias.test.ts`

**Interfaces:**
- Consumes:
  - `ListaNaTela`, `listaDeNoticias`, `LIMITE_DA_LISTA`, `TRES_POR_LINHA` (`lib/noticias.ts`); `ArranjoDaLista`, `tamanhoDosCartoes`, `SIZES_DO_DESTAQUE_DA_LISTA`, `LARGURAS_DO_DESTAQUE_DA_LISTA`, `LARGURAS_DO_CARTAO` (`lib/arranjo-das-noticias.ts`); `CapaSanity`; o ícone `"jornal"` (Task 1);
  - `FaixaCurta` com `rotulo` (Task 2);
  - `urlDaImagem` (`lib/sanity/imagem.ts`), `dataPorExtenso` (`lib/formato.ts`), `MolduraProvisoria`, `Icone`, `listarNoticias`, `itemList`, `JsonLd`, `DADOS_DEMONSTRACAO`;
  - as classes `semCapa` e `imagem` de `components/editorial/UltimasNoticias.module.css` (as da home, sem mudança);
  - `pagina` de `app/(site)/encontre.module.css`.
- Produces:

```ts
// components/editorial/FotoDaNoticia.tsx
export function FotoDaNoticia(props: {
  capa?: CapaSanity;
  larguras: readonly number[];
  sizes: string;
  prioridade?: boolean; // true: fetchPriority="high"; false: loading="lazy"
}): JSX.Element; // <img …> ou <div class={semCapa} aria-hidden="true">
// components/editorial/CartaoNoticia.tsx
export function CartaoNoticia(props: { noticia?: ResumoNoticia; sizes: string }): JSX.Element; // <li data-cartao-noticia …>; sem notícia, a moldura
// components/editorial/GradeDeNoticias.tsx
export function GradeDeNoticias(props: { noticias: ResumoNoticia[]; arranjo: ArranjoDaLista }): JSX.Element; // <ul class={grade} style="--colunas:N" [data-deitado] role="list">
export function GradeAEntrar(): JSX.Element; // os três cartões "Notícia a entrar"
// components/editorial/ListaDeNoticias.tsx
export function ListaDeNoticias(props: { lista: ListaNaTela }): JSX.Element; // <section data-bloco="noticias" …>
// components/editorial/Noticias.module.css: lista, destaque, casca, fotoDoDestaque, sobreFoto, data,
//   destaqueTitulo, destaqueResumo, grade, cartao, foto, corpo, titulo, resumo, nenhuma, acao, outras
```

- Marcas: `data-bloco="noticias"` na lista; `data-cartao-noticia`, `data-foto`, `data-data` e `data-titulo` no cartão (a Task 7 os mede); `data-a-entrar="notícias"` nas molduras.

- [ ] **Step 1: Os testes**

`testes/lista-de-noticias.test.ts`:

```ts
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Icon } from "@phosphor-icons/react";
import { ArrowLeft, Newspaper } from "@phosphor-icons/react/dist/ssr";
import estilosPagina from "@/app/(site)/encontre.module.css";
import { CartaoNoticia } from "@/components/editorial/CartaoNoticia";
import { ListaDeNoticias } from "@/components/editorial/ListaDeNoticias";
import estilos from "@/components/editorial/Noticias.module.css";
import estilosHome from "@/components/editorial/UltimasNoticias.module.css";
import {
  LARGURAS_DO_CARTAO,
  LARGURAS_DO_DESTAQUE_DA_LISTA,
  SIZES_DO_DESTAQUE_DA_LISTA,
  tamanhoDosCartoes,
} from "@/lib/arranjo-das-noticias";
import { listaDeNoticias } from "@/lib/noticias";
import type { ResumoNoticia } from "@/lib/sanity/tipos";
import { tituloDePagina } from "@/lib/seo/metadados";
import { fonte } from "@/testes/apoio";
import { base, bloco, regra, semNotas } from "@/testes/css";
import { htmlDe } from "@/testes/renderizar";

/*
  A lista de notícias (/noticias): o destaque, o cartão, a grade nos
  arranjos de 1, 2, 3, 4 e 7 notícias, os dois estados sem notícia e a
  página de verdade, com o Sanity trocado por um dublê e as duas chaves de
  demonstração. As notícias daqui são de exemplo e só existem neste teste.

  A chave de demonstração é lida quando lib/demonstracao.ts é importado:
  cada caso da página troca a chave e importa a página de novo.

  O endereço das fotos sai do CDN do Sanity, com o projeto do ambiente: o
  teste o fixa por `stubEnv`. O CSS se lê do arquivo; o alinhamento dos
  cartões é medido pela auditoria (scripts/auditoria-visual.js,
  conferência 17).
*/

const sanity = vi.hoisted(() => ({ publicadas: [] as ResumoNoticia[], limites: [] as number[] }));

vi.mock("@/lib/sanity/consultas", () => ({
  listarNoticias: async (limite: number) => {
    sanity.limites.push(limite);
    return sanity.publicadas.slice(0, limite);
  },
}));

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_SANITY_PROJECT_ID", "abcd1234");
  vi.stubEnv("NEXT_PUBLIC_SANITY_DATASET", "production");
});

afterEach(() => {
  vi.unstubAllEnvs();
  sanity.publicadas = [];
  sanity.limites = [];
});

const CDN = "https://cdn.sanity.io/images/abcd1234/production/abc123def456-2000x1333.jpg";

function noticia(n: number, extra: Partial<ResumoNoticia> = {}): ResumoNoticia {
  return {
    titulo: `Título da notícia ${n}`,
    slug: `noticia-${n}`,
    resumo: `Resumo da notícia ${n}.`,
    capa: { asset: { _ref: "image-abc123def456-2000x1333-jpg" }, alt: `Capa ${n}` },
    autor: { nome: "Rafael Coelho", crm: "10137", crmUf: "MA" },
    publicadoEm: `2026-09-${String(30 - n).padStart(2, "0")}T12:00:00-03:00`,
    ...extra,
  };
}

const varias = (quantas: number) => Array.from({ length: quantas }, (_, i) => noticia(i + 1));

const desenho = (Componente: Icon, size: number, weight: "duotone" | "regular") =>
  renderToString(createElement(Componente, { size, weight, className: "", "aria-hidden": "true" }));

/** Sem o `<link rel="preload">` que o React 19 põe antes do HTML para a foto com prioridade. */
const semPreload = (html: string) => html.replace(/<link rel="preload"[^>]*\/>/g, "");

/** O texto que aparece, sem tags, num espaço só. */
const tela = (html: string) =>
  html
    .replace(/<!-- -->/g, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

/** O `&` como o HTML o escreve dentro de um atributo. */
const atributo = (texto: string) => texto.replaceAll("&", "&amp;");

const lista = (quantas: number, demonstracao = true) =>
  semPreload(renderToString(createElement(ListaDeNoticias, { lista: listaDeNoticias(demonstracao, varias(quantas)) })));

const cartoes = (html: string) => [...html.matchAll(/<li [^>]*data-cartao-noticia=""[\s\S]*?<\/li>/g)].map((m) => m[0]);

const grade = (html: string) => new RegExp(`<ul class="${estilos.grade}"[^>]*>`).exec(html)?.[0] ?? "(sem grade)";

const destaque = (html: string) => /<article [^>]*>[\s\S]*?<\/article>/.exec(html)?.[0] ?? "(sem destaque)";

/** A tag de abertura do link para `href`. */
const link = (html: string, href: string) => new RegExp(`<a [^>]*href="${href}"[^>]*>`).exec(html)?.[0] ?? "";

describe("o arranjo, renderizado: 1, 2, 3, 4 e 7 notícias", () => {
  it("uma: só o destaque, sem grade", () => {
    const html = lista(1);
    expect(destaque(html)).toContain("Título da notícia 1");
    expect(html).not.toContain("<ul");
  });

  it("duas: um cartão deitado embaixo do destaque", () => {
    const html = lista(2);
    expect(grade(html)).toBe(`<ul class="${estilos.grade}" style="--colunas:1" data-deitado="" role="list">`);
    expect(cartoes(html)).toHaveLength(1);
  });

  it("três: duas colunas", () => {
    const html = lista(3);
    expect(grade(html)).toBe(`<ul class="${estilos.grade}" style="--colunas:2" role="list">`);
    expect(cartoes(html)).toHaveLength(2);
  });

  it("quatro: três por linha", () => {
    const html = lista(4);
    expect(grade(html)).toBe(`<ul class="${estilos.grade}" style="--colunas:3" role="list">`);
    expect(cartoes(html)).toHaveLength(3);
  });

  it("sete: o destaque e seis cartões, na ordem de publicação", () => {
    const html = lista(7);
    expect(grade(html)).toBe(`<ul class="${estilos.grade}" style="--colunas:3" role="list">`);
    expect(cartoes(html).map((c) => /href="\/noticias\/([^"]+)"/.exec(c)?.[1])).toEqual([
      "noticia-2",
      "noticia-3",
      "noticia-4",
      "noticia-5",
      "noticia-6",
      "noticia-7",
    ]);
  });

  it("o sizes dos cartões segue o arranjo", () => {
    expect(cartoes(lista(2))[0]).toContain(`sizes="${tamanhoDosCartoes({ colunas: 1, deitado: true })}"`);
    expect(cartoes(lista(3))[0]).toContain(`sizes="${tamanhoDosCartoes({ colunas: 2, deitado: false })}"`);
    expect(cartoes(lista(7))[5]).toContain(`sizes="${tamanhoDosCartoes({ colunas: 3, deitado: false })}"`);
  });
});

describe("o destaque", () => {
  it("a mais recente, com a data, o título e o resumo sobre a foto; o destaque inteiro é o link", () => {
    const d = destaque(lista(4));
    expect(d).toMatch(new RegExp(`^<article class="${estilos.destaque}"><a [^>]*href="/noticias/noticia-1"`));
    expect(link(d, "/noticias/noticia-1")).toContain(`class="${estilos.casca}"`);
    expect(d).toContain(
      `<div class="${estilos.sobreFoto}"><time class="${estilos.data}" dateTime="2026-09-29T12:00:00-03:00">29 de setembro de 2026</time>` +
        `<h3 class="${estilos.destaqueTitulo}">Título da notícia 1</h3>` +
        `<p class="${estilos.destaqueResumo}">Resumo da notícia 1.</p></div></a></article>`,
    );
  });

  it("a foto: logo, com prioridade, na largura dos painéis, e fora do nome do link", () => {
    const img = new RegExp(`<div class="${estilos.fotoDoDestaque}"><img [^>]*>`).exec(lista(4))![0];
    expect(img).toContain(`src="${atributo(`${CDN}?w=640&fit=crop&auto=format`)}"`);
    expect(img).toContain(
      atributo(LARGURAS_DO_DESTAQUE_DA_LISTA.map((l) => `${CDN}?w=${l}&fit=crop&auto=format ${l}w`).join(", ")),
    );
    expect(img).toContain(`sizes="${SIZES_DO_DESTAQUE_DA_LISTA}"`);
    expect(img).toMatch(/fetchPriority="high"/);
    expect(img).not.toContain('loading="lazy"');
    expect(img).toContain('alt=""');
  });

  it("sem capa: o verde da marca com o símbolo, o mesmo da home", () => {
    const html = renderToString(
      createElement(ListaDeNoticias, { lista: listaDeNoticias(true, [noticia(1, { capa: undefined })]) }),
    );
    expect(html).toContain(
      `<div class="${estilos.fotoDoDestaque}"><div class="${estilosHome.semCapa}" aria-hidden="true"></div></div>`,
    );
  });
});

describe("o cartão", () => {
  const sizes = tamanhoDosCartoes({ colunas: 3, deitado: false });
  const cartao = (n?: ResumoNoticia) => renderToString(createElement(CartaoNoticia, { noticia: n, sizes }));

  it("a foto 16:10, a data, o título com o link esticado e o resumo", () => {
    const html = cartao(noticia(2));
    expect(html).toMatch(
      new RegExp(`^<li class="${estilos.cartao}" data-cartao-noticia=""><div class="${estilos.foto}" data-foto=""><img `),
    );
    expect(html).toContain(
      `<div class="${estilos.corpo}"><time class="${estilos.data}" dateTime="2026-09-28T12:00:00-03:00" data-data="">28 de setembro de 2026</time>` +
        `<h3 class="${estilos.titulo}" data-titulo=""><a href="/noticias/noticia-2">Título da notícia 2</a></h3>` +
        `<p class="${estilos.resumo}">Resumo da notícia 2.</p></div></li>`,
    );
  });

  it("a foto só baixa ao rolar, na largura desenhada, e fora do nome do link", () => {
    const img = /<img [^>]*>/.exec(cartao(noticia(2)))![0];
    expect(img).toContain(`src="${atributo(`${CDN}?w=320&fit=crop&auto=format`)}"`);
    expect(img).toContain(
      atributo(LARGURAS_DO_CARTAO.map((l) => `${CDN}?w=${l}&fit=crop&auto=format ${l}w`).join(", ")),
    );
    expect(img).toContain(`sizes="${sizes}"`);
    expect(img).toContain('loading="lazy"');
    expect(img).not.toMatch(/fetchPriority/);
    expect(img).toContain('alt=""');
  });

  it("notícia sem capa: o verde da marca no lugar da foto", () => {
    expect(cartao(noticia(2, { capa: undefined }))).toContain(
      `<div class="${estilos.foto}" data-foto=""><div class="${estilosHome.semCapa}" aria-hidden="true"></div></div>`,
    );
  });

  it("a moldura: sem link, sem data, com o texto da home", () => {
    const html = cartao();
    expect(html).toMatch(new RegExp(`^<li class="${estilos.cartao}" data-cartao-noticia="" data-a-entrar="notícias">`));
    expect(html).toContain('role="img" aria-label="Espaço reservado para a capa de uma notícia"');
    expect(html).not.toContain("<a ");
    expect(html).not.toContain("<time");
    expect(tela(html)).toBe("Notícia a entrar Espaço reservado para uma publicação da AMI.");
  });
});

describe("sem notícia", () => {
  const vazia = (demonstracao: boolean) =>
    renderToString(createElement(ListaDeNoticias, { lista: listaDeNoticias(demonstracao, []) }));

  it("na demonstração: o destaque e três cartões a entrar, nenhum link", () => {
    const html = vazia(true);
    expect(html.match(/data-a-entrar="notícias"/g)).toHaveLength(4);
    expect(grade(html)).toBe(`<ul class="${estilos.grade}" style="--colunas:3" role="list">`);
    expect(destaque(html)).toContain(`<h3 class="${estilos.destaqueTitulo}">Notícia a entrar</h3>`);
    expect(destaque(html)).toContain('role="img" aria-label="Espaço reservado para a capa de uma notícia"');
    expect(html).not.toContain("<a ");
  });

  it("fora dela: a frase na coluna do texto e o botão para o início, sem moldura", () => {
    const html = vazia(false);
    expect(html).not.toContain("data-a-entrar");
    expect(html).toContain(
      `<div class="${estilos.nenhuma}"><p data-coluna="">Nenhuma notícia publicada ainda.</p><div class="${estilos.acao}">`,
    );
    const botao = /<a [^>]*href="\/"[^>]*>[\s\S]*?<\/a>/.exec(html)![0];
    expect(botao).toContain('class="botao-contorno"');
    expect(botao).toContain(desenho(ArrowLeft, 20, "regular"));
    expect(tela(botao)).toBe("Voltar para o início");
  });

  it("o título da região existe nos três estados, para quem navega por cabeçalhos", () => {
    for (const html of [vazia(true), vazia(false), lista(4)]) {
      expect(html).toMatch(
        new RegExp(
          `^<section data-bloco="noticias" aria-labelledby="publicacoes-titulo" class="${estilos.lista}"><h2 id="publicacoes-titulo" class="sr-only">Publicações</h2>`,
        ),
      );
    }
  });
});

async function pagina(chave: string) {
  vi.stubEnv("NEXT_PUBLIC_DADOS_DEMONSTRACAO", chave);
  vi.resetModules();
  const modulo = await import("@/app/(site)/noticias/page");
  return { html: semPreload(await htmlDe(await modulo.default())), modulo };
}

const blocos = (html: string) => [...html.matchAll(/data-bloco="([^"]+)"/g)].map((m) => m[1]);

const jsonLd = (html: string) =>
  [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(
    (m) => JSON.parse(m[1]) as Record<string, unknown>,
  );

describe("a página /noticias", () => {
  it("a faixa curta e a lista, no invólucro de coluna e ritmo, com um h1 só", async () => {
    sanity.publicadas = varias(4);
    const { html } = await pagina("true");
    expect(html).toContain(`<div class="${estilosPagina.pagina}"><section data-bloco="topo"`);
    expect(blocos(html)).toEqual(["topo", "noticias"]);
    expect(html.match(/<h1\b/g)).toHaveLength(1);
  });

  it("a faixa: NOTÍCIAS, o título, a frase e o jornal no ladrilho", async () => {
    const { html } = await pagina("true");
    expect(html).toContain('data-coluna="">Notícias</span>');
    expect(html).toContain(">Notícias da AMI</h1>");
    expect(html).toContain(
      ">Comunicados, eventos e notas da associação. Cada texto é assinado por um médico, com o número de inscrição no CRM.</p>",
    );
    expect(html).toContain(desenho(Newspaper, 84, "duotone"));
  });

  it("pede no máximo 20 notícias ao Sanity", async () => {
    await pagina("true");
    expect(sanity.limites).toEqual([20]);
  });

  it("com notícia: o ItemList com as notícias da tela, na ordem; nenhum BreadcrumbList", async () => {
    sanity.publicadas = varias(3);
    const { html } = await pagina("false");
    const dados = jsonLd(html);
    expect(dados.map((d) => d["@type"])).toEqual(["ItemList"]);
    const itens = dados[0].itemListElement as { url: string }[];
    expect(itens.map((i) => i.url.replace(/^.*\/noticias\//, ""))).toEqual(["noticia-1", "noticia-2", "noticia-3"]);
    expect(html).not.toContain("BreadcrumbList");
  });

  it("sem notícia, sem ItemList: na demonstração as molduras, fora dela a frase", async () => {
    const demo = (await pagina("true")).html;
    expect(demo).not.toContain("application/ld+json");
    expect(demo.match(/data-a-entrar="notícias"/g)).toHaveLength(4);
    const fora = (await pagina("false")).html;
    expect(fora).toContain("Nenhuma notícia publicada ainda.");
    expect(fora).not.toContain("data-a-entrar");
    expect(fora).not.toContain("a entrar");
  });

  it("nenhuma Cabeceira, trilha, BreadcrumbList ou PROVISÓRIO, nos dois modos", async () => {
    for (const chave of ["true", "false"]) {
      sanity.publicadas = chave === "true" ? [] : varias(2);
      const { html } = await pagina(chave);
      expect(html, chave).not.toContain("Trilha de navegação");
      expect(html, chave).not.toContain("-mt-32");
      expect(html, chave).not.toContain("BreadcrumbList");
      expect(html, chave).not.toContain("PROVISÓRIO");
    }
  });

  it("a lista fecha a página e não é faixa: o rodapé fica a --ritmo", async () => {
    sanity.publicadas = varias(2);
    const { html } = await pagina("true");
    expect(html).toMatch(/<section data-bloco="noticias" aria-labelledby="publicacoes-titulo"[\s\S]*<\/section><\/div>$/);
    expect(html).not.toMatch(/data-bloco="noticias" data-faixa/);
  });

  it("os metadados continuam os de antes", async () => {
    const { modulo } = await pagina("true");
    expect(modulo.metadata.title).toBe(tituloDePagina("Notícias da Associação Médica de Imperatriz"));
    expect(modulo.metadata.description).toBe(
      "Comunicados, eventos e notas da Associação Médica de Imperatriz, assinados por médicos com CRM.",
    );
    expect(modulo.metadata.alternates).toEqual({ canonical: "/noticias" });
  });
});

describe("o CSS da lista", () => {
  const css = semNotas(fonte("../components/editorial/Noticias.module.css"));
  const tablet = () => bloco(css, "@media (max-width: 980px)");
  const cel = () => bloco(css, "@media (max-width: 700px)");

  it("o destaque: na largura dos painéis, em 2:1, com o canto dos painéis; 4:3 no celular", () => {
    expect(regra(base(css), ".destaque")).toMatch(/border-radius: var\(--radius-painel\);/);
    expect(regra(base(css), ".destaque")).toMatch(/box-shadow: var\(--shadow-erguido\);/);
    expect(regra(base(css), ".fotoDoDestaque")).toMatch(/aspect-ratio: 2 \/ 1;/);
    expect(regra(cel(), ".fotoDoDestaque")).toMatch(/aspect-ratio: 4 \/ 3;/);
  });

  it("o destaque e a grade são um bloco só: --gap entre os dois", () => {
    expect(regra(base(css), ".lista > .grade")).toMatch(/margin-top: var\(--gap\);/);
  });

  it("o degradê do site construído: do alto da data para baixo, nunca abaixo de 75%", () => {
    const r = regra(base(css), ".sobreFoto");
    expect(r).toMatch(/--folga: 96px;/);
    expect(r).toMatch(
      /rgba\(8, 14, 10, 0\.88\) 0%,\s*rgba\(8, 14, 10, 0\.75\) calc\(100% - var\(--folga\)\),\s*rgba\(8, 14, 10, 0\) 100%/,
    );
    expect(regra(base(css), ".sobreFoto .data")).toMatch(/color: rgba\(255, 255, 255, 0\.72\);/);
  });

  it("a grade: uma coluna por cartão até três; duas no tablet, uma com o deitado", () => {
    expect(regra(base(css), ".grade")).toMatch(/grid-template-columns: repeat\(var\(--colunas, 3\), minmax\(0, 1fr\)\);/);
    expect(regra(tablet(), ".grade")).toMatch(/grid-template-columns: repeat\(2, minmax\(0, 1fr\)\);/);
    expect(regra(tablet(), ".grade[data-deitado]")).toMatch(/grid-template-columns: 1fr;/);
  });

  it("o cartão deitado: a foto na largura de uma coluna de três", () => {
    expect(regra(bloco(css, "@media (min-width: 701px)"), ".grade[data-deitado] .cartao")).toMatch(
      /grid-template-columns: calc\(\(100% - 2 \* var\(--gap\)\) \/ 3\) minmax\(0, 1fr\);/,
    );
  });

  it("o cartão: branco, canto de 18px, foto 16:10 e o resumo em duas linhas", () => {
    expect(regra(base(css), ".cartao")).toMatch(/background: var\(--color-surface\);/);
    expect(regra(base(css), ".cartao")).toMatch(/border-radius: 18px;/);
    expect(regra(base(css), ".foto")).toMatch(/aspect-ratio: 16 \/ 10;/);
    expect(regra(base(css), ".resumo")).toMatch(/-webkit-line-clamp: 2;/);
  });

  it("no mouse: só o cartão que é link sobe 3px, com sombra neutra; nada lima", () => {
    const r = regra(base(css), ".cartao:has(a):hover");
    expect(r).toMatch(/transform: translateY\(-3px\);/);
    expect(r).toMatch(/rgba\(16, 24, 40, 0\.1\)/);
    expect(css).not.toMatch(/lima/);
  });

  it("o foco do título vai para o cartão inteiro, só onde o navegador sabe :has", () => {
    const comHas = bloco(css, "@supports selector(:has(a))");
    expect(regra(comHas, ".titulo a:focus-visible")).toMatch(/outline: none;/);
    expect(regra(comHas, ".cartao:has(.titulo a:focus-visible)")).toMatch(
      /outline: 2px solid var\(--color-ami-green-600\);/,
    );
  });

  it("no celular: a lista na coluna do texto, linhas com a miniatura de 88px e fio, sem o resumo", () => {
    expect(regra(cel(), ".lista,\n  .outras > .grade")).toMatch(/padding: 0 var\(--m\);/);
    expect(regra(cel(), ".foto")).toMatch(/width: 88px;/);
    expect(regra(cel(), ".foto")).toMatch(/aspect-ratio: 1 \/ 1;/);
    expect(regra(cel(), ".cartao + .cartao")).toMatch(/border-top: 1px solid var\(--color-line\);/);
    expect(regra(cel(), ".resumo")).toMatch(/display: none;/);
  });

  it("sem notícia: a frase na letra dos títulos, em verde escuro", () => {
    const r = regra(base(css), ".nenhuma p");
    expect(r).toMatch(/font-family: var\(--font-titulo\);/);
    expect(r).toMatch(/color: var\(--color-ami-green-800\);/);
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run testes/lista-de-noticias.test.ts`
Expected: FAIL. Os componentes e o CSS não existem, e a página é a antiga, com `Cabeceira`.

- [ ] **Step 3: O CSS da lista**

`components/editorial/Noticias.module.css`:

```css
/*
  A lista de notícias e o cartão de notícia, transcritos do desenho
  aprovado (docs/desenho-aprovado/noticias-contato/noticias.html:
  `.lista-noticias`, `.destaque-pagina` e o que vem dentro dele, a `.data`,
  `.grade-noticias`, `.cartao-noticia` e o que vem dentro dele,
  `.grade-noticias[data-deitado]`, `.nenhuma`, `.outras-noticias`, e os
  @media de 980 e 700px). O cartão serve também a "Outras notícias", na
  notícia aberta.

  O destaque: a notícia mais recente, na largura dos painéis, em 2:1, com o
  título sobre a foto. Foto e texto ficam na mesma célula de grade, o texto
  encostado embaixo: um título longo faz o bloco crescer, em vez de ser
  cortado. O degradê é o do site construído (UltimasNoticias.module.css,
  `.sobreFoto`): do alto da data para baixo ele nunca fica abaixo de 75%.

  Uma diferença do desenho, de propósito: o canto e o recorte (`overflow`)
  ficam no link (`.casca`), e não no `<article>`. No desenho, o anel de
  foco do link, 4px para fora, era cortado pelo recorte do `<article>`.

  O cartão: branco, canto de 18px, sombra, sobe 3px ao passar o mouse (só o
  que é link), e o cartão inteiro é o link, pelo título esticado. O anel
  de foco do título vai para o cartão inteiro onde o navegador sabe `:has`;
  onde não sabe, fica o do próprio link.

  Poucas notícias: a regra da home (`arranjoDaLista`,
  lib/arranjo-das-noticias.ts), com uma coluna por cartão (`--colunas`,
  escrito pelo componente) e o cartão deitado (`data-deitado`).

  No celular, a lista fica na coluna do texto, como na home: o destaque em
  4:3 e as outras em linhas com a miniatura quadrada de 88px.

  A notícia sem capa e a moldura "a entrar" são as da home (`.semCapa` de
  UltimasNoticias.module.css e components/base/MolduraProvisoria.tsx).
  #DDE2E0, o cinza atrás da foto enquanto ela carrega, é o do retrato do
  médico (components/diretorio/FotoDoMedico.module.css).
*/

.lista > .grade {
  margin-top: var(--gap);
}

.destaque {
  border-radius: var(--radius-painel);
  box-shadow: var(--shadow-erguido);
}

.casca {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  overflow: hidden;
  border-radius: inherit;
  background: var(--color-ami-green-900);
  color: var(--color-white);
}

.casca:focus-visible {
  outline-offset: 4px;
}

.fotoDoDestaque {
  grid-area: 1 / 1;
  align-self: stretch;
  width: 100%;
  aspect-ratio: 2 / 1;
  overflow: hidden;
}

.destaque:hover .fotoDoDestaque img {
  transform: scale(1.05);
}

.sobreFoto {
  --folga: 96px;
  position: relative;
  grid-area: 1 / 1;
  align-self: end;
  padding: var(--folga) var(--m) 40px;
  background: linear-gradient(
    0deg,
    rgba(8, 14, 10, 0.88) 0%,
    rgba(8, 14, 10, 0.75) calc(100% - var(--folga)),
    rgba(8, 14, 10, 0) 100%
  );
}

.data {
  display: block;
  font-size: 11.5px;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--color-ink-400);
}

.sobreFoto .data {
  color: rgba(255, 255, 255, 0.72);
}

.destaqueTitulo {
  max-width: 28ch;
  margin: 12px 0 14px;
  font-size: clamp(28px, 2.7vw, 38px);
  line-height: 1.1;
  color: var(--color-white);
}

.destaqueResumo {
  max-width: 40em;
  font-size: 16.5px;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.82);
}

.grade {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(var(--colunas, 3), minmax(0, 1fr));
  gap: var(--gap);
}

.cartao {
  position: relative;
  display: flex;
  flex-direction: column;
  min-width: 0;
  background: var(--color-surface);
  border-radius: 18px;
  overflow: hidden;
  box-shadow: var(--shadow-erguido);
  transition:
    transform 0.35s cubic-bezier(0.2, 0.7, 0.2, 1),
    box-shadow 0.35s;
}

.cartao:has(a):hover {
  transform: translateY(-3px);
  box-shadow:
    0 1px 2px rgba(16, 24, 40, 0.05),
    0 18px 40px rgba(16, 24, 40, 0.1);
}

.foto {
  aspect-ratio: 16 / 10;
  overflow: hidden;
  background: #DDE2E0;
}

.cartao:hover .foto img {
  transform: scale(1.04);
}

.corpo {
  min-width: 0;
  padding: 20px 24px 26px;
}

.titulo {
  margin-top: 10px;
  font-size: 21px;
  line-height: 1.2;
  letter-spacing: -0.025em;
  text-wrap: balance;
}

.titulo a::after {
  content: "";
  position: absolute;
  inset: 0;
  z-index: 1;
  border-radius: inherit;
}

.resumo {
  margin-top: 10px;
  font-size: 14.5px;
  line-height: 1.55;
  color: var(--color-ink-600);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

@supports selector(:has(a)) {
  .titulo a:focus-visible {
    outline: none;
  }

  .cartao:has(.titulo a:focus-visible) {
    outline: 2px solid var(--color-ami-green-600);
    outline-offset: 3px;
  }
}

.nenhuma {
  padding: 0 var(--m);
}

.nenhuma p {
  font-family: var(--font-titulo);
  font-weight: 500;
  letter-spacing: -0.025em;
  font-size: 28px;
  line-height: 1.2;
  color: var(--color-ami-green-800);
}

.acao {
  margin-top: 20px;
}

@media (min-width: 701px) {
  .grade[data-deitado] .cartao {
    display: grid;
    grid-template-columns: calc((100% - 2 * var(--gap)) / 3) minmax(0, 1fr);
    align-items: center;
  }

  .grade[data-deitado] .corpo {
    padding: 32px var(--m);
  }

  .grade[data-deitado] .titulo {
    max-width: 30ch;
    font-size: 26px;
  }

  .grade[data-deitado] .resumo {
    max-width: 40em;
    font-size: 15.5px;
  }
}

@media (max-width: 980px) {
  .grade {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .grade[data-deitado] {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 700px) {
  .lista,
  .outras > .grade {
    padding: 0 var(--m);
  }

  .lista .nenhuma {
    padding: 0;
  }

  .destaque {
    border-radius: 16px;
  }

  .fotoDoDestaque {
    aspect-ratio: 4 / 3;
  }

  .sobreFoto {
    --folga: 70px;
    padding: var(--folga) var(--m) 20px;
  }

  .destaqueTitulo {
    margin: 8px 0;
    font-size: 22px;
    line-height: 1.15;
  }

  .destaqueResumo {
    font-size: 14px;
    line-height: 1.5;
  }

  .lista > .grade {
    margin-top: 6px;
  }

  .grade,
  .grade[data-deitado] {
    grid-template-columns: 1fr;
    gap: 0;
  }

  .cartao,
  .grade[data-deitado] .cartao {
    display: grid;
    grid-template-columns: 88px minmax(0, 1fr);
    column-gap: 14px;
    align-items: center;
    padding: 14px 0;
    background: none;
    box-shadow: none;
    border-radius: 0;
    overflow: visible;
  }

  .cartao + .cartao {
    border-top: 1px solid var(--color-line);
  }

  .cartao:has(a):hover {
    transform: none;
    box-shadow: none;
  }

  .foto {
    width: 88px;
    aspect-ratio: 1 / 1;
    border-radius: 12px;
  }

  .corpo,
  .grade[data-deitado] .corpo {
    padding: 0;
  }

  .titulo,
  .grade[data-deitado] .titulo {
    margin-top: 4px;
    font-size: 16px;
    line-height: 1.25;
  }

  .resumo {
    display: none;
  }

  .nenhuma p {
    font-size: 22px;
  }

  @supports selector(:has(a)) {
    .cartao:has(.titulo a:focus-visible) {
      outline-offset: 0;
      border-radius: 12px;
    }
  }
}
```

`.lista` só tem regra no celular: no computador e no tablet, a caixa da página (app/(site)/encontre.module.css) já é a largura dos painéis. A foto do destaque e a do cartão herdam `width/height: 100%`, `object-fit: cover` e a transição do `.imagem` da home (UltimasNoticias.module.css), que `FotoDaNoticia` usa.

- [ ] **Step 4: A foto**

`components/editorial/FotoDaNoticia.tsx`:

```tsx
import styles from "@/components/editorial/UltimasNoticias.module.css";
import { urlDaImagem } from "@/lib/sanity/imagem";
import type { CapaSanity } from "@/lib/sanity/tipos";

/*
  A foto de uma notícia no destaque ou no cartão da lista (e de "Outras
  notícias"), ou o verde da marca com o símbolo, quando a notícia não tem
  capa (a capa é opcional no Studio). Os dois desenhos são os da home
  (UltimasNoticias.module.css: `.imagem` e `.semCapa`).

  - `urlDaImagem` devolve "" quando o `_ref` está malformado; um
    `<img src="">` faria o navegador pedir a página de novo. Sem endereço,
    sai o mesmo desenho de quem não tem capa.
  - `alt=""`: a foto está dentro do link, e o nome do link é o título. A
    descrição da foto entraria no nome do link antes do título.
  - `prioridade`: a foto do destaque é a primeira imagem grande da página e
    baixa logo (`fetchPriority="high"`); as dos cartões, só ao rolar.
  - O CDN só redimensiona pela largura: o recorte na caixa é o
    `object-fit: cover` do CSS, pelo meio da foto, como na home.
*/
export function FotoDaNoticia({
  capa,
  larguras,
  sizes,
  prioridade = false,
}: {
  capa?: CapaSanity;
  larguras: readonly number[];
  sizes: string;
  prioridade?: boolean;
}) {
  const src = capa ? urlDaImagem(capa, larguras[1]) : "";
  if (!capa || !src) return <div className={styles.semCapa} aria-hidden="true" />;
  return (
    /* eslint-disable-next-line @next/next/no-img-element --
       o CDN do Sanity já redimensiona; ver lib/sanity/imagem.ts. */
    <img
      src={src}
      srcSet={larguras.map((l) => `${urlDaImagem(capa, l)} ${l}w`).join(", ")}
      sizes={sizes}
      alt=""
      {...(prioridade ? { fetchPriority: "high" as const } : { loading: "lazy" as const })}
      decoding="async"
      className={styles.imagem}
    />
  );
}
```

- [ ] **Step 5: O cartão e a grade**

`components/editorial/CartaoNoticia.tsx`:

```tsx
import Link from "next/link";
import { MolduraProvisoria } from "@/components/base/MolduraProvisoria";
import { FotoDaNoticia } from "@/components/editorial/FotoDaNoticia";
import styles from "@/components/editorial/Noticias.module.css";
import { LARGURAS_DO_CARTAO } from "@/lib/arranjo-das-noticias";
import { dataPorExtenso } from "@/lib/formato";
import type { ResumoNoticia } from "@/lib/sanity/tipos";

/*
  O cartão de uma notícia, na lista de /noticias e em "Outras notícias":
  a foto 16:10, a data, o título e o resumo cortado em duas linhas. O
  cartão inteiro leva à notícia, pelo link do título, esticado em CSS
  (Noticias.module.css).

  Sem `noticia`, é a moldura "a entrar" da home ("Notícia a entrar"), que
  só a demonstração mostra, e que não é link: não há página para ela.

  Marcas para a auditoria visual (scripts/auditoria-visual.js, conferência
  17): `data-cartao-noticia`, `data-foto`, `data-data` e `data-titulo`.
*/
export function CartaoNoticia({ noticia, sizes }: { noticia?: ResumoNoticia; sizes: string }) {
  return (
    <li className={styles.cartao} data-cartao-noticia="" data-a-entrar={noticia ? undefined : "notícias"}>
      <div className={styles.foto} data-foto="">
        {noticia ? (
          <FotoDaNoticia capa={noticia.capa} larguras={LARGURAS_DO_CARTAO} sizes={sizes} />
        ) : (
          <MolduraProvisoria
            largura={16}
            altura={10}
            rotulo="Espaço reservado para a capa de uma notícia"
            className="h-full"
          />
        )}
      </div>
      <div className={styles.corpo}>
        {noticia ? (
          <time className={styles.data} dateTime={noticia.publicadoEm} data-data="">
            {dataPorExtenso(noticia.publicadoEm)}
          </time>
        ) : null}
        <h3 className={styles.titulo} data-titulo="">
          {noticia ? <Link href={`/noticias/${noticia.slug}`}>{noticia.titulo}</Link> : "Notícia a entrar"}
        </h3>
        <p className={styles.resumo}>{noticia ? noticia.resumo : "Espaço reservado para uma publicação da AMI."}</p>
      </div>
    </li>
  );
}
```

`components/editorial/GradeDeNoticias.tsx`:

```tsx
import type { CSSProperties } from "react";
import { CartaoNoticia } from "@/components/editorial/CartaoNoticia";
import styles from "@/components/editorial/Noticias.module.css";
import { tamanhoDosCartoes, type ArranjoDaLista } from "@/lib/arranjo-das-noticias";
import { TRES_POR_LINHA } from "@/lib/noticias";
import type { ResumoNoticia } from "@/lib/sanity/tipos";

/*
  A grade dos cartões de notícia, no arranjo que a lista pede
  (`arranjoDaLista`, lib/arranjo-das-noticias.ts): uma coluna por cartão
  até três (`--colunas`), e o cartão deitado quando sobra um só
  (`data-deitado`). A última fileira incompleta fica alinhada à esquerda,
  como numa grade comum. O `sizes` da foto segue o arranjo
  (`tamanhoDosCartoes`).

  `role="list"`: sem o marcador (`list-style: none`), o Safari deixa de
  anunciar a lista ao leitor de tela.
*/
export function GradeDeNoticias({ noticias, arranjo }: { noticias: ResumoNoticia[]; arranjo: ArranjoDaLista }) {
  const sizes = tamanhoDosCartoes(arranjo);
  return (
    <ul
      className={styles.grade}
      style={{ "--colunas": arranjo.colunas } as CSSProperties}
      data-deitado={arranjo.deitado ? "" : undefined}
      role="list"
    >
      {noticias.map((n) => (
        <CartaoNoticia key={n.slug} noticia={n} sizes={sizes} />
      ))}
    </ul>
  );
}

/* Os três cartões "Notícia a entrar" da demonstração sem notícia, como na home. */
export function GradeAEntrar() {
  const sizes = tamanhoDosCartoes(TRES_POR_LINHA);
  return (
    <ul className={styles.grade} style={{ "--colunas": TRES_POR_LINHA.colunas } as CSSProperties} role="list">
      {Array.from({ length: TRES_POR_LINHA.colunas }, (_, i) => (
        <CartaoNoticia key={i} sizes={sizes} />
      ))}
    </ul>
  );
}
```

- [ ] **Step 6: A lista**

`components/editorial/ListaDeNoticias.tsx`:

```tsx
import Link from "next/link";
import { Icone } from "@/components/base/IconeServidor";
import { MolduraProvisoria } from "@/components/base/MolduraProvisoria";
import { FotoDaNoticia } from "@/components/editorial/FotoDaNoticia";
import { GradeAEntrar, GradeDeNoticias } from "@/components/editorial/GradeDeNoticias";
import styles from "@/components/editorial/Noticias.module.css";
import { LARGURAS_DO_DESTAQUE_DA_LISTA, SIZES_DO_DESTAQUE_DA_LISTA } from "@/lib/arranjo-das-noticias";
import { dataPorExtenso } from "@/lib/formato";
import type { ListaNaTela } from "@/lib/noticias";
import type { ResumoNoticia } from "@/lib/sanity/tipos";

/*
  A lista de /noticias, embaixo da faixa verde. Quem decide o que ela
  mostra é a página (`listaDeNoticias`, lib/noticias.ts):
  - com notícia: a mais recente em destaque, na largura dos painéis, e as
    outras na grade;
  - sem notícia, na demonstração: o destaque e três cartões "Notícia a
    entrar", como na home;
  - sem notícia, fora dela: "Nenhuma notícia publicada ainda." e o botão
    para o início. A frase fica na coluna do texto (`data-coluna`).

  O destaque e a grade são um bloco só (`data-bloco="noticias"`), a --gap
  um do outro. O h2 só para leitor de tela marca a região nos três casos.
*/
export function ListaDeNoticias({ lista }: { lista: ListaNaTela }) {
  return (
    <section data-bloco="noticias" aria-labelledby="publicacoes-titulo" className={styles.lista}>
      <h2 id="publicacoes-titulo" className="sr-only">
        Publicações
      </h2>

      {lista.tipo === "noticias" ? (
        <>
          <Destaque noticia={lista.destaque} />
          {lista.grade.length > 0 ? <GradeDeNoticias noticias={lista.grade} arranjo={lista.arranjo} /> : null}
        </>
      ) : lista.tipo === "a-entrar" ? (
        <>
          <Destaque />
          <GradeAEntrar />
        </>
      ) : (
        <div className={styles.nenhuma}>
          <p data-coluna="">Nenhuma notícia publicada ainda.</p>
          <div className={styles.acao}>
            <Link className="botao-contorno" href="/">
              <Icone nome="voltar" /> Voltar para o início
            </Link>
          </div>
        </div>
      )}
    </section>
  );
}

/*
  A notícia em destaque: a foto em 2:1 (4:3 no celular) e, sobre ela, a
  data, o título e o resumo, num degradê escuro que garante o contraste do
  texto branco mesmo sobre uma foto branca. O destaque inteiro é o link.
  Sem `noticia`, é a moldura da home, sem link.
*/
function Destaque({ noticia }: { noticia?: ResumoNoticia }) {
  const conteudo = (
    <>
      <div className={styles.fotoDoDestaque}>
        {noticia ? (
          <FotoDaNoticia
            capa={noticia.capa}
            larguras={LARGURAS_DO_DESTAQUE_DA_LISTA}
            sizes={SIZES_DO_DESTAQUE_DA_LISTA}
            prioridade
          />
        ) : (
          <MolduraProvisoria
            largura={2}
            altura={1}
            rotulo="Espaço reservado para a capa de uma notícia"
            className="h-full"
          />
        )}
      </div>
      <div className={styles.sobreFoto}>
        {noticia ? (
          <time className={styles.data} dateTime={noticia.publicadoEm}>
            {dataPorExtenso(noticia.publicadoEm)}
          </time>
        ) : null}
        <h3 className={styles.destaqueTitulo}>{noticia ? noticia.titulo : "Notícia a entrar"}</h3>
        <p className={styles.destaqueResumo}>
          {noticia ? noticia.resumo : "Espaço reservado para uma publicação da AMI."}
        </p>
      </div>
    </>
  );

  return (
    <article className={styles.destaque} data-a-entrar={noticia ? undefined : "notícias"}>
      {noticia ? (
        <Link href={`/noticias/${noticia.slug}`} className={styles.casca}>
          {conteudo}
        </Link>
      ) : (
        <div className={styles.casca}>{conteudo}</div>
      )}
    </article>
  );
}
```

- [ ] **Step 7: A página**

Reescreva `app/(site)/noticias/page.tsx` (CRLF; leia antes) inteiro:

```tsx
import type { Metadata } from "next";
import paginas from "@/app/(site)/encontre.module.css";
import { ListaDeNoticias } from "@/components/editorial/ListaDeNoticias";
import { FaixaCurta } from "@/components/layout/FaixaCurta";
import { JsonLd } from "@/components/seo/JsonLd";
import { DADOS_DEMONSTRACAO } from "@/lib/demonstracao";
import { LIMITE_DA_LISTA, listaDeNoticias } from "@/lib/noticias";
import { listarNoticias } from "@/lib/sanity/consultas";
import { itemList } from "@/lib/seo/jsonld";
import { tituloDePagina } from "@/lib/seo/metadados";

export const revalidate = 3600;

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  title: tituloDePagina("Notícias da Associação Médica de Imperatriz"),
  description:
    "Comunicados, eventos e notas da Associação Médica de Imperatriz, " +
    "assinados por médicos com CRM.",
  alternates: { canonical: "/noticias" },
};

/*
  A lista de notícias (item "Notícias" do menu), como no desenho aprovado
  (docs/desenho-aprovado/noticias-contato/noticias.html):
  - a faixa verde curta, com o rótulo, o título, a frase e o jornal no
    ladrilho;
  - a lista: a mais recente em destaque e as outras em cartões, no arranjo
    da home para poucas notícias; sem notícia, as molduras da home na
    demonstração, ou a frase de lista vazia fora dela (`listaDeNoticias`,
    lib/noticias.ts).

  No máximo 20, como antes, e sem paginação: "Mais antigas" entra numa
  fatia própria, quando a AMI passar de 20.

  O `ItemList` (spec da fundação, seção 7: toda listagem tem um) só sai
  quando há o que listar: um de zero itens descreve uma página vazia. Sem
  trilha e sem BreadcrumbList: dado estruturado sem o equivalente visível é
  marcação enganosa (lib/seo/jsonld.ts).

  Os blocos são filhos diretos de `.pagina` (app/(site)/encontre.module.css),
  a --ritmo um do outro; a lista fecha a página, a --ritmo do rodapé.
*/
export default async function PaginaNoticias() {
  const noticias = await listarNoticias(LIMITE_DA_LISTA);
  const lista = listaDeNoticias(DADOS_DEMONSTRACAO, noticias);

  return (
    <>
      {lista.tipo === "noticias" ? (
        <JsonLd
          dados={itemList(
            [lista.destaque, ...lista.grade].map((n) => ({ nome: n.titulo, caminho: `/noticias/${n.slug}` })),
            SITE,
          )}
        />
      ) : null}

      <div className={paginas.pagina}>
        <FaixaCurta
          rotulo="Notícias"
          titulo="Notícias da AMI"
          texto="Comunicados, eventos e notas da associação. Cada texto é assinado por um médico, com o número de inscrição no CRM."
          icone="jornal"
        />
        <ListaDeNoticias lista={lista} />
      </div>
    </>
  );
}
```

- [ ] **Step 8: Rodar, provar por mutação, conferir, commit**

Run: `npx vitest run` · `npx tsc --noEmit` · `npm run build` → verde. `testes/noticias-da-home.test.ts` continua verde sem mudança: a home não mudou. No resumo do build, `/noticias` continua gerada no build (○), e não ƒ.

A `LinhaNoticia` fica sem uso depois desta tarefa, mas só sai na Task 4: a página da notícia aberta, que a Task 4 reescreve, ainda a cita nos comentários.

Mutações, uma de cada vez, regravando o original depois:

1. Na grade, tire o `data-deitado`.
2. Na grade, troque `arranjo.colunas` por `3` no `style`.
3. Na lista, troque o ramo `"a-entrar"` pelo da lista vazia.
4. Em `FotoDaNoticia`, troque `prioridade = false` por `prioridade = true`.
5. No destaque, troque o `<Link>` por um `<div>` mesmo com notícia.
6. Na página, troque `listarNoticias(LIMITE_DA_LISTA)` por `listarNoticias(21)`.
7. Na página, troque o `JsonLd` condicional por `<JsonLd dados={itemList([], SITE)} />`, sempre.
8. No CSS, tire a regra `.grade` do bloco de 980px.
9. No CSS, troque `rgba(8, 14, 10, 0.75)` por `rgba(8, 14, 10, 0.62)` no `.sobreFoto`.
10. No CSS, troque `.cartao:has(a):hover` por `.cartao:hover`.

Conferência rápida no navegador:
1. `npm run build` e `npx next start -p 3300` (a chave de hoje é a de demonstração).
2. Abra `/noticias` a 1440 e a 390px.
3. Expected: iguais a `docs/desenho-aprovado/noticias-contato/noticias-1440-a-entrar-parte-1.jpg`, `-parte-2.jpg` e `noticias-390-a-entrar-parte-1.jpg`. Os estados com notícia (`noticias-1440-parte-*`, `poucas-*`) não têm como aparecer no navegador sem notícia publicada: quem os prova são os testes deste passo e o CSS transcrito.
4. Derrube o 3300 pelo PID.

```bash
git add components/editorial/FotoDaNoticia.tsx components/editorial/CartaoNoticia.tsx components/editorial/GradeDeNoticias.tsx components/editorial/ListaDeNoticias.tsx components/editorial/Noticias.module.css "app/(site)/noticias/page.tsx" testes/lista-de-noticias.test.ts
git commit -m "Lista de noticias: faixa verde curta, destaque na largura dos paineis, cartoes no arranjo da home e os dois estados sem noticia; sem Cabeceira nem BreadcrumbList"
```

---
### Task 4: A notícia aberta `/noticias/[slug]`

**Files:**
- Create: `components/editorial/FaixaDaNoticia.tsx`, `components/editorial/CapaDaNoticia.tsx`, `components/editorial/AutorDaNoticia.tsx`, `components/editorial/OutrasNoticias.tsx`, `components/editorial/NoticiaAberta.module.css`
- Modify: `components/editorial/PaginaDeTexto.module.css` (o fim da notícia)
- Modify: `app/(site)/noticias/[slug]/page.tsx` (reescrita; LF)
- Delete: `components/editorial/TextoRico.tsx`, `components/editorial/LinhaNoticia.tsx`
- Modify: `components/editorial/UltimasNoticias.tsx` (CRLF), `components/home/Carrossel.tsx` (CRLF), `lib/sanity/banners.ts` (CRLF), `lib/sanity/link.ts` (CRLF), `testes/banners.test.ts` (CRLF), `testes/sanity-schemas.test.ts` (LF), `testes/paleta.test.ts` (LF) (comentários)
- Create: `testes/noticia-aberta.test.ts`

**Interfaces:**
- Consumes:
  - `VOLTA_NOTICIAS`, `assinaturaDoAutor`, `capaDaNoticia`, `ImagemNaTela`, `SIZES_DA_CAPA`, `outrasNoticias`, `LIMITE_DE_OUTRAS`, `TRES_POR_LINHA` (`lib/noticias.ts`, Task 1);
  - `FaixaCurta` com `className` e sem `icone`, `FaixaDoTexto`, `CorpoDoTexto` com a citação e a imagem (Task 2);
  - `GradeDeNoticias` (Task 3);
  - as classes `cabSecao` e `titulo` de `components/editorial/UltimasNoticias.module.css` (o cabeçalho de seção das notícias da home, sem mudança) e `outras` de `Noticias.module.css` (Task 3);
  - `noticiaPorSlug`, `listarNoticias`, `slugsDeNoticias` (`lib/sanity/consultas.ts`), `newsArticle` (`lib/seo/jsonld.ts`, sem mudança), `JsonLd`, `LadrilhoIcone`, `Icone`, `dataPorExtenso`.
- Produces:

```ts
// components/editorial/FaixaDaNoticia.tsx
export function FaixaDaNoticia(props: { noticia: Noticia }): JSX.Element; // a FaixaCurta com a classe `materia` e a assinatura
// components/editorial/CapaDaNoticia.tsx
export function CapaDaNoticia(props: { capa: ImagemNaTela }): JSX.Element; // <figure data-bloco="capa" …>
// components/editorial/AutorDaNoticia.tsx
export function AutorDaNoticia(props: { autor: Autor }): JSX.Element; // o fim da coluna: quem assina e o aviso de saúde
// components/editorial/OutrasNoticias.tsx
export function OutrasNoticias(props: { noticias: ResumoNoticia[] }): JSX.Element; // <section data-bloco="outras" …>
// NoticiaAberta.module.css: materia, assinatura, vidro, nome, meta, ponto, capa
// PaginaDeTexto.module.css ganha: autorFim, autorNome, autorCrm, autorAcoes, avisoSaude
```

- [ ] **Step 1: Os testes**

`testes/noticia-aberta.test.ts`:

```ts
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Icon } from "@phosphor-icons/react";
import { ArrowRight, ArrowUpRight, Stethoscope } from "@phosphor-icons/react/dist/ssr";
import type { PortableTextBlock } from "@portabletext/react";
import estilosPagina from "@/app/(site)/encontre.module.css";
import PaginaNoticia, { generateMetadata, generateStaticParams } from "@/app/(site)/noticias/[slug]/page";
import { AutorDaNoticia } from "@/components/editorial/AutorDaNoticia";
import { CapaDaNoticia } from "@/components/editorial/CapaDaNoticia";
import { FaixaDaNoticia } from "@/components/editorial/FaixaDaNoticia";
import estilos from "@/components/editorial/NoticiaAberta.module.css";
import estilosLista from "@/components/editorial/Noticias.module.css";
import { OutrasNoticias } from "@/components/editorial/OutrasNoticias";
import estilosTexto from "@/components/editorial/PaginaDeTexto.module.css";
import estilosHome from "@/components/editorial/UltimasNoticias.module.css";
import estilosFaixa from "@/components/especialidades/FaixaDaEspecialidade.module.css";
import { SIZES_DA_CAPA, capaDaNoticia } from "@/lib/noticias";
import type { Noticia, ResumoNoticia } from "@/lib/sanity/tipos";
import { tituloDePagina } from "@/lib/seo/metadados";
import { fonte } from "@/testes/apoio";
import { base, bloco, regra, semNotas } from "@/testes/css";
import { htmlDe } from "@/testes/renderizar";

/*
  A notícia aberta (/noticias/[slug]): a faixa com a assinatura, a capa, o
  corpo na coluna de leitura, o fim da notícia, "Outras notícias" e a página
  de verdade, com o Sanity trocado por um dublê. As notícias daqui são de
  exemplo e só existem neste teste; o autor é o da diretoria de teste do
  banco.

  A página não depende da chave de demonstração: sem notícia publicada, ela
  dá 404 nos dois modos.

  O endereço da capa sai do CDN do Sanity, com o projeto do ambiente: o
  teste o fixa por `stubEnv`, e `CONFIG` é o mesmo projeto, para o
  `capaDaNoticia` daqui dar o mesmo endereço que a página desenha.
*/

vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));

const sanity = vi.hoisted(() => ({
  noticias: {} as Record<string, unknown>,
  publicadas: [] as unknown[],
  limites: [] as number[],
}));

vi.mock("@/lib/sanity/consultas", () => ({
  noticiaPorSlug: async (slug: string) => sanity.noticias[slug] ?? null,
  listarNoticias: async (limite: number) => {
    sanity.limites.push(limite);
    return sanity.publicadas.slice(0, limite);
  },
  slugsDeNoticias: async () => Object.keys(sanity.noticias),
}));

const CONFIG = { projectId: "abcd1234", dataset: "production" };

const desenho = (Componente: Icon, size: number, weight: "duotone" | "regular") =>
  renderToString(createElement(Componente, { size, weight, className: "", "aria-hidden": "true" }));

/** Sem o `<link rel="preload">` que o React 19 põe antes do HTML para a capa. */
const semPreload = (html: string) => html.replace(/<link rel="preload"[^>]*\/>/g, "");

/** O texto que aparece, sem tags, num espaço só. */
const tela = (html: string) =>
  html
    .replace(/<!-- -->/g, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

/** O `&` como o HTML o escreve dentro de um atributo. */
const atributo = (texto: string) => texto.replaceAll("&", "&amp;");

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

const AUTOR = { nome: "Rafael Coelho", crm: "10137", crmUf: "MA", slugDoPerfil: "rafael-coelho" };
const CAPA = {
  asset: { _ref: "image-abc123def456-2000x1333-jpg" },
  alt: "Plateia sentada num auditório escuro, de frente para o palco",
  hotspot: { x: 0.5, y: 0.9, width: 0.2, height: 0.2 },
};

const JORNADA: Noticia = {
  titulo: "Jornada Médica de Imperatriz abre inscrições para a edição de novembro",
  slug: "jornada",
  resumo: "Dois dias de palestras e oficinas para médicos e estudantes, na sede da AMI.",
  publicadoEm: "2026-09-18T09:00:00-03:00",
  atualizadoEm: "2026-09-20T10:00:00-03:00",
  capa: CAPA,
  autor: AUTOR,
  corpo: [
    b("a", "normal", "A AMI abre as inscrições para a Jornada Médica de Imperatriz."),
    b("b", "h2", "Programação"),
    b("c", "normal", "Os dois dias se dividem entre palestras e oficinas."),
    b("d", "blockquote", "Queremos que o médico saia da jornada com algo que use no consultório."),
    b("e", "h2", "Como se inscrever"),
    b("f", "normal", "Tenha à mão o número de inscrição no CRM.", { listItem: "number", level: 1 }),
  ],
};

const COMUNICADO: Noticia = {
  titulo: "Comunicado aos associados: atualização do cadastro no diretório",
  slug: "comunicado",
  resumo: "Os associados podem conferir e corrigir os dados que aparecem no diretório do site.",
  publicadoEm: "2026-07-30T09:00:00-03:00",
  autor: { nome: "Rafael Coelho", crm: "10137", crmUf: "MA" },
  corpo: [b("a", "normal", "A AMI pede aos associados que confiram os dados do diretório.")],
};

function resumo(n: Noticia): ResumoNoticia {
  return { titulo: n.titulo, slug: n.slug, resumo: n.resumo, capa: n.capa, autor: n.autor, publicadoEm: n.publicadoEm };
}

const outra = (n: number): ResumoNoticia => ({
  titulo: `Outra notícia ${n}`,
  slug: `outra-${n}`,
  resumo: `Resumo da outra notícia ${n}.`,
  autor: AUTOR,
  publicadoEm: `2026-09-0${n}T12:00:00-03:00`,
});

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_SANITY_PROJECT_ID", "abcd1234");
  vi.stubEnv("NEXT_PUBLIC_SANITY_DATASET", "production");
  sanity.noticias = { jornada: JORNADA, comunicado: COMUNICADO };
  sanity.publicadas = [resumo(JORNADA), outra(5), outra(4), outra(3), resumo(COMUNICADO)];
  sanity.limites = [];
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("a faixa da notícia", () => {
  const html = () => renderToString(createElement(FaixaDaNoticia, { noticia: JORNADA }));

  it("a faixa curta com a classe da notícia, sem o ladrilho à direita", () => {
    expect(html()).toMatch(
      new RegExp(`^<section data-bloco="topo" data-faixa="" data-abertura="" [^>]*class="textura-verde [^"]* ${estilos.materia}">`),
    );
    expect(html()).not.toContain(estilosFaixa.selo);
  });

  it("← NOTÍCIAS, o título e o resumo", () => {
    expect(tela(/<a [^>]*href="\/noticias"[^>]*>[\s\S]*?<\/a>/.exec(html())![0])).toBe("Notícias");
    expect(html()).toContain(`>${JORNADA.titulo}</h1>`);
    expect(html()).toContain(`>${JORNADA.resumo}</p>`);
  });

  it("embaixo do fio, a assinatura: o estetoscópio no vidro, Por e o link do perfil, MÉDICO · CRM e a data", () => {
    expect(html()).toContain(
      `<div class="${estilos.assinatura}"><span class="${estilos.vidro}" aria-hidden="true">${desenho(Stethoscope, 20, "duotone")}</span>` +
        `<div><p class="${estilos.nome}">Por <a href="/medico/rafael-coelho">Rafael Coelho</a></p>` +
        `<p class="${estilos.meta}">MÉDICO · CRM/MA 10137<span class="${estilos.ponto}"> · </span>` +
        `<time dateTime="2026-09-18T09:00:00-03:00">18 de setembro de 2026</time></p></div></div></div></section>`,
    );
  });

  it("autor sem perfil: o nome sem link", () => {
    const sem = renderToString(createElement(FaixaDaNoticia, { noticia: COMUNICADO }));
    expect(sem).toContain(`<p class="${estilos.nome}">Por Rafael Coelho</p>`);
    expect(sem).not.toContain("/medico/");
  });
});

describe("a capa", () => {
  it("em 16:9, recortada pelo ponto de interesse, com prioridade, na largura dos painéis", () => {
    const capa = capaDaNoticia(CAPA, CONFIG)!;
    expect(semPreload(renderToString(createElement(CapaDaNoticia, { capa })))).toBe(
      `<figure data-bloco="capa" class="${estilos.capa}"><img src="${atributo(capa.src)}" srcSet="${atributo(capa.srcSet)}" ` +
        `sizes="${SIZES_DA_CAPA}" alt="${CAPA.alt}" width="1600" height="900" fetchPriority="high" decoding="async"/></figure>`,
    );
  });
});

describe("o fim da notícia", () => {
  it("quem assina, com Ver perfil, e o aviso de saúde", () => {
    expect(renderToString(createElement(AutorDaNoticia, { autor: AUTOR }))).toBe(
      `<div class="${estilosTexto.autorFim}"><span class="ladrilho-icone ladrilho-icone--pequeno" aria-hidden="true">${desenho(Stethoscope, 23, "duotone")}</span>` +
        `<div><p class="${estilosTexto.autorNome}">Por Rafael Coelho</p><p class="${estilosTexto.autorCrm}">MÉDICO · CRM/MA 10137</p></div>` +
        `<div class="${estilosTexto.autorAcoes}"><a class="botao-contorno" href="/medico/rafael-coelho">Ver perfil ${desenho(ArrowRight, 20, "regular")}</a></div></div>` +
        `<p class="${estilosTexto.avisoSaude}">Conteúdo informativo publicado pela Associação Médica de Imperatriz. Não substitui a consulta médica.</p>`,
    );
  });

  it("sem perfil, sem o botão, e o nome sem link", () => {
    const html = renderToString(createElement(AutorDaNoticia, { autor: COMUNICADO.autor }));
    expect(html).not.toContain(estilosTexto.autorAcoes);
    expect(html).not.toContain("<a ");
    expect(html).toContain(`<p class="${estilosTexto.autorNome}">Por Rafael Coelho</p>`);
  });
});

describe("Outras notícias", () => {
  const html = renderToString(createElement(OutrasNoticias, { noticias: [outra(5), outra(4), outra(3)] }));

  it("o cabeçalho de seção das notícias da home, com Ver todas as notícias; entra ao rolar", () => {
    expect(html.startsWith(
      `<section data-bloco="outras" aria-labelledby="outras-titulo" class="revelar ${estilosLista.outras}">` +
        `<div class="${estilosHome.cabSecao}"><div><span class="rotulo-secao" data-coluna="">Notícias</span>` +
        `<h2 id="outras-titulo" class="${estilosHome.titulo}">Outras notícias</h2></div>` +
        `<a class="botao-linha" href="/noticias">Ver todas as notícias ${desenho(ArrowUpRight, 16, "regular")}</a></div>`,
    )).toBe(true);
  });

  it("três por linha, com o cartão da lista", () => {
    expect(html).toContain(`<ul class="${estilosLista.grade}" style="--colunas:3" role="list">`);
    expect(html.match(/data-cartao-noticia=""/g)).toHaveLength(3);
  });
});

async function renderiza(slug: string) {
  return semPreload(await htmlDe(await PaginaNoticia({ params: Promise.resolve({ slug }) })));
}

const blocos = (html: string) => [...html.matchAll(/data-bloco="([^"]+)"/g)].map((m) => m[1]);

const jsonLd = (html: string) =>
  [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(
    (m) => JSON.parse(m[1]) as Record<string, unknown>,
  );

describe("a página da notícia", () => {
  it("a faixa, a capa, o texto e Outras notícias, no invólucro de coluna e ritmo, com um h1 só", async () => {
    const html = await renderiza("jornada");
    expect(html).toContain(`<div class="${estilosPagina.pagina}"><section data-bloco="topo"`);
    expect(blocos(html)).toEqual(["topo", "capa", "texto", "outras"]);
    expect(html.match(/<h1\b/g)).toHaveLength(1);
  });

  it("o corpo na faixa branca: a data de atualização, o índice dos dois títulos, a citação e a lista numerada", async () => {
    const html = await renderiza("jornada");
    expect(html).toContain(
      `<section data-bloco="texto" data-faixa="" aria-label="Texto da notícia" class="${estilosTexto.faixa}">`,
    );
    expect(html).toMatch(/Atualizado em <time dateTime="2026-09-20T10:00:00-03:00">20 de setembro de 2026<\/time>/);
    expect([...html.matchAll(/<a href="#(secao-[^"]+)"/g)].map((m) => m[1])).toEqual([
      "secao-programacao",
      "secao-como-se-inscrever",
      "secao-programacao",
      "secao-como-se-inscrever",
    ]);
    expect(html).toContain('<h2 id="secao-programacao">Programação</h2>');
    expect(html).toContain("<blockquote>Queremos que o médico saia da jornada com algo que use no consultório.</blockquote>");
    expect(html).toContain("<ol><li>Tenha à mão o número de inscrição no CRM.</li></ol>");
  });

  it("no fim da coluna, quem assina e o aviso de saúde", async () => {
    const html = await renderiza("jornada");
    expect(html).toMatch(new RegExp(`<p class="${estilosTexto.avisoSaude}">[^<]+</p></article>`));
    expect(html).toContain('<a class="botao-contorno" href="/medico/rafael-coelho">Ver perfil');
  });

  it("Outras notícias: as três mais recentes, sem a aberta, e pede uma a mais ao Sanity", async () => {
    const html = await renderiza("jornada");
    const outras = /<section data-bloco="outras"[\s\S]*<\/section>/.exec(html)![0];
    expect([...outras.matchAll(/<a href="\/noticias\/([^"]+)"/g)].map((m) => m[1])).toEqual([
      "outra-5",
      "outra-4",
      "outra-3",
    ]);
    expect(sanity.limites).toEqual([4]);
  });

  it("o JSON-LD é só o NewsArticle de antes; sem BreadcrumbList, Cabeceira nem trilha", async () => {
    const html = await renderiza("jornada");
    const dados = jsonLd(html);
    expect(dados.map((d) => d["@type"])).toEqual(["NewsArticle"]);
    expect(dados[0].headline).toBe(JORNADA.titulo);
    expect(html).not.toContain("BreadcrumbList");
    expect(html).not.toContain("Trilha de navegação");
    expect(html).not.toContain("-mt-32");
  });

  it("o comunicado curto: sem capa, sem índice, sem atualização e sem outras; o texto fecha a página", async () => {
    sanity.publicadas = [resumo(COMUNICADO)];
    const html = await renderiza("comunicado");
    expect(blocos(html)).toEqual(["topo", "texto"]);
    expect(html).not.toContain("data-nesta-pagina");
    expect(html).not.toContain("Atualizado em");
    expect(html).toMatch(/<section data-bloco="texto" data-faixa=""[\s\S]*<\/section><\/div>$/);
  });

  it("capa com a referência quebrada: a notícia sai sem a capa", async () => {
    sanity.noticias.jornada = { ...JORNADA, capa: { ...CAPA, asset: { _ref: "nao-e-um-ref-valido" } } };
    expect(blocos(await renderiza("jornada"))).toEqual(["topo", "texto", "outras"]);
  });

  it("endereço sem notícia: página não encontrada", async () => {
    await expect(renderiza("nao-existe")).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("os metadados e os endereços gerados no build continuam os de antes", async () => {
    const m = await generateMetadata({ params: Promise.resolve({ slug: "jornada" }) });
    expect(m.title).toBe(tituloDePagina(JORNADA.titulo));
    expect(m.description).toBe(JORNADA.resumo);
    expect(m.alternates).toEqual({ canonical: "/noticias/jornada" });
    expect(await generateMetadata({ params: Promise.resolve({ slug: "nao-existe" }) })).toEqual({});
    expect(await generateStaticParams()).toEqual([{ slug: "jornada" }, { slug: "comunicado" }]);
  });
});

describe("o CSS da notícia aberta", () => {
  const css = semNotas(fonte("../components/editorial/NoticiaAberta.module.css"));
  const cel = () => bloco(css, "@media (max-width: 700px)");

  it("uma coluna só, sem a do ladrilho, valendo sobre a regra da faixa da especialidade", () => {
    expect(regra(base(css), ".materia[data-faixa][data-abertura]")).toMatch(/grid-template-columns: minmax\(0, 1fr\);/);
  });

  it("o título menor que o das outras faixas: de 34 a 50px, até 24 caracteres; 30px no celular", () => {
    const r = regra(base(css), ".materia[data-faixa] h1");
    expect(r).toMatch(/font-size: clamp\(34px, 3\.6vw, 50px\);/);
    expect(r).toMatch(/max-width: 24ch;/);
    expect(regra(cel(), ".materia[data-faixa] h1")).toMatch(/font-size: 30px;/);
  });

  it("a assinatura embaixo de um fio claro; no celular, a data desce para uma linha própria", () => {
    expect(regra(base(css), ".assinatura")).toMatch(/border-top: 1px solid rgba\(255, 255, 255, 0\.16\);/);
    expect(regra(base(css), ".meta")).toMatch(/color: #DDE7D6;/);
    expect(regra(cel(), ".ponto")).toMatch(/display: none;/);
    expect(regra(cel(), ".meta time")).toMatch(/display: block;/);
  });

  it("a capa em 16:9, com o canto dos painéis e a foto cobrindo a caixa", () => {
    expect(regra(base(css), ".capa")).toMatch(/aspect-ratio: 16 \/ 9;/);
    expect(regra(base(css), ".capa")).toMatch(/border-radius: var\(--radius-painel\);/);
    expect(regra(base(css), ".capa img")).toMatch(/object-fit: cover;/);
  });
});

describe("o CSS do fim da notícia", () => {
  const css = semNotas(fonte("../components/editorial/PaginaDeTexto.module.css"));
  const cel = () => bloco(css, "@media (max-width: 700px)");

  it("quem assina: embaixo de um fio, o ladrilho, o nome e o botão à direita", () => {
    const r = regra(base(css), ".coluna .autorFim");
    expect(r).toMatch(/border-top: 1px solid var\(--color-line\);/);
    expect(r).toMatch(/grid-template-columns: 44px minmax\(0, 1fr\) auto;/);
    expect(r).toMatch(/margin-top: 56px;/);
  });

  it("o aviso de saúde, cinza e menor", () => {
    const r = regra(base(css), ".coluna .avisoSaude");
    expect(r).toMatch(/font-size: 14px;/);
    expect(r).toMatch(/color: var\(--color-ink-400\);/);
  });

  it("no celular, Ver perfil na largura toda, embaixo", () => {
    expect(regra(cel(), ".autorFim .autorAcoes")).toMatch(/grid-column: 1 \/ -1;/);
    expect(regra(cel(), ".autorFim .autorAcoes > a")).toMatch(/width: 100%;/);
  });
});
```

O import estático da página funciona com o dublê: `vi.mock` sobe para antes dos imports.

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run testes/noticia-aberta.test.ts`
Expected: FAIL. Os componentes e as folhas não existem, e a página é a antiga, com `Cabeceira`, `TextoRico` e `BreadcrumbList`.

- [ ] **Step 3: O CSS da faixa e da capa**

`components/editorial/NoticiaAberta.module.css`:

```css
/*
  A faixa verde e a capa da notícia aberta, transcritas do desenho
  aprovado (docs/desenho-aprovado/noticias-contato/noticia.html:
  `.materia-topo`, `.materia-topo h1`, `.materia-topo .texto`,
  `.assinatura` e o que vem dentro dela, `.ladrilho-vidro`, `.capa-materia`,
  e o @media de 700px).

  A faixa é a faixa curta (components/layout/FaixaCurta.tsx), sem o
  ladrilho à direita: o título de uma notícia tem até 110 caracteres e
  precisa da largura. Por isso o título é menor que o das outras faixas
  (de 34 a 50px, até 24 caracteres por linha), e a grade tem uma coluna
  só.

  As regras daqui valem sobre as da faixa da especialidade e da busca
  qualquer que seja a ordem em que as folhas chegam ao navegador:
  - `.materia[data-faixa][data-abertura]` (classe e dois atributos) pesa
    mais que `.especialidade[data-faixa]`;
  - `.materia[data-faixa] h1` e `.materia[data-faixa] h1 + p` pesam mais
    que `.especialidade h1`, `.especialidade h1 + p`, `.titulo` e `.texto`.

  A assinatura, embaixo de um fio claro: o estetoscópio num ladrilho de
  vidro, "Por {autor}" (com o link do perfil, sublinhado claro) e a linha
  "MÉDICO · CRM/UF n · data", em caixa alta. O vidro e o fio são branco
  translúcido, sem tom. #DDE7D6, a linha do CRM, é a cor dos rótulos dos
  números de A Associação (components/associacao/FaixaDaAssociacao.module.css).

  A capa: em 16:9, na largura dos painéis, com o canto dos painéis. O
  recorte é o do CDN, pelo ponto de interesse (`capaDaNoticia`,
  lib/noticias.ts); o `object-fit` só cobre a caixa enquanto o arquivo
  chega. #DDE2E0, atrás dela, é o cinza do retrato do médico
  (components/diretorio/FotoDoMedico.module.css).
*/

.materia[data-faixa][data-abertura] {
  grid-template-columns: minmax(0, 1fr);
}

.materia[data-faixa] h1 {
  max-width: 24ch;
  font-size: clamp(34px, 3.6vw, 50px);
  line-height: 1.06;
}

.materia[data-faixa] h1 + p {
  max-width: 40em;
  font-size: 17.5px;
  line-height: 1.6;
}

.assinatura {
  display: grid;
  grid-template-columns: 44px minmax(0, 1fr);
  column-gap: 14px;
  align-items: center;
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid rgba(255, 255, 255, 0.16);
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

.nome {
  font-size: 15.5px;
  font-weight: 600;
  line-height: 1.4;
  color: var(--color-white);
}

.nome a {
  text-decoration: underline;
  text-decoration-color: rgba(255, 255, 255, 0.45);
  text-underline-offset: 3px;
  transition: text-decoration-color 0.2s;
}

.nome a:hover {
  text-decoration-color: var(--color-white);
}

.meta {
  margin-top: 3px;
  font-size: 12px;
  font-weight: 600;
  line-height: 1.5;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  font-variant-numeric: tabular-nums;
  color: #DDE7D6;
}

.capa {
  margin: 0;
  overflow: hidden;
  aspect-ratio: 16 / 9;
  border-radius: var(--radius-painel);
  background: #DDE2E0;
  box-shadow: var(--shadow-erguido);
}

.capa img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

@media (max-width: 700px) {
  .materia[data-faixa] h1 {
    font-size: 30px;
    line-height: 1.08;
  }

  .materia[data-faixa] h1 + p {
    font-size: 15.5px;
    line-height: 1.55;
  }

  .assinatura {
    grid-template-columns: 40px minmax(0, 1fr);
    column-gap: 12px;
    margin-top: 22px;
    padding-top: 18px;
  }

  .vidro {
    width: 40px;
    height: 40px;
    border-radius: 12px;
  }

  .vidro svg {
    width: 21px;
    height: 21px;
  }

  .nome {
    font-size: 15px;
  }

  .meta {
    font-size: 11px;
    letter-spacing: 0.08em;
  }

  .ponto {
    display: none;
  }

  .meta time {
    display: block;
  }

  .capa {
    border-radius: 20px;
  }
}
```

`.ponto` só tem regra no celular: no computador ele é o " · " entre o CRM e a data.

- [ ] **Step 4: O CSS do fim da notícia**

Em `components/editorial/PaginaDeTexto.module.css`:

1. No comentário do topo, troque a linha

```
  `.coluna figcaption`, `.coluna > p a`, `.coluna strong`, e o @media de
  700px): a lista numerada, a citação, a imagem com legenda, o link e o
  negrito. Valem também para as páginas de texto, quando o texto do Studio
  os tiver.
```

por

```
  `.coluna figcaption`, `.coluna > p a`, `.coluna strong`, `.autor-fim`,
  `.aviso-saude`, e o @media de 700px): a lista numerada, a citação, a
  imagem com legenda, o link, o negrito e o fim da notícia (quem assina e
  o aviso de saúde). Os cinco primeiros valem também para as páginas de
  texto, quando o texto do Studio os tiver.
```

2. Depois da regra `.numero { … }` (a última fora dos `@media`, do quadro "Fale com a AMI"), acrescente:

```css

/* O fim da notícia (components/editorial/AutorDaNoticia.tsx): quem assina,
   com "Ver perfil" quando há perfil, e o aviso de saúde. Mora aqui, e não
   na folha da notícia, porque vive dentro da coluna de leitura e as regras
   dele precisam valer sobre as da coluna (`.coluna p`). O ladrilho é o
   global (`.ladrilho-icone--pequeno`, 44px). */
.coluna .autorFim {
  display: grid;
  grid-template-columns: 44px minmax(0, 1fr) auto;
  column-gap: 16px;
  align-items: center;
  margin-top: 56px;
  padding-top: 28px;
  border-top: 1px solid var(--color-line);
}

.coluna .autorFim .autorNome {
  font-size: 16px;
  font-weight: 700;
  line-height: 1.35;
  color: var(--color-ami-green-800);
}

.coluna .autorFim .autorCrm {
  margin-top: 4px;
  font-size: 11.5px;
  font-weight: 600;
  line-height: 1.4;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  font-variant-numeric: tabular-nums;
  color: var(--color-ink-400);
}

.coluna .avisoSaude {
  margin-top: 28px;
  font-size: 14px;
  line-height: 1.6;
  color: var(--color-ink-400);
}
```

3. No bloco `@media (max-width: 700px)`, troque o fim dele (o que a Task 2 escreveu)

```css
  .coluna figcaption {
    font-size: 13.5px;
  }
}
```

por

```css
  .coluna figcaption {
    font-size: 13.5px;
  }

  .coluna .autorFim {
    grid-template-columns: 40px minmax(0, 1fr);
    column-gap: 14px;
    margin-top: 40px;
    padding-top: 22px;
  }

  .autorFim :global(.ladrilho-icone) {
    width: 40px;
    height: 40px;
    border-radius: 12px;
  }

  .autorFim :global(.ladrilho-icone) svg {
    width: 21px;
    height: 21px;
  }

  .autorFim .autorAcoes {
    grid-column: 1 / -1;
    margin-top: 16px;
  }

  .autorFim .autorAcoes > a {
    width: 100%;
    height: 46px;
    font-size: 14px;
  }

  .coluna .avisoSaude {
    margin-top: 22px;
    font-size: 13.5px;
  }
}
```

`.coluna .autorFim` e `.coluna .avisoSaude` (duas classes) pesam mais que `.coluna > * + *` e que `.coluna p`; o nome e o CRM (três classes) também.

- [ ] **Step 5: Os componentes**

`components/editorial/FaixaDaNoticia.tsx`:

```tsx
import Link from "next/link";
import { Icone } from "@/components/base/IconeServidor";
import styles from "@/components/editorial/NoticiaAberta.module.css";
import { FaixaCurta } from "@/components/layout/FaixaCurta";
import { dataPorExtenso } from "@/lib/formato";
import { VOLTA_NOTICIAS, assinaturaDoAutor } from "@/lib/noticias";
import type { Noticia } from "@/lib/sanity/tipos";

/*
  A faixa verde que abre a notícia: a faixa curta
  (components/layout/FaixaCurta.tsx), com "← NOTÍCIAS", o título e o
  resumo, sem o ladrilho à direita e com o título menor
  (NoticiaAberta.module.css, `.materia`).

  Embaixo de um fio, a assinatura: "Por {autor}", com o link do perfil
  quando o autor tem um no diretório, e "MÉDICO · CRM/UF n" com a data de
  publicação. O CRM vai junto do nome porque a Resolução CFM 2.336/2023
  pede (`identificacaoMedica`, lib/formato.ts); a assinatura vem logo no
  alto porque, num site de saúde, quem escreveu é a primeira coisa que o
  leitor precisa poder conferir.
*/
export function FaixaDaNoticia({ noticia }: { noticia: Noticia }) {
  const assinatura = assinaturaDoAutor(noticia.autor);

  return (
    <FaixaCurta volta={VOLTA_NOTICIAS} titulo={noticia.titulo} texto={noticia.resumo} className={styles.materia}>
      <div className={styles.assinatura}>
        <span className={styles.vidro} aria-hidden="true">
          <Icone nome="estetoscopio" duotone />
        </span>
        <div>
          <p className={styles.nome}>
            {assinatura.perfil ? (
              <>
                Por <Link href={assinatura.perfil}>{assinatura.nome}</Link>
              </>
            ) : (
              `Por ${assinatura.nome}`
            )}
          </p>
          <p className={styles.meta}>
            {assinatura.registro}
            <span className={styles.ponto}> · </span>
            <time dateTime={noticia.publicadoEm}>{dataPorExtenso(noticia.publicadoEm)}</time>
          </p>
        </div>
      </div>
    </FaixaCurta>
  );
}
```

`components/editorial/CapaDaNoticia.tsx`:

```tsx
import styles from "@/components/editorial/NoticiaAberta.module.css";
import { SIZES_DA_CAPA, type ImagemNaTela } from "@/lib/noticias";

/*
  A capa da notícia aberta, entre a faixa verde e o texto: em 16:9, na
  largura dos painéis, recortada pelo CDN no ponto de interesse que a AMI
  marcou no Studio (`capaDaNoticia`, lib/noticias.ts). Sem a moldura de
  8px com borda de antes: o desenho novo não põe caixa em volta de foto.

  É a primeira imagem grande da página: baixa logo (`fetchPriority`). O
  par de medidas é o de 16:9, o mesmo da caixa, e por isso nada se move
  quando o arquivo chega. É um bloco da página (`data-bloco="capa"`), a
  --ritmo da faixa e do texto.
*/
export function CapaDaNoticia({ capa }: { capa: ImagemNaTela }) {
  return (
    <figure data-bloco="capa" className={styles.capa}>
      {/* eslint-disable-next-line @next/next/no-img-element --
          o CDN do Sanity já redimensiona e recorta; ver lib/sanity/imagem.ts. */}
      <img
        src={capa.src}
        srcSet={capa.srcSet}
        sizes={SIZES_DA_CAPA}
        alt={capa.alt}
        width={capa.largura}
        height={capa.altura}
        fetchPriority="high"
        decoding="async"
      />
    </figure>
  );
}
```

`components/editorial/AutorDaNoticia.tsx`:

```tsx
import Link from "next/link";
import { Icone, LadrilhoIcone } from "@/components/base/IconeServidor";
import styles from "@/components/editorial/PaginaDeTexto.module.css";
import { assinaturaDoAutor } from "@/lib/noticias";
import type { Autor } from "@/lib/sanity/tipos";

/*
  O fim da notícia, no fim da coluna de leitura: quem assina (o
  estetoscópio, "Por {autor}" e "MÉDICO · CRM/UF n") com o botão "Ver
  perfil" quando o autor tem perfil no diretório, e o aviso de saúde que o
  site já publicava.

  O CSS mora na folha da página de texto (PaginaDeTexto.module.css,
  `.autorFim`), porque o bloco vive dentro da coluna e as regras dele
  precisam valer sobre as da coluna.
*/
export function AutorDaNoticia({ autor }: { autor: Autor }) {
  const assinatura = assinaturaDoAutor(autor);

  return (
    <>
      <div className={styles.autorFim}>
        <LadrilhoIcone nome="estetoscopio" pequeno />
        <div>
          <p className={styles.autorNome}>{`Por ${assinatura.nome}`}</p>
          <p className={styles.autorCrm}>{assinatura.registro}</p>
        </div>
        {assinatura.perfil ? (
          <div className={styles.autorAcoes}>
            <Link className="botao-contorno" href={assinatura.perfil}>
              Ver perfil <Icone nome="seta" />
            </Link>
          </div>
        ) : null}
      </div>
      <p className={styles.avisoSaude}>
        Conteúdo informativo publicado pela Associação Médica de Imperatriz. Não substitui a consulta médica.
      </p>
    </>
  );
}
```

`components/editorial/OutrasNoticias.tsx`:

```tsx
import Link from "next/link";
import { Icone } from "@/components/base/IconeServidor";
import { GradeDeNoticias } from "@/components/editorial/GradeDeNoticias";
import styles from "@/components/editorial/Noticias.module.css";
import home from "@/components/editorial/UltimasNoticias.module.css";
import { TRES_POR_LINHA } from "@/lib/noticias";
import type { ResumoNoticia } from "@/lib/sanity/tipos";

/*
  "Outras notícias", depois da faixa branca da notícia aberta, sobre o
  fundo da página: o cabeçalho de seção das notícias da home ("NOTÍCIAS /
  Outras notícias" e "Ver todas as notícias", UltimasNoticias.module.css) e
  os cartões da lista, três por linha. Com uma ou duas, os cartões guardam
  a largura de um de três, alinhados à esquerda. Quem escolhe as notícias é
  a página (`outrasNoticias`, lib/noticias.ts); sem nenhuma, o bloco nem é
  montado.

  Entra na tela ao rolar (`.revelar`): nunca está na primeira tela.
*/
export function OutrasNoticias({ noticias }: { noticias: ResumoNoticia[] }) {
  return (
    <section data-bloco="outras" aria-labelledby="outras-titulo" className={`revelar ${styles.outras}`}>
      <div className={home.cabSecao}>
        <div>
          <span className="rotulo-secao" data-coluna="">
            Notícias
          </span>
          <h2 id="outras-titulo" className={home.titulo}>
            Outras notícias
          </h2>
        </div>
        <Link className="botao-linha" href="/noticias">
          Ver todas as notícias <Icone nome="setaDiagonal" tamanho={16} />
        </Link>
      </div>
      <GradeDeNoticias noticias={noticias} arranjo={TRES_POR_LINHA} />
    </section>
  );
}
```

`styles.outras` existe só no celular (o recuo da grade para a coluna do texto, Task 3); no computador, a classe não tem regra, e o bloco fica na caixa da página.

- [ ] **Step 6: A página**

Reescreva `app/(site)/noticias/[slug]/page.tsx` (LF; leia antes) inteiro:

```tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import paginas from "@/app/(site)/encontre.module.css";
import { AutorDaNoticia } from "@/components/editorial/AutorDaNoticia";
import { CapaDaNoticia } from "@/components/editorial/CapaDaNoticia";
import { FaixaDaNoticia } from "@/components/editorial/FaixaDaNoticia";
import { FaixaDoTexto } from "@/components/editorial/FaixaDoTexto";
import { OutrasNoticias } from "@/components/editorial/OutrasNoticias";
import { JsonLd } from "@/components/seo/JsonLd";
import { LIMITE_DE_OUTRAS, capaDaNoticia, outrasNoticias } from "@/lib/noticias";
import { listarNoticias, noticiaPorSlug, slugsDeNoticias } from "@/lib/sanity/consultas";
import { newsArticle } from "@/lib/seo/jsonld";
import { tituloDePagina } from "@/lib/seo/metadados";

export const revalidate = 3600;

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const slugs = await slugsDeNoticias();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const n = await noticiaPorSlug(slug);
  if (!n) return {};

  return {
    title: tituloDePagina(n.titulo),
    description: n.resumo,
    alternates: { canonical: `/noticias/${slug}` },
  };
}

/*
  A notícia aberta, como no desenho aprovado
  (docs/desenho-aprovado/noticias-contato/noticia.html):
  - a faixa verde, com "← NOTÍCIAS", o título, o resumo e a assinatura
    (components/editorial/FaixaDaNoticia.tsx);
  - a capa em 16:9, recortada pelo ponto de interesse; sem capa, ou com a
    referência quebrada, o bloco não existe;
  - o texto numa faixa branca, na coluna de leitura das páginas de texto
    (components/editorial/FaixaDoTexto.tsx), com "Atualizado em" quando a
    notícia foi revisada, o índice "Nesta página" com dois títulos de seção
    ou mais, e, no fim, quem assina e o aviso de saúde;
  - "Outras notícias": as três mais recentes que não são esta; sem
    nenhuma, o bloco não existe, e o texto fecha a página.

  Sem notícia publicada no endereço, página não encontrada.

  O JSON-LD é só o `NewsArticle` (lib/seo/jsonld.ts), como antes. Sem
  trilha e sem BreadcrumbList: dado estruturado sem o equivalente visível é
  marcação enganosa. Os blocos são filhos diretos de `.pagina`
  (app/(site)/encontre.module.css), a --ritmo um do outro; quando o texto
  fecha a página, o rodapé emenda nele.
*/
export default async function PaginaNoticia({ params }: Props) {
  const { slug } = await params;
  /* Uma a mais que as de "Outras notícias": a aberta pode estar entre as
     mais recentes. */
  const [n, recentes] = await Promise.all([noticiaPorSlug(slug), listarNoticias(LIMITE_DE_OUTRAS + 1)]);
  if (!n) notFound();

  const capa = capaDaNoticia(n.capa);
  const outras = outrasNoticias(recentes, n.slug);

  return (
    <>
      <JsonLd dados={newsArticle(n, SITE)} />

      <div className={paginas.pagina}>
        <FaixaDaNoticia noticia={n} />
        {capa ? <CapaDaNoticia capa={capa} /> : null}
        <FaixaDoTexto rotulo="Texto da notícia" atualizadoEm={n.atualizadoEm} corpo={n.corpo}>
          <AutorDaNoticia autor={n.autor} />
        </FaixaDoTexto>
        {outras.length > 0 ? <OutrasNoticias noticias={outras} /> : null}
      </div>
    </>
  );
}
```

- [ ] **Step 7: O `TextoRico` e a `LinhaNoticia` saem, e os comentários que falavam deles**

Com a página reescrita, nenhum dos dois tem mais quem o use: a lista deixou a `LinhaNoticia` na Task 3, e a notícia deixa o `TextoRico` agora.

1. `grep -rn "TextoRico\|LinhaNoticia" app components lib testes scripts sanity`. Expected: só os dois arquivos e os comentários de `components/editorial/UltimasNoticias.tsx` (dois), `components/home/Carrossel.tsx` (um, com os dois nomes), `lib/sanity/banners.ts`, `lib/sanity/link.ts`, `testes/banners.test.ts` e `testes/sanity-schemas.test.ts`. Se aparecer um import em outro lugar, pare e pergunte.
2. Apague `components/editorial/TextoRico.tsx` e `components/editorial/LinhaNoticia.tsx`.
3. Em `components/editorial/UltimasNoticias.tsx` (CRLF):
   - troque a linha

```
/* Larguras pedidas ao CDN do Sanity para o `srcset`, como em LinhaNoticia.
```

     por

```
/* Larguras pedidas ao CDN do Sanity para o `srcset`.
```

   - troque as três linhas

```
  `<img src="">` faria o navegador pedir a página de novo (ver
  LinhaNoticia). Sem URL, a notícia cai no mesmo desenho de quem não tem
  capa.
```

     por

```
  `<img src="">` faria o navegador pedir a página de novo (endereço vazio
  é "esta mesma página"). Sem URL, a notícia cai no mesmo desenho de quem
  não tem capa.
```

4. Em `components/home/Carrossel.tsx` (CRLF), troque a linha

```
  components/editorial/LinhaNoticia.tsx e TextoRico.tsx).
```

   por

```
  components/editorial/FotoDaNoticia.tsx e CorpoDoTexto.tsx).
```

5. Em `lib/sanity/banners.ts` (CRLF), troque a linha

```
  `components/editorial/TextoRico.tsx`: sem URL não há o que desenhar, e o
```

por

```
  `components/editorial/CorpoDoTexto.tsx` com a imagem do texto: sem URL
  não há o que desenhar, e o
```

6. Em `lib/sanity/link.ts` (CRLF), troque a linha

```
  Vive em `lib/` e não dentro de `TextoRico.tsx` pelo mesmo motivo que
```

por

```
  Vive em `lib/` e não dentro de `CorpoDoTexto.tsx` pelo mesmo motivo que
```

7. Em `testes/banners.test.ts` (CRLF), troque a linha

```
      pode receber `<img src="">` - mesmo padrao de TextoRico.tsx, que
```

por

```
      pode receber `<img src="">` - mesmo padrao de CorpoDoTexto.tsx, que
```

8. Em `testes/sanity-schemas.test.ts` (LF), troque a linha

```
     institucional, e o ramo de link interno de TextoRico fica inalcançável. */
```

por

```
     institucional, e o ramo de link interno de CorpoDoTexto fica inalcançável. */
```

9. Em `testes/paleta.test.ts` (LF), troque as três linhas

```
  aplicada em componente nenhum hoje. O efeito de casca dupla foi refeito
  à mão com `bg-surface p-2` em `app/(site)/page.tsx` e em
  `app/(site)/noticias/[slug]/page.tsx`. O token entra nesta lista porque a
```

por

```
  aplicada em componente nenhum hoje, e a casca dupla feita à mão com
  `bg-surface p-2`, em volta da capa e da imagem da notícia, saiu com o
  desenho novo, que não põe moldura em foto. O token entra nesta lista porque a
```

10. `grep -rn "TextoRico\|LinhaNoticia\|bg-surface p-2" app components lib testes scripts sanity`. Não pode sobrar nada.

- [ ] **Step 8: Rodar, provar por mutação, conferir, commit**

Run: `npx vitest run` · `npx tsc --noEmit` · `npm run build` → verde. `testes/jsonld.test.ts` continua verde sem mudança: o `NewsArticle` não mudou.

Mutações, uma de cada vez, regravando o original depois:

1. Na faixa da notícia, troque `assinatura.perfil ? (…) : …` por sempre o texto, sem link.
2. Na faixa da notícia, passe `icone="jornal"` para a `FaixaCurta`.
3. Na página, troque `outrasNoticias(recentes, n.slug)` por `outrasNoticias(recentes, "")`.
4. Na página, troque `outras.length > 0 ?` por `true ?`.
5. Na página, troque `rotulo="Texto da notícia"` por `rotulo="Texto da página"`.
6. Na página, troque `listarNoticias(LIMITE_DE_OUTRAS + 1)` por `listarNoticias(LIMITE_DE_OUTRAS)`.
7. No fim da notícia, troque `assinatura.perfil ? (…) : null` por sempre o botão, com `href={assinatura.perfil ?? "/"}`.
8. Na capa, troque `sizes={SIZES_DA_CAPA}` por `sizes="100vw"`.
9. No CSS da notícia, troque `.materia[data-faixa][data-abertura]` por `.materia`.
10. No CSS do fim da notícia, troque `.coluna .avisoSaude {` por `.avisoSaude {` na regra de fora do `@media`.

Conferência rápida no navegador: não há notícia publicada, e o endereço de uma notícia dá 404 (`npm run build`, `npx next start -p 3300`, no Git Bash, `curl -s -o /dev/null -w "%{http_code}" http://localhost:3300/noticias/qualquer-coisa` → `404`). O desenho da notícia aberta é provado pelos testes deste passo e pelo CSS transcrito; a Task 7 registra isso. Derrube o 3300 pelo PID.

```bash
git add components/editorial/FaixaDaNoticia.tsx components/editorial/CapaDaNoticia.tsx components/editorial/AutorDaNoticia.tsx components/editorial/OutrasNoticias.tsx components/editorial/NoticiaAberta.module.css components/editorial/PaginaDeTexto.module.css "app/(site)/noticias/[slug]/page.tsx" components/editorial/TextoRico.tsx components/editorial/LinhaNoticia.tsx components/editorial/UltimasNoticias.tsx components/home/Carrossel.tsx lib/sanity/banners.ts lib/sanity/link.ts testes/banners.test.ts testes/sanity-schemas.test.ts testes/paleta.test.ts testes/noticia-aberta.test.ts
git commit -m "Noticia aberta: faixa verde com a assinatura, capa 16:9 pelo ponto de interesse, texto na coluna de leitura com indice, autor no fim e outras noticias; sem Cabeceira nem BreadcrumbList, e o TextoRico e a LinhaNoticia saem"
```

---
### Task 5: O contato `/contato`

**Files:**
- Create: `components/contato/CanaisDeContato.tsx`, `components/contato/SedeDaAmi.tsx`, `components/contato/Contato.module.css`
- Modify: `app/(site)/contato/page.tsx` (reescrita; CRLF)
- Create: `testes/contato-na-tela.test.ts`

**Interfaces:**
- Consumes:
  - `Canal`, `canaisDeContato` (`lib/paginaDeContato.ts`) e os ícones `"instagram"` e `"horario"` (Task 1);
  - `FaixaCurta` com `rotulo` (Task 2);
  - do plano de A Associação: `SIZES_DA_SEDE` (`components/associacao/QuemSomos.tsx`), as classes `corpo`, `semFoto`, `sede`, `sedeTitulo`, `endereco`, `acoes` de `QuemSomos.module.css`, as classes `faixa`, `duplo`, `comFoto`, `corpo`, `titulo`, `foto`, `fotografia` de `components/home/SejaAssociado.module.css`, e `linkDoMapaDaAmi` (`lib/ami.ts`);
  - `AMI`, `ESPACOS.sede` (`lib/imagens.ts`), `desenhoDaFotografia` (`lib/molduras.ts`), `Fotografia`, `LadrilhoIcone`, `Icone`, `DADOS_DEMONSTRACAO`.
- Produces:

```ts
// components/contato/CanaisDeContato.tsx
export function CanaisDeContato(props: { canais: Canal[] }): JSX.Element; // <section data-bloco="canais" …>
// components/contato/SedeDaAmi.tsx
export function SedeDaAmi(props: { demonstracao: boolean }): JSX.Element; // <section data-bloco="sede" data-faixa …>, com o fecho
// components/contato/Contato.module.css: canais, canal, rotulo, dado, longo, nota, acao,
//   sedeDoContato, corpo, texto, cnpj, acoes, horario, falta, separa, fecho
```

- Marcas: `data-canal`, `data-rotulo`, `data-dado` e `data-acao` nos canais (a Task 7 os mede); `data-a-entrar="horário de atendimento"` no horário; `data-sem-foto` no corpo da sede quando não há foto.

**A sede é o "Quem somos" de A Associação.** O desenho diz "o bloco de `associacao.html`": a mesma faixa branca, o texto ao lado da foto da sede e o mesmo quadro do endereço. O contato reaproveita as duas folhas de lá e o `SIZES_DA_SEDE`, e acrescenta numa folha própria só o que é dele: a frase, o CNPJ, o horário, o título preso no alto quando não há foto, o fio e o fecho. O `QuemSomos` não muda.

- [ ] **Step 1: Os testes**

`testes/contato-na-tela.test.ts`:

```ts
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Icon } from "@phosphor-icons/react";
import {
  ArrowRight,
  ArrowUpRight,
  ChatsCircle,
  Clock,
  DeviceMobile,
  Handshake,
  InstagramLogo,
  MapPin,
  Phone,
} from "@phosphor-icons/react/dist/ssr";
import estilosPagina from "@/app/(site)/encontre.module.css";
import { SIZES_DA_SEDE } from "@/components/associacao/QuemSomos";
import estilosQuem from "@/components/associacao/QuemSomos.module.css";
import { CanaisDeContato } from "@/components/contato/CanaisDeContato";
import estilos from "@/components/contato/Contato.module.css";
import { SedeDaAmi } from "@/components/contato/SedeDaAmi";
import estilosAssocie from "@/components/home/SejaAssociado.module.css";
import { linkDoMapaDaAmi } from "@/lib/ami";
import { canaisDeContato } from "@/lib/paginaDeContato";
import { tituloDePagina } from "@/lib/seo/metadados";
import { fonte } from "@/testes/apoio";
import { base, bloco, regra, semNotas } from "@/testes/css";

/*
  O contato (/contato): os três canais, a sede com o fecho e a página de
  verdade, nas duas chaves de demonstração. Os dados são os de lib/ami.ts.

  A foto da sede é trocada por um dublê que mostra o que recebeu, como em
  testes/associacao-topo.test.ts: o desenho da moldura "Fotografia a
  entrar" já é testado em testes/molduras.test.ts, e aqui interessa o que a
  sede pede a ela.

  A chave de demonstração é lida quando lib/demonstracao.ts é importado:
  cada caso da página troca a chave e importa a página de novo. A página
  é síncrona, como testes/caminhos-de-filiacao.test.ts espera.
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

afterEach(() => {
  vi.unstubAllEnvs();
});

const desenho = (Componente: Icon, size: number, weight: "duotone" | "regular") =>
  renderToString(createElement(Componente, { size, weight, className: "", "aria-hidden": "true" }));

/** O texto que aparece, sem tags, num espaço só. */
const tela = (html: string) =>
  html
    .replace(/<!-- -->/g, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

/** O `&` como o HTML o escreve dentro de um atributo. */
const atributo = (texto: string) => texto.replaceAll("&", "&amp;");

const LADRILHO_PEQUENO = '<span class="ladrilho-icone ladrilho-icone--pequeno" aria-hidden="true">';

describe("os canais", () => {
  const html = renderToString(createElement(CanaisDeContato, { canais: canaisDeContato() }));
  const canais = [...html.matchAll(/<li class="[^"]*" data-canal="">[\s\S]*?<\/li>/g)].map((m) => m[0]);
  const botao = (canal: string) => /<a [^>]*>[\s\S]*?<\/a>/.exec(canal)![0];

  it("um bloco na caixa da página, com o título para quem navega por cabeçalhos, e três cartões", () => {
    expect(html).toMatch(
      new RegExp(
        `^<section data-bloco="canais" aria-labelledby="canais-titulo"><h2 id="canais-titulo" class="sr-only">Canais de contato</h2><ul class="${estilos.canais}" role="list">`,
      ),
    );
    expect(canais).toHaveLength(3);
  });

  it("o telefone da sede: o ladrilho, o rótulo, o número, a frase e Ligar", () => {
    expect(canais[0]).toContain(
      `<li class="${estilos.canal}" data-canal=""><span class="ladrilho-icone" aria-hidden="true">${desenho(Phone, 28, "duotone")}</span>` +
        `<p class="${estilos.rotulo}" data-rotulo="">Telefone da sede</p>` +
        `<p class="${estilos.dado}" data-dado="">(99) 3524-3716</p>` +
        `<p class="${estilos.nota}">Linha fixa, na sede da AMI.</p><div class="${estilos.acao}" data-acao="">`,
    );
    const a = botao(canais[0]);
    expect(a).toContain('class="botao"');
    expect(a).toContain('href="tel:+559935243716"');
    expect(a).toContain('aria-label="Ligar para a sede da AMI, (99) 3524-3716"');
    expect(a).toContain(desenho(Phone, 20, "regular"));
    expect(tela(a)).toBe("Ligar");
  });

  it("o celular, com o celular no ladrilho", () => {
    expect(canais[1]).toContain(desenho(DeviceMobile, 28, "duotone"));
    expect(canais[1]).toContain(`<p class="${estilos.dado}" data-dado="">(99) 98802-0205</p>`);
    const a = botao(canais[1]);
    expect(a).toContain('href="tel:+5599988020205"');
    expect(a).toContain('aria-label="Ligar para o celular da AMI, (99) 98802-0205"');
  });

  it("o Instagram: o perfil em letra menor, e Abrir o Instagram na mesma aba", () => {
    expect(canais[2]).toContain(desenho(InstagramLogo, 28, "duotone"));
    expect(canais[2]).toContain(
      `<p class="${estilos.dado} ${estilos.longo}" data-dado="">@associacaomedicadeimperatriz</p>`,
    );
    const a = botao(canais[2]);
    expect(a).toContain('class="botao-contorno"');
    expect(a).toContain('href="https://www.instagram.com/associacaomedicadeimperatriz/"');
    expect(a).toContain('aria-label="Abrir o Instagram da AMI"');
    expect(a).toContain(desenho(ArrowUpRight, 20, "regular"));
    expect(a).not.toContain("target=");
    expect(tela(a)).toBe("Abrir o Instagram");
  });

  it("sem e-mail, sem WhatsApp e sem formulário", () => {
    expect(html).not.toMatch(/mailto|whatsapp|wa\.me|<form/i);
  });
});

describe("a sede, na demonstração", () => {
  const html = renderToString(createElement(SedeDaAmi, { demonstracao: true }));

  it("faixa branca de ponta a ponta, que entra ao rolar, com o texto e a foto lado a lado", () => {
    expect(html).toMatch(
      new RegExp(
        `^<section data-bloco="sede" data-faixa="" aria-labelledby="sede-titulo" class="revelar ${estilosAssocie.faixa} ${estilos.sedeDoContato}">` +
          `<div class="${estilosAssocie.duplo} ${estilosAssocie.comFoto}"><div class="${estilosAssocie.corpo} ${estilosQuem.corpo} ${estilos.corpo}">`,
      ),
    );
  });

  it("SEDE na coluna do texto, Onde fica a AMI e a frase", () => {
    expect(html).toContain(
      `<span class="rotulo-secao" data-coluna="">Sede</span>` +
        `<h2 id="sede-titulo" class="${estilosAssocie.titulo}">Onde fica a AMI</h2>` +
        `<p class="${estilos.texto}">No Centro de Imperatriz, na Rua Coriolano Milhomem.</p>`,
    );
  });

  it("o quadro do endereço: o pino, o nome, o endereço em três linhas e o CNPJ", () => {
    expect(html).toContain(
      `<div class="${estilosQuem.sede}">${LADRILHO_PEQUENO}${desenho(MapPin, 23, "duotone")}</span>` +
        `<div><h3 class="${estilosQuem.sedeTitulo}">Associação Médica de Imperatriz</h3>` +
        `<address class="${estilosQuem.endereco}">Rua Coriolano Milhomem, 39<br/>Centro, Imperatriz – MA<br/>CEP 65900-330</address>` +
        `<p class="${estilos.cnpj}">CNPJ 06.651.376/0001-42</p></div>`,
    );
  });

  it("Como chegar abre o Google Maps em nova aba, e avisa o leitor de tela", () => {
    expect(html).toContain(`<div class="${estilosQuem.acoes} ${estilos.acoes}"><a class="botao" `);
    const a = /<a class="botao" [^>]*>[\s\S]*?<\/a>/.exec(html)![0];
    expect(a).toContain(`href="${atributo(linkDoMapaDaAmi())}"`);
    expect(a).toContain('target="_blank"');
    expect(a).toContain('rel="noopener noreferrer"');
    expect(a).toContain(desenho(ArrowUpRight, 20, "regular"));
    expect(a).toContain('<span class="sr-only"> (abre o Google Maps em nova aba)</span>');
    expect(tela(a)).toBe("Como chegar (abre o Google Maps em nova aba)");
  });

  it("o horário como moldura: o relógio, o título e a frase a entrar", () => {
    expect(html).toContain(
      `<div class="${estilosQuem.sede} ${estilos.horario}" data-a-entrar="horário de atendimento">` +
        `${LADRILHO_PEQUENO}${desenho(Clock, 23, "duotone")}</span>` +
        `<div><h3 class="${estilosQuem.sedeTitulo}">Horário de atendimento</h3>` +
        `<p class="${estilos.falta}">Horário de atendimento da sede a entrar.</p></div></div>`,
    );
  });

  it("à direita, a foto da sede, com a largura desenhada de Quem somos", () => {
    expect(html).toContain(
      `<div class="${estilosAssocie.foto}"><span data-fotografia="sede" data-sizes="${SIZES_DA_SEDE}" data-demonstracao="true" class="${estilosAssocie.fotografia}"></span></div>`,
    );
  });

  it("depois do fio, o fecho: Médico interessado em se associar? e Seja associado", () => {
    expect(html).toContain(
      `<div class="${estilos.separa}" aria-hidden="true"></div>` +
        `<div class="${estilos.fecho}" data-coluna="">${LADRILHO_PEQUENO}${desenho(Handshake, 23, "duotone")}</span>` +
        `<p><strong>Médico interessado em se associar?</strong> A página Seja associado diz quem pode se associar e como fazer isso.</p>` +
        `<a class="botao-contorno" href="/associacao/seja-associado">Seja associado ${desenho(ArrowRight, 20, "regular")}</a></div></section>`,
    );
  });
});

describe("a sede, fora da demonstração", () => {
  const html = renderToString(createElement(SedeDaAmi, { demonstracao: false }));

  it("sem a foto: duas colunas de texto, com o título preso no alto", () => {
    expect(html).toContain(
      `<div class="${estilosAssocie.duplo}"><div class="${estilosAssocie.corpo} ${estilosQuem.corpo} ${estilosQuem.semFoto} ${estilos.corpo}" data-sem-foto="">`,
    );
    expect(html).not.toContain("data-fotografia");
  });

  it("sem nenhuma moldura: nem o horário", () => {
    expect(html).not.toContain("data-a-entrar");
    expect(html).not.toContain("a entrar");
    expect(html).not.toContain("Horário");
  });

  it("o endereço, o CNPJ, Como chegar e o fecho ficam", () => {
    expect(html).toContain("Rua Coriolano Milhomem, 39");
    expect(html).toContain("CNPJ 06.651.376/0001-42");
    expect(html).toContain('target="_blank"');
    expect(html).toContain('href="/associacao/seja-associado"');
  });
});

async function pagina(chave: string) {
  vi.stubEnv("NEXT_PUBLIC_DADOS_DEMONSTRACAO", chave);
  vi.resetModules();
  const modulo = await import("@/app/(site)/contato/page");
  return { html: renderToString(modulo.default()), modulo };
}

const blocos = (html: string) => [...html.matchAll(/data-bloco="([^"]+)"/g)].map((m) => m[1]);

describe("a página /contato", () => {
  it("a faixa curta, os canais e a sede, no invólucro de coluna e ritmo, nas duas chaves", async () => {
    for (const chave of ["true", "false"]) {
      const { html } = await pagina(chave);
      expect(html, chave).toMatch(new RegExp(`^<div class="${estilosPagina.pagina}"><section data-bloco="topo"`));
      expect(blocos(html), chave).toEqual(["topo", "canais", "sede"]);
      expect(html.match(/<h1\b/g), chave).toHaveLength(1);
    }
  });

  it("a faixa: CONTATO, Fale com a AMI, a frase e a conversa no ladrilho", async () => {
    const { html } = await pagina("true");
    expect(html).toContain('data-coluna="">Contato</span>');
    expect(html).toContain(">Fale com a AMI</h1>");
    expect(html).toContain(">Pelo telefone, pelo Instagram ou na sede, no Centro de Imperatriz.</p>");
    expect(html).toContain(desenho(ChatsCircle, 84, "duotone"));
  });

  it("a sede fecha a página e é faixa: o rodapé emenda nela", async () => {
    for (const chave of ["true", "false"]) {
      expect((await pagina(chave)).html, chave).toMatch(/<section data-bloco="sede" data-faixa=""[\s\S]*<\/section><\/div>$/);
    }
  });

  it("o horário e a foto só na demonstração", async () => {
    const demo = (await pagina("true")).html;
    expect(demo).toContain('data-a-entrar="horário de atendimento"');
    expect(demo).toContain('data-fotografia="sede"');
    const fora = (await pagina("false")).html;
    expect(fora).not.toContain("data-a-entrar");
    expect(fora).not.toContain("data-fotografia");
  });

  it("sem JSON-LD, Cabeceira, trilha, BreadcrumbList ou PROVISÓRIO", async () => {
    for (const chave of ["true", "false"]) {
      const { html } = await pagina(chave);
      expect(html, chave).not.toContain("application/ld+json");
      expect(html, chave).not.toContain("Trilha de navegação");
      expect(html, chave).not.toContain("-mt-32");
      expect(html, chave).not.toContain("BreadcrumbList");
      expect(html, chave).not.toContain("PROVISÓRIO");
    }
  });

  it("os metadados continuam os de antes", async () => {
    const { modulo } = await pagina("true");
    const m = await modulo.generateMetadata();
    expect(m.title).toBe(tituloDePagina("Fale com a AMI"));
    expect(m.description).toBe("Endereço, telefone e Instagram da Associação Médica de Imperatriz.");
    expect(m.alternates).toEqual({ canonical: "/contato" });
  });
});

describe("o CSS do contato", () => {
  const css = semNotas(fonte("../components/contato/Contato.module.css"));
  const tablet = () => bloco(css, "@media (min-width: 701px) and (max-width: 980px)");
  const cel = () => bloco(css, "@media (max-width: 700px)");

  it("três cartões brancos lado a lado, com o botão no pé", () => {
    expect(regra(base(css), ".canais")).toMatch(/grid-template-columns: repeat\(3, minmax\(0, 1fr\)\);/);
    expect(regra(base(css), ".canal")).toMatch(/background: var\(--color-surface\);/);
    expect(regra(base(css), ".canal")).toMatch(/border-radius: 18px;/);
    expect(regra(base(css), ".acao")).toMatch(/margin-top: auto;/);
  });

  it("o número grande na letra dos títulos, sem quebrar; o perfil do Instagram menor, e pode quebrar", () => {
    const dado = regra(base(css), ".dado");
    expect(dado).toMatch(/font-family: var\(--font-titulo\);/);
    expect(dado).toMatch(/font-size: 32px;/);
    expect(dado).toMatch(/white-space: nowrap;/);
    const longo = regra(base(css), ".dado.longo");
    expect(longo).toMatch(/font-size: 20px;/);
    expect(longo).toMatch(/white-space: normal;/);
    expect(longo).toMatch(/overflow-wrap: anywhere;/);
  });

  it("no tablet, cada canal vira uma linha, com o botão à direita", () => {
    expect(regra(tablet(), ".canais")).toMatch(/grid-template-columns: 1fr;/);
    expect(regra(tablet(), ".canal")).toMatch(/grid-template-columns: 52px minmax\(0, 1fr\) auto;/);
    expect(regra(tablet(), ".acao")).toMatch(/grid-column: 3;/);
  });

  it("no celular, o botão na largura toda embaixo, sem a frase de apoio", () => {
    expect(regra(cel(), ".acao")).toMatch(/grid-column: 1 \/ -1;/);
    expect(regra(cel(), ".acao > a")).toMatch(/width: 100%;/);
    expect(regra(cel(), ".nota")).toMatch(/display: none;/);
  });

  it("sem a foto, o título fica no alto, valendo sobre a regra de Quem somos", () => {
    const r = regra(base(css), ".sedeDoContato .corpo[data-sem-foto]");
    expect(r).toMatch(/grid-template-rows: auto auto 1fr;/);
    expect(r).toMatch(/align-items: start;/);
  });

  it("o horário a entrar: cinza e em itálico", () => {
    const r = regra(base(css), ".falta");
    expect(r).toMatch(/color: var\(--color-ink-400\);/);
    expect(r).toMatch(/font-style: italic;/);
  });

  it("o fio antes do fecho: 72px, 48px do tablet para baixo", () => {
    expect(regra(base(css), ".separa")).toMatch(/margin: 72px 0;/);
    expect(regra(bloco(css, "@media (max-width: 980px)"), ".separa")).toMatch(/margin: 48px 0;/);
  });

  it("no celular, o fecho: o botão na largura toda embaixo", () => {
    expect(regra(cel(), ".fecho > a")).toMatch(/grid-column: 1 \/ -1;/);
    expect(regra(cel(), ".fecho > a")).toMatch(/width: 100%;/);
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run testes/contato-na-tela.test.ts`
Expected: FAIL. Os componentes e a folha não existem, e a página é a antiga, com `Cabeceira` e `BreadcrumbList`.

- [ ] **Step 3: O CSS do contato**

`components/contato/Contato.module.css`:

```css
/*
  O contato, transcrito do desenho aprovado
  (docs/desenho-aprovado/noticias-contato/contato.html: `.grade-canais`,
  `.canal` e o que vem dentro dele, `.contato-sede` e as regras dela,
  `.sede .cnpj`, `.sede + .sede`, `.sede-horario .falta`, `.separa`,
  `.nota-associar` e o que vem dentro dele, e os @media de 980, 701 a 980
  e 700px).

  Os canais: três cartões brancos, com o ladrilho global (52px), o rótulo
  verde, o dado em letra grande e o botão no pé (`margin-top: auto`), na
  mesma linha nos três. No tablet, cada canal vira uma linha com o botão à
  direita: em três colunas o número do celular não cabia, e em duas o
  Instagram ficava sozinho. No celular, uma linha com o botão na largura
  toda embaixo, sem a frase de apoio.

  Uma diferença do desenho, de propósito: o desenho quebra o perfil do
  Instagram num ponto fixo (`<wbr>`); aqui o perfil vem do endereço
  (lib/paginaDeContato.ts), e a quebra, quando a largura pede, é a do
  navegador (`overflow-wrap: anywhere`).

  A sede é o "Quem somos" de A Associação (SejaAssociado.module.css e
  QuemSomos.module.css); daqui são só a frase, o CNPJ, o horário, o título
  preso no alto quando não há foto, o fio e o fecho. As regras que valem
  sobre as de lá levam a classe da faixa na frente (`.sedeDoContato …`), e
  a do corpo sem foto, também o atributo (`[data-sem-foto]`): pesam mais
  qualquer que seja a ordem em que as folhas chegam ao navegador.
*/

.canais {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--gap);
}

.canal {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  min-width: 0;
  padding: 28px;
  border-radius: 18px;
  background: var(--color-surface);
  box-shadow: var(--shadow-erguido);
}

.rotulo {
  margin-top: 28px;
  font-size: 12px;
  font-weight: 700;
  line-height: 1.3;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--color-ami-green-600);
}

.dado {
  margin-top: 10px;
  font-family: var(--font-titulo);
  font-weight: 500;
  letter-spacing: -0.03em;
  font-size: 32px;
  line-height: 1.1;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
  color: var(--color-ami-green-800);
}

.dado.longo {
  font-size: 20px;
  line-height: 1.3;
  letter-spacing: -0.02em;
  white-space: normal;
  overflow-wrap: anywhere;
}

.nota {
  margin-top: 8px;
  font-size: 14.5px;
  line-height: 1.55;
  color: var(--color-ink-600);
}

.acao {
  margin-top: auto;
  padding-top: 28px;
}

.sedeDoContato .texto {
  max-width: 30em;
  margin-top: 16px;
  color: var(--color-ink-600);
}

.sedeDoContato .corpo[data-sem-foto] {
  grid-template-rows: auto auto 1fr;
  align-items: start;
}

.cnpj {
  margin-top: 6px;
  font-size: 13.5px;
  font-variant-numeric: tabular-nums;
  color: var(--color-ink-400);
}

.sedeDoContato .horario {
  margin-top: 28px;
}

.falta {
  margin-top: 4px;
  font-size: 15.5px;
  line-height: 1.6;
  font-style: italic;
  color: var(--color-ink-400);
}

.separa {
  height: 1px;
  margin: 72px 0;
  background: var(--color-line);
}

.fecho {
  display: grid;
  grid-template-columns: 44px minmax(0, 1fr) auto;
  column-gap: 16px;
  align-items: center;
}

.fecho p {
  max-width: 44em;
  color: var(--color-ink-600);
}

.fecho strong {
  display: block;
  font-weight: 700;
  color: var(--color-ami-green-800);
}

@media (max-width: 980px) {
  .separa {
    margin: 48px 0;
  }
}

@media (min-width: 701px) and (max-width: 980px) {
  .canais {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .canal {
    display: grid;
    grid-template-columns: 52px minmax(0, 1fr) auto;
    column-gap: 20px;
    align-items: center;
    padding: 20px 24px;
  }

  .canal :global(.ladrilho-icone) {
    grid-row: 1 / 4;
  }

  .rotulo {
    grid-column: 2;
    margin: 0;
  }

  .dado {
    grid-column: 2;
    margin-top: 4px;
    font-size: 26px;
  }

  .nota {
    grid-column: 2;
    margin-top: 2px;
  }

  .acao {
    grid-column: 3;
    grid-row: 1 / 4;
    margin: 0;
    padding: 0;
  }
}

@media (max-width: 700px) {
  .canais {
    grid-template-columns: 1fr;
    gap: 10px;
  }

  .canal {
    display: grid;
    grid-template-columns: 40px minmax(0, 1fr);
    column-gap: 14px;
    align-items: center;
    padding: 16px 16px 16px var(--m);
    border-radius: 16px;
  }

  .canal :global(.ladrilho-icone) {
    grid-row: 1 / 3;
    width: 40px;
    height: 40px;
    border-radius: 12px;
  }

  .canal :global(.ladrilho-icone) svg {
    width: 21px;
    height: 21px;
  }

  .rotulo {
    grid-column: 2;
    margin: 0;
    font-size: 10.5px;
    letter-spacing: 0.12em;
  }

  .dado {
    grid-column: 2;
    margin-top: 2px;
    font-size: 22px;
  }

  .dado.longo {
    font-family: var(--font-corpo);
    font-weight: 600;
    font-size: 15px;
    line-height: 1.3;
    letter-spacing: -0.01em;
  }

  .nota {
    display: none;
  }

  .acao {
    grid-column: 1 / -1;
    padding-top: 14px;
  }

  .acao > a {
    width: 100%;
    height: 46px;
    font-size: 14px;
  }

  .sedeDoContato .texto {
    margin-top: 12px;
  }

  .sedeDoContato .acoes {
    grid-template-columns: 1fr;
  }

  .sedeDoContato .horario {
    margin-top: 22px;
  }

  .fecho {
    grid-template-columns: 40px minmax(0, 1fr);
    column-gap: 14px;
    align-items: start;
  }

  .fecho :global(.ladrilho-icone) {
    width: 40px;
    height: 40px;
    border-radius: 12px;
  }

  .fecho :global(.ladrilho-icone) svg {
    width: 21px;
    height: 21px;
  }

  .fecho p {
    font-size: 15px;
  }

  .fecho > a {
    grid-column: 1 / -1;
    width: 100%;
    height: 46px;
    margin-top: 16px;
    font-size: 14px;
  }
}
```

`.dado.longo` (duas classes) vale sobre o `.dado` do tablet (26px): o perfil fica em 20px, como no desenho. No celular, `.sedeDoContato .acoes` deixa "Como chegar" sozinho na largura toda (em "Quem somos" eram dois botões lado a lado).

- [ ] **Step 4: Os canais**

`components/contato/CanaisDeContato.tsx`:

```tsx
import { Icone, LadrilhoIcone } from "@/components/base/IconeServidor";
import styles from "@/components/contato/Contato.module.css";
import type { Canal } from "@/lib/paginaDeContato";

/*
  Os canais de contato, em três cartões brancos: o ladrilho, o rótulo, o
  dado em letra grande, uma linha de apoio e o botão no pé, alinhado entre
  os três (Contato.module.css). Quem diz quais são os canais é
  `canaisDeContato` (lib/paginaDeContato.ts).

  "Ligar" é o botão verde, com o telefone; "Abrir o Instagram", o de
  contorno, na mesma aba, como todo link para fora do site (a regra do
  texto rico, components/editorial/CorpoDoTexto.tsx: aba nova sem avisar
  tira do leitor o botão voltar). O nome de cada botão para o leitor de
  tela diz para onde ele liga.

  Marcas para a auditoria visual (scripts/auditoria-visual.js, conferência
  18): `data-canal`, `data-rotulo`, `data-dado` e `data-acao`.
*/
export function CanaisDeContato({ canais }: { canais: Canal[] }) {
  return (
    <section data-bloco="canais" aria-labelledby="canais-titulo">
      <h2 id="canais-titulo" className="sr-only">
        Canais de contato
      </h2>
      <ul className={styles.canais} role="list">
        {canais.map((c) => (
          <li key={c.chave} className={styles.canal} data-canal="">
            <LadrilhoIcone nome={c.icone} />
            <p className={styles.rotulo} data-rotulo="">
              {c.rotulo}
            </p>
            <p className={c.longo ? `${styles.dado} ${styles.longo}` : styles.dado} data-dado="">
              {c.dado}
            </p>
            <p className={styles.nota}>{c.nota}</p>
            <div className={styles.acao} data-acao="">
              {c.acao.tipo === "ligar" ? (
                <a className="botao" href={c.acao.href} aria-label={c.acao.rotulo}>
                  <Icone nome="telefone" /> {c.acao.texto}
                </a>
              ) : (
                <a className="botao-contorno" href={c.acao.href} aria-label={c.acao.rotulo}>
                  {c.acao.texto} <Icone nome="setaDiagonal" />
                </a>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
```

- [ ] **Step 5: A sede e o fecho**

`components/contato/SedeDaAmi.tsx`:

```tsx
import Link from "next/link";
import { SIZES_DA_SEDE } from "@/components/associacao/QuemSomos";
import quem from "@/components/associacao/QuemSomos.module.css";
import { Fotografia } from "@/components/base/Fotografia";
import { Icone, LadrilhoIcone } from "@/components/base/IconeServidor";
import styles from "@/components/contato/Contato.module.css";
import associe from "@/components/home/SejaAssociado.module.css";
import { AMI, linkDoMapaDaAmi } from "@/lib/ami";
import { ESPACOS } from "@/lib/imagens";
import { desenhoDaFotografia } from "@/lib/molduras";

/*
  A sede, numa faixa branca de ponta a ponta, que fecha o contato: o bloco
  "Quem somos" de A Associação (components/associacao/QuemSomos.tsx), com
  as folhas dele.
  - À esquerda: "SEDE", "Onde fica a AMI", a frase, o quadro do endereço
    (o nome, o endereço em três linhas, o CNPJ e "Como chegar") e, só no
    modo demonstração, o quadro do horário de atendimento, como moldura "a
    entrar": a AMI ainda não informou o horário, e não há onde guardá-lo.
  - À direita, a foto da sede (`ESPACOS.sede`, lib/imagens.ts), com a trava
    de sempre (`desenhoDaFotografia`): sem material, a moldura só na
    demonstração. Sem ela, o bloco vira duas colunas de texto, com o título
    preso no alto (`data-sem-foto`).
  - Depois de um fio, o fecho: "Médico interessado em se associar?", com o
    botão para Seja associado.

  "Como chegar" abre o Google Maps em aba nova, como a spec do contato
  pede, e diz isso a quem usa leitor de tela. `noopener` e `noreferrer`: a
  aba nova não alcança esta, nem recebe o endereço de onde veio. Sem mapa
  embutido: nada de terceiros na página.

  `data-faixa`: a sede fecha a página, e o rodapé emenda nela
  (components/layout/Rodape.module.css). Entra na tela com a `.revelar`.
*/
export function SedeDaAmi({ demonstracao }: { demonstracao: boolean }) {
  const temFoto = desenhoDaFotografia(ESPACOS.sede.provisoria, demonstracao) !== "nada";
  const e = AMI.endereco;

  return (
    <section
      data-bloco="sede"
      data-faixa=""
      aria-labelledby="sede-titulo"
      className={`revelar ${associe.faixa} ${styles.sedeDoContato}`}
    >
      <div className={`${associe.duplo}${temFoto ? ` ${associe.comFoto}` : ""}`}>
        <div
          className={`${associe.corpo} ${quem.corpo}${temFoto ? "" : ` ${quem.semFoto}`} ${styles.corpo}`}
          data-sem-foto={temFoto ? undefined : ""}
        >
          <span className="rotulo-secao" data-coluna="">
            Sede
          </span>
          <h2 id="sede-titulo" className={associe.titulo}>
            Onde fica a AMI
          </h2>
          <p className={styles.texto}>{`No ${e.bairro} de ${e.cidade}, na ${e.logradouro}.`}</p>

          <div className={quem.sede}>
            <LadrilhoIcone nome="comoChegar" pequeno />
            <div>
              <h3 className={quem.sedeTitulo}>{AMI.razaoSocial}</h3>
              <address className={quem.endereco}>
                {`${e.logradouro}, ${e.numero}`}
                <br />
                {`${e.bairro}, ${e.cidade} – ${e.uf}`}
                <br />
                {`CEP ${e.cep}`}
              </address>
              <p className={styles.cnpj}>{`CNPJ ${AMI.cnpj}`}</p>
            </div>
            <div className={`${quem.acoes} ${styles.acoes}`}>
              <a className="botao" href={linkDoMapaDaAmi()} target="_blank" rel="noopener noreferrer">
                Como chegar <Icone nome="setaDiagonal" />
                <span className="sr-only"> (abre o Google Maps em nova aba)</span>
              </a>
            </div>
          </div>

          {demonstracao ? (
            <div className={`${quem.sede} ${styles.horario}`} data-a-entrar="horário de atendimento">
              <LadrilhoIcone nome="horario" pequeno />
              <div>
                <h3 className={quem.sedeTitulo}>Horário de atendimento</h3>
                <p className={styles.falta}>Horário de atendimento da sede a entrar.</p>
              </div>
            </div>
          ) : null}
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

      <div className={styles.separa} aria-hidden="true"></div>

      <div className={styles.fecho} data-coluna="">
        <LadrilhoIcone nome="parceria" pequeno />
        <p>
          <strong>Médico interessado em se associar?</strong> A página Seja associado diz quem pode se
          associar e como fazer isso.
        </p>
        <Link className="botao-contorno" href="/associacao/seja-associado">
          Seja associado <Icone nome="seta" />
        </Link>
      </div>
    </section>
  );
}
```

O endereço em três linhas usa o travessão curto ("Imperatriz – MA"), como "Quem somos" e o desenho. Na linha do `<p>` do fecho, o JSX junta as duas linhas do texto num espaço só; o espaço depois do `</strong>` separa as duas frases para quem copia o texto (na tela, o `display: block` do `<strong>` já as separa).

- [ ] **Step 6: A página**

Reescreva `app/(site)/contato/page.tsx` (CRLF; leia antes) inteiro:

```tsx
import type { Metadata } from "next";
import paginas from "@/app/(site)/encontre.module.css";
import { CanaisDeContato } from "@/components/contato/CanaisDeContato";
import { SedeDaAmi } from "@/components/contato/SedeDaAmi";
import { FaixaCurta } from "@/components/layout/FaixaCurta";
import { AMI } from "@/lib/ami";
import { DADOS_DEMONSTRACAO } from "@/lib/demonstracao";
import { canaisDeContato } from "@/lib/paginaDeContato";
import { tituloDePagina } from "@/lib/seo/metadados";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: tituloDePagina("Fale com a AMI"),
    description:
      "Endereço, telefone e Instagram da Associação Médica de Imperatriz.",
    alternates: { canonical: "/contato" },
  };
}

/*
  O contato (item "Contato" do menu), como no desenho aprovado
  (docs/desenho-aprovado/noticias-contato/contato.html):
  - a faixa verde curta, com "CONTATO", "Fale com a AMI", a frase e a
    conversa no ladrilho;
  - os três canais: o telefone da sede, o celular e o Instagram;
  - a sede, numa faixa branca, com o endereço, o CNPJ, "Como chegar", a
    foto da sede e o horário (os dois como moldura, só na demonstração), e
    o fecho para quem quer se associar.

  Sem Sanity e sem rascunho: todo dado vem de lib/ami.ts, a mesma fonte do
  rodapé e do dado estruturado da home, para nome, endereço e telefone
  ficarem idênticos em todo lugar (o critério de negócio local do Google
  exige; ver o comentário de lib/ami.ts). Sem e-mail, sem WhatsApp e sem
  formulário: a AMI não tem os dois primeiros confirmados, e o terceiro
  pediria um serviço novo.

  Sem trilha e sem BreadcrumbList: dado estruturado sem o equivalente
  visível é marcação enganosa (lib/seo/jsonld.ts). Os blocos são filhos
  diretos de `.pagina` (app/(site)/encontre.module.css), a --ritmo um do
  outro; a sede é faixa, e o rodapé emenda nela.
*/
export default function PaginaContato() {
  const e = AMI.endereco;

  return (
    <div className={paginas.pagina}>
      <FaixaCurta
        rotulo="Contato"
        titulo="Fale com a AMI"
        texto={`Pelo telefone, pelo Instagram ou na sede, no ${e.bairro} de ${e.cidade}.`}
        icone="conversa"
      />
      <CanaisDeContato canais={canaisDeContato()} />
      <SedeDaAmi demonstracao={DADOS_DEMONSTRACAO} />
    </div>
  );
}
```

`testes/caminhos-de-filiacao.test.ts` (que chama `PaginaContato()` sem `await`) continua verde sem mudança: a página é síncrona e o fecho leva a `/associacao/seja-associado`. `testes/telefone.test.ts` também: o `tel:` sai de `hrefTelefone`, em lib/paginaDeContato.ts.

- [ ] **Step 7: Rodar, provar por mutação, conferir, commit**

Run: `npx vitest run` · `npx tsc --noEmit` · `npm run build` → verde. No resumo do build, `/contato` continua gerada no build (○).

Mutações, uma de cada vez, regravando o original depois:

1. Na sede, troque `demonstracao ?` por `true ?` no horário.
2. Na sede, tire o `target="_blank"` de "Como chegar".
3. Na sede, troque `data-sem-foto={temFoto ? undefined : ""}` por `data-sem-foto=""`.
4. Nos canais, acrescente `target="_blank"` ao botão do Instagram.
5. Nos canais, troque `c.longo ? … : styles.dado` por `styles.dado`.
6. Na página, troque `DADOS_DEMONSTRACAO` por `true`.
7. No CSS, tire o bloco de 701 a 980px inteiro.
8. No CSS, troque `.sedeDoContato .corpo[data-sem-foto]` por `.corpo[data-sem-foto]`.

Conferência rápida no navegador:
1. `npm run build` e `npx next start -p 3300`.
2. Abra `/contato` a 1440 e a 390px.
3. Expected: igual a `docs/desenho-aprovado/noticias-contato/contato-1440-parte-1.jpg`, `-parte-2.jpg`, `contato-390-parte-1.jpg` e `-parte-2.jpg`, com a tarja da foto "Fotografia a entrar: Fachada da sede da AMI" (o rótulo de `lib/imagens.ts`, como em A Associação).
4. Derrube o 3300 pelo PID.

```bash
git add components/contato/CanaisDeContato.tsx components/contato/SedeDaAmi.tsx components/contato/Contato.module.css "app/(site)/contato/page.tsx" testes/contato-na-tela.test.ts
git commit -m "Contato: faixa verde curta, tres canais com Ligar e Abrir o Instagram, sede com CNPJ, Como chegar e o horario como moldura, e o fecho Seja associado; sem Cabeceira nem BreadcrumbList"
```

---

### Task 6: A `Cabeceira`, o `Breadcrumb` e o `breadcrumbList` saem

**Files:**
- Delete: `components/layout/Cabeceira.tsx`, `components/layout/Breadcrumb.tsx`
- Modify: `lib/seo/jsonld.ts` (CRLF), `testes/jsonld.test.ts` (LF)
- Modify: `testes/paleta.test.ts` (LF)
- Modify: `app/globals.css` (CRLF), `components/base/MolduraProvisoria.tsx` (CRLF), `app/(site)/busca/page.tsx` (CRLF), `app/(site)/medico/[slug]/page.tsx` (LF), `scripts/auditoria-visual.js` (CRLF) (comentários)

**Interfaces:**
- Consumes: nada novo.
- Produces: nada novo. Sai `breadcrumbList` de `lib/seo/jsonld.ts`, `Cabeceira`, `Breadcrumb` e o tipo `ItemTrilha`.

**Por que agora.** O contato e as notícias eram os últimos que usavam a `Cabeceira` (o plano de A Associação os deixou para cá), e o `Breadcrumb` só existia dentro dela. Sem trilha na tela em página nenhuma, o `breadcrumbList` do JSON-LD também fica sem quem o chame, e o comentário dele ("Sempre acompanhado de um breadcrumb visível") deixa de ter o que acompanhar. A exceção `ink-300` de `testes/paleta.test.ts` era o "/" da trilha: ficaria morta, com motivo falso. O token `--color-ink-300` fica no `@theme` (placeholder e ícone desabilitado), e o teste que prova que ele reprova o contraste também.

- [ ] **Step 1: Ninguém mais usa**

Run: `grep -rn "components/layout/Cabeceira\|components/layout/Breadcrumb\|ItemTrilha\|breadcrumbList" app components lib testes scripts sanity`

Expected, e só isto:
- `components/layout/Cabeceira.tsx` (importa o `Breadcrumb` e o `ItemTrilha`);
- `lib/seo/jsonld.ts` (a função `breadcrumbList` e uma menção no comentário de `itemList`);
- `testes/jsonld.test.ts` (o import e o `describe("breadcrumbList")`);
- dois comentários que o Step 3 corrige: `app/globals.css` (o de `--color-ami-green-800`) e `app/(site)/medico/[slug]/page.tsx` (o "marcação enganosa").

Se aparecer outro arquivo, pare e pergunte: alguma página ainda usa a trilha.

- [ ] **Step 2: Os arquivos saem**

1. Apague `components/layout/Cabeceira.tsx` e `components/layout/Breadcrumb.tsx`.
2. Em `lib/seo/jsonld.ts` (CRLF):
   - apague a função inteira, com o comentário de cima e a linha em branco antes dela:

```ts

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
```

   - no comentário de `itemList`, troque as três linhas

```
 * `ItemList` que a spec, seção 7, pede em toda listagem. A forma
 * `{ nome, caminho }` é a mesma de `breadcrumbList`, logo abaixo, para que
 * quem escreve uma listagem nova não precise decidir nada.
```

     por

```
 * `ItemList` que a spec, seção 7, pede em toda listagem. Com
 * `{ nome, caminho }`, quem escreve uma listagem nova não precisa decidir
 * nada.
```

3. Em `testes/jsonld.test.ts` (LF):
   - tire a linha `  breadcrumbList,` do import de `@/lib/seo/jsonld`;
   - apague o `describe("breadcrumbList", …)` inteiro (de `describe("breadcrumbList", () => {` até o `});` que o fecha) e a linha em branco depois dele.
4. Em `testes/paleta.test.ts` (LF), apague a entrada `"ink-300"` inteira de `TEXTO_FORA_DO_TESTE` (as duas linhas):

```ts
  "ink-300":
    "separador aria-hidden (components/layout/Breadcrumb.tsx) — isento de AA por desenho, e testado à parte, para REPROVAR, logo abaixo",
```

- [ ] **Step 3: Os comentários que falavam delas**

1. Em `app/globals.css` (CRLF), no comentário de `--color-ami-green-900`, troque

```
     da moldura provisória (components/base/MolduraProvisoria.tsx, usada por
     Fotografia.tsx, Carrossel.tsx e UltimasNoticias.tsx); o fundo do
     destaque das notícias e o da notícia sem capa
     (components/editorial/UltimasNoticias.module.css). O cabeçalho NÃO:
     Cabecalho.module.css pinta o bloco com `--color-surface`, e
     Cabeceira.tsx é `bg-surface`.
```

   por

```
     da moldura provisória (components/base/MolduraProvisoria.tsx, usada por
     Fotografia.tsx, Carrossel.tsx, UltimasNoticias.tsx, ListaDeNoticias.tsx
     e CartaoNoticia.tsx); o fundo do destaque das notícias da home e o da
     notícia sem capa (components/editorial/UltimasNoticias.module.css), e o
     do destaque da lista de notícias (Noticias.module.css). O cabeçalho
     NÃO: Cabecalho.module.css pinta o bloco com `--color-surface`.
```

2. No mesmo arquivo, no comentário de `--color-ami-green-800`, troque

```
     - a ponta escura dos quatro degradês mascarados pela marca
       (components/base/EstadoVazio.tsx, components/base/MolduraProvisoria.tsx,
       components/layout/Cabeceira.tsx e `.semCapa::after`).
```

   por

```
     - a ponta escura dos três degradês mascarados pela marca
       (components/base/EstadoVazio.tsx, components/base/MolduraProvisoria.tsx
       e `.semCapa::after`).
```

3. Em `components/base/MolduraProvisoria.tsx` (CRLF), troque `      {/* Mesmo recurso de Cabeceira.tsx e EstadoVazio.tsx: o símbolo como` por `      {/* Mesmo recurso de EstadoVazio.tsx: o símbolo como`.
4. Em `app/(site)/busca/page.tsx` (CRLF), troque as duas linhas

```
  contagem e a grade, em ordem alfabética. Sem a `Cabeceira` das outras
  páginas internas: a busca abre com a faixa verde.
```

   por

```
  contagem e a grade, em ordem alfabética. Sem a cabeceira cinza das
  páginas antigas: a busca abre com a faixa verde.
```

5. Em `app/(site)/medico/[slug]/page.tsx` (LF):
   - troque as duas linhas

```
  {especialidade}" e a nota final. Sem a `Cabeceira` das outras páginas
  internas e sem breadcrumb visível, como no desenho aprovado.
```

     por

```
  {especialidade}" e a nota final. Sem a cabeceira cinza das páginas
  antigas e sem breadcrumb visível, como no desenho aprovado.
```

   - troque `  marcação enganosa (components/layout/Breadcrumb.tsx).` por `  marcação enganosa (lib/seo/jsonld.ts).`.
6. Em `scripts/auditoria-visual.js` (CRLF):
   - troque as duas linhas

```
     presa à rolagem. Um enfeite com opacidade baixa de propósito (a marca
     d'água da Cabeceira) não entra: ele não está no meio de uma animação. */
```

     por

```
     presa à rolagem. Um enfeite com opacidade baixa de propósito (a marca
     d'água do aviso de vazio, components/base/EstadoVazio.tsx) não entra:
     ele não está no meio de uma animação. */
```

   - troque as duas linhas

```
     conta: a luz que passeia (`.brilho`, como no desenho) e a marca d'água
     da Cabeceira (`aria-hidden`, sem clique, opacidade 0,05). */
```

     por

```
     conta: a luz que passeia (`.brilho`, como no desenho) e a marca d'água
     em máscara, como a do aviso de vazio (`aria-hidden`, sem clique). */
```

- [ ] **Step 4: O que sobra**

1. `grep -rn "components/layout/Cabeceira\|components/layout/Breadcrumb\|ItemTrilha\|breadcrumbList\|Cabeceira.tsx\|Breadcrumb.tsx" app components lib testes scripts sanity vitest.config.ts`. Não pode sobrar nada.
2. `grep -rn "Cabeceira" app components lib scripts`. Só podem sobrar frases que dizem que uma página ou peça **não** tem a cabeceira (por exemplo "Sem `Cabeceira` e sem trilha", "Sem a `Cabeceira` das páginas internas antigas"). Uma frase que diga que outra página ainda a usa é falsa: corrija-a no mesmo estilo do passo 3.
3. `grep -rn "Cabeceira\|Trilha de navegação\|-mt-32" testes`. Os testes que procuram essas marcas para dizer que **não** estão na página (`not.toContain`) continuam valendo: elas eram da `Cabeceira`, e uma página que as voltasse a ter estaria errada.

- [ ] **Step 5: Rodar, conferir, commit**

Run: `npx vitest run` · `npx tsc --noEmit` · `npm run build` → verde. `testes/paleta.test.ts` continua verde: "nenhum token de texto ficou fora das duas listas" não acha mais o `ink-300` em uso, e "ink-300 fica de fora de propósito" continua medindo o token.

Prova de que a remoção não deixou ninguém sem trilha de propósito: `curl -s` de `/`, `/busca`, `/medicos`, `/noticias`, `/contato`, `/associacao`, `/associacao/diretoria` e `/politica-de-privacidade` no 3300 (`npm run build`, `npx next start -p 3300`). Nenhuma tem "Trilha de navegação" nem "BreadcrumbList". Derrube o 3300 pelo PID.

```bash
git add components/layout/Cabeceira.tsx components/layout/Breadcrumb.tsx lib/seo/jsonld.ts testes/jsonld.test.ts testes/paleta.test.ts app/globals.css components/base/MolduraProvisoria.tsx "app/(site)/busca/page.tsx" "app/(site)/medico/[slug]/page.tsx" scripts/auditoria-visual.js
git commit -m "Cabeceira, Breadcrumb e breadcrumbList saem: nenhuma pagina mostra mais a trilha; comentarios e a excecao ink-300 da paleta acompanham"
```

---
### Task 7: A conferência

**Files:**
- Modify: `scripts/auditoria-visual.js` (CRLF)
- Modify: `vitest.config.ts` (CRLF; só o comentário)
- Modify: `docs/estado-do-projeto.md` (CRLF)
- Modify: `docs/decisoes-sem-o-cliente.md` (LF)

**As notícias de exemplo ficam só nos testes.** A AMI não publicou notícia nenhuma, e este plano não publica nenhuma no Sanity dela, nem para conferir. No navegador, então:
- `/noticias` aparece nos dois estados sem notícia (as molduras, na demonstração; "Nenhuma notícia publicada ainda.", fora dela);
- `/noticias/{qualquer endereço}` dá 404;
- a lista com notícias (1, 2, 3, 4 e 7) e a notícia aberta são provadas pelos testes de renderização das Tasks 3 e 4 e pelo CSS transcrito do desenho. O estado do projeto registra isso (Step 7), e a dúvida 2 do fim deste plano pergunta se o cliente quer vê-las antes da primeira notícia real.

- [ ] **Step 1: A auditoria confere os cartões de notícia e os canais**

Em `scripts/auditoria-visual.js`:

(a) No comentário do topo:
- Troque as duas linhas (que a Task 8 do plano de A Associação escreveu)

```
  Nas páginas com `data-bloco` (a home, a busca, o perfil, as de
  especialidades, as de A Associação e as de texto):
```

por

```
  Nas páginas com `data-bloco` (a home, a busca, o perfil, as de
  especialidades, as de A Associação, as de texto, as de notícias e o
  contato):
```

- Depois do item do índice "Nesta página", que termina na linha ``    (`data-nesta-pagina`);``, acrescente:

```
  - os cartões de notícia (a lista e "Outras notícias"): em cada fileira,
    a mesma altura, a foto terminando na mesma linha, e a data e o título
    começando na mesma linha (`data-cartao-noticia`, `data-foto`,
    `data-data`, `data-titulo`);
  - os canais do contato: em cada fileira, o ícone, o rótulo e o dado
    começando na mesma linha, e o botão terminando na mesma linha
    (`data-canal`, `data-rotulo`, `data-dado`, `data-acao`);
```

(b) Logo depois do fim da conferência 16 (as linhas

```js
    await rolar(0, 250);
    info.nestaPagina = marcados.join("/");
  }
```

que a Task 8 do plano de A Associação escreveu), acrescente:

```js

  /* 17. Os cartões de notícia (a lista e "Outras notícias"): em cada
     fileira, a mesma altura, a foto terminando na mesma linha, e a data e o
     título começando na mesma linha. A moldura "a entrar" não tem data, e
     fica fora da medida da data. No celular cada cartão é uma fileira. */
  const fileirasDeNoticias = new Map();
  const decimo = (x) => Math.round(x * 10) / 10;
  for (const c of document.querySelectorAll("[data-cartao-noticia]")) {
    if (R(c).height === 0) continue;
    const topo = Math.round(topoAbs(c));
    if (!fileirasDeNoticias.has(topo)) fileirasDeNoticias.set(topo, []);
    const foto = c.querySelector("[data-foto]");
    const data = c.querySelector("[data-data]");
    fileirasDeNoticias.get(topo).push({
      altura: decimo(R(c).height),
      foto: decimo(topoAbs(foto) + R(foto).height),
      data: data ? decimo(topoAbs(data)) : null,
      titulo: decimo(topoAbs(c.querySelector("[data-titulo]"))),
    });
  }
  for (const [topo, cs] of fileirasDeNoticias) {
    for (const medida of ["altura", "foto", "data", "titulo"]) {
      const xs = cs.map((c) => c[medida]).filter((x) => x !== null);
      if (xs.length > 1 && espalha(xs) > 0.5)
        problemas.push(`cartões de notícia com ${medida} desigual na fileira de ${topo}px: ${xs.join("/")}`);
    }
  }
  info.fileirasDeNoticias = fileirasDeNoticias.size;

  /* 18. Os canais do contato: em cada fileira, o ícone, o rótulo e o dado
     começando na mesma linha, e o botão terminando na mesma linha. Do
     tablet para baixo cada canal é uma fileira. */
  const fileirasDeCanais = new Map();
  for (const c of document.querySelectorAll("[data-canal]")) {
    if (R(c).height === 0) continue;
    const topo = Math.round(topoAbs(c));
    if (!fileirasDeCanais.has(topo)) fileirasDeCanais.set(topo, []);
    const acao = c.querySelector("[data-acao]");
    fileirasDeCanais.get(topo).push({
      icone: decimo(topoAbs(c.querySelector(".ladrilho-icone"))),
      rotulo: decimo(topoAbs(c.querySelector("[data-rotulo]"))),
      dado: decimo(topoAbs(c.querySelector("[data-dado]"))),
      botao: decimo(topoAbs(acao) + R(acao).height),
    });
  }
  for (const [topo, cs] of fileirasDeCanais) {
    for (const medida of ["icone", "rotulo", "dado", "botao"]) {
      const xs = cs.map((c) => c[medida]);
      if (espalha(xs) > 0.5)
        problemas.push(`canais com ${medida} desalinhado na fileira de ${topo}px: ${xs.join("/")}`);
    }
  }
  info.fileirasDeCanais = fileirasDeCanais.size;
```

`espalha`, `R`, `topoAbs` e `problemas` já existem no script (a `espalha` é da conferência 14). Se a conferência 16 não terminar com as três linhas acima, pare e pergunte.

- [ ] **Step 2: O comentário do Vitest**

Em `vitest.config.ts`, no fim do comentário, troque (o texto da Task 8 do plano de A Associação)

```
   renderizam as páginas de A Associação e as de texto com `htmlDe`, com o
   Sanity, a diretoria e o banco trocados por dublês. */
```

por

```
   renderizam as páginas de A Associação e as de texto com `htmlDe`, com o
   Sanity, a diretoria e o banco trocados por dublês.
   `testes/pecas-de-texto.test.ts` renderiza a faixa curta, o corpo das
   páginas de texto e o texto rico com `renderToString`;
   `testes/lista-de-noticias.test.ts`, `testes/noticia-aberta.test.ts` e
   `testes/contato-na-tela.test.ts`, as peças e as páginas de notícias e
   de contato, com o Sanity trocado por um dublê e as notícias de exemplo
   escritas no próprio teste. */
```

- [ ] **Step 3: Produção, nas 8 larguras, com as duas chaves**

`npm run build` e `npx next start -p 3300`.

Antes da primeira rodada, prove que as conferências novas pegam o defeito: em `/contato` a 1440, cole no console `document.querySelector("[data-rotulo]").style.marginTop = "40px"` e rode a auditoria. Expected: `problemas` lista "canais com rotulo desalinhado…" (e o dado e o ícone junto). Em `/noticias` a 1440, cole `document.querySelector("[data-titulo]").style.marginTop = "30px"` e rode. Expected: "cartões de notícia com titulo desigual…". Recarregue a página depois de cada prova.

Rode a auditoria em cada página e largura:
- Cole `scripts/auditoria-visual.js` no console ou use a ferramenta de navegador, esperando a promessa.
- A página precisa estar recém-aberta, sem rolar.
- Abra cada página por endereço, e não pelo menu, antes de cada rodada: a conferência 12 navega e termina noutra página.

Com a chave de hoje (demonstração):
- Páginas:
  - `/noticias` (as molduras);
  - `/contato`;
  - para conferir que nada regrediu: `/`, `/busca`, `/medicos`, `/medicos/cardiologia`, um perfil (`/medico/{um slug da busca}`), `/associacao`, `/associacao/diretoria`, `/associacao/seja-associado` e `/politica-de-privacidade` (os textos legais usam a `FaixaDoTexto` nova; a spec, seção 4, manda conferir).
- Larguras: 375, 390, 430, 768, 1024, 1280, 1440, 1920.

Depois, `NEXT_PUBLIC_DADOS_DEMONSTRACAO=false npm run build` e `npx next start -p 3300`. Rode a auditoria em `/noticias`, `/contato`, `/associacao/seja-associado` e `/politica-de-privacidade` nas mesmas 8 larguras. No fim, refaça o build com a chave de hoje.

**Expected: `problemas: []` em todas.**

| Medida | O que conferir |
|---|---|
| `colunaTexto` | o mesmo número em todos os blocos e no rodapé: 172 a 1440, 72 a 1024, 52 a 768, 32 a 390 |
| `espacosEntreBlocos` | a `--ritmo` (72, 56 ou 32): em `/noticias`, um vão (a faixa e a lista); em `/contato`, dois (a faixa, os canais e a sede) |
| `cabecalhoAoPrimeiro` | a `--ritmo` |
| `ultimoAoRodape` | a `--ritmo` em `/noticias` (a lista não é faixa); 0 em `/contato` (a sede é faixa) |
| `fileirasDeNoticias` | `/noticias` na demonstração: 1 fileira acima de 980px (os três cartões a entrar); 2 de 701 a 980px; 3 no celular. Fora da demonstração, 0 |
| `fileirasDeCanais` | `/contato`: 1 acima de 980px; 3 do tablet para baixo |
| `aberturas` | 0 em todas |

Guarde estes números para o estado do projeto:
- `espacosEntreBlocos`;
- `colunaTexto`;
- `colunaDoLogo`;
- `ultimoAoRodape`;
- `fileirasDeNoticias`;
- `fileirasDeCanais`;
- `aberturas`.

Corrija o que aparecer na tarefa de origem, com um commit de correção com o nome dela.

- [ ] **Step 4: Contraste medido**

1. A régua do desenho mede cada trecho de texto contra os pixels de verdade atrás dele: rode `node .superpowers/brainstorm/fatia-b-noticias-contato/ferramentas/contraste.mjs http://localhost:3300/<página> <largura>` em `/noticias` e `/contato`, a 1440 e a 390, com as duas chaves. Expected: nenhum trecho abaixo de 4,5:1 (3:1 para texto grande).
2. A régua para a luz parada na posição inicial. Para o pior caso, use o método da fatia A, a 1440, 768, 430 e 320px: a luz parada no ponto mais claro do caminho dela, com o grão médio. Meça o rótulo "NOTÍCIAS" e "CONTATO" (o lima, e o lima clareado abaixo de 700px) e o parágrafo `#cfd8c9` das duas faixas (34em).
3. No branco e no cinza claro, meça: `ink-400` do CNPJ e do horário a entrar; `ink-600` da frase dos canais e da sede; `ami-green-600` do rótulo dos canais; o `ami-green-800` da frase "Nenhuma notícia publicada ainda." sobre o `canvas`.
4. O que só aparece com notícia publicada (a data dos cartões no `canvas` do celular, o texto sobre a foto do destaque, a assinatura `#DDE7D6` sobre o verde, a legenda e o aviso de saúde em `ink-400`) não aparece no site hoje: vale a medida do relatório do desenho, feita com as mesmas cores e o mesmo degradê (4,69; 6,28; 5,38). Registre no estado do projeto que essas foram medidas no desenho, e não no site.

Expected: ≥ 4,5:1 em todos. Se o parágrafo `#cfd8c9` ficar abaixo, vale o Ruling 7 do diário de Especialidades: suba a opacidade do texto na folha da busca, sem parar, e registre a medida.

- [ ] **Step 5: Fotos comparadas com o desenho**

Fotos da página inteira, com `node .superpowers/brainstorm/fatia-b-noticias-contato/ferramentas/foto.mjs <url> <largura> <altura-máxima-da-parte> <prefixo>` (1600 no computador, 2000 no celular; o prefixo numa pasta do scratchpad). Compare, seção por seção:

| Foto do site | Desenho |
|---|---|
| `/noticias` a 1440, demonstração | `docs/desenho-aprovado/noticias-contato/noticias-1440-a-entrar-parte-1.jpg` e `-parte-2.jpg` |
| `/noticias` a 390, demonstração | `noticias-390-a-entrar-parte-1.jpg` |
| `/noticias` a 1440 e a 390, chave `false` | `noticias-1440-sem-conteudo-parte-1.jpg` e `noticias-390-sem-conteudo-parte-1.jpg` |
| `/contato` a 1440 e a 390, demonstração | `contato-1440-parte-1.jpg`, `-parte-2.jpg`, `contato-390-parte-1.jpg` e `-parte-2.jpg` |
| `/contato` a 1440 e a 390, chave `false` | `contato-1440-sem-conteudo-parte-1.jpg`, `-parte-2.jpg`, `contato-390-sem-conteudo-parte-1.jpg` e `-parte-2.jpg` |

Não são diferença:
- o desenho tem a faixa escura "Desenho para aprovação" no alto, que não existe no site;
- a tarja da foto da sede diz "Fotografia a entrar: Fachada da sede da AMI", o rótulo do pedido de foto (`lib/imagens.ts`), como em A Associação;
- o perfil do Instagram não tem o `<wbr>` do desenho: a 1440 ele cabe numa linha nos dois;
- o anel de foco dos cartões e do destaque (só aparece com o teclado).

Qualquer outra diferença é defeito: medida, cor, ordem, alinhamento, quebra ou texto. Corrija na tarefa de origem.

- [ ] **Step 6: As varreduras**

No 3300, com a chave de hoje, `curl -s` de `/noticias` e `/contato`. Tirando o `<script type="application/ld+json">`, nenhuma ocorrência de:
- "PROVISÓRIO";
- "Trilha de navegação";
- "BreadcrumbList" (nem dentro do JSON-LD).

Com a chave `false`, nas mesmas páginas, também nenhuma de:
- `data-a-entrar`;
- "a entrar".

E, nas duas chaves, `curl -s -o /dev/null -w "%{http_code}" http://localhost:3300/noticias/qualquer-coisa` → `404`.

Derrube o 3300 pelo PID.

- [ ] **Step 7: O estado do projeto**

Em `docs/estado-do-projeto.md`:

(a) Depois da seção "### A Associação — fatia B, grupo 3 (a página institucional, a diretoria e as páginas de texto)" (que a Task 8 do plano de A Associação escreveu) e antes de "## O que falta", acrescente a seção "### Notícias e Contato — fatia B, grupos 4 e 5 (a lista, a notícia aberta e o contato)". Ela tem:

- **Onde está:** ramo `paginas-encontre`, desenho em [`docs/desenho-aprovado/noticias-contato/`](desenho-aprovado/noticias-contato/), decisões em [`docs/superpowers/specs/2026-10-03-noticias-contato-design.md`](superpowers/specs/2026-10-03-noticias-contato-design.md) e em [`docs/decisoes-sem-o-cliente.md`](decisoes-sem-o-cliente.md).
- **O que mudou no site:**
  - `/noticias`, a notícia aberta e `/contato` no desenho novo, sem a cabeceira cinza, sem trilha e sem `BreadcrumbList`;
  - a lista: a mais recente em destaque, as outras em cartões, no arranjo da home para poucas notícias; sem notícia, as molduras no modo demonstração ou "Nenhuma notícia publicada ainda." fora dele;
  - a notícia aberta: a assinatura com o CRM na faixa verde, a capa em 16:9 recortada pelo ponto de interesse, o texto na coluna de leitura das páginas de texto, com o índice "Nesta página", quem assina no fim e "Outras notícias";
  - o contato: os dois telefones e o Instagram em cartões, a sede com o endereço, o CNPJ e "Como chegar", e o convite para se associar; a foto da sede e o horário de atendimento como moldura só no modo demonstração;
  - a cabeceira cinza e a trilha saíram do site inteiro: a `Cabeceira`, o `Breadcrumb`, o `TextoRico` e a `LinhaNoticia` foram apagados.
- **O que não foi visto no navegador:** a lista com notícias e a notícia aberta. A AMI não publicou nenhuma notícia, e nenhuma de exemplo foi publicada no Sanity dela: esses estados são provados pelos testes (`testes/lista-de-noticias.test.ts`, com 1, 2, 3, 4 e 7 notícias, e `testes/noticia-aberta.test.ts`) e pelo CSS transcrito do desenho. A primeira notícia real precisa de uma olhada no navegador, a 1440 e a 390px, contra `docs/desenho-aprovado/noticias-contato/noticias-1440-parte-*.jpg` e `noticia-1440-parte-*.jpg`.
- **O que a AMI precisa saber:**
  - a capa da notícia sai em 16:9: o ponto de interesse marcado na imagem de capa, no Studio, decide o que não pode ser cortado;
  - a lista mostra até 20 notícias; a 21ª só se acha pelo endereço direto, até entrar "Mais antigas";
  - o e-mail, o WhatsApp e o horário de atendimento entram no contato quando a AMI os informar.
- **Pendências do cliente.** Passo a passo, com os nomes de campo do Studio, no mesmo formato da seção do grupo 1. Sem acesso ao Studio (não entre com senha de ninguém), use os nomes que o schema define (`sanity/schemas/noticia.ts` e `autor.ts`) e não escreva o nome de botão que você não viu:
  1. **O autor.** Abrir `/studio`, entrar com a conta do Sanity, clicar em **Autor** e criar um documento novo: **Nome**, **CRM** (só os números), **UF do CRM** e, se o médico tem perfil no diretório, **Endereço do perfil no diretório** (o fim do endereço do perfil, por exemplo `mayara-viana`). Publicar.
  2. **A primeira notícia.** Em **Notícia**, criar um documento novo: **Título**, **Endereço**, **Resumo** (de 60 a 220 caracteres), **Imagem de capa** com a **Descrição da imagem** e o ponto de interesse marcado na própria imagem, **Autor**, **Publicado em** e **Texto**. Publicar. Abrir `/noticias`: as molduras somem e a notícia aparece em destaque.
  3. **O webhook.** Em [sanity.io/manage](https://www.sanity.io/manage), projeto da AMI, **API**, **Webhooks**, o webhook do site, campo **Filter**: vazio, nada a fazer; com uma lista de tipos, conferir que `"noticia"` e `"autor"` estão nela. Sem isso, a notícia publicada demora até uma hora para aparecer.
  4. **O horário de atendimento da sede** e **o e-mail de contato**, se houver: pedir à AMI. Entram em `lib/ami.ts`, e o contato ganha o horário no lugar da moldura e um quarto cartão, "Escrever".
  5. **A foto da sede** (`ESPACOS.sede`, `lib/imagens.ts`): a mesma de A Associação, agora também no contato.
- **Os números medidos** no Step 3, colados da saída, e os contrastes do Step 4, dizendo quais foram medidos no site e quais vêm do relatório do desenho.
- **As dúvidas em aberto:** a lista do fim deste plano, com o que o controlador ou o cliente decidiram, se já decidiram.

(b) Na tabela da seção "### Conteúdo editorial e institucional", troque as duas linhas

```
| `/noticias` e `/noticias/{slug}` | Blog, com autoria por CRM e dado estruturado para o Google | no ar |
```

```
| `/contato` | Fale com a AMI: endereço, os dois telefones, Instagram e CNPJ, tudo de `lib/ami.ts` | no ar |
```

por

```
| `/noticias` e `/noticias/{slug}` | Notícias: a lista com a mais recente em destaque, e a notícia com a assinatura (CRM), a capa em 16:9 e "Outras notícias"; dado estruturado para o Google | no ar; sem notícia publicada, a lista mostra as molduras no modo demonstração e "Nenhuma notícia publicada ainda." fora dele |
```

```
| `/contato` | Fale com a AMI: os dois telefones e o Instagram em cartões, e a sede com o endereço, o CNPJ e "Como chegar", tudo de `lib/ami.ts` | no ar; a foto da sede e o horário de atendimento aparecem como moldura só no modo demonstração |
```

(c) Na seção "## O que falta":
- no item "### 1. Conteúdo da AMI", troque a linha

```
- **As primeiras notícias**. A primeira publicada tira os quatro cartões provisórios
```

  por

```
- **As primeiras notícias**. A primeira publicada tira os quatro cartões provisórios da home e as molduras da lista de notícias (`/noticias`)
```

- no item "### 2. Dados reais da AMI", acrescente, no fim da lista:

```
- **O horário de atendimento da sede**: o contato tem o lugar dele, e hoje mostra "Horário de atendimento da sede a entrar." só no modo demonstração
- **O e-mail de contato**, se a AMI tiver um: entra no contato como um quarto cartão, "Escrever"
```

- no item "### 4. Fases de desenvolvimento que ainda não começaram", troque o começo do item da fatia B

```
- **Reforma visual, fatia B: as outras páginas.** O grupo 1 (a busca e o perfil) está feito; ver "Encontre um médico — fatia B, grupo 1". Faltam especialidades, notícias e matéria, associação, diretoria, contato, Seja associado e as três páginas legais.
```

  por

```
- **Reforma visual, fatia B: as outras páginas.** Os cinco grupos estão construídos no ramo `paginas-encontre`: a busca e o perfil, as especialidades, A Associação (com a diretoria, Seja associado e as três páginas legais), as notícias e o contato; ver a seção de cada um, acima. Nada foi para a `main`: falta a revisão do cliente das decisões tomadas sem ele ([`docs/decisoes-sem-o-cliente.md`](decisoes-sem-o-cliente.md)).
```

  O resto do item fica como está.
- no item "### 5. Itens técnicos adiados de propósito", troque a linha

```
- **Selo "Revisado por"** nas notícias, e os recursos de blog previstos na especificação (filtro por categoria, tempo de leitura, sumário lateral)
```

  por

```
- **Selo "Revisado por"** nas notícias, e os recursos de blog previstos na especificação (filtro por categoria e tempo de leitura). O sumário lateral entrou: é o índice "Nesta página" da notícia aberta, com dois títulos de seção ou mais. A paginação da lista ("Mais antigas") fica para quando a AMI passar de 20 notícias
```


Se algum desses textos não estiver no arquivo exatamente assim, pare e pergunte.

Números medidos, não lembrados: cada número que entrar ali saiu de uma rodada desta tarefa.

- [ ] **Step 8: As decisões sem o cliente**

Em `docs/decisoes-sem-o-cliente.md`, na seção "## Grupos 4 e 5: Notícias e Contato", depois do item 6, acrescente:

```
7. **Notícia sem capa:** o verde da marca com o símbolo, o mesmo da home.
8. **Lista sem notícia:** no modo demonstração, os cartões "Notícia a entrar" da home; fora dele, "Nenhuma notícia publicada ainda." e o botão "Voltar para o início".
9. **"Outras notícias":** as três mais recentes, depois do texto da notícia, três por linha. Com uma ou duas, os cartões ficam do tamanho de um de três, alinhados à esquerda; sem nenhuma, o bloco não aparece.
10. **Notícia aberta:** o texto na mesma coluna de leitura das páginas de texto, com o índice "Nesta página" quando há dois títulos ou mais, e "Atualizado em" só quando a notícia foi revisada.
11. **Lista numerada, citação e links do texto:** o número num círculo cinza, a citação com o fio verde e o link verde que escurece no mouse valem também nas páginas de texto (Estatuto, Política editorial e os textos legais), quando o texto os tiver.
12. **Fotos da lista:** os cartões e o destaque são recortados pelo meio, como na home. Só a capa da notícia aberta usa o ponto de interesse marcado no Studio.
13. **"Como chegar" no contato:** abre o Google Maps em nova aba, como pedido para esta página, e avisa quem usa leitor de tela. Em A Associação e em Seja associado ele continua na mesma aba.
14. **Instagram:** "Abrir o Instagram" na mesma aba, como os outros links para fora do site.
15. **Perfil do Instagram:** em tela estreita, ele pode quebrar em qualquer ponto, para não sair da tela.
16. **A cabeceira cinza e a trilha ("Início / …") saíram do site inteiro:** a lista de notícias, a notícia e o contato eram as últimas páginas que as tinham.
17. **Teclado nos cartões de notícia:** o contorno do foco aparece em volta do cartão inteiro, e não só do título.
```

Se o Step 3 ou o Step 4 levaram a alguma outra decisão visível ao cliente, acrescente-a com o próximo número.

- [ ] **Step 9: Rodar tudo e commit**

Run: `npx vitest run` · `npx tsc --noEmit` · `npm run build` → verde.

```bash
git add scripts/auditoria-visual.js vitest.config.ts docs/estado-do-projeto.md docs/decisoes-sem-o-cliente.md
git commit -m "Conferencia de Noticias e Contato: auditoria nas 8 larguras com e sem demonstracao, cartoes de noticia e canais conferidos, fotos, estado do projeto e decisoes"
```

---

## Autorrevisão do plano

**1. Cobertura da spec**

| Spec | Onde |
|---|---|
| 1.1 Faixa curta de `/noticias`: "NOTÍCIAS", "Notícias da AMI", a frase, o jornal no ladrilho que some no celular; sem `Cabeceira` | Tasks 1 (ícone `"jornal"`), 2 (`FaixaCurta` com `rotulo`) e 3 (página) |
| 1.2 Destaque na largura dos painéis, 2:1, título sobre a foto, degradê do site construído | Tasks 1 (`SIZES_DO_DESTAQUE_DA_LISTA`), 3 (`ListaDeNoticias`, CSS `.sobreFoto` e `.fotoDoDestaque`) |
| 1.3 Cartões brancos, 3 por linha, foto 16:10, data, título, resumo de 2 linhas; celular com miniatura de 88px | Tasks 1 (`tamanhoDosCartoes`), 3 (`CartaoNoticia`, CSS) e 7 (conferência 17) |
| 1.4 Poucas notícias pela regra da home (2: deitado; 3: duas colunas) | Tasks 1 (`arranjoDaLista`, `listaDeNoticias`, testes de 1, 2, 3, 4 e 7) e 3 (renderização de 1, 2, 3, 4 e 7) |
| 1.5 Última fileira incompleta alinhada à esquerda | Task 3 (grade comum, `repeat(var(--colunas, 3), …)`) |
| 1.6 Notícia sem capa: o verde da marca com o símbolo | Task 3 (`FotoDaNoticia` com o `.semCapa` da home) |
| 1.7 No máximo 20, sem paginação | Tasks 1 (`LIMITE_DA_LISTA`) e 3 (página pede 20) |
| 1.8 Sem notícia: molduras na demonstração; fora dela, a frase e "Voltar para o início" | Tasks 1 (`listaDeNoticias`) e 3 (`ListaDeNoticias`, página nas duas chaves) |
| 2.1 Faixa da notícia: "← NOTÍCIAS", título de 34 a 50px sem ladrilho, resumo, assinatura com link do perfil, "MÉDICO · CRM/UF n" e a data | Tasks 1 (`VOLTA_NOTICIAS`, `assinaturaDoAutor`), 2 (`FaixaCurta` sem ícone, com classe) e 4 (`FaixaDaNoticia`, `.materia`) |
| 2.2 Capa 16:9 na largura dos painéis, recortada pelo hotspot | Tasks 1 (`urlRecortada`, `capaDaNoticia`, a projeção com `hotspot` e `crop`) e 4 (`CapaDaNoticia`) |
| 2.3 Corpo em faixa branca, coluna de 680px; listas (numerada no círculo), citação de 20px com fio verde, imagem com legenda sem moldura, links; índice com dois h2 ou mais | Tasks 1 (`imagemDoTexto`), 2 (`FaixaDoTexto`, `CorpoDoTexto`, CSS) e 4 (página) |
| 2.4 No fim, "Por {autor}" e "Ver perfil" quando há perfil | Task 4 (`AutorDaNoticia`) |
| 2.5 "Outras notícias": 3 cartões depois da faixa branca; sem outra, a seção sai | Tasks 1 (`outrasNoticias`) e 4 (`OutrasNoticias`, página) |
| 2.6 JSON-LD `NewsArticle` como está; sai o `BreadcrumbList` | Tasks 4 (página) e 6 (`breadcrumbList` sai) |
| 2.7 Sem notícia publicada, 404 | Task 4 (teste "endereço sem notícia") e 7 (varredura) |
| 3.1 Faixa do contato: "CONTATO", "Fale com a AMI", a frase, a conversa no ladrilho | Tasks 2 e 5 |
| 3.2 Três canais com ladrilho, rótulo, dado, frase e botão; Instagram na mesma aba; sem e-mail e WhatsApp; no tablet, linhas | Tasks 1 (`canaisDeContato`), 5 (`CanaisDeContato`, CSS de 701 a 980px) e 7 (conferência 18) |
| 3.3 Sede: "SEDE / Onde fica a AMI", endereço com CNPJ e "Como chegar" em nova aba, sem mapa; a foto `ESPACOS.sede` como moldura na demonstração; o horário como moldura só na demonstração | Task 5 (`SedeDaAmi`, nas duas chaves) |
| 3.4 Fecho "Médico interessado em se associar?" com o botão para Seja associado | Task 5 |
| 3.5 Sem formulário | Task 5 (teste "sem formulário") |
| 4 Textos legais: conferir o resultado | Tasks 2 (o HTML deles não muda: testes de A Associação) e 7 (auditoria em `/politica-de-privacidade` nas duas chaves) |
| 5 Fora do escopo: paginação, e-mail, WhatsApp, horário, formulário, escrever notícias, campos extras do JSON-LD | Não tocados; pendências no estado do projeto (Task 7) |
| 6 Ruling 11, 8 larguras com as duas chaves, fotos, contraste, o arranjo de 1, 2, 3, 4 e 7 por função pura e por renderização | Tasks 1 a 6 (render e função pura) e 7 |
| Pedido do controlador: a `Cabeceira` e o `Breadcrumb` saem se ficarem sem uso | Task 6 |

**2. Placeholders:** nenhum "TBD" nem "implementar depois"; todo passo de código traz o código. O que o plano não traz só existe depois de medir: os números e os contrastes da Task 7.

Achados desta revisão, já corrigidos no texto:
1. **A `FaixaCurta` de A Associação não servia como estava:** a lista e o contato têm rótulo, e não link de volta; a notícia aberta não tem ladrilho. A Task 2 a alarga sem mudar o HTML de quem já a usa, e os testes de lá são a prova.
2. **O corpo da notícia é o da página de texto, mas `PaginaDeTexto` desenha a faixa junto.** A Task 2 tira o corpo para `FaixaDoTexto`; sem isso, a capa não teria como ficar entre a faixa verde e a branca.
3. **A projeção da capa não trazia o ponto de interesse** (`capa{asset, alt}`), e `urlDaImagem` passa só o `asset` ao construtor do CDN: o comentário de `lib/sanity/imagem.ts` prometia "o recorte pelo hotspot de graça" a quem passasse a altura, e isso não acontecia. A Task 1 acrescenta `hotspot` e `crop` à projeção, cria `urlRecortada` e corrige o comentário e o teste que repetiam a promessa.
4. **React 19 põe um `<link rel="preload">` antes do HTML** para imagem com `fetchPriority="high"` (medido com o `react-dom` instalado). Os testes do destaque e da capa tiram esse `<link>` antes de ancorar no começo.
5. **`TextoRico` e `LinhaNoticia` ficam sem uso** depois das Tasks 3 e 4, e sete comentários e dois testes citavam os dois. Os dois saem juntos na Task 4, com a página que ainda os citava, e os comentários são corrigidos no mesmo passo.
6. **`breadcrumbList` e a exceção `ink-300` de `testes/paleta.test.ts`** ficariam mortos, com motivo falso, sem a trilha: saem na Task 6.
7. **`testes/caminhos-de-filiacao.test.ts` chama `PaginaContato()` sem `await`.** A página nova continua síncrona.
8. **O desenho corta o anel de foco do destaque** (o recorte está no `<article>` e o anel, 4px para fora do link): o recorte vai para o link (Task 3, D10).
9. **A sede sem foto, no desenho, prende o título no alto** com uma regra que perderia para a de "Quem somos" conforme a ordem das folhas: a regra leva a classe da faixa e o atributo `data-sem-foto` (Task 5).
10. **Os ícones mudaram de casa enquanto este plano era escrito:** a correção final de Especialidades (ainda sem commit quando o plano foi lido) dividiu `components/base/Icone.tsx` em dois mapas, com `IconeServidor.tsx` para o servidor. O plano de A Associação foi escrito antes e acrescenta os ícones dele a `Icone.tsx`; este parte da divisão, importa de `IconeServidor` e põe os três ícones novos lá. A conferência de "Antes da Task 1" pega a diferença, se houver.
11. **O GROQ devolve `null`, e não `undefined`, para o campo vazio** (medido com o `groq-js` instalado: `capa`, `atualizadoEm` e `slugDoPerfil` vêm `null`). `capaDaNoticia`, `FotoDaNoticia`, `FaixaDoTexto` e `assinaturaDoAutor` testam com `!`, `?.` e `?`, que tratam os dois iguais.

**3. Consistência de nomes:**

| Nome | Tarefas |
|---|---|
| `PontoDeInteresse`, `Recorte`, `CapaSanity`; `ResumoNoticia.capa` | 1 → 3, 4 |
| `ConfiguracaoDoSanity`, `urlRecortada` | 1 |
| `ArranjoDaLista`, `arranjoDaLista`, `tamanhoDosCartoes`, `SIZES_DO_DESTAQUE_DA_LISTA`, `LARGURAS_DO_DESTAQUE_DA_LISTA`, `LARGURAS_DO_CARTAO` | 1 → 3, 4 |
| `LIMITE_DA_LISTA`, `ListaNaTela`, `listaDeNoticias` | 1 → 3 |
| `VOLTA_NOTICIAS`, `assinaturaDoAutor`, `Assinatura` | 1 → 2 (teste), 4 |
| `LIMITE_DE_OUTRAS`, `TRES_POR_LINHA`, `outrasNoticias` | 1 → 3, 4 |
| `ImagemNaTela`, `capaDaNoticia`, `alturaDaCapa`, `LARGURAS_DA_CAPA`, `SIZES_DA_CAPA` | 1 → 4 |
| `imagemDoTexto`, `LARGURAS_DA_IMAGEM_DO_TEXTO`, `SIZES_DA_IMAGEM_DO_TEXTO` | 1 → 2 |
| `Canal`, `canaisDeContato`, `perfilDoInstagram` | 1 → 5 |
| ícones `jornal`, `instagram`, `horario` | 1 → 3, 5 |
| `FaixaCurta` (`volta` ou `rotulo`, `titulo`, `texto`, `icone?`, `className?`, `children`) | 2 → 3, 4, 5 |
| `FaixaDoTexto` (`rotulo`, `atualizadoEm?`, `aviso?`, `corpo`, `children`) | 2 → 4 |
| `CorpoDoTexto` (`blocos`, `ancoras`) | 2 (reescrita, mesmas props) |
| classes de `PaginaDeTexto.module.css`: `link` (2); `autorFim`, `autorNome`, `autorCrm`, `autorAcoes`, `avisoSaude` (4) | 2, 4 |
| `FotoDaNoticia` (`capa?`, `larguras`, `sizes`, `prioridade?`) | 3 |
| `CartaoNoticia` (`noticia?`, `sizes`) | 3 → 4 (pela grade) |
| `GradeDeNoticias` (`noticias`, `arranjo`), `GradeAEntrar` | 3 → 4 |
| `ListaDeNoticias` (`lista`) | 3 |
| classes de `Noticias.module.css`: `lista`, `destaque`, `casca`, `fotoDoDestaque`, `sobreFoto`, `data`, `destaqueTitulo`, `destaqueResumo`, `grade`, `cartao`, `foto`, `corpo`, `titulo`, `resumo`, `nenhuma`, `acao`, `outras` | 3 → 4 |
| `FaixaDaNoticia` (`noticia`), `CapaDaNoticia` (`capa`), `AutorDaNoticia` (`autor`), `OutrasNoticias` (`noticias`); classes `materia`, `assinatura`, `vidro`, `nome`, `meta`, `ponto`, `capa` | 4 |
| `CanaisDeContato` (`canais`), `SedeDaAmi` (`demonstracao`); classes `canais`, `canal`, `rotulo`, `dado`, `longo`, `nota`, `acao`, `sedeDoContato`, `corpo`, `texto`, `cnpj`, `acoes`, `horario`, `falta`, `separa`, `fecho` | 5 |
| marcas `data-bloco` (`topo`, `noticias`, `capa`, `texto`, `outras`, `canais`, `sede`), `data-faixa`, `data-coluna`, `data-a-entrar`, `data-cartao-noticia`, `data-foto`, `data-data`, `data-titulo`, `data-canal`, `data-rotulo`, `data-dado`, `data-acao`, `data-sem-foto` | 3–5 → 7 |

### Pares de tarefas que tocam o mesmo arquivo

Para o executor conferir conflitos: a tarefa de número maior parte do estado que a menor deixou. As colunas dos planos anteriores dizem o que eles, executados antes, já fizeram no arquivo; os Edits daqui partem do texto que eles deixaram.

| Arquivo | Tarefas deste plano | Plano Especialidades | Plano A Associação | O que cada uma faz |
|---|---|---|---|---|
| `components/base/IconeServidor.tsx`, `testes/icones.test.ts` | 1 | 1 (33 ícones) e a correção final (a divisão em dois mapas) | 1 (44) | aqui: mais 3 no mapa do servidor (47 no total) |
| `lib/sanity/tipos.ts` | 1 | 2 (texto de especialidade) | — | aqui: os tipos da capa e a capa do resumo |
| `lib/sanity/consultas.ts` | 1 | 2 (texto de especialidade) | — (só lê) | aqui: `PROJECAO_CAPA` com `hotspot` e `crop` |
| `components/layout/FaixaCurta.tsx` | 2 (reescrita) | — | 2 (cria); correção final, se o Ruling 7 de lá a mudou | aqui: `rotulo`, `icone` opcional e `className`, com o mesmo HTML para quem já usa |
| `components/editorial/PaginaDeTexto.tsx` | 2 (reescrita) | — | 3 (reescreve) | aqui: o corpo sai para `FaixaDoTexto`, com o mesmo HTML |
| `components/editorial/CorpoDoTexto.tsx` | 2 (reescrita) | — | 3 (cria) | aqui: a citação e a imagem; o comentário |
| `components/editorial/PaginaDeTexto.module.css` | 2, 4 | — | 3 (cria), 4 (o quadro "Fale com a AMI") | 2: a lista numerada, a citação, a imagem, o link e o fim do bloco de 700px; 4: o fim da notícia, depois de `.numero`, e o fim do bloco de 700px (depois do que a Task 2 escreveu) |
| `testes/paleta.test.ts` | 4 (comentário), 6 (`ink-300`) | — | 3 (`warn`), 5 (`ami-green-800`) | cada um tira ou corrige uma entrada diferente |
| `app/globals.css` (comentários) | 6 | — | 5 (a `Placa` do comentário de `--color-ami-green-800`) | aqui: a `Cabeceira` dos comentários de `--color-ami-green-900` e `-800` (as linhas de baixo, que lá não mudam) |
| `components/layout/Cabeceira.tsx` | 6 (apaga) | 4, 6 (comentário) | 5, 7 (comentário) | aqui: o arquivo sai |
| `scripts/auditoria-visual.js` | 6 (comentários das conferências 1 e 3), 7 (conferências 17 e 18) | 7 (conferência 14) | 8 (conferências 15 e 16) | 7: depois da 16, e um item no comentário depois do da 16 |
| `vitest.config.ts` (só o comentário) | 7 | 7 | 8 | os três acrescentam frases no fim |
| `docs/estado-do-projeto.md` | 7 | 7 | 8 | aqui: a seção de Notícias e Contato depois da de A Associação, duas linhas da tabela e trocas em "O que falta" que os outros não tocam |
| `docs/decisoes-sem-o-cliente.md` | 7 | 7 | 8 | aqui: itens 7 a 17 dos grupos 4 e 5 (os outros mexem nos grupos 2 e 3) |

Arquivos que este plano só **lê** e que os planos anteriores criaram ou mudaram: `components/associacao/QuemSomos.tsx` (`SIZES_DA_SEDE`) e `QuemSomos.module.css` (Task 5), `components/home/SejaAssociado.module.css` (Task 5), `components/editorial/IndiceNestaPagina.tsx`, `lib/nestaPagina.ts`, `lib/paginaDeTexto.ts`, `lib/rascunhosLegais.ts` (Task 2), `lib/ami.ts` (`linkDoMapaDaAmi`) e `lib/contato.ts` (Tasks 1 e 5), `components/especialidades/FaixaDaEspecialidade.module.css` (Task 2, pela `FaixaCurta`). Este plano não toca `lib/molduras.ts`, `lib/imagens.ts`, `components/base/Fotografia.tsx`, a home nem as páginas de A Associação.

## Decisões deste plano que a spec não fixava

Registrar no diário ao executar. As visíveis ao cliente vão para `docs/decisoes-sem-o-cliente.md` (Task 7, Step 8).

- **D1. A `FaixaCurta` é alargada** (rótulo no lugar do link de volta, ícone opcional, classe a mais), e não copiada em três faixas novas. O HTML de quem já a usa não muda.
- **D2. O corpo da página de texto sai para `FaixaDoTexto`**, que a notícia aberta usa; `PaginaDeTexto` vira a faixa curta mais a `FaixaDoTexto`. O nome da faixa para o leitor de tela é "Texto da notícia" na notícia.
- **D3. Um texto rico só (`CorpoDoTexto`)** para as páginas de texto e as notícias; `TextoRico` sai. A lista numerada no círculo, a citação e o link do desenho da notícia valem também nas páginas de texto (o link escurece para o `green-800`, e não mais para o `green-700`).
- **D4. A capa 16:9 é recortada pelo CDN** (`rect`), a partir do `hotspot` e do `crop` que a projeção passa a trazer (`urlRecortada`), e não por `object-position` no navegador: o arquivo que desce já é 16:9, e o recorte marcado no Studio também vale.
- **D5. Os cartões e o destaque da lista são recortados pelo meio** (`object-fit: cover`), como na home; só a capa da notícia aberta usa o ponto de interesse. Ver a dúvida 4.
- **D6. O arranjo da lista é o da home** (`arranjoDaLista` sobre `arranjoDasNoticias`), e o `sizes` sai das mesmas funções auxiliares, com a largura dos painéis (1192px) no lugar da coluna da home.
- **D7. "Outras notícias" é sempre três por linha:** com uma ou duas, os cartões ficam do tamanho de um de três, alinhados à esquerda, como a última fileira incompleta da lista. Ver a dúvida 5.
- **D8. Prioridade de carga:** a foto do destaque e a capa baixam logo (`fetchPriority="high"`); as dos cartões e a imagem do texto, ao rolar.
- **D9. A imagem do texto sai na proporção do arquivo**, com o `srcset` de 480 a 1600px e o `sizes` da coluna de leitura (680px; mais larga de 981 a 1180px, onde o índice tem 220px).
- **D10. O canto e o recorte do destaque ficam no link** (`.casca`), e não no `<article>` como no desenho, para o anel de foco não ser cortado.
- **D11. O foco do cartão de notícia vai para o cartão inteiro** só onde o navegador sabe `:has` (`@supports`); onde não sabe, o anel do próprio link fica. Nenhum foco some.
- **D12. O perfil do Instagram vem do endereço** de `lib/ami.ts` (`perfilDoInstagram`), e quebra onde a largura pedir (`overflow-wrap: anywhere`), no lugar do `<wbr>` fixo do desenho.
- **D13. "Como chegar" no contato abre em aba nova**, como a spec do contato (seção 3.3) e o desenho pedem, com `noopener noreferrer` e o aviso "(abre o Google Maps em nova aba)" para o leitor de tela. Isso diverge da D12 de A Associação (mesma aba em "Quem somos" e em "Fale com a AMI"). Ver a dúvida 1.
- **D14. O horário é moldura sem dado nem função:** sai só na demonstração, direto da chave, porque não há campo onde ele morar. Quando a AMI informar, ele entra em `lib/ami.ts` e a moldura vira texto.
- **D15. O fecho do contato fica dentro da faixa da sede**, depois de um fio, como no desenho: um bloco só (`data-bloco="sede"`), e a faixa fecha a página.
- **D16. O contato não tem JSON-LD** (o `MedicalOrganization` é só da home, como antes); a lista mantém o `ItemList` quando há notícia; as três páginas perdem o `BreadcrumbList`.
- **D17. A `Cabeceira`, o `Breadcrumb`, o `breadcrumbList`, a `LinhaNoticia` e o `TextoRico` saem**, com a exceção `ink-300` da paleta. O token `--color-ink-300` fica.
- **D18. Só "Outras notícias" e a sede do contato entram ao rolar** (`.revelar`): nunca estão na primeira tela. A lista, os canais e o corpo da notícia, que abrem logo abaixo da faixa verde, não.
- **D19. As frases que repetem o endereço** ("Pelo telefone, pelo Instagram ou na sede, no Centro de Imperatriz." e "No Centro de Imperatriz, na Rua Coriolano Milhomem.") saem de `lib/ami.ts`, como o "Fale com a AMI" de A Associação.
- **D20. A grade de cartões e a dos canais levam `role="list"`**, como no desenho: sem o marcador, o Safari deixa de anunciar a lista.
- **D21. A auditoria ganha as conferências 17 (cartões de notícia) e 18 (canais)**, as medidas de "irmãos alinhados" do relatório do desenho.

## Dúvidas para o cliente

1. **"Como chegar": aba nova ou a mesma?** A spec do contato pede aba nova (D13); A Associação decidiu a mesma aba (a D12 de lá, aceita no Ruling 1 do diário dela). O site fica com as duas. Unificar? Se sim, qual?
2. **Ver a lista e a notícia no navegador antes da primeira notícia real.** Os estados com notícia só existem nos testes: nenhuma notícia de exemplo foi publicada no Sanity da AMI. Para vê-los antes, a AMI precisaria publicar uma notícia (e despublicar depois) ou o projeto ganhar um dataset de teste no Sanity, o que muda a conta do cliente. Fica para a primeira notícia real?
3. **"MÉDICO" para autoras.** `identificacaoMedica` escreve sempre "MÉDICO", e o schema do autor não tem o campo que diria "MÉDICA". O plano segue o site de hoje. Vale um campo novo numa fatia própria?
4. **Ponto de interesse também nos cartões e no destaque da lista?** Hoje só a capa da notícia aberta usa (D5). Usar nos outros é pequeno (o `hotspot` já vem na consulta), mas muda a home junto, para ficarem iguais.
5. **"Outras notícias" com uma ou duas:** três por linha, alinhadas à esquerda (D7), ou o arranjo da home (uma deitada; duas em duas colunas)?
6. **E-mail e horário da sede** (o relatório do desenho, dúvida 6): a AMI tem? Com o e-mail, entra um quarto cartão, "Escrever"; com o horário, a moldura vira texto.
7. **JSON-LD:** `author.url` para o perfil e `publisher.logo` ficaram fora (spec, seção 5). Entram numa fatia própria?
