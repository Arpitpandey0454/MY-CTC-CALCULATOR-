import React, { useState } from 'react';
import Input from '../shared/Input';
import Button from '../shared/Button';
import { f_simple, formatIndianNumber, parseIndianNumber } from '../../utils/formatters';
import { Download, Share2, FileSpreadsheet } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';
import ShareModal from '../shared/ShareModal';

const AdditionalCalculators = ({ activeSubTab, onTabChange }) => {
    const [localActiveTab, setLocalActiveTab] = useState('pf');
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [calculationData, setCalculationData] = useState(null);

    // Sync prop with local state if provided
    React.useEffect(() => {
        if (activeSubTab) {
            setLocalActiveTab(activeSubTab);
        }
    }, [activeSubTab]);

    const activeTab = activeSubTab || localActiveTab;
    const setActiveTab = (tab) => {
        if (onTabChange) {
            onTabChange(tab);
        } else {
            setLocalActiveTab(tab);
        }
        setCalculationData(null); // Clear data on tab switch
    };

    const tabs = [
        { id: 'pf', label: 'PF Calculator' },
        { id: 'hra', label: 'HRA Exemption' },
        { id: 'gratuity', label: 'Gratuity' },
        { id: 'bonus', label: 'Bonus' },
        { id: 'lta', label: 'LTA Calculator' },
        { id: 'col', label: 'Cost of Living' },
    ];

    const handleCalculationUpdate = (data) => {
        setCalculationData({ type: activeTab, ...data });
    };

    const handleDownloadPDF = async () => {
        const element = document.getElementById('additional-calculator-container');
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

            pdf.save('additional-calculators.pdf');
        } catch (error) {
            console.error("Error generating PDF:", error);
        }
    };

    const handleDownloadExcel = () => {
        if (!calculationData) return;
        const wb = XLSX.utils.book_new();
        let data = [];
        let cols = [];

        switch (calculationData.type) {
            case 'pf':
                data = [
                    ['PF Calculation'],
                    ['Input Basic Salary', calculationData.inputs.basic],
                    [],
                    ['Breakdown', 'Amount'],
                    ['Employee Share (12%)', calculationData.result.employee],
                    ['Employer Share Total (12%)', calculationData.result.employer.total],
                    ['- EPF Portion', calculationData.result.employer.epf],
                    ['- EPS Portion', calculationData.result.employer.eps],
                    [],
                    ['Total Monthly Contribution', calculationData.result.total]
                ];
                cols = [{ wch: 30 }, { wch: 15 }];
                break;
            case 'hra':
                data = [
                    ['HRA Exemption Calculation'],
                    ['Basic Salary', calculationData.inputs.basic],
                    ['HRA Received', calculationData.inputs.hraReceived],
                    ['Rent Paid', calculationData.inputs.rentPaid],
                    ['Metro City', calculationData.inputs.isMetro ? 'Yes' : 'No'],
                    [],
                    ['Result', 'Amount'],
                    ['Exempted HRA', calculationData.result.exempt],
                    ['Taxable HRA', calculationData.result.taxable]
                ];
                cols = [{ wch: 25 }, { wch: 15 }];
                break;
            case 'gratuity':
                data = [
                    ['Gratuity Calculation'],
                    ['Basic Salary', calculationData.inputs.basic],
                    ['Years of Service', calculationData.inputs.years],
                    [],
                    ['Estimated Gratuity', calculationData.result]
                ];
                cols = [{ wch: 25 }, { wch: 15 }];
                break;
            case 'bonus':
                data = [
                    ['Bonus Calculation'],
                    ['Basic Salary', calculationData.inputs.basic],
                    ['Bonus Percentage', `${calculationData.inputs.percent}%`],
                    [],
                    ['Breakdown', 'Amount'],
                    ['Min Bonus (8.33%)', calculationData.result.min],
                    ['Max Bonus (20%)', calculationData.result.max],
                    ['Calculated Bonus', calculationData.result.custom || 'N/A']
                ];
                cols = [{ wch: 25 }, { wch: 15 }];
                break;
            case 'lta':
                data = [
                    ['LTA Exemption Calculation'],
                    ['LTA Received', calculationData.inputs.ltaReceived],
                    ['Travel Cost', calculationData.inputs.travelCost],
                    [],
                    ['Result', 'Amount'],
                    ['Exempt LTA', calculationData.result.exempt],
                    ['Taxable LTA', calculationData.result.taxable]
                ];
                cols = [{ wch: 25 }, { wch: 15 }];
                break;
            case 'col':
                data = [
                    ['Cost of Living Comparison'],
                    ['Current Salary', calculationData.inputs.currentSalary],
                    ['Current City', calculationData.inputs.currentCity],
                    ['Target City', calculationData.inputs.targetCity],
                    [],
                    ['Result', 'Value'],
                    ['Equivalent Salary', calculationData.result.equivalentSalary],
                    ['Difference', calculationData.result.difference],
                    ['Percentage Diff', `${calculationData.result.percentage}%`]
                ];
                cols = [{ wch: 25 }, { wch: 15 }];
                break;
            default:
                return;
        }

        const ws = XLSX.utils.aoa_to_sheet(data);
        ws['!cols'] = cols;
        XLSX.utils.book_append_sheet(wb, ws, 'Calculation Result');
        XLSX.writeFile(wb, `${activeTab}-calculation.xlsx`);
    };

    return (
        <div className="max-w-5xl mx-auto mb-3">
            <div id="additional-calculator-container" className="bg-white/60 dark:bg-gray-900/40 backdrop-blur-xl border border-white/50 dark:border-gray-800 rounded-3xl p-10 shadow-[0_8px_25px_rgba(0,0,0,0.06)]">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-teal-700 via-teal-600 to-blue-600 bg-clip-text text-transparent dark:from-teal-200 dark:via-cyan-200 dark:to-blue-200 mb-2">Additional Calculators</h1>
                        <p className="text-gray-600 dark:text-gray-400">Useful tools for specific salary components and planning.</p>
                    </div>
                    {calculationData && (
                        <div className="flex flex-nowrap gap-2 items-center">
                            <button
                                onClick={handleDownloadPDF}
                                className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg transition-colors text-sm font-medium"
                                title="Download as PDF"
                            >
                                <Download size={18} />
                                <span>PDF</span>
                            </button>
                            <button
                                onClick={handleDownloadExcel}
                                className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg transition-colors text-sm font-medium"
                                title="Download as Excel"
                            >
                                <FileSpreadsheet size={18} />
                                <span>Excel</span>
                            </button>
                            <button
                                onClick={() => setIsShareModalOpen(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg transition-colors text-sm font-medium"
                                title="Share"
                            >
                                <Share2 size={18} />
                                <span>Share</span>
                            </button>
                        </div>
                    )}
                </div>

                <div className="flex flex-wrap gap-2 mb-8 border-b border-gray-200 dark:border-gray-700 pb-4">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id
                                ? 'bg-teal-100 dark:bg-teal-900/50 text-teal-700 dark:text-teal-300'
                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="min-h-[300px]">
                    {activeTab === 'pf' && <PFCalculator onCalculate={handleCalculationUpdate} />}
                    {activeTab === 'hra' && <HRACalculator onCalculate={handleCalculationUpdate} />}
                    {activeTab === 'gratuity' && <GratuityCalculator onCalculate={handleCalculationUpdate} />}
                    {activeTab === 'bonus' && <BonusCalculator onCalculate={handleCalculationUpdate} />}
                    {activeTab === 'lta' && <LTACalculator onCalculate={handleCalculationUpdate} />}
                    {activeTab === 'col' && <CostOfLivingCalculator onCalculate={handleCalculationUpdate} />}
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

const PFCalculator = ({ onCalculate }) => {
    const [basic, setBasic] = useState('');
    const [result, setResult] = useState(null);

    const calculate = () => {
        const b = parseFloat(basic) || 0;
        if (b <= 0) {
            setResult(null);
            return;
        }

        // Employee Share: 12% of Basic
        const emp = b * 0.12;

        // Employer Share: 12% of Basic
        // Breakdown: EPS (8.33% of Basic, capped at 15000 usually, but here we'll use standard 12% split logic)
        // Standard Practice: EPS is 8.33% of Basic (capped at wage ceiling 15000). 
        // If Basic > 15000, EPS is 8.33% of 15000 = 1250.
        // EPF is Balance (12% of Basic - EPS).

        const wageCeiling = 15000;
        const epsBase = Math.min(b, wageCeiling);
        const eps = epsBase * 0.0833;

        const totalEmployer = b * 0.12;
        const epfEmployer = totalEmployer - eps;

        const res = {
            employee: emp,
            employer: {
                total: totalEmployer,
                epf: epfEmployer,
                eps: eps
            },
            total: emp + totalEmployer
        };

        setResult(res);
        if (onCalculate) onCalculate({ inputs: { basic: b }, result: res });
    };

    return (
        <div className="max-w-md mx-auto sm:mx-0">
            <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-200">PF Calculator</h3>
            <div className="space-y-4">
                <Input label="Basic Salary (Monthly)" type="text" value={formatIndianNumber(basic)} onChange={(e) => {
                    let val = parseIndianNumber(e.target.value);
                    if (val > 100000000) val = 100000000;
                    setBasic(val);
                }} />
                <Button onClick={calculate}>Calculate PF</Button>
                {result && (
                    <div className="mt-6 p-6 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700 space-y-3 text-sm">
                        <div className="flex justify-between items-center pb-2 border-b border-gray-200 dark:border-gray-700">
                            <span className="text-gray-600 dark:text-gray-400">Employee Share (12%)</span>
                            <span className="font-bold text-lg text-gray-900 dark:text-gray-100">{f_simple(result.employee)}</span>
                        </div>
                        <div className="space-y-1">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600 dark:text-gray-400">Employer Share (12%)</span>
                                <span className="font-bold text-gray-900 dark:text-gray-100">{f_simple(result.employer.total)}</span>
                            </div>
                            <div className="pl-4 text-xs text-gray-500 space-y-1">
                                <div className="flex justify-between">
                                    <span>EPF (Balance)</span>
                                    <span>{f_simple(result.employer.epf)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>EPS (8.33% of capped Basic)</span>
                                    <span>{f_simple(result.employer.eps)}</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-between items-center pt-3 border-t border-gray-200 dark:border-gray-700">
                            <span className="font-bold text-teal-600 dark:text-teal-400">Total Monthly Contribution</span>
                            <span className="font-bold text-xl text-teal-600 dark:text-teal-400">{f_simple(result.total)}</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const HRACalculator = ({ onCalculate }) => {
    const [basic, setBasic] = useState('');
    const [hraReceived, setHraReceived] = useState('');
    const [rentPaid, setRentPaid] = useState('');
    const [isMetro, setIsMetro] = useState(true);
    const [exempt, setExempt] = useState(null);

    const calculate = () => {
        const b = parseFloat(basic) || 0;
        const hra = parseFloat(hraReceived) || 0;
        const rent = parseFloat(rentPaid) || 0;

        if (b <= 0) {
            setExempt(null);
            return;
        }

        const c1 = hra;
        const c2 = isMetro ? b * 0.50 : b * 0.40;
        const c3 = Math.max(0, rent - (b * 0.10));

        const exemptVal = Math.min(c1, c2, c3);
        setExempt(exemptVal);
        if (onCalculate) onCalculate({
            inputs: { basic: b, hraReceived: hra, rentPaid: rent, isMetro },
            result: { exempt: exemptVal, taxable: Math.max(0, hra - exemptVal) }
        });
    };

    return (
        <div className="max-w-md mx-auto sm:mx-0">
            <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-200">HRA Exemption Calculator</h3>
            <div className="space-y-4">
                <Input label="Basic Salary (Yearly)" type="text" value={formatIndianNumber(basic)} onChange={(e) => {
                    let val = parseIndianNumber(e.target.value);
                    if (val > 100000000) val = 100000000;
                    setBasic(val);
                }} />
                <Input label="HRA Received (Yearly)" type="text" value={formatIndianNumber(hraReceived)} onChange={(e) => {
                    let val = parseIndianNumber(e.target.value);
                    if (val > 100000000) val = 100000000;
                    setHraReceived(val);
                }} />
                <Input label="Total Rent Paid (Yearly)" type="text" value={formatIndianNumber(rentPaid)} onChange={(e) => {
                    let val = parseIndianNumber(e.target.value);
                    if (val > 100000000) val = 100000000;
                    setRentPaid(val);
                }} />
                <div className="flex items-center space-x-4 py-2">
                    <label className="flex items-center cursor-pointer group">
                        <div className="relative">
                            <input type="checkbox" checked={isMetro} onChange={(e) => setIsMetro(e.target.checked)} className="sr-only" />
                            <div className={`w-10 h-6 bg-gray-200 dark:bg-gray-700 rounded-full shadow-inner transition-colors ${isMetro ? 'bg-teal-500' : ''}`}></div>
                            <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${isMetro ? 'translate-x-4' : ''}`}></div>
                        </div>
                        <span className="ml-3 text-gray-700 dark:text-gray-300 font-medium group-hover:text-teal-600 transition-colors">Metro City (50%)</span>
                    </label>
                </div>
                <Button onClick={calculate}>Calculate Exemption</Button>
                {exempt !== null && (
                    <div className="mt-6 p-6 bg-green-50 dark:bg-green-900/20 rounded-2xl border border-green-100 dark:border-green-800/50">
                        <p className="text-center text-green-800 dark:text-green-300 font-medium mb-1">Exempted HRA Amount</p>
                        <p className="text-center text-3xl font-bold text-green-600 dark:text-green-400">{f_simple(exempt)}</p>
                        <p className="text-center text-xs text-green-600/70 dark:text-green-400/70 mt-2">Taxable HRA: {f_simple(Math.max(0, (parseFloat(hraReceived) || 0) - exempt))}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

const GratuityCalculator = ({ onCalculate }) => {
    const [basic, setBasic] = useState('');
    const [years, setYears] = useState('');
    const [gratuity, setGratuity] = useState(null);

    const calculate = () => {
        const b = parseFloat(basic) || 0;
        const y = parseFloat(years) || 0;
        // Formula: (15 * last drawn salary * tenure) / 26
        if (b <= 0) {
            setGratuity(null);
            return;
        }
        const val = (15 * b * y) / 26;
        setGratuity(val);
        if (onCalculate) onCalculate({ inputs: { basic: b, years: y }, result: val });
    };

    return (
        <div className="max-w-md mx-auto sm:mx-0">
            <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-200">Gratuity Calculator</h3>
            <div className="space-y-4">
                <Input label="Basic Salary (Monthly)" type="text" value={formatIndianNumber(basic)} onChange={(e) => {
                    let val = parseIndianNumber(e.target.value);
                    if (val > 100000000) val = 100000000;
                    setBasic(val);
                }} />
                <Input label="Years of Service" type="number" value={years} onChange={(e) => setYears(e.target.value)} />
                <Button onClick={calculate}>Calculate Gratuity</Button>
                {gratuity !== null && (
                    <div className="mt-6 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-800/50">
                        <p className="text-center text-blue-800 dark:text-blue-300 font-medium mb-1">Estimated Gratuity Payout</p>
                        <p className="text-center text-3xl font-bold text-blue-600 dark:text-blue-400">{f_simple(gratuity)}</p>
                        <p className="text-center text-xs text-blue-600/70 dark:text-blue-400/70 mt-2">Formula: (15 × Basic × Years) / 26</p>
                    </div>
                )}
            </div>
        </div>
    );
};

const BonusCalculator = ({ onCalculate }) => {
    const [basic, setBasic] = useState('');
    const [percent, setPercent] = useState('');
    const [bonus, setBonus] = useState(null);

    const calculate = () => {
        const b = parseFloat(basic) || 0;
        const p = parseFloat(percent) || 0;

        if (b <= 0) {
            setBonus(null);
            return;
        }

        const res = {
            min: b * 0.0833,
            max: b * 0.20,
            custom: p > 0 ? (b * p) / 100 : null,
            customPercent: p
        };
        setBonus(res);
        if (onCalculate) onCalculate({ inputs: { basic: b, percent: p }, result: res });
    };

    return (
        <div className="max-w-md mx-auto sm:mx-0">
            <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-200">Bonus Calculator</h3>
            <div className="space-y-4">
                <Input label="Basic Salary (Yearly)" type="text" value={formatIndianNumber(basic)} onChange={(e) => {
                    let val = parseIndianNumber(e.target.value);
                    if (val > 100000000) val = 100000000;
                    setBasic(val);
                }} />
                <Input label="Bonus Percentage (%)" type="number" value={percent} onChange={(e) => setPercent(e.target.value)} />
                <Button onClick={calculate}>Calculate Bonus</Button>
                {bonus && (
                    <div className="mt-6 p-6 bg-purple-50 dark:bg-purple-900/20 rounded-2xl border border-purple-100 dark:border-purple-800/50 space-y-4">
                        {bonus.custom !== null && (
                            <div className="pb-4 border-b border-purple-200 dark:border-purple-800/50">
                                <p className="text-center text-purple-800 dark:text-purple-300 font-medium mb-1">Your Bonus ({bonus.customPercent}%)</p>
                                <p className="text-center text-3xl font-bold text-purple-600 dark:text-purple-400">{f_simple(bonus.custom)}</p>
                            </div>
                        )}
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600 dark:text-gray-400">Min Statutory Bonus (8.33%)</span>
                                <span className="font-bold text-gray-700 dark:text-gray-300">{f_simple(bonus.min)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600 dark:text-gray-400">Max Statutory Bonus (20%)</span>
                                <span className="font-bold text-gray-700 dark:text-gray-300">{f_simple(bonus.max)}</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const LTACalculator = ({ onCalculate }) => {
    const [ltaReceived, setLtaReceived] = useState('');
    const [travelCost, setTravelCost] = useState('');
    const [result, setResult] = useState(null);

    const calculate = () => {
        const received = parseFloat(ltaReceived) || 0;
        const cost = parseFloat(travelCost) || 0;

        if (received <= 0) {
            setResult(null);
            return;
        }

        // Exemption is limited to the actual travel cost or the amount received, whichever is lower.
        const exempt = Math.min(received, cost);
        const taxable = Math.max(0, received - exempt);

        const res = { exempt, taxable };
        setResult(res);
        if (onCalculate) onCalculate({ inputs: { ltaReceived: received, travelCost: cost }, result: res });
    };

    return (
        <div className="max-w-md mx-auto sm:mx-0">
            <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-200">LTA Exemption Calculator</h3>
            <div className="space-y-4">
                <Input label="LTA Received (Yearly)" type="text" value={formatIndianNumber(ltaReceived)} onChange={(e) => {
                    let val = parseIndianNumber(e.target.value);
                    if (val > 100000000) val = 100000000;
                    setLtaReceived(val);
                }} />
                <Input label="Actual Travel Cost" type="text" value={formatIndianNumber(travelCost)} onChange={(e) => {
                    let val = parseIndianNumber(e.target.value);
                    if (val > 100000000) val = 100000000;
                    setTravelCost(val);
                }} />
                <Button onClick={calculate}>Calculate Exemption</Button>
                {result && (
                    <div className="mt-6 p-6 bg-orange-50 dark:bg-orange-900/20 rounded-2xl border border-orange-100 dark:border-orange-800/50">
                        <div className="grid grid-cols-2 gap-4 text-center">
                            <div>
                                <p className="text-orange-800 dark:text-orange-300 font-medium mb-1">Exempt LTA</p>
                                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{f_simple(result.exempt)}</p>
                            </div>
                            <div>
                                <p className="text-gray-600 dark:text-gray-400 font-medium mb-1">Taxable LTA</p>
                                <p className="text-2xl font-bold text-gray-700 dark:text-gray-300">{f_simple(result.taxable)}</p>
                            </div>
                        </div>
                        <p className="text-center text-xs text-orange-600/70 dark:text-orange-400/70 mt-4">Exemption is limited to actual travel expenses.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

const CostOfLivingCalculator = ({ onCalculate }) => {
    const [currentSalary, setCurrentSalary] = useState('');
    const [currentCity, setCurrentCity] = useState('Bangalore');
    const [targetCity, setTargetCity] = useState('Mumbai');
    const [result, setResult] = useState(null);

    // Approximate Cost of Living Indices (Base: Bangalore = 100)
    const cityIndices = {
        'Bangalore': 100,
        'Mumbai': 115,
        'Delhi': 105,
        'Hyderabad': 95,
        'Chennai': 95,
        'Pune': 90,
        'Kolkata': 85,
        'Ahmedabad': 85,
        'Gurgaon': 105,
        'Noida': 100
    };

    const calculate = () => {
        const salary = parseFloat(currentSalary) || 0;
        if (salary <= 0) {
            setResult(null);
            return;
        }
        const currentIndex = cityIndices[currentCity];
        const targetIndex = cityIndices[targetCity];

        const equivalentSalary = (salary * targetIndex) / currentIndex;
        const difference = equivalentSalary - salary;
        const percentage = ((difference / salary) * 100).toFixed(1);

        const res = { equivalentSalary, difference, percentage };
        setResult(res);
        if (onCalculate) onCalculate({ inputs: { currentSalary: salary, currentCity, targetCity }, result: res });
    };

    return (
        <div className="max-w-md mx-auto sm:mx-0">
            <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-200">Cost of Living Comparison</h3>
            <div className="space-y-4">
                <Input label="Current Salary (Annual)" type="text" value={formatIndianNumber(currentSalary)} onChange={(e) => {
                    let val = parseIndianNumber(e.target.value);
                    if (val > 100000000) val = 100000000;
                    setCurrentSalary(val);
                }} />

                <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Current City</label>
                        <select
                            value={currentCity}
                            onChange={(e) => setCurrentCity(e.target.value)}
                            className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-teal-500 outline-none"
                        >
                            {Object.keys(cityIndices).map(city => <option key={city} value={city}>{city}</option>)}
                        </select>
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Target City</label>
                        <select
                            value={targetCity}
                            onChange={(e) => setTargetCity(e.target.value)}
                            className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-teal-500 outline-none"
                        >
                            {Object.keys(cityIndices).map(city => <option key={city} value={city}>{city}</option>)}
                        </select>
                    </div>
                </div>

                <Button onClick={calculate}>Compare Cost</Button>

                {result && (
                    <div className="mt-6 p-6 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl border border-indigo-100 dark:border-indigo-800/50">
                        <p className="text-center text-indigo-800 dark:text-indigo-300 font-medium mb-1">Equivalent Salary in {targetCity}</p>
                        <p className="text-center text-3xl font-bold text-indigo-600 dark:text-indigo-400">{f_simple(result.equivalentSalary)}</p>

                        <div className={`mt-3 text-center text-sm font-medium ${result.difference > 0 ? 'text-red-500' : 'text-green-500'}`}>
                            {result.difference > 0 ? 'Needs' : 'Saves'} {f_simple(Math.abs(result.difference))} ({Math.abs(result.percentage)}%) {result.difference > 0 ? 'more' : 'less'}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdditionalCalculators;
