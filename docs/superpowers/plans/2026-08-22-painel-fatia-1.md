# Painel da agência, fatia 1 — plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Entrar no painel com e-mail e senha, listar os médicos incluindo os despublicados, pôr e tirar do ar um a um, e editar os campos do próprio médico.

**Architecture:** A sessão da pessoa logada é quem escreve no banco — nenhuma chave privilegiada chega ao site publicado. As permissões são políticas do Postgres, e a tela apenas evita mostrar botão que o banco recusaria. `proxy.ts` renova o cookie e faz o desvio otimista; cada página confere de novo com `exigirAdmin()`, nunca o layout.

**Tech Stack:** Next.js 16 (App Router), `@supabase/ssr@0.12.4`, `@supabase/supabase-js`, React 19 (`useActionState`), Tailwind v4, vitest.

**Spec:** [`docs/superpowers/specs/2026-08-22-painel-fatia-1-design.md`](../specs/2026-08-22-painel-fatia-1-design.md)

## Global Constraints

Valem para **toda** tarefa; não se repetem em cada uma.

- **Português** em todo identificador, comentário, texto de tela e mensagem de commit. `crmUf` no domínio, `crm_uf` no banco.
- **Nenhuma chave privilegiada no aplicativo.** `lib/dados/cliente.ts` e o painel usam a chave pública; quem dá poder de escrita é a sessão do usuário. A chave `SUPABASE_CHAVE_IMPORTADOR` é do importador, mora em `scripts/`, e **nada sob `app/` ou `lib/` pode lê-la**.
- **`lib/dados/cliente.ts` não é tocado.** O site público continua exatamente como está.
- **Nenhuma política de `delete`, em tabela nenhuma.** Despublicar é `publicado = false`.
- **A conferência de permissão fica em cada página, nunca no layout.**
- **`getUser()`, nunca `getSession()`**, para decidir quem é a pessoa.
- **Testes em `testes/`**, nomeados `painel-*.test.ts`, com `describe`/`it` do vitest e alias `@/`. Rodam com `npx vitest run`.
- **CRLF:** o repositório está num checkout Windows. Ao editar arquivo existente por script, normalize com `.replace(/\r\n/g, "\n")` antes de casar padrão.
- **Commits em português**, no imperativo, terminando com `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>`.

### Fatos das APIs, medidos em 22/08/2026 — não confiar em memória

Este projeto roda um Next.js cujo `AGENTS.md` avisa que as APIs diferem do treinamento. As três abaixo foram medidas na documentação instalada e nos tipos do pacote.

| O que **não** funciona | O que funciona | Onde foi medido |
|---|---|---|
| `middleware.ts` com `export function middleware` | **`proxy.ts`** na raiz, com `export function proxy` e `export const config = { matcher }` | `03-file-conventions/middleware.md` marca o nome antigo como descontinuado |
| `setAll(cookies)` com um argumento | **`setAll(cookies, headers)`** — o segundo traz cabeçalhos de não-cachear | tipo `SetAllCookies` em `@supabase/ssr/dist/main/types.d.ts` |
| `useFormStatus` separado | **`useActionState`** devolve `[state, formAction, pending]`, e a ação recebe `(estadoAnterior, formData)` | `02-guides/forms.md` |

Outros fatos medidos:

- `NextResponse.next()` aceita `MiddlewareResponseInit`; a forma documentada para repassar cabeçalhos é `NextResponse.next({ request: { headers } })`
- No `proxy`, os cookies vêm de `request.cookies.getAll()` e vão para `resposta.cookies.set(nome, valor, opcoes)`
- `revalidatePath(path, type)` aceita grupo de rota no caminho: `revalidatePath('/(main)/post/[slug]', 'layout')` é exemplo da própria documentação
- O cliente do `@supabase/ssr` expõe `signInWithPassword`, `signInWithOtp`, `signOut`, `getUser`, `getSession` e `getClaims`
- O projeto **não tem biblioteca de validação**, e não ganha uma aqui
- O projeto **não tem estilo de formulário em `globals.css`**; os campos são estilizados com Tailwind na marca. Botão primário existente: `pressiona inline-flex min-h-12 items-center rounded-controle bg-ami-green-600 px-6 text-[15px] font-semibold text-white shadow-apoio hover:bg-ami-green-700`

### Fatos do banco que o plano assume

De `supabase/migrations/0001_diretorio.sql` e `0002_rls.sql`:

- `profissional` tem `id, slug, nome, crm, crm_uf, foto, bio, telemedicina, associado_ami, situacao, verificado_em, publicado, criado_em, atualizado_em`
- `situacao` é `text not null default 'ativo' check (situacao in ('ativo','inativo'))`
- A RLS já está ligada em dez tabelas, e **todas as políticas existentes são `for select`**
- `local_publicado(id)` é `security definer set search_path = public` — o precedente que a função nova segue
- `auth.uid()` é a função do Supabase que devolve o id da conta logada

---

## Estrutura de arquivos

| Arquivo | Responsabilidade | Tarefa |
|---|---|---|
| `supabase/migrations/0005_painel.sql` | tabela, função, políticas | 1 |
| `supabase/testes-rls.sql` | asserções das políticas, para colar no editor | 1 |
| `testes/painel-migracao.test.ts` | garante que nenhuma política de remoção entre | 1 |
| `lib/painel/servidor.ts` | cliente do Supabase com a sessão | 2 |
| `proxy.ts` | renova o cookie e desvia quem não tem sessão | 2 |
| `lib/painel/sessao.ts` | `exigirAdmin()` — a camada que decide | 3 |
| `app/painel/layout.tsx` | casca visual e `noindex` | 3 |
| `app/painel/entrar/page.tsx` | tela de entrar | 4 |
| `app/painel/entrar/acoes.ts` | entrar e sair | 4 |
| `components/painel/FormularioEntrar.tsx` | formulário (cliente) | 4 |
| `lib/painel/medico.ts` | validação pura e "o que falta" | 5 |
| `lib/painel/consultas.ts` | listar e buscar médicos | 6 |
| `app/painel/page.tsx` | a lista | 6 |
| `components/painel/LinhaDoPainel.tsx` | uma linha da lista | 6 |
| `app/painel/acoes.ts` | publicar e despublicar | 7 |
| `app/painel/medico/[id]/page.tsx` | edição | 8 |
| `components/painel/FormularioMedico.tsx` | formulário (cliente) | 8 |
| `app/painel/medico/[id]/acoes.ts` | salvar | 8 |
| `docs/como-criar-a-conta-do-painel.md` | passos numerados, com nome de botão | 9 |

---

## Task 1: A migração e as asserções de política

**Files:**
- Create: `supabase/migrations/0005_painel.sql`
- Create: `supabase/testes-rls.sql`
- Test: `testes/painel-migracao.test.ts`

**Interfaces:**
- Consumes: o esquema de `0001_diretorio.sql` e as políticas de `0002_rls.sql`
- Produces: a tabela `perfil_usuario`, a função `eh_admin()`, e as políticas que as tarefas 6, 7 e 8 dependem

- [ ] **Step 1: Escrever o teste que falha, em `testes/painel-migracao.test.ts`**

```ts
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

/*
  A migração do painel é a primeira do projeto que concede escrita.

  Este teste é grosseiro de propósito: ele lê o SQL e falha se aparecer
  concessão de remoção. Com a segurança de linha ligada e sem política de
  `delete`, o Postgres recusa remoção de qualquer pessoa por qualquer
  caminho — inclusive do admin. É a mesma garantia que o importador tem, aqui
  no lugar onde ela é mais barata de perder.
*/
function fonte(relativo: string): string {
  return readFileSync(fileURLToPath(new URL(relativo, import.meta.url)), "utf8");
}

describe("0005_painel.sql", () => {
  const sql = fonte("../supabase/migrations/0005_painel.sql").toLowerCase();

  it("não concede remoção em tabela nenhuma", () => {
    expect(sql).not.toMatch(/for\s+delete/);
    expect(sql).not.toMatch(/\bdrop\s+table\b/);
    expect(sql).not.toMatch(/\btruncate\b/);
  });

  it("liga a segurança de linha na tabela nova", () => {
    expect(sql).toMatch(/alter\s+table\s+perfil_usuario\s+enable\s+row\s+level\s+security/);
  });

  it("a função de papel é security definer com search_path fixo", () => {
    /* Sem `security definer`, a política que consulta perfil_usuario dispara a
       política de perfil_usuario e recursa. Sem `search_path` fixo, alguém
       troca o significado da tabela por um objeto homônimo. */
    expect(sql).toMatch(/create\s+function\s+eh_admin[\s\S]*security\s+definer/);
    expect(sql).toMatch(/create\s+function\s+eh_admin[\s\S]*set\s+search_path\s*=\s*public/);
  });

  it("concede escrita apenas em profissional nesta fatia", () => {
    const escritas = [...sql.matchAll(/create\s+policy\s+\S+\s+on\s+(\S+)\s+for\s+(insert|update)/g)];
    const tabelas = [...new Set(escritas.map((m) => m[1]))];
    expect(tabelas).toEqual(["profissional"]);
  });
});

describe("supabase/testes-rls.sql", () => {
  const sql = fonte("../supabase/testes-rls.sql").toLowerCase();

  it("cobre as seis asserções que a especificação exige", () => {
    for (const marca of [
      "visitante nao ve despublicado",
      "admin ve despublicado",
      "visitante nao grava",
      "admin grava",
      "ninguem apaga",
      "conta sem perfil nao ve nada",
    ]) {
      expect(sql, `falta a asserção "${marca}"`).toContain(marca);
    }
  });
});
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `npx vitest run testes/painel-migracao.test.ts`
Expected: FAIL com `ENOENT` — os dois arquivos SQL ainda não existem.

- [ ] **Step 3: Escrever `supabase/migrations/0005_painel.sql`**

```sql
-- O painel da agência: quem é quem, e quem pode escrever.
--
-- Esta é a primeira migração do projeto que concede escrita. Até aqui as dez
-- políticas existentes eram todas `for select`, e o banco só sabia ler.

create table perfil_usuario (
  id              uuid primary key references auth.users (id) on delete cascade,
  papel           text not null check (papel in ('admin', 'associado')),
  profissional_id bigint references profissional (id) on delete set null,
  criado_em       timestamptz not null default now(),
  -- Associado é sempre associado de alguém. Admin não precisa ser médico.
  constraint associado_tem_medico
    check (papel <> 'associado' or profissional_id is not null)
);

alter table perfil_usuario enable row level security;

-- Cada conta lê a própria linha, e só. Não existe política de escrita nesta
-- tabela, nem para admin: quem pode dar papel de admin é quem tem acesso ao
-- banco. As linhas nascem coladas no editor SQL, como o resto da instalação.
create policy leitura_do_proprio_perfil on perfil_usuario
  for select using (id = auth.uid());

/*
  Quem está pedindo é admin?

  `security definer` é obrigatório pelo mesmo motivo que já obrigou em
  `local_publicado` (0002_rls.sql): sem ele, a política que consulta
  perfil_usuario dispara a política de perfil_usuario, e recursa. O
  `search_path` fixo impede que alguém troque o significado de
  `perfil_usuario` por um objeto homônimo.
*/
create function eh_admin() returns boolean
  language sql stable security definer set search_path = public
  as $$
    select exists (
      select 1 from perfil_usuario
      where id = auth.uid() and papel = 'admin')
  $$;

/*
  Admin enxerga o que não está publicado.

  Políticas somam: a de leitura do visitante continua `publicado = true` e não
  afrouxa. Vale para as tabelas dependentes também, porque a lista do painel
  precisa mostrar especialidade e bairro de quem ainda não está no ar.
*/
create policy admin_le_profissional     on profissional            for select using (eh_admin());
create policy admin_le_prof_esp         on profissional_especialidade for select using (eh_admin());
create policy admin_le_formacao         on formacao                for select using (eh_admin());
create policy admin_le_estabelecimento  on estabelecimento         for select using (eh_admin());
create policy admin_le_local            on local                   for select using (eh_admin());
create policy admin_le_acessibilidade   on local_acessibilidade    for select using (eh_admin());
create policy admin_le_atendimento      on atendimento             for select using (eh_admin());
create policy admin_le_horario          on horario                 for select using (eh_admin());

/*
  Admin grava em `profissional`, e só nela nesta fatia.

  Nenhuma política de remoção existe em lugar nenhum deste projeto. Com a
  segurança de linha ligada e sem `for delete`, o Postgres recusa remoção de
  qualquer pessoa por qualquer caminho. Despublicar é `publicado = false`, e o
  dado fica.
*/
create policy admin_cria_profissional on profissional
  for insert with check (eh_admin());

create policy admin_altera_profissional on profissional
  for update using (eh_admin()) with check (eh_admin());
```

- [ ] **Step 4: Escrever `supabase/testes-rls.sql`**

As marcas em minúsculo e sem acento no `raise` são o que o teste da etapa 1 procura — não as reescreva.

```sql
/*
  Asserções das políticas do painel.

  Cole no editor SQL do Supabase e rode. Não altera nada: tudo acontece dentro
  de uma transação que termina em rollback. Se qualquer asserção falhar, o
  Postgres levanta exceção com a mensagem correspondente.

  Por que este arquivo existe: os testes automáticos deste projeto rodam em
  memória, sem banco, e política de banco é a parte mais fácil de errar — e o
  erro é silencioso, porque uma política frouxa não avisa ninguém.

  ANTES DE RODAR: troque o uuid abaixo pelo id da sua conta de admin, que sai
  de `select id, email from auth.users;`.
*/

begin;

do $$
declare
  admin_uuid   constant uuid := '00000000-0000-0000-0000-000000000000'; -- TROQUE
  ninguem_uuid constant uuid := '11111111-1111-1111-1111-111111111111';
  medico_id    bigint;
  quantos      bigint;
begin
  -- Um médico despublicado, criado dentro da transação para o teste.
  insert into profissional (slug, nome, crm, crm_uf, publicado)
  values ('teste-rls-' || gen_random_uuid(), 'Teste RLS', '999999', 'MA', false)
  returning id into medico_id;

  ---------------------------------------------------------------- visitante
  set local role anon;

  select count(*) into quantos from profissional where id = medico_id;
  if quantos <> 0 then
    raise exception 'FALHOU: visitante nao ve despublicado';
  end if;

  begin
    update profissional set nome = 'invadido' where id = medico_id;
    if found then raise exception 'FALHOU: visitante nao grava'; end if;
  exception when insufficient_privilege then
    null; -- recusado, que é o esperado
  end;

  reset role;

  ------------------------------------------------- conta sem linha de perfil
  set local role authenticated;
  perform set_config('request.jwt.claims',
    json_build_object('sub', ninguem_uuid, 'role', 'authenticated')::text, true);

  select count(*) into quantos from profissional where id = medico_id;
  if quantos <> 0 then
    raise exception 'FALHOU: conta sem perfil nao ve nada';
  end if;

  reset role;

  -------------------------------------------------------------------- admin
  set local role authenticated;
  perform set_config('request.jwt.claims',
    json_build_object('sub', admin_uuid, 'role', 'authenticated')::text, true);

  select count(*) into quantos from profissional where id = medico_id;
  if quantos <> 1 then
    raise exception 'FALHOU: admin ve despublicado';
  end if;

  update profissional set nome = 'Teste RLS alterado' where id = medico_id;
  select count(*) into quantos from profissional
    where id = medico_id and nome = 'Teste RLS alterado';
  if quantos <> 1 then
    raise exception 'FALHOU: admin grava';
  end if;

  begin
    delete from profissional where id = medico_id;
    if found then raise exception 'FALHOU: ninguem apaga'; end if;
  exception when insufficient_privilege then
    null; -- recusado, que é o esperado
  end;

  reset role;

  raise notice 'TODAS AS ASSERCOES PASSARAM';
end $$;

rollback;
```

- [ ] **Step 5: Rodar e confirmar que passa**

Run: `npx vitest run testes/painel-migracao.test.ts`
Expected: PASS, 5 testes

- [ ] **Step 6: Commit**

```bash
git add supabase/migrations/0005_painel.sql supabase/testes-rls.sql testes/painel-migracao.test.ts
git commit -m "Cria a tabela de papéis e as políticas de escrita do painel

É a primeira migração do projeto que concede escrita: até aqui as dez
políticas existentes eram todas for select. Nenhuma política de remoção
entra, nem para admin -- com a segurança de linha ligada e sem for delete,
o Postgres recusa remoção por qualquer caminho.

O teste lê o SQL e falha se uma concessão de remoção aparecer, porque
política de banco é a parte mais fácil de errar e o erro é silencioso.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Task 2: O cliente com sessão e o `proxy`

**Files:**
- Create: `lib/painel/servidor.ts`
- Create: `proxy.ts` (na raiz do repositório, ao lado de `app/`)
- Test: `testes/painel-proxy.test.ts`

**Interfaces:**
- Consumes: `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Produces: `clienteDoPainel(): Promise<SupabaseClient>` e o arquivo `proxy.ts` com `proxy` e `config`

- [ ] **Step 1: Instalar a dependência**

```bash
npm i @supabase/ssr@^0.12.4
```

Entra como dependência normal, não de desenvolvimento: o painel roda no site publicado.

- [ ] **Step 2: Escrever o teste que falha, em `testes/painel-proxy.test.ts`**

```ts
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

function fonte(relativo: string): string {
  return readFileSync(fileURLToPath(new URL(relativo, import.meta.url)), "utf8");
}

/*
  Duas armadilhas medidas, e as duas falham em silêncio.

  1. No Next 16 o arquivo se chama `proxy.ts` e exporta `proxy`. Um
     `middleware.ts` é só um arquivo que ninguém chama — sem erro nenhum.
  2. O `setAll` do @supabase/ssr recebe um SEGUNDO argumento com cabeçalhos
     de não-cachear. Sem eles, uma CDN pode servir o cookie de sessão de uma
     pessoa a outra.
*/
describe("proxy.ts", () => {
  const codigo = fonte("../proxy.ts");

  it("exporta `proxy`, não `middleware`", () => {
    expect(codigo).toMatch(/export\s+(async\s+)?function\s+proxy\b/);
    expect(codigo).not.toMatch(/export\s+(async\s+)?function\s+middleware\b/);
  });

  it("o filtro cobre só o painel — o site público não pode passar por aqui", () => {
    const m = /matcher\s*:\s*\[([^\]]*)\]/.exec(codigo);
    expect(m, "não achei config.matcher").not.toBeNull();
    const caminhos = [...m![1].matchAll(/"([^"]+)"/g)].map((x) => x[1]);
    expect(caminhos.length).toBeGreaterThan(0);
    for (const c of caminhos) expect(c.startsWith("/painel")).toBe(true);
  });

  it("aplica os cabeçalhos de não-cachear que o segundo argumento traz", () => {
    /* O nome do segundo parâmetro é livre; o que não pode é ele não existir
       nem ser usado. */
    const decl = /setAll\s*\(\s*[^,)]+,\s*([A-Za-zÀ-ú_$][\w$]*)\s*\)/.exec(codigo);
    expect(decl, "setAll precisa receber o segundo argumento").not.toBeNull();
    expect(codigo).toContain(`Object.entries(${decl![1]})`);
  });
});

describe("lib/painel/servidor.ts", () => {
  const codigo = fonte("../lib/painel/servidor.ts");

  it("não lê a chave do importador", () => {
    expect(codigo).not.toContain("SUPABASE_CHAVE_IMPORTADOR");
  });

  it("usa a chave pública, que é o que faz as políticas valerem", () => {
    expect(codigo).toContain("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  });
});
```

- [ ] **Step 3: Rodar e confirmar que falha**

Run: `npx vitest run testes/painel-proxy.test.ts`
Expected: FAIL com `ENOENT` em `proxy.ts`

- [ ] **Step 4: Escrever `lib/painel/servidor.ts`**

```ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { SupabaseClient } from "@supabase/supabase-js";

/*
  O cliente do painel: mesma chave pública do site, mais a sessão da pessoa.

  É a sessão que dá poder de escrita, não a chave. Com isso as políticas do
  banco valem para tudo que o painel faz, e a tela não consegue gravar nada
  que o Postgres recusaria. `lib/dados/cliente.ts` continua intacto para o
  site público, e nenhuma chave privilegiada existe neste lado do projeto.
*/
export async function clienteDoPainel(): Promise<SupabaseClient> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const chave = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !chave) {
    throw new Error(
      "Faltam NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY. " +
        "Copie .env.local.exemplo para .env.local e preencha.",
    );
  }

  const armazem = await cookies();

  return createServerClient(url, chave, {
    cookies: {
      getAll: () => armazem.getAll(),
      setAll: (paraGravar) => {
        try {
          for (const { name, value, options } of paraGravar) {
            armazem.set(name, value, options);
          }
        } catch {
          /*
            Componente de servidor não pode gravar cookie, e tentar levanta.
            Ignorar é correto aqui: o `proxy.ts` já renovou a sessão antes de
            esta renderização começar, e é ele quem grava.
          */
        }
      },
    },
  });
}
```

- [ ] **Step 5: Escrever `proxy.ts`, na raiz do repositório**

```ts
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/*
  ATENÇÃO ao nome do arquivo.

  No Next 16 esta convenção se chama `proxy.ts` e a função exportada se chama
  `proxy`. O antigo `middleware.ts` está descontinuado, e — o que torna o erro
  caro — um `middleware.ts` aqui não daria erro nenhum: seria só um arquivo
  que ninguém chama, e o painel ficaria sem renovação de sessão.

  O filtro no fim cobre só `/painel`. O site público precisa ficar de fora: ele
  é gerado estaticamente com revalidação de uma hora, e cookie de sessão numa
  resposta cacheável é o caminho mais curto para servir a sessão de uma pessoa
  a outra.
*/
export async function proxy(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const chave = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  let resposta = NextResponse.next({ request });

  const supabase = createServerClient(url, chave, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (paraGravar, cabecalhos) => {
        for (const { name, value } of paraGravar) {
          request.cookies.set(name, value);
        }

        resposta = NextResponse.next({ request });

        for (const { name, value, options } of paraGravar) {
          resposta.cookies.set(name, value, options);
        }

        /*
          O segundo argumento não é enfeite. Ele traz os cabeçalhos que dizem
          a CDN e a proxy reverso para não guardar esta resposta. Sem eles,
          uma resposta que grava cookie de sessão pode ser cacheada e servida
          a outra pessoa — com o token dentro. Omitir não dá erro.
        */
        for (const [nome, valor] of Object.entries(cabecalhos)) {
          resposta.headers.set(nome, valor);
        }
      },
    },
  });

  /* Chamar `getUser` aqui é o que dispara a renovação do token. */
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const caminho = request.nextUrl.pathname;
  const naTelaDeEntrar = caminho.startsWith("/painel/entrar");

  /*
    Desvio otimista, e só. Quem decide de verdade é `exigirAdmin()` em cada
    página, e depois dela o banco: uma conta autenticada sem papel de admin
    passa por aqui e não vê nada, porque política nenhuma a reconhece.
  */
  if (!user && !naTelaDeEntrar) {
    const destino = request.nextUrl.clone();
    destino.pathname = "/painel/entrar";
    return NextResponse.redirect(destino);
  }

  if (user && naTelaDeEntrar) {
    const destino = request.nextUrl.clone();
    destino.pathname = "/painel";
    return NextResponse.redirect(destino);
  }

  return resposta;
}

export const config = {
  matcher: ["/painel/:path*"],
};
```

Se `NextResponse.next({ request })` não passar na checagem de tipos, use `NextResponse.next({ request: { headers: request.headers } })`, que é a forma documentada — e **reporte a divergência**, porque este plano a afirma.

- [ ] **Step 6: Rodar e confirmar que passa**

Run: `npx vitest run testes/painel-proxy.test.ts`
Expected: PASS, 5 testes

Run: `npx tsc --noEmit`
Expected: limpo

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json lib/painel/servidor.ts proxy.ts testes/painel-proxy.test.ts
git commit -m "Liga a sessão do painel, com proxy e não middleware

Duas armadilhas medidas, e as duas falham em silêncio. No Next 16 a
convenção se chama proxy e não middleware, e um middleware.ts aqui seria
só um arquivo que ninguém chama. E o setAll do supabase/ssr recebe um
segundo argumento com os cabeçalhos de não-cachear, cuja ausência permite
que uma CDN sirva o cookie de sessão de uma pessoa a outra.

O filtro cobre só /painel: o site público é estático com revalidação, e
não pode ganhar cookie de sessão numa resposta cacheável.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Task 3: `exigirAdmin()` e a casca do painel

**Files:**
- Create: `lib/painel/sessao.ts`
- Create: `app/painel/layout.tsx`
- Test: `testes/painel-casca.test.ts`

**Interfaces:**
- Consumes: `clienteDoPainel()` de `lib/painel/servidor.ts`
- Produces:
```ts
export type Sessao = {
  usuarioId: string;
  papel: "admin" | "associado";
  profissionalId: number | null;
};
export async function sessaoAtual(): Promise<Sessao | null>;
export async function exigirAdmin(): Promise<Sessao>;
```

- [ ] **Step 1: Escrever o teste que falha, em `testes/painel-casca.test.ts`**

```ts
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { metadata } from "@/app/painel/layout";

function fonte(relativo: string): string {
  return readFileSync(fileURLToPath(new URL(relativo, import.meta.url)), "utf8");
}

describe("a casca do painel", () => {
  it("declara noindex", () => {
    /*
      `app/robots.ts` já lista /painel/ em disallow e o comentário de lá diz
      que aquela é "a segunda tranca". Esta é a primeira: um rastreador que
      chegue à página por um link ainda lê a meta tag.
    */
    expect(metadata.robots).toMatchObject({ index: false, follow: false });
  });

  it("o layout não confere permissão — isso é de cada página", () => {
    /*
      O guia de autenticação do Next 16 é explícito: layout não roda de novo
      a cada navegação, então proteger nele deixa buraco entre telas.
    */
    expect(fonte("../app/painel/layout.tsx")).not.toContain("exigirAdmin");
  });
});

describe("lib/painel/sessao.ts", () => {
  const codigo = fonte("../lib/painel/sessao.ts");

  it("usa getUser, nunca getSession", () => {
    /* getSession lê o cookie e acredita nele; getUser confere com o servidor
       de autenticação. Para decidir permissão, só o segundo serve. */
    expect(codigo).toContain("getUser()");
    expect(codigo).not.toContain("getSession()");
  });
});
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `npx vitest run testes/painel-casca.test.ts`
Expected: FAIL — `Failed to resolve import "@/app/painel/layout"`

- [ ] **Step 3: Escrever `lib/painel/sessao.ts`**

```ts
import { redirect } from "next/navigation";
import { clienteDoPainel } from "@/lib/painel/servidor";

/*
  A camada que decide.

  O `proxy.ts` faz só o desvio otimista, olhando o cookie. Aqui a pergunta é
  outra e mais cara: quem é esta pessoa, e ela é admin? Por isso `getUser()`,
  que confere com o servidor de autenticação, e não `getSession()`, que lê o
  cookie e acredita nele.

  Uma conta autenticada SEM linha em `perfil_usuario` chega até aqui e é
  mandada embora — e mesmo que não fosse, não veria nada, porque política
  nenhuma do banco a reconhece. Esta função é a primeira tranca; o Postgres é
  a última.
*/

export type Sessao = {
  usuarioId: string;
  papel: "admin" | "associado";
  profissionalId: number | null;
};

export async function sessaoAtual(): Promise<Sessao | null> {
  const cliente = await clienteDoPainel();

  const {
    data: { user },
  } = await cliente.auth.getUser();

  if (!user) return null;

  const { data, error } = await cliente
    .from("perfil_usuario")
    .select("papel, profissional_id")
    .eq("id", user.id)
    .maybeSingle();

  if (error || !data) return null;

  return {
    usuarioId: user.id,
    papel: data.papel,
    profissionalId: data.profissional_id,
  };
}

/** Devolve a sessão do admin, ou desvia para a tela de entrar. */
export async function exigirAdmin(): Promise<Sessao> {
  const sessao = await sessaoAtual();
  if (!sessao || sessao.papel !== "admin") redirect("/painel/entrar");
  return sessao;
}
```

- [ ] **Step 4: Escrever `app/painel/layout.tsx`**

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import { sair } from "@/app/painel/entrar/acoes";

/*
  Casca visual do painel, e nada mais.

  NÃO confere permissão. O guia de autenticação do Next 16 é explícito sobre
  por quê: layout não roda de novo a cada navegação, então uma conferência
  aqui deixa buraco entre telas. Cada página chama `exigirAdmin()` por conta
  própria.

  O `robots` abaixo é a primeira tranca contra indexação. A segunda já existe
  em `app/robots.ts`, que lista /painel/ em disallow.
*/
export const metadata: Metadata = {
  title: "Painel · AMI",
  robots: { index: false, follow: false },
};

export default function LayoutDoPainel({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-canvas">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex max-w-[1240px] items-center justify-between px-5 py-4 md:px-8">
          <Link href="/painel" className="texto-placa text-[15px] text-ink-900">
            Painel da AMI
          </Link>

          <form action={sair}>
            <button
              type="submit"
              className="pressiona rounded-controle border border-line px-4 py-2 text-[14px] font-medium text-ink-600 hover:text-ink-900"
            >
              Sair
            </button>
          </form>
        </div>
      </header>

      <main className="mx-auto max-w-[1240px] px-5 py-8 md:px-8">{children}</main>
    </div>
  );
}
```

O `import` de `sair` aponta para um arquivo que a tarefa 4 cria. Escreva a tarefa 4 antes de rodar a build; os testes desta tarefa não dependem dela.

- [ ] **Step 5: Rodar e confirmar que passa**

Run: `npx vitest run testes/painel-casca.test.ts`
Expected: PASS, 3 testes

- [ ] **Step 6: Commit**

```bash
git add lib/painel/sessao.ts app/painel/layout.tsx testes/painel-casca.test.ts
git commit -m "Cria a camada que decide e a casca do painel

exigirAdmin usa getUser e não getSession: o segundo lê o cookie e acredita
nele, e para decidir permissão só o primeiro serve. O layout não confere
nada de propósito -- layout não roda de novo a cada navegação, e proteger
nele deixa buraco entre telas.

O noindex no metadata é a primeira tranca contra indexação; a segunda já
existia em app/robots.ts.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Task 4: Entrar e sair

**Files:**
- Create: `app/painel/entrar/acoes.ts`
- Create: `app/painel/entrar/page.tsx`
- Create: `components/painel/FormularioEntrar.tsx`
- Test: `testes/painel-entrar.test.ts`

**Interfaces:**
- Consumes: `clienteDoPainel()` de `lib/painel/servidor.ts`
- Produces:
```ts
export type EstadoDeEntrada = { erro: string | null };
export async function entrar(anterior: EstadoDeEntrada, dados: FormData): Promise<EstadoDeEntrada>;
export async function sair(): Promise<void>;
```

- [ ] **Step 1: Escrever o teste que falha, em `testes/painel-entrar.test.ts`**

```ts
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

function fonte(relativo: string): string {
  return readFileSync(fileURLToPath(new URL(relativo, import.meta.url)), "utf8");
}

describe("entrar", () => {
  const acoes = fonte("../app/painel/entrar/acoes.ts");

  it("é ação de servidor", () => {
    expect(acoes.trimStart().startsWith('"use server"')).toBe(true);
  });

  it("a mensagem de erro não diz qual dos dois campos errou", () => {
    /*
      Dizer "este e-mail não existe" entrega a lista de quem tem conta. A
      mensagem é uma só para os dois casos.
    */
    expect(acoes).toContain("E-mail ou senha não conferem");
    expect(acoes).not.toMatch(/e-?mail\s+n[ãa]o\s+(existe|cadastrado)/i);
    expect(acoes).not.toMatch(/senha\s+(incorreta|errada|inv[áa]lida)/i);
  });

  it("não devolve ao navegador o erro que veio do Supabase", () => {
    /* A mensagem do provedor distingue os casos, e devolvê-la desfaz a
       decisão acima. */
    expect(acoes).not.toMatch(/error\.message|erro\.message/);
  });
});

describe("o formulário de entrar", () => {
  const form = fonte("../components/painel/FormularioEntrar.tsx");

  it("usa useActionState, que é a forma do Next 16", () => {
    expect(form).toContain("useActionState");
  });

  it("desabilita o botão enquanto envia", () => {
    expect(form).toMatch(/disabled=\{pendente\}/);
  });

  it("anuncia o erro a leitor de tela", () => {
    expect(form).toContain('aria-live="polite"');
  });
});
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `npx vitest run testes/painel-entrar.test.ts`
Expected: FAIL com `ENOENT`

- [ ] **Step 3: Escrever `app/painel/entrar/acoes.ts`**

```ts
"use server";

import { redirect } from "next/navigation";
import { clienteDoPainel } from "@/lib/painel/servidor";

export type EstadoDeEntrada = { erro: string | null };

/*
  A mensagem de erro é uma só para os dois casos, de propósito.

  "Este e-mail não existe" entrega a lista de quem tem conta a quem quiser
  descobrir, e "senha incorreta" confirma que o e-mail existe. A mensagem do
  Supabase distingue os casos, e por isso ela não é repassada.
*/
const ERRO = "E-mail ou senha não conferem.";

export async function entrar(
  _anterior: EstadoDeEntrada,
  dados: FormData,
): Promise<EstadoDeEntrada> {
  const email = String(dados.get("email") ?? "").trim();
  const senha = String(dados.get("senha") ?? "");

  if (!email || !senha) return { erro: ERRO };

  const cliente = await clienteDoPainel();
  const { error } = await cliente.auth.signInWithPassword({
    email,
    password: senha,
  });

  if (error) return { erro: ERRO };

  redirect("/painel");
}

export async function sair(): Promise<void> {
  const cliente = await clienteDoPainel();
  await cliente.auth.signOut();
  redirect("/painel/entrar");
}
```

- [ ] **Step 4: Escrever `components/painel/FormularioEntrar.tsx`**

```tsx
"use client";

import { useActionState } from "react";
import { entrar, type EstadoDeEntrada } from "@/app/painel/entrar/acoes";

const INICIAL: EstadoDeEntrada = { erro: null };

const CAMPO =
  "w-full rounded-controle border border-line bg-surface px-4 py-3 text-[16px] " +
  "text-ink-900 outline-none focus-visible:border-ami-green-600";

export function FormularioEntrar() {
  const [estado, acao, pendente] = useActionState(entrar, INICIAL);

  return (
    <form action={acao} className="mt-8 space-y-4">
      <div>
        <label htmlFor="email" className="block text-[14px] font-medium text-ink-600">
          E-mail
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          required
          className={`mt-1 ${CAMPO}`}
        />
      </div>

      <div>
        <label htmlFor="senha" className="block text-[14px] font-medium text-ink-600">
          Senha
        </label>
        <input
          id="senha"
          name="senha"
          type="password"
          autoComplete="current-password"
          required
          className={`mt-1 ${CAMPO}`}
        />
      </div>

      {/* `role="alert"` avisa na hora; `aria-live` cobre quem já estava lendo. */}
      <p aria-live="polite" role="alert" className="min-h-6 text-[15px] text-warn">
        {estado.erro}
      </p>

      <button
        type="submit"
        disabled={pendente}
        className="pressiona inline-flex min-h-12 w-full items-center justify-center rounded-controle bg-ami-green-600 px-6 text-[15px] font-semibold text-white shadow-apoio hover:bg-ami-green-700 disabled:opacity-60"
      >
        {pendente ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}
```

Se a classe de cor `text-warn` não existir em `app/globals.css`, use `text-ink-900` e **reporte** — este plano a afirma a partir do uso em `components/editorial/RascunhoLegalNaTela.tsx`.

- [ ] **Step 5: Escrever `app/painel/entrar/page.tsx`**

```tsx
import { FormularioEntrar } from "@/components/painel/FormularioEntrar";

export default function PaginaEntrar() {
  return (
    <div className="mx-auto max-w-[420px] py-12">
      <h1 className="text-[28px] font-semibold text-ink-900">Entrar no painel</h1>
      <p className="mt-2 text-[16px] text-ink-600">
        Acesso da equipe da AMI e da agência.
      </p>

      <FormularioEntrar />
    </div>
  );
}
```

- [ ] **Step 6: Rodar e confirmar que passa**

Run: `npx vitest run testes/painel-entrar.test.ts`
Expected: PASS, 6 testes

Run: `npx vitest run` e `npx tsc --noEmit`
Expected: tudo limpo

- [ ] **Step 7: Commit**

```bash
git add app/painel/entrar components/painel/FormularioEntrar.tsx testes/painel-entrar.test.ts
git commit -m "Entrar e sair do painel

A mensagem de erro é uma só para e-mail inexistente e senha errada: a do
Supabase distingue os dois, e repassá-la entregaria a lista de quem tem
conta. Sair existe porque o computador da sede é compartilhado, e sem ele
a única forma de encerrar sessão é esperar expirar.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Task 5: Validação pura do médico

**Files:**
- Create: `lib/painel/medico.ts`
- Test: `testes/painel-medico.test.ts`

**Interfaces:**
- Consumes: `UFS` de `lib/importador/tipos.ts` — módulo puro, direção permitida
- Produces:
```ts
export type CamposDoMedico = {
  nome: string; crm: string; crmUf: string;
  telemedicina: boolean; situacao: string; bio: string; verificadoEm: string;
};
export type MedicoValidado = {
  nome: string; crm: string; crm_uf: string;
  telemedicina: boolean; situacao: "ativo" | "inativo";
  bio: string | null; verificado_em: string | null;
};
export type Validacao =
  | { ok: true; valor: MedicoValidado }
  | { ok: false; erros: Partial<Record<keyof CamposDoMedico, string>> };
export function validarMedico(campos: CamposDoMedico): Validacao;
export function oQueFalta(m: {
  temEspecialidade: boolean; temEndereco: boolean; temBio: boolean;
}): string[];
```

- [ ] **Step 1: Escrever o teste que falha, em `testes/painel-medico.test.ts`**

```ts
import { describe, expect, it } from "vitest";
import { oQueFalta, validarMedico, type CamposDoMedico } from "@/lib/painel/medico";

function campos(p: Partial<CamposDoMedico> = {}): CamposDoMedico {
  return {
    nome: "Ana Souza", crm: "4821", crmUf: "MA",
    telemedicina: false, situacao: "ativo", bio: "", verificadoEm: "",
    ...p,
  };
}

describe("validarMedico — o que rejeita", () => {
  it("nome vazio", () => {
    const r = validarMedico(campos({ nome: "   " }));
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.erros.nome).toBeTruthy();
  });

  it("CRM sem dígito nenhum", () => {
    const r = validarMedico(campos({ crm: "a definir" }));
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.erros.crm).toBeTruthy();
  });

  it("UF que não existe", () => {
    const r = validarMedico(campos({ crmUf: "MAA" }));
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.erros.crmUf).toContain("MAA");
  });

  it("situação fora do que o banco aceita", () => {
    const r = validarMedico(campos({ situacao: "afastado" }));
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.erros.situacao).toBeTruthy();
  });

  it("data de verificação que não é data", () => {
    const r = validarMedico(campos({ verificadoEm: "ontem" }));
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.erros.verificadoEm).toBeTruthy();
  });

  it("junta todos os erros de uma vez, em vez de parar no primeiro", () => {
    const r = validarMedico(campos({ nome: "", crm: "", crmUf: "ZZ" }));
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(Object.keys(r.erros).sort()).toEqual(["crm", "crmUf", "nome"]);
  });
});

describe("validarMedico — o que sai limpo", () => {
  it("devolve as chaves com o nome que o banco usa", () => {
    const r = validarMedico(campos());
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.valor).toEqual({
      nome: "Ana Souza", crm: "4821", crm_uf: "MA",
      telemedicina: false, situacao: "ativo",
      bio: null, verificado_em: null,
    });
  });

  it("tira a pontuação do CRM e colapsa espaço do nome", () => {
    const r = validarMedico(campos({ crm: "CRM 4.821", nome: "Ana   Paula  Souza" }));
    if (!r.ok) throw new Error("não deveria rejeitar");
    expect(r.valor.crm).toBe("4821");
    expect(r.valor.nome).toBe("Ana Paula Souza");
  });

  it("UF minúscula vira maiúscula", () => {
    const r = validarMedico(campos({ crmUf: "to" }));
    if (!r.ok) throw new Error("não deveria rejeitar");
    expect(r.valor.crm_uf).toBe("TO");
  });

  it("bio e data vazias viram nulo, não string vazia", () => {
    const r = validarMedico(campos({ bio: "   ", verificadoEm: "" }));
    if (!r.ok) throw new Error("não deveria rejeitar");
    expect(r.valor.bio).toBeNull();
    expect(r.valor.verificado_em).toBeNull();
  });

  it("data válida atravessa como está", () => {
    const r = validarMedico(campos({ verificadoEm: "2026-08-22" }));
    if (!r.ok) throw new Error("não deveria rejeitar");
    expect(r.valor.verificado_em).toBe("2026-08-22");
  });
});

describe("oQueFalta", () => {
  it("nada falta quando tudo está preenchido", () => {
    expect(oQueFalta({ temEspecialidade: true, temEndereco: true, temBio: true })).toEqual([]);
  });

  it("lista o que falta, na ordem de quem mais atrapalha", () => {
    expect(oQueFalta({ temEspecialidade: false, temEndereco: false, temBio: false })).toEqual([
      "sem especialidade",
      "sem endereço",
      "sem biografia",
    ]);
  });

  it("só a biografia faltando", () => {
    expect(oQueFalta({ temEspecialidade: true, temEndereco: true, temBio: false })).toEqual([
      "sem biografia",
    ]);
  });
});
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `npx vitest run testes/painel-medico.test.ts`
Expected: FAIL — `Failed to resolve import "@/lib/painel/medico"`

- [ ] **Step 3: Escrever `lib/painel/medico.ts`**

```ts
import { UFS } from "@/lib/importador/tipos";

/*
  Validação dos campos do médico, pura.

  Sem biblioteca de validação: o projeto não tem nenhuma, e aqui são cinco
  regras. Os erros vêm todos de uma vez, em vez de um por envio — corrigir
  três campos em três idas ao servidor é o tipo de coisa que faz quem preenche
  desistir no meio.

  `UFS` vem de `lib/importador/tipos.ts`. O nome do lugar destoa, e é o preço
  de não refatorar por uma constante; se um terceiro consumidor aparecer, ela
  muda de casa.
*/

export type CamposDoMedico = {
  nome: string;
  crm: string;
  crmUf: string;
  telemedicina: boolean;
  situacao: string;
  bio: string;
  verificadoEm: string;
};

/** As chaves saem com o nome que o banco usa, prontas para o update. */
export type MedicoValidado = {
  nome: string;
  crm: string;
  crm_uf: string;
  telemedicina: boolean;
  situacao: "ativo" | "inativo";
  bio: string | null;
  verificado_em: string | null;
};

export type Validacao =
  | { ok: true; valor: MedicoValidado }
  | { ok: false; erros: Partial<Record<keyof CamposDoMedico, string>> };

const SITUACOES = ["ativo", "inativo"] as const;

/** Data no formato que a coluna `date` do Postgres aceita. */
function ehDataISO(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(`${s}T12:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

export function validarMedico(campos: CamposDoMedico): Validacao {
  const erros: Partial<Record<keyof CamposDoMedico, string>> = {};

  const nome = campos.nome.replace(/\s+/g, " ").trim();
  if (!nome) erros.nome = "O nome não pode ficar vazio.";

  const crm = campos.crm.replace(/\D/g, "");
  if (!crm) erros.crm = "O CRM precisa ter pelo menos um dígito.";

  const crmUf = campos.crmUf.trim().toUpperCase();
  if (!(UFS as readonly string[]).includes(crmUf)) {
    erros.crmUf = `A UF "${campos.crmUf}" não existe.`;
  }

  const situacao = campos.situacao.trim();
  if (!(SITUACOES as readonly string[]).includes(situacao)) {
    erros.situacao = "Situação precisa ser ativo ou inativo.";
  }

  const verificadoEm = campos.verificadoEm.trim();
  if (verificadoEm && !ehDataISO(verificadoEm)) {
    erros.verificadoEm = "A data precisa estar no formato 2026-08-22.";
  }

  if (Object.keys(erros).length) return { ok: false, erros };

  const bio = campos.bio.trim();

  return {
    ok: true,
    valor: {
      nome,
      crm,
      crm_uf: crmUf,
      telemedicina: campos.telemedicina,
      situacao: situacao as "ativo" | "inativo",
      /* Vazio vira nulo, não string vazia: no banco os dois significam coisas
         diferentes, e a tela do site testa `bio ? ... : null`. */
      bio: bio || null,
      verificado_em: verificadoEm || null,
    },
  };
}

/*
  O que impede este perfil de servir para alguém.

  A ordem é a do estrago: sem especialidade ele não aparece em faceta nenhuma;
  sem endereço não responde à pergunta que traz a pessoa ao site; sem
  biografia ele funciona, só fica mais pobre.
*/
export function oQueFalta(m: {
  temEspecialidade: boolean;
  temEndereco: boolean;
  temBio: boolean;
}): string[] {
  const falta: string[] = [];
  if (!m.temEspecialidade) falta.push("sem especialidade");
  if (!m.temEndereco) falta.push("sem endereço");
  if (!m.temBio) falta.push("sem biografia");
  return falta;
}
```

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `npx vitest run testes/painel-medico.test.ts`
Expected: PASS, 14 testes

- [ ] **Step 5: Commit**

```bash
git add lib/painel/medico.ts testes/painel-medico.test.ts
git commit -m "Valida os campos do médico, sem biblioteca nova

O projeto não tem biblioteca de validação e aqui são cinco regras. Os
erros voltam todos de uma vez: corrigir três campos em três idas ao
servidor faz quem preenche desistir no meio.

Vazio vira nulo e não string vazia, porque no banco os dois significam
coisas diferentes e a tela do perfil testa a presença.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Task 6: A lista de médicos

**Files:**
- Create: `lib/painel/consultas.ts`
- Create: `app/painel/page.tsx`
- Create: `components/painel/LinhaDoPainel.tsx`
- Test: `testes/painel-consultas.test.ts`

**Interfaces:**
- Consumes: `exigirAdmin()` de `lib/painel/sessao.ts`; `clienteDoPainel()` de `lib/painel/servidor.ts`
- Produces:
```ts
export const POR_PAGINA = 50;
export type MedicoNaLista = {
  id: number; slug: string; nome: string; crm: string; crmUf: string;
  publicado: boolean; especialidade: string | null; bairros: string[];
};
export function faixaDaPagina(pagina: number): { de: number; ate: number };
export function paraLista(linha: unknown): MedicoNaLista;
export async function listarMedicos(
  cliente: SupabaseClient,
  opcoes: { termo?: string; pagina?: number },
): Promise<{ medicos: MedicoNaLista[]; total: number }>;
```

- [ ] **Step 1: Escrever o teste que falha, em `testes/painel-consultas.test.ts`**

```ts
import { describe, expect, it } from "vitest";
import { POR_PAGINA, faixaDaPagina, paraLista } from "@/lib/painel/consultas";

describe("faixaDaPagina", () => {
  it("a primeira página começa em zero", () => {
    expect(faixaDaPagina(1)).toEqual({ de: 0, ate: POR_PAGINA - 1 });
  });

  it("a segunda começa onde a primeira acabou, sem repetir nem pular", () => {
    const um = faixaDaPagina(1);
    const dois = faixaDaPagina(2);
    expect(dois.de).toBe(um.ate + 1);
  });

  it("página zero ou negativa é tratada como a primeira", () => {
    expect(faixaDaPagina(0)).toEqual(faixaDaPagina(1));
    expect(faixaDaPagina(-3)).toEqual(faixaDaPagina(1));
  });
});

describe("paraLista", () => {
  const linha = {
    id: 7, slug: "ana-souza", nome: "Ana Souza", crm: "4821", crm_uf: "MA",
    publicado: false,
    profissional_especialidade: [
      { principal: false, especialidade: { nome: "Clínica Médica" } },
      { principal: true, especialidade: { nome: "Cardiologia" } },
    ],
    atendimento: [
      { local: { bairro: { nome: "Centro" } } },
      { local: { bairro: { nome: "Juçara" } } },
      { local: { bairro: { nome: "Centro" } } },
    ],
  };

  it("traduz para o domínio, em português", () => {
    const m = paraLista(linha);
    expect(m.id).toBe(7);
    expect(m.crmUf).toBe("MA");
    expect(m.publicado).toBe(false);
  });

  it("a especialidade mostrada é a marcada como principal", () => {
    expect(paraLista(linha).especialidade).toBe("Cardiologia");
  });

  it("sem principal marcada, cai na primeira", () => {
    const semPrincipal = {
      ...linha,
      profissional_especialidade: [
        { principal: false, especialidade: { nome: "Clínica Médica" } },
      ],
    };
    expect(paraLista(semPrincipal).especialidade).toBe("Clínica Médica");
  });

  it("sem especialidade nenhuma devolve nulo, não texto vazio", () => {
    expect(paraLista({ ...linha, profissional_especialidade: [] }).especialidade).toBeNull();
  });

  it("bairro repetido aparece uma vez só", () => {
    expect(paraLista(linha).bairros).toEqual(["Centro", "Juçara"]);
  });

  it("aguenta laço ausente sem estourar", () => {
    const cru = { id: 1, slug: "x", nome: "X", crm: "1", crm_uf: "MA", publicado: true };
    const m = paraLista(cru);
    expect(m.especialidade).toBeNull();
    expect(m.bairros).toEqual([]);
  });
});
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `npx vitest run testes/painel-consultas.test.ts`
Expected: FAIL — `Failed to resolve import "@/lib/painel/consultas"`

- [ ] **Step 3: Escrever `lib/painel/consultas.ts`**

```ts
import type { SupabaseClient } from "@supabase/supabase-js";

/*
  As consultas do painel.

  A tradução de linha para domínio (`paraLista`) fica separada da ida ao banco
  de propósito: é ela que tem as regras — qual especialidade mostrar, bairro
  repetido, laço ausente — e é o que dá para testar sem banco.

  Este módulo NÃO cria o cliente. Ele recebe um pronto, para que quem chama
  decida de onde vem a sessão.
*/

export const POR_PAGINA = 50;

export type MedicoNaLista = {
  id: number;
  slug: string;
  nome: string;
  crm: string;
  crmUf: string;
  publicado: boolean;
  especialidade: string | null;
  bairros: string[];
};

/** `range` do PostgREST é inclusivo nas duas pontas. */
export function faixaDaPagina(pagina: number): { de: number; ate: number } {
  const n = Number.isFinite(pagina) && pagina > 1 ? Math.floor(pagina) : 1;
  const de = (n - 1) * POR_PAGINA;
  return { de, ate: de + POR_PAGINA - 1 };
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export function paraLista(linha: unknown): MedicoNaLista {
  const l = linha as any;

  const vinculos = (l.profissional_especialidade ?? []) as any[];
  /* Mesma regra que o site usa: a marcada como principal, ou a primeira. */
  const principal = vinculos.find((v) => v.principal) ?? vinculos[0];

  const bairros = [
    ...new Set(
      ((l.atendimento ?? []) as any[])
        .map((a) => a.local?.bairro?.nome)
        .filter((n): n is string => Boolean(n)),
    ),
  ];

  return {
    id: l.id,
    slug: l.slug,
    nome: l.nome,
    crm: l.crm,
    crmUf: l.crm_uf,
    publicado: l.publicado,
    especialidade: principal?.especialidade?.nome ?? null,
    bairros,
  };
}

const SELECAO = `
  id, slug, nome, crm, crm_uf, publicado,
  profissional_especialidade ( principal, especialidade ( nome ) ),
  atendimento ( local ( bairro ( nome ) ) )
`;

export async function listarMedicos(
  cliente: SupabaseClient,
  opcoes: { termo?: string; pagina?: number },
): Promise<{ medicos: MedicoNaLista[]; total: number }> {
  const { de, ate } = faixaDaPagina(opcoes.pagina ?? 1);
  const termo = (opcoes.termo ?? "").trim();

  let consulta = cliente
    .from("profissional")
    .select(SELECAO, { count: "exact" })
    .order("nome", { ascending: true })
    .range(de, ate);

  if (termo) {
    /* Nome OU CRM. `%` nas duas pontas para achar sobrenome também. */
    const escapado = termo.replace(/[%,]/g, " ");
    consulta = consulta.or(`nome.ilike.%${escapado}%,crm.ilike.%${escapado}%`);
  }

  const { data, error, count } = await consulta;
  if (error) throw new Error(`Falha ao listar médicos: ${error.message}`);

  return { medicos: (data ?? []).map(paraLista), total: count ?? 0 };
}
```

- [ ] **Step 4: Escrever `components/painel/LinhaDoPainel.tsx`**

```tsx
import Link from "next/link";
import { alternarPublicacao } from "@/app/painel/acoes";
import type { MedicoNaLista } from "@/lib/painel/consultas";

/*
  Uma linha da lista.

  O estado de publicação é o que esta tela existe para mostrar: é a única
  superfície do projeto onde o médico despublicado aparece.
*/
export function LinhaDoPainel({ medico }: { medico: MedicoNaLista }) {
  return (
    <li className="flex flex-wrap items-center gap-4 border-b border-line py-4">
      <div className="min-w-0 flex-1">
        <Link
          href={`/painel/medico/${medico.id}`}
          className="text-[17px] font-semibold text-ink-900 hover:underline"
        >
          {medico.nome}
        </Link>
        <p className="registro mt-1 text-[14px] text-ink-400">
          CRM/{medico.crmUf} {medico.crm}
          {medico.especialidade ? ` · ${medico.especialidade}` : ""}
          {medico.bairros.length ? ` · ${medico.bairros.join(", ")}` : ""}
        </p>
      </div>

      <span
        className={
          medico.publicado
            ? "registro rounded-chip bg-ami-green-600 px-3 py-1 text-[13px] text-white"
            : "registro rounded-chip border border-line px-3 py-1 text-[13px] text-ink-400"
        }
      >
        {medico.publicado ? "no ar" : "fora do ar"}
      </span>

      <form action={alternarPublicacao}>
        <input type="hidden" name="id" value={medico.id} />
        <input type="hidden" name="publicado" value={String(!medico.publicado)} />
        <button
          type="submit"
          className="pressiona rounded-controle border border-line px-4 py-2 text-[14px] font-medium text-ink-600 hover:text-ink-900"
        >
          {medico.publicado ? "Tirar do ar" : "Pôr no ar"}
        </button>
      </form>
    </li>
  );
}
```

- [ ] **Step 5: Escrever `app/painel/page.tsx`**

```tsx
import Link from "next/link";
import { LinhaDoPainel } from "@/components/painel/LinhaDoPainel";
import { POR_PAGINA, listarMedicos } from "@/lib/painel/consultas";
import { clienteDoPainel } from "@/lib/painel/servidor";
import { exigirAdmin } from "@/lib/painel/sessao";
import { contagem } from "@/lib/formato";

/* Painel nunca é cacheado: ele mostra o estado agora, não o de uma hora atrás. */
export const dynamic = "force-dynamic";

export default async function PaginaDoPainel({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; pagina?: string }>;
}) {
  await exigirAdmin();

  const { q, pagina } = await searchParams;
  const numero = Number(pagina ?? "1") || 1;

  const cliente = await clienteDoPainel();
  const { medicos, total } = await listarMedicos(cliente, { termo: q, pagina: numero });

  const ultimaPagina = Math.max(1, Math.ceil(total / POR_PAGINA));

  return (
    <>
      <h1 className="text-[28px] font-semibold text-ink-900">Médicos</h1>
      <p className="mt-1 text-[16px] text-ink-600">
        {contagem(total, "médico no cadastro", "médicos no cadastro")}, publicados ou não.
      </p>

      <form method="get" className="mt-6 flex gap-3">
        <input
          type="search"
          name="q"
          defaultValue={q ?? ""}
          placeholder="Buscar por nome ou CRM"
          aria-label="Buscar por nome ou CRM"
          className="w-full max-w-[420px] rounded-controle border border-line bg-surface px-4 py-3 text-[16px] text-ink-900 outline-none focus-visible:border-ami-green-600"
        />
        <button
          type="submit"
          className="pressiona rounded-controle bg-ami-green-600 px-5 text-[15px] font-semibold text-white hover:bg-ami-green-700"
        >
          Buscar
        </button>
      </form>

      {medicos.length === 0 ? (
        <p className="mt-10 text-[16px] text-ink-600">
          Nenhum médico encontrado{q ? ` para "${q}"` : ""}.
        </p>
      ) : (
        <ul className="mt-6">
          {medicos.map((m) => (
            <LinhaDoPainel key={m.id} medico={m} />
          ))}
        </ul>
      )}

      {ultimaPagina > 1 ? (
        <nav className="mt-8 flex items-center gap-4 text-[15px]" aria-label="Páginas">
          {numero > 1 ? (
            <Link
              href={`/painel?${new URLSearchParams({ ...(q ? { q } : {}), pagina: String(numero - 1) })}`}
              className="text-ink-600 hover:text-ink-900"
            >
              ← Anterior
            </Link>
          ) : null}
          <span className="registro text-ink-400">
            página {numero} de {ultimaPagina}
          </span>
          {numero < ultimaPagina ? (
            <Link
              href={`/painel?${new URLSearchParams({ ...(q ? { q } : {}), pagina: String(numero + 1) })}`}
              className="text-ink-600 hover:text-ink-900"
            >
              Próxima →
            </Link>
          ) : null}
        </nav>
      )}
    </>
  );
}
```

- [ ] **Step 6: Rodar e confirmar que passa**

Run: `npx vitest run testes/painel-consultas.test.ts`
Expected: PASS, 9 testes

- [ ] **Step 7: Commit**

```bash
git add lib/painel/consultas.ts app/painel/page.tsx components/painel/LinhaDoPainel.tsx testes/painel-consultas.test.ts
git commit -m "Lista os médicos do painel, com busca e paginação

A tradução de linha para domínio fica separada da ida ao banco: é ela que
tem as regras -- qual especialidade mostrar, bairro repetido, laço ausente
-- e é o que dá para testar sem banco.

A lista é a única superfície do projeto onde o médico despublicado
aparece, então o estado de publicação é o que ela mais precisa mostrar.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Task 7: Publicar e despublicar

**Files:**
- Create: `app/painel/acoes.ts`
- Test: `testes/painel-acoes.test.ts`

**Interfaces:**
- Consumes: `clienteDoPainel()`, `exigirAdmin()`
- Produces: `alternarPublicacao(dados: FormData): Promise<void>`

- [ ] **Step 1: Escrever o teste que falha, em `testes/painel-acoes.test.ts`**

```ts
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

function fonte(relativo: string): string {
  return readFileSync(fileURLToPath(new URL(relativo, import.meta.url)), "utf8");
}

const ACOES = [
  "../app/painel/acoes.ts",
  "../app/painel/entrar/acoes.ts",
];

describe("as ações do painel", () => {
  for (const caminho of ACOES) {
    it(`${caminho} é ação de servidor`, () => {
      expect(fonte(caminho).trimStart().startsWith('"use server"')).toBe(true);
    });
  }

  it("nenhuma ação remove nada", () => {
    /* Não existe política de remoção no banco, então uma chamada de remoção
       aqui falharia — mas falharia em tempo de execução, e o teste é mais
       barato que descobrir assim. */
    for (const caminho of ACOES) {
      expect(fonte(caminho)).not.toMatch(/\.delete\s*\(/);
    }
  });
});

describe("alternarPublicacao", () => {
  const codigo = fonte("../app/painel/acoes.ts");

  it("confere a permissão antes de gravar", () => {
    const posGuarda = codigo.indexOf("exigirAdmin");
    const posEscrita = codigo.indexOf(".update(");
    expect(posGuarda).toBeGreaterThan(-1);
    expect(posEscrita).toBeGreaterThan(posGuarda);
  });

  it("invalida o site público depois de gravar", () => {
    /*
      Sem isto, publicar um médico não o faria aparecer por até uma hora — as
      páginas do site revalidam de hora em hora — e a conclusão natural seria
      que o botão não funcionou.
    */
    expect(codigo).toContain('revalidatePath("/(site)", "layout")');
    const posEscrita = codigo.indexOf(".update(");
    const posInvalida = codigo.indexOf("revalidatePath");
    expect(posInvalida).toBeGreaterThan(posEscrita);
  });
});
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `npx vitest run testes/painel-acoes.test.ts`
Expected: FAIL com `ENOENT` em `app/painel/acoes.ts`

- [ ] **Step 3: Escrever `app/painel/acoes.ts`**

```ts
"use server";

import { revalidatePath } from "next/cache";
import { clienteDoPainel } from "@/lib/painel/servidor";
import { exigirAdmin } from "@/lib/painel/sessao";

/*
  Pôr no ar e tirar do ar.

  Despublicar é `publicado = false`, nunca remoção — e não existe política de
  remoção no banco, então nem haveria como. O dado fica.

  `exigirAdmin()` antes de gravar é a primeira tranca; a política do Postgres
  é a última. As duas existem porque a de cima é a que dá mensagem decente, e
  a de baixo é a que não tem como ser esquecida.
*/
export async function alternarPublicacao(dados: FormData): Promise<void> {
  await exigirAdmin();

  const id = Number(dados.get("id"));
  const publicado = dados.get("publicado") === "true";

  if (!Number.isInteger(id) || id <= 0) {
    throw new Error("Identificador de médico inválido.");
  }

  const cliente = await clienteDoPainel();
  const { error } = await cliente
    .from("profissional")
    .update({ publicado, atualizado_em: new Date().toISOString() })
    .eq("id", id);

  if (error) throw new Error(`Não consegui alterar a publicação: ${error.message}`);

  /*
    O site público é gerado estaticamente e revalida de hora em hora. Um
    médico entrando no ar mexe na home, no índice, na página da especialidade,
    na do bairro, no perfil e no sitemap — listar as seis à mão é lista para
    ficar desatualizada, e isto aqui acontece algumas vezes por dia.

    Isto NÃO levanta a trava de indexação: enquanto
    NEXT_PUBLIC_DADOS_DEMONSTRACAO for true, o robots.txt segue bloqueando o
    site inteiro para buscadores.
  */
  revalidatePath("/(site)", "layout");
  revalidatePath("/painel");
}
```

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `npx vitest run testes/painel-acoes.test.ts`
Expected: PASS, 5 testes

- [ ] **Step 5: Commit**

```bash
git add app/painel/acoes.ts testes/painel-acoes.test.ts
git commit -m "Põe e tira médico do ar, e avisa o site público

Sem invalidar o site, publicar um médico não o faria aparecer por até uma
hora, e a conclusão natural seria que o botão não funcionou. A invalidação
é do layout inteiro do site: publicar mexe na home, no índice, na faceta,
no bairro, no perfil e no sitemap, e listar as seis à mão fica
desatualizado.

Despublicar é publicado = false, nunca remoção -- e não existe política de
remoção no banco, então nem haveria como.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Task 8: A tela de edição

**Files:**
- Create: `app/painel/medico/[id]/page.tsx`
- Create: `app/painel/medico/[id]/acoes.ts`
- Create: `components/painel/FormularioMedico.tsx`
- Modify: `lib/painel/consultas.ts` (acrescenta `medicoPorId`)
- Test: `testes/painel-edicao.test.ts`

**Interfaces:**
- Consumes: `validarMedico`, `oQueFalta` de `lib/painel/medico.ts`; `exigirAdmin`, `clienteDoPainel`
- Produces:
```ts
// em lib/painel/consultas.ts
export type MedicoDoPainel = MedicoNaLista & {
  bio: string | null; telemedicina: boolean; situacao: string; verificadoEm: string | null;
};
export async function medicoPorId(cliente: SupabaseClient, id: number): Promise<MedicoDoPainel | null>;

// em app/painel/medico/[id]/acoes.ts
export type EstadoDaEdicao = { erros: Record<string, string>; salvo: boolean };
export async function salvarMedico(anterior: EstadoDaEdicao, dados: FormData): Promise<EstadoDaEdicao>;
```

- [ ] **Step 1: Escrever o teste que falha, em `testes/painel-edicao.test.ts`**

```ts
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

function fonte(relativo: string): string {
  return readFileSync(fileURLToPath(new URL(relativo, import.meta.url)), "utf8");
}

describe("salvarMedico", () => {
  const codigo = fonte("../app/painel/medico/[id]/acoes.ts");

  it("é ação de servidor e confere permissão antes de gravar", () => {
    expect(codigo.trimStart().startsWith('"use server"')).toBe(true);
    expect(codigo.indexOf(".update(")).toBeGreaterThan(codigo.indexOf("exigirAdmin"));
  });

  it("valida no servidor, e não só no navegador", () => {
    expect(codigo).toContain("validarMedico");
  });

  it("nunca grava o slug", () => {
    /*
      Mesma regra que o importador respeita: o endereço do perfil é uma URL
      que o Google indexou, e mudá-la a apaga. A tela mostra e não edita.
    */
    expect(codigo).not.toMatch(/slug\s*:/);
  });

  it("invalida o site público depois de gravar", () => {
    expect(codigo).toContain('revalidatePath("/(site)", "layout")');
  });
});

describe("o formulário de edição", () => {
  const form = fonte("../components/painel/FormularioMedico.tsx");

  it("usa useActionState", () => {
    expect(form).toContain("useActionState");
  });

  it("mostra o endereço do perfil sem deixar editar", () => {
    expect(form).toMatch(/readOnly|disabled/);
    expect(form).not.toMatch(/name="slug"/);
  });

  it("explica por que o endereço não muda", () => {
    expect(form.toLowerCase()).toMatch(/google|indexad/);
  });
});
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `npx vitest run testes/painel-edicao.test.ts`
Expected: FAIL com `ENOENT`

- [ ] **Step 3: Acrescentar `medicoPorId` a `lib/painel/consultas.ts`**

```ts
export type MedicoDoPainel = MedicoNaLista & {
  bio: string | null;
  telemedicina: boolean;
  situacao: string;
  verificadoEm: string | null;
};

const SELECAO_COMPLETA = `
  id, slug, nome, crm, crm_uf, publicado, bio, telemedicina, situacao, verificado_em,
  profissional_especialidade ( principal, especialidade ( nome ) ),
  atendimento ( local ( bairro ( nome ) ) )
`;

export async function medicoPorId(
  cliente: SupabaseClient,
  id: number,
): Promise<MedicoDoPainel | null> {
  const { data, error } = await cliente
    .from("profissional")
    .select(SELECAO_COMPLETA)
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`Falha ao ler o médico ${id}: ${error.message}`);
  if (!data) return null;

  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  const l = data as any;

  return {
    ...paraLista(data),
    bio: l.bio,
    telemedicina: l.telemedicina,
    situacao: l.situacao,
    verificadoEm: l.verificado_em,
  };
}
```

- [ ] **Step 4: Escrever `app/painel/medico/[id]/acoes.ts`**

```ts
"use server";

import { revalidatePath } from "next/cache";
import { validarMedico } from "@/lib/painel/medico";
import { clienteDoPainel } from "@/lib/painel/servidor";
import { exigirAdmin } from "@/lib/painel/sessao";

export type EstadoDaEdicao = { erros: Record<string, string>; salvo: boolean };

/*
  Salvar os campos do médico.

  A validação roda AQUI, não só no navegador: `required` no HTML é conforto
  para quem preenche, não garantia — qualquer requisição montada à mão passa
  por cima dele.

  O `slug` não aparece em lugar nenhum desta função, e é deliberado: o
  endereço do perfil é uma URL que o Google indexou, e recalculá-la a apaga.
  Mesma regra que o importador respeita.
*/
export async function salvarMedico(
  _anterior: EstadoDaEdicao,
  dados: FormData,
): Promise<EstadoDaEdicao> {
  await exigirAdmin();

  const id = Number(dados.get("id"));
  if (!Number.isInteger(id) || id <= 0) {
    return { erros: { geral: "Identificador de médico inválido." }, salvo: false };
  }

  const validacao = validarMedico({
    nome: String(dados.get("nome") ?? ""),
    crm: String(dados.get("crm") ?? ""),
    crmUf: String(dados.get("crmUf") ?? ""),
    telemedicina: dados.get("telemedicina") === "on",
    situacao: String(dados.get("situacao") ?? "ativo"),
    bio: String(dados.get("bio") ?? ""),
    verificadoEm: String(dados.get("verificadoEm") ?? ""),
  });

  if (!validacao.ok) {
    return { erros: validacao.erros as Record<string, string>, salvo: false };
  }

  const cliente = await clienteDoPainel();
  const { error } = await cliente
    .from("profissional")
    .update({ ...validacao.valor, atualizado_em: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    /* A restrição de unicidade de (crm, crm_uf) é a que mais dispara aqui. */
    return {
      erros: { geral: `Não consegui salvar: ${error.message}` },
      salvo: false,
    };
  }

  revalidatePath("/(site)", "layout");
  revalidatePath("/painel");

  return { erros: {}, salvo: true };
}
```

- [ ] **Step 5: Escrever `components/painel/FormularioMedico.tsx`**

```tsx
"use client";

import { useActionState } from "react";
import { salvarMedico, type EstadoDaEdicao } from "@/app/painel/medico/[id]/acoes";
import type { MedicoDoPainel } from "@/lib/painel/consultas";

const INICIAL: EstadoDaEdicao = { erros: {}, salvo: false };

const CAMPO =
  "w-full rounded-controle border border-line bg-surface px-4 py-3 text-[16px] " +
  "text-ink-900 outline-none focus-visible:border-ami-green-600";

function Erro({ texto }: { texto?: string }) {
  if (!texto) return null;
  return (
    <p role="alert" className="mt-1 text-[14px] text-warn">
      {texto}
    </p>
  );
}

export function FormularioMedico({ medico }: { medico: MedicoDoPainel }) {
  const [estado, acao, pendente] = useActionState(salvarMedico, INICIAL);

  return (
    <form action={acao} className="mt-8 max-w-[640px] space-y-5">
      <input type="hidden" name="id" value={medico.id} />

      <div>
        <label htmlFor="nome" className="block text-[14px] font-medium text-ink-600">
          Nome
        </label>
        <input id="nome" name="nome" defaultValue={medico.nome} required className={`mt-1 ${CAMPO}`} />
        <Erro texto={estado.erros.nome} />
      </div>

      <div className="flex gap-4">
        <div className="flex-1">
          <label htmlFor="crm" className="block text-[14px] font-medium text-ink-600">
            CRM
          </label>
          <input id="crm" name="crm" defaultValue={medico.crm} required className={`mt-1 ${CAMPO}`} />
          <Erro texto={estado.erros.crm} />
        </div>
        <div className="w-28">
          <label htmlFor="crmUf" className="block text-[14px] font-medium text-ink-600">
            UF
          </label>
          <input id="crmUf" name="crmUf" defaultValue={medico.crmUf} required className={`mt-1 ${CAMPO}`} />
          <Erro texto={estado.erros.crmUf} />
        </div>
      </div>

      <div>
        <label htmlFor="situacao" className="block text-[14px] font-medium text-ink-600">
          Situação
        </label>
        <select id="situacao" name="situacao" defaultValue={medico.situacao} className={`mt-1 ${CAMPO}`}>
          <option value="ativo">ativo</option>
          <option value="inativo">inativo</option>
        </select>
        <Erro texto={estado.erros.situacao} />
      </div>

      <label className="flex items-center gap-3 text-[16px] text-ink-900">
        <input type="checkbox" name="telemedicina" defaultChecked={medico.telemedicina} />
        Atende por telemedicina
      </label>

      <div>
        <label htmlFor="bio" className="block text-[14px] font-medium text-ink-600">
          Biografia
        </label>
        <textarea id="bio" name="bio" rows={5} defaultValue={medico.bio ?? ""} className={`mt-1 ${CAMPO}`} />
        <p className="mt-1 text-[14px] text-ink-400">
          Sem linguagem de propaganda: a Resolução CFM 2.336/2023 proíbe médico de se
          anunciar como o melhor ou como referência.
        </p>
        <Erro texto={estado.erros.bio} />
      </div>

      <div>
        <label htmlFor="verificadoEm" className="block text-[14px] font-medium text-ink-600">
          Verificado em
        </label>
        <input
          id="verificadoEm"
          name="verificadoEm"
          placeholder="2026-08-22"
          defaultValue={medico.verificadoEm ?? ""}
          className={`mt-1 ${CAMPO}`}
        />
        <Erro texto={estado.erros.verificadoEm} />
      </div>

      <div>
        <label htmlFor="endereco-do-perfil" className="block text-[14px] font-medium text-ink-600">
          Endereço do perfil
        </label>
        <input
          id="endereco-do-perfil"
          readOnly
          value={`/medico/${medico.slug}`}
          className={`mt-1 ${CAMPO} bg-canvas text-ink-400`}
        />
        <p className="mt-1 text-[14px] text-ink-400">
          Não muda, nem quando o nome muda. É a URL que o Google indexou, e trocá-la
          apaga o perfil da busca.
        </p>
      </div>

      <Erro texto={estado.erros.geral} />

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={pendente}
          className="pressiona inline-flex min-h-12 items-center rounded-controle bg-ami-green-600 px-6 text-[15px] font-semibold text-white shadow-apoio hover:bg-ami-green-700 disabled:opacity-60"
        >
          {pendente ? "Salvando…" : "Salvar"}
        </button>
        <p aria-live="polite" className="text-[15px] text-ink-600">
          {estado.salvo ? "Salvo." : ""}
        </p>
      </div>
    </form>
  );
}
```

- [ ] **Step 6: Escrever `app/painel/medico/[id]/page.tsx`**

```tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { FormularioMedico } from "@/components/painel/FormularioMedico";
import { oQueFalta } from "@/lib/painel/medico";
import { medicoPorId } from "@/lib/painel/consultas";
import { clienteDoPainel } from "@/lib/painel/servidor";
import { exigirAdmin } from "@/lib/painel/sessao";

export const dynamic = "force-dynamic";

export default async function PaginaDeEdicao({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await exigirAdmin();

  const { id } = await params;
  const numero = Number(id);
  if (!Number.isInteger(numero) || numero <= 0) notFound();

  const cliente = await clienteDoPainel();
  const medico = await medicoPorId(cliente, numero);
  if (!medico) notFound();

  const falta = oQueFalta({
    temEspecialidade: medico.especialidade !== null,
    temEndereco: medico.bairros.length > 0,
    temBio: Boolean(medico.bio),
  });

  return (
    <>
      <Link href="/painel" className="text-[15px] text-ink-600 hover:text-ink-900">
        ← Todos os médicos
      </Link>

      <h1 className="mt-4 text-[28px] font-semibold text-ink-900">{medico.nome}</h1>

      <p className="registro mt-1 text-[15px] text-ink-400">
        {medico.publicado ? "no ar" : "fora do ar"}
        {" · "}
        <Link href={`/medico/${medico.slug}`} className="hover:text-ink-900">
          ver no site
        </Link>
      </p>

      {falta.length ? (
        <p className="mt-4 rounded-bloco border border-line bg-surface px-4 py-3 text-[15px] text-ink-600">
          Falta: {falta.join(", ")}. Endereços, horários e especialidades entram na
          próxima etapa do painel.
        </p>
      ) : null}

      <FormularioMedico medico={medico} />
    </>
  );
}
```

- [ ] **Step 7: Rodar e confirmar que passa**

Run: `npx vitest run testes/painel-edicao.test.ts`
Expected: PASS, 7 testes

Run: `npx vitest run` · `npx tsc --noEmit` · `npx next build`
Expected: tudo limpo. A build precisa continuar gerando as 58 páginas do site mais as do painel.

- [ ] **Step 8: Commit**

```bash
git add app/painel/medico components/painel/FormularioMedico.tsx lib/painel/consultas.ts testes/painel-edicao.test.ts
git commit -m "Edita os campos do médico

A validação roda no servidor, não só no navegador: required no HTML é
conforto para quem preenche, não garantia. E o slug não aparece em lugar
nenhum da ação de salvar -- o endereço do perfil é uma URL que o Google
indexou, e trocá-la apaga o perfil da busca. A tela mostra e explica.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Task 9: Os passos para criar a primeira conta, e o estado do projeto

**Files:**
- Create: `docs/como-criar-a-conta-do-painel.md`
- Modify: `docs/estado-do-projeto.md`

**Interfaces:**
- Consumes: nada
- Produces: nada — é documentação

- [ ] **Step 1: Escrever `docs/como-criar-a-conta-do-painel.md`**

Passos numerados, com o nome de cada botão. Estrutura obrigatória:

1. **O que este documento resolve** — a primeira conta de admin do painel não pode ser criada pelo próprio painel, porque não há admin ainda para criá-la. Nasce no painel do Supabase.
2. **Rodar a migração** — supabase.com → o projeto → **SQL Editor** → **New query** → colar `supabase/migrations/0005_painel.sql` → **Run**.
3. **Criar a conta** — **Authentication** → **Users** → **Add user** → **Create new user** → e-mail e senha → marcar **Auto Confirm User**, porque sem envio de e-mail configurado a conta ficaria esperando uma confirmação que nunca chega.
4. **Descobrir o id da conta** — SQL Editor: `select id, email from auth.users;`
5. **Dar o papel de admin** — colar, trocando o uuid:
   ```sql
   insert into perfil_usuario (id, papel) values ('<o uuid>', 'admin');
   ```
6. **Conferir as políticas** — abrir `supabase/testes-rls.sql`, trocar o uuid do topo, colar e rodar. Esperado: `TODAS AS ASSERCOES PASSARAM`, e nenhuma exceção.
7. **Entrar** — `npm run dev`, abrir `/painel`, entrar com o e-mail e a senha.
8. **A conferência que prova a corrente inteira** — achar um médico fora do ar, pôr no ar, abrir o site numa janela anônima e ver que apareceu; tirar do ar e ver que sumiu. É o que prova sessão, política, gravação e invalidação juntas, e nenhum teste automático deste projeto prova.
9. **Se algo falhar** — três sintomas e o que significam: "e-mail ou senha não conferem" logo depois de criar a conta costuma ser **Auto Confirm User** desmarcado; entrar e ver a tela de entrar de novo é conta sem linha em `perfil_usuario`; entrar e a lista vir vazia é a migração não ter rodado.

Ao fim, uma linha dizendo que rótulo de botão muda com o tempo e que o que vale é o caminho das telas.

- [ ] **Step 2: Atualizar `docs/estado-do-projeto.md`**

Na seção 4, trocar a linha do painel por:

```markdown
- **Painel da agência**, em `/painel`: a fatia 1 está construída — entrar com e-mail e senha, listar os médicos incluindo os que não estão no ar, pôr e tirar do ar um a um, e editar os campos do médico. A primeira conta se cria pelos passos de [`docs/como-criar-a-conta-do-painel.md`](como-criar-a-conta-do-painel.md). Faltam as fatias 2 (estabelecimentos, locais e horários, especialidades, diretoria, comunicados, anuidades) e 3 (fila de revisões e "Atualizar meus dados")
```

E atualizar a data e a contagem de commits do cabeçalho, medindo com `git rev-list --count HEAD`.

- [ ] **Step 3: Conferir que os links resolvem**

```bash
grep -o "](\([^)]*\.md\)" docs/*.md | sed 's/.*](//' | while read -r f; do test -f "docs/$f" && echo "ok $f" || echo "QUEBRADO $f"; done
```

Expected: nenhuma linha começando com `QUEBRADO`

- [ ] **Step 4: Commit**

```bash
git add docs/como-criar-a-conta-do-painel.md docs/estado-do-projeto.md
git commit -m "Documenta como criar a primeira conta do painel

A primeira conta de admin não pode ser criada pelo próprio painel, porque
não existe admin ainda para criá-la. Os passos vão com o nome de cada
botão, e terminam na conferência que prova a corrente inteira -- sessão,
política, gravação e invalidação -- que nenhum teste automático deste
projeto alcança.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Autorrevisão do plano

Feita depois de escrever, contra a especificação.

**Cobertura da spec, seção a seção:**

| Seção da spec | Tarefa |
|---|---|
| 2 — as duas armadilhas medidas | 2 (teste que trava as duas) |
| 3 — entrada por senha | 4 |
| 3 — ninguém se cadastra sozinho | 9 (a conta nasce no painel do Supabase) |
| 3 — conta sem perfil não é ninguém | 1 (nenhuma política a reconhece), 3 (`exigirAdmin` a manda embora) |
| 3 — a sessão é quem escreve | 2 |
| 3 — nenhuma chave privilegiada no aplicativo | 2 (teste) |
| 3 — permissão em cada página, nunca no layout | 3 (teste) |
| 3 — `getUser()` e não `getSession()` | 3 (teste) |
| 3 — o proxy só vale para `/painel` | 2 (teste do matcher) |
| 3 — nenhuma política de remoção | 1 (teste do SQL), 7 (teste das ações) |
| 3 — o slug aparece e não edita | 8 (dois testes) |
| 3 — sem biblioteca de validação | 5 |
| 4 — `perfil_usuario` | 1 |
| 5 — os três clientes | 2 |
| 6 — a função, a leitura de admin, a escrita | 1 |
| 7 — entrar | 4 |
| 7 — sair | 3 (botão), 4 (ação) |
| 7 — o `noindex` | 3 (teste) |
| 7 — lista com busca e paginação | 6 |
| 7 — edição | 8 |
| 7 — o medidor do que falta | 5 (puro), 8 (na tela) |
| 7 — a invalidação do site público | 7 (teste), 8 |
| 7 — o que "publicar" não faz | 7 (comentário no código) |
| 8 — testes automáticos, `testes-rls.sql`, conferência à mão | 1, 5, 6, 9 |

**Consistência de tipos:** `Sessao` é declarado na tarefa 3 e usado na 6, 7 e 8. `MedicoNaLista` nasce na 6 e a 8 o estende como `MedicoDoPainel`. `CamposDoMedico`/`MedicoValidado`/`Validacao` nascem na 5 e são consumidos na 8. `EstadoDeEntrada` (tarefa 4) e `EstadoDaEdicao` (tarefa 8) são distintos de propósito: um carrega uma string de erro, o outro um mapa por campo.

**Três lacunas achadas na revisão e corrigidas:**

1. **A tarefa 3 importava `sair` de um arquivo que a tarefa 4 cria.** Sem aviso, a build quebraria entre as duas tarefas. A tarefa 3 agora diz explicitamente que a ordem importa e que os testes dela não dependem da 4.
2. **`app/painel/page.tsx` precisava de `dynamic = "force-dynamic"`.** Sem isso o Next tentaria gerar a página estaticamente na build, e `cookies()` numa página estática levanta — a build quebraria. As duas páginas do painel declaram.
3. **O teste da ordem entre gravar e invalidar.** Um `revalidatePath` colocado antes do `update` compila, roda e não invalida nada — o cache é derrubado antes de o dado mudar. O teste da tarefa 7 compara as posições no arquivo.
