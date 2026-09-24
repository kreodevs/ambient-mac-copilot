/** Infiere flags de correo desde el texto del usuario (español). */
export function inferMailFlags(text: string): {
  todayOnly: boolean
  unreadOnly: boolean
} {
  const lower = text.toLowerCase()
  return {
    todayOnly: /\bhoy\b|today|esta mañana/.test(lower),
    unreadOnly: /no leíd|sin leer|unread|no leidos/.test(lower),
  }
}

export function stripMailBoilerplate(query: string): string {
  return query
    .replace(
      /^(dame|muéstrame|muestrame|lista|listar|busca|buscar|resumen de|resumen|los|las|mis|correos?|emails?|mail|importantes?|de|del|la|el)\s+/gi,
      '',
    )
    .trim()
}
