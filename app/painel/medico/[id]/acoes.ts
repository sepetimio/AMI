"use server";

import { revalidatePath } from "next/cache";
import { validarMedico } from "@/lib/painel/medico";
import { clienteDoPainel } from "@/lib/painel/servidor";
import { exigirAdmin } from "@/lib/painel/sessao";

export type EstadoDaEdicao = { erros: Record<string, string>; salvo: boolean };

/*
  Salvar os campos do médico.

  A validação roda AQUI, não só no navegador: `required` no HTML é conforto
  para quem preenche, não garantia — qualquer requisição montada à mão passa
  por cima dele.

  O `slug` não aparece em lugar nenhum desta função, e é deliberado: o
  endereço do perfil é uma URL que o Google indexou, e recalculá-la a apaga.
  Mesma regra que o importador respeita.
*/
export async function salvarMedico(
  _anterior: EstadoDaEdicao,
  dados: FormData,
): Promise<EstadoDaEdicao> {
  await exigirAdmin();

  const id = Number(dados.get("id"));
  if (!Number.isInteger(id) || id <= 0) {
    return { erros: { geral: "Identificador de médico inválido." }, salvo: false };
  }

  const validacao = validarMedico({
    nome: String(dados.get("nome") ?? ""),
    crm: String(dados.get("crm") ?? ""),
    crmUf: String(dados.get("crmUf") ?? ""),
    telemedicina: dados.get("telemedicina") === "on",
    situacao: String(dados.get("situacao") ?? "ativo"),
    bio: String(dados.get("bio") ?? ""),
    verificadoEm: String(dados.get("verificadoEm") ?? ""),
  });

  if (!validacao.ok) {
    return { erros: validacao.erros as Record<string, string>, salvo: false };
  }

  const cliente = await clienteDoPainel();
  const { error } = await cliente
    .from("profissional")
    .update({ ...validacao.valor, atualizado_em: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    /* A restrição de unicidade de (crm, crm_uf) é a que mais dispara aqui. */
    return {
      erros: { geral: `Não consegui salvar: ${error.message}` },
      salvo: false,
    };
  }

  revalidatePath("/(site)", "layout");
  /*
    O sitemap fica em `app/sitemap.ts`, na raiz, FORA do grupo `(site)` — a
    invalidação do layout acima não o alcança, e ele lista os médicos
    publicados um por linha. Medido, não suposto.
  */
  revalidatePath("/sitemap.xml");
  revalidatePath("/painel");

  return { erros: {}, salvo: true };
}
