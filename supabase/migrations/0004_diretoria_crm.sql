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
  and (coalesce(btrim(d.crm), '') = '' or coalesce(btrim(d.crm_uf), '') = '');

-- A exigência é de conteúdo, não de "não nulo". `crm = ''` satisfaria um
-- `is not null` e declararia conformidade sobre uma inscrição que não existe:
-- a tela trata vazio como ausente e cai na reserva, e sem perfil visível sai
-- nome de médico sem CRM com o banco dizendo que está tudo certo. Hoje isso
-- só se alcança por SQL direto, mas o painel da Fase 4 vai expor este campo
-- num formulário, e formulário devolve string vazia, nunca nulo.
--
-- O `coalesce` não é enfeite: `btrim(null)` é nulo, `nulo <> ''` é nulo, e
-- um CHECK cujo resultado é nulo PASSA no Postgres. Sem ele, a restrição
-- aceitaria de volta exatamente o que veio consertar.
--
-- Sem trava de formato, nem aqui nem em `crm_uf`, e a razão é concreta: a
-- coluna equivalente em `profissional` é `text` sem checagem nenhuma, e o
-- `update` acima copia de lá. Uma regra mais estrita na cópia do que na
-- fonte faria a própria migração falhar diante de um valor que o registro
-- vivo considera legítimo. Disciplina de formato, se um dia entrar, entra
-- primeiro em `profissional`.
alter table diretoria
  add constraint diretor_medico_tem_inscricao check (
    not (publicado and medico)
    or (
      coalesce(btrim(crm), '') <> ''
      and coalesce(btrim(crm_uf), '') <> ''
    )
  );

comment on column diretoria.crm is
  'CRM do diretor, exigido pela Resolução CFM 2.336/2023, Art. 4º, I para todo diretor médico publicado. Esta coluna é a fonte autoritativa, e a constraint diretor_medico_tem_inscricao a garante: o laço com profissional não serve de prova porque a RLS esconde do visitante anônimo o perfil não publicado. A tela usa o CRM do perfil ligado como reserva quando esta coluna está vazia, o que a constraint impede para diretor médico publicado.';

comment on column diretoria.crm_uf is
  'UF do CRM do diretor. Ver comentário de diretoria.crm.';

comment on column diretoria.profissional_id is
  'Laço opcional com o perfil do diretório. Dá foto, link e, quando a coluna crm desta linha está vazia, o CRM de reserva que a tela exibe. Nunca serve de prova de inscrição para efeito da constraint: o perfil pode estar despublicado e invisível para o visitante anônimo.';
