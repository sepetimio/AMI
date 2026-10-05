# Estado do projeto — Site da Associação Médica de Imperatriz

> Atualizado em 4 de outubro de 2026 · ramo `paginas-encontre` (a reforma visual, fatia B, grupos 1 a 5), feito a partir de `redesign-visual` (fatia A); nada vai para a `main` até todas as páginas estarem reformadas
> Repositório: `github.com/sepetimio/AMI`
> Especificação: [`docs/superpowers/specs/2026-08-19-site-ami-diretorio-design.md`](superpowers/specs/2026-08-19-site-ami-diretorio-design.md)

Este arquivo responde três perguntas: **o que existe**, **o que falta**, e **quem precisa fazer o quê**. É o ponto de retomada quando o trabalho parar e voltar depois.

---

## Em uma frase

O site está **funcional e verificado**, com todas as páginas públicas redesenhadas (a home, aprovada pelo cliente, e as internas, juntadas à `main` em 04/10/2026 e esperando a revisão do cliente das decisões tomadas sem ele), o diretório médico completo, o blog, as páginas institucionais e o painel de conteúdo da AMI. Ele **não pode ir ao ar ainda**, e o que falta é conteúdo e cadastro, não código.

---

## O que existe e funciona

### Diretório médico

| Endereço | O que é |
|---|---|
| `/` | Home, na ordem do desenho aprovado: carrossel, os números da AMI (quatro, com as empresas parceiras), a busca numa faixa verde, Sua AMI, Seja associado com "Quem é a AMI?", últimas notícias e empresas parceiras |
| `/medicos` | Índice de especialidades |
| `/medicos/{especialidade}` | Página de faceta, indexável, com parágrafo de abertura gerado dos dados reais e a grade de cartões da busca |
| `/medicos/{especialidade}/{bairro}` | **Saiu.** O endereço antigo leva, com redirecionamento permanente (308), à página da especialidade, e não está mais no sitemap |
| `/medico/{slug}` | Perfil novo (fatia B): retrato, CRM, especialidade com RQE, Ligar e WhatsApp do consultório principal, "Onde atende", "Sobre", "Outros médicos" e a nota final |
| `/busca` | Busca nova (fatia B), fora do índice de propósito: faixa verde com o campo "Nome ou especialidade" e a lista de especialidades, contagem e grade de cartões, sempre em ordem alfabética |

A busca entende variação de nome de profissão: quem digita "cardiologista" encontra Cardiologia.

### Conteúdo editorial e institucional

| Endereço | O que é | Estado |
|---|---|---|
| `/noticias` e `/noticias/{slug}` | Notícias: a lista com a mais recente em destaque, e a notícia com a assinatura (CRM), a capa em 16:9 e "Outras notícias"; dado estruturado para o Google | no ar; sem notícia publicada, a lista mostra as molduras no modo demonstração e "Nenhuma notícia publicada ainda." fora dele |
| `/associacao` | Página-índice da associação | no ar |
| `/associacao/diretoria` | Diretoria, com cargo, nome e CRM, ligada aos perfis | no ar |
| `/associacao/seja-associado` | Como se associar | no ar, com **texto provisório marcado**, sem valor de anuidade nem lista de benefícios |
| `/contato` | Fale com a AMI: os dois telefones e o Instagram em cartões, e a sede com o endereço, o CNPJ e "Como chegar", tudo de `lib/ami.ts` | no ar; a foto da sede e o horário de atendimento aparecem como moldura só no modo demonstração |
| `/associacao/{beneficios,estatuto,politica-editorial}` | Páginas de texto | **404 até a AMI escrever** |
| `/politica-de-privacidade`, `/termos-de-uso`, `/politica-de-cookies` | Páginas legais | no ar, com **rascunho não revisado** e aviso visível |
| `/studio` | Painel de conteúdo do Sanity, em português | no ar |

### Fundação

- **Next.js 16** com renderização no servidor em toda página indexável
- **Supabase** para o diretório, com as permissões escritas como políticas no banco e não como regra de tela: erro de front não vaza dado
- **Sanity** para o que se escreve, com atualização imediata do site por webhook quando a AMI publica
- **1169 testes** em 72 arquivos, sitemap com 44 endereços e nenhum fora de 200 (medido em 03/10/2026, no fim do grupo 1 da fatia B, com `next build` + `next start`; eram 45 antes de saírem as páginas de especialidade por bairro)
- **A base visual da reforma** (fatia A, ver abaixo): fundo branco-gelo `#EEF1EF`, blocos
  brancos, títulos em Bricolage Grotesque, texto em Plus Jakarta Sans, botões em pílula com
  degradê do verde da marca. O creme de 23/08/2026 saiu, porque o cliente o leu como
  "desbotado", e o `ami-lima-100` foi apagado. `testes/paleta.test.ts` lê os tokens de
  `app/globals.css`, recalcula cada razão de contraste a cada rodada e reprova sozinho se
  algum par cair abaixo de 4,5:1. O par mais apertado é `ink-400` sobre o fundo da página,
  4,73:1 (spec da reforma, seção 4, medido em 03/10/2026)
- **O que o teste de cor ainda não cobre**, para quem for mexer nele: as duas listas —
  os tokens de texto e os fundos — são escritas à mão. Um fundo novo que ninguém
  acrescentar ali passa despercebido. Derivar as duas de um grep por `text-<token>` e
  `bg-<token>` continua pendente

### Conformidade

- **Resolução CFM 2.336/2023**: todo nome de médico sai com CRM e a palavra MÉDICO; RQE só onde há registro; nenhum ranking, nota ou comparação em lugar nenhum do site
- **Critério YMYL do Google**: autoria com CRM, datas visíveis, aviso de conteúdo informativo
- **LGPD**: nenhuma tela coleta sintoma ou diagnóstico

### Reforma visual — fatia A (a base e a home)

Feita no ramo `redesign-visual`, em 03/10/2026, a partir do desenho que o cliente aprovou
depois de doze rodadas ([`docs/desenho-aprovado/`](desenho-aprovado/)). Decisões em
[`docs/superpowers/specs/2026-10-03-redesign-visual-design.md`](superpowers/specs/2026-10-03-redesign-visual-design.md).

- **A base, que vale para o site inteiro**: cores, fontes, botões, as réguas de espaço
  (margem 48/28/20px e espaço entre blocos 72/56/32px, de computador a celular), o
  cabeçalho fino preso ao topo, o menu em gaveta abaixo de 1180px, o rodapé verde com
  textura e a barra de atalhos no pé do celular ("Encontrar médico" e "Ligar")
- **A home inteira como no desenho**, com o carrossel novo (giro contínuo, pausa, dedo no
  celular, controles centrados sob o botão do slide)
- **Conferida no navegador em produção** (`next build` + `next start`) em oito larguras,
  de 375 a 1920px, com `scripts/auditoria-visual.js`: nada passa da borda, nenhum botão
  quebra linha, o texto de todas as seções começa na mesma linha vertical (a 1440px, em
  172px, a mesma do logotipo), o espaço entre blocos é o mesmo em toda a página (72, 56
  e 32px), cabeçalho no topo do começo ao fim, um único `h1`, nenhum `id` repetido. Com
  a chave de demonstração ligada e desligada. A foto da página inteira a 1440px e a
  390px bate com o desenho seção por seção, tirando as fotos de banco, que no site são
  molduras
- O contraste do texto do rodapé foi medido de novo, com o grão da textura e a luz que
  passeia: o pior ponto do texto em branco a 92% fica em 6,36:1 (a 1920px), acima dos
  4,5:1 exigidos

**As outras páginas** mudaram de tom e de fonte sozinhas, mas mantêm o arranjo antigo até
a fatia B. Foram todas abertas a 390 e 1440px: nada passa da borda e todo texto é
legível. O que ficou feio, mas legível, e espera a fatia B:

- **A animação de entrada prende o conteúdo desbotado na primeira tela.** Ela é presa à
  rolagem: um bloco que já abre na tela fica parado no meio dela, meio transparente e
  borrado, até a pessoa rolar. Medido com a página recém-aberta: em `/medicos`, a lista
  "Por especialidade" abre a 64% de opacidade a 375px, 75% a 390px e 91% a 430px (a
  1920px, a lista de bairros a 30%); no perfil do médico, os blocos de baixo da primeira tela
  ("Sobre" e vizinhos) abrem entre 21% e 98%, conforme a largura (375, 390, 768, 1440 e
  1920px). Na home isso
  foi resolvido tirando a animação de quem pode aparecer na primeira tela; nas outras
  páginas, a fatia B deve trocar a animação por uma que só anime o que entra depois do
  carregamento
- **A coluna do texto não é a da home.** A 1440px, o texto das páginas internas começa
  em 144px, e o logotipo do cabeçalho em 172px
- **A Cabeceira (o topo branco das páginas internas) seguida de uma faixa cinza** com
  cartões brancos, o arranjo de antes, e não o tratamento por seção da home
- O painel (`/painel`) herdou fonte e cor, e o formulário de entrar continua inteiro e
  legível. O botão "Entrar" dele é verde chapado; o painel está fora da reforma

### Encontre um médico — fatia B, grupo 1 (a busca e o perfil)

Feito no ramo `paginas-encontre`, em 03/10/2026, a partir do desenho que o cliente aprovou
("gostei, pode aplicar igual está ali"): [`docs/desenho-aprovado/encontre/`](desenho-aprovado/encontre/).
Decisões em [`docs/superpowers/specs/2026-10-03-encontre-um-medico-design.md`](superpowers/specs/2026-10-03-encontre-um-medico-design.md).

**O que mudou no site**

- **A busca e o perfil novos, sem a Cabeceira cinza** (o topo que o cliente recusou duas
  vezes). A busca abre com a faixa verde com textura; o perfil, com o retrato e o nome
  direto sobre o fundo, e o menu marca "Encontre um médico" nos dois
- **Só associados**: o selo "Associado AMI" e o filtro "Somente associados" saíram. O dado
  continua no banco e no painel
- **Só dois filtros**, "Nome ou especialidade" e a lista de especialidades, e a lista sai
  **sempre em ordem alfabética**, o que a página diz ("Em ordem alfabética"). Endereços
  antigos com `bairro`, `telemedicina`, `acessibilidade`, `associados` ou `ordem` abrem a
  busca sem esses filtros, sem erro
- **Bairros, telemedicina e acessibilidade fora do site.** Continuam no banco e no painel.
  O bairro só aparece como parte do endereço do consultório no perfil
- **A home**: sem o bloco de bairros, e a faixa branca do fim só com as empresas
  parceiras. A faixa de números tem **quatro** quando há parceiras (ou, no modo
  demonstração, as seis de exemplo) e **três** fora dele sem nenhuma cadastrada
- **As páginas de especialidade por bairro acabaram**: o endereço antigo
  (`/medicos/cardiologia/centro`) responde 308 e leva a `/medicos/cardiologia`, e o
  sitemap não lista mais nenhum
- **Nenhuma página abre rolada.** Ao chegar pelo menu, `/busca` abria a 456px, `/medicos` a
  427, `/associacao` a 392, `/contato` a 282 e `/noticias` a 182. A causa era o Next 16 com a
  rolagem suave do site: ele só a desliga na troca de página se o `<html>` tiver
  `data-scroll-behavior="smooth"`, que agora tem (`app/layout.tsx`)

**O que a AMI precisa saber**

- **Todo médico terá foto.** Enquanto não houver, o cartão e o perfil mostram as iniciais
  em verde-lima sobre o verde da marca, no mesmo tamanho da foto, com ou sem modo
  demonstração (é o estado real de quem ainda não mandou foto, não uma moldura "a entrar")
- **O envio da foto pelo painel é a próxima fatia** e depende do armazenamento de arquivos
  do Supabase, que ainda não está configurado
- **"MÉDICO" para todos**, como antes. "MÉDICA" para as médicas depende de a AMI confirmar
  a forma à luz da Resolução CFM

**Pendências do cliente** (só ele pode fazer: pedem a conta do Sanity)

1. Abrir o site em `/studio` e entrar com a conta do Sanity. Na coluna da esquerda, a lista
   de conteúdos, conferir que aparece **"Empresa parceira"**, junto de "Banner da home" e
   das notícias.
2. Em [sanity.io/manage](https://www.sanity.io/manage), clicar no projeto da AMI, depois
   em **API** e, nela, em **Webhooks**. Abrir o webhook que aponta para o site (o mesmo
   do campo **Secret**, em [`docs/como-remontar-o-ambiente.md`](como-remontar-o-ambiente.md))
   e olhar o campo **Filter** (o painel do Sanity é em inglês):
   - vazio: nada a fazer;
   - com uma lista de tipos (algo como `_type in ["banner", "noticia", ...]`):
     acrescentar `"empresaParceira"` à lista e salvar a alteração no botão de salvar da
     própria tela do webhook (o nome dele, em inglês como o resto do painel, não foi
     conferido). Sem isso, a parceira cadastrada demora até uma hora para
     aparecer no site.
3. De volta ao `/studio` (em português: o projeto liga a tradução do Studio, `ptBRLocale`,
   em `sanity.config.ts`), clicar em **Empresa parceira** e, no alto da lista, no botão de
   criar documento novo. Preencher **Nome**, **Logotipo** (arquivo **PNG**, de preferência
   com fundo transparente; JPEG e WebP também entram, SVG não), **Site** (opcional) e **Ordem**
   (opcional; sem ordem, as parceiras vêm pelo nome), e clicar em **Publicar**. Repetir
   para cada parceira.

**Os números medidos** (produção, `next build` + `next start`, com
`scripts/auditoria-visual.js`, nas oito larguras de 375 a 1920px; cada número abaixo saiu
de uma rodada de 03/10/2026). Nenhum problema em nenhuma das 80 rodadas com a chave de
demonstração ligada (`/busca`, `/busca?especialidade=cardiologia`, `/busca?termo=zzzz`,
o perfil de dois consultórios, `/`, `/medicos`, `/medicos/cardiologia`, `/associacao`,
`/contato` e `/noticias`), nem nas 24 com ela desligada (`/busca`, o perfil e `/`):

| Largura | Espaço entre blocos | Coluna do texto | Logotipo | Fileiras de cartões alinhadas (busca, sem filtro) |
|---|---|---|---|---|
| 375, 390, 430 | 32px | 32px | 28px | 24 (um cartão por linha) |
| 768 | 56px | 52px | 52px | 12 |
| 1024 | 72px | 72px | 72px | 8 |
| 1280 | 72px | 92px | 92px | 6 |
| 1440 | 72px | 172px | 172px | 6 |
| 1920 | 72px | 412px | 412px | 6 |

- O mesmo espaço vale entre os dois blocos da busca e entre os cinco do perfil; a coluna
  do texto é a mesma em todos os blocos e no rodapé. Acima de 700px, o texto começa na
  linha do logotipo; até 700px, o logotipo fica 4px à esquerda, como na home aprovada
- **Abertura no topo**: 1120 medidas (de cada página auditada, a cada largura, pelo menu,
  vindo de outra página parada no topo e no meio), todas em 0. Medida também com cliques
  de verdade (Chrome sem janela, a 1440 e a 390px, pelo menu e pela gaveta): as cinco
  páginas em 0, vindo do topo e do meio da home. Tirando o atributo, a mesma medida
  volta a dar 427 (`/medicos`), 392 (`/associacao`), 345 (`/contato`) e 369 (`/noticias`)
  a 1440px
- **Contraste sobre a faixa verde da busca**, medido em pixel na posição real de cada
  texto, com o grão médio e a luz que passeia no ponto mais claro do caminho dela
  (1440, 768, 430 e 320px; pior caso de cada texto):

  | Texto | Pior razão | Onde |
  |---|---|---|
  | texto de apoio (#cfd8c9) | 5,14:1 | 430px |
  | "Filtro:" (#cfd8c9) | 6,35:1 | 430px |
  | pílula do filtro (branco) | 9,20:1 | 430px |
  | rótulo "ENCONTRE UM MÉDICO" (lima clareado, celular) | 4,75:1 | 320px |

  Todos acima de 4,5:1. No pico do grão (um pixel isolado), o rótulo a 320px fica em
  4,41:1, o mesmo caso já aceito na home (o critério é o grão médio)

**Dúvidas que ficaram em aberto** (decididas na execução; o cliente pode mudar)

1. O perfil perdeu o breadcrumb visível, e o `BreadcrumbList` saiu do dado estruturado
   junto: dado estruturado sem o correspondente na tela é o que o Google trata como
   marcação enganosa
2. `availableService: Telemedicina` saiu do dado estruturado do perfil, pela mesma razão
3. O texto de abertura das especialidades ficou curto (cerca de 50 palavras, eram 90 a
   200) sem bairro, telemedicina, acessibilidade e associados. Fica assim até o desenho do
   grupo 2 (Especialidades), que decide o texto. Até lá a página é mais rasa para o Google
4. Números da home no celular com três: dois na primeira linha e o terceiro na largura
   toda (três lado a lado não cabem "especialidades" a 375px). Com quatro, dois e dois,
   como na home aprovada. **Mostrar ao cliente**
5. "Outros médicos de X" só pela especialidade principal: um cardiologista com pediatria
   secundária não aparece em "Outros médicos de Pediatria"
6. O logotipo fica 4px à esquerda do texto no celular, como na home aprovada; fica para a
   revisão final do último grupo

### Especialidades — fatia B, grupo 2 (o índice e a página de cada especialidade)

Feito no ramo `paginas-encontre`, em 03/10/2026. O cliente escolheu o conteúdo e autorizou
seguir pelas diretrizes já aprovadas; o desenho foi aprovado contra elas:
[`docs/desenho-aprovado/especialidades/`](desenho-aprovado/especialidades/). Decisões em
[`docs/superpowers/specs/2026-10-03-especialidades-design.md`](superpowers/specs/2026-10-03-especialidades-design.md);
as tomadas sem o cliente, em [`docs/decisoes-sem-o-cliente.md`](decisoes-sem-o-cliente.md).

**O que mudou no site**

- **O índice (`/medicos`) e a página de cada especialidade novos, sem a Cabeceira cinza.**
  Os dois abrem com a faixa verde com textura, como a busca
- **O índice em ordem alfabética** (antes, pela quantidade de médicos), com um ícone por
  especialidade e o campo de busca "Nome ou especialidade" na faixa. Cada cartão leva à
  página da especialidade, e todos têm a mesma altura
- **A página de cada especialidade**: o ícone grande na faixa (some no celular), um
  parágrafo curto ("A Associação Médica de Imperatriz reúne 3 cardiologistas em Imperatriz,
  no Maranhão. Cada perfil traz o número de registro no Conselho Regional de Medicina."),
  a grade de cartões da busca e o bloco "Sobre a {especialidade}", que vem do Sanity.
  **O cartão mostra a especialidade da página**, com o RQE dela: na página de Ortopedia, a
  Dra. Aline Peixoto (neurologista, com Ortopedia como segunda especialidade) aparece como
  "Ortopedia e Traumatologia". Na busca e no perfil continua a especialidade principal
- **Sem "Outras especialidades"** no fim da página
- **O site deixou de ler `o_que_faz` e `quando_procurar` do banco.** As duas colunas
  continuam lá; o cliente decide se saem

**O que a AMI precisa saber**

- **O "Sobre" de cada especialidade é escrito e revisado por médico** e cadastrado no
  Studio, com o nome e o CRM do revisor e a data da revisão. O texto só aparece com os seis
  campos preenchidos
- **Enquanto não houver texto**, a página mostra "Texto da AMI a entrar." no modo
  demonstração e não mostra o bloco fora dele: a grade de médicos fecha a página
- **Especialidade nova** recebe o estetoscópio como ícone. Para o parágrafo dizer
  "3 cardiologistas" em vez de "3 médicos de X", o nome do profissional (no singular e no
  plural, como "cardiologista" e "cardiologistas") precisa entrar na tabela de sinônimos
  (`lib/dados/sinonimos.ts`); isso é trabalho de quem cuida do código, não do Studio

**Pendências do cliente** (só ele pode fazer: pedem a conta do Sanity)

1. Abrir o site em `/studio` e entrar com a conta do Sanity. Na coluna da esquerda, a lista
   de conteúdos, conferir que aparece **"Texto de especialidade"**, junto de
   "Empresa parceira".
2. Em [sanity.io/manage](https://www.sanity.io/manage), clicar no projeto da AMI, depois
   em **API** e, nela, em **Webhooks**. Abrir o webhook que aponta para o site e olhar o
   campo **Filter** (o painel do Sanity é em inglês):
   - vazio: nada a fazer;
   - com uma lista de tipos (algo como `_type in ["banner", "noticia", ...]`):
     acrescentar `"textoDeEspecialidade"` à lista e salvar a alteração na própria tela do
     webhook. Sem isso, o texto cadastrado demora até uma hora para aparecer no site.
3. De volta ao `/studio`, clicar em **Texto de especialidade** e, no alto da lista, no
   botão de criar documento novo. Preencher:
   - **Especialidade**: o fim do endereço da página, como `cardiologia` para
     `/medicos/cardiologia`;
   - **O que faz**;
   - **Quando procurar**;
   - **Revisado por**: o nome do médico revisor;
   - **CRM do revisor**, escrito como "CRM/MA 12345";
   - **Data da revisão**.

   Depois, clicar em **Publicar**. Repetir para cada especialidade: são as 14 do índice.

**Os números medidos** (produção, `next build` + `next start`, com
`scripts/auditoria-visual.js`, nas oito larguras de 375 a 1920px; cada número abaixo saiu
de uma rodada de 03/10/2026). Nenhum problema em nenhuma das 56 rodadas com a chave de
demonstração ligada (`/medicos`, `/medicos/cardiologia`, `/medicos/ortopedia-e-traumatologia`,
`/medicos/clinica-medica`, e, para conferir que nada voltou atrás, `/busca`, o perfil de
dois consultórios e `/`), nem nas 16 com ela desligada (`/medicos` e `/medicos/cardiologia`).
A auditoria agora confere também os cartões do índice: a mesma altura em todos, e o nome e
a contagem na mesma linha em cada fileira.

| Largura | Espaço entre blocos | Coluna do texto | Logotipo | Fileiras do índice | Altura dos cartões do índice | Fileiras de cartões de médico (Cardiologia / Clínica Médica) |
|---|---|---|---|---|---|---|
| 375, 390, 430 | 32px | 32px | 28px | 7 | 166,8px | 3 / 4 |
| 768 | 56px | 52px | 52px | 7 | 205,3px | 2 / 2 |
| 1024 | 72px | 72px | 72px | 5 | 230,6px | 1 / 2 |
| 1280 | 72px | 92px | 92px | 4 | 230,6px | 1 / 1 |
| 1440 | 72px | 172px | 172px | 4 | 230,6px | 1 / 1 |
| 1920 | 72px | 412px | 412px | 4 | 230,6px | 1 / 1 |

- O mesmo espaço vale entre todos os blocos das duas páginas, e a coluna do texto é a
  mesma em todos eles e no rodapé. Em cada fileira, os "Ligar" dos cartões de médico ficam
  na mesma altura
- **Do último bloco ao rodapé**: 0 na página da especialidade com o "Sobre" (a faixa branca
  encosta no rodapé, como na home); com a chave desligada, sem o "Sobre", a grade termina
  a um espaço entre blocos do rodapé (32, 56 e 72px). No índice, o mesmo espaço, nas duas
  chaves
- **Abertura no topo**: 1008 medidas da auditoria (14 por rodada, pelo menu, vindo de outra
  página parada no topo e no meio), todas em 0. Com cliques de verdade (Chrome sem janela,
  a 1440 e a 390px, pelo menu e pela gaveta): da home e da busca até `/medicos`, de
  `/medicos` até Cardiologia pelo cartão, e de Cardiologia de volta pelo "← Especialidades",
  pelo menu e até a busca, os 22 casos em 0. Tirando o atributo da rolagem, os casos vindos
  do meio da página voltam a abrir rolados (156px a 1440, 94px a 390)
- **Contraste sobre as duas faixas verdes novas**, medido em pixel na posição real de cada
  texto, com o grão médio e a luz que passeia no ponto mais claro do caminho dela
  (1440, 768, 430 e 320px; pior caso de cada texto):

  | Texto | Pior razão | Onde |
  |---|---|---|
  | linha de apoio do índice (#cfd8c9) | 4,99:1 | 430px |
  | parágrafo da especialidade (#cfd8c9) | 4,84:1 | 430px |
  | rótulo "ESPECIALIDADES" (lima; lima clareado no celular) | 5,27:1 | 320px |
  | link "← ESPECIALIDADES" (lima; lima clareado no celular) | 5,19:1 | 320px |

  Todos acima de 4,5:1, também no pico do grão (o menor, 4,52:1, é o parágrafo da
  especialidade a 430px). No branco, o cinza #646B75 da contagem do cartão, da linha da
  revisão e do "Texto da AMI a entrar." dá 5,38:1

**Dúvidas que ficaram em aberto** (decididas na execução; o cliente pode mudar)

1. **O `BreadcrumbList` saiu das duas páginas**, como saiu do perfil: elas não têm trilha
   na tela. O `ItemList` dos médicos continua na página da especialidade. Se o cliente
   quiser a trilha de volta no Google, ela precisa voltar à tela
2. **No "Sobre" sem texto** (só na demonstração), a frase "Conteúdo informativo; não
   substitui a consulta médica." fica
3. **Especialidade de nome masculino**: o título é "Sobre a {nome}" quando o nome termina
   em "a" (as 14 de hoje); senão, "Sobre a especialidade"
4. **As duas gotas**: Endocrinologia (gota pela metade) e Urologia (gota inteira) ficam
   como estão. Se parecerem iguais demais na tela, a Urologia pode passar ao estetoscópio
5. **Os ajustes pequenos que o grupo 1 deixou** (o 0 nos números da home, o "Como chegar"
   de meia largura, os espaços no fim do endereço, as barras sem `:has`, o teste do limite,
   o mesmo bairro e uma régua única para a coluna) entram na correção final deste grupo,
   que ainda não foi feita
6. **O contraste do parágrafo da especialidade**, mais largo que o texto da busca: ficaria
   decidido subir a opacidade do texto se desse menos de 4,5:1. Deu 4,84:1, e nada mudou

### A Associação — fatia B, grupo 3 (a página institucional, a diretoria e as páginas de texto)

Feito no ramo `paginas-encontre`, em 03 e 04/10/2026. O cliente estava fora e autorizou seguir
pelas recomendações; o desenho foi aprovado contra as diretrizes já aprovadas:
[`docs/desenho-aprovado/associacao/`](desenho-aprovado/associacao/). Decisões em
[`docs/superpowers/specs/2026-10-03-associacao-design.md`](superpowers/specs/2026-10-03-associacao-design.md);
as tomadas sem o cliente, em [`docs/decisoes-sem-o-cliente.md`](decisoes-sem-o-cliente.md).

**O que mudou no site**

- **`/associacao`, `/associacao/diretoria`, Seja associado e os três textos legais novos**, sem
  a Cabeceira cinza, sem trilha e sem `BreadcrumbList`
- **A Associação**: a faixa verde com os três números (anos, médicos e especialidades);
  "Quem somos" com a sede, "Como chegar" e o telefone; Missão, visão e valores; a diretoria em
  destaque; "Saiba mais"; e o convite para se associar
- **A diretoria** nos cartões da busca, com o cargo acima do nome e "Ver perfil"
- **As páginas de texto num modelo só**: faixa verde curta, corpo numa coluna de leitura,
  índice "Nesta página" (à direita no computador, recolhido no alto abaixo de 980px) e o aviso
  de rascunho em cinza neutro. No rascunho, o telefone, o CNPJ e o CEP no meio do texto não quebram no meio
- **Seja associado** com o quadro "Fale com a AMI" e os dados da entidade em lista
- **Nenhum "[PROVISÓRIO]" na tela**: o que falta nos rascunhos aparece como "a entrar", em
  cinza e itálico, só no modo demonstração. Nos textos legais, aparece nos dois modos (ver
  "Decisões que valem para várias páginas" em [`docs/decisoes-sem-o-cliente.md`](decisoes-sem-o-cliente.md))
- **A `Cabeceira` e o `Breadcrumb`** continuam só no contato e nas notícias; a `Placa` saiu.
  Depois, os dois saíram também de lá (ver "Notícias e Contato", abaixo)
- **Toda moldura "a entrar" do site leva a marca `data-a-entrar`** no HTML, também na home
  (os logotipos e as notícias) e no "Sobre" das especialidades, sem mudar nenhum pixel. É por
  ela que a auditoria conta as molduras

**O que a AMI precisa saber**

- **"Saiba mais"** mostra Estatuto e Política editorial só quando a página existir no Studio
- **Fora do modo demonstração**, o que a AMI ainda não entregou some da página em vez de
  aparecer vazio: a apresentação, a foto da sede, Missão, visão e valores e o período da gestão
- **O WhatsApp** entra em "Fale com a AMI" quando a AMI confirmar o número

**Pendências do cliente** (os passos 1 a 3 pedem a conta do Sanity; os outros, uma resposta
da AMI)

1. **A apresentação oficial.** Abrir o site em `/studio` e entrar com a conta do Sanity. Na
   coluna da esquerda, clicar em **Página institucional** e, no alto da lista, no botão de
   criar documento novo. Preencher:
   - **Título**: "A Associação Médica de Imperatriz";
   - **Endereço**: `associacao` (a ajuda do campo diz "A Associação (texto da apresentação)");
   - **Resumo**: de 60 a 220 caracteres; aparece na busca do Google;
   - **Atualizado em**: a data do texto;
   - **Texto**: a apresentação.

   Depois, clicar em **Publicar**. Abrir `/associacao`: o texto aparece em "Quem somos", no
   lugar de "Texto da AMI a entrar.".
2. **Estatuto e Política editorial.** Os mesmos passos do item 1, com **Endereço**
   `estatuto` e, depois, `politica-editorial`. Publicada, cada página ganha o link em
   "Saiba mais", em `/associacao`.
3. **O webhook.** Em [sanity.io/manage](https://www.sanity.io/manage), clicar no projeto da
   AMI, depois em **API** e, nela, em **Webhooks**. Abrir o webhook que aponta para o site e
   olhar o campo **Filter** (o painel do Sanity é em inglês):
   - vazio: nada a fazer;
   - com uma lista de tipos: conferir que `"paginaInstitucional"` está nela, acrescentar se
     não estiver e salvar na própria tela do webhook. Sem isso, a página publicada demora até
     uma hora para aparecer.
4. **A foto da sede.** Pedir à AMI a foto descrita em `lib/imagens.ts` (`ESPACOS.sede`, campo
   `precisa`): a fachada da sede, ou uma reunião da diretoria, horizontal, com pelo menos
   1600px de largura. Quem receber salva o arquivo em `public/imagens/sede-ami.jpg` e troca
   `provisoria` para `false` no mesmo lugar.
5. **Missão, visão e valores.** Pedir à AMI os três textos. Eles entram em `lib/molduras.ts`
   (`TEXTO_INSTITUCIONAL`), e aparecem na home e em A Associação.
6. **O texto da anuidade.** Pedir à AMI o valor da anuidade, os benefícios e os critérios de
   admissão. Eles entram pelo Studio, como no item 1, com **Endereço** `seja-associado`: o
   texto publicado substitui o rascunho inteiro, então ele precisa trazer também o que o
   rascunho já diz.
7. **O período da gestão** da diretoria atual: a data de início e a de fim do mandato. Ver a
   dúvida 1, abaixo.
8. **O WhatsApp:** perguntar à AMI se o celular (99) 98802-0205 atende por WhatsApp.
9. **O encarregado de dados** da política de privacidade: a AMI precisa designar a pessoa (o
   artigo 41 da Lei 13.709/2018 exige) e informar o nome e o contato. Eles entram no texto
   revisado pelo advogado, publicado no Studio como no item 1, com **Endereço**
   `politica-de-privacidade`. Até lá, a frase que pede o encarregado aparece em cinza e
   itálico, como tudo o que falta nos rascunhos.

**Próximo passo de código** (não depende do cliente): o banco já tem as colunas
`mandato_inicio` e `mandato_fim` na tabela `diretoria`, vazias, e o site ainda não as lê.
Preenchidas, a pílula da faixa da diretoria vira "Gestão 2025–2027", numa tarefa pequena que
precisa decidir de qual linha sai o período (a da presidência, por exemplo).

**Os números medidos** (produção, `next build` + `next start`, com
`scripts/auditoria-visual.js`, nas oito larguras de 375 a 1920px; cada número abaixo saiu de
uma rodada de 04/10/2026). Nenhum problema nas 88 rodadas com a chave de demonstração ligada
(as seis páginas do grupo e, para conferir que nada voltou atrás, `/`, `/busca`, `/medicos`,
`/medicos/cardiologia` e `/contato`), nem nas 48 refeitas nas seis páginas do grupo depois das
correções, nem nas 32 com ela desligada (`/associacao`, `/associacao/diretoria`, Seja
associado e a política de privacidade). A auditoria agora confere também os atalhos de "Saiba
mais" (a mesma altura, e o título e a seta na mesma linha, em cada fileira) e o índice "Nesta
página" (rolando até cada título, o item dele fica marcado).

| Largura | Espaço entre blocos | Coluna do texto | Logotipo | Fileiras de cartões de diretor | Fileiras de atalhos |
|---|---|---|---|---|---|
| 375, 390, 430 | 32px | 32px | 28px | 4 | 3 |
| 768 | 56px | 52px | 52px | 2 | 2 |
| 1024 | 72px | 72px | 72px | 2 | 1 |
| 1280 | 72px | 92px | 92px | 1 | 1 |
| 1440 | 72px | 172px | 172px | 1 | 1 |
| 1920 | 72px | 412px | 412px | 1 | 1 |

- O mesmo espaço vale entre todos os blocos das seis páginas, e a coluna do texto é a mesma
  em todos eles e no rodapé. Em cada fileira de cartões de diretor, os "Ver perfil" ficam na
  mesma altura, em `/associacao` e na diretoria
- **Do último bloco ao rodapé**: 0 em `/associacao` e nas páginas de texto (a faixa branca
  encosta no rodapé); na diretoria, um espaço entre blocos (32, 56 e 72px)
- **O índice "Nesta página"** aparece à direita acima de 980px e marca o item de cada
  título ao rolar até ele: Seja associado com 3 itens, privacidade com 9, termos com 7 e
  cookies com 5. A 1920px, os títulos do fim da página não chegam à linha de leitura, porque a
  página acaba antes; ali vale o último marcado no fim da página
- **Abertura no topo**: 14 medidas por rodada da auditoria, pelo menu, vindo de outra página
  parada no topo e no meio, todas em 0. Com cliques de verdade (Chrome sem janela, a 1440 e a
  390px, pelo menu, pela gaveta, pelos botões das páginas e pelo rodapé), 15 caminhos por
  largura entre a home, a busca, as três páginas e os textos legais, vindo do topo, do meio ou
  do fim: os 30 casos em 0, também durante a chegada. Tirando o atributo da rolagem, os casos
  que partem de uma página rolada voltam a abrir rolados (156px a 1440, 94px a 390)
- **Contraste sobre as faixas verdes**, medido em pixel na posição real de cada texto, com o
  grão médio e a luz que passeia no ponto mais claro do caminho dela (1440, 768, 430 e 320px;
  pior caso de cada texto):

  | Texto | Pior razão | Onde |
  |---|---|---|
  | parágrafo da faixa de A Associação (#cfd8c9) | 5,14:1 | 430px |
  | parágrafo das faixas curtas (#cfd8c9) | 4,61:1 | Seja associado, 430px |
  | rótulo "A ASSOCIAÇÃO" (lima; lima clareado no celular) | 5,17:1 | 320px |
  | link "← A ASSOCIAÇÃO" e "← INÍCIO" (idem) | 5,40:1 | diretoria, 320px |
  | rótulos dos números (#DDE7D6) | 7,48:1 | 430px |
  | "Gestão" (#DDE7D6) | 6,00:1 | 430px |
  | "(período a entrar)" (#B9C6B2) | 5,12:1 | 430px |

  Todos acima de 4,5:1 no grão médio, o critério já usado na home e nas outras faixas. No
  pico do grão (um pixel isolado), o parágrafo das faixas curtas a 430px fica em 4,33:1. No
  branco e no cinza claro: o cinza #646B75 da data, do título do índice e do texto a entrar dá
  5,38:1; o #4F5661 sobre o fundo do quadro e da etiqueta, 6,90:1; e, no quadro "Fale com a
  AMI", o #4F5661 dá 6,51:1 e o verde #0D2E0C, 13,07:1

**Dúvidas que ficaram em aberto** (decididas na execução; o cliente pode mudar)

1. **Mandato.** O banco tem `mandato_inicio` e `mandato_fim`, vazias. Decidido não ler agora:
   a pílula "Gestão (período a entrar)" sai só na demonstração, e ler as colunas fica para o
   próximo passo de código, acima
2. **Diretoria em destaque com quatro.** Decidido: os quatro primeiros, na ordem da AMI; a
   lista inteira fica em "Ver a diretoria"
3. **O encarregado de dados na política de privacidade.** Decidido: nos textos legais, o que
   falta aparece marcado "a entrar" nos dois modos, para o texto legal não esconder em
   silêncio um item obrigatório
4. **"Atualizado em" num rascunho legal**, como no desenho, e não mais "Rascunho de".
   Decidido assim; o quadro logo abaixo continua dizendo que é rascunho
5. **Ícone de Política editorial**: o de artigo, como no desenho (a spec falava em caneta ou
   jornal)
6. **Unificar a faixa da especialidade com a faixa curta deste grupo**: fica para a correção
   final deste grupo, se não mudar nada na tela. Ainda não foi feita

### Notícias e Contato — fatia B, grupos 4 e 5 (a lista, a notícia aberta e o contato)

Feito no ramo `paginas-encontre`, em 03 e 04/10/2026. O cliente estava fora e autorizou seguir
pelas recomendações. Desenho em [`docs/desenho-aprovado/noticias-contato/`](desenho-aprovado/noticias-contato/);
decisões em [`docs/superpowers/specs/2026-10-03-noticias-contato-design.md`](superpowers/specs/2026-10-03-noticias-contato-design.md)
e em [`docs/decisoes-sem-o-cliente.md`](decisoes-sem-o-cliente.md).

**O que mudou no site**

- **`/noticias`, a notícia aberta e `/contato` no desenho novo**, sem a cabeceira cinza, sem
  trilha e sem `BreadcrumbList`
- **A lista**: a mais recente em destaque, as outras em cartões, no arranjo da home para poucas
  notícias. Sem notícia, as molduras "Notícia a entrar" no modo demonstração, ou "Nenhuma
  notícia publicada ainda." fora dele
- **A notícia aberta**: a assinatura com o CRM na faixa verde, a capa em 16:9 recortada pelo
  ponto de interesse, o texto na coluna de leitura das páginas de texto, com o índice "Nesta
  página", quem assina no fim e "Outras notícias"
- **O contato**: os dois telefones e o Instagram em cartões, a sede com o endereço, o CNPJ e
  "Como chegar", e o convite para se associar. A foto da sede e o horário de atendimento
  aparecem como moldura só no modo demonstração
- **A cabeceira cinza e a trilha saíram do site inteiro**: a `Cabeceira`, o `Breadcrumb`, o
  `TextoRico` e a `LinhaNoticia` foram apagados
- **Correções da conferência final** (04/10/2026), para o site bater com o desenho: os
  parágrafos do contato e da lista não deixam mais uma palavra sozinha na última linha; o CEP
  da sede sai com algarismos de largura igual, no contato e em "Quem somos"; a seta de "Ver
  todas as notícias" ficou do tamanho da letra do botão, também na home; e a linha "MÉDICO ·
  CRM" do fim da notícia ficou no cinza do texto

**O que ainda não foi visto com notícia de verdade**

A AMI não publicou nenhuma notícia, e nenhuma de exemplo foi publicada no Sanity dela. A lista
com notícias e a notícia aberta são provadas pelos testes (`testes/lista-de-noticias.test.ts`,
com 1, 2, 3, 4 e 7 notícias, e `testes/noticia-aberta.test.ts`). Na conferência final, elas
foram vistas também no navegador, com as notícias de exemplo do desenho numa página temporária,
apagada antes do commit: a auditoria passou nas oito larguras, e as fotos bateram com o
desenho, tirando o título do destaque no celular (ver "Dúvidas", abaixo). A primeira notícia
real precisa de uma olhada no navegador, a 1440 e a 390px, contra
`docs/desenho-aprovado/noticias-contato/noticias-1440-parte-*.jpg` e `noticia-1440-parte-*.jpg`.

**O que a AMI precisa saber**

- **A capa da notícia sai em 16:9**: o ponto de interesse marcado na imagem de capa, no Studio,
  decide o que não pode ser cortado
- **A lista mostra até 20 notícias**; a 21ª só se acha pelo endereço direto, até entrar "Mais
  antigas"
- **O e-mail, o WhatsApp e o horário de atendimento** entram no contato quando a AMI os informar

**Pendências do cliente** (os passos 1 a 3 pedem a conta do Sanity; os nomes dos campos são os
do Studio, e o botão de criar documento novo fica no alto da lista)

1. **O autor.** Abrir o site em `/studio` e entrar com a conta do Sanity. Na coluna da esquerda,
   clicar em **Autor** e criar um documento novo. Preencher **Nome**, **CRM** (só os números),
   **UF do CRM** e, se o médico tem perfil no diretório, **Endereço do perfil no diretório** (o
   fim do endereço do perfil, por exemplo `mayara-viana`). Clicar em **Publicar**.
2. **A primeira notícia.** Na coluna da esquerda, clicar em **Notícia** e criar um documento
   novo. Preencher **Título**, **Endereço**, **Resumo** (de 60 a 220 caracteres), **Imagem de
   capa** com a **Descrição da imagem** e o ponto de interesse marcado na própria imagem,
   **Autor**, **Publicado em** e **Texto**. Clicar em **Publicar**. Abrir `/noticias`: as
   molduras somem e a notícia aparece em destaque.
3. **O webhook.** Em [sanity.io/manage](https://www.sanity.io/manage), clicar no projeto da AMI,
   depois em **API** e, nela, em **Webhooks**. Abrir o webhook que aponta para o site e olhar o
   campo **Filter** (o painel do Sanity é em inglês):
   - vazio: nada a fazer;
   - com uma lista de tipos: conferir que `"noticia"` e `"autor"` estão nela, acrescentar se não
     estiverem e salvar na própria tela do webhook. Sem isso, a notícia publicada demora até uma
     hora para aparecer.
4. **O horário de atendimento da sede** e **o e-mail de contato**, se houver: pedir à AMI. Entram
   em `lib/ami.ts`, e o contato ganha o horário no lugar da moldura e um quarto cartão,
   "Escrever".
5. **A foto da sede** (`ESPACOS.sede`, `lib/imagens.ts`): a mesma de A Associação, agora também
   no contato.

**Os números medidos** (produção, `next build` + `next start`, com
`scripts/auditoria-visual.js`, nas oito larguras de 375 a 1920px; cada número abaixo saiu de uma
rodada de 04/10/2026). A auditoria agora confere também os cartões de notícia (em cada fileira, a
mesma altura, a foto terminando na mesma linha, e a data e o título começando na mesma linha) e os
canais do contato (em cada fileira, o ícone, o rótulo e o dado começando na mesma linha, e o
botão terminando na mesma linha). Como esta é a última conferência da reforma, ela rodou no site
inteiro: as 13 páginas públicas (`/`, `/busca`, um perfil, `/medicos`, `/medicos/cardiologia`,
`/associacao`, a diretoria, Seja associado, as três páginas legais, `/noticias` e `/contato`)
mais a página temporária com as notícias de exemplo, com as duas chaves.

| Largura | Espaço entre blocos | Coluna do texto | Logotipo | Fileiras de cartões de notícia (`/noticias`, demonstração) | Fileiras de canais (`/contato`) |
|---|---|---|---|---|---|
| 375, 390, 430 | 32px | 32px | 28px | 3 | 3 |
| 768 | 56px | 52px | 52px | 2 | 3 |
| 1024 | 72px | 72px | 72px | 1 | 1 |
| 1280 | 72px | 92px | 92px | 1 | 1 |
| 1440 | 72px | 172px | 172px | 1 | 1 |
| 1920 | 72px | 412px | 412px | 1 | 1 |

- **Espaço entre blocos**: um vão em `/noticias` (a faixa e a lista) e dois em `/contato` (a
  faixa, os canais e a sede), todos iguais à régua da largura. A coluna do texto é a mesma em
  todos os blocos e no rodapé
- **Do último bloco ao rodapé**: a régua (32, 56 e 72px) em `/noticias`, porque a lista não é
  faixa; 0 em `/contato`, porque a sede é faixa. Na notícia aberta, a régua com "Outras
  notícias", e 0 quando o texto fecha a página
- **Fora do modo demonstração**, `/noticias` não tem cartão (0 fileiras), e o contato fica igual,
  sem a foto e sem o horário
- **Com as notícias de exemplo** (a página temporária): sete notícias dão duas fileiras de três
  cartões acima de 980px, três de 701 a 980px e seis no celular; o índice "Nesta página" marca
  os dois títulos ao rolar
- **Abertura no topo**: 14 medidas por rodada da auditoria, todas em 0, tirando `/noticias` sem
  notícia a 1920 × 1080px (ver "A auditoria do site inteiro", abaixo). Com cliques de verdade
  (Chrome sem janela, a 1440 e a 390px, pelo menu, pela gaveta, pelos botões das páginas e pelo
  rodapé), 16 caminhos por largura entre a home, a busca, uma especialidade, um perfil,
  `/noticias`, `/contato`, A Associação, a diretoria, a privacidade e a notícia de exemplo,
  vindo de uma página rolada: os 32 casos em 0, também durante a chegada. Tirando o atributo da
  rolagem, os casos que partem de uma página rolada voltam a abrir rolados (156px a 1440, 94px a
  390)
- **Contraste sobre as faixas verdes**, medido em pixel na posição real de cada texto, com o
  grão médio e a luz que passeia no ponto mais claro do caminho dela (1440, 768, 430 e 320px;
  pior caso de cada texto):

  | Texto | Pior razão | Onde |
  |---|---|---|
  | parágrafo da faixa de `/noticias` (#cfd8c9) | 4,64:1 | 430px |
  | parágrafo da faixa de `/contato` (#cfd8c9) | 4,78:1 | 430px |
  | resumo da notícia aberta (#cfd8c9) | 5,13:1 | 430px |
  | rótulo "NOTÍCIAS" e "CONTATO" (lima clareado, celular) | 5,56:1 e 5,64:1 | 320px |
  | "← NOTÍCIAS" da notícia aberta (lima clareado, celular) | 5,23:1 | 320px |
  | "MÉDICO · CRM" e a data da assinatura (#DDE7D6) | 8,20:1 | 430px |

  Todos acima de 4,5:1 no grão médio, o critério já usado na home e nas outras faixas. No pico
  do grão (um pixel isolado), o parágrafo de `/noticias` a 430px fica em 4,34:1, o mesmo caso
  já aceito antes
- **No branco e no cinza claro** (a régua do desenho, a 1440 e a 390px, com as duas chaves,
  nenhum trecho abaixo do mínimo): o cinza #646B75 do CNPJ e do horário a entrar dá 5,38:1; o
  #4F5661 da frase dos canais e da sede, 7,40:1; o verde #1A5E18 do rótulo dos canais, 7,90:1;
  e o verde #0D2E0C de "Nenhuma notícia publicada ainda.", 13,07:1
- **O que só aparece com notícia publicada** foi medido com as notícias de exemplo, na página
  temporária, e não no site de hoje: a data dos cartões no celular, 4,69:1 (o mesmo número do
  relatório do desenho); o texto sobre a foto do destaque, de 6,36:1 (a data, a 1440px) a
  12,88:1; a legenda, o aviso de saúde e "Atualizado em" (#646B75), 5,38:1. As fotos eram as do desenho: com outra
  foto, o texto sobre o destaque muda, mas o degradê embaixo dele nunca fica abaixo de 75%

**Dúvidas que ficaram em aberto** (decididas na execução; o cliente pode mudar)

1. **"Como chegar"**: abre na mesma aba em todo o site, como os outros links para fora
2. **Ver a lista e a notícia antes da primeira notícia real**: provadas por renderização e,
   na conferência final, numa página temporária com as notícias de exemplo; a primeira
   notícia real ganha uma olhada no navegador
3. **"MÉDICO" para autoras**: fica "MÉDICO" para todos, como hoje
4. **Ponto de interesse**: só na capa da notícia aberta, por enquanto
5. **"Outras notícias" com uma ou duas**: tantas colunas quantas notícias, sem coluna vazia;
   uma sozinha sai num cartão deitado
6. **E-mail e horário da sede**: entram quando a AMI os informar
7. **`author.url` e `publisher.logo` no dado estruturado da notícia**: ficam para uma fatia
   própria
8. **O título do destaque da lista no celular**: 20px, como ele sai na foto do desenho (a regra
   escrita no desenho dizia 22px, mas uma regra da home passava por cima)
9. **O perfil do Instagram de 981 a cerca de 1100px**: quebra em "@associacaomedicadeimp" /
   "eratriz"; o desenho o quebrava num ponto fixo. Ainda sem decisão

### Sem ícones decorativos (05/10/2026, pedido do cliente)

O cliente pediu que nenhum ícone criado para o site apareça como enfeite: "remete a uma estrutura de IA". Isso agora é regra permanente.

- **Ícone só aparece em dois lugares:**
  - ao lado do texto de um botão ou link: telefone, WhatsApp, "Como chegar", celular e as setas;
  - nos controles da tela: menu, lupa, carrossel, a setinha de abrir lista e o × do filtro.
- **Saíram:**
  - os ladrilhos dos números, de missão, visão e valores, das 14 especialidades, do contato, da sede, de "Saiba mais", de "Fale com a AMI" e do autor da notícia;
  - o ícone de vidro das faixas verdes do topo;
  - o relógio de "Atualizado em", o "i" do aviso e o calendário da gestão.
- **Nada entrou no lugar.** O espaço se fechou: algumas faixas do topo e alguns cartões ficaram mais baixos.
- **A trava:** `testes/icones.test.ts` só aceita os nomes de ícone permitidos e falha se `LadrilhoIcone`, `ladrilho-icone` ou `duotone` voltarem. A regra completa está em [`docs/superpowers/specs/2026-10-05-sem-icones-decorativos-design.md`](superpowers/specs/2026-10-05-sem-icones-decorativos-design.md).
- **Os desenhos aprovados** em `docs/desenho-aprovado/` ainda mostram os ícones. São o registro histórico; a spec acima manda sobre eles.

### Onde cada página está (04/10/2026, fim da reforma visual)

Todas as páginas públicas estão no desenho novo, juntadas à `main` em 04/10/2026 (`ba2c5aa`) e
enviadas ao GitHub. Falta a revisão do cliente das decisões tomadas sem ele.

| Página | Estado |
|---|---|
| `/` (home) | Fatia A. Carrossel, números, busca, Sua AMI, Seja associado, notícias e parceiras; o que a AMI ainda não deu aparece como moldura só no modo demonstração |
| `/busca` e `/medico/{slug}` | Grupo 1. A biografia dos 24 médicos fictícios vem marcada "[PROVISÓRIO]" do banco de demonstração; a marca nunca aparece: no modo demonstração, o "Sobre" mostra a moldura "Apresentação do médico a entrar"; fora dele, o "Sobre" não aparece |
| `/medicos` e `/medicos/{especialidade}` | Grupo 2. Falta o texto "Sobre a especialidade" das 14 especialidades, no Sanity |
| `/associacao`, `/associacao/diretoria` e Seja associado | Grupo 3. Faltam a apresentação, a foto da sede, Missão, visão e valores, o período da gestão e o texto da anuidade |
| Privacidade, termos e cookies | Grupo 3. Rascunhos com aviso visível; falta a revisão do advogado e o encarregado de dados |
| `/noticias` e `/noticias/{slug}` | Grupos 4 e 5. Nenhuma notícia publicada; a notícia aberta dá 404 até a primeira |
| `/contato` | Grupos 4 e 5. Faltam a foto da sede, o horário e, se houver, o e-mail |
| `/associacao/{estatuto,politica-editorial,beneficios}` | 404 até a AMI escrever |

**A auditoria do site inteiro** (04/10/2026): as 13 páginas públicas, nas oito larguras, com a
chave de demonstração ligada (104 rodadas) e desligada (104 rodadas), mais a página temporária
com as notícias de exemplo (72 rodadas com a chave ligada e 16 com ela desligada). O que ela
achou:

- **Com a chave ligada**: nada, nas 176 rodadas, tirando uma, feita com seis navegadores ao
  mesmo tempo, em que `/busca` abriu a 1758px chegando pelo menu a 1920px. Ela não se repetiu
  ao refazer a rodada, nem nas 76 rodadas feitas depois, nem nos 32 cliques de verdade
- **Com a chave desligada, a 1920 × 1080px**: `/noticias` abre 105px rolada quando se chega a
  ela pelo menu vindo do meio de outra página (15 rodadas, uma por página de onde se sai; também
  com cliques de verdade). Sem notícia, a página tem 1185px, só 105px mais que a janela: o
  navegador para no fim dela, e o Next só volta ao topo quando o começo da página nova está fora
  da tela, o que aqui não acontece. Nas outras larguras medidas (1024 a 1536px) a página é mais
  alta que a janela com folga, e o problema não aparece. **Corrigido** na correção final: toda
  troca de página por link volta ao topo; o voltar e o avançar do navegador devolvem a posição
  de antes, e um link com `#` cai no trecho certo. Medido: os três casos em 0 e os 32 cliques do
  menu em 0
- **Molduras**: com a chave desligada, nenhuma moldura "a entrar" em página nenhuma, tirando os
  dois parágrafos da política de privacidade (o encarregado de dados e o prazo de guarda), de
  propósito; nenhum texto "a entrar" fora de uma moldura, com as duas chaves

---

## Pendências do cliente, todas juntas

Tudo o que só o cliente ou a AMI podem fazer, em ordem. Os passos 1 a 6 pedem a conta do
Sanity: abrir o site em `/studio`, entrar com a conta e, na coluna da esquerda, clicar no tipo de
conteúdo. O botão de criar documento novo fica no alto da lista; no fim, clicar em **Publicar**.

1. **Notícias.** Primeiro o **Autor** (**Nome**, **CRM**, **UF do CRM** e, se tiver perfil,
   **Endereço do perfil no diretório**), depois a **Notícia** (**Título**, **Endereço**,
   **Resumo**, **Imagem de capa** com a **Descrição da imagem** e o ponto de interesse,
   **Autor**, **Publicado em** e **Texto**). Ver "Notícias e Contato", acima.
2. **Textos de especialidade.** Em **Texto de especialidade**: **Especialidade** (o fim do
   endereço, como `cardiologia`), **O que faz**, **Quando procurar**, **Revisado por**, **CRM
   do revisor** e **Data da revisão**. Um para cada uma das 14 especialidades.
3. **A apresentação.** Em **Página institucional**, com **Endereço** `associacao`: **Título**,
   **Resumo**, **Atualizado em** e **Texto**. Os mesmos passos servem para `estatuto` e
   `politica-editorial`.
4. **Empresas parceiras.** Em **Empresa parceira**: **Nome**, **Logotipo** (PNG, de
   preferência com fundo transparente), **Site** e **Ordem**. Uma para cada parceira.
5. **Banners da home.** Em **Banner da home**: **Nome interno** e **Tipo**. Com "Arte pronta",
   a **Arte** (3000 × 1288 pixels) e, se houver, a **Arte para o celular** (1080 × 1350). Com
   "Foto com texto montado no site", a **Foto**, o **Rótulo**, o **Título**, o **Texto**, o
   **Texto do botão** e **Para onde leva**. **Ordem** e **Aparece até** são opcionais.
6. **O webhook.** Em [sanity.io/manage](https://www.sanity.io/manage), clicar no projeto da
   AMI, em **API** e em **Webhooks**, e abrir o webhook do site. Se o campo **Filter** tiver uma
   lista de tipos, conferir que estão nela `"banner"`, `"noticia"`, `"autor"`,
   `"empresaParceira"`, `"textoDeEspecialidade"` e `"paginaInstitucional"`, e salvar na própria
   tela. Vazio, nada a fazer.
7. **A foto da sede.** Pedir à AMI: a fachada da sede, ou uma reunião da diretoria, horizontal,
   com pelo menos 1600px de largura. Quem receber salva o arquivo em
   `public/imagens/sede-ami.jpg` e troca `provisoria` para `false` em `ESPACOS.sede`
   (`lib/imagens.ts`). Ela aparece em A Associação e no contato.
8. **Missão, visão e valores.** Pedir à AMI os três textos. Entram em `lib/molduras.ts`
   (`TEXTO_INSTITUCIONAL`) e aparecem na home e em A Associação.
9. **O horário de atendimento da sede.** Pedir à AMI. Com a resposta, o contato troca a
   moldura pelo horário (ver "Próximos passos de código").
10. **O e-mail de contato**, se a AMI tiver um. Com a resposta, o contato ganha um quarto
    cartão, "Escrever".
11. **O WhatsApp.** Perguntar à AMI se o celular (99) 98802-0205 atende por WhatsApp. Se
    atender, o botão entra em "Fale com a AMI", em Seja associado, e no contato.
12. **O período da gestão da diretoria.** Pedir à AMI a data de início e a de fim do mandato.
    Elas vão para o banco (`mandato_inicio` e `mandato_fim`, na tabela `diretoria`).
13. **O encarregado de dados.** A AMI precisa designar a pessoa (artigo 41 da Lei 13.709/2018) e
    informar o nome e o contato.
14. **A revisão do advogado.** Mandar [`docs/rascunhos-textos-legais.md`](rascunhos-textos-legais.md)
    a um advogado de direito médico. O texto revisado entra como no passo 3, com **Endereço**
    `politica-de-privacidade`, `termos-de-uso` e `politica-de-cookies`; publicado, ele
    substitui o rascunho e o aviso some.

## Próximos passos de código

Não dependem do cliente:

1. **A foto do médico pelo painel.** Todo médico terá foto; hoje o site mostra as iniciais. O
   envio pelo painel depende do armazenamento de arquivos do Supabase, que ainda não está
   configurado.
2. **Ler o mandato da diretoria.** O banco já tem `mandato_inicio` e `mandato_fim`, vazias.
   Preenchidas, a pílula da faixa da diretoria vira "Gestão 2025–2027"; falta decidir de qual
   linha sai o período (a da presidência, por exemplo).
3. **"Mais antigas" na lista de notícias**, quando a AMI passar de 20 notícias publicadas.
4. **O horário, o e-mail e o WhatsApp no contato**, quando a AMI responder os passos 9 a 11
   acima: não há campo para eles no Studio. O dado entra em `lib/ami.ts`, e o canal, em
   `lib/paginaDeContato.ts`.
5. **O painel e a biografia provisória.** O painel do médico conta como preenchida uma
   biografia marcada "[PROVISÓRIO]" (`lib/painel/medico.ts`, `temBio`), enquanto o site a
   trata como texto que falta. Só afeta os perfis de demonstração; vale acertar antes de
   carregar os médicos de verdade.
6. **Links do Studio, dois acertos pequenos.** Um link escrito como `/site.com` passa como
   link interno e o navegador o leva a outro site (`lib/sanity/link.ts`); só quem edita no
   Studio consegue escrever um assim. E o Studio aceita um endereço como `diretoria`, sem
   barra, que o site mostra como texto sem link, sem avisar quem edita: o campo deveria exigir
   `/`, `#` ou `https://`.

---

## O que falta

### 1. Conteúdo da AMI, e isto bloqueia o lançamento

**Três páginas de texto** ainda não existem, criadas em `/studio`, tipo "Página institucional". Enquanto não existirem, os três endereços dão 404, e a página A Associação não leva a eles: no modo demonstração, Estatuto e Política editorial aparecem em "Saiba mais" com a etiqueta "texto a entrar", sem link; fora dele, não aparecem.

| Endereço a escolher no campo "Endereço" | Prioridade |
|---|---|
| `politica-editorial` | **Alta.** É o que faz o Google reconhecer o site como fonte confiável em saúde. Não depende de advogado |
| `estatuto` | Média |
| `beneficios` | Média |

**As três páginas legais** (privacidade, termos, cookies) já estão no ar com **rascunho redigido a partir do funcionamento medido do site**, e aviso visível de que não passaram por advogado. O documento para revisão está em [`docs/rascunhos-textos-legais.md`](rascunhos-textos-legais.md), gerado da mesma fonte que o site renderiza.

> **A revisão por advogado de direito médico continua obrigatória antes do lançamento.** Publicado o texto revisado no Studio, ele substitui o rascunho, o aviso some e a página entra no sitemap sozinha, que hoje não a lista de propósito: rascunho não convida buscador.

Duas informações dentro dos rascunhos dependem da AMI:

1. **O encarregado pelo tratamento de dados**, que o artigo 41 da Lei 13.709/2018 exige designar. Falta nome e contato
2. **O prazo de guarda dos registros de acesso do servidor**, que depende de quem hospedar

Cada página pede: Título, Endereço, Resumo entre 60 e 220 caracteres, data de atualização e o texto.

**O que a home espera da AMI.** Enquanto o site estiver em modo demonstração, cada item abaixo aparece como moldura marcada "a entrar". Fora dele, o que faltar some da página em vez de aparecer vazio:

- **Os banners do carrossel**, cadastrados em `/studio`, tipo "Banner da home". **Mudou na reforma visual**: o banner agora tem dois tipos, escolhidos no campo "Tipo":
  - **Arte pronta**: uma imagem já desenhada, com os textos dentro. A medida mudou: a arte larga passa a **3000 × 1288 pixels** (era 3000 × 856), porque o carrossel do computador ficou mais alto, e há um campo novo, **"Arte para o celular", em 1080 × 1350 pixels** (vertical, 4:5). Sem a de celular, o site recorta a larga pelo ponto de interesse marcado no Studio. As medidas estão em `lib/sanity/banners.ts` (`ARTE_LARGA`, `ARTE_CELULAR`) e na ajuda do próprio Studio (`sanity/schemas/banner.ts`)
  - **Foto com texto montado no site**: a AMI sobe só uma foto e escreve rótulo, título, texto curto, texto do botão e destino. **Não precisa de designer.** Sem foto, fora do modo demonstração, esse banner não aparece
  - O primeiro banner real tira as três molduras de uma vez
- **As primeiras notícias**. A primeira publicada tira os quatro cartões provisórios da home e as molduras da lista de notícias (`/noticias`)
- **Missão, Visão e Valores**: os três textos da AMI. A home tem o lugar deles em "Quem é a AMI?" (três cartões), e hoje cada um diz "Texto da AMI a entrar." no modo demonstração. Fora dele, o cartão sem texto não aparece. A página A Associação mostra os mesmos três cartões em "Princípios", e sem texto, fora do modo demonstração, o bloco some. Ainda não há campo no Studio para eles: o texto entra hoje em `lib/molduras.ts` (`TEXTO_INSTITUCIONAL`)
- **Duas fotografias**, declaradas em `lib/imagens.ts`, as duas em uso na home:
  - **o auditório ou o hall de eventos da sede** (`salao`), para Sua AMI. Horizontal, no mínimo 2000px de largura
  - **associados da AMI reunidos** (`associados`), para Seja associado. Horizontal, no mínimo 1600px de largura, só com pessoas que autorizaram o uso da imagem
- **Sua AMI**: o bloco diz "O auditório e o hall de eventos da AMI", com a etiqueta "em breve", e leva a Fale com a AMI. Ele só existe no modo demonstração, e some do menu e do rodapé junto, fora dele. Para ganhar página própria faltam as fotos, a capacidade e como reservar
- **Os logotipos das empresas parceiras**, cadastrados em `/studio`, tipo "Empresa parceira" (nome, logotipo em PNG, site e ordem). A primeira cadastrada tira as seis molduras "Logotipo a entrar", e o número de cadastradas vira o quarto número da home ("empresas parceiras"). Sem nenhuma, fora do modo demonstração, a faixa e o quarto número não aparecem. Antes, o cliente precisa conferir o Studio e o webhook: ver "Pendências do cliente" na seção da fatia B
- **O texto de Seja associado**, que hoje é provisório e marcado como tal. O valor da anuidade, os benefícios e os critérios de admissão aparecem como "texto da AMI a entrar." no modo demonstração e somem fora dele
- **A apresentação oficial da AMI**, em `/studio`, tipo "Página institucional", endereço `associacao`: o texto de "Quem somos" na página A Associação

**O que as páginas de especialidade esperam da AMI:**

- Os textos "Sobre a especialidade" das 14 especialidades, com o médico revisor, o CRM dele e a data da revisão, cadastrados no Studio (tipo "Texto de especialidade"). O passo a passo está em "Pendências do cliente", na seção de Especialidades

A foto da **fachada da sede** (`sede`) voltou a ter lugar: é a de "Quem somos", na página A Associação, e **entra no pedido de material à AMI** (o que ela precisa ter está em `lib/imagens.ts`). Sem ela, fora do modo demonstração, o bloco fica só com o texto, em duas colunas. A **vista de Imperatriz** (`cidade`) continua declarada e sem uso, e **não entra no pedido agora**: pedir foto que nenhuma página usa é pedir trabalho à toa.

### 2. Dados reais da AMI, e isto também bloqueia

- ~~Razão social, CNPJ, endereço e telefone da sede~~ **Recebidos em 21/08/2026** e no ar. O CNPJ foi conferido pelos dígitos verificadores. Vivem em `lib/ami.ts`, fonte única lida pelo rodapé e pelo dado estruturado
- **A diretoria real**: nome, cargo, **CRM**, UF e ordem hierárquica de cada diretor. Vai para o banco, não para o Studio. Só a presidente é conhecida, a Dra. Paula Bretas, e **falta o CRM dela**: exibir nome de médica sem inscrição viola o Art. 4º, I da Resolução CFM, e a restrição do banco impede gravar
- **A planilha dos cerca de 500 associados**
- **Qual dos dois telefones é WhatsApp**, se algum for. Não foi suposto: botão apontando para linha que não atende por lá é pior que não ter botão. Confirmado, o botão entra em "Fale com a AMI", em Seja associado
- **O período da gestão da diretoria atual**: a faixa da diretoria tem o lugar dele, e hoje mostra "Gestão (período a entrar)" só no modo demonstração
- **O horário de atendimento da sede**: o contato tem o lugar dele, e hoje mostra "Horário de atendimento da sede a entrar." só no modo demonstração
- **O e-mail de contato**, se a AMI tiver um: entra no contato como um quarto cartão, "Escrever"

### 3. A trava de indexação

Hoje `NEXT_PUBLIC_DADOS_DEMONSTRACAO=true`, e por isso o `robots.txt` responde `Disallow: /`: o site inteiro está invisível para o Google **de propósito**, porque os 24 médicos publicados são fictícios e têm CRM plausível. Um CRM naquela faixa pode pertencer a um médico de verdade.

**Virar essa chave é a última coisa a fazer antes do lançamento**, e só depois que o cadastro real estiver carregado. O rodapé lê a mesma variável, então o aviso de dados fictícios some junto, automaticamente. **As molduras "a entrar" da home também**: com a chave desligada, nenhuma aparece. Isso foi conferido em 03/10/2026 com `next build` e `next start` de verdade, com a chave desligada: zero molduras na home e `robots.txt` liberado. Foi conferido de novo no fim da fatia A da reforma visual, no mesmo dia: nenhum "a entrar", nenhuma moldura (`role="img"`), sem Sua AMI (nem no menu, nem no rodapé), sem parceiros, sem Missão, Visão e Valores, sem carrossel e sem notícias. A home fica com os números, a busca, Seja associado (texto e "Quem é a AMI?", sem a foto) e os bairros, com o mesmo espaço entre todos. Conferido mais uma vez no fim do grupo 1 da fatia B, no mesmo dia, nas oito larguras: a home termina em Seja associado (sem bairros, que saíram do site, e sem parceiros, enquanto nenhuma estiver cadastrada), com três números; a busca e o perfil mostram as iniciais no lugar das fotos, como no modo demonstração, e nenhum "a entrar".

O valor tem que ser **exatamente** `false`, em minúsculas. `False`, `0` ou vazio contam como demonstração. É o lado seguro, mas um erro de digitação deixa o site fora do Google e as molduras à mostra. A variável começa com `NEXT_PUBLIC_`, então o valor é gravado no código **na hora do build**: mudou a chave, tem que fazer o build de novo.

### 4. Fases de desenvolvimento que ainda não começaram

Previstas na especificação, seção 8, e ainda não construídas:

- ~~**Importador de planilha**~~ **Construído.** Três comandos: `npm run importar -- --modelo` gera a planilha modelo, `npm run importar -- arquivo.xlsx` confere sem gravar, e `--gravar` executa. A publicação é comando à parte, `npm run publicar`, com filtro de completude. Falta a planilha real da AMI
- **Painel da agência**, em `/painel`: a fatia 1 está construída — entrar com e-mail e senha, listar os médicos incluindo os que não estão no ar, pôr e tirar do ar um a um, e editar os campos do médico. A primeira conta se cria pelos passos de [`docs/como-criar-a-conta-do-painel.md`](como-criar-a-conta-do-painel.md), e **já existe** desde 23/08/2026. **A fatia 1 foi verificada de ponta a ponta contra o banco de produção naquele dia**, com `next build` + `next start`, que é o único arranjo que exercita o cache: tirar do ar derruba a página do médico, o sitemap e a home; pôr no ar traz as três de volta. `supabase/testes-rls.sql` também passou contra o banco real. A verificação achou um defeito, corrigido em `003dda2`: `alternarPublicacao` não conferia se a gravação alterou alguma linha, e o painel mostrava um estado que o banco não tinha. **A fatia 2 foi construída e verificada em 23/08/2026**, no mesmo dia: o painel passa a dar ao médico especialidades (com RQE e qual é a principal) e consultórios (com telefone, WhatsApp e acessibilidade, ligando a um endereço já cadastrado ou criando novo), mais o interruptor "é associado da AMI". A migração `0006_painel_vinculos.sql` concede escrita em quatro tabelas e remoção em três, todas de ligação — é a primeira do projeto que permite apagar linha, e médico continua impossível de apagar. `supabase/testes-rls.sql` passou contra o banco real cobrindo as quatro tabelas e os três papéis, e a corrente inteira foi conferida com o dedo. **Os horários saíram do produto** na mesma fatia: a planilha da AMI não tem coluna de horário, então a grade, o selo de "aberto agora" e o filtro de sábado ficariam vazios para sempre; a tabela `horario` fica no banco, intocada. As 37 decisões tomadas durante a execução estão em [`docs/superpowers/2026-08-23-painel-fatia-2-decisoes.md`](superpowers/2026-08-23-painel-fatia-2-decisoes.md). Falta a foto do médico (fatia própria, porque não existe armazenamento de arquivo configurado) e a fatia 3 (fila de revisões e "Atualizar meus dados"). Diretoria, comunicados e anuidades saíram do escopo da fatia 2 no levantamento
- **Reforma visual, fatia B: as outras páginas.** Os cinco grupos estão construídos: a busca e o perfil, as especialidades, A Associação (com a diretoria, Seja associado e as três páginas legais), as notícias e o contato; ver a seção de cada um, acima. Juntados à `main` em 04/10/2026 (`ba2c5aa`) e enviados ao GitHub; falta a revisão do cliente das decisões tomadas sem ele ([`docs/decisoes-sem-o-cliente.md`](decisoes-sem-o-cliente.md)). Antes de construir cada grupo de páginas, o cliente vê e aprova um desenho, do mesmo jeito que a home (spec da reforma, seção 3). A fatia B também resolve a lista "feio, mas legível" da seção da fatia A, acima, e usa as fotos `sede` e `cidade` na página da Associação, se o desenho pedir
- **A foto do médico pelo painel** (próximo passo, não pendência do cliente): todo médico terá foto, e enquanto não houver, o site mostra as iniciais. O envio pelo painel é uma fatia à parte e depende do armazenamento de arquivos do Supabase, que ainda não está configurado
- **Área do associado** (Fase 2): login do médico, edição do próprio perfil, anuidade, carteirinha, comunicados e eventos
- ~~**Home nova**~~ **Construída** no ramo `home-nova`, entre 23/08 e 03/10/2026. "Encontre um médico" deixou de ser a página e virou um serviço da associação, com campo de busca dentro do cartão. O `<h1>` passou de "Encontre um médico em Imperatriz" para "Associação Médica de Imperatriz". O carrossel lê os banners do Sanity e para de girar em quatro situações: mouse ou teclado em cima, botão de pausa, aba fora da frente e preferência do sistema por menos movimento. A pedido do cliente, em 03/10/2026, cada peça sem conteúdo ganhou uma moldura "a entrar" no modo demonstração. A trava está em `lib/molduras.ts`, e `testes/home-renderizada.test.ts` monta a página de verdade com a chave ligada e desligada. Decisões em [`docs/superpowers/specs/2026-08-23-home-nova-decisoes.md`](superpowers/specs/2026-08-23-home-nova-decisoes.md). Em 03/10/2026 a reforma visual (fatia A) redesenhou essa home inteira; ver "Reforma visual — fatia A"

### 5. Itens técnicos adiados de propósito

Registrados com a razão em [`docs/decisoes-institucional-e-editorial.md`](decisoes-institucional-e-editorial.md):

- **Modo escuro** não implementado. Todos os contrastes foram medidos contra fundo claro, e refazê-los cedo demais arriscaria a acessibilidade já conquistada. A camada de tokens está semântica, então é mudança contida
- **Selo "Revisado por"** nas notícias, e os recursos de blog previstos na especificação (filtro por categoria e tempo de leitura). O sumário lateral entrou: é o índice "Nesta página" da notícia aberta, com dois títulos de seção ou mais. A paginação da lista ("Mais antigas") fica para quando a AMI passar de 20 notícias
- **As fotografias que faltam** (o auditório e os associados, ver "O que a home espera da AMI") saem no modo demonstração como moldura marcando o lugar e dizendo que foto entra ali. Fora dele, a foto que falta não é desenhada
- **O CRM da diretoria é cópia congelada**: corrigir o CRM de um diretor no cadastro de profissionais não atualiza a página da diretoria. Quem for construir o painel encontra o aviso no comentário de `lib/dados/diretoria.ts`

---

## Como retomar

```bash
npm run dev
```

```bash
npx vitest run
```

```bash
npx next build
```

Variáveis em `.env.local`, com o modelo comentado em `.env.local.exemplo`. O banco se monta do zero com `supabase/primeira-instalacao.sql`.

---

## Como carregar o cadastro real

1. `npm run importar -- --modelo` e mandar `modelo-associados.xlsx` para a AMI
2. Quando voltar preenchido: `npm run importar -- associados.xlsx`, que não grava nada
3. Mandar os erros do relatório para a AMI, corrigir, repetir o passo 2 quantas vezes for preciso
4. Relatório limpo: `npm run importar -- associados.xlsx --gravar`
5. `npm run publicar -- --com-especialidade --com-local` para conferir, e de novo com `--gravar`. O comando recusa gravar sem filtro explícito — publicar sem `--com-especialidade` nem `--com-local` exige escrever `--sem-filtro` com todas as letras
6. Só então virar `NEXT_PUBLIC_DADOS_DEMONSTRACAO` para `false`

A chave de escrita vem de `SUPABASE_CHAVE_IMPORTADOR`, explicada em
[`docs/como-remontar-o-ambiente.md`](como-remontar-o-ambiente.md).

---

## Histórico de qualidade

O diretório e o conteúdo editorial foram executados com revisão independente por tarefa e revisão do ramo inteiro ao fim. **Trinta defeitos foram encontrados e corrigidos** nesse processo, mais da metade originados em erro de planejamento ou de desenho, não de implementação.

Os mais consequentes, todos corrigidos:

- A restrição do banco aceitava "está ligado a um médico" como prova de CRM, mas a política de segurança esconde perfil não publicado do visitante anônimo. Diretor recém-importado sairia na tela **sem inscrição**, violando o Art. 4º, I. E esse é o estado normal de uma base recém-carregada
- O dado estruturado das notícias não emitia imagem, o que tira a matéria da elegibilidade a resultados ricos do Google
- O webhook devolvia erro 500 a qualquer pessoa sem credencial, por uma exceção não tratada
- O sitemap listaria seis endereços que dão 404
- O recorte de imagem pelo ponto de interesse nunca funcionou, e a proporção declarada não batia com a entregue, estourando a meta de estabilidade visual

O registro completo das 36 decisões tomadas sem consultar o cliente, cada uma com o motivo e o custo se estiver errada, está em [`docs/decisoes-institucional-e-editorial.md`](decisoes-institucional-e-editorial.md).
