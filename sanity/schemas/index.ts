import type { SchemaTypeDefinition } from "sanity";
import { autor } from "./autor";
import { banner } from "./banner";
import { noticia } from "./noticia";
import { paginaInstitucional } from "./paginaInstitucional";

export const tipos: SchemaTypeDefinition[] = [
  autor,
  banner,
  noticia,
  paginaInstitucional,
];
