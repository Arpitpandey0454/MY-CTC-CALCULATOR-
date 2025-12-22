import React, { useState } from 'react';
import { f_simple, formatIndianNumber, parseIndianNumber } from '../../utils/formatters';

const Input = ({ label, value, onChange, type = "text", readOnly = false }) => (
    <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
        <div className="relative">
            <input
                type={type}
                value={value}
                onChange={onChange}
                readOnly={readOnly}
                className={`w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all ${readOnly ? 'opacity-70 cursor-not-allowed' : ''}`}
            />
        </div>
    </div>
);

const Button = ({ children, onClick }) => (
    <button
        onClick={onClick}
        className="w-full py-3 px-4 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-teal-500/20 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
    >
        {children}
    </button>
);

const AdditionalCalculators = ({ activeSubTab }) => {
    const [localActiveTab, setLocalActiveTab] = useState('pf');

    // Sync prop with local state if provided
    React.useEffect(() => {
        if (activeSubTab) {
            setLocalActiveTab(activeSubTab);
        }
    }, [activeSubTab]);

    const activeTab = activeSubTab || localActiveTab;
    const setActiveTab = setLocalActiveTab; // Internal clicks just update local unless driven by parent re-render

    const tabs = [
        { id: 'pf', label: 'PF Calculator' },
        { id: 'hra', label: 'HRA Exemption' },
        { id: 'gratuity', label: 'Gratuity' },
        { id: 'bonus', label: 'Bonus' },
        { id: 'lta', label: 'LTA Calculator' },
        { id: 'col', label: 'Cost of Living' },
    ];

    return (
        <div className="max-w-5xl mx-auto">
            <div className="bg-white/60 dark:bg-gray-900 backdrop-blur-lg rounded-3xl shadow-xl border border-gray-200/50 dark:border-gray-800 p-6 sm:p-8">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-teal-700 via-teal-600 to-blue-600 bg-clip-text text-transparent dark:from-teal-200 dark:via-cyan-200 dark:to-blue-200 mb-2">Additional Calculators</h2>

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
                    {activeTab === 'lta' && <LTACalculator />}
                    {activeTab === 'col' && <CostOfLivingCalculator />}
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

        setResult({
            employee: emp,
            employer: {
                total: totalEmployer,
                epf: epfEmployer,
                eps: eps
            },
            total: emp + totalEmployer
        });
    };

    return (
        <div className="max-w-md mx-auto sm:mx-0">
            <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-200">PF Calculator</h3>
            <div className="space-y-4">
                <Input label="Basic Salary (Monthly)" type="text" value={formatIndianNumber(basic)} onChange={(e) => setBasic(parseIndianNumber(e.target.value))} />
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
        <div className="max-w-md mx-auto sm:mx-0">
            <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-200">HRA Exemption Calculator</h3>
            <div className="space-y-4">
                <Input label="Basic Salary (Yearly)" type="text" value={formatIndianNumber(basic)} onChange={(e) => setBasic(parseIndianNumber(e.target.value))} />
                <Input label="HRA Received (Yearly)" type="text" value={formatIndianNumber(hraReceived)} onChange={(e) => setHraReceived(parseIndianNumber(e.target.value))} />
                <Input label="Total Rent Paid (Yearly)" type="text" value={formatIndianNumber(rentPaid)} onChange={(e) => setRentPaid(parseIndianNumber(e.target.value))} />
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
        <div className="max-w-md mx-auto sm:mx-0">
            <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-200">Gratuity Calculator</h3>
            <div className="space-y-4">
                <Input label="Basic Salary (Monthly)" type="text" value={formatIndianNumber(basic)} onChange={(e) => setBasic(parseIndianNumber(e.target.value))} />
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

const BonusCalculator = () => {
    const [basic, setBasic] = useState('');
    const [percent, setPercent] = useState('');
    const [bonus, setBonus] = useState(null);

    const calculate = () => {
        const b = parseFloat(basic) || 0;
        const p = parseFloat(percent) || 0;

        setBonus({
            min: b * 0.0833,
            max: b * 0.20,
            custom: p > 0 ? (b * p) / 100 : null,
            customPercent: p
        });
    };

    return (
        <div className="max-w-md mx-auto sm:mx-0">
            <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-200">Bonus Calculator</h3>
            <div className="space-y-4">
                <Input label="Basic Salary (Yearly)" type="text" value={formatIndianNumber(basic)} onChange={(e) => setBasic(parseIndianNumber(e.target.value))} />
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

const LTACalculator = () => {
    const [ltaReceived, setLtaReceived] = useState('');
    const [travelCost, setTravelCost] = useState('');
    const [result, setResult] = useState(null);

    const calculate = () => {
        const received = parseFloat(ltaReceived) || 0;
        const cost = parseFloat(travelCost) || 0;

        // Exemption is limited to the actual travel cost or the amount received, whichever is lower.
        const exempt = Math.min(received, cost);
        const taxable = Math.max(0, received - exempt);

        setResult({ exempt, taxable });
    };

    return (
        <div className="max-w-md mx-auto sm:mx-0">
            <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-200">LTA Exemption Calculator</h3>
            <div className="space-y-4">
                <Input label="LTA Received (Yearly)" type="text" value={formatIndianNumber(ltaReceived)} onChange={(e) => setLtaReceived(parseIndianNumber(e.target.value))} />
                <Input label="Actual Travel Cost" type="text" value={formatIndianNumber(travelCost)} onChange={(e) => setTravelCost(parseIndianNumber(e.target.value))} />
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

const CostOfLivingCalculator = () => {
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
        const currentIndex = cityIndices[currentCity];
        const targetIndex = cityIndices[targetCity];

        const equivalentSalary = (salary * targetIndex) / currentIndex;
        const difference = equivalentSalary - salary;
        const percentage = ((difference / salary) * 100).toFixed(1);

        setResult({ equivalentSalary, difference, percentage });
    };

    return (
        <div className="max-w-md mx-auto sm:mx-0">
            <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-200">Cost of Living Comparison</h3>
            <div className="space-y-4">
                <Input label="Current Salary (Annual)" type="text" value={formatIndianNumber(currentSalary)} onChange={(e) => setCurrentSalary(parseIndianNumber(e.target.value))} />

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
