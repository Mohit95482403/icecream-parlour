import React from 'react';
import LegalPage from '../components/LegalPage';

const LAST_UPDATED = 'August 2026';

const P = ({ children }) => (
  <p className="text-base md:text-lg text-espresso/60 leading-[1.8] font-light mb-4 last:mb-0">
    {children}
  </p>
);

const Ul = ({ children }) => (
  <ul className="list-none space-y-2 my-4">
    {children}
  </ul>
);

const Li = ({ children }) => (
  <li className="text-base md:text-lg text-espresso/60 leading-[1.8] font-light pl-5 relative before:content-['·'] before:absolute before:left-0 before:text-warm-taupe/50 before:font-bold">
    {children}
  </li>
);

const sections = [
  {
    id: 'overview',
    title: 'Overview',
    content: (
      <>
        <P>
          At GLACÉ, we want every experience to be a positive one. We understand that
          circumstances may change after placing an order, and our refund policy is
          designed to be fair, transparent, and consistent.
        </P>
        <P>
          This policy outlines when and how cancellations and refunds are handled,
          based on the current status of your order.
        </P>
      </>
    ),
  },
  {
    id: 'cancellation-window',
    title: 'Cancellation Window',
    content: (
      <>
        <P>
          Your ability to cancel an order depends on how far along it is in our
          preparation and delivery process:
        </P>
        <div className="my-6 rounded-xl border border-espresso/8 overflow-hidden">
          <table className="w-full text-sm md:text-base">
            <thead>
              <tr className="bg-cream/60">
                <th className="text-left px-5 py-3 text-xs uppercase tracking-[0.1em] font-medium text-espresso/50">Order Status</th>
                <th className="text-left px-5 py-3 text-xs uppercase tracking-[0.1em] font-medium text-espresso/50">Cancellation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-espresso/6">
              <tr>
                <td className="px-5 py-3 text-espresso/70 font-light">Pending</td>
                <td className="px-5 py-3 text-espresso/70 font-light">Cancel directly — full refund</td>
              </tr>
              <tr>
                <td className="px-5 py-3 text-espresso/70 font-light">Confirmed</td>
                <td className="px-5 py-3 text-espresso/70 font-light">Request cancellation — subject to admin approval</td>
              </tr>
              <tr>
                <td className="px-5 py-3 text-espresso/70 font-light">Preparing</td>
                <td className="px-5 py-3 text-espresso/70 font-light">Not available</td>
              </tr>
              <tr>
                <td className="px-5 py-3 text-espresso/70 font-light">Ready</td>
                <td className="px-5 py-3 text-espresso/70 font-light">Not available</td>
              </tr>
              <tr>
                <td className="px-5 py-3 text-espresso/70 font-light">Out for Delivery</td>
                <td className="px-5 py-3 text-espresso/70 font-light">Not available</td>
              </tr>
              <tr>
                <td className="px-5 py-3 text-espresso/70 font-light">Delivered</td>
                <td className="px-5 py-3 text-espresso/70 font-light">Not available</td>
              </tr>
            </tbody>
          </table>
        </div>
      </>
    ),
  },
  {
    id: 'pending-orders',
    title: 'Pending Orders',
    content: (
      <>
        <P>
          If your order is still in <strong className="text-espresso/80 font-medium">Pending</strong> status — meaning it has not yet been
          confirmed by our team — you may cancel it directly from your account.
        </P>
        <P>
          A full refund will be processed automatically. The refunded amount will be
          returned to your original payment method.
        </P>
      </>
    ),
  },
  {
    id: 'confirmed-orders',
    title: 'Confirmed Orders',
    content: (
      <>
        <P>
          Once an order has been <strong className="text-espresso/80 font-medium">Confirmed</strong>, it means our team has acknowledged it
          and preparation may be scheduled. At this stage, you may submit a cancellation
          request through your account.
        </P>
        <P>
          A member of our team will review your request and either approve or decline
          it, depending on whether preparation has already begun. If approved, a full
          refund will be issued. If declined, you will be notified with an explanation.
        </P>
      </>
    ),
  },
  {
    id: 'non-cancellable-orders',
    title: 'Non-Cancellable Orders',
    content: (
      <>
        <P>
          Orders that have progressed to any of the following stages cannot be cancelled:
        </P>
        <Ul>
          <Li><strong className="text-espresso/80 font-medium">Preparing</strong> — Your order is actively being made</Li>
          <Li><strong className="text-espresso/80 font-medium">Ready</strong> — Your order has been packed and is awaiting pickup</Li>
          <Li><strong className="text-espresso/80 font-medium">Out for Delivery</strong> — A delivery partner is en route to your address</Li>
          <Li><strong className="text-espresso/80 font-medium">Delivered</strong> — Your order has been successfully delivered</Li>
        </Ul>
        <P>
          Due to the perishable nature of our ice cream products, we are unable to
          accept returns on delivered orders. If you experience a quality concern,
          please contact our team immediately.
        </P>
      </>
    ),
  },
  {
    id: 'refund-method',
    title: 'Refund Method & Timeline',
    content: (
      <>
        <P>
          When a refund is approved, the amount will be credited back to the original
          payment method used during checkout.
        </P>
        <Ul>
          <Li>Refund processing may take 5–10 business days depending on your payment provider</Li>
          <Li>You will receive a notification confirming the refund has been initiated</Li>
          <Li>The delivery fee, if any, will also be refunded in full for approved cancellations</Li>
        </Ul>
      </>
    ),
  },
  {
    id: 'quality-issues',
    title: 'Quality Concerns',
    content: (
      <>
        <P>
          If you receive an order that does not meet your expectations — whether due to
          incorrect items, damaged packaging, or quality concerns — please contact us
          as soon as possible.
        </P>
        <P>
          We take all quality reports seriously and will work with you to resolve the
          issue, which may include a replacement or refund at our discretion.
        </P>
      </>
    ),
  },
  {
    id: 'contact',
    title: 'Contact Us',
    content: (
      <>
        <P>
          If you have questions about a cancellation, refund, or any order-related
          concern, please don't hesitate to reach out:
        </P>
        <Ul>
          <Li>Email: support@glace.com</Li>
          <Li>Visit any of our store locations for in-person assistance</Li>
        </Ul>
        <P>
          Our team is here to ensure your experience with GLACÉ is always a positive one.
        </P>
      </>
    ),
  },
];

const RefundPolicy = () => (
  <LegalPage
    seoTitle="Refund Policy | GLACÉ"
    seoDescription="Understand GLACÉ's cancellation and refund policy. Clear, transparent guidelines for order cancellations, refunds, and quality concerns."
    eyebrow="Refunds"
    title="Refund Policy"
    subtitle="Clear, transparent guidelines for cancellations, returns, refunds, and order-related concerns."
    lastUpdated={LAST_UPDATED}
    sections={sections}
  />
);

export default RefundPolicy;
