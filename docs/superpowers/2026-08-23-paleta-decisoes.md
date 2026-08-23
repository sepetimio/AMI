# A paleta creme e verde — decisões tomadas durante a execução

Data: 23 de agosto de 2026
Ramo: `paleta-creme`
Spec: `docs/superpowers/specs/2026-08-23-paleta-creme-e-verde-design.md`
Plano: `docs/superpowers/plans/2026-08-23-paleta-creme-e-verde.md`

Cinco tarefas, um implementador e um revisor independente por tarefa, sem parar para
perguntar entre elas. Cada decisão tomada em nome do dono está aqui, **com o custo de
estar errada**.

Vinte decisões. **Cinco delas corrigem um número que eu escrevi de memória.**

---

## O erro que se repetiu cinco vezes

Um número de contraste sob o rótulo de outro par. Sempre a mesma forma, em cinco lugares
diferentes:

| onde | o rótulo dizia | o número era de |
|---|---|---|
| comentário de `ami-green-900` | "creme sobre ele" | o verde como texto no creme |
| comentário de `testes/paleta.test.ts` | `ami-lima-400` | `ami-mint-400`, outra cor |
| o plano, valor da lâmina | "a superfície nova" | um branco que não é a superfície |
| a spec, seção 4 | "creme sobre verde profundo" | `surface`, não `canvas` |
| a spec, seção 5 | "creme sobre ela" | `surface`, não `canvas` |

Numa fatia cujo propósito é impedir exatamente isso. O teste que ela cria não lê
comentário — mede o valor. Foi o que salvou.

**Regra para as fatias seguintes:** todo número de contraste escrito em prosa nomeia os
dois lados do par.

---

## As decisões

### 1

`--color-ami-green-500` NÃO é apagado por ser "morto" — ele tem QUATRO
consumidores. Eu contei zero porque grepei só padrão de classe do Tailwind
(`bg-ami-green-500`), e os quatro usos são `var(--color-ami-green-500)` dentro de string
de gradiente, em `app/(site)/page.tsx:104`, `components/base/EstadoVazio.tsx:22`,
`components/base/Fotografia.tsx:49` e `components/layout/Cabeceira.tsx:46`. Apagá-lo
deixaria os quatro gradientes sem a primeira parada de cor — falha silenciosa, porque
`var()` de token inexistente não é erro.
Decisão: os quatro gradientes migram para a família nova (`ami-lima-400` → `ami-green-800`
nos três decorativos; a home tem tratamento próprio na tarefa 4), e só então o token sai.
A migração é da TAREFA 3, junto com as outras renomeações. — Custo se errado: um gradiente
decorativo com cor diferente da esperada, visível na conferência da tarefa 5.

### 2

`--color-surface-fundo` NÃO é apagado — tem um consumidor,
`app/globals.css:285`, na classe `.moldura`. Mesma falha de método: contei classe do
Tailwind e ele é usado por `var()`. Ele passa a valer `#F7F5EF`, um creme entre o campo e
a superfície, mantendo o papel de "bloco dentro de bloco" que o comentário descreve. —
Custo se errado: molduras do painel com fundo levemente errado.

### 3

`--color-danger` É morto de verdade — zero usos, conferido com os dois padrões
(os aparecimentos de "danger" no código são `dangerouslySetInnerHTML`, outra coisa). Ele
sai. `--color-warn` tem 17 usos e fica, medido no creme pelo passo 7 da tarefa 2. — Custo
se errado: nenhum; um token a menos que ninguém usava.

### 4

a contagem de usos da spec (seção 6) e do plano está ERRADA para dois tokens, e
o método é a causa. Quem executar a tarefa 3 usa a contagem correta abaixo, medida com os
dois padrões:

### 5

os dois Importantes da revisao da tarefa 1 entram, no MESMO despacho da correcao
da tarefa 2 — os dois tocam `testes/paleta.test.ts`, e o implementador da 2 esta com o
arquivo em maos. Separar criaria dois implementadores no mesmo arquivo.
  (a) A assercao invertida de `ink-300` so testa `canvas`. `surface` e o fundo onde o
  limite e cruzado PRIMEIRO — o revisor mutou para `#727272` e mostrou que passa. A
  promessa escrita no proprio comentario nao vale para metade dos fundos.
  (b) `ami-green-600` e usado como TEXTO em `text-ami-green-600` (LinhaMedico.tsx:59,115),
  sobre fundo claro, e nao tem assercao nenhuma. O revisor mutou para `#5fa876` (2,86:1) e
  os 9 testes continuaram verdes — enquanto o comentario ao lado dele no CSS afirma uma
  razao medida que nada verifica.
— Custo se errado: duas mordidas baratas ficariam de fora do unico teste que vigia cor.

### 6

a "correcao" que o implementador fez nos meus dois numeros esta ERRADA, e o
defeito e o que esta fatia existe para impedir: o comentario passou a dizer
"creme sobre ele 15,75:1" para `green-900`, mas 15,75 e a razao do VERDE COMO TEXTO no
creme. "Creme sobre ele" e 17,33. O mesmo em `green-800`: 12,92 e o verde como texto,
"creme sobre ele" e 14,22. Meus numeros originais estavam certos para o par que o rotulo
nomeia. Restaurar 17,33 e 14,22, porque o par que importa nesses dois tokens e texto claro
sobre fundo escuro — eles sao fundo de faixa, nao cor de letra. — Custo se errado: um
comentario com numero de outro par, que e literalmente a doenca que o teste trata.
Tarefa 2: rodada 1/5 (3 tratadas; commit 12cbcf5). 565 testes verdes.

### 7

`ami-green-700` entra na lista de texto do teste, e a REGRA passa a estar escrita
no comentario. Ele e usado como texto em `Chip.tsx` e `IndiceEspecialidades.tsx` e passa
com folga (10,07:1) — mas "passa hoje" nao e garantia de amanha, e essa e a terceira vez
nesta fatia que um token de texto ficou de fora da lista. A regra escrita: todo token que
aparece em `text-<nome>` em qualquer componente pertence a lista, sem juizo previo sobre
parecer arriscado. `ami-green-600` ficou de fora justamente porque "parecia cor de botao",
e a mutacao mostrou que podia cair para 2,86:1 sem nada reclamar. Pedi tambem uma varredura
por `text-*`: se aparecer um terceiro esquecido, a lista deveria ser DERIVADA do codigo em
vez de escrita a mao. — Custo se errado: uma assercao a mais numa lista que ja existe.
Tarefa 2: rodada 2/5 (1 tratada; commit eea3f94). 567 testes verdes. O implementador achou
  `text-ami-mint-400` na varredura e NAO o acrescentou, porque ele so e usado sobre verde
  escuro — medi-lo contra fundo claro repetiria o erro de par corrigido na rodada 1.
  Documentou com numero em vez de decidir sozinho.

### 8

os pares de FUNDO ESCURO entram agora, e isso REVERTE a lacuna que eu declarei
na autorrevisao do plano. Meu argumento para deixar de fora era que o par depende de saber
qual token vai sobre qual, e que essa informacao mora nos componentes. A varredura do
implementador resolveu isso: `text-ami-mint-400` (que vira `ami-lima-400`) e usado sobre
`ami-green-800` e `ami-green-900`, e so ali. O par nao e mais suposicao, e medicao.
E a SPEC, secao 7, pede os tres pares explicitamente: creme sobre o verde, acento sobre o
verde, tinta sobre o acento. A spec e a autoridade e o plano e o argumento dela — o
argumento caiu. — Custo se errado: um `describe` a mais num arquivo de teste, com pares que
o codigo realmente usa.
Tarefa 2: rodada 3/5 (6 pares novos + a regra invertida; commit 70f5d8b). 573 testes.
  Os seis medidos antes de escrever assercao, nenhum reprovou. Duas mutacoes morderam,
  inclusive a da regra invertida, que ficou vermelha pelo motivo certo: o par virou legivel.
Tarefa 3: BASE 70f5d8b
Tarefa 2: COMPLETA (commits 3497604..70f5d8b, re-revisao limpa — 5/5 tratados, as tres
  mutacoes refeitas pelo revisor, nenhuma quebra nova). 573 testes.
Tarefa 1: COMPLETA (os dois Importantes dela foram tratados nas rodadas da tarefa 2).
Tarefa 3: implementada (commit 802475e). 573 testes, tsc e build limpos. Migrou os cinco
  da tabela corrigida, deixou o quarto gradiente e surface-fundo para depois, como mandado.
Tarefa 4: BASE 802475e
Revisao da tarefa 3: conformidade 5/5, migracao completa, mutacao feita. 1 Importante.

### 9

`--shadow-lamina` SAI. Conferi eu mesmo nas quatro formas possiveis: zero
consumidores, so a propria declaracao. E o mesmo tratamento que `--color-danger` recebeu
na tarefa 2, e o projeto ja estabeleceu que token morto sai. O implementador da tarefa 4
parou e perguntou em vez de adivinhar, o que foi certo — o brief mandava "olhar na tela"
um efeito que nao aparece em tela nenhuma. — Custo se errado: um token de sombra a menos,
recuperavel do git.

### 10

o valor `rgba(255, 253, 248, 0.9)` que EU escrevi no plano estava errado. Eu
disse que era "a superficie nova", e a superficie e `#FBFAF5` = 251,250,245. Escrevi de
memoria — a terceira vez nesta sessao que isso acontece. Fica sem efeito porque o token
sai, mas registro porque o padrao importa. — Custo se errado: nenhum agora.

### 11

o Importante da revisao da tarefa 3 entra no despacho da tarefa 4. O comentario
reescrito em `testes/paleta.test.ts` manteve os numeros de `ami-mint-400` (1,36 e 1,49) sob
o rotulo de `ami-lima-400`, cujos numeros reais sao 1,48 e 1,63. Sao cores diferentes:
#A5DCAF e #A8D470. TERCEIRA ocorrencia do mesmo erro nesta fatia — numero de um par sob o
rotulo de outro. Vai junto porque a tarefa 4 esta ativa e nao toca esse arquivo por outro
motivo. — Custo se errado: um comentario com numero de outra cor, no arquivo que existe
para impedir exatamente isso.

### 12

registro o achado do revisor da tarefa 3, que vale para as fatias seguintes:
NAO EXISTE rede automatica contra classe Tailwind morta. Ele mutou `bg-ami-lima-100` para
o nome apagado `bg-ami-mint-100` e tsc, vitest e build passaram os tres. A unica defesa e
o grep de conferencia no fim de cada tarefa. Parked para a revisao final triar se vale
construir algo.
Tarefa 3: COMPLETA (commit 802475e; o Importante dela foi tratado no 4809ff0 da tarefa 4).
Tarefa 4: implementada (commit 4809ff0). 573 testes, tsc e build limpos. Mediu ela mesma os
  numeros do comentario em vez de copiar os meus, e bateram.
Tarefa 5: BASE 4809ff0
Tarefa 4: COMPLETA (commit 4809ff0, revisao limpa — conformidade total, so 2 Menores).
Tarefa 5: implementada (commit 10cf697). 573 testes, tsc e build limpos. As 9 rotas
  responderam 200 sem erro no log. Os 5 tokens novos aparecem no CSS gerado, os 5 antigos
  nao, e #00A457 nao vazou para o CSS — so vive em public/marca/, como deve.

### 13

o achado da tarefa 5 muda a pergunta que vai ao dono, e conferi eu mesmo.
A faixa escura que domina a home hoje e `bg-ami-green-900` = `#071A07`, croma 19 — MAIS
ESCURA que qualquer uma das tres opcoes que ele comparou. O verde que ele escolheu,
`green-800` = `#0D2E0C` croma 34, hoje aparece so na placa de iniciais do medico e como
ponta escura de tres gradientes decorativos.
A "faixa de secao" para a qual a escolha dele foi feita AINDA NAO EXISTE — ela nasce com a
fatia da home. Entao, ao olhar o site agora, ele vai julgar um verde que nao e o que
escolheu. Isso precisa ir junto com a pergunta, senao a resposta dele responde outra coisa.
— Custo se errado: ele pede para mudar a cor errada.

### 14

o quinto furo entra, mas na forma barata. O revisor provou que
`ami-lima-100` e `surface-fundo` sao fundos de TEXTO vivos e estao completamente fora da
rede: apagar `ami-lima-100` deixa 22 testes verdes e 13 classes viram nada. O par mais
apertado do sistema inteiro esta ali — `ink-400` sobre `ami-lima-100` = 4,61:1, onze
centesimos acima do minimo.
Ele argumenta que o conserto certo e DERIVAR as duas listas do grep em vez de escreve-las
a mao, e tem razao no diagnostico: sao duas listas a mao, uma auditada quatro vezes e a
outra nunca. Mas derivar e mudanca de desenho do teste, e ele mesmo triou como "proxima
fatia". Nesta fatia entram os dois fundos que faltam; a derivacao vira a PRIMEIRA tarefa
da fatia seguinte, com nome e motivo. — Custo se errado: a lista continua a mao mais uma
fatia, com o buraco de hoje fechado.

### 15

`.grao` entra, e e defeito real anterior a esta fatia. Conferi: ela e
renderizada em `app/(site)/layout.tsx:21`, em TODA pagina do site, e nao ha uma linha de
CSS para ela. E a prova viva do achado adiado sobre classe morta. A onda de correcao
decide entre restaurar a regra ou remover a div, e relata qual e por que. — Custo se
errado: uma div a menos, ou uma regra a mais, num efeito decorativo.

### 16

a SPEC secao 4 e atualizada para descrever a paleta entregue. Ela hoje diz
`green-900: #0D2E0C` (virou `green-800`) e `ami-green-600: #1F6B3A` "mantido" (virou
`#1A5E18`, e mudou de matiz). O plano bate com o entregue; a spec nao. E a spec e o
documento que o dono leu e aprovou. — Custo se errado: nenhum; e alinhar o registro ao
que existe.

### 17

a derivacao das listas NAO entra nesta onda, e fica registrada como divida com
nome: "a primeira tarefa da fatia da home deriva as duas listas do teste a partir do grep
de `text-<token>` e `bg-<token>`". Isso fecha os dois eixos e mata o achado da classe
morta de uma vez. — Custo se errado: mais uma fatia com listas a mao.
Tarefa 5: COMPLETA (commit 10cf697).
ONDA FINAL: 4 Importantes + 7 Menores tratados em 10 commits (10cf697..b1ebffc).
  589 testes verdes, tsc e build limpos. Nenhum par reprovou — ele nao tocou em token.
  O mais apertado e o previsto: ink-400 sobre ami-lima-100 = 4,61:1.

### 18

aceito a decisao dele sobre `.grao`: a DIV SAI, a regra nao volta. Ele foi ao
historico em vez de adivinhar e achou o commit `ee7c125`, que apagou a regra DE PROPOSITO
— a mensagem diz, e o paragrafo que explica ainda esta em globals.css. Restaurar reverteria
uma correcao que o cliente pediu por nome. — Custo se errado: um efeito decorativo a menos,
recuperavel do git.

### 19

`.moldura` fica registrada e NAO decidida. Ele foi conferir a propria frase
"surface-fundo e o fundo de .moldura" e descobriu que a classe nao e aplicada em lugar
nenhum — o efeito esta refeito a mao com `bg-surface p-2` em dois arquivos. E o `.grao` ao
contrario. Adotar a classe ou apaga-la e escolha de desenho, nao de correcao, e ele fez
certo em nao decidir sozinho. Vai para a lista do dono. — Custo se errado: uma classe morta
a mais no CSS por mais uma fatia.

### 20

a QUINTA ocorrencia do erro de par estava DENTRO da spec — a coluna "creme sobre
ela" da secao 5 e a linha da secao 4 mediam `surface`, nao `canvas`. Ele achou e corrigiu.
Cinco ocorrencias nesta fatia, em cinco lugares diferentes: comentario de token, comentario
de teste, plano, spec secao 4 e spec secao 5. — registro para a fatia seguinte: qualquer
numero de contraste escrito em prosa precisa nomear os dois lados do par.

---

## O que a execução produziu

- **18 commits**, 20 arquivos, +455/−83
- **589 testes** verdes (eram 551), tipos limpos, build limpo em 58 páginas
- **5 tarefas**, cada uma com implementador e revisor independentes
- **Um teste que calcula as razões de contraste** e reprova sozinho — a única rede
  permanente contra regressão de cor neste projeto

### O que a rede pegou

Quando o fundo virou creme, `ink-400` caiu para **4,33:1**, abaixo do mínimo, num token
usado em legenda e data. O mesmo token já reprovara uma vez, e o comentário do arquivo
registra. Ia repetir.

E `warn` reprovou junto, em 4,41:1 — que nem a spec nem o plano previam.

### O que a rede não pegava, e passou a pegar

Quatro tokens usados como **texto** estavam fora da lista que o teste vigia. Todos achados
mutando o código:

- `ami-green-600` — a cor de ação do site, 60 usos. Mutada para 2,86:1, os nove testes
  continuaram verdes
- `ami-green-700`
- `ink-300`, cuja regra invertida media só um dos dois fundos, e o menos exigente
- `ami-lima-100` e `surface-fundo` — dois **fundos** de texto que ninguém tinha auditado.
  Apagar `ami-lima-100` deixava 22 testes verdes e treze classes viravam nada

### A dívida com nome

**A primeira tarefa da fatia da home deriva as duas listas do teste a partir de um grep**
por `text-<token>` e `bg-<token>`, em vez de escrevê-las à mão.

Isso fecha os dois eixos de uma vez, e mata o achado da classe morta: hoje não existe rede
nenhuma contra um token que sai do sistema e sobra num componente — `tsc`, os testes e o
build passam os três, e o elemento fica sem cor.
