import React from 'react';
import enhancedLogoUrl from '../../assets/images/auctionchain_logo.jpg';

export const AUCTIONCHAIN_ENHANCED_LOGO = enhancedLogoUrl;

interface LogoProps {
  variant?: 'dark' | 'light';
  size?: 'sm' | 'md' | 'lg' | 'hero';
  onClick?: () => void;
}

export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  onClick,
}) => {
  if (size === 'hero') {
    return (
      <div
        onClick={onClick}
        className="inline-flex flex-col items-center p-4 rounded-xl bg-[#0F172A] border border-[#1E293B] transition-colors hover:border-[#334155]"
      >
        <div className="w-48 sm:w-56 aspect-square rounded-lg overflow-hidden bg-[#090D1A] flex items-center justify-center p-2 border border-[#1E293B]">
          <img
            src={AUCTIONCHAIN_ENHANCED_LOGO}
            alt="AuctionChain Official Brand Emblem"
            referrerPolicy="no-referrer"
            className="w-full h-full object-contain"
          />
        </div>
        <div className="mt-2.5 flex items-center gap-2 text-[11px] font-mono font-semibold tracking-wider uppercase text-[#94A3B8]">
          <span>Predict</span>
          <span className="text-[#475569]">·</span>
          <span>Bid</span>
          <span className="text-[#475569]">·</span>
          <span>Verify</span>
        </div>
      </div>
    );
  }

  const boxDims =
    size === 'sm' ? 'w-8 h-8' : size === 'lg' ? 'w-11 h-11' : 'w-9 h-9';

  return (
    <div
      onClick={onClick}
      className={`inline-flex items-center gap-2.5 shrink-0 ${
        onClick ? 'cursor-pointer group' : ''
      }`}
    >
      <div
        className={`${boxDims} rounded-lg bg-[#0F172A] p-0.5 border border-[#1E293B] flex items-center justify-center overflow-hidden transition-colors group-hover:border-[#334155]`}
      >
        <img
          src={AUCTIONCHAIN_ENHANCED_LOGO}
          alt="AuctionChain Logo"
          referrerPolicy="no-referrer"
          className="w-full h-full object-contain"
        />
      </div>
      <span className="text-lg font-bold tracking-tight text-[#F8FAFC] whitespace-nowrap leading-none">
        Auction<span className="text-[#60A5FA]">Chain</span>
      </span>
    </div>
  );
};
