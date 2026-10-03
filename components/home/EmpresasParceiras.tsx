import { MolduraProvisoria } from "@/components/base/MolduraProvisoria";

/*
  Empresas parceiras da AMI: a faixa que fecha a home.

  Hoje é INTEIRA provisória: o cliente pediu, em 03/10/2026, para ver o
  lugar dos parceiros antes de ter qualquer um. São seis espaços "Logotipo a
  entrar" e nenhum nome de empresa — escrever um nome aqui seria anunciar
  uma parceria que não existe.

  Este componente não decide se aparece. Quem decide é `moldurasDaHome`, em
  lib/molduras.ts, e só no modo demonstração: fora dele a faixa não é
  montada, e a home termina em "Onde os médicos atendem", como antes.

  A proporção 3 × 2 dos espaços é escolha minha, não medida: não há logotipo
  real nem padrão de arte combinado para eles ainda. No dia em que houver,
  a proporção acompanha o padrão.

  Grade de 3 do tablet para cima (duas linhas de 3) e 2 no celular. Seis lado
  a lado foi medido e recusado em 03/10/2026: a 1024 cada espaço tinha 147px
  e a tarja "Logotipo a entrar" quebrava em duas linhas, cobrindo 74 dos 98px
  de altura. Com 3, ela cabe numa linha a 768, 1024 e 1280. No celular ainda
  quebra em duas (74 dos 109px a 375); uma coluna só caberia numa linha, mas
  faria seis blocos de 229px de altura em fila.
*/
const ESPACOS = 6;

export function EmpresasParceiras() {
  return (
    <section aria-labelledby="parceiros" className="revelar border-t border-line">
      <div className="mx-auto max-w-[1200px] px-4 py-16 md:px-6 md:py-20">
        <h2 id="parceiros">Empresas parceiras da AMI</h2>

        <ul className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3">
          {Array.from({ length: ESPACOS }, (_, i) => (
            <li key={i}>
              <MolduraProvisoria
                largura={3}
                altura={2}
                rotulo="Espaço reservado para o logotipo de uma empresa parceira"
                legenda="Logotipo a entrar"
                className="rounded-bloco"
              />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
