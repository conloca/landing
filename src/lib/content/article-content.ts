import contentSystemsUrl from '@/assets/blog/content-systems.webp'
import editControlUrl from '@/assets/blog/edit-control.webp'

/**
 * Full-body copy for the two blog articles that get their own detail page.
 *
 * Accessed via: `/blog/one-change-shouldnt-get-lost/` and
 * `/blog/edit-what-you-see/` (ArticlePage, routed through `pageFromPath`).
 *
 * Article one's body is transcribed verbatim from
 * `/Users/ultra/Documents/figma-exports/article.txt` — a ground-truth text
 * export supplied after an earlier OCR-based transcription of the same
 * article from screenshots turned out to have garbled sentences. Article
 * two has no full-body export anywhere in the Figma extraction; only its
 * title and excerpt (also used on the `/blog/` listing) are confirmed, so
 * its page renders the excerpt as the opening and nothing invented past it.
 */

export interface ArticleParagraphBlock {
  type: 'paragraph'
  text: string
}

export interface ArticleListBlock {
  type: 'list'
  items: { term: string; body: string }[]
}

export type ArticleBlock = ArticleParagraphBlock | ArticleListBlock

export interface ArticleSection {
  id: string
  kicker: string
  heading: string
  blocks: ArticleBlock[]
}

export interface ArticleTocEntry {
  id: string
  label: string
}

export interface ArticleContent {
  author: string
  date: string
  dek?: string
  image: { height: number; src: string; width: number }
  intro: string[]
  readTime: string
  slug: string
  title: string
  toc?: ArticleTocEntry[]
  practice?: {
    heading: string
    steps: string[]
    closing: string
  }
  sections?: ArticleSection[]
  closingStatement?: string
}

function paragraph(text: string): ArticleParagraphBlock {
  return { type: 'paragraph', text }
}

export const oneChangeArticle: ArticleContent = {
  author: 'Conloca team',
  date: 'September 2026',
  dek: "On most teams, the code lives in one place, the content in a CMS, the campaign brief in a doc, and the open questions in a chat thread. The published page is where all of it finally meets. No single system holds the whole picture.",
  image: { height: 810, src: contentSystemsUrl, width: 1440 },
  readTime: '4 min read',
  slug: 'one-change-shouldnt-get-lost',
  title: "One change shouldn't get lost across three systems",
  intro: [
    "A marketer knows the copy was approved. They don't know which build it shipped in. A developer sees the exact technical change. They don't know which campaign decision is sitting behind it.",
    "So you end up with two versions of the truth: what the marketer sees in the CMS, and what actually lives in the project's code. The faster your campaigns, languages, and offers change, the more that gap costs you.",
    "Conloca puts content back into the project. The marketer edits the real page visually, and the change is saved to the same Git repository that holds the site's code and structure. Copy, design components, SEO metadata, and the published result stop drifting apart.",
  ],
  toc: [
    { id: 'git-safety-net', label: "Git's safety net" },
    { id: 'reusable-campaigns', label: 'One campaign, reusable parts' },
    { id: 'marketing-advantage', label: 'Speed as an advantage' },
    { id: 'agent-native-memory', label: 'An agent-native memory' },
    { id: 'content-ownership', label: 'Your site stays yours' },
  ],
  practice: {
    heading: "Here's how it works in practice:",
    steps: [
      'The marketer opens a page in the visual editor.',
      'They change text, an image, or metadata, and see the result as they go.',
      'Conloca enforces the structure and content rules defined in the code.',
      'The saved change lands in Git history, where it can be reviewed or rolled back.',
      'Astro publishes the updated content as a fast website.',
    ],
    closing:
      "The marketer gets a simple interface. The business gets a process that's searchable, governed, and reversible.",
  },
  sections: [
    {
      id: 'git-safety-net',
      kicker: "01 — Git's safety net",
      heading: "Git's safety net without Git's learning curve",
      blocks: [
        paragraph(
          "The real value of Git was never programming knowledge. It's that the project forgets nothing. What changed, who changed it, when, and what it looked like before.",
        ),
        paragraph(
          "That's exactly what a good editorial process needs, on a team of five or five hundred. A new campaign version can be prepared without touching the live page. Legal can read the precise text that's about to go out. Two variants can be compared word by word. If an offer ships with a mistake in it, restoring the previous version doesn't mean rebuilding the page from scratch.",
        ),
        paragraph(
          'None of this requires a marketer to know what a commit, a branch, or a pull request is. Conloca runs the technical process in the background and hands the team the part that matters:',
        ),
        {
          type: 'list',
          items: [
            {
              term: 'Faster campaigns.',
              body: 'Every copy and media change no longer needs its own engineering ticket.',
            },
            {
              term: 'A preview you can trust.',
              body: "Decisions get made on the real page, not in a document or a staging environment that's roughly similar.",
            },
            {
              term: 'Safe publishing.',
              body: 'Changes are kept in history and can be rolled back the moment you need them.',
            },
            {
              term: 'Transparent collaboration.',
              body: 'Everyone can see who changed what, and which version went live.',
            },
            {
              term: 'Ownership of your content.',
              body: "The files stay in your company's repository. Switching platforms doesn't mean losing your brand's history.",
            },
          ],
        },
        paragraph(
          "Speed and control stop competing. The team moves fast because the rules are built into the system, not because someone took them away.",
        ),
      ],
    },
    {
      id: 'reusable-campaigns',
      kicker: '02 — Reusable campaigns',
      heading: "One campaign shouldn't mean rebuilding everything",
      blocks: [
        paragraph(
          'Marketing sites reuse the same parts over and over: hero blocks, product benefits, testimonials, CTAs, FAQs. Yet for every new campaign, teams rebuild those parts, copy them, or hunt them down across old pages. It burns time and it wears down brand consistency.',
        ),
        paragraph(
          'Reusable Fragments let your team drop approved content blocks into any page. The marketer never starts from an empty screen. They start from pieces that already work and already match the brand. Campaigns go up faster, and design and messaging stay consistent across the site.',
        ),
        paragraph(
          'The same principle carries over to multilingual content. Instead of cloning entire pages for every language, editors change only what actually differs. Media is uploaded and organized in the same workspace. Less time goes into hunting for files, duplicating them, and re-approving material that was signed off months ago.',
        ),
        paragraph(
          "At that point Conloca stops being a place to edit text and becomes the system your campaigns are produced in. The team moves faster and the site's structure holds.",
        ),
      ],
    },
    {
      id: 'marketing-advantage',
      kicker: '03 — Marketing advantage',
      heading: 'A fast site is already a marketing advantage',
      blocks: [
        paragraph(
          'Page speed belongs to the brand experience, not to the engineering scoreboard. Visitors feel how quickly and smoothly a site responds before they read a single word. A slow campaign page loses attention. A fast one gets out of the way and lets the offer do the work.',
        ),
        paragraph(
          'Astro is built for content-driven sites and keeps the JavaScript it ships to the browser to a minimum. That makes it a strong foundation for fast marketing sites. Good page experience helps SEO too, though speed on its own will never win you a ranking.',
        ),
        paragraph(
          "Conloca doesn't trade that architecture away for a heavy, detached CMS. The editor works visually, the content stays in the project, and Astro builds a fast final page. A marketer doesn't need to understand the pipeline for their campaign to benefit from modern web architecture.",
        ),
        paragraph(
          'Two kinds of speed in one system. The team publishes faster, and the visitor gets the result faster.',
        ),
      ],
    },
    {
      id: 'agent-native-memory',
      kicker: '04 — Agent-native memory',
      heading: 'An agent-native CMS needs a strong memory',
      blocks: [
        paragraph(
          'An AI agent can produce headline variants in minutes, draft translations, refresh metadata, or find stale copy across dozens of pages. The scale of the automation brings the scale of the error with it. An agent-native system has to do more than generate quickly. It has to keep every change under control.',
        ),
        paragraph(
          "Conloca's Git-based approach leaves every action an agent takes visible and reversible. Schemas defined in code give it structure. Change history gives it accountability. Review before publish keeps a human in the loop. The agent speeds up the work, while brand voice, legal accuracy, and the final call stay with your company.",
        ),
        paragraph(
          "That's the difference between a CMS with an AI feature bolted onto it and a genuinely agent-native workspace.",
        ),
      ],
    },
    {
      id: 'content-ownership',
      kicker: '05 — Content ownership',
      heading: "A CMS that doesn't take your site hostage",
      blocks: [
        paragraph(
          "A Git-based approach isn't right for every product. Real-time data, large transactional systems, and continuous user flows need a database and an API. For marketing sites, blogs, documentation, and campaign pages, a separate closed content system is usually more complexity than the job asks for.",
        ),
        paragraph(
          "That's where Conloca earns its place. The marketer gets the simplicity of a CMS. The developer gets a Git-based workflow. The company keeps control of both the code and the content.",
        ),
      ],
    },
  ],
  closingStatement: 'The marketer sees the page. The developer sees the code. The company owns both.',
}

export const editWhatYouSeeArticle: ArticleContent = {
  author: 'Conloca team',
  date: 'September 2026',
  image: { height: 810, src: editControlUrl, width: 1440 },
  readTime: '4 min read',
  slug: 'edit-what-you-see',
  title: 'Edit what you see, without losing control of your code',
  // No full-body export exists for this article anywhere in the Figma
  // extraction — only the title and this two-part excerpt (also used on the
  // `/blog/` listing) are confirmed. The excerpt is rendered as the article's
  // opening; nothing further is invented past it.
  intro: [
    'Exploring how visual editing can give marketers the freedom to move faster without sacrificing developer control. Keeping code, components, design systems, Git history, and Astro performance intact while giving teams a simpler path from idea to published page.',
  ],
}

