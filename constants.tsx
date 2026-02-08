
import React from 'react';

export const COLORS = {
  primary: '#fbbf24', // Orange yellow
  secondary: '#4ade80', // Green
  accent: '#f87171', // Red
  background: '#f0fdf4'
};

export const CapybaraIcon = () => (
  <svg viewBox="0 0 100 100" className="w-24 h-24">
    <circle cx="50" cy="50" r="45" fill="#A67B5B" />
    <ellipse cx="50" cy="40" rx="30" ry="25" fill="#C19A6B" />
    <circle cx="35" cy="35" r="4" fill="#000" />
    <circle cx="65" cy="35" r="4" fill="#000" />
    <path d="M40 55 Q50 65 60 55" stroke="#000" strokeWidth="2" fill="none" />
    <rect x="45" y="45" width="10" height="5" rx="2" fill="#333" />
  </svg>
);

export const OrangeIcon = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="13" r="8" fill="#FF8C00" />
    <path d="M12 5V3M12 3L10 2M12 3L14 2" stroke="#228B22" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export const WaterDropIcon = () => (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="3" className="animate-bounce">
        <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" fill="#3b82f6" />
    </svg>
);

export const WateringCanIcon = ({ color = "#3b82f6" }: { color?: string }) => (
  <svg width="60" height="40" viewBox="0 0 60 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="10" y="10" width="30" height="25" rx="5" fill={color} />
    <path d="M40 15L55 5" stroke={color} strokeWidth="5" strokeLinecap="round" />
    <path d="M10 20C5 20 5 30 10 30" stroke="#1d4ed8" strokeWidth="3" />
    <circle cx="55" cy="5" r="2" fill="white" />
  </svg>
);
