import React, { useState } from 'react';
import Layout from './components/layout/Layout';
import CTCCalculator from './components/calculators/CTCCalculator';
import ReverseCTC from './components/calculators/ReverseCTC';
import CompareOffers from './components/calculators/CompareOffers';
import TaxCalculator from './components/calculators/TaxCalculator';
import HikeCalculator from './components/calculators/HikeCalculator';
import AdditionalCalculators from './components/calculators/AdditionalCalculators';

function App() {
  const [activeTab, setActiveTab] = useState('ctc-to-inhand');

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
        return <AdditionalCalculators />;
      default:
        return <CTCCalculator />;
    }
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      {renderContent()}
    </Layout>
  );
}

export default App;
