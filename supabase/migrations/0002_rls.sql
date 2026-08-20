-- Permissões vivem no banco. O visitante só enxerga o que está publicado,
-- e nenhum erro de tela consegue expor rascunho.

alter table especialidade               enable row level security;
alter table bairro                      enable row level security;
alter table profissional                enable row level security;
alter table profissional_especialidade  enable row level security;
alter table formacao                    enable row level security;
alter table estabelecimento             enable row level security;
alter table local                       enable row level security;
alter table local_acessibilidade        enable row level security;
alter table atendimento                 enable row level security;
alter table horario                     enable row level security;

-- Tabelas de referência: leitura livre, são catálogo público.
create policy leitura_especialidade on especialidade for select using (true);
create policy leitura_bairro        on bairro        for select using (true);

-- Só perfis publicados aparecem.
create policy leitura_profissional on profissional
  for select using (publicado = true);

create policy leitura_estabelecimento on estabelecimento
  for select using (publicado = true);

-- As tabelas dependentes herdam a condição do dono. Sem isto, alguém
-- listaria os horários de um perfil que ainda não foi ao ar.
create policy leitura_prof_esp on profissional_especialidade
  for select using (exists (
    select 1 from profissional p
    where p.id = profissional_id and p.publicado = true));

create policy leitura_formacao on formacao
  for select using (exists (
    select 1 from profissional p
    where p.id = profissional_id and p.publicado = true));

create policy leitura_local on local
  for select using (
    estabelecimento_id is null
    or exists (select 1 from estabelecimento e
               where e.id = estabelecimento_id and e.publicado = true));

create policy leitura_acessibilidade on local_acessibilidade
  for select using (true);

create policy leitura_atendimento on atendimento
  for select using (exists (
    select 1 from profissional p
    where p.id = profissional_id and p.publicado = true));

create policy leitura_horario on horario
  for select using (exists (
    select 1 from atendimento a
    join profissional p on p.id = a.profissional_id
    where a.id = atendimento_id and p.publicado = true));
