import { SINONIMOS, normalizar } from "@/lib/dados/sinonimos";
import { chave, paraSlug } from "@/lib/importador/texto";
import type { Retrato } from "@/lib/importador/tipos";

export type ResolucaoEspecialidade =
  | { tipo: "achada"; id: number; nome: string }
  | { tipo: "desconhecida" }
  | { tipo: "fora-do-catalogo"; nome: string };

export type ResolucaoBairro =
  | { tipo: "existente"; id: number; nome: string }
  | { tipo: "novo"; nome: string; slug: string };

/*
  Especialidade e bairro seguem regras OPOSTAS, e é deliberado.

  Especialidade nunca é criada: cada uma tem texto editorial ("o que faz",
  "quando procurar") e vira URL indexada. Criada em branco produz página de
  faceta sem prosa.

  Bairro é criado: o catálogo tem 8 linhas e Imperatriz tem dezenas. Tratar
  bairro novo como erro reprovaria quase toda linha na primeira rodada.
*/

/**
 * Escada de três degraus. As duas pendências são distintas porque o conserto
 * difere: "desconhecida" pede corrigir a planilha; "fora-do-catalogo" pede
 * acrescentar a especialidade ao banco.
 */
export function resolverEspecialidade(
  texto: string,
  catalogo: Retrato["especialidades"],
): ResolucaoEspecialidade {
  if (!texto.trim()) return { tipo: "desconhecida" };

  /* Degraus 1 e 2 de uma vez: `chave` já iguala acento e caixa, e o nome
     exato é um caso particular disso. */
  const k = chave(texto);
  const direta = catalogo.find((e) => chave(e.nome) === k);
  if (direta) return { tipo: "achada", id: direta.id, nome: direta.nome };

  /*
    Degrau 3. Compara contra o singular, o plural e os tokens extras de
    `SINONIMOS`, com `normalizar` — a mesma função que a busca do site usa,
    para que "clinico" signifique a mesma coisa nos dois lugares.
  */
  const n = normalizar(texto);
  const sinonimo = SINONIMOS.find(
    (s) =>
      /* O nome formal também. Sem ele, "Otorrinolaringologia" — a grafia que a
         AMI tem mais chance de escrever — cai em `desconhecida`, que manda
         corrigir a planilha, quando a planilha está certa e o incompleto é o
         catálogo do banco. */
      normalizar(s.especialidade) === n ||
      normalizar(s.singular) === n ||
      normalizar(s.plural) === n ||
      (s.tokensExtras ?? []).some((t) => normalizar(t) === n),
  );

  if (!sinonimo) return { tipo: "desconhecida" };

  const noCatalogo = catalogo.find(
    (e) => chave(e.nome) === chave(sinonimo.especialidade),
  );

  return noCatalogo
    ? { tipo: "achada", id: noCatalogo.id, nome: noCatalogo.nome }
    : { tipo: "fora-do-catalogo", nome: sinonimo.especialidade };
}

/** Casa por nome ou por slug. O aviso de parecido é decidido no plano. */
export function resolverBairro(
  texto: string,
  catalogo: Retrato["bairros"],
): ResolucaoBairro {
  const k = chave(texto);
  const s = paraSlug(texto);

  const achado = catalogo.find((b) => chave(b.nome) === k || b.slug === s);
  if (achado) return { tipo: "existente", id: achado.id, nome: achado.nome };

  return { tipo: "novo", nome: texto.trim(), slug: s };
}
