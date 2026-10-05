import Link from "next/link";
import type { ReactNode } from "react";
import { Icone } from "@/components/base/IconeServidor";
import busca from "@/components/busca/FaixaDaBusca.module.css";
import faixa from "@/components/layout/FaixaCurta.module.css";
import type { VoltaDaPagina } from "@/lib/paginaDeTexto";

/*
  A faixa verde curta de ponta a ponta que abre a página de cada
  especialidade (components/especialidades/FaixaDaEspecialidade.tsx), a
  diretoria, as páginas de texto, a lista de notícias, a notícia aberta e o
  contato (os desenhos aprovados: docs/desenho-aprovado/associacao/ e
  docs/desenho-aprovado/noticias-contato/, `.busca-topo.esp-topo`).
  - No alto, o link de volta (`volta`: "← ESPECIALIDADES",
    "← A ASSOCIAÇÃO", "← INÍCIO", "← NOTÍCIAS"), com a classe global
    `.link-de-volta` (app/globals.css), a mesma do perfil; ou, na página
    que abre uma seção do menu, um rótulo simples (`rotulo`: "NOTÍCIAS",
    "CONTATO").
  - O título e o resumo.
  - `children` entra logo depois do resumo: a pílula do mandato, na
    diretoria; quem assina, na notícia aberta.
  - `className` vai no fim da classe da faixa, para a página que põe
    regras suas sobre ela.

  Sem campo de busca, sem `Cabeceira` e sem trilha.

  O CSS é o da faixa da busca (components/busca/FaixaDaBusca.module.css) e
  o próprio (FaixaCurta.module.css): o texto numa coluna só.

  - `data-abertura`: a barra do pé do celular aparece quando esta faixa sai
    da tela (components/layout/BarraDoPe.tsx).
  - `data-faixa`: a faixa fica fora da coluna da página
    (app/(site)/encontre.module.css).
*/
type AltoDaFaixa = { volta: VoltaDaPagina; rotulo?: undefined } | { rotulo: string; volta?: undefined };

export function FaixaCurta({
  volta,
  rotulo,
  titulo,
  texto,
  className,
  children,
}: AltoDaFaixa & {
  titulo: string;
  texto: string;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <section
      data-bloco="topo"
      data-faixa=""
      data-abertura=""
      aria-labelledby="pagina-titulo"
      className={`textura-verde ${busca.faixa} ${faixa.especialidade}${className ? ` ${className}` : ""}`}
    >
      <div className="brilho" aria-hidden="true"></div>

      <div>
        {volta ? (
          <Link href={volta.href} className={`rotulo-secao link-de-volta ${busca.sobre}`} data-coluna="">
            <Icone nome="voltar" /> {volta.rotulo}
          </Link>
        ) : (
          <span className={`rotulo-secao ${busca.sobre}`} data-coluna="">
            {rotulo}
          </span>
        )}
        <h1 id="pagina-titulo" className={busca.titulo}>
          {titulo}
        </h1>
        <p className={busca.texto}>{texto}</p>
        {children}
      </div>
    </section>
  );
}
