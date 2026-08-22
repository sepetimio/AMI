import Link from "next/link";
import { AMI, telefoneParaLigar } from "@/lib/ami";
import { bairrosComContagem, especialidadesComContagem } from "@/lib/dados/especialidades";
import { DADOS_DEMONSTRACAO } from "@/lib/demonstracao";

/*
  Rodapé em verde-950, o tom mais profundo da escala, com o topo arredondado.

  O canto arredondado no alto é o que faz o rodapé pousar sobre o cinza da
  página em vez de fechar a tela com um bloco retangular de borda a borda. É o
  mesmo princípio do cabeçalho flutuante, na outra ponta.

  Antes era verde-900. A marca não entra aqui: sendo verde-escura sobre fundo
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
    <footer className="mt-24 rounded-t-painel bg-ami-green-950 text-ami-mint-400">
      <div className="mx-auto max-w-[1240px] px-5 py-16 md:px-8 md:py-20">
        <p className="text-[24px] font-semibold leading-[1.15] tracking-[-0.02em] text-white">
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
                className="text-[13px] font-medium uppercase tracking-[0.09em] text-white/70"
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
                className="text-[13px] font-medium uppercase tracking-[0.09em] text-white/70"
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
              className="text-[13px] font-medium uppercase tracking-[0.09em] text-white/70"
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
              <li>
                <Link
                  href="/associacao/diretoria"
                  className="flex items-center py-1 hover:text-white hover:underline max-md:min-h-11 max-md:py-0"
                >
                  Diretoria
                </Link>
              </li>
              <li>
                <Link
                  href="/noticias"
                  className="flex items-center py-1 hover:text-white hover:underline max-md:min-h-11 max-md:py-0"
                >
                  Notícias
                </Link>
              </li>
              <li>
                <Link
                  href="/associacao/beneficios"
                  className="flex items-center py-1 hover:text-white hover:underline max-md:min-h-11 max-md:py-0"
                >
                  Benefícios
                </Link>
              </li>
            </ul>
          </nav>

          <div>
            <h2 className="text-[13px] font-medium uppercase tracking-[0.09em] text-white/70">
              Contato
            </h2>
            {/*
              Endereço e telefone vêm de `lib/ami.ts`, que é a fonte única.
              O critério de negócio local do Google pede que nome, endereço e
              telefone sejam idênticos em todo lugar do site e iguais ao perfil
              da empresa. Escrito à mão aqui, divergiria do dado estruturado na
              primeira correção, sem erro em lugar nenhum.
            */}
            <address className="mt-3 space-y-1.5 text-[15px] not-italic">
              <p>
                {AMI.endereco.logradouro}, {AMI.endereco.numero}
                <br />
                {AMI.endereco.bairro}, {AMI.endereco.cidade} -{" "}
                {AMI.endereco.uf}
                <br />
                <span className="registro">CEP {AMI.endereco.cep}</span>
              </p>

              {/* Telefone clicável: no celular, que é a maioria do acesso,
                  ligar é a ação mais provável de quem chegou até aqui. */}
              <ul className="space-y-1 pt-1">
                {AMI.telefones.map((t) => (
                  <li key={t}>
                    <a
                      href={telefoneParaLigar(t)}
                      className="registro pressiona inline-flex items-center hover:text-white hover:underline max-md:min-h-11"
                    >
                      {t}
                    </a>
                  </li>
                ))}
              </ul>

              <p className="pt-2">
                <a
                  href={AMI.redes.instagram}
                  className="pressiona inline-flex items-center hover:text-white hover:underline max-md:min-h-11"
                >
                  Instagram
                </a>
              </p>
            </address>
          </div>
        </div>

        <div className="mt-14 border-t border-white/10 pt-8 text-[15px]">
          {/*
            Os três links dão 404 hoje: o Sanity ainda não tem o texto de
            nenhuma das três páginas legais, e cada uma chama `notFound()`
            nesse caso. É esperado, não é defeito desta tarefa. Diferente do
            sitemap (que não pode convidar um robô para um 404), o rodapé é
            navegação para gente, e um rodapé sem link para política de
            privacidade e termos de uso é o problema maior num site que lida
            com dado de saúde. O link some sozinho da lista quando a AMI
            escrever o texto: nada aqui muda nesse dia.
          */}
          <nav aria-label="Informações legais">
            <ul className="flex flex-wrap gap-x-6 gap-y-1">
              {[
                { rotulo: "Política de privacidade", href: "/politica-de-privacidade" },
                { rotulo: "Termos de uso", href: "/termos-de-uso" },
                { rotulo: "Política de cookies", href: "/politica-de-cookies" },
              ].map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="flex items-center py-1 hover:text-white hover:underline max-md:min-h-11 max-md:py-0"
                  >
                    {l.rotulo}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <p className="mt-6">
            {AMI.razaoSocial}, {AMI.naturezaJuridica}, em atividade desde{" "}
            {AMI.fundadaEm}
            <br />
            <span className="registro">CNPJ {AMI.cnpj}</span>
          </p>
          <p className="mt-2">
            O conteúdo deste site é informativo e não substitui a consulta
            médica.
          </p>
          {/* Some no mesmo instante em que o robots.txt abre o site: as duas
              partes leem a mesma trava (lib/demonstracao.ts). Afirmar que os
              perfis são fictícios depois da carga do cadastro real seria
              desmentir 500 médicos de verdade no rodapé de toda página. */}
          {DADOS_DEMONSTRACAO ? (
            <p className="mt-2 text-ami-mint-400/80">
              Os dados de profissionais exibidos são fictícios, para
              demonstração, até a carga do cadastro oficial da AMI.
            </p>
          ) : null}
        </div>
      </div>
    </footer>
  );
}
