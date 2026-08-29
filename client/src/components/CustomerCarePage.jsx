import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import Container from './Container';
import ScrollReveal from './ScrollReveal';

/**
 * Shared Customer Care page wrapper.
 * Provides: hero, breadcrumb, sidenav, CTA footer, consistent styling.
 */

const careLinks = [
  { label: 'Delivery', href: '/delivery' },
  { label: 'FAQs', href: '/faqs' },
  { label: 'Contact', href: '/contact' },
  { label: 'Returns', href: '/returns' },
];

const CustomerCarePage = ({
  children,
  breadcrumb,
  title,
  subtitle,
  ctaTitle = 'Still Need Help?',
  ctaText = "We're always happy to help.",
  ctaLabel = 'Contact GLACÉ',
  ctaHref = '/contact',
}) => {
  const location = useLocation();

  return (
    <>
      {/* ── Hero ── */}
      <section className="bg-cream pt-32 pb-14 md:pt-40 md:pb-18 lg:pt-44 lg:pb-20">
        <Container>
          <ScrollReveal>
            {/* Breadcrumb */}
            <nav aria-label="Breadcrumb" className="mb-8 md:mb-10">
              <ol className="flex items-center gap-2 text-xs tracking-wide text-warm-taupe flex-wrap">
                <li><Link to="/" className="hover:text-espresso transition-colors duration-300">Home</Link></li>
                <li aria-hidden="true"><span className="text-warm-taupe/40">/</span></li>
                <li><span className="text-warm-taupe/70">Customer Care</span></li>
                <li aria-hidden="true"><span className="text-warm-taupe/40">/</span></li>
                <li><span className="text-espresso/70 font-medium">{breadcrumb}</span></li>
              </ol>
            </nav>

            {/* Eyebrow */}
            <div className="flex items-center gap-4 mb-5">
              <div className="h-[1px] w-8 bg-warm-taupe/30" />
              <span className="text-xs font-medium uppercase tracking-[0.2em] text-warm-taupe">Customer Care</span>
            </div>

            {/* Title */}
            <h1
              className="font-display text-4xl md:text-5xl lg:text-6xl font-normal leading-[1.1] text-espresso mb-6"
              style={{ letterSpacing: '-0.025em' }}
            >
              {title}
            </h1>

            {subtitle && (
              <p className="text-lg md:text-xl text-espresso/55 leading-relaxed max-w-2xl font-light">
                {subtitle}
              </p>
            )}
          </ScrollReveal>
        </Container>
      </section>

      {/* ── Body ── */}
      <section className="bg-ivory py-16 md:py-20 lg:py-24">
        <Container>
          <div className="lg:grid lg:grid-cols-12 lg:gap-16 xl:gap-20">

            {/* Sidebar */}
            <aside className="hidden lg:block lg:col-span-3">
              <div className="sticky top-28">
                <ScrollReveal delay={0.1}>
                  <p className="text-[10px] uppercase tracking-[0.25em] font-medium text-warm-taupe/60 mb-5">
                    Customer Care
                  </p>
                  <nav aria-label="Customer care navigation">
                    <ul className="space-y-1">
                      {careLinks.map((link) => (
                        <li key={link.href}>
                          <Link
                            to={link.href}
                            className={`block py-2 px-3 rounded-lg text-sm transition-all duration-300 ${
                              location.pathname === link.href
                                ? 'bg-espresso/[0.04] text-espresso font-medium'
                                : 'text-espresso/45 hover:text-espresso/70 hover:bg-espresso/[0.02]'
                            }`}
                          >
                            {link.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </nav>
                </ScrollReveal>
              </div>
            </aside>

            {/* Mobile nav */}
            <div className="lg:hidden mb-10">
              <ScrollReveal delay={0.1}>
                <nav className="flex flex-wrap gap-2" aria-label="Customer care navigation">
                  {careLinks.map((link) => (
                    <Link
                      key={link.href}
                      to={link.href}
                      className={`px-4 py-2 rounded-full text-sm border transition-all duration-300 ${
                        location.pathname === link.href
                          ? 'bg-espresso text-ivory border-espresso'
                          : 'bg-transparent text-espresso/60 border-espresso/15 hover:border-espresso/30 hover:text-espresso'
                      }`}
                    >
                      {link.label}
                    </Link>
                  ))}
                </nav>
              </ScrollReveal>
            </div>

            {/* Main content */}
            <div className="lg:col-span-9">
              {children}
            </div>
          </div>
        </Container>
      </section>

      {/* ── CTA ── */}
      <section className="bg-cream py-16 md:py-20">
        <Container>
          <ScrollReveal>
            <div className="text-center max-w-lg mx-auto">
              <p className="text-[10px] md:text-xs uppercase tracking-[0.25em] font-medium text-warm-taupe/60 mb-3">
                {ctaTitle}
              </p>
              <p className="text-lg md:text-xl text-espresso/55 font-light mb-8">
                {ctaText}
              </p>
              <Link
                to={ctaHref}
                className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.15em] font-medium text-espresso border-b border-espresso/30 pb-1 hover:border-espresso transition-colors duration-300"
              >
                {ctaLabel}
                <ArrowRight size={14} />
              </Link>
            </div>
          </ScrollReveal>
        </Container>
      </section>
    </>
  );
};

export default CustomerCarePage;
