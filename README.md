# blog-roy

极简个人博客 · [Astro](https://astro.build) + Cloudflare Pages。技术方案见 [`plan.md`](./plan.md)，
本次 MVP 的执行记录见 [`docs/plan-mvp.md`](./docs/plan-mvp.md)。

## 本地开发

```bash
npm install
npm run dev      # http://localhost:4321
```

## 常用命令

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动本地开发服务器 |
| `npm run build` | 生成静态站点到 `./dist` |
| `npm run preview` | 本地预览构建产物 |
| `npm run check` | 提交前的校验闸门：类型检查（astro check）+ 排版检查 + 单测 |
| `npm run check:typography` | 单独运行中英文排版检查 |
| `npm test` | 运行排版检查器的单元测试（node:test，无第三方依赖） |

## 写文章

在 `src/content/blog/` 新建 `.md` 或 `.mdx` 文件，frontmatter 字段：

```yaml
---
title: 标题
date: 2026-06-22
lang: zh               # 可选，zh（默认）或 en，决定 <html lang> 与排版规则
tags: [标签1, 标签2]   # 可选
description: 摘要      # 可选，用于列表与 RSS
draft: false           # 可选，true 时不会发布
---
```

文件名即文章 slug，访问路径为 `/blog/<文件名>/`。

## 排版检查

`npm run check` 在类型检查后会运行 `scripts/check-typography.mjs`，按文章的
`lang` 应用不同规则，必须 0 报错才算通过：

- **中文（`lang: zh`，默认）**：遵循 GB/T 15834——外层引号用全角 `“ ”`、单引号
  `‘ ’` 仅可内嵌；禁止半角标点（`, ; ! ? : .`）或半角括号 `( )` 紧贴中文；省略号
  须为 `……`、破折号须为 `——`；不允许重复全角标点或其前置空格；中文与拉丁词之间
  需空格（纯数字如 `2018年` 不受限）。
- **英文（`lang: en`）**：多余空格、标点前空格、逗号/分号后缺空格、括号内侧空格、
  重复标点。

frontmatter、代码块（``` ``` ``` 或 `~~~`）、行内代码与行内链接的 URL 会在检查前被忽略。

## 部署（Cloudflare Pages）

1. 推送到 Git 仓库。
2. 在 Cloudflare Pages 连接该仓库，构建命令 `npm run build`，输出目录 `dist`。
3. `git push origin main` 后自动构建并部署。

当前为纯静态站点，无需 Cloudflare adapter；待引入 D1/R2 等动态能力时再启用
（见 `wrangler.toml` 中注释）。
