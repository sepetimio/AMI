# Verificação das rotas institucionais e editoriais

Data: 2026-08-21. Companheiro de `docs/verificacao-fase-1.md`, que é o
registro fechado da entrega de 20/08 e cobre só as telas anteriores a este
ramo.

**Por que documento separado e não um capítulo a mais no anterior:** aquele
relatório termina em "Passo 10 · Commit" e todas as suas medições têm uma
data e um estado de banco. Enfiar medições de 21/08 no meio delas apagaria a
fronteira entre o que foi medido em cada entrega, que é justamente o que um
relatório de verificação existe para preservar. A estrutura de passos abaixo
é a mesma, para que os dois se leiam do mesmo jeito.

**Rotas cobertas:** `/noticias`, `/noticias/[slug]`, `/associacao`,
`/associacao/diretoria`, `/associacao/[pagina]` (benefícios, estatuto,
política editorial), `/politica-de-privacidade`, `/termos-de-uso`,
`/politica-de-cookies` e `/studio`.

## O que não deu para medir, e por quê

O dataset do Sanity está vazio: nenhuma notícia, nenhum autor, nenhuma
página institucional publicada. Conferido por consulta à API e pelo estado
das rotas. Consequências, todas registradas como não medidas em vez de
afirmadas:

| O que | Situação |
|---|---|
| `/noticias/[slug]` | Sem matéria publicada, todo slug dá 404. Contraste, cabeçalhos e responsividade da tela de matéria seguem sem medição |
| `/associacao/beneficios`, `/estatuto`, `/politica-editorial` | 404 por falta de texto no Sanity, que é o comportamento projetado para prosa pura. Não medidas |
| `/politica-de-privacidade`, `/termos-de-uso`, `/politica-de-cookies` | Mesma causa, mesmo estado. Não medidas |
| `TextoRico` com conteúdo real | Nenhum corpo de texto atravessou o componente. Parágrafo, lista, citação, figura e link ficam sem verificação visual |
| `ItemList` de `/noticias` | Só sai quando há publicações. Coberto por teste, não observado em HTML |
| Link relativo salvo no Studio | Ver a seção do Passo 8 |

O estado vazio de `/noticias` e a página índice `/associacao`, que renderizam
sem depender do Sanity, foram medidos normalmente.

---

## Passo 1 · Suíte, tipos, lint e build

```
npx tsc --noEmit                      → sem erros
npx eslint app components lib sanity  → 0 erros, 3 avisos
npx vitest run                        → 18 arquivos, 242 testes, todos passando
npx next build                        → concluído, 57 páginas estáticas
```

Os 3 avisos são os mesmos `@next/next/no-img-element` já registrados na
verificação de 20/08, em `<img>` de foto de profissional e dos SVGs da marca.
Não são regressão deste ramo.

Suíte sem `.env.local`: 242 testes passando também com o arquivo movido para
fora. É requisito do projeto e foi reexecutado depois das correções desta
onda, que mexeram justamente na leitura de ambiente.

**Rotas do build:**

| Tipo | Rotas |
|---|---|
| Estática (○) | `/`, `/_not-found`, `/associacao`, `/associacao/diretoria`, `/icon.svg`, `/medicos`, `/noticias`, `/politica-de-cookies`, `/politica-de-privacidade`, `/robots.txt`, `/sitemap.xml`, `/studio/[[...tool]]`, `/termos-de-uso` |
| SSG (●) | `/medico/[slug]` × 24, `/associacao/[pagina]` × 3, `/noticias/[slug]` |
| Dinâmica (ƒ) | `/api/revalidar`, `/busca`, `/medicos/[especialidade]`, `/medicos/[especialidade]/[bairro]` |

As três de `/associacao/[pagina]` aparecem como SSG porque
`generateStaticParams` devolve a lista fechada de endereços; em execução elas
chamam `notFound()` enquanto não houver texto no Sanity.

---

## Passo 2 e 3 · Contraste

Recalculado com a fórmula de luminância relativa do WCAG 2.1, em script Node
local, não copiado do relatório anterior. Só os pares que as telas novas
introduzem ou reusam.

| Texto | Fundo | Onde | Medido | Mínimo | Situação |
|---|---|---|---|---|---|
| `ink-900` | `surface` | nome do diretor, título de matéria, h1 e h2 | 16,78:1 | 4,5:1 | aprovado |
| `ink-600` | `surface` | corpo do texto rico, CRM do cartão de diretor | 7,29:1 | 4,5:1 | aprovado |
| `ink-400` | `surface` | legenda de figura, data de atualização, nota do cartão | 5,05:1 | 4,5:1 | aprovado |
| `ami-green-600` | `surface` | cargo do diretor, link dentro do texto rico | 6,52:1 | 4,5:1 | aprovado |
| `ink-900` | `ami-mint-100` | cartão de diretor e cartão de caminho, em hover | 14,77:1 | 4,5:1 | aprovado |
| `ink-600` | `ami-mint-100` | CRM do diretor em hover | 6,42:1 | 4,5:1 | aprovado |
| `ami-green-600` | `ami-mint-100` | cargo do diretor em hover | 5,74:1 | 4,5:1 | aprovado |
| `ami-mint-400` | `ami-green-900` | texto do rodapé | 10,92:1 | 4,5:1 | aprovado |
| `surface` | `ami-green-900` | nome da associação no rodapé | 17,04:1 | 4,5:1 | aprovado |

Fios e bordas (`line` 1,25:1 e `line-strong` 1,59:1 sobre branco) ficam
abaixo de 3:1 e continuam fora do critério 1.4.11: são separadores
decorativos, e nenhum deles é o que identifica um controle. O cartão de
diretor, por exemplo, se identifica pelo conteúdo e pelo estado de hover e
foco, não pela borda.

Nenhuma menta sobre fundo claro nas telas novas: o único `text-ami-mint` do
ramo está dentro do rodapé verde-900.

---

## Passo 4 · Teclado

Medido em `/associacao/diretoria`, que é a tela nova com mais controles.

- Primeira parada do Tab: "Pular para o conteúdo", com 44px de altura quando
  visível e contorno de foco de 2px sólido em verde-600, com 2px de recuo.
  Confirmado que o elemento casa `:focus-visible`
- 41 paradas no total, em ordem de documento: pular, marca, buscar médicos,
  três itens do menu, dois do rastro de navegação, os quatro cartões de
  diretor, e daí o rodapé até a última legal
- Nenhum `tabindex` positivo em nenhuma tela nova. A ordem de foco é a ordem
  do HTML, sem armadilha de foco em lugar nenhum
- Não há diálogo nem gaveta nas telas institucionais, então Esc não tem o que
  fechar. A gaveta de filtros que exige Esc vive em `/medicos`, coberta na
  verificação de 20/08

---

## Passo 5 · Estrutura de cabeçalhos

Extraído do HTML servido, não da leitura do código.

| Rota | h1 | h2 | Salto de nível |
|---|---|---|---|
| `/noticias` | "Notícias da AMI" | "Resultados" (só para leitor de tela), "Ainda não há publicações", e os quatro do rodapé | nenhum |
| `/associacao` | "A Associação Médica de Imperatriz" | "Saiba mais" e os quatro do rodapé | nenhum |
| `/associacao/diretoria` | "Diretoria da AMI" | os quatro do rodapé | nenhum |

Um h1 por tela nas três. Landmarks reais: um `main`, um `footer`, e o
`header` da cabeçalho de página além do `header` do site. `/noticias` e
`/associacao/diretoria` sobem de h1 direto para h2 sem passar por h3 no
corpo, então não há salto.

`/associacao/diretoria` não tem nenhum h2 na região de conteúdo: a grade de
cartões vem logo abaixo da cabeçalho. Não é salto de nível nem violação, mas
fica anotado como diferença em relação a `/noticias`, que marca a região de
resultados com um h2 só para leitor de tela.

---

## Passo 6 · Responsividade a 375px

Viewport de 375 × 812, com emulação de dispositivo móvel.

| Rota | `clientWidth` | `scrollWidth` | Elementos estourando |
|---|---|---|---|
| `/noticias` | 375 | 375 | nenhum |
| `/associacao` | 375 | 375 | nenhum |
| `/associacao/diretoria` | 375 | 375 | nenhum |

Zero rolagem horizontal nas três. A varredura de elementos cuja borda direita
passa do viewport devolveu lista vazia, então não é o caso de um contêiner
estar escondendo o estouro.

**Alvos de toque:** varredura de todo `a`, `button`, `input` e `select` com
altura entre 3 e 44px devolveu lista vazia nas três telas. O único elemento
abaixo do mínimo é o "Pular para o conteúdo" enquanto está oculto (1 × 1px),
que ganha os 44px ao receber foco.

---

## Passo 7 · Zoom e viewport

`content="width=device-width, initial-scale=1"`, sem `maximum-scale` e sem
`user-scalable=no`. Zoom livre.

`prefers-reduced-motion: reduce` continua zerando animação e transição no
`globals.css`, e a única animação de entrada em rolagem (`.revelar`) está
atrás de `prefers-reduced-motion: no-preference`.

---

## Passo 8 · SEO por tela

| Rota | Title | Canonical | JSON-LD |
|---|---|---|---|
| `/noticias` | "Notícias da Associação Médica de Imperatriz \| AMI" (48) | `/noticias` | BreadcrumbList; ItemList só com publicações |
| `/associacao` | "A Associação Médica de Imperatriz \| AMI" (39) | `/associacao` | BreadcrumbList |
| `/associacao/diretoria` | "Diretoria da Associação Médica de Imperatriz \| AMI" (50) | `/associacao/diretoria` | BreadcrumbList |

As três abaixo do limite de 60, todas no molde "| AMI" que a spec fixa.
`/noticias/[slug]` e `/associacao/[pagina]` usam a mesma função de título, com
a cabeça vinda do Sanity, e por isso não puderam ser medidas com texto real.

**Sitemap:** 44 endereços, e as 44 respondem 200. Nenhum 404. As seis páginas
de prosa continuam ausentes porque não existem no Sanity, que é o
comportamento projetado.

**Trava de demonstração:** medida nos dois sentidos, ligando e desligando a
variável no ambiente e recarregando. Com a trava valendo, `robots.txt` sai
`Disallow: /` sem linha de sitemap e o rodapé traz o aviso de dados
fictícios. Com ela desligada, o `robots.txt` abre o site e o aviso do rodapé
some. A variável foi devolvida ao valor original antes de seguir.

**`/studio`:** responde 200 e carrega. A aba do topo sai "Conteúdo", em
português. Continua com `noindex` do próprio `next-sanity` e bloqueada no
`robots.txt` quando a trava de demonstração cai. Sobra em inglês o título da
aba do navegador ("Content | Associação Médica de Imperatriz"), que vem de
outra string do pacote e não do título da ferramenta.

**Link relativo no Studio:** a anotação de link aceitou
`/associacao/diretoria` e o valor persistiu no rascunho. Mas a verificação
ficou inconclusiva pelo lado do controle: nem um esquema recusado
(`ftp://exemplo.com`) produziu marcador de erro visível na janela da
anotação, então "não apareceu erro" não prova nada sozinho. A garantia veio
de outro lugar, e está registrada no relatório da onda: em
`@sanity/schema`, `cloneWithRules` descarta a regra `uri` anterior quando
outra é declarada, e o validador aceita caminho relativo quando
`allowRelative` é verdadeiro. Um teste trava a declaração dos dois schemas.

---

## Estado do banco, e o que ele afeta

A migração `0004_diretoria_crm.sql` ainda não foi aplicada no banco do
usuário. Duas afirmações separadas, porque elas já apareceram misturadas
neste documento:

**A tela está em conformidade desde já.** `/associacao/diretoria` mostra os
quatro CRMs, conferido ao vivo com `curl` e sem nenhum SQL novo rodado. A
exibição resolve o CRM entre duas origens: as colunas próprias da linha, que
mandam quando têm conteúdo, e o perfil ligado como reserva. Os quatro
diretores de demonstração apontam para perfis publicados, então a reserva
entrega o número correto, vindo de `profissional.crm`, que é `not null`.

**A 0004 continua obrigatória, como garantia de escrita.** Sem ela o banco
aceita gravar diretor médico publicado sem inscrição própria, e aí basta o
perfil ligado estar despublicado, ou não existir, para a página sair com nome
de médico sem CRM. A restrição é o que torna esse estado impossível de
gravar. É garantia, não conserto de tela.

Uma versão anterior desta seção afirmava que a página estava mostrando cargo
e nome sem CRM e fora de conformidade. Era verdade por um intervalo, entre
uma correção que passou do ponto e a que a desfez, e ficou escrita aqui
depois de deixar de ser verdade.
