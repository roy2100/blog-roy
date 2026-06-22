#!/usr/bin/env node
// Lint Chinese quotation-mark usage in blog posts against the Simplified
// Chinese (GB/T 15834) norm:
//   - Outermost quotes use full-width double curly quotes “ ”.
//   - Single curly quotes ‘ ’ appear ONLY nested inside double quotes.
//   - Straight ASCII " is not allowed adjacent to CJK text.
// Code fences (``` ```) and inline code (`...`) are ignored, so config
// snippets like ZSH_THEME="robbyrussell" are not flagged. English prose
// (straight quotes not touching CJK) is left alone.
//
// Usage: node scripts/check-punctuation.mjs
// Exits 1 if any issue is found.

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const BLOG_DIR = join(ROOT, 'src/content/blog');

const CJK = /[\p{Script=Han}　-〿＀-￯]/u;

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else if (/\.mdx?$/.test(name)) out.push(p);
  }
  return out;
}

// Return the line with fenced code blocks dropped and inline code blanked,
// preserving line numbers and column positions.
function stripCode(lines) {
  let inFence = false;
  return lines.map((line) => {
    const fence = /^\s*```/.test(line);
    if (fence) {
      inFence = !inFence;
      return '';
    }
    if (inFence) return '';
    // Blank out inline code spans, keeping length so columns stay aligned.
    return line.replace(/`[^`]*`/g, (m) => ' '.repeat(m.length));
  });
}

function checkFile(path) {
  const issues = [];
  const raw = readFileSync(path, 'utf8');
  const lines = stripCode(raw.split('\n'));

  // 1. Straight double quote adjacent to CJK.
  lines.forEach((line, i) => {
    for (let c = 0; c < line.length; c++) {
      if (line[c] !== '"') continue;
      const before = line[c - 1] ?? '';
      const after = line[c + 1] ?? '';
      if (CJK.test(before) || CJK.test(after)) {
        issues.push({
          line: i + 1,
          msg: `straight quote " next to Chinese text — use “ or ”`,
          ctx: line.trim(),
        });
      }
    }
  });

  // 2 & 3. Curly-quote nesting / balance via a stack walk.
  const stack = []; // entries: { ch, line }
  lines.forEach((line, i) => {
    for (const ch of line) {
      if (ch === '“') stack.push({ ch, line: i + 1 });
      else if (ch === '”') {
        if (stack.length === 0 || stack[stack.length - 1].ch !== '“')
          issues.push({ line: i + 1, msg: 'closing ” without a matching opening “', ctx: line.trim() });
        else stack.pop();
      } else if (ch === '‘') {
        if (stack.length === 0 || stack[stack.length - 1].ch !== '“')
          issues.push({ line: i + 1, msg: 'single ‘ used outside double quotes — use “ ” for the outer level', ctx: line.trim() });
        else stack.push({ ch, line: i + 1 });
      } else if (ch === '’') {
        if (stack.length === 0 || stack[stack.length - 1].ch !== '‘')
          issues.push({ line: i + 1, msg: 'closing ’ without a matching opening ‘', ctx: line.trim() });
        else stack.pop();
      }
    }
  });
  for (const open of stack)
    issues.push({ line: open.line, msg: `unclosed ${open.ch}`, ctx: lines[open.line - 1].trim() });

  return issues;
}

let total = 0;
for (const path of walk(BLOG_DIR).sort()) {
  const issues = checkFile(path).sort((a, b) => a.line - b.line);
  if (issues.length === 0) continue;
  total += issues.length;
  const rel = relative(ROOT, path);
  for (const { line, msg, ctx } of issues) {
    console.error(`${rel}:${line}  ${msg}`);
    if (ctx) console.error(`    ${ctx}`);
  }
}

if (total > 0) {
  console.error(`\n✗ ${total} quotation issue(s) found.`);
  process.exit(1);
}
console.log('✓ Quotation marks OK.');
