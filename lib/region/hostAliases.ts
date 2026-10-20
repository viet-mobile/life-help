// Host labels that differ from the internal country slug (the operator-facing host names): the alias resolves to the canonical slug,
// so logos, default language, metadata and regions stay keyed by one slug.
export const HOST_COUNTRY_ALIASES: Record<string, string> = {
  czech: "czechia",
  centralafrican: "centralafrica",
};
export const canonicalCountrySlug = (slug: string): string => HOST_COUNTRY_ALIASES[slug] ?? slug;
