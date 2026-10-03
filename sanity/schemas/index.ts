import type { SchemaTypeDefinition } from "sanity";
import { autor } from "./autor";
import { banner } from "./banner";
import { empresaParceira } from "./empresaParceira";
import { noticia } from "./noticia";
import { paginaInstitucional } from "./paginaInstitucional";

export const tipos: SchemaTypeDefinition[] = [
  autor,
  banner,
  empresaParceira,
  noticia,
  paginaInstitucional,
];
