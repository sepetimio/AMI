/*
  A foto do médico: as conferências que não dependem do banco.

  O navegador converte PNG e outros formatos para WebP ou JPEG antes de
  enviar. O servidor não confia nisso: olha os primeiros bytes e só aceita
  esses dois tipos.
*/

export const BUCKET_DAS_FOTOS = "fotos-medicos";
export const LIMITE_DA_FOTO = 900 * 1024;

export type TipoDaFoto = "webp" | "jpg";

export function tipoDaFoto(bytes: Uint8Array): TipoDaFoto | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "jpg";
  }

  // "RIFF" nos bytes 0 a 3 e "WEBP" nos bytes 8 a 11.
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return "webp";
  }

  return null;
}

export function conferirFoto(
  bytes: Uint8Array,
): { ok: true; tipo: TipoDaFoto } | { ok: false; erro: string } {
  if (bytes.length === 0) {
    return { ok: false, erro: "Nenhuma foto chegou. Escolha a foto de novo." };
  }

  if (bytes.length > LIMITE_DA_FOTO) {
    return { ok: false, erro: "A foto passou de 900 KB. Escolha outra ou tente de novo." };
  }

  const tipo = tipoDaFoto(bytes);
  if (!tipo) {
    return { ok: false, erro: "Formato não aceito. Use JPG, PNG ou WebP." };
  }

  return { ok: true, tipo };
}

/** Um arquivo novo a cada envio: o nome carrega a data, e nada é sobrescrito. */
export function caminhoDaFoto(medicoId: number, tipo: TipoDaFoto, agora: Date): string {
  return `${medicoId}/${agora.toISOString().replace(/[:.]/g, "-")}.${tipo}`;
}

export function mensagemDoErroDeEnvio(mensagem: string): string {
  const texto = mensagem.toLowerCase();

  if (texto.includes("bucket not found")) {
    return "O armazenamento de fotos ainda não foi ligado no Supabase. Veja docs/como-ligar-as-fotos.md.";
  }

  if (texto.includes("row-level security") || texto.includes("unauthorized")) {
    return "O banco não aceitou o envio. Costuma ser sessão expirada: saia e entre de novo.";
  }

  return "Não consegui enviar a foto: " + mensagem;
}
