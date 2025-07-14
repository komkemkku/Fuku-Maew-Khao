'use client';

import { useState } from 'react';
import Link from 'next/link';

interface UpgradeTooltipProps {
  feature: string;
  description: string;
  children: React.ReactNode;
}

export const UpgradeTooltip: React.FC<UpgradeTooltipProps> = ({ 
  feature, 
  description, 
  children 
}) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        className="cursor-pointer"
      >
        {children}
      </div>
      
      {isVisible && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-50">
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-3 rounded-lg shadow-xl max-w-xs">
            <div className="text-sm font-medium mb-1">🌟 {feature}</div>
            <div className="text-xs mb-3">{description}</div>
            <Link
              href="/premium"
              className="block w-full text-center bg-white bg-opacity-20 hover:bg-opacity-30 px-3 py-1 rounded text-xs font-medium transition-all duration-200"
            >
              อัปเกรดเลย!
            </Link>
          </div>
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-purple-600"></div>
        </div>
      )}
    </div>
  );
};

interface FreePlanBadgeProps {
  limit: string;
  current: string;
}

export const FreePlanBadge: React.FC<FreePlanBadgeProps> = ({ limit, current }) => {
  return (
    <div className="inline-flex items-center px-2 py-1 bg-orange-100 text-orange-800 text-xs font-medium rounded-full">
      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      {current}/{limit}
    </div>
  );
};
