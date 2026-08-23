# Painel da agência, fatia 2 — plano de implementação

> **Para quem executa:** SUB-SKILL OBRIGATÓRIA: use `superpowers:subagent-driven-development` (recomendado) ou `superpowers:executing-plans` para implementar tarefa a tarefa. Os passos usam caixinha (`- [ ]`) para acompanhamento.

**Objetivo:** dar à AMI a capacidade de montar um perfil de médico completo — especialidades e consultórios — sem depender da agência, e tirar do site os horários, que o produto não usa.

**Arquitetura:** a página de edição do médico vira três blocos empilhados, cada um com formulário e ação de servidor próprios. Validação pura fica em `lib/painel/`, separada da ida ao banco, para ser testável sem banco. Uma migração acrescenta escrita a quatro tabelas e remoção a três. A retirada dos horários é trabalho de subtração espalhado por quatorze arquivos e vem primeiro, para o resto ser construído sobre uma base menor.

**Tecnologias:** Next.js 16.3.1 (App Router, Turbopack), React 19 com `useActionState`, Supabase (`@supabase/ssr`), Postgres com RLS, Vitest, Tailwind.

**Spec:** `docs/superpowers/specs/2026-08-23-painel-fatia-2-design.md`

## Restrições globais

- **Português em tudo que o usuário lê.** Mensagem de erro, rótulo, texto de botão. Mensagem crua do Postgres nunca chega à tela
- **Nada de `delete` fora das três tabelas permitidas:** `profissional_especialidade`, `atendimento`, `local_acessibilidade`. Em particular, nunca em `profissional`, `local`, `especialidade`, `bairro`, `horario`, `perfil_usuario`, `auth.users`
- **Toda gravação pede as linhas afetadas de volta** (`.select(...)` depois do `.update()`/`.insert()`/`.delete()`) e falha alto quando não vem nenhuma. O PostgREST filtra a linha que a política não admite em vez de recusar a chamada; sem isso a tela mente
- **Célula vazia nunca apaga.** Campo em branco significa "não tenho essa informação", não "apague o que está lá"
- **Todos os erros de um formulário voltam de uma vez**, não um por envio
- **`exigirAdmin()` é a primeira linha de toda ação de servidor**, antes de ler o `FormData`
- **Nenhuma migração já aplicada é editada.** Correção vira migração nova
- **Varredura de código-fonte roda sobre `semComentarios(...)`**, nunca sobre o fonte cru. Comentário não é código, e a prosa que explica uma regra costuma conter a expressão que a regra proíbe
- **Toda asserção de varredura tem que ser verificada mutando o código** — apague a linha que ela protege e confirme que o teste fica vermelho
- **Mensagens de commit sem acento**, seguindo o histórico do repositório
- **Rodar tudo:** `npx vitest run` · **Tipos:** `npx tsc --noEmit` · **Build:** `npm run build`

---

## Mapa de arquivos

**Apagados (tarefas 1–3)**

| arquivo | o que era |
|---|---|
| `components/diretorio/SeloAbertoAgora.tsx` | o "aberto agora" na lista de médicos |
| `components/diretorio/GradeHorarios.tsx` | a tabela de dias na página do médico |
| `lib/dados/horarios.ts` | `Horario`, `estaAbertoAgora`, `atendeNoDia`, `agruparPorDia` |
| `testes/horarios.test.ts` | testes do arquivo acima |

**Criados (tarefas 4–10)**

| arquivo | responsabilidade |
|---|---|
| `supabase/migrations/0006_painel_vinculos.sql` | as políticas de escrita e remoção |
| `lib/painel/especialidades.ts` | ler e validar especialidades de um médico |
| `lib/painel/locais.ts` | ler e validar consultórios |
| `app/painel/medico/[id]/acoes-especialidade.ts` | acrescentar, alterar e remover especialidade |
| `app/painel/medico/[id]/acoes-local.ts` | acrescentar, alterar e remover consultório |
| `components/painel/BlocoEspecialidades.tsx` | o bloco 2 da página |
| `components/painel/BlocoLocais.tsx` | o bloco 3 da página |
| `testes/painel-especialidades.test.ts` | regras de especialidade |
| `testes/painel-locais.test.ts` | regras de consultório |

**Modificados**

`app/(site)/medico/[slug]/page.tsx` · `app/(site)/medicos/page.tsx` · `components/diretorio/LinhaMedico.tsx` · `components/diretorio/PainelFiltros.tsx` · `lib/dados/filtros.ts` · `lib/dados/facetas.ts` · `lib/dados/medicos.ts` · `lib/dados/tipos.ts` · `lib/seo/jsonld.ts` · `lib/painel/medico.ts` · `lib/painel/consultas.ts` · `app/painel/medico/[id]/acoes.ts` · `app/painel/medico/[id]/page.tsx` · `components/painel/FormularioMedico.tsx` · `supabase/testes-rls.sql` · `testes/painel-acoes.test.ts` · `testes/painel-migracao.test.ts` · `testes/filtros.test.ts` · `testes/facetas.test.ts` · `testes/jsonld.test.ts`

---

## Tarefa 1: O selo "aberto agora" e o filtro de sábado saem

Os dois são promessas ao vivo sobre dado que ninguém mantém. Saem juntos porque dependem da mesma função, `atendeNoDia`.

**Arquivos:**
- Apagar: `components/diretorio/SeloAbertoAgora.tsx`
- Modificar: `components/diretorio/LinhaMedico.tsx` (linhas 43 e 102)
- Modificar: `components/diretorio/PainelFiltros.tsx` (linhas 44 e 149-153)
- Modificar: `lib/dados/filtros.ts` (linha 56 e o tipo de filtros)
- Modificar: `lib/dados/facetas.ts` (linha 249)
- Teste: `testes/filtros.test.ts`, `testes/facetas.test.ts`

**Interfaces:**
- Consome: nada de tarefas anteriores
- Produz: `aplicarFiltros` e as facetas deixam de aceitar `atendeSabado`. A tarefa 3 depende de `atendeNoDia` não ter mais nenhum chamador

- [ ] **Passo 1: Ver o estado atual antes de mexer**

```bash
npx vitest run
grep -rn "atendeSabado\|atendeNoDia\|AbertoAgora\|sabado" --include="*.ts" --include="*.tsx" app/ components/ lib/ testes/
```

Anote a contagem de testes que passa. É a linha de base.

- [ ] **Passo 2: Tirar os casos de sábado dos testes**

Em `testes/filtros.test.ts` e `testes/facetas.test.ts`, apague os blocos `it(...)` que exercitam `atendeSabado`. Não invente teste novo aqui: a tarefa é subtração, e o que prova que ela deu certo é o resto da suíte continuar verde.

- [ ] **Passo 3: Rodar e ver falhar por tipo, não por asserção**

```bash
npx tsc --noEmit
```

Esperado: ainda passa. Os testes foram removidos, não o código.

- [ ] **Passo 4: Tirar o campo `atendeSabado` do filtro**

Em `lib/dados/filtros.ts`, remova a linha 1 (`import { atendeNoDia } ...`), o campo `atendeSabado` do tipo de filtros, e o bloco:

```ts
      if (
        filtros.atendeSabado &&
        !m.locais.some((l) => atendeNoDia(l.horarios, 6))
      ) {
        return false;
      }
```

- [ ] **Passo 5: Tirar a faceta de sábado**

Em `lib/dados/facetas.ts`, remova a entrada que usa `l.horarios.some((h) => h.diaSemana === 6)` (linha 249) e o que a acompanha na estrutura de facetas.

- [ ] **Passo 6: Tirar a caixinha da tela**

Em `components/diretorio/PainelFiltros.tsx`, remova `sp.get("sabado")` (linha 44) e o bloco do rótulo "Atende aos sábados" (linhas 149-153), incluindo o `input` e o `onChange` que chama `aplicar({ atendeSabado: ... })`.

- [ ] **Passo 7: Tirar o selo da linha do médico**

Em `components/diretorio/LinhaMedico.tsx`, remova o import de `SeloAbertoAgora`, a linha 43 (`const horarios = local?.horarios ?? [];`) e a linha 102 (`{local ? <SeloAbertoAgora horarios={horarios} /> : null}`).

- [ ] **Passo 8: Apagar o componente**

```bash
git rm components/diretorio/SeloAbertoAgora.tsx
```

- [ ] **Passo 9: Conferir**

```bash
npx tsc --noEmit
npx vitest run
npm run build
```

Esperado: os três limpos. Se `tsc` reclamar de `atendeSabado` em algum lugar não listado, é consumidor que eu não mapeei — remova também e anote no commit.

- [ ] **Passo 10: Commit**

```bash
git add -A
git commit -m "Tira o selo de aberto agora e o filtro de sabado

Os dois prometem ao vivo sobre dado que ninguem mantem: a planilha da AMI
nao tem coluna de horario, entao com o cadastro real o selo nunca acenderia
e o filtro devolveria zero medicos para sempre."
```

---

## Tarefa 2: A grade sai da página do médico

**Arquivos:**
- Apagar: `components/diretorio/GradeHorarios.tsx`
- Modificar: `app/(site)/medico/[slug]/page.tsx` (linhas 174-175)
- Modificar: `app/(site)/medicos/page.tsx` (linhas 33 e 69)

**Interfaces:**
- Consome: da tarefa 1, que `atendeNoDia` já não tem chamador
- Produz: `agruparPorDia` fica sem chamador, o que a tarefa 3 precisa

- [ ] **Passo 1: Ver o trecho que sai**

```bash
sed -n '168,180p' "app/(site)/medico/[slug]/page.tsx"
```

- [ ] **Passo 2: Remover a seção da grade**

Em `app/(site)/medico/[slug]/page.tsx`, remova o import de `GradeHorarios` e o bloco das linhas 174-175:

```tsx
                <h3 className="sr-only">Horários em {l.bairro.nome}</h3>
                <GradeHorarios horarios={l.horarios} />
```

Se esse par estiver dentro de um elemento que existe só para envolvê-lo, remova o envoltório também. Endereço, telefone e WhatsApp continuam onde estão — eles são o objetivo da página agora.

- [ ] **Passo 3: Corrigir os textos que prometem horário**

Em `app/(site)/medicos/page.tsx`, linha 33 (a descrição para buscadores) e linha 69 (o texto na tela). As duas dizem hoje que o site mostra horários.

Linha 33, de:

```
      `Imperatriz - MA. Veja endereço, telefone e horários de atendimento.`,
```

para:

```
      `Imperatriz - MA. Veja endereço, telefone e especialidade de cada médico.`,
```

Linha 69, de:

```
        com endereço, telefone e horários por dia da semana. Todos os registros
```

para:

```
        com endereço, telefone e especialidade. Todos os registros
```

Confira a frase inteira depois de editar: as duas linhas fazem parte de períodos maiores, e o resto do período precisa continuar fazendo sentido.

- [ ] **Passo 4: Apagar o componente**

```bash
git rm components/diretorio/GradeHorarios.tsx
```

- [ ] **Passo 5: Conferir**

```bash
npx tsc --noEmit
npx vitest run
npm run build
```

- [ ] **Passo 6: Commit**

```bash
git add -A
git commit -m "Tira a grade de horarios da pagina do medico

E corrige os dois textos da lista que prometiam horario por dia da semana.
Endereco, telefone e WhatsApp ficam: sao o que fecha o encaminhamento."
```

---

## Tarefa 3: Horário sai da camada de dados

Depois desta tarefa, `horario` não é lido de lugar nenhum do site. A tabela continua no banco, com as 246 linhas intactas.

**Arquivos:**
- Apagar: `lib/dados/horarios.ts`, `testes/horarios.test.ts`
- Modificar: `lib/dados/tipos.ts` (linhas 1 e 41)
- Modificar: `lib/dados/medicos.ts` (a seleção e o mapeamento, linha 74 e o `select`)
- Modificar: `lib/seo/jsonld.ts` (linhas 83-90 e 123)
- Modificar: `testes/jsonld.test.ts`

**Interfaces:**
- Consome: das tarefas 1 e 2, que `atendeNoDia` e `agruparPorDia` não têm chamador
- Produz: o tipo `Local` de `lib/dados/tipos.ts` deixa de ter `horarios`

- [ ] **Passo 1: Confirmar que ninguém mais chama as funções**

```bash
grep -rn "atendeNoDia\|agruparPorDia\|estaAbertoAgora" --include="*.ts" --include="*.tsx" app/ components/ lib/ testes/
```

Esperado: só `lib/dados/horarios.ts` e `testes/horarios.test.ts`. Se aparecer outro, pare e remova o consumidor primeiro.

- [ ] **Passo 2: Tirar os casos de horário do teste de JSON-LD**

Em `testes/jsonld.test.ts`, apague os `it(...)` que verificam `openingHoursSpecification`. Se algum médico de exemplo do arquivo tiver `horarios: [...]`, remova esse campo dos exemplos.

- [ ] **Passo 3: Tirar do JSON-LD**

Em `lib/seo/jsonld.ts`, remova o bloco das linhas 83-90:

```ts
  const horarios = (local?.horarios ?? [])
    .filter((h) => DIAS[h.diaSemana] !== undefined)
    .map((h) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: DIAS[h.diaSemana],
      opens: h.abre,
      closes: h.fecha,
    }));
```

e a linha 123:

```ts
    ...(horarios.length ? { openingHoursSpecification: horarios } : {}),
```

Remova também a constante `DIAS` se ela ficar sem uso — confira com `grep -n "DIAS" lib/seo/jsonld.ts` antes.

- [ ] **Passo 4: Tirar da consulta do site**

Em `lib/dados/medicos.ts`: tire `horario ( ... )` da string de `select`, e o mapeamento da linha 74:

```ts
        horarios: (a.horario ?? []).map((h: any) => ({
```

junto com o objeto que ele produz.

- [ ] **Passo 5: Tirar do tipo**

Em `lib/dados/tipos.ts`, remova a linha 1 (`import type { Horario } from "@/lib/dados/horarios";`) e a linha 41 (`horarios: Horario[];`).

- [ ] **Passo 6: Apagar o módulo e o teste dele**

```bash
git rm lib/dados/horarios.ts testes/horarios.test.ts
```

- [ ] **Passo 7: A conferência que fecha a remoção**

```bash
grep -rn "horario\|Horario\|horário" --include="*.ts" --include="*.tsx" app/ components/ lib/ testes/ | grep -v painel | grep -v importador
```

**Esperado: nenhuma linha.** Este `grep` é o critério de aceitação desta tarefa. Se voltar alguma coisa, é referência órfã — remova antes de commitar.

- [ ] **Passo 8: Conferir**

```bash
npx tsc --noEmit
npx vitest run
npm run build
```

- [ ] **Passo 9: Commit**

```bash
git add -A
git commit -m "Horario sai da camada de dados, do JSON-LD e dos tipos

A tabela horario fica no banco com as 246 linhas: sao dos 24 medicos
ficticios e somem com eles no lancamento. Apagar dado e pior que deixa-lo
parado, e uma migracao para remover a tabela nao pagaria o proprio custo."
```

---

## Tarefa 4: A migração das políticas

**Arquivos:**
- Criar: `supabase/migrations/0006_painel_vinculos.sql`
- Modificar: `testes/painel-migracao.test.ts`
- Modificar: `testes/painel-acoes.test.ts` (o teste da linha 37)
- Modificar: `supabase/testes-rls.sql`

**Interfaces:**
- Consome: `eh_admin()`, criada em `0005_painel.sql`
- Produz: as permissões que as tarefas 6 a 10 usam. Nenhuma delas funciona contra o banco antes desta

- [ ] **Passo 1: Escrever o teste da migração primeiro**

Em `testes/painel-migracao.test.ts`, acrescente:

```ts
describe("0006_painel_vinculos.sql", () => {
  const sql = semComentarios(fonte("../supabase/migrations/0006_painel_vinculos.sql"))
    .toLowerCase();

  const PERMITE_REMOVER = [
    "profissional_especialidade",
    "atendimento",
    "local_acessibilidade",
  ];

  const NUNCA_REMOVE = [
    "profissional",
    "local",
    "especialidade",
    "bairro",
    "horario",
    "perfil_usuario",
  ];

  it("concede remoção exatamente nas três tabelas de ligação", () => {
    const alvos = [...sql.matchAll(/on\s+(\w+)\s+for\s+delete/g)].map((m) => m[1]);
    expect(alvos.sort()).toEqual([...PERMITE_REMOVER].sort());
  });

  it("não concede remoção em nenhuma tabela de cadastro", () => {
    for (const tabela of NUNCA_REMOVE) {
      expect(sql).not.toMatch(new RegExp(`on\\s+${tabela}\\s+for\\s+delete`));
    }
  });

  it("não usa for all, grant, drop table, truncate nem desliga RLS", () => {
    expect(sql).not.toMatch(/for\s+all\b/);
    expect(sql).not.toMatch(/\bgrant\b/);
    expect(sql).not.toMatch(/\bdrop\s+table\b/);
    expect(sql).not.toMatch(/\btruncate\b/);
    expect(sql).not.toMatch(/disable\s+row\s+level\s+security/);
  });

  it("nenhuma política de escrita passa sem eh_admin", () => {
    const politicas = [...sql.matchAll(/create\s+policy[\s\S]*?;/g)].map((m) => m[0]);
    expect(politicas.length).toBeGreaterThan(0);
    for (const p of politicas) expect(p).toContain("eh_admin()");
  });
});
```

Repare que `NUNCA_REMOVE` inclui `horario`: os horários saíram do produto nas tarefas 1 a 3, e conceder escrita a dado que nada consome é superfície sem uso.

- [ ] **Passo 2: Rodar e ver falhar**

```bash
npx vitest run testes/painel-migracao.test.ts
```

Esperado: FALHA com erro de leitura de arquivo — `0006_painel_vinculos.sql` não existe.

- [ ] **Passo 3: Escrever a migração**

Crie `supabase/migrations/0006_painel_vinculos.sql`:

```sql
-- Os vínculos do médico: especialidades e consultórios.
--
-- Esta é a primeira migração do projeto que concede REMOÇÃO. Ela é restrita a
-- três tabelas de ligação, e a razão está na spec da fatia 2, seção 7: desfazer
-- um vínculo não tem outra forma. Nenhuma tabela de cadastro é alcançada — nem
-- o médico, nem o consultório, nem a especialidade.

/*
  `(select eh_admin())` e não `eh_admin()`: a subconsulta é içável pelo
  planejador, que a avalia uma vez por consulta em vez de uma por linha. As
  políticas somam, então estas entram no caminho do site público também, e é
  esse caminho que mais interessa manter rápido. Mesma escolha de 0005.
*/

-- Especialidades do médico -------------------------------------------------

create policy admin_cria_especialidade_do_medico on profissional_especialidade
  for insert with check ((select eh_admin()));

create policy admin_altera_especialidade_do_medico on profissional_especialidade
  for update using ((select eh_admin())) with check ((select eh_admin()));

create policy admin_remove_especialidade_do_medico on profissional_especialidade
  for delete using ((select eh_admin()));

-- O vínculo médico ↔ consultório -------------------------------------------

/*
  Sem `for update`: a tabela só tem as duas chaves estrangeiras e o id. Trocar o
  consultório de um médico é remover a ligação e criar outra, não alterar esta.
*/
create policy admin_cria_atendimento on atendimento
  for insert with check ((select eh_admin()));

create policy admin_remove_atendimento on atendimento
  for delete using ((select eh_admin()));

-- O consultório -------------------------------------------------------------

/*
  Escrita sim, remoção não, e a assimetria é deliberada. Criar e corrigir
  endereço a AMI precisa. Apagar não: um endereço pode estar em uso por outro
  médico, e esta tabela não tem como saber disso na hora da política. Endereço
  órfão não aparece em lugar nenhum do site, e continuar existindo é mais barato
  que sumir por engano.
*/
create policy admin_cria_local on local
  for insert with check ((select eh_admin()));

create policy admin_altera_local on local
  for update using ((select eh_admin())) with check ((select eh_admin()));

-- Acessibilidade do consultório ---------------------------------------------

create policy admin_cria_acessibilidade on local_acessibilidade
  for insert with check ((select eh_admin()));

create policy admin_remove_acessibilidade on local_acessibilidade
  for delete using ((select eh_admin()));
```

- [ ] **Passo 4: Rodar e ver passar**

```bash
npx vitest run testes/painel-migracao.test.ts
```

Esperado: PASSA.

- [ ] **Passo 5: Provar que a asserção morde**

Acrescente temporariamente ao fim da migração:

```sql
create policy teste_da_mutacao on profissional
  for delete using ((select eh_admin()));
```

```bash
npx vitest run testes/painel-migracao.test.ts
```

Esperado: FALHA em "não concede remoção em nenhuma tabela de cadastro". **Apague essas três linhas** e rode de novo para confirmar que volta a passar.

- [ ] **Passo 6: Ajustar o teste que proíbe remoção nas ações**

`testes/painel-acoes.test.ts:37` diz hoje "nenhuma ação remove nada". Substitua por:

```ts
    it("remoção só nas três tabelas de ligação", () => {
      /*
        A fatia 2 concede remoção em profissional_especialidade, atendimento e
        local_acessibilidade, e em mais nada. Este teste vigia o lado do código:
        a política do banco é a outra metade, em painel-migracao.test.ts.
      */
      const PERMITIDAS = [
        "profissional_especialidade",
        "atendimento",
        "local_acessibilidade",
      ];

      for (const caminho of ACOES) {
        const codigo = semComentarios(fonte(caminho));
        const tabelas = [...codigo.matchAll(/from\("(\w+)"\)([\s\S]*?)(?=from\("|\z)/g)];

        for (const [, tabela, trecho] of tabelas) {
          if (/\.delete\s*\(/.test(trecho)) {
            expect(
              PERMITIDAS,
              `${caminho} remove de ${tabela}, que não permite remoção`,
            ).toContain(tabela);
          }
        }
      }
    });
```

- [ ] **Passo 7: Acrescentar as assertivas ao arquivo de conferência do banco**

Em `supabase/testes-rls.sql`, dentro do bloco `do $$ ... end $$;` e **antes** do `raise notice` final, acrescente:

```sql
  -- Fatia 2: os vínculos ----------------------------------------------------

  set local role authenticated;
  perform set_config('request.jwt.claims',
    json_build_object('sub', ninguem_uuid, 'role', 'authenticated')::text, true);

  begin
    insert into atendimento (profissional_id, local_id)
      values (medico_id, (select id from local limit 1));
    raise exception 'FALHOU: conta sem perfil cria atendimento';
  exception when insufficient_privilege then
    null; -- recusado, que é o esperado
  end;

  perform set_config('request.jwt.claims',
    json_build_object('sub', admin_uuid, 'role', 'authenticated')::text, true);

  insert into atendimento (profissional_id, local_id)
    values (medico_id, (select id from local limit 1));

  select count(*) into quantos from atendimento where profissional_id = medico_id;
  if quantos <> 1 then
    raise exception 'FALHOU: admin cria atendimento';
  end if;

  delete from atendimento where profissional_id = medico_id;
  if not found then
    raise exception 'FALHOU: admin remove atendimento';
  end if;

  begin
    delete from local where id = (select id from local limit 1);
    if found then raise exception 'FALHOU: ninguem apaga local'; end if;
  exception when insufficient_privilege then
    null; -- recusado, que é o esperado
  end;
```

O arquivo termina em `rollback;`, então nada disso persiste.

- [ ] **Passo 8: Conferir tudo**

```bash
npx vitest run
npx tsc --noEmit
```

- [ ] **Passo 9: Commit**

```bash
git add -A
git commit -m "Migracao 0006: escrita nos vinculos, remocao em tres deles

Primeira migracao do projeto que concede remocao. Restrita a
profissional_especialidade, atendimento e local_acessibilidade; nenhuma
tabela de cadastro e alcancada. A trava e reapontada, nao afrouxada: os dois
testes que a vigiavam passam a nomear as tres permitidas."
```

> **PARE AQUI e avise quem conduz.** A migração precisa ser colada no editor SQL do Supabase antes das tarefas 6 a 10 poderem ser conferidas contra o banco. As tarefas 5 em diante compilam e passam nos testes sem ela, mas não gravam.

---

## Tarefa 5: O campo "é associado da AMI"

O único campo do médico que nenhuma tela mostra. A decisão de não apagar médico depende dele.

**Arquivos:**
- Modificar: `lib/painel/medico.ts` (tipos e `validarMedico`)
- Modificar: `lib/painel/consultas.ts` (`SELECAO_COMPLETA` e `MedicoDoPainel`)
- Modificar: `app/painel/medico/[id]/acoes.ts` (leitura do `FormData`)
- Modificar: `components/painel/FormularioMedico.tsx`
- Teste: `testes/painel-medico.test.ts`

**Interfaces:**
- Consome: nada
- Produz: `CamposDoMedico` ganha `associadoAmi: boolean`; `MedicoValidado` ganha `associado_ami: boolean`; `MedicoDoPainel` ganha `associadoAmi: boolean`

- [ ] **Passo 1: Escrever o teste que falha**

Em `testes/painel-medico.test.ts`, acrescente ao bloco de `validarMedico`:

```ts
  it("carrega o campo de associado para o banco", () => {
    const r = validarMedico({
      nome: "Aline Peixoto",
      crm: "11918",
      crmUf: "MA",
      telemedicina: false,
      associadoAmi: true,
      situacao: "ativo",
      bio: "",
      verificadoEm: "",
    });

    expect(r.ok).toBe(true);
    if (r.ok) expect(r.valor.associado_ami).toBe(true);
  });

  it("associado falso é gravado como falso, não descartado", () => {
    const r = validarMedico({
      nome: "Aline Peixoto",
      crm: "11918",
      crmUf: "MA",
      telemedicina: false,
      associadoAmi: false,
      situacao: "ativo",
      bio: "",
      verificadoEm: "",
    });

    expect(r.ok).toBe(true);
    if (r.ok) expect(r.valor.associado_ami).toBe(false);
  });
```

O segundo teste existe porque "célula vazia nunca apaga" **não vale para caixa de marcar**: caixa desmarcada é uma afirmação ("não é associado"), não uma ausência. Um `||` no lugar errado transformaria `false` em "não mexe", e o médico que saiu continuaria associado.

- [ ] **Passo 2: Rodar e ver falhar**

```bash
npx vitest run testes/painel-medico.test.ts
```

Esperado: FALHA de tipo — `associadoAmi` não existe em `CamposDoMedico`.

- [ ] **Passo 3: Acrescentar aos tipos e à validação**

Em `lib/painel/medico.ts`:

```ts
export type CamposDoMedico = {
  nome: string;
  crm: string;
  crmUf: string;
  telemedicina: boolean;
  associadoAmi: boolean;
  situacao: string;
  bio: string;
  verificadoEm: string;
};

export type MedicoValidado = {
  nome: string;
  crm: string;
  crm_uf: string;
  telemedicina: boolean;
  associado_ami: boolean;
  situacao: "ativo" | "inativo";
  bio: string | null;
  verificado_em: string | null;
};
```

E no `return` de `validarMedico`, junto de `telemedicina`:

```ts
      /*
        Caixa desmarcada é afirmação, não ausência: "não é associado". A regra
        de célula vazia não se aplica a booleano, e trocar isto por um `||`
        deixaria quem saiu da associação associado para sempre.
      */
      associado_ami: campos.associadoAmi,
```

- [ ] **Passo 4: Rodar e ver passar**

```bash
npx vitest run testes/painel-medico.test.ts
```

- [ ] **Passo 5: Ler o campo do formulário**

Em `app/painel/medico/[id]/acoes.ts`, dentro da chamada de `validarMedico`, acrescente:

```ts
    associadoAmi: dados.get("associadoAmi") === "on",
```

- [ ] **Passo 6: Trazer o campo do banco para a tela**

Em `lib/painel/consultas.ts`, acrescente `associado_ami` a `SELECAO_COMPLETA`:

```ts
const SELECAO_COMPLETA = `
  id, slug, nome, crm, crm_uf, publicado, bio, telemedicina, associado_ami,
  situacao, verificado_em,
  profissional_especialidade ( principal, especialidade ( nome ) ),
  atendimento ( local ( bairro ( nome ) ) )
`;
```

Acrescente ao tipo:

```ts
export type MedicoDoPainel = MedicoNaLista & {
  bio: string | null;
  telemedicina: boolean;
  associadoAmi: boolean;
  situacao: string;
  verificadoEm: string | null;
};
```

E ao retorno de `medicoPorId`:

```ts
    associadoAmi: l.associado_ami,
```

- [ ] **Passo 7: Pôr a caixa no formulário**

Em `components/painel/FormularioMedico.tsx`, junto da caixa de telemedicina:

```tsx
      <div className="flex items-center gap-3">
        <input
          id="associadoAmi"
          name="associadoAmi"
          type="checkbox"
          defaultChecked={medico.associadoAmi}
          className="size-4 accent-ami-green-600"
        />
        <label htmlFor="associadoAmi" className="text-[15px] text-ink-900">
          É associado da AMI
        </label>
      </div>
      <p className="-mt-3 text-[14px] text-ink-400">
        Quem deixa a associação: desmarque aqui e tire do ar. O cadastro fica
        guardado, e voltar é um clique.
      </p>
```

- [ ] **Passo 8: Conferir**

```bash
npx vitest run
npx tsc --noEmit
npm run build
```

- [ ] **Passo 9: Commit**

```bash
git add -A
git commit -m "O campo de associado da AMI aparece na tela

Existia no banco desde 0001_diretorio.sql e nenhuma tela mostrava. E o
interruptor de que depende a decisao de nao apagar medico: quem sai vira
nao-associado e fora do ar."
```

---

## Tarefa 6: Ler e validar especialidades

Só a camada pura. A tela vem na tarefa 7.

**Arquivos:**
- Criar: `lib/painel/especialidades.ts`
- Criar: `testes/painel-especialidades.test.ts`

**Interfaces:**
- Consome: nada
- Produz:
  - `type EspecialidadeDoMedico = { id: number; nome: string; rqe: string | null; principal: boolean }`
  - `type EspecialidadeDisponivel = { id: number; nome: string }`
  - `validarRqe(rqe: string): { ok: true; valor: string | null } | { ok: false; erro: string }`
  - `avisoDeRqeFaltando(nomes: string[]): string | null`
  - `especialidadesDoMedico(cliente, medicoId): Promise<EspecialidadeDoMedico[]>`
  - `catalogoDeEspecialidades(cliente): Promise<EspecialidadeDisponivel[]>`

- [ ] **Passo 1: Escrever os testes**

Crie `testes/painel-especialidades.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { avisoDeRqeFaltando, validarRqe } from "@/lib/painel/especialidades";

describe("validarRqe", () => {
  it("aceita vazio, porque clínico geral sem RQE é caso normal", () => {
    const r = validarRqe("");
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.valor).toBeNull();
  });

  it("espaço em branco também vira nulo", () => {
    const r = validarRqe("   ");
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.valor).toBeNull();
  });

  it("guarda só os dígitos", () => {
    const r = validarRqe("RQE 12345");
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.valor).toBe("12345");
  });

  it("recusa texto sem nenhum dígito", () => {
    const r = validarRqe("não tenho");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.erro).toContain("número");
  });
});

describe("avisoDeRqeFaltando", () => {
  it("sem nome nenhum, não avisa", () => {
    expect(avisoDeRqeFaltando([])).toBeNull();
  });

  it("com um nome, avisa citando ele", () => {
    const aviso = avisoDeRqeFaltando(["Cardiologia"]);
    expect(aviso).toContain("Cardiologia");
  });

  it("com dois nomes, cita os dois", () => {
    const aviso = avisoDeRqeFaltando(["Cardiologia", "Pediatria"]);
    expect(aviso).toContain("Cardiologia");
    expect(aviso).toContain("Pediatria");
  });
});
```

- [ ] **Passo 2: Rodar e ver falhar**

```bash
npx vitest run testes/painel-especialidades.test.ts
```

Esperado: FALHA — o módulo não existe.

- [ ] **Passo 3: Escrever o módulo**

Crie `lib/painel/especialidades.ts`:

```ts
import type { SupabaseClient } from "@supabase/supabase-js";

/*
  Especialidades de um médico: leitura e validação.

  A especialidade é o campo mais importante do site: é ela que responde à
  pergunta que traz a pessoa. Por isso a validação daqui é mais rígida que a
  dos outros blocos.

  A validação é pura e fica separada da ida ao banco, como em
  `lib/painel/medico.ts` — é o que permite testar as regras sem banco nenhum.
*/

export type EspecialidadeDoMedico = {
  id: number;
  nome: string;
  rqe: string | null;
  principal: boolean;
};

export type EspecialidadeDisponivel = { id: number; nome: string };

export type ValidacaoDeRqe =
  | { ok: true; valor: string | null }
  | { ok: false; erro: string };

/*
  RQE vazio é caso normal, não erro: clínico geral não tem registro de
  especialidade, e a coluna aceita nulo desde `0001_diretorio.sql`. O que a
  função recusa é texto que se propõe a ser um RQE e não tem número nenhum.
*/
export function validarRqe(rqe: string): ValidacaoDeRqe {
  const limpo = rqe.trim();
  if (!limpo) return { ok: true, valor: null };

  const digitos = limpo.replace(/\D/g, "");
  if (!digitos) {
    return { ok: false, erro: "O RQE é um número. Deixe vazio se não houver." };
  }

  return { ok: true, valor: digitos };
}

/*
  A Resolução CFM 2.336/2023, Art. 4º, II exige o RQE de quem tem especialidade
  registrada. O painel avisa, não impede: quem preenche pode não ter o número em
  mãos na hora, e travar o cadastro por isso deixaria o médico fora do site.
*/
export function avisoDeRqeFaltando(nomes: string[]): string | null {
  if (!nomes.length) return null;

  return (
    `Sem RQE: ${nomes.join(", ")}. ` +
    "A Resolução CFM 2.336/2023 pede o RQE de quem tem especialidade registrada. " +
    "Clínico geral sem RQE é caso normal."
  );
}

export async function especialidadesDoMedico(
  cliente: SupabaseClient,
  medicoId: number,
): Promise<EspecialidadeDoMedico[]> {
  const { data, error } = await cliente
    .from("profissional_especialidade")
    .select("rqe, principal, especialidade ( id, nome )")
    .eq("profissional_id", medicoId);

  if (error) {
    throw new Error(`Falha ao ler as especialidades do médico ${medicoId}: ${error.message}`);
  }

  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  return ((data ?? []) as any[])
    .map((l) => ({
      id: l.especialidade.id as number,
      nome: l.especialidade.nome as string,
      rqe: l.rqe as string | null,
      principal: l.principal as boolean,
    }))
    /* A principal primeiro; o resto em ordem alfabética, que é como quem
       preenche procura. */
    .sort((a, b) =>
      a.principal !== b.principal
        ? Number(b.principal) - Number(a.principal)
        : a.nome.localeCompare(b.nome, "pt-BR"),
    );
}

export async function catalogoDeEspecialidades(
  cliente: SupabaseClient,
): Promise<EspecialidadeDisponivel[]> {
  const { data, error } = await cliente
    .from("especialidade")
    .select("id, nome")
    .order("nome", { ascending: true });

  if (error) throw new Error(`Falha ao ler o catálogo: ${error.message}`);

  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  return ((data ?? []) as any[]).map((l) => ({ id: l.id, nome: l.nome }));
}
```

- [ ] **Passo 4: Rodar e ver passar**

```bash
npx vitest run testes/painel-especialidades.test.ts
npx tsc --noEmit
```

- [ ] **Passo 5: Commit**

```bash
git add -A
git commit -m "Leitura e validacao das especialidades do medico

RQE vazio e caso normal e vira nulo; texto sem digito nenhum e recusado. O
aviso da Resolucao CFM avisa e nao impede: travar o cadastro por falta do
numero deixaria o medico fora do site."
```

---

## Tarefa 7: O bloco de especialidades na tela

**Arquivos:**
- Criar: `app/painel/medico/[id]/acoes-especialidade.ts`
- Criar: `components/painel/BlocoEspecialidades.tsx`
- Modificar: `app/painel/medico/[id]/page.tsx`
- Modificar: `testes/painel-especialidades.test.ts`

**Interfaces:**
- Consome: da tarefa 6, `EspecialidadeDoMedico`, `EspecialidadeDisponivel`, `validarRqe`, `avisoDeRqeFaltando`, `especialidadesDoMedico`, `catalogoDeEspecialidades`
- Produz:
  - `type EstadoDaEspecialidade = { erros: Record<string, string>; salvo: boolean }`
  - `salvarEspecialidades(anterior, dados): Promise<EstadoDaEspecialidade>`
  - `acrescentarEspecialidade(dados: FormData): Promise<void>`
  - `removerEspecialidade(dados: FormData): Promise<void>`

- [ ] **Passo 1: Escrever a varredura que trava as regras**

Acrescente a `testes/painel-especialidades.test.ts`:

```ts
import { fonte, semComentarios } from "@/testes/apoio";

describe("acoes-especialidade.ts", () => {
  const codigo = semComentarios(fonte("../app/painel/medico/[id]/acoes-especialidade.ts"));

  it("toda gravação pede as linhas afetadas de volta", () => {
    const escritas = [...codigo.matchAll(/\.(insert|update|delete)\s*\(/g)];
    expect(escritas.length).toBeGreaterThan(0);
    /* Uma chamada de `.select(` por escrita, no mínimo. */
    const selects = [...codigo.matchAll(/\.select\s*\(/g)];
    expect(selects.length).toBeGreaterThanOrEqual(escritas.length);
  });

  it("confere se veio linha antes de invalidar", () => {
    expect(codigo).toContain("if (!data)");
    expect(codigo.indexOf("if (!data)")).toBeLessThan(codigo.indexOf("revalidatePath("));
  });

  it("chama exigirAdmin antes de qualquer escrita", () => {
    const guarda = codigo.indexOf("exigirAdmin(");
    const escrita = codigo.search(/\.(insert|update|delete)\s*\(/);
    expect(guarda).toBeGreaterThan(-1);
    expect(escrita).toBeGreaterThan(guarda);
  });

  it("só remove de profissional_especialidade", () => {
    const tabelas = [...codigo.matchAll(/from\("(\w+)"\)([\s\S]*?)(?=from\("|\z)/g)];
    for (const [, tabela, trecho] of tabelas) {
      if (/\.delete\s*\(/.test(trecho)) {
        expect(tabela).toBe("profissional_especialidade");
      }
    }
  });
});
```

- [ ] **Passo 2: Rodar e ver falhar**

```bash
npx vitest run testes/painel-especialidades.test.ts
```

Esperado: FALHA — o arquivo de ações não existe.

- [ ] **Passo 3: Escrever as ações**

Crie `app/painel/medico/[id]/acoes-especialidade.ts`:

```ts
"use server";

import { revalidatePath } from "next/cache";
import { validarRqe } from "@/lib/painel/especialidades";
import { clienteDoPainel } from "@/lib/painel/servidor";
import { exigirAdmin } from "@/lib/painel/sessao";

export type EstadoDaEspecialidade = { erros: Record<string, string>; salvo: boolean };

/*
  As três ações deste arquivo compartilham uma exigência: pedir as linhas
  afetadas de volta e falhar alto quando não vem nenhuma. O PostgREST filtra a
  linha que a política não admite em vez de recusar a chamada, então sem isso a
  tela mostra um estado que o banco não tem — foi o defeito de 23/08/2026, em
  `alternarPublicacao`, corrigido em 003dda2.
*/

function invalidar(): void {
  revalidatePath("/(site)", "layout");
  revalidatePath("/sitemap.xml");
  revalidatePath("/painel");
}

/*
  Salvar os RQEs e a principal, de uma vez.

  A principal chega como um único valor (`principal`), não como uma caixa por
  linha: é botão de escolha única na tela, e o formato do dado é o que garante
  que só uma seja marcada. A regra não depende de o navegador se comportar.
*/
export async function salvarEspecialidades(
  _anterior: EstadoDaEspecialidade,
  dados: FormData,
): Promise<EstadoDaEspecialidade> {
  await exigirAdmin();

  const medicoId = Number(dados.get("medicoId"));
  if (!Number.isInteger(medicoId) || medicoId <= 0) {
    return { erros: { geral: "Identificador de médico inválido." }, salvo: false };
  }

  const principal = Number(dados.get("principal"));

  const linhas: { especialidadeId: number; rqe: string | null }[] = [];
  const erros: Record<string, string> = {};

  for (const [chave, valor] of dados.entries()) {
    if (!chave.startsWith("rqe-")) continue;

    const especialidadeId = Number(chave.slice("rqe-".length));
    if (!Number.isInteger(especialidadeId) || especialidadeId <= 0) continue;

    const v = validarRqe(String(valor));
    if (!v.ok) {
      erros[chave] = v.erro;
      continue;
    }

    linhas.push({ especialidadeId, rqe: v.valor });
  }

  if (Object.keys(erros).length) return { erros, salvo: false };

  const cliente = await clienteDoPainel();

  /*
    Uma chamada por linha, não uma só. O PostgREST não abre transação entre
    requisições, então o ganho de agrupar seria aparente: se a terceira falhar,
    as duas primeiras já gravaram de qualquer forma. Com uma por linha o erro
    diz qual linha, que é o que quem preenche precisa saber.
  */
  for (const linha of linhas) {
    const { data, error } = await cliente
      .from("profissional_especialidade")
      .update({ rqe: linha.rqe, principal: linha.especialidadeId === principal })
      .eq("profissional_id", medicoId)
      .eq("especialidade_id", linha.especialidadeId)
      .select("especialidade_id")
      .maybeSingle();

    if (error) {
      return { erros: { geral: `Não consegui salvar: ${error.message}` }, salvo: false };
    }

    if (!data) {
      return {
        erros: {
          geral:
            "A alteração não foi gravada: o banco não admitiu a escrita. " +
            "Costuma ser sessão expirada — saia e entre de novo.",
        },
        salvo: false,
      };
    }
  }

  invalidar();
  return { erros: {}, salvo: true };
}

export async function acrescentarEspecialidade(dados: FormData): Promise<void> {
  await exigirAdmin();

  const medicoId = Number(dados.get("medicoId"));
  const especialidadeId = Number(dados.get("especialidadeId"));
  const ehAPrimeira = dados.get("ehAPrimeira") === "true";

  if (!Number.isInteger(medicoId) || medicoId <= 0) {
    throw new Error("Identificador de médico inválido.");
  }
  if (!Number.isInteger(especialidadeId) || especialidadeId <= 0) {
    throw new Error("Escolha uma especialidade da lista.");
  }

  const cliente = await clienteDoPainel();
  const { data, error } = await cliente
    .from("profissional_especialidade")
    /*
      A primeira especialidade de um médico nasce principal. Sem isto ele
      ficaria com nenhuma marcada, e a página do site cairia no desempate
      "ou a primeira" — que depende da ordem que o banco devolver.
    */
    .insert({
      profissional_id: medicoId,
      especialidade_id: especialidadeId,
      principal: ehAPrimeira,
      rqe: null,
    })
    .select("especialidade_id")
    .maybeSingle();

  if (error) {
    if (error.code === "23505") {
      throw new Error("Este médico já tem essa especialidade.");
    }
    throw new Error(`Não consegui acrescentar: ${error.message}`);
  }

  if (!data) {
    throw new Error(
      "A especialidade não foi gravada: o banco não admitiu a escrita. " +
        "Costuma ser sessão expirada — saia e entre de novo.",
    );
  }

  invalidar();
}

export async function removerEspecialidade(dados: FormData): Promise<void> {
  await exigirAdmin();

  const medicoId = Number(dados.get("medicoId"));
  const especialidadeId = Number(dados.get("especialidadeId"));

  if (!Number.isInteger(medicoId) || medicoId <= 0) {
    throw new Error("Identificador de médico inválido.");
  }
  if (!Number.isInteger(especialidadeId) || especialidadeId <= 0) {
    throw new Error("Identificador de especialidade inválido.");
  }

  const cliente = await clienteDoPainel();
  const { data, error } = await cliente
    .from("profissional_especialidade")
    .delete()
    .eq("profissional_id", medicoId)
    .eq("especialidade_id", especialidadeId)
    .select("especialidade_id")
    .maybeSingle();

  if (error) throw new Error(`Não consegui remover: ${error.message}`);

  if (!data) {
    throw new Error(
      "Nada foi removido: ou o vínculo já não existia, ou o banco não admitiu. " +
        "Recarregue a página.",
    );
  }

  invalidar();
}
```

- [ ] **Passo 4: Rodar e ver passar**

```bash
npx vitest run testes/painel-especialidades.test.ts
```

- [ ] **Passo 5: Provar que a varredura morde**

Apague temporariamente `.select("especialidade_id")` e `.maybeSingle()` de `removerEspecialidade`, e o `if (!data)` que vem depois.

```bash
npx vitest run testes/painel-especialidades.test.ts
```

Esperado: FALHA. **Reponha as linhas** e confirme que volta a passar.

- [ ] **Passo 6: Escrever o bloco da tela**

Crie `components/painel/BlocoEspecialidades.tsx`:

```tsx
"use client";

import { useActionState } from "react";
import {
  acrescentarEspecialidade,
  removerEspecialidade,
  salvarEspecialidades,
  type EstadoDaEspecialidade,
} from "@/app/painel/medico/[id]/acoes-especialidade";
import { avisoDeRqeFaltando } from "@/lib/painel/especialidades";
import type {
  EspecialidadeDisponivel,
  EspecialidadeDoMedico,
} from "@/lib/painel/especialidades";

const INICIAL: EstadoDaEspecialidade = { erros: {}, salvo: false };

const CAMPO =
  "w-full rounded-controle border border-line bg-surface px-4 py-3 text-[16px] " +
  "text-ink-900 outline-none focus-visible:border-ami-green-600";

export function BlocoEspecialidades({
  medicoId,
  especialidades,
  catalogo,
}: {
  medicoId: number;
  especialidades: EspecialidadeDoMedico[];
  catalogo: EspecialidadeDisponivel[];
}) {
  const [estado, acao, pendente] = useActionState(salvarEspecialidades, INICIAL);

  const jaTem = new Set(especialidades.map((e) => e.id));
  const disponiveis = catalogo.filter((c) => !jaTem.has(c.id));
  const principal = especialidades.find((e) => e.principal) ?? especialidades[0];
  const aviso = avisoDeRqeFaltando(especialidades.filter((e) => !e.rqe).map((e) => e.nome));

  return (
    <section className="mt-12 max-w-[640px]">
      <h2 className="text-[20px] font-semibold text-ink-900">Especialidades</h2>
      <p className="mt-1 text-[15px] text-ink-600">
        A principal é a que aparece embaixo do nome no site, e define em qual
        página de especialidade ele é listado.
      </p>

      {especialidades.length === 0 ? (
        <p className="mt-6 text-[16px] text-ink-600">
          Nenhuma especialidade ainda. Sem pelo menos uma, este médico não aparece
          em nenhuma busca do site.
        </p>
      ) : (
        <form action={acao} className="mt-6 space-y-4">
          <input type="hidden" name="medicoId" value={medicoId} />

          {especialidades.map((e) => (
            <div key={e.id} className="flex flex-wrap items-center gap-3 border-b border-line py-3">
              <label className="flex items-center gap-2 text-[15px] text-ink-900">
                <input
                  type="radio"
                  name="principal"
                  value={e.id}
                  defaultChecked={principal?.id === e.id}
                  className="size-4 accent-ami-green-600"
                />
                <span className="min-w-[180px]">{e.nome}</span>
              </label>

              <input
                name={`rqe-${e.id}`}
                defaultValue={e.rqe ?? ""}
                placeholder="RQE"
                aria-label={`RQE de ${e.nome}`}
                className={`w-32 ${CAMPO}`}
              />
              <p aria-live="polite" className="min-h-5 basis-full text-[14px] text-warn">
                {estado.erros[`rqe-${e.id}`] ?? ""}
              </p>
            </div>
          ))}

          <p aria-live="polite" className="min-h-5 text-[14px] text-warn">
            {estado.erros.geral ?? ""}
          </p>

          <button
            type="submit"
            disabled={pendente}
            className="pressiona rounded-controle bg-ami-green-600 px-5 py-3 text-[15px] font-semibold text-white hover:bg-ami-green-700"
          >
            {pendente ? "Salvando…" : "Salvar especialidades"}
          </button>

          <p aria-live="polite" className="min-h-5 text-[14px] text-ink-600">
            {estado.salvo ? "Salvo." : ""}
          </p>
        </form>
      )}

      {aviso ? (
        <p className="mt-4 rounded-bloco border border-line bg-surface px-4 py-3 text-[15px] text-ink-600">
          {aviso}
        </p>
      ) : null}

      <div className="mt-6 flex flex-wrap items-end gap-3">
        <form action={acrescentarEspecialidade} className="flex items-end gap-3">
          <input type="hidden" name="medicoId" value={medicoId} />
          <input
            type="hidden"
            name="ehAPrimeira"
            value={String(especialidades.length === 0)}
          />
          <div>
            <label
              htmlFor="especialidadeId"
              className="block text-[14px] font-medium text-ink-600"
            >
              Acrescentar especialidade
            </label>
            <select id="especialidadeId" name="especialidadeId" className={`mt-1 ${CAMPO}`}>
              {disponiveis.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={disponiveis.length === 0}
            className="pressiona rounded-controle border border-line px-4 py-3 text-[15px] font-medium text-ink-600 hover:text-ink-900"
          >
            Acrescentar
          </button>
        </form>
      </div>

      {especialidades.map((e) => (
        <form key={`remover-${e.id}`} action={removerEspecialidade} className="mt-2">
          <input type="hidden" name="medicoId" value={medicoId} />
          <input type="hidden" name="especialidadeId" value={e.id} />
          <button
            type="submit"
            className="text-[14px] text-ink-400 underline hover:text-ink-900"
          >
            Remover {e.nome}
          </button>
        </form>
      ))}
    </section>
  );
}
```

- [ ] **Passo 7: Pendurar o bloco na página**

Em `app/painel/medico/[id]/page.tsx`, acrescente os imports e, depois de `<FormularioMedico medico={medico} />`:

```tsx
      <BlocoEspecialidades
        medicoId={medico.id}
        especialidades={especialidades}
        catalogo={catalogo}
      />
```

Carregue os dois antes do `return`, depois de `medicoPorId`:

```tsx
  const [especialidades, catalogo] = await Promise.all([
    especialidadesDoMedico(cliente, numero),
    catalogoDeEspecialidades(cliente),
  ]);
```

E corrija o aviso da linha 50, que hoje promete a etapa errada:

```tsx
          Falta: {falta.join(", ")}. Consultórios entram no bloco abaixo.
```

- [ ] **Passo 8: Conferir**

```bash
npx vitest run
npx tsc --noEmit
npm run build
```

- [ ] **Passo 9: Commit**

```bash
git add -A
git commit -m "Bloco de especialidades na pagina do medico

A principal e botao de escolha unica: o formato do dado garante que so uma
seja marcada, sem depender de o navegador se comportar. A primeira
especialidade de um medico nasce principal, para ele nunca ficar sem
nenhuma marcada."
```

---

## Tarefa 8: Ler e validar consultórios

**Arquivos:**
- Criar: `lib/painel/locais.ts`
- Criar: `testes/painel-locais.test.ts`

**Interfaces:**
- Consome: nada
- Produz:
  - `type Bairro = { id: number; nome: string }`
  - `type LocalDoMedico = { id: number; logradouro: string; numero: string | null; complemento: string | null; bairro: Bairro; cep: string | null; telefone: string | null; whatsapp: string | null; estacionamento: boolean; quantosMedicos: number }`
  - `type CamposDoLocal` e `type LocalValidado`
  - `validarLocal(campos, bairrosValidos: number[]): ValidacaoDeLocal`
  - `locaisDoMedico(cliente, medicoId): Promise<LocalDoMedico[]>`
  - `bairros(cliente): Promise<Bairro[]>`
  - `buscarLocais(cliente, termo): Promise<LocalDoMedico[]>`

- [ ] **Passo 1: Escrever os testes**

Crie `testes/painel-locais.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { validarLocal } from "@/lib/painel/locais";

const BAIRROS = [1, 2, 3];

function campos(over: Partial<Parameters<typeof validarLocal>[0]> = {}) {
  return {
    logradouro: "Rua Simplício Moreira",
    numero: "1200",
    complemento: "",
    bairroId: "1",
    cep: "65900-000",
    telefone: "99 3524-3716",
    whatsapp: "",
    estacionamento: false,
    ...over,
  };
}

describe("validarLocal", () => {
  it("aceita o mínimo: logradouro e bairro", () => {
    const r = validarLocal(
      campos({ numero: "", cep: "", telefone: "", whatsapp: "" }),
      BAIRROS,
    );
    expect(r.ok).toBe(true);
  });

  it("recusa logradouro vazio", () => {
    const r = validarLocal(campos({ logradouro: "   " }), BAIRROS);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.erros.logradouro).toBeTruthy();
  });

  it("recusa bairro que não está na lista", () => {
    const r = validarLocal(campos({ bairroId: "99" }), BAIRROS);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.erros.bairroId).toBeTruthy();
  });

  it("devolve todos os erros de uma vez", () => {
    const r = validarLocal(campos({ logradouro: "", bairroId: "99" }), BAIRROS);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(Object.keys(r.erros).length).toBe(2);
  });

  it("guarda só os dígitos do telefone", () => {
    const r = validarLocal(campos({ telefone: "(99) 3524-3716" }), BAIRROS);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.valor.telefone).toBe("9935243716");
  });

  it("campo opcional vazio vira nulo, não string vazia", () => {
    const r = validarLocal(campos({ numero: "", cep: "", whatsapp: "" }), BAIRROS);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.valor.numero).toBeNull();
      expect(r.valor.cep).toBeNull();
      expect(r.valor.whatsapp).toBeNull();
    }
  });

  it("recusa telefone que não tem dígito nenhum", () => {
    const r = validarLocal(campos({ telefone: "ligar de manhã" }), BAIRROS);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.erros.telefone).toBeTruthy();
  });

  it("espaço a mais no logradouro é limpo, não recusado", () => {
    const r = validarLocal(campos({ logradouro: "  Rua   Simplício   Moreira " }), BAIRROS);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.valor.logradouro).toBe("Rua Simplício Moreira");
  });
});
```

- [ ] **Passo 2: Rodar e ver falhar**

```bash
npx vitest run testes/painel-locais.test.ts
```

- [ ] **Passo 3: Escrever o módulo**

Crie `lib/painel/locais.ts`:

```ts
import type { SupabaseClient } from "@supabase/supabase-js";

/*
  Consultórios: leitura e validação.

  Telefone e WhatsApp não são detalhe do endereço — são o objetivo dele. O site
  da AMI existe para encaminhar uma pessoa até um especialista, e o que fecha o
  encaminhamento é o contato.

  Um consultório serve vários médicos: `atendimento` é tabela de ligação. Por
  isso `quantosMedicos` viaja junto na leitura — a tela precisa avisar antes de
  alguém corrigir um telefone achando que mexe só no seu médico.
*/

export type Bairro = { id: number; nome: string };

export type LocalDoMedico = {
  id: number;
  logradouro: string;
  numero: string | null;
  complemento: string | null;
  bairro: Bairro;
  cep: string | null;
  telefone: string | null;
  whatsapp: string | null;
  estacionamento: boolean;
  quantosMedicos: number;
};

export type CamposDoLocal = {
  logradouro: string;
  numero: string;
  complemento: string;
  bairroId: string;
  cep: string;
  telefone: string;
  whatsapp: string;
  estacionamento: boolean;
};

/** As chaves saem com o nome que o banco usa, prontas para insert ou update. */
export type LocalValidado = {
  logradouro: string;
  numero: string | null;
  complemento: string | null;
  bairro_id: number;
  cep: string | null;
  telefone: string | null;
  whatsapp: string | null;
  estacionamento: boolean;
};

export type ValidacaoDeLocal =
  | { ok: true; valor: LocalValidado }
  | { ok: false; erros: Partial<Record<keyof CamposDoLocal, string>> };

/** Vazio vira nulo. No banco, nulo e string vazia significam coisas diferentes. */
function ouNulo(s: string): string | null {
  const limpo = s.trim();
  return limpo || null;
}

/*
  Telefone guarda só dígitos, como o importador faz. Formatar é trabalho da
  tela; o banco guarda o número. Texto que se propõe a ser telefone e não tem
  dígito nenhum é erro de digitação, não ausência.
*/
function validarNumeroDeContato(
  s: string,
): { ok: true; valor: string | null } | { ok: false } {
  const limpo = s.trim();
  if (!limpo) return { ok: true, valor: null };

  const digitos = limpo.replace(/\D/g, "");
  if (!digitos) return { ok: false };

  return { ok: true, valor: digitos };
}

export function validarLocal(
  campos: CamposDoLocal,
  bairrosValidos: number[],
): ValidacaoDeLocal {
  const erros: Partial<Record<keyof CamposDoLocal, string>> = {};

  const logradouro = campos.logradouro.replace(/\s+/g, " ").trim();
  if (!logradouro) erros.logradouro = "A rua não pode ficar vazia.";

  const bairroId = Number(campos.bairroId);
  if (!Number.isInteger(bairroId) || !bairrosValidos.includes(bairroId)) {
    erros.bairroId = "Escolha um bairro da lista.";
  }

  const telefone = validarNumeroDeContato(campos.telefone);
  if (!telefone.ok) erros.telefone = "O telefone é um número. Deixe vazio se não houver.";

  const whatsapp = validarNumeroDeContato(campos.whatsapp);
  if (!whatsapp.ok) erros.whatsapp = "O WhatsApp é um número. Deixe vazio se não houver.";

  if (Object.keys(erros).length) return { ok: false, erros };

  return {
    ok: true,
    valor: {
      logradouro,
      numero: ouNulo(campos.numero),
      complemento: ouNulo(campos.complemento),
      bairro_id: bairroId,
      cep: ouNulo(campos.cep),
      telefone: telefone.ok ? telefone.valor : null,
      whatsapp: whatsapp.ok ? whatsapp.valor : null,
      estacionamento: campos.estacionamento,
    },
  };
}

const SELECAO_DE_LOCAL = `
  id, logradouro, numero, complemento, cep, telefone, whatsapp, estacionamento,
  bairro ( id, nome ),
  atendimento ( profissional_id )
`;

/* eslint-disable @typescript-eslint/no-explicit-any */
function paraLocal(l: any): LocalDoMedico {
  return {
    id: l.id,
    logradouro: l.logradouro,
    numero: l.numero,
    complemento: l.complemento,
    bairro: { id: l.bairro.id, nome: l.bairro.nome },
    cep: l.cep,
    telefone: l.telefone,
    whatsapp: l.whatsapp,
    estacionamento: l.estacionamento,
    quantosMedicos: (l.atendimento ?? []).length,
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export async function locaisDoMedico(
  cliente: SupabaseClient,
  medicoId: number,
): Promise<LocalDoMedico[]> {
  const { data, error } = await cliente
    .from("local")
    .select(SELECAO_DE_LOCAL)
    .eq("atendimento.profissional_id", medicoId)
    .not("atendimento", "is", null);

  if (error) {
    throw new Error(`Falha ao ler os consultórios do médico ${medicoId}: ${error.message}`);
  }

  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  return ((data ?? []) as any[]).map(paraLocal);
}

export async function bairros(cliente: SupabaseClient): Promise<Bairro[]> {
  const { data, error } = await cliente
    .from("bairro")
    .select("id, nome")
    .order("nome", { ascending: true });

  if (error) throw new Error(`Falha ao ler os bairros: ${error.message}`);

  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  return ((data ?? []) as any[]).map((l) => ({ id: l.id, nome: l.nome }));
}

/*
  `termoSeguro` de `lib/painel/consultas.ts` escapa o que quebraria o filtro do
  PostgREST — um parêntese digitado na busca derrubava a página inteira antes de
  a fatia 1 corrigir isso.
*/
export async function buscarLocais(
  cliente: SupabaseClient,
  termo: string,
): Promise<LocalDoMedico[]> {
  const { termoSeguro } = await import("@/lib/painel/consultas");
  const limpo = termoSeguro(termo).trim();
  if (!limpo) return [];

  const { data, error } = await cliente
    .from("local")
    .select(SELECAO_DE_LOCAL)
    .ilike("logradouro", `%${limpo}%`)
    .limit(20);

  if (error) throw new Error(`Falha ao buscar consultórios: ${error.message}`);

  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  return ((data ?? []) as any[]).map(paraLocal);
}
```

- [ ] **Passo 4: Rodar e ver passar**

```bash
npx vitest run testes/painel-locais.test.ts
npx tsc --noEmit
```

- [ ] **Passo 5: Commit**

```bash
git add -A
git commit -m "Leitura e validacao dos consultorios

Logradouro e bairro sao o minimo; o resto e opcional e vazio vira nulo.
Bairro so da lista fechada: digitado a mao vira Centro, centro e CENTRO, e a
busca do site quebra. quantosMedicos viaja junto na leitura porque a tela
precisa avisar quando o endereco e compartilhado."
```

---

## Tarefa 9: O bloco de consultórios na tela

**Arquivos:**
- Criar: `app/painel/medico/[id]/acoes-local.ts`
- Criar: `components/painel/BlocoLocais.tsx`
- Modificar: `app/painel/medico/[id]/page.tsx`
- Modificar: `testes/painel-locais.test.ts`

**Interfaces:**
- Consome: da tarefa 8, `LocalDoMedico`, `Bairro`, `CamposDoLocal`, `validarLocal`, `locaisDoMedico`, `bairros`
- Produz:
  - `type EstadoDoLocal = { erros: Record<string, string>; salvo: boolean }`
  - `criarLocal(anterior, dados): Promise<EstadoDoLocal>`
  - `salvarLocal(anterior, dados): Promise<EstadoDoLocal>`
  - `ligarLocalExistente(dados: FormData): Promise<void>`
  - `desligarLocal(dados: FormData): Promise<void>`

- [ ] **Passo 1: Escrever a varredura**

Acrescente a `testes/painel-locais.test.ts`:

```ts
import { fonte, semComentarios } from "@/testes/apoio";

describe("acoes-local.ts", () => {
  const codigo = semComentarios(fonte("../app/painel/medico/[id]/acoes-local.ts"));

  it("nunca remove da tabela local", () => {
    const tabelas = [...codigo.matchAll(/from\("(\w+)"\)([\s\S]*?)(?=from\("|\z)/g)];
    for (const [, tabela, trecho] of tabelas) {
      if (/\.delete\s*\(/.test(trecho)) expect(tabela).toBe("atendimento");
    }
  });

  it("toda gravação pede as linhas afetadas de volta", () => {
    const escritas = [...codigo.matchAll(/\.(insert|update|delete)\s*\(/g)];
    const selects = [...codigo.matchAll(/\.select\s*\(/g)];
    expect(escritas.length).toBeGreaterThan(0);
    expect(selects.length).toBeGreaterThanOrEqual(escritas.length);
  });

  it("confere se veio linha antes de invalidar", () => {
    expect(codigo).toContain("if (!data)");
    expect(codigo.indexOf("if (!data)")).toBeLessThan(codigo.indexOf("revalidatePath("));
  });

  it("chama exigirAdmin antes de qualquer escrita", () => {
    const guarda = codigo.indexOf("exigirAdmin(");
    const escrita = codigo.search(/\.(insert|update|delete)\s*\(/);
    expect(guarda).toBeGreaterThan(-1);
    expect(escrita).toBeGreaterThan(guarda);
  });
});
```

- [ ] **Passo 2: Rodar e ver falhar**

```bash
npx vitest run testes/painel-locais.test.ts
```

- [ ] **Passo 3: Escrever as ações**

Crie `app/painel/medico/[id]/acoes-local.ts`:

```ts
"use server";

import { revalidatePath } from "next/cache";
import { bairros, validarLocal } from "@/lib/painel/locais";
import { clienteDoPainel } from "@/lib/painel/servidor";
import { exigirAdmin } from "@/lib/painel/sessao";

export type EstadoDoLocal = { erros: Record<string, string>; salvo: boolean };

function invalidar(): void {
  revalidatePath("/(site)", "layout");
  revalidatePath("/sitemap.xml");
  revalidatePath("/painel");
}

function lerCampos(dados: FormData) {
  return {
    logradouro: String(dados.get("logradouro") ?? ""),
    numero: String(dados.get("numero") ?? ""),
    complemento: String(dados.get("complemento") ?? ""),
    bairroId: String(dados.get("bairroId") ?? ""),
    cep: String(dados.get("cep") ?? ""),
    telefone: String(dados.get("telefone") ?? ""),
    whatsapp: String(dados.get("whatsapp") ?? ""),
    estacionamento: dados.get("estacionamento") === "on",
  };
}

const NAO_ADMITIU =
  "A alteração não foi gravada: o banco não admitiu a escrita. " +
  "Costuma ser sessão expirada — saia e entre de novo.";

/*
  Criar um consultório novo E ligar o médico a ele.

  São duas gravações em tabelas diferentes, e o PostgREST não abre transação
  entre requisições: se a segunda falhar, a primeira já gravou. O estrago
  possível é um endereço órfão, que não aparece em lugar nenhum do site — muito
  mais barato que a alternativa, que seria remover o endereço para "desfazer" e
  arriscar apagar um que outro médico passou a usar.
*/
export async function criarLocal(
  _anterior: EstadoDoLocal,
  dados: FormData,
): Promise<EstadoDoLocal> {
  await exigirAdmin();

  const medicoId = Number(dados.get("medicoId"));
  if (!Number.isInteger(medicoId) || medicoId <= 0) {
    return { erros: { geral: "Identificador de médico inválido." }, salvo: false };
  }

  const cliente = await clienteDoPainel();
  const lista = await bairros(cliente);
  const validacao = validarLocal(lerCampos(dados), lista.map((b) => b.id));

  if (!validacao.ok) {
    return { erros: validacao.erros as Record<string, string>, salvo: false };
  }

  const criado = await cliente
    .from("local")
    .insert(validacao.valor)
    .select("id")
    .maybeSingle();

  if (criado.error) {
    return { erros: { geral: `Não consegui criar: ${criado.error.message}` }, salvo: false };
  }
  if (!criado.data) return { erros: { geral: NAO_ADMITIU }, salvo: false };

  const ligado = await cliente
    .from("atendimento")
    .insert({ profissional_id: medicoId, local_id: criado.data.id })
    .select("id")
    .maybeSingle();

  if (ligado.error) {
    return {
      erros: {
        geral:
          `O endereço foi criado, mas não consegui ligar o médico a ele: ` +
          `${ligado.error.message}. Use "buscar existente" para ligar.`,
      },
      salvo: false,
    };
  }
  if (!ligado.data) return { erros: { geral: NAO_ADMITIU }, salvo: false };

  invalidar();
  return { erros: {}, salvo: true };
}

/*
  Corrigir um consultório existente.

  Corrige para TODOS os médicos que atendem nele — é o ganho de compartilhar, e
  a tela avisa antes quando `quantosMedicos` é maior que um.
*/
export async function salvarLocal(
  _anterior: EstadoDoLocal,
  dados: FormData,
): Promise<EstadoDoLocal> {
  await exigirAdmin();

  const localId = Number(dados.get("localId"));
  if (!Number.isInteger(localId) || localId <= 0) {
    return { erros: { geral: "Identificador de consultório inválido." }, salvo: false };
  }

  const cliente = await clienteDoPainel();
  const lista = await bairros(cliente);
  const validacao = validarLocal(lerCampos(dados), lista.map((b) => b.id));

  if (!validacao.ok) {
    return { erros: validacao.erros as Record<string, string>, salvo: false };
  }

  const { data, error } = await cliente
    .from("local")
    .update(validacao.valor)
    .eq("id", localId)
    .select("id")
    .maybeSingle();

  if (error) {
    return { erros: { geral: `Não consegui salvar: ${error.message}` }, salvo: false };
  }
  if (!data) return { erros: { geral: NAO_ADMITIU }, salvo: false };

  invalidar();
  return { erros: {}, salvo: true };
}

export async function ligarLocalExistente(dados: FormData): Promise<void> {
  await exigirAdmin();

  const medicoId = Number(dados.get("medicoId"));
  const localId = Number(dados.get("localId"));

  if (!Number.isInteger(medicoId) || medicoId <= 0) {
    throw new Error("Identificador de médico inválido.");
  }
  if (!Number.isInteger(localId) || localId <= 0) {
    throw new Error("Escolha um consultório da lista.");
  }

  const cliente = await clienteDoPainel();
  const { data, error } = await cliente
    .from("atendimento")
    .insert({ profissional_id: medicoId, local_id: localId })
    .select("id")
    .maybeSingle();

  if (error) {
    if (error.code === "23505") {
      throw new Error("Este médico já atende neste consultório.");
    }
    throw new Error(`Não consegui ligar: ${error.message}`);
  }
  if (!data) throw new Error(NAO_ADMITIU);

  invalidar();
}

/*
  Tirar o médico do consultório.

  Remove a LIGAÇÃO, não o consultório. O endereço continua existindo, com os
  outros médicos que atendem nele.
*/
export async function desligarLocal(dados: FormData): Promise<void> {
  await exigirAdmin();

  const medicoId = Number(dados.get("medicoId"));
  const localId = Number(dados.get("localId"));

  if (!Number.isInteger(medicoId) || medicoId <= 0) {
    throw new Error("Identificador de médico inválido.");
  }
  if (!Number.isInteger(localId) || localId <= 0) {
    throw new Error("Identificador de consultório inválido.");
  }

  const cliente = await clienteDoPainel();
  const { data, error } = await cliente
    .from("atendimento")
    .delete()
    .eq("profissional_id", medicoId)
    .eq("local_id", localId)
    .select("id")
    .maybeSingle();

  if (error) throw new Error(`Não consegui desligar: ${error.message}`);

  if (!data) {
    throw new Error(
      "Nada foi removido: ou o vínculo já não existia, ou o banco não admitiu. " +
        "Recarregue a página.",
    );
  }

  invalidar();
}
```

- [ ] **Passo 4: Rodar e ver passar**

```bash
npx vitest run testes/painel-locais.test.ts
```

- [ ] **Passo 5: Provar que a varredura morde**

Troque em `desligarLocal` a linha `.from("atendimento")` por `.from("local")`.

```bash
npx vitest run testes/painel-locais.test.ts
```

Esperado: FALHA em "nunca remove da tabela local". **Desfaça** e confirme que volta a passar.

- [ ] **Passo 6: Escrever o bloco da tela**

Crie `components/painel/BlocoLocais.tsx`. O componente recebe `medicoId`, `locais: LocalDoMedico[]` e `listaDeBairros: Bairro[]`, e mostra:

1. **Um cartão por consultório do médico**, cada um com formulário próprio ligado a `salvarLocal` por `useActionState`, com `localId` oculto. Campos: `logradouro` (obrigatório), `numero`, `complemento`, `bairroId` (um `select` alimentado por `listaDeBairros`), `cep`, `telefone`, `whatsapp`, e `estacionamento` como caixa de marcar. **Telefone e WhatsApp vêm primeiro entre os opcionais**, com rótulo maior, pela razão da seção 2 da spec.

2. **O aviso de endereço compartilhado**, quando `local.quantosMedicos > 1`, acima dos campos daquele cartão:

```tsx
      {local.quantosMedicos > 1 ? (
        <p className="mb-4 rounded-bloco border border-line bg-surface px-4 py-3 text-[15px] text-ink-600">
          Este endereço é usado por {local.quantosMedicos} médicos. Corrigir aqui
          corrige para todos eles.
        </p>
      ) : null}
```

3. **Um botão "Tirar deste consultório"** por cartão, em formulário próprio ligado a `desligarLocal`, com `medicoId` e `localId` ocultos, e o texto de apoio: *"Tira o médico daqui. O consultório continua existindo."*

4. **Um formulário de consultório novo**, ligado a `criarLocal`, com os mesmos campos e `medicoId` oculto.

Reproduza de `BlocoEspecialidades` (tarefa 7): a constante `CAMPO`, o componente `Erro` com `aria-live="polite"` e `min-h-5` sempre montado, o `disabled={pendente}` no botão, e a linha de "Salvo." também com `aria-live` e `min-h-5`. Região `aria-live` que entra no DOM junto com o texto não é anunciada — o leitor de tela precisa já conhecê-la.

- [ ] **Passo 7: Pendurar o bloco na página**

Em `app/painel/medico/[id]/page.tsx`, acrescente ao `Promise.all` do passo 7 da tarefa 7:

```tsx
  const [especialidades, catalogo, locais, listaDeBairros] = await Promise.all([
    especialidadesDoMedico(cliente, numero),
    catalogoDeEspecialidades(cliente),
    locaisDoMedico(cliente, numero),
    bairros(cliente),
  ]);
```

E depois de `<BlocoEspecialidades ... />`:

```tsx
      <BlocoLocais medicoId={medico.id} locais={locais} listaDeBairros={listaDeBairros} />
```

Remova o aviso da linha 50 que promete etapa futura: os dois blocos agora existem.

- [ ] **Passo 8: Conferir**

```bash
npx vitest run
npx tsc --noEmit
npm run build
```

- [ ] **Passo 9: Commit**

```bash
git add -A
git commit -m "Bloco de consultorios na pagina do medico

Buscar existente ou criar novo, e a tela avisa quando o endereco e usado por
mais de um medico: corrigir ali corrige para todos. Desligar remove a
ligacao, nunca o consultorio."
```

---

## Tarefa 10: Acessibilidade do consultório

O último campo do consultório, separado porque é uma tabela à parte.

**Arquivos:**
- Modificar: `lib/painel/locais.ts` (o tipo e a leitura)
- Modificar: `app/painel/medico/[id]/acoes-local.ts` (uma ação nova)
- Modificar: `components/painel/BlocoLocais.tsx`
- Modificar: `testes/painel-locais.test.ts`

**Interfaces:**
- Consome: das tarefas 8 e 9, `LocalDoMedico` e `acoes-local.ts`
- Produz:
  - `const RECURSOS_DE_ACESSIBILIDADE` — os cinco valores que a tabela aceita, com o rótulo em português
  - `LocalDoMedico` ganha `acessibilidade: string[]`
  - `salvarAcessibilidade(dados: FormData): Promise<void>`

- [ ] **Passo 1: Escrever o teste**

Acrescente a `testes/painel-locais.test.ts`:

```ts
import { RECURSOS_DE_ACESSIBILIDADE } from "@/lib/painel/locais";

describe("RECURSOS_DE_ACESSIBILIDADE", () => {
  it("são exatamente os cinco que a restrição do banco aceita", () => {
    expect(RECURSOS_DE_ACESSIBILIDADE.map((r) => r.valor).sort()).toEqual(
      [
        "acesso_cadeirante",
        "banheiro_adaptado",
        "elevador",
        "interprete_libras",
        "piso_tatil",
      ].sort(),
    );
  });

  it("cada um tem rótulo em português", () => {
    for (const r of RECURSOS_DE_ACESSIBILIDADE) {
      expect(r.rotulo.length).toBeGreaterThan(0);
      expect(r.rotulo).not.toBe(r.valor);
    }
  });
});
```

- [ ] **Passo 2: Rodar e ver falhar**

```bash
npx vitest run testes/painel-locais.test.ts
```

- [ ] **Passo 3: Acrescentar a constante e a leitura**

Em `lib/painel/locais.ts`:

```ts
/*
  Os cinco valores que a restrição de `local_acessibilidade` aceita, em
  `0001_diretorio.sql`. Valor gravado em snake_case, rótulo em português: o
  banco nunca mostra texto a ninguém, e a tela nunca inventa valor.
*/
export const RECURSOS_DE_ACESSIBILIDADE = [
  { valor: "acesso_cadeirante", rotulo: "Acesso para cadeirante" },
  { valor: "banheiro_adaptado", rotulo: "Banheiro adaptado" },
  { valor: "elevador", rotulo: "Elevador" },
  { valor: "piso_tatil", rotulo: "Piso tátil" },
  { valor: "interprete_libras", rotulo: "Intérprete de Libras" },
] as const;
```

Acrescente `acessibilidade: string[]` a `LocalDoMedico`, `local_acessibilidade ( recurso )` a `SELECAO_DE_LOCAL`, e a `paraLocal`:

```ts
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    acessibilidade: (l.local_acessibilidade ?? []).map((a: any) => a.recurso),
```

- [ ] **Passo 4: Escrever a ação**

Em `app/painel/medico/[id]/acoes-local.ts`:

```ts
import { RECURSOS_DE_ACESSIBILIDADE } from "@/lib/painel/locais";

/*
  A acessibilidade é um conjunto, e a tela manda o conjunto inteiro: o que veio
  marcado é o que fica. Remover o que saiu e inserir o que entrou — nunca apagar
  tudo e recriar, que deixaria o consultório sem nenhum recurso se a segunda
  chamada falhasse.
*/
export async function salvarAcessibilidade(dados: FormData): Promise<void> {
  await exigirAdmin();

  const localId = Number(dados.get("localId"));
  if (!Number.isInteger(localId) || localId <= 0) {
    throw new Error("Identificador de consultório inválido.");
  }

  const validos = RECURSOS_DE_ACESSIBILIDADE.map((r) => r.valor as string);
  const marcados = dados
    .getAll("recurso")
    .map(String)
    .filter((r) => validos.includes(r));

  const cliente = await clienteDoPainel();

  const atuais = await cliente
    .from("local_acessibilidade")
    .select("recurso")
    .eq("local_id", localId);

  if (atuais.error) {
    throw new Error(`Não consegui ler a acessibilidade: ${atuais.error.message}`);
  }

  const tinha = (atuais.data ?? []).map((l) => l.recurso as string);
  const paraRemover = tinha.filter((r) => !marcados.includes(r));
  const paraInserir = marcados.filter((r) => !tinha.includes(r));

  if (paraRemover.length) {
    const { data, error } = await cliente
      .from("local_acessibilidade")
      .delete()
      .eq("local_id", localId)
      .in("recurso", paraRemover)
      .select("recurso");

    if (error) throw new Error(`Não consegui remover: ${error.message}`);
    if (!data || data.length !== paraRemover.length) {
      throw new Error(NAO_ADMITIU);
    }
  }

  if (paraInserir.length) {
    const { data, error } = await cliente
      .from("local_acessibilidade")
      .insert(paraInserir.map((recurso) => ({ local_id: localId, recurso })))
      .select("recurso");

    if (error) throw new Error(`Não consegui acrescentar: ${error.message}`);
    if (!data || data.length !== paraInserir.length) {
      throw new Error(NAO_ADMITIU);
    }
  }

  invalidar();
}
```

- [ ] **Passo 5: Pôr as caixas no cartão do consultório**

Em `components/painel/BlocoLocais.tsx`, dentro de cada cartão, um formulário próprio ligado a `salvarAcessibilidade`, com `localId` oculto e uma caixa por recurso:

```tsx
        <fieldset className="mt-4">
          <legend className="text-[14px] font-medium text-ink-600">Acessibilidade</legend>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {RECURSOS_DE_ACESSIBILIDADE.map((r) => (
              <label key={r.valor} className="flex items-center gap-2 text-[15px] text-ink-900">
                <input
                  type="checkbox"
                  name="recurso"
                  value={r.valor}
                  defaultChecked={local.acessibilidade.includes(r.valor)}
                  className="size-4 accent-ami-green-600"
                />
                {r.rotulo}
              </label>
            ))}
          </div>
        </fieldset>
```

- [ ] **Passo 6: Conferir**

```bash
npx vitest run
npx tsc --noEmit
npm run build
```

- [ ] **Passo 7: Commit**

```bash
git add -A
git commit -m "Acessibilidade do consultorio

A tela manda o conjunto inteiro e a acao reconcilia: remove o que saiu,
insere o que entrou. Nunca apaga tudo e recria, que deixaria o consultorio
sem nenhum recurso se a segunda chamada falhasse."
```

---

## Tarefa 11: A conferência final

Nenhum código novo. É a camada que, em 23/08/2026, achou o defeito que 469 testes automáticos deixaram passar.

**Arquivos:**
- Modificar: `docs/estado-do-projeto.md`

- [ ] **Passo 1: A suíte inteira, os tipos e o build**

```bash
npx vitest run
npx tsc --noEmit
npm run build
```

Esperado: os três limpos.

- [ ] **Passo 2: A busca que prova que os horários saíram**

```bash
grep -rn "horario\|Horario\|horário" --include="*.ts" --include="*.tsx" app/ components/ lib/ testes/ | grep -v painel | grep -v importador
```

**Esperado: nenhuma linha.**

- [ ] **Passo 3: A busca que prova que nada indevido é removido**

```bash
grep -rn "\.delete(" --include="*.ts" app/ lib/ scripts/
```

Esperado: só `acoes-especialidade.ts` (em `profissional_especialidade`) e `acoes-local.ts` (em `atendimento` e `local_acessibilidade`).

- [ ] **Passo 4: Colar a migração no Supabase**

Quem conduz abre o **SQL Editor**, cola `supabase/migrations/0006_painel_vinculos.sql` inteiro e clica em **Run**.

- [ ] **Passo 5: Rodar as assertivas de política**

Colar `supabase/testes-rls.sql` inteiro no **SQL Editor** e clicar em **Run**. Esperado: nenhum erro.

- [ ] **Passo 6: A conferência com o dedo**

Com `npm run build && npx next start -p 3100` — **e o servidor de desenvolvimento desligado**, porque dois servidores sobre o mesmo banco tornam a medição ambígua: cada um tem seu próprio cache, e o aviso de reconstruir só chega ao processo que recebeu o clique.

1. Abrir `/painel`, escolher um médico **fora do ar**
2. Dar a ele uma especialidade; marcar como principal; pôr um RQE
3. Dar a ele um consultório novo, com telefone e WhatsApp
4. Marcar dois recursos de acessibilidade
5. Pôr o médico no ar
6. Abrir a página dele no site, em janela anônima: a especialidade, o endereço e o telefone têm que aparecer, **e horário nenhum**
7. Voltar ao painel, tirar a especialidade
8. Recarregar o site: ela sumiu

- [ ] **Passo 7: Atualizar o documento de estado**

Em `docs/estado-do-projeto.md`, registre que a fatia 2 está construída e verificada, o que ela entrega, e que os horários saíram do produto. Diga que a foto do médico é a única coisa que falta para a AMI montar um perfil completo sozinha.

- [ ] **Passo 8: Commit**

```bash
git add -A
git commit -m "Fatia 2 do painel verificada contra o banco real

Especialidades e consultorios entram pelo painel, e os horarios sairam do
site. A AMI monta um perfil completo sozinha; sobra a foto."
```

---

## Autorrevisão do plano

**Cobertura da spec, seção por seção:**

| seção da spec | tarefa |
|---|---|
| 1, o que a fatia cobre | todas |
| 2, para que o site serve | 8 e 9 (telefone e WhatsApp em destaque) |
| 3, horários saem | 1, 2, 3 |
| 4, medições | informativa |
| 5, decisões | 4 (remoção restrita), 5 (não apagar médico) |
| 6, modelo de dados | 6 e 8 |
| 7, políticas | 4 |
| 8, telas — bloco 1 | 5 |
| 8, telas — bloco 2 | 7 |
| 8, telas — bloco 3 | 9 e 10 |
| 9, regras 1–2 (especialidade) | 6 e 7 |
| 9, regras 3–5 (local) | 8 e 9 |
| 9, regra 6 (célula vazia) | 5 e 8 |
| 9, regra 7 (erros de uma vez) | 6 e 8 |
| 9, regra 8 (linhas afetadas) | 7, 9, 10 |
| 10, arquivos | mapa de arquivos |
| 11, invalidação | 7, 9, 10 |
| 12, verificação | 11 |
| 13, o que fica de fora | nenhuma tarefa, por definição |
| 14, riscos | 3 (grep), 9 (aviso de compartilhado) |

**Marcadores por preencher:** nenhum. Todo passo de código traz o código.

**Consistência de nomes entre tarefas:** `EspecialidadeDoMedico`, `EspecialidadeDisponivel`, `validarRqe`, `avisoDeRqeFaltando`, `especialidadesDoMedico`, `catalogoDeEspecialidades` (tarefa 6) são consumidos com esses nomes na 7. `LocalDoMedico`, `Bairro`, `CamposDoLocal`, `validarLocal`, `locaisDoMedico`, `bairros`, `buscarLocais` (tarefa 8) são consumidos com esses nomes na 9 e na 10. `invalidar()` e `NAO_ADMITIU` são definidos em `acoes-local.ts` na tarefa 9 e reusados na 10, dentro do mesmo arquivo.

**Uma pendência conhecida:** `buscarLocais` é produzida na tarefa 8 e a tarefa 9 descreve a busca de consultório existente sem detalhar a interface de digitação. Quem implementar a 9 pode começar por um `select` alimentado por `buscarLocais(cliente, "")` limitado aos vinte primeiros e evoluir para busca digitada se a lista crescer; com 24 endereços hoje, o `select` basta. Está registrado aqui para não parecer esquecimento.
