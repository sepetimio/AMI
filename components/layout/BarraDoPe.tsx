"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icone } from "@/components/base/Icone";
import { AMI, hrefTelefone } from "@/lib/ami";
import {
  deveMostrarBarra,
  destinoDaBusca,
  passouDoTopo,
} from "@/lib/barra-do-pe";
import styles from "@/components/layout/BarraDoPe.module.css";

/*
  Barra de atalhos no pé da tela, só no celular (a regra de largura está em
  `BarraDoPe.module.css`, onde o display é `none` acima de 700px).

  Dois atalhos: "Encontrar médico" e "Ligar". Quando ela aparece está em
  `lib/barra-do-pe.ts`. Este componente mede o que a decisão pede: onde está o
  fundo do bloco de abertura (o carrossel, `[data-bloco="carrossel"]`, ou a
  faixa verde do topo, `[data-abertura]`), quanto a página rolou e se o bloco de
  busca (`#encontre`) está na tela. Nenhum dos dois blocos existe em toda
  página, e a ausência de qualquer um é aceita: sem bloco de abertura vale a
  rolagem, sem bloco de busca a barra nunca some por causa dele.

  Na home, na busca e no índice de especialidades o botão leva ao campo de
  busca da própria página e, passado o tempo do pulo, põe o cursor nele
  para a pessoa já poder digitar. Fora delas leva a `/busca`, e a página
  nova cuida do próprio foco.
*/
const ESPERA_DO_PULO_MS = 600;

export function BarraDoPe() {
  const caminho = usePathname();
  const [visivel, setVisivel] = useState(false);

  useEffect(() => {
    /* O bloco que abre a página: o carrossel da home ou a faixa verde do
       topo (`data-abertura`). */
    const abertura = document.querySelector('[data-bloco="carrossel"], [data-abertura]');
    const blocoDeBusca = document.getElementById("encontre");
    let buscaNaTela = false;

    const atualizar = () => {
      const passou = passouDoTopo(
        abertura ? abertura.getBoundingClientRect().bottom : null,
        window.scrollY,
      );
      /* Procurada a cada vez, e não uma só no começo: vale mesmo se a
         barra do perfil entrar na página depois deste efeito. */
      const barraDoMedico = document.querySelector("[data-barra-do-medico]") !== null;
      setVisivel(deveMostrarBarra(passou, buscaNaTela, barraDoMedico));
    };

    const observador = blocoDeBusca
      ? new IntersectionObserver(
          (entradas) => {
            buscaNaTela = entradas[0].isIntersecting;
            atualizar();
          },
          { threshold: 0.2 },
        )
      : null;
    observador?.observe(blocoDeBusca!);

    window.addEventListener("scroll", atualizar, { passive: true });
    atualizar();

    return () => {
      observador?.disconnect();
      window.removeEventListener("scroll", atualizar);
    };
  }, [caminho]);

  const destino = destinoDaBusca(caminho);

  const focarOCampo = () => {
    window.setTimeout(() => {
      document
        .querySelector<HTMLInputElement>("#encontre input")
        ?.focus({ preventScroll: true });
    }, ESPERA_DO_PULO_MS);
  };

  return (
    <nav
      aria-label="Atalhos"
      className={`${styles.barra} ${visivel ? styles.visivel : ""}`}
    >
      {destino === "#encontre" ? (
        <a href="#encontre" className={`botao ${styles.buscar}`} onClick={focarOCampo}>
          <Icone nome="lupa" tamanho={18} /> Encontrar médico
        </a>
      ) : (
        <Link href="/busca" className={`botao ${styles.buscar}`}>
          <Icone nome="lupa" tamanho={18} /> Encontrar médico
        </Link>
      )}
      <a
        href={hrefTelefone(AMI.telefones[0])}
        className={styles.ligar}
        aria-label="Ligar para a AMI"
      >
        <Icone nome="telefone" tamanho={18} /> Ligar
      </a>
    </nav>
  );
}
