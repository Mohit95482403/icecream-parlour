import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import Container from '../components/Container';
import OptimizedImage from '../components/OptimizedImage';
import ScrollReveal from '../components/ScrollReveal';
import Newsletter from '../components/Newsletter';
import SEO from '../components/seo/SEO';

/**
 * Journal page — premium editorial content hub for GLACÉ.
 * Static article data (no CMS); editorial card grid + featured story.
 */

/* ─── STATIC JOURNAL DATA ─────────────────────────────────────────── */

const featuredStory = {
  slug: 'the-art-of-making-a-great-scoop',
  category: 'CRAFT',
  title: 'The Art of Making a Great Scoop',
  excerpt:
    'What makes one scoop unforgettable and another forgettable? It starts long before the churn — with the right ingredients, the right temperature, and the kind of patience that most people skip.',
  image: '/images/journal-featured.jpg',
  imageAlt: 'A hand holding a freshly scooped pistachio ice cream cone in golden afternoon light',
  readTime: '5 min read',
};

const journalArticles = [
  {
    slug: 'the-art-of-the-perfect-scoop',
    category: 'CRAFT',
    title: 'The Art of the Perfect Scoop',
    excerpt: 'Behind every great scoop is a process most people never see — and a level of attention that changes everything.',
    image: '/images/journal-craft.jpg',
    imageAlt: 'Artisan ice cream being slow-churned in a vintage copper bowl',
    readTime: '4 min read',
  },
  {
    slug: 'from-ingredient-to-flavor',
    category: 'FLAVOR',
    title: 'From Ingredient to Flavor',
    excerpt: 'A closer look at how we transform raw, seasonal ingredients into the flavors that define each collection.',
    image: '/images/ingredients.jpg',
    imageAlt: 'Fresh premium ingredients including vanilla beans, pistachios, and berries',
    readTime: '6 min read',
  },
  {
    slug: 'sweet-moments-worth-sharing',
    category: 'LIFESTYLE',
    title: 'Sweet Moments Worth Sharing',
    excerpt: 'Ice cream has always been about more than taste. It\'s about the people you share it with and the memories you make.',
    image: '/images/journal-lifestyle.jpg',
    imageAlt: 'Friends sharing ice cream sundaes at an outdoor café in golden hour light',
    readTime: '3 min read',
  },
  {
    slug: 'a-season-of-new-flavors',
    category: 'SEASONAL',
    title: 'A Season of New Flavors',
    excerpt: 'Each season brings a fresh palette of ingredients. Here\'s how we let the calendar guide what ends up in your bowl.',
    image: '/images/seasonal-mango.jpg',
    imageAlt: 'Seasonal mango ice cream with fresh tropical ingredients',
    readTime: '4 min read',
  },
];

const categories = ['All', 'Craft', 'Flavor', 'Lifestyle', 'Seasonal'];

/* ─── ARTICLE CARD COMPONENT ──────────────────────────────────────── */

const ArticleCard = ({ article }) => (
  <article className="group cursor-pointer">
    <div className="overflow-hidden rounded-lg mb-5">
      <OptimizedImage
        src={article.image}
        alt={article.imageAlt}
        className="aspect-[4/5] w-full group-hover:scale-[1.03] transition-transform duration-700 ease-out"
      />
    </div>
    <div>
      <div className="flex items-center gap-3 mb-3">
        <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-warm-taupe">
          {article.category}
        </span>
        <span className="w-1 h-1 rounded-full bg-warm-taupe/30" />
        <span className="text-[10px] text-warm-taupe/60 tracking-wide">
          {article.readTime}
        </span>
      </div>
      <h3 className="font-display text-lg md:text-xl font-medium text-espresso mb-2 group-hover:text-charcoal transition-colors duration-300">
        {article.title}
      </h3>
      <p className="body-sm text-warm-taupe leading-relaxed mb-4 line-clamp-2">
        {article.excerpt}
      </p>
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-espresso group-hover:gap-2.5 transition-all duration-300">
        Read Story
        <ArrowRight size={12} strokeWidth={2} />
      </span>
    </div>
  </article>
);

/* ─── JOURNAL PAGE ─────────────────────────────────────────────────── */

const Journal = () => {
  const [activeCategory, setActiveCategory] = useState('All');

  const filteredArticles = activeCategory === 'All'
    ? journalArticles
    : journalArticles.filter(a => a.category.toLowerCase() === activeCategory.toLowerCase());

  return (
    <>
      <SEO
        title="Journal | GLACÉ"
        description="Stories behind our flavors, thoughtful ingredients, seasonal inspirations, and the moments that make every scoop worth remembering. The GLACÉ Journal."
      />

      {/* ─── SECTION 1 — JOURNAL HERO ─────────────────────────────── */}
      <section className="relative min-h-[85vh] md:min-h-screen flex items-center overflow-hidden" aria-label="Journal Hero">
        <div className="absolute inset-0 z-0">
          <OptimizedImage
            src="/images/journal-hero.jpg"
            alt="Artisan ice cream preparation on a marble surface with premium ingredients"
            className="w-full h-full object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-ivory/95 via-ivory/85 to-ivory/40 md:from-ivory/90 md:via-ivory/70 md:to-transparent" />
        </div>

        <Container className="relative z-10 py-32 md:py-40">
          <div className="max-w-2xl">
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
              className="caption mb-6"
            >
              The Journal
            </motion.p>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
              className="display-xl mb-6"
            >
              Stories, Flavors &<br />Little Moments
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.55, ease: [0.25, 0.1, 0.25, 1] }}
              className="body-lg text-charcoal/70 max-w-lg"
            >
              Discover stories behind our flavors, thoughtful ingredients, seasonal
              inspirations, and the moments that make every scoop worth remembering.
            </motion.p>
          </div>
        </Container>
      </section>

      {/* ─── SECTION 2 — EDITOR'S NOTE ──────────────────────────── */}
      <section className="py-24 md:py-32 bg-ivory" aria-label="Editor's Note">
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-center">
            {/* Left: Text */}
            <div className="lg:col-span-5 order-2 lg:order-1">
              <ScrollReveal>
                <div className="flex items-center gap-4 mb-8">
                  <div className="h-px w-8 bg-warm-taupe/30"></div>
                  <p className="text-[10px] md:text-xs font-medium uppercase tracking-[0.25em] text-warm-taupe">Editor's Note</p>
                </div>
                
                <h3 className="font-serif italic font-light text-3xl md:text-4xl lg:text-[2.75rem] text-espresso leading-[1.2] tracking-tight mb-8">
                  "Every flavor holds a narrative of seasons changing, and of hands carefully crafting something meant to be savored."
                </h3>
                
                <p className="text-sm md:text-base text-espresso/60 leading-[1.8] font-light mb-10">
                  We started this journal to share the stories that don't fit on a label. From the origins of our single-estate vanilla to the messy, beautiful process of developing a new seasonal collection, this is where we document the art of ice cream.
                </p>
                
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full border border-warm-taupe/20 flex items-center justify-center">
                    <span className="font-serif italic text-espresso text-lg mt-1">G</span>
                  </div>
                  <span className="text-[9px] uppercase tracking-[0.3em] font-medium text-espresso/50">The GLACÉ Editorial Team</span>
                </div>
              </ScrollReveal>
            </div>

            {/* Right: Image */}
            <div className="lg:col-span-7 order-1 lg:order-2">
              <ScrollReveal delay={0.2}>
                <div className="relative rounded-2xl md:rounded-[1.5rem] overflow-hidden aspect-[4/3] group">
                  <OptimizedImage
                    src="/images/journal-lifestyle.jpg"
                    alt="Enjoying GLACÉ ice cream"
                    className="w-full h-full object-cover transition-transform duration-[2s] ease-out group-hover:scale-[1.03]"
                  />
                  <div className="absolute inset-0 bg-espresso/5 group-hover:bg-transparent transition-colors duration-700"></div>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </Container>
      </section>

      {/* ─── SECTION 2.5 — FEATURED STORY ───────────────────────────── */}
      <section className="bg-cream" aria-label="Featured Story">
        <Container className="py-10 md:py-16">
          <ScrollReveal>
            <Link to="/our-story" className="group block">
              <div className="relative rounded-2xl md:rounded-[1.5rem] overflow-hidden">
                
                {/* Full Image */}
                <OptimizedImage
                  src={featuredStory.image}
                  alt={featuredStory.imageAlt}
                  className="w-full aspect-[16/10] md:aspect-[21/9] object-cover transition-transform duration-[2s] ease-out group-hover:scale-[1.03]"
                />

                {/* Gradient Overlay — bottom & left heavy */}
                <div className="absolute inset-0 bg-gradient-to-t from-espresso/90 via-espresso/30 to-transparent"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-espresso/50 via-transparent to-transparent"></div>

                {/* Content positioned at bottom */}
                <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 lg:p-14">
                  <div className="max-w-2xl">
                    
                    {/* Category + Read Time */}
                    <div className="flex items-center gap-3 mb-4 md:mb-5">
                      <span className="inline-flex items-center gap-2 text-[10px] md:text-[11px] font-medium uppercase tracking-[0.2em] text-ivory/80">
                        <span className="w-1.5 h-1.5 rounded-full bg-white/60"></span>
                        Featured Story
                      </span>
                      <span className="w-px h-3 bg-ivory/20"></span>
                      <span className="text-[10px] md:text-[11px] text-ivory/50 tracking-wide">
                        {featuredStory.readTime}
                      </span>
                    </div>

                    {/* Title */}
                    <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-normal text-ivory leading-[1.1] tracking-tight mb-4 md:mb-5">
                      {featuredStory.title}
                    </h2>

                    {/* Excerpt */}
                    <p className="text-sm md:text-base text-ivory/60 leading-[1.7] font-light max-w-lg mb-6 md:mb-8 hidden sm:block">
                      {featuredStory.excerpt}
                    </p>

                    {/* CTA */}
                    <span className="inline-flex items-center gap-2 text-xs md:text-sm font-medium uppercase tracking-[0.15em] text-ivory/90 group-hover:gap-3 transition-all duration-300">
                      Read Story
                      <ArrowRight size={14} strokeWidth={2} className="transition-transform duration-300 group-hover:translate-x-1" />
                    </span>
                  </div>
                </div>

                {/* Subtle inner border */}
                <div className="absolute inset-0 border border-ivory/[0.05] rounded-2xl md:rounded-[1.5rem] pointer-events-none"></div>
              </div>
            </Link>
          </ScrollReveal>
        </Container>
      </section>

      {/* ─── SECTION 3 — JOURNAL COLLECTION ───────────────────────── */}
      <section className="py-24 md:py-32 lg:py-40 bg-ivory" aria-label="Journal Articles">
        <Container>
          {/* Section Header */}
          <div className="max-w-2xl mb-16">
            <ScrollReveal>
              <p className="caption mb-4">From Our Journal</p>
              <h2 className="display-lg mb-4">
                Behind the Scoop
              </h2>
              <p className="body-lg text-charcoal/60">
                A closer look at the flavors, ideas, and moments behind what we do.
              </p>
            </ScrollReveal>
          </div>

          {/* Category Filter */}
          <ScrollReveal delay={0.1}>
            <div className="flex flex-wrap gap-2 mb-12">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-5 py-2 text-xs font-medium tracking-wider rounded-pill transition-all duration-300 ${
                    activeCategory === cat
                      ? 'bg-espresso text-ivory'
                      : 'bg-warm-taupe/10 text-charcoal hover:bg-warm-taupe/20'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </ScrollReveal>

          {/* Article Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-10">
            {filteredArticles.map((article, index) => (
              <ScrollReveal key={article.slug} delay={index * 0.1}>
                <ArticleCard article={article} />
              </ScrollReveal>
            ))}
          </div>

          {filteredArticles.length === 0 && (
            <ScrollReveal>
              <div className="text-center py-16">
                <p className="body-lg text-warm-taupe">
                  Stories in this category are coming soon.
                </p>
              </div>
            </ScrollReveal>
          )}
        </Container>
      </section>

      {/* ─── SECTION 4 — BRAND MOMENTS ────────────────────────────── */}
      <section className="py-24 md:py-32 lg:py-40 bg-ivory" aria-label="Brand Moments">
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            {/* Images — asymmetric grid */}
            <ScrollReveal>
              <div className="grid grid-cols-2 gap-4">
                <div className="overflow-hidden rounded-lg">
                  <OptimizedImage
                    src="/images/parlour-interior.jpg"
                    alt="The warm interior of a GLACÉ parlour"
                    className="aspect-[3/4] w-full"
                  />
                </div>
                <div className="overflow-hidden rounded-lg mt-8">
                  <OptimizedImage
                    src="/images/our-story-moments.jpg"
                    alt="Friends sharing moments over ice cream"
                    className="aspect-[3/4] w-full"
                  />
                </div>
              </div>
            </ScrollReveal>

            {/* Content */}
            <div>
              <ScrollReveal delay={0.1}>
                <p className="caption mb-4">Behind the Brand</p>
                <h2 className="display-lg mb-8">
                  A Taste of the Moments<br />Behind the Brand
                </h2>
              </ScrollReveal>

              <ScrollReveal delay={0.2}>
                <p className="body-md text-charcoal/70 leading-relaxed mb-8">
                  Every scoop carries a story. Some are about the ingredients — where they came from,
                  why they matter. Others are about the people who share them — friends around a table,
                  a quiet afternoon, a celebration that called for something sweet.
                </p>
              </ScrollReveal>

              <ScrollReveal delay={0.25}>
                <blockquote className="border-l-2 border-espresso/20 pl-6 mb-10">
                  <p className="font-display text-xl md:text-2xl italic text-espresso/80 leading-relaxed">
                    "The best flavors are the ones that become part of a memory."
                  </p>
                </blockquote>
              </ScrollReveal>

              <ScrollReveal delay={0.3}>
                <Link to="/our-story" className="btn btn-outline gap-2">
                  Our Story
                  <ArrowRight size={14} strokeWidth={2} />
                </Link>
              </ScrollReveal>
            </div>
          </div>
        </Container>
      </section>

      {/* ─── NEWSLETTER ───────────────────────────────────────────── */}
      <section className="py-24 md:py-32 lg:py-40 bg-cream" aria-label="Newsletter signup">
        <Container>
          <div className="max-w-2xl mx-auto text-center">
            <ScrollReveal>
              <p className="caption mb-4">Stay In The Loop</p>
              <h2 className="heading-xl mb-4">
                Don't miss a scoop.
              </h2>
              <p className="body-lg text-warm-taupe mb-10">
                Be the first to discover new flavors, seasonal stories, special moments,
                and what's happening behind the scoop.
              </p>
            </ScrollReveal>

            <ScrollReveal delay={0.15}>
              <div className="flex justify-center">
                <Newsletter />
              </div>
            </ScrollReveal>
          </div>
        </Container>
      </section>
    </>
  );
};

export default Journal;
