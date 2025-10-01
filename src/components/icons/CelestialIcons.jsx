// src/components/icons/CelestialIcons.jsx
import React from "react";

export const Planet = ({ className = "bb-tab__icon" }) => (
  <svg viewBox="0 0 64 64" className={className} fill="none" aria-hidden>
    <circle cx="32" cy="32" r="16" fill="#CBB6FF" stroke="#5A2B84" strokeWidth="4"/>
    <ellipse cx="32" cy="34" rx="26" ry="8" fill="none" stroke="#ECA6FF" strokeWidth="4"/>
    <ellipse cx="32" cy="34" rx="26" ry="8" fill="none" stroke="#5A2B84" strokeWidth="2"/>
    <circle cx="38" cy="26" r="3" fill="#fff"/>
  </svg>
);

export const Moon = ({ className = "bb-tab__icon" }) => (
  <svg viewBox="0 0 64 64" className={className} fill="none" aria-hidden>
    <path d="M44 41.5A20.5 20.5 0 1 1 28.7 9.4 17 17 0 1 0 44 41.5Z"
          fill="#FFE58A" stroke="#5A2B84" strokeWidth="4" strokeLinejoin="round"/>
  </svg>
);

export const Sparkles = ({ className = "bb-tab__icon" }) => (
  <svg viewBox="0 0 64 64" className={className} fill="none" aria-hidden>
    <path d="M32 10c2 9 6 13 14 14-8 2-12 6-14 14-2-8-6-12-14-14 8-1 12-5 14-14Z"
          fill="#FFE58A" stroke="#5A2B84" strokeWidth="4" strokeLinejoin="round"/>
    <path d="M12 28c1 4 3 6 7 7-4 1-6 3-7 7-1-4-3-6-7-7 4-1 6-3 7-7Z"
          fill="#FFC2E9" stroke="#5A2B84" strokeWidth="3" strokeLinejoin="round"/>
    <path d="M52 34c1 4 3 6 7 7-4 1-6 3-7 7-1-4-3-6-7-7 4-1 6-3 7-7Z"
          fill="#BFE3FF" stroke="#5A2B84" strokeWidth="3" strokeLinejoin="round"/>
  </svg>
);

export const ShootingStar = ({ className = "bb-tab__icon" }) => (
  <svg viewBox="0 0 64 64" className={className} fill="none" aria-hidden>
    <path d="M10 48 L30 40" stroke="#A855F7" strokeWidth="6" strokeLinecap="round"/>
    <path d="M6 42 L26 34" stroke="#7EC3F6" strokeWidth="6" strokeLinecap="round"/>
    <path d="M14 54 L34 46" stroke="#FFC2E9" strokeWidth="6" strokeLinecap="round"/>
    <path d="M44 20l2 6 6 2-6 2-2 6-2-6-6-2 6-2 2-6Z"
          fill="#FFE58A" stroke="#5A2B84" strokeWidth="3"/>
  </svg>
);

export const Galaxy = ({ className = "bb-tab__icon" }) => (
  <svg viewBox="0 0 64 64" className={className} fill="none" aria-hidden>
    <ellipse cx="32" cy="32" rx="26" ry="14" stroke="#5A2B84" strokeWidth="3" fill="#EBD8FF"/>
    <circle cx="44" cy="30" r="4" fill="#A855F7"/>
    <circle cx="24" cy="36" r="3" fill="#22D3EE"/>
  </svg>
);
