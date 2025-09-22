"use client";
import React, { useState } from "react";
import { PortableText } from '@portabletext/react';

// FAQ Item Component
const FAQItem = ({ question, answer, isOpen, onToggle, portableTextComponents }) => {
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        className="w-full px-4 py-3 text-left flex justify-between items-center hover:bg-gray-50 transition-colors"
        onClick={onToggle}
      >
        <div className="font-medium text-gray-900 flex-1 text-left font-['General_Sans']">
          {typeof question === 'string' ? question : <PortableText value={question} components={portableTextComponents} />}
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
          <div className="pt-3 text-gray-700 text-sm sm:text-base font-['General_Sans']">
            {typeof answer === 'string' ? (
              <div className="whitespace-pre-line">{answer}</div>
            ) : (
              <PortableText value={answer} components={portableTextComponents} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// FAQ Container Component with state management
export default function FAQContainer({ faqs, portableTextComponents }) {
  const [openItems, setOpenItems] = useState({});

  const toggleItem = (index) => {
    setOpenItems(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

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
            portableTextComponents={portableTextComponents}
          />
        ))}
      </div>
    </div>
  );
}
