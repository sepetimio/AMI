# Fatia 2 do painel — decisões tomadas durante a execução

Data: 23 de agosto de 2026
Ramo: `painel-fatia-2`
Spec: `docs/superpowers/specs/2026-08-23-painel-fatia-2-design.md`
Plano: `docs/superpowers/plans/2026-08-23-painel-fatia-2.md`

Este documento existe porque a execução foi autônoma: onze tarefas, um implementador e um
revisor independente por tarefa, sem parar para perguntar entre elas. Toda vez que uma
decisão apareceu — um defeito no plano, um conflito entre o que a spec pedia e o que o
código fazia, um achado de revisão que exigia escolher — ela foi tomada e registrada aqui,
**com o custo de estar errada**.

É o lugar onde o dono do projeto lê o que foi decidido em seu nome e desfaz o que não
gostar. Trinta e sete decisões. Mais da metade corrige defeito do próprio plano.

---

## As decisões

### 1

a tarefa 1 passa a listar também `lib/dados/urlFiltros.ts` (lê e escreve
`sabado` na URL, linhas 37 e 73), `lib/dados/tipos.ts` (só o campo `atendeSabado`,
linha 74 — o campo `horarios` continua sendo da tarefa 3) e `testes/urlFiltros.test.ts`
(3 referências). — Medido: `grep -rn "atendeSabado|sabado"` acha cinco arquivos, e o
plano nomeia dois. — Custo se errado: o ramo não compila ao fim da tarefa 1, e `tsc`
acusa na hora.

### 2

em `lib/dados/facetas.ts` o sábado não é a linha 249 e sim quatro lugares
(tipo na 33, comentário na 52, PROSA GERADA nas 103-110, cálculo na 248), e
`testes/facetas.test.ts` tem catorze referências, várias afirmando sobre as frases.
A frase de sábado sai inteira, não é substituída, e o parágrafo em volta tem que
continuar lendo bem. — Medido: `grep -n` nos dois arquivos. — Custo se errado: um
parágrafo das páginas de especialidade e bairro fica torto; visível ao revisor.

### 3

`locaisDoMedico` da tarefa 8 vira DUAS consultas — primeiro `atendimento`
filtrado por `profissional_id` para obter os `local_id`, depois `local` com
`.in("id", ids)` trazendo `atendimento ( profissional_id )` SEM filtro, para a
contagem. O plano pedia filtrar `local` por `atendimento.profissional_id` e ao mesmo
tempo contar quantos médicos atendem ali: o filtro restringiria as linhas aninhadas a
uma, e `quantosMedicos` seria sempre 1 — matando o aviso de endereço compartilhado que
a spec exige na seção 8. Além disso o projeto não tem precedente de filtro em tabela
aninhada; o padrão dele é trazer aninhado e filtrar em JS. — Custo se errado: uma ida
a mais ao banco por página do painel, desprezível.

### 4

as tarefas 1, 2 e 3 vão num despacho só. São um único entregável — os
horários saem do site — compartilham arquivos, e o critério de aceitação da 3 (o grep
vazio) só passa depois de 1 e 2. Revisar em separado seria revisar um estado
intermediário quebrado de propósito. — Custo se errado: um diff de revisão maior.

### 5

o grep de aceitacao que EU escrevi e cego demais — casa a palavra "horário"
em qualquer sentido, inclusive "horário de verão" e "horário local" em comentários
sobre formatação de data, que nada têm com hora de funcionamento. Isso levou o
implementador a reescrever prosa correta só para passar num teste mecânico, em
`lib/formato.ts` e `testes/formato.test.ts`. As duas edições revertem. O critério passa
a ser: o grep pode casar comentário sobre formatação de data/hora, e cada casamento
remanescente é justificado no relatório em vez de editado. — Custo se errado: quem
rodar o grep no futuro acha linhas e precisa rejustificá-las.

### 6

o piso de palavras da faceta mais pobre volta a 120; o implementador baixou
para 100 para acomodar a remoção. Baixar uma guarda de qualidade para caber a perda
esconde a perda em vez de tratá-la. A frase de sábado é substituída por uma verdadeira
sob o novo propósito do site (spec, seção 2): que cada perfil traz telefone e WhatsApp
do consultório, que é o que fecha o encaminhamento. Se ainda assim faltar para 120, aí
sim o piso desce para o valor medido, com comentário dizendo que a página passou a ter
menos a dizer — mas a frase entra antes. — Custo se errado: uma frase a mais nas
páginas de especialidade, barata de tirar.

### 7

a frase de telefone que EU mandei escrever (Ruling 6) SAI. O revisor esta
certo em dois pontos: `local.telefone` e nullable e a pagina so desenha o botao sob
condicao, entao a prosa indexavel afirma dado opcional — a mesma classe de defeito que
esta fatia existe para remover; e a frase e invariante, nao deriva de `ResumoFaceta`,
contra o que o comentario do proprio arquivo exige. Sem ela a faceta mais pobre volta a
~105 palavras. O piso vai para 100 REDONDO, nao para o valor medido: piso igual a
medicao e detector de mudanca, nao guarda. O comentario registra o valor medido e que a
decisao de conteudo segue pendente com o dono do projeto. — Custo se errado: as paginas
de especialidade ficam com um paragrafo mais curto.

### 8

`docs/rascunhos-textos-legais.md` e REGERADO por
`npx tsx scripts/gerar-doc-legal.ts`. E a peca entregue ao advogado, e as tres frases
dela ainda dizem que o diretorio publica horario. O cabecalho de `lib/rascunhosLegais.ts`
diz em letras proprias que rascunho divergente do publicado e pior que rascunho nenhum.
— Custo se errado: nenhum, e mecanico.

### 9

o texto literal do MEU brief criou tautologia — "Em 14 especialidades, com
endereco, telefone e especialidade" em `app/(site)/medicos/page.tsx:69`, e o mesmo
padrao em `lib/seo/metadados.ts:136,154`. O implementador seguiu o brief; o brief
estava errado. Reescrever sem repetir o assunto da propria pagina. — Custo se errado:
uma frase de vitrine soa diferente do previsto.

### 10

o codigo morto que ESTA mudanca criou sai: o tom `estado` e o prop `vivo` de
`components/base/Chip.tsx` (o selo era o unico consumidor), o comentario orfao de
`LinhaMedico.tsx:82-84`, o reflow do docstring de `facetas.ts`, o comentario de
`app/globals.css:242` que aponta para `lib/fontes.ts` e agora o contradiz, e as classes
de grade mortas em `medico/[slug]/page.tsx:131`. — Custo se errado: nenhum.

### 11

o WhatsApp passa a ser RENDERIZADO na pagina do medico. Medido: ele existe no
banco, no importador e no tipo, e nao aparece em nenhuma tela do site. A spec, secao 2,
eleva telefone e WhatsApp a segundo dado mais importante, e as tarefas 8 e 9 vao fazer o
painel coletar WhatsApp. Entregar campo que o site descarta e defeito. A mudanca espelha
o link `tel:` que ja existe. — Custo se errado: um link a mais no perfil; barato de
tirar. FORA do escopo dos tres briefs, e por isso e ruling e nao achado.

### 12

o piso vai para 90, nao para 100. Minha estimativa de ~105 estava errada: o
valor medido e exatamente 100, entao o piso de 100 que eu mandei pos o teste colado na
medicao pela TERCEIRA vez (100/100, 116/116, 100/100). Um piso igual a medicao quebra na
proxima edicao legitima de conteudo, e quem vier baixa de novo — a catraca que ja
assistimos duas vezes. 90 da dez palavras de folga e continua afirmando um minimo real
contra pagina rasa indexavel. O comentario registra que o valor medido e 100 e que a
decisao de conteudo segue pendente com o dono do projeto. — Custo se errado: uma pagina
de especialidade poderia encolher ate 90 palavras sem o teste reclamar.

### 13

`\z` nas tres varreduras do plano vira `$`. Em JavaScript `\z` nao e ancora
de fim de string — casa a letra z. As assercoes das tarefas 4, 7 e 9 que separam trechos
por tabela eram CEGAS ao ultimo trecho e passavam com o codigo errado. Provado por
mutacao pelo implementador da tarefa 4. Plano corrigido, briefs 7 e 9 regerados. — Custo
se errado: nenhum; `$` e a ancora correta e a mutacao confirma que agora morde.

### 14

os quatro Importantes entram em correcao antes de a migracao ir ao Supabase.
O revisor provou por mutacao que (a) nenhum teste limita a ESCRITA — politica de insert
em `horario` ou `perfil_usuario` passa verde, e isso atinge o limite acordado
diretamente; (b) a mensagem nova `'FALHOU: ninguem apaga local'` CONTEM a antiga
`'ninguem apaga'`, entao apagar a assertiva da fatia 1 nao quebra mais nada — este diff
enfraqueceu uma trava que ja existia; (c) as quatro assertivas novas de testes-rls.sql
nao sao vigiadas por nada; (d) `(select eh_admin())` nao e asserido, e o arquivo gasta
cinco linhas de comentario explicando por que ele importa. — Custo se errado: nenhum, sao
quatro assercoes pequenas, todas em testes.

### 15

entram tambem os Menores 5, 6, 7, 8, 10 e 11. O 6 e o que mais me preocupa:
`semComentarios` so entende /* */ e //, entao em .sql as linhas `--` sobrevivem — a
funcao existe justamente para impedir a colisao entre prosa e regra, e para SQL ela nao
impede. Ganha um irmao `semComentariosSql`. O 8 e um comentario que explica o porque
ERRADO ("as politicas somam, entao estas entram no caminho do site publico" e falso para
insert/update/delete) num arquivo cujo assunto e correcao. — Custo se errado: baixo.

### 16

o Menor 12 (nome de politica divergente de 0005) NAO entra. O proprio revisor
diz que o nome de 0006 e mais legivel, e renomear politica ja escrita a troco de simetria
cosmetica nao paga. Parked.

### 17

fica adiado para a revisao final, nao entra em rodada de correcao agora. A
lacuna NAO foi introduzida por esta tarefa — ela vale para todos os campos daquela acao
desde a fatia 1 — e fecha-la exige simular o cliente Supabase, infraestrutura que este
projeto nunca teve. Isso e decisao maior que a tarefa. — Custo se errado: um defeito na
leitura do formulario passa sem teste ate a revisao final triar. LEVAR AO USUARIO no fim:
toca o mecanismo que ele escolheu para tirar quem sai da associacao.

### 18

o Importante entra, mas ENFILEIRADO atras do implementador da tarefa 7. A
ordenacao de `especialidadesDoMedico` — principal primeiro, resto alfabetico — e a regra
de negocio mais visivel do modulo e esta inline numa funcao assincrona, sem cobertura. O
projeto ja resolveu a forma identica em `lib/painel/consultas.ts`, extraindo `paraLista`
puro e testando em `painel-consultas.test.ts` sem simular Supabase. Extrair
`ordenarEspecialidades` segue precedente proprio, custa pouco e nao muda a assinatura que
a tarefa 7 consome. NAO despacho agora porque a tarefa 7 esta editando
`testes/painel-especialidades.test.ts` neste momento, e dois implementadores no mesmo
arquivo e conflito garantido. — Custo se errado: a regra de ordenacao segue sem teste
proprio ate a revisao final.

### 19

o Menor (estilo de eslint-disable divergente entre bloco e linha) NAO entra.
O proprio revisor diz que nao vale bloquear. Parked.

### 20

a saida dele — mover a DECLARACAO de `invalidar()` para o fim — faz o teste
passar e CEGA a assercao. Conferido: a assercao mede `codigo.indexOf("revalidatePath(")`,
que agora cai na definicao, na linha 185. Uma acao que chamasse `invalidar()` ANTES de
conferir `if (!data)` continuaria verde, porque a definicao segue no fim. Mesma familia do
`\z`: le como protecao e nao e.
A assercao passa a ancorar na CHAMADA `invalidar()`, nao em `revalidatePath(`, e a
conferir POR ACAO — parte o fonte em `export async function` e exige, dentro de cada
pedaco que grava, que `if (!data)` venha antes de `invalidar()`. Com isso corrigido,
`invalidar()` volta ao topo, onde helper se le naturalmente, e o comentario que explica a
contorcao sai. — Custo se errado: a assercao continuaria cega ao defeito que ela nomeia.

### 21

a extracao de `ordenarEspecialidades` (Ruling 18, enfileirada) vai NO MESMO
despacho. Os dois tocam `testes/painel-especialidades.test.ts`, e separa-los criaria o
conflito que eu adiei a tarefa 6 para evitar.
Tarefa 7: rodada 1/5 (2 tratadas; commit c8644f4). 480 testes verdes. invalidar() voltou
  ao topo; o arquivo ficou byte a byte igual ao Passo 3 do brief original.
Tarefa 8: BASE c8644f4 — arquivos novos, despachada em paralelo com a re-revisao da 7.
Tarefa 7: COMPLETA (commits 6883205..c8644f4, re-revisao limpa — 2/2 tratados, ambos
  provados por mutacao ao vivo, nenhuma quebra nova). 480 testes verdes.
Tarefa 6: COMPLETA (o Importante dela foi tratado no commit c8644f4 da tarefa 7).

### 22

os dois Importantes entram, ENFILEIRADOS atras do implementador da tarefa 9,
que esta editando `testes/painel-locais.test.ts` agora.
  (a) `paraLocal` nao e exportada nem testada. Ela carrega `quantosMedicos`, a regra que
  esta tarefa inteira existe para proteger. O projeto ja estabeleceu o precedente duas
  vezes — `paraLista` em consultas.ts e `ordenarEspecialidades` em especialidades.ts sao
  exportadas E testadas. Aqui a extracao estrutural aconteceu e a de teste nao.
  (b) Nenhum dos oito testes passa `whatsapp` com valor nao vazio. O revisor removeu a
  validacao de digitos do WhatsApp inteira e os oito continuaram verdes: o campo esta
  protegido pela paridade de codigo com `telefone`, nao por teste. Um espelho fecha.
— Custo se errado: a contagem de medicos por endereco e a validacao de WhatsApp seguem
sem rede propria ate a revisao final.

### 23

o Menor (o implementador escreveu codigo e teste juntos em vez de ver o teste
falhar primeiro) NAO gera correcao. Ele mesmo registrou o desvio, e as duas mutacoes
depois provaram que os testes mordem — que e o que o passo pulado existia para garantir.
Parked.

### 24

a busca de consultorio existente ENTRA, e e spec ❌, nao escopo extra. O
usuario escolheu explicitamente "Buscar existente ou criar novo" no levantamento, e a
spec, secao 8, diz "duas saidas no mesmo campo". Meu plano descreveu a tela em prosa e
subespecificou a busca — a autorrevisao do proprio plano ja registrava isso como pendencia
conhecida, dizendo que um `select` alimentado por `buscarLocais` bastava com 24 enderecos.
E carga estrutural: sem ela cada medico ganha endereco proprio, `quantosMedicos` da sempre
1, e o aviso de endereco compartilhado nunca dispara — a decisao do usuario colapsa calada,
junto com o motivo de `atendimento` ser tabela de ligacao. — Custo se errado: uma lista a
mais na tela.

### 25

os dois Importantes da tarefa 8 (Ruling 22) vao NO MESMO despacho — o
implementador da 9 esta com `testes/painel-locais.test.ts` em maos.
Tarefa 9: rodada 1/5 (3 tratadas; commit 4e1b0d4). 499 testes verdes.

### 26

as quatro acoes `Promise<void>` que LANCAM erro passam a DEVOLVER estado de
erro, como `salvarMedico` e `salvarEspecialidades` ja fazem. Sao
`acrescentarEspecialidade`, `removerEspecialidade` (tarefa 7), `ligarLocalExistente` e
`desligarLocal` (tarefa 9).
Motivo, medido na documentacao do Next instalado
(`03-file-conventions/error.md:111`): "Errors forwarded from Server Components show a
generic message with an identifier. This is to prevent leaking sensitive details." Ou
seja, as mensagens em portugues dessas acoes sao CODIGO MORTO em producao — quem usa ve
tela de erro generica com um digest, e "Este medico ja tem essa especialidade" nunca
chega a ninguem. Isso viola a restricao global que eu mesmo escrevi ("Portugues em tudo
que o usuario le").
O implementador achou isso conferindo a tela ao vivo, nao lendo codigo: clicou em "Ligar
a este consultorio" e a pagina caiu na tela de erro do Next em vez de mostrar mensagem.
Defeito do MEU desenho, nao da implementacao. — Custo se errado: mais estado nos dois
componentes; o padrao ja existe no projeto duas vezes, entao nao e desenho novo.

### 28

as duas listas de recursos de acessibilidade viram uma. `RECURSOS_DE_
ACESSIBILIDADE` em `lib/painel/locais.ts` repete os mesmos cinco pares valor/rotulo que
`ROTULO_ACESSIBILIDADE` em `lib/dados/tipos.ts` ja tinha para o site publico. Um sexto
recurso acrescentado num lugar e esquecido no outro divergiria calado — o painel deixaria
marcar o que o site nao mostra. O painel passa a DERIVAR da lista existente, nao a
repeti-la. Cruzar import entre as duas camadas ja e padrao do projeto: `lib/painel/
medico.ts` importa `UFS` de `lib/importador/tipos`. — Custo se errado: um import a mais
entre camadas.

### 29

o teste `chama exigirAdmin antes de qualquer escrita` passa a conferir POR
ACAO. Hoje ele busca no arquivo inteiro, entao `criarLocal` "gasta" a conferencia global e
uma acao nova que pulasse `exigirAdmin()` passaria verde. E a QUARTA vez nesta fatia que
aparece uma assercao que le como protecao e nao e — as outras tres foram o `\z`, a
mensagem que engoliu a trava da fatia 1, e o `revalidatePath(` que media a definicao em vez
da chamada. O padrao e sempre o mesmo: a assercao mede o arquivo quando devia medir a
unidade. — Custo se errado: nenhum, e a mesma forma que ja corrigi na assercao de
`invalidar()`.

### 30

C-1 entra. `removerEspecialidade` apaga a principal e nao promove ninguem — o
medico fica com zero principal, e o site inteiro decide por `find(principal) ?? [0]`, com
`[0]` vindo de array do PostgREST SEM ordenacao. Cai nisso o title, a meta description, a
especialidade sob o nome, o breadcrumb, o JSON-LD e a linha da busca, congelados por uma
hora pelo cache. O autor do importador ja tinha visto isso (`plano.ts:236`: "Forcar falso
aqui o deixaria sem principal nenhuma, para sempre") e o painel reabriu. Conserto: ao
remover a principal, promover a proxima em ordem alfabetica; remover a ultima e permitido
(a tela ja avisa "sem especialidade"). — Custo se errado: uma promocao automatica que o
usuario nao pediu, visivel na hora.

### 31

C-2 entra. `painel-acoes.test.ts:18` usa `entrada.name === "acoes.ts"`,
igualdade estrita: a varredura acha 3 dos 5 arquivos de acao, e os 2 que ela NAO ve sao
os unicos do repositorio que chamam `.delete()`. O comentario da propria funcao diz que
lista a mao "apodrece sozinha" — ela apodreceu no mesmo commit. Provado: um
`acoes-formacao.ts` com `.from("profissional").delete()` passa 511 verdes. — Custo se
errado: nenhum; e trocar igualdade por prefixo.

### 32

C-3 entra. Duas falhas somadas: a contagem de `.select()` mistura leitura com
escrita (8 selects para 7 escritas em acoes-local.ts, porque a leitura de `atuais` conta
como retorno de gravacao), e a conferencia de `if (!data)` PULA acao que nao chama
`invalidar()` — a condicao que dispensa o exame e a propria coisa examinada. Provado: uma
acao que apaga todos os `atendimento` de um medico sem select, sem conferencia e sem
invalidar passa 511 verdes. — Custo se errado: nenhum.

### 33

I-5 — a SPEC esta errada, nao o codigo. A regra "celula vazia nunca apaga" foi
escrita para o importador, onde celula em branco numa planilha significa "nao tenho essa
informacao". Num formulario PRE-PREENCHIDO, campo que o operador esvaziou e AFIRMACAO
("este consultorio nao tem telefone") — exatamente o raciocinio que eu ja usei para a
caixa de associado. Aplicar a regra do importador aqui tornaria o telefone inapagavel.
Corrijo a spec e registro; o codigo fica. — Custo se errado: o operador apaga telefone
sem querer e reescreve.

### 34

I-2 — a cascata fica, documentada. `atendimento` -> `horario` tem
`on delete cascade` em 0001, entao `desligarLocal` apaga linhas de `horario`, tabela do
"nunca". Cascata de integridade nao passa por RLS. MAS: os horarios sairam do produto, as
246 linhas sao dos ficticios e nada as le, e alterar a chave estrangeira de uma tabela ja
aplicada custa mais que o dano. O teste ganha comentario nomeando a cascata, e a spec
ganha o risco. — Custo se errado: linhas de uma tabela morta somem quando um medico sai
de um consultorio.

### 35

aceito a consequencia que ele levantou na desduplicacao de endereco — quando o
endereco ja existe, telefone e WhatsApp digitados sao DESCARTADOS e fica o cadastrado.
Sobrescrever mudaria calado o contato de todos os outros medicos daquele endereco, que e
exatamente o estrago contra o qual o aviso de endereco compartilhado existe. — Custo se
errado: quem digitou um telefone novo achando que corrigia nao corrige, e precisa editar
o cartao do consultorio depois.

### 36

o defeito de `testes-rls.sql:175` entra, e e o unico. A secao da fatia 2 faz
`set local role anon` sem limpar `request.jwt.claims`, e as claims do admin plantadas na
linha 102 com `is_local := true` valem ate o fim da transacao. `reset role` troca o papel,
nao a GUC, e `auth.uid()` le a GUC. Entao sob `anon` o `eh_admin()` devolve verdadeiro, os
inserts passam, e o arquivo aborta com 'FALHOU: anon insere' — uma falha INVENTADA. O dono
rodaria, veria FALHOU, e cacaria um defeito de politica que nao existe. E o proximo passo
dele e justamente rodar esse arquivo. — Custo se errado: nenhum, e uma linha de
`set_config`.

### 37

entram junto dois consertos de texto baratos: o aviso da tela quando liga a
endereco existente precisa dizer que o telefone digitado foi DESCARTADO (hoje diz so que
ligou, e quem digitou vai embora achando que gravou — e telefone e o que fecha o
encaminhamento), e o comentario de `painel-migracao.test.ts:85` nomeia
`atendimento.atendimento_id`, coluna que nao existe (e `horario.atendimento_id`). Comentario
que existe para ser lido por quem confia na lista precisa estar certo.

### 38

a pontuacao na desduplicacao NAO entra. "RUA SIMPLICIO MOREIRA, " com virgula
no fim conta como endereco diferente. E limitacao real e documentada; tratar pontuacao em
endereco brasileiro (numero, "1.200", abreviacoes) e problema maior que o dano, e o
importador ja convive com a mesma. Parked.

---

## Achados registrados e não corrigidos

Nenhum é defeito presente. Todos foram vistos, pesados e deixados de propósito.

- `app/painel/medico/[id]/page.tsx:50` promete "Enderecos, horarios e
- `docs/estado-do-projeto.md:27,100` desatualizado — a tarefa 11 atualiza o
- a ponte FormData -> validarMedico nao tem teste que EXECUTE.
- a assercao nova PULA acao que nunca chama `invalidar()`
- `lib/dados/medicos.ts:39-44`, `paraDominio` monta as
- a mensagem que chega a tela e
- o select de "ligar consultorio existente" nao tem opcao

---

## O que a execução produziu

- **31 commits**, 48 arquivos, +3663/−571
- **551 testes** verdes, tipos limpos, build limpo em 58 páginas
- **11 tarefas**, cada uma com implementador e revisor independentes
- **6 asserções que liam como proteção e não protegiam**, todas achadas mutando o código
  de propósito e vendo o teste continuar verde — nenhuma foi achada lendo
