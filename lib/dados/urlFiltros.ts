import type { Filtros } from "@/lib/dados/tipos";

/*
  Tradução entre a URL e os filtros.

  Regra da camada de SEO: o que é indexável vive no CAMINHO da URL — a
  especialidade. Todo o resto vive em QUERYSTRING e a página sai como
  `noindex, follow`. Filtros combinados geram milhares de endereços quase
  iguais, e indexar isso derruba o site inteiro. Em `/busca` a especialidade
  também vai na querystring (a busca inteira é `noindex`); a página
  indexável de cada especialidade continua sendo o caminho
  `/medicos/<slug>`.

  Os parâmetros de antes (`bairro`, `telemedicina`, `acessibilidade`,
  `associados`, `ordem`) não são lidos: um endereço antigo abre a busca sem
  eles.
*/

type Query = Record<string, string | string[] | undefined>;

const texto = (v: string | string[] | undefined) =>
  Array.isArray(v) ? v[0] : v;

export function filtrosDaQuery(sp: Query): Filtros {
  const f: Filtros = {};

  const termo = texto(sp.termo)?.trim();
  if (termo) f.termo = termo;

  const especialidade = texto(sp.especialidade)?.trim();
  if (especialidade) f.especialidade = especialidade;

  return f;
}

/**
 * Serializa os filtros numa querystring, em ordem fixa (termo, depois
 * especialidade): o mesmo filtro com dois endereços é conteúdo duplicado.
 * Toda URL da busca passa por aqui (`enderecoDaBusca`).
 */
export function queryDosFiltros(f: Filtros): string {
  const p = new URLSearchParams();

  if (f.termo) p.set("termo", f.termo);
  if (f.especialidade) p.set("especialidade", f.especialidade);

  const s = p.toString();
  return s ? `?${s}` : "";
}

/** O endereço da busca com estes filtros: `/busca` e a querystring de `queryDosFiltros`. */
export function enderecoDaBusca(f: Filtros): string {
  return `/busca${queryDosFiltros(f)}`;
}
