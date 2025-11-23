import React from 'react';
import Input from '../shared/Input';
import { numberToWordsIndian, f_simple, formatIndianNumber, parseIndianNumber } from '../../utils/formatters';

const CTCInput = ({
    ctc, setCtc,
    taxRegime, setTaxRegime,
    inputMode, handleModeChange,
    inputs, updateInput,
    includeEmployerPF, setIncludeEmployerPF,
    results
}) => {

    const handleCtcChange = (e) => {
        let val = e.target.value;
        // Remove commas for parsing
        const rawVal = parseIndianNumber(val);
        setCtc(rawVal);
    };

    const handleInputChange = (key, value) => {
        if (inputMode === 'amount' || key === 'profTax') {
            updateInput(key, parseIndianNumber(value));
        } else {
            updateInput(key, value);
        }
    };

    const getInputValue = (key) => {
        if (inputMode === 'amount' || key === 'profTax') {
            return formatIndianNumber(inputs[key]);
        }
        return inputs[key];
    };

    const getLabelSuffix = (key) => {
        if (key === 'profTax') return '₹';
        if (inputMode === 'amount') return '₹';
        if (key === 'basic' || key === 'insurance' || key === 'other') return '%';
        return '%';
    };

    const inputClass = "w-22 text-right";

    return (
        <div className="p-6 rounded-2xl bg-amber-50 dark:bg-amber-950/10 border border-amber-200 dark:border-amber-100">
            <div>
                <label className="block text-gray-700 dark:text-gray-300 font-medium mb-4">Enter your Annual CTC</label>
                <div className="flex flex-col">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
                        <div className="w-full sm:flex-1">
                            <div className="flex items-center bg-gray-200 dark:bg-gray-700 rounded-full w-full sm:w-auto sm:min-w-[130px] px-4 py-2">
                                <span className="text-gray-600 dark:text-gray-300 font-medium">₹</span>
                                <input
                                    type="text"
                                    className="w-full bg-transparent text-gray-700 dark:text-gray-200 font-medium text-right focus:outline-none"
                                    value={formatIndianNumber(ctc)}
                                    onChange={handleCtcChange}
                                />
                            </div>
                            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{numberToWordsIndian(ctc)}</p>
                        </div>
                    </div>
                    {parseFloat(ctc) <= 0 && (
                        <div className="mt-2 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm font-semibold">
                            Invalid input, provide number more than zero.
                        </div>
                    )}
                </div>
            </div>

            <hr className="border-gray-200/80 dark:border-gray-700/80 my-4" />

            <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-800 dark:text-gray-100">Tax Regime</h3>
                <div className="flex items-center space-x-4">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Regime:</span>
                    <div className="flex items-center space-x-3">
                        <label className="inline-flex items-center cursor-pointer">
                            <input type="radio" name="taxRegime" value="new" checked={taxRegime === 'new'} onChange={() => setTaxRegime('new')} className="h-4 w-4 text-teal-600 dark:text-teal-500 border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:ring-teal-500" />
                            <span className="ml-2 text-gray-700 dark:text-gray-300">New</span>
                        </label>
                        <label className="inline-flex items-center cursor-pointer">
                            <input type="radio" name="taxRegime" value="old" checked={taxRegime === 'old'} onChange={() => setTaxRegime('old')} className="h-4 w-4 text-teal-600 dark:text-teal-500 border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:ring-teal-500" />
                            <span className="ml-2 text-gray-700 dark:text-gray-300">Old</span>
                        </label>
                    </div>
                </div>
            </div>

            <hr className="border-gray-200/80 dark:border-gray-700/80 my-4" />

            <div className="space-y-4">
                <div className="flex justify-between items-center mb-2">
                    <h3 className="text-lg font-medium text-gray-800 dark:text-gray-100">Salary Components</h3>
                    <div className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
                        <label className="inline-flex items-center cursor-pointer">
                            <input type="radio" name="inputMode" value="percentage" checked={inputMode === 'percentage'} onChange={() => handleModeChange('percentage')} className="h-4 w-4 text-teal-600 dark:text-teal-500 border-gray-300 dark:border-gray-600 dark:bg-gray-800 focus:ring-teal-500" />
                            <span className="ml-1 text-sm text-gray-700 dark:text-gray-300">%</span>
                        </label>
                        <label className="inline-flex items-center cursor-pointer">
                            <input type="radio" name="inputMode" value="amount" checked={inputMode === 'amount'} onChange={() => handleModeChange('amount')} className="h-4 w-4 text-teal-600 dark:text-teal-500 border-gray-300 dark:border-gray-600 dark:bg-gray-800 focus:ring-teal-500" />
                            <span className="ml-1 text-sm text-gray-700 dark:text-gray-300">₹</span>
                        </label>
                    </div>
                </div>

                <div className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-3 items-center">
                    <label className="text-sm text-gray-600 dark:text-gray-400">Basic <span className="text-xs text-gray-500">({getLabelSuffix('basic')})</span></label>
                    <Input
                        type={inputMode === 'amount' ? 'text' : 'number'}
                        value={getInputValue('basic')}
                        onChange={(e) => handleInputChange('basic', e.target.value)}
                        className={inputClass}
                        min="0"
                    />

                    <label className="text-sm text-gray-600 dark:text-gray-400">HRA <span className="text-xs text-gray-500">({getLabelSuffix('hra')})</span></label>
                    <Input
                        type={inputMode === 'amount' ? 'text' : 'number'}
                        value={getInputValue('hra')}
                        onChange={(e) => handleInputChange('hra', e.target.value)}
                        className={inputClass}
                        min="0"
                    />

                    <label className="text-sm text-gray-600 dark:text-gray-400">Employee PF <span className="text-xs text-gray-500">({getLabelSuffix('empPF')})</span></label>
                    <Input
                        type={inputMode === 'amount' ? 'text' : 'number'}
                        value={getInputValue('empPF')}
                        onChange={(e) => handleInputChange('empPF', e.target.value)}
                        className={inputClass}
                        min="0"
                    />

                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            checked={includeEmployerPF}
                            onChange={(e) => setIncludeEmployerPF(e.target.checked)}
                            className="h-4 w-4 text-teal-600 dark:text-teal-500 border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 focus:ring-teal-500 mr-2"
                        />
                        <label className="text-sm text-gray-600 dark:text-gray-400">Employer PF <span className="text-xs text-gray-500">({getLabelSuffix('emplrPF')})</span></label>
                    </div>
                    <Input
                        type={inputMode === 'amount' ? 'text' : 'number'}
                        value={getInputValue('emplrPF')}
                        onChange={(e) => handleInputChange('emplrPF', e.target.value)}
                        className={inputClass}
                        min="0"
                        readOnly={true}
                    />

                    <label className="text-sm text-gray-600 dark:text-gray-400">Gratuity <span className="text-xs text-gray-500">({getLabelSuffix('gratuity')})</span></label>
                    <Input
                        type={inputMode === 'amount' ? 'text' : 'number'}
                        value={getInputValue('gratuity')}
                        onChange={(e) => handleInputChange('gratuity', e.target.value)}
                        className={inputClass}
                        min="0"
                    />

                    <label className="text-sm text-gray-600 dark:text-gray-400">Insurance <span className="text-xs text-gray-500">({getLabelSuffix('insurance')})</span></label>
                    <Input
                        type={inputMode === 'amount' ? 'text' : 'number'}
                        value={getInputValue('insurance')}
                        onChange={(e) => handleInputChange('insurance', e.target.value)}
                        className={inputClass}
                        min="0"
                    />

                    <label className="text-sm text-gray-600 dark:text-gray-400">Other Deductions <span className="text-xs text-gray-500">({getLabelSuffix('other')})</span></label>
                    <Input
                        type={inputMode === 'amount' ? 'text' : 'number'}
                        value={getInputValue('other')}
                        onChange={(e) => handleInputChange('other', e.target.value)}
                        className={inputClass}
                        min="0"
                    />

                    <label className="text-sm text-gray-600 dark:text-gray-400">NPS <span className="text-xs text-gray-500">({getLabelSuffix('nps')})</span></label>
                    <Input
                        type={inputMode === 'amount' ? 'text' : 'number'}
                        value={getInputValue('nps')}
                        onChange={(e) => handleInputChange('nps', e.target.value)}
                        className={inputClass}
                        min="0"
                    />

                    <label className="text-sm text-gray-600 dark:text-gray-400">Professional Tax <span className="text-xs text-gray-500">({getLabelSuffix('profTax')})</span></label>
                    <Input
                        type="text"
                        value={getInputValue('profTax')}
                        onChange={(e) => handleInputChange('profTax', e.target.value)}
                        className={inputClass}
                        min="0"
                    />

                    <label className="text-sm text-gray-600 dark:text-gray-400">Special Allowance (Balancing)</label>
                    <Input value={f_simple(results?.components?.special || 0)} readOnly className={inputClass} />
                </div>
            </div>
        </div>
    );
};

export default CTCInput;
