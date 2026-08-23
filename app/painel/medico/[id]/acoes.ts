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
    associadoAmi: dados.get("associadoAmi") === "on",
    situacao: String(dados.get("situacao") ?? "ativo"),
    bio: String(dados.get("bio") ?? ""),
    verificadoEm: String(dados.get("verificadoEm") ?? ""),
  });

  if (!validacao.ok) {
    return { erros: validacao.erros as Record<string, string>, salvo: false };
  }

  const cliente = await clienteDoPainel();
  const { data, error } = await cliente
    .from("profissional")
    .update({ ...validacao.valor, atualizado_em: new Date().toISOString() })
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error) {
    /*
      23505 é violação de unicidade, e nesta tabela só existe uma que a tela
      alcança: (crm, crm_uf). É o erro mais provável daqui, e a mensagem crua
      vem em inglês citando o nome interno da restrição — no campo errado.
    */
    if (error.code === "23505") {
      return {
        erros: {
          crm: `Já existe um médico com o CRM ${validacao.valor.crm} em ${validacao.valor.crm_uf}.`,
        },
        salvo: false,
      };
    }

    return { erros: { geral: `Não consegui salvar: ${error.message}` }, salvo: false };
  }

  if (!data) {
    /*
      Zero linhas e nenhum erro. O PostgREST filtra o que a política não deixa
      ver em vez de recusar, então este é o caminho do banco dizendo não — ou
      de a linha ter sumido entre carregar a tela e salvar. Sem o `select`,
      isso voltaria como "Salvo.".
    */
    return {
      erros: { geral: "Não encontrei este médico para salvar. Recarregue a página." },
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
