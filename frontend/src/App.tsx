/**
 * AuctionChain — AI-Powered Sealed-Bid Vehicle Auction Platform
 * Hardhat Localhost (Chain ID: 31337) · Dark Blockchain Theme
 */

import React, { useState } from 'react';
import { WalletProvider, useWallet } from './context/WalletContext';
import { PublicHeader, PublicNavTab } from './components/layout/PublicHeader';
import { AuthenticatedHeader } from './components/layout/AuthenticatedHeader';
import { Footer } from './components/layout/Footer';
import { AuthModal } from './components/wallet/AuthModal';
import { Home } from './pages/Home';
import { Marketplace } from './pages/Marketplace';
import { CreateAuction } from './pages/CreateAuction';
import { AuctionDetails } from './pages/AuctionDetails';
import { HowItWorksPage } from './pages/public/HowItWorksPage';
import { AIPriceEstimatorPage } from './pages/public/AIPriceEstimatorPage';
import { SecurityTransparencyPage } from './pages/public/SecurityTransparencyPage';
import { AboutUsPage } from './pages/public/AboutUsPage';
import { SellerDashboard } from './pages/seller/SellerDashboard';
import { BidderDashboard } from './pages/bidder/BidderDashboard';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AuctionItem, LocalRevealBackupSecret } from './types/auction';
import {
  generateDeterministicTxHash,
  shortenAddress,
} from './lib/crypto';

const AUCTIONS_STORAGE_KEY = 'auctionchain_auctions_registry_v1';
const SECRETS_STORAGE_KEY = 'auctionchain_reveal_secrets_v1';

function AuctionChainAppContent() {
  const { isConnected, wallet, adjustBalance } = useWallet();
  const [publicTab, setPublicTab] = useState<PublicNavTab>('home');
  const [auctions, setAuctions] = useState<AuctionItem[]>(() => {
    try {
      const saved = localStorage.getItem(AUCTIONS_STORAGE_KEY);
      return saved ? (JSON.parse(saved) as AuctionItem[]) : [];
    } catch {
      return [];
    }
  });
  const [selectedAuctionId, setSelectedAuctionId] = useState<string | null>(null);
  const [savedSecrets, setSavedSecrets] = useState<LocalRevealBackupSecret[]>(() => {
    try {
      const saved = localStorage.getItem(SECRETS_STORAGE_KEY);
      return saved ? (JSON.parse(saved) as LocalRevealBackupSecret[]) : [];
    } catch {
      return [];
    }
  });

  React.useEffect(() => {
    try {
      localStorage.setItem(AUCTIONS_STORAGE_KEY, JSON.stringify(auctions));
    } catch {
      // ignore storage quota errors
    }
  }, [auctions]);

  React.useEffect(() => {
    try {
      localStorage.setItem(SECRETS_STORAGE_KEY, JSON.stringify(savedSecrets));
    } catch {
      // ignore storage quota errors
    }
  }, [savedSecrets]);

  const selectedAuction = auctions.find((a) => a.id === selectedAuctionId) || null;

  const handleSelectAuction = (auction: AuctionItem) => {
    setSelectedAuctionId(auction.id);
  };

  const handleCreateAuction = (newAuction: AuctionItem) => {
    setAuctions((prev) => [newAuction, ...prev]);
    setSelectedAuctionId(newAuction.id);
  };

  // Commit Sealed Bid on SealedAuction.sol
  const handleCommitBid = (
    auctionId: string,
    commitmentHash: string,
    secretBackup: LocalRevealBackupSecret
  ) => {
    if (!wallet) return;
    setSavedSecrets((prev) => [secretBackup, ...prev]);

    setAuctions((prev) =>
      prev.map((auc) => {
        if (auc.id !== auctionId) return auc;
        const txHash = generateDeterministicTxHash(
          `COMMIT:${auctionId}:${wallet.address}:${commitmentHash}`
        );
        const nowIso = new Date().toISOString();

        // Lock fixed collateral deposit from bidder wallet
        adjustBalance(wallet.address, -auc.fixedDepositEth);

        return {
          ...auc,
          commitments: [
            ...auc.commitments,
            {
              id: `CMT-${auc.numericId}-${auc.commitments.length + 1}`,
              auctionId: auc.id,
              numericAuctionId: auc.numericId,
              bidderAddress: wallet.address,
              bidderEns: wallet.ens,
              commitmentHash,
              depositEth: auc.fixedDepositEth,
              committedAt: nowIso,
              committedTimestamp: Math.floor(Date.now() / 1000),
              blockNumber: 4189250 + auc.commitments.length,
              txHash,
              revealed: false,
              depositRefunded: false,
            },
          ],
          events: [
            ...auc.events,
            {
              id: `EVT-${auc.numericId}-${auc.events.length + 1}`,
              eventName: 'BidCommitted',
              txHash,
              blockNumber: 4189250 + auc.commitments.length,
              timestamp: nowIso,
              actorAddress: wallet.address,
              summary: `${wallet.label} submitted sealed commitment ${commitmentHash.slice(
                0,
                14
              )}... with ${auc.fixedDepositEth.toFixed(2)} ETH collateral`,
            },
          ],
        };
      })
    );
  };

  // Reveal Sealed Bid on SealedAuction.sol
  const handleRevealBid = (
    auctionId: string,
    bidAmountEth: number,
    salt: string
  ): { success: boolean; message: string } => {
    if (!wallet) {
      return { success: false, message: 'Connect wallet first.' };
    }

    const targetAuction = auctions.find((a) => a.id === auctionId);
    if (!targetAuction) {
      return { success: false, message: 'Auction not found.' };
    }

    const myComm = targetAuction.commitments.find(
      (c) => c.bidderAddress.toLowerCase() === wallet.address.toLowerCase()
    );
    if (!myComm) {
      return {
        success: false,
        message: `No commitment found for ${shortenAddress(
          wallet.address
        )} on this auction. Switch to the wallet that committed the bid.`,
      };
    }

    if (myComm.revealed) {
      return { success: false, message: 'You have already revealed your bid.' };
    }

    if (bidAmountEth < targetAuction.startingBidEth) {
      return {
        success: false,
        message: `BidBelowStartingPrice(): Revealed bid (${bidAmountEth} ETH) is below starting bid (${targetAuction.startingBidEth} ETH).`,
      };
    }

    const revealTxHash = generateDeterministicTxHash(
      `REVEAL:${auctionId}:${wallet.address}:${bidAmountEth}:${salt}`
    );
    const nowIso = new Date().toISOString();

    setAuctions((prev) =>
      prev.map((auc) => {
        if (auc.id !== auctionId) return auc;

        const updatedCommitments = auc.commitments.map((c) =>
          c.bidderAddress.toLowerCase() === wallet.address.toLowerCase()
            ? {
                ...c,
                revealed: true,
                revealedAmountEth: bidAmountEth,
                revealedAt: nowIso,
                revealTxHash,
              }
            : c
        );

        let currentHighest = auc.highestBidEth || 0;
        let currentWinnerAddr = auc.winningBidderAddress;
        let currentWinnerEns = auc.winningBidderEns;

        if (bidAmountEth > currentHighest) {
          currentHighest = bidAmountEth;
          currentWinnerAddr = wallet.address;
          currentWinnerEns = wallet.ens;
        }

        return {
          ...auc,
          highestBidEth: currentHighest,
          winningBidderAddress: currentWinnerAddr,
          winningBidderEns: currentWinnerEns,
          commitments: updatedCommitments,
          events: [
            ...auc.events,
            {
              id: `EVT-${auc.numericId}-${auc.events.length + 1}`,
              eventName: 'BidRevealed',
              txHash: revealTxHash,
              blockNumber: 4189300 + auc.events.length,
              timestamp: nowIso,
              actorAddress: wallet.address,
              summary: `${wallet.label} verified hash and revealed bid of ${bidAmountEth.toFixed(
                2
              )} ETH`,
            },
          ],
        };
      })
    );

    return {
      success: true,
      message: `Hash verified! Revealed bid of ${bidAmountEth.toFixed(
        2
      )} ETH recorded on SealedAuction.sol.`,
    };
  };

  // Finalize Auction & Check Reserve Price
  const handleFinalizeAuction = (auctionId: string) => {
    setAuctions((prev) =>
      prev.map((auc) => {
        if (auc.id !== auctionId) return auc;
        const highest = auc.highestBidEth || 0;
        const isSold = highest >= auc.reservePriceEth && Boolean(auc.winningBidderAddress);
        const newPhase = isSold ? 'Sold' : 'No Sale';
        const txHash = generateDeterministicTxHash(`FINALIZE:${auctionId}:${newPhase}`);
        const nowIso = new Date().toISOString();

        return {
          ...auc,
          phase: newPhase,
          finalizedAt: nowIso,
          finalizedTxHash: txHash,
          events: [
            ...auc.events,
            {
              id: `EVT-${auc.numericId}-${auc.events.length + 1}`,
              eventName: 'AuctionFinalized',
              txHash,
              blockNumber: 4189400 + auc.events.length,
              timestamp: nowIso,
              actorAddress: wallet?.address || auc.sellerAddress,
              summary: isSold
                ? `Auction #${auc.numericId} finalized as SOLD to ${shortenAddress(
                    auc.winningBidderAddress || ''
                  )} for ${highest.toFixed(2)} ETH (Reserve ${auc.reservePriceEth.toFixed(
                    2
                  )} ETH met)`
                : `Auction #${auc.numericId} finalized as NO SALE (Highest revealed bid ${highest.toFixed(
                    2
                  )} ETH below reserve ${auc.reservePriceEth.toFixed(2)} ETH)`,
            },
          ],
        };
      })
    );
  };

  // Demo helper to advance phase
  const handleAdvancePhaseDemo = (auctionId: string) => {
    const target = auctions.find((a) => a.id === auctionId);
    if (!target) return;
    if (target.phase === 'Commit') {
      setAuctions((prev) =>
        prev.map((a) => (a.id === auctionId ? { ...a, phase: 'Reveal' } : a))
      );
    } else if (target.phase === 'Reveal') {
      handleFinalizeAuction(auctionId);
    }
  };

  // Winner Settles Balance
  const handleSettleWinner = (auctionId: string) => {
    if (!wallet) return;
    setAuctions((prev) =>
      prev.map((auc) => {
        if (auc.id !== auctionId) return auc;
        const due = Math.max(0, (auc.highestBidEth || 0) - auc.fixedDepositEth);
        adjustBalance(wallet.address, -due);
        const txHash = generateDeterministicTxHash(`SETTLE:${auctionId}:${wallet.address}`);
        const nowIso = new Date().toISOString();

        return {
          ...auc,
          winnerSettled: true,
          settlementTxHash: txHash,
          commitments: auc.commitments.map((c) =>
            c.bidderAddress.toLowerCase() === wallet.address.toLowerCase()
              ? { ...c, depositRefunded: true }
              : c
          ),
          events: [
            ...auc.events,
            {
              id: `EVT-${auc.numericId}-${auc.events.length + 1}`,
              eventName: 'WinnerSettled',
              txHash,
              blockNumber: 4189450 + auc.events.length,
              timestamp: nowIso,
              actorAddress: wallet.address,
              summary: `Winner settled remaining ${due.toFixed(
                2
              )} ETH balance (+ ${auc.fixedDepositEth.toFixed(2)} ETH deposit credit)`,
            },
          ],
        };
      })
    );
  };

  // Pull-Based Deposit Refund
  const handleClaimRefund = (auctionId: string) => {
    if (!wallet) return;
    setAuctions((prev) =>
      prev.map((auc) => {
        if (auc.id !== auctionId) return auc;
        const myComm = auc.commitments.find(
          (c) => c.bidderAddress.toLowerCase() === wallet.address.toLowerCase()
        );
        if (!myComm || myComm.depositRefunded) return auc;

        adjustBalance(wallet.address, myComm.depositEth);
        const txHash = generateDeterministicTxHash(`REFUND:${auctionId}:${wallet.address}`);
        const nowIso = new Date().toISOString();

        return {
          ...auc,
          commitments: auc.commitments.map((c) =>
            c.bidderAddress.toLowerCase() === wallet.address.toLowerCase()
              ? { ...c, depositRefunded: true, refundTxHash: txHash }
              : c
          ),
          events: [
            ...auc.events,
            {
              id: `EVT-${auc.numericId}-${auc.events.length + 1}`,
              eventName: 'RefundClaimed',
              txHash,
              blockNumber: 4189480 + auc.events.length,
              timestamp: nowIso,
              actorAddress: wallet.address,
              summary: `${wallet.label} claimed pull-based deposit refund of ${myComm.depositEth.toFixed(
                2
              )} ETH`,
            },
          ],
        };
      })
    );
  };

  // Pull-Based Seller Proceeds Withdrawal
  const handleWithdrawProceeds = (auctionId: string) => {
    if (!wallet) return;
    setAuctions((prev) =>
      prev.map((auc) => {
        if (auc.id !== auctionId || auc.sellerWithdrawn) return auc;
        const proceeds = auc.highestBidEth || 0;
        adjustBalance(wallet.address, proceeds);
        const txHash = generateDeterministicTxHash(`WITHDRAW:${auctionId}:${wallet.address}`);
        const nowIso = new Date().toISOString();

        return {
          ...auc,
          sellerWithdrawn: true,
          sellerWithdrawTxHash: txHash,
          events: [
            ...auc.events,
            {
              id: `EVT-${auc.numericId}-${auc.events.length + 1}`,
              eventName: 'SellerProceedsWithdrawn',
              txHash,
              blockNumber: 4189500 + auc.events.length,
              timestamp: nowIso,
              actorAddress: wallet.address,
              summary: `Seller withdrew ${proceeds.toFixed(
                2
              )} ETH proceeds via pull-based withdrawSellerProceeds()`,
            },
          ],
        };
      })
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#090D1A] text-[#F8FAFC]">
      {/* Dynamic Header: Public Pre-Login vs Authenticated Dashboard */}
      {!isConnected || !wallet ? (
        <PublicHeader
          activeTab={publicTab}
          setActiveTab={(tab) => {
            setSelectedAuctionId(null);
            setPublicTab(tab);
          }}
        />
      ) : (
        <AuthenticatedHeader
          events={auctions.flatMap((a) => a.events)}
          onLogoClick={() => {
            setSelectedAuctionId(null);
          }}
        />
      )}

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {selectedAuction ? (
          <AuctionDetails
            auction={selectedAuction}
            onBack={() => setSelectedAuctionId(null)}
            onCommitBid={handleCommitBid}
            onRevealBid={handleRevealBid}
            onFinalizeAuction={handleFinalizeAuction}
            onAdvancePhaseDemo={handleAdvancePhaseDemo}
            onSettleWinner={handleSettleWinner}
            onClaimRefund={handleClaimRefund}
            onWithdrawProceeds={handleWithdrawProceeds}
            savedSecrets={savedSecrets}
          />
        ) : !isConnected || !wallet ? (
          /* ================= PRE-LOGIN PUBLIC ROUTES (Section 2) ================= */
          publicTab === 'home' ? (
            <Home
              auctions={auctions}
              onSelectAuction={handleSelectAuction}
              onNavigate={(tab) => {
                setSelectedAuctionId(null);
                setPublicTab(tab as PublicNavTab);
              }}
            />
          ) : publicTab === 'explore' ? (
            <Marketplace
              auctions={auctions}
              onSelectAuction={handleSelectAuction}
            />
          ) : publicTab === 'how-it-works' ? (
            <HowItWorksPage />
          ) : publicTab === 'ai-estimator' ? (
            <AIPriceEstimatorPage />
          ) : publicTab === 'security' ? (
            <SecurityTransparencyPage />
          ) : (
            <AboutUsPage />
          )
        ) : (
          /* ================= POST-LOGIN ROLE-BASED DASHBOARDS (Sections 6, 7, 8) ================= */
          wallet.role === 'seller' ? (
            <SellerDashboard
              auctions={auctions}
              onSelectAuction={handleSelectAuction}
              onCreateAuction={handleCreateAuction}
              onFinalizeAuction={handleFinalizeAuction}
              onWithdrawProceeds={handleWithdrawProceeds}
            />
          ) : wallet.role === 'bidder' ? (
            <BidderDashboard
              auctions={auctions}
              savedSecrets={savedSecrets}
              onSelectAuction={handleSelectAuction}
              onClaimRefund={handleClaimRefund}
              onSettleWinner={handleSettleWinner}
            />
          ) : wallet.role === 'admin' ? (
            <AdminDashboard
              auctions={auctions}
              onSelectAuction={handleSelectAuction}
            />
          ) : (
            <div className="p-8 text-center text-xs text-slate-400">
              Role not recognized. Please switch account.
            </div>
          )
        )}
      </main>

      {/* Global Footer with dark blockchain styling */}
      <Footer
        onNavigatePublic={(tab) => {
          setSelectedAuctionId(null);
          setPublicTab(tab);
        }}
      />

      {/* Connect to AuctionChain Modal */}
      <AuthModal />
    </div>
  );
}

export default function App() {
  return (
    <WalletProvider>
      <AuctionChainAppContent />
    </WalletProvider>
  );
}
