# Reforma visual do site da AMI — decisões

> 3 de outubro de 2026 · ramo `redesign-visual`
> Desenho aprovado pelo cliente: [`docs/desenho-aprovado/home-aprovada.html`](../../desenho-aprovado/home-aprovada.html)
> (abre direto no navegador) e as imagens em [`docs/desenho-aprovado/`](../../desenho-aprovado/).

## 1. O que é, em uma frase

Levar para o site de verdade a home que o cliente aprovou no desenho, depois de doze
rodadas de ajuste, e passar a mesma aparência para as outras páginas públicas.

## 2. De onde vem cada decisão

O **desenho aprovado é a referência**. Quando este documento e o desenho discordarem,
vale o desenho, e o documento é corrigido. O desenho tem tudo medido: cores, tamanhos,
espaços, o comportamento no celular e no computador.

A referência estética foi o portal da Sociedade Brasileira de Cardiologia
(`portal.cardiol.br`): fundo claro, cada seção com tratamento próprio, títulos grandes
sem negrito, uma cor só nos botões.

O cliente recusou, ao longo das rodadas, e isto não pode voltar:

- fundo creme (leu como "desbotado")
- verde-limão claro em fundo de caixa ou de ícone (leu como amarelado)
- sombra com tom de verde (leu como creme)
- passar o mouse e o elemento ficar verde claro ("tira o premium")
- botão verde médio chapado, e botão verde quase preto
- uma caixa branca atrás da outra, todas iguais ("box após box")
- celular que só empilha o layout do computador ("só verticalizou tudo")
- qualquer coisa cortada na borda da tela do celular
- espaços diferentes entre blocos, ou elementos que deviam estar alinhados e não estão

## 3. O tamanho do trabalho

Duas fatias, nesta ordem:

**Fatia A — a base e a home.** Cores, fontes, botões, cabeçalho, rodapé, barra do pé no
celular, e a home inteira como no desenho. Ao fim da fatia A, as outras páginas já
mudam de tom e de fonte sozinhas (ver seção 4), mas ainda com o arranjo antigo.

**Fatia B — as outras páginas.** Busca, especialidades, bairro, perfil do médico,
notícias e matéria, associação, diretoria, contato, Seja associado e as três páginas
legais. **Antes de construir cada grupo de páginas, o cliente vê e aprova um desenho**,
do mesmo jeito que a home. Fatia B tem documento e plano próprios.

**Fora:** o arranjo do painel da agência (`/painel`). Ele é ferramenta interna. Herda as
cores e as fontes novas automaticamente, porque usa a mesma folha de estilo, e nada mais
muda nele.

## 4. A base visual

### Cores

As páginas usam nomes de cor (`canvas`, `surface`, `line`, `ink-600`…), não códigos.
Trocar o valor por trás do nome muda o site inteiro de uma vez. Os nomes ficam; os
valores mudam:

| Nome | Hoje | Passa a ser | Para quê |
|---|---|---|---|
| `canvas` | `#F2EFE6` creme | `#EEF1EF` branco-gelo | fundo da página |
| `surface` | `#FBFAF5` | `#FFFFFF` | blocos e cartões |
| `surface-fundo` | `#F7F5EF` | `#F6F7F8` | fundo de apoio dentro de bloco |
| `line` | `#E4E0D4` | `#E5E7EB` | bordas e divisórias |
| `line-strong` | `#D8D3C4` | `#D1D5DB` | borda ao passar o mouse |
| `ink-600` | `#565c66` | `#4F5661` | texto secundário |
| `ink-400` | `#61666F` | `#646B75` | legenda, data |

Os verdes da marca, o verde-limão e o `warn` ficam como estão.

**`ami-lima-100` deixa de ser usado como fundo.** Hoje ele está em 13 lugares, quase
todos efeito de mouse, e no selo "Associado AMI". O efeito de mouse sai (ver
"Movimento"). O selo vira contorno verde fino com texto verde, sem fundo.

Contrastes medidos em 3 de outubro, contra o fundo novo da página (`#EEF1EF`), o
branco e o fundo de apoio:

| Texto | página | branco | apoio |
|---|---|---|---|
| `ink-900` | 16,98 | 19,32 | 18,01 |
| `ink-600` | 6,51 | 7,40 | 6,90 |
| `ink-400` | **4,73** (o mais apertado) | 5,38 | 5,02 |
| `warn` | 5,28 | 6,01 | 5,60 |
| `ami-green-600` | 6,95 | 7,90 | 7,37 |
| branco no botão (degradê) | 4,85 no topo · 6,61 na base | | |

`testes/paleta.test.ts` recalcula tudo isso a cada rodada. A rede de proteção dele fica
e passa a conhecer os valores novos.

### Fontes

| Uso | Hoje | Passa a ser |
|---|---|---|
| Títulos | Geist | **Bricolage Grotesque**, peso 500, espaçamento −0,035em |
| Texto | Geist | **Plus Jakarta Sans** |
| CRM, RQE e outros registros | Geist Mono | Geist Mono, sem mudança |

As três carregam pelo `next/font`, do próprio site, sem depender do Google na hora de
abrir a página. A monoespaçada continua só no número de registro do médico: é ela que
faz o CRM ler como assento de registro, e esse motivo, escrito em `lib/fontes.ts`,
continua valendo.

### Botões

- **Botão principal:** pílula com 48px de altura, degradê do verde da marca
  (`#2B8229` → `#1F6B1D`), uma luz fina no topo, texto branco e seta. Ao passar o mouse
  fica um pouco mais escuro, sobe 1px e ganha sombra neutra.
- **Botão secundário:** pílula com 38px de altura, branca, com borda fina. Ao passar o
  mouse, a borda escurece e o botão sobe 1px. **Não fica verde.**
- **Botão das artes do carrossel:** pílula verde-limão com texto verde-escuro, também
  com 48px de altura.
- O texto de botão nunca quebra linha.

### Espaços e alinhamento

São três réguas, uma para cada tamanho de tela:

| | celular (até 700px) | tablet (até 980px) | computador |
|---|---|---|---|
| margem interna dos blocos | 20px | 28px | 48px |
| espaço entre um bloco e o próximo | 32px | 56px | 72px |

- **O texto de todas as seções começa na mesma linha vertical**, inclusive nas faixas
  que vão de ponta a ponta da tela e no rodapé.
- Elementos irmãos (os quatro botões dos números, os títulos de Missão, Visão e Valores,
  a coluna de notícias ao lado do destaque) **começam e terminam no mesmo pixel**.
- Largura máxima do conteúdo: 1240px.

### Formas, sombras e textura

- **Cantos:** 22px nos blocos grandes, 16 a 18px nos cartões, pílula nos botões.
- **Sombra:** neutra, cinza-azulada, nunca com tom de verde.
- **Textura granulada:** no bloco verde da busca e no rodapé, com degradê e um brilho
  suave que passeia devagar. No site de verdade ela é uma **imagem pequena repetida**,
  não o filtro que o desenho usa, porque o filtro pesa para o navegador desenhar a cada
  rolagem.

### Ícones

São ícones de dois tons, dentro de um ladrilho cinza-claro arredondado, com o ícone em
verde. Vêm da coleção Phosphor, pela biblioteca `@phosphor-icons/react`, **só os ícones
usados**, como desenho leve. O desenho de referência baixava a coleção inteira (duas
fontes de ícones); o site não faz isso.

### Movimento

- Os blocos surgem suavemente quando chegam à tela, e os itens de dentro aparecem um
  depois do outro.
- Os números contam de 0 até o valor.
- O cabeçalho vira vidro fosco ao rolar.
- Ao passar o mouse: fotos aproximam devagar, setas dos botões andam, cartões sobem 1 a
  3px. Nunca uma troca para verde claro.
- **Quem pede menos movimento no sistema vê tudo parado.** Isso já é regra do site e
  continua.
- Sem animação, o conteúdo aparece normalmente. A animação só é ligada depois que a
  página carrega. Se o script falhar, nada fica escondido.

## 5. O que toda página pública tem

- **Cabeçalho** num bloco branco fino, preso ao topo **durante a página inteira**: o
  invólucro preso é filho do corpo da página, não do primeiro bloco (esse foi um defeito
  achado no desenho). Logotipo pequeno, menu, botão "Seja associado".
- **Menu:** Início, A Associação, Encontre um médico, Especialidades, Sua AMI, Notícias,
  Contato. Abaixo de 1180px vira um botão (☰) que abre uma gaveta, que fecha com X, Esc,
  toque fora ou escolha de item. "Sua AMI" aponta para o bloco Sua AMI da home enquanto
  não existir página própria.
- **Rodapé verde** com textura: nome, CNPJ, três colunas de links, endereço e telefones,
  e a linha de baixo com os links das páginas legais. O aviso de dados de demonstração,
  que já existe, continua.
- **Barra do pé, só no celular:** "Encontrar médico" e "Ligar". Aparece depois que a
  pessoa rola para além do topo e some enquanto a busca está na tela. Na home leva à
  busca da própria home; nas outras páginas, a `/busca`. "Ligar" usa o fixo da sede até
  a AMI confirmar qual número atende WhatsApp.
- **Acessibilidade:** atalho "Pular para o conteúdo"; um único título principal (`h1`)
  por página; contorno de foco visível em tudo que se clica, verde no claro e
  verde-limão no escuro; alvos de toque de pelo menos 24 × 24px.

## 6. A home, de cima para baixo

Cada seção tem um tratamento diferente da vizinha. É isso que resolve o "box após box".

| # | Seção | Computador | Celular |
|---|---|---|---|
| 1 | Carrossel | caixa branca, controles centrados sob o botão do slide | cartão vertical 4:5, texto sobre a foto, controle só com bolinhas e pausa |
| 2 | Números | sem caixa, direto no fundo, colunas com fio | 4 cartõezinhos, sem descrição e sem botão |
| 3 | Encontre um médico | faixa verde de ponta a ponta, com textura | campo largo, especialidades numa fileira que desliza |
| 4 | Sua AMI | foto grande com cartão de vidro por cima | foto em cima, cartão branco sobreposto |
| 5 | Seja associado + Quem é a AMI | faixa branca de ponta a ponta; Missão, Visão e Valores em três cartões | foto em cima; Missão, Visão e Valores em linhas |
| 6 | Notícias | sem caixa; destaque com texto sobre a foto e três ao lado, **com a mesma altura** | destaque grande, três em lista com miniatura |
| 7 | Bairros + Empresas parceiras | uma faixa branca de ponta a ponta, com fio no meio | bairros em duas colunas, logotipos em duas linhas de três |
| 8 | Rodapé | emendado na faixa branca de cima | compacto, links em duas colunas |

**O `h1` da home** é "Associação Médica de Imperatriz", lido por leitor de tela e pelo
Google, mas não desenhado. Quem o desenha é o logotipo, e o carrossel já diz o nome da
associação. Hoje o `h1` está na faixa da AMI, que sai.

**Sai da home atual:** a faixa da AMI com o título (`FaixaDaAmi`), os quatro cartões de
serviço (`ServicosDaAmi`), o índice de especialidades em grade (vira as pílulas do
bloco verde mais "veja todas as 14 especialidades") e o bloco institucional com a foto
da fachada (vira "Quem é a AMI?"). O que o cartão "Fale com a AMI" fazia passa para o
menu, o rodapé e o botão "Ligar".

**Os números** saem do banco, como hoje. "Anos de AMI" é calculado do ano de fundação
em `lib/ami.ts` (1975), não escrito à mão.

## 7. O carrossel

### Dois tipos de slide

O banner cadastrado no Sanity passa a ter um campo **tipo**:

- **Arte pronta.** Uma imagem que cobre o slide inteiro, mais uma **versão para
  celular, em 4:5**. Sem a versão de celular, o site recorta a larga pelo ponto de
  interesse, que o Sanity já guarda. Hoje a medida combinada é 3000 × 856. O slide novo
  é mais alto: no desenho, a 1440px de tela, ele mede 1192 × 512, proporção 2,33:1
  (medido). **O carrossel do computador passa a ter essa proporção fixa**, para a arte
  caber exata, e a medida da arte larga passa a **3000 × 1288**. A arte de celular fica
  em **1080 × 1350** (4:5).
- **Foto com texto, montado no próprio site.** Foto, rótulo pequeno, título, texto
  curto, texto do botão e destino. No computador, o texto fica à esquerda e a foto à
  direita; no celular, o texto fica sobre a foto, com degradê escuro. **Não precisa de
  designer**: a AMI monta com uma boa foto e uma frase.

### Comportamento

- **Giro contínuo:** depois do último slide, o primeiro entra pela direita, sem voltar
  passando por todos. O mesmo ao contrário.
- **Tempo:** a bolinha do slide atual enche em 6 segundos e, quando completa, o
  carrossel passa.
- **Pausa:** com o botão de pausa (que só o botão desfaz), com o mouse em cima, com o
  foco de teclado dentro, com a aba fora da frente, e para quem pede menos movimento.
  No celular, tocar **não** pausa; esse foi um defeito achado e corrigido no desenho.
- **Deslizar o dedo** para o lado troca o slide; para cima e para baixo rola a página.
- **Controles:** bolinhas, anterior, próximo e pausa, centralizados sob o botão do
  slide. Ficam brancos sobre slide escuro e escuros sobre slide claro. No celular, sem
  anterior e próximo.
- O que já existe e continua: a leitura de "menos movimento" sem divergir entre
  servidor e navegador (`useSyncExternalStore`), e a pausa separada entre botão e uso.

## 8. Molduras "a entrar" e a trava do lançamento

A regra que já existe continua: **toda moldura "a entrar" só aparece em modo
demonstração; fora dele, o que falta some.** O teste que monta a home com a chave
ligada e desligada continua valendo e cresce com as seções novas.

Molduras novas:

- Missão, Visão e Valores: "Texto da AMI a entrar".
- Fotos de Sua AMI e de Seja associado.
- Slides de foto com texto sem foto: a área da foto vira moldura.

O texto de "Quem é a AMI?" é verdadeiro e já existe. O de Sua AMI também ("Auditório e
hall de eventos da AMI para alugar"): não se inventa capacidade, preço nem horário.

## 9. Desempenho

- Fotos pelo `next/image`, com tamanhos declarados para nada pular ao carregar. Só a
  primeira imagem do carrossel tem prioridade; o resto carrega quando chega perto da tela.
- Ícones como desenho, só os usados.
- Textura em imagem pequena repetida.
- Só as três fontes da seção 4.

## 10. Como provar que ficou como o desenho

1. **Testes que já existem continuam passando.** Os de paleta e da home renderizada são
   atualizados para a estrutura e as cores novas, com a regra de sempre: cada asserção
   nova é provada quebrando o código de propósito.
2. **Medição no navegador, em oito larguras** (375, 390, 430, 768, 1024, 1280, 1440 e
   1920px), com o site rodando em produção (`next build` + `next start`). É a mesma
   bateria usada na revisão final do desenho:
   - nada passa da borda;
   - nenhum botão quebra linha;
   - o texto de todas as seções começa na mesma linha;
   - os espaços entre blocos são iguais;
   - cada slide mostra o texto, com os controles centrados sob o botão;
   - o menu aparece na forma certa para a largura;
   - a barra do pé aparece só no celular;
   - o cabeçalho continua no topo do começo ao fim da página.
3. **Comparação lado a lado com o desenho**, em foto da página inteira no computador e
   no celular, nas mesmas larguras das imagens de `docs/desenho-aprovado/`.
4. **A trava:** `next build` com a chave desligada, e nenhuma moldura na página.

## 11. O que depende da AMI

- As artes do carrossel, larga e de celular, ou fotos para os slides de foto com texto.
- Os textos de Missão, Visão e Valores.
- Fotos de Sua AMI e de associados.
- Qual telefone atende WhatsApp.
- O de sempre: a planilha dos médicos, os textos institucionais e os CRMs da diretoria.

## 12. Riscos

| Risco | O que fazer |
|---|---|
| Trocar as cores muda também páginas que ainda não foram redesenhadas, e alguma pode ficar estranha no meio do caminho | Fatia A termina com uma volta por todas as páginas, medindo contraste e transbordo; o que ficar feio, mas legível, espera a fatia B |
| O painel muda de fonte e de tom junto | Aceito: é a mesma folha de estilo. Conferir que nenhum formulário dele quebrou |
| O tipo novo de banner muda o cadastro no Sanity | Campo novo com valor padrão "arte pronta", para os banners já cadastrados (hoje nenhum) continuarem válidos |
| O desenho usa fotos de banco de imagens | Elas **não** vão para o site; no lugar, molduras até a AMI mandar fotos |
