import React, { useState } from 'react';
import Input from '../shared/Input';
import Button from '../shared/Button';
import { ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';
import { f_simple, numberToWordsIndian, formatIndianNumber, parseIndianNumber } from '../../utils/formatters';
import Tooltip from '../shared/Tooltip';

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
            // % -> Amount
            const basicAmt = (parseFloat(inputs.basic) / 100) * ctcVal;
            newInputs.basic = basicAmt.toFixed(0);
            ['hra', 'empPF', 'emplrPF', 'gratuity', 'nps'].forEach(k => {
                newInputs[k] = ((parseFloat(inputs[k]) / 100) * basicAmt).toFixed(0);
            });
            ['other', 'da'].forEach(k => {
                newInputs[k] = ((parseFloat(inputs[k]) / 100) * ctcVal).toFixed(0);
            });
        } else {
            // Amount -> %
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
        // Gross Salary includes Basic, HRA, DA, Special
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
        if (!current) return;

        const newCTC = current * (1 + hike / 100);

        // 1. Calculate Current Salary based on Inputs
        const currentSal = calculateSalary(current, taxRegime, inputs, inputMode);

        // 2. Calculate New Salary
        // Strategy: Use the same structural ratios. 
        // If 'percentage', we use valid percentages.
        // If 'amount', we convert current amounts to % of current CTC, then apply those % to new CTC.
        let newSalInputs = { ...inputs };
        let newSalMode = 'percentage';

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
            // Prof Tax and Insurance usually stay fixed amounts or have slabs. 
            // For projection, let's keep them as fixed amounts (copied from inputs) 
            // BUT `calculateSalary` expects percentage inputs if mode is percentage.
            // Special case: ProfTax and Ins are always amounts in our inputs state. 
            // Just need to make sure calculateSalary handles them right.
            newSalInputs.profTax = inputs.profTax;
            newSalInputs.insurance = inputs.insurance;
        } else {
            // Already in percentage, just reuse
            newSalInputs = inputs;
        }

        const newSal = calculateSalary(newCTC, taxRegime, newSalInputs, 'percentage'); // Force percentage mode for new salary to scale it

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

    return (
        <div className="max-w-5xl mx-auto">
            <div className="bg-white/60 dark:bg-gray-900/40 backdrop-blur-xl border border-white/50 dark:border-gray-800 rounded-3xl p-10 shadow-[0_8px_25px_rgba(0,0,0,0.06)]">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-teal-700 via-teal-600 to-blue-600 bg-clip-text text-transparent dark:from-teal-200 dark:via-cyan-200 dark:to-blue-200 mb-2">Hike Calculator</h2>
                <p className="text-gray-600 dark:text-gray-400 mb-8">Estimate your new salary after a hike with detailed component breakdown.</p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="md:col-span-1 space-y-4">
                        <div className="bg-sky-50 dark:bg-sky-950/10 p-6 rounded-2xl border border-sky-200 dark:border-sky-100">
                            <h3 className="font-bold text-lg text-sky-900 dark:text-sky-100 mb-4">Input Details</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Current CTC (₹)</label>
                                    <Input
                                        type="text"
                                        value={formatIndianNumber(currentCTC)}
                                        onChange={(e) => setCurrentCTC(parseIndianNumber(e.target.value))}
                                    />
                                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{numberToWordsIndian(currentCTC)}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Hike Percentage (%)</label>
                                    <Input
                                        type="number"
                                        value={hikePercentage}
                                        onChange={(e) => setHikePercentage(e.target.value)}
                                        placeholder="e.g. 30"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tax Regime</label>
                                    <div className="flex items-center space-x-4">
                                        <label className="inline-flex items-center cursor-pointer">
                                            <input type="radio" name="taxRegime_hike" value="new" checked={taxRegime === 'new'} onChange={() => setTaxRegime('new')} className="h-4 w-4 text-teal-600 dark:text-teal-500 border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:ring-teal-500" />
                                            <span className="ml-2 text-gray-700 dark:text-gray-300">New</span>
                                        </label>
                                        <label className="inline-flex items-center cursor-pointer">
                                            <input type="radio" name="taxRegime_hike" value="old" checked={taxRegime === 'old'} onChange={() => setTaxRegime('old')} className="h-4 w-4 text-teal-600 dark:text-teal-500 border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:ring-teal-500" />
                                            <span className="ml-2 text-gray-700 dark:text-gray-300">Old</span>
                                        </label>
                                    </div>
                                </div>

                                {/* Advanced Options */}
                                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                                    <button
                                        onClick={() => setShowAdvanced(!showAdvanced)}
                                        className="flex items-center text-sm font-medium text-teal-600 dark:text-teal-400 hover:text-teal-700 mb-3"
                                    >
                                        {showAdvanced ? <ChevronUp size={16} className="mr-1" /> : <ChevronDown size={16} className="mr-1" />}
                                        Advanced Options (Current Salary Structure)
                                    </button>

                                    {showAdvanced && (
                                        <div className="space-y-3 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg">
                                            <div className="flex bg-gray-200 dark:bg-gray-700 rounded-lg p-1 mb-3">
                                                <button
                                                    onClick={() => handleModeToggle('percentage')}
                                                    className={`flex-1 py-1 text-xs font-medium rounded-md transition-all ${inputMode === 'percentage' ? 'bg-white dark:bg-gray-600 shadow text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}
                                                >
                                                    Percentage
                                                </button>
                                                <button
                                                    onClick={() => handleModeToggle('amount')}
                                                    className={`flex-1 py-1 text-xs font-medium rounded-md transition-all ${inputMode === 'amount' ? 'bg-white dark:bg-gray-600 shadow text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}
                                                >
                                                    Amount
                                                </button>
                                            </div>

                                            <div className="grid grid-cols-2 gap-3">
                                                {['basic', 'hra', 'da', 'empPF', 'emplrPF'].map(field => (
                                                    <div key={field}>
                                                        <label className="block text-xs text-gray-500 mb-1 capitalize">{field.replace(/([A-Z])/g, ' $1').trim()}</label>
                                                        <Input
                                                            value={inputs[field]}
                                                            onChange={(e) => handleInputChange(field, e.target.value)}
                                                            className="scale-90 origin-left w-[110%]"
                                                        />
                                                    </div>
                                                ))}
                                                {['gratuity', 'insurance', 'nps', 'profTax'].map(field => (
                                                    <div key={field}>
                                                        <label className="block text-xs text-gray-500 mb-1 capitalize">{field.replace(/([A-Z])/g, ' $1').trim()}</label>
                                                        <Input
                                                            value={inputs[field]}
                                                            onChange={(e) => handleInputChange(field, e.target.value)}
                                                            className="scale-90 origin-left w-[110%]"
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <Button onClick={handleCalculate} className="w-full mt-4">Calculate Hike</Button>
                            </div>
                        </div>
                    </div>

                    <div className="md:col-span-2">
                        {results ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700">
                                    <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Current Salary</h4>
                                    <div className="space-y-3 text-sm">
                                        <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">CTC</span><span className="font-medium">{f_simple(results.current.ctc)}</span></div>
                                        <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">In-hand (Yearly)</span><span className="font-medium">{f_simple(results.current.netInHandYearly)}</span></div>
                                        <div className="flex justify-between border-t border-gray-300 dark:border-gray-600 pt-2"><span className="text-gray-900 dark:text-gray-100 font-bold">In-hand (Monthly)</span><span className="font-bold text-gray-900 dark:text-gray-100">{f_simple(results.current.netInHandMonthly)}</span></div>
                                    </div>
                                </div>

                                <div className="bg-teal-50 dark:bg-teal-950/30 p-6 rounded-2xl border border-teal-200 dark:border-teal-700">
                                    <h4 className="font-semibold text-teal-900 dark:text-teal-100 mb-4">Revised Salary</h4>
                                    <div className="space-y-3 text-sm">
                                        <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">New CTC</span><span className="font-medium text-teal-700 dark:text-teal-300">{f_simple(results.new.ctc)}</span></div>
                                        <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">In-hand (Yearly)</span><span className="font-medium text-teal-700 dark:text-teal-300">{f_simple(results.new.netInHandYearly)}</span></div>
                                        <div className="flex justify-between border-t border-teal-200 dark:border-teal-700 pt-2"><span className="text-teal-900 dark:text-teal-100 font-bold">In-hand (Monthly)</span><span className="font-bold text-teal-600 dark:text-teal-400">{f_simple(results.new.netInHandMonthly)}</span></div>
                                    </div>
                                </div>

                                <div className="col-span-1 sm:col-span-2 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 p-6 rounded-2xl border border-green-200 dark:border-green-700">
                                    <h4 className="font-semibold text-green-900 dark:text-green-100 mb-4">Hike Impact</h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                                        <div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">CTC Increase</p>
                                            <p className="text-xl font-bold text-green-600 dark:text-green-400">+{f_simple(results.diff.ctc)}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Monthly Increase</p>
                                            <p className="text-xl font-bold text-green-600 dark:text-green-400">+{f_simple(results.diff.inHandMonthly)}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Percentage</p>
                                            <p className="text-xl font-bold text-green-600 dark:text-green-400">{hikePercentage}%</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="h-full flex items-center justify-center text-gray-400 dark:text-gray-500 italic">
                                Enter details to see the hike projection
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HikeCalculator;
