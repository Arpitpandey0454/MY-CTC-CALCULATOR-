import React, { useState } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';
import { f_simple, neg_f_simple } from '../../utils/formatters';

ChartJS.register(ArcElement, Tooltip, Legend);

export const CTCResultSummary = ({ results }) => {
    if (!results) return null;

    const {
        taxRegime,
        components,
        grossSalary,
        employerPF,
        employerGratuity,
        npsEmployer,
        deductions,
        taxCalc,
        netInHandYearly,
        netInHandMonthly
    } = results;

    const totalTaxPaid = deductions.profTax + deductions.totalTax;
    const totalInvestmentValue = (deductions.npsDeduction || 0) + (npsEmployer || 0) + (deductions.employeePF || 0) + (employerPF || 0) + (employerGratuity || 0);

    const chartData = {
        labels: ['Total Annual Salary', 'Total Tax Paid', 'Total Saving'],
        datasets: [
            {
                data: [
                    netInHandYearly,
                    totalTaxPaid,
                    totalInvestmentValue
                ],
                backgroundColor: ['#0d9488', '#ef4444', '#f59e0b'],
                borderWidth: 0,
                hoverOffset: 20,
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    color: document.documentElement.classList.contains('dark') ? '#d1d5db' : '#374151',
                    font: { size: 10 }
                }
            }
        }
    };

    return (
        <div className="p-6 rounded-2xl bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-700 h-full">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Salary Breakdown under {taxRegime === 'old' ? 'Old' : 'New'} Tax Regime</h2>

            <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
                <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                    <div className="text-center">
                        <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">Net Monthly</p>
                        <h3 className="text-2xl font-bold text-teal-600 dark:text-teal-400">{f_simple(netInHandMonthly)}</h3>
                    </div>
                    <div className="text-center">
                        <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">Net Annual</p>
                        <h3 className="text-2xl font-bold text-teal-600 dark:text-teal-400">{f_simple(netInHandYearly)}</h3>
                    </div>
                    <div className="text-center">
                        <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">Total Tax Paid</p>
                        <h3 className="text-xl font-bold text-red-500 dark:text-red-400">{f_simple(totalTaxPaid)}</h3>
                    </div>
                    <div className="text-center">
                        <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">Total Saving</p>
                        <h3 className="text-xl font-bold text-amber-500 dark:text-amber-400">{f_simple(totalInvestmentValue)}</h3>
                    </div>
                </div>
            </div>

            <div className="max-h-64 sm:max-h-72 flex justify-center my-4">
                <Pie data={chartData} options={chartOptions} />
            </div>

            <div>
                <h3 className="font-semibold mb-3 text-gray-800 dark:text-gray-100">Earnings Breakdown (Annual)</h3>
                <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Basic Salary</span> <span className="font-medium text-gray-900 dark:text-gray-100">{f_simple(components.basic)}</span></div>
                    <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">HRA</span> <span className="font-medium text-gray-900 dark:text-gray-100">{f_simple(components.hra)}</span></div>
                    <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Special Allowance</span> <span className="font-medium text-gray-900 dark:text-gray-100">{f_simple(components.special)}</span></div>
                    <div className="flex justify-between font-semibold border-t border-gray-300 dark:border-gray-700 pt-2 mt-2 text-gray-900 dark:text-gray-100">
                        <span>Gross Salary (Taxable Income Source)</span> <span>{f_simple(grossSalary)}</span>
                    </div>
                </div>
            </div>

            <div className="mt-4">
                <h3 className="font-semibold mb-3 text-gray-800 dark:text-gray-100">Tax Calculation</h3>
                <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Gross Salary</span> <span className="font-medium text-gray-900 dark:text-gray-100">{f_simple(grossSalary)}</span></div>
                    <div className="flex justify-between text-red-600 dark:text-red-400">
                        <span>Standard Deduction</span> <span>{neg_f_simple(taxCalc.standardDeduction)}</span>
                    </div>
                    <div className="flex justify-between font-semibold border-t border-gray-300 dark:border-gray-700 pt-2 mt-2 text-gray-900 dark:text-gray-100">
                        <span>Taxable Income (before other ded.)</span> <span>{f_simple(taxCalc.taxableIncome)}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const CTCResultDetails = ({ results, onShowTaxDetails }) => {
    if (!results) return null;

    const {
        ctc,
        grossSalary,
        employerPF,
        employerGratuity,
        insuranceEmployer,
        otherEmployer,
        npsEmployer,
        deductions,
    } = results;

    return (
        <div className="p-6 rounded-2xl bg-sky-50 dark:bg-sky-950/10 border border-sky-200 dark:border-sky-100">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Column 1: Deductions */}
                <div>
                    <h3 className="font-semibold mb-3 text-gray-800 dark:text-gray-100">Deductions (Annual)</h3>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Employee EPF</span> <span className="text-red-600 dark:text-red-400 font-medium">{neg_f_simple(deductions.employeePF)}</span></div>
                        <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Employee NPS</span> <span className="text-red-600 dark:text-red-400 font-medium">{neg_f_simple(deductions.npsDeduction)}</span></div>
                        <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Professional Tax</span> <span className="text-red-600 dark:text-red-400 font-medium">{neg_f_simple(deductions.profTax)}</span></div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600 dark:text-gray-400">Income Tax (TDS)</span>
                            <div className="flex items-center">
                                <span className="text-red-600 dark:text-red-400 font-medium mr-2">{neg_f_simple(deductions.totalTax)}</span>
                                <button onClick={onShowTaxDetails} className="text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 text-xs font-medium">(Details)</button>
                            </div>
                        </div>
                        <div className="flex justify-between font-semibold border-t border-gray-300 dark:border-gray-700 pt-2 mt-2 text-red-700 dark:text-red-400">
                            <span>Total Employee <br /> Deductions</span> <span>{neg_f_simple(deductions.total)}</span>
                        </div>
                    </div>
                </div>

                {/* Column 2: CTC Breakup */}
                <div className="lg:border-l border-gray-200/80 dark:border-gray-700/80 lg:px-6">
                    <h3 className="font-semibold mb-3 text-gray-800 dark:text-gray-100">Cost to Company Breakup (Total CTC)</h3>
                    <div className="space-y-2 text-sm ">
                        <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Gross Salary</span> <span className="font-medium text-gray-900 dark:text-gray-100">{f_simple(grossSalary)}</span></div>
                        <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Employer EPF</span> <span className="font-medium text-gray-900 dark:text-gray-100">{f_simple(employerPF)}</span></div>
                        <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Gratuity</span> <span className="font-medium text-gray-900 dark:text-gray-100">{f_simple(employerGratuity)}</span></div>
                        <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Insurance </span> <span className="font-medium text-gray-900 dark:text-gray-100">{f_simple(insuranceEmployer)}</span></div>
                        <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">NPS (Employer)</span> <span className="font-medium text-gray-900 dark:text-gray-100">{f_simple(npsEmployer)}</span></div>
                        <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Other Deductions (Employer Fixed)</span> <span className="font-medium text-gray-900 dark:text-gray-100">{f_simple(otherEmployer)}</span></div>
                        <div className="flex justify-between font-bold border-t border-gray-300 dark:border-gray-700 pt-2 mt-2 text-gray-900 dark:text-gray-100">
                            <span>Total CTC</span> <span>{f_simple(ctc)}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const CTCResult = ({ results, onShowTaxDetails }) => {
    return (
        <div className="grid grid-cols-1 gap-4">
            <CTCResultSummary results={results} />
            <CTCResultDetails results={results} onShowTaxDetails={onShowTaxDetails} />
        </div>
    );
};

export default CTCResult;
