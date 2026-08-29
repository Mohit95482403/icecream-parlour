import React, { useState, useMemo } from 'react';
import { Search, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import CustomerCarePage from '../components/CustomerCarePage';
import ScrollReveal from '../components/ScrollReveal';
import SEO from '../components/seo/SEO';

/* ── FAQ Data ── */
const faqData = [
  {
    category: 'Orders',
    items: [
      {
        q: 'How do I place an order?',
        a: 'Browse our shop, add your favourite flavours to the cart, and proceed to checkout. You\'ll need to be logged in to complete your purchase. Choose your delivery address, apply any coupons, and confirm your payment.',
      },
      {
        q: 'Can I modify my order after placing it?',
        a: 'Once an order has been placed and confirmed, modifications are not currently supported. If you need to make changes, you may cancel the order (if it is still in a cancellable status) and place a new one.',
      },
      {
        q: 'What happens if an item is out of stock?',
        a: 'Our inventory is checked in real time during checkout. If an item becomes unavailable while it\'s in your cart, you will be notified before payment and the item will not be added to your order.',
      },
      {
        q: 'How do I track my order?',
        a: 'You can track your order from your Account → Orders page. You\'ll also receive notifications as your order progresses through preparation, dispatch, and delivery.',
      },
    ],
  },
  {
    category: 'Delivery',
    items: [
      {
        q: 'Where does GLACÉ deliver?',
        a: 'We deliver across India. During checkout, enter your PIN code and we\'ll confirm whether your area is serviceable and show you the estimated delivery time.',
      },
      {
        q: 'How much is the delivery fee?',
        a: 'A standard delivery fee of ₹100 applies to most orders. Certain delivery zones may have different rates or free delivery thresholds, which will be shown during checkout.',
      },
      {
        q: 'How long does delivery take?',
        a: 'We aim to deliver within approximately 60 minutes of order confirmation, though times may vary depending on your location and current demand.',
      },
    ],
  },
  {
    category: 'Payments',
    items: [
      {
        q: 'What payment methods are accepted?',
        a: 'We accept payments through the methods available on our checkout page, processed securely through our payment gateway.',
      },
      {
        q: 'Is my payment information secure?',
        a: 'Absolutely. All payments are processed through secure third-party payment providers. GLACÉ does not store your full card details on our servers.',
      },
      {
        q: 'What if my payment fails?',
        a: 'If a payment fails, your order will not be placed. You can try again with the same or a different payment method. No amount is deducted for failed transactions.',
      },
    ],
  },
  {
    category: 'Coupons',
    items: [
      {
        q: 'How do I use a coupon?',
        a: 'During checkout, enter your coupon code in the "Apply Coupon" field. The discount will be applied to your order total immediately. Only one coupon can be used per order.',
      },
      {
        q: 'Why isn\'t my coupon working?',
        a: 'Coupons may have specific conditions — such as a minimum order amount, validity period, or usage limits. Check the coupon\'s terms or contact us for assistance.',
      },
    ],
  },
  {
    category: 'Cancellations',
    items: [
      {
        q: 'Can I cancel my order?',
        a: 'If your order is still Pending, you can cancel it directly from your account and receive a full refund. If it is Confirmed, you can submit a cancellation request which will be reviewed by our team. Orders that are Preparing, Ready, Out for Delivery, or Delivered cannot be cancelled.',
      },
      {
        q: 'How long does a refund take?',
        a: 'Refund processing may take 5–10 business days, depending on your payment provider. You will receive a notification once the refund has been initiated.',
      },
      {
        q: 'What if my cancellation request is declined?',
        a: 'If your order has already entered preparation, the cancellation request may be declined. You\'ll be notified with an explanation. We do this to minimise food waste and ensure quality.',
      },
    ],
  },
  {
    category: 'Account',
    items: [
      {
        q: 'How do I create an account?',
        a: 'Click the account icon in the header or visit the registration page. You\'ll need to provide your name, email, and a password.',
      },
      {
        q: 'How do I update my profile or address?',
        a: 'Go to Account → Profile to update your personal details, or Account → Addresses to manage your saved delivery addresses.',
      },
      {
        q: 'I forgot my password. What should I do?',
        a: 'Use the "Forgot Password" link on the login page to reset your password via email.',
      },
    ],
  },
  {
    category: 'Products',
    items: [
      {
        q: 'Are GLACÉ products vegetarian?',
        a: 'Most of our flavours are vegetarian. Specific dietary information, including allergens and ingredients, is listed on each product page.',
      },
      {
        q: 'Do you offer seasonal flavours?',
        a: 'Yes! We regularly introduce seasonal and limited-edition flavours. Follow us on social media or subscribe to our newsletter to stay updated.',
      },
      {
        q: 'What sizes are available?',
        a: 'Product sizes and variants are listed on each product page. We offer multiple sizes for most of our flavours.',
      },
    ],
  },
];

/* ── Accordion Item ── */
const AccordionItem = ({ question, answer, isOpen, onToggle }) => (
  <div className="border-b border-espresso/8 last:border-b-0">
    <button
      onClick={onToggle}
      className="w-full text-left py-5 flex items-start justify-between gap-4 group focus:outline-none focus-visible:ring-2 focus-visible:ring-espresso/20 focus-visible:ring-offset-2 rounded-sm"
      aria-expanded={isOpen}
    >
      <span className={`text-base md:text-lg font-light transition-colors duration-300 ${isOpen ? 'text-espresso' : 'text-espresso/70 group-hover:text-espresso'}`}>
        {question}
      </span>
      <ChevronDown
        size={18}
        className={`shrink-0 mt-1 text-warm-taupe/50 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
      />
    </button>
    <AnimatePresence initial={false}>
      {isOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
          className="overflow-hidden"
        >
          <p className="pb-5 text-base text-espresso/50 leading-[1.8] font-light max-w-2xl">
            {answer}
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);

/* ── Page ── */
const FAQsPage = () => {
  const [search, setSearch] = useState('');
  const [openItems, setOpenItems] = useState({});
  const [activeCategory, setActiveCategory] = useState('all');

  const filteredData = useMemo(() => {
    const query = search.toLowerCase().trim();
    return faqData
      .filter((cat) => activeCategory === 'all' || cat.category === activeCategory)
      .map((cat) => ({
        ...cat,
        items: cat.items.filter(
          (item) =>
            !query ||
            item.q.toLowerCase().includes(query) ||
            item.a.toLowerCase().includes(query)
        ),
      }))
      .filter((cat) => cat.items.length > 0);
  }, [search, activeCategory]);

  const toggleItem = (key) => {
    setOpenItems((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <>
      <SEO
        title="Frequently Asked Questions | GLACÉ"
        description="Find answers to common questions about GLACÉ orders, delivery, payments, coupons, cancellations, and more."
      />
      <CustomerCarePage
        breadcrumb="FAQs"
        title="Frequently Asked Questions"
        subtitle="Everything you need to know about your GLACÉ experience."
        ctaTitle="Can't Find Your Answer?"
        ctaLabel="Contact Us"
        ctaHref="/contact"
      >
        {/* Search + Category Filters */}
        <ScrollReveal delay={0.05}>
          <div className="mb-10">
            <div className="relative mb-6">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-warm-taupe/40" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search questions..."
                className="w-full pl-12 pr-4 py-3.5 bg-cream/60 border border-espresso/10 rounded-xl text-base text-espresso placeholder:text-warm-taupe/40 focus:outline-none focus:ring-2 focus:ring-espresso/10 focus:border-espresso/20 transition-all font-light"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setActiveCategory('all')}
                className={`px-4 py-2 rounded-full text-xs uppercase tracking-[0.1em] font-medium border transition-all duration-300 ${
                  activeCategory === 'all'
                    ? 'bg-espresso text-ivory border-espresso'
                    : 'bg-transparent text-espresso/50 border-espresso/15 hover:border-espresso/30 hover:text-espresso'
                }`}
              >
                All
              </button>
              {faqData.map((cat) => (
                <button
                  key={cat.category}
                  onClick={() => setActiveCategory(cat.category)}
                  className={`px-4 py-2 rounded-full text-xs uppercase tracking-[0.1em] font-medium border transition-all duration-300 ${
                    activeCategory === cat.category
                      ? 'bg-espresso text-ivory border-espresso'
                      : 'bg-transparent text-espresso/50 border-espresso/15 hover:border-espresso/30 hover:text-espresso'
                  }`}
                >
                  {cat.category}
                </button>
              ))}
            </div>
          </div>
        </ScrollReveal>

        {/* FAQ Categories */}
        {filteredData.length === 0 ? (
          <ScrollReveal>
            <div className="text-center py-16">
              <p className="text-lg text-espresso/40 font-light">No matching questions found.</p>
              <p className="text-sm text-warm-taupe/50 mt-2">Try a different search term or category.</p>
            </div>
          </ScrollReveal>
        ) : (
          filteredData.map((cat, catIndex) => (
            <div key={cat.category} className={catIndex !== 0 ? 'mt-12 pt-12 border-t border-espresso/8' : ''}>
              <ScrollReveal delay={0.05}>
                <p className="text-[10px] uppercase tracking-[0.25em] font-medium text-warm-taupe/60 mb-4">
                  {cat.category}
                </p>
                <div>
                  {cat.items.map((item) => {
                    const key = `${cat.category}-${item.q}`;
                    return (
                      <AccordionItem
                        key={key}
                        question={item.q}
                        answer={item.a}
                        isOpen={!!openItems[key]}
                        onToggle={() => toggleItem(key)}
                      />
                    );
                  })}
                </div>
              </ScrollReveal>
            </div>
          ))
        )}
      </CustomerCarePage>
    </>
  );
};

export default FAQsPage;
