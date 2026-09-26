import React from 'react';

export const GovLogo: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" className={className} fill="none" stroke="currentColor">
    {/* Base and Pole */}
    <path d="M50 15 V85 M35 85 H65 M40 90 H60" strokeWidth="6" strokeLinecap="round" />
    {/* Beam */}
    <path d="M20 35 H80" strokeWidth="6" strokeLinecap="round" />
    {/* Left Pan */}
    <path d="M20 35 L10 65 M20 35 L30 65" strokeWidth="3" strokeLinecap="round" />
    <path d="M10 65 Q20 75 30 65 Z" strokeWidth="4" fill="currentColor" strokeLinejoin="round" />
    {/* Right Pan */}
    <path d="M80 35 L70 65 M80 35 L90 65" strokeWidth="3" strokeLinecap="round" />
    <path d="M70 65 Q80 75 90 65 Z" strokeWidth="4" fill="currentColor" strokeLinejoin="round" />
    {/* Chakra Motif */}
    <circle cx="50" cy="35" r="9" strokeWidth="3" />
    <circle cx="50" cy="35" r="3" fill="currentColor" />
  </svg>
);
