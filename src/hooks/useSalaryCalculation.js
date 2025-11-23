import { useState, useEffect } from 'react';

export const useSalaryCalculation = () => {
    const [ctc, setCtc] = useState(1000000);
    const [taxRegime, setTaxRegime] = useState('new');
    const [inputMode, setInputMode] = useState('percentage'); // 'percentage' | 'amount'
    const [includeEmployerPF, setIncludeEmployerPF] = useState(true);

    // Store current input values. Interpretation depends on inputMode.
    // In 'percentage' mode:
    // - basic: % of CTC
    // - hra, empPF, emplrPF, gratuity, nps: % of Basic
    // - insurance, other: % of CTC
    // - profTax: Always Amount (₹)
    const [inputs, setInputs] = useState({
        basic: 40,
        hra: 40,
        empPF: 12,
        emplrPF: 12,
        gratuity: 4.81,
        insurance: 0,
        other: 0,
        nps: 0,
        profTax: 2400
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
            // Insurance, Other
            ['insurance', 'other'].forEach(key => {
                newInputs[key] = ((parseFloat(inputs[key]) / 100) * ctcVal).toFixed(0);
            });

        } else {
            // Convert Amount to %
            const basicAmt = parseFloat(inputs.basic) || 0;

            // Basic Amount -> % of CTC
            newInputs.basic = ctcVal > 0 ? ((basicAmt / ctcVal) * 100).toFixed(2) : 0;

            // Dependent on Basic (Amount -> % of Basic)
            ['hra', 'empPF', 'emplrPF', 'gratuity', 'nps'].forEach(key => {
                const val = parseFloat(inputs[key]) || 0;
                newInputs[key] = basicAmt > 0 ? ((val / basicAmt) * 100).toFixed(2) : 0;
            });

            // Dependent on CTC (Amount -> % of CTC)
            ['insurance', 'other'].forEach(key => {
                const val = parseFloat(inputs[key]) || 0;
                newInputs[key] = ctcVal > 0 ? ((val / ctcVal) * 100).toFixed(2) : 0;
            });
        }

        setInputs(newInputs);
        setInputMode(newMode);
    };

    const updateInput = (key, value) => {
        // Validation and Constraints
        let val = parseFloat(value);
        if (isNaN(val) || val < 0) val = 0; // No negatives

        if (inputMode === 'percentage') {
            if (val > 100) val = 100; // Max 100%
            if (key === 'gratuity' && val > 4.81) val = 4.81; // Max 4.81% for Gratuity
            if (key === 'nps' && val > 14) val = 14; // Max 14% for NPS
        }

        // Special handling for Employee PF to update Employer PF
        if (key === 'empPF') {
            setInputs(prev => ({ ...prev, [key]: value, emplrPF: value }));
        } else {
            setInputs(prev => ({ ...prev, [key]: value }));
        }
    };

    const calculateSalary = () => {
        const ctcValue = parseFloat(ctc) || 0;

        let basic, hra, empPF, emplrPF, gratuity, insurance, other, nps;

        if (inputMode === 'percentage') {
            basic = (parseFloat(inputs.basic) / 100) * ctcValue;

            // Components dependent on Basic
            hra = (parseFloat(inputs.hra) / 100) * basic;
            empPF = (parseFloat(inputs.empPF) / 100) * basic;
            emplrPF = includeEmployerPF ? (parseFloat(inputs.emplrPF) / 100) * basic : 0;
            gratuity = (parseFloat(inputs.gratuity) / 100) * basic;

            // NPS Limit Check (Max 14% of Basic)
            let npsRaw = (parseFloat(inputs.nps) / 100) * basic;
            let npsLimit = basic * 0.14;
            nps = Math.min(npsRaw, npsLimit);

            // Components dependent on CTC
            insurance = (parseFloat(inputs.insurance) / 100) * ctcValue;
            other = (parseFloat(inputs.other) / 100) * ctcValue;
        } else {
            basic = parseFloat(inputs.basic) || 0;
            hra = parseFloat(inputs.hra) || 0;
            empPF = parseFloat(inputs.empPF) || 0;
            emplrPF = includeEmployerPF ? (parseFloat(inputs.emplrPF) || 0) : 0;
            gratuity = parseFloat(inputs.gratuity) || 0;
            insurance = parseFloat(inputs.insurance) || 0;
            other = parseFloat(inputs.other) || 0;

            let npsRaw = parseFloat(inputs.nps) || 0;
            let npsLimit = basic * 0.14;
            nps = Math.min(npsRaw, npsLimit);
        }

        // Special Allowance = CTC - (Basic + HRA + Employer PF + Gratuity + Insurance + NPS + Other Deductions)
        const employerComponents = basic + hra + emplrPF + gratuity + insurance + nps + other;
        const special = Math.max(0, ctcValue - employerComponents);

        const grossSalary = basic + hra + special;

        // Deductions
        let profTax = parseFloat(inputs.profTax) || 0;
        const standardDeduction = 50000;

        let taxableIncome = grossSalary;
        let taxDetails = {};

        if (taxRegime === 'old') {
            const hraExemption = Math.min(hra, basic * 0.50, grossSalary - (basic + hra));
            const section80C = Math.min(empPF, 150000);
            const nps80CCD1B = Math.min(nps, 50000);
            const empNPS = nps;

            taxableIncome -= (standardDeduction + hraExemption + section80C + Math.min(empNPS, 50000));
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
            components: { basic, hra, special },
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
    }, [ctc, taxRegime, inputMode, inputs, includeEmployerPF]);

    return {
        ctc, setCtc,
        taxRegime, setTaxRegime,
        inputMode, handleModeChange,
        inputs, updateInput,
        includeEmployerPF, setIncludeEmployerPF,
        results
    };
};

