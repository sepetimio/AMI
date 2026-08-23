import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { Chip } from "@/components/base/Chip";
import { Placa } from "@/components/diretorio/Placa";
import { LinhaMedico } from "@/components/diretorio/LinhaMedico";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbList, physician } from "@/lib/seo/jsonld";
import { buscarMedicos, medicoPorSlug, slugsDeMedicos } from "@/lib/dados/medicos";
import { descricaoMedico, tituloMedico } from "@/lib/seo/metadados";
import { formatarTelefone, identificacaoMedica } from "@/lib/formato";
import { ROTULO_ACESSIBILIDADE } from "@/lib/dados/tipos";

export const revalidate = 3600;

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const slugs = await slugsDeMedicos();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const m = await medicoPorSlug(slug);
  if (!m) return {};

  const principal = m.especialidades.find((e) => e.principal) ?? m.especialidades[0];
  const bairros = [...new Set(m.locais.map((l) => l.bairro.nome))];

  return {
    title: tituloMedico(m.nome, principal?.nome ?? null),
    description: descricaoMedico(m.nome, principal?.nome ?? null, bairros),
    alternates: { canonical: `/medico/${slug}` },
  };
}

export default async function PaginaPerfil({ params }: Props) {
  const { slug } = await params;
  const m = await medicoPorSlug(slug);
  if (!m) notFound();

  const principal = m.especialidades.find((e) => e.principal) ?? m.especialidades[0];
  const bairroPrincipal = m.locais[0]?.bairro;

  /* Profissionais relacionados: linkam para a especialidade e o bairro, o que
     costura a malha interna do site. */
  const relacionados = principal
    ? (await buscarMedicos({ especialidade: principal.slug }))
        .filter((outro) => outro.slug !== m.slug)
        .slice(0, 4)
    : [];

  const trilha = [
    { nome: "Início", caminho: "/" },
    { nome: "Médicos", caminho: "/medicos" },
    ...(principal
      ? [{ nome: principal.nome, caminho: `/medicos/${principal.slug}` }]
      : []),
    { nome: m.nome, caminho: `/medico/${m.slug}` },
  ];

  return (
    <div className="mx-auto max-w-[1200px] px-4 pb-16 md:px-6">
      <JsonLd dados={physician(m, SITE)} />
      <JsonLd dados={breadcrumbList(trilha, SITE)} />
      <Breadcrumb itens={trilha} />

      {/*
        Cabeçalho como bloco erguido, não como texto solto sobre o fundo.

        A versão anterior era o nome, duas linhas cinzas e dois chips
        empilhados direto na página, sem nada que dissesse "esta pessoa é o
        assunto daqui". Num diretório, o perfil é a página que mais precisa
        disso: é onde a busca termina.

        A placa repete, em 108px, o mesmo elemento que a linha de resultado
        mostra em 76px. Quem clicou reconhece que chegou no lugar certo.
      */}
      <header className="mt-1 rounded-bloco border border-line bg-surface p-6 shadow-erguido md:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:gap-7">
          <Placa nome={m.nome} foto={m.foto} tamanho={108} />

          <div className="min-w-0 flex-1">
            <h1 className="leading-[1.05]">{m.nome}</h1>

            {/* Nome e CRM com a palavra MÉDICO, exigência da Resolução CFM
                2.336/2023, Art. 4º, I. Em monoespaçada de registro porque é
                o dado que torna o profissional verificável no portal do
                Conselho. */}
            <p className="registro mt-3 text-[17px] font-semibold text-ink-600">
              {identificacaoMedica(m.crm, m.crmUf)}
            </p>

            {principal ? (
              <p className="mt-1 text-[17px] text-ink-600">
                {principal.nome}
                {principal.rqe ? (
                  <span className="registro text-[16px]"> RQE {principal.rqe}</span>
                ) : null}
              </p>
            ) : null}

            {m.associadoAmi || m.telemedicina ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {m.associadoAmi ? (
                  <Chip tom="associado">Associado AMI</Chip>
                ) : null}
                {m.telemedicina ? <Chip>Atende por telemedicina</Chip> : null}
              </div>
            ) : null}
          </div>
        </div>
      </header>

      <section aria-labelledby="locais" className="revelar pt-14">
        <h2 id="locais" className="pb-1">
          Onde atende
        </h2>

        <div className="mt-6 space-y-5">
          {m.locais.map((l) => (
            /* Cada endereço em painel próprio. Antes eram duas colunas soltas
               separadas por espaço em branco, e com dois consultórios ficava
               ambíguo qual telefone pertencia a qual endereço. O painel é o
               que responde essa pergunta sem uma palavra de explicação. */
            <div
              key={l.id}
              className="rounded-bloco border border-line bg-surface p-5 shadow-apoio md:p-6"
            >
              <div>
                <h3>{l.bairro.nome}</h3>
                <address className="mt-2 not-italic text-ink-600">
                  {[l.logradouro, l.numero].filter(Boolean).join(", ")}
                  <br />
                  {l.bairro.nome}, Imperatriz - MA
                </address>

                {l.telefone || l.whatsapp ? (
                  <p className="mt-4 flex flex-wrap gap-3">
                    {l.telefone ? (
                      <a
                        href={`tel:+55${l.telefone.replace(/\D/g, "")}`}
                        className="pressiona inline-flex min-h-11 items-center rounded-controle bg-ami-green-600 px-5 font-semibold text-white shadow-apoio hover:bg-ami-green-700 hover:shadow-erguido"
                      >
                        Ligar&nbsp;
                        <span className="registro">
                          {formatarTelefone(l.telefone)}
                        </span>
                      </a>
                    ) : null}
                    {l.whatsapp ? (
                      <a
                        href={`https://wa.me/55${l.whatsapp.replace(/\D/g, "")}`}
                        className="pressiona inline-flex min-h-11 items-center rounded-controle border border-line bg-canvas px-5 font-semibold text-ami-green-600 hover:border-ami-green-600 hover:bg-ami-mint-100"
                      >
                        WhatsApp&nbsp;
                        <span className="registro">
                          {formatarTelefone(l.whatsapp)}
                        </span>
                      </a>
                    ) : null}
                  </p>
                ) : null}

                {l.acessibilidade.length || l.estacionamento ? (
                  <ul className="mt-5 flex flex-wrap gap-2">
                    {l.acessibilidade.map((r) => (
                      <li key={r}>
                        <Chip>{ROTULO_ACESSIBILIDADE[r]}</Chip>
                      </li>
                    ))}
                    {l.estacionamento ? (
                      <li>
                        <Chip>Estacionamento</Chip>
                      </li>
                    ) : null}
                  </ul>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </section>

      {m.bio ? (
        <section aria-labelledby="sobre" className="revelar pt-14">
          <h2 id="sobre" className="pb-1">
            Sobre
          </h2>
          <p className="coluna-leitura mt-5 text-[18px] text-ink-600">
            {m.bio}
          </p>
        </section>
      ) : null}

      {relacionados.length ? (
        <section aria-labelledby="relacionados" className="revelar pt-14">
          <h2 id="relacionados" className="pb-1">
            Outros profissionais de {principal!.nome.toLowerCase()}
          </h2>
          <ul className="mt-6 grid gap-3">
            {relacionados.map((outro) => (
              <LinhaMedico key={outro.id} medico={outro} />
            ))}
          </ul>
          <p className="mt-6 flex flex-wrap gap-3">
            <Link
              href={`/medicos/${principal!.slug}`}
              className="pressiona inline-flex min-h-11 items-center rounded-controle border border-line-strong bg-surface px-5 text-[15px] font-semibold text-ami-green-600 hover:border-ami-green-600 hover:bg-ami-mint-100"
            >
              Todos de {principal!.nome.toLowerCase()}
            </Link>
            {bairroPrincipal ? (
              <Link
                href={`/medicos/${principal!.slug}/${bairroPrincipal.slug}`}
                className="pressiona inline-flex min-h-11 items-center rounded-controle border border-line-strong bg-surface px-5 text-[15px] font-semibold text-ami-green-600 hover:border-ami-green-600 hover:bg-ami-mint-100"
              >
                {principal!.nome} no bairro {bairroPrincipal.nome}
              </Link>
            ) : null}
          </p>
        </section>
      ) : null}

      {/* A nota de responsabilidade em bloco próprio, com fio à esquerda.
          Solta no fim da página ela lia como sobra de texto; enquadrada, lê
          como o que é: a nota de rodapé obrigatória de uma página de saúde. */}
      <p className="coluna-leitura mt-14 border-l-2 border-line-strong py-1 pl-5 text-[15px] text-ink-400">
        As informações desta página são fornecidas pelo profissional e revisadas
        pela Associação Médica de Imperatriz. Conteúdo informativo; não
        substitui a consulta médica.
      </p>
    </div>
  );
}
