import { Link, useNavigate } from "react-router-dom";
import HERO_IMG from "../../assets/invoice_dashboard.png";
import { useAuth } from "../../context/AuthContext";

const Hero = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleDashboardClick = () => {
    if (user) {
      navigate("/dashboard");
    } else {
      navigate("/login");
    }
  };

  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:60px_60px]"></div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-lg sm:text-5xl lg:text-6xl font-extrabold text-blue-950 dark:text-blue-200 leading-tight mb-6">
            AI-Powered Invoicing, Made Effortless
          </h1>

          <p className="text-base sm:text-xl text-gray-700 dark:text-slate-300 mb-8 leading-relaxed max-w-3xl mx-auto">
            Let our AI create invoices from simple text, generate payment
            reminders, and provide smart insights to help you manage your
            finances.
          </p>

          <div className="inline-flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4 bg-white/60 dark:bg-slate-800/80 backdrop-blur-md rounded-2xl border border-white/60 dark:border-slate-700 ring-1 ring-slate-200/60 dark:ring-slate-700 shadow-sm p-4">
            <button
              onClick={handleDashboardClick}
              className="bg-gradient-to-r from-blue-950 to-blue-900 text-white px-8 py-4 rounded-xl font-bold text-base sm:text-lg hover:bg-blue-900 transition-all duration-200 hover:scale-105 hover:shadow-2xl transform cursor-pointer"
            >
              Go to Dashboard
            </button>

            <a
              href="#features"
              className="border-2 border-black dark:border-slate-500 text-black dark:text-slate-100 px-8 py-4 rounded-xl font-bold text-base sm:text-lg hover:bg-white dark:hover:bg-slate-700 hover:text-black dark:hover:text-white transition-all duration-200 hover:scale-105"
            >
              Learn More
            </a>
          </div>
        </div>

        <div className="mt-10 sm:mt-12 relative max-w-5xl mx-auto">
          <img
            src={HERO_IMG}
            alt="Invoice App Screenshot"
            className="rounded-2xl shadow-2xl shadow-gray-300 dark:shadow-slate-950 border-4 border-gray-200/20 dark:border-slate-700/40"
          />
        </div>
      </div>
    </section>
  );
};

export default Hero;
