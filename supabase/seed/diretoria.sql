-- Diretoria de demonstração. Os cargos são os de um estatuto típico de
-- associação médica; os nomes vêm do seed do diretório, para que o laço com
-- `profissional` exista de verdade e a página possa ser conferida.
--
-- O CRM é copiado do profissional para as colunas próprias da linha, e não
-- deixado a cargo do laço: a restrição `diretor_medico_tem_inscricao`
-- (0004_diretoria_crm.sql) exige inscrição na própria linha de todo diretor
-- médico publicado, porque é só ela que o visitante anônimo enxerga.
--
-- Substituir pela diretoria real da AMI antes do lançamento. Enquanto estes
-- dados estiverem no ar, NEXT_PUBLIC_DADOS_DEMONSTRACAO continua "true" e o
-- robots.txt bloqueia o site inteiro.

insert into diretoria (profissional_id, nome, cargo, ordem, crm, crm_uf, publicado)
select p.id, p.nome, v.cargo, v.ordem, p.crm, p.crm_uf, true
from (values
  ('mayara-viana',     'Presidente',            10),
  ('rafael-coelho',    'Vice-presidente',       20),
  ('larissa-nogueira', 'Diretora científica',   30),
  ('tiago-barbosa',    'Tesoureiro',            40)
) as v (slug, cargo, ordem)
join profissional p on p.slug = v.slug;
