import React from 'react';

const Footer = ({ setActiveTab }) => {
    return (
        <footer className="relative py-16 px-4 sm:px-6 lg:px-8 mt-20 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950 border-t border-gray-200 dark:border-gray-800">
            <div className="max-w-5xl mx-auto px-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                    <div className="col-span-2 md:col-span-1">
                        <h4 className="font-semibold mb-4 text-lg text-gray-900 dark:text-gray-100">Calculators</h4>
                        <ul className="space-y-3">
                            {[
                                { id: 'ctc-to-inhand', label: 'CTC → In-hand' },
                                { id: 'inhand-to-ctc', label: 'In-hand → CTC' },
                                { id: 'compare', label: 'Compare Offers' },
                                { id: 'tax', label: 'Tax Calculator' },
                                { id: 'hike', label: 'Hike Calculator' },
                                { id: 'additional', label: 'Additional Calculator' },
                            ].map(item => (
                                <li key={item.id}>
                                    <button
                                        onClick={() => {
                                            setActiveTab(item.id);
                                            window.scrollTo({ top: 0, behavior: 'smooth' });
                                        }}
                                        className="text-sm text-gray-600 dark:text-gray-400 hover:text-teal-600 dark:hover:text-teal-400 transition-colors text-left relative w-fit after:content-[''] after:absolute after:w-0 after:h-[1.5px] after:bottom-0 after:left-0 after:bg-teal-600 dark:after:bg-teal-400 after:transition-all after:duration-300 hover:after:w-full"
                                    >
                                        {item.label}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="col-span-2 md:col-span-2 grid grid-cols-2 gap-8">
                        <div>
                            <h4 className="font-semibold mb-4 text-lg text-gray-900 dark:text-gray-100">Resources</h4>
                            <ul className="space-y-3">
                                <li><a href="#" className="text-sm text-gray-600 dark:text-gray-400 hover:text-teal-600 dark:hover:text-teal-400 transition-colors relative w-fit block after:content-[''] after:absolute after:w-0 after:h-[1.5px] after:bottom-0 after:left-0 after:bg-teal-600 dark:after:bg-teal-400 after:transition-all after:duration-300 hover:after:w-full">About Us</a></li>
                                <li><a href="#" className="text-sm text-gray-600 dark:text-gray-400 hover:text-teal-600 dark:hover:text-teal-400 transition-colors relative w-fit block after:content-[''] after:absolute after:w-0 after:h-[1.5px] after:bottom-0 after:left-0 after:bg-teal-600 dark:after:bg-teal-400 after:transition-all after:duration-300 hover:after:w-full">Blog</a></li>
                                <li><a href="#" className="text-sm text-gray-600 dark:text-gray-400 hover:text-teal-600 dark:hover:text-teal-400 transition-colors relative w-fit block after:content-[''] after:absolute after:w-0 after:h-[1.5px] after:bottom-0 after:left-0 after:bg-teal-600 dark:after:bg-teal-400 after:transition-all after:duration-300 hover:after:w-full">Contact</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-semibold mb-4 text-lg text-gray-900 dark:text-gray-100">Legal</h4>
                            <ul className="space-y-3">
                                <li><a href="#" className="text-sm text-gray-600 dark:text-gray-400 hover:text-teal-600 dark:hover:text-teal-400 transition-colors relative w-fit block after:content-[''] after:absolute after:w-0 after:h-[1.5px] after:bottom-0 after:left-0 after:bg-teal-600 dark:after:bg-teal-400 after:transition-all after:duration-300 hover:after:w-full">Privacy Policy</a></li>
                                <li><a href="#" className="text-sm text-gray-600 dark:text-gray-400 hover:text-teal-600 dark:hover:text-teal-400 transition-colors relative w-fit block after:content-[''] after:absolute after:w-0 after:h-[1.5px] after:bottom-0 after:left-0 after:bg-teal-600 dark:after:bg-teal-400 after:transition-all after:duration-300 hover:after:w-full">Terms of Service</a></li>
                            </ul>
                        </div>
                    </div>

                    <div className="col-span-2 md:col-span-1">
                        <h4 className="font-semibold mb-4 text-lg text-gray-900 dark:text-gray-100">Follow Us</h4>
                        <ul className="space-y-3">
                            <li><a href="#" className="text-sm text-gray-600 dark:text-gray-400 hover:text-teal-600 dark:hover:text-teal-400 transition-colors relative w-fit block after:content-[''] after:absolute after:w-0 after:h-[1.5px] after:bottom-0 after:left-0 after:bg-teal-600 dark:after:bg-teal-400 after:transition-all after:duration-300 hover:after:w-full">Twitter</a></li>
                            <li><a href="#" className="text-sm text-gray-600 dark:text-gray-400 hover:text-teal-600 dark:hover:text-teal-400 transition-colors relative w-fit block after:content-[''] after:absolute after:w-0 after:h-[1.5px] after:bottom-0 after:left-0 after:bg-teal-600 dark:after:bg-teal-400 after:transition-all after:duration-300 hover:after:w-full">LinkedIn</a></li>
                            <li><a href="#" className="text-sm text-gray-600 dark:text-gray-400 hover:text-teal-600 dark:hover:text-teal-400 transition-colors relative w-fit block after:content-[''] after:absolute after:w-0 after:h-[1.5px] after:bottom-0 after:left-0 after:bg-teal-600 dark:after:bg-teal-400 after:transition-all after:duration-300 hover:after:w-full">GitHub</a></li>
                        </ul>
                    </div>
                </div>

                <div className="mt-12 pt-8 text-center border-t border-gray-200 dark:border-gray-800">
                    <p className="text-sm text-gray-500 dark:text-gray-500">&copy; 2025 CTC Calculator. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
