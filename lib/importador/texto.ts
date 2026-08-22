/*
  Normalização de texto do importador.

  Separado de `lib/dados/sinonimos.ts` de propósito: lá `normalizar` serve à
  busca do visitante e pode mudar por razões de busca. Aqui as mesmas
  operações decidem se dois bairros são o mesmo bairro e qual endereço um
  perfil terá para sempre. Amarrar as duas faria uma melhoria de busca mudar
  URL de perfil publicado.
*/

export function semAcento(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

/**
 * Forma canônica para comparar dois textos que deveriam ser o mesmo.
 * Sem acento, minúsculo, espaços colapsados e aparados.
 */
export function chave(s: string): string {
  return semAcento(s).toLowerCase().replace(/\s+/g, " ").trim();
}

/**
 * Slug no mesmo formato que o banco já usa — igual ao de
 * `supabase/seed/gerar-seed.ts`, para que bairro criado pelo importador não
 * fique diferente de bairro criado pelo seed.
 */
export function paraSlug(s: string): string {
  return semAcento(s)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Levenshtein. Usado só para desconfiar de erro de digitação em bairro. */
export function distanciaDeEdicao(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  let anterior = Array.from({ length: b.length + 1 }, (_, i) => i);

  for (let i = 1; i <= a.length; i++) {
    const atual = [i];
    for (let j = 1; j <= b.length; j++) {
      const custo = a[i - 1] === b[j - 1] ? 0 : 1;
      atual[j] = Math.min(
        atual[j - 1] + 1,
        anterior[j] + 1,
        anterior[j - 1] + custo,
      );
    }
    anterior = atual;
  }

  return anterior[b.length];
}

/*
  Dois nomes normalizados de tamanho >= 5 e distância <= 2 são tratados como
  provável erro de digitação.

  O piso de 5 não é gosto: em nome curto uma letra de diferença costuma ser
  outro bairro de verdade, e um aviso falso a cada linha ensina quem lê o
  relatório a ignorar o aviso — que é pior do que não ter aviso.
*/
const TAMANHO_MINIMO = 5;
const DISTANCIA_MAXIMA = 2;

/** Devolve o candidato parecido demais com o alvo, ou nulo. */
export function maisParecido(alvo: string, candidatos: string[]): string | null {
  const a = chave(alvo);
  if (a.length < TAMANHO_MINIMO) return null;

  let melhor: string | null = null;
  let menor = Infinity;

  for (const c of candidatos) {
    const b = chave(c);
    if (b.length < TAMANHO_MINIMO) continue;

    const d = distanciaDeEdicao(a, b);
    if (d <= DISTANCIA_MAXIMA && d < menor) {
      menor = d;
      melhor = c;
    }
  }

  return melhor;
}
