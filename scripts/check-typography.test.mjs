// Unit tests for the typography linter. Run with `npm test` (node:test, no deps).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkContent } from './check-typography.mjs';

// Wrap a body in minimal frontmatter for each language.
const zh = (body) => `---\ntitle: t\ndate: 2026-06-22\n---\n\n${body}\n`;
const en = (body) => `---\ntitle: t\ndate: 2026-06-22\nlang: en\n---\n\n${body}\n`;

const msgs = (raw) => checkContent(raw).map((x) => x.msg);
const has = (raw, needle) => msgs(raw).some((m) => m.includes(needle));
const clean = (raw) => assert.deepEqual(msgs(raw), [], `expected no issues, got: ${msgs(raw).join(' | ')}`);

test('Chinese: clean prose passes', () => {
  clean(zh('他说“你好”，世界——这很好。'));
  clean(zh('2018年，我用 Java 写了一个程序……然后呢？'));
});

test('Chinese: straight quote adjacent to CJK', () => {
  assert.ok(has(zh('他说"你好"。'), 'straight quote'));
});

test('Chinese: half-width sentence punctuation next to CJK', () => {
  assert.ok(has(zh('你好,世界'), 'half-width ","'));
  assert.ok(has(zh('备注:说明'), 'half-width ":"'));
  assert.ok(has(zh('结束了.'), 'half-width "."'));
});

test('Chinese: period in a decimal is not flagged', () => {
  clean(zh('版本 3.14 已发布。'));
});

test('Chinese: half-width parentheses wrapping CJK', () => {
  const out = msgs(zh('这是(测试)。'));
  assert.ok(out.some((m) => m.includes('"("')));
  assert.ok(out.some((m) => m.includes('")"')));
});

test('Chinese: ellipsis normalization', () => {
  assert.ok(has(zh('等等...你看'), 'ASCII "..."'));
  assert.ok(has(zh('好…吧'), 'Chinese ellipsis must be'));
  clean(zh('好……吧。'));
});

test('Chinese: dash normalization', () => {
  assert.ok(has(zh('这是—好'), 'Chinese dash must be'));
  assert.ok(has(zh('这是--好'), 'ASCII "--"'));
  clean(zh('这是——好。'));
});

test('Chinese: repeated full-width punctuation and space before it', () => {
  assert.ok(has(zh('好，，吧'), 'repeated "，"'));
  assert.ok(has(zh('好 ，吧'), 'space before full-width "，"'));
});

test('Chinese: CJK-Latin spacing, numbers exempt', () => {
  assert.ok(has(zh('使用Java编程'), 'missing space between Chinese and "Java"'));
  clean(zh('2018年和10月都很好。'));
});

test('Chinese: quote nesting and balance', () => {
  assert.ok(has(zh('他说“你好'), 'unclosed “'));
  assert.ok(has(zh('他说‘你好’'), 'single ‘ used outside double quotes'));
  clean(zh('他说“这是‘嵌套’的引用”。'));
});

test('Chinese: frontmatter and code are exempt', () => {
  // CJK in YAML arrays must not be read as prose.
  clean('---\ntitle: t\ndate: 2026-06-22\ntags: [随笔, 程序员]\n---\n\n正文很干净。');
  // Inline code between Han characters must not trip the spacing rule.
  clean(zh('用 `Java` 写，再用 `0` 验证。'));
});

test('English: clean prose passes', () => {
  clean(en('Hello, world. This (works) fine... really.'));
});

test('English: spacing and punctuation rules', () => {
  assert.ok(has(en('a  b'), 'multiple spaces'));
  assert.ok(has(en('hello .'), 'space before "."'));
  assert.ok(has(en('a,b'), 'missing space after ","'));
  assert.ok(has(en('see ( x ) here'), 'space just inside parentheses'));
  assert.ok(has(en('wait....'), 'repeated punctuation'));
});

test('English: markdown table rows are exempt from the spacing rule', () => {
  clean(en('| col a  | col b |\n| ------ | ----- |\n| 1      | 2     |'));
});

test('English: inline-link URLs and fenced code are exempt', () => {
  clean(en('See [the docs](https://x.com/a,b;c) for details.'));
  clean(en('Intro line.\n\n~~~js\nconst a = {x:1,y:2};\n~~~\n\nOutro line.'));
});

test('language dispatch: same text, different rules', () => {
  // "a,b" (no CJK) is an English-only problem; a zh post should ignore it.
  clean(zh('a,b'));
  assert.ok(has(en('a,b'), 'missing space after ","'));
});

test('frontmatter: datetime without offset is flagged, date-only and offset are OK', () => {
  const post = (fm) => `---\ntitle: t\n${fm}\n---\n\n正文很干净。`;
  assert.ok(has(post('date: 2026-06-30T22:00:00'), 'no timezone offset'));
  assert.ok(has(post('date: 2026-06-30\nupdated: 2026-06-30T09:00'), 'no timezone offset'));
  clean(post('date: 2026-06-30T22:00:00+08:00'));
  clean(post('date: 2026-06-30T22:00:00Z'));
  clean(post('date: 2026-06-30')); // date-only is unambiguous
});

test('line numbers point at the offending line', () => {
  const issues = checkContent(zh('第一行没问题。\n第二行有问题,这里。'));
  assert.equal(issues.length, 1);
  assert.equal(issues[0].line, 7); // 4 frontmatter + blank + 2 body lines
});
