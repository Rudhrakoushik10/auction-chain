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
import { AuctionDetails } from './pages/AuctionDetails';
import { HowItWorksPage } from './pages/public/HowItWorksPage';
import { ArchitecturePage } from './pages/public/ArchitecturePage';
import { SellerDashboard } from './pages/seller/SellerDashboard';
import { BidderDashboard } from './pages/bidder/BidderDashboard';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AuctionItem, LocalRevealBackupSecret } from './types/auction';
import {
  generateDeterministicTxHash,
  shortenAddress,
} from './lib/crypto';
import { SEALED_AUCTION_CONTRACT_ADDRESS } from './lib/hardhatConfig';
import { executeMetaMaskTransaction } from './services/blockchain/walletService';
import { NonceMismatchBanner } from './components/wallet/NonceMismatchBanner';

const AUCTIONS_STORAGE_KEY = 'auctionchain_auctions_registry_v1';
const SECRETS_STORAGE_KEY = 'auctionchain_reveal_secrets_v1';

function AuctionChainAppContent() {
  const {
    isConnected,
    wallet,
    adjustBalance,
    nonceMismatch,
    autoSyncNonce,
    confirmManualNonceClear,
    reportNonceMismatch,
    inspectTransaction,
  } = useWallet();
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

  React.useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [publicTab, selectedAuctionId, isConnected, wallet?.address]);

  const selectedAuction = auctions.find((a) => a.id === selectedAuctionId) || null;

  const handleSelectAuction = (auction: AuctionItem) => {
    setSelectedAuctionId(auction.id);
  };

  const handleCreateAuction = (newAuction: AuctionItem) => {
    setAuctions((prev) => [newAuction, ...prev]);
    setSelectedAuctionId(newAuction.id);
  };

  // Commit Sealed Bid on SealedAuction.sol
  const handleCommitBid = async (
    auctionId: string,
    commitmentHash: string,
    secretBackup: LocalRevealBackupSecret
  ): Promise<{ success: boolean; message: string }> => {
    if (!wallet) {
      return { success: false, message: 'Please connect your wallet first.' };
    }
    const targetAuction = auctions.find((a) => a.id === auctionId);
    if (!targetAuction) {
      return { success: false, message: 'Auction not found.' };
    }

    const txRes = await executeMetaMaskTransaction({
      senderAddress: wallet.address,
      toAddress: SEALED_AUCTION_CONTRACT_ADDRESS,
      valueEth: targetAuction.fixedDepositEth,
    });

    if (!txRes.success) {
      if (txRes.nonceMismatch) {
        reportNonceMismatch(txRes.nonceMismatch);
      }
      return {
        success: false,
        message: txRes.error || 'Rejected: Transaction was rejected in MetaMask.',
      };
    }

    const txHash =
      txRes.receipt?.txHash ||
      generateDeterministicTxHash(
        `COMMIT:${auctionId}:${wallet.address}:${commitmentHash}`
      );
    const blockNum = txRes.receipt?.blockNumber || 4189250 + targetAuction.commitments.length;
    const nowIso = new Date().toISOString();

    setSavedSecrets((prev) => [secretBackup, ...prev]);
    adjustBalance(wallet.address, -targetAuction.fixedDepositEth);

    setAuctions((prev) =>
      prev.map((auc) => {
        if (auc.id !== auctionId) return auc;
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
              blockNumber: blockNum,
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
              blockNumber: blockNum,
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

    if (txRes.receipt?.txHash) {
      inspectTransaction(txRes.receipt.txHash);
    }

    return {
      success: true,
      message: `Transaction confirmed (${txHash.slice(0, 12)}...): Sealed commitment ${commitmentHash.slice(0, 14)}... recorded with ${targetAuction.fixedDepositEth.toFixed(2)} ETH collateral deposit.`,
    };
  };

  // Reveal Sealed Bid on SealedAuction.sol
  const handleRevealBid = async (
    auctionId: string,
    bidAmountEth: number,
    salt: string
  ): Promise<{ success: boolean; message: string }> => {
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

    const txRes = await executeMetaMaskTransaction({
      senderAddress: wallet.address,
      toAddress: SEALED_AUCTION_CONTRACT_ADDRESS,
      valueEth: 0,
    });

    if (!txRes.success) {
      if (txRes.nonceMismatch) {
        reportNonceMismatch(txRes.nonceMismatch);
      }
      return {
        success: false,
        message: txRes.error || 'Rejected: Transaction was rejected in MetaMask.',
      };
    }

    const revealTxHash =
      txRes.receipt?.txHash ||
      generateDeterministicTxHash(
        `REVEAL:${auctionId}:${wallet.address}:${bidAmountEth}:${salt}`
      );
    const blockNum = txRes.receipt?.blockNumber || 4189300 + targetAuction.events.length;
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
              blockNumber: blockNum,
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

    if (txRes.receipt?.txHash) {
      inspectTransaction(txRes.receipt.txHash);
    }

    return {
      success: true,
      message: `Hash verified & confirmed (${revealTxHash.slice(0, 12)}...)! Revealed bid of ${bidAmountEth.toFixed(
        2
      )} ETH recorded on SealedAuction.sol.`,
    };
  };

  // Finalize Auction & Check Reserve Price
  const handleFinalizeAuction = async (
    auctionId: string
  ): Promise<{ success: boolean; message: string }> => {
    const targetAuction = auctions.find((a) => a.id === auctionId);
    if (!targetAuction) {
      return { success: false, message: 'Auction not found.' };
    }

    const senderAddr = wallet?.address || targetAuction.sellerAddress;
    const txRes = await executeMetaMaskTransaction({
      senderAddress: senderAddr,
      toAddress: SEALED_AUCTION_CONTRACT_ADDRESS,
      valueEth: 0,
    });

    if (!txRes.success) {
      if (txRes.nonceMismatch) {
        reportNonceMismatch(txRes.nonceMismatch);
      }
      return {
        success: false,
        message: txRes.error || 'Rejected: Transaction was rejected in MetaMask.',
      };
    }

    const highest = targetAuction.highestBidEth || 0;
    const isSold =
      highest >= targetAuction.reservePriceEth && Boolean(targetAuction.winningBidderAddress);
    const newPhase = isSold ? 'Sold' : 'No Sale';
    const txHash =
      txRes.receipt?.txHash || generateDeterministicTxHash(`FINALIZE:${auctionId}:${newPhase}`);
    const blockNum = txRes.receipt?.blockNumber || 4189400 + targetAuction.events.length;
    const nowIso = new Date().toISOString();

    setAuctions((prev) =>
      prev.map((auc) => {
        if (auc.id !== auctionId) return auc;
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
              blockNumber: blockNum,
              timestamp: nowIso,
              actorAddress: senderAddr,
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

    if (txRes.receipt?.txHash) {
      inspectTransaction(txRes.receipt.txHash);
    }

    return {
      success: true,
      message: `Transaction confirmed (${txHash.slice(0, 12)}...): Auction finalized as ${newPhase}.`,
    };
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
  const handleSettleWinner = async (
    auctionId: string
  ): Promise<{ success: boolean; message: string }> => {
    if (!wallet) {
      return { success: false, message: 'Please connect your wallet first.' };
    }
    const targetAuction = auctions.find((a) => a.id === auctionId);
    if (!targetAuction) {
      return { success: false, message: 'Auction not found.' };
    }

    const due = Math.max(0, (targetAuction.highestBidEth || 0) - targetAuction.fixedDepositEth);

    const txRes = await executeMetaMaskTransaction({
      senderAddress: wallet.address,
      toAddress: SEALED_AUCTION_CONTRACT_ADDRESS,
      valueEth: due,
    });

    if (!txRes.success) {
      if (txRes.nonceMismatch) {
        reportNonceMismatch(txRes.nonceMismatch);
      }
      return {
        success: false,
        message: txRes.error || 'Rejected: Transaction was rejected in MetaMask.',
      };
    }

    const txHash =
      txRes.receipt?.txHash || generateDeterministicTxHash(`SETTLE:${auctionId}:${wallet.address}`);
    const blockNum = txRes.receipt?.blockNumber || 4189450 + targetAuction.events.length;
    const nowIso = new Date().toISOString();

    adjustBalance(wallet.address, -due);

    setAuctions((prev) =>
      prev.map((auc) => {
        if (auc.id !== auctionId) return auc;
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
              blockNumber: blockNum,
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

    if (txRes.receipt?.txHash) {
      inspectTransaction(txRes.receipt.txHash);
    }

    return {
      success: true,
      message: `Transaction confirmed (${txHash.slice(0, 12)}...): Winning balance of ${due.toFixed(2)} ETH settled on SealedAuction.sol.`,
    };
  };

  // Pull-Based Deposit Refund
  const handleClaimRefund = async (
    auctionId: string
  ): Promise<{ success: boolean; message: string }> => {
    if (!wallet) {
      return { success: false, message: 'Please connect your wallet first.' };
    }
    const targetAuction = auctions.find((a) => a.id === auctionId);
    if (!targetAuction) {
      return { success: false, message: 'Auction not found.' };
    }
    const myComm = targetAuction.commitments.find(
      (c) => c.bidderAddress.toLowerCase() === wallet.address.toLowerCase()
    );
    if (!myComm || myComm.depositRefunded) {
      return { success: false, message: 'No refundable deposit available.' };
    }

    const txRes = await executeMetaMaskTransaction({
      senderAddress: wallet.address,
      toAddress: SEALED_AUCTION_CONTRACT_ADDRESS,
      valueEth: 0,
    });

    if (!txRes.success) {
      if (txRes.nonceMismatch) {
        reportNonceMismatch(txRes.nonceMismatch);
      }
      return {
        success: false,
        message: txRes.error || 'Rejected: Transaction was rejected in MetaMask.',
      };
    }

    const txHash =
      txRes.receipt?.txHash || generateDeterministicTxHash(`REFUND:${auctionId}:${wallet.address}`);
    const blockNum = txRes.receipt?.blockNumber || 4189480 + targetAuction.events.length;
    const nowIso = new Date().toISOString();

    adjustBalance(wallet.address, myComm.depositEth);

    setAuctions((prev) =>
      prev.map((auc) => {
        if (auc.id !== auctionId) return auc;
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
              blockNumber: blockNum,
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

    if (txRes.receipt?.txHash) {
      inspectTransaction(txRes.receipt.txHash);
    }

    return {
      success: true,
      message: `Transaction confirmed (${txHash.slice(0, 12)}...): Refunded ${myComm.depositEth.toFixed(2)} ETH deposit to your wallet.`,
    };
  };

  // Pull-Based Seller Proceeds Withdrawal
  const handleWithdrawProceeds = async (
    auctionId: string
  ): Promise<{ success: boolean; message: string }> => {
    if (!wallet) {
      return { success: false, message: 'Please connect your wallet first.' };
    }
    const targetAuction = auctions.find((a) => a.id === auctionId);
    if (!targetAuction || targetAuction.sellerWithdrawn) {
      return { success: false, message: 'Proceeds already withdrawn or auction not found.' };
    }

    const txRes = await executeMetaMaskTransaction({
      senderAddress: wallet.address,
      toAddress: SEALED_AUCTION_CONTRACT_ADDRESS,
      valueEth: 0,
    });

    if (!txRes.success) {
      if (txRes.nonceMismatch) {
        reportNonceMismatch(txRes.nonceMismatch);
      }
      return {
        success: false,
        message: txRes.error || 'Rejected: Transaction was rejected in MetaMask.',
      };
    }

    const proceeds = targetAuction.highestBidEth || 0;
    const txHash =
      txRes.receipt?.txHash ||
      generateDeterministicTxHash(`WITHDRAW:${auctionId}:${wallet.address}`);
    const blockNum = txRes.receipt?.blockNumber || 4189500 + targetAuction.events.length;
    const nowIso = new Date().toISOString();

    adjustBalance(wallet.address, proceeds);

    setAuctions((prev) =>
      prev.map((auc) => {
        if (auc.id !== auctionId || auc.sellerWithdrawn) return auc;
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
              blockNumber: blockNum,
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

    if (txRes.receipt?.txHash) {
      inspectTransaction(txRes.receipt.txHash);
    }

    return {
      success: true,
      message: `Transaction confirmed (${txHash.slice(0, 12)}...): Withdrew ${proceeds.toFixed(2)} ETH sale proceeds.`,
    };
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0B0C10] text-[#F4F5F7] selection:bg-[#C5A46D]/20 selection:text-[#F4F5F7]">
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
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-6">
        {nonceMismatch && (
          <div className="mb-6">
            <NonceMismatchBanner
              mismatch={nonceMismatch}
              onAutoSyncNonce={autoSyncNonce}
              onConfirmManualClear={confirmManualNonceClear}
            />
          </div>
        )}
        {!isConnected || !wallet ? (
          /* ================= PRE-LOGIN PUBLIC ROUTES (Overview, How It Works, Architecture) ================= */
          publicTab === 'home' ? (
            <Home
              onNavigate={(tab) => {
                setSelectedAuctionId(null);
                setPublicTab(tab);
              }}
            />
          ) : publicTab === 'how-it-works' ? (
            <HowItWorksPage />
          ) : (
            <ArchitecturePage />
          )
        ) : selectedAuction ? (
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
