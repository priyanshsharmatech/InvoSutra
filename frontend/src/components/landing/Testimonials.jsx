import React from "react";
import { Quote } from "lucide-react";
import { TESTIMONIALS } from "../../utils/data";

const Testimonials = () => {
  return (
    <section id="testimonials" className="py-12 lg:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-slate-100 mb-4">
            What our Customers Say
          </h2>
          <p className="text-xl text-gray-600 dark:text-slate-300 max-w-3xl mx-auto">
            We are trusted by thousands of all businesses.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {TESTIMONIALS.map((testimonial, index) => (
            <div
              key={index}
              className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-2xl border border-white/60 dark:border-slate-700 ring-1 ring-slate-200/60 dark:ring-slate-700 shadow-sm p-8 hover:shadow-lg transition-all duration-300 relative"
            >
              <div className="absolute -top-4 left-8 w-8 h-8 bg-gradient-to-br from-blue-950 to-blue-900 rounded-full flex items-center justify-center text-white">
                <Quote className="w-5 h-5" />
              </div>
              <p className="text-gray-700 dark:text-slate-300 mb-6 leading-relaxed italic text-lg">
                {testimonial.quote}
              </p>
              <div className="flex items-center space-x-4">
                <img
                  src={testimonial.avatar}
                  alt={testimonial.author}
                  className="w-12 h-12 rounded-full object-cover border-2 border-gray-100 dark:border-slate-700"
                />
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 dark:text-slate-100">
                    {testimonial.author}
                  </p>
                  <p className="text-gray-500 dark:text-slate-400 text-sm">{testimonial.title}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
