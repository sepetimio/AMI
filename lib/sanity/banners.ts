import { defineQuery } from "next-sanity";
import { obterCliente } from "@/lib/sanity/cliente";
import { urlDaImagem } from "@/lib/sanity/imagem";
import type { Banner, Foco, ImagemSanity } from "@/lib/sanity/tipos";

/* Etiqueta de cache dos banners, na mesma convenção de `ETIQUETA_NOTICIAS`
   em lib/sanity/consultas.ts: string exportada, nunca escrita à mão do lado
   que invalida — `etiquetasDoDocumento` (lib/sanity/etiquetasDoDocumento.ts)
   importa esta constante quando o webhook avisa de um documento `banner`. */
export const ETIQUETA_BANNERS = "banners";

/*
  A consulta traz dois tipos de banner. `tipo` ausente é arte pronta, que é o
  que todo banner cadastrado antes do campo existir é: por isso o filtro aceita
  `defined(imagem.asset)` sem olhar o tipo, e só o composto precisa declarar
  `tipo` e `titulo`.
*/
export const GROQ_BANNERS = defineQuery(`
  *[_type == "banner" && (
    defined(imagem.asset) || (tipo == "composto" && defined(titulo))
  )] | order(ordem asc) {
    "id": _id,
    nome,
    tipo,
    imagem{asset, alt, hotspot},
    imagemCelular{asset},
    tema,
    foto{asset, alt, hotspot},
    rotulo,
    titulo,
    texto,
    botao,
    destino,
    ordem,
    expiraEm
  }
`);

/* O que o GROQ devolve. Os campos do tipo que não vale para o documento vêm
   `null`, e o documento antigo não tem `tipo`. */
type ImagemCru = ImagemSanity & { hotspot?: { x?: number; y?: number } | null };

type BannerCru = {
  id: string;
  nome: string;
  tipo?: "arte" | "composto" | null;
  imagem?: ImagemCru | null;
  imagemCelular?: { asset: ImagemSanity["asset"] } | null;
  tema?: "escuro" | "claro" | null;
  foto?: ImagemCru | null;
  rotulo?: string | null;
  titulo?: string | null;
  texto?: string | null;
  botao?: string | null;
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
  As medidas das artes, em pixels. A largura é o que se pede ao CDN do Sanity;
  a altura só serve para quem desenha reservar o espaço certo. Uma arte larga
  tem a proporção 2,33:1 do carrossel no computador; a de celular é 4:5.
  Mesmos números que as descrições dos campos em sanity/schemas/banner.ts.

  A arte não é uma foto que o CDN recorta por hotspot: é peça pronta, a
  proporção já vem certa do arquivo que a AMI sobe, e quem decide como exibir
  em cada largura de tela é o carrossel (components/home/Carrossel.tsx), não
  esta consulta.
*/
export const ARTE_LARGA = { largura: 3000, altura: 1288 } as const;
export const ARTE_CELULAR = { largura: 1080, altura: 1350 } as const;

/* A foto do banner com texto não tem proporção combinada: 1600px de largura
   bastam para a metade do slide, e o CDN só redimensiona pela largura. */
const LARGURA_DA_FOTO = 1600;

/*
  As larguras do `srcset` de cada imagem, todas pedidas ao CDN com o mesmo
  `urlDaImagem`. A maior de cada lista é a medida de cima, e o endereço dela
  vai no `src`. Quem diz ao navegador em que largura cada imagem aparece (o
  `sizes`) é o carrossel, por lib/carrossel.ts: com isso, um celular baixa a
  arte de 800px, e não a de 3000.
*/
export const LARGURAS_DA_ARTE = [800, 1200, 1800, 2400, ARTE_LARGA.largura] as const;
export const LARGURAS_DA_ARTE_CELULAR = [540, ARTE_CELULAR.largura] as const;
export const LARGURAS_DA_FOTO = [600, 1000, LARGURA_DA_FOTO] as const;

/* O endereço na maior largura e o `srcset` com todas, ou `null` se a
   imagem não existe ou o CDN não monta o endereço de alguma largura. */
export function imagemComSrcset(
  imagem: { asset: ImagemSanity["asset"] } | null | undefined,
  larguras: readonly number[],
): { url: string; srcset: string } | null {
  if (!imagem?.asset) return null;
  const urls = larguras.map((w) => urlDaImagem(imagem as ImagemSanity, w));
  if (urls.some((u) => !u)) return null;
  return {
    url: urls[urls.length - 1],
    srcset: urls.map((u, i) => `${u} ${larguras[i]}w`).join(", "),
  };
}

/* O hotspot do Sanity guarda o centro do ponto de interesse como fração da
   imagem. Fora de 0 a 1, ou incompleto, é lixo: sem foco, e o site recorta
   pelo meio como se nada tivesse sido marcado. */
function focoDe(imagem: ImagemCru | null | undefined): Foco | null {
  const x = imagem?.hotspot?.x;
  const y = imagem?.hotspot?.y;
  if (typeof x !== "number" || typeof y !== "number") return null;
  if (!(x >= 0 && x <= 1 && y >= 0 && y <= 1)) return null;
  return { x, y };
}

/*
  Pura e exportada, no mesmo espírito de `estaNoAr`, para poder testar sem
  rede: monta um `Banner` a partir do que o GROQ devolveu, ou devolve `null`
  quando não dá.

  `tipo ?? "arte"`: o banner que já estava cadastrado quando o campo `tipo`
  foi criado não o tem, e é arte pronta.

  `defined(imagem.asset)` no GROQ garante que existe um asset, não que a URL
  sai — um `asset._ref` corrompido (upload em andamento, referência
  quebrada) passa o filtro do banco e só se revela aqui, quando
  `urlDaImagem` devolve "". Na arte, descartar o banner inteiro nesse caso, e
  não montar um objeto com `imagem: ""`, é o mesmo padrão de
  `components/editorial/TextoRico.tsx`: sem URL não há o que desenhar, e o
  carrossel não pode receber um `<img src="">`. A AMI perde um banner, não o
  carrossel inteiro.

  As imagens que NÃO sustentam o banner viram `null` em vez de derrubá-lo: a
  versão de celular da arte (o site recorta a larga) e a foto do composto (o
  slide tem título e texto, e a área da foto vira moldura).

  O composto não olha `imagem`: quem troca o tipo no Studio deixa a arte
  antiga guardada, só escondida, e ela não pode virar o banner.
*/
export function paraBanner(b: BannerCru): Banner | null {
  const destino = b.destino ?? null;
  const ordem = b.ordem ?? 0;

  if ((b.tipo ?? "arte") === "composto") {
    if (!b.titulo) return null;
    const foto = imagemComSrcset(b.foto, LARGURAS_DA_FOTO);
    return {
      tipo: "composto",
      id: b.id,
      nome: b.nome,
      foto: foto?.url ?? null,
      fotoSrcset: foto?.srcset ?? null,
      foco: focoDe(b.foto),
      fotoAlt: b.foto?.alt ?? "",
      rotulo: b.rotulo ?? null,
      titulo: b.titulo,
      texto: b.texto ?? null,
      botao: b.botao ?? null,
      destino,
      ordem,
    };
  }

  const imagem = imagemComSrcset(b.imagem, LARGURAS_DA_ARTE);
  if (!imagem) return null;
  const celular = imagemComSrcset(b.imagemCelular, LARGURAS_DA_ARTE_CELULAR);

  return {
    tipo: "arte",
    id: b.id,
    nome: b.nome,
    imagem: imagem.url,
    imagemSrcset: imagem.srcset,
    imagemCelular: celular?.url ?? null,
    imagemCelularSrcset: celular?.srcset ?? null,
    foco: focoDe(b.imagem),
    alt: b.imagem?.alt ?? "",
    tema: b.tema === "claro" ? "claro" : "escuro",
    destino,
    ordem,
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
