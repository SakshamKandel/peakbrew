import React from 'react';
import dashboardLogo from '../assets/Logo.svg';
import generalLogo from '../assets/peak brew.svg';

export default function Logo({ size = 40, className = '', style = {}, forDashboard = false }) {
  const logoSrc = forDashboard ? dashboardLogo : generalLogo;
  
  return (
    <img 
      src={logoSrc} 
      alt="Peak Brew Trading Logo" 
      width={size} 
      height={size}
      className={`peak-brew-logo ${className}`}
      style={{ 
        objectFit: 'contain',
        ...style 
      }}
    />
  );
}
