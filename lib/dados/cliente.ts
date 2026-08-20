import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/*
  Único ponto do projeto que fala com o Supabase.

  Usa a chave anônima de propósito: com ela, as políticas RLS do banco valem,
  e o visitante só enxerga o que está publicado. Uma chave de serviço aqui
  ignoraria a RLS e transformaria qualquer descuido de consulta em vazamento.

  `persistSession: false` porque isto roda no servidor, sem navegador para
  guardar sessão — e o projeto não usa localStorage nem sessionStorage.
*/
export function clienteServidor(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const chave = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !chave) {
    throw new Error(
      "Faltam NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY. " +
        "Copie .env.example para .env.local e preencha com as chaves do projeto.",
    );
  }

  return createClient(url, chave, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
