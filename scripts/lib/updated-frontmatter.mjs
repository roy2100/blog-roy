// Shared frontmatter helpers for the `updated` field, used by both the
// git-history backfill (scripts/backfill-updated.mjs) and the pre-commit
// stamp (scripts/stamp-updated.mjs).

/** The leading frontmatter block text (between the first `---` fences), or null. */
export function frontmatterBlock(raw) {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  return m ? m[1] : null;
}

/** A YYYY-MM-DD prefix from a (possibly quoted) frontmatter date value, or null. */
export function toYMD(value) {
  const m = value
    .trim()
    .replace(/^['"]|['"]$/g, '')
    .match(/^\d{4}-\d{2}-\d{2}/);
  return m ? m[0] : null;
}

/** The post's `date` as YYYY-MM-DD, or null. */
export function readDate(block) {
  const m = block.match(/^date:\s*(.+)$/m);
  return m ? toYMD(m[1]) : null;
}

/**
 * Return `raw` with `updated:` set to `value` (a YYYY-MM-DD string), inserting
 * it directly after the `date:` line or replacing an existing `updated:` line.
 * Returns null when there is nothing to do: no frontmatter, no/unparseable
 * `date`, `value` not strictly later than `date`, or no actual change.
 */
export function withUpdated(raw, value) {
  const block = frontmatterBlock(raw);
  if (!block) return null;

  const date = readDate(block);
  // YYYY-MM-DD sorts lexically; only meaningful when later than publication.
  if (!date || value <= date) return null;

  const newBlock = /^updated:\s*.+$/m.test(block)
    ? block.replace(/^updated:\s*.+$/m, `updated: ${value}`)
    : block.replace(/^(date:\s*.+)$/m, `$1\nupdated: ${value}`);

  if (newBlock === block) return null;
  return raw.replace(block, newBlock);
}
