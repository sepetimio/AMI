-- As fotos dos médicos.
--
-- Um bucket público: qualquer visitante vê a foto, como vê o nome e o CRM.
-- Escrita, só admin, e só inserção. Sem política de leitura em
-- storage.objects (o bucket público já serve o arquivo pela URL pública),
-- sem alteração e sem remoção: trocar de foto grava um arquivo novo, e
-- remover a foto do perfil só limpa profissional.foto. Mesma regra do resto
-- do banco: nada se apaga por engano.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('fotos-medicos', 'fotos-medicos', true, 1048576, array['image/webp', 'image/jpeg'])
on conflict (id) do nothing;

drop policy if exists admin_envia_foto on storage.objects;

create policy admin_envia_foto on storage.objects
  for insert to authenticated
  with check (bucket_id = 'fotos-medicos' and (select public.eh_admin()));
