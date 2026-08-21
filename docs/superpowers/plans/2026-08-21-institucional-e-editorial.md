# Páginas institucionais e conteúdo editorial — Plano de implementação

> **Para agentes executores:** SUB-SKILL OBRIGATÓRIA: use `superpowers:subagent-driven-development` (recomendado) ou `superpowers:executing-plans` para implementar tarefa a tarefa. Os passos usam caixa de seleção (`- [ ]`) para acompanhamento.

**Objetivo:** dar ao site da AMI tudo que não é diretório médico — notícias, páginas institucionais, diretoria e páginas legais — com o conteúdo de texto editável pela própria associação no Sanity, sem chamar desenvolvedor.

**Arquitetura:** o Supabase guarda o que se filtra e se relaciona; o Sanity guarda o que se escreve. `lib/sanity/` nasce como espelho de `lib/dados/`: a única porta para o Sanity, com as consultas GROQ num arquivo só. O Studio fica embutido em `/studio`, fora do grupo `(site)`, com layout próprio. A atualização do site após uma publicação vem de webhook do Sanity que invalida etiquetas de cache, não de espera por tempo.

**Stack:** Next.js 16.3.1 (App Router, Turbopack) · React 19.2 · TypeScript 5.9 · Tailwind CSS v4 · Vitest 4.1 · Supabase · `next-sanity@13` · `sanity@6` · `@portabletext/react@8` · `@sanity/image-url@2`

**Spec:** `docs/superpowers/specs/2026-08-19-site-ami-diretorio-design.md`

**Plano anterior:** `docs/superpowers/plans/2026-08-19-fundacao-e-busca-de-medicos.md` (22 tarefas, concluído)

---

## Restrições globais

Valem para toda tarefa deste plano. Não repetidas em cada uma.

### Plataforma

- **Next.js 16.3.1**, App Router. `cacheComponents` está **desligado** de propósito. O guia de cache válido para este projeto é `node_modules/next/dist/docs/01-app/02-guides/caching-without-cache-components.md`, **não** `01-getting-started/09-revalidating.md`, que assume `cacheComponents: true`.
- **`params` e `searchParams` são Promises.** Sempre `const { slug } = await params`.
- **`revalidateTag` mudou de assinatura no Next 16.** A forma de um argumento está **depreciada**. Use sempre `revalidateTag(etiqueta, "max")`. O `"max"` dá semântica de servir-obsoleto-enquanto-revalida; sem ele a próxima requisição bloqueia.
- Rotas de metadados (`sitemap.ts`, `robots.ts`) compilam como handlers: o `cache` do React **não** deduplica ali.
- Toda página indexável usa `export const revalidate = 3600`.
- Antes de escrever qualquer código, leia o guia relevante em `node_modules/next/dist/docs/`. Esta versão do Next tem quebras em relação ao conhecimento de treino.

### Dependências

Já instaladas na raiz do projeto, com estas versões exatas. **Não instale mais nada sem justificar.**

```
next-sanity@^13.3.3   sanity@^6.10.1   @sanity/vision@^6.10.1
@sanity/image-url@^2.1.1   @portabletext/react@^8.0.0   styled-components@^6.5.3
@sanity/locale-pt-br@^1.1.36
```

`@sanity/client` entra como transitivo em `7.26.2`, que é o que o `next-sanity@13` exige por peer. **Não instale `@sanity/client@8` diretamente** — quebra o intervalo do peer. Importe `createClient` de `next-sanity`, nunca de `@sanity/client`.

`npm audit` acusa 9 vulnerabilidades, todas na cadeia `sanity` → `@sanity/cli` → `@vercel/frameworks` → `js-yaml`/`smol-toml`. É ferramenta de linha de comando, não vai para o navegador nem para o servidor do site. O `npm audit fix --force` rebaixaria para `sanity@5.14.1`, quebra de versão maior. **Aceito e documentado. Não rode o fix.**

`sanity` e `@sanity/vision` ficam em `dependencies`, não em `devDependencies`: a rota `/studio` faz parte do build do Next e a Vercel não instala devDependencies em produção.

### Sistema visual

- Tailwind v4 sem arquivo de configuração. Os tokens vivem no `@theme` de `app/globals.css`. **Nenhum componente inventa cor, raio, sombra ou curva fora daquela lista.**
- Utilitários do projeto que este plano usa: `texto-placa` (display), `registro` (monoespaçada de dado cartorial), `coluna-leitura` (580px), `revelar` (entrada por rolagem), `pressiona` (resposta ao toque), `numero-tabular`.
- Componentes já prontos, para reusar em vez de refazer: `Cabeceira`, `Breadcrumb`, `Chip`, `EstadoVazio`, `Placa`, `Fotografia`, `JsonLd`.
- Elevação: `shadow-apoio`, `shadow-erguido`, `shadow-flutuante`. Curvas: `ease-saida`, `ease-resposta`.
- Raio por função: `rounded-controle` (6px), `rounded-bloco` (10px), `rounded-chip` (999px). Um sistema por página, sem misturar.

### Texto visível

- **Zero travessão (`—`) e zero meia-risca (`–`)** em qualquer string que chegue à tela. Use ponto, vírgula, dois-pontos ou parênteses. Hífen comum (`-`) é permitido.
- **Ponto médio (`·`) no máximo um por linha.**
- Frase sempre em caixa de sentença, nunca em Caixa De Título.
- CRM, RQE, telefone, CNPJ e data em `registro`.
- Nada de "Oops!", nada de ponto de exclamação em mensagem de sucesso, nada de voz passiva.

### Conformidade

- **Resolução CFM 2.336/2023:** nome do médico sempre acompanhado de CRM e da palavra MÉDICO (Art. 4º, I). RQE só onde houver registro (Art. 4º, II). Nenhum ranking, nenhuma comparação, nenhum `AggregateRating` (Art. 11, XIII).
- **YMYL:** todo conteúdo clínico tem autor com CRM, selo "Revisado por" com data, e o aviso de que é informativo e não substitui consulta.
- **LGPD:** nada de coleta de sintoma ou diagnóstico. Nenhum formulário deste plano coleta dado de saúde.
- Todo conteúdo institucional que a AMI ainda não forneceu entra marcado `[PROVISÓRIO]`, seguindo o padrão já estabelecido no rodapé e nas páginas de especialidade.

### Convenções do repositório

- Código, nomes de função, variáveis e comentários em **português**. Comentários explicam **por que**, nunca **o que**.
- Testes em `testes/`, com Vitest. Nomes de arquivo em português.
- Nenhuma página consulta Supabase ou Sanity diretamente. Tudo passa por `lib/dados/` e `lib/sanity/`.
- Toda tarefa termina com `npx tsc --noEmit && npx eslint app components lib && npx vitest run` limpos, e um commit.
- Mensagem de commit em português, corpo explicando a razão da mudança, terminando com:
  `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>`

---

## Estrutura de arquivos

```
sanity.config.ts                        Studio. Na raiz porque o CLI do Sanity exige.
sanity/
  env.ts                                projectId, dataset, apiVersion, com validação
  schemas/
    index.ts                            registro dos tipos
    autor.ts                            médico autor, com CRM
    noticia.ts
    paginaInstitucional.ts
lib/sanity/
  cliente.ts                            createClient. A única porta.
  consultas.ts                          GROQ com defineQuery, e as etiquetas de cache
  tipos.ts                              formas de domínio do conteúdo editorial
  imagem.ts                             urlDaImagem()
lib/dados/diretoria.ts                  diretoria, vinda do Supabase
supabase/migrations/0003_diretoria.sql
supabase/seed/diretoria.sql
app/studio/layout.tsx
app/studio/[[...tool]]/page.tsx
app/api/revalidar/route.ts              webhook do Sanity
app/(site)/noticias/page.tsx
app/(site)/noticias/[slug]/page.tsx
app/(site)/associacao/page.tsx
app/(site)/associacao/diretoria/page.tsx
app/(site)/associacao/[pagina]/page.tsx beneficios, estatuto, politica-editorial
app/(site)/politica-de-privacidade/page.tsx
app/(site)/termos-de-uso/page.tsx
app/(site)/politica-de-cookies/page.tsx
components/editorial/TextoRico.tsx      PortableText mapeado no sistema visual
components/editorial/LinhaNoticia.tsx   item do índice de notícias
components/editorial/PaginaDeTexto.tsx  corpo compartilhado das páginas de texto
components/editorial/UltimasNoticias.tsx bloco da home
components/diretorio/CartaoDiretor.tsx
testes/sanity-consultas.test.ts
testes/sanity-imagem.test.ts
testes/revalidar.test.ts
testes/diretoria.test.ts
```

Por que `lib/sanity/consultas.ts` num arquivo só, e não um por tipo: são seis consultas curtas que compartilham as mesmas projeções de imagem e autor. Espalhadas, a projeção divergiria entre elas na primeira alteração, que foi exatamente o defeito que obrigou a consolidar `lib/dados/sinonimos.ts` no plano anterior.

---

## Tarefa 1: Fundação do Sanity, cliente e Studio

**Arquivos:**
- Criar: `sanity/env.ts`
- Criar: `sanity.config.ts`
- Criar: `lib/sanity/cliente.ts`
- Criar: `app/studio/layout.tsx`
- Criar: `app/studio/[[...tool]]/page.tsx`
- Criar: `testes/sanity-ambiente.test.ts`
- Modificar: `app/robots.ts`
- Modificar: `.env.local.exemplo` (criar se não existir)

**Interfaces:**
- Produz: `projectId: string`, `dataset: string`, `apiVersion: string`, `exigir(valor: string | undefined, nome: string): string` em `sanity/env.ts`; `cliente` (instância de `SanityClient`) em `lib/sanity/cliente.ts`.
- Consome: nada.

**Antes de começar:** a AMI precisa de um projeto Sanity. Quem executa **não cria conta em serviço de terceiro**. Se `NEXT_PUBLIC_SANITY_PROJECT_ID` não estiver em `.env.local`, pare e peça ao usuário, entregando estes passos:
> 1. Entre em `sanity.io/manage` e crie um projeto novo chamado "AMI".
> 2. Copie o **Project ID** que aparece no topo.
> 3. Em API → CORS Origins, adicione `http://localhost:3000` com credenciais permitidas.
> 4. Cole o Project ID no `.env.local` como `NEXT_PUBLIC_SANITY_PROJECT_ID=`.

- [ ] **Passo 1: escreva o teste que falha**

Crie `testes/sanity-ambiente.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { exigir } from "@/sanity/env";

describe("exigir", () => {
  it("devolve o valor quando ele existe", () => {
    expect(exigir("abc123", "NEXT_PUBLIC_SANITY_PROJECT_ID")).toBe("abc123");
  });

  it("explica o que fazer quando a variável falta", () => {
    /* A mensagem é a única coisa que a pessoa vê quando o site não sobe.
       Se ela disser só "undefined", a pessoa abre o código; se disser o nome
       da variável e onde consegui-lo, ela resolve sozinha. */
    expect(() => exigir(undefined, "NEXT_PUBLIC_SANITY_PROJECT_ID")).toThrow(
      /NEXT_PUBLIC_SANITY_PROJECT_ID/,
    );
    expect(() => exigir(undefined, "NEXT_PUBLIC_SANITY_PROJECT_ID")).toThrow(
      /sanity\.io\/manage/,
    );
  });

  it("trata string vazia como ausente", () => {
    /* Uma linha `NEXT_PUBLIC_SANITY_PROJECT_ID=` no .env produz string vazia,
       não undefined. Sem esta checagem o cliente seria construído com id
       vazio e falharia bem mais adiante, com erro de rede ilegível. */
    expect(() => exigir("", "NEXT_PUBLIC_SANITY_PROJECT_ID")).toThrow();
  });
});
```

- [ ] **Passo 2: rode e confirme que falha**

Comando: `npx vitest run testes/sanity-ambiente.test.ts`
Esperado: FALHA com "Cannot find module '@/sanity/env'".

- [ ] **Passo 3: escreva `sanity/env.ts`**

```ts
/*
  Variáveis de ambiente do Sanity, num lugar só e validadas na importação.

  A validação existe porque a falha silenciosa aqui é cara: sem projectId o
  cliente é construído mesmo assim e só quebra na primeira consulta, com um
  erro de rede que não menciona configuração nenhuma. Falhar cedo, com o nome
  da variável e o endereço de onde tirá-la, transforma meia hora de
  investigação em trinta segundos.
*/

export function exigir(valor: string | undefined, nome: string): string {
  /* String vazia conta como ausente: uma linha `NOME=` no .env produz "" e
     não undefined, e "" como projectId falha lá adiante, ilegível. */
  if (!valor) {
    throw new Error(
      `Falta ${nome} no .env.local. O Project ID está no topo da página do ` +
        `projeto em sanity.io/manage.`,
    );
  }
  return valor;
}

export const projectId = exigir(
  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  "NEXT_PUBLIC_SANITY_PROJECT_ID",
);

export const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production";

/*
  Data fixa, nunca `new Date()`. A API do Sanity versiona por data: pedir a
  versão de hoje significa que o comportamento pode mudar sozinho amanhã, e
  uma consulta que funcionava passa a não funcionar sem ninguém ter tocado no
  código. Congelada aqui, a atualização vira uma decisão com commit.
*/
export const apiVersion = "2026-08-21";
```

- [ ] **Passo 4: rode e confirme que passa**

Comando: `npx vitest run testes/sanity-ambiente.test.ts`
Esperado: 3 testes PASSAM.

- [ ] **Passo 5: escreva `lib/sanity/cliente.ts`**

```ts
import { createClient } from "next-sanity";
import { apiVersion, dataset, projectId } from "@/sanity/env";

/*
  A única porta para o Sanity, espelhando o papel de `lib/dados/` em relação
  ao Supabase. Nenhuma página constrói cliente próprio.

  `createClient` vem de `next-sanity`, não de `@sanity/client`: o pacote
  direto está em 8.x e o `next-sanity@13` exige 7.26 por peer. Importar da
  raiz do next-sanity garante que se use exatamente a versão resolvida.

  `useCdn: false` é decisão, não descuido. O CDN do Sanity serve conteúdo com
  atraso de até um minuto, e este site já tem a sua própria camada de cache no
  Next, invalidada por webhook na tarefa 4. Com CDN ligado, publicar uma
  notícia dispararia a invalidação do Next e a página buscaria de novo do CDN,
  ainda obsoleto: a correção só apareceria no ciclo seguinte, e ninguém
  entenderia por quê.
*/
export const cliente = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: false,
  /*
    "published" garante que rascunho nunca vaze para o site público. É o
    padrão da biblioteca, escrito aqui porque é uma garantia que importa e
    silêncio não é garantia.
  */
  perspective: "published",
});
```

- [ ] **Passo 6: escreva `sanity.config.ts` na raiz**

```ts
import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { visionTool } from "@sanity/vision";
import { ptBRLocale } from "@sanity/locale-pt-br";
import { apiVersion, dataset, projectId } from "./sanity/env";

/*
  Na raiz do projeto porque a linha de comando do Sanity procura este arquivo
  exatamente aqui. Mover para dentro de `sanity/` quebra `npx sanity deploy` e
  `npx sanity dataset export`.

  `basePath` precisa bater com a rota em `app/studio/[[...tool]]`. Divergindo,
  o Studio carrega mas a navegação interna monta endereços que dão 404.
*/
export default defineConfig({
  name: "ami",
  title: "Associação Médica de Imperatriz",
  basePath: "/studio",
  projectId,
  dataset,
  plugins: [
    structureTool(),
    /* Interface do Studio em português. A spec pede locale pt-BR, e não é
       detalhe: quem vai escrever ali é a secretaria da AMI, não um
       desenvolvedor. Um formulário com "Publish" e "Discard changes" gera
       ligação para a agência a cada dúvida. */
    ptBRLocale(),
    /* Vision é o console de GROQ. Fica só em desenvolvimento: em produção ele
       é uma janela de leitura livre no conteúdo para quem tiver acesso ao
       Studio, e não acrescenta nada a quem só edita texto. */
    ...(process.env.NODE_ENV === "development"
      ? [visionTool({ defaultApiVersion: apiVersion })]
      : []),
  ],
  /* Preenchido na tarefa 2. */
  schema: { types: [] },
});
```

- [ ] **Passo 7: escreva o layout e a página do Studio**

`app/studio/layout.tsx`:

```tsx
import { NextStudioLayout } from "next-sanity/studio";

/*
  O Studio fica fora do grupo `(site)` de propósito: ele não leva cabeçalho,
  rodapé, grão nem os tokens do diretório. É uma aplicação inteira embutida,
  com o próprio sistema visual, e envolvê-la no layout do site produziria dois
  cabeçalhos e uma barra de rolagem dentro da outra.
*/
export default function LayoutStudio({
  children,
}: {
  children: React.ReactNode;
}) {
  return <NextStudioLayout>{children}</NextStudioLayout>;
}
```

`app/studio/[[...tool]]/page.tsx`:

```tsx
import { NextStudio } from "next-sanity/studio";
import config from "@/sanity.config";

/*
  Rota atrapalhadora opcional (`[[...tool]]`): o Studio faz o próprio
  roteamento no cliente, e todos os caminhos abaixo de /studio precisam cair
  nesta mesma página.

  `metadata` e `viewport` vêm do next-sanity prontos. O `metadata` de lá já
  traz `robots: "noindex"` e `referrer: "same-origin"`, que é exatamente o que
  uma tela autenticada precisa. Reescrever à mão só criaria chance de errar.
*/
export { metadata, viewport } from "next-sanity/studio";

/* O Studio é interface autenticada: não há nada a pré-renderizar, e forçar
   dinâmico evita que o build tente gerar uma versão estática dele. */
export const dynamic = "force-static";

export default function PaginaStudio() {
  return <NextStudio config={config} />;
}
```

- [ ] **Passo 8: bloqueie `/studio` no robots**

Em `app/robots.ts`, no array `disallow` do ramo não-demonstração, acrescente `"/studio/"`, e ajuste o comentário existente:

```ts
      /* /painel entra na Fase 4 e já fica bloqueado desde agora, para que
         nenhuma tela autenticada apareça no índice por descuido. /studio é o
         Sanity embutido: também autenticado, e o próprio next-sanity já manda
         noindex no metadata. A linha aqui é a segunda tranca, para o caso de
         um rastreador que leia robots.txt e ignore a meta tag. */
      disallow: ["/api/", "/painel/", "/studio/", "/_next/"],
```

- [ ] **Passo 9: documente as variáveis**

Crie `.env.local.exemplo` (ou acrescente, se já existir):

```
# Sanity — conteúdo editorial. Project ID no topo de sanity.io/manage.
NEXT_PUBLIC_SANITY_PROJECT_ID=
NEXT_PUBLIC_SANITY_DATASET=production

# Segredo do webhook de revalidação. Invente uma frase longa e cole a mesma
# em sanity.io/manage → API → Webhooks → Secret. Ver tarefa 4.
SANITY_WEBHOOK_SECRET=
```

Confirme que `.env.local` continua fora do versionamento:

Comando: `git check-ignore -v .env.local`
Esperado: imprime a linha do `.gitignore` que o cobre.

- [ ] **Passo 10: verifique no navegador**

Comandos: `npx tsc --noEmit && npx eslint app components lib sanity && npx vitest run`
Depois suba o servidor e abra `/studio`.
Esperado: o Studio carrega **em português**, pede login do Sanity, e depois mostra um espaço vazio (nenhum tipo de documento ainda). Nenhum erro no console. Se a interface sair em inglês, o `ptBRLocale()` não entrou na lista de plugins.

- [ ] **Passo 11: commit**

```bash
git add sanity sanity.config.ts lib/sanity app/studio app/robots.ts testes/sanity-ambiente.test.ts .env.local.exemplo package.json package-lock.json
git commit -m "Sanity: ambiente validado, cliente e Studio em /studio, em português"
```

---

## Tarefa 2: Schemas do conteúdo editorial

**Arquivos:**
- Criar: `sanity/schemas/autor.ts`
- Criar: `sanity/schemas/noticia.ts`
- Criar: `sanity/schemas/paginaInstitucional.ts`
- Criar: `sanity/schemas/index.ts`
- Criar: `testes/sanity-schemas.test.ts`
- Modificar: `sanity.config.ts` (o `schema.types` vazio da tarefa 1)

**Interfaces:**
- Consome: nada da tarefa 1 além do `sanity.config.ts` existir.
- Produz: `tipos: SchemaTypeDefinition[]` exportado de `sanity/schemas/index.ts`. Nomes de documento: `"autor"`, `"noticia"`, `"paginaInstitucional"`. Campos usados pela tarefa 3: em `noticia` — `titulo`, `slug`, `resumo`, `capa`, `autor`, `publicadoEm`, `atualizadoEm`, `corpo`; em `autor` — `nome`, `crm`, `crmUf`, `slugDoPerfil`; em `paginaInstitucional` — `titulo`, `slug`, `resumo`, `corpo`, `atualizadoEm`.

- [ ] **Passo 1: escreva o teste que falha**

Crie `testes/sanity-schemas.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { tipos } from "@/sanity/schemas";

function porNome(nome: string) {
  const t = tipos.find((t) => t.name === nome);
  if (!t) throw new Error(`schema "${nome}" não registrado`);
  return t as { name: string; fields: { name: string; validation?: unknown }[] };
}

describe("schemas do Sanity", () => {
  it("registra os três tipos de documento", () => {
    expect(tipos.map((t) => t.name).sort()).toEqual([
      "autor",
      "noticia",
      "paginaInstitucional",
    ]);
  });

  it("notícia tem os campos que as consultas projetam", () => {
    /* Este teste é o contrato entre a tarefa 2 e a tarefa 3. Um campo
       renomeado no Studio sem atualizar o GROQ não quebra nada em tempo de
       compilação: a consulta simplesmente devolve null, e a página some sem
       erro. Aqui isso vira teste vermelho. */
    const campos = porNome("noticia").fields.map((c) => c.name);
    expect(campos).toEqual(
      expect.arrayContaining([
        "titulo",
        "slug",
        "resumo",
        "capa",
        "autor",
        "publicadoEm",
        "atualizadoEm",
        "corpo",
      ]),
    );
  });

  it("autor guarda CRM e UF separados", () => {
    /* Separados porque a Resolução CFM 2.336/2023 exige exibir a inscrição
       com a UF, e `identificacaoMedica` em lib/formato.ts já monta a string
       a partir dos dois. Guardar "MA 10274" num campo só obrigaria a fatiar
       texto na hora de exibir. */
    const campos = porNome("autor").fields.map((c) => c.name);
    expect(campos).toEqual(
      expect.arrayContaining(["nome", "crm", "crmUf", "slugDoPerfil"]),
    );
  });

  it("página institucional tem slug e data de atualização", () => {
    const campos = porNome("paginaInstitucional").fields.map((c) => c.name);
    expect(campos).toEqual(
      expect.arrayContaining(["titulo", "slug", "resumo", "corpo", "atualizadoEm"]),
    );
  });
});
```

- [ ] **Passo 2: rode e confirme que falha**

Comando: `npx vitest run testes/sanity-schemas.test.ts`
Esperado: FALHA com "Cannot find module '@/sanity/schemas'".

- [ ] **Passo 3: escreva `sanity/schemas/autor.ts`**

```ts
import { defineField, defineType } from "sanity";

/*
  Autor é médico, e por isso carrega CRM.

  Não é a tabela `profissional` do Supabase: quem escreve para o site pode não
  estar publicado no diretório, e um documento do Sanity não deve depender de
  uma linha do Postgres para existir. O laço entre os dois é `slugDoPerfil`,
  opcional: quando preenchido, a assinatura da notícia vira link para o perfil
  real; quando vazio, sai como texto. É deliberadamente frouxo, porque a
  alternativa é uma notícia que não publica porque o autor ainda não foi
  cadastrado no diretório.
*/
export const autor = defineType({
  name: "autor",
  title: "Autor",
  type: "document",
  fields: [
    defineField({
      name: "nome",
      title: "Nome",
      type: "string",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "crm",
      title: "CRM",
      type: "string",
      description: "Só os números. A UF vai no campo ao lado.",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "crmUf",
      title: "UF do CRM",
      type: "string",
      initialValue: "MA",
      validation: (r) => r.required().length(2),
    }),
    defineField({
      name: "slugDoPerfil",
      title: "Endereço do perfil no diretório",
      type: "string",
      description:
        "Opcional. O trecho final do endereço, por exemplo mayara-viana. " +
        "Preenchido, a assinatura vira link para o perfil.",
    }),
  ],
  preview: {
    select: { title: "nome", subtitle: "crm" },
  },
});
```

- [ ] **Passo 4: escreva `sanity/schemas/noticia.ts`**

```ts
import { defineArrayMember, defineField, defineType } from "sanity";

/*
  Notícia do blog da AMI.

  `publicadoEm` e `atualizadoEm` são campos e não metadados automáticos do
  Sanity (`_createdAt`, `_updatedAt`) porque o que vale para o leitor e para o
  Google é a data editorial, não a data do banco. Corrigir uma vírgula três
  meses depois mexeria em `_updatedAt` e faria a matéria parecer revisada.
*/
export const noticia = defineType({
  name: "noticia",
  title: "Notícia",
  type: "document",
  fields: [
    defineField({
      name: "titulo",
      title: "Título",
      type: "string",
      validation: (r) => r.required().max(110),
    }),
    defineField({
      name: "slug",
      title: "Endereço",
      type: "slug",
      options: { source: "titulo", maxLength: 90 },
      description:
        "Endereço publicado não muda. Se mudar, é preciso um redirecionamento.",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "resumo",
      title: "Resumo",
      type: "text",
      rows: 3,
      description:
        "Duas ou três linhas. É o que aparece no índice e na busca do Google.",
      validation: (r) => r.required().min(60).max(220),
    }),
    defineField({
      name: "capa",
      title: "Imagem de capa",
      type: "image",
      options: { hotspot: true },
      fields: [
        defineField({
          name: "alt",
          title: "Descrição da imagem",
          type: "string",
          description:
            "Descreva a cena para quem usa leitor de tela. Nunca escreva " +
            "'foto' ou 'imagem'.",
          validation: (r) => r.required(),
        }),
      ],
    }),
    defineField({
      name: "autor",
      title: "Autor",
      type: "reference",
      to: [{ type: "autor" }],
      validation: (r) => r.required(),
    }),
    defineField({
      name: "publicadoEm",
      title: "Publicado em",
      type: "datetime",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "atualizadoEm",
      title: "Atualizado em",
      type: "datetime",
      description:
        "Preencha só quando houver revisão de conteúdo, não a cada correção " +
        "de digitação.",
    }),
    defineField({
      name: "corpo",
      title: "Texto",
      type: "array",
      of: [
        defineArrayMember({
          type: "block",
          /* H1 fica de fora: a página já tem um, e um segundo quebra a
             hierarquia de cabeçalhos que leitor de tela usa para navegar. */
          styles: [
            { title: "Parágrafo", value: "normal" },
            { title: "Título de seção", value: "h2" },
            { title: "Subtítulo", value: "h3" },
            { title: "Citação", value: "blockquote" },
          ],
          lists: [
            { title: "Lista", value: "bullet" },
            { title: "Lista numerada", value: "number" },
          ],
          marks: {
            decorators: [
              { title: "Negrito", value: "strong" },
              { title: "Itálico", value: "em" },
            ],
            annotations: [
              {
                name: "link",
                title: "Link",
                type: "object",
                fields: [
                  defineField({
                    name: "href",
                    title: "Endereço",
                    type: "url",
                    validation: (r) => r.required(),
                  }),
                ],
              },
            ],
          },
        }),
        defineArrayMember({
          type: "image",
          options: { hotspot: true },
          fields: [
            defineField({
              name: "alt",
              title: "Descrição da imagem",
              type: "string",
              validation: (r) => r.required(),
            }),
            defineField({ name: "legenda", title: "Legenda", type: "string" }),
          ],
        }),
      ],
      validation: (r) => r.required(),
    }),
  ],
  orderings: [
    {
      title: "Mais recente primeiro",
      name: "recentes",
      by: [{ field: "publicadoEm", direction: "desc" }],
    },
  ],
  preview: {
    select: { title: "titulo", subtitle: "publicadoEm", media: "capa" },
  },
});
```

- [ ] **Passo 5: escreva `sanity/schemas/paginaInstitucional.ts`**

```ts
import { defineArrayMember, defineField, defineType } from "sanity";

/*
  Páginas de texto da associação: benefícios, estatuto, política editorial, e
  a própria /associacao.

  Existe como tipo separado de `noticia` porque não tem autor, não tem data de
  publicação e não sai em listagem cronológica. Forçar os dois no mesmo tipo
  encheria o formulário do estatuto de campos que a AMI teria de ignorar toda
  vez, e formulário com campo inútil é formulário preenchido errado.

  O `slug` vem de lista fechada em vez de texto livre: cada endereço aqui tem
  uma rota correspondente no Next, e um slug inventado no Studio produziria um
  documento publicado que não aparece em lugar nenhum do site.
*/
export const paginaInstitucional = defineType({
  name: "paginaInstitucional",
  title: "Página institucional",
  type: "document",
  fields: [
    defineField({
      name: "titulo",
      title: "Título",
      type: "string",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "slug",
      title: "Endereço",
      type: "slug",
      options: {
        list: [
          { title: "A Associação (/associacao)", value: "associacao" },
          { title: "Benefícios (/associacao/beneficios)", value: "beneficios" },
          { title: "Estatuto (/associacao/estatuto)", value: "estatuto" },
          {
            title: "Política editorial (/associacao/politica-editorial)",
            value: "politica-editorial",
          },
          {
            title: "Política de privacidade (/politica-de-privacidade)",
            value: "politica-de-privacidade",
          },
          { title: "Termos de uso (/termos-de-uso)", value: "termos-de-uso" },
          {
            title: "Política de cookies (/politica-de-cookies)",
            value: "politica-de-cookies",
          },
        ],
      },
      validation: (r) => r.required(),
    }),
    defineField({
      name: "resumo",
      title: "Resumo",
      type: "text",
      rows: 3,
      description: "Aparece abaixo do título e na busca do Google.",
      validation: (r) => r.required().min(60).max(220),
    }),
    defineField({
      name: "atualizadoEm",
      title: "Atualizado em",
      type: "datetime",
      description:
        "Obrigatório nas páginas legais: o leitor precisa saber de quando é " +
        "a versão que está lendo.",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "corpo",
      title: "Texto",
      type: "array",
      of: [
        defineArrayMember({
          type: "block",
          styles: [
            { title: "Parágrafo", value: "normal" },
            { title: "Título de seção", value: "h2" },
            { title: "Subtítulo", value: "h3" },
          ],
          lists: [
            { title: "Lista", value: "bullet" },
            { title: "Lista numerada", value: "number" },
          ],
          marks: {
            decorators: [
              { title: "Negrito", value: "strong" },
              { title: "Itálico", value: "em" },
            ],
            annotations: [
              {
                name: "link",
                title: "Link",
                type: "object",
                fields: [
                  defineField({
                    name: "href",
                    title: "Endereço",
                    type: "url",
                    validation: (r) => r.required(),
                  }),
                ],
              },
            ],
          },
        }),
      ],
      validation: (r) => r.required(),
    }),
  ],
  preview: {
    select: { title: "titulo", subtitle: "slug.current" },
  },
});
```

- [ ] **Passo 6: registre os tipos**

`sanity/schemas/index.ts`:

```ts
import type { SchemaTypeDefinition } from "sanity";
import { autor } from "./autor";
import { noticia } from "./noticia";
import { paginaInstitucional } from "./paginaInstitucional";

export const tipos: SchemaTypeDefinition[] = [
  autor,
  noticia,
  paginaInstitucional,
];
```

Em `sanity.config.ts`, troque o schema vazio:

```ts
import { tipos } from "./sanity/schemas";
// ...
  schema: { types: tipos },
```

- [ ] **Passo 7: rode e confirme que passa**

Comando: `npx vitest run testes/sanity-schemas.test.ts`
Esperado: 4 testes PASSAM.

- [ ] **Passo 8: verifique no Studio**

Abra `/studio`. Esperado: a barra lateral mostra Autor, Notícia e Página institucional. Crie um autor e uma notícia de teste, publique, e confirme que o campo Endereço se preenche sozinho a partir do título.

- [ ] **Passo 9: commit**

```bash
git add sanity/schemas sanity.config.ts testes/sanity-schemas.test.ts
git commit -m "Schemas do Sanity: autor com CRM, notícia e página institucional"
```

---

## Tarefa 3: Camada de leitura — consultas GROQ, tipos e etiquetas de cache

**Arquivos:**
- Criar: `lib/sanity/tipos.ts`
- Criar: `lib/sanity/consultas.ts`
- Criar: `testes/sanity-consultas.test.ts`

**Interfaces:**
- Consome: `cliente` de `lib/sanity/cliente.ts`.
- Produz, de `lib/sanity/consultas.ts`:
  - `etiquetaDeNoticia(slug: string): string`
  - `etiquetaDePagina(slug: string): string`
  - `ETIQUETA_NOTICIAS: "noticias"`
  - `listarNoticias(limite?: number): Promise<ResumoNoticia[]>`
  - `noticiaPorSlug(slug: string): Promise<Noticia | null>`
  - `slugsDeNoticias(): Promise<string[]>`
  - `paginaPorSlug(slug: string): Promise<PaginaInstitucional | null>`
- Produz, de `lib/sanity/tipos.ts`: `Autor`, `ImagemSanity`, `ResumoNoticia`, `Noticia`, `PaginaInstitucional`.

- [ ] **Passo 1: escreva o teste que falha**

Crie `testes/sanity-consultas.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  ETIQUETA_NOTICIAS,
  etiquetaDeNoticia,
  etiquetaDePagina,
  groqListaNoticias,
  GROQ_NOTICIA,
  GROQ_PAGINA,
} from "@/lib/sanity/consultas";

describe("etiquetas de cache", () => {
  it("etiqueta de notícia é derivada do slug", () => {
    expect(etiquetaDeNoticia("congresso-2026")).toBe("noticia:congresso-2026");
  });

  it("etiqueta de página é derivada do slug", () => {
    expect(etiquetaDePagina("estatuto")).toBe("pagina:estatuto");
  });

  it("a etiqueta coletiva de notícias é estável", () => {
    /* O webhook da tarefa 4 invalida esta string. Renomeá-la sem atualizar o
       webhook faria o índice de notícias congelar para sempre, sem erro
       nenhum: a página continuaria servindo, só que velha. */
    expect(ETIQUETA_NOTICIAS).toBe("noticias");
  });

  it("etiqueta não estoura o limite de 256 caracteres do Next", () => {
    const slugLongo = "a".repeat(300);
    expect(etiquetaDeNoticia(slugLongo).length).toBeLessThanOrEqual(256);
  });
});

describe("consultas GROQ", () => {
  it("a lista projeta exatamente o que o índice desenha", () => {
    /* Projeção a mais é banda desperdiçada em toda visita ao índice; a menos
       é campo undefined na tela. Ambos silenciosos. */
    for (const campo of ["titulo", "resumo", "publicadoEm", "capa", "autor"]) {
      expect(groqListaNoticias(20)).toContain(campo);
    }
    /* O corpo NÃO entra na lista: são vários blocos por matéria, e o índice
       não desenha um só deles. */
    expect(groqListaNoticias(20)).not.toContain("corpo");
  });

  it("a lista ordena da mais recente para a mais antiga", () => {
    expect(groqListaNoticias(20)).toContain("order(publicadoEm desc)");
  });

  it("o limite vira literal na fatia, porque GROQ não aceita parâmetro ali", () => {
    /* `[0...$limite]` é recusado pelo analisador do GROQ com "slicing must
       use constant numbers". Este teste trava o formato correto. */
    expect(groqListaNoticias(3)).toContain("[0...3]");
    expect(groqListaNoticias(20)).toContain("[0...20]");
    expect(groqListaNoticias(20)).not.toContain("$limite");
  });

  it("recusa limite fora da faixa em vez de interpolar lixo", () => {
    /* A interpolação é o que torna a validação obrigatória: sem ela, um valor
       vindo da URL entraria no texto da consulta. */
    expect(() => groqListaNoticias(0)).toThrow(/1 a 100/);
    expect(() => groqListaNoticias(101)).toThrow(/1 a 100/);
    expect(() => groqListaNoticias(Number.NaN)).toThrow();
  });

  it("corta a parte fracionária em vez de deixá-la chegar à consulta", () => {
    expect(groqListaNoticias(20.9)).toContain("[0...20]");
  });

  it("a notícia traz o autor resolvido, não a referência crua", () => {
    /* Sem o `->`, `autor` volta como `{_ref, _type}` e a assinatura sai
       vazia. É o erro mais comum de GROQ e não produz exceção nenhuma. */
    expect(GROQ_NOTICIA).toMatch(/autor\s*->/);
    expect(GROQ_NOTICIA).toContain("crm");
  });

  it("a página institucional é buscada por slug", () => {
    expect(GROQ_PAGINA).toContain("slug.current == $slug");
  });
});
```

- [ ] **Passo 2: rode e confirme que falha**

Comando: `npx vitest run testes/sanity-consultas.test.ts`
Esperado: FALHA com "Cannot find module '@/lib/sanity/consultas'".

- [ ] **Passo 3: escreva `lib/sanity/tipos.ts`**

```ts
import type { PortableTextBlock } from "@portabletext/react";

/*
  Formas de domínio do conteúdo editorial, em português, espelhando o que
  `lib/dados/tipos.ts` faz para o diretório. As páginas conhecem estes tipos e
  não a forma crua do Sanity, para que uma mudança de schema fique contida em
  `lib/sanity/`.
*/

export type ImagemSanity = {
  /* Referência do ativo. `lib/sanity/imagem.ts` a transforma em endereço. */
  asset: { _ref: string };
  alt: string;
  legenda?: string;
};

export type Autor = {
  nome: string;
  crm: string;
  crmUf: string;
  /* Vazio quando o autor não tem perfil publicado no diretório. */
  slugDoPerfil?: string;
};

export type ResumoNoticia = {
  titulo: string;
  slug: string;
  resumo: string;
  capa?: ImagemSanity;
  autor: Autor;
  publicadoEm: string;
};

export type Noticia = ResumoNoticia & {
  atualizadoEm?: string;
  corpo: PortableTextBlock[];
};

export type PaginaInstitucional = {
  titulo: string;
  slug: string;
  resumo: string;
  atualizadoEm: string;
  corpo: PortableTextBlock[];
};
```

- [ ] **Passo 4: escreva `lib/sanity/consultas.ts`**

```ts
import { defineQuery } from "next-sanity";
import { cliente } from "@/lib/sanity/cliente";
import type {
  Noticia,
  PaginaInstitucional,
  ResumoNoticia,
} from "@/lib/sanity/tipos";

/*
  A única porta de leitura do Sanity, espelhando o papel de `lib/dados/`.

  As consultas são constantes exportadas, e não texto embutido nas funções,
  porque os testes as inspecionam. Uma projeção GROQ errada não produz exceção
  nenhuma: o campo volta `undefined` e a tela fica com um buraco silencioso.
  Poder afirmar em teste que a projeção contém `crm` é a única defesa barata
  contra isso.
*/

/* --- etiquetas de cache ---
   O webhook da tarefa 4 invalida por estas strings. Elas são a junta entre os
   dois lados, então vivem aqui e nunca são escritas à mão do outro lado.

   O corte em 200 caracteres respeita o teto de 256 que o Next impõe a
   etiqueta. Um slug absurdamente longo não é caso realista, mas etiqueta
   recusada faria a invalidação falhar em silêncio. */
export const ETIQUETA_NOTICIAS = "noticias";
export const etiquetaDeNoticia = (slug: string) =>
  `noticia:${slug.slice(0, 200)}`;
export const etiquetaDePagina = (slug: string) =>
  `pagina:${slug.slice(0, 200)}`;

const PROJECAO_AUTOR = `autor->{nome, crm, crmUf, slugDoPerfil}`;
const PROJECAO_CAPA = `capa{asset, alt}`;

/*
  A fatia é interpolada no texto, e não passada como parâmetro.

  GROQ NÃO aceita parâmetro em fatia. `[0...$limite]` é recusado pelo
  analisador com "slicing must use constant numbers", porque a sintaxe de
  fatia é ambígua com a de filtro e o analisador exige literal ali. Descoberto
  na varredura anterior à execução; a primeira versão deste plano usava
  parâmetro e teria quebrado só contra o banco real, porque teste de string
  não alcança isso.

  Interpolar valor em consulta é injeção quando o valor vem de fora, então o
  limite passa por uma trava antes de virar texto: inteiro, entre 1 e 100. Hoje
  quem chama é sempre código nosso (a home pede 3, o índice pede 20), e a trava
  é justamente o que garante que continue assim depois que alguém acrescentar
  uma tela nova que passe um valor vindo da URL.
*/
export function groqListaNoticias(limite: number): string {
  const n = Math.trunc(limite);
  if (!Number.isFinite(n) || n < 1 || n > 100) {
    throw new Error(
      `Limite de notícias fora da faixa aceita, de 1 a 100: ${limite}`,
    );
  }

  return `
  *[_type == "noticia" && defined(slug.current)]
  | order(publicadoEm desc)[0...${n}]{
    titulo,
    "slug": slug.current,
    resumo,
    publicadoEm,
    ${PROJECAO_CAPA},
    ${PROJECAO_AUTOR}
  }
`;
}

export const GROQ_NOTICIA = defineQuery(`
  *[_type == "noticia" && slug.current == $slug][0]{
    titulo,
    "slug": slug.current,
    resumo,
    publicadoEm,
    atualizadoEm,
    ${PROJECAO_CAPA},
    ${PROJECAO_AUTOR},
    corpo[]{..., asset, alt, legenda}
  }
`);

export const GROQ_SLUGS_NOTICIAS = defineQuery(`
  *[_type == "noticia" && defined(slug.current)].slug.current
`);

export const GROQ_PAGINA = defineQuery(`
  *[_type == "paginaInstitucional" && slug.current == $slug][0]{
    titulo,
    "slug": slug.current,
    resumo,
    atualizadoEm,
    corpo
  }
`);

/* --- funções ---
   `next: { tags }` é o que liga a consulta à etiqueta. Sem `revalidate`
   declarado: o padrão do segmento (`export const revalidate = 3600` nas
   páginas) já dá o piso de tempo, e a invalidação por webhook cobre o resto.
   Declarar os dois aqui só criaria duas fontes de verdade sobre validade. */

export async function listarNoticias(limite = 20): Promise<ResumoNoticia[]> {
  return cliente.fetch(
    groqListaNoticias(limite),
    {},
    { next: { tags: [ETIQUETA_NOTICIAS] } },
  );
}

export async function noticiaPorSlug(slug: string): Promise<Noticia | null> {
  return cliente.fetch(
    GROQ_NOTICIA,
    { slug },
    /* Duas etiquetas: a específica, para quando esta matéria é editada, e a
       coletiva, para quando uma matéria nova entra e muda a navegação de
       "anterior/próxima" que a página desenha. */
    { next: { tags: [etiquetaDeNoticia(slug), ETIQUETA_NOTICIAS] } },
  );
}

export async function slugsDeNoticias(): Promise<string[]> {
  return cliente.fetch(
    GROQ_SLUGS_NOTICIAS,
    {},
    { next: { tags: [ETIQUETA_NOTICIAS] } },
  );
}

export async function paginaPorSlug(
  slug: string,
): Promise<PaginaInstitucional | null> {
  return cliente.fetch(
    GROQ_PAGINA,
    { slug },
    { next: { tags: [etiquetaDePagina(slug)] } },
  );
}
```

- [ ] **Passo 5: rode e confirme que passa**

Comando: `npx vitest run testes/sanity-consultas.test.ts`
Esperado: 9 testes PASSAM.

- [ ] **Passo 6: verificação de tipo e commit**

```bash
npx tsc --noEmit && npx eslint lib && npx vitest run
git add lib/sanity testes/sanity-consultas.test.ts
git commit -m "Camada de leitura do Sanity: consultas GROQ e etiquetas de cache"
```

---

## Tarefa 4: Webhook de revalidação

**Arquivos:**
- Criar: `app/api/revalidar/route.ts`
- Criar: `testes/revalidar.test.ts`
- Criar: `lib/sanity/etiquetasDoDocumento.ts`

**Interfaces:**
- Consome: `ETIQUETA_NOTICIAS`, `etiquetaDeNoticia`, `etiquetaDePagina` de `lib/sanity/consultas.ts`.
- Produz: `etiquetasDoDocumento(doc: { _type?: string; slug?: { current?: string } }): string[]` em `lib/sanity/etiquetasDoDocumento.ts`.

**Por que este arquivo separado:** a lógica de "que documento invalida que etiqueta" é pura e testável; o handler de rota não é, porque depende de assinatura HMAC e do `revalidateTag` do Next. Separados, o miolo tem teste de verdade e o handler fica com cinco linhas sem lógica.

- [ ] **Passo 1: escreva o teste que falha**

Crie `testes/revalidar.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { etiquetasDoDocumento } from "@/lib/sanity/etiquetasDoDocumento";

describe("etiquetasDoDocumento", () => {
  it("uma notícia invalida a própria matéria e o índice", () => {
    expect(
      etiquetasDoDocumento({
        _type: "noticia",
        slug: { current: "congresso-2026" },
      }).sort(),
    ).toEqual(["noticia:congresso-2026", "noticias"]);
  });

  it("uma página institucional invalida só ela mesma", () => {
    /* Página institucional não entra em listagem nenhuma, então invalidar o
       índice de notícias por causa dela seria descartar cache útil de graça. */
    expect(
      etiquetasDoDocumento({
        _type: "paginaInstitucional",
        slug: { current: "estatuto" },
      }),
    ).toEqual(["pagina:estatuto"]);
  });

  it("um autor invalida o índice inteiro de notícias", () => {
    /* O autor aparece resolvido dentro de cada notícia. Corrigir o CRM dele
       precisa alcançar todas as matérias que assinou, e o webhook não sabe
       quais são. Invalidar o coletivo é o custo de não manter um índice
       reverso para uma correção que acontece uma vez por ano. */
    expect(etiquetasDoDocumento({ _type: "autor" })).toEqual(["noticias"]);
  });

  it("documento sem slug não produz etiqueta específica", () => {
    expect(etiquetasDoDocumento({ _type: "noticia" })).toEqual(["noticias"]);
  });

  it("tipo desconhecido não invalida nada", () => {
    /* Um tipo novo criado no Studio não deve derrubar o cache do site inteiro
       por engano. Devolver lista vazia é o comportamento seguro. */
    expect(etiquetasDoDocumento({ _type: "algoNovo" })).toEqual([]);
    expect(etiquetasDoDocumento({})).toEqual([]);
  });
});
```

- [ ] **Passo 2: rode e confirme que falha**

Comando: `npx vitest run testes/revalidar.test.ts`
Esperado: FALHA com "Cannot find module".

- [ ] **Passo 3: escreva `lib/sanity/etiquetasDoDocumento.ts`**

```ts
import {
  ETIQUETA_NOTICIAS,
  etiquetaDeNoticia,
  etiquetaDePagina,
} from "@/lib/sanity/consultas";

type DocumentoDoWebhook = {
  _type?: string;
  slug?: { current?: string };
};

/*
  Traduz o documento que o Sanity mandou no webhook para as etiquetas de cache
  que precisam ser invalidadas.

  Separado do handler de rota porque isto é função pura e o handler não é:
  ele depende de assinatura HMAC e do `revalidateTag` do Next, nenhum dos dois
  testável barato. Aqui a regra fica coberta; lá sobram cinco linhas.
*/
export function etiquetasDoDocumento(doc: DocumentoDoWebhook): string[] {
  const slug = doc.slug?.current;

  switch (doc._type) {
    case "noticia":
      return slug
        ? [etiquetaDeNoticia(slug), ETIQUETA_NOTICIAS]
        : [ETIQUETA_NOTICIAS];

    case "paginaInstitucional":
      return slug ? [etiquetaDePagina(slug)] : [];

    case "autor":
      /* Ver o comentário longo no teste: o autor vem resolvido dentro de cada
         notícia, e o webhook não sabe quais ele assinou. */
      return [ETIQUETA_NOTICIAS];

    default:
      return [];
  }
}
```

- [ ] **Passo 4: rode e confirme que passa**

Comando: `npx vitest run testes/revalidar.test.ts`
Esperado: 5 testes PASSAM.

- [ ] **Passo 5: escreva o handler de rota**

`app/api/revalidar/route.ts`:

```ts
import { revalidateTag } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { parseBody } from "next-sanity/webhook";
import { etiquetasDoDocumento } from "@/lib/sanity/etiquetasDoDocumento";

/*
  Webhook do Sanity: publicar no Studio derruba o cache das páginas afetadas.

  Sem ele o site esperaria a hora de `revalidate = 3600`, e a AMI corrigiria
  um erro num comunicado sem ver a correção no ar. Com ele, é imediato.

  `parseBody` do next-sanity confere a assinatura HMAC do corpo contra o
  segredo. É isso que impede qualquer pessoa de descobrir o endereço e ficar
  derrubando o cache do site à vontade, que é negação de serviço barata: cada
  invalidação força a próxima visita a buscar tudo de novo no Sanity.
*/
export async function POST(req: NextRequest) {
  const segredo = process.env.SANITY_WEBHOOK_SECRET;
  if (!segredo) {
    /* Falhar fechado. Sem segredo configurado o endpoint fica aberto, e um
       endpoint aberto de invalidação é pior que endpoint nenhum. */
    return NextResponse.json(
      { erro: "SANITY_WEBHOOK_SECRET não configurado" },
      { status: 500 },
    );
  }

  const { isValidSignature, body } = await parseBody<{
    _type?: string;
    slug?: { current?: string };
  }>(req, segredo);

  if (!isValidSignature) {
    return NextResponse.json({ erro: "Assinatura inválida" }, { status: 401 });
  }

  if (!body?._type) {
    return NextResponse.json({ erro: "Corpo sem _type" }, { status: 400 });
  }

  const etiquetas = etiquetasDoDocumento(body);

  /* Dois argumentos, sempre. A forma `revalidateTag(etiqueta)` está depreciada
     no Next 16: ela expira a entrada na hora e faz a próxima requisição
     bloquear esperando o Sanity. Com "max", o visitante recebe a versão
     antiga na hora e a nova é buscada em segundo plano. */
  for (const etiqueta of etiquetas) {
    revalidateTag(etiqueta, "max");
  }

  return NextResponse.json({ revalidado: etiquetas });
}
```

- [ ] **Passo 6: configure o webhook no Sanity**

Peça ao usuário, com estes passos:
> 1. Invente uma frase longa e aleatória. Cole no `.env.local` em `SANITY_WEBHOOK_SECRET=`.
> 2. Em `sanity.io/manage`, projeto AMI → API → Webhooks → Create webhook.
> 3. **URL:** `https://SEU-DOMINIO/api/revalidar` (em desenvolvimento, use um túnel; sem ele o Sanity não alcança seu computador).
> 4. **Dataset:** production. **Trigger on:** Create, Update, Delete.
> 5. **HTTP method:** POST. **API version:** v2021-03-25 ou mais nova.
> 6. **Secret:** cole a mesma frase do passo 1.

- [ ] **Passo 7: verifique de ponta a ponta**

Com o segredo configurado, publique uma alteração numa notícia no Studio e confirme que o site reflete na recarga seguinte. Se não houver túnel disponível em desenvolvimento, confirme ao menos que uma requisição sem assinatura é recusada:

Comando: `curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:3000/api/revalidar -H "Content-Type: application/json" -d '{"_type":"noticia"}'`
Esperado: `401`.

- [ ] **Passo 8: commit**

```bash
npx tsc --noEmit && npx eslint app lib && npx vitest run
git add app/api lib/sanity/etiquetasDoDocumento.ts testes/revalidar.test.ts .env.local.exemplo
git commit -m "Webhook de revalidação: publicar no Sanity atualiza o site na hora"
```

---

## Tarefa 5: Texto rico e imagens do Sanity

**Arquivos:**
- Criar: `lib/sanity/imagem.ts`
- Criar: `components/editorial/TextoRico.tsx`
- Criar: `testes/sanity-imagem.test.ts`
- Modificar: `next.config.ts`

**Interfaces:**
- Consome: `ImagemSanity` de `lib/sanity/tipos.ts`; `projectId`, `dataset` de `sanity/env.ts`.
- Produz: `urlDaImagem(imagem: ImagemSanity, largura: number): string` em `lib/sanity/imagem.ts`; componente `<TextoRico blocos={...} />` em `components/editorial/TextoRico.tsx`.

- [ ] **Passo 1: escreva o teste que falha**

Crie `testes/sanity-imagem.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { urlDaImagem } from "@/lib/sanity/imagem";

const IMAGEM = {
  asset: { _ref: "image-abc123def456-1600x900-jpg" },
  alt: "Fachada da sede",
};

describe("urlDaImagem", () => {
  it("aponta para o CDN do Sanity", () => {
    expect(urlDaImagem(IMAGEM, 800)).toContain("cdn.sanity.io");
  });

  it("pede a largura solicitada", () => {
    expect(urlDaImagem(IMAGEM, 800)).toContain("w=800");
  });

  it("deixa o formato a cargo do navegador", () => {
    /* `auto=format` faz o CDN servir WebP ou AVIF a quem aceita, e JPEG a
       quem não aceita. É o ganho de peso mais barato do projeto: sem uma
       linha de código a mais, a mesma foto sai pela metade do tamanho. */
    expect(urlDaImagem(IMAGEM, 800)).toContain("auto=format");
  });

  it("recorta pelo ponto de interesse marcado no Studio", () => {
    /* Sem `fit=crop`, uma foto larga entra deformada num espaço quadrado. */
    expect(urlDaImagem(IMAGEM, 800)).toContain("fit=crop");
  });
});
```

- [ ] **Passo 2: rode e confirme que falha**

Comando: `npx vitest run testes/sanity-imagem.test.ts`
Esperado: FALHA com "Cannot find module '@/lib/sanity/imagem'".

- [ ] **Passo 3: escreva `lib/sanity/imagem.ts`**

```ts
import { createImageUrlBuilder } from "@sanity/image-url";
import { dataset, projectId } from "@/sanity/env";
import type { ImagemSanity } from "@/lib/sanity/tipos";

/*
  Endereço de uma imagem do Sanity, já dimensionada.

  `createImageUrlBuilder` nomeado, e não a exportação padrão: no
  `@sanity/image-url@2` a padrão está marcada como depreciada.

  O CDN do Sanity redimensiona e converte formato sob demanda, então não há
  `next/image` aqui: passar por ele significaria baixar a imagem inteira para
  o servidor do Next só para reduzi-la de novo, pagando duas vezes. O que o
  `next/image` daria de graça e aqui é feito à mão é a largura e a altura
  declaradas, que quem usa este helper precisa passar.
*/
const construtor = createImageUrlBuilder({ projectId, dataset });

export function urlDaImagem(imagem: ImagemSanity, largura: number): string {
  return construtor
    .image(imagem.asset)
    .width(largura)
    /* `fit=crop` com o ponto de interesse que a AMI marcou no Studio: sem
       ele, uma foto larga num espaço quadrado entra deformada ou com a
       cabeça de alguém cortada fora. */
    .fit("crop")
    .auto("format")
    .url();
}
```

- [ ] **Passo 4: rode e confirme que passa**

Comando: `npx vitest run testes/sanity-imagem.test.ts`
Esperado: 4 testes PASSAM.

- [ ] **Passo 5: escreva `components/editorial/TextoRico.tsx`**

```tsx
import Link from "next/link";
import { PortableText, type PortableTextComponents } from "@portabletext/react";
import type { PortableTextBlock } from "@portabletext/react";
import { urlDaImagem } from "@/lib/sanity/imagem";
import type { ImagemSanity } from "@/lib/sanity/tipos";

/*
  O texto que a AMI escreve no Studio, desenhado no sistema visual do site.

  Sem este mapeamento o PortableText emite `<h2>`, `<p>` e `<ul>` crus, que
  herdam só o que a camada base do `globals.css` define. Os cabeçalhos até
  saem certos, mas listas, citações e o respiro entre parágrafos ficam com o
  padrão do navegador, e o texto editorial passa a parecer colado de outro
  site. Aqui cada nó recebe as classes do projeto.
*/
const componentes: PortableTextComponents = {
  block: {
    normal: ({ children }) => (
      <p className="coluna-leitura mt-5 text-[18px] text-ink-600">{children}</p>
    ),
    h2: ({ children }) => (
      <h2 className="mt-12 border-b border-line-strong pb-3">{children}</h2>
    ),
    h3: ({ children }) => <h3 className="mt-9">{children}</h3>,
    blockquote: ({ children }) => (
      /* Fio à esquerda em vez de aspas grandes: a citação num site
         institucional é fonte, não ornamento. */
      <blockquote className="coluna-leitura mt-7 border-l-2 border-ami-green-600 py-1 pl-5 text-[19px] text-ink-600">
        {children}
      </blockquote>
    ),
  },

  list: {
    bullet: ({ children }) => (
      <ul className="coluna-leitura mt-5 list-disc space-y-2 pl-6 text-[18px] text-ink-600">
        {children}
      </ul>
    ),
    number: ({ children }) => (
      <ol className="coluna-leitura mt-5 list-decimal space-y-2 pl-6 text-[18px] text-ink-600">
        {children}
      </ol>
    ),
  },

  marks: {
    strong: ({ children }) => (
      <strong className="font-semibold text-ink-900">{children}</strong>
    ),
    link: ({ value, children }) => {
      const href: string = value?.href ?? "#";
      /* Link externo abre na mesma aba. Abrir em aba nova sem avisar rouba do
         leitor o controle do próprio navegador, e o botão voltar deixa de
         funcionar, que é a queixa mais comum de quem usa leitor de tela. */
      const externo = /^https?:\/\//.test(href);
      const classe =
        "font-semibold text-ami-green-600 underline underline-offset-2 hover:text-ami-green-700";

      return externo ? (
        <a href={href} className={classe} rel="noopener">
          {children}
        </a>
      ) : (
        <Link href={href} className={classe}>
          {children}
        </Link>
      );
    },
  },

  types: {
    image: ({ value }: { value: ImagemSanity }) => (
      <figure className="mt-9">
        {/* Moldura concêntrica, a mesma do bloco institucional da home. */}
        <div className="rounded-bloco border border-line bg-surface p-2 shadow-erguido">
          {/* eslint-disable-next-line @next/next/no-img-element --
              o CDN do Sanity já redimensiona e converte formato; ver o
              comentário em lib/sanity/imagem.ts. */}
          <img
            src={urlDaImagem(value, 1200)}
            alt={value.alt}
            width={1200}
            height={800}
            className="h-auto w-full rounded-[6px]"
          />
        </div>
        {value.legenda ? (
          <figcaption className="coluna-leitura mt-3 text-[15px] text-ink-400">
            {value.legenda}
          </figcaption>
        ) : null}
      </figure>
    ),
  },
};

export function TextoRico({ blocos }: { blocos: PortableTextBlock[] }) {
  return <PortableText value={blocos} components={componentes} />;
}
```

- [ ] **Passo 6: verifique que `next.config.ts` não precisa de mudança**

O `<img>` do passo anterior não passa pelo `next/image`, então **não** acrescente `remotePatterns` para `cdn.sanity.io`. Confirme que `next.config.ts` continua:

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {};

export default nextConfig;
```

- [ ] **Passo 7: verificação e commit**

```bash
npx tsc --noEmit && npx eslint components lib && npx vitest run
git add lib/sanity/imagem.ts components/editorial testes/sanity-imagem.test.ts
git commit -m "Texto rico do Sanity desenhado no sistema visual do site"
```

---

## Tarefa 6: Índice de notícias

**Arquivos:**
- Criar: `app/(site)/noticias/page.tsx`
- Criar: `components/editorial/LinhaNoticia.tsx`
- Modificar: `lib/formato.ts` (acrescentar `dataPorExtenso`)
- Modificar: `testes/formato.test.ts`

**Interfaces:**
- Consome: `listarNoticias` de `lib/sanity/consultas.ts`; `urlDaImagem` de `lib/sanity/imagem.ts`; `Cabeceira`, `EstadoVazio`, `JsonLd`.
- Produz: `dataPorExtenso(iso: string): string` em `lib/formato.ts`; componente `<LinhaNoticia noticia={...} />`.

- [ ] **Passo 1: escreva o teste que falha**

Acrescente a `testes/formato.test.ts`:

```ts
import { dataPorExtenso } from "@/lib/formato";

describe("dataPorExtenso", () => {
  it("escreve a data em português", () => {
    expect(dataPorExtenso("2026-08-21T14:30:00Z")).toBe("21 de agosto de 2026");
  });

  it("lê a data no fuso de Imperatriz, e não no do servidor", () => {
    /* O Studio grava o instante correspondente ao horário local de quem
       preencheu. Meia-noite de 1º de março em Imperatriz é 03:00 UTC, e é
       assim que a data volta do Sanity.

       Sem `timeZone` fixo, a Vercel formataria em UTC e a data sairia certa
       por acaso neste caso, mas errada para qualquer publicação da madrugada.
       Verificado com Intl antes de entrar no plano. */
    expect(dataPorExtenso("2026-03-01T03:00:00Z")).toBe("1 de março de 2026");
  });

  it("um instante de meia-noite UTC cai no dia anterior, e é isso mesmo", () => {
    /* 00:00 UTC é 21:00 do dia anterior em Imperatriz, e o leitor de lá deve
       ver o dia dele, não o de Greenwich. Documentado como teste em vez de
       contornado: um valor assim só aparece se alguém escrever a data direto
       pela API, sem passar pelo Studio.

       A primeira versão deste plano afirmava "1 de março" aqui, o que estava
       errado. Pego na varredura anterior à execução. */
    expect(dataPorExtenso("2026-03-01T00:00:00Z")).toBe("28 de fevereiro de 2026");
  });

  it("devolve string vazia para entrada inválida", () => {
    /* Data ausente é caso real: `atualizadoEm` é opcional no schema. Melhor
       não desenhar nada do que desenhar "Invalid Date". */
    expect(dataPorExtenso("")).toBe("");
    expect(dataPorExtenso("nao-e-data")).toBe("");
  });
});
```

- [ ] **Passo 2: rode e confirme que falha**

Comando: `npx vitest run testes/formato.test.ts`
Esperado: FALHA com "dataPorExtenso is not a function".

- [ ] **Passo 3: escreva `dataPorExtenso` em `lib/formato.ts`**

```ts
/*
  Data em português, por extenso.

  `timeZone` fixo em America/Fortaleza, que é o horário de Imperatriz e não
  tem horário de verão. Sem ele, a formatação segue o fuso de onde o processo
  roda: a Vercel roda em UTC, o computador de quem desenvolve roda em UTC-3, e
  a mesma notícia mostraria dias diferentes conforme o ambiente. Fixar o fuso
  da cidade é o que torna a data na tela igual à data que a AMI escolheu no
  Studio, em qualquer servidor.
*/
export function dataPorExtenso(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";

  return new Intl.DateTimeFormat("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "America/Fortaleza",
  }).format(d);
}
```

- [ ] **Passo 4: rode e confirme que passa**

Comando: `npx vitest run testes/formato.test.ts`
Esperado: todos PASSAM.

- [ ] **Passo 5: escreva `components/editorial/LinhaNoticia.tsx`**

```tsx
import Link from "next/link";
import { urlDaImagem } from "@/lib/sanity/imagem";
import { dataPorExtenso, identificacaoMedica } from "@/lib/formato";
import type { ResumoNoticia } from "@/lib/sanity/tipos";

/*
  Item do índice de notícias.

  Linha com miniatura à esquerda, e não grade de cartões: é a mesma gramática
  de `LinhaMedico`, e o site inteiro fica coerente. Grade de cartões também
  obrigaria toda matéria a ter capa, e a AMI vai publicar comunicado curto sem
  imagem.

  A assinatura traz CRM porque a Resolução CFM 2.336/2023 exige a inscrição ao
  lado do nome do médico, e conteúdo de saúde assinado sem CRM é exatamente o
  que o critério YMYL do Google penaliza.
*/
export function LinhaNoticia({ noticia }: { noticia: ResumoNoticia }) {
  return (
    <li className="group border-b border-line transition-colors duration-200 last:border-b-0 hover:bg-ami-mint-100/40">
      <Link
        href={`/noticias/${noticia.slug}`}
        className="flex flex-col gap-4 px-5 py-6 sm:flex-row sm:gap-6 md:px-6"
      >
        {noticia.capa ? (
          /* eslint-disable-next-line @next/next/no-img-element --
             o CDN do Sanity já redimensiona; ver lib/sanity/imagem.ts. */
          <img
            src={urlDaImagem(noticia.capa, 320)}
            alt={noticia.capa.alt}
            width={160}
            height={112}
            className="h-[112px] w-full shrink-0 rounded-bloco object-cover shadow-apoio sm:w-[160px]"
          />
        ) : null}

        <div className="min-w-0 flex-1">
          <p className="registro text-[14px] text-ink-400">
            {dataPorExtenso(noticia.publicadoEm)}
          </p>

          <h3 className="mt-1.5 font-titulo text-[23px] font-bold leading-[1.2] text-ink-900 transition-colors duration-200 [font-stretch:86%] group-hover:text-ami-green-600">
            {noticia.titulo}
          </h3>

          <p className="coluna-leitura mt-2 text-[16px] text-ink-600">
            {noticia.resumo}
          </p>

          <p className="registro mt-3 text-[14px] font-semibold text-ink-400">
            {noticia.autor.nome}
            {", "}
            {identificacaoMedica(noticia.autor.crm, noticia.autor.crmUf)}
          </p>
        </div>
      </Link>
    </li>
  );
}
```

- [ ] **Passo 6: escreva `app/(site)/noticias/page.tsx`**

```tsx
import type { Metadata } from "next";
import { Cabeceira } from "@/components/layout/Cabeceira";
import { EstadoVazio } from "@/components/base/EstadoVazio";
import { LinhaNoticia } from "@/components/editorial/LinhaNoticia";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbList } from "@/lib/seo/jsonld";
import { listarNoticias } from "@/lib/sanity/consultas";

export const revalidate = 3600;

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  title: "Notícias da AMI | Associação Médica de Imperatriz",
  description:
    "Comunicados, eventos e notas da Associação Médica de Imperatriz, " +
    "assinados por médicos com CRM.",
  alternates: { canonical: "/noticias" },
};

export default async function PaginaNoticias() {
  const noticias = await listarNoticias(20);

  const trilha = [
    { nome: "Início", caminho: "/" },
    { nome: "Notícias", caminho: "/noticias" },
  ];

  return (
    <>
      <JsonLd dados={breadcrumbList(trilha, SITE)} />

      <Cabeceira
        trilha={trilha}
        titulo="Notícias da AMI"
        contagem={noticias.length}
        rotuloContagem={
          noticias.length === 1 ? "publicação" : "publicações"
        }
      >
        Comunicados, eventos e notas da associação. Cada texto é assinado por
        um médico, com o número de inscrição no CRM.
      </Cabeceira>

      <div className="mx-auto max-w-[1200px] px-4 py-12 md:px-6">
        {noticias.length === 0 ? (
          <EstadoVazio
            titulo="Ainda não há publicações"
            descricao="Quando a AMI publicar a primeira notícia, ela aparece aqui."
          />
        ) : (
          <ul className="overflow-hidden rounded-bloco border border-line bg-surface shadow-apoio">
            {noticias.map((n) => (
              <LinhaNoticia key={n.slug} noticia={n} />
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
```

- [ ] **Passo 7: verifique no navegador**

Publique duas notícias no Studio, uma com capa e outra sem. Abra `/noticias`.
Esperado: as duas aparecem, a mais recente primeiro; a sem capa não deixa buraco no layout; a contagem na cabeceira bate; nenhuma rolagem horizontal em 375px de largura.

Depois despublique as duas e confirme o estado vazio. Republique.

- [ ] **Passo 8: commit**

```bash
npx tsc --noEmit && npx eslint app components lib && npx vitest run
git add "app/(site)/noticias" components/editorial/LinhaNoticia.tsx lib/formato.ts testes/formato.test.ts
git commit -m "Índice de notícias, com data por extenso no fuso de Imperatriz"
```

---

## Tarefa 7: Página da notícia

**Arquivos:**
- Criar: `app/(site)/noticias/[slug]/page.tsx`
- Modificar: `lib/seo/jsonld.ts` (acrescentar `newsArticle`)
- Modificar: `testes/jsonld.test.ts`

**Interfaces:**
- Consome: `noticiaPorSlug`, `slugsDeNoticias`; `TextoRico`; `dataPorExtenso`, `identificacaoMedica`.
- Produz: `newsArticle(n: Noticia, siteUrl: string)` em `lib/seo/jsonld.ts`.

- [ ] **Passo 1: escreva o teste que falha**

Acrescente a `testes/jsonld.test.ts`:

```ts
import { newsArticle } from "@/lib/seo/jsonld";

const NOTICIA = {
  titulo: "AMI abre inscrições para o congresso de 2026",
  slug: "congresso-2026",
  resumo: "As inscrições vão até 30 de setembro, com desconto para associados.",
  publicadoEm: "2026-08-21T12:00:00Z",
  atualizadoEm: "2026-08-22T09:00:00Z",
  autor: { nome: "Larissa Nogueira", crm: "10274", crmUf: "MA" },
  corpo: [],
};

describe("newsArticle", () => {
  it("declara o tipo e o endereço canônico", () => {
    const j = newsArticle(NOTICIA, "https://ami.org.br");
    expect(j["@type"]).toBe("NewsArticle");
    expect(j.mainEntityOfPage).toBe("https://ami.org.br/noticias/congresso-2026");
  });

  it("credita o autor com CRM", () => {
    /* Autoria verificável é o que separa conteúdo de saúde que ranqueia de
       conteúdo que o Google trata como anônimo. */
    const j = newsArticle(NOTICIA, "https://ami.org.br");
    expect(j.author.name).toBe("Larissa Nogueira");
    expect(JSON.stringify(j.author)).toContain("10274");
  });

  it("omite dateModified quando não houve revisão", () => {
    /* Repetir a data de publicação em dateModified diz ao Google que a
       matéria foi revisada no mesmo instante em que saiu, o que é falso e
       gasta o sinal de frescor sem entregar nada. */
    const j = newsArticle({ ...NOTICIA, atualizadoEm: undefined }, "https://x");
    expect(j).not.toHaveProperty("dateModified");
  });

  it("não emite nota nem avaliação", () => {
    /* CFM 2.336/2023, Art. 11, XIII. */
    const j = JSON.stringify(newsArticle(NOTICIA, "https://x"));
    expect(j).not.toContain("AggregateRating");
    expect(j).not.toContain("ratingValue");
  });
});
```

- [ ] **Passo 2: rode e confirme que falha**

Comando: `npx vitest run testes/jsonld.test.ts`
Esperado: FALHA com "newsArticle is not a function".

- [ ] **Passo 3: escreva `newsArticle` em `lib/seo/jsonld.ts`**

```ts
import type { Noticia } from "@/lib/sanity/tipos";

/*
  NewsArticle das publicações da AMI.

  `author` sai como Person com `identifier` carregando o CRM. Não existe
  propriedade padrão do schema.org para inscrição em conselho profissional, e
  `identifier` é o campo genérico previsto exatamente para registro externo.
  Inventar `crm: "10274"` produziria uma chave que nenhum consumidor lê.

  Nenhum `AggregateRating` em lugar nenhum: CFM 2.336/2023, Art. 11, XIII.
*/
export function newsArticle(
  n: Pick<
    Noticia,
    "titulo" | "slug" | "resumo" | "publicadoEm" | "atualizadoEm" | "autor"
  >,
  siteUrl: string,
) {
  return {
    "@context": "https://schema.org",
    "@type": "NewsArticle" as const,
    headline: n.titulo,
    description: n.resumo,
    mainEntityOfPage: `${siteUrl}/noticias/${n.slug}`,
    datePublished: n.publicadoEm,
    /* Espalhado condicionalmente: a chave some do objeto quando não houve
       revisão, em vez de sair como null, que o Google trata como valor. */
    ...(n.atualizadoEm ? { dateModified: n.atualizadoEm } : {}),
    author: {
      "@type": "Person" as const,
      name: n.autor.nome,
      identifier: `CRM/${n.autor.crmUf} ${n.autor.crm}`,
    },
    publisher: {
      "@type": "Organization" as const,
      name: "Associação Médica de Imperatriz",
      url: siteUrl,
    },
  };
}
```

- [ ] **Passo 4: rode e confirme que passa**

Comando: `npx vitest run testes/jsonld.test.ts`
Esperado: todos PASSAM.

- [ ] **Passo 5: escreva `app/(site)/noticias/[slug]/page.tsx`**

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Cabeceira } from "@/components/layout/Cabeceira";
import { TextoRico } from "@/components/editorial/TextoRico";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbList, newsArticle } from "@/lib/seo/jsonld";
import { noticiaPorSlug, slugsDeNoticias } from "@/lib/sanity/consultas";
import { urlDaImagem } from "@/lib/sanity/imagem";
import { dataPorExtenso, identificacaoMedica } from "@/lib/formato";

export const revalidate = 3600;

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const slugs = await slugsDeNoticias();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const n = await noticiaPorSlug(slug);
  if (!n) return {};

  return {
    title: `${n.titulo} | AMI`,
    description: n.resumo,
    alternates: { canonical: `/noticias/${slug}` },
  };
}

export default async function PaginaNoticia({ params }: Props) {
  const { slug } = await params;
  const n = await noticiaPorSlug(slug);
  if (!n) notFound();

  const trilha = [
    { nome: "Início", caminho: "/" },
    { nome: "Notícias", caminho: "/noticias" },
    { nome: n.titulo, caminho: `/noticias/${n.slug}` },
  ];

  return (
    <>
      <JsonLd dados={newsArticle(n, SITE)} />
      <JsonLd dados={breadcrumbList(trilha, SITE)} />

      <Cabeceira trilha={trilha} titulo={n.titulo}>
        {n.resumo}
      </Cabeceira>

      <article className="mx-auto max-w-[1200px] px-4 pb-16 md:px-6">
        {/* Assinatura e datas logo abaixo da cabeceira: num site de saúde é a
            primeira coisa que o leitor precisa poder conferir. */}
        <div className="flex flex-wrap items-baseline gap-x-5 gap-y-1 border-b border-line py-5">
          <p className="text-[16px] font-semibold text-ink-900">
            {n.autor.slugDoPerfil ? (
              <Link
                href={`/medico/${n.autor.slugDoPerfil}`}
                className="pressiona text-ami-green-600 underline underline-offset-2 hover:text-ami-green-700"
              >
                {n.autor.nome}
              </Link>
            ) : (
              n.autor.nome
            )}
          </p>
          <p className="registro text-[15px] text-ink-600">
            {identificacaoMedica(n.autor.crm, n.autor.crmUf)}
          </p>
          <p className="registro text-[15px] text-ink-400">
            Publicado em {dataPorExtenso(n.publicadoEm)}
          </p>
          {n.atualizadoEm ? (
            <p className="registro text-[15px] text-ink-400">
              Atualizado em {dataPorExtenso(n.atualizadoEm)}
            </p>
          ) : null}
        </div>

        {n.capa ? (
          <figure className="mt-8">
            <div className="rounded-bloco border border-line bg-surface p-2 shadow-erguido">
              {/* eslint-disable-next-line @next/next/no-img-element --
                  o CDN do Sanity já redimensiona; ver lib/sanity/imagem.ts. */}
              <img
                src={urlDaImagem(n.capa, 1400)}
                alt={n.capa.alt}
                width={1400}
                height={788}
                className="h-auto w-full rounded-[6px]"
              />
            </div>
          </figure>
        ) : null}

        <div className="mt-4">
          <TextoRico blocos={n.corpo} />
        </div>

        <p className="coluna-leitura mt-14 border-l-2 border-line-strong py-1 pl-5 text-[15px] text-ink-400">
          Conteúdo informativo publicado pela Associação Médica de Imperatriz.
          Não substitui a consulta médica.
        </p>

        <p className="mt-10">
          <Link
            href="/noticias"
            className="pressiona inline-flex min-h-11 items-center rounded-controle border border-line-strong bg-surface px-5 text-[15px] font-semibold text-ami-green-600 hover:border-ami-green-600 hover:bg-ami-mint-100"
          >
            Ver todas as notícias
          </Link>
        </p>
      </article>
    </>
  );
}
```

- [ ] **Passo 6: verifique no navegador**

Abra uma notícia. Esperado: título, assinatura com CRM, datas, capa emoldurada, texto com a tipografia do site, aviso final. Sem rolagem horizontal em 375px. Confirme o JSON-LD:

Comando: `curl -s http://localhost:3000/noticias/SEU-SLUG | grep -o '"@type":"NewsArticle"'`
Esperado: uma ocorrência.

- [ ] **Passo 7: commit**

```bash
npx tsc --noEmit && npx eslint app components lib && npx vitest run
git add "app/(site)/noticias/[slug]" lib/seo/jsonld.ts testes/jsonld.test.ts
git commit -m "Página da notícia, com NewsArticle e autoria por CRM"
```

---

## Tarefa 8: Diretoria — migração, dados e página

**Arquivos:**
- Criar: `supabase/migrations/0003_diretoria.sql`
- Criar: `supabase/seed/diretoria.sql`
- Criar: `lib/dados/diretoria.ts`
- Criar: `components/diretorio/CartaoDiretor.tsx`
- Criar: `app/(site)/associacao/diretoria/page.tsx`
- Criar: `testes/diretoria.test.ts`
- Modificar: `supabase/primeira-instalacao.sql` e `supabase/recarregar-dados.sql`

**Interfaces:**
- Consome: `clienteServidor()` de `lib/dados/cliente.ts`; `Placa` de `components/diretorio/Placa.tsx`; `identificacaoMedica` de `lib/formato.ts`.
- Produz: `type Diretor` e `listarDiretoria(): Promise<Diretor[]>` em `lib/dados/diretoria.ts`.

**Nota sobre a spec:** a seção 4 diz "A diretoria é tabela no Supabase", mas a seção 5 esquece de listá-la no modelo de dados. Esta tarefa fecha a lacuna. O desenho abaixo é a decisão; se conflitar com algo descoberto durante a execução, pare e pergunte em vez de improvisar.

- [ ] **Passo 1: escreva o teste que falha**

Crie `testes/diretoria.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { ordenarDiretoria, type Diretor } from "@/lib/dados/diretoria";

const D = (p: Partial<Diretor>): Diretor => ({
  id: 1,
  nome: "Fulano",
  cargo: "Diretor",
  ordem: 10,
  slugDoPerfil: null,
  crm: null,
  crmUf: null,
  foto: null,
  ...p,
});

describe("ordenarDiretoria", () => {
  it("respeita a ordem definida pela AMI", () => {
    /* A hierarquia da diretoria não é alfabética nem cronológica: presidente
       vem antes de vice, que vem antes de tesoureiro. Só a AMI sabe a ordem,
       e ela vive na coluna `ordem`. */
    const fora = [D({ id: 3, ordem: 30 }), D({ id: 1, ordem: 10 }), D({ id: 2, ordem: 20 })];
    expect(ordenarDiretoria(fora).map((d) => d.id)).toEqual([1, 2, 3]);
  });

  it("desempata por nome quando a ordem repete", () => {
    /* Dois vogais com a mesma ordem é caso normal. Sem desempate, a ordem
       na tela mudaria a cada consulta ao banco, e a página pareceria
       instável sem motivo. */
    const empate = [
      D({ id: 1, nome: "Zilda", ordem: 40 }),
      D({ id: 2, nome: "Ana", ordem: 40 }),
    ];
    expect(ordenarDiretoria(empate).map((d) => d.nome)).toEqual(["Ana", "Zilda"]);
  });

  it("não altera o array recebido", () => {
    const original = [D({ id: 2, ordem: 20 }), D({ id: 1, ordem: 10 })];
    ordenarDiretoria(original);
    expect(original.map((d) => d.id)).toEqual([2, 1]);
  });
});
```

- [ ] **Passo 2: rode e confirme que falha**

Comando: `npx vitest run testes/diretoria.test.ts`
Esperado: FALHA com "Cannot find module '@/lib/dados/diretoria'".

- [ ] **Passo 3: escreva a migração**

`supabase/migrations/0003_diretoria.sql`:

```sql
-- Diretoria da AMI.
--
-- `profissional_id` é opcional de propósito. A spec pede que a diretoria
-- aponte para perfis reais do diretório, e é isso que o laço faz quando
-- existe. Mas obrigar o laço criaria uma dependência que quebra o cadastro:
-- um diretor recém-eleito que ainda não foi publicado no diretório não
-- poderia ser cadastrado, e a página da diretoria ficaria desatualizada
-- justamente no mês em que mais gente a consulta.
--
-- Por isso `nome` e `cargo` são colunas próprias, não projeções do
-- profissional. Com laço, a página mostra a foto e o CRM do perfil e linka
-- para ele; sem laço, mostra nome e cargo em texto.

create table diretoria (
  id bigint generated always as identity primary key,
  profissional_id bigint references profissional (id) on delete set null,
  nome text not null,
  cargo text not null,
  -- Hierarquia, não alfabética: presidente antes de vice antes de tesoureiro.
  -- Números com folga (10, 20, 30) para inserir no meio sem renumerar tudo.
  ordem integer not null default 100,
  mandato_inicio date,
  mandato_fim date,
  publicado boolean not null default false
);

create index diretoria_ordem on diretoria (ordem, nome);

comment on column diretoria.nome is
  'Redundante em relação a profissional.nome de propósito: diretor pode não ter perfil publicado no diretório.';
```

- [ ] **Passo 4: escreva a política de leitura**

Acrescente ao fim de `supabase/migrations/0003_diretoria.sql`:

```sql
alter table diretoria enable row level security;

-- Mesma regra do resto do site: visitante anônimo lê só o que está publicado.
create policy leitura_diretoria on diretoria
  for select
  using (publicado = true);
```

- [ ] **Passo 5: escreva o seed**

`supabase/seed/diretoria.sql`:

```sql
-- Diretoria de demonstração. Os cargos são os de um estatuto típico de
-- associação médica; os nomes vêm do seed do diretório, para que o laço com
-- `profissional` exista de verdade e a página possa ser conferida.
--
-- Substituir pela diretoria real da AMI antes do lançamento. Enquanto estes
-- dados estiverem no ar, NEXT_PUBLIC_DADOS_DEMONSTRACAO continua "true" e o
-- robots.txt bloqueia o site inteiro.

insert into diretoria (profissional_id, nome, cargo, ordem, publicado)
select p.id, p.nome, v.cargo, v.ordem, true
from (values
  ('mayara-viana',     'Presidente',            10),
  ('rafael-coelho',    'Vice-presidente',       20),
  ('larissa-nogueira', 'Diretora científica',   30),
  ('tiago-barbosa',    'Tesoureiro',            40)
) as v (slug, cargo, ordem)
join profissional p on p.slug = v.slug;
```

Agora atualize os dois arquivos de colar-e-executar. **Atenção:** eles não são `include`, são concatenação do SQL inteiro. Abra `supabase/primeira-instalacao.sql` e confirme: o cabeçalho dele lista as partes que foram coladas ali dentro.

Em `supabase/primeira-instalacao.sql`:
1. No cabeçalho, acrescente `supabase/migrations/0003_diretoria.sql` e `supabase/seed/diretoria.sql` à lista de arquivos que ele reúne, e corrija a contagem de partes nos títulos `PARTE n de N`.
2. Cole o conteúdo inteiro de `0003_diretoria.sql` ao fim da parte das tabelas.
3. Cole o conteúdo inteiro de `seed/diretoria.sql` ao fim da parte dos dados.

Em `supabase/recarregar-dados.sql`:
1. Acrescente `diretoria` à lista de `truncate`, **antes** de `profissional`: a chave estrangeira `diretoria.profissional_id` impede o contrário.
2. Cole o conteúdo inteiro de `seed/diretoria.sql` ao fim, **depois** do seed que cria os profissionais, porque o insert casa por `p.slug`.

- [ ] **Passo 6: escreva `lib/dados/diretoria.ts`**

```ts
import { cache } from "react";
import { clienteServidor } from "@/lib/dados/cliente";

export type Diretor = {
  id: number;
  nome: string;
  cargo: string;
  ordem: number;
  /* Preenchidos só quando o diretor tem perfil publicado no diretório. */
  slugDoPerfil: string | null;
  crm: string | null;
  crmUf: string | null;
  foto: string | null;
};

/*
  Ordenação em memória e não no `order` do PostgREST.

  Não é preferência: a ordem precisa ser testável, e um `.order()` encadeado
  na consulta só é verificável com banco no ar. Com quatro a doze diretores,
  ordenar em memória não custa nada.
*/
export function ordenarDiretoria(lista: Diretor[]): Diretor[] {
  /* Cópia antes de ordenar: `sort` altera o array recebido, e o chamador pode
     estar segurando o resultado memoizado pelo `cache` do React. */
  return [...lista].sort(
    (a, b) => a.ordem - b.ordem || a.nome.localeCompare(b.nome, "pt-BR"),
  );
}

const SELECAO = `
  id, nome, cargo, ordem,
  profissional:profissional_id ( slug, crm, crm_uf, foto )
`;

export const listarDiretoria = cache(async (): Promise<Diretor[]> => {
  const { data, error } = await clienteServidor()
    .from("diretoria")
    .select(SELECAO)
    .eq("publicado", true);

  if (error) throw new Error(`Falha ao buscar a diretoria: ${error.message}`);

  const lista = (data ?? []).map((d): Diretor => {
    /* PostgREST devolve o embed como objeto ou como array conforme a
       cardinalidade que ele infere da chave estrangeira. Normalizado aqui
       para o resto do arquivo não precisar saber disso. */
    const p = Array.isArray(d.profissional) ? d.profissional[0] : d.profissional;
    return {
      id: d.id,
      nome: d.nome,
      cargo: d.cargo,
      ordem: d.ordem,
      slugDoPerfil: p?.slug ?? null,
      crm: p?.crm ?? null,
      crmUf: p?.crm_uf ?? null,
      foto: p?.foto ?? null,
    };
  });

  return ordenarDiretoria(lista);
});
```

- [ ] **Passo 7: rode e confirme que passa**

Comando: `npx vitest run testes/diretoria.test.ts`
Esperado: 3 testes PASSAM.

- [ ] **Passo 8: escreva `components/diretorio/CartaoDiretor.tsx`**

```tsx
import Link from "next/link";
import { Placa } from "@/components/diretorio/Placa";
import { identificacaoMedica } from "@/lib/formato";
import type { Diretor } from "@/lib/dados/diretoria";

/*
  Cartão de um membro da diretoria.

  O cargo vem antes do nome, em caixa alta pequena: numa página de diretoria a
  pergunta é "quem é o presidente", não "onde está a Mayara". É a única tela
  do site onde a função precede a pessoa.
*/
export function CartaoDiretor({ diretor }: { diretor: Diretor }) {
  const miolo = (
    <>
      <Placa nome={diretor.nome} foto={diretor.foto} tamanho={88} />
      <div className="min-w-0">
        <p className="font-titulo text-[13px] font-bold uppercase tracking-[0.1em] text-ami-green-600 [font-stretch:90%]">
          {diretor.cargo}
        </p>
        <p className="mt-1.5 font-titulo text-[21px] font-bold leading-tight [font-stretch:88%]">
          {diretor.nome}
        </p>
        {diretor.crm && diretor.crmUf ? (
          <p className="registro mt-1 text-[14px] text-ink-600">
            {identificacaoMedica(diretor.crm, diretor.crmUf)}
          </p>
        ) : null}
      </div>
    </>
  );

  const classe =
    "flex items-center gap-4 rounded-bloco border border-line bg-surface p-5 shadow-apoio";

  /* Sem perfil publicado, o cartão não é link: um link que leva a 404 é pior
     que texto. */
  return diretor.slugDoPerfil ? (
    <Link
      href={`/medico/${diretor.slugDoPerfil}`}
      className={`pressiona ${classe} hover:border-ami-green-600 hover:bg-ami-mint-100 hover:shadow-erguido`}
    >
      {miolo}
    </Link>
  ) : (
    <div className={classe}>{miolo}</div>
  );
}
```

- [ ] **Passo 9: escreva a página**

`app/(site)/associacao/diretoria/page.tsx`:

```tsx
import type { Metadata } from "next";
import { Cabeceira } from "@/components/layout/Cabeceira";
import { CartaoDiretor } from "@/components/diretorio/CartaoDiretor";
import { EstadoVazio } from "@/components/base/EstadoVazio";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbList } from "@/lib/seo/jsonld";
import { listarDiretoria } from "@/lib/dados/diretoria";

export const revalidate = 3600;

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  title: "Diretoria | Associação Médica de Imperatriz",
  description:
    "Quem responde pela Associação Médica de Imperatriz, com cargo, nome e " +
    "número de inscrição no CRM.",
  alternates: { canonical: "/associacao/diretoria" },
};

export default async function PaginaDiretoria() {
  const diretoria = await listarDiretoria();

  const trilha = [
    { nome: "Início", caminho: "/" },
    { nome: "A Associação", caminho: "/associacao" },
    { nome: "Diretoria", caminho: "/associacao/diretoria" },
  ];

  return (
    <>
      <JsonLd dados={breadcrumbList(trilha, SITE)} />

      <Cabeceira trilha={trilha} titulo="Diretoria da AMI">
        Quem responde pela associação. Cada nome traz o número de inscrição no
        CRM, e leva ao perfil no diretório quando há um publicado.
      </Cabeceira>

      <div className="mx-auto max-w-[1200px] px-4 py-12 md:px-6">
        {diretoria.length === 0 ? (
          <EstadoVazio
            titulo="Diretoria ainda não cadastrada"
            descricao="A composição da diretoria aparece aqui assim que a AMI a registrar."
          />
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2">
            {diretoria.map((d) => (
              <li key={d.id}>
                <CartaoDiretor diretor={d} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
```

- [ ] **Passo 10: rode a migração e verifique**

Peça ao usuário para colar `supabase/migrations/0003_diretoria.sql` e depois `supabase/seed/diretoria.sql` no SQL Editor do Supabase, nessa ordem. Depois abra `/associacao/diretoria`.
Esperado: quatro cartões, presidente primeiro, cada um linkando para o perfil.

- [ ] **Passo 11: commit**

```bash
npx tsc --noEmit && npx eslint app components lib && npx vitest run
git add supabase lib/dados/diretoria.ts components/diretorio/CartaoDiretor.tsx "app/(site)/associacao" testes/diretoria.test.ts
git commit -m "Diretoria: tabela, política de leitura e página linkada aos perfis"
```

---

## Tarefa 9: /associacao e as páginas de texto

**Arquivos:**
- Criar: `components/editorial/PaginaDeTexto.tsx`
- Criar: `app/(site)/associacao/page.tsx`
- Criar: `app/(site)/associacao/[pagina]/page.tsx`

**Interfaces:**
- Consome: `paginaPorSlug`; `TextoRico`; `Cabeceira`; `dataPorExtenso`.
- Produz: `<PaginaDeTexto slug={...} trilha={...} />` — Server Component assíncrono que busca a página no Sanity e desenha, ou chama `notFound()`.

**Cuidado com a colisão de rotas:** `app/(site)/associacao/diretoria/page.tsx` (tarefa 8) e `app/(site)/associacao/[pagina]/page.tsx` coexistem. O Next resolve segmento estático antes de dinâmico, então `/associacao/diretoria` cai na página da diretoria. Confirme isso no navegador antes de commitar.

- [ ] **Passo 1: escreva `components/editorial/PaginaDeTexto.tsx`**

```tsx
import { notFound } from "next/navigation";
import { Cabeceira } from "@/components/layout/Cabeceira";
import { TextoRico } from "@/components/editorial/TextoRico";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbList } from "@/lib/seo/jsonld";
import { paginaPorSlug } from "@/lib/sanity/consultas";
import { dataPorExtenso } from "@/lib/formato";
import type { ItemTrilha } from "@/components/layout/Breadcrumb";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

/*
  Corpo compartilhado de toda página de texto vinda do Sanity: /associacao,
  suas subpáginas e as três páginas legais.

  Existe como componente e não como rota dinâmica única porque os endereços
  não compartilham prefixo: /associacao/estatuto e /politica-de-privacidade
  moram em níveis diferentes da árvore, e a spec fixou os dois. Uma rota
  `[pagina]` na raiz engoliria qualquer caminho não reconhecido e o site
  perderia a capacidade de dar 404.

  A data de atualização sai visível, e não só no metadado: numa política de
  privacidade, saber de quando é a versão que se está lendo é a informação
  mais importante da página depois do próprio texto.
*/
export async function PaginaDeTexto({
  slug,
  trilha,
}: {
  slug: string;
  trilha: ItemTrilha[];
}) {
  const pagina = await paginaPorSlug(slug);
  if (!pagina) notFound();

  return (
    <>
      <JsonLd dados={breadcrumbList(trilha, SITE)} />

      <Cabeceira trilha={trilha} titulo={pagina.titulo}>
        {pagina.resumo}
      </Cabeceira>

      <div className="mx-auto max-w-[1200px] px-4 pb-16 md:px-6">
        <p className="registro border-b border-line py-5 text-[15px] text-ink-400">
          Atualizado em {dataPorExtenso(pagina.atualizadoEm)}
        </p>

        <div className="mt-2">
          <TextoRico blocos={pagina.corpo} />
        </div>
      </div>
    </>
  );
}
```

- [ ] **Passo 2: escreva a rota das subpáginas**

`app/(site)/associacao/[pagina]/page.tsx`:

```tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PaginaDeTexto } from "@/components/editorial/PaginaDeTexto";
import { paginaPorSlug } from "@/lib/sanity/consultas";

export const revalidate = 3600;

/*
  Lista fechada, espelhando as opções do campo `slug` no schema. Sem ela, um
  slug qualquer no endereço faria uma consulta ao Sanity que volta vazia e cai
  em 404 mesmo, só que depois de uma ida à rede. Com ela, o 404 é imediato e
  o `generateStaticParams` sabe o que pré-renderizar.
*/
const PAGINAS = ["beneficios", "estatuto", "politica-editorial"] as const;

type Props = { params: Promise<{ pagina: string }> };

export function generateStaticParams() {
  return PAGINAS.map((pagina) => ({ pagina }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { pagina } = await params;
  const conteudo = await paginaPorSlug(pagina);
  if (!conteudo) return {};

  return {
    title: `${conteudo.titulo} | AMI`,
    description: conteudo.resumo,
    alternates: { canonical: `/associacao/${pagina}` },
  };
}

export default async function SubpaginaDaAssociacao({ params }: Props) {
  const { pagina } = await params;
  if (!PAGINAS.includes(pagina as (typeof PAGINAS)[number])) notFound();

  const conteudo = await paginaPorSlug(pagina);
  if (!conteudo) notFound();

  return (
    <PaginaDeTexto
      slug={pagina}
      trilha={[
        { nome: "Início", caminho: "/" },
        { nome: "A Associação", caminho: "/associacao" },
        { nome: conteudo.titulo, caminho: `/associacao/${pagina}` },
      ]}
    />
  );
}
```

- [ ] **Passo 3: escreva `/associacao`**

`app/(site)/associacao/page.tsx`:

```tsx
import type { Metadata } from "next";
import { PaginaDeTexto } from "@/components/editorial/PaginaDeTexto";
import { paginaPorSlug } from "@/lib/sanity/consultas";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const conteudo = await paginaPorSlug("associacao");
  return {
    title: "A Associação Médica de Imperatriz",
    description:
      conteudo?.resumo ??
      "Quem é a AMI, o que faz e como se associar.",
    alternates: { canonical: "/associacao" },
  };
}

export default function PaginaAssociacao() {
  return (
    <PaginaDeTexto
      slug="associacao"
      trilha={[
        { nome: "Início", caminho: "/" },
        { nome: "A Associação", caminho: "/associacao" },
      ]}
    />
  );
}
```

- [ ] **Passo 4: crie o conteúdo provisório no Studio**

Crie no Studio as quatro páginas institucionais, com texto marcado `[PROVISÓRIO]`, seguindo o padrão já usado no rodapé e nas páginas de especialidade. Cada uma precisa de título, resumo entre 60 e 220 caracteres, data de atualização e ao menos um parágrafo de corpo.

- [ ] **Passo 5: verifique a resolução de rotas**

Abra `/associacao`, `/associacao/diretoria`, `/associacao/estatuto`, `/associacao/beneficios`, `/associacao/politica-editorial` e `/associacao/inventado`.
Esperado: as cinco primeiras renderizam corretamente, `/associacao/diretoria` mostra os cartões da tarefa 8 (e não a página de texto), e `/associacao/inventado` dá 404.

- [ ] **Passo 6: commit**

```bash
npx tsc --noEmit && npx eslint app components lib && npx vitest run
git add components/editorial/PaginaDeTexto.tsx "app/(site)/associacao"
git commit -m "/associacao e subpáginas, com o texto editável no Sanity"
```

---

## Tarefa 10: Páginas legais

**Arquivos:**
- Criar: `app/(site)/politica-de-privacidade/page.tsx`
- Criar: `app/(site)/termos-de-uso/page.tsx`
- Criar: `app/(site)/politica-de-cookies/page.tsx`

**Interfaces:**
- Consome: `PaginaDeTexto`, `paginaPorSlug`.
- Produz: nada consumido por tarefas seguintes, exceto os três endereços que a tarefa 11 linka no rodapé.

Três arquivos quase idênticos, e não uma rota dinâmica: uma rota `[pagina]` na raiz capturaria qualquer caminho não reconhecido do site inteiro e destruiria os 404. Explícito é a escolha segura aqui.

- [ ] **Passo 1: escreva as três páginas**

`app/(site)/politica-de-privacidade/page.tsx`:

```tsx
import type { Metadata } from "next";
import { PaginaDeTexto } from "@/components/editorial/PaginaDeTexto";
import { paginaPorSlug } from "@/lib/sanity/consultas";

export const revalidate = 3600;

const SLUG = "politica-de-privacidade";

export async function generateMetadata(): Promise<Metadata> {
  const conteudo = await paginaPorSlug(SLUG);
  return {
    title: "Política de privacidade | AMI",
    description:
      conteudo?.resumo ??
      "Como a Associação Médica de Imperatriz trata dados pessoais.",
    alternates: { canonical: `/${SLUG}` },
  };
}

export default function PaginaPrivacidade() {
  return (
    <PaginaDeTexto
      slug={SLUG}
      trilha={[
        { nome: "Início", caminho: "/" },
        { nome: "Política de privacidade", caminho: `/${SLUG}` },
      ]}
    />
  );
}
```

`app/(site)/termos-de-uso/page.tsx`:

```tsx
import type { Metadata } from "next";
import { PaginaDeTexto } from "@/components/editorial/PaginaDeTexto";
import { paginaPorSlug } from "@/lib/sanity/consultas";

export const revalidate = 3600;

const SLUG = "termos-de-uso";

export async function generateMetadata(): Promise<Metadata> {
  const conteudo = await paginaPorSlug(SLUG);
  return {
    title: "Termos de uso | AMI",
    description:
      conteudo?.resumo ??
      "Condições de uso do site da Associação Médica de Imperatriz.",
    alternates: { canonical: `/${SLUG}` },
  };
}

export default function PaginaTermos() {
  return (
    <PaginaDeTexto
      slug={SLUG}
      trilha={[
        { nome: "Início", caminho: "/" },
        { nome: "Termos de uso", caminho: `/${SLUG}` },
      ]}
    />
  );
}
```

`app/(site)/politica-de-cookies/page.tsx`:

```tsx
import type { Metadata } from "next";
import { PaginaDeTexto } from "@/components/editorial/PaginaDeTexto";
import { paginaPorSlug } from "@/lib/sanity/consultas";

export const revalidate = 3600;

const SLUG = "politica-de-cookies";

export async function generateMetadata(): Promise<Metadata> {
  const conteudo = await paginaPorSlug(SLUG);
  return {
    title: "Política de cookies | AMI",
    description:
      conteudo?.resumo ?? "Quais cookies este site usa e para quê.",
    alternates: { canonical: `/${SLUG}` },
  };
}

export default function PaginaCookies() {
  return (
    <PaginaDeTexto
      slug={SLUG}
      trilha={[
        { nome: "Início", caminho: "/" },
        { nome: "Política de cookies", caminho: `/${SLUG}` },
      ]}
    />
  );
}
```

- [ ] **Passo 2: crie os três documentos no Studio**

Marque tudo com `[PROVISÓRIO]`. O texto precisa de revisão por advogado de direito médico antes do lançamento — a spec já registra isso na seção 13, e é uma pendência do cliente, não do desenvolvimento.

No corpo da política de privacidade, inclua ao menos:
- que dado o site coleta hoje (nenhum de saúde, nenhum formulário)
- que este site **não** coleta sintoma nem diagnóstico
- como falar com a AMI sobre dados pessoais
- a base legal e o encarregado, ambos `[PROVISÓRIO]`

- [ ] **Passo 3: verifique e commite**

Abra as três. Esperado: renderizam com a data de atualização visível e o texto do Studio.

```bash
npx tsc --noEmit && npx eslint app && npx vitest run
git add "app/(site)/politica-de-privacidade" "app/(site)/termos-de-uso" "app/(site)/politica-de-cookies"
git commit -m "Páginas legais, com texto provisório editável no Sanity"
```

---

## Tarefa 11: Costura — menu, rodapé, sitemap e notícias na home

**Arquivos:**
- Modificar: `components/layout/MenuPrincipal.tsx`
- Modificar: `components/layout/Rodape.tsx`
- Modificar: `app/sitemap.ts`
- Modificar: `app/(site)/page.tsx`
- Criar: `components/editorial/UltimasNoticias.tsx`

**Interfaces:**
- Consome: `listarNoticias`, `LinhaNoticia`, `slugsDeNoticias`.
- Produz: `<UltimasNoticias />` — Server Component sem props.

- [ ] **Passo 1: acrescente Notícias ao menu**

Em `components/layout/MenuPrincipal.tsx`, no array `MENU`:

```ts
const MENU = [
  { rotulo: "Buscar médicos", href: "/medicos" },
  { rotulo: "Notícias", href: "/noticias" },
  { rotulo: "A Associação", href: "/associacao" },
];
```

Depois confira a restrição do sistema visual: **a navegação tem de caber numa linha só no desktop, com no máximo 80px de altura.** Verifique em 1024px de largura. Se três itens mais a marca não couberem, encurte os rótulos antes de considerar qualquer outra saída.

- [ ] **Passo 2: acrescente as páginas legais ao rodapé**

Em `components/layout/Rodape.tsx`, na coluna "A Associação", acrescente os links para `/associacao/diretoria`, `/noticias` e `/associacao/beneficios`. E, no bloco inferior de créditos, acrescente uma linha com os três links legais:

```tsx
        <div className="mt-12 border-t border-ami-green-700 pt-6 text-[15px]">
          <nav aria-label="Informações legais">
            <ul className="flex flex-wrap gap-x-6 gap-y-1">
              {[
                { rotulo: "Política de privacidade", href: "/politica-de-privacidade" },
                { rotulo: "Termos de uso", href: "/termos-de-uso" },
                { rotulo: "Política de cookies", href: "/politica-de-cookies" },
              ].map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="flex items-center py-1 hover:text-white hover:underline max-md:min-h-11 max-md:py-0"
                  >
                    {l.rotulo}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* o restante do bloco de créditos permanece como está */}
```

- [ ] **Passo 3: acrescente notícias e institucional ao sitemap**

Em `app/sitemap.ts`, junto ao array `fixas`, acrescente as rotas novas, e depois as notícias vindas do Sanity:

```ts
  const fixas: MetadataRoute.Sitemap = [
    { url: `${SITE}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE}/medicos`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE}/noticias`, changeFrequency: "daily", priority: 0.8 },
    { url: `${SITE}/associacao`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE}/associacao/diretoria`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE}/associacao/beneficios`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE}/associacao/estatuto`, changeFrequency: "yearly", priority: 0.4 },
    { url: `${SITE}/associacao/politica-editorial`, changeFrequency: "yearly", priority: 0.4 },
    { url: `${SITE}/politica-de-privacidade`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE}/termos-de-uso`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE}/politica-de-cookies`, changeFrequency: "yearly", priority: 0.3 },
    /* as demais entradas fixas que já existem permanecem */
  ];

  /* As notícias entram pelo Sanity. `slugsDeNoticias` é uma consulta só, sem
     projeção de corpo: o sitemap não pode custar uma volta por matéria. */
  const noticias: MetadataRoute.Sitemap = (await slugsDeNoticias()).map(
    (slug) => ({
      url: `${SITE}/noticias/${slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    }),
  );
```

E troque a última linha da função, que hoje é:

```ts
  return [...fixas, ...especialidades, ...cruzamentos, ...perfis];
```

por:

```ts
  return [...fixas, ...especialidades, ...cruzamentos, ...perfis, ...noticias];
```

Não esqueça de importar `slugsDeNoticias` de `@/lib/sanity/consultas` no topo do arquivo.

- [ ] **Passo 4: escreva `components/editorial/UltimasNoticias.tsx`**

```tsx
import Link from "next/link";
import { LinhaNoticia } from "@/components/editorial/LinhaNoticia";
import { listarNoticias } from "@/lib/sanity/consultas";

/*
  Bloco de últimas notícias na home.

  É o primeiro passo para uma home que não desemboca só no diretório: até
  agora o site tinha médicos e mais nada para mostrar, e uma home é tão
  atrativa quanto o material que ela pode exibir.

  Devolve null quando não há publicação. Título de seção sobre lista vazia
  promete conteúdo que não está lá, e numa home isso é pior do que a seção não
  existir.
*/
export async function UltimasNoticias() {
  const noticias = await listarNoticias(3);
  if (noticias.length === 0) return null;

  return (
    <section
      aria-labelledby="ultimas-noticias"
      className="revelar mx-auto max-w-[1200px] px-4 py-16 md:px-6 md:py-20"
    >
      <div className="flex items-baseline justify-between gap-4 border-b border-line-strong pb-4">
        <h2 id="ultimas-noticias">Da associação</h2>
        <Link
          href="/noticias"
          className="pressiona shrink-0 text-[15px] font-semibold text-ami-green-600 hover:underline"
        >
          Ver todas
        </Link>
      </div>

      <ul className="mt-6 overflow-hidden rounded-bloco border border-line bg-surface shadow-apoio">
        {noticias.map((n) => (
          <LinhaNoticia key={n.slug} noticia={n} />
        ))}
      </ul>
    </section>
  );
}
```

- [ ] **Passo 5: encaixe o bloco na home**

Em `app/(site)/page.tsx`, insira `<UltimasNoticias />` **entre** a seção 4 (institucional, com a fotografia) e a seção 5 (bairros).

Por que ali: a seção 3 é o índice de especialidades e a 5 são os ladrilhos de bairro; as duas são navegação do diretório. Enfiar notícias no meio delas quebraria a leitura. Depois do bloco institucional, a sequência fica "o que a AMI é" e em seguida "o que a AMI andou dizendo", que é uma progressão que se lê.

Confira a restrição do sistema visual: a home passa a ter 6 seções, com teto de `ceil(6/3) = 2` rótulos em caixa alta acima de título de seção. A home usa 1 hoje ("BUSCAR NO DIRETÓRIO"). `UltimasNoticias` não acrescenta nenhum. Continua dentro do teto.

- [ ] **Passo 6: verificação final completa**

```bash
npx tsc --noEmit
npx eslint app components lib sanity
npx vitest run
npx next build
```

Esperado: build limpo, todos os testes passando.

Depois, no navegador:
- `/` mostra o bloco de notícias no lugar certo
- o menu cabe numa linha em 1024px
- os três links legais funcionam a partir do rodapé
- `curl -s http://localhost:3000/sitemap.xml | grep -c "<url>"` cresceu na quantidade certa
- nenhuma rolagem horizontal em 375px em nenhuma página nova

Rode a varredura de tipografia proibida nas páginas novas:

```bash
node -e '
const paginas = ["/noticias", "/associacao", "/associacao/diretoria", "/politica-de-privacidade"];
const limpo = (h) => h.replace(/<script[\s\S]*?<\/script>/g," ").replace(/<style[\s\S]*?<\/style>/g," ").replace(/<[^>]+>/g," ").replace(/\s+/g," ");
(async () => {
  for (const p of paginas) {
    const t = limpo(await (await fetch("http://localhost:3000" + p)).text());
    const travessoes = (t.match(/[–—]/g) || []).length;
    console.log(p, "travessões:", travessoes);
  }
})();
'
```
Esperado: zero em todas.

- [ ] **Passo 7: commit**

```bash
git add components/layout components/editorial/UltimasNoticias.tsx app/sitemap.ts "app/(site)/page.tsx"
git commit -m "Costura: notícias no menu, legais no rodapé, sitemap e bloco na home"
```

---

## Depois deste plano

Pendências que este plano deixa em aberto de propósito, para o diário do projeto:

1. **Conteúdo real.** Todo texto institucional e legal entra `[PROVISÓRIO]`. A revisão por advogado de direito médico continua sendo pendência do cliente, registrada na seção 13 da spec.
2. **Fotografias.** Os dois espaços declarados em `lib/imagens.ts` continuam com moldura FPO. As notícias agora aceitam imagem própria pelo Sanity, o que é caminho independente.
3. **Rascunho e pré-visualização.** O cliente está fixado em `perspective: "published"`, então a AMI não vê rascunho no site antes de publicar. `next-sanity` traz `draft-mode` e `visual-editing` para isso. Ficou fora por escopo; vale reavaliar quando a AMI começar a escrever de verdade.
4. **Paginação de `/noticias`.** O índice mostra 20 e para. Com a AMI publicando um comunicado por semana, isso dura cinco meses. Entra quando houver volume.
5. **Modo escuro.** Continua não implementado no site inteiro, pelo motivo registrado no diário em 21/08/2026.
