# Site da Associação Médica de Imperatriz — desenho da Fase 1

Data: 19/08/2026
Situação: aprovado bloco a bloco, aguardando revisão do documento

## 1. O que este projeto é

Um diretório médico público da Associação Médica de Imperatriz (AMI), com blog, e um
painel que permite à agência responsável alimentar o site sem depender de programador.

Imperatriz-MA tem 286 mil habitantes e é polo de saúde para o sul do Maranhão e o
sudeste do Pará. A AMI tem por volta de 500 associados.

O site substitui um portal antigo cujo diagnóstico apontou: busca sem filtro, horário
existindo só como texto dentro de imagem, perfis fora do sitemap e sem dados
estruturados. Cada decisão abaixo corrige uma dessas falhas.

**O objetivo não é gerar venda nem capturar lead.** É ser o registro correto e
encontrável dos médicos da cidade. Telefone e WhatsApp são links diretos; a função do
site termina quando o paciente tem o número certo na mão.

## 2. Decisões tomadas, e por quê

| Decisão | Motivo |
|---|---|
| Supabase (Postgres) para o diretório, Sanity só para conteúdo editorial | Escolha do cliente. Ganho real: RLS dá "cada médico edita só a própria linha" para 500 pessoas sem custo por assento — o que travava a área do associado no Sanity, cujos papéis customizados são de plano pago com teto de 50 assentos |
| Sem convênio e sem preço | Decisão do cliente: o site não tem objetivo comercial. Consequência aceita: perde-se o filtro mais usado do diagnóstico e a família de URLs por convênio |
| Sem avaliações | Elimina risco com o Art. 11, XIII da Resolução CFM 2.336/2023 e remove `AggregateRating` do escopo |
| Sem ordenação por destaque, pago ou editorial | Uma entidade que representa todos os médicos da cidade não pode favorecer nenhum |
| Login por link no e-mail, sem senha | 500 pessoas que entram três vezes por ano. Senha significa senha esquecida, e senha esquecida vira ligação para a AMI |
| Importação despublicada, com publicação em lote depois | 500 perfis vazios no ar de uma vez fazem o Google classificar o site como conteúdo raso. Recuperar leva meses |
| Faceta especialidade+bairro só indexa com 3 ou mais profissionais | ~50 especialidades × 8 bairros = 400 combinações, a maioria com zero ou um. Mesma razão acima |
| Médico propõe, agência aprova | Devolve o histórico de "quem mudou o quê" que o Sanity daria de graça, e mantém a AMI no controle do que é publicado em seu nome |

## 3. Fora de escopo

Salas e consultórios · plantões e emergência · farmácias 24h · comparador de exames ·
planos de anúncio e área comercial · agendamento · avaliações e notas · preços de
consulta · filtro por convênio.

## 4. Arquitetura

| Camada | Escolha |
|---|---|
| Aplicação | Next.js 16, App Router, TypeScript |
| Estilo | Tailwind CSS v4 com os tokens da direção de arte. Sem biblioteca de componentes pronta |
| Testes | Vitest, nos pontos listados na seção 11 |
| Diretório | Supabase — Postgres, Auth, Storage, RLS |
| Conteúdo editorial | Sanity, Studio embutido em `/studio`, locale pt-BR |
| Hospedagem | Vercel |

Renderização no servidor em toda página indexável, com revalidação incremental. SSR é
requisito, não preferência: perfis invisíveis para o Google foi a maior falha do portal
anterior.

### Fronteira entre os dois sistemas

O Supabase guarda o que se filtra e se relaciona. O Sanity guarda o que se escreve.

- **Supabase:** médico, estabelecimento, local, horário, especialidade, bairro,
  acessibilidade, conta, anuidade, comunicado, evento, benefício, visualização de perfil
- **Sanity:** notícias do blog e páginas institucionais em texto (história, missão,
  estatuto, política editorial), para que a AMI corrija sem chamar desenvolvedor

A diretoria é tabela no Supabase, não texto: são pessoas com CRM que apontam para perfis
reais do diretório.

### Camada de acesso a dados

Nenhuma página consulta o Supabase diretamente. Tudo passa por `lib/dados/`, com funções
nomeadas pelo que fazem: `buscarMedicos(filtros)`, `medicoPorSlug(slug)`,
`especialidadesComContagem()`.

Duas razões: os filtros ficam num lugar só em vez de espalhados por seis telas, e uma
eventual mudança de forma do banco não reescreve as páginas.

### Pastas

```
app/
  (site)/          páginas públicas
  painel/          área autenticada
  studio/          Sanity, em /studio
  sitemap.ts       gerado dos dados reais
  robots.ts
components/        peças do sistema visual
lib/
  dados/           acesso ao Supabase — a única porta
  sanity/          cliente e consultas do conteúdo editorial
  seo/             títulos, descrições e JSON-LD por tipo de página
supabase/
  migrations/      banco versionado em SQL
  seed/            dados de demonstração
scripts/           utilitários de linha de comando
marca/             arquivos originais da logo
```

## 5. Modelo de dados

### Diretório

| Tabela | Campos principais |
|---|---|
| `profissional` | slug, nome, crm, crm_uf, foto, bio, telemedicina, associado_ami, situacao, verificado_em, publicado |
| `profissional_especialidade` | profissional, especialidade, rqe (aceita nulo), principal |
| `formacao` | profissional, instituição, curso, tipo, ano |
| `especialidade` | nome, slug, o_que_faz, quando_procurar, revisado_por, revisado_em |
| `bairro` | nome, slug, cidade |
| `estabelecimento` | slug, nome, cnpj, categoria, sobre, publicado |
| `local` | estabelecimento (nulo se consultório próprio), logradouro, número, bairro, cep, lat, lng, telefone, whatsapp, estacionamento |
| `local_acessibilidade` | local, recurso |
| `atendimento` | profissional × local |
| `horario` | atendimento, dia da semana, abre, fecha |

Horário é tabela relacional. Nunca texto livre, jamais dentro de imagem — foi isso que
inviabilizou filtro e SEO no portal anterior.

O RQE é campo por especialidade e aceita nulo: clínico geral sem RQE é caso normal e não
pode ser bloqueado (CFM 2.336/2023, Art. 4º, II). O CRM é bloqueante para publicar.

Busca por nome usa `unaccent` e `pg_trgm`, para que "jose" ache "José". Sem isso a busca
falha exatamente quando o usuário mais precisa dela.

### Vida associativa

| Tabela | Para quê |
|---|---|
| `perfil_usuario` | Liga a conta ao médico. Papel: `admin` ou `associado` |
| `revisao_perfil` | Alteração proposta, em JSON, com status e quem revisou |
| `anuidade` | ano, valor, situação, data de pagamento |
| `comunicado` | comunicados da diretoria; marca se é público ou só para associado |
| `evento` e `inscricao_evento` | eventos e cursos, com vagas |
| `beneficio` | parcerias e vantagens do sócio |
| `visualizacao_perfil` | uma linha por médico por dia, com a contagem do dia |

`visualizacao_perfil` guarda o agregado diário, não cada visita: com 500 médicos são
cerca de 180 mil linhas por ano, e evita virar banco de rastreamento — o que traria
discussão de LGPD sem entregar nada a mais.

### Arquivos

Dois espaços no Storage: `fotos`, leitura pública, para retrato e galeria; `documentos`,
privado, para declaração de quitação, carteirinha e estatuto.

## 6. Permissões

Escritas como políticas RLS no banco, não como regra de tela. Um erro de front não vaza
dado de outro médico.

| Quem | Pode |
|---|---|
| Visitante | Ler apenas registros com `publicado = true` |
| Associado | Ler o próprio cadastro, anuidade, visualizações e comunicados. Inserir revisão apenas do próprio perfil. Não escreve em `profissional` |
| Admin | Tudo |

## 7. URLs e SEO

### Endereços

```
/                                     home
/medicos                              especialidades com contagem
/medicos/{especialidade}
/medicos/{especialidade}/{bairro}
/medico/{slug}
/clinicas  ·  /clinicas/{categoria}  ·  /clinica/{slug}
/busca                                busca livre por termo — noindex
/noticias  ·  /noticias/{slug}
/associacao
/associacao/diretoria
/associacao/beneficios
/associacao/estatuto
/associacao/politica-editorial
/politica-de-privacidade  ·  /termos-de-uso  ·  /politica-de-cookies
/painel/…                             noindex, bloqueado no robots.txt
```

Minúsculo, sem acento, sem ID numérico, hífen como separador. URL publicada não muda; se
mudar, 301.

### Controle de facetas

| Onde vive | O que é |
|---|---|
| No caminho, indexável | especialidade · especialidade + bairro com 3 ou mais · categoria de clínica · perfis · notícias |
| Em querystring, `noindex, follow` | ordenação, telemedicina, acessibilidade, dia e horário, termo livre |

A página com menos de 3 profissionais existe e funciona, mas sai `noindex, follow` com
canonical para a especialidade. Conforme a AMI cadastra mais gente, ela entra no índice
sozinha — a contagem vem do banco.

Paginação: canonical próprio na página 2 em diante, nunca apontando para a 1; título com
sufixo "— página N"; links de paginação em `<a href>` reais no HTML.

### Conteúdo de página de faceta

- H1 único e específico: "Cardiologista no Centro, Imperatriz - MA"
- Parágrafo de abertura de 120 a 200 palavras gerado dos dados reais: quantos
  profissionais, em quais bairros se concentram, quantos atendem aos sábados, quantos
  fazem telemedicina, quantos locais têm acesso para cadeirante. Nunca texto-modelo
- "O que faz um(a) {especialista}" e "Quando procurar", da tabela `especialidade`, com o
  médico revisor creditado por nome e CRM e a data da revisão
- FAQ de 4 a 6 perguntas específicas daquela especialidade em Imperatriz
- Links internos para especialidades relacionadas e bairros vizinhos

### Dados estruturados

`Physician` no perfil · `MedicalClinic` ou `MedicalBusiness` no estabelecimento ·
`Organization` e `LocalBusiness` para a AMI · `ItemList` em toda listagem ·
`BreadcrumbList` em toda página interna, com breadcrumb visível correspondente ·
`FAQPage` nas facetas · `NewsArticle` nas notícias, com autor, CRM, publicação e
atualização. Nenhum `AggregateRating`.

### Ordenação

Duas opções: **Relevância** e **Nome A–Z**.

Relevância é definida de forma verificável, para que ninguém possa alegar favorecimento:
correspondência do termo buscado no nome e na especialidade, com desempate alfabético.
Sem termo digitado, relevância é ordem alfabética. Nenhum destaque pago, nenhum selo
comparativo, nenhuma promoção editorial de associado, e nenhum critério de qualidade,
completude ou antiguidade influencia a posição.

### Metadados e E-E-A-T

Title e description por template com número contado do banco:

> `/medicos/cardiologista` → "Cardiologista em Imperatriz - MA | 12 médicos | AMI"

Site de saúde é avaliado sob critério YMYL. Então: autoria com CRM em conteúdo clínico,
selo "Revisado por" com data, datas de publicação e atualização visíveis, política
editorial publicada, diretoria com nome e CRM, CNPJ e endereço no rodapé, fontes com
link, aviso de que o conteúdo é informativo e não substitui consulta. NAP idêntico em
todo o site e igual ao do Google Business Profile.

### Desempenho

Fontes auto-hospedadas por `next/font/local` — Archivo variável e Source Sans 3, no
máximo 4 arquivos. Imagens WebP/AVIF pelo `next/image`, com largura e altura declaradas.
Mapa carrega só sob clique. Meta: listagem abaixo de 500 KB, LCP abaixo de 2,5s em 4G,
CLS abaixo de 0,1, INP abaixo de 200ms.

## 8. Painel

Um endereço, `/painel`, dois papéis. Entrada por link no e-mail, sem senha.

### Agência e AMI (Fase 1)

Médicos · Estabelecimentos · Locais e horários · Especialidades · Bairros · Diretoria ·
Comunicados, eventos e benefícios · Anuidades · Revisões pendentes · Importar planilha.

Sobre anuidade: na Fase 1 a agência apenas **registra** a situação de cada associado por
ano. O que o médico vê disso — declaração de quitação em PDF e carteira de associado —
depende de login e entra na Fase 2.

O formulário do médico vem dividido em seções que salvam separadamente, com
pré-visualização ao lado e medidor de completude listando o que falta.

### Importador

Tela dentro do painel, em três passos:

1. **Modelo pronto** para download, com as colunas exatas
2. **Conferência antes de gravar**: quantas linhas criam, quantas atualizam, quantas têm
   erro e qual erro em qual linha. O botão de confirmar só aparece depois
3. **Chave natural CRM + UF**: rodar o mesmo arquivo duas vezes atualiza, não duplica —
   a AMI vai corrigir e subir de novo várias vezes até acertar

O importador nunca inventa dado. Especialidade escrita diferente é resolvida por mapa de
sinônimos; o que não bate vai para uma fila de pendências. Ele não cria especialidade
sozinho, porque especialidade digitada errado vira URL indexada errada.

Fotos entram em lote separado, com arquivos nomeados pelo CRM.

Tudo que entra pela planilha chega despublicado. A tela seguinte permite publicar em
lote, com filtro para publicar só quem já tem especialidade e ao menos um local.

### Correção sem login

No rodapé de todo perfil, "Atualizar meus dados": formulário curto, sem senha, que cai na
mesma fila de revisões. Serve para o período antes da Fase 2 e para o médico que nunca
vai entrar no painel.

### Associado (Fase 2)

Visualizações do perfil no mês · Meu perfil, com edição que vira proposta de revisão ·
Anuidade e declaração de quitação em PDF · Carteira de associado · Comunicados ·
Eventos com inscrição · Benefícios.

## 9. Sistema visual

Os tokens da direção de arte viram variáveis CSS. Nenhum componente inventa cor fora
dessa lista.

Archivo variável nos títulos, comprimida em 80–87,5%, peso 700. Source Sans 3 no corpo,
400 e 600. Corpo em 17px, entrelinha 1,65, nada abaixo de 15px em texto de leitura — o
público inclui idosos. Números tabulares em telefone, CRM e contagem.

Três travas no código:

- **Menta nunca é texto sobre fundo claro.** Contraste 1,56:1. Só existe sobre verde
  700/800/900, ou como preenchimento decorativo. Ação sobre fundo claro é verde-600
- **Fio antes de sombra.** Borda de 1px em `--line` é o separador padrão. Nenhum cartão
  tem sombra em repouso, exceto o cartão de busca da home
- **Chevron no máximo duas vezes por página**, sempre estrutural: recorte angular no
  rodapé da faixa verde, e marca d'água em menta a 5% cortada pela borda

### A marca

A AMI não tem arquivo vetorial da marca: o que existe é um JPEG de 640 px com fundo
branco e halo de exportação. Ele foi limpo e vetorizado a partir do próprio bitmap —
o contorno foi traçado, não redesenhado, então o desenho e suas assimetrias
permanecem. Fidelidade medida por área de tinta: −0,4% no símbolo, −2,3% no letreiro.

Arquivos em `marca/`: `ami-marca.svg` (22 KB comprimido) e `ami-simbolo.svg` (8 KB),
mais PNGs de 2400 e 1200 px para onde SVG não é aceito.

**Consequência de layout, decidida:** a marca é verde-escura e desaparece sobre as
faixas verde-800 e verde-900. Por isso o **cabeçalho é claro**, com a marca em verde
sobre branco. O verde-escuro continua estruturando o site nas demais faixas — herói da
home, bloco institucional e rodapé. Isso desvia da direção de arte original, que previa
cabeçalho verde-800, e o desvio é deliberado: a alternativa seria alterar a cor da
marca, o que é decisão da AMI, não do projeto.

No rodapé, que é verde-900, a marca não pode aparecer na cor original. Ali entra apenas
o nome da associação em texto, na Archivo condensada, com o símbolo omitido.

| Onde | Versão |
|---|---|
| Cabeçalho | `ami-marca.svg` em verde sobre branco |
| Rodapé | Só o nome em texto — sem símbolo, por contraste |
| Marca d'água da home | `ami-simbolo.svg` em menta a 5% sobre a faixa verde |
| Foto ausente | Iniciais do profissional em bloco verde |
| Favicon e ícone | `ami-simbolo.svg` |
| Prévia de link | 1200×630, marca em verde sobre branco |
| `Organization` no JSON-LD | `ami-marca-2400.png`, URL absoluta |

Um redesenho da marca está previsto pelo cliente como projeto separado, a ser proposto
à diretoria da AMI. O site não depende dele: trocar os dois arquivos SVG basta.

### Home — sete estruturas diferentes

1. Herói assimétrico em faixa verde-800, texto em 7 das 12 colunas, cartão de busca
   invadindo a borda inferior
2. Chips das 8 especialidades com mais médicos
3. Acesso rápido em fios: por especialidade · por bairro · clínicas e laboratórios ·
   como se associar
4. Lista densa em duas colunas com todas as especialidades e a contagem de cada uma
5. Faixa institucional verde-900: missão em uma frase e três números reais
6. "Você é médico?" assimétrico, com como se associar em lista numerada
7. Últimas notícias em três itens de lista editorial

Todo número vem de contagem do banco. O que não vier dos dados aparece marcado
`[PROVISÓRIO]`.

### Resultados

Filtros à esquerda, gaveta no mobile com contador de filtros ativos. Resultado em linha,
não em cartão, porque a tela existe para comparar:

foto 1:1 ou iniciais em bloco verde · nome · MÉDICO — CRM/MA 00000 · especialidade com
RQE quando houver · selo Associado AMI · bairro · telemedicina · acessibilidade do local ·
"Aberto agora" calculado da tabela de horários · botões "Ver perfil" e "Ligar"/"WhatsApp".

H1 dinâmico conforme os filtros indexáveis, parágrafo de abertura gerado dos dados,
estado vazio desenhado sugerindo remover o filtro mais restritivo. Nenhuma faixa de
anúncio na lista.

### Demais telas

**Perfil de médico** — cabeçalho com foto, nome, CRM e RQE em destaque; locais de
atendimento com endereço, contato e mapa sob clique; horários por dia com hoje
destacado; formação e títulos; sobre; acessibilidade; médicos relacionados linkando para
a especialidade e o bairro.

**Perfil de clínica** — o mesmo, mais galeria e corpo clínico, cada médico linkando ao
próprio perfil.

**A Associação** — história, missão, diretoria com nome e CRM, estatuto, benefícios, como
se associar, política editorial, contato.

**Blog** — lista com filtro por categoria; artigo com autor e CRM, selo "Revisado por"
com data, publicação e atualização, tempo de leitura, sumário lateral, fontes com link.

### Dados de demonstração

Enquanto a planilha não chega: 24 médicos, 10 estabelecimentos e 6 notícias fictícios mas
verossímeis, nos bairros reais de Imperatriz — Centro, Nova Imperatriz, Bacuri, Juçara,
Maranhão Novo, Parque do Buriti, Vila Lobão, Santa Rita. Variando especialidade, horário,
acessibilidade e telemedicina, para que os filtros tenham o que filtrar. O rodapé declara
que os dados são fictícios enquanto isso for verdade.

## 10. Conformidade

**Resolução CFM 2.336/2023**

- Nome e CRM acompanhados da palavra MÉDICO, visíveis em todo perfil e em toda linha de
  resultado (Art. 4º, I). CRM é campo bloqueante para publicar
- RQE exibido junto da especialidade apenas quando houver especialidade registrada
  (Art. 4º, II). Clínico geral sem RQE publica normalmente
- Nenhum ranking, prêmio, "top 10" ou "melhor médico" (Art. 11, XIII)

**LGPD**

- Nenhum formulário coleta sintoma, condição, diagnóstico ou motivo de consulta — dado de
  saúde é sensível (Art. 11)
- Banner de cookies com três categorias, recusa tão fácil quanto o aceite
- Toda coleta informa a finalidade
- Política de Privacidade, Termos de Uso e Política de Cookies publicados antes do
  lançamento
- Rodapé com razão social, CNPJ e endereço da AMI

## 11. Verificação

A auto-auditoria anti-IA é percorrida grupo a grupo antes de cada entrega, com relatório
escrito. Além dela:

| O que | Como se verifica |
|---|---|
| Contraste | Tabela com todo par de cor usado, razão medida, aprovado ou reprovado |
| Teclado | Site inteiro em Tab, Enter e Esc, foco sempre visível |
| Estrutura | Um H1 por tela, sem salto de nível, landmarks reais |
| Responsivo | Nada quebra entre 320px e 1920px; projetado em 390px primeiro |
| Alvos | 44 × 44px no mobile; zoom nunca bloqueado |
| Movimento | `prefers-reduced-motion` respeitado; nenhuma animação de entrada em rolagem |

### Testes automatizados

Vitest, só onde o erro é silencioso e caro:

- o importador — leitura da planilha, chave por CRM, duplicata, mapa de sinônimos
- os filtros da busca e a regra de "aberto agora"
- os moldes de title, description e JSON-LD
- a regra de corte que decide se uma faceta é indexável

Sem teste de interface: o custo de manter não se paga num site deste porte.

## 12. Fases

**Fase 1** — banco e migrações · camada de acesso · sistema visual · telas públicas ·
SEO completo · Sanity e conteúdo editorial · painel da agência · importador.
Entregável: site no ar, indexável, alimentável pela agência.

**Fase 2** — contas dos 500 associados, área do associado, visualizações de perfil,
anuidade, carteirinha, comunicados, eventos.

## 13. Pendências e riscos

| Item | Situação |
|---|---|
| Arquivos da logo | Resolvido. Vetorizados a partir do JPEG recebido. Para impressão em tamanho grande, o vetor original da AMI ainda seria melhor — o traçado é fiel, inclusive às bordas onduladas do desenho |
| Planilha dos ~500 associados | Não disponível ainda. Fase 1 nasce com dados de demonstração e o importador pronto |
| Dados institucionais reais | História, missão, diretoria, estatuto, CNPJ e endereço entram marcados `[PROVISÓRIO]` |
| Projeto Supabase e Sanity | A criar, com as chaves em `.env.local` |
| Mapa de-para do portal antigo | Necessário antes da migração, para os 301. Sem ele, a autoridade acumulada se perde |
| Sem filtro de convênio | Decisão do cliente. Perde-se o filtro mais usado do diagnóstico e uma família de URLs de busca orgânica |
| Parecer jurídico | O documento original recomenda revisão por advogado de direito médico antes do lançamento |
