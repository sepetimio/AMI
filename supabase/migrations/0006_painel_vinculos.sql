-- Os vínculos do médico: especialidades e consultórios.
--
-- Esta é a primeira migração do projeto que concede REMOÇÃO. Ela é restrita a
-- três tabelas de ligação, e a razão está na spec da fatia 2, seção 7: desfazer
-- um vínculo não tem outra forma. Nenhuma tabela de cadastro é alcançada — nem
-- o médico, nem o consultório, nem a especialidade.

/*
  `(select eh_admin())` e não `eh_admin()`: a subconsulta é içável pelo
  planejador, que a avalia uma vez por consulta em vez de uma por linha. As
  políticas somam, então estas entram no caminho do site público também, e é
  esse caminho que mais interessa manter rápido. Mesma escolha de 0005.
*/

-- Especialidades do médico -------------------------------------------------

create policy admin_cria_especialidade_do_medico on profissional_especialidade
  for insert with check ((select eh_admin()));

create policy admin_altera_especialidade_do_medico on profissional_especialidade
  for update using ((select eh_admin())) with check ((select eh_admin()));

create policy admin_remove_especialidade_do_medico on profissional_especialidade
  for delete using ((select eh_admin()));

-- O vínculo médico ↔ consultório -------------------------------------------

/*
  Sem `for update`: a tabela só tem as duas chaves estrangeiras e o id. Trocar o
  consultório de um médico é remover a ligação e criar outra, não alterar esta.
*/
create policy admin_cria_atendimento on atendimento
  for insert with check ((select eh_admin()));

create policy admin_remove_atendimento on atendimento
  for delete using ((select eh_admin()));

-- O consultório -------------------------------------------------------------

/*
  Escrita sim, remoção não, e a assimetria é deliberada. Criar e corrigir
  endereço a AMI precisa. Apagar não: um endereço pode estar em uso por outro
  médico, e esta tabela não tem como saber disso na hora da política. Endereço
  órfão não aparece em lugar nenhum do site, e continuar existindo é mais barato
  que sumir por engano.
*/
create policy admin_cria_local on local
  for insert with check ((select eh_admin()));

create policy admin_altera_local on local
  for update using ((select eh_admin())) with check ((select eh_admin()));

-- Acessibilidade do consultório ---------------------------------------------

create policy admin_cria_acessibilidade on local_acessibilidade
  for insert with check ((select eh_admin()));

create policy admin_remove_acessibilidade on local_acessibilidade
  for delete using ((select eh_admin()));
