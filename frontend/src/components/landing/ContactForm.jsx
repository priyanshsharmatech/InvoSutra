import { useState } from "react";
import { Loader2, Send } from "lucide-react";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import toast from "react-hot-toast";

const ContactForm = () => {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [sending, setSending] = useState(false);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || form.message.trim().length < 5) {
      toast.error("Please fill in your name, email, and a short message.");
      return;
    }
    setSending(true);
    try {
      const res = await axiosInstance.post(API_PATHS.CONTACT, form);
      toast.success(res.data.message || "Message sent!");
      setForm({ name: "", email: "", message: "" });
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Couldn't send your message. Please try again."
      );
    } finally {
      setSending(false);
    }
  };

  const inputClass =
    "w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <form
      onSubmit={onSubmit}
      className="w-full max-w-xl mx-auto bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-2xl border border-white/60 dark:border-slate-700 ring-1 ring-slate-200/60 dark:ring-slate-700 shadow-sm p-6 sm:p-8 space-y-4"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            Name
          </label>
          <input
            name="name"
            value={form.name}
            onChange={onChange}
            placeholder="Your name"
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            Email
          </label>
          <input
            name="email"
            type="email"
            value={form.email}
            onChange={onChange}
            placeholder="you@example.com"
            className={inputClass}
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
          Message
        </label>
        <textarea
          name="message"
          rows={5}
          value={form.message}
          onChange={onChange}
          placeholder="How can we help?"
          className={inputClass}
        />
      </div>
      <button
        type="submit"
        disabled={sending}
        className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-950 to-blue-900 text-white py-3 px-4 rounded-lg font-medium hover:opacity-95 transition disabled:opacity-60 cursor-pointer"
      >
        {sending ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" /> Sending...
          </>
        ) : (
          <>
            <Send className="w-4 h-4" /> Send message
          </>
        )}
      </button>
    </form>
  );
};

export default ContactForm;
