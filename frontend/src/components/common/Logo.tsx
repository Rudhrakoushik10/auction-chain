import React from 'react';
import enhancedLogoUrl from '../../assets/images/auctionchain_logo.jpg';

export const AUCTIONCHAIN_ENHANCED_LOGO = enhancedLogoUrl;
export const ORIGINAL_PADDLE_LINEART = '/assets/aistudio/240_F_1121784514_Q6OwYEhb7qcBUqrLWLBNtkmP8TiX12Jx_3c2efe6e.jpg';

interface LogoProps {
  variant?: 'dark' | 'light';
  size?: 'sm' | 'md' | 'lg' | 'hero';
  onClick?: () => void;
}

export const Logo: React.FC<LogoProps> = ({
  variant = 'dark',
  size = 'md',
  onClick
}) => {
  if (size === 'hero') {
    return (
      <div
        onClick={onClick}
        className="relative group inline-flex flex-col items-center p-4 rounded-2xl bg-[#0A0F24] border-2 border-[#06B6D4]/50 shadow-2xl shadow-[#06B6D4]/20 transition-all duration-300 hover:border-[#06B6D4] hover:shadow-[0_0_30px_rgba(6,182,212,0.35)]"
      >
        <div className="absolute -inset-1 rounded-2xl bg-gradient-to-tr from-[#2563EB]/30 via-[#6D28D9]/25 to-[#06B6D4]/30 blur-lg opacity-80 group-hover:opacity-100 transition-opacity pointer-events-none" />
        <div className="relative w-56 sm:w-64 aspect-square rounded-xl overflow-hidden bg-[#090D1A] flex items-center justify-center p-2 border border-white/10">
          <img
            src={AUCTIONCHAIN_ENHANCED_LOGO}
            alt="AuctionChain Official Brand Emblem"
            referrerPolicy="no-referrer"
            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              (e.target as HTMLImageElement).src = ORIGINAL_PADDLE_LINEART;
            }}
          />
        </div>
        <div className="relative mt-2.5 flex items-center gap-2 text-[11px] font-mono font-semibold tracking-widest uppercase text-white">
          <span className="text-[#06B6D4]">Predict</span>
          <span className="text-[#64748B]">·</span>
          <span className="text-[#2563EB]">Bid</span>
          <span className="text-[#64748B]">·</span>
          <span className="text-[#A78BFA]">Verify</span>
        </div>
      </div>
    );
  }

  const boxDims =
    size === 'sm' ? 'w-9 h-9' : size === 'lg' ? 'w-13 h-13' : 'w-11 h-11';

  return (
    <div
      onClick={onClick}
      className={`inline-flex items-center gap-3 shrink-0 ${onClick ? 'cursor-pointer group' : ''}`}
    >
      <div
        className={`${boxDims} rounded-xl bg-[#0A0F24] p-1 border-2 border-[#06B6D4]/60 shadow-lg shadow-[#06B6D4]/25 flex items-center justify-center overflow-hidden transition-transform group-hover:scale-105`}
      >
        <img
          src={AUCTIONCHAIN_ENHANCED_LOGO}
          alt="AuctionChain Logo"
          referrerPolicy="no-referrer"
          className="w-full h-full object-contain"
          onError={(e) => {
            (e.target as HTMLImageElement).src = ORIGINAL_PADDLE_LINEART;
          }}
        />
      </div>
      <div className="flex flex-col">
        <span
          className={`text-xl font-extrabold tracking-tight whitespace-nowrap leading-none ${
            variant === 'dark' ? 'text-white' : 'text-[#F8FAFC]'
          }`}
        >
          Auction<span className="text-[#06B6D4]">Chain</span>
        </span>
        <span
          className={`text-[11px] font-mono tracking-wider mt-1 ${
            variant === 'dark' ? 'text-[#06B6D4]' : 'text-[#A78BFA] font-semibold'
          }`}
        >
          Predict · Bid · Verify
        </span>
      </div>
    </div>
  );
};
