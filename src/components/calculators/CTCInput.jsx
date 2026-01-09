import React from 'react';
import Input from '../shared/Input';
import { numberToWordsIndian, f_simple, formatIndianNumber, parseIndianNumber } from '../../utils/formatters';
import { HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';
import Tooltip from '../shared/Tooltip';

const CTCInput = ({
    ctc, setCtc,
    taxRegime, setTaxRegime,
    inputMode, handleModeChange,
    inputs, updateInput,
    includeEmployerPF, setIncludeEmployerPF,
    includeGratuity, setIncludeGratuity,
    results,
    percentageError
}) => {

    const [showMore, setShowMore] = React.useState(false);

    const handleCtcChange = (e) => {
        let val = e.target.value;
        // Remove commas for parsing
        const rawVal = parseIndianNumber(val);
        // if (rawVal > 100000000) rawVal = 100000000; // Removed clamp to allow showing error message
        setCtc(rawVal);
    };

    const handleInputChange = (key, value) => {
        if (key === 'insurance' || key === 'profTax') {
            let val = parseIndianNumber(value);
            if (key === 'profTax' && val > 2500) {
                val = 2500;
            }
            updateInput(key, val);
            return;
        }

        if (inputMode === 'amount') {
            let numericValue = parseIndianNumber(value);

            // Specific validation for NPS: Max 14% of CTC
            if (key === 'nps') {
                const maxNPSAmount = ctc * 0.14;
                if (numericValue > maxNPSAmount) {
                    updateInput(key, maxNPSAmount);
                    return;
                }
            }

            // Specific validation for Other Deductions: Max 20% of CTC
            if (key === 'other') {
                const maxOtherAmount = ctc * 0.20;
                if (numericValue > maxOtherAmount) {
                    updateInput(key, maxOtherAmount);
                    return;
                }
            }

            // Specific validation for Gratuity: Max 4.81% of Basic
            if (key === 'gratuity') {
                const basicAmount = parseIndianNumber(inputs.basic);
                const maxGratuity = basicAmount * 0.0481;
                if (numericValue > maxGratuity) {
                    updateInput(key, maxGratuity);
                    return;
                }
            }

            updateInput(key, numericValue);
        } else {
            // Percentage Mode
            // Remove non-numeric characters except dot AND strip leading zeros
            const cleanVal = value.replace(/[^0-9.]/g, '').replace(/^0+(?=\d)/, '');

            // Block input if greater than 100 in percentage mode general case
            if (parseFloat(cleanVal) > 100) return;

            // Specific validaton for NPS: Max 14%
            if (key === 'nps') {
                if (parseFloat(cleanVal) > 14) {
                    updateInput(key, 14);
                    return;
                }
            }

            // Specific validation for Other Deductions: Max 20%
            if (key === 'other') {
                if (parseFloat(cleanVal) > 20) {
                    updateInput(key, 20);
                    return;
                }
            }

            // Specific validation for Gratuity: Max 4.81%
            if (key === 'gratuity') {
                if (parseFloat(cleanVal) > 4.81) {
                    updateInput(key, 4.81);
                    return;
                }
            }

            updateInput(key, cleanVal);
        }
    };

    const getInputValue = (key) => {
        if (inputMode === 'amount') {
            return formatIndianNumber(inputs[key]);
        }
        return inputs[key];
    };

    const getTooltipText = (label) => {
        return `Enter ${inputMode} for ${label}`;
    };

    const inputClass = "w-22 text-right";

    return (
        <div className="p-6 rounded-2xl bg-white dark:bg-sky-950/10 border border-gray-200 dark:border-sky-100">
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
                                    onFocus={(e) => e.target.select()}
                                />
                            </div>
                            <p className="mt-2 text-sm text-green-700 dark:text-green-400">{numberToWordsIndian(ctc)}</p>
                        </div>
                    </div>
                    {parseFloat(ctc) < 10000 && parseFloat(ctc) > 0 && (
                        <div className="mt-2 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm font-semibold">
                            Minimum CTC should be ₹10,000.
                        </div>
                    )}
                    {parseFloat(ctc) > 100000000 && (
                        <div className="mt-2 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm font-semibold">
                            Maximum CTC can be ₹10 Cr.
                        </div>
                    )}
                    {parseFloat(ctc) <= 0 && (
                        <div className="mt-2 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm font-semibold">
                            Invalid input, provide number more than zero.
                        </div>
                    )}
                    {percentageError && (
                        <div className="mt-2 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm font-semibold">
                            Total percentage should be 100%. Current total: {percentageError}%.
                        </div>
                    )}
                </div>
            </div>

            <hr className="border-gray-200/80 dark:border-gray-700/80 my-4" />

            <div className="flex justify-between items-center my-4">
                <h3 className="text-medium font-medium text-gray-800 dark:text-gray-100">Income Tax Regime</h3>
                <div className="flex items-center space-x-4">
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

            <hr className="border-gray-200/80 dark:border-gray-700/80 my-4" />

            <div className="space-y-4">
                <div className="flex justify-between items-center mb-2">
                    <h3 className="text-lg font-medium text-gray-800 dark:text-gray-100">Salary Components</h3>
                    <div className="flex bg-gray-200 dark:bg-gray-700 p-1 rounded-lg">
                        <button
                            onClick={() => handleModeChange('percentage')}
                            className={`px-3 py-1 text-sm font-medium rounded-md transition-all ${inputMode === 'percentage'
                                ? 'bg-teal-600 text-white shadow'
                                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-600'
                                }`}
                        >
                            % Percentage
                        </button>
                        <button
                            onClick={() => handleModeChange('amount')}
                            className={`px-3 py-1 text-sm font-medium rounded-md transition-all ${inputMode === 'amount'
                                ? 'bg-teal-600 text-white shadow'
                                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-600'
                                }`}
                        >
                            ₹ Amount
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-3 items-center">
                    <label className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
                        Basic
                        <Tooltip content={getTooltipText('Basic Salary')}>
                            <HelpCircle size={14} className="ml-1 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 cursor-help" />
                        </Tooltip>
                    </label>
                    <Input
                        type="text"
                        value={getInputValue('basic')}
                        onChange={(e) => handleInputChange('basic', e.target.value)}
                        onFocus={(e) => e.target.select()}
                        className={inputClass}
                        min="0"
                    />

                    <label className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
                        HRA
                        <Tooltip content={getTooltipText('HRA')}>
                            <HelpCircle size={14} className="ml-1 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 cursor-help" />
                        </Tooltip>
                    </label>
                    <Input
                        type="text"
                        value={getInputValue('hra')}
                        onChange={(e) => handleInputChange('hra', e.target.value)}
                        onFocus={(e) => e.target.select()}
                        className={inputClass}
                        min="0"
                    />

                    <label className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
                        DA
                        <Tooltip content={getTooltipText('DA')}>
                            <HelpCircle size={14} className="ml-1 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 cursor-help" />
                        </Tooltip>
                    </label>
                    <Input
                        type="text"
                        value={getInputValue('da')}
                        onChange={(e) => handleInputChange('da', e.target.value)}
                        onFocus={(e) => e.target.select()}
                        className={inputClass}
                        min="0"
                    />

                    <label className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
                        Employee PF
                        <Tooltip content={getTooltipText('Employee PF')}>
                            <HelpCircle size={14} className="ml-1 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 cursor-help" />
                        </Tooltip>
                    </label>
                    <Input
                        type="text"
                        value={getInputValue('empPF')}
                        onChange={(e) => handleInputChange('empPF', e.target.value)}
                        onFocus={(e) => e.target.select()}
                        className={inputClass}
                        min="0"
                    />

                    <label className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
                        Special Allowance
                        <Tooltip content={getTooltipText('Special Allowance')}>
                            <HelpCircle size={14} className="ml-1 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 cursor-help" />
                        </Tooltip>
                    </label>
                    <Input
                        value={inputMode === 'percentage' && ctc > 0
                            ? ((results?.components?.special || 0) / ctc * 100).toFixed(2)
                            : f_simple(results?.components?.special || 0)}
                        readOnly
                        className={inputClass}
                        onFocus={(e) => e.target.select()}
                    />

                    {/* Show More / Show Less Button */}
                    <div className="col-span-2 flex justify-center py-2">
                        <button
                            type="button"
                            onClick={() => setShowMore(!showMore)}
                            className="flex items-center text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium text-sm transition-colors"
                        >
                            {showMore ? ' Advanced options' : 'Advanced options'}
                            {showMore ? <ChevronUp size={16} className="ml-1" /> : <ChevronDown size={16} className="ml-1" />}
                        </button>
                    </div>

                    {showMore && (
                        <>
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    checked={includeEmployerPF}
                                    onChange={(e) => setIncludeEmployerPF(e.target.checked)}
                                    className="h-4 w-4 text-teal-600 dark:text-teal-500 border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 focus:ring-teal-500 mr-2"
                                />
                                <label className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
                                    Employer PF
                                    <Tooltip content={getTooltipText('Employer PF')}>
                                        <HelpCircle size={14} className="ml-1 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 cursor-help" />
                                    </Tooltip>
                                </label>
                            </div>
                            <Input
                                type="text"
                                value={getInputValue('emplrPF')}
                                onChange={(e) => handleInputChange('emplrPF', e.target.value)}
                                onFocus={(e) => e.target.select()}
                                className={inputClass}
                                min="0"
                                readOnly={true}
                            />

                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    checked={includeGratuity}
                                    onChange={(e) => setIncludeGratuity(e.target.checked)}
                                    className="h-4 w-4 text-teal-600 dark:text-teal-500 border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 focus:ring-teal-500 mr-2"
                                />
                                <label className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
                                    Gratuity
                                    <Tooltip content={getTooltipText('Gratuity')}>
                                        <HelpCircle size={14} className="ml-1 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 cursor-help" />
                                    </Tooltip>
                                </label>
                            </div>
                            <Input
                                type="text"
                                value={getInputValue('gratuity')}
                                onChange={(e) => handleInputChange('gratuity', e.target.value)}
                                onFocus={(e) => e.target.select()}
                                className={`${inputClass} ${!includeGratuity ? 'opacity-50 cursor-not-allowed bg-gray-100 dark:bg-gray-800' : ''}`}
                                min="0"
                                disabled={!includeGratuity}
                            />

                            <label className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
                                Insurance
                                <Tooltip content="Enter amount for Insurance">
                                    <HelpCircle size={14} className="ml-1 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 cursor-help" />
                                </Tooltip>
                            </label>
                            <Input
                                type="text"
                                value={formatIndianNumber(inputs.insurance)}
                                onChange={(e) => handleInputChange('insurance', e.target.value)}
                                onFocus={(e) => e.target.select()}
                                className={inputClass}
                                min="0"
                            />

                            <label className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
                                Other Deductions
                                <Tooltip content={getTooltipText('Other Deductions')}>
                                    <HelpCircle size={14} className="ml-1 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 cursor-help" />
                                </Tooltip>
                            </label>
                            <Input
                                type="text"
                                value={getInputValue('other')}
                                onChange={(e) => handleInputChange('other', e.target.value)}
                                onFocus={(e) => e.target.select()}
                                className={inputClass}
                                min="0"
                            />

                            <label className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
                                NPS
                                <Tooltip content={getTooltipText('NPS')}>
                                    <HelpCircle size={14} className="ml-1 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 cursor-help" />
                                </Tooltip>
                            </label>
                            <Input
                                type="text"
                                value={getInputValue('nps')}
                                onChange={(e) => handleInputChange('nps', e.target.value)}
                                onFocus={(e) => e.target.select()}
                                className={inputClass}
                                min="0"
                            />

                            <label className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
                                Professional Tax
                                <Tooltip content="Enter amount for Professional Tax">
                                    <HelpCircle size={14} className="ml-1 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 cursor-help" />
                                </Tooltip>
                            </label>
                            <Input
                                type="text"
                                value={formatIndianNumber(inputs.profTax)}
                                onChange={(e) => handleInputChange('profTax', e.target.value)}
                                onFocus={(e) => e.target.select()}
                                className={inputClass}
                                min="0"
                            />
                        </>
                    )}


                </div>
            </div>
        </div>
    );
};

export default CTCInput;
