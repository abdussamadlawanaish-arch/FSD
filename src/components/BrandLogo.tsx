import React, { useState, useEffect } from 'react';
import { SCHOOL_INFO } from '../types';

interface BrandLogoProps {
  logoUrl: string;
  className?: string;
  alt?: string;
}

export const BrandLogoFallbackSvg: React.FC<{ className?: string }> = ({ className = 'w-12 h-12' }) => (
  <svg
    viewBox="0 0 120 120"
    className={className}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-label={SCHOOL_INFO.name}
  >
    <path
      d="M60 8L104 24V58C104 85 84.5 104.5 60 113C35.5 104.5 16 85 16 58V24L60 8Z"
      fill="#0A2E7A"
      stroke="#F5B700"
      strokeWidth="5"
    />
    <circle cx="60" cy="52" r="24" stroke="#FFFFFF" strokeWidth="4" />
    <circle cx="60" cy="52" r="7" fill="#F5B700" />
    <path d="M60 28V45M38 60L54 54M82 60L66 54" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" />
    <rect x="24" y="79" width="72" height="16" rx="4" fill="#F5B700" />
    <text
      x="60"
      y="90.5"
      textAnchor="middle"
      fill="#0A2E7A"
      fontSize="10.5"
      fontWeight="800"
      fontFamily="Outfit, sans-serif"
      letterSpacing="0.8"
    >
      FUSAHA
    </text>
  </svg>
);

export const BrandLogo: React.FC<BrandLogoProps> = ({
  logoUrl,
  className = 'h-11 w-auto object-contain',
  alt = `${SCHOOL_INFO.name} Official Emblem`,
}) => {
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [logoUrl]);

  if (imgError || !logoUrl) {
    return <BrandLogoFallbackSvg className={className} />;
  }

  return (
    <img
      src={logoUrl}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setImgError(true)}
      className={className}
    />
  );
};

export const GlobalPageWatermark: React.FC<{ logoUrl: string }> = ({ logoUrl }) => {
  return (
    <div
      aria-hidden="true"
      className="no-print pointer-events-none fixed inset-0 z-0 flex items-center justify-center overflow-hidden"
    >
      <div
        className="w-[480px] max-w-[85vw] h-[480px] max-h-[85vh]"
        style={{
          backgroundImage: `url("${logoUrl}")`,
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundSize: '480px auto',
          opacity: 0.06,
        }}
      />
    </div>
  );
};

export const DocumentWatermark: React.FC<{ logoUrl: string }> = ({ logoUrl }) => {
  return (
    <div
      aria-hidden="true"
      className="print-watermark pointer-events-none absolute inset-0 z-0 flex items-center justify-center overflow-hidden"
    >
      <div
        className="w-[440px] max-w-[85%] h-[440px] max-h-[85%]"
        style={{
          backgroundImage: `url("${logoUrl}")`,
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundSize: '420px auto',
          opacity: 0.07,
        }}
      />
    </div>
  );
};
