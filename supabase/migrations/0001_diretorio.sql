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
