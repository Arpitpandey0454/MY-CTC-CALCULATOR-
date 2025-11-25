import React, { useState, useEffect } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';
import Input from '../shared/Input';
import Button from '../shared/Button';
import { Download } from 'lucide-react';
import { f_simple, neg_f_simple, numberToWordsIndian, formatIndianCurrency, formatIndianNumber, parseIndianNumber } from '../../utils/formatters';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import ShareModal from '../shared/ShareModal';
import { Share2 } from 'lucide-react';

ChartJS.register(ArcElement, Tooltip, Legend);

const ReverseCTC = () => {
    // Initialize state from URL params if available
    const getInitialState = () => {
        const params = new URLSearchParams(window.location.search);
        if (params.get('tab') !== 'inhand-to-ctc') return null;

        return {
            target: params.get('target'),
            regime: params.get('regime'),
            pf: params.get('pf') === 'true',
            pt: params.get('pt') === 'true'
        };
    };

    const urlState = getInitialState();

    const [targetInHand, setTargetInHand] = useState(urlState?.target ? parseFloat(urlState.target) : 70000);
    const [taxRegime, setTaxRegime] = useState(urlState?.regime || 'new');
    const [includePF, setIncludePF] = useState(urlState ? urlState.pf : true);
    const [includeProfTax, setIncludeProfTax] = useState(urlState ? urlState.pt : true);
    const [results, setResults] = useState(null);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);

    // Tax Slabs (Same as in useSalaryCalculation, could be shared)
    const oldTaxSlabs = [
        { limit: 250000, rate: 0 }, { limit: 500000, rate: 0.05 },
        { limit: 1000000, rate: 0.20 }, { limit: Infinity, rate: 0.30 }
    ];
    const newTaxSlabs = [
        { limit: 300000, rate: 0 }, { limit: 600000, rate: 0.05 },
        { limit: 900000, rate: 0.10 }, { limit: 1200000, rate: 0.15 },
        { limit: 1500000, rate: 0.20 }, { limit: Infinity, rate: 0.30 }
    ];

    const calculateTax = (income, slabs) => {
        let tax = 0;
        let remainingIncome = income;
        let previousLimit = 0;

        for (let i = 0; i < slabs.length; i++) {
            const slab = slabs[i];
            if (remainingIncome <= 0) break;
            const upperLimit = slab.limit;
            let taxableInSlab = (upperLimit === Infinity) ? remainingIncome - previousLimit : Math.min(remainingIncome, upperLimit) - previousLimit;

            if (taxableInSlab > 0) {
                tax += taxableInSlab * slab.rate;
                remainingIncome -= taxableInSlab;
            }
            previousLimit = upperLimit;
        }

        let surcharge = 0;
        if (income > 5000000 && income <= 10000000) surcharge = tax * 0.10;
        else if (income > 10000000) surcharge = tax * 0.15; // Simplified surcharge

        tax += surcharge;
        const cess = tax * 0.04;
        return tax + cess;
    };

    const calculateInHandFromCTC = (trialCTC) => {
        const basic = trialCTC * 0.40;
        const hra = basic * 0.40;
        const employerPF = includePF ? basic * 0.12 : 0;
        const employerGratuity = basic * 0.0481;
        const special = Math.max(0, trialCTC - (basic + hra + employerPF + employerGratuity));

        const grossSalary = basic + hra + special;
        const employeePF = includePF ? basic * 0.12 : 0;
        const profTax = includeProfTax ? 2500 : 0;
        const standardDeduction = 50000;

        let taxableIncome = grossSalary;
        let finalTax = 0;

        if (taxRegime === 'old') {
            const hraExemption = Math.min(hra, basic * 0.50);
            const section80C = Math.min(employeePF, 150000);
            taxableIncome -= (standardDeduction + hraExemption + section80C);
            finalTax = calculateTax(Math.max(0, taxableIncome), oldTaxSlabs);
            if (taxableIncome <= 500000) finalTax = Math.max(0, finalTax - 12500);
        } else {
            taxableIncome -= standardDeduction;
            finalTax = calculateTax(Math.max(0, taxableIncome), newTaxSlabs);
            if (taxableIncome <= 700000) finalTax = 0;
        }

        const totalDeductions = employeePF + profTax + finalTax;
        const netInHandYearly = grossSalary - totalDeductions;
        const netInHandMonthly = netInHandYearly / 12;

        return {
            ctc: trialCTC,
            components: { basic, hra, special },
            grossSalary,
            employerPF,
            deductions: { employeePF, profTax, totalTax: finalTax, total: totalDeductions },
            netInHandYearly,
            netInHandMonthly
        };
    };

    const handleCalculate = () => {
        const target = parseFloat(targetInHand) || 0;
        if (target === 0) return;

        let minCTC = target * 12;
        let maxCTC = target * 24;
        let finalRes = {};

        // Binary search for CTC
        for (let i = 0; i < 30; i++) {
            let trialCTC = (minCTC + maxCTC) / 2;
            finalRes = calculateInHandFromCTC(trialCTC);
            if (Math.abs(finalRes.netInHandMonthly - target) < 1) break;
            if (finalRes.netInHandMonthly < target) minCTC = trialCTC;
            else maxCTC = trialCTC;
        }
        setResults(finalRes);
    };

    const generateShareUrl = () => {
        const params = new URLSearchParams();
        params.set('tab', 'inhand-to-ctc');
        params.set('target', targetInHand);
        params.set('regime', taxRegime);
        params.set('pf', includePF);
        params.set('pt', includeProfTax);

        const url = new URL(window.location);
        url.search = params.toString();
        return url.toString();
    };

    useEffect(() => {
        handleCalculate();
    }, [targetInHand, taxRegime, includePF, includeProfTax]);

    const chartData = results ? {
        labels: ['Net In-Hand', 'Employee PF', 'Prof. Tax', 'Income Tax'],
        datasets: [{
            data: [results.netInHandYearly, results.deductions.employeePF, results.deductions.profTax, results.deductions.totalTax],
            backgroundColor: ['#0d9488', '#f59e0b', '#eab308', '#ef4444'],
            borderWidth: 0,
        }]
    } : null;

    const handleDownloadPDF = () => {
        if (!results) return;
        const doc = new jsPDF();
        const { ctc, components, grossSalary, employerPF, deductions, netInHandYearly, netInHandMonthly } = results;
        doc.setFontSize(18); doc.text('Salary Breakdown (In-hand to CTC)', 105, 20, { align: 'center' });
        doc.setFontSize(12); doc.text(`Tax Regime: ${taxRegime === 'old' ? 'Old' : 'New'}`, 105, 30, { align: 'center' });
        let y = 45;
        doc.setFontSize(14); doc.text('Summary', 20, y); y += 10;
        doc.setFontSize(12); doc.text(`Required Total CTC:`, 20, y); doc.text(f_simple(ctc), 180, y, { align: 'right' }); y += 8;
        doc.text(`Net Annual Salary:`, 20, y); doc.text(f_simple(netInHandYearly), 180, y, { align: 'right' }); y += 8;
        doc.text(`Net Monthly Salary:`, 20, y); doc.text(f_simple(netInHandMonthly), 180, y, { align: 'right' }); y += 15;
        doc.setFontSize(14); doc.text('Earnings (Annual)', 20, y); y += 10;
        doc.setFontSize(12); doc.text('Basic Salary:', 20, y); doc.text(f_simple(components.basic), 180, y, { align: 'right' }); y += 8;
        doc.text('HRA:', 20, y); doc.text(f_simple(components.hra), 180, y, { align: 'right' }); y += 8;
        doc.text('Special Allowance:', 20, y); doc.text(f_simple(components.special), 180, y, { align: 'right' }); y += 8;
        doc.setFont(undefined, 'bold'); doc.text('Gross Salary:', 20, y); doc.text(f_simple(grossSalary), 180, y, { align: 'right' }); y += 15;
        doc.setFont(undefined, 'normal'); doc.setFontSize(14); doc.text('Deductions (Annual)', 20, y); y += 10;
        doc.setFontSize(12); doc.text('Employee EPF:', 20, y); doc.text(f_simple(deductions.employeePF), 180, y, { align: 'right' }); y += 8;
        doc.text('Professional Tax:', 20, y); doc.text(f_simple(deductions.profTax), 180, y, { align: 'right' }); y += 8;
        doc.text('Income Tax:', 20, y); doc.text(f_simple(deductions.totalTax), 180, y, { align: 'right' }); y += 8;
        doc.setFont(undefined, 'bold'); doc.text('Total Deductions:', 20, y); doc.text(f_simple(deductions.total), 180, y, { align: 'right' }); y += 15;
        doc.setFont(undefined, 'normal'); doc.setFontSize(14); doc.text('CTC Breakup', 20, y); y += 10;
        doc.setFontSize(12); doc.text('Gross Salary:', 20, y); doc.text(f_simple(grossSalary), 180, y, { align: 'right' }); y += 8;
        doc.text('Employer EPF:', 20, y); doc.text(f_simple(employerPF), 180, y, { align: 'right' }); y += 8;
        doc.setFont(undefined, 'bold'); doc.text('Total CTC:', 20, y); doc.text(f_simple(ctc), 180, y, { align: 'right' });
        doc.save('salary-breakdown-inhand-to-ctc.pdf');
    };

    const handleDownloadExcel = () => {
        if (!results) return;
        const { ctc, components, grossSalary, employerPF, deductions, netInHandYearly, netInHandMonthly } = results;
        const wb = XLSX.utils.book_new();
        const wsData = [
            ['Salary Breakdown (In-hand to CTC)'], ['Tax Regime', taxRegime],
            [], ['Summary', 'Amount'],
            ['Required Total CTC', ctc], ['Net Annual Salary', netInHandYearly], ['Net Monthly Salary', netInHandMonthly],
            [], ['Earnings (Annual)', 'Amount'],
            ['Basic Salary', components.basic],
            ['HRA', components.hra],
            ['Special Allowance', components.special],
            ['Gross Salary', grossSalary],
            [], ['Deductions (Annual)', 'Amount'],
            ['Employee EPF', deductions.employeePF],
            ['Professional Tax', deductions.profTax],
            ['Income Tax', deductions.totalTax],
            ['Total Deductions', deductions.total],
            [], ['CTC Breakup', 'Amount'],
            ['Gross Salary', grossSalary],
            ['Employer EPF', employerPF],
            ['Total CTC', ctc]
        ];
        const ws = XLSX.utils.aoa_to_sheet(wsData);
        XLSX.utils.book_append_sheet(wb, ws, 'Salary Breakdown');
        XLSX.writeFile(wb, 'salary-breakdown-inhand-to-ctc.xlsx');
    };

    return (
        <div className="max-w-3xl mx-auto">
            <div className="max-w-3xl mx-auto mb-6">
                <div className="bg-white/60 dark:bg-gray-900 backdrop-blur-lg rounded-3xl shadow-xl border border-gray-200/50 dark:border-gray-800 p-6 sm:p-8">
                    <h2 className="text-3xl font-bold mb-2 text-gray-900 dark:text-gray-100">In-hand TO CTC Calculator</h2>
                    <p className="text-gray-600 dark:text-gray-400">Enter desired monthly in-hand to estimate required CTC and breakdown.</p>
                </div>
            </div>

            <div className="max-w-5xl mx-auto">
                {/* Top Row: Input and Summary */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-3">

                    {/* Left: Input Panel */}
                    <div className="p-6 rounded-2xl bg-sky-50 dark:bg-sky-950/10 border border-sky-200 dark:border-sky-100 h-full">
                        <h4 className="font-semibold mb-3 text-gray-800 dark:text-gray-100">Calculate CTC from In-hand</h4>
                        <div>
                            <label className="block text-gray-700 dark:text-gray-300 font-medium mb-4">Desired Net Monthly In-hand</label>
                            <div className="flex items-center bg-gray-200 dark:bg-gray-700 rounded-full w-full px-4 py-2">
                                <span className="text-gray-600 dark:text-gray-300 font-medium">₹</span>
                                <input
                                    type="text"
                                    className="w-full bg-transparent text-gray-700 dark:text-gray-200 font-medium text-right focus:outline-none"
                                    value={formatIndianNumber(targetInHand)}
                                    onChange={(e) => setTargetInHand(parseIndianNumber(e.target.value))}
                                />
                            </div>
                            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{numberToWordsIndian(targetInHand)}</p>
                        </div>

                        <div className="mt-4 flex justify-between items-center">
                            <h5 className="text-medium font-medium text-gray-700 dark:text-gray-300">Income Tax Regime</h5>
                            <div className="flex items-center space-x-4">
                                <label className="inline-flex items-center cursor-pointer">
                                    <input type="radio" name="taxRegime_reverse" value="new" checked={taxRegime === 'new'} onChange={() => setTaxRegime('new')} className="h-4 w-4 text-teal-600 dark:text-teal-500 border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:ring-teal-500" />
                                    <span className="ml-2 text-gray-700 dark:text-gray-300">New</span>
                                </label>
                                <label className="inline-flex items-center cursor-pointer">
                                    <input type="radio" name="taxRegime_reverse" value="old" checked={taxRegime === 'old'} onChange={() => setTaxRegime('old')} className="h-4 w-4 text-teal-600 dark:text-teal-500 border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:ring-teal-500" />
                                    <span className="ml-2 text-gray-700 dark:text-gray-300">Old</span>
                                </label>
                            </div>
                        </div>

                        <hr className="border-gray-200/80 dark:border-gray-700/80 my-4" />

                        <div className="space-y-3">
                            <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300">Assumed Deductions</h5>
                            <label className="flex items-center cursor-pointer mt-2">
                                <input type="checkbox" checked={includePF} onChange={(e) => setIncludePF(e.target.checked)} className="h-5 w-5 text-teal-600 dark:text-teal-500 border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 focus:ring-teal-500" />
                                <span className="ml-2 text-gray-700 dark:text-gray-300">EPF Applicable</span>
                            </label>
                            <label className="flex items-center cursor-pointer">
                                <input type="checkbox" checked={includeProfTax} onChange={(e) => setIncludeProfTax(e.target.checked)} className="h-5 w-5 text-teal-600 dark:text-teal-500 border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 focus:ring-teal-500" />
                                <span className="ml-2 text-gray-700 dark:text-gray-300">Professional Tax</span>
                            </label>
                        </div>

                        <Button onClick={handleCalculate} className="mt-4 w-full py-3 rounded-full shadow-lg">
                            Calculate Required CTC
                        </Button>
                    </div>

                    {/* Right: Summary Panel (Results + Earnings) */}
                    {results && (
                        <div className="p-6 rounded-2xl bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-700 h-full">
                            <h4 className="font-semibold mb-3 text-gray-800 dark:text-gray-100">Required CTC Breakdown</h4>
                            <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg text-center mb-4">
                                <p className="text-center text-gray-600 dark:text-gray-400 text-sm">Required Annual CTC</p>
                                <h3 className="text-3xl font-bold text-center text-blue-600 dark:text-blue-400">{formatIndianCurrency(results.ctc)}</h3>
                                <p className="text-center text-gray-500 dark:text-gray-500 text-sm mt-2">Gives Net Monthly: <span className="font-medium text-gray-600 dark:text-gray-400">{f_simple(results.netInHandMonthly)}</span></p>
                            </div>
                            <div className="max-h-64 sm:max-h-72 flex justify-center mb-4">
                                <Pie data={chartData} options={{ responsive: true, plugins: { legend: { position: 'bottom', labels: { color: document.documentElement.classList.contains('dark') ? '#d1d5db' : '#374151', font: { size: 10 } } } } }} />
                            </div>

                            {/* Earnings Section Moved Here */}
                            <div>
                                <h5 className="font-semibold mb-2 text-gray-800 dark:text-gray-100">Earnings Breakdown (Annual)</h5>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Basic Salary</span> <span className="font-medium text-gray-900 dark:text-gray-100">{f_simple(results.components.basic)}</span></div>
                                    <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">HRA</span> <span className="font-medium text-gray-900 dark:text-gray-100">{f_simple(results.components.hra)}</span></div>
                                    <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Special Allowance</span> <span className="font-medium text-gray-900 dark:text-gray-100">{f_simple(results.components.special)}</span></div>
                                    <div className="flex justify-between font-semibold border-t border-gray-300 dark:border-gray-700 pt-2 mt-2 text-gray-900 dark:text-gray-100">
                                        <span>Gross Salary</span> <span>{f_simple(results.grossSalary)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Bottom Row: Details Panel (Full Width) */}
                {results && (
                    <div className="mt-4 p-6 rounded-2xl bg-sky-50 dark:bg-sky-950/10 border border-sky-200 dark:border-sky-100">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                            {/* Column 1: Deductions */}
                            <div>
                                <h5 className="font-semibold mb-3 text-gray-800 dark:text-gray-100">Deductions (Annual)</h5>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">EPF (Employee)</span> <span className="text-red-600 dark:text-red-400 font-medium">{neg_f_simple(results.deductions.employeePF)}</span></div>
                                    <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Professional Tax</span> <span className="text-red-600 dark:text-red-400 font-medium">{neg_f_simple(results.deductions.profTax)}</span></div>
                                    <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Income Tax</span> <span className="text-red-600 dark:text-red-400 font-medium">{neg_f_simple(results.deductions.totalTax)}</span></div>
                                    <div className="flex justify-between font-semibold border-t border-gray-300 dark:border-gray-700 pt-2 mt-2 text-red-700 dark:text-red-400">
                                        <span>Total Deductions</span> <span>{neg_f_simple(results.deductions.total)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Column 2: CTC Breakup */}
                            <div className="lg:border-l lg:border-r border-gray-200/80 dark:border-gray-700/80 lg:px-6">
                                <h5 className="font-semibold mb-3 text-gray-800 dark:text-gray-100">Cost to Company Breakup</h5>
                                <div className="space-y-2 text-sm bg-gray-100 dark:bg-gray-800 p-3 rounded-lg">
                                    <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Gross Salary</span> <span className="font-medium text-gray-900 dark:text-gray-100">{f_simple(results.grossSalary)}</span></div>
                                    <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Employer EPF</span> <span className="font-medium text-gray-900 dark:text-gray-100">{f_simple(results.employerPF)}</span></div>
                                    <div className="flex justify-between font-bold border-t border-gray-300 dark:border-gray-700 pt-2 mt-2 text-gray-900 dark:text-gray-100">
                                        <span>Total CTC</span> <span>{f_simple(results.ctc)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Column 3: Download/Share */}
                            <div>
                                <h5 className="font-semibold mb-3 text-gray-800 dark:text-gray-100">Download Report</h5>
                                <div className="flex flex-col gap-4">
                                    <Button onClick={handleDownloadPDF} variant="primary" className="py-3 w-full">
                                        <Download size={18} className="mr-2" /> PDF
                                    </Button>
                                    <Button onClick={handleDownloadExcel} variant="secondary" className="py-3 w-full">
                                        <Download size={18} className="mr-2" /> Excel
                                    </Button>
                                    <Button onClick={() => setIsShareModalOpen(true)} variant="outline" className="py-3 w-full border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-900/30 hover:border-teal-300 dark:hover:border-teal-700">
                                        <Share2 size={18} className="mr-2" /> Share Calculation
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <ShareModal
                isOpen={isShareModalOpen}
                onClose={() => setIsShareModalOpen(false)}
                shareUrl={generateShareUrl()}
            />
        </div>
    );
};

export default ReverseCTC;
