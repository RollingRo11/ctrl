import React from 'react';
import { InfrastructureInvestment } from '@/components/InfrastructureInvestment';
import { SimpleGlobe } from '@/components/SimpleGlobe';

const Logistics = () => {
  return (
    <div className="container mx-auto p-6 space-y-6 overflow-auto">
      <div>
        <h1 className="text-4xl font-normal mb-2 text-white">
          Global Logistics & Infrastructure
        </h1>
        <p className="text-gray-400">
          Real-time supply chain monitoring and infrastructure investment opportunities
        </p>
      </div>

      {/* Globe at the top */}
      <SimpleGlobe />

      {/* Infrastructure Investments below */}
      <InfrastructureInvestment />
    </div>
  );
};

export default Logistics;
