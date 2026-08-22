import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { SupabaseClient } from "@supabase/supabase-js";

/*
  O cliente do painel: mesma chave pública do site, mais a sessão da pessoa.

  É a sessão que dá poder de escrita, não a chave. Com isso as políticas do
  banco valem para tudo que o painel faz, e a tela não consegue gravar nada
  que o Postgres recusaria. `lib/dados/cliente.ts` continua intacto para o
  site público, e nenhuma chave privilegiada existe neste lado do projeto.
*/
export async function clienteDoPainel(): Promise<SupabaseClient> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const chave = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !chave) {
    throw new Error(
      "Faltam NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY. " +
        "Copie .env.local.exemplo para .env.local e preencha.",
    );
  }

  const armazem = await cookies();

  return createServerClient(url, chave, {
    cookies: {
      getAll: () => armazem.getAll(),
      setAll: (paraGravar) => {
        try {
          for (const { name, value, options } of paraGravar) {
            armazem.set(name, value, options);
          }
        } catch (erro) {
          /*
            Componente de servidor não pode gravar cookie, e tentar levanta.
            Ignorar é correto aqui: o `proxy.ts` já renovou a sessão antes de
            esta renderização começar, e é ele quem grava.

            Em ação de servidor, porém, gravar funciona — e ali uma falha de
            verdade seria engolida junto. Fora de produção ela aparece, para
            não virar um token perdido em silêncio.
          */
          if (process.env.NODE_ENV !== "production") {
            console.warn("Não consegui gravar o cookie de sessão:", erro);
          }
        }
      },
    },
  });
}
