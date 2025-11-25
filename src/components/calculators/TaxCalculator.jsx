import React, { useState } from 'react';
import Input from '../shared/Input';
import Button from '../shared/Button';
import { f_simple, numberToWordsIndian, formatIndianNumber, parseIndianNumber } from '../../utils/formatters';

const TaxCalculator = () => {
    const [grossIncome, setGrossIncome] = useState('');
    const [empPF, setEmpPF] = useState(0);
    const [nps, setNps] = useState(0);
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
        return { taxBeforeCharges: tax, surcharge, cess, finalTax: tax + cess };
    };

    const handleCalculate = () => {
        const gross = parseFloat(grossIncome) || 0;
        if (!gross) return;

        const pf = parseFloat(empPF) || 0;
        const npsVal = parseFloat(nps) || 0;

        // OLD REGIME
        const hraExemption = gross * 0.10; // Simplified assumption
        const section80C = Math.min(pf, 150000);
        const nps80CCD = Math.min(npsVal, 50000);
        const oldTaxableIncome = Math.max(0, gross - 50000 - hraExemption - section80C - nps80CCD);
        const oldTaxCalc = calculateTax(oldTaxableIncome, oldTaxSlabs);
        let oldFinalTax = oldTaxCalc.finalTax;
        if (oldTaxableIncome <= 500000) oldFinalTax = Math.max(0, oldFinalTax - 12500);

        // NEW REGIME
        const newTaxableIncome = Math.max(0, gross - 50000);
        const newTaxCalc = calculateTax(newTaxableIncome, newTaxSlabs);
        let newFinalTax = newTaxCalc.finalTax;
        if (newTaxableIncome <= 700000) newFinalTax = 0;

        setResults({
            old: {
                gross,
                taxableIncome: oldTaxableIncome,
                taxBeforeCharges: oldTaxCalc.taxBeforeCharges,
                surcharge: oldTaxCalc.surcharge + oldTaxCalc.cess,
                finalTax: oldFinalTax,
                deductions: { section80C, nps80CCD, standardDeduction: 50000 }
            },
            new: {
                gross,
                taxableIncome: newTaxableIncome,
                taxBeforeCharges: newTaxCalc.taxBeforeCharges,
                surcharge: newTaxCalc.surcharge + newTaxCalc.cess,
                finalTax: newFinalTax,
                deductions: { standardDeduction: 50000 }
            },
            saving: Math.abs(oldFinalTax - newFinalTax),
            betterRegime: oldFinalTax < newFinalTax ? 'Old Regime' : 'New Regime'
        });
    };

    return (
        <div className="max-w-3xl mx-auto">
            <div className="bg-white/60 dark:bg-gray-900 backdrop-blur-lg rounded-3xl shadow-xl dark:shadow-none border border-gray-200/50 dark:border-gray-800 p-6 sm:p-8">
                <h2 className="text-3xl font-bold mb-2 text-gray-900 dark:text-gray-100">Tax Calculator (Old vs New Regime)</h2>
                <p className="text-gray-600 dark:text-gray-400 mb-8">Calculate and compare tax under both regimes</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    {/* Inputs */}
                    <div className="bg-blue-50 from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 p-6 rounded-2xl border border-gray-200 dark:border-gray-600">
                        <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100 mb-4">Annual Income</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Gross Salary (₹)</label>
                                <Input
                                    type="text"
                                    placeholder="0"
                                    value={formatIndianNumber(grossIncome)}
                                    onChange={(e) => setGrossIncome(parseIndianNumber(e.target.value))}
                                />
                                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{numberToWordsIndian(grossIncome)}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Employee PF (₹)</label>
                                <Input type="text" value={formatIndianNumber(empPF)} onChange={(e) => setEmpPF(parseIndianNumber(e.target.value))} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">NPS Contribution (₹)</label>
                                <Input type="text" value={formatIndianNumber(nps)} onChange={(e) => setNps(parseIndianNumber(e.target.value))} />
                            </div>
                        </div>
                    </div>

                    {/* Tax Slabs Info */}
                    <div className="bg-blue-50 dark:bg-blue-950/30 p-6 rounded-2xl border border-blue-200 dark:border-blue-700">
                        <h3 className="font-bold text-lg text-blue-900 dark:text-blue-100 mb-4">Tax Slabs 2025</h3>
                        <div className="space-y-3 text-sm">
                            <div>
                                <p className="font-semibold text-gray-700 dark:text-gray-300 mb-2">New Regime:</p>
                                <ul className="space-y-1 text-gray-600 dark:text-gray-400 text-xs">
                                    <li>0-3L: 0% | 3-6L: 5% | 6-9L: 10%</li>
                                    <li>9-12L: 15% | 12-15L: 20% | 15L+: 30%</li>
                                </ul>
                            </div>
                            <div>
                                <p className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Old Regime:</p>
                                <ul className="space-y-1 text-gray-600 dark:text-gray-400 text-xs">
                                    <li>0-2.5L: 0% | 2.5-5L: 5% | 5-10L: 20%</li>
                                    <li>10L+: 30% (with surcharge & cess)</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>

                <Button onClick={handleCalculate} variant="gradient" className="w-full mb-8 from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">Calculate Tax</Button>

                {/* Tax Results */}
                {results && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Old Regime */}
                            <div className="border-2 border-amber-200 dark:border-amber-700 rounded-2xl p-6 bg-amber-50 dark:bg-amber-950/30">
                                <h4 className="font-bold text-lg text-amber-900 dark:text-amber-100 mb-4">Old Regime</h4>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between"><span className="text-gray-700 dark:text-gray-300">Gross Income</span><span className="font-bold">{f_simple(results.old.gross)}</span></div>
                                    <div className="flex justify-between"><span className="text-gray-700 dark:text-gray-300">Standard Deduction</span><span className="font-bold">₹50,000</span></div>
                                    <div className="flex justify-between"><span className="text-gray-700 dark:text-gray-300">Section 80C (PF)</span><span className="font-bold">{f_simple(results.old.deductions.section80C)}</span></div>
                                    <div className="flex justify-between"><span className="text-gray-700 dark:text-gray-300">80CCD(1B) (NPS)</span><span className="font-bold">{f_simple(results.old.deductions.nps80CCD)}</span></div>
                                    <div className="flex justify-between border-t border-amber-200 dark:border-amber-700 pt-2"><span className="text-gray-700 dark:text-gray-300 font-bold">Taxable Income</span><span className="font-bold">{f_simple(results.old.taxableIncome)}</span></div>
                                    <div className="flex justify-between"><span className="text-gray-700 dark:text-gray-300">Income Tax</span><span className="font-bold text-amber-600 dark:text-amber-400">{f_simple(results.old.taxBeforeCharges)}</span></div>
                                    <div className="flex justify-between"><span className="text-gray-700 dark:text-gray-300">Surcharge & Cess</span><span className="font-bold text-amber-600 dark:text-amber-400">{f_simple(results.old.surcharge)}</span></div>
                                    <div className="flex justify-between bg-amber-100 dark:bg-amber-900/50 p-2 rounded border-t-2 border-amber-200 dark:border-amber-700 pt-3"><span className="font-bold text-amber-900 dark:text-amber-100">Total Tax</span><span className="font-bold text-lg text-amber-900 dark:text-amber-100">{f_simple(results.old.finalTax)}</span></div>
                                </div>
                            </div>

                            {/* New Regime */}
                            <div className="border-2 border-green-200 dark:border-green-700 rounded-2xl p-6 bg-green-50 dark:bg-green-950/30">
                                <h4 className="font-bold text-lg text-green-900 dark:text-green-100 mb-4">New Regime</h4>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between"><span className="text-gray-700 dark:text-gray-300">Gross Income</span><span className="font-bold">{f_simple(results.new.gross)}</span></div>
                                    <div className="flex justify-between"><span className="text-gray-700 dark:text-gray-300">Standard Deduction</span><span className="font-bold">₹50,000</span></div>
                                    <div className="flex justify-between"><span className="text-gray-700 dark:text-gray-300">Section 87A Rebate</span><span className="font-bold">Upto 7L</span></div>
                                    <div className="flex justify-between border-t border-green-200 dark:border-green-700 pt-2"><span className="text-gray-700 dark:text-gray-300 font-bold">Taxable Income</span><span className="font-bold">{f_simple(results.new.taxableIncome)}</span></div>
                                    <div className="flex justify-between"><span className="text-gray-700 dark:text-gray-300">Income Tax</span><span className="font-bold text-green-600 dark:text-green-400">{f_simple(results.new.taxBeforeCharges)}</span></div>
                                    <div className="flex justify-between"><span className="text-gray-700 dark:text-gray-300">Surcharge & Cess</span><span className="font-bold text-green-600 dark:text-green-400">{f_simple(results.new.surcharge)}</span></div>
                                    <div className="flex justify-between bg-green-100 dark:bg-green-900/50 p-2 rounded border-t-2 border-green-200 dark:border-green-700 pt-3"><span className="font-bold text-green-900 dark:text-green-100">Total Tax</span><span className="font-bold text-lg text-green-900 dark:text-green-100">{f_simple(results.new.finalTax)}</span></div>
                                </div>
                            </div>
                        </div>

                        {/* Recommendation */}
                        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 p-6 rounded-2xl border border-indigo-200 dark:border-indigo-700">
                            <h4 className="font-bold text-lg text-indigo-900 dark:text-indigo-100 mb-3">Recommendation</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-1">Tax Saving</p>
                                    <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{f_simple(results.saving)}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-1">Better Regime</p>
                                    <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{results.betterRegime}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TaxCalculator;
