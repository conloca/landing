/**
 * Shared template for a full blog article detail page.
 *
 * Accessed via: `/blog/one-change-shouldnt-get-lost/` and
 * `/blog/edit-what-you-see/` (App, routed through `pageFromPath`). Both routes
 * render this same component with a different `ArticleContent` value — see
 * `src/lib/content/article-content.ts`.
 *
 * Assumptions: no dedicated article Figma frame exists for desktop; layout
 * follows the site's existing typographic scale (font-display headings,
 * stone/lime palette, italic supporting copy) rather than a design frame.
 * The in-page table of contents and numbered sections are grounded in
 * `article.txt`'s own "01 / 02 / 03..." structure, not invented.
 */

import type { ArticleContent } from '@/lib/content/article-content'
import { ARTICLES } from '@/lib/content/article-content'
import { publicUrl } from '@/lib/publicUrl'

function ArticleHeader({ article }: { article: ArticleContent }) {
  return (
    <header className="mx-auto flex max-w-[720px] flex-col gap-6 px-4 pt-24 sm:px-6 sm:pt-28 lg:px-8">
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
      <ol className="mt-4 flex flex-col gap-3">
        {article.toc.map((entry, index) => (
          <li key={entry.id}>
            <a
              className="flex items-baseline gap-4 text-stone-600 hover:text-stone-900"
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
  const others = ARTICLES.filter((article) => article.slug !== currentSlug)
  if (others.length === 0) return null
  return (
    <div className="mx-auto mt-20 max-w-[720px] px-4 sm:px-6 lg:px-8">
      <p className="font-mono text-xs uppercase tracking-wide text-stone-500">Continue reading</p>
      <ul className="mt-4 flex flex-col gap-4 sm:flex-row">
        {others.map((article) => (
          <li key={article.slug} className="flex-1">
            <a
              className="block rounded-2xl border border-stone-200 p-5 hover:border-stone-400"
              href={publicUrl(`blog/${article.slug}/`)}
            >
              <span className="font-mono text-xs uppercase tracking-wide text-stone-500">
                {article.readTime} / {article.date}
              </span>
              <h3 className="font-display mt-2 text-lg font-semibold text-stone-900">{article.title}</h3>
            </a>
          </li>
        ))}
      </ul>
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
