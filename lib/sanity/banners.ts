import { defineQuery } from "next-sanity";
import { obterCliente } from "@/lib/sanity/cliente";
import { urlDaImagem } from "@/lib/sanity/imagem";
import type { Banner, ImagemSanity } from "@/lib/sanity/tipos";

/* Etiqueta de cache dos banners, na mesma convenção de `ETIQUETA_NOTICIAS`
   em lib/sanity/consultas.ts: string exportada, nunca escrita à mão do lado
   que invalida — `etiquetasDoDocumento` (lib/sanity/etiquetasDoDocumento.ts)
   importa esta constante quando o webhook avisa de um documento `banner`. */
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

  O offset é "-03:00" explícito, e não "Z" (UTC): Imperatriz é UTC-3 e não
  tem horário de verão, então o offset fixo é seguro, no mesmo raciocínio de
  `dataPorExtenso` em lib/formato.ts. Com "Z", o banner sumia às 20h59
  LOCAIS do dia da validade — três horas antes do que o campo promete por
  escrito ("o último dia em que ele aparece") — porque 23:59:59 UTC já é
  23:59:59 menos três horas em Imperatriz. Achado por revisão independente,
  travado em teste (`testes/banners.test.ts`).
*/
export function estaNoAr(b: { expiraEm: string | null }, agora: Date): boolean {
  if (!b.expiraEm) return true;
  const fim = new Date(`${b.expiraEm}T23:59:59-03:00`);
  return fim.getTime() >= agora.getTime();
}

/*
  A largura pedida a `urlDaImagem` é a dimensão nativa da arte (3000px). O
  banner não é uma foto que o CDN recorta por hotspot: é peça pronta, a
  proporção já vem certa do arquivo que a AMI sobe, e quem decide como
  exibir em cada largura de tela é o carrossel
  (components/home/Carrossel.tsx), não esta consulta.
*/
const LARGURA_DA_ARTE = 3000;

/*
  Pura e exportada, no mesmo espírito de `estaNoAr`, para poder testar sem
  rede: monta um `Banner` a partir do que o GROQ devolveu, ou devolve `null`
  quando não dá.

  `defined(imagem.asset)` no GROQ garante que existe um asset, não que a URL
  sai — um `asset._ref` corrompido (upload em andamento, referência
  quebrada) passa o filtro do banco e só se revela aqui, quando
  `urlDaImagem` devolve "". Descartar o banner inteiro nesse caso, e não
  montar um objeto com `imagem: ""`, é o mesmo padrão de
  `components/editorial/TextoRico.tsx`: sem URL não há o que desenhar, e o
  carrossel não pode receber um `<img src="">`. A AMI perde um banner, não o
  carrossel inteiro.
*/
export function paraBanner(b: BannerCru): Banner | null {
  const imagem = urlDaImagem(b.imagem, LARGURA_DA_ARTE);
  if (!imagem) return null;

  return {
    id: b.id,
    nome: b.nome,
    imagem,
    alt: b.imagem?.alt ?? "",
    destino: b.destino ?? null,
    ordem: b.ordem ?? 0,
  };
}

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
    .map(paraBanner)
    .filter((b): b is Banner => b !== null);
}
