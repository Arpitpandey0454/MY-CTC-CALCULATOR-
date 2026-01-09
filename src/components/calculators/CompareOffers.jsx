import React, { useState } from 'react';
import Input from '../shared/Input';
import Button from '../shared/Button';
import { ChevronDown, ChevronUp, HelpCircle, Download, Share2, FileSpreadsheet } from 'lucide-react';
import { f_simple, numberToWordsIndian, formatIndianNumber, parseIndianNumber } from '../../utils/formatters';
import Tooltip from '../shared/Tooltip';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';
import ShareModal from '../shared/ShareModal';

const CompareOffers = () => {
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

    const createInitialState = (initialCTC = '') => ({
        ctc: initialCTC,
        regime: 'new',
        mode: 'percentage',
        inputs: { ...defaultInputs },
        showAdvanced: false
    });

    const [offer1, setOffer1] = useState(createInitialState());
    const [offer2, setOffer2] = useState(createInitialState());
    const [results, setResults] = useState(null);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);

    // Rate limits
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

    // Generalized logic to update inputs based on mode
    const handleInputChange = (setter, currentState, key, value) => {
        const val = parseFloat(value);
        let newInputs = { ...currentState.inputs, [key]: value };

        // Constraints and interactions
        if (currentState.mode === 'percentage') {
            if (key !== 'profTax' && key !== 'insurance' && val > 100) newInputs[key] = 100;
            if (key === 'gratuity' && val > 4.81) newInputs[key] = 4.81;
            if (key === 'nps' && val > 14) newInputs[key] = 14;
        }

        if (key === 'empPF') {
            newInputs.emplrPF = value;
        }

        setter({ ...currentState, inputs: newInputs });
    };

    const handleModeToggle = (setter, currentState, newMode) => {
        if (newMode === currentState.mode) return;
        const ctcVal = parseFloat(currentState.ctc) || 0;
        const inputs = currentState.inputs;
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
        setter({ ...currentState, mode: newMode, inputs: newInputs });
    };


    const calculateOfferBreakdown = (offerState) => {
        const ctc = parseFloat(offerState.ctc) || 0;
        const { inputs, mode, regime } = offerState;

        let basic, hra, empPF, emplrPF, gratuity, insurance, other, nps, profTax, da;

        profTax = parseFloat(inputs.profTax) || 0;
        insurance = parseFloat(inputs.insurance) || 0;

        if (mode === 'percentage') {
            basic = (parseFloat(inputs.basic) || 0) / 100 * ctc;
            hra = (parseFloat(inputs.hra) || 0) / 100 * basic;
            empPF = (parseFloat(inputs.empPF) || 0) / 100 * basic;
            emplrPF = (parseFloat(inputs.emplrPF) || 0) / 100 * basic;
            gratuity = (parseFloat(inputs.gratuity) || 0) / 100 * basic;

            let npsRaw = (parseFloat(inputs.nps) || 0) / 100 * basic;
            nps = Math.min(npsRaw, basic * 0.14);

            other = (parseFloat(inputs.other) || 0) / 100 * ctc;
            da = (parseFloat(inputs.da) || 0) / 100 * ctc;
        } else {
            basic = parseFloat(inputs.basic) || 0;
            hra = parseFloat(inputs.hra) || 0;
            empPF = parseFloat(inputs.empPF) || 0;
            emplrPF = parseFloat(inputs.emplrPF) || 0;
            gratuity = parseFloat(inputs.gratuity) || 0;
            other = parseFloat(inputs.other) || 0;
            da = parseFloat(inputs.da) || 0;
            let npsRaw = parseFloat(inputs.nps) || 0;
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
            const nps80CCD1B = Math.min(nps, 50000); // Assuming user puts logic

            // Simple assumption for comparison: Standard Ded + HRA Exemption + 80C (EPF) + Prof Tax
            // Note: Compare tool might need simpler assumptions or full inputs. 
            // Keeping it consistent with main calculator:
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

        return {
            grossSalary,
            totalDeductions,
            netInHandYearly,
            netInHandMonthly,
            components: {
                basic, hra, empPF, emplrPF, gratuity, insurance, nps, other, da, special, profTax, taxableIncome, finalTax
            }
        };
    };

    const handleCompare = () => {
        const res1 = calculateOfferBreakdown(offer1);
        const res2 = calculateOfferBreakdown(offer2);

        setResults({
            offer1: res1,
            offer2: res2,
            diff: {
                ctc: (parseFloat(offer2.ctc) || 0) - (parseFloat(offer1.ctc) || 0),
                inHand: res2.netInHandYearly - res1.netInHandYearly,
                monthly: res2.netInHandMonthly - res1.netInHandMonthly
            }
        });
    };

    const handleDownloadPDF = async () => {
        const element = document.getElementById('compare-offers-container');
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

            pdf.save('compare-offers-breakdown.pdf');
        } catch (error) {
            console.error("Error generating PDF:", error);
        }
    };

    const handleDownloadExcel = () => {
        if (!results) return;

        const wb = XLSX.utils.book_new();

        const createColumn = (offerRes, title) => [
            title,
            '',
            'Summary',
            offerRes.grossSalary,
            offerRes.totalDeductions,
            offerRes.netInHandYearly,
            offerRes.netInHandMonthly,
            '',
            'Earnings',
            offerRes.components.basic,
            offerRes.components.hra,
            offerRes.components.da,
            offerRes.components.special,
            offerRes.components.other,
            '',
            'Deductions',
            offerRes.components.empPF,
            offerRes.components.profTax,
            offerRes.components.finalTax
        ];

        const labels = [
            'Category',
            '',
            'Metric',
            'Gross Salary',
            'Total Deductions',
            'Net In-Hand (Yearly)',
            'Net In-Hand (Monthly)',
            '',
            'Component',
            'Basic',
            'HRA',
            'DA',
            'Special Allowance',
            'Other',
            '',
            'Deduction',
            'PF (Employee)',
            'Professional Tax',
            'Income Tax'
        ];

        const offer1Data = createColumn(results.offer1, 'Offer 1');
        const offer2Data = createColumn(results.offer2, 'Offer 2');

        const wsData = labels.map((label, index) => [
            label,
            offer1Data[index],
            offer2Data[index]
        ]);

        const ws = XLSX.utils.aoa_to_sheet(wsData);

        // Add column widths
        ws['!cols'] = [{ wch: 25 }, { wch: 20 }, { wch: 20 }];

        XLSX.utils.book_append_sheet(wb, ws, 'Compare Offers');
        XLSX.writeFile(wb, 'compare-offers-breakdown.xlsx');
    };

    const renderAdvancedOptions = (offer, setOffer, label) => (
        <div className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-4">
            <button
                onClick={() => setOffer({ ...offer, showAdvanced: !offer.showAdvanced })}
                className="flex items-center text-sm font-medium text-teal-600 dark:text-teal-400 hover:text-teal-700 mb-3"
            >
                {offer.showAdvanced ? <ChevronUp size={16} className="mr-1" /> : <ChevronDown size={16} className="mr-1" />}
                Advanced Options
            </button>

            {offer.showAdvanced && (
                <div className="space-y-3 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg">
                    <div className="flex bg-gray-200 dark:bg-gray-700 rounded-lg p-1 mb-3">
                        <button
                            onClick={() => handleModeToggle(setOffer, offer, 'percentage')}
                            className={`flex-1 py-1 text-xs font-medium rounded-md transition-all ${offer.mode === 'percentage' ? 'bg-teal-600 dark:bg-teal-600 shadow text-white dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}
                        >
                            Percentage
                        </button>
                        <button
                            onClick={() => handleModeToggle(setOffer, offer, 'amount')}
                            className={`flex-1 py-1 text-xs font-medium rounded-md transition-all ${offer.mode === 'amount' ? 'bg-teal-600 dark:bg-teal-600 shadow text-white dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}
                        >
                            Amount
                        </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        {['basic', 'hra', 'da', 'empPF', 'emplrPF'].map(field => (
                            <div key={field}>
                                <label className="block text-xs text-gray-500 mb-1 capitalize">{field.replace(/([A-Z])/g, ' $1').trim()}</label>
                                <Input
                                    value={offer.inputs[field]}
                                    onChange={(e) => handleInputChange(setOffer, offer, field, e.target.value)}
                                    className="scale-90 origin-left w-[110%]"
                                />
                            </div>
                        ))}
                        {['gratuity', 'insurance', 'nps', 'profTax'].map(field => (
                            <div key={field}>
                                <label className="block text-xs text-gray-500 mb-1 capitalize">{field.replace(/([A-Z])/g, ' $1').trim()}</label>
                                <Input
                                    value={offer.inputs[field]}
                                    onChange={(e) => handleInputChange(setOffer, offer, field, e.target.value)}
                                    className="scale-90 origin-left w-[110%]"
                                />
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );

    return (
        <div className="max-w-5xl mx-auto mb-3">
            <div id="compare-offers-container" className="bg-white/60 dark:bg-gray-900/40 backdrop-blur-xl border border-white/50 dark:border-gray-800 rounded-3xl p-10 shadow-[0_8px_25px_rgba(0,0,0,0.06)]">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-teal-700 via-teal-600 to-blue-600 bg-clip-text text-transparent dark:from-teal-200 dark:via-cyan-200 dark:to-blue-200 mb-2">Compare CTC Offers</h1>
                        <p className="text-gray-600 dark:text-gray-400 mb-8">Compare two salary offers side by side with detailed component analysis.</p>
                    </div>
                    {results && (
                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={handleDownloadPDF}
                                className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg transition-colors text-sm font-medium"
                                title="Download breakdown as PDF"
                            >
                                <Download size={18} />
                                <span>PDF</span>
                            </button>
                            <button
                                onClick={handleDownloadExcel}
                                className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg transition-colors text-sm font-medium"
                                title="Download breakdown as Excel"
                            >
                                <FileSpreadsheet size={18} />
                                <span>Excel</span>
                            </button>
                            <button
                                onClick={() => setIsShareModalOpen(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg transition-colors text-sm font-medium"
                                title="Share this calculation"
                            >
                                <Share2 size={18} />
                                <span>Share</span>
                            </button>
                        </div>
                    )}
                </div>

                <div className="flex flex-col lg:flex-row gap-8">

                    {/* Left Column: Inputs (Combined) */}
                    <div className="w-full lg:w-1/2 space-y-6">

                        {/* Single Container for Both Offers */}
                        <div className="border border-gra-200 dark:border-gray-700/50 rounded-2xl p-6 bg-white dark:bg-gray-800/50 shadow-sm">

                            {/* Offer 1 Section */}
                            <div className="relative pl-4 border-l-4 border-teal-500 mb-8">
                                <h3 className="text-xl font-bold text-teal-900 dark:text-teal-100 mb-4">Offer 1</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">CTC (₹)</label>
                                        <Input
                                            type="text"
                                            placeholder="50,00,000"
                                            value={formatIndianNumber(offer1.ctc)}
                                            onChange={(e) => {
                                                let val = parseIndianNumber(e.target.value);
                                                if (val > 100000000) val = 100000000;
                                                setOffer1({ ...offer1, ctc: val });
                                            }}
                                        />
                                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{numberToWordsIndian(offer1.ctc)}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tax Regime</label>
                                        <select
                                            className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg py-2 px-3 text-gray-800 dark:text-gray-200 outline-none focus:ring-2 focus:ring-teal-500"
                                            value={offer1.regime}
                                            onChange={(e) => setOffer1({ ...offer1, regime: e.target.value })}
                                        >
                                            <option value="new">New Regime</option>
                                            <option value="old">Old Regime</option>
                                        </select>
                                    </div>
                                    {renderAdvancedOptions(offer1, setOffer1, 'Offer 1')}
                                </div>
                            </div>

                            {/* Divider with VS badge */}
                            <div className="relative flex items-center justify-center mb-8 border-t border-dashed border-gray-300 dark:border-gray-600">
                                <span className="absolute bg-gray-100 dark:bg-gray-800 px-3 py-1 text-xs font-bold text-gray-500 rounded-full uppercase tracking-widest">VS</span>
                            </div>

                            {/* Offer 2 Section */}
                            <div className="relative pl-4 border-l-4 border-blue-500">
                                <h3 className="text-xl font-bold text-blue-900 dark:text-blue-100 mb-4">Offer 2</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">CTC (₹)</label>
                                        <Input
                                            type="text"
                                            placeholder="55,00,000"
                                            value={formatIndianNumber(offer2.ctc)}
                                            onChange={(e) => {
                                                let val = parseIndianNumber(e.target.value);
                                                if (val > 100000000) val = 100000000;
                                                setOffer2({ ...offer2, ctc: val });
                                            }}
                                        />
                                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{numberToWordsIndian(offer2.ctc)}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tax Regime</label>
                                        <select
                                            className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg py-2 px-3 text-gray-800 dark:text-gray-200 outline-none focus:ring-2 focus:ring-blue-500"
                                            value={offer2.regime}
                                            onChange={(e) => setOffer2({ ...offer2, regime: e.target.value })}
                                        >
                                            <option value="new">New Regime</option>
                                            <option value="old">Old Regime</option>
                                        </select>
                                    </div>
                                    {renderAdvancedOptions(offer2, setOffer2, 'Offer 2')}
                                </div>
                            </div>

                        </div>

                        <Button onClick={handleCompare} variant="gradient" className="w-full py-3 text-lg shadow-lg hover:shadow-xl transition-all">Compare Offers</Button>
                    </div>

                    {/* Right Column: Results (Combined) */}
                    <div className="w-full lg:w-1/2">
                        <div className="sticky top-8 space-y-6 animate-fadeIn">
                            {results ? (
                                <div className="border border-gray-200 dark:border-gray-700/50 rounded-2xl p-6 bg-white dark:bg-gray-800/50 shadow-sm">
                                    {/* Summary Banner */}
                                    <div className={`p-6 rounded-2xl text-center border-2 border-dashed mb-6 ${results.diff.inHand > 0
                                        ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700'
                                        : results.diff.inHand < 0
                                            ? 'bg-teal-50 dark:bg-teal-900/20 border-teal-300 dark:border-teal-700'
                                            : 'bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-600'
                                        }`}>
                                        <p className="text-gray-600 dark:text-gray-300 font-medium mb-1 uppercase tracking-wider text-xs">Recommendation</p>
                                        <h2 className={`text-2xl font-bold ${results.diff.inHand > 0
                                            ? 'text-blue-700 dark:text-blue-400'
                                            : results.diff.inHand < 0
                                                ? 'text-teal-700 dark:text-teal-400'
                                                : 'text-gray-700 dark:text-gray-300'
                                            }`}>
                                            {results.diff.inHand > 0 ? 'Offer 2 is Better' : results.diff.inHand < 0 ? 'Offer 1 is Better' : 'Both Offers are Equal'}
                                        </h2>
                                        {Math.abs(results.diff.inHand) > 0 && (
                                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                                                Extra <strong>{f_simple(Math.abs(results.diff.inHand))}</strong> /yr with {results.diff.inHand > 0 ? 'Offer 2' : 'Offer 1'}.
                                            </p>
                                        )}
                                    </div>

                                    <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm bg-gray-50/50 dark:bg-gray-900/50">
                                        <table className="w-full text-sm text-left">
                                            <thead className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 font-bold uppercase text-xs">
                                                <tr>
                                                    <th className="px-4 py-3">Metric</th>
                                                    <th className="px-4 py-3 text-right text-teal-700 dark:text-teal-400">Offer 1</th>
                                                    <th className="px-4 py-3 text-right text-blue-700 dark:text-blue-400">Offer 2</th>
                                                    <th className="px-4 py-3 text-right">Diff</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                                {/* CTC */}
                                                <tr className="hover:bg-white dark:hover:bg-gray-800 transition-colors">
                                                    <td className="px-4 py-3 font-medium text-gray-700 dark:text-gray-300">CTC</td>
                                                    <td className="px-4 py-3 text-right font-medium">{f_simple(offer1.ctc)}</td>
                                                    <td className="px-4 py-3 text-right font-medium">{f_simple(offer2.ctc)}</td>
                                                    <td className={`px-4 py-3 text-right font-bold ${results.diff.ctc > 0 ? 'text-green-600' : results.diff.ctc < 0 ? 'text-red-500' : 'text-gray-400'}`}>
                                                        {results.diff.ctc > 0 ? '+' : ''}{f_simple(results.diff.ctc)}
                                                    </td>
                                                </tr>

                                                {/* Gross Salary */}
                                                <tr className="hover:bg-white dark:hover:bg-gray-800 transition-colors">
                                                    <td className="px-4 py-3 font-medium text-gray-700 dark:text-gray-300">Gross Salary</td>
                                                    <td className="px-4 py-3 text-right">{f_simple(results.offer1.grossSalary)}</td>
                                                    <td className="px-4 py-3 text-right">{f_simple(results.offer2.grossSalary)}</td>
                                                    <td className="px-4 py-3 text-right text-gray-400">-</td>
                                                </tr>

                                                {/* Deductions */}
                                                <tr className="hover:bg-white dark:hover:bg-gray-800 transition-colors">
                                                    <td className="px-4 py-3 font-medium text-gray-700 dark:text-gray-300">Deductions</td>
                                                    <td className="px-4 py-3 text-right text-red-600 dark:text-red-400">{f_simple(results.offer1.totalDeductions)}</td>
                                                    <td className="px-4 py-3 text-right text-red-600 dark:text-red-400">{f_simple(results.offer2.totalDeductions)}</td>
                                                    <td className="px-4 py-3 text-right text-gray-400">-</td>
                                                </tr>

                                                {/* Net In-Hand Yearly */}
                                                <tr className="bg-white dark:bg-gray-800 font-bold border-t-2 border-gray-200 dark:border-gray-600">
                                                    <td className="px-4 py-3 text-gray-900 dark:text-white">Net (Annual)</td>
                                                    <td className="px-4 py-3 text-right text-teal-700 dark:text-teal-400">{f_simple(results.offer1.netInHandYearly)}</td>
                                                    <td className="px-4 py-3 text-right text-blue-700 dark:text-blue-400">{f_simple(results.offer2.netInHandYearly)}</td>
                                                    <td className={`px-4 py-3 text-right ${results.diff.inHand > 0 ? 'text-green-600' : results.diff.inHand < 0 ? 'text-red-500' : 'text-gray-400'}`}>
                                                        {results.diff.inHand > 0 ? '+' : ''}{f_simple(results.diff.inHand)}
                                                    </td>
                                                </tr>

                                                {/* Net In-Hand Monthly */}
                                                <tr className="bg-white dark:bg-gray-800 font-bold">
                                                    <td className="px-4 py-3 text-gray-900 dark:text-white">Net (Monthly)</td>
                                                    <td className="px-4 py-3 text-right text-teal-700 dark:text-teal-400">{f_simple(results.offer1.netInHandMonthly)}</td>
                                                    <td className="px-4 py-3 text-right text-blue-700 dark:text-blue-400">{f_simple(results.offer2.netInHandMonthly)}</td>
                                                    <td className={`px-4 py-3 text-right ${results.diff.monthly > 0 ? 'text-green-600' : results.diff.monthly < 0 ? 'text-red-500' : 'text-gray-400'}`}>
                                                        {results.diff.monthly > 0 ? '+' : ''}{f_simple(results.diff.monthly)}
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            ) : (
                                <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-gray-500 bg-white/50 dark:bg-gray-800/30 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                                    <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-full mb-4">
                                        <HelpCircle size={48} className="text-gray-400" />
                                    </div>
                                    <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300">Ready to Compare</h3>
                                    <p className="text-sm max-w-xs text-center mt-2">Enter CTC details for both offers and click "Compare Offers" to see the detailed breakdown here.</p>
                                </div>
                            )}
                        </div>
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

export default CompareOffers;
