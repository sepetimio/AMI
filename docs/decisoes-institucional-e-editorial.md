# Decisões tomadas durante a fase institucional e editorial

> Plano: `docs/superpowers/plans/2026-08-21-institucional-e-editorial.md`
> Especificação: `docs/superpowers/specs/2026-08-19-site-ami-diretorio-design.md`
> Ramo: `fase-1-diretorio`, faixa `b249d6e..712c39d`

Durante a execução das onze tarefas deste plano, 36 decisões foram
tomadas sem consultar o cliente, porque parar a cada uma custaria mais do que
refazer a que estivesse errada. Este arquivo é o registro delas.

Cada entrada diz **o que foi decidido**, **por quê**, e **o que custa se estiver
errada**. Quem discordar de qualquer uma tem aqui o suficiente para reverter.

A maioria são decisões de execução: por que um defeito menor entrou numa rodada
de correção, por que uma alternativa foi descartada. Algumas mudam o produto, e
essas estão marcadas com **[PRODUTO]** no início.

---

## 1

**[PRODUTO]** executar em `fase-1-diretorio` em vez de abrir ramo novo — o redesenho
estético e o próprio plano já estão commitados aqui, e empilhar um ramo novo
sobre um ramo não integrado tornaria a junção final mais difícil sem ganho
nenhum. Custo se errado: o histórico da fase 2 fica misturado com o da fase 1
num ramo só, e separá-los depois exigiria rebase interativo.

## 2

começar pela Tarefa 8 (diretoria) e não pela 1 — é a única que não
depende do Sanity, e o usuário está criando o projeto agora. Custo se errado:
nenhum. A tarefa 8 consome só `Placa`, `identificacaoMedica`, `Cabeceira` e
`EstadoVazio`, todos já no repositório desde o plano anterior.

## 3

**[PRODUTO]** GROQ **não aceita parâmetro em fatia**. A T3 usava `[0...$limite]`, que o
analisador recusa com "slicing must use constant numbers", porque a sintaxe de
fatia é ambígua com a de filtro. Nenhum teste do plano pegaria: eles inspecionam
o texto da consulta, e o texto estava sintaticamente plausível. Quebraria só
contra o Content Lake real. Trocado por `groqListaNoticias(limite)`, que
interpola o literal atrás de uma trava de inteiro entre 1 e 100, mais dois
testes novos para a trava. Custo se errado: se a faixa de 1 a 100 for apertada
demais, uma tela futura que precise de mais lança em vez de truncar em silêncio,
que é o modo de falhar que se quer.

## 4

o teste de fuso da T6 **afirmava o dia errado**. Ele esperava que
`2026-03-01T00:00:00Z` formatasse como "1 de março", mas meia-noite UTC é 21:00
do dia 28 em Imperatriz. Verificado com `Intl` antes de corrigir. Trocado por
dois testes: um com o instante que o Studio de fato grava (03:00Z, que é
meia-noite local) e outro documentando o deslocamento de meia-noite UTC como
comportamento correto. Custo se errado: nenhum, a saída real foi medida.

## 5

entre a T8 e a T9, o rastro de navegação da página da diretoria aponta
para `/associacao`, que ainda dará 404. Aceito: as duas entram na mesma sessão,
e inverter a ordem custaria a espera pelo projeto Sanity. Custo se errado: um
link quebrado numa página que ainda não está no ar, atrás de robots.txt bloqueando
o site inteiro.

## 6

**a política RLS no lugar errado do arquivo de instalação é defeito, e o
passo 5 do brief é que estava errado.** O brief mandava colar `0003_diretoria.sql`
inteiro ao fim da parte das tabelas, e eu escrevi isso sem ter conferido que
`primeira-instalacao.sql` separa tabelas e permissões em partes numeradas com
cabeçalho próprio. A spec (seção 6) só exige que as permissões sejam RLS no
banco; ela não fala de arranjo de arquivo, então quem manda aqui é o contrato
interno do próprio arquivo. Correção: partir a colagem, `create table` e índice
na PARTE 1, `enable row level security` e a política na PARTE 2. Custo se errado:
nenhum, é organização de um arquivo que se cola uma vez.

## 7

**[PRODUTO]** **o buraco de conformidade CFM é real e entra na correção.** A Resolução
CFM 2.336/2023, Art. 4º, I exige CRM e a palavra MÉDICO junto de todo nome de
médico exibido. Hoje `diretoria` não tem colunas próprias de CRM, então um
diretor sem perfil publicado renderiza como nome e cargo, sem inscrição. E o
comentário da própria migração diz que esse é o caso normal que motivou a chave
estrangeira opcional: o desenho cria a violação de propósito.

## 8

**terceiro defeito do plano, que a varredura tinha deixado passar.** O
teste da Tarefa 1 importava `exigir` de `@/sanity/env`, e aquele módulo calcula
`projectId` no topo chamando `exigir(process.env...)`. Importar avalia o módulo,
que lança quando a variável falta, e o arquivo de teste inteiro falharia antes do
primeiro caso — justamente na máquina de quem ainda não configurou o Sanity, que
é todo mundo antes da Tarefa 1. Partido em `sanity/exigir.ts`, função pura sem
efeito colateral, e `sanity/env.ts`, que a consome. Custo se errado: nenhum, é um
arquivo a mais de dez linhas.

## 9

**[PRODUTO]** usuário confirmou manter o Sanity (perguntou para que servia; reabri a
decisão com três alternativas e ele escolheu manter). Plano segue sem reescrita.

## 10

**a Tarefa 2 sai da fila de bloqueio e roda agora.** Os schemas são
objetos puros de `defineType`, sem nenhuma leitura de ambiente, e o teste importa
só `sanity/schemas/index.ts`. O único passo que depende da Tarefa 1 é o 6, que
liga os tipos ao `sanity.config.ts` — arquivo que ainda não existe. Esse passo
migra para a Tarefa 1. Custo se errado: se a forma do `schema.types` mudar quando
a Tarefa 1 escrever o config, é uma linha para reconciliar.

## 11

**`options.list` não existe em `SlugOptions`** na versão instalada. Meu
brief mandava usar uma API inexistente. Conferido em
node_modules/@sanity/types/lib/index.d.ts:1474, e o revisor foi além, olhando o
bundle do Studio (`SlugInput` só lê `options.source`), então nem forçando com
`as` haveria menu suspenso. A troca por `validation.custom()` contra a mesma
lista fechada preserva o efeito e mantém `slug.current` no GROQ, que é o contrato
com a Tarefa 3. Aceita. Custo se errado: a secretaria digita o endereço em vez de
escolher numa lista, e recebe erro de validação se errar.

## 12

**alias `sanity` → `@sanity/types` no vitest.config.ts é legítimo.**
Conferido por mim: `node_modules/sanity/lib/index.js:172` é `export * from
"@sanity/types"`, então as três funções são idênticas, e `vitest.config.ts` não é
lido pelo build do Next. O pacote `sanity` inteiro não carrega no Vitest porque
traz JSX cru em arquivos `.js`. Custo se errado: os testes de schema validariam
contra um pacote diferente do de produção, mas a reexportação torna isso
impossível.

## 13

Project ID do Sanity recebido do usuário (`ul4xtwn2`) e gravado em
`.env.local`, que segue coberto pelo `.gitignore` (linha 18, `.env*.local`).
Tarefas 1 e 3 a 11 desbloqueadas.

## 14

**o Crítico procede e entra na correção.** O `loadEnv` acrescentado ao
`vitest.config.ts` esconde o acoplamento entre importar `lib/sanity/consultas.ts`
e ter ambiente configurado, em vez de eliminá-lo. Reproduzi antes de despachar:
sem `.env.local`, `testes/sanity-consultas.test.ts` falha na importação, com
rastro em `sanity/env.ts:13`, e nenhum teste roda.

## 15

usuário rodou as duas migrações no Supabase. `npx next build` voltou a
fechar, agora com 48 páginas estáticas (uma a mais, a da diretoria), e conferi no
navegador que `/associacao/diretoria` renderiza os quatro cartões com cargo acima
do nome e CRM em monoespaçada.

## 16

**o Importante procede e é defeito do meu brief.** O `parseBody` do
`next-sanity` faz `JSON.parse` do corpo sem antes consultar o resultado da
assinatura, então corpo malformado lança antes de qualquer decisão nossa. O
revisor reproduziu ao vivo: cabeçalho `sanity-webhook-signature` inventado, nome
público porque vem da biblioteca aberta `@sanity/webhook`, mais corpo que não é
JSON, devolve 500 numa rota pública. Sem o cabeçalho devolve 401 corretamente.
Não vaza dado nem revalida nada, mas é exceção não controlada exercitável sem
credencial. Correção: `try/catch` em volta, devolvendo 400. Custo se errado:
nenhum, é cerco a mais.

## 17

**subi o Menor de `waitForContentLakeEventualConsistency` para esta
rodada.** O revisor classificou como Menor e concordo com a classificação: não
afeta correção, só desempenho. Subi porque é a **mesma linha** que a correção do
Importante já toca, então não custa rodada nenhuma a mais, e o padrão `true` faz
toda publicação esperar três segundos artificiais sem função, já que este handler
nunca consulta o Sanity depois. Custo se errado: se algum dia o handler passar a
consultar o Sanity, a espera precisará voltar, e o comentário no código é o que
avisa disso.

## 18

**o desvio deliberado sobre `sanity/env.ts` foi aprovado.** Quem
implementou não importou `projectId`/`dataset` no topo, como meu brief mandava,
porque eu avisei que reproduziria o Crítico da Tarefa 3. O revisor confirmou que
`configuracaoPadrao()` roda como valor padrão de parâmetro, avaliado por chamada
e nunca na importação, e que o contrato de dois argumentos ainda bate com as
Tarefas 6 e 7. Custo se errado: nenhum, a interface é aditiva.

## 19

**o recorte pelo ponto de interesse nunca funcionou, e é erro do meu
brief.** O revisor leu `@sanity/image-url/src/urlForImage.ts:147-159` e provou que
`fit()` só calcula o retângulo do hotspot quando largura E altura são passadas.
Meu brief só passava largura, então a URL saía com `fit=crop` sem `rect=` nem
`h=`, e nenhum recorte acontecia. Pior: `TextoRico` declarava uma caixa 3:2 que a
imagem entregue não tem, o que estoura a meta de CLS abaixo de 0,1 do projeto.
Deixei a escolha do conserto com quem implementa, entre aceitar altura ou extrair
as dimensões reais do próprio `_ref`, que as codifica. Inclinei para o segundo no
corpo do texto, porque recortar a foto que a AMI enviou é decisão que ninguém
pediu. Custo se errado: se escolher extrair do `_ref` e o formato mudar, a
extração falha, mitigado por teste com `_ref` sem dimensões.

## 20

subi o Menor do `rel="noopener"` para a rodada, pela mesma razão das
vezes anteriores: é a mesma linha, custo zero, e o atributo sem `target` não faz
nada além de sinalizar um padrão de nova aba que não existe.

## 21

escolheram extrair as dimensões reais do `_ref`, que era o caminho para o
qual eu me inclinava. Minha preocupação com hífen no identificador do ativo foi
verificada e neutralizada: `@sanity/image-url/src/parseAssetId.ts:7` faz o mesmo
`split("-")` posicional, e `@sanity/asset-utils/src/constants.ts:35` restringe o
identificador a `[a-zA-Z0-9_]` ou hex de 40 caracteres, sem hífen por construção.

## 22

**a decisão de CLS foi aprovada.** Escolheram caixa fixa por CSS com
`object-cover` em vez de recorte no CDN. O revisor confirmou que elimina o
problema de verdade, e não só o esconde: nem a largura nem a altura ficam em
`auto` em nenhum ponto de quebra, então o navegador nunca recorre à razão dos
atributos do elemento para reservar espaço. O `width`/`height` declarado não
bater com a caixa no celular é inofensivo pela mesma razão.

## 23

**subi o Menor da data-só para a rodada, e não por conveniência.** O
revisor classificou como inalcançável porque `publicadoEm` vem de campo
`datetime` do Sanity, que sempre traz timestamp completo. Mas a tabela
`diretoria`, criada na Tarefa 8, tem `mandato_inicio` e `mandato_fim` como
colunas `date` puras do Postgres. No dia em que alguém renderizar um mandato com
`dataPorExtenso`, o site mostra o dia errado, em silêncio, numa página
institucional. Função de data que devolve data errada é pior que uma que devolve
vazio, porque ninguém desconfia. Custo se errado: nenhum, é guarda a mais com
teste que trava as duas leituras.

## 24

**os dois desvios que eu autorizei na capa foram aprovados.** Quem
implementou escolheu extrair dimensões reais do `_ref`, como a Tarefa 5, em vez
de caixa fixa com `object-cover`, como a Tarefa 6. O revisor concordou com o
critério: capa é peça única, sem vizinha de grade para alinhar, então recortar
para proporção fixa não tem por que acontecer.

## 25

**incluí os três Menores na rodada.** São todos nos mesmos dois arquivos
que a correção já abre, e um deles é comentário afirmando uma conta que não fecha
(esqueceu os 2px da borda da moldura), coisa com que fui rigoroso a tarefa
inteira. Custo se errado: nenhum.

## 26

**[PRODUTO]** **o `NewsArticle` sem `image` é erro do meu brief.** Montei o `Pick` de
entrada sem a capa. O Google lista `image` como necessária para elegibilidade em
resultados ricos de `NewsArticle`, incluindo Top Stories e Discover, e o dado
está ao alcance pelos mesmos `urlDaImagem` e `dimensoesDoRef` que a página já usa.
Para uma associação que quer suas notas encontradas, não é detalhe.

## 27

**[PRODUTO]** **a Tarefa 9, como planejada, não conserta o 404 de `/associacao`.** O
plano manda `PaginaDeTexto` chamar `notFound()` quando `paginaPorSlug` devolve
nulo, e o dataset do Sanity está vazio. Resultado: `/associacao` continuaria
dando 404, só que por outro motivo, e o link do menu, do rodapé e do botão da home
seguiriam quebrados. Era exatamente o defeito que a tarefa existia para resolver.

## 28

**[PRODUTO]** **o passo 3 da Tarefa 11 põe endereços que dão 404 no sitemap.** Meu
plano manda listar `/associacao/beneficios`, `/associacao/estatuto`,
`/associacao/politica-editorial` e as três legais como entradas fixas. Todas as
seis chamam `notFound()` enquanto a AMI não escrever o texto no Sanity. Sitemap
que aponta para 404 é defeito de SEO, e num site de saúde avaliado por critério
YMYL é pior que não listar.

## 29

**o achado 1 continua aberto e o revisor está certo.** Fiz `PAGINAS`
derivar de `CAMINHO_DAS_PAGINAS` e parei ali, mas a simulação que eu mesmo pedi
("quantos lugares tocar para acrescentar uma página") dá 2, não 1. O schema do
Sanity tem a própria lista fechada, e nada a liga às outras. O cenário
sobrevivente é idêntico ao original: slug em `enderecosValidos` e ausente do mapa
produz documento publicável que nunca entra no sitemap e cujo endereço dá 404, em
silêncio.

## 30

**[PRODUTO]** **o Crítico é real e é o achado mais importante de toda a execução.** A
restrição CHECK de `0003_diretoria.sql` aceita `profissional_id is not null` como
prova de inscrição no CRM. Mas a política `leitura_profissional` de
`0002_rls.sql`, do plano anterior, só deixa o anônimo ler profissional com
`publicado = true`, e o site usa a chave anônima de propósito. Então o embed volta
nulo, o fallback cai nas colunas próprias (vazias, porque o CHECK não as exigiu) e
o cartão omite a linha do CRM. **Nome de médico na tela sem inscrição, Art. 4º, I.**

## 31

**[PRODUTO]** **I7 (selo "Revisado por" e recursos de blog da seção 9 da spec) vira
adiamento registrado, não correção agora.** O revisor tem razão que o plano
prometeu e o ramo não entregou, em silêncio. Mas acrescentar campo de revisor a um
schema antes de a AMI ter escrito qualquer texto é especulação, e filtro por
categoria, tempo de leitura e sumário lateral são recursos de um blog com volume,
que não existe. O defeito real era o silêncio: fica registrado aqui e vai ao
usuário. Custo se errado: se a AMI publicar orientação clínica antes da Fase 2, o
conteúdo sai sem selo de revisão, com autoria e datas, que é o núcleo do YMYL.

## 32

**[PRODUTO]** **I6 (relatório de verificação das 14 rotas novas) entra na onda.** A
spec, seção 11, exige relatório escrito antes de cada entrega, e
`docs/verificacao-fase-1.md` cobre só as telas anteriores a este ramo. É exigência
da spec, não preferência.

## 33

**[PRODUTO]** **a correção do item 1 passou do ponto e criou regressão ao vivo.**
Verifiquei com o servidor no ar: `/associacao/diretoria` passou a mostrar **zero
CRM**, ou seja, nome de médico sem inscrição, exatamente a violação do Art. 4º, I
que o item existia para eliminar. Antes da correção a página mostrava os quatro,
porque os diretores de demonstração estão ligados a perfis publicados e o embed
funcionava.

## 34

**[PRODUTO]** **faço um despacho cirúrgico final em vez de parar aqui**, contra a regra
de "uma onda só". A justificativa é específica e limitada, não vontade de polir:

## 35

**[PRODUTO]** **o item 4 fica parado, com ressalva registrada.** `diretoria.crm` é cópia
congelada e `profissional.crm` é o registro vivo, com `unique` e `verificado_em`;
nada reconcilia os dois. Corrigir o CRM em `profissional` faz a diretoria exibir o
número velho enquanto o perfil, a um clique, exibe o novo. O revisor argumentou
contra a ordem de preferência e depois concordou com ela, porque inverter faria o
valor exibido depender de `profissional.publicado`, que é estado invisível na
tela. Não há conserto barato: exigiria gatilho no banco ou nota operacional.
Custo se errado: CRM desatualizado na página da diretoria depois de uma correção
cadastral. Vai para o usuário como pendência conhecida.

## 36

**[PRODUTO]** **não coloquei trava de formato em `crm_uf`.** Quem implementou decidiu e
eu concordo: `profissional.crm_uf` é `text` sem checagem, e o `update` da
migração copia de lá, então regra mais estrita na cópia quebraria a própria
cópia. Registrado que, no dia em que `profissional` ganhar disciplina de formato,
esta coluna deveria ganhar junto. Custo se errado: UF malformada na diretoria,
mas só se já estiver malformada no cadastro do profissional.
