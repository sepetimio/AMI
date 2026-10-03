import styles from "@/components/home/EmpresasParceiras.module.css";

/*
  Os espaços dos logotipos das empresas parceiras da AMI, com o
  `.logo-vazio` do desenho aprovado: caixa tracejada com "Logotipo a
  entrar". O título e o rótulo da parte são de `BairrosEParceiros`, que
  monta esta grade dentro da faixa branca.

  Hoje é INTEIRA provisória: o cliente pediu, em 03/10/2026, para ver o
  lugar dos parceiros antes de ter qualquer um. São seis espaços e nenhum
  nome de empresa — escrever um nome aqui seria anunciar uma parceria que
  não existe.

  Este componente não decide se aparece. Quem decide é `moldurasDaHome`, em
  lib/molduras.ts, e só no modo demonstração.

  Seis lado a lado no computador, três por linha abaixo de 980px e no
  celular (a versão final do desenho: duas linhas de três, nada cortado na
  borda).
*/
const ESPACOS = 6;

export function EmpresasParceiras() {
  return (
    <ul className={styles.parceiros}>
      {Array.from({ length: ESPACOS }, (_, i) => (
        <li key={i} className={styles.logoVazio}>
          Logotipo a entrar
        </li>
      ))}
    </ul>
  );
}
