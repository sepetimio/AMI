/*
  Asserções das políticas do painel.

  Cole no editor SQL do Supabase e rode. Não altera nada: tudo acontece dentro
  de uma transação que termina em rollback. Se qualquer asserção falhar, o
  Postgres levanta exceção com a mensagem correspondente.

  Por que este arquivo existe: os testes automáticos deste projeto rodam em
  memória, sem banco, e política de banco é a parte mais fácil de errar — e o
  erro é silencioso, porque uma política frouxa não avisa ninguém.

  ANTES DE RODAR: troque o uuid abaixo pelo id da sua conta de admin, que sai
  de `select id, email from auth.users;`.
*/

begin;

do $$
declare
  admin_uuid   constant uuid := '00000000-0000-0000-0000-000000000000'; -- TROQUE
  ninguem_uuid constant uuid := '11111111-1111-1111-1111-111111111111';
  medico_id    bigint;
  quantos      bigint;
begin
  -- Um médico despublicado, criado dentro da transação para o teste.
  insert into profissional (slug, nome, crm, crm_uf, publicado)
  values ('teste-rls-' || gen_random_uuid(), 'Teste RLS', '999999', 'MA', false)
  returning id into medico_id;

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

  raise notice 'TODAS AS ASSERCOES PASSARAM';
end $$;

rollback;
