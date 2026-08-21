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
  -- CRM próprio do diretor. Usado só quando não há profissional_id ligado:
  -- o laço opcional acima, por desenho, permite publicar um diretor sem
  -- perfil no diretório, e a Resolução CFM 2.336/2023, Art. 4º, I exige CRM
  -- ao lado de todo nome de médico exibido. Sem estas colunas, esse diretor
  -- recém-eleito sairia na tela sem inscrição nenhuma.
  crm text,
  crm_uf text,
  -- Falso só para o diretor que não é médico, por exemplo um contador na
  -- tesouraria. É o que libera esse caso da exigência de CRM abaixo.
  medico boolean not null default true,
  publicado boolean not null default false,
  -- Todo diretor médico publicado precisa de inscrição em algum lugar: no
  -- perfil ligado, ou nas colunas próprias quando não há perfil. Quem não é
  -- médico (medico = false) fica de fora da exigência.
  constraint diretor_medico_tem_inscricao check (
    not (publicado and medico)
    or profissional_id is not null
    or (crm is not null and crm_uf is not null)
  )
);

create index diretoria_ordem on diretoria (ordem, nome);

comment on column diretoria.nome is
  'Redundante em relação a profissional.nome de propósito: diretor pode não ter perfil publicado no diretório.';

comment on column diretoria.crm is
  'CRM próprio do diretor, usado só quando não há profissional_id ligado. Exigido pela Resolução CFM 2.336/2023, Art. 4º, I para todo diretor médico publicado. Ver constraint diretor_medico_tem_inscricao.';

comment on column diretoria.crm_uf is
  'UF do CRM próprio do diretor. Ver comentário de diretoria.crm.';

comment on column diretoria.medico is
  'Falso para o diretor que não é médico, por exemplo um contador na tesouraria. Libera esse diretor da exigência de CRM da constraint diretor_medico_tem_inscricao.';

alter table diretoria enable row level security;

-- Mesma regra do resto do site: visitante anônimo lê só o que está publicado.
create policy leitura_diretoria on diretoria
  for select
  using (publicado = true);
