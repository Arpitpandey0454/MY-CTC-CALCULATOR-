import { useState, useEffect } from 'react';

export const useSalaryCalculation = () => {
    // Initialize state from URL params if available
    const getInitialState = () => {
        const params = new URLSearchParams(window.location.search);
        if (params.get('tab') !== 'ctc-to-inhand') return null;

        return {
            ctc: params.get('ctc'),
            regime: params.get('regime'),
            mode: params.get('mode'),
            incPF: params.get('incPF') === 'true',
            incGratuity: params.get('incGratuity') === 'true',
            basic: params.get('basic'),
            hra: params.get('hra'),
            empPF: params.get('empPF'),
            emplrPF: params.get('emplrPF'),
            gratuity: params.get('gratuity'),
            insurance: params.get('insurance'),
            other: params.get('other'),
            nps: params.get('nps'),
            profTax: params.get('profTax'),
            da: params.get('da')
        };
    };

    const urlState = getInitialState();

    const [ctc, setCtc] = useState(urlState?.ctc || 1000000);
    const [taxRegime, setTaxRegime] = useState(urlState?.regime || 'new');
    const [inputMode, setInputMode] = useState(urlState?.mode || 'percentage'); // 'percentage' | 'amount'
    const [includeEmployerPF, setIncludeEmployerPF] = useState(urlState ? urlState.incPF : true);
    const [includeGratuity, setIncludeGratuity] = useState(urlState ? urlState.incGratuity : false);

    // Store current input values. Interpretation depends on inputMode.
    // In 'percentage' mode:
    // - basic: % of CTC
    // - hra, empPF, emplrPF, gratuity, nps: % of Basic
    // - insurance, other: % of CTC (EXCEPT Insurance is now always Amount)
    // - profTax: Always Amount (₹)
    const [inputs, setInputs] = useState({
        basic: urlState?.basic || 40,
        hra: urlState?.hra || 40,
        empPF: urlState?.empPF || 12,
        emplrPF: urlState?.emplrPF || 12,
        gratuity: urlState?.gratuity || 4.81,
        insurance: urlState?.insurance || 0, // Always Amount
        other: urlState?.other || 0,
        nps: urlState?.nps || 0,
        nps: urlState?.nps || 0,
        profTax: urlState?.profTax || 2400, // Always Amount, default 2400
        da: urlState?.da || 10
    });

    const [results, setResults] = useState(null);

    // Tax Slabs (Same as before)
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
        let slabBreakdown = [];

        for (let i = 0; i < slabs.length; i++) {
            const slab = slabs[i];
            if (remainingIncome <= 0) break;

            const upperLimit = slab.limit;
            let taxableInSlab;

            if (upperLimit === Infinity) {
                taxableInSlab = remainingIncome - previousLimit;
            } else {
                taxableInSlab = Math.min(remainingIncome, upperLimit) - previousLimit;
            }

            if (taxableInSlab > 0) {
                const taxInSlab = taxableInSlab * slab.rate;
                tax += taxInSlab;
                remainingIncome -= taxableInSlab;

                slabBreakdown.push({
                    range: `₹${previousLimit.toLocaleString('en-IN')} - ${slab.limit === Infinity ? 'Above' : slab.limit.toLocaleString('en-IN')} `,
                    rate: slab.rate * 100,
                    tax: taxInSlab
                });
            }
            previousLimit = upperLimit;
        }

        const taxBeforeCharges = tax;
        let surcharge = 0;
        if (income > 5000000 && income <= 10000000) surcharge = tax * 0.10;
        else if (income > 10000000 && income <= 20000000) surcharge = tax * 0.15;
        else if (income > 20000000 && income <= 50000000) surcharge = tax * 0.25;
        else if (income > 50000000) surcharge = tax * 0.37;

        tax += surcharge;
        const cess = tax * 0.04;
        const finalTax = tax + cess;

        return { taxBeforeCharges, surcharge, cess, finalTax, slabBreakdown };
    };

    const handleModeChange = (newMode) => {
        if (newMode === inputMode) return;

        const ctcVal = parseFloat(ctc) || 0;
        const newInputs = { ...inputs };

        if (newMode === 'amount') {
            // Convert % to Amount
            // Basic % -> Amount (of CTC)
            const basicAmt = (parseFloat(inputs.basic) / 100) * ctcVal;
            newInputs.basic = basicAmt.toFixed(0);

            // Dependent on Basic (% of Basic -> Amount)
            // HRA, PF, Gratuity, NPS
            ['hra', 'empPF', 'emplrPF', 'gratuity', 'nps'].forEach(key => {
                newInputs[key] = ((parseFloat(inputs[key]) / 100) * basicAmt).toFixed(0);
            });

            // Dependent on CTC (% of CTC -> Amount)
            // Other (Insurance and ProfTax are always Amount now)
            ['other', 'da'].forEach(key => {
                newInputs[key] = ((parseFloat(inputs[key]) / 100) * ctcVal).toFixed(0);
            });

        } else {
            // Convert Amount to %
            const basicAmt = parseFloat(inputs.basic) || 0;

            // Basic Amount -> % of CTC
            newInputs.basic = ctcVal > 0 ? parseFloat(((basicAmt / ctcVal) * 100).toFixed(2)).toString() : 0;

            // Dependent on Basic (Amount -> % of Basic)
            ['hra', 'empPF', 'emplrPF', 'gratuity', 'nps'].forEach(key => {
                const val = parseFloat(inputs[key]) || 0;
                newInputs[key] = basicAmt > 0 ? parseFloat(((val / basicAmt) * 100).toFixed(2)).toString() : 0;
            });

            // Dependent on CTC (Amount -> % of CTC)
            // Other (Insurance and ProfTax are always Amount now)
            ['other', 'da'].forEach(key => {
                const val = parseFloat(inputs[key]) || 0;
                newInputs[key] = ctcVal > 0 ? parseFloat(((val / ctcVal) * 100).toFixed(2)).toString() : 0;
            });
        }

        setInputs(newInputs);
        setInputMode(newMode);
    };

    const updateInput = (key, value) => {
        // Validation and Constraints
        // Handle empty input by setting it to "0"
        if (value === '') {
            setInputs(prev => ({ ...prev, [key]: "0" }));
            if (key === 'empPF') {
                setInputs(prev => ({ ...prev, [key]: "0", emplrPF: "0" }));
            }
            return;
        }

        let val = parseFloat(value);
        if (isNaN(val) || val < 0) val = 0; // No negatives

        // Prof Tax and Insurance are always Amount, so we don't apply % limits to them
        if (inputMode === 'percentage') {
            if (key !== 'profTax' && key !== 'insurance') {
                if (val > 100) val = 100; // Max 100%
            }
            if (key === 'gratuity' && val > 4.81) val = 4.81; // Max 4.81% for Gratuity
            if (key === 'nps' && val > 14) val = 14; // Max 14% for NPS
            if (key === 'other' && val > 20) val = 20; // Max 20% for Other Deductions
        }

        // Special handling for Employee PF to update Employer PF
        if (key === 'empPF') {
            setInputs(prev => ({ ...prev, [key]: value, emplrPF: value }));
        } else {
            setInputs(prev => ({ ...prev, [key]: value }));
        }
    };

    const [percentageError, setPercentageError] = useState(null);

    const calculateSalary = () => {
        const ctcValue = parseFloat(ctc) || 0;

        if (ctcValue <= 0) {
            setResults(null);
            setPercentageError(null);
            return;
        }

        // Percentage Validation
        if (inputMode === 'percentage') {
            const basicP = parseFloat(inputs.basic) || 0;
            const hraP = parseFloat(inputs.hra) || 0;
            const empPFP = parseFloat(inputs.empPF) || 0;
            const gratuityP = parseFloat(inputs.gratuity) || 0;

            const totalPercentage = basicP + hraP + empPFP + gratuityP;

            if (totalPercentage > 100) {
                setPercentageError(totalPercentage.toFixed(2));
                setResults(null); // Clear results or keep previous valid ones? User said "calculation should not be performed"
                return;
            } else {
                setPercentageError(null);
            }
        } else {
            setPercentageError(null);
        }

        let basic, hra, empPF, emplrPF, gratuity, insurance, other, nps, profTax, da;

        // Prof Tax and Insurance are always taken directly as amount
        profTax = parseFloat(inputs.profTax) || 0;
        insurance = parseFloat(inputs.insurance) || 0;

        if (inputMode === 'percentage') {
            basic = (parseFloat(inputs.basic) || 0) / 100 * ctcValue;

            // Components dependent on Basic
            hra = (parseFloat(inputs.hra) || 0) / 100 * basic;
            empPF = (parseFloat(inputs.empPF) || 0) / 100 * basic;
            emplrPF = includeEmployerPF ? ((parseFloat(inputs.emplrPF) || 0) / 100 * basic) : 0;
            gratuity = includeGratuity ? ((parseFloat(inputs.gratuity) || 0) / 100 * basic) : 0;

            // NPS Limit Check (Max 14% of Basic)
            let npsRaw = (parseFloat(inputs.nps) || 0) / 100 * basic;
            let npsLimit = basic * 0.14;
            nps = Math.min(npsRaw, npsLimit);

            // Components dependent on CTC
            // Insurance and ProfTax are handled as Amount above
            other = (parseFloat(inputs.other) || 0) / 100 * ctcValue;
            da = (parseFloat(inputs.da) || 0) / 100 * ctcValue;
        } else {
            basic = parseFloat(inputs.basic) || 0;
            hra = parseFloat(inputs.hra) || 0;
            empPF = parseFloat(inputs.empPF) || 0;
            emplrPF = includeEmployerPF ? (parseFloat(inputs.emplrPF) || 0) : 0;
            gratuity = includeGratuity ? (parseFloat(inputs.gratuity) || 0) : 0;
            // Insurance and ProfTax are handled as Amount above
            other = parseFloat(inputs.other) || 0;
            da = parseFloat(inputs.da) || 0;

            let npsRaw = parseFloat(inputs.nps) || 0;
            let npsLimit = basic * 0.14;
            nps = Math.min(npsRaw, npsLimit);
        }

        // Special Allowance = CTC - (Basic + HRA + Employer PF + Gratuity + Insurance + NPS + Other Deductions + DA)
        const employerComponents = basic + hra + emplrPF + gratuity + insurance + nps + other + da;
        const special = Math.max(0, ctcValue - employerComponents);

        const grossSalary = basic + hra + da + special;

        // Deductions
        const standardDeduction = 50000;

        let taxableIncome = grossSalary;
        let taxDetails = {};

        if (taxRegime === 'old') {
            const hraExemption = Math.min(hra, basic * 0.50, grossSalary - (basic + hra));
            const section80C = Math.min(empPF, 150000);
            const nps80CCD1B = Math.min(nps, 50000);
            const empNPS = nps;

            taxableIncome -= (standardDeduction + hraExemption + section80C + Math.min(empNPS, 50000) + profTax);
            taxDetails = calculateTax(Math.max(0, taxableIncome), oldTaxSlabs);

            if (taxableIncome <= 500000) taxDetails.finalTax = Math.max(0, taxDetails.finalTax - 12500);
        } else {
            taxableIncome -= standardDeduction;
            taxDetails = calculateTax(Math.max(0, taxableIncome), newTaxSlabs);

            if (taxableIncome <= 700000) taxDetails.finalTax = 0;
        }

        taxableIncome = Math.max(0, taxableIncome);
        const totalTax = taxDetails.finalTax;

        // Employee Deductions
        const empNPS = nps;
        const totalDeductions = empPF + empNPS + profTax + totalTax;

        const netInHandYearly = grossSalary - totalDeductions;
        const netInHandMonthly = netInHandYearly / 12;

        setResults({
            ctc: ctcValue,
            taxRegime,
            components: { basic, hra, special, da },
            grossSalary,
            employerPF: emplrPF,
            employerGratuity: gratuity,
            insuranceEmployer: insurance,
            otherEmployer: other,
            npsEmployer: nps,
            deductions: { employeePF: empPF, npsDeduction: empNPS, profTax, totalTax, total: totalDeductions },
            taxCalc: { taxableIncome, standardDeduction, ...taxDetails },
            netInHandYearly,
            netInHandMonthly
        });
    };

    useEffect(() => {
        calculateSalary();
    }, [ctc, taxRegime, inputMode, inputs, includeEmployerPF, includeGratuity]);

    const generateShareUrl = () => {
        const params = new URLSearchParams();
        params.set('tab', 'ctc-to-inhand');
        params.set('ctc', ctc);
        params.set('regime', taxRegime);
        params.set('mode', inputMode);
        params.set('incPF', includeEmployerPF);
        params.set('incGratuity', includeGratuity);

        Object.entries(inputs).forEach(([key, value]) => {
            params.set(key, value);
        });

        const url = new URL(window.location);
        url.search = params.toString();
        return url.toString();
    };

    return {
        ctc, setCtc,
        taxRegime, setTaxRegime,
        inputMode, handleModeChange,
        inputs, updateInput,
        includeEmployerPF, setIncludeEmployerPF,
        includeGratuity, setIncludeGratuity,
        results,
        generateShareUrl,
        percentageError
    };
};
