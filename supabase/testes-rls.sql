/*
  Asserções das políticas do painel.

  Cole no editor SQL do Supabase e rode. Não altera nada: tudo acontece dentro
  de uma transação que termina em rollback. Se qualquer asserção falhar, o
  Postgres levanta exceção com a mensagem correspondente.

  APROVADO é o script terminar SEM ERRO: toda verificação aqui é um
  `raise exception`, e a primeira que falhar aborta tudo com o nome dela.

  RODE O ARQUIVO INTEIRO, nunca um trecho selecionado. Ele contém um `insert`
  que promove uma conta a admin, e o que o desfaz é o `rollback` do fim. Um
  trecho selecionado sem ele deixa esse admin para trás.

  Por que este arquivo existe: os testes automáticos deste projeto rodam em
  memória, sem banco, e política de banco é a parte mais fácil de errar — e o
  erro é silencioso, porque uma política frouxa não avisa ninguém.

  NÃO é preciso editar nada antes de rodar: o uuid do admin sai do próprio
  banco. Cole o arquivo inteiro e clique em Run.
*/

begin;

do $$
declare
  admin_uuid             uuid;
  ninguem_uuid           constant uuid := '11111111-1111-1111-1111-111111111111';
  medico_id              bigint;
  bairro_teste_id        bigint;
  local_teste_id         bigint;
  local_admin_id         bigint;
  especialidade_teste_id bigint;
  quantos                bigint;
begin
  /*
    O uuid do admin sai do próprio banco, em vez de ser colado à mão.

    A versão anterior trazia um uuid de exemplo com um `-- TROQUE` ao lado, e
    quem colava o arquivo sem ver o aviso batia num 23503 citando
    `perfil_usuario_id_fkey` — mensagem que não diz o que fazer. A linha 47
    roda como dono da tabela e passa por cima da política, então a chave
    estrangeira é a primeira coisa que reclama.

    `ninguem_uuid` continua inventado de propósito: o insert dele, na seção
    "ninguém se promove a admin", é recusado pela POLÍTICA antes de a chave
    estrangeira ser conferida — e é exatamente isso que aquela asserção prova.
  */
  select id into admin_uuid from auth.users order by created_at limit 1;

  if admin_uuid is null then
    raise exception 'Nao existe nenhuma conta em auth.users. Crie a conta de admin primeiro, pelos passos de docs/como-criar-a-conta-do-painel.md.';
  end if;

  /*
    Este arquivo confere as políticas da fatia 2, que só existem depois de
    `0006_painel_vinculos.sql` ser aplicada. Rodado antes dela, o bloco do
    admin falha com 42501 dizendo que a política barrou a escrita — verdade
    literal e inútil, porque o que falta é a política existir. Aconteceu na
    primeira vez que alguém rodou, e custou uma ida e volta.
  */
  select count(*) into quantos
  from pg_policies
  where schemaname = 'public'
    and tablename = 'profissional_especialidade';

  if quantos = 0 then
    raise exception 'A migracao 0006_painel_vinculos.sql ainda nao foi aplicada: nao ha politica nenhuma em profissional_especialidade. Cole a migracao no SQL Editor primeiro, e rode este arquivo depois.';
  end if;

  -- Um médico despublicado, criado dentro da transação para o teste. CRM
  -- gerado, não fixo, para não colidir com a unicidade (crm, crm_uf) de um
  -- registro real e abortar o script inteiro por causa alheia à política.
  insert into profissional (slug, nome, crm, crm_uf, publicado)
  values ('teste-rls-' || gen_random_uuid(), 'Teste RLS',
          '999' || floor(random() * 1000000)::text, 'MA', false)
  returning id into medico_id;

  -- Dentro da transação, e desfeito no rollback. Sem isto, a primeira rodada
  -- depois da migração falharia dizendo que a política do admin está quebrada,
  -- quando o que falta é a linha de perfil.
  insert into perfil_usuario (id, papel) values (admin_uuid, 'admin')
  on conflict (id) do update set papel = 'admin';

  ---------------------------------------------------------------- visitante
  /*
    Limpa a claim antes de virar anônimo. Aqui ela ainda não vazava — nenhum
    `set_config` roda antes deste ponto —, e é exatamente por isso que a linha
    fica: a garantia era da ORDEM das seções, não do código, e mover um bloco
    para cima a desfaria em silêncio. A explicação inteira está na seção
    anônima da fatia 2, mais abaixo.
  */
  perform set_config('request.jwt.claims', '', true);
  set local role anon;

  select count(*) into quantos from profissional where id = medico_id;
  if quantos <> 0 then
    raise exception 'FALHOU: visitante nao ve despublicado';
  end if;

  begin
    update profissional set nome = 'invadido' where id = medico_id;
    if found then raise exception 'FALHOU: visitante nao grava'; end if;
  exception when insufficient_privilege then
    null; -- recusado, que é o esperado
  end;

  reset role;

  ------------------------------------------------- conta sem linha de perfil
  set local role authenticated;
  perform set_config('request.jwt.claims',
    json_build_object('sub', ninguem_uuid, 'role', 'authenticated')::text, true);

  select count(*) into quantos from profissional where id = medico_id;
  if quantos <> 0 then
    raise exception 'FALHOU: conta sem perfil nao ve nada';
  end if;

  begin
    update profissional set nome = 'invadido' where id = medico_id;
    if found then raise exception 'FALHOU: conta sem perfil nao grava'; end if;
  exception when insufficient_privilege then
    null;
  end;

  begin
    insert into perfil_usuario (id, papel) values (ninguem_uuid, 'admin');
    raise exception 'FALHOU: ninguem se promove a admin';
  exception
    when insufficient_privilege then
      null; -- recusado pela politica, que e o esperado
    when foreign_key_violation then
      /*
        A politica DEIXOU passar e so a chave estrangeira barrou. Numa conta
        de verdade nao haveria chave estrangeira para barrar.
      */
      raise exception 'FALHOU: ninguem se promove a admin (a linha passou pela politica)';
  end;

  reset role;

  -------------------------------------------------------------------- admin
  set local role authenticated;
  perform set_config('request.jwt.claims',
    json_build_object('sub', admin_uuid, 'role', 'authenticated')::text, true);

  select count(*) into quantos from profissional where id = medico_id;
  if quantos <> 1 then
    raise exception 'FALHOU: admin ve despublicado';
  end if;

  update profissional set nome = 'Teste RLS alterado' where id = medico_id;
  select count(*) into quantos from profissional
    where id = medico_id and nome = 'Teste RLS alterado';
  if quantos <> 1 then
    raise exception 'FALHOU: admin grava';
  end if;

  begin
    delete from profissional where id = medico_id;
    if found then raise exception 'FALHOU: ninguem apaga'; end if;
  exception when insufficient_privilege then
    null; -- recusado, que é o esperado
  end;

  reset role;

  -- Fatia 2: os vínculos ----------------------------------------------------

  -- Um bairro e um local, criados dentro da transação, pelo mesmo motivo do
  -- médico lá em cima: não depender de nenhuma linha de produção existir. A
  -- diferença é que aqui o id fica numa variável em vez de vir de um SELECT
  -- feito como "ninguém" — aquele papel só enxerga local publicado (a
  -- política leitura_local, de 0002_rls.sql), e um `(select id from local
  -- limit 1)` sob esse papel pode voltar nulo se nenhum local publicado
  -- existir. `atendimento.local_id` é `not null`; um nulo ali levanta
  -- violação de not-null (23502), não `insufficient_privilege` — o script
  -- aborta com um erro alheio à política, em vez de testar a política.
  insert into bairro (nome, slug) values ('Bairro Teste RLS', 'teste-rls-' || gen_random_uuid())
  returning id into bairro_teste_id;

  insert into local (bairro_id, logradouro) values (bairro_teste_id, 'Rua Teste RLS')
  returning id into local_teste_id;

  -- Uma especialidade criada aqui, e não escolhida do catálogo com um
  -- `limit 1`: um catálogo vazio devolveria nulo, `especialidade_id` é
  -- `not null`, e o script abortaria com violação de not-null (23502) — um
  -- erro alheio à política, no lugar de testar a política. Mesmo raciocínio do
  -- bairro e do local acima.
  insert into especialidade (nome, slug)
  values ('Especialidade Teste RLS ' || gen_random_uuid(),
          'teste-rls-' || gen_random_uuid())
  returning id into especialidade_teste_id;

  /*
    As quatro tabelas da fatia, os três papéis.

    A seção é escrita tabela por tabela e papel por papel de propósito: o que
    a spec pede (seção 12) é uma asserção POR TABELA NOVA para cada papel, e a
    versão anterior deste arquivo tinha quatro asserções no total, todas sobre
    `atendimento` e `local`. `profissional_especialidade` — a tabela que ganha
    insert, update E delete, e que guarda o campo mais importante do site —
    não tinha nenhuma. `local_acessibilidade` não tinha nenhuma. E o papel
    `anon` não era exercido em nenhuma.

    Insert que a política recusa levanta `insufficient_privilege`; update e
    delete que a política recusa não levantam nada, filtram as linhas e voltam
    sem `found`. Por isso as duas formas de asserção aqui embaixo.

    As mensagens não se contêm umas às outras como substring: o guarda deste
    arquivo, em painel-migracao.test.ts, procura cada uma por substring exata,
    e uma que contivesse a outra deixaria o guarda cego para a remoção de um
    bloco inteiro.
  */

  ------------------------------------------------- visitante anônimo escreve?
  /*
    LIMPAR A CLAIM ANTES DE VIRAR ANÔNIMO. `reset role` troca o PAPEL, não a
    GUC: `request.jwt.claims` foi plantada lá em cima com `is_local := true`,
    o que a faz valer até o fim da transação inteira, e `auth.uid()` lê a GUC,
    não o papel. Sem esta linha, `eh_admin()` devolve verdadeiro sob `anon`,
    porque a claim do admin ainda está lá.

    E aí os quatro inserts abaixo PASSAM: as políticas de 0006 são
    `with check ((select eh_admin()))` sem cláusula `to`, valem para todo
    papel, e o `anon` do Supabase tem GRANT de insert por padrão — nenhuma
    migração o revoga. O primeiro `raise exception 'FALHOU: ... anon insere'`
    abortaria o arquivo, e quem rodasse iria caçar um defeito de política que
    não existe: numa requisição anônima de verdade não há claim nenhuma.
  */
  perform set_config('request.jwt.claims', '', true);
  set local role anon;

  begin
    insert into profissional_especialidade (profissional_id, especialidade_id)
      values (medico_id, especialidade_teste_id);
    raise exception 'FALHOU: vinculo de especialidade: anon insere';
  exception when insufficient_privilege then
    null; -- recusado, que é o esperado
  end;

  begin
    insert into atendimento (profissional_id, local_id) values (medico_id, local_teste_id);
    raise exception 'FALHOU: atendimento: anon insere';
  exception when insufficient_privilege then
    null;
  end;

  begin
    insert into local (bairro_id, logradouro) values (bairro_teste_id, 'Rua do Anon');
    raise exception 'FALHOU: local: anon insere';
  exception when insufficient_privilege then
    null;
  end;

  begin
    insert into local_acessibilidade (local_id, recurso) values (local_teste_id, 'elevador');
    raise exception 'FALHOU: acessibilidade: anon insere';
  exception when insufficient_privilege then
    null;
  end;

  reset role;

  --------------------------------------------- conta sem linha de perfil escreve?
  set local role authenticated;
  perform set_config('request.jwt.claims',
    json_build_object('sub', ninguem_uuid, 'role', 'authenticated')::text, true);

  begin
    insert into profissional_especialidade (profissional_id, especialidade_id)
      values (medico_id, especialidade_teste_id);
    raise exception 'FALHOU: vinculo de especialidade: conta sem perfil insere';
  exception when insufficient_privilege then
    null;
  end;

  begin
    insert into atendimento (profissional_id, local_id) values (medico_id, local_teste_id);
    raise exception 'FALHOU: atendimento: conta sem perfil insere';
  exception when insufficient_privilege then
    null;
  end;

  begin
    insert into local (bairro_id, logradouro) values (bairro_teste_id, 'Rua de Ninguem');
    raise exception 'FALHOU: local: conta sem perfil insere';
  exception when insufficient_privilege then
    null;
  end;

  begin
    insert into local_acessibilidade (local_id, recurso) values (local_teste_id, 'elevador');
    raise exception 'FALHOU: acessibilidade: conta sem perfil insere';
  exception when insufficient_privilege then
    null;
  end;

  ------------------------------------------------------------- admin escreve
  perform set_config('request.jwt.claims',
    json_build_object('sub', admin_uuid, 'role', 'authenticated')::text, true);

  -- profissional_especialidade: insert, update e delete
  insert into profissional_especialidade (profissional_id, especialidade_id, principal)
    values (medico_id, especialidade_teste_id, true);

  select count(*) into quantos from profissional_especialidade
    where profissional_id = medico_id and especialidade_id = especialidade_teste_id;
  if quantos <> 1 then
    raise exception 'FALHOU: vinculo de especialidade: admin insere';
  end if;

  update profissional_especialidade set rqe = '12345'
    where profissional_id = medico_id and especialidade_id = especialidade_teste_id;
  select count(*) into quantos from profissional_especialidade
    where profissional_id = medico_id and especialidade_id = especialidade_teste_id
      and rqe = '12345';
  if quantos <> 1 then
    raise exception 'FALHOU: vinculo de especialidade: admin altera';
  end if;

  delete from profissional_especialidade
    where profissional_id = medico_id and especialidade_id = especialidade_teste_id;
  if not found then
    raise exception 'FALHOU: vinculo de especialidade: admin remove';
  end if;

  -- atendimento: insert e delete (a tabela não tem o que alterar)
  insert into atendimento (profissional_id, local_id) values (medico_id, local_teste_id);

  select count(*) into quantos from atendimento where profissional_id = medico_id;
  if quantos <> 1 then
    raise exception 'FALHOU: atendimento: admin insere';
  end if;

  delete from atendimento where profissional_id = medico_id;
  if not found then
    raise exception 'FALHOU: atendimento: admin remove';
  end if;

  -- local: insert e update, nunca delete
  insert into local (bairro_id, logradouro) values (bairro_teste_id, 'Rua do Admin RLS')
  returning id into local_admin_id;

  select count(*) into quantos from local where id = local_admin_id;
  if quantos <> 1 then
    raise exception 'FALHOU: local: admin insere';
  end if;

  update local set logradouro = 'Rua do Admin RLS alterada' where id = local_admin_id;
  select count(*) into quantos from local
    where id = local_admin_id and logradouro = 'Rua do Admin RLS alterada';
  if quantos <> 1 then
    raise exception 'FALHOU: local: admin altera';
  end if;

  begin
    delete from local where id = local_teste_id;
    -- A mensagem não repete a substring "ninguem apaga" da seção do admin lá
    -- em cima: o guarda deste arquivo em painel-migracao.test.ts procura essa
    -- substring exata, e as duas mensagens colidindo deixava o guarda cego
    -- para a remoção deste bloco inteiro.
    if found then raise exception 'FALHOU: local nao pode ser apagado'; end if;
  exception when insufficient_privilege then
    null; -- recusado, que é o esperado
  end;

  -- local_acessibilidade: insert e delete
  insert into local_acessibilidade (local_id, recurso) values (local_teste_id, 'elevador');

  select count(*) into quantos from local_acessibilidade
    where local_id = local_teste_id and recurso = 'elevador';
  if quantos <> 1 then
    raise exception 'FALHOU: acessibilidade: admin insere';
  end if;

  delete from local_acessibilidade
    where local_id = local_teste_id and recurso = 'elevador';
  if not found then
    raise exception 'FALHOU: acessibilidade: admin remove';
  end if;

  reset role;

  raise notice 'TODAS AS ASSERCOES PASSARAM';
end $$;

rollback;

-- O `raise notice` acima só aparece em psql; o editor SQL do Supabase exibe
-- linhas de resultado e descarta avisos. Esta linha final é a mesma notícia
-- num formato que aquela tela mostra. Ela só roda se nada antes levantou
-- exceção, porque a primeira exceção aborta o script inteiro.
select 'TODAS AS ASSERCOES PASSARAM' as resultado;
