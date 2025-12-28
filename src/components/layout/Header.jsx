import React, { useState, useEffect } from 'react';
import { Moon, Sun, Menu, X, ChevronDown } from 'lucide-react';
import logo from '../../assets/logo.png';

const Header = ({ activeTab, setActiveTab, additionalTab, setAdditionalTab }) => {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isDark, setIsDark] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);

        // Check system preference or local storage
        if (localStorage.getItem('theme') === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            setIsDark(true);
            document.documentElement.classList.add('dark');
        }

        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const toggleTheme = () => {
        if (isDark) {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
            setIsDark(false);
        } else {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
            setIsDark(true);
        }
    };

    const tabs = [
        { id: 'ctc-to-inhand', label: 'CTC To In-hand' },
        { id: 'inhand-to-ctc', label: 'In-hand To CTC' },
        { id: 'compare', label: 'Compare Offers' },
        { id: 'tax', label: 'Tax Calculator' },
        { id: 'hike', label: 'Hike Calculator' },
        { id: 'additional', label: 'Additional Calculators' },
    ];

    const additionalTabs = [
        { id: 'pf', label: 'PF Calculator' },
        { id: 'hra', label: 'HRA Exemption' },
        { id: 'gratuity', label: 'Gratuity' },
        { id: 'bonus', label: 'Bonus' },
        { id: 'lta', label: 'LTA Calculator' },
        { id: 'col', label: 'Cost of Living' },
    ];

    return (
        <header
            className={`fixed w-full top-0 z-50 transition-all duration-300 ${isScrolled
                ? 'bg-gradient-to-r from-teal-50/90 to-blue-50/90 dark:from-slate-900/95 dark:to-slate-800/95 backdrop-blur-xl shadow-lg border-b border-teal-500/10 py-2'
                : 'bg-gradient-to-r from-teal-50/80 to-blue-50/80 dark:from-slate-900/90 dark:to-slate-800/90 backdrop-blur-md border-b border-gray-200/80 dark:border-white/10 lg:rounded-bl-[30px] lg:rounded-br-[30px] py-3'
                }`}
        >
            <div className="max-w-[95%] mx-auto flex justify-between items-center px-4 sm:px-6">

                <button onClick={() => setActiveTab('ctc-to-inhand')} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                    {/* Placeholder for Logo if missing */}
                    <div className="h-[50px] w-[50px] rounded-xl flex items-center justify-center text-white font-bold text-xl ">
                        <img src={logo} alt="Logo" className="h-full w-full object-contain" />
                    </div>

                    <span className="text-2xl font-extrabold uppercase tracking-wider bg-gradient-to-r from-teal-500 via-blue-500 to-indigo-600 bg-clip-text text-transparent leading-none text-left">
                        MY CTC <br className="hidden sm:inline" /> CALCULATOR
                    </span>
                </button>

                <div className="flex items-center space-x-2">
                    <div className="hidden sm:flex items-center space-x-2 text-sm">
                        <a href="#about-section" className="px-3 py-1 rounded-lg text-sm text-gray-600 dark:text-gray-400 hover:text-teal-600 dark:hover:text-teal-400 transition-colors relative w-fit block after:content-[''] after:absolute after:w-0 after:h-[1.5px] after:bottom-0 after:left-0 after:bg-teal-600 dark:after:bg-teal-400 after:transition-all after:duration-300 hover:after:w-full">About</a>
                        <a href="#faq-section" className="px-3 py-1 rounded-lg text-sm text-gray-600 dark:text-gray-400 hover:text-teal-600 dark:hover:text-teal-400 transition-colors relative w-fit block after:content-[''] after:absolute after:w-0 after:h-[1.5px] after:bottom-0 after:left-0 after:bg-teal-600 dark:after:bg-teal-400 after:transition-all after:duration-300 hover:after:w-full">FAQs</a>
                        <a href="#blog-section" className="px-3 py-1 rounded-lg text-sm text-gray-600 dark:text-gray-400 hover:text-teal-600 dark:hover:text-teal-400 transition-colors relative w-fit block after:content-[''] after:absolute after:w-0 after:h-[1.5px] after:bottom-0 after:left-0 after:bg-teal-600 dark:after:bg-teal-400 after:transition-all after:duration-300 hover:after:w-full">Blog</a>
                    </div>

                    <button
                        onClick={toggleTheme}
                        className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-white/10 transition-colors text-gray-700 dark:text-gray-300"
                    >
                        {isDark ? <Sun size={24} /> : <Moon size={24} />}
                    </button>

                    <button
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className="sm:hidden p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-white/10 transition-colors text-gray-700 dark:text-gray-300"
                    >
                        {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>
            </div>

            {/* Desktop Nav */}
            <nav className="hidden sm:block w-full mt-2">
                <div className="flex justify-center space-x-1 max-w-5xl mx-auto">
                    {tabs.map(tab => {
                        if (tab.id === 'additional') {
                            return (
                                <div key={tab.id} className="relative group">
                                    <button
                                        onClick={() => {
                                            setActiveTab(tab.id);
                                            if (additionalTabs.length > 0) setAdditionalTab(additionalTabs[0].id);
                                        }}
                                        className={`relative px-4 py-2 text-sm font-medium transition-all duration-300 rounded-lg flex items-center gap-1 ${activeTab === tab.id
                                            ? 'text-teal-700 dark:text-teal-300 bg-teal-100 dark:bg-teal-900/50'
                                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                                            }`}
                                    >
                                        {tab.label}
                                        <ChevronDown size={14} className={`transition-transform duration-200 ${activeTab === tab.id ? 'rotate-180' : ''} group-hover:rotate-180`} />
                                        {activeTab === tab.id && (
                                            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-teal-400 to-blue-500 rounded-full" />
                                        )}
                                    </button>

                                    {/* Dropdown Menu */}
                                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 ease-in-out z-[100]">
                                        <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl overflow-hidden min-w-[200px] p-1">
                                            {additionalTabs.map(subTab => (
                                                <button
                                                    key={subTab.id}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setActiveTab('additional');
                                                        setAdditionalTab(subTab.id);
                                                    }}
                                                    className={`w-full text-left px-4 py-2 text-sm rounded-lg transition-colors ${activeTab === 'additional' && additionalTab === subTab.id
                                                        ? 'bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 font-medium'
                                                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100/80 dark:hover:bg-gray-800/80'
                                                        }`}
                                                >
                                                    {subTab.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            );
                        }

                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`relative px-4 py-2 text-sm font-medium transition-all duration-300 rounded-lg ${activeTab === tab.id
                                    ? 'text-teal-700 dark:text-teal-300 bg-teal-100 dark:bg-teal-900/50'
                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                                    }`}
                            >
                                {tab.label}
                                {activeTab === tab.id && (
                                    <span className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-teal-400 to-blue-500 rounded-full" />
                                )}
                            </button>
                        )
                    })}
                </div>
            </nav>

            {/* Mobile Menu */}
            {isMobileMenuOpen && (
                <nav className="sm:hidden w-full border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 absolute top-full left-0 shadow-xl">
                    <div className="flex flex-col p-4 space-y-2">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => {
                                    setActiveTab(tab.id);
                                    setIsMobileMenuOpen(false);
                                }}
                                className={`text-left px-4 py-3 rounded-lg font-medium ${activeTab === tab.id
                                    ? 'bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 border-l-4 border-teal-500'
                                    : 'text-gray-600 dark:text-gray-400'
                                    }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </nav>
            )}
        </header>
    );
};

export default Header;
