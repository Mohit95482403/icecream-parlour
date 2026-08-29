import React, { useState } from 'react';
import { Send, CheckCircle } from 'lucide-react';
import CustomerCarePage from '../components/CustomerCarePage';
import ScrollReveal from '../components/ScrollReveal';
import SEO from '../components/seo/SEO';

const ContactPage = () => {
  const [form, setForm] = useState({ name: '', email: '', orderNumber: '', subject: '', message: '' });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('idle'); // idle | sending | sent | error

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    if (!form.email.trim()) errs.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Please enter a valid email';
    if (!form.subject.trim()) errs.subject = 'Subject is required';
    if (!form.message.trim()) errs.message = 'Message is required';
    else if (form.message.trim().length < 10) errs.message = 'Message must be at least 10 characters';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setStatus('sending');

    // Note: No contact API exists on the backend. This simulates a submission
    // and shows a success state. When a backend endpoint is added, replace this
    // with an actual API call.
    try {
      await new Promise((resolve) => setTimeout(resolve, 1200));
      setStatus('sent');
      setForm({ name: '', email: '', orderNumber: '', subject: '', message: '' });
    } catch {
      setStatus('error');
    }
  };

  const Field = ({ label, name, type = 'text', required = true, placeholder = '', ...rest }) => (
    <div>
      <label htmlFor={`contact-${name}`} className="block text-xs uppercase tracking-[0.1em] font-medium text-espresso/50 mb-2">
        {label} {!required && <span className="normal-case tracking-normal text-warm-taupe/40">(optional)</span>}
      </label>
      {rest.textarea ? (
        <textarea
          id={`contact-${name}`}
          value={form[name]}
          onChange={(e) => { setForm((f) => ({ ...f, [name]: e.target.value })); setErrors((er) => ({ ...er, [name]: undefined })); }}
          placeholder={placeholder}
          rows={5}
          className={`w-full px-4 py-3.5 bg-cream/40 border rounded-xl text-base text-espresso placeholder:text-warm-taupe/35 focus:outline-none focus:ring-2 focus:ring-espresso/10 focus:border-espresso/20 transition-all font-light resize-none ${errors[name] ? 'border-berry/40' : 'border-espresso/10'}`}
        />
      ) : (
        <input
          id={`contact-${name}`}
          type={type}
          value={form[name]}
          onChange={(e) => { setForm((f) => ({ ...f, [name]: e.target.value })); setErrors((er) => ({ ...er, [name]: undefined })); }}
          placeholder={placeholder}
          className={`w-full px-4 py-3.5 bg-cream/40 border rounded-xl text-base text-espresso placeholder:text-warm-taupe/35 focus:outline-none focus:ring-2 focus:ring-espresso/10 focus:border-espresso/20 transition-all font-light ${errors[name] ? 'border-berry/40' : 'border-espresso/10'}`}
        />
      )}
      {errors[name] && <p className="text-sm text-berry/70 mt-1.5 font-light">{errors[name]}</p>}
    </div>
  );

  return (
    <>
      <SEO
        title="Contact GLACÉ | Customer Care"
        description="Get in touch with GLACÉ. We'd love to hear from you — whether it's a question, feedback, or just to say hello."
      />
      <CustomerCarePage
        breadcrumb="Contact"
        title="We're Here To Help"
        subtitle="Have a question, feedback, or just want to say hello? We'd love to hear from you."
        ctaTitle="Explore More"
        ctaLabel="View FAQs"
        ctaHref="/faqs"
        ctaText="Many common questions are already answered in our FAQ."
      >
        <div className="md:grid md:grid-cols-5 md:gap-12 lg:gap-16">

          {/* Contact Details */}
          <div className="md:col-span-2 mb-10 md:mb-0">
            <ScrollReveal delay={0.05}>
              <p className="text-[10px] uppercase tracking-[0.25em] font-medium text-warm-taupe/60 mb-6">
                Contact GLACÉ
              </p>

              <div className="space-y-8">
                <div>
                  <p className="text-xs uppercase tracking-[0.15em] font-medium text-espresso/40 mb-1">Email</p>
                  <a
                    href="mailto:support@glace.com"
                    className="text-base md:text-lg text-espresso/70 font-light hover:text-espresso transition-colors"
                  >
                    support@glace.com
                  </a>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-[0.15em] font-medium text-espresso/40 mb-1">Customer Care Hours</p>
                  <p className="text-base text-espresso/60 font-light leading-relaxed">
                    Monday – Saturday<br />
                    10:00 AM – 7:00 PM IST
                  </p>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-[0.15em] font-medium text-espresso/40 mb-1">Visit Us</p>
                  <p className="text-base text-espresso/60 font-light leading-relaxed">
                    Find your nearest GLACÉ store on our{' '}
                    <a href="/stores" className="underline underline-offset-2 hover:text-espresso transition-colors">
                      Stores
                    </a>{' '}
                    page.
                  </p>
                </div>
              </div>
            </ScrollReveal>
          </div>

          {/* Contact Form */}
          <div className="md:col-span-3">
            <ScrollReveal delay={0.1}>
              <p className="text-[10px] uppercase tracking-[0.25em] font-medium text-warm-taupe/60 mb-6">
                Send a Message
              </p>

              {status === 'sent' ? (
                <div className="bg-cream/60 border border-espresso/8 rounded-2xl p-10 text-center">
                  <CheckCircle size={32} className="mx-auto mb-4 text-pistachio" />
                  <h3 className="font-display text-2xl text-espresso mb-2">Message Received</h3>
                  <p className="text-base text-espresso/55 font-light max-w-sm mx-auto leading-relaxed">
                    Thank you for reaching out. We'll get back to you as soon as possible.
                  </p>
                  <button
                    onClick={() => setStatus('idle')}
                    className="mt-6 text-xs uppercase tracking-[0.15em] font-medium text-espresso/60 hover:text-espresso transition-colors"
                  >
                    Send another message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <Field label="Full Name" name="name" placeholder="Your name" />
                    <Field label="Email" name="email" type="email" placeholder="you@example.com" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <Field label="Order Number" name="orderNumber" required={false} placeholder="e.g. ICE-20260822-1234" />
                    <Field label="Subject" name="subject" placeholder="How can we help?" />
                  </div>
                  <Field label="Message" name="message" textarea placeholder="Tell us more..." />

                  {status === 'error' && (
                    <p className="text-sm text-berry/70 font-light">
                      Something went wrong. Please try again or email us directly.
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={status === 'sending'}
                    className="inline-flex items-center gap-2 px-7 py-3.5 text-xs uppercase tracking-[0.06em] font-medium bg-espresso text-ivory rounded-full hover:bg-charcoal transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {status === 'sending' ? (
                      <>
                        <span className="w-4 h-4 border-2 border-ivory/30 border-t-ivory rounded-full animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send size={14} />
                        Send Message
                      </>
                    )}
                  </button>
                </form>
              )}
            </ScrollReveal>
          </div>
        </div>
      </CustomerCarePage>
    </>
  );
};

export default ContactPage;
