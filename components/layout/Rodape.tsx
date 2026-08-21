import Link from "next/link";
import { bairrosComContagem, especialidadesComContagem } from "@/lib/dados/especialidades";

/*
  Rodapé em verde-900. A marca não entra aqui: sendo verde-escura sobre fundo
  verde-escuro, ela sumiria. No lugar, o nome da associação em texto, na
  Archivo condensada — que é legível e acessível, o que uma imagem não seria.

  As listas de especialidade e bairro são o bloco de linkagem interna mais
  forte do site: garantem que nenhuma página de faceta fique a mais de dois
  cliques de qualquer outra.
*/
export async function Rodape() {
  const [especialidades, bairros] = await Promise.all([
    especialidadesComContagem(),
    bairrosComContagem(),
  ]);

  return (
    <footer className="mt-20 bg-ami-green-900 text-ami-mint-400">
      <div className="mx-auto max-w-[1200px] px-4 py-14 md:px-6">
        <p className="font-titulo text-[22px] font-bold uppercase leading-[1.05] tracking-[0.01em] text-white [font-stretch:80%]">
          Associação Médica
          <br />
          de Imperatriz
        </p>

        <div className="mt-10 grid gap-10 md:grid-cols-4">
          {/* Coluna só existe se houver o que listar: título sobre lista
              vazia promete navegação que não está lá. Acontece de verdade
              quando o projeto gratuito do Supabase hiberna. */}
          {especialidades.length > 0 ? (
            <nav aria-labelledby="rodape-especialidades">
              <h2
                id="rodape-especialidades"
                className="font-titulo text-xs font-bold uppercase tracking-[0.12em] text-white"
              >
                Especialidades
              </h2>
              <ul className="mt-3">
                {especialidades.slice(0, 20).map((e) => (
                  <li key={e.slug}>
                    <Link
                      href={`/medicos/${e.slug}`}
                      /* O alvo de 44px é regra de toque, então vale abaixo de
                         md. No desktop a lista fica densa de propósito: vinte
                         itens a 44px dariam quase novecentos pixels de coluna. */
                      className="flex items-center py-1 text-[15px] hover:text-white hover:underline max-md:min-h-11 max-md:py-0"
                    >
                      {e.nome}
                    </Link>
                  </li>
                ))}
                {/* O corte em 20 existe para o rodapé não virar uma parede de
                    texto, mas a promessa da coluna acima — nenhuma faceta a
                    mais de dois cliques de qualquer outra — só vale se sobrar
                    um caminho para o resto. Hoje, com 14 especialidades, isto
                    nunca aparece; no dia em que passar de 20, é o que evita
                    que a vigésima primeira fique inalcançável daqui. */}
                {especialidades.length > 20 ? (
                  <li>
                    <Link
                      href="/medicos"
                      className="flex items-center py-1 text-[15px] font-semibold text-white hover:underline max-md:min-h-11 max-md:py-0"
                    >
                      Ver todas as especialidades
                    </Link>
                  </li>
                ) : null}
              </ul>
            </nav>
          ) : null}

          {bairros.length > 0 ? (
            <nav aria-labelledby="rodape-bairros">
              <h2
                id="rodape-bairros"
                className="font-titulo text-xs font-bold uppercase tracking-[0.12em] text-white"
              >
                Bairros
              </h2>
              <ul className="mt-3">
                {bairros.map((b) => (
                  <li key={b.slug}>
                    <Link
                      href={`/busca?bairro=${b.slug}`}
                      className="flex items-center py-1 text-[15px] hover:text-white hover:underline max-md:min-h-11 max-md:py-0"
                    >
                      {b.nome}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ) : null}

          <nav aria-labelledby="rodape-institucional">
            <h2
              id="rodape-institucional"
              className="font-titulo text-xs font-bold uppercase tracking-[0.12em] text-white"
            >
              A Associação
            </h2>
            <ul className="mt-3 text-[15px]">
              <li>
                <Link
                  href="/associacao"
                  className="flex items-center py-1 hover:text-white hover:underline max-md:min-h-11 max-md:py-0"
                >
                  Quem somos
                </Link>
              </li>
              <li>
                <Link
                  href="/medicos"
                  className="flex items-center py-1 hover:text-white hover:underline max-md:min-h-11 max-md:py-0"
                >
                  Buscar médicos
                </Link>
              </li>
            </ul>
          </nav>

          <div>
            <h2 className="font-titulo text-xs font-bold uppercase tracking-[0.12em] text-white">
              Contato
            </h2>
            <address className="mt-3 space-y-1.5 text-[15px] not-italic">
              <p>[PROVISÓRIO] Endereço da sede</p>
              <p>Imperatriz - MA</p>
              <p className="numero-tabular">[PROVISÓRIO] (99) 0000-0000</p>
            </address>
          </div>
        </div>

        <div className="mt-12 border-t border-ami-green-700 pt-6 text-[15px]">
          <p>
            Associação Médica de Imperatriz · CNPJ [PROVISÓRIO]
          </p>
          <p className="mt-2">
            O conteúdo deste site é informativo e não substitui a consulta
            médica.
          </p>
          <p className="mt-2 text-ami-mint-400/80">
            Os dados de profissionais exibidos são fictícios, para
            demonstração, até a carga do cadastro oficial da AMI.
          </p>
        </div>
      </div>
    </footer>
  );
}
