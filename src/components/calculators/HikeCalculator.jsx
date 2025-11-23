import React, { useState } from 'react';
import Input from '../shared/Input';
import Button from '../shared/Button';
import { f_simple, numberToWordsIndian, formatIndianNumber, parseIndianNumber } from '../../utils/formatters';

const HikeCalculator = () => {
    const [currentCTC, setCurrentCTC] = useState('');
    const [hikePercentage, setHikePercentage] = useState('');
    const [taxRegime, setTaxRegime] = useState('new');
    const [results, setResults] = useState(null);

    // Tax Slabs (Duplicated for now)
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

    const calculateSalary = (ctc, regime) => {
        const basic = ctc * 0.40;
        const hra = basic * 0.40;
        const employerPF = basic * 0.12;
        const gratuity = basic * 0.0481;
        const special = Math.max(0, ctc - (basic + hra + employerPF + gratuity));

        const grossSalary = basic + hra + special;
        const employeePF = basic * 0.12;
        const profTax = 2500;
        const standardDeduction = 50000;

        let taxableIncome = grossSalary - standardDeduction;
        let finalTax = 0;

        if (regime === 'old') {
            const hraExemption = Math.min(hra, basic * 0.50, grossSalary - basic - hra);
            taxableIncome -= hraExemption;
            finalTax = calculateTax(Math.max(0, taxableIncome), oldTaxSlabs);
            if (taxableIncome <= 500000) finalTax = Math.max(0, finalTax - 12500);
        } else {
            finalTax = calculateTax(Math.max(0, taxableIncome), newTaxSlabs);
            if (taxableIncome <= 700000) finalTax = 0;
        }

        const totalDeductions = employeePF + profTax + finalTax;
        const netInHandYearly = grossSalary - totalDeductions;
        const netInHandMonthly = netInHandYearly / 12;

        return { ctc, netInHandYearly, netInHandMonthly };
    };

    const handleCalculate = () => {
        const current = parseFloat(currentCTC) || 0;
        const hike = parseFloat(hikePercentage) || 0;
        if (!current) return;

        const newCTC = current * (1 + hike / 100);

        const currentSal = calculateSalary(current, taxRegime);
        const newSal = calculateSalary(newCTC, taxRegime);

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
            <div className="bg-white/60 dark:bg-gray-900 backdrop-blur-lg rounded-3xl shadow-xl dark:shadow-none border border-gray-200/50 dark:border-gray-800 p-6 sm:p-8">
                <h2 className="text-3xl font-bold mb-2 text-gray-900 dark:text-gray-100">Hike Calculator</h2>
                <p className="text-gray-600 dark:text-gray-400 mb-8">Estimate your new salary after a hike</p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="md:col-span-1 space-y-4">
                        <div className="bg-amber-50 dark:bg-amber-950/10 p-6 rounded-2xl border border-amber-200 dark:border-amber-100">
                            <h3 className="font-bold text-lg text-amber-900 dark:text-amber-100 mb-4">Input Details</h3>
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
