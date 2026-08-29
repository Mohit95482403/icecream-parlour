/**
 * Centralized navigation configuration.
 * Used by Header, Footer, MobileMenu.
 */

export const mainNavLinks = [
  { label: 'Shop', href: '/shop' },
  { label: 'Gift Cards', href: '/gift-cards' },
  { label: 'Our Story', href: '/our-story' },
  { label: 'Journal', href: '/journal' },
  { label: 'Stores', href: '/stores' },
];

export const footerLinks = {
  shop: [
    { label: 'All Flavours', href: '/shop' },
    { label: 'Gift Cards', href: '/gift-cards' },
  ],
  explore: [
    { label: 'Our Story', href: '/our-story' },
    { label: 'Our Craft', href: '/our-story' },
    { label: 'Journal', href: '/journal' },
    { label: 'Stores', href: '/stores' },
  ],
  customerCare: [
    { label: 'Delivery', href: '/delivery' },
    { label: 'FAQs', href: '/faqs' },
    { label: 'Contact', href: '/contact' },
    { label: 'Returns', href: '/returns' },
  ],
  legal: [
    { label: 'Privacy Policy', href: '/privacy-policy' },
    { label: 'Terms & Conditions', href: '/terms-and-conditions' },
    { label: 'Refund Policy', href: '/refund-policy' },
  ],
};

export const socialLinks = [
  { label: 'Instagram', href: 'https://instagram.com', icon: 'instagram' },
  { label: 'Facebook', href: 'https://facebook.com', icon: 'facebook' },
  { label: 'Twitter', href: 'https://twitter.com', icon: 'twitter' },
];

export const popularSearches = [
  'Pistachio',
  'Chocolate',
  'Mango',
  'Vanilla',
  'Strawberry',
  'Salted Caramel',
];
