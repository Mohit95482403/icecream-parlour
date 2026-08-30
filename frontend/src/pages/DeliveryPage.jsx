import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import CustomerCarePage from '../components/CustomerCarePage';
import ScrollReveal from '../components/ScrollReveal';
import SEO from '../components/seo/SEO';

const Section = ({ number, title, children }) => (
  <div className={number !== '01' ? 'mt-14 md:mt-16 pt-14 md:pt-16 border-t border-espresso/8' : ''}>
    <ScrollReveal delay={0.05}>
      <div className="flex items-center gap-4 mb-4">
        <span className="font-display text-sm text-warm-taupe/50 italic">{number}</span>
        <div className="h-[1px] w-6 bg-warm-taupe/20" />
      </div>
      <h2
        className="font-display text-2xl md:text-3xl font-normal text-espresso leading-snug mb-6"
        style={{ letterSpacing: '-0.015em' }}
      >
        {title}
      </h2>
      <div className="max-w-2xl space-y-4">{children}</div>
    </ScrollReveal>
  </div>
);

const P = ({ children }) => (
  <p className="text-base md:text-lg text-espresso/60 leading-[1.8] font-light">{children}</p>
);

const DeliveryPage = () => (
  <>
    <SEO
      title="Delivery Information | GLACÉ"
      description="Learn about GLACÉ delivery areas, timing, fees, and how to track your order."
    />
    <CustomerCarePage
      breadcrumb="Delivery"
      title="Delivery"
      subtitle="Thoughtful delivery, from our kitchen to your doorstep."
      ctaTitle="Need Help With Your Order?"
      ctaLabel="Track Your Order"
      ctaHref="/account/orders"
    >
      <Section number="01" title="Delivery Areas">
        <P>
          GLACÉ currently delivers across India to any valid PIN code. We work with trusted
          delivery partners to ensure your ice cream arrives in perfect condition, no matter
          where you are.
        </P>
        <P>
          Delivery availability for your specific area is verified during checkout when you
          enter your PIN code. If your area is not yet serviceable, we'll let you know right away.
        </P>
      </Section>

      <Section number="02" title="Delivery Times">
        <P>
          We aim to deliver your order within approximately 60 minutes of confirmation,
          depending on your location and order volume. Specific delivery zones may have
          different estimated times, which will be displayed at checkout.
        </P>
        <P>
          During peak hours, festive seasons, or periods of high demand, delivery times
          may be slightly longer. We appreciate your patience — every scoop is worth the wait.
        </P>
      </Section>

      <Section number="03" title="Delivery Fee">
        <P>
          A standard delivery fee of ₹100 applies to all orders. The exact fee for your
          location will be clearly displayed during checkout before you confirm your order.
        </P>
        <P>
          Certain delivery zones may have different fee structures or free delivery thresholds.
          These details are automatically calculated based on your delivery PIN code.
        </P>
      </Section>

      <Section number="04" title="Order Tracking">
        <P>
          Once your order is confirmed, you can track its progress in real time through
          your account. You'll receive notifications as your order moves through each stage —
          from preparation to delivery.
        </P>
        <Link
          to="/account/orders"
          className="inline-flex items-center gap-2 mt-2 text-xs uppercase tracking-[0.15em] font-medium text-espresso border-b border-espresso/30 pb-1 hover:border-espresso transition-colors duration-300"
        >
          Track Your Order
          <ArrowRight size={14} />
        </Link>
      </Section>

      <Section number="05" title="Important Notes">
        <P>
          Please ensure the delivery address provided is complete and accurate. Include
          any landmarks, building names, or floor details that may help our delivery partner
          locate you.
        </P>
        <P>
          A valid contact number is required so our delivery partner can reach you if needed.
          Please ensure someone is available at the delivery address to receive the order.
        </P>
        <P>
          If you have any special delivery instructions — such as gate codes, preferred
          drop-off locations, or timing preferences — you may include them during checkout.
        </P>
      </Section>
    </CustomerCarePage>
  </>
);

export default DeliveryPage;
