export interface TemplateVariables {
  titulo: string;
  subtitulo: string;
  link: string;
}

/**
 * Função pura — roda tanto no servidor (ao criar/editar matéria) quanto
 * no cliente (preview ao vivo), sem round-trip de API.
 */
export function renderTemplate(
  templateText: string,
  variables: TemplateVariables,
): string {
  return templateText
    .replaceAll("{{titulo}}", variables.titulo)
    .replaceAll("{{subtitulo}}", variables.subtitulo)
    .replaceAll("{{link}}", variables.link);
}
