import { defineQuery } from "next-sanity";
import { obterCliente } from "@/lib/sanity/cliente";
import { urlDaImagem } from "@/lib/sanity/imagem";
import type { Banner, ImagemSanity } from "@/lib/sanity/tipos";

/* Etiqueta de cache dos banners, na mesma convenção de `ETIQUETA_NOTICIAS`
   em lib/sanity/consultas.ts: string exportada, nunca escrita à mão do lado
   que invalida. */
export const ETIQUETA_BANNERS = "banners";

const PROJECAO_IMAGEM = `imagem{asset, alt}`;

export const GROQ_BANNERS = defineQuery(`
  *[_type == "banner" && defined(imagem.asset)] | order(ordem asc) {
    "id": _id,
    nome,
    ${PROJECAO_IMAGEM},
    destino,
    ordem,
    expiraEm
  }
`);

type BannerCru = {
  id: string;
  nome: string;
  imagem: ImagemSanity;
  destino: string | null;
  ordem: number | null;
  expiraEm: string | null;
};

/*
  Banner vencido some sozinho, mas continua no Sanity: a AMI reaproveita no
  ano seguinte trocando a data.

  A comparação é feita AQUI e não no GROQ porque o site é gerado
  estaticamente e revalida de hora em hora — uma data resolvida no servidor
  do Sanity seria a data da geração, não a de quem visita.
*/
export function estaNoAr(b: { expiraEm: string | null }, agora: Date): boolean {
  if (!b.expiraEm) return true;
  const fim = new Date(`${b.expiraEm}T23:59:59Z`);
  return fim.getTime() >= agora.getTime();
}

/*
  A largura pedida a `urlDaImagem` é a dimensão nativa da arte (3000px). O
  banner não é uma foto que o CDN recorta por hotspot: é peça pronta, a
  proporção já vem certa do arquivo que a AMI sobe, e quem decide como
  exibir em cada largura de tela é o carrossel — tarefa seguinte, fora
  daqui.
*/
const LARGURA_DA_ARTE = 3000;

export async function bannersAtivos(): Promise<Banner[]> {
  const cliente = await obterCliente();
  const cru: BannerCru[] = await cliente.fetch(
    GROQ_BANNERS,
    {},
    { next: { tags: [ETIQUETA_BANNERS] } },
  );
  const agora = new Date();

  return (cru ?? [])
    .filter((b) => estaNoAr(b, agora))
    .map((b) => ({
      id: b.id,
      nome: b.nome,
      imagem: urlDaImagem(b.imagem, LARGURA_DA_ARTE),
      alt: b.imagem?.alt ?? "",
      destino: b.destino ?? null,
      ordem: b.ordem ?? 0,
    }));
}
