import React from 'react';
import Header from './Header';
import Footer from './Footer';
import AboutAndFAQ from './AboutAndFAQ';

const Layout = ({ children, activeTab, setActiveTab, additionalTab, setAdditionalTab }) => {
    return (
        <div className="min-h-screen bg-arpit-gradient text-gray-800 dark:text-gray-200 transition-colors duration-300 flex flex-col">
            <Header activeTab={activeTab} setActiveTab={setActiveTab} additionalTab={additionalTab} setAdditionalTab={setAdditionalTab} />

            <main className="flex-grow container mx-auto px-4 py-8 relative z-10 pt-32 sm:pt-36">
                {children}
                <AboutAndFAQ />
            </main>

            <Footer setActiveTab={setActiveTab} />
        </div>
    );
};

export default Layout;
