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
    id: 'acceptance',
    title: 'Acceptance of Terms',
    content: (
      <>
        <P>
          By accessing and using the GLACÉ website, placing an order, or creating an
          account, you agree to be bound by these Terms & Conditions. If you do not
          agree with any part of these terms, please refrain from using our services.
        </P>
        <P>
          We may update these terms from time to time. Continued use of our website
          following any changes constitutes your acceptance of the revised terms.
        </P>
      </>
    ),
  },
  {
    id: 'account',
    title: 'Your Account',
    content: (
      <>
        <P>
          When you create an account with GLACÉ, you are responsible for maintaining the
          confidentiality of your login credentials and for all activities that occur
          under your account.
        </P>
        <Ul>
          <Li>You must provide accurate and complete registration information</Li>
          <Li>You are responsible for updating your account details if they change</Li>
          <Li>Notify us immediately if you suspect unauthorised access to your account</Li>
        </Ul>
        <P>
          GLACÉ reserves the right to suspend or terminate accounts that violate these
          terms or are suspected of fraudulent activity.
        </P>
      </>
    ),
  },
  {
    id: 'orders-and-pricing',
    title: 'Orders & Pricing',
    content: (
      <>
        <P>
          All prices displayed on the GLACÉ website are in Indian Rupees (₹) and are
          inclusive of applicable charges unless stated otherwise. A delivery fee may
          apply and will be clearly displayed during checkout.
        </P>
        <P>
          By placing an order, you are making an offer to purchase the selected products.
          We reserve the right to accept or decline any order. An order confirmation
          does not guarantee availability — in the unlikely event of a stock issue, we
          will notify you promptly.
        </P>
        <P>
          Product availability is subject to stock levels. Items may become unavailable
          between the time you add them to your cart and complete your purchase. Our
          system will notify you if any selected item is out of stock.
        </P>
      </>
    ),
  },
  {
    id: 'payment',
    title: 'Payment',
    content: (
      <>
        <P>
          Payment must be completed at the time of placing your order. We accept payment
          through the methods made available on our checkout page.
        </P>
        <P>
          All payment transactions are processed through secure third-party payment
          gateways. GLACÉ does not store your full payment card details.
        </P>
        <P>
          If a payment fails or is declined, your order will not be processed. You may
          retry with an alternative payment method.
        </P>
      </>
    ),
  },
  {
    id: 'delivery',
    title: 'Delivery',
    content: (
      <>
        <P>
          GLACÉ aims to deliver your order within the estimated timeframe provided at
          checkout. Delivery times are estimates and may vary based on demand,
          weather conditions, and other factors.
        </P>
        <P>
          You are responsible for providing an accurate and complete delivery address.
          GLACÉ is not liable for delays or failed deliveries resulting from incorrect
          address information.
        </P>
        <P>
          Once your order is out for delivery, a delivery partner will be assigned and
          you will receive status updates through your account notifications.
        </P>
      </>
    ),
  },
  {
    id: 'cancellations',
    title: 'Cancellations',
    content: (
      <>
        <P>
          Our cancellation policy is designed to be fair while ensuring that prepared
          food products are not wasted. The ability to cancel depends on the current
          status of your order:
        </P>
        <Ul>
          <Li>
            <strong className="text-espresso/80 font-medium">Pending orders</strong> — You may cancel
            directly from your account. A full refund will be issued.
          </Li>
          <Li>
            <strong className="text-espresso/80 font-medium">Confirmed orders</strong> — You may submit a
            cancellation request. An administrator will review and approve or decline the
            request based on preparation status.
          </Li>
          <Li>
            <strong className="text-espresso/80 font-medium">Preparing, Ready, Out for Delivery, or Delivered</strong> — Cancellation is
            not available at these stages, as the order is already being prepared or has
            been dispatched.
          </Li>
        </Ul>
        <P>
          For complete refund details, please refer to our{' '}
          <a href="/refund-policy" className="text-espresso/80 underline underline-offset-2 hover:text-espresso transition-colors">
            Refund Policy
          </a>.
        </P>
      </>
    ),
  },
  {
    id: 'intellectual-property',
    title: 'Intellectual Property',
    content: (
      <>
        <P>
          All content on the GLACÉ website — including text, images, logos, graphics,
          product names, and design elements — is the property of GLACÉ and is protected
          by applicable intellectual property laws.
        </P>
        <P>
          You may not reproduce, distribute, modify, or use any content from this
          website without prior written permission from GLACÉ.
        </P>
      </>
    ),
  },
  {
    id: 'limitation-of-liability',
    title: 'Limitation of Liability',
    content: (
      <>
        <P>
          GLACÉ strives to ensure all information on our website is accurate and
          up to date. However, we do not guarantee that the website will be error-free
          or uninterrupted at all times.
        </P>
        <P>
          To the maximum extent permitted by law, GLACÉ shall not be liable for any
          indirect, incidental, or consequential damages arising from your use of
          our website or services.
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
          If you have any questions about these Terms & Conditions, please contact us:
        </P>
        <Ul>
          <Li>Email: support@glace.com</Li>
          <Li>Visit any of our store locations for in-person assistance</Li>
        </Ul>
      </>
    ),
  },
];

const TermsAndConditions = () => (
  <LegalPage
    seoTitle="Terms & Conditions | GLACÉ"
    seoDescription="Read the terms and conditions that govern your use of the GLACÉ website, ordering, delivery, and account services."
    eyebrow="Legal"
    title="Terms & Conditions"
    subtitle="The principles that guide every GLACÉ experience."
    lastUpdated={LAST_UPDATED}
    sections={sections}
  />
);

export default TermsAndConditions;
