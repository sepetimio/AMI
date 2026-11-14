# Rumo à publicação

**Data:** 14/11/2026. **Ramo:** `rumo-a-publicacao`, criado a partir da `main` (`3672c9f`).

**Aprovação:** o cliente aprovou o desenho no chat, em 14/11/2026 ("sim"). Ele pediu "todos os pontos que não dependem de ninguém".

Valem todas as regras de sempre:
- sem ícone decorativo (`docs/superpowers/specs/2026-10-05-sem-icones-decorativos-design.md`);
- nada de conteúdo da AMI inventado;
- nenhuma chave privilegiada no aplicativo;
- nenhuma remoção concedida no banco fora das três tabelas de ligação de 0006.

## 1. A foto do médico pelo painel

1. **No painel:** na página de edição de cada médico (`/painel/medico/[id]`) entra o bloco "Foto". Ele mostra:
   - a foto atual (ou as iniciais, como no site), o botão **Escolher foto** e, quando há foto, o botão **Remover foto**;
   - uma linha de ajuda: "JPG, PNG ou WebP. O painel recorta no formato retrato do site, pelo centro."
2. **No navegador, antes de enviar:**
   - o arquivo escolhido é lido, recortado em 4:5 pelo centro e reduzido para 800×1000 (ou menos, se a foto for menor; nunca amplia);
   - sai em WebP com qualidade 0,85;
   - se o navegador não gerar WebP, sai em JPEG 0,85.
   - Arquivo que o navegador não consegue abrir (por exemplo HEIC no computador): "Não consegui abrir esta foto. Use JPG, PNG ou WebP."
   - Foto menor que 400×500: aceita, com o aviso "A foto é pequena e pode sair borrada."
3. **No servidor (ação):**
   - `exigirAdmin()` primeiro;
   - o arquivo precisa ser WebP ou JPEG pelos primeiros bytes (não pelo nome nem pelo tipo declarado), ter no máximo 900 KB e não estar vazio;
   - ele vai para o bucket `fotos-medicos` com o caminho `{id do médico}/{data e hora}.{webp|jpg}`, sempre um nome novo, sem sobrescrever;
   - a URL pública dele é gravada em `profissional.foto`, com a mesma conferência de linha alterada de `alternarPublicacao`;
   - as mesmas revalidações de `alternarPublicacao`.
4. **Remover foto:** grava `profissional.foto = null`. O arquivo antigo fica no armazenamento: não existe política de remoção, de propósito, como no resto do banco. Trocar de foto também deixa o arquivo antigo lá. Uma foto pesa cerca de 150 KB, e o plano gratuito tem 1 GB.
5. **A migração `0007_fotos.sql`:**
   - cria o bucket `fotos-medicos`, público para leitura, com limite de 1 MB e só `image/webp` e `image/jpeg`;
   - cria uma única política, de inserção em `storage.objects`, restrita ao bucket e a `(select public.eh_admin())`;
   - nenhuma política de select, update ou delete;
   - sem `for all`, sem grant, sem desligar RLS;
   - pode rodar duas vezes sem erro (`on conflict do nothing` e `drop policy if exists` só da própria política).
6. **Enquanto a 0007 não roda:** o bloco aparece igual. Ao enviar, o erro de bucket inexistente vira "O armazenamento de fotos ainda não foi ligado no Supabase. Veja docs/como-ligar-as-fotos.md."
7. **Erros em português, sempre.** Nenhuma mensagem crua do Supabase chega à tela sem uma frase nossa antes.

## 2. O período da gestão da diretoria

1. `listarDiretoria` passa a ler `mandato_inicio` e `mandato_fim`.
2. **Uma função pura** escolhe o período: na ordem da diretoria (a de `ordenarDiretoria`, presidência primeiro), o primeiro diretor com as duas datas.
   - Ela devolve "2025–2027" (anos, com traço meio) ou `null`.
   - Datas com ano igual devolvem um ano só: "2026".
   - Data inválida conta como ausente.
3. **A faixa:**
   - com período, a pílula "Gestão 2025–2027" sai com as duas chaves, com fio contínuo e sem `data-a-entrar`;
   - sem período, fica como hoje: moldura "a entrar" na demonstração, e nada fora dela.

## 3. Acertos pequenos

1. **Painel:** "sem biografia" passa a valer também para a bio com a marca `[PROVISÓRIO]`. Reaproveite `bioNaTela(bio, false)` de `lib/encontre.ts`.
2. **Link do texto:** `ehLinkInterno` recusa `//` e também `/\` (o navegador lê `/\site.com` como outro site). Um `\` em qualquer posição antes do primeiro caractere de caminho conta como recusa.
3. **Studio:** os dois campos `href` (`noticia.ts`, `paginaInstitucional.ts`) ganham uma regra a mais. O endereço precisa começar com `/` (mas não com `//` nem com `/\`), `#`, `http://`, `https://`, `mailto:` ou `tel:`. A mensagem é: "O endereço precisa começar com /, #, https://, mailto: ou tel:." A regra é uma função pura em `lib/sanity/link.ts`, a mesma fonte de `hrefSeguro`.

## 4. Pronto para publicar

1. **O endereço do site em um lugar só:** `lib/site.ts` exporta `URL_DO_SITE`. As oito cópias de `process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"` passam a usá-lo. A ordem é:
   1. `NEXT_PUBLIC_SITE_URL`, sem espaços e sem barra no fim;
   2. senão, `https://` + `VERCEL_PROJECT_PRODUCTION_URL` (a Vercel preenche sozinha);
   3. senão, `http://localhost:3000`.
2. **Os guias:**
   - `docs/como-publicar-na-vercel.md`: o passo a passo numerado, com o nome de cada botão. Ele cobre:
     - criar a conta com o GitHub;
     - importar o repositório;
     - as variáveis: quais vão, quais nunca vão (`SUPABASE_CHAVE_IMPORTADOR`, `service_role`) e o valor de `NEXT_PUBLIC_DADOS_DEMONSTRACAO`;
     - o primeiro deploy;
     - ligar o domínio;
     - o CORS do Sanity para o Studio em `/studio`;
     - o webhook do Sanity apontando para `/api/revalidar`;
     - conferir que o painel entra;
     - como a trava de indexação cai.
   - `docs/como-ligar-as-fotos.md`: rodar a 0007 no SQL Editor do Supabase, com os passos e a conferência.
   - Os dois guias não levam nenhum valor real de chave.
3. **`.env.local.exemplo`:** a linha do endereço explica a ordem de 1.
4. **`docs/estado-do-projeto.md`:** atualizado com o que esta rodada fez e o que segue pendente.

## 5. Fora do código

A lista do que a AMI precisa entregar, por prioridade e em linguagem simples, sai como documento compartilhável, a partir das pendências de `docs/estado-do-projeto.md`.

## 6. Como provar

- Os testes, a checagem de tipos, o lint e o build, verdes.
- Toda asserção nova é provada por mutação, desfeita reescrevendo o arquivo.
- A foto é provada assim:
  - testes das funções puras: geometria do recorte, conferência dos bytes, caminho do arquivo e tradução dos erros;
  - leitura da migração;
  - renderização do bloco.
- O envio real só pode ser provado depois que o cliente rodar a 0007. Isso fica registrado como verificação pendente, com o roteiro no guia.
