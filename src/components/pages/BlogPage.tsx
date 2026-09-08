/**
 * Prerendered `/blog/` listing.
 *
 * Accessed via: App when `pageFromPath` resolves to `blog`. Header/Footer
 * stay the shared chrome; this file owns the main column only.
 *
 * Each card's `.blog-card__body` is the real link to that article's detail
 * page (`/blog/<slug>/`, see article-content.ts) — it already carried
 * `:focus-visible` styling in blog.css before it was wired up, since the
 * stacking layout was always meant to end in a clickable card. Layout CSS is
 * `blog.css`, ported from landing-saba.
 */

import type { BlogArticle, BlogDescription } from '@/lib/content/blog-content'
import { blogHeroContent, blogListingContent } from '@/lib/content/blog-content'
import { publicUrl } from '@/lib/publicUrl'
import './blog.css'

function Breadcrumbs({ items }: { items: readonly string[] }) {
  return (
    <p className="blog-hero__breadcrumbs">
      {items.map((item) => (
        <span key={item}>{item}</span>
      ))}
    </p>
  )
}

function Description({ content }: { content: BlogDescription }) {
  if (content.emphasisFirst) {
    return (
      <>
        <strong>{content.emphasis}</strong>
        {content.supporting}
      </>
    )
  }

  return (
    <>
      {content.supporting}
      <strong>{content.emphasis}</strong>
    </>
  )
}

function ArticleMetadata({ article }: { article: BlogArticle }) {
  return (
    <>
      <p className="blog-card__metadata blog-card__metadata--wide">
        <span>{article.readTime}</span>
        <span>{article.date}</span>
      </p>
      <p className="blog-card__metadata blog-card__metadata--compact">
        <span>{article.readTime}</span>
        <span aria-hidden="true">/</span>
        <span>{article.date}</span>
      </p>
    </>
  )
}

function BlogArticleCard({ article }: { article: BlogArticle }) {
  return (
    <article className={`blog-card blog-card--${article.layout}`}>
      <a aria-label={article.title} className="blog-card__body" href={publicUrl(`blog/${article.slug}/`)}>
        <img
          alt=""
          className="blog-card__image"
          height={article.image.height}
          src={article.image.src}
          width={article.image.width}
        />
        <div className="blog-card__primary">
          <ArticleMetadata article={article} />
          <h2 className="blog-card__title">{article.title}</h2>
        </div>
        <div className="blog-card__secondary">
          <p className="blog-card__description blog-card__description--wide">
            <Description content={article.description} />
          </p>
          <p className="blog-card__description blog-card__description--compact">
            <Description content={article.compactDescription ?? article.description} />
          </p>
        </div>
      </a>
    </article>
  )
}

export function BlogPage() {
  return (
    <main id="main-content">
      <section className="blog-hero" aria-labelledby="blog-heading">
        <div className="blog-hero__topline">
          <div className="blog-hero__breadcrumbs-large">
            <Breadcrumbs items={blogHeroContent.largeBreadcrumbs} />
          </div>
          <div className="blog-hero__breadcrumbs-compact">
            <Breadcrumbs items={blogHeroContent.compactBreadcrumbs} />
          </div>
        </div>

        <div className="blog-hero__copy">
          <h1 id="blog-heading">
            <span className="blog-hero__heading-wide">{blogHeroContent.heading}</span>
            <span className="blog-hero__heading-mobile">{blogHeroContent.mobileHeading}</span>
          </h1>
          <p className="blog-hero__description">{blogHeroContent.description}</p>
        </div>
      </section>

      <section aria-label={blogListingContent.navigationLabel} className="blog-listing">
        {blogListingContent.articles.map((article) => (
          <BlogArticleCard article={article} key={article.id} />
        ))}
      </section>
    </main>
  )
}
