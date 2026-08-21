# Verificação e auditoria de entrega — Fase 1

Data: 2026-08-20. Todas as medições abaixo foram tiradas ao vivo, contra o
banco Supabase de produção (24 profissionais publicados, 14 especialidades,
8 bairros; Clínica Médica com 4 — 3 em Centro —, Cardiologia e Pediatria com
3 cada). Nenhum valor foi copiado de outro documento sem reexecutar a medição.

## Correção aplicada antes da verificação

O link "Por bairro" da home apontava para `/medicos`, que abre no índice de
especialidades — o bloco de bairros fica mais abaixo. Corrigido para
`/medicos#por-bairro` em `app/(site)/page.tsx`. Conferido ao vivo: navegar
para essa URL deixa o elemento `#por-bairro` a -0,5px do topo do viewport
(`scrollY` 6281), ou seja, a âncora pousa exatamente no bloco certo, não no
topo da página.

---

## Passo 1 — Suíte completa e build de produção

```
npm test           → 8 arquivos de teste, 93 testes, todos passando
npx tsc --noEmit    → sem erros
npm run lint        → 0 erros, 3 avisos (ver nota abaixo)
npm run build       → concluído
```

**Nota sobre o lint:** os 3 avisos são `@next/next/no-img-element`, todos em
`<img>` decorativos ou de identidade visual já existentes antes desta tarefa
(`components/diretorio/LinhaMedico.tsx:41` — foto do profissional,
`components/marca/Marca.tsx:17` e `components/marca/Simbolo.tsx:5` — SVGs da
marca). São avisos, não erros — `npm run lint` sai com código 0. Não são
regressão desta tarefa nem foram reintroduzidos por ela; ficam registrados
aqui porque o esperado do Passo 1 era zero avisos e a medição real não bateu
com isso.

**Rotas geradas pelo build:**

| Tipo | Rotas |
|---|---|
| Estática (○) | `/`, `/_not-found`, `/icon.svg`, `/medicos`, `/robots.txt`, `/sitemap.xml` — 6 |
| SSG (●), via `generateStaticParams` | `/medico/[slug]` × 24 (uma por profissional publicado) |
| Dinâmica (ƒ), sob demanda | `/busca`, `/medicos/[especialidade]`, `/medicos/[especialidade]/[bairro]` |

O log do build reporta "Generating static pages using 13 workers (47/47)" —
essa contagem é da fase de geração do Next (inclui a preparação de todas as
rotas, estáticas e dinâmicas); a tabela acima é o que efetivamente sai como
HTML estático (30 páginas: 6 + 24).

---

## Passo 2 e 3 — Contraste

Todos os pares abaixo foram recalculados com a fórmula de luminância relativa
do WCAG 2.1 (não copiados do brief). Ferramenta: script Node.js local
aplicando `srgb(c) = c/12.92` (c ≤ 0,03928) ou `((c+0,055)/1,055)^2,4`, e
`contraste = (L_claro + 0,05) / (L_escuro + 0,05)`. Os oito pares abaixo são
os listados no brief; os seis últimos foram encontrados no código durante a
varredura e não estavam na lista original.

| Texto | Fundo | Medido | Mínimo | Situação |
|---|---|---|---|---|
| `--ink-900` #14201A | `--surface` #FFFFFF | 16,78:1 | 4,5:1 | aprovado |
| `--ink-600` #4B5A51 | `--surface` #FFFFFF | 7,29:1 | 4,5:1 | aprovado |
| `--ink-400` #657268 | `--surface` #FFFFFF | 5,05:1 | 4,5:1 | aprovado |
| `--ami-green-600` #1F6B3A | `--surface` #FFFFFF | 6,52:1 | 4,5:1 | aprovado |
| `--ami-mint-400` #A5DCAF | `--ami-green-800` #0B3018 | 9,28:1 | 4,5:1 | aprovado |
| `--ami-mint-400` #A5DCAF | `--ami-green-900` #06210F | 10,92:1 | 4,5:1 | aprovado |
| `#FFFFFF` | `--ami-green-600` #1F6B3A | 6,52:1 | 4,5:1 | aprovado |
| `--ami-green-700` #123D24 | `--ami-mint-100` #E6F4E9 | 10,75:1 | 4,5:1 | aprovado |
| `#FFFFFF` (H1 do herói) | `--ami-green-800` #0B3018 | 14,48:1 | 4,5:1 | aprovado |
| `#FFFFFF` (títulos do rodapé) | `--ami-green-900` #06210F | 17,04:1 | 4,5:1 | aprovado |
| `--ami-green-600` #1F6B3A (hover de link/chip) | `--ami-mint-100` #E6F4E9 | 5,74:1 | 4,5:1 | aprovado |
| `--ink-600` #4B5A51 (chip neutro / "Fechado agora") | `--canvas` #F4F7F4 | 6,75:1 | 4,5:1 | aprovado |
| `--ami-green-700` #123D24 ("Hoje" na grade de horários) | `--surface` #FFFFFF | 12,22:1 | 4,5:1 | aprovado |
| `--ink-300` #8A968F (placeholder de input, separador `/` decorativo) | `--surface` #FFFFFF | 3,07:1 | 4,5:1 | **reprova**, mas isento — ver nota |

**Nota sobre `--ink-300`:** o único uso é `placeholder:text-ink-300` no campo
de busca da home e o separador `/` do breadcrumb, marcado
`aria-hidden="true"`. Confirmado por grep — não há nenhum outro uso desse
token no projeto. Texto de placeholder e conteúdo puramente decorativo
oculto de leitor de tela não são "texto" para efeito do critério 1.4.3 do
WCAG, então a reprovação numérica não é uma violação real.

**Bônus — opacidade:** `text-ami-mint-400/80` (rodapé, aviso de dados
fictícios) mistura menta a 80% sobre verde-900, o que dá uma cor efetiva
`#85B78F`; contra o próprio verde-900 isso mede 7,44:1 — ainda acima do
mínimo.

**Menta sobre fundo claro (armadilha do projeto):**

```
grep -rn "text-ami-mint" app components | grep -v "green-800\|green-900\|green-700"
```

retornou 3 linhas (não zero, como o esperado ingênuo do grep de uma linha
só):

- `app/(site)/page.tsx:48` e `:55` — dentro da `<section className="...
  bg-ami-green-800 ...">` do herói (linha 41)
- `components/layout/Rodape.tsx:128` — dentro do `<footer className="...
  bg-ami-green-900 ...">` (linha 20)

Conferido manualmente: os três estão de fato dentro de um bloco verde-escuro;
o grep de uma linha não enxerga a classe do elemento pai em JSX
multi-linha. Não há violação real — nenhuma menta sobre fundo claro.

---

## Passo 4 — Teclado

O ambiente de execução não expõe captura de tela do painel do navegador
(`computer{action:"screenshot"}` falha com "Browser pane is not displayed").
A navegação por Tab real não pôde ser fotografada; em vez disso, o
comportamento foi verificado programaticamente no DOM ao vivo (foco real via
`element.focus()`, disparo de clique nos mesmos handlers que Enter/Espaço
acionariam em um `<button>` nativo, e leitura dos atributos ARIA e do CSS
computado):

- **Primeiro Tab revela "Pular para o conteúdo":** confirmado. O primeiro
  elemento focável do DOM (excluindo `tabindex="-1"`) é o link
  `href="#conteudo"` com o texto "Pular para o conteúdo", e sua classe inclui
  `focus:not-sr-only` — ele é `sr-only` (1×1px) até receber foco.
- **Anel de foco visível em tudo:** `app/globals.css` define
  `:focus-visible { outline: 2px solid var(--color-ami-green-600); ... }` em
  `@layer base`, sem seletor de elemento — vale para qualquer coisa que
  receba foco. Busca por `outline-none|focus:outline|outline:\s*none` em todo
  o projeto não encontrou nenhuma sobrescrita. Não há exceção.
- **Gaveta de filtros no mobile:** em `/medicos/clinica-medica` a 390px,
  `document.querySelector('button[aria-controls="campos-filtros"]').click()`
  alterna `aria-expanded` de `"false"` para `"true"` e o painel
  `#campos-filtros` passa de `display:none` para visível; um segundo clique
  devolve `aria-expanded="false"` e esconde o painel de novo. `PainelFiltros`
  usa um `<button type="button">` nativo, então Enter e Espaço acionam o
  mesmo `onClick` por semântica padrão do HTML — não há necessidade de
  handler de tecla separado.
- **Nenhum ponto prende o foco:** busca por `trap|inert|tabIndex|autofocus`
  em todo `app/` e `components/` não encontrou nenhuma ocorrência. Não existe
  lógica de focus trap no projeto.

---

## Passo 5 — Estrutura de headings

Rodado ao vivo no console do navegador em cada uma das seis rotas (as cinco
do brief mais `/busca`, coberta porque é uma das seis formas de rota citadas
no escopo desta tarefa):

**`/`**
```
H1 · Encontre o médico certo em Imperatriz
H2 · Buscar
H2 · Especialidades com mais profissionais
H2 · Acesso rápido
H2 · A entidade que representa os médicos de Imperatriz
H2 · Especialidades
H2 · Bairros
H2 · A Associação
H2 · Contato
```

**`/medicos`**
```
H1 · Médicos em Imperatriz
H2 · Por especialidade
H2 · Por bairro
H2 · Especialidades
H2 · Bairros
H2 · A Associação
H2 · Contato
```

**`/medicos/clinica-medica`**
```
H1 · Clínica Médica em Imperatriz - MA
H2 · Filtrar
H2 · Resultados
H3 · Larissa Nogueira
H3 · Mayara Viana
H3 · Rafael Coelho
H3 · Tiago Barbosa
H2 · Sobre clínica médica
H3 · O que faz este especialista
H3 · Quando procurar
H2 · Navegação relacionada
H3 · Clínica Médica por bairro
H3 · Outras especialidades
H2 · Especialidades
H2 · Bairros
H2 · A Associação
H2 · Contato
```

**`/medicos/clinica-medica/centro`**
```
H1 · Clínica Médica no Centro, Imperatriz - MA
H2 · Resultados
H3 · Larissa Nogueira
H3 · Mayara Viana
H3 · Rafael Coelho
H2 · Clínica Médica em outros bairros de Imperatriz
H2 · Especialidades
H2 · Bairros
H2 · A Associação
H2 · Contato
```

**`/medico/mayara-viana`**
```
H1 · Mayara Viana
H2 · Onde atende
H3 · Centro
H3 · Horários em Centro
H2 · Sobre
H2 · Outros profissionais de clínica médica
H3 · Larissa Nogueira
H3 · Rafael Coelho
H3 · Tiago Barbosa
H2 · Especialidades
H2 · Bairros
H2 · A Associação
H2 · Contato
```

**`/busca?termo=cardio`**
```
H1 · Resultados para "cardio"
H2 · Filtrar
H2 · Resultados
H3 · Beatriz Sampaio
H3 · Camila Freitas
H3 · Otávio Lemos
H2 · Especialidades
H2 · Bairros
H2 · A Associação
H2 · Contato
```

Nas seis páginas: exatamente um `H1`, e nenhum `H3` aparece sem um `H2` antes
dele (os `H2` de rodapé — Especialidades, Bairros, A Associação, Contato —
são cabeçalhos de navegação secundária, esperados no fim do documento).
Nenhum salto de nível em nenhuma página.

---

## Passo 6 — Responsividade

Varredura nas larguras 320, 360, 390, 768, 1024, 1440 e 1920px, usando
`document.documentElement.scrollWidth > clientWidth` como teste de rolagem
horizontal (o script de transbordo por elemento do brief foi usado primeiro,
mas ele aponta falsos positivos estruturais — ver nota abaixo — então a
verificação final é a rolagem horizontal real da página, mais precisa).

Cobertura completa (7 larguras) em `/`, `/medicos`, `/medicos/clinica-medica`,
`/medico/mayara-viana` e `/busca?termo=cardio`. `/medicos/clinica-medica/centro`
foi conferida nas larguras 320, 768 e 1920 — o mesmo padrão de layout de
`/medicos/clinica-medica` já varrido por completo, sem elementos próprios
além dos já cobertos.

**Resultado: nenhuma rolagem horizontal em nenhuma largura, em nenhuma
página testada.**

**Nota sobre o script de transbordo por elemento:** ele aponta 2 elementos na
home a 320px — a `<section>` do herói (que usa `overflow-hidden` de
propósito, para recortar a marca d'água que sangra pela borda) e o `<h2
className="sr-only">` das especialidades mais buscadas (técnica padrão de
título só para leitor de tela, posicionado fora da tela por design). Nenhum
dos dois produz rolagem real (`document.documentElement.scrollWidth` bate
com `clientWidth`) — são falsos positivos do próprio script sugerido, não
transbordo visual.

**Alvos de toque abaixo de 44px** — verificados com
`getBoundingClientRect()` em todo `a,button,input,select,summary,[role="button"]`:

Dois problemas reais foram encontrados e corrigidos:

1. **Logo do cabeçalho** (`components/layout/Cabecalho.tsx`) — o link
   `aria-label="Ir para a página inicial da AMI"` media 50×40px (a marca
   tem 40px de altura e o link não tinha altura mínima própria), enquanto
   os links do menu ao lado usam `min-h-11`. Corrigido: adicionado
   `min-h-11` ao link. Reverificado a 320px — passou a medir 44px de altura.
2. **Links do breadcrumb** (`components/layout/Breadcrumb.tsx`) — o link
   "Início" (e qualquer item de trilha que não seja o último) media 35×25px
   em todas as larguras, em toda página interna. Corrigido: adicionado
   `inline-flex min-h-11 items-center` ao link. Reverificado — passou a medir
   44px de altura (a largura, 35px, é a do próprio texto "Início"; a exceção
   "inline" do critério WCAG 2.5.5 cobre links dentro de um bloco/lista curta
   de texto quando a largura segue o conteúdo).

Dois padrões foram encontrados, revisados e **mantidos sem alteração** por
se enquadrarem em exceções documentadas do próprio WCAG 2.5.5:

- **Título do card de profissional** (`LinhaMedico.tsx`, link do nome dentro
  do `<h3>`, 22px de altura) — a mesma linha já tem um botão "Ver perfil" de
  44px que leva ao mesmo destino. Exceção "Equivalente": a função está
  disponível por outro alvo do tamanho exigido na mesma tela.
- **Links relacionados no perfil** ("Todos de clínica médica", "Clínica
  Médica no Centro" em `app/(site)/medico/[slug]/page.tsx`, 28px de altura)
  — são links dentro de um único `<p>` de navegação relacionada. Exceção
  "inline": alvo dentro de uma frase ou bloco de texto.

Um terceiro padrão foi encontrado, revisado e **mantido de propósito, com
ressalva registrada**: a lista de especialidades e bairros no rodapé
(`Rodape.tsx`) usa `max-md:min-h-11 max-md:py-0` — ou seja, o alvo de 44px só
vale abaixo de `md` (768px). A partir de 768px os 20+ links de especialidade
e 8 de bairro medem 33px de altura cada. Isso está documentado no próprio
código ("O alvo de 44px é regra de toque, então vale abaixo de md. No
desktop a lista fica densa de propósito: vinte itens a 44px dariam quase
novecentos pixels de coluna") — uma decisão consciente de uma tarefa
anterior, não um esquecimento desta. Não foi alterado nesta verificação
porque forçar 44px em 22 links de rodapé a partir de 768px inflaria a coluna
em quase 900px, uma regressão maior do que o problema que resolveria; a regra
de alvo de toque de 44px destina-se a interação por toque, e 768px+ é, na
prática, contexto de mouse na maior parte dos casos. Fica registrado aqui
como exceção conhecida, não como item corrigido.

---

## Passo 7 — Zoom e viewport

```
grep -rn "maximum-scale\|user-scalable" app/
```

Nenhuma linha. `app/globals.css` reforça isso com
`-webkit-text-size-adjust: 100%` e o comentário "Zoom nunca bloqueado."
Confirmado: nada no projeto restringe zoom ou escala do usuário.

---

## Passo 8 — SEO por tela

Dados extraídos ao vivo (`document.title`, `meta[name=description]`,
`link[rel=canonical]`, `meta[name=robots]`, `h1`, tipos de
`script[type="application/ld+json"]`) das seis rotas reais listadas, mais
uma variante `?sabado=1` e uma variante de bairro abaixo do mínimo de
indexação.

| URL canônica | Title | Description | H1 | JSON-LD | Indexável |
|---|---|---|---|---|---|
| `/` | Associação Médica de Imperatriz | 24 médicos e 14 especialidades em Imperatriz - MA. Filtre por especialidade e bairro, e veja horários. | Encontre o médico certo em Imperatriz | Organization | sim |
| `/medicos` | Médicos em Imperatriz - MA \| 24 profissionais \| AMI | 24 médicos em 14 especialidades em Imperatriz - MA. Veja endereço, telefone e horários de atendimento. | Médicos em Imperatriz | BreadcrumbList | sim |
| `/medicos/clinica-medica` | Clínica Médica em Imperatriz - MA \| 4 médicos \| AMI | 4 clínicos gerais em Imperatriz, com atendimento em Centro e Nova Imperatriz. Endereço, telefone e horários. Associação Médica de Imperatriz. | Clínica Médica em Imperatriz - MA | BreadcrumbList + ItemList | sim |
| `/medicos/clinica-medica?sabado=1` | idem | idem | idem | idem | **não** — `robots: noindex, follow`; canonical continua em `/medicos/clinica-medica` |
| `/medicos/clinica-medica/centro` (3 médicos) | Clínica Médica no Centro, Imperatriz - MA \| 3 médicos \| AMI | 3 clínicos gerais em Imperatriz, com atendimento em Centro. Endereço, telefone e horários. Associação Médica de Imperatriz. | Clínica Médica no Centro, Imperatriz - MA | BreadcrumbList + ItemList | sim |
| `/medicos/clinica-medica/nova-imperatriz` (1 médico) | Clínica Médica no Nova Imperatriz, Imperatriz - MA | 1 clínico geral em Imperatriz, com atendimento em Nova Imperatriz. Endereço, telefone e horários. Associação Médica de Imperatriz. | Clínica Médica no Nova Imperatriz, Imperatriz - MA | BreadcrumbList + ItemList | **não** — `robots: noindex, follow`; canonical aponta para `/medicos/clinica-medica` |
| `/medico/mayara-viana` | Mayara Viana - Clínica Médica em Imperatriz - MA \| AMI | Mayara Viana, Clínica Médica, em Imperatriz - MA. Atende em Centro. Veja CRM, endereço, telefone e horários de atendimento. | Mayara Viana | Physician + BreadcrumbList | sim |

Todos os pares título/descrição vieram de `lib/seo/metadados.ts`, gerados
dos dados reais (contagens, nomes de bairro) — nada escrito à mão para esta
verificação.

---

## Passo 9 — Auto-auditoria anti-IA

**1. Cor** — verificado por leitura de `app/globals.css` (única fonte de
cor do projeto) e grep por `gradient|blur-|backdrop-blur|from-blue|to-purple`
em todo `app/` e `components/`: nenhuma ocorrência. Não há gradiente
azul-roxo, texto em gradiente, blob, mesh ou glow em lugar nenhum. A paleta é
inteiramente os tokens verde/menta/tinta documentados — nenhuma cor padrão
de framework (sem os azuis/roxos default do Tailwind ou de UI kits
genéricos). Nada foi ajustado, porque nada foi encontrado.

**2. Layout** — confirmado: a home abre com o herói assimétrico (texto em 7
das 12 colunas, `grid-cols-12`), não com um herói centralizado. As quatro
seções da home (herói, chips de especialidade, "Acesso rápido" em fios,
faixa institucional) têm quatro estruturas visivelmente diferentes — nenhuma
repete o padrão kicker → H2 centralizado → três cartões (aliás, nenhuma seção
do site usa cartões com sombra: o padrão aqui é fio de 1px). O respiro
vertical varia: `pb-24 pt-14 md:pb-32` no herói, `py-12` nos chips, `pb-14`
no acesso rápido, `py-20` na faixa institucional — não é o mesmo valor
repetido. As demais quatro estruturas descritas no desenho original
("lista densa em duas colunas", "Você é médico?", "últimas notícias") são
explicitamente Plano 2, não desta fase — não foram construídas, e não
deveriam ser. Nada foi ajustado.

**3. Componentes** — inventário completo de `components/`: nenhum cartão de
feature com ícone em quadradinho arredondado, nenhum depoimento, nenhuma
faixa de logos, nenhum acordeão de FAQ genérico, nenhum bloco "Pronto para
começar?" (grep confirmou ausência dessas frases). Toda contagem exibida
(médicos, especialidades, bairros) vem de `especialidadesComContagem()` e
`bairrosComContagem()`, lidas do banco — nada escrito à mão. Onde o dado
real ainda não existe (endereço da sede, telefone, CNPJ, revisor médico), o
texto está marcado `[PROVISÓRIO]` — confirmado em `Rodape.tsx` e
`medicos/[especialidade]/page.tsx`. Nada foi ajustado.

**4. Tipografia** — `lib/fontes.ts` confirma Archivo (títulos, eixo `wdth`
variável, comprimida 80–87,5%) e Source Sans 3 (corpo, 400/600) via
`next/font/google`. Grep por `Inter|Geist|Poppins` em todo o projeto: zero
ocorrências. O salto de tamanho é grande de propósito (`h1` 34/48px, `h2`
26/32px, corpo 17px — ver `globals.css`). Texto corrido é alinhado à
esquerda: única ocorrência de `text-center` em todo `app/`+`components/` é o
card de estado vazio (`EstadoVazio.tsx`), que não é texto corrido, é uma
mensagem curta centralizada num bloco isolado. Nada foi ajustado.

**5. Movimento** — grep por `animate-|hover:scale|scale-105|carousel` em
todo o projeto: zero ocorrências. Não há animação de entrada em rolagem, nem
`scale` em hover, nem número animado (as contagens são renderizadas direto
do servidor, sem contador incremental client-side), nem carrossel em lugar
nenhum. O único componente client-side com estado (`GradeHorarios`,
`SeloAbertoAgora`, `PainelFiltros`) muda de estado por dado real (dia da
semana, horário de funcionamento, filtro ativo), não por decoração. Nada foi
ajustado.

**6. Texto** — varredura por clichês comuns de texto gerado por IA
("revolucionário", "inovador", "sinergia", "solução completa", "de ponta",
"jornada", "não é apenas... é", "state-of-the-art", "seamless", "empower",
"unlock", "leverage") em todo `app/` e `components/`: zero ocorrências. Não
há um documento formal de "lista de palavras banidas" no repositório — a
varredura foi qualitativa, contra os clichês mais comuns de texto
institucional genérico em português e inglês. Nenhum título do site
serviria para outro setor: todos citam Imperatriz, CRM, especialidade
médica ou bairro nominalmente. Nenhum rótulo de botão é vago — são sempre
"Ver perfil", "Ligar 99 0000-0000", "Buscar", nunca "Saiba mais" ou "Clique
aqui". Nada foi ajustado.

**7. Código** — os passos 6 e 3 acima já cobrem transbordo (nenhum, 320 a
1920px) e contraste (todos os pares acima do mínimo, com uma exceção isenta
e documentada). Espaçamento: grep por valores arbitrários de margem/padding
(`m-[Npx]`, `p-[Npx]`, `gap-[Npx]`) em `app/` e `components/` não encontrou
nenhuma ocorrência — a escala usada é sempre a do Tailwind. `alt` de imagem:
três usos de `<img>` no projeto, nenhum genérico — `alt=""` decorativo e
`aria-hidden` no símbolo da marca (correto, é decorativo), `alt="Associação
Médica de Imperatriz"` na marca do cabeçalho, `alt={`Retrato de
${medico.nome}`}` dinâmico por profissional. Estado vazio: `EstadoVazio` é
usado em `ListaMedicos.tsx`, que atende `/medicos`, `/medicos/[esp]`,
`/medicos/[esp]/[bairro]` e `/busca` — toda lista de resultados tem estado
vazio desenhado. Durante esta varredura, dois alvos de toque abaixo de 44px
foram encontrados (logo do cabeçalho, links de breadcrumb) e corrigidos —
ver Passo 6 para o detalhe; a suíte, o `tsc` e o `build` foram
reexecutados depois da correção e continuam limpos.

### As três perguntas

**Qual decisão de layout desta home só faz sentido para uma associação
médica de Imperatriz, e para nenhum outro site?** O cartão de busca que
invade a faixa verde do herói mostra, ao vivo, "24 médicos em 14
especialidades, atendendo em 8 bairros" e um seletor de bairro com os nomes
reais de Imperatriz (Centro, Bacuri, Nova Imperatriz, Juçara, Maranhão Novo,
Parque do Buriti, Santa Rita, Vila Lobão) — não um placeholder de "sua
cidade" nem uma lista genérica, então a home muda de conteúdo (e, se um
bairro some do cadastro, de opções) junto com o banco de dados desta
associação específica.

**Removendo a marca e o texto, ainda dá para reconhecer que é este
projeto?** Sim: a assinatura visual — herói assimétrico com o cartão de
busca cavalgando a borda inferior da faixa verde, sendo a única sombra em
repouso do site inteiro, e o resto das telas em linhas separadas por fio de
1px em vez de cartões — não se repete em nenhum template genérico que eu
conheço; é uma combinação estrutural específica, não decoração aplicada por
cima de um layout comum.

**Qual é o elemento mais genérico que sobrou, e por que foi mantido?** O
`Chip` (pílula com borda arredondada e texto curto) é o componente mais
comum do inventário — o mesmo padrão existe em praticamente qualquer design
system. Foi mantido porque cumpre uma função real e específica (mostrar
"Associado AMI", bairro, telemedicina e acessibilidade lado a lado numa
linha de resultado densa) e usa só os tokens de cor do projeto, não um
estilo default de framework — é genérico na forma, não na cor nem no
propósito.

---

## O que fica fora desta verificação

`/associacao` não existe — é dívida assumida do Plano 3, e cabeçalho e
rodapé linkam para ela sabendo disso (ver `task-22-brief.md`, seção final).
Não foi criada aqui. As demais seções da home, `/clinicas` e afins, painel,
área do associado e as tabelas de vida associativa seguem fora de escopo,
conforme já registrado no brief desta tarefa.

---

## Correções da revisão de branch

Treze defeitos apontados por uma revisão do branch inteiro (`fase-1-diretorio`
contra `main`), aplicados e verificados nesta ordem. Servidor local reiniciado
sempre que a mudança dependia de variável de ambiente ou de cache do
Turbopack; medições contra o mesmo banco de 24 profissionais do topo deste
documento.

**1. Trava de indexação para dados de demonstração.** `app/robots.ts` agora lê
`NEXT_PUBLIC_DADOS_DEMONSTRACAO` (`process.env.NEXT_PUBLIC_DADOS_DEMONSTRACAO
!== "false"`, então o padrão é demonstração) e, enquanto verdadeiro, devolve
`disallow: "/"` sem linha de sitemap. Adicionada a `.env.example` (comentada)
e a `.env.local`, ambas como `true`. Verificado: com a flag em `true`,
`/robots.txt` respondeu

```
User-Agent: *
Disallow: /
```

Com a flag em `false` (servidor reiniciado), voltaram as regras normais:

```
User-Agent: *
Allow: /
Disallow: /api/
Disallow: /painel/
Disallow: /_next/

Sitemap: http://localhost:3000/sitemap.xml
```

A flag foi devolvida a `true` em `.env.local` antes de seguir para o item
seguinte, e voltou a produzir o `disallow: "/"` acima — confirmado de novo
antes do commit.

**2. Chip de bairro em `/medicos` levava a um link morto.** O `href` mudou de
`/medicos?bairro=${b.slug}` (página que nunca lê `searchParams`) para
`/busca?bairro=${b.slug}`, igual ao rodapé. Verificado: o `href` do chip
"Centro" no DOM de `/medicos` é `/busca?bairro=centro`; navegar direto para
essa URL devolve "8 profissionais encontrados" — a contagem batendo com
"Centro · 8" mostrado no próprio chip.

**3. Especialidade sem profissional publicado renderizaria uma página
indexável de zeros.** `app/(site)/medicos/[especialidade]/page.tsx` ganhou a
mesma condição `medicos.length === 0` do cruzamento, em `generateMetadata`
(retorna `{}`) e no corpo (`notFound()`), com o comentário explicando o
sintoma evitado — H1 de verdade sobre "reúne 0 médicos". Verificado por
leitura do código, como o brief antecipou: o dataset publicável não tem
nenhuma especialidade com zero profissionais para acionar o caminho ao vivo.

**4. Contagem total dobrava um profissional com duas especialidades.** As
quatro ocorrências (`generateMetadata` e corpo de `app/(site)/page.tsx` e de
`app/(site)/medicos/page.tsx`) trocaram
`especialidades.reduce((s, e) => s + e.total, 0)` por
`(await buscarMedicos()).length`, cada uma reaproveitando a mesma consulta
memoizada com `Promise.all`. Verificado ao vivo: a home mostra "24 médicos em
14 especialidades" e `/medicos` mostra "24 profissionais em 14
especialidades" — o título da aba também lê "24 profissionais". Consultado o
banco diretamente (`profissional_especialidade`): as 24 linhas têm 24
`profissional_id` distintos, ou seja, nenhum profissional tem hoje duas
especialidades — a soma antiga e a contagem nova coincidem no dataset atual,
então este item não tem como divergir visualmente sem inserir um segundo
registro em `profissional_especialidade`; a garantia fica na leitura do
código (a soma por especialidade foi removida das quatro origens).

**5. Qual endereço um médico "tem" era não determinístico.** `SELECAO`, em
`lib/dados/medicos.ts`, ganhou `.order("id", { foreignTable: "atendimento" })`
na consulta — sintaxe verificada por chamada direta ao PostgREST
(`atendimento.order=id.asc` responde 200; a forma alternativa
`order=atendimento(id)` responde `PGRST118`, "not possible" para embed
um-para-muitos, então essa é a única forma válida). `paraDominio` passou a
ordenar `locais` pelo próprio `id` do local como segunda garantia,
independente do banco. Verificado: `tsc --noEmit` limpo, a suíte completa
passa, `/medicos/cardiologia` e `/medicos/cardiologia/centro` renderizam com
os números certos (3 e 2 cardiologistas). O dataset publicável não tem hoje
nenhum profissional com mais de um endereço (`atendimento`: 24 linhas, 24
`profissional_id` distintos) — não há como fotografar a instabilidade
"antes" nem confirmar a estabilidade "depois" com dado ao vivo; a garantia é
de leitura de código e do teste de tipos, não de uma medição comportamental.

**6. Duas páginas indexáveis podiam emitir a mesma description.** Novo
`descricaoFaceta(especialidade, bairro, total)` em `lib/seo/metadados.ts`,
que nomeia o bairro na própria frase, usado só pelo cruzamento
(`[especialidade]/[bairro]/page.tsx`); a especialidade continua com
`descricaoEspecialidade`. Teste novo em `testes/metadados.test.ts` comparando
`descricaoEspecialidade("Pediatria", 3, ["Centro"])` com
`descricaoFaceta("Pediatria", "Centro", 3)` — passam, e são diferentes.
Verificado ao vivo em `/medicos/cardiologia/centro`: description
"2 cardiologistas no bairro Centro, Imperatriz - MA. Endereço, telefone e
horários de atendimento. Associação Médica de Imperatriz."

**7 e 8. Artigo antes do nome do bairro.** Trocado `em ${bairro}` por
`no bairro ${bairro}` (ou `nos bairros X e Y`, plural) em
`descricaoEspecialidade` e `descricaoMedico`; e `no ${bairro}` por
`no bairro ${bairro}` em `tituloFaceta`, no `<h1>` do cruzamento e no `onde`
de `paragrafoDeAbertura` (`lib/dados/facetas.ts`). Como "bairro" é sempre
masculino, a forma concorda para qualquer nome, incluindo os femininos do
dataset real. Verificado ao vivo em `/medicos/cardiologia/centro`: título da
aba "Cardiologia no bairro Centro, Imperatriz - MA | 2 médicos", H1
"Cardiologia no bairro Centro, Imperatriz - MA", parágrafo de abertura "…
reúne 2 cardiologistas no bairro Centro, no Maranhão, …". Testes antigos que
liam "no Centro" foram atualizados para "no bairro Centro", e foram
adicionados testes específicos com "Nova Imperatriz" (nome feminino)
confirmando "no bairro Nova Imperatriz" e a ausência de "no Nova Imperatriz"
bruto, em `tituloFaceta`, `descricaoEspecialidade`, `descricaoMedico` e
`paragrafoDeAbertura`.

  **Comprimento do título mais longo real** — "Ginecologia e Obstetrícia" em
  "Parque do Buriti", 3 médicos: `tituloFaceta` devolve
  `"Ginecologia e Obstetrícia no bairro Parque do Buriti"` — **52
  caracteres**, dentro do limite de 60 (`montar` descarta a cidade e o sufixo
  antes de precisar cortar palavra). Os testes de comprimento existentes
  (`respeita o limite`, `truncamento`) continuam passando com a frase maior
  que "no bairro" introduz — em um caso (`tituloFaceta("Cardiologia",
  "Centro", 4)`) o resultado passou a sair sem o sufixo `| AMI`
  (63 caracteres estourava o limite de 60; sem o sufixo, 57), e o teste
  correspondente foi atualizado para refletir esse valor real, não o antigo.

  **Escopo não coberto por este item, registrado para não confundir com
  esquecimento:** o brief da revisão listou exatamente estes cinco lugares
  (`descricaoEspecialidade`, `descricaoMedico`, `tituloFaceta`, o `<h1>` do
  cruzamento, e o `onde` de `paragrafoDeAbertura`). Há pelo menos mais dois
  usos de `no ${bairro}` bruto no código com o mesmo defeito, fora dessa
  lista e por isso não tocados aqui: a frase de concentração dentro do
  próprio `paragrafoDeAbertura` (`... no ${principais[0].nome}.`) e o link
  "{especialidade} no {bairro}" da seção de relacionados em
  `app/(site)/medico/[slug]/page.tsx`. Ambos ficam corretos hoje só porque
  nenhum bairro do dataset atual força a leitura errada nesses dois pontos
  específicos, mas o padrão "no Nova Imperatriz" que os motivou aparecerá ali
  também.

**9. `/busca` sugeria remover um filtro que não existia.** A escolha de
`filtroMaisRestritivo` deixou de ser um ternário `termo ? "termo digitado" :
"bairro"` (que nomeava bairro mesmo sem filtro de bairro) e passou a checar,
em ordem, `acessibilidade`, `bairro`, `termo`, `telemedicina` e
`somenteAssociados` antes de cair em `undefined` — mesmo raciocínio já usado
na página de especialidade, estendido aos filtros que só `/busca` tem.
Verificado com a URL exata do brief,
`/busca?acessibilidade=interprete_libras`: "0 profissionais encontrados" e
"Tente remover o filtro de acessibilidade — costuma ser o que mais reduz a
lista."

**10. Anel de foco quadrado em chip arredondado.** A regra fixa
`border-radius: 2px` em `:focus-visible` (`app/globals.css`) virou
`border-radius: revert-layer`, que devolve o raio que o próprio elemento já
tem por sua classe `rounded-*` (a camada `utilities` do Tailwind v4 já vence
a camada `base` onde `:focus-visible` vive, então isso torna explícito um
comportamento que a ordem de camadas já produzia, em vez de depender
implicitamente dela). Um piso de `2px` foi adicionado só para elementos sem
nenhuma classe `rounded-*`, via `:focus-visible:not([class*="rounded-"])`.
Verificado com foco real via teclado (`Tab`, não `.focus()` programático) e
leitura de `getComputedStyle`: num chip de bairro focado,
`border-radius: 999px`; num link de texto comum focado (sem classe
`rounded-*`), `border-radius: 2px`. O ambiente não expõe captura de tela do
navegador nesta sessão (mesma limitação já registrada no Passo 4), então a
forma visual do anel em si — e não só o raio computado da caixa — não pôde
ser fotografada.

**11. Rodapé sem saída além da vigésima especialidade.** Adicionado um item
final "Ver todas as especialidades" → `/medicos` à lista de especialidades do
rodapé, mostrado só quando `especialidades.length > 20`. Verificado por
leitura do código: o dataset publicável tem 14 especialidades, então o item
não aparece hoje — condição confirmada lendo `Rodape.tsx`, não fotografada ao
vivo.

**12. Cruzamento não anotava bairro-irmão abaixo do corte.** A lista "em
outros bairros" de `[especialidade]/[bairro]/page.tsx` ganhou a mesma
anotação "(menos de 3)" da página de especialidade, usando
`facetaEhIndexavel` e `MINIMO_PARA_INDEXAR`. Verificado ao vivo em
`/medicos/cardiologia/centro`: a seção "Cardiologia em outros bairros de
Imperatriz" mostra "Bacuri · 1 (menos de 3)".

**13. Comentário de teste com data errada.** `testes/horarios.test.ts` dizia
"Terça-feira, 19/08/2026" sobre uma fixture com `2026-08-18`. Corrigido para
"Terça-feira, 18/08/2026" — confirmado que 18/08/2026 cai numa terça-feira
(`Date.prototype.toLocaleDateString` com `weekday: "long"`).

### Verificação final

```
npx tsc --noEmit    → sem erros
npm run lint         → 0 erros, 3 avisos (os mesmos <img> pré-existentes do Passo 1)
npm test              → 8 arquivos, 99 testes, todos passando
npm run build         → concluído, mesmas 30 páginas estáticas do Passo 1
```

`.env.local` termina esta tarefa com `NEXT_PUBLIC_DADOS_DEMONSTRACAO=true`
(não versionado — `.gitignore` cobre `.env*.local`).

---

## Passo 10 — Commit

Arquivos alterados nesta tarefa:

- `app/(site)/page.tsx` — âncora `#por-bairro` no link "Por bairro" (correção
  pedida) e `components/marca/Simbolo.tsx` (sem alteração de conteúdo,
  pré-existente)
- `components/layout/Cabecalho.tsx` — `min-h-11` no link da logo (alvo de
  toque abaixo do mínimo)
- `components/layout/Breadcrumb.tsx` — `min-h-11` nos links de trilha (alvo
  de toque abaixo do mínimo)
- `docs/verificacao-fase-1.md` — este relatório
