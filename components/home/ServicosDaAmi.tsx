import Link from "next/link";
import { AMI } from "@/lib/ami";
import { formatarTelefone } from "@/lib/formato";

/*
  Os três serviços da AMI, um quarto provisório (ver abaixo), mais um bloco
  de notícia.

  O primeiro cartão é o único campo de digitar da home, e um dos dois do
  site público — o outro é o do painel de filtros de `/busca`
  (components/diretorio/PainelFiltros.tsx), que só serve a quem já chegou
  lá; este é o que leva até lá por clique. O herói
  antigo — apagado quando esta seção nasceu — carregava um formulário GET
  para `/busca`, e com ele foi embora o único caminho de clique para
  procurar médico pelo nome: `/medicos` é índice por especialidade e bairro,
  e `/busca` só era alcançável por link de bairro já filtrado. `?termo=` só
  funcionava digitando na barra de endereço, enquanto a página de rascunhos
  legais (lib/rascunhosLegais.ts) continuava dizendo ao visitante que a
  ordem dos resultados usa "correspondência do termo buscado no nome e na
  especialidade".

  Por isso este cartão não é um `<Link>`, e os outros são: `<form>`
  dentro de `<a>` é HTML inválido, e o navegador desmonta a árvore. O cartão
  vira uma caixa comum, com dois caminhos dentro dela — o formulário, para
  quem sabe o nome, e o link para o índice, para quem não sabe. Perder o
  hover de cartão inteiro é consequência desejada: só o que de fato leva a
  algum lugar (o botão e o link) deve parecer clicável.

  Três cartões são de serviço que já existe. Os dois primeiros mostram algo VIVO que o menu do
  topo não mostra — senão a grade seria um segundo menu: o primeiro traz a
  contagem de médicos e especialidades, o segundo o telefone. O terceiro,
  "Seja associado", é o único sem dado vivo — de propósito, não por
  esquecimento: o que ele precisaria mostrar (quanto custa, o que o
  associado ganha) é texto que a AMI ainda não escreveu, e inventar um
  número aqui seria fabricar dado.

  A manchete mais recente não é cartão da grade — é um bloco à parte,
  abaixo dela e fora do `grid`, do tamanho da linha inteira.

  O quarto cartão, "Sua AMI" (aluguel de auditório e hall de eventos), é
  PROVISÓRIO: o serviço ainda não existe, e o cliente pediu para vê-lo no
  lugar em 03/10/2026. Sai só com `suaAmi` verdadeiro — quem decide é
  `moldurasDaHome`, em lib/molduras.ts, e o padrão `false` faz quem esquecer
  de passar a prop ficar com a grade de três, nunca com o provisório. O
  cartão diz "Serviço a entrar" e tem fio tracejado, para o cliente não
  confundir com serviço que já funciona. Não traz preço, capacidade,
  metragem, horário nem foto: nada disso foi dado, e inventar seria fabricar.

  Com quatro cartões, 2 por linha do tablet para cima (2 × 2) e 1 no
  celular; com três, a grade de antes. Quatro lado a lado foi medido e
  recusado em 03/10/2026: o campo de busca do primeiro cartão caía de 226px
  para 128px a 1280 e 81px a 1024, e é o único campo de digitar da home.
*/
export function ServicosDaAmi({
  total,
  especialidades,
  ultimaNoticia,
  suaAmi = false,
}: {
  total: number;
  especialidades: number;
  ultimaNoticia: { titulo: string; slug: string } | null;
  suaAmi?: boolean;
}) {
  const fixo = AMI.telefones[0];

  return (
    <section className="mx-auto max-w-[1200px] px-4 py-16 md:px-6 md:py-20">
      <h2 className="font-titulo text-[15px] font-bold uppercase tracking-[0.1em] text-ink-400">
        Serviços da AMI
      </h2>

      <div
        className={`mt-6 grid gap-4 ${suaAmi ? "md:grid-cols-2" : "md:grid-cols-3"}`}
      >
        <div className="rounded-bloco border border-line bg-surface p-6">
          <h3 className="text-[21px] font-semibold text-ink-900">Encontre um médico</h3>

          {/* Formulário HTML de verdade, com method GET, como era no herói:
              funciona sem JavaScript e o resultado vira uma URL
              compartilhável. O nome do campo é `termo` porque é o que
              `filtrosDaQuery` lê — ver lib/dados/urlFiltros.ts. */}
          <form action="/busca" method="get" className="mt-4">
            <label
              htmlFor="busca-termo"
              className="block text-[15px] font-medium text-ink-600"
            >
              Nome ou especialidade
            </label>
            <div className="mt-2 flex gap-2">
              <input
                id="busca-termo"
                name="termo"
                type="search"
                placeholder="Nome do médico ou especialidade"
                className="pressiona min-h-12 w-full min-w-0 flex-1 rounded-controle border border-line bg-canvas px-3.5 text-[16px] placeholder:text-ink-300 focus:border-ami-green-600 focus:bg-surface"
              />
              <button
                type="submit"
                className="pressiona min-h-12 shrink-0 rounded-controle bg-ami-green-600 px-5 font-semibold text-white shadow-apoio hover:bg-ami-green-700 hover:shadow-erguido"
              >
                Buscar
              </button>
            </div>
          </form>

          {/* O caminho de quem não sabe o nome de ninguém continua aberto: o
              índice por especialidade e bairro é `/medicos`, e é ele que
              carrega a contagem viva. */}
          <p className="registro mt-4 text-[15px] text-ink-400">
            {total} {total === 1 ? "profissional" : "profissionais"} em{" "}
            {especialidades} {especialidades === 1 ? "especialidade" : "especialidades"}
            .{" "}
            <Link
              href="/medicos"
              className="pressiona font-semibold text-ami-green-600 hover:underline"
            >
              Ver todas as especialidades
            </Link>
          </p>
        </div>

        <Link
          href="/contato"
          className="pressiona rounded-bloco border border-line bg-surface p-6 hover:border-ami-green-600 hover:shadow-erguido"
        >
          <h3 className="text-[21px] font-semibold text-ink-900">Fale com a AMI</h3>
          <p className="registro mt-3 text-[15px] text-ink-400">
            {formatarTelefone(fixo)}
          </p>
        </Link>

        <Link
          href="/associacao/seja-associado"
          className="pressiona rounded-bloco border border-line bg-surface p-6 hover:border-ami-green-600 hover:shadow-erguido"
        >
          <h3 className="text-[21px] font-semibold text-ink-900">Seja associado</h3>
          <p className="mt-3 text-[15px] text-ink-400">
            Médico com inscrição no CRM pode se associar à AMI.
          </p>
        </Link>

        {suaAmi ? (
          <Link
            href="/contato"
            className="pressiona rounded-bloco border border-dashed border-line-strong bg-surface p-6 hover:border-ami-green-600 hover:shadow-erguido"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
              <h3 className="text-[21px] font-semibold text-ink-900">Sua AMI</h3>
              <span className="text-[12px] font-semibold uppercase tracking-[0.09em] text-ink-400">
                Serviço a entrar
              </span>
            </div>
            <p className="mt-3 text-[15px] text-ink-400">
              Auditório e hall de eventos da AMI para alugar.
            </p>
            <p className="mt-3 text-[15px] font-semibold text-ami-green-600">
              Consultar disponibilidade
            </p>
          </Link>
        ) : null}
      </div>

      {ultimaNoticia ? (
        <Link
          href={`/noticias/${ultimaNoticia.slug}`}
          className="pressiona mt-4 block rounded-bloco border border-line bg-surface p-6 hover:border-ami-green-600 hover:shadow-erguido"
        >
          <h3 className="font-titulo text-[13px] font-bold uppercase tracking-[0.1em] text-ink-400">
            Última notícia
          </h3>
          <p className="mt-2 text-[19px] font-semibold text-ink-900">
            {ultimaNoticia.titulo}
          </p>
        </Link>
      ) : null}
    </section>
  );
}
