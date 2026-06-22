---
title: 你好，世界
date: 2026-06-22
tags: [随笔, 开始]
description: 这是博客的第一篇文章，记录搭建过程与初衷。
---

这是用 [Astro](https://astro.build) 搭建、部署在 Cloudflare Pages 上的极简博客。

## 为什么是 Astro

- 内容型站点首选，Content Collections 提供类型安全的 Markdown/MDX 管理
- Islands 架构默认零 JS 输出，性能优秀
- 官方 Cloudflare 支持完善

## 写作流程

把 `.md` 文件放进 `src/content/blog/`，`git push`，剩下的交给 Cloudflare 自动构建部署。

> 简单，是可持续维护的前提。
