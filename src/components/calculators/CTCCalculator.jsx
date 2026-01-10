import React, { useState } from 'react';
import CTCInput from './CTCInput';
import { CTCResultSummary, CTCResultDetails } from './CTCResult';
import { useSalaryCalculation } from '../../hooks/useSalaryCalculation';
import Modal from '../shared/Modal';
import { f_simple } from '../../utils/formatters';
import { Download, Share2, FileSpreadsheet, FileText } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';
import ShareModal from '../shared/ShareModal';


const CTCCalculator = () => {
    const salaryData = useSalaryCalculation();
    const [isTaxModalOpen, setIsTaxModalOpen] = useState(false);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);

    const handleDownloadPDF = async () => {
        const element = document.getElementById('ctc-calculator-container');
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

            pdf.save('salary-breakdown-ctc-to-inhand.pdf');
        } catch (error) {
            console.error("Error generating PDF:", error);
        }
    };

    const handleDownloadExcel = () => {
        if (!salaryData.results) return;
        const { ctc, taxRegime, components, grossSalary, employerPF, employerGratuity, insuranceEmployer, npsEmployer, otherEmployer, deductions, netInHandYearly, netInHandMonthly } = salaryData.results;

        const totalTaxPaid = deductions.profTax + deductions.totalTax;
        const totalInvestmentValue = (deductions.npsDeduction || 0) + (npsEmployer || 0) + (deductions.employeePF || 0) + (employerPF || 0) + (employerGratuity || 0);

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
        <div className="max-w-5xl mx-auto mb-3">
            {/* Main Container Card */}
            <div id="ctc-calculator-container" className="bg-white/60 dark:bg-gray-900/40 backdrop-blur-xl border border-white/50 dark:border-gray-800 rounded-3xl p-4 sm:p-6 lg:p-10 shadow-[0_8px_25px_rgba(0,0,0,0.06)]">

                {/* Header Section */}
                <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-teal-700 via-teal-600 to-blue-600 bg-clip-text text-transparent dark:from-teal-200 dark:via-cyan-200 dark:to-blue-200 mb-2">CTC To In-hand Calculator</h1>
                        <p className="text-gray-600 dark:text-gray-400 max-w-3xl">
                            Enter your CTC and components to see gross, deductions and net in-hand salary.
                        </p>
                    </div>
                    {salaryData.results && (
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

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <CTCInput {...salaryData} />
                    <CTCResultSummary results={salaryData.results} />
                    <div className="lg:col-span-2">
                        <CTCResultDetails results={salaryData.results} onShowTaxDetails={() => setIsTaxModalOpen(true)} generateShareUrl={salaryData.generateShareUrl} />
                    </div>
                </div>
            </div>

            <Modal isOpen={isTaxModalOpen} onClose={() => setIsTaxModalOpen(false)} title={`Detailed Tax Calculation (${salaryData.taxRegime} Regime)`}>
                {salaryData.results && (
                    <div className="space-y-4">
                        <div>
                            <h3 className="font-medium mb-2 text-gray-900 dark:text-gray-100">Income Tax Slabs</h3>
                            <div className="text-sm space-y-2">
                                {salaryData.results.taxCalc.slabBreakdown.map((slab, index) => (
                                    <div key={index} className="flex justify-between items-center">
                                        <span className="text-gray-600 dark:text-gray-400">{slab.range}</span>
                                        <span className="text-sm bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full text-gray-700 dark:text-gray-300">@ {slab.rate}%</span>
                                        <span className="font-medium text-gray-800 dark:text-gray-200">{f_simple(slab.tax)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div>
                            <h3 className="font-medium mb-2 text-gray-900 dark:text-gray-100">Additional Charges</h3>
                            <div className="text-sm space-y-2">
                                <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Tax before Surcharge/Cess</span><span className="text-gray-900 dark:text-gray-100">{f_simple(salaryData.results.taxCalc.taxBeforeCharges)}</span></div>
                                <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Surcharge</span><span className="text-gray-900 dark:text-gray-100">{f_simple(salaryData.results.taxCalc.surcharge)}</span></div>
                                <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Health & Education Cess (4%)</span><span className="text-gray-900 dark:text-gray-100">{f_simple(salaryData.results.taxCalc.cess)}</span></div>
                            </div>
                        </div>
                        <div className="pt-4 border-t border-gray-200 dark:border-gray-600">
                            <div className="flex justify-between font-semibold text-gray-900 dark:text-gray-100">
                                <span>Total Tax Liability</span>
                                <span>{f_simple(salaryData.results.taxCalc.finalTax)}</span>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>

            <ShareModal
                isOpen={isShareModalOpen}
                onClose={() => setIsShareModalOpen(false)}
                shareUrl={salaryData.generateShareUrl ? salaryData.generateShareUrl() : window.location.href}
            />
        </div>
    );
};

export default CTCCalculator;
