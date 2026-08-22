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
