"use server";

import { revalidatePath } from "next/cache";
import {
  BUCKET_DAS_FOTOS,
  caminhoDaFoto,
  conferirFoto,
  mensagemDoErroDeEnvio,
} from "@/lib/painel/foto";
import { clienteDoPainel } from "@/lib/painel/servidor";
import { exigirAdmin } from "@/lib/painel/sessao";

export type EstadoDaFoto = { erro: string | null; salvo: boolean };

const ID_INVALIDO: EstadoDaFoto = { erro: "Identificador de médico inválido.", salvo: false };

/*
  Grava o endereço da foto (ou limpa) no perfil.

  Mesma conferência de `alternarPublicacao`: o PostgREST filtra a linha que a
  política não admite em vez de recusar, então zero linhas e nenhum erro quer
  dizer que o banco disse não.
*/
async function gravarFoto(id: number, foto: string | null): Promise<EstadoDaFoto> {
  const cliente = await clienteDoPainel();
  const { data, error } = await cliente
    .from("profissional")
    .update({ foto, atualizado_em: new Date().toISOString() })
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error) return { erro: `Não consegui gravar a foto: ${error.message}`, salvo: false };

  if (!data) {
    return {
      erro:
        "A alteração não foi gravada: o banco não admitiu a escrita nesta linha. " +
        "Costuma ser sessão expirada — saia e entre de novo.",
      salvo: false,
    };
  }

  revalidatePath("/(site)", "layout");
  revalidatePath("/sitemap.xml");
  revalidatePath("/painel");
  revalidatePath(`/painel/medico/${id}`);

  return { erro: null, salvo: true };
}

/*
  Envia a foto nova para o bucket público e a põe no perfil.

  Cada envio grava um arquivo novo (`upsert: false`): a foto antiga continua
  no bucket. Nada é apagado.
*/
export async function enviarFoto(
  _anterior: EstadoDaFoto,
  dados: FormData,
): Promise<EstadoDaFoto> {
  await exigirAdmin();

  const id = Number(dados.get("id"));
  if (!Number.isInteger(id) || id <= 0) return ID_INVALIDO;

  const foto = dados.get("foto");
  if (!(foto instanceof File)) {
    return { erro: "Nenhuma foto chegou. Escolha a foto de novo.", salvo: false };
  }

  const bytes = new Uint8Array(await foto.arrayBuffer());
  const conferencia = conferirFoto(bytes);
  if (!conferencia.ok) return { erro: conferencia.erro, salvo: false };

  const { tipo } = conferencia;
  const caminho = caminhoDaFoto(id, tipo, new Date());

  const cliente = await clienteDoPainel();
  const { error } = await cliente.storage.from(BUCKET_DAS_FOTOS).upload(caminho, bytes, {
    contentType: tipo === "webp" ? "image/webp" : "image/jpeg",
    upsert: false,
    cacheControl: "31536000",
  });

  if (error) return { erro: mensagemDoErroDeEnvio(error.message), salvo: false };

  const { publicUrl } = cliente.storage.from(BUCKET_DAS_FOTOS).getPublicUrl(caminho).data;

  return gravarFoto(id, publicUrl);
}

/* Tira a foto do perfil. O arquivo fica no bucket: nada é apagado. */
export async function removerFoto(
  _anterior: EstadoDaFoto,
  dados: FormData,
): Promise<EstadoDaFoto> {
  await exigirAdmin();

  const id = Number(dados.get("id"));
  if (!Number.isInteger(id) || id <= 0) return ID_INVALIDO;

  return gravarFoto(id, null);
}
