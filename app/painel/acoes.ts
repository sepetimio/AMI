"use server";

import { revalidatePath } from "next/cache";
import { clienteDoPainel } from "@/lib/painel/servidor";
import { exigirAdmin } from "@/lib/painel/sessao";

/*
  Pôr no ar e tirar do ar.

  Despublicar é `publicado = false`, nunca remoção — e não existe política de
  remoção no banco, então nem haveria como. O dado fica.

  `exigirAdmin()` antes de gravar é a primeira tranca; a política do Postgres
  é a última. As duas existem porque a de cima é a que dá mensagem decente, e
  a de baixo é a que não tem como ser esquecida.
*/
export async function alternarPublicacao(dados: FormData): Promise<void> {
  await exigirAdmin();

  const id = Number(dados.get("id"));
  const publicado = dados.get("publicado") === "true";

  if (!Number.isInteger(id) || id <= 0) {
    throw new Error("Identificador de médico inválido.");
  }

  const cliente = await clienteDoPainel();
  /*
    `.select()` depois do `.update()` não é enfeite: sem ele não dá para saber
    se alguma linha mudou. Quando a política do Postgres não admite a linha, o
    PostgREST a FILTRA em vez de recusar a chamada — zero linhas alteradas,
    `error` nulo. Sem a conferência abaixo isto aqui declarava sucesso, a tela
    revalidava e mostrava o estado novo, e o banco seguia com o antigo. Foi
    exatamente o que aconteceu em 23/08/2026, na primeira vez que o painel
    rodou contra o banco de verdade.
  */
  const { data, error } = await cliente
    .from("profissional")
    .update({ publicado, atualizado_em: new Date().toISOString() })
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error) throw new Error(`Não consegui alterar a publicação: ${error.message}`);

  if (!data) {
    throw new Error(
      "A alteração não foi gravada: o banco não admitiu a escrita nesta linha. " +
        "Costuma ser sessão expirada — saia e entre de novo.",
    );
  }

  /*
    O site público é gerado estaticamente e revalida de hora em hora. Um
    médico entrando no ar mexe na home, no índice, na página da especialidade,
    na do bairro, no perfil e no sitemap — listar as seis à mão é lista para
    ficar desatualizada, e isto aqui acontece algumas vezes por dia.

    Isto NÃO levanta a trava de indexação: enquanto
    NEXT_PUBLIC_DADOS_DEMONSTRACAO for true, o robots.txt segue bloqueando o
    site inteiro para buscadores.
  */
  revalidatePath("/(site)", "layout");
  /*
    O sitemap fica em `app/sitemap.ts`, na raiz, FORA do grupo `(site)` — a
    invalidação do layout acima não o alcança, e ele lista os médicos
    publicados um por linha. Medido, não suposto.
  */
  revalidatePath("/sitemap.xml");
  revalidatePath("/painel");
}
