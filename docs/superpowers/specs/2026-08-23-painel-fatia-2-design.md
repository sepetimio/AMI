# Painel da agência, fatia 2 — desenho

Data: 23 de agosto de 2026
Estado: aprovado no levantamento, aguardando plano

---

## 1. O que esta fatia cobre

A fatia 1 deixou a AMI publicar um médico e editar os campos dele. Ela não deixa dar
a esse médico uma especialidade, um consultório ou um horário — e a página pública
mostra os três.

Hoje esses dados só entram pelo importador, que é a máquina da agência rodando um
script. A fatia 2 fecha esse buraco.

O que entra:

- **Especialidades do médico**, com RQE e qual é a principal
- **Consultórios onde ele atende**, buscando um já cadastrado ou criando um novo
- **A grade de horários** de cada consultório
- **Dois campos que faltaram na fatia 1**: "é associado da AMI" e "CRM/UF"

Ao terminar, a AMI monta um perfil completo sozinha. Sobra só a foto.

## 2. Medições feitas antes de o desenho existir

Cada uma destas mudou o desenho. Nenhuma foi suposta.

**Estabelecimento não é usado por nada.** Zero linhas na tabela, nenhuma rota pública
sob `app/(site)/`, e os 24 locais existentes têm `estabelecimento_id` nulo. Ficou de
fora: seria tela para um conceito que nada consome.

**`lat` e `lng` não são lidos em lugar nenhum.** Não há mapa no site. Sem isso, some
o item mais caro que a fatia poderia ter — geocodificar endereço.

**Os horários reais têm duas faixas por dia.** 246 horários para 24 atendimentos, no
padrão `08:00–12:00` e `14:00–18:00` de segunda a sexta, mais sábado de manhã. Uma
grade de uma faixa por dia destruiria metade dos dados.

**Os 24 locais são um por médico, nenhum compartilhado.** A tabela `atendimento`
existe para permitir compartilhar, e a vida real compartilha — uma clínica com seis
médicos. O desenho passa a usar isso.

**Nenhum médico tem foto, e não existe armazenamento de arquivo configurado.**
Enviar foto seria montar do zero onde arquivo mora. Virou fatia própria.

**Não existe restrição de "exatamente uma principal" no banco.** A regra vive só no
código, em `lib/painel/consultas.ts:39` — "a marcada como principal, ou a primeira".
Duas principais deixam a página do médico ambígua sem ninguém perceber.

## 3. Decisões tomadas, e por quê

**Tudo mora dentro da página do médico.** Quem cadastra pensa "vou completar a
Aline", não "vou até a tela de horários". A página vira quatro blocos empilhados, e
cada bloco é um formulário independente: salvar o telefone de um consultório não
pode arriscar o que foi digitado nas especialidades.

**Remoção passa a existir, restrita a quatro tabelas de ligação.** É o único jeito de
desfazer um vínculo. As quatro são `profissional_especialidade`, `atendimento`,
`horario` e `local_acessibilidade`.

**Médico não pode ser apagado.** Quem deixa de ser associado vira `associado_ami =
false` e `publicado = false`: some do site na hora, o cadastro fica guardado, e voltar
é um clique. Apagar levaria junto especialidades, atendimentos, formação e o vínculo
com a conta de acesso — cinco tabelas, sem volta, num painel de 500 nomes parecidos
onde o botão ficaria ao lado de "tirar do ar".

**Local pode ser criado e corrigido, mas não apagado.** Apagar um endereço que outro
médico usa é estrago silencioso, e a tabela não tem como saber que estava em uso. Um
endereço órfão não aparece em lugar nenhum do site; continuar existindo é mais barato
que sumir por engano.

**A grade tem sete dias e faixas livres, com "repetir nos dias úteis".** Fiel ao dado
medido, e o botão de repetir resolve o caso comum, que é a mesma faixa de segunda a
sexta.

**Bairro sai de lista fechada.** Digitado à mão vira "Centro", "centro" e "CENTRO", e
a busca do site quebra.

## 4. Modelo de dados

Nenhuma tabela nova. Nenhuma coluna nova. Todas já existem desde `0001_diretorio.sql`.

```
profissional_especialidade   (profissional_id, especialidade_id) chave composta
                             rqe text null, principal boolean

atendimento                  id, profissional_id, local_id
                             unique (profissional_id, local_id)

horario                      id, atendimento_id, dia_semana 0..6,
                             abre time, fecha time, check (fecha > abre)

local                        id, estabelecimento_id null, logradouro, numero,
                             complemento, bairro_id, cep, lat, lng, telefone,
                             whatsapp, estacionamento

local_acessibilidade         (local_id, recurso) chave composta
                             recurso em acesso_cadeirante, banheiro_adaptado,
                             elevador, piso_tatil, interprete_libras
```

Duas observações que o implementador precisa ter em mãos:

`horario` não tem restrição de unicidade sobre `(atendimento_id, dia_semana)`. Isso é
deliberado e é o que permite duas faixas no mesmo dia. A consequência é que impedir
sobreposição é trabalho da aplicação, não do banco.

`atendimento` tem `unique (profissional_id, local_id)`. Ligar duas vezes o mesmo médico
ao mesmo local devolve erro `23505`, que precisa virar mensagem em português — como
já é feito para colisão de CRM em `app/painel/medico/[id]/acoes.ts`.

## 5. As políticas

A migração `0006_painel_vinculos.sql` acrescenta, com a mesma condição da fatia 1
(`using ((select eh_admin()))`, subconsulta içável para não pesar no site público):

| tabela | insert | update | delete |
|---|---|---|---|
| `profissional_especialidade` | sim | sim | **sim** |
| `atendimento` | sim | — | **sim** |
| `horario` | sim | sim | **sim** |
| `local_acessibilidade` | sim | — | **sim** |
| `local` | sim | sim | não |

`atendimento` e `local_acessibilidade` não têm update porque não há o que atualizar:
as duas são só a ligação, e trocar a ligação é remover e criar.

### O que muda numa garantia existente

Hoje o projeto não apaga nada, em lugar nenhum, e dois testes vigiam isso:
`testes/painel-acoes.test.ts:37` e `testes/painel-migracao.test.ts:18`.

Os dois passam a nomear as quatro tabelas onde remoção é permitida, e continuam
recusando remoção em qualquer outra — `profissional`, `local`, `especialidade`,
`bairro`, `perfil_usuario`, `auth.users`. A trava é reapontada, não afrouxada.

Isto está escrito aqui porque é a decisão de maior consequência da fatia, e foi
tomada com o dono do projeto sabendo o que ela troca: **antes desta fatia é impossível
apagar qualquer coisa por este painel; depois, deixa de ser.**

## 6. As telas

A página do médico vira quatro blocos.

### Bloco 1 — Dados do médico

O formulário da fatia 1, mais dois campos que faltavam:

- **É associado da AMI** — o interruptor que a decisão de "não apagar médico" depende.
  Existe no banco desde sempre e nenhuma tela mostrava
- **CRM/UF** — a tela grava hoje sem perguntar, usando o valor que já estava

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

Corrigir um endereço corrige para todos os médicos que atendem nele. Isso é o ganho de
compartilhar, e a tela precisa dizer isso quando o endereço tem mais de um médico, para
ninguém corrigir achando que mexe só no seu.

Remover tira o médico do consultório. O consultório continua existindo.

### Bloco 4 — Horários

Dentro de cada consultório, sete blocos, um por dia da semana. Cada dia aceita
quantas faixas forem precisas, com "acrescentar faixa" e "remover".

Um botão **"repetir nos dias úteis"** copia o dia preenchido para segunda a sexta. É o
que torna a tela usável, porque o dado real é quase sempre o mesmo nos cinco dias.

## 7. As regras que a tela vigia

**Horário**

1. Fechar antes de abrir — o banco já recusa, mas com mensagem em inglês citando o
   nome interno da restrição. A tela avisa antes, em português
2. Duas faixas do mesmo dia se sobrepondo — `08:00–12:00` e `11:00–15:00` não podem
   coexistir. O banco não impede; só a aplicação
3. Faixa sem dia da semana

**Especialidade**

4. No máximo uma principal — garantido pelo botão de escolha única
5. A mesma especialidade duas vezes — a chave composta já recusa, e a mensagem vira
   português

**Local**

6. Logradouro e bairro obrigatórios; o resto opcional
7. Bairro só da lista fechada

**Atravessando tudo**

8. **Célula vazia nunca apaga.** Salvar o formulário com o telefone em branco mantém o
   telefone que estava lá. Apagar é ação explícita, com botão próprio. É a mesma regra
   que `lib/importador/plano.ts` já segue, e vale a pena ser igual nos dois lugares
9. Todos os erros de um formulário voltam de uma vez, não um por vez — como
   `validarMedico` já faz

## 8. Arquivos

```
supabase/migrations/0006_painel_vinculos.sql

lib/painel/especialidades.ts        consultas e validação
lib/painel/locais.ts                consultas e validação
lib/painel/horarios.ts              consultas e validação

app/painel/medico/[id]/acoes-especialidade.ts
app/painel/medico/[id]/acoes-local.ts
app/painel/medico/[id]/acoes-horario.ts

components/painel/BlocoEspecialidades.tsx
components/painel/BlocoLocais.tsx
components/painel/GradeDeHorarios.tsx
```

Três pares, um por assunto. A validação fica separada da ida ao banco, como em
`lib/painel/medico.ts` — é o que permite testar as regras sem banco nenhum.

## 9. A invalidação

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
junto. O sitemap não usa data de modificação, então horário não mexe nele; a chamada
fica assim mesmo, porque custa nada e evita raciocínio sutil daqui a três meses.

## 10. Como isto é verificado

**Testes automáticos, sem banco.** Cada regra da seção 7 vira um teste. Rodam em
milissegundos e a cada mudança.

**Assertivas de política, contra o banco.** `supabase/testes-rls.sql` ganha uma
assertiva por tabela nova: o visitante anônimo não escreve, a conta sem perfil não
escreve, o admin escreve, e a remoção só passa nas quatro tabelas permitidas.

**A conferência com o dedo.** Pegar um médico, dar a ele uma especialidade, um
consultório e uma grade, e ver os três aparecerem no site.

Esta terceira camada não é formalidade. Em 23/08/2026 foi ela que achou um defeito que
469 testes automáticos e as assertivas de política deixaram passar: `alternarPublicacao`
não conferia se a gravação alterou alguma linha, e como o PostgREST filtra a linha que a
política não admite em vez de recusar a chamada, o painel mostrava um estado que o banco
não tinha. Corrigido em `003dda2`.

**Consequência para esta fatia:** toda gravação nova pede as linhas afetadas de volta e
falha alto quando não vem nenhuma. Isso vale para as três ações e é assertiva de teste,
não recomendação.

## 11. O que fica de fora

| fica de fora | motivo |
|---|---|
| Foto do médico | Não existe armazenamento de arquivo configurado. Vira fatia própria |
| Estabelecimentos | Zero linhas, nenhuma página pública, nenhum local aponta para um |
| Diretoria | Área separada, sem relação com o perfil do médico |
| Textos das especialidades | Escrita de conteúdo, não cadastro |
| Comunicados e anuidades | Servem à área do associado, que não existe (Fase 2) |
| Apagar médico | Decisão explícita. Fica o "não é mais associado" |

## 12. Riscos e pendências

- **A remoção deixa de ser impossível.** Restrita a quatro tabelas de ligação, e o que
  se perde se refaz em dois cliques. Mas é uma garantia a menos, e está registrado que
  foi escolha consciente
- **A página do médico no painel fica longa** — quatro blocos empilhados. Se a grade de
  horários crescer demais na prática, ela sai para tela própria por consultório, que foi
  a alternativa considerada e descartada por ora
- **Sobreposição de horário é vigiada só pela aplicação.** O banco aceita. Uma gravação
  por outro caminho — o importador, ou o editor SQL — pode criar sobreposição que a tela
  recusaria. Vale um índice de exclusão no futuro, fora do escopo desta fatia
- **A tela precisa avisar quando um endereço é compartilhado.** Sem esse aviso, alguém
  corrige o telefone achando que mexe só no seu médico e mexe em seis
