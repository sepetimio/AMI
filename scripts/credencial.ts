import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { createInterface } from "node:readline/promises";

/*
  A credencial privilegiada do importador.

  Este arquivo é o ÚNICO ponto do projeto que lê esta variável, e mora em
  `scripts/`, fora do aplicativo Next — nada que o Next empacota alcança
  daqui. `lib/dados/cliente.ts` continua com a chave pública e não é tocado.

  A chave é uma chave secreta DEDICADA do Supabase (`sb_secret_...`), criada
  no painel com o nome `importador`, e não a `service_role`. A `service_role`
  é a chave-mestra do projeto e não tem revogação isolada; uma chave dedicada
  é revogada sozinha, e o site nem pisca, porque ele nunca a usou.
*/

export const NOME_DA_VARIAVEL = "SUPABASE_CHAVE_IMPORTADOR";

/**
 * Lê a chave do ambiente. Devolve nulo quando não há, para o comando
 * perguntar em vez de estourar.
 *
 * Recusa a chave pública explicitamente: com ela a RLS vale, toda escrita é
 * negada, e o erro que aparece é do PostgREST — que não diz "você usou a
 * chave errada". Falhar aqui, com o motivo, poupa a investigação.
 */
export function chaveDoAmbiente(ambiente: Partial<NodeJS.ProcessEnv>): string | null {
  const bruta = (ambiente[NOME_DA_VARIAVEL] ?? "").trim();
  if (!bruta) return null;

  if (bruta.startsWith("sb_publishable_") || bruta.includes("anon")) {
    throw new Error(
      `${NOME_DA_VARIAVEL} está com a chave pública. O importador precisa da ` +
        "chave secreta dedicada (sb_secret_...), criada no painel do Supabase " +
        'em Project Settings, API Keys, com o nome "importador".',
    );
  }

  return bruta;
}

/** Do ambiente, ou perguntada na hora — sem gravar em lugar nenhum. */
export async function obterChave(): Promise<string> {
  const doAmbiente = chaveDoAmbiente(process.env);
  if (doAmbiente) return doAmbiente;

  const leitor = createInterface({ input: process.stdin, output: process.stdout });
  try {
    const digitada = (
      await leitor.question(
        `${NOME_DA_VARIAVEL} não está definida.\n` +
          "Cole a chave secreta do importador (nada será gravado): ",
      )
    ).trim();

    if (!digitada) throw new Error("Nenhuma chave informada.");
    return digitada;
  } finally {
    leitor.close();
  }
}

export async function clientePrivilegiado(): Promise<SupabaseClient> {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim();
  if (!url) {
    throw new Error(
      "Falta NEXT_PUBLIC_SUPABASE_URL. Copie .env.local.exemplo para .env.local.",
    );
  }

  return createClient(url, await obterChave(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
