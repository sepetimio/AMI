import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { createInterface } from "node:readline";

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

/*
  Uma validação só, usada pelas duas origens da chave.

  As três recusas existem para trocar um erro opaco por um erro que diz o que
  fazer. Com a chave pública, a RLS vale e toda escrita é negada — o erro que
  aparece é do PostgREST, e ele não diz "você usou a chave errada".

  A recusa de JWT (`eyJ`) faz valer uma regra da spec que não tinha guarda: as
  chaves antigas do Supabase são JWT, e as duas são inadequadas aqui. A `anon`
  não escreve. A `service_role` escreve demais: é a chave-mestra do projeto e
  não tem revogação isolada, então um vazamento dela obriga a mexer no site
  inteiro, em vez de revogar uma chave que o site nunca usou.
*/
function validar(bruta: string): string {
  const chave = bruta.trim();

  if (chave.startsWith("sb_publishable_") || chave.includes("anon")) {
    throw new Error(
      `${NOME_DA_VARIAVEL} está com a chave pública. O importador precisa da ` +
        "chave secreta dedicada (sb_secret_...), criada no painel do Supabase " +
        'em Project Settings, API Keys, com o nome "importador".',
    );
  }

  if (chave.startsWith("eyJ")) {
    throw new Error(
      `${NOME_DA_VARIAVEL} está com uma chave antiga, em formato JWT. Nem a ` +
        "`anon` nem a `service_role` servem aqui: a primeira não escreve, e a " +
        "segunda é a chave-mestra do projeto e não pode ser revogada sozinha. " +
        'Crie uma chave secreta dedicada (sb_secret_...) com o nome "importador".',
    );
  }

  return chave;
}

/**
 * Lê a chave do ambiente. Devolve nulo quando não há, para o comando
 * perguntar em vez de estourar.
 */
export function chaveDoAmbiente(ambiente: Partial<NodeJS.ProcessEnv>): string | null {
  const bruta = (ambiente[NOME_DA_VARIAVEL] ?? "").trim();
  if (!bruta) return null;
  return validar(bruta);
}

/** Do ambiente, ou perguntada na hora — sem ecoar e sem gravar em lugar nenhum. */
export async function obterChave(): Promise<string> {
  const doAmbiente = chaveDoAmbiente(process.env);
  if (doAmbiente) return doAmbiente;

  const leitor = createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true,
  });

  /*
    `readline` ecoa o que é digitado, e chave secreta não pode ficar no
    histórico do terminal nem aparecer numa gravação de tela.

    `_writeToOutput` é interno do Node e é o único ponto de silenciamento que
    ele oferece — e só existe em `node:readline` (a interface de callback).
    O irmão `node:readline/promises`, que devolveria `question` já como
    Promise, NÃO define esse método (medido nesta versão do Node): usá-lo
    faria este código cair sempre no "falhar fechado" abaixo, mesmo com o
    terminal presente, e a pergunta nunca funcionaria. Por isso o import é o
    `readline` clássico, com `question` promisificado à mão.

    Se `_writeToOutput` sumir de aqui também, este código NÃO volta a ecoar:
    ele recusa perguntar e manda usar a variável de ambiente. Falhar fechado
    é o único jeito seguro de errar aqui.
  */
  const interno = leitor as unknown as { _writeToOutput?: (s: string) => void };
  const escreverOriginal = interno._writeToOutput;

  if (typeof escreverOriginal !== "function") {
    leitor.close();
    throw new Error(
      "Não consegui esconder o que você digitaria, e não vou pedir a chave " +
        `com ela aparecendo na tela. Defina ${NOME_DA_VARIAVEL} em .env.local ` +
        "e rode de novo.",
    );
  }

  let mudo = false;
  interno._writeToOutput = (s: string) => {
    if (!mudo) escreverOriginal.call(leitor, s);
  };

  try {
    const promessa = new Promise<string>((resolve) => {
      leitor.question(
        `${NOME_DA_VARIAVEL} não está definida.\n` +
          "Cole a chave secreta do importador. Nada será gravado, e nada aparece na tela: ",
        resolve,
      );
    });

    /* A pergunta já foi escrita; daqui em diante o eco é do que for digitado. */
    mudo = true;
    const digitada = await promessa;
    mudo = false;
    process.stdout.write("\n");

    if (!digitada.trim()) throw new Error("Nenhuma chave informada.");
    return validar(digitada);
  } finally {
    interno._writeToOutput = escreverOriginal;
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
