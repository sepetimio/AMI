# Painel da agência, fatia 2 — desenho

Data: 23 de agosto de 2026
Estado: aprovado no levantamento, aguardando plano

---

## 1. O que esta fatia cobre

A fatia 1 deixou a AMI publicar um médico e editar os campos dele. Ela não deixa dar
a esse médico uma especialidade nem um consultório — e a página pública mostra os dois.

Hoje esses dados só entram pelo importador, que é a máquina da agência rodando um
script. A fatia 2 fecha esse buraco.

O que entra:

- **Especialidades do médico**, com RQE e qual é a principal
- **Consultórios onde ele atende**, com telefone e WhatsApp, buscando um já cadastrado
  ou criando um novo
- **O campo que faltou na fatia 1**: "é associado da AMI"
- **A retirada dos horários do site público** — seção 3

Ao terminar, a AMI monta um perfil completo sozinha. Sobra só a foto.

## 2. Para que o site serve, e o que isso decide

O site da AMI **não existe para gerar agendamento**. Ele existe para apresentar os
associados e permitir que uma pessoa chegue até o especialista certo. Quando alguém
pede um cardiologista, o site responde quem é e como falar com ele.

Horário de funcionamento não serve a isso. Quem precisa saber quando o consultório
abre descobre falando com a secretária, ou no cartão do Google, onde a informação é
mantida por quem tem motivo para mantê-la.

Duas consequências, e elas moldam a fatia inteira:

**A especialidade é o campo mais importante do site.** É ela que responde à pergunta
que traz a pessoa. Vale o cuidado extra que a seção 7 descreve.

**Telefone e WhatsApp são o segundo mais importante.** São o que fecha o encaminhamento.
Deixam de ser detalhe do endereço e passam a ser o objetivo dele.

## 3. Os horários saem do site

### Por que

**A planilha que a AMI vai preencher não tem coluna de horário.** As colunas aceitas
pelo importador são `nome`, `crm`, `uf_do_crm`, `especialidade`, `rqe`, `telemedicina`,
`logradouro`, `numero`, `complemento`, `bairro`, `cep`, `telefone`, `whatsapp`
(`lib/importador/tipos.ts`). Não há hora nenhuma.

Quando o cadastro real entrar, **nenhum médico terá horário**. A grade ficará vazia em
todas as páginas e o selo de "aberto agora" nunca acenderá. Os 246 horários que existem
hoje são dos 24 médicos fictícios de demonstração, e somem no lançamento.

Isto não é corte de funcionalidade. É reconhecer uma que já estava morta.

O agravante é o selo: `SeloAbertoAgora` é uma promessa **ao vivo**, recalculada a cada
minuto no navegador, feita a partir de um dado que ninguém mantém. É o que faz alguém
sair de casa às 14h porque o site disse que estava aberto.

### O que sai

Quatorze arquivos. Três desaparecem por completo:

```
components/diretorio/GradeHorarios.tsx      a tabela de dias na página do médico
components/diretorio/SeloAbertoAgora.tsx    o "aberto agora" na lista
lib/dados/horarios.ts                       agruparPorDia, estaAbertoAgora, atendeNoDia
```

Os outros perdem os pedaços que usam horário:

```
app/(site)/medico/[slug]/page.tsx    linhas 174-175, a seção da grade
components/diretorio/LinhaMedico.tsx linhas 43 e 102, o selo
app/(site)/medicos/page.tsx          linhas 33 e 69, textos que prometem
                                     "endereço, telefone e horários por dia da semana"
components/diretorio/PainelFiltros.tsx linhas 44 e 149-153, a caixa "Atende aos sábados"
lib/dados/filtros.ts                 linha 56, o filtro de sábado
lib/dados/facetas.ts                 linha 249, a contagem de quem atende sábado
lib/dados/medicos.ts                 a seleção de horários na consulta
lib/dados/tipos.ts                   o tipo Horario
lib/seo/jsonld.ts                    openingHoursSpecification
testes/horarios.test.ts              some inteiro
testes/filtros.test.ts               os casos de sábado
testes/facetas.test.ts               os casos de sábado
testes/jsonld.test.ts                os casos de horário
```

### Duas coisas medidas que valem registro

**O filtro "Atende aos sábados" some junto.** É uma caixa visível na busca. Ela depende
do mesmo dado que ninguém vai preencher: com o cadastro real, marcá-la devolveria zero
médicos, sempre. Um filtro que nunca acha nada é pior que filtro nenhum.

**O que vai para o Google já se limpa sozinho.** `lib/seo/jsonld.ts:123` só inclui
`openingHoursSpecification` se houver horário — `...(horarios.length ? {...} : {})`.
Sem dado, não emite nada. A remoção do código é limpeza, não correção de bug.

### O que NÃO sai

A tabela `horario` continua no banco, com as 246 linhas. Nada é apagado: elas somem
junto com os médicos fictícios, no lançamento. A tabela fica sem uso, e é mais barato
deixá-la parada do que escrever uma migração para removê-la.

## 4. Medições feitas antes de o desenho existir

Cada uma destas mudou o desenho. Nenhuma foi suposta.

**Estabelecimento não é usado por nada.** Zero linhas na tabela, nenhuma rota pública
sob `app/(site)/`, e os 24 locais existentes têm `estabelecimento_id` nulo. Ficou de
fora: seria tela para um conceito que nada consome.

**`lat` e `lng` não são lidos em lugar nenhum.** Não há mapa no site. Sem isso, some
o item mais caro que a fatia poderia ter — geocodificar endereço.

**Os 24 locais são um por médico, nenhum compartilhado.** A tabela `atendimento`
existe para permitir compartilhar, e a vida real compartilha — uma clínica com seis
médicos. O desenho passa a usar isso.

**Nenhum médico tem foto, e não existe armazenamento de arquivo configurado.**
Enviar foto seria montar do zero onde arquivo mora. Virou fatia própria.

**Não existe restrição de "exatamente uma principal" no banco.** A regra vive só no
código, em `lib/painel/consultas.ts:39` — "a marcada como principal, ou a primeira".
Duas principais deixam a página do médico ambígua sem ninguém perceber.

**Existem oito bairros cadastrados.** Lista pequena e fechada, o que permite escolha em
vez de digitação.

## 5. Decisões tomadas, e por quê

**Tudo mora dentro da página do médico.** Quem cadastra pensa "vou completar a Aline",
não "vou até a tela de consultórios". A página vira três blocos empilhados, e cada
bloco é um formulário independente: salvar o telefone de um consultório não pode
arriscar o que foi digitado nas especialidades.

**Remoção passa a existir, restrita a três tabelas de ligação.** É o único jeito de
desfazer um vínculo. As três são `profissional_especialidade`, `atendimento` e
`local_acessibilidade`.

**Médico não pode ser apagado.** Quem deixa de ser associado vira `associado_ami =
false` e `publicado = false`: some do site na hora, o cadastro fica guardado, e voltar
é um clique. Apagar levaria junto especialidades, atendimentos, formação e o vínculo
com a conta de acesso — cinco tabelas, sem volta, num painel de 500 nomes parecidos
onde o botão ficaria ao lado de "tirar do ar".

**Local pode ser criado e corrigido, mas não apagado.** Apagar um endereço que outro
médico usa é estrago silencioso, e a tabela não tem como saber que estava em uso. Um
endereço órfão não aparece em lugar nenhum do site; continuar existindo é mais barato
que sumir por engano.

**Bairro sai de lista fechada.** Digitado à mão vira "Centro", "centro" e "CENTRO", e
a busca do site quebra.

## 6. Modelo de dados

Nenhuma tabela nova. Nenhuma coluna nova. Todas já existem desde `0001_diretorio.sql`.

```
profissional_especialidade   (profissional_id, especialidade_id) chave composta
                             rqe text null, principal boolean

atendimento                  id, profissional_id, local_id
                             unique (profissional_id, local_id)

local                        id, estabelecimento_id null, logradouro, numero,
                             complemento, bairro_id, cep, telefone, whatsapp,
                             estacionamento, lat, lng (as duas sem uso)

local_acessibilidade         (local_id, recurso) chave composta
                             recurso em acesso_cadeirante, banheiro_adaptado,
                             elevador, piso_tatil, interprete_libras
```

Uma observação que o implementador precisa ter em mãos: `atendimento` tem
`unique (profissional_id, local_id)`. Ligar duas vezes o mesmo médico ao mesmo local
devolve erro `23505`, que precisa virar mensagem em português — como já é feito para
colisão de CRM em `app/painel/medico/[id]/acoes.ts`.

## 7. As políticas

A migração `0006_painel_vinculos.sql` acrescenta, com a mesma condição da fatia 1
(`using ((select eh_admin()))`, subconsulta içável para não pesar no site público):

| tabela | insert | update | delete |
|---|---|---|---|
| `profissional_especialidade` | sim | sim | **sim** |
| `atendimento` | sim | — | **sim** |
| `local_acessibilidade` | sim | — | **sim** |
| `local` | sim | sim | não |

`atendimento` e `local_acessibilidade` não têm update porque não há o que atualizar:
as duas são só a ligação, e trocar a ligação é remover e criar.

`horario` não aparece nesta tabela. Os horários saíram do produto (seção 3), e uma
política de escrita para dado que nada consome é superfície sem uso.

### O que muda numa garantia existente

Hoje o projeto não apaga nada, em lugar nenhum, e dois testes vigiam isso:
`testes/painel-acoes.test.ts:37` e `testes/painel-migracao.test.ts:18`.

Os dois passam a nomear as três tabelas onde remoção é permitida, e continuam
recusando remoção em qualquer outra — `profissional`, `local`, `especialidade`,
`bairro`, `horario`, `perfil_usuario`, `auth.users`. A trava é reapontada, não
afrouxada.

Isto está escrito aqui porque é a decisão de maior consequência da fatia, e foi
tomada com o dono do projeto sabendo o que ela troca: **antes desta fatia é impossível
apagar qualquer coisa por este painel; depois, deixa de ser.**

## 8. As telas

A página do médico vira três blocos.

### Bloco 1 — Dados do médico

O formulário da fatia 1, mais **um** campo que faltava:

- **É associado da AMI** — o interruptor de que a decisão de "não apagar médico"
  depende. A coluna `associado_ami` existe desde `0001_diretorio.sql` e nenhuma
  tela jamais a mostrou

O formulário tem hoje oito campos: `nome`, `crm`, `crmUf`, `situacao`,
`telemedicina`, `bio`, `verificadoEm` e o `id` oculto. Medido em
`components/painel/FormularioMedico.tsx`. Uma versão anterior desta spec dizia
que faltava também CRM/UF; era falso, e veio de uma busca minha que só casava
nomes em minúscula e por isso não via `crmUf`.

Acrescentar o campo toca seis lugares: `CamposDoMedico` e `MedicoValidado` em
`lib/painel/medico.ts`, o corpo de `validarMedico`, a leitura do `FormData` em
`app/painel/medico/[id]/acoes.ts`, o formulário, e `SELECAO_COMPLETA` com
`MedicoDoPainel` em `lib/painel/consultas.ts`.

### Bloco 2 — Especialidades

Lista o que o médico tem. Cada linha: nome da especialidade, campo de RQE, e um
**botão de escolha única** para a principal — marcar uma desmarca a outra. É assim que
a regra "exatamente uma principal" é garantida, já que o banco não a garante.

Acrescentar é escolher de uma lista fechada, a mesma que o site usa. Remover é botão
por linha.

RQE vazio recebe aviso, não impedimento: clínico geral sem RQE é caso normal, e o banco
aceita nulo. O aviso existe porque a Resolução CFM 2.336/2023, Art. 4º, II exige o RQE
de quem tem especialidade registrada.

### Bloco 3 — Consultórios

Lista onde o médico atende. Acrescentar oferece duas saídas no mesmo campo: buscar
entre os endereços já cadastrados, ou criar um novo.

Criar pede logradouro e bairro como mínimo. Bairro vem de lista fechada de oito. O
resto — número, complemento, CEP, telefone, WhatsApp, estacionamento, acessibilidade —
é opcional.

**Telefone e WhatsApp ganham destaque na tela**, pela razão da seção 2: são o que
fecha o encaminhamento, e o site existe para isso.

Corrigir um endereço corrige para todos os médicos que atendem nele. Isso é o ganho de
compartilhar, e **a tela precisa dizer isso** quando o endereço tem mais de um médico,
para ninguém corrigir achando que mexe só no seu.

Remover tira o médico do consultório. O consultório continua existindo.

## 9. As regras que a tela vigia

**Especialidade**

1. No máximo uma principal — garantido pelo botão de escolha única
2. A mesma especialidade duas vezes — a chave composta já recusa, e a mensagem vira
   português

**Local**

3. Logradouro e bairro obrigatórios; o resto opcional
4. Bairro só da lista fechada
5. O mesmo médico ligado duas vezes ao mesmo local — erro `23505`, vira português

**Atravessando tudo**

6. **Célula vazia nunca apaga — no importador. No formulário do painel, apaga.**
   Numa planilha, célula em branco significa "não tenho essa informação", e é por isso
   que `lib/importador/plano.ts:46` ignora o vazio em vez de apagar o que já estava lá.
   Num formulário **pré-preenchido** o vazio significa outra coisa: o campo chegou à
   tela com o telefone que o banco tem, e o operador o esvaziou de propósito — é uma
   afirmação, "este consultório não tem telefone", exatamente o raciocínio que já vale
   para a caixa de marcar desmarcada. Aplicar aqui a regra do importador tornaria o
   telefone inapagável pela tela, sem nenhum outro caminho para corrigi-lo.
   *(Corrigido em 23/08/2026: a regra tinha sido escrita para os dois lugares, e o
   código do painel, que já gravava o vazio, estava certo.)*
7. Todos os erros de um formulário voltam de uma vez, não um por vez — como
   `validarMedico` já faz
8. **Toda gravação pede as linhas afetadas de volta** e falha alto quando não vem
   nenhuma. A razão está na seção 12

## 10. Arquivos

```
supabase/migrations/0006_painel_vinculos.sql

lib/painel/especialidades.ts        consultas e validação
lib/painel/locais.ts                consultas e validação

app/painel/medico/[id]/acoes-especialidade.ts
app/painel/medico/[id]/acoes-local.ts

components/painel/BlocoEspecialidades.tsx
components/painel/BlocoLocais.tsx
```

Dois pares, um por assunto. A validação fica separada da ida ao banco, como em
`lib/painel/medico.ts` — é o que permite testar as regras sem banco nenhum.

Mais a remoção listada na seção 3, que é trabalho espalhado por quatorze arquivos e
merece tarefa própria no plano.

## 11. A invalidação

Reusa exatamente as três chamadas da fatia 1:

```ts
revalidatePath("/(site)", "layout");
revalidatePath("/sitemap.xml");
revalidatePath("/painel");
```

Nada novo é preciso. Foi **medido em 23/08/2026**, contra `next build` + `next start`,
que a invalidação do layout alcança `/medico/[slug]` mesmo com o grupo de rota sozinho
no caminho — a documentação do Next só exemplifica o grupo com segmentos depois, e a
dúvida ficou fechada pela medição, não pela leitura.

As páginas de especialidade e bairro estão sob o mesmo grupo `(site)` e são alcançadas
junto. O sitemap não usa data de modificação; a chamada fica assim mesmo, porque custa
nada e evita raciocínio sutil daqui a três meses.

## 12. Como isto é verificado

**Testes automáticos, sem banco.** Cada regra da seção 9 vira um teste. Rodam em
milissegundos e a cada mudança.

**Assertivas de política, contra o banco.** `supabase/testes-rls.sql` ganha uma
assertiva por tabela nova: o visitante anônimo não escreve, a conta sem perfil não
escreve, o admin escreve, e a remoção só passa nas três tabelas permitidas.

**A conferência com o dedo.** Pegar um médico, dar a ele uma especialidade e um
consultório, e ver os dois aparecerem no site.

Esta terceira camada não é formalidade. Em 23/08/2026 foi ela que achou um defeito que
469 testes automáticos e as assertivas de política deixaram passar: `alternarPublicacao`
não conferia se a gravação alterou alguma linha, e como o PostgREST filtra a linha que a
política não admite em vez de recusar a chamada, o painel mostrava um estado que o banco
não tinha. Corrigido em `003dda2`.

**Consequência para esta fatia:** toda gravação nova pede as linhas afetadas de volta e
falha alto quando não vem nenhuma. Isso vale para as duas ações e é assertiva de teste,
não recomendação.

**Para a remoção dos horários**, a conferência é diferente: a suíte tem que ficar verde
depois de `testes/horarios.test.ts` deixar de existir, `next build` tem que passar, e
nenhuma página pode referenciar um componente que não existe mais. Um `grep` por
`horario` fora do painel e do importador tem que voltar vazio.

## 13. O que fica de fora

| fica de fora | motivo |
|---|---|
| Foto do médico | Não existe armazenamento de arquivo configurado. Vira fatia própria |
| Estabelecimentos | Zero linhas, nenhuma página pública, nenhum local aponta para um |
| Diretoria | Área separada, sem relação com o perfil do médico |
| Textos das especialidades | Escrita de conteúdo, não cadastro |
| Comunicados e anuidades | Servem à área do associado, que não existe (Fase 2) |
| Apagar médico | Decisão explícita. Fica o "não é mais associado" |
| Horários | O site não gera agendamento. Saem também do que já está no ar |

## 14. Riscos e pendências

- **A remoção deixa de ser impossível.** Restrita a três tabelas de ligação, e o que se
  perde se refaz em dois cliques. Mas é uma garantia a menos, e está registrado que foi
  escolha consciente
- **A remoção dos horários toca quatorze arquivos**, incluindo um filtro visível na
  busca. É trabalho espalhado, não difícil, e o risco é deixar referência órfã para
  trás. Por isso a conferência da seção 12 termina num `grep` que precisa voltar vazio
- **A tela precisa avisar quando um endereço é compartilhado.** Sem esse aviso, alguém
  corrige o telefone achando que mexe só no seu médico e mexe em seis
- **A tabela `horario` fica no banco sem uso.** Decisão deliberada: apagar dado é pior
  que deixá-lo parado, e as 246 linhas somem junto com os fictícios no lançamento
- **Tirar o médico de um consultório apaga linhas de `horario`, por cascata.**
  `horario.atendimento_id` referencia `atendimento` com `on delete cascade`, em
  `0001_diretorio.sql`. Remover uma linha de `atendimento` é permitido nesta fatia, e o
  Postgres apaga junto os horários daquele vínculo — `horario` está na lista do "nunca
  remove", mas **cascata de integridade referencial não passa por política de linha**:
  nenhuma política impede, e nenhuma poderia. **Fica como está**, e é escolha
  registrada: os horários saíram do produto nesta mesma fatia, as 246 linhas são dos
  médicos fictícios, nada as lê, e alterar a chave estrangeira de uma tabela já
  aplicada custa mais que o dano. A garantia da lista vale para escrita direta, e o
  comentário de `NUNCA_REMOVE`, em `testes/painel-migracao.test.ts`, diz isso no lugar
  onde alguém iria confiar nela
