import type { Metadata } from "next";
import styles from "@/app/(site)/inicio.module.css";
import { UltimasNoticias } from "@/components/editorial/UltimasNoticias";
import { Carrossel } from "@/components/home/Carrossel";
import { EncontreUmMedico } from "@/components/home/EncontreUmMedico";
import { NumerosDaAmi } from "@/components/home/NumerosDaAmi";
import { Parceiros } from "@/components/home/Parceiros";
import { SejaAssociado } from "@/components/home/SejaAssociado";
import { SuaAmi } from "@/components/home/SuaAmi";
import { JsonLd } from "@/components/seo/JsonLd";
import { AMI, anosDeAmi } from "@/lib/ami";
import { organizationAmi } from "@/lib/seo/jsonld";
import { especialidadesComContagem } from "@/lib/dados/especialidades";
import { buscarMedicos } from "@/lib/dados/medicos";
import { DADOS_DEMONSTRACAO } from "@/lib/demonstracao";
import { moldurasDaHome, type TextoInstitucional } from "@/lib/molduras";
import { bannersAtivos } from "@/lib/sanity/banners";
import { listarNoticias } from "@/lib/sanity/consultas";

export const revalidate = 3600;

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

/* Missão, visão e valores: a AMI ainda não entregou os textos, e não há
   onde guardá-los. Com `null`, "Quem é a AMI?" mostra "Texto da AMI a
   entrar." na demonstração e nenhum cartão fora dela (`quemEhAmi`, em
   lib/molduras.ts). */
const TEXTO_DA_AMI: TextoInstitucional = { missao: null, visao: null, valores: null };

export async function generateMetadata(): Promise<Metadata> {
  /* Não soma as contagens por especialidade: quem tem duas especialidades
     entraria duas vezes ali, e o total deixaria de bater com a contagem real
     de profissionais publicados que `/busca` lista. `buscarMedicos` já é
     memoizada por requisição, então isto não custa uma segunda ida ao banco. */
  const [especialidades, total] = await Promise.all([
    especialidadesComContagem(),
    buscarMedicos().then((m) => m.length),
  ]);

  return {
    title: "Associação Médica de Imperatriz",
    description:
      `${total} médicos e ${especialidades.length} especialidades em ` +
      `Imperatriz - MA. Busque por nome ou especialidade.`,
    alternates: { canonical: "/" },
  };
}

/*
  A home, na ordem da spec da reforma visual (seção 6): carrossel, números,
  a busca verde, "Sua AMI", "Seja associado" com "Quem é a AMI?", notícias
  e parceiros. O rodapé vem do layout.

  Os blocos são filhos diretos de um só invólucro. Os da coluna centralizada
  (carrossel, números, "Sua AMI", notícias) ganham a largura da coluna pelo
  CSS; as faixas de ponta a ponta (a busca, "Seja associado" e os parceiros,
  as três com `data-faixa`) ficam com a largura da página. O espaço entre os
  blocos é um só, `--ritmo`. As regras e o porquê estão em inicio.module.css.

  Cada bloco que pode faltar devolve `null` sozinho, e então não sobra nada
  dele na página: nem caixa vazia, nem espaço.
*/
export default async function Home() {
  /* Mesmo raciocínio do `generateMetadata`: o total vem da contagem de
     profissionais, não da soma por especialidade, que double-conta quem tem
     mais de uma. */
  const [especialidades, total, banners, noticias] = await Promise.all([
    especialidadesComContagem(),
    buscarMedicos().then((m) => m.length),
    bannersAtivos(),
    listarNoticias(1),
  ]);

  /* As molduras "a entrar" e a trava que as segura: só no modo
     demonstração, e nunca misturadas a conteúdo real. A decisão do
     carrossel, das notícias e dos parceiros mora em lib/molduras.ts; "Sua
     AMI" e "Seja associado" recebem a chave e decidem sozinhos. */
  const molduras = moldurasDaHome(DADOS_DEMONSTRACAO, {
    banners,
    temNoticia: noticias.length > 0,
  });

  return (
    <div className={styles.home}>
      <JsonLd dados={organizationAmi(SITE)} />

      {/* O nome da associação, para o leitor de tela e o Google. Na tela,
          quem o diz é o logotipo do cabeçalho. Fica logo antes do primeiro
          bloco: é por ele que o CSS acha o primeiro. */}
      <h1 className="sr-only">{AMI.razaoSocial}</h1>

      <Carrossel itens={molduras.banners} />

      <NumerosDaAmi
        anos={anosDeAmi(new Date())}
        medicos={total}
        especialidades={especialidades.length}
      />

      <EncontreUmMedico especialidades={especialidades} />

      <SuaAmi demonstracao={DADOS_DEMONSTRACAO} />

      <SejaAssociado demonstracao={DADOS_DEMONSTRACAO} texto={TEXTO_DA_AMI} />

      <UltimasNoticias provisorias={molduras.noticiasProvisorias} />

      <Parceiros parceiros={molduras.parceiros} />
    </div>
  );
}
