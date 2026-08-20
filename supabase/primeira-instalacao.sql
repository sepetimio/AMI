-- =====================================================================
-- INSTALAÇÃO INICIAL DO BANCO — Associação Médica de Imperatriz
--
-- Junção, na ordem certa, de:
--   supabase/migrations/0001_diretorio.sql   (as tabelas)
--   supabase/migrations/0002_rls.sql         (quem pode ler o quê)
--   supabase/seed/seed.sql                   (dados de demonstração)
--
-- Para a primeira instalação: cole tudo de uma vez no SQL Editor do
-- Supabase e execute. Rodar duas vezes dá erro na segunda, porque as
-- tabelas já existirão.
--
-- Para apenas recarregar os dados fictícios num banco já montado, use
-- supabase/recarregar-dados.sql.
-- =====================================================================

-- ============ PARTE 1 de 3: as tabelas ============

-- Diretório médico da AMI.
-- Convênio, preço e avaliação não existem neste projeto, por decisão de escopo.

create extension if not exists unaccent;
create extension if not exists pg_trgm;

create table especialidade (
  id              bigint generated always as identity primary key,
  nome            text not null unique,
  slug            text not null unique,
  o_que_faz       text,
  quando_procurar text,
  revisado_por    bigint,
  revisado_em     date
);

create table bairro (
  id     bigint generated always as identity primary key,
  nome   text not null,
  slug   text not null unique,
  cidade text not null default 'Imperatriz',
  uf     text not null default 'MA'
);

create table profissional (
  id            bigint generated always as identity primary key,
  slug          text not null unique,
  nome          text not null,
  -- CRM é bloqueante para publicar: sem ele o perfil não vai ao ar.
  crm           text not null,
  crm_uf        text not null default 'MA',
  foto          text,
  bio           text,
  telemedicina  boolean not null default false,
  associado_ami boolean not null default false,
  situacao      text not null default 'ativo'
                check (situacao in ('ativo', 'inativo')),
  verificado_em date,
  publicado     boolean not null default false,
  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  unique (crm, crm_uf)
);

alter table especialidade
  add constraint especialidade_revisor_fk
  foreign key (revisado_por) references profissional (id) on delete set null;

create table profissional_especialidade (
  profissional_id  bigint not null references profissional (id) on delete cascade,
  especialidade_id bigint not null references especialidade (id) on delete cascade,
  -- RQE só existe quando há especialidade registrada no CRM.
  -- Clínico geral sem RQE é caso normal: por isso aceita nulo.
  rqe       text,
  principal boolean not null default false,
  primary key (profissional_id, especialidade_id)
);

create table formacao (
  id              bigint generated always as identity primary key,
  profissional_id bigint not null references profissional (id) on delete cascade,
  instituicao     text not null,
  curso           text not null,
  tipo            text not null
                  check (tipo in ('graduacao', 'residencia', 'titulo')),
  ano             int
);

create table estabelecimento (
  id        bigint generated always as identity primary key,
  slug      text not null unique,
  nome      text not null,
  cnpj      text,
  categoria text not null
            check (categoria in ('clinica', 'laboratorio', 'hospital', 'centro_diagnostico')),
  sobre     text,
  publicado boolean not null default false
);

create table local (
  id                 bigint generated always as identity primary key,
  estabelecimento_id bigint references estabelecimento (id) on delete cascade,
  logradouro         text not null,
  numero             text,
  complemento        text,
  bairro_id          bigint not null references bairro (id),
  cep                text,
  lat                numeric(9, 6),
  lng                numeric(9, 6),
  telefone           text,
  whatsapp           text,
  estacionamento     boolean not null default false
);

create table local_acessibilidade (
  local_id bigint not null references local (id) on delete cascade,
  recurso  text not null
           check (recurso in ('acesso_cadeirante', 'banheiro_adaptado',
                              'elevador', 'piso_tatil', 'interprete_libras')),
  primary key (local_id, recurso)
);

create table atendimento (
  id              bigint generated always as identity primary key,
  profissional_id bigint not null references profissional (id) on delete cascade,
  local_id        bigint not null references local (id) on delete cascade,
  unique (profissional_id, local_id)
);

create table horario (
  id             bigint generated always as identity primary key,
  atendimento_id bigint not null references atendimento (id) on delete cascade,
  dia_semana     smallint not null check (dia_semana between 0 and 6),
  abre           time not null,
  fecha          time not null,
  check (fecha > abre)
);

-- Busca por nome em português: sem unaccent, "jose" não acha "José", que é
-- exatamente o caso em que o usuário mais precisa da busca.
--
-- O unaccent() da extensão é STABLE, e o Postgres só indexa expressão
-- IMMUTABLE. Daí este invólucro: mesma função, marcada corretamente, com
-- o dicionário nomeado explicitamente para que o resultado não dependa do
-- search_path de quem consulta.
create function sem_acento(texto text) returns text
  language sql immutable strict parallel safe
  as $$ select public.unaccent('public.unaccent', texto) $$;

create index profissional_nome_trgm
  on profissional using gin (sem_acento(nome) gin_trgm_ops);

create index profissional_publicado on profissional (publicado);
create index local_bairro on local (bairro_id);
create index atendimento_profissional on atendimento (profissional_id);
create index horario_atendimento on horario (atendimento_id);

-- ============ PARTE 2 de 3: as permissões ============

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

/*
  Um local é público quando pertence a um estabelecimento publicado OU quando
  algum profissional publicado atende nele.

  A condição vive numa função porque as duas políticas abaixo precisam dela e
  duplicá-las deixaria uma delas para trás na primeira alteração. SECURITY
  DEFINER evita que a RLS das tabelas consultadas aqui dispare recursivamente
  dentro da própria política, e o search_path fixo impede que alguém troque o
  significado de "local" por um objeto homônimo.

  Sem isto, o consultório próprio de um médico não publicado — que tem
  estabelecimento_id nulo — ficaria legível para qualquer visitante, expondo
  endereço, telefone e coordenadas de um perfil que ainda não foi ao ar.
*/
create function local_publicado(id_local bigint) returns boolean
  language sql stable security definer set search_path = public
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

create policy leitura_local on local
  for select using (local_publicado(id));

create policy leitura_acessibilidade on local_acessibilidade
  for select using (local_publicado(local_id));

create policy leitura_atendimento on atendimento
  for select using (exists (
    select 1 from profissional p
    where p.id = profissional_id and p.publicado = true));

create policy leitura_horario on horario
  for select using (exists (
    select 1 from atendimento a
    join profissional p on p.id = a.profissional_id
    where a.id = atendimento_id and p.publicado = true));

-- ============ PARTE 3 de 3: dados de demonstração ============

-- Dados de demonstração. Fictícios, mas verossímeis para Imperatriz-MA.
-- Gerado por supabase/seed/gerar-seed.ts — não edite à mão.

truncate horario, atendimento, local_acessibilidade, local,
  formacao, profissional_especialidade, profissional, estabelecimento,
  bairro, especialidade restart identity cascade;

insert into bairro (nome, slug) values
  ('Centro', 'centro'),
  ('Nova Imperatriz', 'nova-imperatriz'),
  ('Bacuri', 'bacuri'),
  ('Juçara', 'jucara'),
  ('Maranhão Novo', 'maranhao-novo'),
  ('Parque do Buriti', 'parque-do-buriti'),
  ('Vila Lobão', 'vila-lobao'),
  ('Santa Rita', 'santa-rita');

insert into especialidade (nome, slug, o_que_faz, quando_procurar) values
  ('Clínica Médica', 'clinica-medica', '[PROVISÓRIO] Texto sobre a atuação em clínica médica, a ser escrito e revisado por médico associado.', '[PROVISÓRIO] Sinais e situações que levam à consulta em clínica médica, a ser escrito e revisado por médico associado.'),
  ('Cardiologia', 'cardiologia', '[PROVISÓRIO] Texto sobre a atuação em cardiologia, a ser escrito e revisado por médico associado.', '[PROVISÓRIO] Sinais e situações que levam à consulta em cardiologia, a ser escrito e revisado por médico associado.'),
  ('Dermatologia', 'dermatologia', '[PROVISÓRIO] Texto sobre a atuação em dermatologia, a ser escrito e revisado por médico associado.', '[PROVISÓRIO] Sinais e situações que levam à consulta em dermatologia, a ser escrito e revisado por médico associado.'),
  ('Ginecologia e Obstetrícia', 'ginecologia-e-obstetricia', '[PROVISÓRIO] Texto sobre a atuação em ginecologia e obstetrícia, a ser escrito e revisado por médico associado.', '[PROVISÓRIO] Sinais e situações que levam à consulta em ginecologia e obstetrícia, a ser escrito e revisado por médico associado.'),
  ('Ortopedia e Traumatologia', 'ortopedia-e-traumatologia', '[PROVISÓRIO] Texto sobre a atuação em ortopedia e traumatologia, a ser escrito e revisado por médico associado.', '[PROVISÓRIO] Sinais e situações que levam à consulta em ortopedia e traumatologia, a ser escrito e revisado por médico associado.'),
  ('Pediatria', 'pediatria', '[PROVISÓRIO] Texto sobre a atuação em pediatria, a ser escrito e revisado por médico associado.', '[PROVISÓRIO] Sinais e situações que levam à consulta em pediatria, a ser escrito e revisado por médico associado.'),
  ('Oftalmologia', 'oftalmologia', '[PROVISÓRIO] Texto sobre a atuação em oftalmologia, a ser escrito e revisado por médico associado.', '[PROVISÓRIO] Sinais e situações que levam à consulta em oftalmologia, a ser escrito e revisado por médico associado.'),
  ('Psiquiatria', 'psiquiatria', '[PROVISÓRIO] Texto sobre a atuação em psiquiatria, a ser escrito e revisado por médico associado.', '[PROVISÓRIO] Sinais e situações que levam à consulta em psiquiatria, a ser escrito e revisado por médico associado.'),
  ('Endocrinologia', 'endocrinologia', '[PROVISÓRIO] Texto sobre a atuação em endocrinologia, a ser escrito e revisado por médico associado.', '[PROVISÓRIO] Sinais e situações que levam à consulta em endocrinologia, a ser escrito e revisado por médico associado.'),
  ('Gastroenterologia', 'gastroenterologia', '[PROVISÓRIO] Texto sobre a atuação em gastroenterologia, a ser escrito e revisado por médico associado.', '[PROVISÓRIO] Sinais e situações que levam à consulta em gastroenterologia, a ser escrito e revisado por médico associado.'),
  ('Neurologia', 'neurologia', '[PROVISÓRIO] Texto sobre a atuação em neurologia, a ser escrito e revisado por médico associado.', '[PROVISÓRIO] Sinais e situações que levam à consulta em neurologia, a ser escrito e revisado por médico associado.'),
  ('Otorrinolaringologia', 'otorrinolaringologia', '[PROVISÓRIO] Texto sobre a atuação em otorrinolaringologia, a ser escrito e revisado por médico associado.', '[PROVISÓRIO] Sinais e situações que levam à consulta em otorrinolaringologia, a ser escrito e revisado por médico associado.'),
  ('Urologia', 'urologia', '[PROVISÓRIO] Texto sobre a atuação em urologia, a ser escrito e revisado por médico associado.', '[PROVISÓRIO] Sinais e situações que levam à consulta em urologia, a ser escrito e revisado por médico associado.'),
  ('Reumatologia', 'reumatologia', '[PROVISÓRIO] Texto sobre a atuação em reumatologia, a ser escrito e revisado por médico associado.', '[PROVISÓRIO] Sinais e situações que levam à consulta em reumatologia, a ser escrito e revisado por médico associado.');

insert into profissional (slug, nome, crm, crm_uf, bio, telemedicina, associado_ami, publicado, verificado_em) values
  ('mayara-viana', 'Mayara Viana', '10000', 'MA', '[PROVISÓRIO] Biografia de Mayara Viana, a ser substituída por texto enviado pelo profissional.', true, false, true, '2026-08-19'),
  ('rafael-coelho', 'Rafael Coelho', '10137', 'MA', '[PROVISÓRIO] Biografia de Rafael Coelho, a ser substituída por texto enviado pelo profissional.', false, true, true, '2026-08-19'),
  ('larissa-nogueira', 'Larissa Nogueira', '10274', 'MA', '[PROVISÓRIO] Biografia de Larissa Nogueira, a ser substituída por texto enviado pelo profissional.', false, true, true, '2026-08-19'),
  ('tiago-barbosa', 'Tiago Barbosa', '10411', 'MA', '[PROVISÓRIO] Biografia de Tiago Barbosa, a ser substituída por texto enviado pelo profissional.', true, true, true, '2026-08-19'),
  ('camila-freitas', 'Camila Freitas', '10548', 'MA', '[PROVISÓRIO] Biografia de Camila Freitas, a ser substituída por texto enviado pelo profissional.', false, false, true, '2026-08-19'),
  ('otavio-lemos', 'Otávio Lemos', '10685', 'MA', '[PROVISÓRIO] Biografia de Otávio Lemos, a ser substituída por texto enviado pelo profissional.', false, true, true, '2026-08-19'),
  ('beatriz-sampaio', 'Beatriz Sampaio', '10822', 'MA', '[PROVISÓRIO] Biografia de Beatriz Sampaio, a ser substituída por texto enviado pelo profissional.', true, true, true, '2026-08-19'),
  ('henrique-portela', 'Henrique Portela', '10959', 'MA', '[PROVISÓRIO] Biografia de Henrique Portela, a ser substituída por texto enviado pelo profissional.', false, true, true, '2026-08-19'),
  ('juliana-marques', 'Juliana Marques', '11096', 'MA', '[PROVISÓRIO] Biografia de Juliana Marques, a ser substituída por texto enviado pelo profissional.', false, false, true, '2026-08-19'),
  ('diego-aragao', 'Diego Aragão', '11233', 'MA', '[PROVISÓRIO] Biografia de Diego Aragão, a ser substituída por texto enviado pelo profissional.', true, true, true, '2026-08-19'),
  ('patricia-cordeiro', 'Patrícia Cordeiro', '11370', 'MA', '[PROVISÓRIO] Biografia de Patrícia Cordeiro, a ser substituída por texto enviado pelo profissional.', false, true, true, '2026-08-19'),
  ('fabio-rocha', 'Fábio Rocha', '11507', 'MA', '[PROVISÓRIO] Biografia de Fábio Rocha, a ser substituída por texto enviado pelo profissional.', false, true, true, '2026-08-19'),
  ('renata-bastos', 'Renata Bastos', '11644', 'MA', '[PROVISÓRIO] Biografia de Renata Bastos, a ser substituída por texto enviado pelo profissional.', true, false, true, '2026-08-19'),
  ('marcelo-tavares', 'Marcelo Tavares', '11781', 'MA', '[PROVISÓRIO] Biografia de Marcelo Tavares, a ser substituída por texto enviado pelo profissional.', false, true, true, '2026-08-19'),
  ('aline-peixoto', 'Aline Peixoto', '11918', 'MA', '[PROVISÓRIO] Biografia de Aline Peixoto, a ser substituída por texto enviado pelo profissional.', false, true, true, '2026-08-19'),
  ('gustavo-serra', 'Gustavo Serra', '12055', 'MA', '[PROVISÓRIO] Biografia de Gustavo Serra, a ser substituída por texto enviado pelo profissional.', true, true, true, '2026-08-19'),
  ('vanessa-quirino', 'Vanessa Quirino', '12192', 'MA', '[PROVISÓRIO] Biografia de Vanessa Quirino, a ser substituída por texto enviado pelo profissional.', false, false, true, '2026-08-19'),
  ('leonardo-prata', 'Leonardo Prata', '12329', 'MA', '[PROVISÓRIO] Biografia de Leonardo Prata, a ser substituída por texto enviado pelo profissional.', false, true, true, '2026-08-19'),
  ('simone-andrade', 'Simone Andrade', '12466', 'MA', '[PROVISÓRIO] Biografia de Simone Andrade, a ser substituída por texto enviado pelo profissional.', true, true, true, '2026-08-19'),
  ('rodrigo-meireles', 'Rodrigo Meireles', '12603', 'MA', '[PROVISÓRIO] Biografia de Rodrigo Meireles, a ser substituída por texto enviado pelo profissional.', false, true, true, '2026-08-19'),
  ('cristina-bezerra', 'Cristina Bezerra', '12740', 'MA', '[PROVISÓRIO] Biografia de Cristina Bezerra, a ser substituída por texto enviado pelo profissional.', false, false, true, '2026-08-19'),
  ('anderson-vilela', 'Anderson Vilela', '12877', 'MA', '[PROVISÓRIO] Biografia de Anderson Vilela, a ser substituída por texto enviado pelo profissional.', true, true, true, '2026-08-19'),
  ('tatiane-furtado', 'Tatiane Furtado', '13014', 'MA', '[PROVISÓRIO] Biografia de Tatiane Furtado, a ser substituída por texto enviado pelo profissional.', false, true, true, '2026-08-19'),
  ('bruno-cavalcante', 'Bruno Cavalcante', '13151', 'MA', '[PROVISÓRIO] Biografia de Bruno Cavalcante, a ser substituída por texto enviado pelo profissional.', false, true, true, '2026-08-19');

insert into profissional_especialidade (profissional_id, especialidade_id, rqe, principal) values
  (1, 1, null, true),
  (2, 1, null, true),
  (3, 1, null, true),
  (4, 1, null, true),
  (5, 2, '20364', true),
  (6, 2, '20455', true),
  (7, 2, '20546', true),
  (8, 6, '20637', true),
  (9, 6, '20728', true),
  (10, 6, '20819', true),
  (11, 3, '20910', true),
  (12, 3, '21001', true),
  (13, 4, '21092', true),
  (14, 4, '21183', true),
  (15, 5, '21274', true),
  (16, 5, '21365', true),
  (17, 7, '21456', true),
  (18, 8, '21547', true),
  (19, 9, '21638', true),
  (20, 10, '21729', true),
  (21, 11, '21820', true),
  (22, 12, '21911', true),
  (23, 13, '22002', true),
  (24, 14, '22093', true);

insert into local (logradouro, numero, bairro_id, telefone, whatsapp, estacionamento) values
  ('Rua Projetada 100', '100', 1, '9930000000', '9930000000', true),
  ('Rua Projetada 101', '107', 1, '9930013571', '9930013571', false),
  ('Rua Projetada 102', '114', 1, '9930027142', '9930027142', true),
  ('Rua Projetada 103', '121', 2, '9930040713', '9930040713', false),
  ('Rua Projetada 104', '128', 1, '9930054284', '9930054284', true),
  ('Rua Projetada 105', '135', 1, '9930067855', '9930067855', false),
  ('Rua Projetada 106', '142', 3, '9930081426', '9930081426', true),
  ('Rua Projetada 107', '149', 1, '9930094997', '9930094997', false),
  ('Rua Projetada 108', '156', 4, '9930108568', '9930108568', true),
  ('Rua Projetada 109', '163', 5, '9930122139', '9930122139', false),
  ('Rua Projetada 110', '170', 1, '9930135710', '9930135710', true),
  ('Rua Projetada 111', '177', 6, '9930149281', '9930149281', false),
  ('Rua Projetada 112', '184', 1, '9930162852', '9930162852', true),
  ('Rua Projetada 113', '191', 7, '9930176423', '9930176423', false),
  ('Rua Projetada 114', '198', 2, '9930189994', '9930189994', true),
  ('Rua Projetada 115', '205', 8, '9930203565', '9930203565', false),
  ('Rua Projetada 116', '212', 3, '9930217136', '9930217136', true),
  ('Rua Projetada 117', '219', 4, '9930230707', '9930230707', false),
  ('Rua Projetada 118', '226', 5, '9930244278', '9930244278', true),
  ('Rua Projetada 119', '233', 6, '9930257849', '9930257849', false),
  ('Rua Projetada 120', '240', 7, '9930271420', '9930271420', true),
  ('Rua Projetada 121', '247', 8, '9930284991', '9930284991', false),
  ('Rua Projetada 122', '254', 2, '9930298562', '9930298562', true),
  ('Rua Projetada 123', '261', 3, '9930312133', '9930312133', false);

insert into local_acessibilidade (local_id, recurso) values
  (1, 'acesso_cadeirante'),
  (1, 'banheiro_adaptado'),
  (1, 'elevador'),
  (3, 'acesso_cadeirante'),
  (4, 'banheiro_adaptado'),
  (5, 'acesso_cadeirante'),
  (6, 'elevador'),
  (7, 'acesso_cadeirante'),
  (7, 'banheiro_adaptado'),
  (9, 'acesso_cadeirante'),
  (10, 'banheiro_adaptado'),
  (11, 'acesso_cadeirante'),
  (11, 'elevador'),
  (13, 'acesso_cadeirante'),
  (13, 'banheiro_adaptado'),
  (15, 'acesso_cadeirante'),
  (16, 'banheiro_adaptado'),
  (16, 'elevador'),
  (17, 'acesso_cadeirante'),
  (19, 'acesso_cadeirante'),
  (19, 'banheiro_adaptado'),
  (21, 'acesso_cadeirante'),
  (21, 'elevador'),
  (22, 'banheiro_adaptado'),
  (23, 'acesso_cadeirante');

insert into atendimento (profissional_id, local_id) values
  (1, 1),
  (2, 2),
  (3, 3),
  (4, 4),
  (5, 5),
  (6, 6),
  (7, 7),
  (8, 8),
  (9, 9),
  (10, 10),
  (11, 11),
  (12, 12),
  (13, 13),
  (14, 14),
  (15, 15),
  (16, 16),
  (17, 17),
  (18, 18),
  (19, 19),
  (20, 20),
  (21, 21),
  (22, 22),
  (23, 23),
  (24, 24);

insert into horario (atendimento_id, dia_semana, abre, fecha) values
  (1, 1, '08:00', '12:00'),
  (1, 1, '14:00', '18:00'),
  (1, 2, '08:00', '12:00'),
  (1, 2, '14:00', '18:00'),
  (1, 3, '08:00', '12:00'),
  (1, 3, '14:00', '18:00'),
  (1, 4, '08:00', '12:00'),
  (1, 4, '14:00', '18:00'),
  (1, 5, '08:00', '12:00'),
  (1, 5, '14:00', '18:00'),
  (1, 6, '08:00', '12:00'),
  (2, 1, '08:00', '12:00'),
  (2, 1, '14:00', '18:00'),
  (2, 2, '08:00', '12:00'),
  (2, 2, '14:00', '18:00'),
  (2, 3, '08:00', '12:00'),
  (2, 3, '14:00', '18:00'),
  (2, 4, '08:00', '12:00'),
  (2, 4, '14:00', '18:00'),
  (2, 5, '08:00', '12:00'),
  (2, 5, '14:00', '18:00'),
  (3, 1, '08:00', '12:00'),
  (3, 1, '14:00', '18:00'),
  (3, 2, '08:00', '12:00'),
  (3, 2, '14:00', '18:00'),
  (3, 3, '08:00', '12:00'),
  (3, 3, '14:00', '18:00'),
  (3, 4, '08:00', '12:00'),
  (3, 4, '14:00', '18:00'),
  (3, 5, '08:00', '12:00'),
  (3, 5, '14:00', '18:00'),
  (4, 1, '08:00', '12:00'),
  (4, 1, '14:00', '18:00'),
  (4, 2, '08:00', '12:00'),
  (4, 2, '14:00', '18:00'),
  (4, 3, '08:00', '12:00'),
  (4, 3, '14:00', '18:00'),
  (4, 4, '08:00', '12:00'),
  (4, 4, '14:00', '18:00'),
  (4, 5, '08:00', '12:00'),
  (4, 5, '14:00', '18:00'),
  (5, 1, '08:00', '12:00'),
  (5, 1, '14:00', '18:00'),
  (5, 2, '08:00', '12:00'),
  (5, 2, '14:00', '18:00'),
  (5, 3, '08:00', '12:00'),
  (5, 3, '14:00', '18:00'),
  (5, 4, '08:00', '12:00'),
  (5, 4, '14:00', '18:00'),
  (5, 5, '08:00', '12:00'),
  (5, 5, '14:00', '18:00'),
  (5, 6, '08:00', '12:00'),
  (6, 1, '08:00', '12:00'),
  (6, 1, '14:00', '18:00'),
  (6, 2, '08:00', '12:00'),
  (6, 2, '14:00', '18:00'),
  (6, 3, '08:00', '12:00'),
  (6, 3, '14:00', '18:00'),
  (6, 4, '08:00', '12:00'),
  (6, 4, '14:00', '18:00'),
  (6, 5, '08:00', '12:00'),
  (6, 5, '14:00', '18:00'),
  (7, 1, '08:00', '12:00'),
  (7, 1, '14:00', '18:00'),
  (7, 2, '08:00', '12:00'),
  (7, 2, '14:00', '18:00'),
  (7, 3, '08:00', '12:00'),
  (7, 3, '14:00', '18:00'),
  (7, 4, '08:00', '12:00'),
  (7, 4, '14:00', '18:00'),
  (7, 5, '08:00', '12:00'),
  (7, 5, '14:00', '18:00'),
  (8, 1, '08:00', '12:00'),
  (8, 1, '14:00', '18:00'),
  (8, 2, '08:00', '12:00'),
  (8, 2, '14:00', '18:00'),
  (8, 3, '08:00', '12:00'),
  (8, 3, '14:00', '18:00'),
  (8, 4, '08:00', '12:00'),
  (8, 4, '14:00', '18:00'),
  (8, 5, '08:00', '12:00'),
  (8, 5, '14:00', '18:00'),
  (9, 1, '08:00', '12:00'),
  (9, 1, '14:00', '18:00'),
  (9, 2, '08:00', '12:00'),
  (9, 2, '14:00', '18:00'),
  (9, 3, '08:00', '12:00'),
  (9, 3, '14:00', '18:00'),
  (9, 4, '08:00', '12:00'),
  (9, 4, '14:00', '18:00'),
  (9, 5, '08:00', '12:00'),
  (9, 5, '14:00', '18:00'),
  (9, 6, '08:00', '12:00'),
  (10, 1, '08:00', '12:00'),
  (10, 1, '14:00', '18:00'),
  (10, 2, '08:00', '12:00'),
  (10, 2, '14:00', '18:00'),
  (10, 3, '08:00', '12:00'),
  (10, 3, '14:00', '18:00'),
  (10, 4, '08:00', '12:00'),
  (10, 4, '14:00', '18:00'),
  (10, 5, '08:00', '12:00'),
  (10, 5, '14:00', '18:00'),
  (11, 1, '08:00', '12:00'),
  (11, 1, '14:00', '18:00'),
  (11, 2, '08:00', '12:00'),
  (11, 2, '14:00', '18:00'),
  (11, 3, '08:00', '12:00'),
  (11, 3, '14:00', '18:00'),
  (11, 4, '08:00', '12:00'),
  (11, 4, '14:00', '18:00'),
  (11, 5, '08:00', '12:00'),
  (11, 5, '14:00', '18:00'),
  (12, 1, '08:00', '12:00'),
  (12, 1, '14:00', '18:00'),
  (12, 2, '08:00', '12:00'),
  (12, 2, '14:00', '18:00'),
  (12, 3, '08:00', '12:00'),
  (12, 3, '14:00', '18:00'),
  (12, 4, '08:00', '12:00'),
  (12, 4, '14:00', '18:00'),
  (12, 5, '08:00', '12:00'),
  (12, 5, '14:00', '18:00'),
  (13, 1, '08:00', '12:00'),
  (13, 1, '14:00', '18:00'),
  (13, 2, '08:00', '12:00'),
  (13, 2, '14:00', '18:00'),
  (13, 3, '08:00', '12:00'),
  (13, 3, '14:00', '18:00'),
  (13, 4, '08:00', '12:00'),
  (13, 4, '14:00', '18:00'),
  (13, 5, '08:00', '12:00'),
  (13, 5, '14:00', '18:00'),
  (13, 6, '08:00', '12:00'),
  (14, 1, '08:00', '12:00'),
  (14, 1, '14:00', '18:00'),
  (14, 2, '08:00', '12:00'),
  (14, 2, '14:00', '18:00'),
  (14, 3, '08:00', '12:00'),
  (14, 3, '14:00', '18:00'),
  (14, 4, '08:00', '12:00'),
  (14, 4, '14:00', '18:00'),
  (14, 5, '08:00', '12:00'),
  (14, 5, '14:00', '18:00'),
  (15, 1, '08:00', '12:00'),
  (15, 1, '14:00', '18:00'),
  (15, 2, '08:00', '12:00'),
  (15, 2, '14:00', '18:00'),
  (15, 3, '08:00', '12:00'),
  (15, 3, '14:00', '18:00'),
  (15, 4, '08:00', '12:00'),
  (15, 4, '14:00', '18:00'),
  (15, 5, '08:00', '12:00'),
  (15, 5, '14:00', '18:00'),
  (16, 1, '08:00', '12:00'),
  (16, 1, '14:00', '18:00'),
  (16, 2, '08:00', '12:00'),
  (16, 2, '14:00', '18:00'),
  (16, 3, '08:00', '12:00'),
  (16, 3, '14:00', '18:00'),
  (16, 4, '08:00', '12:00'),
  (16, 4, '14:00', '18:00'),
  (16, 5, '08:00', '12:00'),
  (16, 5, '14:00', '18:00'),
  (17, 1, '08:00', '12:00'),
  (17, 1, '14:00', '18:00'),
  (17, 2, '08:00', '12:00'),
  (17, 2, '14:00', '18:00'),
  (17, 3, '08:00', '12:00'),
  (17, 3, '14:00', '18:00'),
  (17, 4, '08:00', '12:00'),
  (17, 4, '14:00', '18:00'),
  (17, 5, '08:00', '12:00'),
  (17, 5, '14:00', '18:00'),
  (17, 6, '08:00', '12:00'),
  (18, 1, '08:00', '12:00'),
  (18, 1, '14:00', '18:00'),
  (18, 2, '08:00', '12:00'),
  (18, 2, '14:00', '18:00'),
  (18, 3, '08:00', '12:00'),
  (18, 3, '14:00', '18:00'),
  (18, 4, '08:00', '12:00'),
  (18, 4, '14:00', '18:00'),
  (18, 5, '08:00', '12:00'),
  (18, 5, '14:00', '18:00'),
  (19, 1, '08:00', '12:00'),
  (19, 1, '14:00', '18:00'),
  (19, 2, '08:00', '12:00'),
  (19, 2, '14:00', '18:00'),
  (19, 3, '08:00', '12:00'),
  (19, 3, '14:00', '18:00'),
  (19, 4, '08:00', '12:00'),
  (19, 4, '14:00', '18:00'),
  (19, 5, '08:00', '12:00'),
  (19, 5, '14:00', '18:00'),
  (20, 1, '08:00', '12:00'),
  (20, 1, '14:00', '18:00'),
  (20, 2, '08:00', '12:00'),
  (20, 2, '14:00', '18:00'),
  (20, 3, '08:00', '12:00'),
  (20, 3, '14:00', '18:00'),
  (20, 4, '08:00', '12:00'),
  (20, 4, '14:00', '18:00'),
  (20, 5, '08:00', '12:00'),
  (20, 5, '14:00', '18:00'),
  (21, 1, '08:00', '12:00'),
  (21, 1, '14:00', '18:00'),
  (21, 2, '08:00', '12:00'),
  (21, 2, '14:00', '18:00'),
  (21, 3, '08:00', '12:00'),
  (21, 3, '14:00', '18:00'),
  (21, 4, '08:00', '12:00'),
  (21, 4, '14:00', '18:00'),
  (21, 5, '08:00', '12:00'),
  (21, 5, '14:00', '18:00'),
  (21, 6, '08:00', '12:00'),
  (22, 1, '08:00', '12:00'),
  (22, 1, '14:00', '18:00'),
  (22, 2, '08:00', '12:00'),
  (22, 2, '14:00', '18:00'),
  (22, 3, '08:00', '12:00'),
  (22, 3, '14:00', '18:00'),
  (22, 4, '08:00', '12:00'),
  (22, 4, '14:00', '18:00'),
  (22, 5, '08:00', '12:00'),
  (22, 5, '14:00', '18:00'),
  (23, 1, '08:00', '12:00'),
  (23, 1, '14:00', '18:00'),
  (23, 2, '08:00', '12:00'),
  (23, 2, '14:00', '18:00'),
  (23, 3, '08:00', '12:00'),
  (23, 3, '14:00', '18:00'),
  (23, 4, '08:00', '12:00'),
  (23, 4, '14:00', '18:00'),
  (23, 5, '08:00', '12:00'),
  (23, 5, '14:00', '18:00'),
  (24, 1, '08:00', '12:00'),
  (24, 1, '14:00', '18:00'),
  (24, 2, '08:00', '12:00'),
  (24, 2, '14:00', '18:00'),
  (24, 3, '08:00', '12:00'),
  (24, 3, '14:00', '18:00'),
  (24, 4, '08:00', '12:00'),
  (24, 4, '14:00', '18:00'),
  (24, 5, '08:00', '12:00'),
  (24, 5, '14:00', '18:00');

