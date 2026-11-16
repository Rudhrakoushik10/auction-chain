/**
 * AuctionChain — AI-Valued Blockchain Vehicle Auction Platform
 * Hardhat Localhost (Chain ID: 31337)
 */

import React, { useState } from 'react';
import { ethers } from 'ethers';
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
import { AuctionItem } from './types/auction';
import {
  generateDeterministicTxHash,
  shortenAddress,
} from './lib/crypto';
import { SEALED_AUCTION_CONTRACT_ADDRESS } from './lib/hardhatConfig';
import { executeMetaMaskTransaction } from './services/blockchain/walletService';
import logoImg from './assets/images/auctionchain_logo.png';

const AUCTIONS_STORAGE_KEY = 'auctionchain_auctions_registry_v2';

function AuctionChainAppContent() {
  const {
    isConnected,
    wallet,
    refreshHardhatNode,
    resetBalances,
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

  // Ensure browser tab favicon always matches the header AuctionChain emblem
  React.useEffect(() => {
    const existingIcons = document.querySelectorAll<HTMLLinkElement>("link[rel*='icon']");
    if (existingIcons.length > 0) {
      existingIcons.forEach((link) => {
        link.type = 'image/png';
        link.href = logoImg;
      });
    } else {
      const link = document.createElement('link');
      link.rel = 'icon';
      link.type = 'image/png';
      link.href = logoImg;
      document.head.appendChild(link);
    }
  }, []);

  // Reset selected auction to null whenever the user switches accounts
  const prevWalletAddrRef = React.useRef<string | undefined>(wallet?.address);
  React.useEffect(() => {
    if (prevWalletAddrRef.current !== wallet?.address) {
      prevWalletAddrRef.current = wallet?.address;
      setSelectedAuctionId(null);
    }
  }, [wallet?.address]);

  React.useEffect(() => {
    try {
      localStorage.setItem(AUCTIONS_STORAGE_KEY, JSON.stringify(auctions));
    } catch {
      // ignore storage quota errors
    }
  }, [auctions]);

  // Automatically reveal bids when the bidding window countdown reaches zero
  React.useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setAuctions((prev) => {
        let changed = false;
        const next = prev.map((auc) => {
          if (auc.phase === 'Commit') {
            const deadline = new Date(auc.commitEndTime).getTime();
            if (Number.isFinite(deadline) && now >= deadline) {
              changed = true;
              return {
                ...auc,
                phase: 'Reveal' as const,
                commitments: auc.commitments.map((c) => ({
                  ...c,
                  revealed: true,
                })),
              };
            }
          }
          return auc;
        });
        return changed ? next : prev;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

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

  const handleDeleteAuction = (auctionId: string) => {
    setAuctions((prev) => prev.filter((a) => a.id !== auctionId));
    if (selectedAuctionId === auctionId) {
      setSelectedAuctionId(null);
    }
  };

  const handleResetAllData = () => {
    setAuctions([]);
    setSelectedAuctionId(null);
    localStorage.removeItem(AUCTIONS_STORAGE_KEY);
    resetBalances();
  };

  // Step 2: Bidder Places a Bid during the Bidding Window (No upfront deposit; bids hidden until window closes)
  const handlePlaceBid = async (
    auctionId: string,
    bidAmountEth: number
  ): Promise<{ success: boolean; message: string }> => {
    if (!wallet) {
      return { success: false, message: 'Please connect your wallet first.' };
    }

    const targetAuction = auctions.find((a) => a.id === auctionId);
    if (!targetAuction) {
      return { success: false, message: 'Auction not found.' };
    }

    if (targetAuction.phase !== 'Commit') {
      return {
        success: false,
        message: 'The bidding window for this auction has already closed.',
      };
    }

    if (bidAmountEth < targetAuction.startingBidEth) {
      return {
        success: false,
        message: `Bid amount (${bidAmountEth} ETH) must be at least the starting price (${targetAuction.startingBidEth} ETH).`,
      };
    }

    const existingBid = targetAuction.commitments.find(
      (c) => c.bidderAddress.toLowerCase() === wallet.address.toLowerCase()
    );
    if (existingBid && existingBid.revealedAmountEth && bidAmountEth <= existingBid.revealedAmountEth) {
      return {
        success: false,
        message: `Your new bid must be higher than your previous bid of ${existingBid.revealedAmountEth.toFixed(4)} ETH.`,
      };
    }

    const bidWei = ethers.parseEther(bidAmountEth.toFixed(6));

    const txRes = await executeMetaMaskTransaction({
      senderAddress: wallet.address,
      toAddress: SEALED_AUCTION_CONTRACT_ADDRESS,
      valueEth: 0,
      contractMethod: 'revealBid',
      contractArgs: [BigInt(targetAuction.numericId || 1), bidWei, ethers.ZeroHash],
      actionName: 'Auction.placeBid(uint256,uint256)',
      summary: `${wallet.label} submitted bid on Lot #${targetAuction.numericId} (hidden until window ends)`,
    });

    if (!txRes.success) {
      return {
        success: false,
        message: txRes.error || 'Transaction was rejected in MetaMask.',
      };
    }

    await refreshHardhatNode();

    const txHash =
      txRes.receipt?.txHash ||
      generateDeterministicTxHash(`BID:${auctionId}:${wallet.address}:${bidAmountEth}`);
    const blockNum = txRes.receipt?.blockNumber || 1;
    const nowIso = new Date().toISOString();
    const nowSec = Math.floor(Date.now() / 1000);

    setAuctions((prev) =>
      prev.map((auc) => {
        if (auc.id !== auctionId) return auc;

        const hasExisting = auc.commitments.some(
          (c) => c.bidderAddress.toLowerCase() === wallet.address.toLowerCase()
        );

        const updatedCommitments = hasExisting
          ? auc.commitments.map((c) =>
              c.bidderAddress.toLowerCase() === wallet.address.toLowerCase()
                ? {
                    ...c,
                    committedAt: nowIso,
                    committedTimestamp: nowSec,
                    blockNumber: blockNum,
                    txHash,
                    revealedAmountEth: bidAmountEth,
                    revealedAt: nowIso,
                    revealTxHash: txHash,
                  }
                : c
            )
          : [
              ...auc.commitments,
              {
                id: `BID-${auc.numericId}-${auc.commitments.length + 1}`,
                auctionId: auc.id,
                numericAuctionId: auc.numericId,
                bidderAddress: wallet.address,
                bidderEns: wallet.ens,
                commitmentHash: txHash,
                depositEth: 0,
                committedAt: nowIso,
                committedTimestamp: nowSec,
                blockNumber: blockNum,
                txHash,
                revealed: false,
                revealedAmountEth: bidAmountEth,
                revealedAt: nowIso,
                revealTxHash: txHash,
                depositRefunded: true,
              },
            ];

        // Recompute highest bid across all submitted bids (earliest bid wins ties)
        let currentHighest = 0;
        let currentWinnerAddr: string | undefined = undefined;
        let currentWinnerEns: string | undefined = undefined;
        let earliestWinTime = Number.MAX_SAFE_INTEGER;

        for (const c of updatedCommitments) {
          const amt = c.revealedAmountEth || 0;
          if (
            amt > currentHighest ||
            (amt === currentHighest && amt > 0 && c.committedTimestamp < earliestWinTime)
          ) {
            currentHighest = amt;
            currentWinnerAddr = c.bidderAddress;
            currentWinnerEns = c.bidderEns;
            earliestWinTime = c.committedTimestamp;
          }
        }

        return {
          ...auc,
          highestBidEth: currentHighest > 0 ? currentHighest : undefined,
          winningBidderAddress: currentWinnerAddr,
          winningBidderEns: currentWinnerEns,
          commitments: updatedCommitments,
          events: [
            ...auc.events,
            {
              id: `EVT-${auc.numericId}-${auc.events.length + 1}`,
              eventName: 'BidCommitted',
              txHash,
              blockNumber: blockNum,
              timestamp: nowIso,
              actorAddress: wallet.address,
              summary: `${wallet.label} placed a sealed bid on Lot #${auc.numericId}`,
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
      message: `Bid of ${bidAmountEth.toFixed(4)} ETH recorded on-chain (${txHash.slice(0, 10)}...). All bids will be revealed when the bidding window closes.`,
    };
  };

  // Step 3A: Close Bidding Window Early (Seller can close window immediately to reveal all bids)
  const handleCloseBiddingWindow = (auctionId: string) => {
    const nowIso = new Date().toISOString();
    setAuctions((prev) =>
      prev.map((auc) => {
        if (auc.id !== auctionId || auc.phase !== 'Commit') return auc;
        return {
          ...auc,
          phase: 'Reveal',
          commitEndTime: nowIso,
          commitments: auc.commitments.map((c) => ({
            ...c,
            revealed: true,
          })),
        };
      })
    );
  };

  // Step 3B: Seller Approves Highest Bid (or closes auction if no bids were placed)
  const handleApproveHighestBid = async (
    auctionId: string
  ): Promise<{ success: boolean; message: string }> => {
    if (!wallet || wallet.role !== 'seller') {
      return {
        success: false,
        message: 'Only the Vehicle Seller account can approve the winning bid.',
      };
    }

    const targetAuction = auctions.find((a) => a.id === auctionId);
    if (!targetAuction) {
      return { success: false, message: 'Auction not found.' };
    }

    const senderAddr = wallet.address;
    const highest = targetAuction.highestBidEth || 0;
    const hasWinner = highest >= targetAuction.startingBidEth && Boolean(targetAuction.winningBidderAddress);
    const newPhase = hasWinner ? 'Sold' : 'No Sale';

    const txRes = await executeMetaMaskTransaction({
      senderAddress: senderAddr,
      toAddress: SEALED_AUCTION_CONTRACT_ADDRESS,
      valueEth: 0,
      contractMethod: 'finalizeAuction',
      contractArgs: [BigInt(targetAuction.numericId || 1)],
      actionName: 'Auction.finalizeAuction(uint256)',
      summary: hasWinner
        ? `Seller approved highest bid of ${highest.toFixed(4)} ETH from ${shortenAddress(targetAuction.winningBidderAddress || '')} on Lot #${targetAuction.numericId}`
        : `Seller closed Lot #${targetAuction.numericId} with no bids`,
    });

    if (!txRes.success) {
      return {
        success: false,
        message: txRes.error || 'Transaction was rejected in MetaMask.',
      };
    }

    await refreshHardhatNode();

    const txHash =
      txRes.receipt?.txHash || generateDeterministicTxHash(`APPROVE:${auctionId}:${newPhase}`);
    const blockNum = txRes.receipt?.blockNumber || 1;
    const nowIso = new Date().toISOString();

    setAuctions((prev) =>
      prev.map((auc) => {
        if (auc.id !== auctionId) return auc;
        return {
          ...auc,
          phase: newPhase,
          finalizedAt: nowIso,
          finalizedTxHash: txHash,
          commitments: auc.commitments.map((c) => ({
            ...c,
            revealed: true,
          })),
          events: [
            ...auc.events,
            {
              id: `EVT-${auc.numericId}-${auc.events.length + 1}`,
              eventName: 'AuctionFinalized',
              txHash,
              blockNumber: blockNum,
              timestamp: nowIso,
              actorAddress: senderAddr,
              summary: hasWinner
                ? `Seller approved highest bid of ${highest.toFixed(4)} ETH by ${shortenAddress(
                    auc.winningBidderAddress || ''
                  )}`
                : `Auction #${auc.numericId} closed with no bids`,
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
      message: hasWinner
        ? `Highest bid (${highest.toFixed(4)} ETH) approved! The selected bidder can now complete payment.`
        : `Auction closed with no bids.`,
    };
  };

  // Step 4: Selected Winning Bidder Pays Full Winning Bid & Completes Auction
  const handlePayWinningBid = async (
    auctionId: string
  ): Promise<{ success: boolean; message: string }> => {
    if (!wallet) {
      return { success: false, message: 'Please connect your wallet first.' };
    }
    const targetAuction = auctions.find((a) => a.id === auctionId);
    if (!targetAuction) {
      return { success: false, message: 'Auction not found.' };
    }

    const amountEth = targetAuction.highestBidEth || targetAuction.startingBidEth;

    const txRes = await executeMetaMaskTransaction({
      senderAddress: wallet.address,
      toAddress: SEALED_AUCTION_CONTRACT_ADDRESS,
      valueEth: amountEth,
      autoCreditSellerAddress: targetAuction.sellerAddress,
      contractMethod: 'settleWinnerPayment',
      contractArgs: [BigInt(targetAuction.numericId || 1)],
      actionName: 'Auction.settleWinnerPayment(uint256) payable',
      summary: `Winner (${wallet.label}) paid ${amountEth.toFixed(4)} ETH to Seller (${shortenAddress(targetAuction.sellerAddress)}) and closed Lot #${targetAuction.numericId}`,
    });

    if (!txRes.success) {
      return {
        success: false,
        message: txRes.error || 'Transaction was rejected in MetaMask.',
      };
    }

    await refreshHardhatNode();

    const txHash =
      txRes.receipt?.txHash || generateDeterministicTxHash(`SETTLE:${auctionId}:${wallet.address}`);
    const blockNum = txRes.receipt?.blockNumber || 1;
    const nowIso = new Date().toISOString();

    setAuctions((prev) =>
      prev.map((auc) => {
        if (auc.id !== auctionId) return auc;
        return {
          ...auc,
          winnerSettled: true,
          settlementTxHash: txHash,
          sellerWithdrawn: true,
          sellerWithdrawTxHash: txHash,
          events: [
            ...auc.events,
            {
              id: `EVT-${auc.numericId}-${auc.events.length + 1}`,
              eventName: 'WinnerSettled',
              txHash,
              blockNumber: blockNum,
              timestamp: nowIso,
              actorAddress: wallet.address,
              summary: `Winner (${wallet.label}) paid ${amountEth.toFixed(
                4
              )} ETH to Seller and completed the auction`,
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
      message: `Payment of ${amountEth.toFixed(4)} ETH confirmed (${txHash.slice(0, 10)}...)! Funds transferred to Seller and auction is now closed.`,
    };
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0B0C10] text-[#F4F5F7] selection:bg-[#C5A46D]/20 selection:text-[#F4F5F7]">
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

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-6">
        {!isConnected || !wallet ? (
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
            onPlaceBid={handlePlaceBid}
            onCloseBiddingWindow={handleCloseBiddingWindow}
            onApproveHighestBid={handleApproveHighestBid}
            onPayWinningBid={handlePayWinningBid}
          />
        ) : wallet.role === 'seller' ? (
          <SellerDashboard
            auctions={auctions}
            onSelectAuction={handleSelectAuction}
            onCreateAuction={handleCreateAuction}
            onCloseBiddingWindow={handleCloseBiddingWindow}
            onApproveHighestBid={handleApproveHighestBid}
          />
        ) : wallet.role === 'bidder' ? (
          <BidderDashboard
            auctions={auctions}
            onSelectAuction={handleSelectAuction}
            onPayWinningBid={handlePayWinningBid}
          />
        ) : wallet.role === 'admin' ? (
          <AdminDashboard
            auctions={auctions}
            onSelectAuction={handleSelectAuction}
            onDeleteAuction={handleDeleteAuction}
            onResetAllData={handleResetAllData}
          />
        ) : (
          <div className="p-8 text-center text-xs text-slate-400">
            Role not recognized. Please switch account.
          </div>
        )}
      </main>

      <Footer
        onNavigatePublic={(tab) => {
          setSelectedAuctionId(null);
          setPublicTab(tab);
        }}
      />

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
