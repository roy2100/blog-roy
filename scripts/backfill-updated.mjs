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

/** Split a YYYY-MM-DD prefix out of a frontmatter date value. */
function toYMD(value) {
  const m = value.trim().replace(/^['"]|['"]$/g, '').match(/^\d{4}-\d{2}-\d{2}/);
  return m ? m[0] : null;
}

let changed = 0;
let skipped = 0;

for (const file of listMarkdown(ROOT)) {
  const raw = readFileSync(file, 'utf8');
  const fm = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!fm) {
    console.warn(`skip (no frontmatter): ${file}`);
    skipped++;
    continue;
  }

  const dateLine = fm[1].match(/^date:\s*(.+)$/m);
  if (!dateLine) {
    console.warn(`skip (no date): ${file}`);
    skipped++;
    continue;
  }
  const date = toYMD(dateLine[1]);

  const updated = lastCommitDate(file);
  if (!updated) {
    console.warn(`skip (no git history): ${file}`);
    skipped++;
    continue;
  }

  // Only meaningful when strictly later than publication (YYYY-MM-DD sorts lexically).
  if (!date || updated <= date) {
    skipped++;
    continue;
  }

  const block = fm[1];
  let newBlock;
  if (/^updated:\s*.+$/m.test(block)) {
    newBlock = block.replace(/^updated:\s*.+$/m, `updated: ${updated}`);
  } else {
    // Insert directly after the date line.
    newBlock = block.replace(/^(date:\s*.+)$/m, `$1\nupdated: ${updated}`);
  }

  if (newBlock === block) {
    skipped++;
    continue;
  }

  const next = raw.replace(block, newBlock);
  if (DRY_RUN) {
    console.log(`would set updated: ${updated}  (date: ${date})  ${file}`);
  } else {
    writeFileSync(file, next);
    console.log(`set updated: ${updated}  (date: ${date})  ${file}`);
  }
  changed++;
}

console.log(
  `\n${DRY_RUN ? '[dry-run] ' : ''}${changed} file(s) ${
    DRY_RUN ? 'would be' : ''
  } updated, ${skipped} skipped.`
);
