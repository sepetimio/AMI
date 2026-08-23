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

  ANTES DE RODAR: troque o uuid abaixo pelo id da sua conta de admin, que sai
  de `select id, email from auth.users;`.
*/

begin;

do $$
declare
  admin_uuid      constant uuid := '00000000-0000-0000-0000-000000000000'; -- TROQUE
  ninguem_uuid    constant uuid := '11111111-1111-1111-1111-111111111111';
  medico_id       bigint;
  bairro_teste_id bigint;
  local_teste_id  bigint;
  quantos         bigint;
begin
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

  set local role authenticated;
  perform set_config('request.jwt.claims',
    json_build_object('sub', ninguem_uuid, 'role', 'authenticated')::text, true);

  begin
    insert into atendimento (profissional_id, local_id)
      values (medico_id, local_teste_id);
    raise exception 'FALHOU: conta sem perfil cria atendimento';
  exception when insufficient_privilege then
    null; -- recusado, que é o esperado
  end;

  perform set_config('request.jwt.claims',
    json_build_object('sub', admin_uuid, 'role', 'authenticated')::text, true);

  insert into atendimento (profissional_id, local_id)
    values (medico_id, local_teste_id);

  select count(*) into quantos from atendimento where profissional_id = medico_id;
  if quantos <> 1 then
    raise exception 'FALHOU: admin cria atendimento';
  end if;

  delete from atendimento where profissional_id = medico_id;
  if not found then
    raise exception 'FALHOU: admin remove atendimento';
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

  reset role;

  raise notice 'TODAS AS ASSERCOES PASSARAM';
end $$;

rollback;

-- O `raise notice` acima só aparece em psql; o editor SQL do Supabase exibe
-- linhas de resultado e descarta avisos. Esta linha final é a mesma notícia
-- num formato que aquela tela mostra. Ela só roda se nada antes levantou
-- exceção, porque a primeira exceção aborta o script inteiro.
select 'TODAS AS ASSERCOES PASSARAM' as resultado;
