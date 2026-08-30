import React from 'react';
import HeroSection from '../sections/HeroSection';
import NewFlavourBanner from '../sections/NewFlavourBanner';
import PromotionalCoupons from '../sections/PromotionalCoupons';
import FeaturedFlavours from '../sections/FeaturedFlavours';
import BrandStatement from '../sections/BrandStatement';
import SignatureCollection from '../sections/SignatureCollection';
import CraftSection from '../sections/CraftSection';
import SeasonalSection from '../sections/SeasonalSection';
import ParlourSection from '../sections/ParlourSection';
import ReviewsSection from '../sections/ReviewsSection';
import NewsletterSection from '../sections/NewsletterSection';
import SEO from '../components/seo/SEO';
import SectionDivider from '../components/SectionDivider';

/**
 * Homepage — composes all sections in visual rhythm order.
 * Includes dynamic Admin-managed New Flavour Banner below Hero.
 */
const Home = () => {
  return (
    <div className="flex flex-col">
      <SEO />
      <HeroSection />
      <SectionDivider />

      {/* Admin-Managed New Flavour Banner */}
      <NewFlavourBanner />
      <SectionDivider />
      
      <FeaturedFlavours />
      <SectionDivider />
      
      <BrandStatement />
      <SectionDivider />
      
      <SignatureCollection />
      <SectionDivider />
      
      <CraftSection />
      <SectionDivider />
      
      <SeasonalSection />
      <SectionDivider />
      
      <ParlourSection />
      <SectionDivider />
      
      <PromotionalCoupons />
      <SectionDivider />
      
      <ReviewsSection />
      <SectionDivider />
      
      <NewsletterSection />
    </div>
  );
};

export default Home;
