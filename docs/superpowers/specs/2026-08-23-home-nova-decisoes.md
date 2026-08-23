# A nova home — decisões do levantamento

Data: 23 de agosto de 2026
Estado: **decidido, aguardando a fatia de paleta**

Este não é o desenho final. É o registro das decisões tomadas com o dono do projeto,
para que nenhuma se perca enquanto a paleta vem primeiro. O desenho completo é escrito
depois, já sabendo as cores.

Referência que o dono trouxe: `https://www.unimed.coop.br/site/web/maranhaodosul`

---

## Por que a home muda

Hoje o site **é** a busca de médicos: o título visível da home é "Encontre um médico em
Imperatriz", numa tela verde inteira. O dono quer que o site passe a ser a porta da
associação, com a busca sendo uma das portas de dentro — e que ela seja comunicada
exatamente como **"Encontre um médico"**.

**Medido, e remove uma preocupação:** o `<title>` que o buscador lê já é "Associação
Médica de Imperatriz". Só o `<h1>` visível fala de médicos. E `/medicos` tem título
próprio. Além disso o site **não está indexado** — `NEXT_PUBLIC_DADOS_DEMONSTRACAO=true`
bloqueia buscadores por inteiro. Não há posição a perder: este é o momento mais barato
possível para reorganizar.

## A forma nova

| | seção | estado |
|---|---|---|
| 1 | **Faixa da AMI** — quem somos, com os números vivos | nova, substitui o herói |
| 2 | **Carrossel de banners** | nova |
| 3 | **Serviços da AMI** — três cartões | nova |
| 4 | Especialidades | sem mudança |
| 5 | **Últimas notícias** — três, com "Ver todas" | nova |
| 6 | Institucional | sem mudança |
| 7 | Onde os médicos atendem | sem mudança |

Os números vivos (quantos profissionais, especialidades, bairros) sobrevivem, menores,
dentro da faixa. Eles saem do banco e nunca são escritos à mão — é a coisa mais honesta
da home.

## O banner

**É uma arte pronta**, produzida fora nas dimensões padrão. Não é texto sobre foto. A AMI
sobe a imagem, ela aparece; pode acrescentar, remover ou deixar fixa.

Mora no **Sanity**, ao lado de notícias e páginas institucionais — é onde o conteúdo do
site já vive e onde a AMI já edita, e o Sanity cuida de imagem sozinho.

**Dimensão, medida no site de referência:** as quinze artes do carrossel deles são
**3000 × 856**, proporção 3,5:1, e **uma arte só** — não há versão separada para celular.
O dono pediu que o padrão saísse da referência.

> **Pendência:** numa decisão anterior desta mesma conversa o dono escolheu duas artes,
> uma para computador e outra para celular, justamente porque arte larga encolhida no
> telefone fica ilegível. A referência faz o contrário. **As duas coisas não cabem
> juntas** e isto precisa ser resolvido antes de escrever o desenho final.

| campo | obrigatório |
|---|---|
| Nome interno (para achar na lista do Studio) | sim |
| Arte | sim |
| Descrição da imagem | sim |
| Para onde leva | não |
| Ordem (10, 20, 30, com folga) | sim |
| Aparece até | não — em branco significa fixo |

**"Aparece até" é o campo que mais importa.** Banner de assembleia, de prazo, de campanha
morre numa data. Sem ele, a AMI põe um aviso em março e o site anuncia em julho uma
reunião que já aconteceu. Com ele, o banner sai sozinho e ninguém precisa lembrar.

**A descrição da imagem é crítica, não cortesia.** Toda a informação do banner está dentro
da arte, e imagem é opaca para leitor de tela, para busca e para quem aumenta a fonte. A
descrição é o único caminho do conteúdo até essas pessoas, e precisa dizer o que o cartaz
diz — não "banner da assembleia", e sim "Assembleia geral no dia 12 de março, às 19h, na
sede da AMI".

## O carrossel

Construído **sem biblioteca nova** — o projeto não tem nenhuma, e um carrossel é rolagem
com encaixe lateral mais umas quarenta linhas.

- **Gira sozinho a cada 6 segundos**, com **botão de pausa visível** escrito "Pausar"
- Para quando: alguém pausa, o mouse entra, o teclado chega, ou a aba sai da frente
- **Setas dos dois lados** e **bolinhas** mostrando quantos são e onde se está
- **Arrastar funciona no celular** — vem de graça com o encaixe de rolagem
- **Quem pede menos movimento no sistema não recebe rotação nenhuma.** Fica parado no
  primeiro, setas funcionando, sem botão de pausa. O site já respeita essa configuração em
  dois lugares; é seguir o que existe
- **Com um banner só:** sem setas, sem bolinhas, sem rotação, sem pausa
- **Sem banner nenhum:** a seção não existe. Nada de espaço vazio nem "em breve"
- **O espaço é reservado antes da imagem chegar**, e o primeiro banner vem pronto do
  servidor — é o único que a maioria vai ver

O dono escolheu a rotação automática sabendo do custo: conteúdo que se move sozinho
atrapalha quem lê devagar, e quase ninguém acha o botão de pausa a tempo.

## Serviços da AMI

Nome escolhido entre quatro. Aguenta crescer sem virar mentira e serve aos dois públicos —
a população que procura médico e o médico que quer se associar.

**Cada cartão mostra algo vivo que o menu do topo não mostra**, para não ser um segundo
menu:

| cartão | destino | o que mostra a mais |
|---|---|---|
| **Encontre um médico** | `/medicos` | quantos profissionais, em quantas especialidades |
| **Fale com a AMI** | página nova | o telefone, clicável do próprio cartão |
| **Seja associado** | página nova | — |

A grade nasce com três e já comporta **Sua AMI** (aluguel de auditório, hall de eventos) e
**Empresa parceira da AMI**, que o dono anunciou para depois. Nenhuma moldura extra é
construída para elas agora.

## As duas páginas novas

**Fale com a AMI** sai hoje, sem depender de ninguém: endereço, os dois telefones, o
Instagram e o CNPJ já estão em `lib/ami.ts`, recebidos do cliente em 21/08/2026.

**Seja associado** nasce com **texto provisório assinalado**, pelo mesmo mecanismo e com o
mesmo aviso na tela das páginas legais — `components/editorial/RascunhoLegalNaTela.tsx`,
cujo comentário explica a escolha: *"Existe porque a alternativa era pior. Sem ele, três
endereços linkados do rodapé de toda página davam 404 até o jurídico entregar."*

O endereço `seja-associado` entra na lista fechada de páginas institucionais, então no dia
em que a AMI publicar o texto no Studio a versão dela toma o lugar do rascunho sozinha,
sem tocar em código.

**O provisório não inventa fato.** Sem valor de anuidade, sem lista de benefícios, sem
requisitos além do óbvio. Diz o que é a AMI, que a associação é de médicos com inscrição
no conselho, e como falar com ela.

**A ação é WhatsApp**, não formulário. Um botão que abre a conversa com a mensagem já
escrita. Formulário exigiria tabela nova, tela nova no painel, proteção contra robô, e
passaria a guardar dado pessoal de médico — o que obriga a política de privacidade a
descrever finalidade, prazo e como apagar, e ela já espera advogado.

> **Pendência do dono:** `lib/ami.ts` registra que **nenhum dos dois telefones está
> confirmado como WhatsApp**, e o comentário de lá diz por que não se supõe: *"um botão de
> WhatsApp apontando para uma linha que não atende por lá é pior do que não ter botão."*
> Enquanto não houver confirmação, o botão aponta para "Fale com a AMI", que lista os dois.

## O que fica de fora

| | por quê |
|---|---|
| Parceiros e patrocínios no carrossel | o dono tirou da lista |
| "Sua AMI" e aluguel de espaços | ainda não existe; a grade já comporta |
| Formulário de filiação | WhatsApp resolve hoje, sem guardar dado pessoal |
| Tratamento visual das seções novas | depende da fatia de paleta, que vem antes |

## O que a fatia de paleta vai mudar aqui

O dono apontou **quatro fontes de verde** e marcou todas: o herói escuro do topo, o fundo
cinza de todas as páginas, as etiquetas e botões verde-claro, e a impressão geral de
excesso. O verde deixa de ser o campo e vira acento.

Por isso a paleta vem primeiro: construir estas seções na paleta velha e repintar depois
seria fazê-las duas vezes.

**Medido:** o fundo de hoje é `--color-canvas: #f5f6f8`, e o comentário do próprio código
diz que ele já é *"cinza-prata frio, sem uma gota de verde"* — o verde de fundo já saiu
numa rodada anterior. O verde que resta vem do herói (`#04150c`), das etiquetas
(`#e9f6ee`) e dos estados de passagem do mouse. O site de referência usa **branco puro com
faixas de `#f4f4f4`**, um cinza perfeitamente neutro.
