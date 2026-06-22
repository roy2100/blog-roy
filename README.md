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
| `npm run check` | 类型检查（astro check） |

## 写文章

在 `src/content/blog/` 新建 `.md` 或 `.mdx` 文件，frontmatter 字段：

```yaml
---
title: 标题
date: 2026-06-22
tags: [标签1, 标签2]   # 可选
description: 摘要      # 可选，用于列表与 RSS
draft: false           # 可选，true 时不会发布
---
```

文件名即文章 slug，访问路径为 `/blog/<文件名>/`。

## 部署（Cloudflare Pages）

1. 推送到 Git 仓库。
2. 在 Cloudflare Pages 连接该仓库，构建命令 `npm run build`，输出目录 `dist`。
3. `git push origin main` 后自动构建并部署。

当前为纯静态站点，无需 Cloudflare adapter；待引入 D1/R2 等动态能力时再启用
（见 `wrangler.toml` 中注释）。
