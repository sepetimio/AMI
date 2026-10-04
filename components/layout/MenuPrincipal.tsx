"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icone } from "@/components/base/Icone";
import { deveFechar } from "@/lib/gaveta";
import type { ItemDoMenu } from "@/lib/menu";
import styles from "@/components/layout/Cabecalho.module.css";

/* Até esta largura (em px) o menu vira gaveta. O mesmo número está nas regras
   de `Cabecalho.module.css`; mude os dois juntos. */
const LARGURA_DA_GAVETA = 1180;

/*
  Qual item o menu marca, e como: o valor do `aria-current` do link.

  "Início" só em `/` exato: por prefixo ele marcaria todas as páginas, já que
  todo caminho começa por `/`. Os outros casam por prefixo, com a barra como
  fronteira: `/medicos/cardiologia` marca "Especialidades", mas `/medico/ana`
  (a página de um médico) não. Esses são a página atual: "page".

  A página de um médico também marca "Encontre um médico" (`/busca`), como
  no desenho aprovado: o perfil é o fim da busca e volta a ela. Mas o perfil
  não é a página da busca, e o leitor de tela não pode anunciar que é: ali a
  marca é "true" (o item atual de um conjunto), com o mesmo sublinhado.

  "Sua AMI" aponta para um trecho da home e nunca é marcada: o `href` dela
  tem `#`, e um caminho (`usePathname`) nunca tem, então nenhuma das
  comparações abaixo a alcança.
*/
const TAMBEM_MARCA: Record<string, string> = { "/busca": "/medico" };

export function marcaDoMenu(caminho: string, href: string): "page" | "true" | undefined {
  if (href === "/") return caminho === "/" ? "page" : undefined;
  const debaixo = (raiz: string) =>
    caminho === raiz || caminho.startsWith(`${raiz}/`);
  if (debaixo(href)) return "page";
  if (href in TAMBEM_MARCA && debaixo(TAMBEM_MARCA[href])) return "true";
  return undefined;
}

/*
  Folha cliente isolada: o caminho atual e o estado da gaveta só existem no
  navegador. O resto do cabeçalho continua no servidor.

  Os itens chegam prontos do cabeçalho, que roda no servidor e decide pela
  chave de demonstração (`menuDoSite`, em lib/menu.ts): sete na
  demonstração, seis fora dela, sem "Sua AMI". O menu não lê a chave.

  Acima de 1180px o menu é uma linha só. Abaixo, ele some e o botão abre uma
  gaveta com os mesmos links. A gaveta fecha com o X (o próprio botão),
  com Esc (devolvendo o foco ao botão), com clique fora e ao escolher um
  item. Se a janela crescer além de 1180px com a gaveta aberta, ela fecha:
  senão o botão sumiria com `aria-expanded="true"`.

  O item marcado leva `aria-current` (`marcaDoMenu`), e o desenho o marca
  com o sublinhado que, nos outros itens, só aparece ao passar o mouse.

  `children` é o botão "Seja associado", vindo do servidor.
*/
export function MenuPrincipal({
  itens,
  children,
}: {
  itens: ItemDoMenu[];
  children?: ReactNode;
}) {
  const caminho = usePathname();
  const [aberta, setAberta] = useState(false);
  const botao = useRef<HTMLButtonElement>(null);
  const gaveta = useRef<HTMLElement>(null);

  const fechar = () => setAberta(false);

  useEffect(() => {
    if (!aberta) return;

    const aoTeclar = (e: KeyboardEvent) => {
      if (deveFechar({ tipo: "tecla", tecla: e.key })) {
        setAberta(false);
        botao.current?.focus();
      }
    };
    const aoClicar = (e: MouseEvent) => {
      const alvo = e.target as Node;
      const noBotao = botao.current?.contains(alvo) ?? false;
      const naGaveta = gaveta.current?.contains(alvo) ?? false;
      if (deveFechar({ tipo: "clique", noBotao, naGaveta })) setAberta(false);
    };
    const estreita = window.matchMedia(`(max-width: ${LARGURA_DA_GAVETA}px)`);
    const aoLargar = () => {
      if (deveFechar({ tipo: "largura", estreita: estreita.matches })) setAberta(false);
    };

    document.addEventListener("keydown", aoTeclar);
    document.addEventListener("click", aoClicar);
    estreita.addEventListener("change", aoLargar);
    return () => {
      document.removeEventListener("keydown", aoTeclar);
      document.removeEventListener("click", aoClicar);
      estreita.removeEventListener("change", aoLargar);
    };
  }, [aberta]);

  return (
    <>
      <nav aria-label="Principal" className={styles.menu}>
        {itens.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-current={marcaDoMenu(caminho, item.href)}
          >
            {item.rotulo}
          </Link>
        ))}
      </nav>

      {children}

      <button
        ref={botao}
        type="button"
        className={styles.abre}
        aria-label={aberta ? "Fechar menu" : "Abrir menu"}
        aria-expanded={aberta}
        aria-controls="gaveta"
        onClick={() => setAberta((v) => !v)}
      >
        <Icone nome={aberta ? "fechar" : "menu"} />
      </button>

      <nav
        ref={gaveta}
        id="gaveta"
        aria-label="Menu"
        className={styles.gaveta}
        data-aberta={aberta}
      >
        {itens.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-current={marcaDoMenu(caminho, item.href)}
            onClick={fechar}
          >
            {item.rotulo}
          </Link>
        ))}
      </nav>
    </>
  );
}
