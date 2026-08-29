import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import Container from '../components/Container';
import OptimizedImage from '../components/OptimizedImage';
import ScrollReveal from '../components/ScrollReveal';
import SEO from '../components/seo/SEO';
import NewsletterSection from '../sections/NewsletterSection';

/**
 * Our Story — premium brand story page for GLACÉ.
 * Composed of 4 major sections following the existing design system.
 */

const craftPrinciples = [
  {
    number: '01',
    title: 'Quality Ingredients',
    description:
      'Every flavour starts with an ingredient worth celebrating. We seek out the finest — real vanilla beans, seasonal fruits at peak ripeness, single-origin chocolate — and let their natural character shine.',
    image: '/images/ingredients.jpg',
    imageAlt: 'Fresh seasonal ingredients selected for GLACÉ ice cream',
  },
  {
    number: '02',
    title: 'Crafted With Care',
    description:
      'Our ice cream is made in small batches by hand. A slower churn, a watchful eye, and the kind of care that can\'t be rushed. Every scoop carries the attention it deserves.',
    image: '/images/journal-craft.jpg',
    imageAlt: 'Artisan ice cream being handcrafted in the GLACÉ kitchen',
  },
  {
    number: '03',
    title: 'Made To Be Remembered',
    description:
      'We don\'t just make ice cream — we create moments. The first taste of a new flavour, an unexpected smile, the warmth of something shared. That\'s what stays.',
    image: '/images/signature-collection.jpg',
    imageAlt: 'A beautifully presented scoop of GLACÉ ice cream',
  },
];

const OurStory = () => {
  return (
    <>
      <SEO
        title="Our Story | GLACÉ"
        description="Discover the story behind GLACÉ — premium artisan ice cream crafted with passion, exceptional ingredients, and a belief that every scoop should create a moment worth remembering."
      />

      {/* ─── SECTION 1 — HERO ─────────────────────────────────────── */}
      <section className="relative min-h-[85vh] md:min-h-screen flex items-center overflow-hidden" aria-label="Our Story Hero">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <OptimizedImage
            src="/images/our-story-hero.jpg"
            alt="Artisan ice cream bowls with fresh ingredients on a rustic table"
            className="w-full h-full"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-ivory/95 via-ivory/85 to-ivory/40 md:from-ivory/90 md:via-ivory/75 md:to-transparent" />
        </div>

        {/* Content */}
        <Container className="relative z-10 py-32 md:py-40">
          <div className="max-w-2xl">
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
              className="caption mb-6"
            >
              Our Story
            </motion.p>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
              className="display-xl mb-6"
            >
              Made With Passion.<br />
              Served With Joy.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.55, ease: [0.25, 0.1, 0.25, 1] }}
              className="body-lg text-charcoal/70 mb-10 max-w-lg"
            >
              We believe ice cream is more than a treat — it's a way of slowing down,
              savouring the moment, and sharing something beautiful with the people you love.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
            >
              <Link to="/shop" className="btn btn-primary gap-2">
                Explore Our Menu
                <ArrowRight size={14} strokeWidth={2} />
              </Link>
            </motion.div>
          </div>
        </Container>
      </section>

      {/* ─── SECTION 2 — WHERE IT ALL BEGAN ───────────────────────── */}
      <section className="py-28 md:py-36 lg:py-44 bg-ivory overflow-hidden" aria-label="Where It All Began">
        <Container>

          {/* ── Section Label ── */}
          <ScrollReveal delay={0.1}>
            <div className="flex items-center gap-4 mb-16 md:mb-20 lg:mb-24">
              <span className="text-[10px] md:text-xs uppercase tracking-[0.25em] font-medium text-warm-taupe/60">01</span>
              <div className="h-px w-8 lg:w-14 bg-warm-taupe/25"></div>
              <span className="text-[10px] md:text-xs uppercase tracking-[0.25em] font-medium text-warm-taupe">The Beginning</span>
            </div>
          </ScrollReveal>

          {/* ── Main Editorial Grid ── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-y-14 lg:gap-x-12 xl:gap-x-16">

            {/* Left Column — Title + Opening Story */}
            <div className="lg:col-span-5 lg:col-start-1">
              
              {/* Title */}
              <ScrollReveal delay={0.15}>
                <h2 className="font-display text-3xl sm:text-[3.2rem] md:text-[4.2rem] lg:text-[5rem] xl:text-[5.5rem] leading-[1.02] text-espresso tracking-tight mb-8 sm:mb-10 md:mb-14 lg:mb-16">
                  Where It<br />All Began
                </h2>
              </ScrollReveal>

              {/* Pull Quote — large italic statement */}
              <ScrollReveal delay={0.2}>
                <div className="relative mb-10 md:mb-14 pl-6 md:pl-8 border-l-2 border-warm-taupe/20">
                  <p className="font-serif italic text-xl md:text-2xl lg:text-[1.65rem] text-espresso/80 leading-[1.6] font-light">
                    "What if ice cream could be made the way it used to be?"
                  </p>
                </div>
              </ScrollReveal>

              {/* Story Paragraphs */}
              <ScrollReveal delay={0.25}>
                <div className="space-y-6 max-w-lg">
                  <p className="text-[15px] md:text-base text-espresso/60 leading-[1.85] font-light">
                    <span className="font-display text-espresso/90 text-lg md:text-xl not-italic font-normal">It started with a simple idea</span> — slowly, 
                    carefully, with ingredients you could taste in every bite. Not mass-produced, 
                    not rushed, but created with the kind of attention that turns something ordinary 
                    into something you remember.
                  </p>
                  <p className="text-[15px] md:text-base text-espresso/60 leading-[1.85] font-light">
                    That idea became GLACÉ. A small kitchen, a few recipes, and the belief that if you start
                    with exceptional ingredients and give them the time they deserve, the result speaks for itself.
                  </p>
                </div>
              </ScrollReveal>

              {/* Signature tagline */}
              <ScrollReveal delay={0.35}>
                <div className="mt-12 lg:mt-16 pt-8 border-t border-espresso/8 max-w-lg flex items-center gap-6">
                  <div className="w-8 h-px bg-warm-taupe/30"></div>
                  <span className="text-[9px] md:text-[10px] uppercase tracking-[0.35em] font-medium text-espresso/35">
                    Simple Ingredients &nbsp;·&nbsp; Slow Craft &nbsp;·&nbsp; Extraordinary Flavour
                  </span>
                </div>
              </ScrollReveal>
            </div>

            {/* Right Column — Image with editorial framing */}
            <div className="lg:col-span-6 lg:col-start-7 relative">
              <ScrollReveal delay={0.15}>
                <div className="relative">
                  
                  {/* Decorative frame offset */}
                  <div className="absolute -top-4 -right-4 md:-top-6 md:-right-6 w-full h-full rounded-2xl md:rounded-[1.5rem] border border-warm-taupe/12 pointer-events-none hidden md:block"></div>

                  {/* Main Image */}
                  <div className="group relative rounded-2xl md:rounded-[1.5rem] overflow-hidden shadow-[0_25px_80px_-20px_rgba(0,0,0,0.1)] bg-warm-taupe/5">
                    <OptimizedImage
                      src="/images/our-story-origin.jpg"
                      alt="Inside the GLACÉ parlour — handcrafting ice cream with care"
                      className="aspect-[4/5] md:aspect-[3/4] w-full object-cover transition-transform duration-[2.5s] ease-out group-hover:scale-[1.04]"
                    />
                    {/* Inner border for depth */}
                    <div className="absolute inset-0 border border-espresso/[0.04] rounded-2xl md:rounded-[1.5rem] pointer-events-none"></div>
                    
                    {/* Bottom gradient for text readability if overlapping */}
                    <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-espresso/20 to-transparent pointer-events-none"></div>
                  </div>

                  {/* Floating detail card */}
                  <div className="absolute -bottom-6 -left-4 md:-bottom-8 md:-left-8 bg-ivory rounded-xl md:rounded-2xl p-5 md:p-6 shadow-[0_12px_40px_-10px_rgba(0,0,0,0.08)] border border-warm-taupe/8 max-w-[220px] md:max-w-[260px] z-10">
                    <p className="font-serif italic text-sm md:text-[15px] text-espresso/70 leading-[1.6] mb-2">
                      Every flavour is an expression of that original promise.
                    </p>
                    <span className="text-[9px] uppercase tracking-[0.2em] font-medium text-warm-taupe/60">— GLACÉ</span>
                  </div>
                </div>
              </ScrollReveal>
            </div>

          </div>
        </Container>
      </section>

      {/* ─── SECTION 3 — THE ART BEHIND EVERY SCOOP ───────────────── */}
      <section className="py-28 md:py-36 lg:py-44 bg-cream overflow-hidden" aria-label="Our Craft">
        <Container>

          {/* ── Section Header ── */}
          <div className="max-w-2xl mx-auto text-center mb-20 md:mb-28 lg:mb-32">
            <ScrollReveal>
              <div className="flex items-center justify-center gap-4 mb-5">
                <div className="h-[1px] w-8 bg-warm-taupe/30"></div>
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-warm-taupe">Our Craft</p>
                <div className="h-[1px] w-8 bg-warm-taupe/30"></div>
              </div>
              <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-normal leading-[1.1] text-espresso mb-7" style={{ letterSpacing: '-0.025em' }}>
                The Art Behind<br />Every Scoop
              </h2>
            </ScrollReveal>
            <ScrollReveal delay={0.15}>
              <p className="text-lg text-espresso/55 leading-relaxed max-w-lg mx-auto font-light">
                Great ice cream isn't made in a hurry. It's the result of thoughtful sourcing,
                patient craft, and a genuine love for creating something memorable.
              </p>
            </ScrollReveal>
          </div>

          {/* ── Craft Principles ── */}
          <div className="space-y-16 md:space-y-0">
            {craftPrinciples.map((principle, index) => {
              const isReversed = index % 2 !== 0;
              return (
                <div
                  key={principle.number}
                  className={`md:grid md:grid-cols-12 md:items-center ${
                    index !== 0 ? 'md:mt-20 lg:mt-24' : ''
                  }`}
                >
                  {/* Image Column */}
                  <div
                    className={`md:col-span-6 ${
                      isReversed ? 'md:col-start-7 md:row-start-1' : 'md:col-start-1'
                    }`}
                  >
                    <ScrollReveal delay={index * 0.1}>
                      <div className="group relative rounded-xl md:rounded-2xl overflow-hidden bg-warm-taupe/5">
                        <OptimizedImage
                          src={principle.image}
                          alt={principle.imageAlt}
                          className="aspect-[4/3] md:aspect-[5/4] w-full object-cover transition-transform duration-[1.8s] ease-out group-hover:scale-[1.02]"
                        />
                        <div className="absolute inset-0 border border-espresso/[0.04] rounded-xl md:rounded-2xl pointer-events-none"></div>
                      </div>
                    </ScrollReveal>
                  </div>

                  {/* Content Column */}
                  <div
                    className={`mt-8 md:mt-0 md:col-span-5 ${
                      isReversed ? 'md:col-start-1 md:row-start-1 md:pr-8 lg:pr-12' : 'md:col-start-8 md:pl-8 lg:pl-12'
                    }`}
                  >
                    <ScrollReveal delay={index * 0.1 + 0.12}>
                      {/* Number + Divider */}
                      <div className="flex items-center gap-4 mb-5">
                        <span className="font-display text-sm text-warm-taupe/60 italic">{principle.number}</span>
                        <div className="h-[1px] flex-1 max-w-[3rem] bg-warm-taupe/25"></div>
                      </div>

                      {/* Title */}
                      <h3 className="font-display text-2xl md:text-3xl lg:text-[2rem] font-normal text-espresso leading-snug mb-5" style={{ letterSpacing: '-0.015em' }}>
                        {principle.title}
                      </h3>

                      {/* Description */}
                      <p className="text-base md:text-lg text-espresso/60 leading-[1.75] font-light max-w-md">
                        {principle.description}
                      </p>
                    </ScrollReveal>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── Closing Brand Statement ── */}
          <ScrollReveal delay={0.2}>
            <div className="mt-24 md:mt-32 lg:mt-36 pt-10 border-t border-espresso/8 text-center">
              <p className="text-[10px] md:text-xs uppercase tracking-[0.3em] text-warm-taupe/70 font-medium">
                Ingredients with character. &nbsp;Craft with patience.
              </p>
            </div>
          </ScrollReveal>

        </Container>
      </section>

      {/* ─── SECTION 4 — MORE THAN ICE CREAM ─────────────────────── */}
      <section className="relative py-24 md:py-32 lg:py-40 overflow-hidden" aria-label="More Than Ice Cream">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <OptimizedImage
            src="/images/our-story-moments.jpg"
            alt="Friends sharing ice cream together, creating joyful moments"
            className="w-full h-full"
          />
          <div className="absolute inset-0 bg-espresso/70" />
        </div>

        <Container className="relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <ScrollReveal>
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-ivory/60 mb-6">
                What We Believe
              </p>
              <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-normal text-ivory leading-[1.1] mb-8">
                More Than<br />Ice Cream
              </h2>
            </ScrollReveal>

            <ScrollReveal delay={0.15}>
              <p className="text-lg md:text-xl text-ivory/80 leading-relaxed mb-10 max-w-2xl mx-auto">
                At its heart, GLACÉ is about the moments that matter. A warm afternoon with friends,
                a quiet celebration, the simple joy of tasting something crafted with love.
                We make ice cream for the people who believe the small things are the big things.
              </p>
            </ScrollReveal>

            <ScrollReveal delay={0.25}>
              <blockquote className="mb-12">
                <p className="font-display text-2xl md:text-3xl italic text-ivory/90 leading-relaxed">
                  "Every scoop should create a moment<br className="hidden md:block" />
                  worth remembering."
                </p>
              </blockquote>
            </ScrollReveal>

            <ScrollReveal delay={0.35}>
              <Link to="/shop" className="inline-flex items-center gap-2 bg-ivory text-espresso px-8 py-4 rounded-pill text-sm font-medium tracking-wide hover:bg-white transition-colors duration-300">
                Explore Our Flavours
                <ArrowRight size={14} strokeWidth={2} />
              </Link>
            </ScrollReveal>
          </div>
        </Container>
      </section>

      {/* ─── SECTION 5 — NEWSLETTER ─────────────────────────────────── */}
      <NewsletterSection />
    </>
  );
};

export default OurStory;
