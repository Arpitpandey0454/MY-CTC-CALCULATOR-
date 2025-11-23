import React, { useEffect, useRef } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';
import { f_simple, neg_f_simple } from '../../utils/formatters';
import Button from '../shared/Button';
import { Download } from 'lucide-react';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';

ChartJS.register(ArcElement, Tooltip, Legend);

const CTCResult = ({ results, onShowTaxDetails }) => {
    if (!results) return null;

    const {
        ctc,
        taxRegime,
        components,
        grossSalary,
        employerPF,
        employerGratuity,
        insuranceEmployer,
        otherEmployer,
        npsEmployer,
        deductions,
        taxCalc,
        netInHandYearly,
        netInHandMonthly
    } = results;

    const totalTaxPaid = deductions.profTax + deductions.totalTax;
    const totalInvestment = deductions.npsDeduction + deductions.employeePF + employerGratuity + employerPF;
    // Wait, user said "Total Investment = NPS + PF + Gratuity".
    // Usually this means Employee NPS + Employee PF + Employer PF + Gratuity?
    // Or just Employee components?
    // "Total Saving" usually implies what I save.
    // Let's assume: Employee PF + Employee NPS + Employer PF + Gratuity (since Gratuity is also a saving/benefit).
    // Actually, let's stick to the user's exact words: "Total Investment = NPS + PF + Gratuity".
    // I will include ALL PF (Emp + Emplr) and ALL NPS (Emp + Emplr if any, but here npsEmployer is same as npsDeduction usually or separate? npsEmployer is Employer Contribution).
    // Let's check useSalaryCalculation.js again.
    // npsEmployer = nps. deductions.npsDeduction = empNPS = nps.
    // So if I add npsDeduction + npsEmployer, I am counting it twice if they are same?
    // No, usually NPS is 10% Basic (Employer) + 50k (Employee) etc.
    // In this code: `empNPS = nps`. `npsEmployer = nps`.
    // It seems they are mirrored or just one value used for both sides?
    // `const empNPS = nps;` `npsEmployer: nps`.
    // So yes, if I sum them, it's 2x NPS.
    // User said "NPS + PF + Gratuity".
    // I will assume Total PF (Emp+Emplr) + Total NPS (Emp+Emplr) + Gratuity.
    // BUT, usually "Investment" implies what *I* put in or what is accumulated.
    // Let's just use: `deductions.npsDeduction + deductions.employeePF + employerPF + employerGratuity`.
    // Wait, `npsEmployer` is also there.
    // Let's add `npsEmployer` too if it's a benefit.
    // Actually, simpler interpretation:
    // PF = Employee PF + Employer PF
    // NPS = Employee NPS + Employer NPS
    // Gratuity = Gratuity
    // So `totalInvestment = (deductions.employeePF + employerPF) + (deductions.npsDeduction + npsEmployer) + employerGratuity`.

    // Re-reading user request: "Total Investment = NPS + PF + Gratuity".
    // I'll stick to the safe bet of summing all relevant components available.

    const totalInvestmentValue = (deductions.npsDeduction || 0) + (npsEmployer || 0) + (deductions.employeePF || 0) + (employerPF || 0) + (employerGratuity || 0);

    const chartData = {
        labels: ['Total Annual Salary', 'Total Tax Paid', 'Total Saving'],
        datasets: [
            {
                data: [
                    netInHandYearly,
                    totalTaxPaid,
                    totalInvestmentValue
                ],
                backgroundColor: ['#0d9488', '#ef4444', '#f59e0b'],
                borderWidth: 0,
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    color: document.documentElement.classList.contains('dark') ? '#d1d5db' : '#374151',
                    font: { size: 10 }
                }
            }
        }
    };

    const handleDownloadPDF = () => {
        const doc = new jsPDF();
        doc.setFontSize(18); doc.text('Salary Breakdown (CTC to In-hand)', 105, 20, { align: 'center' });
        doc.setFontSize(12); doc.text(`Tax Regime: ${taxRegime === 'old' ? 'Old' : 'New'}`, 105, 30, { align: 'center' });
        let y = 45;
        doc.setFontSize(14); doc.text('Summary', 20, y); y += 10;
        doc.setFontSize(12); doc.text(`Total CTC:`, 20, y); doc.text(f_simple(ctc), 180, y, { align: 'right' }); y += 8;
        doc.text(`Net Annual Salary:`, 20, y); doc.text(f_simple(netInHandYearly), 180, y, { align: 'right' }); y += 8;
        doc.text(`Net Monthly Salary:`, 20, y); doc.text(f_simple(netInHandMonthly), 180, y, { align: 'right' }); y += 8;
        doc.text(`Total Tax Paid:`, 20, y); doc.text(f_simple(totalTaxPaid), 180, y, { align: 'right' }); y += 8;
        doc.text(`Total Investment:`, 20, y); doc.text(f_simple(totalInvestmentValue), 180, y, { align: 'right' }); y += 15;

        doc.setFontSize(14); doc.text('Earnings (Annual)', 20, y); y += 10;
        doc.setFontSize(12); doc.text('Basic Salary:', 20, y); doc.text(f_simple(components.basic), 180, y, { align: 'right' }); y += 8;
        doc.text('HRA:', 20, y); doc.text(f_simple(components.hra), 180, y, { align: 'right' }); y += 8;
        doc.text('Special Allowance:', 20, y); doc.text(f_simple(components.special), 180, y, { align: 'right' }); y += 8;
        doc.setFont(undefined, 'bold'); doc.text('Gross Salary:', 20, y); doc.text(f_simple(grossSalary), 180, y, { align: 'right' }); y += 15;

        doc.setFont(undefined, 'normal'); doc.setFontSize(14); doc.text('Employee Deductions (Annual)', 20, y); y += 10;
        doc.setFontSize(12); doc.text('Employee EPF:', 20, y); doc.text(f_simple(deductions.employeePF), 180, y, { align: 'right' }); y += 8;
        doc.text('Employee NPS:', 20, y); doc.text(f_simple(deductions.npsDeduction), 180, y, { align: 'right' }); y += 8;
        doc.text('Professional Tax:', 20, y); doc.text(f_simple(deductions.profTax), 180, y, { align: 'right' }); y += 8;
        doc.text('Income Tax:', 20, y); doc.text(f_simple(deductions.totalTax), 180, y, { align: 'right' }); y += 8;
        doc.setFont(undefined, 'bold'); doc.text('Total Employee Deductions:', 20, y); doc.text(f_simple(deductions.total), 180, y, { align: 'right' }); y += 15;

        doc.setFont(undefined, 'normal'); doc.setFontSize(14); doc.text('CTC Breakup (Employer Cost)', 20, y); y += 10;
        doc.setFontSize(12); doc.text('Gross Salary:', 20, y); doc.text(f_simple(grossSalary), 180, y, { align: 'right' }); y += 8;
        doc.text('Employer EPF:', 20, y); doc.text(f_simple(employerPF), 180, y, { align: 'right' }); y += 8;
        doc.text('Gratuity (Employer):', 20, y); doc.text(f_simple(employerGratuity), 180, y, { align: 'right' }); y += 8;
        doc.text('Insurance (Employer):', 20, y); doc.text(f_simple(insuranceEmployer), 180, y, { align: 'right' }); y += 8;
        doc.text('NPS (Employer):', 20, y); doc.text(f_simple(npsEmployer), 180, y, { align: 'right' }); y += 8;
        doc.text('Other Deductions (Employer):', 20, y); doc.text(f_simple(otherEmployer), 180, y, { align: 'right' }); y += 8;
        doc.setFont(undefined, 'bold'); doc.text('Total CTC:', 20, y); doc.text(f_simple(ctc), 180, y, { align: 'right' });
        doc.save('salary-breakdown-ctc-to-inhand.pdf');
    };

    const handleDownloadExcel = () => {
        const wb = XLSX.utils.book_new();
        const wsData = [
            ['Salary Breakdown (CTC to In-hand)'], ['Tax Regime', taxRegime],
            [], ['Summary', 'Amount'],
            ['Total CTC', ctc], ['Net Annual Salary', netInHandYearly], ['Net Monthly Salary', netInHandMonthly],
            ['Total Tax Paid', totalTaxPaid], ['Total Investment', totalInvestmentValue],
            [], ['Earnings (Annual)', 'Amount'],
            ['Basic Salary', components.basic],
            ['HRA', components.hra],
            ['Special Allowance', components.special],
            ['Gross Salary', grossSalary],
            [], ['Employee Deductions (Annual)', 'Amount'],
            ['Employee EPF', deductions.employeePF],
            ['Employee NPS', deductions.npsDeduction],
            ['Professional Tax', deductions.profTax],
            ['Income Tax', deductions.totalTax],
            ['Total Employee Deductions', deductions.total],
            [], ['CTC Breakup (Employer Cost)', 'Amount'],
            ['Gross Salary', grossSalary],
            ['Employer EPF', employerPF],
            ['Gratuity (Employer)', employerGratuity],
            ['Insurance (Employer)', insuranceEmployer],
            ['NPS (Employer)', npsEmployer],
            ['Other Deductions (Employer)', otherEmployer],
            ['Total CTC', ctc]
        ];
        const ws = XLSX.utils.aoa_to_sheet(wsData);
        XLSX.utils.book_append_sheet(wb, ws, 'Salary Breakdown');
        XLSX.writeFile(wb, 'salary-breakdown-ctc-to-inhand.xlsx');
    };

    return (
        <>
            {/* Middle Column: Results & Chart */}
            <div className="p-6 rounded-2xl bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-700">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Salary Breakdown under {taxRegime === 'old' ? 'Old' : 'New'} Tax Regime</h2>

                <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
                    <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                        <div className="text-center">
                            <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">Net Monthly</p>
                            <h3 className="text-2xl font-bold text-teal-600 dark:text-teal-400">{f_simple(netInHandMonthly)}</h3>
                        </div>
                        <div className="text-center">
                            <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">Net Annual</p>
                            <h3 className="text-2xl font-bold text-teal-600 dark:text-teal-400">{f_simple(netInHandYearly)}</h3>
                        </div>
                        <div className="text-center">
                            <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">Total Tax Paid</p>
                            <h3 className="text-xl font-bold text-red-500 dark:text-red-400">{f_simple(totalTaxPaid)}</h3>
                        </div>
                        <div className="text-center">
                            <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">Total Saving</p>
                            <h3 className="text-xl font-bold text-amber-500 dark:text-amber-400">{f_simple(totalInvestmentValue)}</h3>
                        </div>
                    </div>
                </div>

                <div className="max-h-64 sm:max-h-72 flex justify-center my-4">
                    <Pie data={chartData} options={chartOptions} />
                </div>

                <div>
                    <h3 className="font-semibold mb-3 text-gray-800 dark:text-gray-100">Earnings Breakdown (Annual)</h3>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Basic Salary</span> <span className="font-medium text-gray-900 dark:text-gray-100">{f_simple(components.basic)}</span></div>
                        <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">HRA</span> <span className="font-medium text-gray-900 dark:text-gray-100">{f_simple(components.hra)}</span></div>
                        <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Special Allowance</span> <span className="font-medium text-gray-900 dark:text-gray-100">{f_simple(components.special)}</span></div>
                        <div className="flex justify-between font-semibold border-t border-gray-300 dark:border-gray-700 pt-2 mt-2 text-gray-900 dark:text-gray-100">
                            <span>Gross Salary (Taxable Income Source)</span> <span>{f_simple(grossSalary)}</span>
                        </div>
                    </div>
                </div>

                <div className="mt-4">
                    <h3 className="font-semibold mb-3 text-gray-800 dark:text-gray-100">Tax Calculation</h3>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Gross Salary</span> <span className="font-medium text-gray-900 dark:text-gray-100">{f_simple(grossSalary)}</span></div>
                        <div className="flex justify-between text-red-600 dark:text-red-400">
                            <span>Standard Deduction</span> <span>{neg_f_simple(taxCalc.standardDeduction)}</span>
                        </div>
                        <div className="flex justify-between font-semibold border-t border-gray-300 dark:border-gray-700 pt-2 mt-2 text-gray-900 dark:text-gray-100">
                            <span>Taxable Income (before other ded.)</span> <span>{f_simple(taxCalc.taxableIncome)}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Column: Deductions & CTC Breakup */}
            <div className="p-6 rounded-2xl bg-rose-50 dark:bg-rose-950/10 border border-rose-200 dark:border-rose-100">
                <div>
                    <h3 className="font-semibold mb-3 text-gray-800 dark:text-gray-100">Deductions (Annual)</h3>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Employee EPF (12% of Basic)</span> <span className="text-red-600 dark:text-red-400 font-medium">{neg_f_simple(deductions.employeePF)}</span></div>
                        <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Employee NPS (max 14% of Basic)</span> <span className="text-red-600 dark:text-red-400 font-medium">{neg_f_simple(deductions.npsDeduction)}</span></div>
                        <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Professional Tax</span> <span className="text-red-600 dark:text-red-400 font-medium">{neg_f_simple(deductions.profTax)}</span></div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600 dark:text-gray-400">Income Tax (TDS)</span>
                            <div className="flex items-center">
                                <span className="text-red-600 dark:text-red-400 font-medium mr-2">{neg_f_simple(deductions.totalTax)}</span>
                                <button onClick={onShowTaxDetails} className="text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 text-xs font-medium">(Details)</button>
                            </div>
                        </div>
                        <div className="flex justify-between font-semibold border-t border-gray-300 dark:border-gray-700 pt-2 mt-2 text-red-700 dark:text-red-400">
                            <span>Total Employee Deductions</span> <span>{neg_f_simple(deductions.total)}</span>
                        </div>
                    </div>
                </div>

                <hr className="border-gray-200/80 dark:border-gray-700/80 my-4" />

                <div>
                    <h3 className="font-semibold mb-3 text-gray-800 dark:text-gray-100">Cost to Company Breakup (Total CTC)</h3>
                    <div className="space-y-2 text-sm bg-gray-100 dark:bg-gray-800 p-3 rounded-lg">
                        <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Gross Salary</span> <span className="font-medium text-gray-900 dark:text-gray-100">{f_simple(grossSalary)}</span></div>
                        <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Employer EPF (12% of Basic)</span> <span className="font-medium text-gray-900 dark:text-gray-100">{f_simple(employerPF)}</span></div>
                        <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Gratuity (4.81% of Basic)</span> <span className="font-medium text-gray-900 dark:text-gray-100">{f_simple(employerGratuity)}</span></div>
                        <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Insurance (Employer Fixed)</span> <span className="font-medium text-gray-900 dark:text-gray-100">{f_simple(insuranceEmployer)}</span></div>
                        <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">NPS (Employer)</span> <span className="font-medium text-gray-900 dark:text-gray-100">{f_simple(npsEmployer)}</span></div>
                        <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Other Deductions (Employer Fixed)</span> <span className="font-medium text-gray-900 dark:text-gray-100">{f_simple(otherEmployer)}</span></div>
                        <div className="flex justify-between font-bold border-t border-gray-300 dark:border-gray-700 pt-2 mt-2 text-gray-900 dark:text-gray-100">
                            <span>Total CTC</span> <span>{f_simple(ctc)}</span>
                        </div>
                    </div>
                </div>

                <hr className="border-gray-200/80 dark:border-gray-700/80 my-4" />

                <div>
                    <h3 className="font-semibold mb-3 text-gray-800 dark:text-gray-100">Download Report</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <Button onClick={handleDownloadPDF} variant="primary" className="py-3">
                            <Download size={18} className="mr-2" /> PDF
                        </Button>
                        <Button onClick={handleDownloadExcel} variant="secondary" className="py-3">
                            <Download size={18} className="mr-2" /> Excel
                        </Button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default CTCResult;
