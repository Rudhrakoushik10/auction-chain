import React from 'react';
import logoImg from '../../assets/images/auctionchain_logo.jpg';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  subtitle?: string;
}

export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  showText = true,
  subtitle = 'Institutional Reserve Exchange',
}) => {
  const dimensions = {
    sm: 'w-8 h-8',
    md: 'w-9 h-9',
    lg: 'w-12 h-12',
  }[size];

  const titleSizes = {
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-2xl',
  }[size];

  return (
    <div className="inline-flex items-center gap-3 select-none">
      <div
        className={`${dimensions} rounded-md overflow-hidden border border-[#232730] bg-[#12141A] flex items-center justify-center shrink-0`}
      >
        <img
          src={logoImg}
          alt="AuctionChain Logo"
          className="w-full h-full object-cover opacity-90 contrast-125"
        />
      </div>
      {showText && (
        <div className="flex flex-col text-left">
          <span
            className={`font-display font-semibold tracking-tight text-[#F4F5F7] leading-none ${titleSizes}`}
          >
            Auction<span className="text-[#C5A46D]">Chain</span>
          </span>
          {subtitle && (
            <span className="text-[10px] font-mono uppercase tracking-[0.16em] text-[#8E95A5] mt-1">
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
