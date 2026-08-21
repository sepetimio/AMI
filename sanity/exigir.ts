/*
  Validação de variável de ambiente, isolada num módulo sem efeito colateral.

  Separada de `env.ts` de propósito: lá as constantes são calculadas no topo
  do módulo, então importar aquele arquivo já lança quando falta configuração.
  Um teste desta função não pode depender de o ambiente estar configurado, ou
  ele quebra exatamente na máquina de quem ainda não configurou.
*/
export function exigir(valor: string | undefined, nome: string): string {
  /* String vazia conta como ausente: uma linha `NOME=` no .env produz "" e
     não undefined, e "" como projectId falha lá adiante, ilegível. */
  if (!valor) {
    throw new Error(
      `Falta ${nome} no .env.local. O Project ID está no topo da página do ` +
        `projeto em sanity.io/manage.`,
    );
  }
  return valor;
}
