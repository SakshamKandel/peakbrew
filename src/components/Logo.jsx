import React from 'react';
import logoSrc from '../assets/Logo.svg';

export default function Logo({ size = 80, className = '', style = {}, forDashboard = false }) {
  
  return (
    <img 
      src={logoSrc} 
      alt="Peak Brew Trading LLC Logo" 
      width={size} 
      height={size}
      className={`peak-brew-logo ${className}`}
      style={{ 
        objectFit: 'contain',
        filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.25))',
        maxWidth: '100%',
        height: 'auto',
        ...style 
      }}
    />
  );
}
