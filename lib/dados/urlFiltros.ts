import type { Filtros, Ordem, RecursoAcessibilidade } from "@/lib/dados/tipos";

/*
  Tradução entre a URL e os filtros.

  Regra da camada de SEO: o que é indexável vive no CAMINHO da URL —
  especialidade e o cruzamento especialidade + bairro. Todo o resto vive em
  QUERYSTRING e a página sai como `noindex, follow`. Filtros combinados geram
  milhares de endereços quase iguais, e indexar isso derruba o site inteiro.
*/

const RECURSOS: RecursoAcessibilidade[] = [
  "acesso_cadeirante",
  "banheiro_adaptado",
  "elevador",
  "piso_tatil",
  "interprete_libras",
];

const ORDENS: Ordem[] = ["relevancia", "nome"];

type Query = Record<string, string | string[] | undefined>;

const texto = (v: string | string[] | undefined) =>
  Array.isArray(v) ? v[0] : v;

export function filtrosDaQuery(sp: Query): Filtros {
  const f: Filtros = {};

  const termo = texto(sp.termo)?.trim();
  if (termo) f.termo = termo;

  const bairro = texto(sp.bairro)?.trim();
  if (bairro) f.bairro = bairro;

  if (texto(sp.telemedicina) === "1") f.telemedicina = true;
  if (texto(sp.sabado) === "1") f.atendeSabado = true;
  if (texto(sp.associados) === "1") f.somenteAssociados = true;

  const bruto = sp.acessibilidade;
  const recursos = (Array.isArray(bruto) ? bruto : bruto ? [bruto] : []).filter(
    (r): r is RecursoAcessibilidade =>
      RECURSOS.includes(r as RecursoAcessibilidade),
  );
  if (recursos.length) f.acessibilidade = recursos;

  /* A entrada vem da URL e pode ser qualquer coisa: só passa o que está na
     lista conhecida. */
  const ordem = texto(sp.ordem);
  if (ordem && ORDENS.includes(ordem as Ordem)) f.ordem = ordem as Ordem;

  return f;
}

/** Ordem estável das chaves: URLs iguais para filtros iguais evitam duplicata. */
export function queryDosFiltros(f: Filtros): string {
  const p = new URLSearchParams();

  if (f.termo) p.set("termo", f.termo);
  if (f.bairro) p.set("bairro", f.bairro);
  if (f.telemedicina) p.set("telemedicina", "1");
  if (f.atendeSabado) p.set("sabado", "1");
  for (const r of f.acessibilidade ?? []) p.append("acessibilidade", r);
  if (f.somenteAssociados) p.set("associados", "1");
  if (f.ordem) p.set("ordem", f.ordem);

  const s = p.toString();
  return s ? `?${s}` : "";
}
