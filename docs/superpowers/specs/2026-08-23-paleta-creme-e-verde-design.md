# A paleta: creme e verde da marca — desenho

Data: 23 de agosto de 2026
Estado: aprovado no levantamento, aguardando plano

---

## 1. Por que esta fatia existe

O dono do projeto apontou quatro fontes de verde no site e marcou **todas**: o herói
escuro do topo, o fundo cinza de todas as páginas, as etiquetas e botões verde-claro, e a
impressão geral de excesso. O pedido dele: *"tirasse aquele tom esverdeado da página,
deixando um tom de branco sem ser o branco puro"*.

Ela vem **antes** da reformulação da home (`2026-08-23-home-nova-decisoes.md`) por um
motivo prático: construir as seções novas na paleta velha e repintar depois seria fazê-las
duas vezes.

## 2. O que as referências dele dizem, e o que elas contradizem

Ele trouxe três: o site da Nursing Now Brasil, uma arte "Sites que Vendem" e um cartaz da
LOOP The Marketing.

**Duas das três são verde do começo ao fim.** Ou seja: ele não quer menos verde — quer
outro verde.

| | o site hoje | as referências |
|---|---|---|
| os verdes | quase-preto `#04150c`, musgo `#1f6b3a`, mint lavado `#e9f6ee` | verde cheio **contra** um limão vibrante |
| como aparecem | diluídos por toda parte: fundo, passagem de mouse, etiquetas | em blocos decididos, com contraste alto entre si |
| o fundo | cinza-esverdeado que tinge tudo | neutro, ou verde inteiro; sem meio-termo |

O comentário do próprio `app/globals.css` já registrava a desconfiança: *"o verde no fundo
era o que fazia a página inteira parecer papel timbrado de consultório."* O verde de fundo
saiu numa rodada anterior; o resto continuou lavado.

Das quatro coisas que as referências ofereciam, ele escolheu **duas**: o contraste de
verdes, e o branco-creme em vez de branco puro. Recusou a estrutura de foto grande da
Nursing Now e as formas arredondadas de agência. **Isto é uma mudança de cor, não de
estrutura.**

## 3. A descoberta que mudou a base

Ao buscar os tons, medi o arquivo da marca — `public/marca/ami-marca.svg`. Ele contém
**dois verdes**:

| | |
|---|---|
| `#00A457` | esmeralda, vibrante |
| `#248322` | escuro e puxando para o amarelo |

**O segundo já é da família do limão**, só que sóbrio. A AMI já tinha o par de verdes que
as referências mostravam; eu ia propor cores tiradas de um cartaz da internet.

Apresentadas duas saídas — derivar tudo da marca, ou manter a marca e acrescentar um limão
saturado —, o dono escolheu **derivar tudo da marca**. Nada é inventado.

## 4. A paleta

> **Reescrita em 23 de agosto de 2026, depois da entrega.** Esta seção descrevia o
> desenho aprovado, e o construído diverge dele em dois pontos. Como este é o documento
> que o dono leu e aprovou, ele passa a descrever o que existe, com as divergências
> nomeadas logo abaixo. Toda razão foi recalculada dos valores entregues, com a fórmula
> da WCAG 2.1 — a mesma de `testes/paleta.test.ts`.

| papel | token | valor | de onde vem |
|---|---|---|---|
| campo da página | `--color-canvas` | `#F2EFE6` | creme |
| superfície de cartão | `--color-surface` | `#FBFAF5` | creme mais claro |
| bloco dentro de bloco | `--color-surface-fundo` | `#F7F5EF` | creme entre os dois |
| verde profundo | `--color-ami-green-900` | `#071A07` | `#248322` aprofundado |
| verde de bloco | `--color-ami-green-800` | `#0D2E0C` | `#248322` aprofundado |
| borda e estado escuro | `--color-ami-green-700` | `#124211` | `#248322` aprofundado |
| ação | `--color-ami-green-600` | `#1A5E18` | `#248322` aprofundado |
| acento | `--color-ami-lima-400` | `#A8D470` | `#248322` clareado |
| lavagem e pílula de associado | `--color-ami-lima-100` | `#E2E9CC` | `#248322` clareado |
| marca | — | `#00A457` | intocado, no logotipo |

### As duas divergências entre o aprovado e o entregue

**1. O `#0D2E0C` desceu um degrau, e um verde mais escuro entrou acima dele.** A tabela
aprovada dava `#0D2E0C` como `ami-green-900`, o verde profundo. No entregue,
`ami-green-900` é `#071A07`, e o `#0D2E0C` é `ami-green-800`. A cor que o dono escolheu
continua no sistema, com outro nome — mas deixou de ser o tom mais escuro, e isso tem
consequência direta na ressalva da seção 5.

**2. A cor de ação mudou de valor e de matiz depois da aprovação.** A tabela dizia
`ami-green-600: #1F6B3A`, com a palavra **mantido**. O entregue é `#1A5E18`, e a troca
não é um ajuste de tom:

| | matiz | croma | no creme |
|---|---|---|---|
| aprovado `#1F6B3A` | 141° | 76 | 5,67:1 |
| entregue `#1A5E18` | 118° | 70 | 6,87:1 |
| a marca `#248322` | 119° | 97 | 4,20:1 |

São 23° de deslocamento: `#1F6B3A` é um verde-esmeralda que puxa para o azul, e `#1A5E18`
está na matiz do próprio `#248322` da marca. O contraste melhorou, e a coerência com a
seção 3 — *"nada é inventado, tudo sai da marca"* — também. Mas **é a cor de ação do site**,
com 60 usos entre botão, link, borda de foco e estado, e ela mudou de família sem passar
pela aprovação. Fica registrado aqui em vez de só no plano.

### Os números, medidos

Medidos da paleta entregue, não copiados. Os da versão anterior desta seção tinham dois
problemas distintos: valores que deixaram de valer, e um **rótulo errado** — a linha
"creme sobre verde profundo" media `surface`, que é o creme mais claro, e não `canvas`,
que é o creme. É o mesmo defeito que a última revisão achou no teste, e a correção é a
mesma: nomear o par.

| par | razão |
|---|---|
| `ink-900` no creme | **16,80:1** |
| `ink-600` no creme | **5,86:1** |
| `ink-400` no creme (corrigido) | **5,02:1** |
| `warn` no creme | **5,23:1** |
| ação `#1A5E18` no creme | **6,87:1** |
| `ami-green-700` no creme | **10,07:1** |
| **creme** (`canvas`) sobre o verde profundo `#071A07` | **15,75:1** |
| superfície sobre o verde profundo `#071A07` | **17,33:1** |
| creme sobre `ami-green-800` `#0D2E0C` | **12,92:1** |
| acento sobre o verde profundo `#071A07` | **10,62:1** |
| acento sobre `ami-green-800` `#0D2E0C` | **8,72:1** |
| tinta sobre acento | **11,33:1** |
| `ink-400` sobre `ami-lima-100` | **4,61:1** — o par mais apertado do sistema |

### O defeito que a medição achou antes de existir

**`ink-400` cai de 5,0:1 no branco para 4,33:1 no creme** — abaixo do mínimo de 4,5:1. Ele
é usado em legenda, data e contagem, que é texto de corpo. O creme é mais escuro que o
branco, e toda a escala de tinta perde contraste junto.

O comentário de `app/globals.css` já registra que isso aconteceu uma vez: *"a medição
desmentiu dois: `ink-400` estava em 3,48:1 e reprovava em AA para texto de corpo, que é
exatamente o uso dele."*

**Correção:** `ink-400` passa de `#6B7079` para `#61666F`, que dá **5,02:1** — meio ponto
acima do mínimo, não colado nele.

### O limite que não é escolha

**O acento `#A8D470` como letra sobre o creme dá 1,48:1.** Invisível.

Ele só pode ser: fundo de texto escuro (`ink-900` sobre ele, **11,33:1**), ou marca sobre
o verde — e aqui o verde precisa de nome, porque são dois: **10,62:1** sobre o verde
profundo `#071A07`, **8,72:1** sobre `ami-green-800` `#0D2E0C`. **Nunca texto sobre fundo
claro.** Isto é física, não preferência, e vale para qualquer tela futura.

## 5. Uma ressalva registrada

Foram apresentados três verdes para a faixa de seção, com o croma medido — o quanto a cor
se distingue de um cinza:

| | croma | creme sobre ela |
|---|---|---|
| profundo `#0D2E0C` | 34 | 14,22:1 |
| nítido `#1A5218` | 58 | 8,88:1 |
| vivo `#1E5F1C` | 67 | 7,42:1 |

**Recomendei o nítido**, porque croma 34 numa faixa larga tende a ler como preto, e o
verde some — que é justamente o efeito que esta fatia existe para produzir.

**O dono escolheu o profundo.** Fica registrado: se ao ver montado a faixa parecer preta,
é um token para trocar, e a alternativa medida está aqui.

*(A coluna "creme sobre ela" acima também trocou o par: os três números são de `surface`,
o creme mais claro. Sobre `canvas`, que é o creme, dão **12,92:1**, **8,07:1** e
**6,74:1**. Croma na tabela é a diferença entre o maior e o menor canal, em 0–255 — a
mesma conta dos números originais.)*

### O que a escolha decidiu, e o que ela não alcançou

Escrito depois da entrega, porque a divergência da seção 4 esvazia esta ressalva.

**A faixa larga de verde que domina a home hoje não é o `#0D2E0C` que o dono escolheu.**
É `ami-green-900`, `#071A07` — o herói inteiro do topo, em `app/(site)/page.tsx`, mais o
rodapé de todas as páginas.

| | croma | creme sobre ela |
|---|---|---|
| **entregue no herói** `#071A07` | **19** | **15,75:1** |
| profundo `#0D2E0C` (escolhido) | 34 | 12,92:1 |
| nítido `#1A5218` | 58 | 8,07:1 |
| vivo `#1E5F1C` | 67 | 6,74:1 |

Croma 19 é **quase metade** do croma 34 que já me preocupava, e menos de um terço do que
eu recomendei. A superfície larga do site é mais escura e menos verde que as três opções
que ele comparou.

O `#0D2E0C` que ele escolheu está hoje na placa de iniciais do médico, de 76 a 108px, e
na ponta escura de três degradês mascarados pela marca. Nenhum desses é uma faixa larga.
**E a faixa de seção para a qual a escolha foi feita ainda não existe** — ela nasce na
fatia da home.

O julgamento continua sendo dele, e agora com o par certo à frente: a pergunta a fazer não
é se o `#0D2E0C` lê como preto numa faixa, é se o `#071A07` lê como preto no herói.

## 6. O tamanho real do trabalho

Contei os usos de cada token no código:

| token | usos | destino |
|---|---|---|
| `line` | 68 | novo valor, sobre creme |
| `ami-green-600` | 50 | mantido |
| `surface` | 37 | novo valor |
| `ami-green-700` | 16 | novo valor |
| `ami-mint-100` | 13 | vira o acento |
| `canvas` | 11 | novo valor |
| `ami-mint-400` | 5 | vira o acento |
| `ami-green-950` | 3 | vira o verde profundo |
| `ami-green-900`, `800` | 1 cada | consolidados |
| `ami-green-500`, `surface-fundo` | **0** | **apagados — já estão mortos** |

**Quase tudo é trocar valor em `app/globals.css`.** Os componentes usam os tokens pelo
nome, então mudam sozinhos. O que exige atenção componente a componente é onde a cor foi
escrita à mão em vez de vir do token, e onde o contraste dependia do fundo antigo.

Dois tokens já não são usados por ninguém e saem junto — não é escopo extra, é limpeza que
esta fatia torna óbvia.

*(Registrado depois da entrega: `ami-green-500` saiu, `surface-fundo` **não**. Ele
continua declarado e é o fundo de `.moldura`, em `app/globals.css` — e `.moldura` não é
aplicada em nenhum componente, o efeito de casca dupla foi refeito à mão com
`bg-surface p-2` em `app/(site)/page.tsx` e em `app/(site)/noticias/[slug]/page.tsx`. É
uma classe sem consumidor, o mesmo tipo de buraco que a `div.grao` sem regra, e é decisão
de desenho: ou os dois lugares passam a usar `.moldura`, ou a regra e o token saem. Fica
para a fatia seguinte.)*

## 7. A trava que falta, e que esta fatia cria

`app/globals.css` diz hoje, em comentário: *"Quem alterar qualquer tom aqui mede de novo."*

**Comentário não mede nada.** Ele foi ignorado uma vez — e o próprio arquivo registra o
resultado. Ia ser ignorado de novo agora.

Esta fatia acrescenta um **teste que lê os tokens de `app/globals.css`, calcula as razões
de contraste e reprova se qualquer par cair abaixo do mínimo**:

- tinta forte, tinta secundária e tinta de legenda sobre o campo e sobre a superfície: ≥ 4,5:1
- creme sobre o verde profundo: ≥ 4,5:1
- acento sobre o verde profundo: ≥ 4,5:1
- tinta sobre o acento: ≥ 4,5:1
- **o acento como letra sobre o campo: reprova se alguém tentar** — a regra invertida, que
  falha se um dia esse par for usado como texto

O teste tem que ser **provado por mutação**: mudar um token para um valor que reprova e
confirmar que ele fica vermelho. Sem isso, é mais um comentário.

## 8. Como isto é verificado

**Teste de contraste**, acima. É a única camada que pega regressão de cor sozinha.

**A tela, com os olhos.** Cor não se confere lendo hexadecimal. Todas as páginas do site
público e do painel, em janela estreita e larga.

**A conferência com o dono.** Ele recusou austeridade duas vezes e escolheu o verde
profundo contra a minha recomendação. O julgamento final é dele, e a faixa é a primeira
coisa a olhar.

## 9. O que fica de fora

| | por quê |
|---|---|
| A nova home | fatia própria, já desenhada, vem depois desta |
| Estrutura de foto grande da Nursing Now | o dono recusou; exige fotografia que a AMI ainda deve |
| Formas arredondadas de agência | o dono recusou |
| O logotipo | `#00A457` e `#248322` são a marca, não são meus para mudar |
| Tipografia | não foi pedida e não é o que incomoda |

## 10. Riscos

- **A faixa profunda pode ler como preto.** Registrado na seção 5, com a alternativa
  medida pronta
- **O creme muda toda a escala de tinta.** Um token corrigido já foi achado por medição; o
  teste da seção 7 é o que impede o próximo passar
- **A paleta vale para o painel também.** Ele usa o mesmo `app/globals.css`. Não foi
  discutido com o dono, e a alternativa — painel numa paleta própria — seria duas paletas
  para manter. Fica como decisão a confirmar na revisão
- **Cor escrita à mão em componente** escapa do token e do teste. A varredura da fatia
  precisa achar todo hexadecimal solto em `app/` e `components/`
