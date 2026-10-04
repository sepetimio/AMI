# Notícias e Contato (fatia B, grupos 4 e 5)

**Data:** 03/10/2026. **Ramo:** `paginas-encontre`. Nada vai para a `main` antes de todos os grupos ficarem prontos.

**Aprovação:** o cliente está fora e autorizou seguir pelas recomendações. O desenho foi aprovado pelo controlador, conferido contra as diretrizes já aprovadas. Toda decisão marcada [sem o cliente] entra em `docs/decisoes-sem-o-cliente.md`.

**Desenho aprovado:** `docs/desenho-aprovado/noticias-contato/` (`noticias.html`, `noticia.html`, `contato.html` e as fotos em jpg).
- `noticias.html` aceita `?poucas=1|2|3`, `?a-entrar` e `?sem-conteudo`. As outras duas aceitam `?sem-conteudo`.
- As notícias do desenho são EXEMPLO.
- O relatório do desenho, com decisões de detalhe, medidas e molduras, está em `.superpowers/brainstorm/fatia-b-noticias-contato/relatorio.md`.
- O desenho manda em todo valor visual.

**Base:** as specs anteriores continuam valendo. O modelo de página de texto vem da spec de A Associação (seção 3), que será construído antes deste grupo.

## 1. `/noticias`: a lista
1. **Faixa verde curta**, sem `Cabeceira`:
   - rótulo "NOTÍCIAS";
   - h1 "Notícias da AMI";
   - linha de apoio "Comunicados, eventos e notas da associação. Cada texto é assinado por um médico, com o número de inscrição no CRM." [sem o cliente];
   - ladrilho de vidro com o ícone de jornal, que some no celular.
2. **A notícia mais recente em destaque**, na largura dos painéis, em 2:1, com o título sobre a foto e o degradê do site construído (com contraste garantido).
3. **As outras notícias** em cartões brancos, 3 por linha, cada um com:
   - foto 16:10;
   - data;
   - título;
   - resumo de 2 linhas.

   No celular, a lista com miniatura de 88px, como na home.
4. **Poucas notícias:** vale a regra da home (`arranjoDasNoticias`). Com 2, o cartão de baixo fica deitado; com 3, duas colunas.
5. **Última fileira incompleta** (5, 6, 8 ou 9 notícias): fica alinhada à esquerda, como numa grade comum [sem o cliente].
6. **Notícia sem capa:** o verde da marca com o símbolo.
7. **Limite:** no máximo 20 notícias, como hoje (`listarNoticias(20)`). **Sem paginação** por enquanto [sem o cliente]. Quando passar de 20, entra "Mais antigas" numa fatia própria.
8. **Sem notícia:**
   - na demonstração, os cartões "Notícia a entrar" da home;
   - fora dela, a faixa e a frase "Nenhuma notícia publicada ainda." com o botão "Voltar para o início".

## 2. `/noticias/[slug]`: a notícia aberta
1. **Faixa verde**, sem `Cabeceira` e sem breadcrumb visível, com:
   - "← NOTÍCIAS";
   - o título (h1 de 34 a 50px, sem ladrilho à direita);
   - o resumo;
   - abaixo de um fio, a assinatura: "Por {autor}" (link para o perfil quando o autor tiver perfil publicado), "MÉDICO · CRM/UF n" e a data.
2. **Capa** em 16:9, na largura dos painéis, entre a faixa verde e a faixa branca. O recorte segue o ponto de interesse (hotspot) marcado no Studio [sem o cliente: hoje a capa sai na proporção original].
3. **Corpo** numa faixa branca, na coluna de leitura de 680px do modelo de página de texto:
   - títulos;
   - listas: a numerada com o número num círculo cinza;
   - citação com 20px e fio verde à esquerda;
   - imagem no meio do texto com legenda e sem moldura de borda;
   - links.

   O índice "Nesta página" segue a regra do modelo: aparece com dois h2 ou mais.
4. **No fim do texto:** a linha "Por {autor}" e o botão "Ver perfil", quando houver perfil.
5. **"Outras notícias":** 3 cartões, depois da faixa branca. Se não houver outra notícia, a seção não aparece.
6. **JSON-LD `NewsArticle`:** fica como está. Sai o `BreadcrumbList`, se existir, porque não há trilha na tela.
7. **Sem notícia publicada,** a rota continua dando 404.

## 3. `/contato`
1. **Faixa verde curta:**
   - rótulo "CONTATO";
   - h1 "Fale com a AMI";
   - "Pelo telefone, pelo Instagram ou na sede, no Centro de Imperatriz." [sem o cliente];
   - ladrilho de vidro com o ícone de conversa.
2. **Três cartões de canal**, com ladrilho, rótulo, dado, frase e botão:
   - telefone da sede: "Ligar";
   - celular: "Ligar";
   - Instagram: "Abrir o Instagram", na mesma aba, pela regra do site para links externos.

   O e-mail e o WhatsApp ficam de fora enquanto não existirem ou não forem confirmados em `lib/ami.ts` [sem o cliente]. No tablet, os cartões viram linhas.
3. **Sede**, numa faixa branca:
   - "SEDE / Onde fica a AMI";
   - o quadro do endereço, com CNPJ e "Como chegar" em nova aba. Sem mapa embutido: nada de terceiros na página;
   - à direita, a foto `ESPACOS.sede` (moldura "Fotografia a entrar" na demonstração);
   - o horário de atendimento, que não existe hoje: aparece como moldura só na demonstração.
4. **Fecho:** "Médico interessado em se associar?", a frase que já está na página hoje, com o botão para `/associacao/seja-associado`.
5. **Sem formulário:** não existe hoje, e criar um exige um serviço novo.

## 4. Textos legais
Privacidade, cookies e termos usam o modelo de página de texto da spec de A Associação (seção 3), com "← INÍCIO" e os ícones escudo, biscoito e documento. Isso é construído pelo plano de A Associação. Aqui só se confere o resultado.

## 5. Fora do escopo
- Paginação da lista.
- E-mail, WhatsApp, horário e formulário de contato.
- Escrever notícias.
- Os campos extras do JSON-LD.

## 6. Como provar
O mesmo dos grupos anteriores:
- Ruling 11;
- a auditoria nas 8 larguras com as duas chaves: alinhamento x=172, irmãos alinhados, ritmo, abre no topo, nenhuma moldura fora da demonstração;
- fotos comparadas com o desenho;
- contraste de pelo menos 4,5:1;
- o arranjo com 1, 2, 3, 4 e 7 notícias testado por função pura e por renderização.
