import React, { useState } from 'react';
import Input from '../shared/Input';
import Button from '../shared/Button';
import { f_simple, formatIndianNumber, parseIndianNumber } from '../../utils/formatters';

const AdditionalCalculators = () => {
    const [activeTab, setActiveTab] = useState('pf');

    const tabs = [
        { id: 'pf', label: 'PF Calculator' },
        { id: 'hra', label: 'HRA Exemption' },
        { id: 'gratuity', label: 'Gratuity' },
        { id: 'bonus', label: 'Bonus' },
    ];

    return (
        <div className="max-w-5xl mx-auto">
            <div className="bg-white/60 dark:bg-gray-900 backdrop-blur-lg rounded-3xl shadow-xl dark:shadow-none border border-gray-200/50 dark:border-gray-800 p-6 sm:p-8">
                <h2 className="text-3xl font-bold mb-6 text-gray-900 dark:text-gray-100">Additional Calculators</h2>

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
                    {activeTab === 'pf' && <PFCalculator />}
                    {activeTab === 'hra' && <HRACalculator />}
                    {activeTab === 'gratuity' && <GratuityCalculator />}
                    {activeTab === 'bonus' && <BonusCalculator />}
                </div>
            </div>
        </div>
    );
};

const PFCalculator = () => {
    const [basic, setBasic] = useState('');
    const [result, setResult] = useState(null);

    const calculate = () => {
        const b = parseFloat(basic) || 0;
        const emp = b * 0.12;
        const emplyr = b * 0.12; // Simplified (3.67% PF + 8.33% EPS)
        setResult({ employee: emp, employer: emplyr, total: emp + emplyr });
    };

    return (
        <div className="max-w-md">
            <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-200">PF Calculator</h3>
            <div className="space-y-4">
                <Input label="Basic Salary (Monthly)" type="text" value={formatIndianNumber(basic)} onChange={(e) => setBasic(parseIndianNumber(e.target.value))} />
                <Button onClick={calculate}>Calculate PF</Button>
                {result && (
                    <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg space-y-2 text-sm">
                        <div className="flex justify-between"><span>Employee Share (12%)</span><span className="font-bold">{f_simple(result.employee)}</span></div>
                        <div className="flex justify-between"><span>Employer Share (12%)</span><span className="font-bold">{f_simple(result.employer)}</span></div>
                        <div className="flex justify-between border-t border-gray-300 dark:border-gray-600 pt-2 font-bold"><span>Total Monthly Contribution</span><span>{f_simple(result.total)}</span></div>
                    </div>
                )}
            </div>
        </div>
    );
};

const HRACalculator = () => {
    const [basic, setBasic] = useState('');
    const [hraReceived, setHraReceived] = useState('');
    const [rentPaid, setRentPaid] = useState('');
    const [isMetro, setIsMetro] = useState(true);
    const [exempt, setExempt] = useState(null);

    const calculate = () => {
        const b = parseFloat(basic) || 0;
        const hra = parseFloat(hraReceived) || 0;
        const rent = parseFloat(rentPaid) || 0;

        const c1 = hra;
        const c2 = isMetro ? b * 0.50 : b * 0.40;
        const c3 = Math.max(0, rent - (b * 0.10));

        setExempt(Math.min(c1, c2, c3));
    };

    return (
        <div className="max-w-md">
            <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-200">HRA Exemption Calculator</h3>
            <div className="space-y-4">
                <Input label="Basic Salary (Yearly)" type="text" value={formatIndianNumber(basic)} onChange={(e) => setBasic(parseIndianNumber(e.target.value))} />
                <Input label="HRA Received (Yearly)" type="text" value={formatIndianNumber(hraReceived)} onChange={(e) => setHraReceived(parseIndianNumber(e.target.value))} />
                <Input label="Total Rent Paid (Yearly)" type="text" value={formatIndianNumber(rentPaid)} onChange={(e) => setRentPaid(parseIndianNumber(e.target.value))} />
                <div className="flex items-center space-x-4">
                    <label className="flex items-center cursor-pointer">
                        <input type="checkbox" checked={isMetro} onChange={(e) => setIsMetro(e.target.checked)} className="h-4 w-4 text-teal-600 rounded focus:ring-teal-500" />
                        <span className="ml-2 text-gray-700 dark:text-gray-300">Metro City?</span>
                    </label>
                </div>
                <Button onClick={calculate}>Calculate Exemption</Button>
                {exempt !== null && (
                    <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/30 rounded-lg border border-green-200 dark:border-green-800">
                        <p className="text-center text-gray-600 dark:text-gray-400">Exempted HRA Amount</p>
                        <p className="text-center text-2xl font-bold text-green-600 dark:text-green-400">{f_simple(exempt)}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

const GratuityCalculator = () => {
    const [basic, setBasic] = useState('');
    const [years, setYears] = useState('');
    const [gratuity, setGratuity] = useState(null);

    const calculate = () => {
        const b = parseFloat(basic) || 0;
        const y = parseFloat(years) || 0;
        // Formula: (15 * last drawn salary * tenure) / 26
        const val = (15 * b * y) / 26;
        setGratuity(val);
    };

    return (
        <div className="max-w-md">
            <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-200">Gratuity Calculator</h3>
            <div className="space-y-4">
                <Input label="Basic Salary (Monthly)" type="text" value={formatIndianNumber(basic)} onChange={(e) => setBasic(parseIndianNumber(e.target.value))} />
                <Input label="Years of Service" type="number" value={years} onChange={(e) => setYears(e.target.value)} />
                <Button onClick={calculate}>Calculate Gratuity</Button>
                {gratuity !== null && (
                    <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-800">
                        <p className="text-center text-gray-600 dark:text-gray-400">Estimated Gratuity</p>
                        <p className="text-center text-2xl font-bold text-blue-600 dark:text-blue-400">{f_simple(gratuity)}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

const BonusCalculator = () => {
    const [basic, setBasic] = useState('');
    const [bonus, setBonus] = useState(null);

    const calculate = () => {
        const b = parseFloat(basic) || 0;
        // Simple assumption: 8.33% min, 20% max. Showing both.
        setBonus({ min: b * 0.0833, max: b * 0.20 });
    };

    return (
        <div className="max-w-md">
            <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-200">Bonus Calculator</h3>
            <div className="space-y-4">
                <Input label="Basic Salary (Yearly)" type="text" value={formatIndianNumber(basic)} onChange={(e) => setBasic(parseIndianNumber(e.target.value))} />
                <Button onClick={calculate}>Calculate Bonus Range</Button>
                {bonus && (
                    <div className="mt-4 p-4 bg-purple-50 dark:bg-purple-900/30 rounded-lg border border-purple-200 dark:border-purple-800 space-y-2">
                        <div className="flex justify-between"><span>Min Bonus (8.33%)</span><span className="font-bold">{f_simple(bonus.min)}</span></div>
                        <div className="flex justify-between"><span>Max Bonus (20%)</span><span className="font-bold">{f_simple(bonus.max)}</span></div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdditionalCalculators;
