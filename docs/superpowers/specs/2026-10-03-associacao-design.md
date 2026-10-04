# A Associação: página institucional, diretoria e páginas de texto (fatia B, grupo 3)

**Data:** 03/10/2026. **Ramo:** `paginas-encontre`. Nada vai para a `main` antes de todos os grupos ficarem prontos.

**Aprovação:** o cliente está fora e autorizou seguir pelas recomendações. O desenho foi aprovado pelo controlador, comparado com as diretrizes já aprovadas (home, "Encontre um médico" e "Especialidades"). Tudo o que está marcado [sem o cliente] entra em `docs/decisoes-sem-o-cliente.md`, para ele revisar na volta.

**Desenho aprovado:** `docs/desenho-aprovado/associacao/`, com `associacao.html`, `diretoria.html` e `seja-associado.html`, mais as fotos em jpg.
- Com `?sem-conteudo`, cada página aparece como fica fora do modo demonstração.
- Com `?sem-perfil`, a diretoria mostra um diretor sem perfil.
- O relatório do desenho, que é a fonte das decisões de detalhe, das medidas e da tabela de molduras, está em `.superpowers/brainstorm/fatia-b-associacao/relatorio.md`.
- O desenho é a autoridade de todo valor visual.

**Base:** as specs da reforma visual, de "Encontre um médico" e de "Especialidades" continuam valendo.

## 1. `/associacao`: a página institucional

Os blocos, nesta ordem (todos [sem o cliente]):

1. **Faixa verde.**
   - Rótulo "A ASSOCIAÇÃO".
   - h1 "Desde 1975 com os médicos de Imperatriz". O ano vem de `AMI.fundadaEm`.
   - O parágrafo verdadeiro que já está no site.
   - À direita, os três números da home: anos (`anosDeAmi`), médicos e especialidades, com divisória. No celular, eles ficam numa fileira de três, sem ícone.
   - Sem `Cabeceira` e sem breadcrumb visível.
2. **Faixa branca: sede e apresentação** (o `.duplo`).
   - Na coluna de texto, de cima para baixo:
     - "QUEM SOMOS";
     - h2 "A Associação Médica de Imperatriz";
     - a apresentação oficial (moldura "Texto da AMI a entrar.");
     - o quadro do endereço com "Sede da AMI" e o endereço de `lib/ami.ts`;
     - os botões "Como chegar" (Google Maps, por `linkDoMapa`) e o telefone fixo da sede.
   - À direita, a foto `ESPACOS.sede` (moldura "Fotografia a entrar: sede da AMI").
   - Sem a foto real e fora da demonstração, o bloco vira duas colunas de texto, como mostra a foto `sem-conteudo`.
3. **Na mesma faixa branca, depois de um fio:** "PRINCÍPIOS / Missão, visão e valores".
   - São os três cartões da home, por `quemEhAmi`.
   - Sem texto e fora da demonstração, o bloco sai inteiro.
4. **Diretoria em destaque**, aberta sobre o fundo.
   - Rótulo "DIRETORIA", h2 "Quem responde pela AMI" e a frase de apoio.
   - O botão-linha **"Ver a diretoria"** [sem o cliente: o desenho dizia "completa", mas hoje a diretoria tem os mesmos quatro nomes].
   - Os quatro cartões de diretor (seção 2).
5. **"Saiba mais".** Atalhos no desenho do cartão de especialidade: ladrilho, título, frase e seta.
   - Os candidatos são Seja associado, Estatuto e Política editorial.
   - Cada atalho só aparece se a página existir: documento no Sanity ou rascunho em código.
   - Na demonstração, a página que ainda não existe aparece com a etiqueta "texto a entrar".
   - Se sobrar só "Seja associado", que repete o fecho, o bloco sai inteiro.
   - "Benefícios" não entra.
6. **Fecho** numa faixa branca curta, em duas colunas: o texto aprovado da faixa "Seja associado" da home e o botão "Quero me associar". Não usa o componente `SejaAssociado` inteiro, porque ele repetiria Missão, visão e valores.
7. **Metadados:** o título e a descrição de hoje. O JSON-LD `Organization`, se já existir, fica.

## 2. `/associacao/diretoria`

1. **Faixa verde curta.**
   - "← A ASSOCIAÇÃO", h1 "Diretoria da AMI" e a frase de apoio.
   - A pílula do mandato:
     - sem o dado, só na demonstração, como moldura "Gestão (período a entrar)";
     - o dado não existe hoje, e o plano NÃO cria campo para ele [sem o cliente].
   - À direita, o ladrilho de vidro com o ícone de pessoas, que some no celular.
2. **Cartões:** os mesmos da busca (`CartaoMedico`/`FotoDoMedico`, com o retrato em pé ou as iniciais), com estes acréscimos:
   - o cargo, em rótulo verde pequeno acima do nome;
   - o botão "Ver perfil" no lugar de "Ligar";
   - o cartão inteiro como link, quando o diretor tem perfil publicado.
3. **Sem perfil:** sem link e sem botão, mas o espaço do botão fica.
4. **Celular:** cartão deitado, como na busca.
5. **A presidência** vai em primeiro, sem cartão maior.
6. **A fonte dos dados é a mesma de hoje.** Os nomes, cargos e CRMs da diretoria continuam vindo de onde vêm hoje; o plano confere a fonte.

## 3. O modelo de página de texto

Usado por `/associacao/seja-associado`, `/associacao/estatuto`, `/associacao/politica-editorial` e, no grupo dos textos legais, por privacidade, cookies e termos.

1. **Faixa verde curta.**
   - O link de volta: "← A ASSOCIAÇÃO" nas páginas da associação, e "← INÍCIO" nas páginas legais.
   - O h1 e o resumo.
   - O ladrilho de vidro com o ícone da página, que some no celular. Os ícones [sem o cliente]:
     - aperto de mão: Seja associado;
     - pergaminho: Estatuto;
     - caneta ou jornal: Política editorial;
     - escudo: privacidade;
     - biscoito: cookies;
     - documento: termos.
2. **Corpo numa faixa branca de ponta a ponta,** em coluna de leitura de 680px que começa em x=172, com letra de 17,5px e entrelinha de 1,7, como `.leitura`. Inclui:
   - "Atualizado em …", quando houver data;
   - o quadro de destaque cinza neutro do aviso de página provisória, que hoje é âmbar no site e passa a cinza, sem tom quente;
   - h2, h3, listas e links.
3. **Índice "Nesta página":**
   - no computador, preso à direita ao rolar (sticky), marcando a seção que está sendo lida;
   - no celular, recolhido num `<details>` no topo;
   - montado a partir dos h2 do texto;
   - com menos de dois h2, o índice não aparece.
4. **Específico de Seja associado:** o quadro "Fale com a AMI" com:
   - "Ligar" para o telefone fixo;
   - o celular;
   - "Como chegar".

   **Sem WhatsApp** enquanto `lib/ami.ts` não confirmar o número [sem o cliente].
5. **O texto vem de onde vem hoje:** o documento do Sanity ou o rascunho em código.
   - O rascunho de Seja associado ganha a lista "Dados da entidade" no lugar da frase longa, com os mesmos dados [sem o cliente].
   - O "[PROVISÓRIO]" vira moldura "texto da AMI a entrar", que só aparece na demonstração.
   - Nenhum "[PROVISÓRIO]" pode aparecer no site.

## 4. Também entra
- **O ordinal 01/02/03 dos cartões de Missão, visão e valores:** passa ao token `ink-400` (5,38:1) também na home. Hoje mede 2,61:1, e a mudança é pela acessibilidade [sem o cliente].
- **`Cabeceira` e `Breadcrumb`:** depois deste grupo, se nenhuma página usar mais, saem do código.

## 5. Fora do escopo
- Escrever a apresentação, o estatuto, a política editorial, a missão, a visão, os valores e a anuidade: tudo isso é conteúdo da AMI.
- O campo de mandato da diretoria.
- O WhatsApp.

## 6. Como provar
O mesmo dos grupos anteriores:
- Ruling 11;
- auditoria nas 8 larguras com as duas chaves: alinhamento x=172, irmãos alinhados, ritmo, abrir no topo, nenhuma moldura fora da demonstração;
- fotos comparadas com o desenho;
- contraste de pelo menos 4,5:1;
- índice "Nesta página" testado por função pura (gerado dos h2) e, no navegador, a marcação da seção ao rolar.
