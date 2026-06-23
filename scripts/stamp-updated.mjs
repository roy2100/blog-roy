#!/usr/bin/env node
// Pre-commit hook: stamp `updated: <today>` onto staged blog posts.
//
// Uses today's local date (the date of the commit being made) rather than git
// history, so it works on the very commit that contains the edit. Only staged
// `.md` files under src/content/blog are touched, and only when today is later
// than the post's `date`. Re-stages any file it modifies so the stamp is part
// of the commit.

import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { withUpdated } from './lib/updated-frontmatter.mjs';

// en-CA renders as YYYY-MM-DD; uses the local timezone.
const today = new Date().toLocaleDateString('en-CA');

const staged = execFileSync(
  'git',
  ['diff', '--cached', '--name-only', '--diff-filter=ACM', '--', 'src/content/blog'],
  { encoding: 'utf8' }
)
  .split('\n')
  .map((s) => s.trim())
  .filter((s) => s.endsWith('.md'));

let stamped = 0;
for (const file of staged) {
  const raw = readFileSync(file, 'utf8');
  const next = withUpdated(raw, today);
  if (!next) continue;

  writeFileSync(file, next);
  execFileSync('git', ['add', '--', file]);
  console.log(`stamped updated: ${today}  ${file}`);
  stamped++;
}

if (stamped) console.log(`${stamped} file(s) stamped with updated: ${today}.`);
