import type { Metadata } from "next";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { ListaMedicos } from "@/components/diretorio/ListaMedicos";
import { PainelFiltros } from "@/components/diretorio/PainelFiltros";
import { filtrosDaQuery } from "@/lib/dados/urlFiltros";
import { buscarMedicos } from "@/lib/dados/medicos";
import { bairrosComContagem } from "@/lib/dados/especialidades";
import { contagem } from "@/lib/formato";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/*
  Busca livre. Fora do índice de propósito: cada termo digitado geraria um
  endereço novo e quase idêntico aos outros, e é exatamente esse tipo de
  página que faz o Google classificar um diretório como conteúdo raso.
  `follow` mantém os links de resultado rastreáveis.
*/
export const metadata: Metadata = {
  title: "Buscar médicos em Imperatriz - MA | AMI",
  robots: { index: false, follow: true },
};

export default async function PaginaBusca({ searchParams }: Props) {
  const filtros = filtrosDaQuery(await searchParams);
  const temFiltro = Object.keys(filtros).some((c) => c !== "ordem");
  const [medicos, bairros] = await Promise.all([
    buscarMedicos(filtros),
    bairrosComContagem(),
  ]);

  const trilha = [
    { nome: "Início", caminho: "/" },
    { nome: "Buscar", caminho: "/busca" },
  ];

  return (
    <div className="mx-auto max-w-[1200px] px-4 md:px-6">
      <Breadcrumb itens={trilha} />

      <div className="pb-8 pt-4">
        {/* H1 dinâmico: quem chegou por uma busca precisa ver o que buscou. */}
        <h1>
          {filtros.termo
            ? `Resultados para “${filtros.termo}”`
            : "Buscar médicos em Imperatriz"}
        </h1>
        <p className="numero-tabular mt-3 text-ink-600">
          {contagem(
            medicos.length,
            "profissional encontrado",
            "profissionais encontrados",
          )}
          {filtros.termo || temFiltro
            ? "."
            : " no diretório. Use os filtros ao lado ou escolha uma especialidade."}
        </p>
      </div>

      <div className="grid gap-8 pb-16 md:grid-cols-[260px_1fr]">
        <PainelFiltros bairros={bairros} total={medicos.length} />
        <div>
          <h2 className="sr-only">Resultados</h2>
          <ListaMedicos
            medicos={medicos}
            /*
              Mesmo raciocínio da página de especialidade — acessibilidade,
              depois bairro, depois o resto — só que a busca livre aceita mais
              filtros, então a cadeia continua em vez de cair direto num
              `undefined`. Sem checar o que está de fato ativo, uma busca só
              por acessibilidade (`?acessibilidade=interprete_libras`) sugeria
              remover um filtro de bairro que ninguém aplicou.
            */
            filtroMaisRestritivo={
              filtros.acessibilidade?.length
                ? "acessibilidade"
                : filtros.bairro
                  ? "bairro"
                  : filtros.termo
                    ? "termo digitado"
                    : filtros.telemedicina
                      ? "telemedicina"
                      : filtros.somenteAssociados
                        ? "associados"
                        : undefined
            }
            saida={{
              rotulo: "Ver todas as especialidades",
              href: "/medicos",
            }}
          />
        </div>
      </div>
    </div>
  );
}
