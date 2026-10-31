import { ArrowRight } from "lucide-react";
import { FEATURES } from "../../utils/data";

const Features = () => {
  return (
    <section id="features" className="py-12 lg:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-10">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-slate-100 mb-4">
            Powerful Features to Run Your Business
          </h2>
          <p className="text-xl text-gray-600 dark:text-slate-300 max-w-3xl mx-auto">
            Everything you need to manage your invoicing and get paid.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {FEATURES.map((feature, index) => (
            <div
              key={index}
              className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-2xl border border-white/60 dark:border-slate-700 ring-1 ring-slate-200/60 dark:ring-slate-700 shadow-sm p-8 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
            >
              <div className="w-16 h-16 bg-blue-50/80 rounded-2xl flex items-center justify-center mb-6">
                <feature.icon className="w-8 h-8 text-blue-900" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-slate-100 mb-4">
                {feature.title}
              </h3>
              <p className="text-gray-600 dark:text-slate-300 leading-relaxed">
                {feature.description}
              </p>
              <a
                href="#"
                className="inline-flex items-center text-blue-900 font-medium mt-4 hover:text-black transition-colors duration-200"
              >
                Learn More <ArrowRight className="w-4 ml-2" />
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
