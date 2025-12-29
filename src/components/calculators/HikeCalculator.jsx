import React, { useState, useEffect } from 'react';
import Input from '../shared/Input';
import Button from '../shared/Button';
import { ChevronDown, ChevronUp, ArrowRight, TrendingUp, Download, Share2, FileSpreadsheet } from 'lucide-react';
import { f_simple, numberToWordsIndian, formatIndianNumber, parseIndianNumber } from '../../utils/formatters';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';
import ShareModal from '../shared/ShareModal';

const HikeCalculator = () => {
    const defaultInputs = {
        basic: 40,
        hra: 40,
        da: 10,
        empPF: 12,
        emplrPF: 12,
        gratuity: 4.81,
        insurance: 0,
        other: 0,
        nps: 0,
        profTax: 2400
    };

    const [currentCTC, setCurrentCTC] = useState('');
    const [hikePercentage, setHikePercentage] = useState('');
    const [taxRegime, setTaxRegime] = useState('new');

    // Advanced Options State
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [inputMode, setInputMode] = useState('percentage');
    const [inputs, setInputs] = useState(defaultInputs);

    const [results, setResults] = useState(null);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);

    // Tax Slabs
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
        else if (income > 10000000) surcharge = tax * 0.15;
        tax += surcharge;
        const cess = tax * 0.04;
        return tax + cess;
    };

    const handleInputChange = (key, value) => {
        const val = parseFloat(value);
        let newInputs = { ...inputs, [key]: value };

        if (inputMode === 'percentage') {
            if (key !== 'profTax' && key !== 'insurance' && val > 100) newInputs[key] = 100;
            if (key === 'gratuity' && val > 4.81) newInputs[key] = 4.81;
            if (key === 'nps' && val > 14) newInputs[key] = 14;
        }

        if (key === 'empPF') {
            newInputs.emplrPF = value;
        }
        setInputs(newInputs);
    };

    const handleModeToggle = (newMode) => {
        if (newMode === inputMode) return;
        const ctcVal = parseFloat(currentCTC) || 0;
        let newInputs = { ...inputs };

        if (newMode === 'amount') {
            const basicAmt = (parseFloat(inputs.basic) / 100) * ctcVal;
            newInputs.basic = basicAmt.toFixed(0);
            ['hra', 'empPF', 'emplrPF', 'gratuity', 'nps'].forEach(k => {
                newInputs[k] = ((parseFloat(inputs[k]) / 100) * basicAmt).toFixed(0);
            });
            ['other', 'da'].forEach(k => {
                newInputs[k] = ((parseFloat(inputs[k]) / 100) * ctcVal).toFixed(0);
            });
        } else {
            const basicAmt = parseFloat(inputs.basic) || 0;
            newInputs.basic = ctcVal > 0 ? ((basicAmt / ctcVal) * 100).toFixed(2) : 0;
            ['hra', 'empPF', 'emplrPF', 'gratuity', 'nps'].forEach(k => {
                const val = parseFloat(inputs[k]) || 0;
                newInputs[k] = basicAmt > 0 ? ((val / basicAmt) * 100).toFixed(2) : 0;
            });
            ['other', 'da'].forEach(k => {
                const val = parseFloat(inputs[k]) || 0;
                newInputs[k] = ctcVal > 0 ? ((val / ctcVal) * 100).toFixed(2) : 0;
            });
        }
        setInputMode(newMode);
        setInputs(newInputs);
    };


    const calculateSalary = (ctc, regime, configInputs, configMode) => {
        let basic, hra, empPF, emplrPF, gratuity, insurance, other, nps, profTax, da;

        profTax = parseFloat(configInputs.profTax) || 0;
        insurance = parseFloat(configInputs.insurance) || 0;

        if (configMode === 'percentage') {
            basic = (parseFloat(configInputs.basic) || 0) / 100 * ctc;
            hra = (parseFloat(configInputs.hra) || 0) / 100 * basic;
            empPF = (parseFloat(configInputs.empPF) || 0) / 100 * basic;
            emplrPF = (parseFloat(configInputs.emplrPF) || 0) / 100 * basic;
            gratuity = (parseFloat(configInputs.gratuity) || 0) / 100 * basic;

            let npsRaw = (parseFloat(configInputs.nps) || 0) / 100 * basic;
            nps = Math.min(npsRaw, basic * 0.14);

            other = (parseFloat(configInputs.other) || 0) / 100 * ctc;
            da = (parseFloat(configInputs.da) || 0) / 100 * ctc;
        } else {
            basic = parseFloat(configInputs.basic) || 0;
            hra = parseFloat(configInputs.hra) || 0;
            empPF = parseFloat(configInputs.empPF) || 0;
            emplrPF = parseFloat(configInputs.emplrPF) || 0;
            gratuity = parseFloat(configInputs.gratuity) || 0;
            other = parseFloat(configInputs.other) || 0;
            da = parseFloat(configInputs.da) || 0;
            let npsRaw = parseFloat(configInputs.nps) || 0;
            nps = Math.min(npsRaw, basic * 0.14);
        }

        const employerComponents = basic + hra + emplrPF + gratuity + insurance + nps + other + da;
        const special = Math.max(0, ctc - employerComponents);
        const grossSalary = basic + hra + da + special;

        const standardDeduction = 50000;
        let taxableIncome = grossSalary;
        let finalTax = 0;

        if (regime === 'old') {
            const hraExemption = Math.min(hra, basic * 0.50, grossSalary - (basic + hra));
            const section80C = Math.min(empPF, 150000);

            taxableIncome -= (standardDeduction + hraExemption + section80C + Math.min(nps, 50000) + profTax);
            const taxDetails = calculateTax(Math.max(0, taxableIncome), oldTaxSlabs);
            finalTax = taxDetails;
            if (taxableIncome <= 500000) finalTax = Math.max(0, finalTax - 12500);
        } else {
            taxableIncome -= standardDeduction;
            const taxDetails = calculateTax(Math.max(0, taxableIncome), newTaxSlabs);
            finalTax = taxDetails;
            if (taxableIncome <= 700000) finalTax = 0;
        }

        const totalDeductions = empPF + nps + profTax + finalTax;
        const netInHandYearly = grossSalary - totalDeductions;
        const netInHandMonthly = netInHandYearly / 12;

        return { ctc, netInHandYearly, netInHandMonthly };
    };

    const handleCalculate = () => {
        const current = parseFloat(currentCTC) || 0;
        const hike = parseFloat(hikePercentage) || 0;
        if (!current) {
            setResults(null);
            return;
        }

        const newCTC = current * (1 + hike / 100);

        // 1. Calculate Current Salary based on Inputs
        const currentSal = calculateSalary(current, taxRegime, inputs, inputMode);

        // 2. Calculate New Salary
        // Strategy: Use the same structural ratios. 
        // If 'percentage', we use valid percentages.
        // If 'amount', we convert current amounts to % of current CTC, then apply those % to new CTC.
        let newSalInputs = { ...inputs };

        if (inputMode === 'amount') {
            // Convert current amounts to % of current CTC to project the new structure
            const basicAmt = parseFloat(inputs.basic) || 0;
            newSalInputs.basic = current > 0 ? ((basicAmt / current) * 100).toFixed(2) : 0;

            ['hra', 'empPF', 'emplrPF', 'gratuity', 'nps'].forEach(k => {
                const val = parseFloat(inputs[k]) || 0;
                newSalInputs[k] = basicAmt > 0 ? ((val / basicAmt) * 100).toFixed(2) : 0;
            });
            ['other', 'da'].forEach(k => {
                const val = parseFloat(inputs[k]) || 0;
                newSalInputs[k] = current > 0 ? ((val / current) * 100).toFixed(2) : 0;
            });
            newSalInputs.profTax = inputs.profTax;
            newSalInputs.insurance = inputs.insurance;
        } else {
            // Already in percentage, just reuse
            newSalInputs = inputs;
        }

        const newSal = calculateSalary(newCTC, taxRegime, newSalInputs, 'percentage');

        setResults({
            current: currentSal,
            new: newSal,
            diff: {
                ctc: newSal.ctc - currentSal.ctc,
                inHandYearly: newSal.netInHandYearly - currentSal.netInHandYearly,
                inHandMonthly: newSal.netInHandMonthly - currentSal.netInHandMonthly
            }
        });
    };

    // Auto-calculate when main inputs change
    useEffect(() => {
        if (currentCTC && hikePercentage) {
            handleCalculate();
        }
    }, [currentCTC, hikePercentage, taxRegime]);

    const handleDownloadPDF = async () => {
        const element = document.getElementById('hike-calculator-container');
        if (!element) return;

        try {
            const canvas = await html2canvas(element, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: null
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });

            const imgWidth = 210;
            const pageHeight = 297;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            let heightLeft = imgHeight;
            let position = 0;

            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;

            while (heightLeft >= 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;
            }

            pdf.save('hike-projection-breakdown.pdf');
        } catch (error) {
            console.error("Error generating PDF:", error);
        }
    };

    const handleDownloadExcel = () => {
        if (!results) return;
        const wb = XLSX.utils.book_new();

        // Sheet 1: Projection Summary
        const summaryData = [
            ['Salary Hike Projection Summary'],
            ['Current Annual CTC', results.current.ctc],
            ['Expected Hike', `${hikePercentage}%`],
            ['New Annual CTC', results.new.ctc],
            ['Increment Amount', results.diff.ctc],
            [],
            ['Comparison', 'Current', 'New', 'Difference'],
            ['Monthly In-hand', results.current.netInHandMonthly, results.new.netInHandMonthly, results.diff.inHandMonthly],
            ['Yearly In-hand', results.current.netInHandYearly, results.new.netInHandYearly, results.diff.inHandYearly]
        ];
        const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
        wsSummary['!cols'] = [{ wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 15 }];
        XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

        // Sheet 2: Revised Salary Breakdown matches logic from inputs
        // Since we don't have the full component detail in `results.new` directly exposed as a simple obj, 
        // we can assume the user wants the input configuration and the final calculated net.
        // For a detailed breakdown, we would ideally pass the full component list.
        // For now, let's export the Input Structure used for calculation.

        const detailsData = [
            ['Revised Salary Structure Configuration'],
            ['Components Mode', inputMode],
            [],
            ['Component', 'Value (Percentage/Amount)'],
            ['Basic', inputs.basic],
            ['HRA', inputs.hra],
            ['DA', inputs.da],
            ['Employee PF', inputs.empPF],
            ['Employer PF', inputs.emplrPF],
            ['Gratuity', inputs.gratuity],
            ['Insurance', inputs.insurance],
            ['NPS', inputs.nps],
            ['Other Allowance', inputs.other],
            ['Professional Tax', inputs.profTax]
        ];
        const wsDetails = XLSX.utils.aoa_to_sheet(detailsData);
        wsDetails['!cols'] = [{ wch: 25 }, { wch: 20 }];
        XLSX.utils.book_append_sheet(wb, wsDetails, 'Structure');

        XLSX.writeFile(wb, 'hike-projection.xlsx');
    };


    return (
        <div className="max-w-7xl mx-auto mb-3">
            <div id="hike-calculator-container" className="bg-white/60 dark:bg-gray-900/40 backdrop-blur-xl border border-white/50 dark:border-gray-800 rounded-3xl p-10 shadow-[0_8px_25px_rgba(0,0,0,0.06)]">
                <div className="text-left mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h2 className="text-3xl font-bold bg-gradient-to-r from-teal-700 via-teal-600 to-blue-600 bg-clip-text text-transparent dark:from-teal-200 dark:via-cyan-200 dark:to-blue-200 mb-3">Hike Calculator</h2>
                        <p className="text-gray-600 dark:text-gray-400">Visualize your salary growth with our advanced projection tool.</p>
                    </div>
                    {results && (
                        <div className="flex flex-nowrap gap-2 items-center">
                            <button
                                onClick={handleDownloadPDF}
                                className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg transition-colors text-sm font-medium"
                                title="Download projection as PDF"
                            >
                                <Download size={18} />
                                <span>PDF</span>
                            </button>
                            <button
                                onClick={handleDownloadExcel}
                                className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg transition-colors text-sm font-medium"
                                title="Download projection as Excel"
                            >
                                <FileSpreadsheet size={18} />
                                <span>Excel</span>
                            </button>
                            <button
                                onClick={() => setIsShareModalOpen(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg transition-colors text-sm font-medium"
                                title="Share this projection"
                            >
                                <Share2 size={18} />
                                <span>Share</span>
                            </button>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
                    {/* LEFT COLUMN: INPUTS */}
                    <div>
                        {/* Primary Input Section */}
                        <div className="space-y-6 mb-8">
                            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Current Annual CTC</label>
                                <Input
                                    type="text"
                                    value={formatIndianNumber(currentCTC)}
                                    onChange={(e) => {
                                        let val = parseIndianNumber(e.target.value);
                                        if (val > 100000000) val = 100000000;
                                        setCurrentCTC(val);
                                    }}
                                    placeholder="e.g. 12,00,000"
                                    className="text-lg"
                                />
                                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">{currentCTC ? numberToWordsIndian(currentCTC) : 'Enter your current CTC'}</p>
                            </div>

                            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                                <div className="flex justify-between items-center mb-3">
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Expected Hike (%)</label>
                                    <div className="flex items-center">
                                        <input
                                            type="number"
                                            min="0"
                                            max="500"
                                            value={hikePercentage}
                                            onChange={(e) => setHikePercentage(e.target.value)}
                                            className="text-2xl font-bold text-teal-600 dark:text-teal-400 bg-transparent border-b-2 border-dashed border-teal-200 dark:border-teal-800 focus:border-teal-500 outline-none w-24 text-right appearance-none"
                                            placeholder="0"
                                        />
                                        <span className="text-xl font-bold text-teal-600 dark:text-teal-400 ml-1">%</span>
                                    </div>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="200"
                                    step="1"
                                    value={hikePercentage}
                                    onChange={(e) => setHikePercentage(e.target.value)}
                                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-teal-600 dark:bg-gray-700"
                                />
                                <div className="flex justify-between mt-2 text-xs text-gray-400">
                                    <span>0%</span>
                                    <span>50%</span>
                                    <span>100%</span>
                                    <span>200%</span>
                                </div>
                            </div>
                        </div>

                        {/* Advanced Toggle */}
                        <div className="mb-10">
                            <button
                                onClick={() => setShowAdvanced(!showAdvanced)}
                                className="flex items-center w-full justify-center text-sm font-medium text-gray-500 hover:text-teal-600 dark:text-gray-400 dark:hover:text-teal-400 transition-colors bg-white dark:bg-gray-800 px-4 py-3 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700"
                            >
                                {showAdvanced ? 'Hide Advanced Options' : 'Configure Current Salary Structure'}
                                {showAdvanced ? <ChevronUp size={16} className="ml-2" /> : <ChevronDown size={16} className="ml-2" />}
                            </button>

                            {showAdvanced && (
                                <div className="mt-6 p-6 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700 animate-in fade-in slide-in-from-top-4 duration-300">
                                    <div className="flex justify-between items-center mb-6 border-b border-gray-200 dark:border-gray-700 pb-4">
                                        <h3 className="font-semibold text-gray-800 dark:text-gray-200">Current Salary Structure</h3>
                                        <div className="flex bg-gray-200 dark:bg-gray-700 rounded-lg p-1">
                                            <button onClick={() => handleModeToggle('percentage')} className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${inputMode === 'percentage' ? 'bg-white dark:bg-gray-600 shadow text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>% Percent</button>
                                            <button onClick={() => handleModeToggle('amount')} className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${inputMode === 'amount' ? 'bg-white dark:bg-gray-600 shadow text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>₹ Amount</button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        {Object.keys(inputs).map(field => (
                                            <div key={field}>
                                                <label className="block text-xs font-medium text-gray-500 mb-1 capitalize">{field.replace(/([A-Z])/g, ' $1').trim()}</label>
                                                <Input
                                                    value={inputs[field]}
                                                    onChange={(e) => handleInputChange(field, e.target.value)}
                                                    className="text-sm"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* RIGHT COLUMN: RESULTS */}
                    <div className="lg:pl-8 lg:border-l border-gray-200 dark:border-gray-700 min-h-full">
                        {results ? (
                            <div className="space-y-6">
                                {/* Current Salary Card */}
                                <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 relative overflow-hidden group hover:shadow-md transition-shadow">
                                    <div className="absolute top-0 left-0 w-2 h-full bg-gray-300 dark:bg-gray-600"></div>
                                    <h4 className="text-lg font-bold text-gray-700 dark:text-gray-200 mb-6 pl-4">Current Salary</h4>

                                    <div className="space-y-6">
                                        <div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Annual CTC</p>
                                            <p className="text-2xl font-bold text-gray-800 dark:text-white">{f_simple(results.current.ctc)}</p>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-xs text-gray-500 mb-1">Monthly In-hand</p>
                                                <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">{f_simple(results.current.netInHandMonthly)}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500 mb-1">Yearly In-hand</p>
                                                <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">{f_simple(results.current.netInHandYearly)}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Divider with Arrow */}
                                <div className="flex justify-center">
                                    <div className="bg-teal-50 dark:bg-teal-900/30 p-2 rounded-full transform rotate-90">
                                        <ArrowRight className="text-teal-600 dark:text-teal-400" size={24} />
                                    </div>
                                </div>

                                {/* Revised Salary Card */}
                                <div className="bg-teal-50 dark:bg-teal-950/20 p-6 rounded-3xl shadow-sm border border-teal-100 dark:border-teal-800 relative overflow-hidden group hover:shadow-md transition-shadow">
                                    <div className="absolute top-0 left-0 w-2 h-full bg-teal-500"></div>
                                    <div className="flex justify-between items-start pl-4 mb-6">
                                        <h4 className="text-lg font-bold text-teal-800 dark:text-teal-100">Revised Salary</h4>
                                        <div className="bg-teal-200 dark:bg-teal-800 text-teal-800 dark:text-teal-100 text-xs font-bold px-2 py-1 rounded-full flex items-center">
                                            <TrendingUp size={12} className="mr-1" />
                                            {hikePercentage}% Hike
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <div>
                                            <p className="text-sm text-teal-600 dark:text-teal-400 mb-1">New Annual CTC</p>
                                            <p className="text-3xl font-bold text-teal-700 dark:text-teal-300">{f_simple(results.new.ctc)}</p>
                                            <p className="text-xs text-teal-600/70 dark:text-teal-400/70 font-medium mt-1">+{f_simple(results.diff.ctc)} increase</p>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-xs text-teal-600/80 dark:text-teal-400/80 mb-1">Monthly In-hand</p>
                                                <p className="text-xl font-bold text-teal-800 dark:text-teal-200">{f_simple(results.new.netInHandMonthly)}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-teal-600/80 dark:text-teal-400/80 mb-1">Yearly In-hand</p>
                                                <p className="text-xl font-bold text-teal-800 dark:text-teal-200">{f_simple(results.new.netInHandYearly)}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-center p-10 opacity-50">
                                <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-full mb-4">
                                    <TrendingUp className="text-gray-400" size={32} />
                                </div>
                                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">Ready to Calculate</h3>
                                <p className="text-sm text-gray-500">Enter your current CTC and expected hike to see the projection.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <ShareModal
                isOpen={isShareModalOpen}
                onClose={() => setIsShareModalOpen(false)}
                shareUrl={window.location.href}
            />
        </div>
    );
};

export default HikeCalculator;
