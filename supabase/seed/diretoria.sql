-- Diretoria de demonstração. Os cargos são os de um estatuto típico de
-- associação médica; os nomes vêm do seed do diretório, para que o laço com
-- `profissional` exista de verdade e a página possa ser conferida.
--
-- Substituir pela diretoria real da AMI antes do lançamento. Enquanto estes
-- dados estiverem no ar, NEXT_PUBLIC_DADOS_DEMONSTRACAO continua "true" e o
-- robots.txt bloqueia o site inteiro.

insert into diretoria (profissional_id, nome, cargo, ordem, publicado)
select p.id, p.nome, v.cargo, v.ordem, true
from (values
  ('mayara-viana',     'Presidente',            10),
  ('rafael-coelho',    'Vice-presidente',       20),
  ('larissa-nogueira', 'Diretora científica',   30),
  ('tiago-barbosa',    'Tesoureiro',            40)
) as v (slug, cargo, ordem)
join profissional p on p.slug = v.slug;
