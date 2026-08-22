# Importador de planilha de associados — desenho

Data: 22/08/2026
Situação: aprovado seção a seção, aguardando revisão do documento
Especificação de origem: [seção 8 do desenho da Fase 1](2026-08-19-site-ami-diretorio-design.md)

## 1. O que este documento cobre

O caminho pelo qual os cerca de 500 associados da AMI entram no banco a partir de uma
planilha, e o comando que os coloca no ar depois. É o que tira o site do modo
demonstração.

Fora deste documento: o painel em `/painel`, a autenticação, a fila de revisões e a área
do associado. O importador é construído para ser reaproveitado por eles, não para
esperá-los.

## 2. A descoberta que moldou o desenho

**O projeto não tem nenhum caminho de escrita no banco.** Toda comunicação com o Supabase
passa por `lib/dados/cliente.ts`, que usa a chave anônima. A RLS tem dez políticas, todas
`for select`. Não existe política de `insert` nem de `update` em tabela nenhuma, não
existe autenticação, e os 24 médicos de demonstração entraram por SQL colado no editor do
Supabase.

Isso não é falha: é o que impede um erro de tela de expor rascunho. Mas significa que o
importador é a primeira peça do projeto que escreve, e por isso precisa decidir de onde
vem o privilégio.

Uma consequência menos óbvia decidiu o resto: **a conferência antes de gravar exige
leitura privilegiada.** Tudo que entra pela planilha chega despublicado, e a chave anônima
só enxerga `publicado = true`. Um importador que lesse com ela não veria, na segunda
rodada, ninguém que criou na primeira: relataria "500 criações" de novo e bateria em
violação de chave única. Ler exige privilégio, não só escrever.

## 3. Decisões tomadas, e por quê

| Decisão | Motivo |
|---|---|
| Comando na máquina do desenvolvedor, não tela web | A chave de escrita nunca chega ao site publicado, então nenhuma rota mal escrita vira porta de gravação. O núcleo fica pronto para o painel chamar depois |
| Chave secreta dedicada (`sb_secret_`), nunca a `service_role` | A `service_role` é a chave-mestra e não tem revogação isolada. Uma chave por componente, como o próprio Supabase recomenda, faz "a máquina foi comprometida" caber em dois minutos de painel, sem o site piscar |
| Uma linha carrega médico e um endereço; horário fica fora | "seg a sex 8h às 12h" não vira faixa de horário sem chutar, e horário errado publicado faz paciente ir à porta fechada. O perfil sai pedindo confirmação por telefone, que é verdade |
| Quem some da planilha não é despublicado | Linha apagada por engano e desligamento real chegam idênticos no arquivo. Um deles tira do ar um médico ativo, em silêncio |
| Célula vazia nunca apaga o que está no banco | Vazio significa "não tenho essa informação", não "apague a que existe" |
| Especialidade nunca é criada pelo importador | Cada uma tem texto editorial e vira URL indexada; criada em branco produz página de faceta sem prosa |
| Bairro é criado, com aviso de parecido | O catálogo tem 8 linhas e Imperatriz tem dezenas. Tratar bairro novo como erro reprovaria quase toda linha na primeira rodada |
| O `slug` do perfil é calculado na criação e nunca recalculado | Recalcular quebra uma URL que o Google já indexou |
| Bio fica fora da planilha | A Resolução CFM 2.336/2023 restringe linguagem autopromocional, e a bio é onde ela aparece. É o único ponto onde o site publicaria em massa um texto que precisa de um par de olhos por unidade |
| A conferência é o comportamento padrão; gravar exige `--gravar` | O caminho fácil é o inofensivo |
| Nada é publicado pela importação | 500 perfis vazios no ar de uma vez fazem o Google classificar o site como conteúdo raso |

## 4. Forma

Dois comandos — `importar` e `publicar` — e em ambos a conferência é o comportamento
padrão.

```bash
npm run importar -- --modelo
```

```bash
npm run importar -- associados.xlsx
```

```bash
npm run importar -- associados.xlsx --gravar
```

O segundo não grava nada. Gravar exige a palavra `--gravar` escrita à mão. É assim que o
"o botão de confirmar só aparece depois" da especificação de origem vira comando.

### Onde o código mora

```
lib/importador/       núcleo puro, sem entrada e saída
  colunas.ts          reconhece o cabeçalho do arquivo
  linha.ts            linha crua → linha válida ou erro localizado
  plano.ts            linhas + retrato do banco → o que cria, atualiza, falha
  relatorio.ts        plano → texto legível
scripts/importar.ts   lê arquivo, chama o núcleo, imprime, grava
scripts/publicar.ts   publicação em lote
```

A divisão não é organizacional. `plano.ts` recebe o estado atual do banco como argumento
em vez de consultá-lo, e por isso toda regra deste documento vira teste de função pura,
sem banco. Só `scripts/` toca disco, rede e credencial.

### Bibliotecas

`read-excel-file` e `write-excel-file`, ambas MIT, ambas mantidas — publicadas em agosto e
junho de 2026. Entram como **dependência de desenvolvimento**: `scripts/` nunca roda no
site publicado, e o pacote que o visitante baixa não cresce.

O `xlsx` (SheetJS) foi descartado por medição, não por preferência. A única versão que
existe no npm é a 0.18.5, e a consulta ao registro devolveu dois avisos de severidade
alta contra ela: poluição de protótipo (`<0.19.3`) e negação de serviço por expressão
regular (`<0.20.2`). Não há como corrigir atualizando — a partir da 0.19 o SheetJS publica
apenas no CDN próprio.

## 5. A planilha

Treze colunas. Só as duas primeiras são obrigatórias.

| Coluna | Obrigatória | Regra |
|---|---|---|
| `nome` | **sim** | |
| `crm` | **sim** | pontuação é removida; o que sobra precisa ser dígito |
| `uf_do_crm` | não | vazio vira `MA`; precisa ser uma das 27 UFs |
| `especialidade` | não | resolvida pela escada da seção 6 |
| `rqe` | não | só é gravado se a especialidade da mesma linha resolver |
| `telemedicina` | não | `sim`/`não`/`s`/`n`/`x`/vazio, sem acento e sem caixa |
| `logradouro` | não | |
| `numero` | não | |
| `complemento` | não | |
| `bairro` | não | |
| `cep` | não | pontuação removida; precisa sobrar 8 dígitos |
| `telefone` | não | pontuação removida; precisa sobrar 10 ou 11 dígitos |
| `whatsapp` | não | idem |

### Três níveis de problema, e só um descarta a linha

1. **Rejeita a linha inteira**: `nome` vazio, `crm` vazio ou não numérico, `uf_do_crm`
   inexistente, ou CRM repetido com nome diferente. São os campos que estabelecem
   **identidade** — sem eles não há a quem atribuir o resto, e adivinhar cola um
   consultório no médico errado
2. **Descarta só o campo**: telefone, whatsapp ou CEP que não normalizam. O médico entra,
   o campo fica vazio, e o relatório diz qual linha e qual campo. Gravar um telefone que
   não é telefone é pior do que não ter telefone
3. **Vira pendência**: especialidade não resolvida. O médico entra sem ela

**Falta de campo não é problema nenhum.** Ausência apenas reduz o que é gravado. Um médico
sem endereço entra e fica esperando o endereço.

### Três campos que a planilha não tem e o importador preenche

- `associado_ami` entra como **verdadeiro**. A planilha é a lista de associados; não faz
  sentido pedir uma coluna cuja resposta é sempre a mesma
- `situacao` fica no padrão do banco, `ativo`
- `publicado` entra como **falso**, sempre, sem exceção e sem opção de linha de comando

Booleano vazio segue a regra geral: na criação vale o padrão do banco; na atualização não
toca no que já está lá.

**CRM repetido em duas linhas é o mesmo médico com um segundo local.** É como a AMI
representa quem atende em dois consultórios sem formato aninhado. E o mesmo CRM com
**nome diferente** é erro, não segundo endereço: quase sempre é CRM digitado errado, e
gravar colaria um consultório no médico errado.

**Toda coluna presente no arquivo que o importador não usou aparece na conferência.** Se a
AMI mandar bio, e-mail ou qualquer outra coisa, isso fica sabido em vez de sumir.

### O que ficou de fora, e por quê

- **Horário**, pela razão da seção 3
- **Nome da clínica.** `estabelecimento` exige categoria (clínica, laboratório, hospital,
  centro diagnóstico) e endereço próprio, o que obriga a AMI a classificar cada lugar. O
  consultório entra como endereço solto, que `local.estabelecimento_id` já aceita nulo.
  Custo aceito: dois médicos na mesma clínica geram dois endereços iguais — redundante,
  sem consequência, porque a contagem por bairro conta médico e não endereço
- **Bio**, pela razão da seção 3. Ela entra depois pelo painel, ou pelo formulário
  "Atualizar meus dados" do rodapé do perfil, que é o caminho melhor: quem escreve a bio
  de um médico com precisão é o próprio médico. O perfil não fica com buraco enquanto
  isso — a seção "Sobre" é condicional e simplesmente não existe sem bio

## 6. Como o plano é montado

O comando lê o banco uma vez — profissionais, especialidades, bairros, endereços e
atendimentos — e entrega esse retrato a `plano.ts`. Mesmas linhas e mesmo retrato produzem
sempre a mesma decisão.

**A chave natural é `(crm, crm_uf)`**, que já existe como restrição de unicidade em
`profissional`. Não é convenção do importador: é o banco garantindo.

### Especialidade: escada de resolução

1. Nome exato no catálogo
2. Nome sem acento e sem diferença de caixa
3. Mapa de sinônimos de `lib/dados/sinonimos.ts` — "clinico" resolve para Clínica Médica

Falhou tudo, vira pendência **e o médico entra assim mesmo, sem especialidade**.

Duas pendências distintas, porque o conserto difere: *não reconheço este nome* pede
corrigir a planilha; *reconheço, mas não está no catálogo do banco* pede acrescentar a
especialidade. A distinção existe porque o mapa de sinônimos tem 19 entradas e o catálogo
do banco tem 14.

**O RQE cai junto.** Ele não é coluna de `profissional`: mora em
`profissional_especialidade`, que é o laço entre o médico e a especialidade. Sem
especialidade resolvida não existe laço, e o RQE não tem onde ser gravado. Quando isso
acontece o relatório diz explicitamente que o RQE daquela linha foi perdido, em vez de
deixar o número sumir junto com a especialidade — publicar um médico sem o RQE que ele
tem enfraquece exatamente o que o Art. 4º, II da Resolução CFM manda exibir onde há
registro.

### Bairro: criado, com aviso

Casa por nome ou slug, sem acento e sem caixa. Não casou, é bairro novo e será criado.

A conferência lista cada bairro novo com quantos médicos ele receberia, e **marca os que
se parecem demais com um bairro já existente** — distância de edição pequena sobre a forma
normalizada. É o que separa "Nova Imperatris" digitado errado de um bairro que realmente
falta no catálogo. A marcação também vale entre bairros novos do mesmo arquivo.

### O endereço do perfil nunca muda

O `slug` é calculado na criação e **jamais recalculado**. Corrigir "Joao" para "João" numa
rodada seguinte muda o nome e mantém o endereço do perfil. O relatório avisa quando isso
acontece.

Colisão de slug entre dois médicos é resolvida na criação, contra os slugs já no banco e
os já atribuídos no mesmo arquivo. Como slug nunca é recalculado, o que for atribuído vale
para sempre.

### Atualização

Para um CRM já existente, só é escrito o campo que está **preenchido na planilha e
diferente do banco**. A conferência mostra a diferença campo a campo.

### Endereços

Casa por logradouro, número e bairro normalizados. Casou, é atualização do endereço
existente — que é o caso de a AMI corrigir um telefone. Não casou, é endereço novo.
Endereço que está no banco e não veio na planilha é **relatado, nunca apagado**.

### Ausentes

Médico que está no banco e não aparece no arquivo é contado e relatado. O importador não
faz nada com ele.

## 7. O relatório

```
CONFERÊNCIA — associados.xlsx
523 linhas lidas · 498 médicos distintos

  cria           471 médicos
  atualiza        27 médicos
  rejeita          3 linhas
  ignora           1 coluna do arquivo: "email"

BAIRROS NOVOS (serão criados)
  Bacurizinho ......... 12 médicos
  Vila Nova ............ 8 médicos
  Nova Imperatris ...... 1 médico    (!) parecido com "Nova Imperatriz"

ESPECIALIDADES NÃO RESOLVIDAS
  "Cirurgia Vascular" .. 6 médicos    conhecida, fora do catálogo do banco
  "Ortopedía" .......... 2 médicos    não reconhecida
  2 destes tinham RQE, que não será gravado (linhas 41, 190)

CAMPOS DESCARTADOS (o médico entra sem eles)
  linha 102  telefone "3524" tem 4 dígitos
  linha 267  cep "6590" tem 4 dígitos

NO BANCO E FORA DESTE ARQUIVO
  3 médicos. Nada será feito com eles.

LINHAS REJEITADAS
  linha  88  CRM vazio
  linha 214  CRM 4821 já apareceu na linha 97 com outro nome
  linha 355  UF do CRM "MAA" não existe
```

Todo erro cita **o número da linha do arquivo**, que é o que a AMI enxerga ao abrir a
planilha. O relatório é a mesma função nos dois modos: o que a conferência descreve é o
que `--gravar` executa.

## 8. Como grava

### Não existe transação, e isso é assumido

O supabase-js fala por HTTP e o PostgREST não abre transação entre requisições. Transação
de verdade exigiria ligar direto no Postgres com o `pg`, o que troca uma chave revogável
por uma senha de banco e depende de conexão direta que é IPv6 em muitas contas do
Supabase — o que não conecta em boa parte das redes domésticas. Não compensa.

**A resposta é ser repetível.** Toda operação é por chave natural, então rodar de novo
depois de uma interrupção completa o que faltou em vez de duplicar.

E como **nada é publicado pela importação**, uma gravação interrompida é invisível para o
visitante: os perfis entram com `publicado = false`, e a RLS esconde perfil, endereço,
atendimento e horário de quem não está publicado.

Uma consequência honesta: se a interrupção cair entre criar o endereço e ligá-lo ao
médico, sobra um endereço solto. Ele não vaza nada — a política `local_publicado` exige
médico ou estabelecimento publicado — e a rodada seguinte o relata, sem apagar.

### Ordem

1. Bairros novos, em lote — os endereços dependem deles
2. `profissional`, em lote, com resolução de conflito por `(crm, crm_uf)`
3. `profissional_especialidade`
4. `local`
5. `atendimento`

### Nenhuma remoção, em lugar nenhum

O importador não contém `delete` nem `truncate`. Isso vira teste: uma verificação que lê o
código do módulo de gravação e falha se essas palavras aparecerem. É grosseiro de
propósito — é a regra que protege 500 cadastros de um erro de implementação.

## 9. Publicação em lote

```bash
npm run publicar -- --com-especialidade --com-local
```

```bash
npm run publicar -- --com-especialidade --com-local --gravar
```

Conferência primeiro, `--gravar` para valer, igual ao importador. Os filtros são os que a
especificação de origem pede. Perfil sem especialidade não aparece em faceta nenhuma;
publicá-lo só engorda o número.

## 10. Credencial

### Chave secreta dedicada, não a `service_role`

O Supabase oferece quatro tipos de chave: as antigas `anon` e `service_role`, em formato
JWT, e o par novo `sb_publishable_` e `sb_secret_`. As antigas continuam válidas, com
descontinuação prevista para o fim de 2026.

O importador usa uma **chave secreta dedicada**, criada no painel com o nome `importador`,
e não a `service_role`. A razão está na própria documentação do Supabase: convém uma chave
por componente, para que o vazamento de uma exija trocar só aquela. A `service_role` é a
chave-mestra do projeto e não tem revogação isolada — comprometida, ela contamina tudo.

Consequência prática, e é o que importa: **revogar a chave `importador` não faz o site
piscar.** Ele nunca a usou; lê com a chave pública, que continua intacta. Quem para é só o
importador, até uma chave nova ser criada.

### Onde ela mora

Na máquina do desenvolvedor, em `.env.local`, que já está fora do versionamento.

- O importador mora em `scripts/`, **fora do aplicativo Next**. Nada que o Next empacota
  alcança a variável
- O nome **nunca** leva o prefixo `NEXT_PUBLIC_`. Com o prefixo, o valor vai para dentro do
  JavaScript que o navegador baixa
- Entra em `.env.local.exemplo` só como explicação, sem valor
- Não vai para a Vercel nem para onde o site for hospedado
- `lib/dados/cliente.ts` continua com a chave pública e não é tocado

O cliente privilegiado vive num módulo próprio, sob `scripts/`, e é o único ponto do
projeto que lê essa variável.

**Duas origens, e a escolha é de quem roda.** Se a variável existir no ambiente, ela é
usada. Se não existir, o comando pergunta antes de continuar, sem ecoar o que for digitado
e sem gravar em lugar nenhum. Quem preferir não ter a chave em arquivo tem como.

### Se a máquina se perder

Nada insubstituível vive nela: o código está no GitHub, o cadastro no Supabase, o
conteúdo editorial no Sanity. O único arquivo fora do versionamento é `.env.local`, e todo
valor dentro dele é recuperável de um painel ou gerável de novo em minutos.

O procedimento vira documento próprio, `docs/como-remontar-o-ambiente.md`, em passos
numerados: de qual tela de qual serviço vem cada variável, e o que fazer quando a máquina
se perde. "É só reconfigurar" é fácil de escrever e ruim de descobrir sozinho.

## 11. Testes

Em `testes/`, com vitest, como o resto do projeto. O núcleo é puro, então cobre-se sem
banco:

- Reconhecimento de cabeçalho, incluindo coluna faltando, coluna a mais e nome com acento
- Os três níveis de problema: telefone curto descarta o campo e mantém o médico; UF
  inexistente rejeita a linha; especialidade desconhecida vira pendência e mantém o médico
- Validação de linha: CRM com pontuação, UF inválida, telefone que não normaliza, CEP curto
- CRM repetido com o mesmo nome vira segundo endereço; com nome diferente vira erro
- Escada da especialidade nos três degraus, e as duas pendências distintas
- RQE sem especialidade resolvida é relatado como perdido, não some calado
- Bairro novo, bairro que casa sem acento, e o aviso de parecido
- Slug estável: nome corrigido não muda o slug
- Célula vazia não apaga campo preenchido
- Endereço que casa atualiza; endereço que não casa cria; endereço ausente é só relatado
- O relatório da conferência descreve exatamente o que a gravação faria
- O módulo de gravação não contém `delete` nem `truncate`

Os arquivos `.xlsx` de teste são gerados pelo próprio `write-excel-file` dentro do teste,
para que nenhum binário entre no versionamento.

## 12. Pendências e riscos

- **`tsx` não está declarado.** O script `doc-legal` já depende dele e ele só existe no
  projeto por dependência transitiva. O importador aumenta a exposição. Entra como
  dependência de desenvolvimento explícita
- **A planilha real ainda não existe.** O importador é construído e testado contra
  arquivos gerados nos testes; a primeira rodada com dados reais vai revelar formato que
  este documento não previu, e é para isso que a conferência existe
- **Fotos ficam para outro momento.** A especificação de origem prevê lote separado, com
  arquivos nomeados pelo CRM. Não entra aqui
- **Endereço duplicado entre médicos da mesma clínica** é consequência aceita de deixar
  `estabelecimento` fora. Se incomodar depois, o conserto é unir endereços iguais, não
  mudar o formato da planilha
- **`docs/como-remontar-o-ambiente.md` ainda não existe.** É pendência do plano de
  implementação, não deste desenho
