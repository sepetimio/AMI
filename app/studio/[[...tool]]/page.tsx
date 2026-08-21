import EstudioCliente from "./estudio-cliente";

/*
  Rota atrapalhadora opcional (`[[...tool]]`): o Studio faz o próprio
  roteamento no cliente, e todos os caminhos abaixo de /studio precisam cair
  nesta mesma página.

  `metadata` e `viewport` vêm do next-sanity prontos. O `metadata` de lá já
  traz `robots: "noindex"` e `referrer: "same-origin"`, que é exatamente o que
  uma tela autenticada precisa. Reescrever à mão só criaria chance de errar.
*/
export { metadata, viewport } from "next-sanity/studio";

/* O Studio é uma aplicação inteira do lado do cliente: autenticação,
   roteamento e dados, tudo acontece no navegador depois da hidratação. A
   casca HTML desta página não muda por requisição, então força-se estática
   para o Next servir a mesma casca já pronta em vez de recalculá-la a cada
   acesso. */
export const dynamic = "force-static";

/*
  A config do Sanity não é importada aqui: ver o comentário em
  `estudio-cliente.tsx`. Esta página fica só como casca de servidor, para
  exportar metadata/viewport, e delega toda a renderização ao componente
  cliente.
*/
export default function PaginaStudio() {
  return <EstudioCliente />;
}
