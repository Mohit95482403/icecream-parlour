import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowUp } from 'lucide-react';
import Container from '../components/Container';
import ScrollReveal from '../components/ScrollReveal';
import SEO from '../components/seo/SEO';

/**
 * LegalPage — Reusable premium editorial layout for all legal/policy pages.
 *
 * Props:
 *   seoTitle        — Page <title>
 *   seoDescription  — Meta description
 *   eyebrow         — Small uppercase label above the heading
 *   title           — Main heading
 *   subtitle        — Supporting paragraph below the heading
 *   lastUpdated     — Date string for the "Last Updated" badge
 *   sections        — Array of { id, title, content } (content is JSX or string)
 */
const LegalPage = ({
  seoTitle,
  seoDescription,
  eyebrow,
  title,
  subtitle,
  lastUpdated,
  sections = [],
}) => {
  const [activeSection, setActiveSection] = useState(sections[0]?.id || '');
  const sectionRefs = useRef({});
  const location = useLocation();

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  // Intersection Observer to track which section is active
  useEffect(() => {
    const observers = [];
    const options = { rootMargin: '-20% 0px -60% 0px', threshold: 0 };

    sections.forEach((section) => {
      const el = sectionRefs.current[section.id];
      if (!el) return;
      const observer = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) {
          setActiveSection(section.id);
        }
      }, options);
      observer.observe(el);
      observers.push(observer);
    });

    return () => observers.forEach((o) => o.disconnect());
  }, [sections]);

  const scrollToSection = useCallback((id) => {
    const el = sectionRefs.current[id];
    if (el) {
      const offset = 100;
      const top = el.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  }, []);

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <>
      <SEO title={seoTitle} description={seoDescription} />

      {/* ── Hero ── */}
      <section className="bg-cream pt-32 pb-16 md:pt-40 md:pb-20 lg:pt-44 lg:pb-24">
        <Container>
          <ScrollReveal>
            {/* Breadcrumb */}
            <nav aria-label="Breadcrumb" className="mb-8 md:mb-10">
              <ol className="flex items-center gap-2 text-xs tracking-wide text-warm-taupe">
                <li>
                  <Link
                    to="/"
                    className="hover:text-espresso transition-colors duration-300"
                  >
                    Home
                  </Link>
                </li>
                <li aria-hidden="true">
                  <span className="text-warm-taupe/40">/</span>
                </li>
                <li>
                  <span className="text-espresso/70 font-medium">{title}</span>
                </li>
              </ol>
            </nav>

            {/* Eyebrow */}
            <div className="flex items-center gap-4 mb-5">
              <div className="h-[1px] w-8 bg-warm-taupe/30"></div>
              <span className="text-xs font-medium uppercase tracking-[0.2em] text-warm-taupe">
                {eyebrow}
              </span>
            </div>

            {/* Title */}
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-normal leading-[1.1] text-espresso mb-6" style={{ letterSpacing: '-0.025em' }}>
              {title}
            </h1>

            {/* Subtitle */}
            {subtitle && (
              <p className="text-lg md:text-xl text-espresso/55 leading-relaxed max-w-2xl font-light">
                {subtitle}
              </p>
            )}
          </ScrollReveal>
        </Container>
      </section>

      {/* ── Content ── */}
      <section className="bg-ivory py-16 md:py-20 lg:py-24">
        <Container>
          <div className="lg:grid lg:grid-cols-12 lg:gap-16 xl:gap-20">
            {/* Sticky Table of Contents — Desktop */}
            <aside className="hidden lg:block lg:col-span-3">
              <div className="sticky top-28">
                <ScrollReveal delay={0.1}>
                  <p className="text-[10px] uppercase tracking-[0.25em] font-medium text-warm-taupe/60 mb-5">
                    Contents
                  </p>
                  <nav aria-label="Table of contents">
                    <ul className="space-y-1">
                      {sections.map((section, index) => (
                        <li key={section.id}>
                          <button
                            onClick={() => scrollToSection(section.id)}
                            className={`w-full text-left py-2 px-3 rounded-lg text-sm transition-all duration-300 flex items-start gap-3 group ${
                              activeSection === section.id
                                ? 'bg-espresso/[0.04] text-espresso font-medium'
                                : 'text-espresso/45 hover:text-espresso/70 hover:bg-espresso/[0.02]'
                            }`}
                          >
                            <span className={`font-display text-xs italic mt-0.5 shrink-0 transition-colors duration-300 ${
                              activeSection === section.id ? 'text-espresso/60' : 'text-warm-taupe/40'
                            }`}>
                              {String(index + 1).padStart(2, '0')}
                            </span>
                            <span>{section.title}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </nav>

                  {/* Last Updated */}
                  {lastUpdated && (
                    <div className="mt-10 pt-6 border-t border-espresso/8">
                      <p className="text-[10px] uppercase tracking-[0.25em] font-medium text-warm-taupe/50 mb-1">
                        Last Updated
                      </p>
                      <p className="text-sm text-espresso/60 font-light">{lastUpdated}</p>
                    </div>
                  )}
                </ScrollReveal>
              </div>
            </aside>

            {/* Mobile Table of Contents */}
            <div className="lg:hidden mb-10">
              <ScrollReveal delay={0.1}>
                {lastUpdated && (
                  <p className="text-xs text-warm-taupe/60 mb-4">
                    <span className="uppercase tracking-[0.15em] font-medium">Last Updated</span>{' '}
                    — {lastUpdated}
                  </p>
                )}
                <details className="group bg-cream/60 rounded-xl border border-espresso/8 p-4">
                  <summary className="text-sm font-medium text-espresso cursor-pointer select-none flex items-center justify-between">
                    <span className="uppercase tracking-[0.1em] text-xs">Table of Contents</span>
                    <span className="text-warm-taupe/50 group-open:rotate-180 transition-transform duration-300 text-lg leading-none">
                      ▾
                    </span>
                  </summary>
                  <ul className="mt-3 pt-3 border-t border-espresso/8 space-y-1">
                    {sections.map((section, index) => (
                      <li key={section.id}>
                        <button
                          onClick={() => scrollToSection(section.id)}
                          className="w-full text-left py-1.5 text-sm text-espresso/60 hover:text-espresso transition-colors flex items-center gap-3"
                        >
                          <span className="font-display text-xs italic text-warm-taupe/40">
                            {String(index + 1).padStart(2, '0')}
                          </span>
                          {section.title}
                        </button>
                      </li>
                    ))}
                  </ul>
                </details>
              </ScrollReveal>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-9">
              {sections.map((section, index) => (
                <div
                  key={section.id}
                  id={section.id}
                  ref={(el) => (sectionRefs.current[section.id] = el)}
                  className={index !== 0 ? 'mt-14 md:mt-16 pt-14 md:pt-16 border-t border-espresso/8' : ''}
                >
                  <ScrollReveal delay={0.05}>
                    {/* Section Number + Title */}
                    <div className="flex items-center gap-4 mb-4">
                      <span className="font-display text-sm text-warm-taupe/50 italic">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <div className="h-[1px] w-6 bg-warm-taupe/20"></div>
                    </div>
                    <h2 className="font-display text-2xl md:text-3xl font-normal text-espresso leading-snug mb-6" style={{ letterSpacing: '-0.015em' }}>
                      {section.title}
                    </h2>

                    {/* Section Content */}
                    <div className="prose-glace max-w-2xl">
                      {typeof section.content === 'string' ? (
                        <p className="text-base md:text-lg text-espresso/60 leading-[1.8] font-light">
                          {section.content}
                        </p>
                      ) : (
                        section.content
                      )}
                    </div>
                  </ScrollReveal>
                </div>
              ))}

              {/* Back to Top */}
              <div className="mt-16 md:mt-20 pt-10 border-t border-espresso/8">
                <button
                  onClick={scrollToTop}
                  className="group inline-flex items-center gap-2 text-xs uppercase tracking-[0.15em] font-medium text-warm-taupe/60 hover:text-espresso transition-colors duration-300"
                >
                  Back to top
                  <ArrowUp size={14} className="transition-transform duration-300 group-hover:-translate-y-0.5" />
                </button>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
};

export default LegalPage;
