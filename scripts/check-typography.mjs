#!/usr/bin/env node
// Lint Simplified-Chinese typography in blog posts against the GB/T 15834 norm.
//
// Posts with frontmatter `lang: en` are checked against an English rule set
// (multiple spaces, space before punctuation, missing space after a comma/
// semicolon, spaces hugging parentheses, repeated punctuation).
//
// For Chinese posts (the default, `lang: zh`) the linter checks:
//   1. Quotation marks: outermost use full-width “ ”, single ‘ ’ only nested
//      inside doubles, no straight " adjacent to CJK, and balanced nesting.
//   2. Half-width sentence punctuation ( , ; ! ? : . ) adjacent to CJK.
//   3. Half-width parentheses ( ) wrapping CJK.
//   4. Ellipsis: must be the Chinese “……” (two …); ASCII "..." / "。。" near CJK.
//   5. Dash: must be the Chinese “——” (two —); ASCII "--" near CJK.
//   6. Repeated full-width punctuation (，、；：！？) and space before it.
//   7. CJK ↔ Latin spacing: a Latin token (alphanumerics with ≥1 letter)
//      touching CJK needs a space; pure-number tokens (2018年) are exempt.
//
// The leading YAML frontmatter, fenced code blocks (``` ```) and inline code
// (`...`) are blanked before checking, so config snippets and YAML arrays are
// not flagged. Line/column numbers are preserved.
//
// Usage: node scripts/check-typography.mjs
// Exits 1 if any issue is found.

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const BLOG_DIR = join(ROOT, 'src/content/blog');

const CJK = /[\p{Script=Han}　-〿＀-￯]/u;
const isCJK = (ch) => ch !== undefined && ch !== '' && CJK.test(ch);
// Han ideographs only — used by the spacing rule so that a Latin token next to
// full-width *punctuation* (，。！？, which live in the CJK range above) is not
// mistaken for needing a space.
const HAN = /\p{Script=Han}/u;
const isHan = (ch) => ch !== undefined && ch !== '' && HAN.test(ch);

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else if (/\.mdx?$/.test(name)) out.push(p);
  }
  return out;
}

// Parse the leading YAML frontmatter for `lang`; default 'zh'.
function frontmatterLang(raw) {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return 'zh';
  const lm = m[1].match(/^lang:\s*['"]?([A-Za-z-]+)['"]?\s*$/m);
  return lm ? lm[1] : 'zh';
}

// Blank the frontmatter block, fenced code blocks (``` or ~~~), inline code
// spans, and inline-link URLs ([text](url) keeps the prose text, blanks the
// url) — preserving line count and character positions so adjacency checks stay
// accurate. Blanked spans are filled with U+FFFC (not spaces) so the whitespace
// rules don't mistake the padding for real spacing.
function strip(lines) {
  const BLANK = '\uFFFC';
  let inFence = false;
  let fenceMark = ''; // ` or ~ — a fence only closes on its own marker
  let inFront = false;
  let frontDone = false;
  return lines.map((line, i) => {
    if (!frontDone) {
      if (i === 0 && /^---\s*$/.test(line)) { inFront = true; return ''; }
      if (inFront) {
        if (/^---\s*$/.test(line)) { inFront = false; frontDone = true; }
        return '';
      }
      frontDone = true;
    }
    const fence = line.match(/^\s*(`{3,}|~{3,})/);
    if (fence) {
      const mark = fence[1][0];
      if (!inFence) { inFence = true; fenceMark = mark; }
      else if (mark === fenceMark) { inFence = false; fenceMark = ''; }
      return '';
    }
    if (inFence) return '';
    return line
      .replace(/`[^`]*`/g, (m) => BLANK.repeat(m.length))
      .replace(/(\]\()([^)]*)(\))/g, (_, open, url, close) => open + BLANK.repeat(url.length) + close);
  });
}

function checkFile(path) {
  const raw = readFileSync(path, 'utf8');
  const issues = [];
  const rawLines = raw.split('\n');
  const lines = strip(rawLines);
  // ctx is the original (unstripped) line so output is readable; the third
  // argument some rules still pass is ignored.
  const add = (i, msg) => issues.push({ line: i + 1, msg, ctx: (rawLines[i] ?? '').trim() });
  if (frontmatterLang(raw) === 'en') checkEnglish(lines, add);
  else checkChinese(lines, add);
  return issues;
}

// English typography rules, applied to posts with `lang: en`.
function checkEnglish(lines, add) {
  lines.forEach((line, i) => {
    let m;
    // Multiple spaces between words (leading indentation is ignored). Skip
    // markdown table rows, where runs of spaces are column alignment padding.
    const isTableRow = (line.match(/\|/g) || []).length >= 2;
    if (!isTableRow) {
      const multiSpace = /(?<=\S) {2,}(?=\S)/g;
      while ((m = multiSpace.exec(line))) add(i, 'multiple spaces between words', line);
    }
    // A space before terminal/clause punctuation.
    const spaceBefore = /\s([,.;:!?])/g;
    while ((m = spaceBefore.exec(line))) add(i, `space before "${m[1]}"`, line);
    // Comma/semicolon immediately followed by a letter (missing space after).
    const missingAfter = /([,;])[A-Za-z]/g;
    while ((m = missingAfter.exec(line))) add(i, `missing space after "${m[1]}"`, line);
    // A space hugging the inside of parentheses.
    const spaceInParen = /\((?= )| (?=\))/g;
    while ((m = spaceInParen.exec(line))) add(i, 'space just inside parentheses', line);
    // Repeated punctuation ("..." stays a valid ellipsis; 4+ dots is not).
    const repeated = /,{2,}|;{2,}|\.{4,}/g;
    while ((m = repeated.exec(line))) add(i, `repeated punctuation "${m[0]}"`, line);
  });
}

// Simplified-Chinese typography rules (GB/T 15834).
function checkChinese(lines, add) {
  lines.forEach((line, i) => {
    for (let c = 0; c < line.length; c++) {
      const ch = line[c];
      const prev = line[c - 1];
      const next = line[c + 1];

      // 1. Straight double quote adjacent to CJK.
      if (ch === '"' && (isCJK(prev) || isCJK(next)))
        add(i, 'straight quote " next to Chinese text — use “ or ”', line);

      // 2. Half-width sentence punctuation adjacent to CJK.
      else if (',;!?'.includes(ch) && (isCJK(prev) || isCJK(next)))
        add(i, `half-width "${ch}" next to Chinese text — use the full-width form`, line);
      else if (ch === ':' && (isCJK(prev) || isCJK(next)))
        add(i, 'half-width ":" next to Chinese text — use "："', line);
      // Period only after CJK and not part of a number/URL/version.
      else if (ch === '.' && isCJK(prev) && !/[0-9A-Za-z.]/.test(next ?? ''))
        add(i, 'half-width "." after Chinese text — use "。"', line);

      // 3. Half-width parentheses wrapping CJK.
      else if (ch === '(' && isCJK(next))
        add(i, 'half-width "(" before Chinese text — use "（"', line);
      else if (ch === ')' && isCJK(prev))
        add(i, 'half-width ")" after Chinese text — use "）"', line);
    }

    let m;

    // 4. Ellipsis.
    const asciiDots = /\.{3,}/g;
    while ((m = asciiDots.exec(line)))
      if (isCJK(line[m.index - 1]) || isCJK(line[m.index + m[0].length]))
        add(i, 'ASCII "..." near Chinese text — use the ellipsis "……"', line);
    const zhEllipsis = /…+/g;
    while ((m = zhEllipsis.exec(line)))
      if (m[0].length !== 2)
        add(i, `Chinese ellipsis must be "……" (two …), found ${m[0].length}`, line);
    const zhDots = /。{2,}/g;
    while ((m = zhDots.exec(line)))
      add(i, 'repeated "。" — use the ellipsis "……" or a single "。"', line);

    // 5. Dash.
    const emDash = /—+/g;
    while ((m = emDash.exec(line)))
      if ((isCJK(line[m.index - 1]) || isCJK(line[m.index + m[0].length])) && m[0].length !== 2)
        add(i, 'Chinese dash must be "——" (two —)', line);
    const asciiDash = /-{2,}/g;
    while ((m = asciiDash.exec(line)))
      if (isCJK(line[m.index - 1]) || isCJK(line[m.index + m[0].length]))
        add(i, 'ASCII "--" near Chinese text — use the dash "——"', line);

    // 6. Repeated full-width punctuation, and space before full-width punctuation.
    const repeated = /([，、；：！？])\1+/g;
    while ((m = repeated.exec(line))) add(i, `repeated "${m[1]}"`, line);
    const spaceBefore = /[ \t]+([，。、；：！？）》」』])/g;
    while ((m = spaceBefore.exec(line))) add(i, `space before full-width "${m[1]}"`, line);

    // 7. CJK ↔ Latin spacing. A Latin token (≥1 letter) touching CJK needs a
    // space; pure-number tokens (2018年, 10月) are exempt.
    const token = /[A-Za-z0-9]+/g;
    while ((m = token.exec(line))) {
      if (!/[A-Za-z]/.test(m[0])) continue;
      if (isHan(line[m.index - 1]) || isHan(line[m.index + m[0].length]))
        add(i, `missing space between Chinese and "${m[0]}"`, line);
    }
  });

  // Curly-quote nesting / balance via a stack walk.
  const stack = []; // entries: { ch, line }
  lines.forEach((line, i) => {
    for (const ch of line) {
      if (ch === '“') stack.push({ ch, line: i + 1 });
      else if (ch === '”') {
        if (stack.length === 0 || stack[stack.length - 1].ch !== '“')
          add(i, 'closing ” without a matching opening “', line);
        else stack.pop();
      } else if (ch === '‘') {
        if (stack.length === 0 || stack[stack.length - 1].ch !== '“')
          add(i, 'single ‘ used outside double quotes — use “ ” for the outer level', line);
        else stack.push({ ch, line: i + 1 });
      } else if (ch === '’') {
        if (stack.length === 0 || stack[stack.length - 1].ch !== '‘')
          add(i, 'closing ’ without a matching opening ‘', line);
        else stack.pop();
      }
    }
  });
  for (const open of stack)
    add(open.line - 1, `unclosed ${open.ch}`);
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
  console.error(`\n✗ ${total} typography issue(s) found.`);
  process.exit(1);
}
console.log('✓ Typography OK.');
