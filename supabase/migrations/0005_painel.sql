-- O painel da agência: quem é quem, e quem pode escrever.
--
-- Esta é a primeira migração do projeto que concede escrita. Até aqui as onze
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

  `security definer` não é necessário HOJE: a única política de
  `perfil_usuario` é `id = auth.uid()`, que não consulta outra tabela, então a
  cadeia termina e não há recursão. Fica assim mesmo porque no dia em que uma
  fatia seguinte acrescentar "admin lê todos os perfis" — uma política sobre
  `perfil_usuario` que chame esta função — a recursão vira real, e ninguém vai
  lembrar de voltar aqui para acrescentar o modificador.

  `pg_temp` no fim do caminho de busca é o que impede uma tabela temporária
  homônima de sombrear `perfil_usuario` dentro de uma função que roda como
  dona. A função não recebe argumento, então não há o que um chamador amplie.
*/
create function eh_admin() returns boolean
  language sql stable security definer set search_path = public, pg_temp
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

  `eh_admin()` também entra nas consultas do visitante anônimo, porque
  políticas somam: toda leitura de `profissional` passa a avaliar
  `publicado = true or eh_admin()`. `(select eh_admin())` em vez de
  `eh_admin()` deixa o planejador tratar a chamada como uma subconsulta
  içável e avaliá-la uma vez por consulta, não uma vez por linha — sem isto,
  o custo desta fatia cairia sobre o site público, que é o caminho que mais
  interessa manter rápido.
*/
create policy admin_le_profissional     on profissional            for select using ((select eh_admin()));
create policy admin_le_prof_esp         on profissional_especialidade for select using ((select eh_admin()));
create policy admin_le_formacao         on formacao                for select using ((select eh_admin()));
create policy admin_le_estabelecimento  on estabelecimento         for select using ((select eh_admin()));
create policy admin_le_local            on local                   for select using ((select eh_admin()));
create policy admin_le_acessibilidade   on local_acessibilidade    for select using ((select eh_admin()));
create policy admin_le_atendimento      on atendimento             for select using ((select eh_admin()));
create policy admin_le_horario          on horario                 for select using ((select eh_admin()));

/*
  Admin grava em `profissional`, e só nela nesta fatia.

  Nenhuma remoção é concedida em lugar nenhum deste projeto. Com a segurança
  de linha ligada e sem política que a autorize, o Postgres recusa remoção de
  qualquer pessoa por qualquer caminho. Despublicar é `publicado = false`, e o
  dado fica.

  O teste desta tarefa varre o arquivo inteiro atrás da concessão, e por isso
  este comentário a descreve sem escrever a sintaxe dela — do contrário a
  explicação da garantia derrubaria a garantia.
*/
create policy admin_cria_profissional on profissional
  for insert with check (eh_admin());

create policy admin_altera_profissional on profissional
  for update using (eh_admin()) with check (eh_admin());

/*
  `local_publicado` nasceu em 0002_rls.sql sem `pg_temp` no caminho de busca,
  e por isso podia ser enganada por uma tabela temporária homônima. Corrigida
  aqui, e não lá, porque migração já aplicada não se edita: o arquivo passaria
  a divergir do banco de quem já rodou.

  O corpo é idêntico ao original — só o caminho de busca muda.
*/
create or replace function local_publicado(id_local bigint) returns boolean
  language sql stable security definer set search_path = public, pg_temp
  as $$
    select exists (
             select 1 from local l
             join estabelecimento e on e.id = l.estabelecimento_id
             where l.id = id_local and e.publicado = true)
        or exists (
             select 1 from atendimento a
             join profissional p on p.id = a.profissional_id
             where a.local_id = id_local and p.publicado = true);
  $$;
