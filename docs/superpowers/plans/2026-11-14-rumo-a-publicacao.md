# Rumo à publicação — plano

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** a foto do médico pelo painel, o período da gestão na diretoria, três acertos pequenos e o site pronto para a Vercel.

**Architecture:**
- As decisões ficam em funções puras em `lib/`, testadas por unidade.
- Os componentes são testados por renderização (`renderToString`).
- Só CSS e ligações são travados por leitura do código.
- A foto é recortada no navegador, conferida e gravada por uma ação de servidor com a sessão do admin, e fica num bucket público do Supabase Storage cuja escrita é só `eh_admin()`.

**Tech Stack:** Next.js 16.3.1 App Router (leia `node_modules/next/dist/docs/` antes de usar API do Next), React 19, Tailwind 4, CSS Modules, Supabase (`@supabase/ssr`, `@supabase/supabase-js`), Sanity 6, Vitest.

**Spec:** `docs/superpowers/specs/2026-11-14-rumo-a-publicacao-design.md`

## Global Constraints

- **Ícones:** nenhum ícone decorativo. Os mapas `components/base/Icone.tsx` e `components/base/IconeServidor.tsx` não ganham nomes, e `testes/icones.test.ts` continua verde.
- **Conteúdo:** nada de conteúdo da AMI inventado: nenhum nome, data, número ou texto institucional.
- **Chaves:** nenhuma chave privilegiada no aplicativo. O painel usa só `clienteDoPainel()` (a chave anônima mais a sessão). Nunca `service_role`. Nunca `SUPABASE_CHAVE_IMPORTADOR` fora de `scripts/`.
- **Remoção no banco:** nenhuma remoção concedida fora de `profissional_especialidade`, `atendimento` e `local_acessibilidade`. Nada de `for all`, `grant`, `truncate`, `drop table` ou desligar RLS em migração.
- **Testes:**
  - componente se testa por renderização; lógica, por função pura;
  - leitura de código como texto só para CSS e ligações;
  - toda asserção nova é provada por mutação, desfeita reescrevendo o arquivo, nunca com `git checkout` ou `git restore`.
- **Texto:** comentários e textos de tela em português do Brasil, frases curtas e simples.
- **Commits:**
  - `git add` arquivo por arquivo, nunca `git add -A` nem `git add .`;
  - mensagens sem acento, terminando com a linha `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`;
  - os arquivos em `lib/dados/*.ts` têm BOM: preserve.
- **Portas:**
  - a porta 3000 é do cliente: nunca pare, nunca use;
  - servidor de conferência na 3300, parado pelo PID;
  - `npm run build` de verdade pode rodar.
- **Ambiente:** `.env.local` nunca entra em commit, e nenhum valor real de chave vai para arquivo versionado.
- **Ferramentas:** não há `python`; scripts auxiliares em `node`.

---

### Task 1: Acertos pequenos (bio de teste no painel, link `/\`, links no Studio)

**Files:**
- Modify: `app/painel/medico/[id]/page.tsx:41-45` (o `temBio`)
- Modify: `lib/sanity/link.ts`
- Modify: `sanity/schemas/noticia.ts:124-128`, `sanity/schemas/paginaInstitucional.ts:139-143`
- Test: `testes/painel-medico.test.ts` ou `testes/painel-edicao.test.ts` (o que já testa a página de edição), e o teste que já cobre `lib/sanity/link.ts` (procure por `hrefSeguro` em `testes/`)

**Interfaces:**
- Produz `enderecoDeLinkAceito(href: unknown): true | string` em `lib/sanity/link.ts`. Devolve `true` quando aceita, ou a mensagem de erro.

- [ ] **Passo 1: a bio de teste.**
  1. Crie em `lib/painel/medico.ts` a função pura `temBioDeVerdade(bio: string | null | undefined): boolean`, com o valor `bioNaTela(bio, false) !== null` (importe `bioNaTela` de `@/lib/encontre`).
  2. Na página, `temBio: temBioDeVerdade(medico.bio)`.
  3. Testes da função:
     - `null` → false;
     - `""` → false;
     - `"   "` → false;
     - `"[PROVISÓRIO] Biografia de Fulano"` → false;
     - `"Clínico em Imperatriz."` → true.
  4. A ligação na página é travada por leitura do código: a página chama `temBioDeVerdade(medico.bio)` e não tem mais `Boolean(medico.bio)`.
- [ ] **Passo 2: `ehLinkInterno`.**
  1. Recusa `"//x"`, `"/\\x"` e `"/\\\\x"` (barra seguida de barra invertida).
  2. Aceita `"/associacao/diretoria"` e `"/"`.
  3. Recusa `"#a"`, `"mailto:a@b"` e `"https://x"`.
  4. Atualize o comentário da função.
  5. Teste os casos acima.
- [ ] **Passo 3: o Studio.**
  1. Crie `enderecoDeLinkAceito(href)` em `lib/sanity/link.ts`:
     - `undefined`, `null` ou não string → `true` (o `required()` cuida do vazio);
     - com espaços nas pontas aparados, aceita quando casa `/^(https?:|mailto:|tel:|#)/i`, ou quando começa com `/` e o segundo caractere não é `/` nem `\`;
     - fora disso, devolve a mensagem exata: `"O endereço precisa começar com /, #, https://, mailto: ou tel:."`
  2. Nos dois schemas, a validação vira `r.required().uri({ scheme: ["http", "https", "tel", "mailto"], allowRelative: true }).custom((v) => enderecoDeLinkAceito(v))`. Use o import relativo `../../lib/sanity/link`, porque o Studio também é empacotado pelo Sanity.
  3. Atualize os comentários dos dois campos: o "diretoria" sem barra agora é recusado no Studio.
  4. Testes da função:
     - `"diretoria"` → mensagem;
     - `"//x.com"` → mensagem;
     - `"/\\x.com"` → mensagem;
     - `"/associacao"` → true;
     - `"#topo"` → true;
     - `"https://a.b"` → true;
     - `"HTTPS://a.b"` → true;
     - `"mailto:a@b.c"` → true;
     - `"tel:+5599"` → true;
     - `"javascript:alert(1)"` → mensagem;
     - `undefined` → true.
  5. Leitura dos dois schemas: os dois chamam `enderecoDeLinkAceito`.
- [ ] **Passo 4: verificação.** `npx vitest run`, `npx tsc --noEmit` e `npx eslint` nos arquivos tocados. Uma mutação por asserção nova.
- [ ] **Passo 5: commits.** Um por item: bio, link e Studio.

### Task 2: O período da gestão na faixa da diretoria

**Files:**
- Modify: `lib/dados/diretoria.ts` (tem BOM: preserve)
- Modify: `components/associacao/FaixaDaDiretoria.tsx`, `components/associacao/FaixaDaDiretoria.module.css`
- Modify: `app/(site)/associacao/diretoria/page.tsx`
- Test: `testes/diretoria.test.ts`, `testes/diretoria-na-tela.test.ts`

**Interfaces:**
- `Diretor` ganha `mandatoInicio: string | null` e `mandatoFim: string | null`. As datas vêm cruas da coluna `date`, no formato "2025-03-01".
- Produz `periodoDaGestao(diretores: Diretor[]): string | null` em `lib/dados/diretoria.ts`.
- `FaixaDaDiretoria` passa a receber `{ demonstracao: boolean; periodo: string | null }`.

- [ ] **Passo 1: ler as datas.**
  1. `SELECAO` ganha `mandato_inicio, mandato_fim`.
  2. O mapeamento preenche `mandatoInicio` e `mandatoFim`.
  3. Corrija toda fábrica de `Diretor` nos testes (ex.: `diretor({...})` em `testes/diretoria-na-tela.test.ts`) para incluir os dois campos com `null`.
- [ ] **Passo 2: `periodoDaGestao`, pura.**
  1. Ela ordena com `ordenarDiretoria` (não confie na ordem recebida).
  2. Pega o primeiro diretor com as duas datas válidas: `^\d{4}-\d{2}-\d{2}$` e data real.
  3. Devolve `${anoInicio}–${anoFim}`, com o traço meio U+2013.
  4. Quando os anos são iguais, devolve só o ano.
  5. Sem ninguém com as duas datas, devolve `null`.
  6. Testes:
     - presidente (ordem 10) com 2025-01-01/2027-12-31 e vice (ordem 20) com 2023-01-01/2025-01-01, passados fora de ordem → "2025–2027";
     - presidente sem datas e tesoureiro (ordem 30) com datas → as do tesoureiro;
     - só início → `null`;
     - data "2025-13-01" → conta como ausente;
     - anos iguais → "2026";
     - lista vazia → `null`.
- [ ] **Passo 3: a faixa.**
  1. Com `periodo`, nas duas chaves: `<p className={styles.pilula}>Gestão {periodo}</p>`, sem `data-a-entrar` e sem `<em>`.
  2. Sem `periodo`: exatamente o comportamento de hoje.
  3. CSS:
     - `.pilula` passa a ter fio contínuo (`1px solid rgba(168, 212, 112, 0.5)`);
     - `.pilula[data-a-entrar]` mantém o tracejado.
     - Confira `testes/molduras.test.ts` e o teste de CSS da faixa em `testes/diretoria-na-tela.test.ts` e ajuste o que conferia o tracejado no `.pilula`.
  4. Atualize o comentário do componente: o período vem do banco.
- [ ] **Passo 4: a página.** Ela calcula `periodoDaGestao(diretoria)` e passa `periodo` à faixa.
- [ ] **Passo 5: testes de renderização da faixa.**
  1. `periodo: "2025–2027"` com `demonstracao` true e false: a pílula "Gestão 2025–2027" está lá, sem `data-a-entrar`.
  2. `periodo: null`: os dois casos de hoje continuam iguais.
  3. Mutações.
- [ ] **Passo 6: verificação.** `npx vitest run`, `npx tsc --noEmit` e lint. Commit.

### Task 3: O endereço do site em um lugar só

**Files:**
- Create: `lib/site.ts`
- Modify:
  - `app/(site)/medico/[slug]/page.tsx:20`
  - `app/(site)/medicos/[especialidade]/page.tsx:22`
  - `app/(site)/noticias/page.tsx:14`
  - `app/(site)/noticias/[slug]/page.tsx:17`
  - `app/(site)/page.tsx:22`
  - `app/layout.tsx:5-9`
  - `app/robots.ts:4`
  - `app/sitemap.ts:10`
  - `.env.local.exemplo` (o bloco de `NEXT_PUBLIC_SITE_URL`)
- Test: `testes/site.test.ts` (novo)

**Interfaces:**
- Produz:
  - `enderecoDoSite(amb: { NEXT_PUBLIC_SITE_URL?: string; VERCEL_PROJECT_PRODUCTION_URL?: string }): string`, pura;
  - `URL_DO_SITE = enderecoDoSite(process.env)`, ambas em `lib/site.ts`.

- [ ] **Passo 1: a função.**
  1. Usa `NEXT_PUBLIC_SITE_URL` aparado e sem barras no fim, quando não for vazio.
  2. Senão, `https://${VERCEL_PROJECT_PRODUCTION_URL}` aparado, sem barras no fim, e sem `https://` duplicado se já vier com esquema.
  3. Senão, `http://localhost:3000`.
  4. Testes:
     - `"https://ami.org.br/"` → `"https://ami.org.br"`;
     - `"  https://ami.org.br  "` → `"https://ami.org.br"`;
     - `""` com Vercel `"site-ami.vercel.app"` → `"https://site-ami.vercel.app"`;
     - nada → `"http://localhost:3000"`;
     - os dois preenchidos → o `NEXT_PUBLIC_SITE_URL`.
- [ ] **Passo 2: as oito cópias.**
  1. Troque as oito por `import { URL_DO_SITE } from "@/lib/site"`. Mantenha o nome local `SITE` onde ele já é usado, se isso diminuir a mudança: `const SITE = URL_DO_SITE`, ou troque os usos.
  2. `app/layout.tsx` usa `new URL(URL_DO_SITE)` no `metadataBase`.
  3. Um teste de leitura varre `app/` e `lib/` e confere que `NEXT_PUBLIC_SITE_URL` só aparece em `lib/site.ts`.
- [ ] **Passo 3: o modelo.** Em `.env.local.exemplo`, explique em duas ou três linhas a ordem: a variável, o endereço da Vercel e o localhost. Diga que em produção ela deve ter o domínio final.
- [ ] **Passo 4: verificação.** Testes, tipos, lint e `npm run build`. Commit.

### Task 4: A foto — banco e servidor

**Files:**
- Create: `supabase/migrations/0007_fotos.sql`
- Create: `lib/painel/foto.ts` (funções puras)
- Create: `app/painel/medico/[id]/acoes-foto.ts` (`"use server"`)
- Test: `testes/painel-foto.test.ts` (novo) e um bloco novo em `testes/painel-migracao.test.ts` para a 0007

**Interfaces:**
- Produz em `lib/painel/foto.ts`:
  - `BUCKET_DAS_FOTOS = "fotos-medicos"`;
  - `LIMITE_DA_FOTO = 900 * 1024`;
  - `tipoDaFoto(bytes: Uint8Array): "webp" | "jpg" | null`. WebP: bytes 0-3 = `RIFF` e 8-11 = `WEBP`. JPEG: `FF D8 FF`;
  - `conferirFoto(bytes: Uint8Array): { ok: true; tipo: "webp" | "jpg" } | { ok: false; erro: string }`, com as mensagens:
    - vazio → `"Nenhuma foto chegou. Escolha a foto de novo."`;
    - maior que o limite → `"A foto passou de 900 KB. Escolha outra ou tente de novo."`;
    - tipo desconhecido → `"Formato não aceito. Use JPG, PNG ou WebP."`;
  - `caminhoDaFoto(medicoId: number, tipo: "webp" | "jpg", agora: Date): string` → `${medicoId}/${agora.toISOString().replace(/[:.]/g, "-")}.${tipo}`;
  - `mensagemDoErroDeEnvio(mensagem: string): string`:
    - texto com "bucket not found" (sem diferenciar caixa) → `"O armazenamento de fotos ainda não foi ligado no Supabase. Veja docs/como-ligar-as-fotos.md."`;
    - com "row-level security" ou "unauthorized" → `"O banco não aceitou o envio. Costuma ser sessão expirada: saia e entre de novo."`;
    - fora disso → `"Não consegui enviar a foto: " + mensagem`.
- Produz em `acoes-foto.ts`:
  - `EstadoDaFoto = { erro: string | null; salvo: boolean }`;
  - `enviarFoto(anterior: EstadoDaFoto, dados: FormData): Promise<EstadoDaFoto>`, com os campos `id` e `foto` (um `File`);
  - `removerFoto(anterior: EstadoDaFoto, dados: FormData): Promise<EstadoDaFoto>`, com o campo `id`.

- [ ] **Passo 1: a migração.** Escreva `0007_fotos.sql`:

```sql
-- As fotos dos médicos.
--
-- Um bucket público: qualquer visitante vê a foto, como vê o nome e o CRM.
-- Escrita, só admin, e só inserção. Sem política de leitura em
-- storage.objects (o bucket público já serve o arquivo pela URL pública),
-- sem alteração e sem remoção: trocar de foto grava um arquivo novo, e
-- remover a foto do perfil só limpa profissional.foto. Mesma regra do resto
-- do banco: nada se apaga por engano.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('fotos-medicos', 'fotos-medicos', true, 1048576, array['image/webp', 'image/jpeg'])
on conflict (id) do nothing;

drop policy if exists admin_envia_foto on storage.objects;

create policy admin_envia_foto on storage.objects
  for insert to authenticated
  with check (bucket_id = 'fotos-medicos' and (select public.eh_admin()));
```

  Os comentários podem ser reescritos à vontade, mas não podem citar a sintaxe proibida: o teste varre o arquivo sem comentários, então descreva sem escrever `for delete`.

  Teste em `painel-migracao.test.ts`, com `semComentariosSql` em minúsculas:
  - exatamente uma política, `for insert`;
  - nenhum `for select|update|delete|all`;
  - nenhum `grant`, `truncate`, `drop table` nem `disable row level security`;
  - o bucket `fotos-medicos` com `public` true e os dois tipos;
  - a política contém `eh_admin()` e `bucket_id = 'fotos-medicos'`;
  - o único `drop` é `drop policy if exists admin_envia_foto`.
- [ ] **Passo 2: as funções puras.** Teste cada uma:
  - JPEG verdadeiro;
  - WebP verdadeiro;
  - PNG (`89 50 4E 47`) → não aceito: o navegador converte o PNG antes, e o servidor só aceita os dois tipos;
  - 0 bytes;
  - limite exato aceito e limite +1 recusado;
  - o caminho com uma data fixa;
  - as três mensagens de erro.
- [ ] **Passo 3: as ações.** Siga `app/painel/acoes.ts` e `app/painel/medico/[id]/acoes.ts` como modelo:
  1. `exigirAdmin()`;
  2. `id` inteiro positivo, senão `{ erro: "Identificador de médico inválido.", salvo: false }`;
  3. o campo `foto` precisa ser `File`; lido com `new Uint8Array(await foto.arrayBuffer())`;
  4. `conferirFoto`;
  5. `cliente.storage.from(BUCKET_DAS_FOTOS).upload(caminho, bytes, { contentType: tipo === "webp" ? "image/webp" : "image/jpeg", upsert: false, cacheControl: "31536000" })`;
  6. erro → `mensagemDoErroDeEnvio(error.message)`;
  7. `getPublicUrl(caminho).data.publicUrl`;
  8. `update({ foto: url, atualizado_em })`, com `.eq("id", id).select("id").maybeSingle()`, e a mesma conferência de "zero linhas" de `alternarPublicacao` (mensagem igual);
  9. as mesmas três revalidações de `alternarPublicacao`, mais `revalidatePath(`/painel/medico/${id}`)`.

  `removerFoto` faz o mesmo update com `foto: null`. Nenhuma das duas chama `.remove(` nem `.delete(`. O teste existente de `painel-acoes.test.ts`, que varre `.delete(`, continua verde. Acrescente a esse teste (ou ao novo) uma varredura por `.remove(` nos arquivos de `app/painel/`.
- [ ] **Passo 4: a ligação.** Testes de leitura do código das ações:
  - `exigirAdmin()` vem antes de `clienteDoPainel()`;
  - `upsert: false`;
  - `conferirFoto` é chamada antes do `upload`;
  - nenhum `.remove(`.
- [ ] **Passo 5: verificação.** Testes, tipos e lint. Commits: a migração e o resto.

### Task 5: A foto — o bloco no painel

**Files:**
- Create: `lib/painel/recorte.ts` (a conta do recorte, pura)
- Create: `components/painel/BlocoFoto.tsx` (`"use client"`)
- Modify: `lib/painel/consultas.ts` (`MedicoDoPainel` ganha `foto: string | null`; `SELECAO_COMPLETA` ganha `foto`)
- Modify: `app/painel/medico/[id]/page.tsx` (o `<BlocoFoto>` entre o `FormularioMedico` e o `BlocoEspecialidades`)
- Test: `testes/painel-foto.test.ts`

**Interfaces:**
- Consome `enviarFoto`, `removerFoto` e `EstadoDaFoto` de `app/painel/medico/[id]/acoes-foto.ts` (Task 4).
- Consome `iniciais` (ou o equivalente que `components/diretorio/FotoDoMedico.tsx` usa para as iniciais). Procure e reaproveite; não duplique a regra.
- Produz `recorteRetrato(largura: number, altura: number): { sx: number; sy: number; sLargura: number; sAltura: number; largura: number; altura: number; pequena: boolean }`:
  - recorte 4:5 centrado;
  - saída de no máximo 800×1000, sem ampliar;
  - `pequena` quando o recorte tem menos de 400×500;
  - valores inteiros.

- [ ] **Passo 1: `recorteRetrato`.** Testes:
  - 4000×3000 (paisagem) → `sAltura` 3000, `sLargura` 2400, `sx` 800, `sy` 0, saída 800×1000;
  - 3000×4000 (retrato 3:4) → `sLargura` 3000, `sAltura` 3750, `sx` 0, `sy` 125, saída 800×1000;
  - 800×1000 exato → sem deslocamento, saída 800×1000;
  - 300×300 → `sLargura` 240, `sAltura` 300, saída 240×300, `pequena` true.
- [ ] **Passo 2: o bloco.**
  1. A seção leva o título "Foto" no mesmo estilo dos títulos de `BlocoEspecialidades`. Leia esse arquivo e siga as classes dele.
  2. A imagem atual (`<img>`, 4:5, largura 160) ou as iniciais.
  3. O `<input type="file" accept="image/jpeg,image/png,image/webp">` fica escondido visualmente, mas acessível, ligado ao rótulo-botão **Escolher foto**.
  4. **Remover foto** só aparece com foto.
  5. A linha de ajuda da spec, seção 1.1.
  6. A região `aria-live="polite"` fica sempre montada, como o `Erro` de `FormularioMedico`.
  7. Ao escolher o arquivo:
     - `createImageBitmap(arquivo)`; se falhar, `"Não consegui abrir esta foto. Use JPG, PNG ou WebP."`;
     - `recorteRetrato`;
     - desenha num `canvas`;
     - `toBlob` em `"image/webp"` com 0,85; se o blob voltar nulo ou de outro tipo, `"image/jpeg"` com 0,85;
     - monta o `FormData` com `id` e `foto` (`new File([blob], "foto.webp" ou "foto.jpg")`);
     - chama a ação de envio com `useActionState` e `startTransition`.
     - Com `pequena`, mostra o aviso "A foto é pequena e pode sair borrada." junto do resultado.
  8. Botões desabilitados enquanto envia, com o texto "Enviando…".
  9. Sem ícone nenhum.
- [ ] **Passo 3: os dados.** `foto` em `MedicoDoPainel` e em `SELECAO_COMPLETA`, e o mapeamento. Ajuste as fábricas de `MedicoDoPainel` dos testes.
- [ ] **Passo 4: a página.** `<BlocoFoto medicoId={medico.id} nome={medico.nome} foto={medico.foto} />`, entre o formulário e as especialidades.
- [ ] **Passo 5: testes de renderização** (`renderToString`):
  - com foto: o `<img>` com o `src`, o **Remover foto** e o input com o `accept` exato;
  - sem foto: as iniciais e nenhum **Remover foto**;
  - nenhum `<svg>` no bloco;
  - leitura do código: a página monta o `BlocoFoto` depois do `FormularioMedico` e antes do `BlocoEspecialidades`.
- [ ] **Passo 6: conferência no navegador**, no servidor de produção na 3300 (`npm run build` e `npx next start -p 3300`), parado pelo PID no fim.
  1. Sem sessão de admin, só confira que `/painel/medico/1` desvia para entrar. Não tente entrar.
  2. Registre no relatório que o envio real fica pendente da 0007.
- [ ] **Passo 7: verificação.** Testes, tipos, lint e build. Commit.

### Task 6: Os guias e o estado do projeto

**Files:**
- Create: `docs/como-publicar-na-vercel.md`
- Create: `docs/como-ligar-as-fotos.md`
- Modify: `docs/estado-do-projeto.md`

- [ ] **Passo 1: `como-ligar-as-fotos.md`.** Passos numerados, cada um com o nome do botão:
  1. entrar em supabase.com e abrir o projeto;
  2. **SQL Editor** no menu da esquerda;
  3. **New query**;
  4. colar o conteúdo inteiro de `supabase/migrations/0007_fotos.sql`;
  5. **Run**;
  6. conferir em **Storage** que existe o bucket `fotos-medicos`, com a etiqueta **Public**;
  7. no painel do site, abrir um médico, **Escolher foto**, e conferir a foto no perfil público, que pode levar até uma hora por causa do cache, ou na hora, se o site for publicado de novo.

  Diga que rodar duas vezes não faz mal. E diga o que fazer se aparecer "must be owner of table objects": anotar a mensagem e não tentar outra coisa.
- [ ] **Passo 2: `como-publicar-na-vercel.md`.** Leia antes:
  - `.env.local.exemplo`;
  - `app/robots.ts`;
  - `lib/demonstracao.ts`;
  - `app/api/revalidar/` (a rota e o segredo);
  - `docs/como-remontar-o-ambiente.md`;
  - `docs/como-criar-a-conta-do-painel.md`.

  Passos numerados, simples, com o nome de cada botão:
  1. **Criar a conta:** vercel.com, **Sign Up**, **Continue with GitHub**, plano **Hobby**. Uma observação: o plano Hobby é para uso não comercial; para a AMI, vale conferir com ela se o plano **Pro** é o caso.
  2. **Importar o repositório:** **Add New…**, **Project**, escolher `site-ami`, **Import**.
  3. **As variáveis**, em **Environment Variables**:
     - a lista do que vai: os dois do Supabase (URL e anon), os dois do Sanity, `SANITY_WEBHOOK_SECRET`, `NEXT_PUBLIC_SITE_URL` (o domínio final, ou o endereço `.vercel.app` até o domínio existir) e `NEXT_PUBLIC_DADOS_DEMONSTRACAO=true`;
     - em destaque, o que nunca vai: `SUPABASE_CHAVE_IMPORTADOR` e a `service_role`.
  4. **Deploy**, e onde ver o endereço `.vercel.app`.
  5. **O domínio:** **Settings**, **Domains**, **Add**, e os registros que a Vercel mostrar, a colar onde o domínio foi comprado. Diga que quem comprou o domínio faz essa parte.
  6. **Sanity, Studio:** em sanity.io/manage, **API**, **CORS origins**, **Add CORS origin**, o endereço do site, com **Allow credentials** marcado.
  7. **Sanity, webhook:** **API**, **Webhooks**: o endereço passa a ser `https://<domínio>/api/revalidar`, com o mesmo segredo. Leia a rota para dizer o que o webhook precisa: o método, os filtros e o cabeçalho que a rota confere.
  8. **Conferir:**
     - a home abre;
     - `/painel/entrar` entra com a conta do painel;
     - `/studio` abre;
     - publicar uma notícia de teste aparece no site.
  9. **A trava de indexação:** quando o cadastro real estiver carregado, trocar `NEXT_PUBLIC_DADOS_DEMONSTRACAO` para `false` na Vercel e clicar **Redeploy**, porque a variável entra no build.
  10. **Cada `git push` na `main` publica sozinho.**

  Nenhum valor real de chave no guia. Onde um nome de botão não puder ser confirmado, escreva o caminho do jeito que a tela mostra hoje, até onde se sabe, e avise no relatório quais foram.
- [ ] **Passo 3: `estado-do-projeto.md`.**
  1. Uma seção "Rumo à publicação (14/11/2026)" com o que entrou: as tasks 1 a 5 em frases curtas.
  2. Nos "Próximos passos de código", marque como feitos o 1 (foto), o 2 (mandato), o 5 (`temBio`) e o 6 (links do Studio). Os itens 3 e 4 continuam.
  3. Nas "Pendências do cliente", acrescente:
     - rodar a 0007 (com link para o guia);
     - criar a conta na Vercel (com link para o guia);
     - preencher `mandato_inicio` e `mandato_fim` da diretoria.
  4. Mantenha o estilo do arquivo: frases curtas, passos numerados.
- [ ] **Passo 4: commit.**
