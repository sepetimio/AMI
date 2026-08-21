/*
  A trava de demonstração, numa fonte só.

  O seed inventa 24 médicos com CRM plausível. Duas partes do site precisam
  saber disso e precisam concordar: o `robots.txt`, que bloqueia o rastreador
  enquanto os perfis forem fabricados, e o rodapé, que avisa o visitante. Elas
  moravam em lugares diferentes, e o rodapé afirmava o aviso sem condição
  nenhuma. No dia em que a AMI carregasse o cadastro real e virasse a flag, o
  robots abriria o site e o rodapé continuaria dizendo que os 500 médicos são
  inventados. A spec, seção 9, é explícita: o rodapé declara isso enquanto for
  verdade.

  Note o padrão invertido: a ausência da variável vale como "sim, é
  demonstração". Quem esquecer de configurar o ambiente fica com o site
  fechado para o Google e com o aviso na tela, que é o erro barato. O
  contrário publicaria perfis fictícios como se fossem médicos de verdade.
*/
export function saoDadosDeDemonstracao(valor: string | undefined): boolean {
  return valor !== "false";
}

export const DADOS_DEMONSTRACAO = saoDadosDeDemonstracao(
  process.env.NEXT_PUBLIC_DADOS_DEMONSTRACAO,
);
