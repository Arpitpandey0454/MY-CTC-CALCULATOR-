import React, { useState } from 'react';
import Input from '../shared/Input';
import Button from '../shared/Button';
import { f_simple, numberToWordsIndian, formatIndianNumber, parseIndianNumber } from '../../utils/formatters';

const CompareOffers = () => {
    const [offer1, setOffer1] = useState({ ctc: '', regime: 'new' });
    const [offer2, setOffer2] = useState({ ctc: '', regime: 'new' });
    const [results, setResults] = useState(null);

    // Tax Slabs (Duplicated for now, should be in a shared utility/hook)
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

    const calculateOfferBreakdown = (ctc, regime) => {
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

        return { grossSalary, totalDeductions, netInHandYearly, netInHandMonthly };
    };

    const handleCompare = () => {
        const ctc1 = parseFloat(offer1.ctc) || 0;
        const ctc2 = parseFloat(offer2.ctc) || 0;
        if (!ctc1 || !ctc2) return;

        const res1 = calculateOfferBreakdown(ctc1, offer1.regime);
        const res2 = calculateOfferBreakdown(ctc2, offer2.regime);

        setResults({
            offer1: res1,
            offer2: res2,
            diff: {
                ctc: ctc2 - ctc1,
                inHand: res2.netInHandYearly - res1.netInHandYearly,
                monthly: res2.netInHandMonthly - res1.netInHandMonthly
            }
        });
    };

    return (
        <div className="max-w-3xl mx-auto">
            <div className="bg-white/60 dark:bg-gray-900 backdrop-blur-lg rounded-3xl shadow-xl dark:shadow-none border border-gray-200/50 dark:border-gray-800 p-6 sm:p-8">
                <h2 className="text-3xl font-bold mb-2 text-gray-900 dark:text-gray-100">Compare CTC Offers</h2>
                <p className="text-gray-600 dark:text-gray-400 mb-8">Compare two salary offers side by side</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    {/* Offer 1 */}
                    <div className="border-2 border-teal-200 dark:border-teal-700 rounded-2xl p-6 bg-teal-50 dark:bg-teal-950/30">
                        <h3 className="text-xl font-bold text-teal-900 dark:text-teal-100 mb-4">Offer 1</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">CTC (₹)</label>
                                <Input
                                    type="text"
                                    placeholder="50,00,000"
                                    value={formatIndianNumber(offer1.ctc)}
                                    onChange={(e) => setOffer1({ ...offer1, ctc: parseIndianNumber(e.target.value) })}
                                />
                                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{numberToWordsIndian(offer1.ctc)}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tax Regime</label>
                                <select
                                    className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg py-2 px-3 text-gray-800 dark:text-gray-200"
                                    value={offer1.regime}
                                    onChange={(e) => setOffer1({ ...offer1, regime: e.target.value })}
                                >
                                    <option value="new">New Regime</option>
                                    <option value="old">Old Regime</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Offer 2 */}
                    <div className="border-2 border-blue-200 dark:border-blue-700 rounded-2xl p-6 bg-blue-50 dark:bg-blue-950/30">
                        <h3 className="text-xl font-bold text-blue-900 dark:text-blue-100 mb-4">Offer 2</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">CTC (₹)</label>
                                <Input
                                    type="text"
                                    placeholder="55,00,000"
                                    value={formatIndianNumber(offer2.ctc)}
                                    onChange={(e) => setOffer2({ ...offer2, ctc: parseIndianNumber(e.target.value) })}
                                />
                                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{numberToWordsIndian(offer2.ctc)}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tax Regime</label>
                                <select
                                    className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg py-2 px-3 text-gray-800 dark:text-gray-200"
                                    value={offer2.regime}
                                    onChange={(e) => setOffer2({ ...offer2, regime: e.target.value })}
                                >
                                    <option value="new">New Regime</option>
                                    <option value="old">Old Regime</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                <Button onClick={handleCompare} variant="gradient" className="w-full mb-8">Compare Offers</Button>

                {/* Comparison Results */}
                {results && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-teal-50 dark:bg-teal-950/30 p-6 rounded-2xl border border-teal-200 dark:border-teal-700">
                                <h4 className="font-semibold text-teal-900 dark:text-teal-100 mb-4">Offer 1 Summary</h4>
                                <div className="space-y-3 text-sm">
                                    <div className="flex justify-between"><span className="text-gray-700 dark:text-gray-300">Gross Salary</span><span className="font-bold text-gray-900 dark:text-gray-100">{f_simple(results.offer1.grossSalary)}</span></div>
                                    <div className="flex justify-between"><span className="text-gray-700 dark:text-gray-300">Total Deductions</span><span className="font-bold text-gray-900 dark:text-gray-100">{f_simple(results.offer1.totalDeductions)}</span></div>
                                    <div className="flex justify-between border-t border-teal-200 dark:border-teal-700 pt-2"><span className="text-gray-700 dark:text-gray-300 font-bold">In-hand (Yearly)</span><span className="font-bold text-teal-600 dark:text-teal-400">{f_simple(results.offer1.netInHandYearly)}</span></div>
                                    <div className="flex justify-between"><span className="text-gray-700 dark:text-gray-300 font-bold">In-hand (Monthly)</span><span className="font-bold text-teal-600 dark:text-teal-400">{f_simple(results.offer1.netInHandMonthly)}</span></div>
                                </div>
                            </div>

                            <div className="bg-blue-50 dark:bg-blue-950/30 p-6 rounded-2xl border border-blue-200 dark:border-blue-700">
                                <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-4">Offer 2 Summary</h4>
                                <div className="space-y-3 text-sm">
                                    <div className="flex justify-between"><span className="text-gray-700 dark:text-gray-300">Gross Salary</span><span className="font-bold text-gray-900 dark:text-gray-100">{f_simple(results.offer2.grossSalary)}</span></div>
                                    <div className="flex justify-between"><span className="text-gray-700 dark:text-gray-300">Total Deductions</span><span className="font-bold text-gray-900 dark:text-gray-100">{f_simple(results.offer2.totalDeductions)}</span></div>
                                    <div className="flex justify-between border-t border-blue-200 dark:border-blue-700 pt-2"><span className="text-gray-700 dark:text-gray-300 font-bold">In-hand (Yearly)</span><span className="font-bold text-blue-600 dark:text-blue-400">{f_simple(results.offer2.netInHandYearly)}</span></div>
                                    <div className="flex justify-between"><span className="text-gray-700 dark:text-gray-300 font-bold">In-hand (Monthly)</span><span className="font-bold text-blue-600 dark:text-blue-400">{f_simple(results.offer2.netInHandMonthly)}</span></div>
                                </div>
                            </div>
                        </div>

                        {/* Comparison Difference */}
                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 p-6 rounded-2xl border border-green-200 dark:border-green-700">
                            <h4 className="font-semibold text-green-900 dark:text-green-100 mb-4">Difference Analysis</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="text-gray-700 dark:text-gray-300">CTC Difference (Yearly)</span>
                                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">{(results.diff.ctc >= 0 ? '+' : '') + f_simple(results.diff.ctc)}</p>
                                </div>
                                <div>
                                    <span className="text-gray-700 dark:text-gray-300">In-hand Difference (Yearly)</span>
                                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">{(results.diff.inHand >= 0 ? '+' : '') + f_simple(results.diff.inHand)}</p>
                                </div>
                                <div>
                                    <span className="text-gray-700 dark:text-gray-300">Monthly In-hand Difference</span>
                                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">{(results.diff.monthly >= 0 ? '+' : '') + f_simple(results.diff.monthly)}</p>
                                </div>
                                <div>
                                    <span className="text-gray-700 dark:text-gray-300">Better Offer</span>
                                    <p className="text-xl font-bold text-green-600 dark:text-green-400">
                                        {results.diff.inHand > 0 ? 'Offer 2 is Better' : results.diff.inHand < 0 ? 'Offer 1 is Better' : 'Equal'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CompareOffers;
