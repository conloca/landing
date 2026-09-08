/**
 * Shared template for a full blog article detail page.
 *
 * Accessed via: `/blog/one-change-shouldnt-get-lost/` and
 * `/blog/edit-what-you-see/` (App, routed through `pageFromPath`). Both routes
 * render this same component with a different `ArticleContent` value — see
 * `src/lib/content/article-content.ts`.
 *
 * Header byline/dek layout, the TOC divider rows, and the Continue reading
 * band are grounded in Figma frames (`article_top_*`, `toc_column_1024`,
 * `article_bottom_*`); everything else in this file (in-body sections,
 * numbered TOC entries) follows `article.txt`'s own "01 / 02 / 03..."
 * structure and the site's existing typographic scale rather than a
 * dedicated frame. Continue reading reuses `BlogArticleCard` from
 * `BlogPage.tsx` so the related-article card matches `.blog-card--split`
 * pixel-for-pixel instead of duplicating that markup.
 */

import type { ArticleContent } from '@/lib/content/article-content'
import { blogListingContent } from '@/lib/content/blog-content'
import { publicUrl } from '@/lib/publicUrl'
import { BlogArticleCard } from './BlogPage'

function ArticleHeader({ article }: { article: ArticleContent }) {
  return (
    <header className="mx-auto flex max-w-[1440px] flex-col gap-6 px-4 pt-24 sm:px-6 sm:pt-28 lg:px-8">
      <p className="flex items-center gap-4 font-mono text-xs uppercase tracking-wide text-stone-500">
        <a href={publicUrl('blog/')} className="hover:text-stone-700">
          Blog
        </a>
        <span aria-hidden="true">/</span>
        <span>{article.readTime}</span>
        <span aria-hidden="true">/</span>
        <span>{article.date}</span>
      </p>
      <h1 className="font-display max-w-[24ch] text-[32px] leading-[38px] font-bold text-stone-900 sm:text-[40px] sm:leading-[1.2] lg:text-5xl lg:leading-none">
        {article.title}
      </h1>
      {article.dek ? (
        <p className="max-w-[65ch] text-base leading-[1.7] text-stone-500 italic lg:hidden">{article.dek}</p>
      ) : null}
      <div className="border-t border-stone-200" />
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-12">
        <div className="flex flex-col gap-1 lg:w-80 lg:flex-none">
          <p className="font-mono text-xs uppercase tracking-wide text-stone-500">Written by</p>
          <p className="text-stone-900">{article.author}</p>
        </div>
        {article.dek ? (
          <p className="hidden max-w-[65ch] text-base leading-[1.7] text-stone-500 italic lg:block">
            {article.dek}
          </p>
        ) : null}
      </div>
    </header>
  )
}

function ArticleHeroImage({ article }: { article: ArticleContent }) {
  return (
    <div className="mx-auto mt-8 max-w-[1440px] px-1 sm:px-2">
      <img
        alt=""
        className="aspect-[16/9] w-full rounded-[20px] object-cover sm:rounded-[24px]"
        height={article.image.height}
        src={article.image.src}
        width={article.image.width}
      />
    </div>
  )
}

function ArticleToc({ article }: { article: ArticleContent }) {
  if (!article.toc) return null
  return (
    <nav aria-label="In this article" className="mx-auto max-w-[720px] px-4 pt-10 sm:px-6 lg:px-8">
      <p className="font-mono text-xs uppercase tracking-wide text-stone-500">In this article</p>
      <ol className="mt-4 flex flex-col divide-y divide-stone-200 border-t border-stone-200">
        {article.toc.map((entry, index) => (
          <li key={entry.id}>
            <a
              className="flex items-baseline gap-4 py-6 text-stone-600 hover:text-stone-900"
              href={`#${entry.id}`}
            >
              <span className="font-mono text-xs text-stone-400">
                {String(index + 1).padStart(2, '0')}
              </span>
              <span>{entry.label}</span>
            </a>
          </li>
        ))}
      </ol>
    </nav>
  )
}

function ArticleIntro({ article }: { article: ArticleContent }) {
  return (
    <div className="mx-auto flex max-w-[720px] flex-col gap-6 px-4 pt-10 text-base leading-[1.7] text-stone-600 sm:px-6 lg:px-8">
      {article.intro.map((paragraph) => (
        <p key={paragraph}>{paragraph}</p>
      ))}
    </div>
  )
}

function ArticlePractice({ article }: { article: ArticleContent }) {
  if (!article.practice) return null
  const { heading, steps, closing } = article.practice
  return (
    <div className="mx-auto flex max-w-[720px] flex-col gap-6 px-4 pt-10 sm:px-6 lg:px-8">
      <h2 className="font-display text-xl font-bold text-stone-900">{heading}</h2>
      <ol className="flex flex-col gap-4">
        {steps.map((step, index) => (
          <li key={step} className="flex gap-4 text-base leading-[1.7] text-stone-600">
            <span className="font-mono text-xs text-stone-400">
              {String(index + 1).padStart(2, '0')}
            </span>
            <span>{step}</span>
          </li>
        ))}
      </ol>
      <p className="text-base leading-[1.7] text-stone-600">{closing}</p>
    </div>
  )
}

function ArticleSections({ article }: { article: ArticleContent }) {
  if (!article.sections) return null
  return (
    <div className="mx-auto flex max-w-[720px] flex-col gap-14 px-4 pt-14 sm:px-6 lg:px-8">
      {article.sections.map((section) => (
        <section aria-labelledby={section.id} id={section.id} key={section.id} className="flex flex-col gap-5">
          <p className="font-mono text-xs uppercase tracking-wide text-stone-500">{section.kicker}</p>
          <h2 className="font-display text-2xl font-bold text-stone-900 sm:text-3xl" id={`${section.id}-heading`}>
            {section.heading}
          </h2>
          {section.blocks.map((block) =>
            block.type === 'paragraph' ? (
              <p key={block.text} className="text-base leading-[1.7] text-stone-600">
                {block.text}
              </p>
            ) : (
              <dl key={block.items[0]?.term} className="flex flex-col gap-4 border-l-2 border-lime-400 pl-5">
                {block.items.map((item) => (
                  <div key={item.term}>
                    <dt className="font-semibold text-stone-900">{item.term}</dt>
                    <dd className="text-base leading-[1.7] text-stone-600">{item.body}</dd>
                  </div>
                ))}
              </dl>
            ),
          )}
        </section>
      ))}
    </div>
  )
}

function ArticleClosing({ article }: { article: ArticleContent }) {
  if (!article.closingStatement) return null
  return (
    <p className="font-display mx-auto max-w-[720px] px-4 pt-14 text-xl leading-[1.5] font-bold text-stone-900 sm:px-6 lg:px-8">
      {article.closingStatement}
    </p>
  )
}

function ContinueReading({ currentSlug }: { currentSlug: string }) {
  const seenSlugs = new Set<string>()
  const others = blogListingContent.articles.filter((article) => {
    if (article.slug === currentSlug || seenSlugs.has(article.slug)) return false
    seenSlugs.add(article.slug)
    return true
  })
  if (others.length === 0) return null
  const splitCards = others.map((article) => Object.assign({}, article, { layout: 'split' as const }))
  return (
    <div className="mt-20 bg-stone-100 py-14">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="font-display text-3xl font-bold text-stone-900 sm:text-4xl">Continue reading</h2>
          <p className="font-mono text-xs uppercase tracking-wide text-stone-500">More stories</p>
        </div>
        <div className="mt-8 flex flex-col gap-6">
          {splitCards.map((article) => (
            <div
              className="[--blog-stack-card-height:420px] lg:[--blog-stack-card-height:460px]"
              key={article.slug}
            >
              <BlogArticleCard article={article} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function ArticlePage({ article }: { article: ArticleContent }) {
  return (
    <main id="main-content">
      <article>
        <ArticleHeader article={article} />
        <ArticleHeroImage article={article} />
        <ArticleToc article={article} />
        <ArticleIntro article={article} />
        <ArticlePractice article={article} />
        <ArticleSections article={article} />
        <ArticleClosing article={article} />
      </article>
      <ContinueReading currentSlug={article.slug} />
      <div className="h-20" aria-hidden="true" />
    </main>
  )
}
