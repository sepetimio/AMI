-- CRM próprio passa a ser obrigatório para todo diretor médico publicado.
--
-- A restrição criada em 0003_diretoria.sql aceitava `profissional_id is not
-- null` como prova de inscrição. Não é prova: a política `leitura_profissional`
-- de 0002_rls.sql só deixa o visitante anônimo ler `profissional` com
-- `publicado = true`, e o site consulta com a chave anônima de propósito (ver
-- lib/dados/cliente.ts). Um diretor ligado a um profissional ainda não
-- publicado faz o embed do PostgREST voltar nulo, o código cai nas colunas
-- próprias, e elas estavam vazias justamente porque a restrição antiga não as
-- exigiu. Resultado na tela: nome de médico sem inscrição, contra a Resolução
-- CFM 2.336/2023, Art. 4º, I.
--
-- E esse não é um caso de borda. Tudo que entra pela planilha chega
-- despublicado (spec, seção 8), então "diretor ligado a perfil não publicado"
-- é o estado normal de uma base recém-importada.
--
-- Correção: o laço com `profissional` deixa de ser fonte de conformidade e
-- passa a servir só para foto e link. O CRM exibido vem sempre das colunas
-- próprias, que estão na mesma linha de `diretoria` e por isso o visitante
-- anônimo sempre enxerga.

alter table diretoria
  drop constraint diretor_medico_tem_inscricao;

-- Preenche o CRM próprio de quem já está cadastrado a partir do perfil ligado.
-- Sem este passo a restrição nova não entra: as linhas do seed de demonstração
-- foram gravadas confiando no laço, com `crm` nulo.
update diretoria d
set crm = p.crm,
    crm_uf = p.crm_uf
from profissional p
where p.id = d.profissional_id
  and (d.crm is null or d.crm_uf is null);

alter table diretoria
  add constraint diretor_medico_tem_inscricao check (
    not (publicado and medico)
    or (crm is not null and crm_uf is not null)
  );

comment on column diretoria.crm is
  'CRM do diretor, exigido pela Resolução CFM 2.336/2023, Art. 4º, I para todo diretor médico publicado. Coluna própria, e não projeção do perfil ligado: a RLS esconde do visitante o profissional não publicado, então só o que está nesta linha chega à tela. Ver constraint diretor_medico_tem_inscricao.';

comment on column diretoria.crm_uf is
  'UF do CRM do diretor. Ver comentário de diretoria.crm.';

comment on column diretoria.profissional_id is
  'Laço opcional com o perfil do diretório. Serve para foto e link, nunca como prova de inscrição no CRM: o perfil pode estar despublicado e invisível para o visitante anônimo.';
