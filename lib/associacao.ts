import type { PortableTextBlock } from "@portabletext/react";
import type { NomeIcone } from "@/components/base/IconeServidor";
import type { Diretor } from "@/lib/dados/diretoria";
import { iconeDaPagina } from "@/lib/paginaDeTexto";

/*
  O que a página A Associação (/associacao) decide, em funções puras
  (testes/associacao-funcoes.test.ts):
  - os atalhos de "Saiba mais";
  - a diretoria em destaque;
  - os números da faixa verde;
  - a apresentação oficial;
  - o texto do convite para se associar, o mesmo da home.
*/

/** O texto aprovado da faixa "Seja associado" da home, repetido no fecho de A Associação. */
export const CONVITE_PARA_ASSOCIAR = {
  titulo: "Associe-se à AMI e fortaleça a medicina em Imperatriz",
  texto: "Médico com inscrição no CRM pode se associar. Fale com a AMI para saber como.",
} as const;

export type Atalho = {
  titulo: string;
  frase: string;
  caminho: string;
  icone: NomeIcone;
  /** A página ainda não existe: o atalho só sai na demonstração, com "texto a entrar". */
  aEntrar: boolean;
};

/* Os candidatos, na ordem da tela. "Benefícios" não entra (spec, seção 1.5). */
const CANDIDATOS = [
  { slug: "seja-associado", titulo: "Seja associado", frase: "Quem pode se associar à AMI e como fazer isso." },
  { slug: "estatuto", titulo: "Estatuto", frase: "As regras que organizam a associação." },
  { slug: "politica-editorial", titulo: "Política editorial", frase: "Como o site escolhe, apura e revisa o que publica." },
] as const;

/** Com um atalho só (Seja associado), o bloco repetiria o fecho logo abaixo: não sai. */
export const MINIMO_DE_ATALHOS = 2;

/**
 * Os atalhos de "Saiba mais". `existentes` são os endereços das páginas que
 * existem: publicadas no Studio ou com rascunho em código.
 * - A que existe sai nos dois modos.
 * - A que não existe sai só na demonstração, como "texto a entrar".
 * - Com menos de dois, nenhum.
 */
export function atalhosDoSaibaMais(demonstracao: boolean, existentes: readonly string[]): Atalho[] {
  const atalhos: Atalho[] = [];
  for (const c of CANDIDATOS) {
    const caminho = `/associacao/${c.slug}`;
    const existe = existentes.includes(caminho);
    if (!existe && !demonstracao) continue;
    atalhos.push({ titulo: c.titulo, frase: c.frase, caminho, icone: iconeDaPagina(c.slug), aEntrar: !existe });
  }
  return atalhos.length >= MINIMO_DE_ATALHOS ? atalhos : [];
}

/** Quantos diretores a página da associação mostra; a lista inteira está em /associacao/diretoria. */
export const LIMITE_DA_DIRETORIA_EM_DESTAQUE = 4;

/** Os primeiros da diretoria, na ordem da AMI (`ordenarDiretoria`, lib/dados/diretoria.ts). */
export function diretoriaEmDestaque(diretoria: Diretor[]): Diretor[] {
  return diretoria.slice(0, LIMITE_DA_DIRETORIA_EM_DESTAQUE);
}

export type NumeroDaAssociacao = { valor: number; rotulo: string };

/** Os três números da home, na faixa verde de A Associação: anos, médicos e especialidades. */
export function numerosDaAssociacao(n: {
  anos: number;
  medicos: number;
  especialidades: number;
}): NumeroDaAssociacao[] {
  return [
    { valor: n.anos, rotulo: n.anos === 1 ? "ano de AMI" : "anos de AMI" },
    {
      valor: n.medicos,
      rotulo: n.medicos === 1 ? "médico no diretório" : "médicos no diretório",
    },
    {
      valor: n.especialidades,
      rotulo: n.especialidades === 1 ? "especialidade" : "especialidades",
    },
  ];
}

export type ApresentacaoNaTela = { tipo: "texto"; blocos: PortableTextBlock[] } | { tipo: "a-entrar" };

/**
 * A apresentação oficial, o texto do documento "associacao" do Studio. A
 * mesma trava das outras molduras (lib/molduras.ts): com texto, sai nos
 * dois modos; sem texto, "a entrar" só na demonstração; fora dela, nada.
 */
export function apresentacaoDaAssociacao(
  demonstracao: boolean,
  corpo: PortableTextBlock[] | null | undefined,
): ApresentacaoNaTela | null {
  if (corpo && corpo.length > 0) return { tipo: "texto", blocos: corpo };
  return demonstracao ? { tipo: "a-entrar" } : null;
}
