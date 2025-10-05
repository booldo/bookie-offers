"use client";
import { useState } from "react";

// FAQ Item Component
const FAQItem = ({ question, answer, isOpen, onToggle }) => {
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        className="w-full px-4 py-3 text-left flex justify-between items-center hover:bg-gray-50 transition-colors"
        onClick={onToggle}
      >
        <div className="font-medium text-gray-900 flex-1 text-left font-['General_Sans']">
          {question}
        </div>
        <svg
          className={`w-5 h-5 text-gray-500 transition-transform duration-300 ease-in-out ${isOpen ? 'rotate-180' : ''} flex-shrink-0 ml-2`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <div 
        className={`transition-all duration-300 ease-in-out overflow-hidden ${
          isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="px-4 pb-3 border-t border-gray-200">
          <div className="pt-3 text-gray-700 text-sm sm:text-base whitespace-pre-line font-['General_Sans']">
            {answer}
          </div>
        </div>
      </div>
    </div>
  );
};

// FAQ Section Component
const FAQSection = ({ faqs }) => {
  const [openItems, setOpenItems] = useState({});

  const toggleItem = (index) => {
    setOpenItems(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  // Don't render anything if there are no FAQs
  if (!faqs || faqs.length === 0) {
    return null;
  }

  return (
    <div>
      <h2 className="text-lg sm:text-xl md:text-2xl font-semibold mb-3 font-['General_Sans']">FAQs</h2>
      <div className="space-y-3">
        {faqs.map((faq, idx) => (
          <FAQItem
            key={idx}
            question={faq.question}
            answer={faq.answer}
            isOpen={openItems[idx] || false}
            onToggle={() => toggleItem(idx)}
          />
        ))}
      </div>
    </div>
  );
};

export default FAQSection;
