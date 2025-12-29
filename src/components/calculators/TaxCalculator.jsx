import React, { useState, useEffect } from 'react';
import Input from '../shared/Input';
import { f_simple, formatIndianNumber, parseIndianNumber } from '../../utils/formatters';
import { Download, Share2, FileSpreadsheet } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';
import ShareModal from '../shared/ShareModal';

const TaxCalculator = () => {
    const [activeTab, setActiveTab] = useState(0);
    const [formData, setFormData] = useState({
        // Tab 1: Basic Details
        ay: '2025-2026',
        age: 'below60',

        // Tab 2: Income Details
        grossSalary: 0,
        otherIncome: 0,
        interestIncome: 0,
        rentalIncome: 0,
        hlInterestSelf: 0,
        hlInterestLetOut: 0,

        // Tab 3: Deductions
        section80C: 0,
        nps80CCD: 0,
        medical80D: 0,
        donation80G: 0,
        eduLoan80E: 0,
        savings80TTA: 0,

        // Tab 4: HRA Exemption
        basicSalary: 0,
        da: 0,
        hraReceived: 0,
        rentPaid: 0,
        isMetro: false
    });

    const [results, setResults] = useState({
        old: { taxable: 0, tax: 0, cess: 0, final: 0 },
        new: { taxable: 0, tax: 0, cess: 0, final: 0 },
        diff: 0,
        better: ''
    });
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);

    const tabs = [
        { id: 0, label: 'Basic Details' },
        { id: 1, label: 'Income Details' },
        { id: 2, label: 'Deductions' },
        { id: 3, label: 'HRA Exemption' }
    ];

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    // Calculate Tax Logic
    useEffect(() => {
        calculateTax();
    }, [formData]);

    const calculateTax = () => {
        const {
            ay, age,
            grossSalary, otherIncome, interestIncome, rentalIncome,
            hlInterestSelf, hlInterestLetOut,
            section80C, nps80CCD, medical80D, donation80G, eduLoan80E, savings80TTA,
            basicSalary, da, hraReceived, rentPaid, isMetro
        } = formData;

        // --- HRA Calculation ---
        let hraExemption = 0;
        if (rentPaid > 0) {
            const cond1 = hraReceived;
            const cond2 = rentPaid - 0.10 * (basicSalary + da);
            const cond3 = (isMetro ? 0.50 : 0.40) * (basicSalary + da);
            hraExemption = Math.max(0, Math.min(cond1, cond2, cond3));
        }

        // --- Income from House Property ---
        // Self-occupied: Interest is loss (max 2L for Old)
        // Let-out: Rent received - 30% std ded - Interest
        const stdDedProperty = rentalIncome * 0.30;
        const incomeHouseProperty = rentalIncome - stdDedProperty - hlInterestLetOut;

        // --- Gross Total Income ---
        const totalIncomeSources = grossSalary + otherIncome + interestIncome;

        // --- OLD REGIME CALCULATION ---
        let oldGross = totalIncomeSources + incomeHouseProperty; // Let-out income/loss added directly

        // Set-off loss from house property (Self-occupied + Let-out loss) against salary
        // Max loss set-off is 2L
        let totalHLLoss = 0;
        if (hlInterestSelf > 0) totalHLLoss += hlInterestSelf;
        // If incomeHouseProperty is negative, it's a loss
        if (incomeHouseProperty < 0) totalHLLoss += Math.abs(incomeHouseProperty);

        // Actually, simpler way for Old Regime:
        // Income Head Salary: Gross Salary - HRA - Std Ded
        // Income Head House Property: Rental - 30% - Interest(LetOut) - Interest(Self)
        // Max loss from HP allowed to be set off is 2L.

        const oldStdDed = 50000;
        const incomeSalaryOld = Math.max(0, grossSalary - hraExemption - oldStdDed);

        let incomeHPOld = rentalIncome - (rentalIncome * 0.30) - hlInterestLetOut - hlInterestSelf;
        // Cap loss at 2L
        if (incomeHPOld < -200000) incomeHPOld = -200000;

        let oldGTI = incomeSalaryOld + incomeHPOld + otherIncome + interestIncome;

        // Deductions
        const ded80C = Math.min(section80C, 150000);
        const ded80CCD = Math.min(nps80CCD, 50000);
        // 80TTA/TTB limit (10k for normal, 50k for senior)
        const limit80TT = age === 'below60' ? 10000 : 50000;
        const ded80TT = Math.min(savings80TTA, limit80TT);

        const totalDeductions = ded80C + ded80CCD + medical80D + donation80G + eduLoan80E + ded80TT;
        const oldTaxable = Math.max(0, oldGTI - totalDeductions);

        // Old Tax Slabs (General)
        // 0-2.5L: 0, 2.5-5L: 5%, 5-10L: 20%, >10L: 30%
        // Rebate 87A: up to 5L income -> 12500 tax rebate
        let oldTax = 0;
        if (oldTaxable > 1000000) {
            oldTax += (oldTaxable - 1000000) * 0.30 + 112500;
        } else if (oldTaxable > 500000) {
            oldTax += (oldTaxable - 500000) * 0.20 + 12500;
        } else if (oldTaxable > 250000) {
            oldTax += (oldTaxable - 250000) * 0.05;
        }

        if (oldTaxable <= 500000) oldTax = 0;

        const oldCess = oldTax * 0.04;
        const oldFinal = oldTax + oldCess;


        // --- NEW REGIME CALCULATION ---
        // Std Deduction: 50k for AY 24-25, 75k for AY 25-26
        const newStdDed = ay === '2024-2025' ? 50000 : 75000;
        const incomeSalaryNew = Math.max(0, grossSalary - newStdDed);

        // House Property in New Regime:
        // Loss from HP CANNOT be set off against Salary.
        // Only positive income from Let-out is added.
        let incomeHPNew = rentalIncome - (rentalIncome * 0.30) - hlInterestLetOut;
        if (incomeHPNew < 0) incomeHPNew = 0; // No loss set-off

        const newGTI = incomeSalaryNew + incomeHPNew + otherIncome + interestIncome;
        // No Chapter VI-A deductions usually (except 80CCD(2) which is employer contrib, ignoring for now as per requirements)

        const newTaxable = Math.max(0, newGTI);

        // New Tax Slabs (AY 2025-26)
        // 0-3L: 0
        // 3-7L: 5%
        // 7-10L: 10%
        // 10-12L: 15%
        // 12-15L: 20%
        // >15L: 30%
        // Rebate 87A: up to 7L income -> 25000 tax rebate (effectively 0 tax)

        let newTax = 0;

        if (ay === '2024-2025') {
            // Slabs for AY 2024-25 (FY 2023-24)
            // 0-3L: Nil
            // 3-6L: 5%
            // 6-9L: 10%
            // 9-12L: 15%
            // 12-15L: 20%
            // >15L: 30%

            let temp = newTaxable;
            if (newTaxable > 1500000) {
                newTax += (newTaxable - 1500000) * 0.30;
                temp = 1500000;
            }
            if (temp > 1200000) {
                newTax += (temp - 1200000) * 0.20;
                temp = 1200000;
            }
            if (temp > 900000) {
                newTax += (temp - 900000) * 0.15;
                temp = 900000;
            }
            if (temp > 600000) {
                newTax += (temp - 600000) * 0.10;
                temp = 600000;
            }
            if (temp > 300000) {
                newTax += (temp - 300000) * 0.05;
            }
        } else {
            // Slabs for AY 2025-26 (Budget 2024 proposed changes)
            // 0-3: Nil
            // 3-7: 5%
            // 7-10: 10%
            // 10-12: 15%
            // 12-15: 20%
            // >15: 30%

            let tempNewTaxable = newTaxable;

            if (newTaxable > 1500000) {
                newTax += (newTaxable - 1500000) * 0.30;
                tempNewTaxable = 1500000;
            }
            if (tempNewTaxable > 1200000) {
                newTax += (tempNewTaxable - 1200000) * 0.20;
                tempNewTaxable = 1200000;
            }
            if (tempNewTaxable > 1000000) {
                newTax += (tempNewTaxable - 1000000) * 0.15;
                tempNewTaxable = 1000000;
            }
            if (tempNewTaxable > 700000) {
                newTax += (tempNewTaxable - 700000) * 0.10;
                tempNewTaxable = 700000;
            }
            if (tempNewTaxable > 300000) {
                newTax += (tempNewTaxable - 300000) * 0.05;
            }
        }

        // Rebate u/s 87A for New Regime (Income up to 7L)
        if (newTaxable <= 700000) newTax = 0;

        // Marginal Relief logic is complex, skipping for simplicity unless requested, but 87A handles the main <7L case.

        const newCess = newTax * 0.04;
        const newFinal = newTax + newCess;

        setResults({
            old: { taxable: oldTaxable, tax: oldTax, cess: oldCess, final: oldFinal },
            new: { taxable: newTaxable, tax: newTax, cess: newCess, final: newFinal },
            diff: Math.abs(oldFinal - newFinal),
            better: oldFinal < newFinal ? 'Old Regime' : 'New Regime'
        });
    };

    const handleDownloadPDF = async () => {
        const element = document.getElementById('tax-calculator-container');
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

            pdf.save('income-tax-calculation.pdf');
        } catch (error) {
            console.error("Error generating PDF:", error);
        }
    };

    const handleDownloadExcel = () => {
        const wb = XLSX.utils.book_new();

        // Sheet 1: Tax Summary
        const summaryData = [
            ['Income Tax Calculation Summary'],
            ['Assessment Year', formData.ay],
            ['Age Category', formData.age],
            [],
            ['Particulars', 'Old Regime', 'New Regime'],
            ['Taxable Income', results.old.taxable, results.new.taxable],
            ['Income Tax', results.old.tax, results.new.tax],
            ['Cess (4%)', results.old.cess, results.new.cess],
            ['Net Tax Payable', results.old.final, results.new.final],
            [],
            ['Recommendation', `Choose ${results.better}`],
            ['Potential Savings', results.diff]
        ];
        const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
        wsSummary['!cols'] = [{ wch: 25 }, { wch: 15 }, { wch: 15 }];
        XLSX.utils.book_append_sheet(wb, wsSummary, 'Tax Summary');

        // Sheet 2: Detailed Breakdown
        const detailsData = [
            ['Detailed Breakdown'],
            [],
            ['Income Details', 'Amount'],
            ['Gross Salary', formData.grossSalary],
            ['Other Sources', formData.otherIncome],
            ['Interest Income', formData.interestIncome],
            ['Rental Income', formData.rentalIncome],
            ['Home Loan Interest (Self)', formData.hlInterestSelf],
            ['Home Loan Interest (Let-out)', formData.hlInterestLetOut],
            [],
            ['Deductions', 'Amount'],
            ['80C', formData.section80C],
            ['80CCD(1B)', formData.nps80CCD],
            ['80D (Medical)', formData.medical80D],
            ['80G (Donation)', formData.donation80G],
            ['80E (Edu Loan)', formData.eduLoan80E],
            ['80TTA/TTB', formData.savings80TTA],
            [],
            ['HRA Details', 'Amount'],
            ['Basic Salary', formData.basicSalary],
            ['DA', formData.da],
            ['HRA Received', formData.hraReceived],
            ['Rent Paid', formData.rentPaid],
            ['Metro City', formData.isMetro ? 'Yes' : 'No']
        ];
        const wsDetails = XLSX.utils.aoa_to_sheet(detailsData);
        wsDetails['!cols'] = [{ wch: 30 }, { wch: 15 }];
        XLSX.utils.book_append_sheet(wb, wsDetails, 'Input Details');

        XLSX.writeFile(wb, 'income-tax-calculation.xlsx');
    };

    const renderInput = (label, field, placeholder = "0") => (
        <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
            <Input
                type="text"
                placeholder={placeholder}
                value={formatIndianNumber(formData[field])}
                onChange={(e) => handleInputChange(field, parseIndianNumber(e.target.value))}
                className="w-full"
            />
        </div>
    );

    return (
        <div className="max-w-5xl mx-auto mb-3">
            {/* Main Container Card */}
            <div id="tax-calculator-container" className="bg-white/60 dark:bg-gray-900/40 backdrop-blur-xl border border-white/50 dark:border-gray-800 rounded-3xl p-10 shadow-[0_8px_25px_rgba(0,0,0,0.06)]">

                {/* Header Section */}
                <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-teal-700 via-teal-600 to-blue-600 bg-clip-text text-transparent dark:from-teal-200 dark:via-cyan-200 dark:to-blue-200 mb-2">Income Tax Calculator</h1>
                        <p className="text-gray-600 dark:text-gray-400 max-w-3xl">
                            Calculate your income tax liability under both Old and New Regimes for AY 2024-25 & 2025-26.
                        </p>
                    </div>
                    <div className="flex flex-nowrap gap-2 items-center">
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
                </div>

                <div className="flex flex-col lg:flex-row gap-8">

                    {/* LEFT SECTION: INPUTS */}
                    <div className="w-full lg:w-2/3">
                        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-800/50">

                            {/* Tabs Header */}
                            <div className="flex overflow-x-auto border-b border-gray-200 dark:border-gray-700 scrollbar-hide bg-gray-50/50 dark:bg-gray-900/20">
                                {tabs.map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`flex-1 py-4 px-6 text-sm font-medium whitespace-nowrap transition-colors relative
                                            ${activeTab === tab.id
                                                ? 'text-blue-600 dark:text-blue-400 bg-white dark:bg-gray-800'
                                                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                                            }`}
                                    >
                                        {tab.label}
                                        {activeTab === tab.id && (
                                            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 dark:bg-blue-400" />
                                        )}
                                    </button>
                                ))}
                            </div>

                            {/* Tab Content */}
                            <div className="p-6 min-h-[400px]">

                                {/* Tab 1: Basic Details */}
                                {activeTab === 0 && (
                                    <div className="space-y-6 animate-fadeIn">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Assessment Year</label>
                                            <select
                                                value={formData.ay}
                                                onChange={(e) => handleInputChange('ay', e.target.value)}
                                                className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                            >
                                                <option value="2024-2025">2024-2025</option>
                                                <option value="2025-2026">2025-2026</option>
                                                <option value="2026-2027">2026-2027</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Age Category</label>
                                            <div className="space-y-3">
                                                {[
                                                    { val: 'below60', label: 'Below 60 years' },
                                                    { val: '60to80', label: '60 to 80 years' },
                                                    { val: 'above80', label: 'Above 80 years' }
                                                ].map((opt) => (
                                                    <label key={opt.val} className="flex items-center p-3 border border-gray-200 dark:border-gray-700 rounded-xl cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                                        <input
                                                            type="radio"
                                                            name="age"
                                                            value={opt.val}
                                                            checked={formData.age === opt.val}
                                                            onChange={(e) => handleInputChange('age', e.target.value)}
                                                            className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                                                        />
                                                        <span className="ml-3 text-gray-700 dark:text-gray-300">{opt.label}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Tab 2: Income Details */}
                                {activeTab === 1 && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fadeIn">
                                        {renderInput("Gross Salary Income", "grossSalary")}
                                        {renderInput("Annual Income from Other Sources", "otherIncome")}
                                        {renderInput("Annual Income from Interest", "interestIncome")}
                                        {renderInput("Annual Income from Let-out Property", "rentalIncome")}
                                        {renderInput("Interest on Home Loan (Self-occupied)", "hlInterestSelf")}
                                        {renderInput("Interest on Home Loan (Let-out)", "hlInterestLetOut")}
                                    </div>
                                )}

                                {/* Tab 3: Deductions */}
                                {activeTab === 2 && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fadeIn">
                                        {renderInput("Basic Deductions u/s 80C", "section80C")}
                                        {renderInput("NPS Contribution u/s 80CCD(1B)", "nps80CCD")}
                                        {renderInput("Medical Insurance u/s 80D", "medical80D")}
                                        {renderInput("Donation to Charity u/s 80G", "donation80G")}
                                        {renderInput("Interest on Edu Loan u/s 80E", "eduLoan80E")}
                                        {renderInput("Interest on Savings u/s 80TTA/TTB", "savings80TTA")}
                                    </div>
                                )}

                                {/* Tab 4: HRA Exemption */}
                                {activeTab === 3 && (
                                    <div className="space-y-6 animate-fadeIn">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {renderInput("Basic Salary (Per Annum)", "basicSalary")}
                                            {renderInput("DA Received (Per Annum)", "da")}
                                            {renderInput("HRA Received (Per Annum)", "hraReceived")}
                                            {renderInput("Total Rent Paid (Per Annum)", "rentPaid")}
                                        </div>

                                        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
                                            <label className="flex items-center justify-between cursor-pointer">
                                                <span className="text-gray-700 dark:text-gray-300 font-medium">Do you live in a Metro City? (Delhi, Mumbai, Kolkata, Chennai)</span>
                                                <div className="relative inline-flex items-center cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={formData.isMetro}
                                                        onChange={(e) => handleInputChange('isMetro', e.target.checked)}
                                                        className="sr-only peer"
                                                    />
                                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                                                </div>
                                            </label>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Navigation Buttons */}
                            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-between bg-gray-50/50 dark:bg-gray-900/20">
                                <button
                                    onClick={() => setActiveTab(Math.max(0, activeTab - 1))}
                                    disabled={activeTab === 0}
                                    className={`px-6 py-2 rounded-xl font-medium transition-all ${activeTab === 0 ? 'opacity-50 cursor-not-allowed text-gray-400' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:shadow-md'}`}
                                >
                                    Previous
                                </button>
                                <button
                                    onClick={() => setActiveTab(Math.min(tabs.length - 1, activeTab + 1))}
                                    disabled={activeTab === tabs.length - 1}
                                    className={`px-6 py-2 rounded-xl font-medium transition-all ${activeTab === tabs.length - 1 ? 'opacity-50 cursor-not-allowed text-gray-400' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-500/30'}`}
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT SECTION: STICKY SUMMARY */}
                    <div className="w-full lg:w-1/3">
                        <div className="sticky top-8 space-y-6">

                            {/* Comparison Card */}
                            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6">Tax Summary</h3>

                                <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 mb-6 bg-white dark:bg-gray-900">
                                    <table className="w-full text-xs text-left">
                                        <thead className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 font-semibold">
                                            <tr>
                                                <th className="p-2">Particulars</th>
                                                <th className="p-2 text-right">Old Regime</th>
                                                <th className="p-2 text-right">New Regime</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                            <tr>
                                                <td className="p-2 text-gray-700 dark:text-gray-300">Taxable Income</td>
                                                <td className="p-2 text-right font-medium">{f_simple(results.old.taxable)}</td>
                                                <td className="p-2 text-right font-medium">{f_simple(results.new.taxable)}</td>
                                            </tr>
                                            <tr>
                                                <td className="p-2 text-gray-700 dark:text-gray-300">Income Tax</td>
                                                <td className="p-2 text-right text-gray-600 dark:text-gray-400">{f_simple(results.old.tax)}</td>
                                                <td className="p-2 text-right text-gray-600 dark:text-gray-400">{f_simple(results.new.tax)}</td>
                                            </tr>
                                            <tr>
                                                <td className="p-2 text-gray-700 dark:text-gray-300">Cess (4%)</td>
                                                <td className="p-2 text-right text-gray-600 dark:text-gray-400">{f_simple(results.old.cess)}</td>
                                                <td className="p-2 text-right text-gray-600 dark:text-gray-400">{f_simple(results.new.cess)}</td>
                                            </tr>
                                            <tr className="bg-blue-50/50 dark:bg-blue-900/20 font-bold">
                                                <td className="p-2 text-blue-900 dark:text-blue-100">Net Tax</td>
                                                <td className="p-2 text-right text-blue-700 dark:text-blue-300">{f_simple(results.old.final)}</td>
                                                <td className="p-2 text-right text-blue-700 dark:text-blue-300">{f_simple(results.new.final)}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>

                                {/* Recommendation */}
                                <div className={`p-6 rounded-xl border ${results.better === 'New Regime' ? 'bg-green-100 border-green-200 dark:bg-green-900/30 dark:border-green-800' : 'bg-amber-100 border-amber-200 dark:bg-amber-900/30 dark:border-amber-800'}`}>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Recommendation</p>
                                    <div className="flex items-baseline justify-between">
                                        <h4 className={`text-lg font-bold ${results.better === 'New Regime' ? 'text-green-700 dark:text-green-400' : 'text-amber-700 dark:text-amber-400'}`}>
                                            Choose {results.better}
                                        </h4>
                                        {results.diff > 0 && (
                                            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                                Save {f_simple(results.diff)}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

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

export default TaxCalculator;
