import {useState} from 'react'
import { ChevronDown } from 'lucide-react'
import { FAQS } from '../../utils/data'

const FaqItem = ({faq, isOpen, onClick}) => (
  <div className='bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-2xl border border-white/60 dark:border-slate-700 ring-1 ring-slate-200/60 dark:ring-slate-700 shadow-sm overflow-hidden'>
    <button
      onClick={onClick}
      className='w-full flex items-center justify-between p-6 hover:bg-white/50 dark:hover:bg-slate-700/40 cursor-pointer transition-colors duration-200'
    >
      <span className='text-lg font-medium text-gray-900 dark:text-slate-100 pr-4 text-left'>{faq.question}</span>
      <ChevronDown className={`w-6 h-6 text-gray-400 dark:text-slate-400 transition-transform duration-300 ${isOpen ? 'transform rotate-180' : ''}`} />
    </button>
    {isOpen && (
      <div className='px-6 pt-3 pb-6 text-gray-600 dark:text-slate-300 leading-relaxed border-t border-gray-100 dark:border-slate-700'>
        {faq.answer}
      </div>
    )}
  </div>
)

const Faqs = () => {

  const [openIndex, setOpenIndex] = useState(null);

  const handleClick = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  }

  return <section id='faq' className='py-12 lg:py-16'>
    <div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8'>
      <div className='text-center mb-10'>
        <h2 className='text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-slate-100 mb-4'>Frequently Asked Questions</h2>
        <p className='text-xl text-gray-600 dark:text-slate-300 max-w-3xl mx-auto'>Everything you need to know about the product and billing.</p>
      </div>
      <div className='space-y-4'>
        {FAQS.map((faq, index) => (
          <FaqItem 
            key={index}
            faq={faq}
            isOpen={openIndex === index}
            onClick={() => handleClick(index)}
          />
        ))}
      </div>
    </div>
  </section>
}

export default Faqs