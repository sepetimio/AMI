import type { SchemaTypeDefinition } from "sanity";
import { autor } from "./autor";
import { noticia } from "./noticia";
import { paginaInstitucional } from "./paginaInstitucional";

export const tipos: SchemaTypeDefinition[] = [
  autor,
  noticia,
  paginaInstitucional,
];
