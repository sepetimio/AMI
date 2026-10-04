import Link from "next/link";
import type { ReactNode } from "react";
import { Icone, type NomeIcone } from "@/components/base/IconeServidor";
import busca from "@/components/busca/FaixaDaBusca.module.css";
import faixa from "@/components/layout/FaixaCurta.module.css";
import type { VoltaDaPagina } from "@/lib/paginaDeTexto";

/*
  A faixa verde curta de ponta a ponta que abre a página de cada
  especialidade (components/especialidades/FaixaDaEspecialidade.tsx), a
  diretoria e as páginas de texto (o desenho aprovado:
  docs/desenho-aprovado/associacao/, `.busca-topo.esp-topo`).
  - No lugar do rótulo, o link de volta ("← ESPECIALIDADES",
    "← A ASSOCIAÇÃO", "← INÍCIO"), com a classe global `.link-de-volta`
    (app/globals.css), a mesma do perfil.
  - O título e o resumo.
  - `children` entra logo depois do resumo: a pílula do mandato, na
    diretoria.
  - À direita, o ícone da página num ladrilho de vidro, que some no
    celular.

  Sem campo de busca, sem `Cabeceira` e sem trilha.

  O CSS é o da faixa da busca (components/busca/FaixaDaBusca.module.css) e
  o próprio (FaixaCurta.module.css): texto à esquerda e o ladrilho à
  direita.

  - `data-abertura`: a barra do pé do celular aparece quando esta faixa sai
    da tela (components/layout/BarraDoPe.tsx).
  - `data-faixa`: a faixa fica fora da coluna da página
    (app/(site)/encontre.module.css).
*/
export function FaixaCurta({
  volta,
  titulo,
  texto,
  icone,
  children,
}: {
  volta: VoltaDaPagina;
  titulo: string;
  texto: string;
  icone: NomeIcone;
  children?: ReactNode;
}) {
  return (
    <section
      data-bloco="topo"
      data-faixa=""
      data-abertura=""
      aria-labelledby="pagina-titulo"
      className={`textura-verde ${busca.faixa} ${faixa.especialidade}`}
    >
      <div className="brilho" aria-hidden="true"></div>

      <div>
        <Link href={volta.href} className={`rotulo-secao link-de-volta ${busca.sobre}`} data-coluna="">
          <Icone nome="voltar" /> {volta.rotulo}
        </Link>
        <h1 id="pagina-titulo" className={busca.titulo}>
          {titulo}
        </h1>
        <p className={busca.texto}>{texto}</p>
        {children}
      </div>

      <div className={faixa.selo} aria-hidden="true">
        <Icone nome={icone} duotone tamanho={84} />
      </div>
    </section>
  );
}
