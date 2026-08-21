"use client";

import { NextStudio } from "next-sanity/studio";
import config from "@/sanity.config";

/*
  Componente cliente à parte, e não a config importada direto em `page.tsx`.

  `sanity.config.ts` chama `structureTool()` e `visionTool()` no topo do
  módulo, e essas fábricas montam contexto React na hora, não só na
  renderização. Se `page.tsx` (Server Component) importasse a config direto,
  essa avaliação aconteceria na camada de servidor, sob a condição de
  exportação "react-server": ali o `react` resolve para uma build restrita
  sem `createContext`, e o build quebra em "Collecting page data" com
  "createContext is not a function". Isolando a importação aqui, dentro de um
  arquivo cliente, a config só é avaliada no navegador, com o React completo.
*/
export default function EstudioCliente() {
  return <NextStudio config={config} />;
}
