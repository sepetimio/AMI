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

alter table diretoria enable row level security;

-- Mesma regra do resto do site: visitante anônimo lê só o que está publicado.
create policy leitura_diretoria on diretoria
  for select
  using (publicado = true);
