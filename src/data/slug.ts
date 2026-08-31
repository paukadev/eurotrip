const COMBINING_DIACRITICS = /[̀-ͯ]/g;

/** Normalizes a display name into a slug: lowercase, no accents, spaces -> hyphens. */
export function normalizeSlug(name: string): string {
  return name
    .normalize("NFD")
    .replace(COMBINING_DIACRITICS, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export interface SlugAssignmentInput {
  name: string;
  explicitSlug?: string;
}

export interface SlugAssignmentResult {
  slug: string;
  warning?: string;
}

/**
 * Assigns a unique slug per entry, in the given (chronological) order.
 *
 * Repeated display `name`s (ADR-006: "Viena" appearing twice) get symmetric
 * chronological suffixes: "viena-1", "viena-2". An explicit slug takes
 * precedence over the derived one, but is still checked for uniqueness
 * against everything already assigned; a genuine collision (e.g. two
 * different names both explicitly set the same slug) only suffixes the
 * later occurrence, since the first has no "sibling" to be numbered against.
 */
export function assignSlugs(entries: SlugAssignmentInput[]): SlugAssignmentResult[] {
  const nameOccurrences = new Map<string, number>();
  for (const entry of entries) {
    const nameSlug = normalizeSlug(entry.name);
    nameOccurrences.set(nameSlug, (nameOccurrences.get(nameSlug) ?? 0) + 1);
  }

  const seenPerName = new Map<string, number>();
  const usedSlugs = new Set<string>();
  const results: SlugAssignmentResult[] = [];

  for (const entry of entries) {
    const nameSlug = normalizeSlug(entry.name);
    const occurrence = (seenPerName.get(nameSlug) ?? 0) + 1;
    seenPerName.set(nameSlug, occurrence);

    const candidateBase = entry.explicitSlug
      ? normalizeSlug(entry.explicitSlug)
      : (nameOccurrences.get(nameSlug) ?? 1) > 1
        ? `${nameSlug}-${occurrence}`
        : nameSlug;

    let candidate = candidateBase;
    let warning: string | undefined;

    if (usedSlugs.has(candidate)) {
      let suffix = 2;
      let deduped = `${candidateBase}-${suffix}`;
      while (usedSlugs.has(deduped)) {
        suffix += 1;
        deduped = `${candidateBase}-${suffix}`;
      }
      candidate = deduped;
      warning = `Slug duplicado para "${entry.name}"; ajustado para "${candidate}".`;
    }

    usedSlugs.add(candidate);
    results.push({ slug: candidate, warning });
  }

  return results;
}
