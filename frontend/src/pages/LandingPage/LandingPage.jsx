import React from "react";
import Header from "../../components/landing/Header";
import Hero from "../../components/landing/Hero";
import Features from "../../components/landing/Features";
import Testimonials from "../../components/landing/Testimonials";
import Faqs from "../../components/landing/Faqs";
import ContactForm from "../../components/landing/ContactForm";
import Footer from "../../components/landing/Footer";

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/40 to-slate-100 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 text-slate-700 dark:text-slate-300">
      <Header />
      <main>
        <Hero />
        <Features />
        <Testimonials />
        <Faqs />

        {/* Contact */}
        <section id="contact" className="py-12 lg:py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-8">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
              Get in touch
            </h2>
            <p className="text-slate-600 dark:text-slate-300 mt-3">
              Questions, feedback, or need a hand? Send us a message and we'll
              get back to you.
            </p>
          </div>
          <ContactForm />
        </section>

        <Footer />
      </main>
    </div>
  );
};

export default LandingPage;
