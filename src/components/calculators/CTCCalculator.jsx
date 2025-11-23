import React, { useState } from 'react';
import CTCInput from './CTCInput';
import CTCResult from './CTCResult';
import { useSalaryCalculation } from '../../hooks/useSalaryCalculation';
import Modal from '../shared/Modal';
import { f_simple } from '../../utils/formatters';

const CTCCalculator = () => {
    const salaryData = useSalaryCalculation();
    const [isTaxModalOpen, setIsTaxModalOpen] = useState(false);

    return (
        <div className="max-w-7xl mx-auto">
            <div className="max-w-5xl mx-auto mb-6">
                <div className="bg-white/60 dark:bg-gray-900 backdrop-blur-lg rounded-3xl shadow-xl border border-gray-200/50 dark:border-gray-800 p-6 sm:p-8">
                    <h2 className="text-3xl font-bold mb-2 text-gray-900 dark:text-gray-100">CTC To In-hand Calculator</h2>
                    <p className="text-gray-600 dark:text-gray-400">Enter your CTC and components to see gross, deductions and net in-hand salary.</p>
                </div>
            </div>

            <div className="max-w-7xl mx-auto">
                {/* The input component now wraps the grid structure or we need to adjust layout. 
             The original design had a 3-column grid where Input was col-1 and Results were col-2 & col-3.
             We'll recreate that grid here.
         */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="bg-white/60 dark:bg-gray-900 backdrop-blur-lg rounded-3xl shadow-xl border border-gray-200/50 dark:border-gray-800 p-6 sm:p-8 lg:col-span-3">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                            <CTCInput {...salaryData} />
                            <CTCResult results={salaryData.results} onShowTaxDetails={() => setIsTaxModalOpen(true)} />
                        </div>
                    </div>
                </div>
            </div>

            <Modal isOpen={isTaxModalOpen} onClose={() => setIsTaxModalOpen(false)} title={`Detailed Tax Calculation (${salaryData.taxRegime} Regime)`}>
                {salaryData.results && (
                    <div className="space-y-4">
                        <div>
                            <h3 className="font-medium mb-2 text-gray-900 dark:text-gray-100">Income Tax Slabs</h3>
                            <div className="text-sm space-y-2">
                                {salaryData.results.taxCalc.slabBreakdown.map((slab, index) => (
                                    <div key={index} className="flex justify-between items-center">
                                        <span className="text-gray-600 dark:text-gray-400">{slab.range}</span>
                                        <span className="text-sm bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full text-gray-700 dark:text-gray-300">@ {slab.rate}%</span>
                                        <span className="font-medium text-gray-800 dark:text-gray-200">{f_simple(slab.tax)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div>
                            <h3 className="font-medium mb-2 text-gray-900 dark:text-gray-100">Additional Charges</h3>
                            <div className="text-sm space-y-2">
                                <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Tax before Surcharge/Cess</span><span className="text-gray-900 dark:text-gray-100">{f_simple(salaryData.results.taxCalc.taxBeforeCharges)}</span></div>
                                <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Surcharge</span><span className="text-gray-900 dark:text-gray-100">{f_simple(salaryData.results.taxCalc.surcharge)}</span></div>
                                <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Health & Education Cess (4%)</span><span className="text-gray-900 dark:text-gray-100">{f_simple(salaryData.results.taxCalc.cess)}</span></div>
                            </div>
                        </div>
                        <div className="pt-4 border-t border-gray-200 dark:border-gray-600">
                            <div className="flex justify-between font-semibold text-gray-900 dark:text-gray-100">
                                <span>Total Tax Liability</span>
                                <span>{f_simple(salaryData.results.taxCalc.finalTax)}</span>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default CTCCalculator;
