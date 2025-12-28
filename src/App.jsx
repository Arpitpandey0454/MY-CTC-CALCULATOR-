import React, { useState, useEffect } from 'react';
import Layout from './components/layout/Layout';
import CTCCalculator from './components/calculators/CTCCalculator';
import ReverseCTC from './components/calculators/ReverseCTC';
import CompareOffers from './components/calculators/CompareOffers';
import TaxCalculator from './components/calculators/TaxCalculator';
import HikeCalculator from './components/calculators/HikeCalculator';
import AdditionalCalculators from './components/calculators/AdditionalCalculators';

function App() {
  const [activeTab, setActiveTab] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('tab') || 'ctc-to-inhand';
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    if (tab && tab !== activeTab) {
      setActiveTab(tab);
    }
  }, []);

  const [additionalTab, setAdditionalTab] = useState('pf');

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    const url = new URL(window.location);
    url.searchParams.set('tab', tabId);
    window.history.pushState({}, '', url);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'ctc-to-inhand':
        return <CTCCalculator />;
      case 'inhand-to-ctc':
        return <ReverseCTC />;
      case 'compare':
        return <CompareOffers />;
      case 'tax':
        return <TaxCalculator />;
      case 'hike':
        return <HikeCalculator />;
      case 'additional':
        return <AdditionalCalculators activeSubTab={additionalTab} onTabChange={setAdditionalTab} />;
      default:
        return <CTCCalculator />;
    }
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={handleTabChange} additionalTab={additionalTab} setAdditionalTab={setAdditionalTab}>
      {renderContent()}
    </Layout>
  );
}

export default App;
