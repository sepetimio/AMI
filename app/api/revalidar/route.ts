import { revalidateTag } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { parseBody } from "next-sanity/webhook";
import { etiquetasDoDocumento } from "@/lib/sanity/etiquetasDoDocumento";

/*
  Webhook do Sanity: publicar no Studio derruba o cache das páginas afetadas.

  Sem ele o site esperaria a hora de `revalidate = 3600`, e a AMI corrigiria
  um erro num comunicado sem ver a correção no ar. Com ele, é imediato.

  `parseBody` do next-sanity confere a assinatura HMAC do corpo contra o
  segredo. É isso que impede qualquer pessoa de descobrir o endereço e ficar
  derrubando o cache do site à vontade, que é negação de serviço barata: cada
  invalidação força a próxima visita a buscar tudo de novo no Sanity.
*/
export async function POST(req: NextRequest) {
  const segredo = process.env.SANITY_WEBHOOK_SECRET;
  if (!segredo) {
    /* Falhar fechado. Sem segredo configurado o endpoint fica aberto, e um
       endpoint aberto de invalidação é pior que endpoint nenhum. */
    return NextResponse.json(
      { erro: "SANITY_WEBHOOK_SECRET não configurado" },
      { status: 500 },
    );
  }

  let resultado;
  try {
    resultado = await parseBody<{
      _type?: string;
      slug?: { current?: string };
    }>(
      req,
      segredo,
      /* `parseBody` espera por padrão a consistência eventual do Content
         Lake antes de responder, útil para quem consulta o Sanity logo
         depois do webhook. Este handler nunca consulta o Sanity, só chama
         `revalidateTag`, então a espera de três segundos não tem função
         aqui e só custaria tempo faturado de função a cada publicação. */
      false,
    );
  } catch {
    /* `parseBody` faz JSON.parse do corpo sem antes checar o resultado da
       assinatura, então corpo malformado lança antes de qualquer decisão
       nossa. Sem este cerco, qualquer pessoa que mande um cabeçalho de
       assinatura inventado e um corpo que não seja JSON arranca um 500 de
       uma rota pública. 400 é a resposta certa: o problema está no pedido. */
    return NextResponse.json({ erro: "Corpo malformado" }, { status: 400 });
  }
  const { isValidSignature, body } = resultado;

  if (!isValidSignature) {
    return NextResponse.json({ erro: "Assinatura inválida" }, { status: 401 });
  }

  if (!body?._type) {
    return NextResponse.json({ erro: "Corpo sem _type" }, { status: 400 });
  }

  const etiquetas = etiquetasDoDocumento(body);

  /* Dois argumentos, sempre. A forma `revalidateTag(etiqueta)` está depreciada
     no Next 16: ela expira a entrada na hora e faz a próxima requisição
     bloquear esperando o Sanity. Com "max", o visitante recebe a versão
     antiga na hora e a nova é buscada em segundo plano. */
  for (const etiqueta of etiquetas) {
    revalidateTag(etiqueta, "max");
  }

  return NextResponse.json({ revalidado: etiquetas });
}
