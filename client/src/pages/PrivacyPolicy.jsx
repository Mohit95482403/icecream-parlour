import React from 'react';
import LegalPage from '../components/LegalPage';

const LAST_UPDATED = 'August 2026';

/* Helper: consistent paragraph styling */
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
    id: 'information-we-collect',
    title: 'Information We Collect',
    content: (
      <>
        <P>
          When you interact with GLACÉ — whether placing an order, creating an account,
          or simply browsing — we may collect certain information to provide and improve
          our services.
        </P>
        <P>This includes:</P>
        <Ul>
          <Li>Name, email address, and phone number when you register or place an order</Li>
          <Li>Delivery address and order details</Li>
          <Li>Payment information processed securely through our payment partners</Li>
          <Li>Browsing behaviour and preferences to personalise your experience</Li>
          <Li>Communications you send to our support team</Li>
        </Ul>
      </>
    ),
  },
  {
    id: 'how-we-use-information',
    title: 'How We Use Your Information',
    content: (
      <>
        <P>We use the information we collect for the following purposes:</P>
        <Ul>
          <Li>Processing and fulfilling your orders, including delivery</Li>
          <Li>Managing your account and providing customer support</Li>
          <Li>Sending order confirmations, status updates, and delivery notifications</Li>
          <Li>Improving our products, website, and overall customer experience</Li>
          <Li>Sending promotional communications, only when you have opted in</Li>
        </Ul>
        <P>
          We will never sell your personal information to third parties. Your data is
          used solely to serve you better.
        </P>
      </>
    ),
  },
  {
    id: 'cookies',
    title: 'Cookies & Tracking',
    content: (
      <>
        <P>
          GLACÉ uses cookies and similar technologies to enhance your browsing experience,
          remember your preferences, and understand how visitors interact with our website.
        </P>
        <P>
          Cookies are small text files stored on your device. You can manage or disable
          cookies through your browser settings at any time, though some features of our
          website may not function optimally without them.
        </P>
      </>
    ),
  },
  {
    id: 'data-security',
    title: 'Data Security',
    content: (
      <>
        <P>
          We take the protection of your information seriously. Industry-standard security
          measures are in place to safeguard your personal data against unauthorised access,
          alteration, disclosure, or destruction.
        </P>
        <P>
          Payment processing is handled by trusted third-party providers. GLACÉ does not
          store your full payment card details on our servers.
        </P>
      </>
    ),
  },
  {
    id: 'third-party-services',
    title: 'Third-Party Services',
    content: (
      <>
        <P>
          Certain services on our platform are facilitated by trusted third parties,
          including payment gateways and delivery partners. These providers have access
          only to the information necessary to perform their functions and are obligated
          to protect your data.
        </P>
        <P>
          We encourage you to review the privacy policies of any third-party services
          you interact with through our platform.
        </P>
      </>
    ),
  },
  {
    id: 'your-rights',
    title: 'Your Rights',
    content: (
      <>
        <P>You have the right to:</P>
        <Ul>
          <Li>Access the personal information we hold about you</Li>
          <Li>Request correction of inaccurate or incomplete data</Li>
          <Li>Request deletion of your personal data, subject to legal obligations</Li>
          <Li>Opt out of promotional communications at any time</Li>
          <Li>Withdraw consent for data processing where consent was the basis</Li>
        </Ul>
        <P>
          To exercise any of these rights, please contact our team using the details
          provided below.
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
          If you have any questions, concerns, or requests regarding this Privacy Policy
          or the way we handle your data, please reach out to us:
        </P>
        <Ul>
          <Li>Email: privacy@glace.com</Li>
          <Li>Visit any of our store locations for in-person assistance</Li>
        </Ul>
        <P>
          We are committed to addressing your concerns promptly and transparently.
        </P>
      </>
    ),
  },
];

const PrivacyPolicy = () => (
  <LegalPage
    seoTitle="Privacy Policy | GLACÉ"
    seoDescription="Learn how GLACÉ collects, uses, and protects your personal information. We are committed to transparency and safeguarding your privacy."
    eyebrow="Legal"
    title="Privacy Policy"
    subtitle="A clear and thoughtful explanation of how GLACÉ respects and protects your information."
    lastUpdated={LAST_UPDATED}
    sections={sections}
  />
);

export default PrivacyPolicy;
