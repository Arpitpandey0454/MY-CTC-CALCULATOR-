import React, { useState } from 'react';

const AboutAndFAQ = () => {
    const [openFAQ, setOpenFAQ] = useState(null);

    const toggleFAQ = (index) => {
        setOpenFAQ(openFAQ === index ? null : index);
    };

    const faqs = [
        {
            question: "1. What is CTC (Cost to Company)?",
            answer: "CTC stands for 'Cost to Company'. It is the total amount that a company spends on an employee, directly or indirectly. It includes your gross salary, employer's contribution to EPF, gratuity (if applicable), and any other benefits."
        },
        {
            question: "2. Old vs New Tax Regime?",
            answer: "Old: more deductions (HRA, LTA, 80C)\nNew: lower tax slabs but fewer exemptions."
        },
        {
            question: "3. How is EPF calculated?",
            answer: "EPF = 12% of Basic Salary (employee) + 12% employer contribution."
        }
    ];

    return (
        <section id="about-section" className="max-w-5xl mx-auto px-4 py-20">
            <div className="mt-5">
                <h2 className="text-4xl font-extrabold mb-4 bg-gradient-to-r from-teal-700 via-teal-600 to-blue-600 bg-clip-text text-transparent dark:from-teal-200 dark:via-cyan-200 dark:to-blue-200 ">
                    About the CTC Calculator
                </h2>
                <div className="bg-white/60 dark:bg-gray-900/40 backdrop-blur-xl border border-white/50 dark:border-gray-800 rounded-3xl mt-6 p-10 shadow-[0_8px_25px_rgba(0,0,0,0.06)]">
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed mt-3">
                        This calculator helps you understand the breakdown of your Cost to Company (CTC) and estimate your in-hand salary. It accounts for common deductions like Employee Provident Fund (EPF), Professional Tax, and Income Tax under both the Old and New Tax Regimes.
                    </p>
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed mt-3">
                        Please note that this is an estimation tool. The final salary and tax calculations may vary based on your company's specific policies and your complete financial profile. It's always a good idea to consult with a financial advisor for exact figures.
                    </p>
                </div>
            </div>

            <div id="faq-section" className="mt-20">
                <h2 className="text-4xl font-extrabold mb-4 bg-gradient-to-r from-teal-700 via-teal-600 to-blue-600 bg-clip-text text-transparent dark:from-teal-200 dark:via-cyan-200 dark:to-blue-200">
                    Frequently Asked Questions
                </h2>
                <div className="space-y-6 mt-6">
                    {faqs.map((faq, index) => (
                        <div
                            key={index}
                            className="faq-card bg-white/60 dark:bg-gray-900/40 backdrop-blur-xl border border-white/50 dark:border-gray-800 rounded-2xl p-6 shadow-md cursor-pointer transition-all"
                            onClick={() => toggleFAQ(index)}
                        >
                            <div className="flex justify-between items-center">
                                <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">
                                    {faq.question}
                                </h3>
                                <span className="faq-icon text-2xl text-teal-600 dark:text-teal-300 transition-all">
                                    {openFAQ === index ? '−' : '+'}
                                </span>
                            </div>
                            <p
                                className={`faq-answer text-gray-700 dark:text-gray-300 mt-3 ${openFAQ === index ? '' : 'hidden'
                                    }`}
                            >
                                {faq.answer.split('\n').map((line, i) => (
                                    <React.Fragment key={i}>
                                        {line}
                                        {i < faq.answer.split('\n').length - 1 && <br />}
                                    </React.Fragment>
                                ))}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default AboutAndFAQ;
