"use client";

import { startTransition, useActionState, useState } from "react";
import {
  enviarFoto,
  removerFoto,
  type EstadoDaFoto,
} from "@/app/painel/medico/[id]/acoes-foto";
import { iniciais } from "@/lib/encontre";
import { LIMITE_DA_FOTO } from "@/lib/painel/foto";
import { recorteRetrato } from "@/lib/painel/recorte";

const INICIAL: EstadoDaFoto = { erro: null, salvo: false };

const BOTAO =
  "pressiona rounded-controle border border-line bg-surface px-5 py-3 text-[15px] " +
  "font-semibold text-ink-900 hover:border-ami-green-600";

const NAO_ABRIU = "Não consegui abrir esta foto. Use JPG, PNG ou WebP.";
const MUITO_GRANDE = "A foto passou de 900 KB. Escolha outra ou tente de novo.";

function paraBlob(canvas: HTMLCanvasElement, tipo: string, qualidade: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, tipo, qualidade));
}

/*
  Lê o arquivo, recorta em 4:5 pelo centro, reduz e codifica. WebP quando o
  navegador sabe gerar; senão JPEG. Se passar do limite, tenta uma vez com
  qualidade menor. Devolve o arquivo pronto, ou a frase de erro.
*/
async function prepararFoto(
  arquivo: File,
): Promise<{ foto: File; pequena: boolean } | { erro: string }> {
  let imagem: ImageBitmap;
  try {
    imagem = await createImageBitmap(arquivo);
  } catch {
    return { erro: NAO_ABRIU };
  }

  const r = recorteRetrato(imagem.width, imagem.height);
  const canvas = document.createElement("canvas");
  canvas.width = r.largura;
  canvas.height = r.altura;
  const contexto = canvas.getContext("2d");
  if (!contexto) {
    imagem.close();
    return { erro: NAO_ABRIU };
  }
  contexto.drawImage(imagem, r.sx, r.sy, r.sLargura, r.sAltura, 0, 0, r.largura, r.altura);
  imagem.close();

  let tipo = "image/webp";
  let blob = await paraBlob(canvas, tipo, 0.85);
  if (!blob || blob.type !== "image/webp") {
    tipo = "image/jpeg";
    blob = await paraBlob(canvas, tipo, 0.85);
  }
  if (!blob) return { erro: NAO_ABRIU };

  if (blob.size > LIMITE_DA_FOTO) {
    blob = await paraBlob(canvas, tipo, 0.7);
    if (!blob || blob.size > LIMITE_DA_FOTO) return { erro: MUITO_GRANDE };
  }

  const nome = tipo === "image/webp" ? "foto.webp" : "foto.jpg";
  return { foto: new File([blob], nome, { type: tipo }), pequena: r.pequena };
}

type Quem = "envio" | "remocao" | "local" | null;

export function BlocoFoto({
  medicoId,
  nome,
  foto,
}: {
  medicoId: number;
  nome: string;
  foto: string | null;
}) {
  const [estadoEnvio, enviar, enviando] = useActionState(enviarFoto, INICIAL);
  const [estadoRemocao, remover, removendo] = useActionState(removerFoto, INICIAL);
  // Mostra o resultado da última coisa que a pessoa fez.
  const [quem, setQuem] = useState<Quem>(null);
  const [erroLocal, setErroLocal] = useState<string | null>(null);
  const [preparando, setPreparando] = useState(false);
  const [pequena, setPequena] = useState(false);

  const ocupado = enviando || removendo || preparando;

  async function aoEscolher(evento: React.ChangeEvent<HTMLInputElement>) {
    const campo = evento.currentTarget;
    const arquivo = campo.files?.[0];
    campo.value = "";
    if (!arquivo) return;

    setQuem("local");
    setErroLocal(null);
    setPequena(false);
    setPreparando(true);
    const pronta = await prepararFoto(arquivo);
    setPreparando(false);

    if ("erro" in pronta) {
      setErroLocal(pronta.erro);
      return;
    }

    setPequena(pronta.pequena);
    const dados = new FormData();
    dados.set("id", String(medicoId));
    dados.set("foto", pronta.foto);
    setQuem("envio");
    startTransition(() => enviar(dados));
  }

  function aoRemover(dados: FormData) {
    setQuem("remocao");
    remover(dados);
  }

  const estado = quem === "envio" ? estadoEnvio : quem === "remocao" ? estadoRemocao : null;
  const mensagem =
    quem === "local"
      ? (erroLocal ?? "")
      : estado?.erro
        ? estado.erro
        : estado?.salvo
          ? quem === "remocao"
            ? "Foto removida."
            : "Foto salva."
          : "";
  const ehErro = quem === "local" ? Boolean(erroLocal) : Boolean(estado?.erro);
  const aviso = quem === "envio" && pequena && estado?.salvo ? "A foto é pequena e pode sair borrada." : "";

  return (
    <section className="mt-12 max-w-[640px]">
      <h2 className="text-[20px] font-semibold text-ink-900">Foto</h2>

      <div className="mt-4 flex flex-wrap items-start gap-6">
        {foto ? (
          // eslint-disable-next-line @next/next/no-img-element -- foto pública do bucket, tamanho fixo
          <img
            src={foto}
            alt={`Foto de ${nome}`}
            width={160}
            height={200}
            className="aspect-[4/5] w-40 rounded-bloco border border-line object-cover"
          />
        ) : (
          <div
            aria-hidden="true"
            className="flex aspect-[4/5] w-40 items-center justify-center rounded-bloco bg-ami-green-600 text-[40px] font-semibold text-white"
          >
            {iniciais(nome)}
          </div>
        )}

        <div className="min-w-[220px] flex-1">
          <div className="flex flex-wrap gap-3">
            <label
              className={`${BOTAO} cursor-pointer has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ami-green-600 ${
                ocupado ? "pointer-events-none opacity-60" : ""
              }`}
            >
              {ocupado && !removendo ? "Enviando…" : "Escolher foto"}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                disabled={ocupado}
                onChange={aoEscolher}
                className="sr-only"
              />
            </label>

            {foto ? (
              <form action={aoRemover}>
                <input type="hidden" name="id" value={medicoId} />
                <button type="submit" disabled={ocupado} className={`${BOTAO} disabled:opacity-60`}>
                  {removendo ? "Enviando…" : "Remover foto"}
                </button>
              </form>
            ) : null}
          </div>

          <p className="mt-3 text-[15px] text-ink-600">
            JPG, PNG ou WebP. O painel recorta no formato retrato do site, pelo centro.
          </p>

          <p
            aria-live="polite"
            className={`mt-2 min-h-5 text-[14px] ${ehErro ? "text-warn" : "text-ink-600"}`}
          >
            {mensagem}
            {aviso ? ` ${aviso}` : ""}
          </p>
        </div>
      </div>
    </section>
  );
}
