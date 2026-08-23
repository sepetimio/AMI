"use server";

import { revalidatePath } from "next/cache";
import { validarRqe } from "@/lib/painel/especialidades";
import { clienteDoPainel } from "@/lib/painel/servidor";
import { exigirAdmin } from "@/lib/painel/sessao";

export type EstadoDaEspecialidade = { erros: Record<string, string>; salvo: boolean };

/*
  As três ações deste arquivo compartilham uma exigência: pedir as linhas
  afetadas de volta e falhar alto quando não vem nenhuma. O PostgREST filtra a
  linha que a política não admite em vez de recusar a chamada, então sem isso a
  tela mostra um estado que o banco não tem — foi o defeito de 23/08/2026, em
  `alternarPublicacao`, corrigido em 003dda2.

  `invalidar` fica declarada no fim do arquivo, não aqui: é `function`
  (hoisted, então a posição não muda o comportamento), e a varredura confere
  que a conferência de `if (!data)` vem, no texto, antes de qualquer
  `revalidatePath(`. Com a declaração aqui em cima, a própria definição do
  helper apareceria antes do primeiro `if (!data)` e reprovaria a varredura
  por um motivo que não é o que ela quer pegar.
*/

/*
  Salvar os RQEs e a principal, de uma vez.

  A principal chega como um único valor (`principal`), não como uma caixa por
  linha: é botão de escolha única na tela, e o formato do dado é o que garante
  que só uma seja marcada. A regra não depende de o navegador se comportar.
*/
export async function salvarEspecialidades(
  _anterior: EstadoDaEspecialidade,
  dados: FormData,
): Promise<EstadoDaEspecialidade> {
  await exigirAdmin();

  const medicoId = Number(dados.get("medicoId"));
  if (!Number.isInteger(medicoId) || medicoId <= 0) {
    return { erros: { geral: "Identificador de médico inválido." }, salvo: false };
  }

  const principal = Number(dados.get("principal"));

  const linhas: { especialidadeId: number; rqe: string | null }[] = [];
  const erros: Record<string, string> = {};

  for (const [chave, valor] of dados.entries()) {
    if (!chave.startsWith("rqe-")) continue;

    const especialidadeId = Number(chave.slice("rqe-".length));
    if (!Number.isInteger(especialidadeId) || especialidadeId <= 0) continue;

    const v = validarRqe(String(valor));
    if (!v.ok) {
      erros[chave] = v.erro;
      continue;
    }

    linhas.push({ especialidadeId, rqe: v.valor });
  }

  if (Object.keys(erros).length) return { erros, salvo: false };

  const cliente = await clienteDoPainel();

  /*
    Uma chamada por linha, não uma só. O PostgREST não abre transação entre
    requisições, então o ganho de agrupar seria aparente: se a terceira falhar,
    as duas primeiras já gravaram de qualquer forma. Com uma por linha o erro
    diz qual linha, que é o que quem preenche precisa saber.
  */
  for (const linha of linhas) {
    const { data, error } = await cliente
      .from("profissional_especialidade")
      .update({ rqe: linha.rqe, principal: linha.especialidadeId === principal })
      .eq("profissional_id", medicoId)
      .eq("especialidade_id", linha.especialidadeId)
      .select("especialidade_id")
      .maybeSingle();

    if (error) {
      return { erros: { geral: `Não consegui salvar: ${error.message}` }, salvo: false };
    }

    if (!data) {
      return {
        erros: {
          geral:
            "A alteração não foi gravada: o banco não admitiu a escrita. " +
            "Costuma ser sessão expirada — saia e entre de novo.",
        },
        salvo: false,
      };
    }
  }

  invalidar();
  return { erros: {}, salvo: true };
}

export async function acrescentarEspecialidade(dados: FormData): Promise<void> {
  await exigirAdmin();

  const medicoId = Number(dados.get("medicoId"));
  const especialidadeId = Number(dados.get("especialidadeId"));
  const ehAPrimeira = dados.get("ehAPrimeira") === "true";

  if (!Number.isInteger(medicoId) || medicoId <= 0) {
    throw new Error("Identificador de médico inválido.");
  }
  if (!Number.isInteger(especialidadeId) || especialidadeId <= 0) {
    throw new Error("Escolha uma especialidade da lista.");
  }

  const cliente = await clienteDoPainel();
  const { data, error } = await cliente
    .from("profissional_especialidade")
    /*
      A primeira especialidade de um médico nasce principal. Sem isto ele
      ficaria com nenhuma marcada, e a página do site cairia no desempate
      "ou a primeira" — que depende da ordem que o banco devolver.
    */
    .insert({
      profissional_id: medicoId,
      especialidade_id: especialidadeId,
      principal: ehAPrimeira,
      rqe: null,
    })
    .select("especialidade_id")
    .maybeSingle();

  if (error) {
    if (error.code === "23505") {
      throw new Error("Este médico já tem essa especialidade.");
    }
    throw new Error(`Não consegui acrescentar: ${error.message}`);
  }

  if (!data) {
    throw new Error(
      "A especialidade não foi gravada: o banco não admitiu a escrita. " +
        "Costuma ser sessão expirada — saia e entre de novo.",
    );
  }

  invalidar();
}

export async function removerEspecialidade(dados: FormData): Promise<void> {
  await exigirAdmin();

  const medicoId = Number(dados.get("medicoId"));
  const especialidadeId = Number(dados.get("especialidadeId"));

  if (!Number.isInteger(medicoId) || medicoId <= 0) {
    throw new Error("Identificador de médico inválido.");
  }
  if (!Number.isInteger(especialidadeId) || especialidadeId <= 0) {
    throw new Error("Identificador de especialidade inválido.");
  }

  const cliente = await clienteDoPainel();
  const { data, error } = await cliente
    .from("profissional_especialidade")
    .delete()
    .eq("profissional_id", medicoId)
    .eq("especialidade_id", especialidadeId)
    .select("especialidade_id")
    .maybeSingle();

  if (error) throw new Error(`Não consegui remover: ${error.message}`);

  if (!data) {
    throw new Error(
      "Nada foi removido: ou o vínculo já não existia, ou o banco não admitiu. " +
        "Recarregue a página.",
    );
  }

  invalidar();
}

function invalidar(): void {
  revalidatePath("/(site)", "layout");
  revalidatePath("/sitemap.xml");
  revalidatePath("/painel");
}
