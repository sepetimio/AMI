# Estado do projeto — Site da Associação Médica de Imperatriz

> Atualizado em 22 de agosto de 2026 · ramo `importador-de-planilha`, 155
> commits · ainda não fundido em `main`
> Repositório: `github.com/sepetimio/AMI`
> Especificação: [`docs/superpowers/specs/2026-08-19-site-ami-diretorio-design.md`](superpowers/specs/2026-08-19-site-ami-diretorio-design.md)

Este arquivo responde três perguntas: **o que existe**, **o que falta**, e **quem precisa fazer o quê**. É o ponto de retomada quando o trabalho parar e voltar depois.

---

## Em uma frase

O site está **funcional e verificado**, com o diretório médico completo, o blog, as páginas institucionais e o painel de conteúdo da AMI. Ele **não pode ir ao ar ainda**, e o que falta é conteúdo e cadastro, não código.

---

## O que existe e funciona

### Diretório médico

| Endereço | O que é |
|---|---|
| `/` | Home, com busca, índice de especialidades, bloco institucional, últimas notícias e bairros |
| `/medicos` | Índice de especialidades e bairros |
| `/medicos/{especialidade}` | Página de faceta, indexável, com parágrafo de abertura gerado dos dados reais |
| `/medicos/{especialidade}/{bairro}` | Cruzamento. Entra no índice de busca a partir de 3 profissionais |
| `/medico/{slug}` | Perfil, com CRM, endereços, horários por dia e acessibilidade |
| `/busca` | Busca livre, fora do índice de propósito |

A busca entende variação de nome de profissão: quem digita "cardiologista" encontra Cardiologia.

### Conteúdo editorial e institucional

| Endereço | O que é | Estado |
|---|---|---|
| `/noticias` e `/noticias/{slug}` | Blog, com autoria por CRM e dado estruturado para o Google | no ar |
| `/associacao` | Página-índice da associação | no ar |
| `/associacao/diretoria` | Diretoria, com cargo, nome e CRM, ligada aos perfis | no ar |
| `/associacao/{beneficios,estatuto,politica-editorial}` | Páginas de texto | **404 até a AMI escrever** |
| `/politica-de-privacidade`, `/termos-de-uso`, `/politica-de-cookies` | Páginas legais | no ar, com **rascunho não revisado** e aviso visível |
| `/studio` | Painel de conteúdo do Sanity, em português | no ar |

### Fundação

- **Next.js 16** com renderização no servidor em toda página indexável
- **Supabase** para o diretório, com as permissões escritas como políticas no banco e não como regra de tela: erro de front não vaza dado
- **Sanity** para o que se escreve, com atualização imediata do site por webhook quando a AMI publica
- **242 testes**, build com 58 páginas, sitemap com 45 endereços e nenhum 404
- Sistema visual reformulado, com contrastes medidos e aprovados em WCAG AA

### Conformidade

- **Resolução CFM 2.336/2023**: todo nome de médico sai com CRM e a palavra MÉDICO; RQE só onde há registro; nenhum ranking, nota ou comparação em lugar nenhum do site
- **Critério YMYL do Google**: autoria com CRM, datas visíveis, aviso de conteúdo informativo
- **LGPD**: nenhuma tela coleta sintoma ou diagnóstico

---

## O que falta

### 1. Conteúdo da AMI, e isto bloqueia o lançamento

**Três páginas de texto** ainda não existem, criadas em `/studio`, tipo "Página institucional". Enquanto não existirem, três endereços dão 404 e há links quebrados na página da associação.

| Endereço a escolher no campo "Endereço" | Prioridade |
|---|---|
| `politica-editorial` | **Alta.** É o que faz o Google reconhecer o site como fonte confiável em saúde. Não depende de advogado |
| `estatuto` | Média |
| `beneficios` | Média |

**As três páginas legais** (privacidade, termos, cookies) já estão no ar com **rascunho redigido a partir do funcionamento medido do site**, e aviso visível de que não passaram por advogado. O documento para revisão está em [`docs/rascunhos-textos-legais.md`](rascunhos-textos-legais.md), gerado da mesma fonte que o site renderiza.

> **A revisão por advogado de direito médico continua obrigatória antes do lançamento.** Publicado o texto revisado no Studio, ele substitui o rascunho, o aviso some e a página entra no sitemap sozinha, que hoje não a lista de propósito: rascunho não convida buscador.

Duas informações dentro dos rascunhos dependem da AMI:

1. **O encarregado pelo tratamento de dados**, que o artigo 41 da Lei 13.709/2018 exige designar. Falta nome e contato
2. **O prazo de guarda dos registros de acesso do servidor**, que depende de quem hospedar

Cada página pede: Título, Endereço, Resumo entre 60 e 220 caracteres, data de atualização e o texto.

### 2. Dados reais da AMI, e isto também bloqueia

- ~~Razão social, CNPJ, endereço e telefone da sede~~ **Recebidos em 21/08/2026** e no ar. O CNPJ foi conferido pelos dígitos verificadores. Vivem em `lib/ami.ts`, fonte única lida pelo rodapé e pelo dado estruturado
- **A diretoria real**: nome, cargo, **CRM**, UF e ordem hierárquica de cada diretor. Vai para o banco, não para o Studio. Só a presidente é conhecida, a Dra. Paula Bretas, e **falta o CRM dela**: exibir nome de médica sem inscrição viola o Art. 4º, I da Resolução CFM, e a restrição do banco impede gravar
- **A planilha dos cerca de 500 associados**
- **Qual dos dois telefones é WhatsApp**, se algum for. Não foi suposto: botão apontando para linha que não atende por lá é pior que não ter botão

### 3. A trava de indexação

Hoje `NEXT_PUBLIC_DADOS_DEMONSTRACAO=true`, e por isso o `robots.txt` responde `Disallow: /`: o site inteiro está invisível para o Google **de propósito**, porque os 24 médicos publicados são fictícios e têm CRM plausível. Um CRM naquela faixa pode pertencer a um médico de verdade.

**Virar essa chave é a última coisa a fazer antes do lançamento**, e só depois que o cadastro real estiver carregado. O rodapé lê a mesma variável, então o aviso de dados fictícios some junto, automaticamente.

### 4. Fases de desenvolvimento que ainda não começaram

Previstas na especificação, seção 8, e ainda não construídas:

- ~~**Importador de planilha**~~ **Construído.** Três comandos: `npm run importar -- --modelo` gera a planilha modelo, `npm run importar -- arquivo.xlsx` confere sem gravar, e `--gravar` executa. A publicação é comando à parte, `npm run publicar`, com filtro de completude. Falta a planilha real da AMI
- **Painel da agência**, em `/painel`: cadastrar e editar médicos, estabelecimentos, horários, diretoria, comunicados e anuidades sem tocar no banco
- **Área do associado** (Fase 2): login do médico, edição do próprio perfil, anuidade, carteirinha, comunicados e eventos

### 5. Itens técnicos adiados de propósito

Registrados com a razão em [`docs/decisoes-institucional-e-editorial.md`](decisoes-institucional-e-editorial.md):

- **Modo escuro** não implementado. Todos os contrastes foram medidos contra fundo claro, e refazê-los cedo demais arriscaria a acessibilidade já conquistada. A camada de tokens está semântica, então é mudança contida
- **Selo "Revisado por"** nas notícias, e os recursos de blog previstos na especificação (filtro por categoria, tempo de leitura, sumário lateral)
- **Duas fotografias** aguardam material da AMI, declaradas em `lib/imagens.ts`. Enquanto isso sai uma moldura marcando o lugar e dizendo que foto entra ali
- **O CRM da diretoria é cópia congelada**: corrigir o CRM de um diretor no cadastro de profissionais não atualiza a página da diretoria. Quem for construir o painel encontra o aviso no comentário de `lib/dados/diretoria.ts`

---

## Como retomar

```bash
npm run dev
```

```bash
npx vitest run
```

```bash
npx next build
```

Variáveis em `.env.local`, com o modelo comentado em `.env.local.exemplo`. O banco se monta do zero com `supabase/primeira-instalacao.sql`.

---

## Como carregar o cadastro real

1. `npm run importar -- --modelo` e mandar `modelo-associados.xlsx` para a AMI
2. Quando voltar preenchido: `npm run importar -- associados.xlsx`, que não grava nada
3. Mandar os erros do relatório para a AMI, corrigir, repetir o passo 2 quantas vezes for preciso
4. Relatório limpo: `npm run importar -- associados.xlsx --gravar`
5. `npm run publicar -- --com-especialidade --com-local` para conferir, e de novo com `--gravar`. O comando recusa gravar sem filtro explícito — publicar sem `--com-especialidade` nem `--com-local` exige escrever `--sem-filtro` com todas as letras
6. Só então virar `NEXT_PUBLIC_DADOS_DEMONSTRACAO` para `false`

A chave de escrita vem de `SUPABASE_CHAVE_IMPORTADOR`, explicada em
[`docs/como-remontar-o-ambiente.md`](como-remontar-o-ambiente.md).

---

## Histórico de qualidade

O diretório e o conteúdo editorial foram executados com revisão independente por tarefa e revisão do ramo inteiro ao fim. **Trinta defeitos foram encontrados e corrigidos** nesse processo, mais da metade originados em erro de planejamento ou de desenho, não de implementação.

Os mais consequentes, todos corrigidos:

- A restrição do banco aceitava "está ligado a um médico" como prova de CRM, mas a política de segurança esconde perfil não publicado do visitante anônimo. Diretor recém-importado sairia na tela **sem inscrição**, violando o Art. 4º, I. E esse é o estado normal de uma base recém-carregada
- O dado estruturado das notícias não emitia imagem, o que tira a matéria da elegibilidade a resultados ricos do Google
- O webhook devolvia erro 500 a qualquer pessoa sem credencial, por uma exceção não tratada
- O sitemap listaria seis endereços que dão 404
- O recorte de imagem pelo ponto de interesse nunca funcionou, e a proporção declarada não batia com a entregue, estourando a meta de estabilidade visual

O registro completo das 36 decisões tomadas sem consultar o cliente, cada uma com o motivo e o custo se estiver errada, está em [`docs/decisoes-institucional-e-editorial.md`](decisoes-institucional-e-editorial.md).
