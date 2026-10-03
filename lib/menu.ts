/*
  Os itens do menu principal, e a decisão de quais aparecem.

  Moram aqui, e não em components/layout/MenuPrincipal.tsx, porque aquele é
  componente de cliente: uma função exportada de lá, chamada no servidor,
  viraria referência de cliente e não rodaria. Quem decide a lista é o
  cabeçalho (components/layout/Cabecalho.tsx), no servidor, com a chave de
  lib/demonstracao.ts; o menu só recebe a lista pronta.
*/
export type ItemDoMenu = { rotulo: string; href: string };

export const MENU: ItemDoMenu[] = [
  { rotulo: "Início", href: "/" },
  { rotulo: "A Associação", href: "/associacao" },
  { rotulo: "Encontre um médico", href: "/busca" },
  { rotulo: "Especialidades", href: "/medicos" },
  { rotulo: "Sua AMI", href: "/#sua-ami" },
  { rotulo: "Notícias", href: "/noticias" },
  { rotulo: "Contato", href: "/contato" },
];

/*
  "Sua AMI" aponta para o bloco `#sua-ami` da home, que só existe no modo
  demonstração (components/home/SuaAmi.tsx devolve `null` fora dele). Fora
  dela, o item sai, para não levar ao nada. O rodapé
  (components/layout/Rodape.tsx) segue a mesma regra.
*/
export function menuDoSite(demonstracao: boolean): ItemDoMenu[] {
  return demonstracao ? MENU : MENU.filter((item) => item.href !== "/#sua-ami");
}
