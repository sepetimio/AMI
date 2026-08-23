"use server";

import { revalidatePath } from "next/cache";
import { bairros, validarLocal } from "@/lib/painel/locais";
import { clienteDoPainel } from "@/lib/painel/servidor";
import { exigirAdmin } from "@/lib/painel/sessao";

export type EstadoDoLocal = { erros: Record<string, string>; salvo: boolean };

function invalidar(): void {
  revalidatePath("/(site)", "layout");
  revalidatePath("/sitemap.xml");
  revalidatePath("/painel");
}

function lerCampos(dados: FormData) {
  return {
    logradouro: String(dados.get("logradouro") ?? ""),
    numero: String(dados.get("numero") ?? ""),
    complemento: String(dados.get("complemento") ?? ""),
    bairroId: String(dados.get("bairroId") ?? ""),
    cep: String(dados.get("cep") ?? ""),
    telefone: String(dados.get("telefone") ?? ""),
    whatsapp: String(dados.get("whatsapp") ?? ""),
    estacionamento: dados.get("estacionamento") === "on",
  };
}

const NAO_ADMITIU =
  "A alteração não foi gravada: o banco não admitiu a escrita. " +
  "Costuma ser sessão expirada — saia e entre de novo.";

/*
  Criar um consultório novo E ligar o médico a ele.

  São duas gravações em tabelas diferentes, e o PostgREST não abre transação
  entre requisições: se a segunda falhar, a primeira já gravou. O estrago
  possível é um endereço órfão, que não aparece em lugar nenhum do site — muito
  mais barato que a alternativa, que seria remover o endereço para "desfazer" e
  arriscar apagar um que outro médico passou a usar.
*/
export async function criarLocal(
  _anterior: EstadoDoLocal,
  dados: FormData,
): Promise<EstadoDoLocal> {
  await exigirAdmin();

  const medicoId = Number(dados.get("medicoId"));
  if (!Number.isInteger(medicoId) || medicoId <= 0) {
    return { erros: { geral: "Identificador de médico inválido." }, salvo: false };
  }

  const cliente = await clienteDoPainel();
  const lista = await bairros(cliente);
  const validacao = validarLocal(lerCampos(dados), lista.map((b) => b.id));

  if (!validacao.ok) {
    return { erros: validacao.erros as Record<string, string>, salvo: false };
  }

  const criado = await cliente
    .from("local")
    .insert(validacao.valor)
    .select("id")
    .maybeSingle();

  if (criado.error) {
    return { erros: { geral: `Não consegui criar: ${criado.error.message}` }, salvo: false };
  }
  if (!criado.data) return { erros: { geral: NAO_ADMITIU }, salvo: false };

  const ligado = await cliente
    .from("atendimento")
    .insert({ profissional_id: medicoId, local_id: criado.data.id })
    .select("id")
    .maybeSingle();

  if (ligado.error) {
    return {
      erros: {
        geral:
          `O endereço foi criado, mas não consegui ligar o médico a ele: ` +
          `${ligado.error.message}. Use "buscar existente" para ligar.`,
      },
      salvo: false,
    };
  }
  if (!ligado.data) return { erros: { geral: NAO_ADMITIU }, salvo: false };

  invalidar();
  return { erros: {}, salvo: true };
}

/*
  Corrigir um consultório existente.

  Corrige para TODOS os médicos que atendem nele — é o ganho de compartilhar, e
  a tela avisa antes quando `quantosMedicos` é maior que um.
*/
export async function salvarLocal(
  _anterior: EstadoDoLocal,
  dados: FormData,
): Promise<EstadoDoLocal> {
  await exigirAdmin();

  const localId = Number(dados.get("localId"));
  if (!Number.isInteger(localId) || localId <= 0) {
    return { erros: { geral: "Identificador de consultório inválido." }, salvo: false };
  }

  const cliente = await clienteDoPainel();
  const lista = await bairros(cliente);
  const validacao = validarLocal(lerCampos(dados), lista.map((b) => b.id));

  if (!validacao.ok) {
    return { erros: validacao.erros as Record<string, string>, salvo: false };
  }

  const { data, error } = await cliente
    .from("local")
    .update(validacao.valor)
    .eq("id", localId)
    .select("id")
    .maybeSingle();

  if (error) {
    return { erros: { geral: `Não consegui salvar: ${error.message}` }, salvo: false };
  }
  if (!data) return { erros: { geral: NAO_ADMITIU }, salvo: false };

  invalidar();
  return { erros: {}, salvo: true };
}

export async function ligarLocalExistente(dados: FormData): Promise<void> {
  await exigirAdmin();

  const medicoId = Number(dados.get("medicoId"));
  const localId = Number(dados.get("localId"));

  if (!Number.isInteger(medicoId) || medicoId <= 0) {
    throw new Error("Identificador de médico inválido.");
  }
  if (!Number.isInteger(localId) || localId <= 0) {
    throw new Error("Escolha um consultório da lista.");
  }

  const cliente = await clienteDoPainel();
  const { data, error } = await cliente
    .from("atendimento")
    .insert({ profissional_id: medicoId, local_id: localId })
    .select("id")
    .maybeSingle();

  if (error) {
    if (error.code === "23505") {
      throw new Error("Este médico já atende neste consultório.");
    }
    throw new Error(`Não consegui ligar: ${error.message}`);
  }
  if (!data) throw new Error(NAO_ADMITIU);

  invalidar();
}

/*
  Tirar o médico do consultório.

  Remove a LIGAÇÃO, não o consultório. O endereço continua existindo, com os
  outros médicos que atendem nele.
*/
export async function desligarLocal(dados: FormData): Promise<void> {
  await exigirAdmin();

  const medicoId = Number(dados.get("medicoId"));
  const localId = Number(dados.get("localId"));

  if (!Number.isInteger(medicoId) || medicoId <= 0) {
    throw new Error("Identificador de médico inválido.");
  }
  if (!Number.isInteger(localId) || localId <= 0) {
    throw new Error("Identificador de consultório inválido.");
  }

  const cliente = await clienteDoPainel();
  const { data, error } = await cliente
    .from("atendimento")
    .delete()
    .eq("profissional_id", medicoId)
    .eq("local_id", localId)
    .select("id")
    .maybeSingle();

  if (error) throw new Error(`Não consegui desligar: ${error.message}`);

  if (!data) {
    throw new Error(
      "Nada foi removido: ou o vínculo já não existia, ou o banco não admitiu. " +
        "Recarregue a página.",
    );
  }

  invalidar();
}
