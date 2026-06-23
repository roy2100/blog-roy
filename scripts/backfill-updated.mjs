#!/usr/bin/env node
// Backfill each blog post's `updated` frontmatter field from git history.
//
// "Update time" = the file's last git commit date (committer date, YYYY-MM-DD).
// The field is written only when it is strictly later than the post's `date`,
// mirroring the post page which shows "更新于" only when updated > date. Files
// with no committed history are skipped.
//
// Usage:
//   node scripts/backfill-updated.mjs [--dry-run]

import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { withUpdated } from './lib/updated-frontmatter.mjs';

const ROOT = 'src/content/blog';
const DRY_RUN = process.argv.includes('--dry-run');

/** Recursively list `.md` files, ignoring `_`-prefixed entries (loader convention). */
function listMarkdown(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('_')) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listMarkdown(full));
    else if (entry.isFile() && entry.name.endsWith('.md')) out.push(full);
  }
  return out;
}

/** Last commit date that touched `file`, as YYYY-MM-DD, or null if untracked. */
function lastCommitDate(file) {
  const out = execFileSync('git', ['log', '-1', '--format=%cs', '--', file], {
    encoding: 'utf8',
  }).trim();
  return out || null;
}

let changed = 0;
let skipped = 0;

for (const file of listMarkdown(ROOT)) {
  const raw = readFileSync(file, 'utf8');
  const updated = lastCommitDate(file);
  if (!updated) {
    console.warn(`skip (no git history): ${file}`);
    skipped++;
    continue;
  }

  const next = withUpdated(raw, updated);
  if (!next) {
    skipped++;
    continue;
  }

  if (DRY_RUN) {
    console.log(`would set updated: ${updated}  ${file}`);
  } else {
    writeFileSync(file, next);
    console.log(`set updated: ${updated}  ${file}`);
  }
  changed++;
}

console.log(
  `\n${DRY_RUN ? '[dry-run] ' : ''}${changed} file(s) ${
    DRY_RUN ? 'would be' : ''
  } updated, ${skipped} skipped.`
);
