# 博客系统技术方案 · Plan

> 目标：在 Cloudflare Pages 上部署一个极简、可持续维护的个人博客。

---

## 技术选型

### 核心框架：Astro

**理由**

- 内容型博客首选框架，Content Collections 提供 Markdown/MDX 类型安全管理
- Islands 架构：默认零 JS 输出，按需激活交互组件，性能极佳
- 官方 Cloudflare adapter，边缘渲染支持完善
- 与 Next.js 相比，Cloudflare 是 Astro 的一等公民，不是二等公民

### 托管平台：Cloudflare Pages

- CDN 全球分发，国内访问速度可接受
- 监听 Git push 自动构建部署，零运维
- 内置 Analytics，无需额外统计服务
- 可按需接入 D1（数据库）、R2（对象存储）、KV（缓存）

### 内容管理：Markdown / MDX

- 文章以 `.md` / `.mdx` 文件存储在 Git 仓库中
- frontmatter 通过 Zod schema 做类型校验
- MDX 支持在文章中内嵌 Astro/React 组件

---

## 项目结构

```
my-blog/
├── src/
│   ├── content/
│   │   ├── blog/          ← 文章 .md / .mdx 文件
│   │   └── config.ts      ← Content Collections schema
│   ├── pages/
│   │   ├── index.astro    ← 文章列表首页
│   │   ├── blog/
│   │   │   └── [slug].astro  ← 文章详情动态路由
│   │   └── rss.xml.ts     ← RSS Feed
│   ├── layouts/
│   │   └── Base.astro     ← 公共 HTML 骨架
│   └── components/        ← 可复用组件
├── public/                ← 静态资源
├── astro.config.mjs
├── wrangler.toml
└── package.json
```

---

## 功能规划

### Phase 1 · MVP（第一天）

| 功能 | 实现方式 | 难度 |
|------|----------|------|
| 文章列表 | `getCollection('blog')` | 极低 |
| 文章详情 | `[slug].astro` 动态路由 | 极低 |
| 代码高亮 | Astro 内置 Shiki，零配置 | 极低 |
| RSS Feed | `@astrojs/rss` | 极低 |
| 自动部署 | Cloudflare Pages + Git | 极低 |

**启动命令**

```bash
npm create astro@latest -- --template blog
npx astro add cloudflare
```

### Phase 2 · 完善体验（第一周）

| 功能 | 实现方式 | 难度 |
|------|----------|------|
| 标签 / 分类 | 手写动态路由 `[tag].astro` | 低 |
| 深色模式 | CSS 变量 + `prefers-color-scheme` | 低 |
| 阅读时长估算 | frontmatter 或构建时计算 | 低 |
| OG 图片 | `@astrojs/og` 或静态图 | 低 |
| 搜索 | Pagefind（构建后静态索引） | 中 |

### Phase 3 · 可选增强

| 功能 | 实现方式 | 说明 |
|------|----------|------|
| 评论系统 | Giscus（基于 GitHub Discussions） | 无需自建后端 |
| 访问统计 | Cloudflare Analytics（已内置） | 零成本 |
| 图片存储 | Cloudflare R2 + `<Image />` 组件 | 需要动态图片优化时 |
| 动态数据 | Cloudflare D1（SQLite） | 需要服务端读写时启用 |

---

## 关键代码片段

### Content Collections Schema

```ts
// src/content/config.ts
import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    tags: z.array(z.string()).optional(),
    draft: z.boolean().default(false),
    description: z.string().optional(),
  }),
});

export const collections = { blog };
```

### 文章详情页

```astro
---
// src/pages/blog/[slug].astro
import { getCollection, getEntry } from 'astro:content';
import Base from '../../layouts/Base.astro';

export async function getStaticPaths() {
  const posts = await getCollection('blog', ({ data }) => !data.draft);
  return posts.map(p => ({ params: { slug: p.slug } }));
}

const { slug } = Astro.params;
const post = await getEntry('blog', slug);
const { Content } = await post.render();
---

<Base title={post.data.title}>
  <article>
    <h1>{post.data.title}</h1>
    <time>{post.data.date.toLocaleDateString('zh-CN')}</time>
    <Content />
  </article>
</Base>
```

### Cloudflare 配置

```toml
# wrangler.toml
name = "my-blog"
compatibility_date = "2024-09-23"
pages_build_output_dir = "./dist"

# 按需启用
# [[d1_databases]]
# binding = "DB"
# database_name = "blog"
# database_id = "your-database-id"

# [[r2_buckets]]
# binding = "IMAGES"
# bucket_name = "blog-images"
```

---

## 样式策略

功能逻辑半天搞定，**样式是唯一需要认真投入时间的地方**。

推荐方案：**原生 CSS + CSS 变量**，不引入 Tailwind（博客场景下 utility class 反而繁琐）。

```css
:root {
  --font-sans: 'LXGW WenKai', system-ui, sans-serif;
  --font-mono: 'Fira Code', monospace;
  --color-text: #1a1a1a;
  --color-muted: #666;
  --color-accent: #0066cc;
  --max-width: 680px;
  --spacing: 1.6rem;
}
```

中文字体推荐：**霞鹜文楷（LXGW WenKai）**，开源，阅读体验好，Cloudflare 可做字体缓存。

---

## 部署流程

```
本地写文章（.md）
    ↓
git push origin main
    ↓
Cloudflare Pages 监听触发构建
    ↓
astro build → 生成静态文件
    ↓
部署到 Cloudflare CDN 边缘节点
    ↓
royl.uk 访问生效
```

构建时间预估：文章数量 < 200 篇时，通常 30 秒内完成。

---

## 不采用的方案及理由

| 方案 | 排除理由 |
|------|----------|
| Next.js + OpenNext | Cloudflare 适配不稳定，Vercel 才是一等公民 |
| Hugo / Eleventy | JS 背景下扩展性差，动态功能接入别扭 |
| WordPress | 与 Cloudflare Pages 边缘模型根本不兼容 |
| Ghost | 需要 Node.js 服务器，无法直接部署到 Pages |

---

*最后更新：2026-06*