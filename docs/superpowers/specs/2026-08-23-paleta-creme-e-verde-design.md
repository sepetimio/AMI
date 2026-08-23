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

| papel | token | valor | de onde vem |
|---|---|---|---|
| campo da página | `--color-canvas` | `#F2EFE6` | creme |
| superfície de cartão | `--color-surface` | `#FBFAF5` | creme mais claro |
| verde profundo | `--color-ami-green-900` | `#0D2E0C` | `#248322` aprofundado |
| acento | `--color-ami-lima-400` | `#A8D470` | `#248322` clareado |
| ação | `--color-ami-green-600` | `#1F6B3A` | mantido |
| marca | — | `#00A457` | intocado, no logotipo |

### Os números, medidos

| par | razão |
|---|---|
| `ink-900` no creme | **15,46:1** |
| `ink-600` no creme | **5,86:1** |
| `ink-400` no creme (corrigido) | **5,02:1** |
| ação `#1F6B3A` no creme | **5,67:1** |
| creme sobre verde profundo | **14,22:1** |
| acento sobre verde profundo | **8,72:1** |
| tinta sobre acento | **10,42:1** |

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

Ele só pode ser: fundo de texto escuro (10,42:1), ou marca sobre o verde profundo
(8,72:1). **Nunca texto sobre fundo claro.** Isto é física, não preferência, e vale para
qualquer tela futura.

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
