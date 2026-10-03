# Estado do projeto — Site da Associação Médica de Imperatriz

> Atualizado em 3 de outubro de 2026 · ramo `paginas-encontre` (a reforma visual, fatia B, grupo 1), feito a partir de `redesign-visual` (fatia A); nada vai para a `main` até todas as páginas estarem reformadas
> Repositório: `github.com/sepetimio/AMI`
> Especificação: [`docs/superpowers/specs/2026-08-19-site-ami-diretorio-design.md`](superpowers/specs/2026-08-19-site-ami-diretorio-design.md)

Este arquivo responde três perguntas: **o que existe**, **o que falta**, e **quem precisa fazer o quê**. É o ponto de retomada quando o trabalho parar e voltar depois.

---

## Em uma frase

O site está **funcional e verificado**, com a home redesenhada como no desenho aprovado pelo cliente (fatia A da reforma visual), o diretório médico completo, o blog, as páginas institucionais e o painel de conteúdo da AMI. Ele **não pode ir ao ar ainda**, e o que falta é conteúdo e cadastro, não código.

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
| `/noticias` e `/noticias/{slug}` | Blog, com autoria por CRM e dado estruturado para o Google | no ar |
| `/associacao` | Página-índice da associação | no ar |
| `/associacao/diretoria` | Diretoria, com cargo, nome e CRM, ligada aos perfis | no ar |
| `/associacao/seja-associado` | Como se associar | no ar, com **texto provisório marcado**, sem valor de anuidade nem lista de benefícios |
| `/contato` | Fale com a AMI: endereço, os dois telefones, Instagram e CNPJ, tudo de `lib/ami.ts` | no ar |
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
     acrescentar `"empresaParceira"` à lista e salvar. Sem isso, a parceira cadastrada
     demora até uma hora para aparecer no site.
3. De volta ao `/studio` (em português), clicar em **Empresa parceira** e, no alto da
   lista, no botão de criar documento novo. Preencher **Nome**, **Logotipo** (arquivo
   **PNG**, de preferência com fundo transparente), **Site** (opcional) e **Ordem**
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

---

## O que falta

### 1. Conteúdo da AMI, e isto bloqueia o lançamento

**Três páginas de texto** ainda não existem, criadas em `/studio`, tipo "Página institucional". Enquanto não existirem, três endereços dão 404 e há links quebrados na página da associação.

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
- **As primeiras notícias**. A primeira publicada tira os quatro cartões provisórios
- **Missão, Visão e Valores**: os três textos da AMI. A home tem o lugar deles em "Quem é a AMI?" (três cartões), e hoje cada um diz "Texto da AMI a entrar." no modo demonstração. Fora dele, o cartão sem texto não aparece. Ainda não há campo no Studio para eles: o texto entra hoje em `app/(site)/page.tsx` (`TEXTO_DA_AMI`)
- **Duas fotografias**, declaradas em `lib/imagens.ts`, as duas em uso na home:
  - **o auditório ou o hall de eventos da sede** (`salao`), para Sua AMI. Horizontal, no mínimo 2000px de largura
  - **associados da AMI reunidos** (`associados`), para Seja associado. Horizontal, no mínimo 1600px de largura, só com pessoas que autorizaram o uso da imagem
- **Sua AMI**: o bloco diz "O auditório e o hall de eventos da AMI", com a etiqueta "em breve", e leva a Fale com a AMI. Ele só existe no modo demonstração, e some do menu e do rodapé junto, fora dele. Para ganhar página própria faltam as fotos, a capacidade e como reservar
- **Os logotipos das empresas parceiras**, cadastrados em `/studio`, tipo "Empresa parceira" (nome, logotipo em PNG, site e ordem). A primeira cadastrada tira as seis molduras "Logotipo a entrar", e o número de cadastradas vira o quarto número da home ("empresas parceiras"). Sem nenhuma, fora do modo demonstração, a faixa e o quarto número não aparecem. Antes, o cliente precisa conferir o Studio e o webhook: ver "Pendências do cliente" na seção da fatia B
- **O texto de Seja associado**, que hoje é provisório e marcado como tal

As fotos da **fachada da sede** (`sede`) e da **vista de Imperatriz** (`cidade`) continuam declaradas em `lib/imagens.ts`, mas **saíram da home** na reforma. Elas ficam para a página da Associação, na fatia B, e **não entram no pedido de material à AMI agora**: pedir foto que nenhuma página usa é pedir trabalho à toa.

### 2. Dados reais da AMI, e isto também bloqueia

- ~~Razão social, CNPJ, endereço e telefone da sede~~ **Recebidos em 21/08/2026** e no ar. O CNPJ foi conferido pelos dígitos verificadores. Vivem em `lib/ami.ts`, fonte única lida pelo rodapé e pelo dado estruturado
- **A diretoria real**: nome, cargo, **CRM**, UF e ordem hierárquica de cada diretor. Vai para o banco, não para o Studio. Só a presidente é conhecida, a Dra. Paula Bretas, e **falta o CRM dela**: exibir nome de médica sem inscrição viola o Art. 4º, I da Resolução CFM, e a restrição do banco impede gravar
- **A planilha dos cerca de 500 associados**
- **Qual dos dois telefones é WhatsApp**, se algum for. Não foi suposto: botão apontando para linha que não atende por lá é pior que não ter botão

### 3. A trava de indexação

Hoje `NEXT_PUBLIC_DADOS_DEMONSTRACAO=true`, e por isso o `robots.txt` responde `Disallow: /`: o site inteiro está invisível para o Google **de propósito**, porque os 24 médicos publicados são fictícios e têm CRM plausível. Um CRM naquela faixa pode pertencer a um médico de verdade.

**Virar essa chave é a última coisa a fazer antes do lançamento**, e só depois que o cadastro real estiver carregado. O rodapé lê a mesma variável, então o aviso de dados fictícios some junto, automaticamente. **As molduras "a entrar" da home também**: com a chave desligada, nenhuma aparece. Isso foi conferido em 03/10/2026 com `next build` e `next start` de verdade, com a chave desligada: zero molduras na home e `robots.txt` liberado. Foi conferido de novo no fim da fatia A da reforma visual, no mesmo dia: nenhum "a entrar", nenhuma moldura (`role="img"`), sem Sua AMI (nem no menu, nem no rodapé), sem parceiros, sem Missão, Visão e Valores, sem carrossel e sem notícias. A home fica com os números, a busca, Seja associado (texto e "Quem é a AMI?", sem a foto) e os bairros, com o mesmo espaço entre todos. Conferido mais uma vez no fim do grupo 1 da fatia B, no mesmo dia, nas oito larguras: a home termina em Seja associado (sem bairros, que saíram do site, e sem parceiros, enquanto nenhuma estiver cadastrada), com três números; a busca e o perfil mostram as iniciais no lugar das fotos, como no modo demonstração, e nenhum "a entrar".

O valor tem que ser **exatamente** `false`, em minúsculas. `False`, `0` ou vazio contam como demonstração. É o lado seguro, mas um erro de digitação deixa o site fora do Google e as molduras à mostra. A variável começa com `NEXT_PUBLIC_`, então o valor é gravado no código **na hora do build**: mudou a chave, tem que fazer o build de novo.

### 4. Fases de desenvolvimento que ainda não começaram

Previstas na especificação, seção 8, e ainda não construídas:

- ~~**Importador de planilha**~~ **Construído.** Três comandos: `npm run importar -- --modelo` gera a planilha modelo, `npm run importar -- arquivo.xlsx` confere sem gravar, e `--gravar` executa. A publicação é comando à parte, `npm run publicar`, com filtro de completude. Falta a planilha real da AMI
- **Painel da agência**, em `/painel`: a fatia 1 está construída — entrar com e-mail e senha, listar os médicos incluindo os que não estão no ar, pôr e tirar do ar um a um, e editar os campos do médico. A primeira conta se cria pelos passos de [`docs/como-criar-a-conta-do-painel.md`](como-criar-a-conta-do-painel.md), e **já existe** desde 23/08/2026. **A fatia 1 foi verificada de ponta a ponta contra o banco de produção naquele dia**, com `next build` + `next start`, que é o único arranjo que exercita o cache: tirar do ar derruba a página do médico, o sitemap e a home; pôr no ar traz as três de volta. `supabase/testes-rls.sql` também passou contra o banco real. A verificação achou um defeito, corrigido em `003dda2`: `alternarPublicacao` não conferia se a gravação alterou alguma linha, e o painel mostrava um estado que o banco não tinha. **A fatia 2 foi construída e verificada em 23/08/2026**, no mesmo dia: o painel passa a dar ao médico especialidades (com RQE e qual é a principal) e consultórios (com telefone, WhatsApp e acessibilidade, ligando a um endereço já cadastrado ou criando novo), mais o interruptor "é associado da AMI". A migração `0006_painel_vinculos.sql` concede escrita em quatro tabelas e remoção em três, todas de ligação — é a primeira do projeto que permite apagar linha, e médico continua impossível de apagar. `supabase/testes-rls.sql` passou contra o banco real cobrindo as quatro tabelas e os três papéis, e a corrente inteira foi conferida com o dedo. **Os horários saíram do produto** na mesma fatia: a planilha da AMI não tem coluna de horário, então a grade, o selo de "aberto agora" e o filtro de sábado ficariam vazios para sempre; a tabela `horario` fica no banco, intocada. As 37 decisões tomadas durante a execução estão em [`docs/superpowers/2026-08-23-painel-fatia-2-decisoes.md`](superpowers/2026-08-23-painel-fatia-2-decisoes.md). Falta a foto do médico (fatia própria, porque não existe armazenamento de arquivo configurado) e a fatia 3 (fila de revisões e "Atualizar meus dados"). Diretoria, comunicados e anuidades saíram do escopo da fatia 2 no levantamento
- **Reforma visual, fatia B: as outras páginas.** O grupo 1 (a busca e o perfil) está feito; ver "Encontre um médico — fatia B, grupo 1". Faltam especialidades, notícias e matéria, associação, diretoria, contato, Seja associado e as três páginas legais. Antes de construir cada grupo de páginas, o cliente vê e aprova um desenho, do mesmo jeito que a home (spec da reforma, seção 3). A fatia B também resolve a lista "feio, mas legível" da seção da fatia A, acima, e usa as fotos `sede` e `cidade` na página da Associação, se o desenho pedir
- **A foto do médico pelo painel** (próximo passo, não pendência do cliente): todo médico terá foto, e enquanto não houver, o site mostra as iniciais. O envio pelo painel é uma fatia à parte e depende do armazenamento de arquivos do Supabase, que ainda não está configurado
- **Área do associado** (Fase 2): login do médico, edição do próprio perfil, anuidade, carteirinha, comunicados e eventos
- ~~**Home nova**~~ **Construída** no ramo `home-nova`, entre 23/08 e 03/10/2026. "Encontre um médico" deixou de ser a página e virou um serviço da associação, com campo de busca dentro do cartão. O `<h1>` passou de "Encontre um médico em Imperatriz" para "Associação Médica de Imperatriz". O carrossel lê os banners do Sanity e para de girar em quatro situações: mouse ou teclado em cima, botão de pausa, aba fora da frente e preferência do sistema por menos movimento. A pedido do cliente, em 03/10/2026, cada peça sem conteúdo ganhou uma moldura "a entrar" no modo demonstração. A trava está em `lib/molduras.ts`, e `testes/home-renderizada.test.ts` monta a página de verdade com a chave ligada e desligada. Decisões em [`docs/superpowers/specs/2026-08-23-home-nova-decisoes.md`](superpowers/specs/2026-08-23-home-nova-decisoes.md). Em 03/10/2026 a reforma visual (fatia A) redesenhou essa home inteira; ver "Reforma visual — fatia A"

### 5. Itens técnicos adiados de propósito

Registrados com a razão em [`docs/decisoes-institucional-e-editorial.md`](decisoes-institucional-e-editorial.md):

- **Modo escuro** não implementado. Todos os contrastes foram medidos contra fundo claro, e refazê-los cedo demais arriscaria a acessibilidade já conquistada. A camada de tokens está semântica, então é mudança contida
- **Selo "Revisado por"** nas notícias, e os recursos de blog previstos na especificação (filtro por categoria, tempo de leitura, sumário lateral)
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
