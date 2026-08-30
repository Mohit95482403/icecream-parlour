import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import CustomerCarePage from '../components/CustomerCarePage';
import ScrollReveal from '../components/ScrollReveal';
import SEO from '../components/seo/SEO';

const Step = ({ number, status, description, icon }) => (
  <div className="relative pl-10 md:pl-16 pb-12 last:pb-0 border-l border-espresso/15 ml-4 md:ml-6 mt-2">
    <div className="absolute -left-[17px] top-0 flex items-center justify-center w-[33px] h-[33px] rounded-full bg-ivory border border-espresso/15 text-[10px] font-display italic text-espresso">
      {number}
    </div>
    
    <div className="absolute -left-1 top-[42px] bottom-0 w-[1px] bg-transparent" />
    
    <div className="-mt-1.5">
      <h3 className="text-base uppercase tracking-[0.15em] font-medium text-espresso mb-3 flex items-center gap-3">
        {status}
        {icon && <span className="text-warm-taupe/40">{icon}</span>}
      </h3>
      <p className="text-base md:text-lg text-espresso/60 leading-[1.8] font-light max-w-xl">
        {description}
      </p>
    </div>
  </div>
);

const ReturnsPage = () => {
  return (
    <>
      <SEO
        title="Returns & Cancellations | GLACÉ"
        description="Clear and thoughtful guidance on order cancellations, refunds, and when plans change."
      />
      <CustomerCarePage
        breadcrumb="Returns"
        title="Returns & Cancellations"
        subtitle="Clear and thoughtful guidance when plans change."
        ctaTitle="Need Help With A Cancellation?"
        ctaLabel="Contact Us"
        ctaHref="/contact"
      >
        <ScrollReveal delay={0.05}>
          <div className="mb-14">
            <h2
              className="font-display text-2xl md:text-3xl font-normal text-espresso leading-snug mb-6"
              style={{ letterSpacing: '-0.015em' }}
            >
              Our Cancellation Process
            </h2>
            <p className="text-base md:text-lg text-espresso/60 leading-[1.8] font-light max-w-2xl">
              Because our ice cream is prepared fresh and requires careful temperature control, our return and cancellation policies are dependent on the current status of your order.
            </p>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={0.1}>
          <div className="mb-16">
            <Step
              number="01"
              status="Pending"
              description="Cancellation available. You may cancel your order directly from your account. An eligible cancellation receives a full refund back to the original payment method."
            />
            
            <div className="pl-[27px] md:pl-[35px] py-4 border-l border-espresso/15 ml-4 md:ml-6 text-warm-taupe/40 text-lg">
              ↓
            </div>
            
            <Step
              number="02"
              status="Confirmed"
              description="A cancellation request may be submitted through your account. An administrator will review the request based on whether preparation has begun."
            />
            
            <div className="pl-[27px] md:pl-[35px] py-4 border-l border-espresso/15 ml-4 md:ml-6 text-warm-taupe/40 text-lg">
              ↓
            </div>
            
            <Step
              number="03"
              status="Preparing"
              description="Cancellation unavailable. Our team has actively begun preparing your order."
            />
            
            <div className="pl-[27px] md:pl-[35px] py-4 border-l border-espresso/15 ml-4 md:ml-6 text-warm-taupe/40 text-lg">
              ↓
            </div>
            
            <Step
              number="04"
              status="Ready"
              description="Cancellation unavailable. Your order has been packed and is awaiting pickup by our delivery partner."
            />
            
            <div className="pl-[27px] md:pl-[35px] py-4 border-l border-espresso/15 ml-4 md:ml-6 text-warm-taupe/40 text-lg">
              ↓
            </div>
            
            <Step
              number="05"
              status="Out For Delivery"
              description="Cancellation unavailable. A delivery partner is en route to your location."
            />
            
            <div className="pl-[27px] md:pl-[35px] py-4 border-transparent ml-4 md:ml-6 text-warm-taupe/40 text-lg">
              ↓
            </div>
            
            <Step
              number="06"
              status="Delivered"
              description="Order can no longer be cancelled. Due to the perishable nature of our products, we cannot accept physical returns of delivered items."
            />
          </div>
        </ScrollReveal>

        <ScrollReveal delay={0.15}>
          <div className="pt-14 border-t border-espresso/8">
            <h2
              className="font-display text-2xl md:text-3xl font-normal text-espresso leading-snug mb-6"
              style={{ letterSpacing: '-0.015em' }}
            >
              Refund Information
            </h2>
            <div className="space-y-4 max-w-2xl">
              <p className="text-base md:text-lg text-espresso/60 leading-[1.8] font-light">
                When a cancellation is approved, we will initiate a refund immediately. However, the time it takes for the funds to reflect in your account depends on your payment provider.
              </p>
              <ul className="list-none space-y-2 text-base md:text-lg text-espresso/60 leading-[1.8] font-light pl-5 relative">
                <li className="before:content-['·'] before:absolute before:left-0 before:text-warm-taupe/50 before:font-bold">
                  Customer cancellation (Pending status) results in an automatic full refund.
                </li>
                <li className="before:content-['·'] before:absolute before:left-0 before:text-warm-taupe/50 before:font-bold">
                  Admin-approved cancellations will receive a full refund, including delivery fees.
                </li>
                <li className="before:content-['·'] before:absolute before:left-0 before:text-warm-taupe/50 before:font-bold">
                  Refund processing times typically range from 5–10 business days.
                </li>
              </ul>
              <p className="text-base md:text-lg text-espresso/60 leading-[1.8] font-light mt-4">
                If you experience a quality issue with a delivered order, please contact us rather than requesting a return. We evaluate quality concerns on a case-by-case basis.
              </p>
            </div>
            
            <Link
              to="/refund-policy"
              className="inline-flex items-center gap-2 mt-8 text-xs uppercase tracking-[0.15em] font-medium text-espresso border-b border-espresso/30 pb-1 hover:border-espresso transition-colors duration-300"
            >
              Read Full Refund Policy
              <ArrowRight size={14} />
            </Link>
          </div>
        </ScrollReveal>
      </CustomerCarePage>
    </>
  );
};

export default ReturnsPage;
