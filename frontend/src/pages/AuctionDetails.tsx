import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Lock,
  Eye,
  CheckCircle2,
  XCircle,
  Download,
  Upload,
  ShieldAlert,
  ShieldCheck,
  Terminal,
  Coins,
  FastForward,
  Copy,
  Check,
  FileJson,
  Award,
  RefreshCw,
} from 'lucide-react';
import {
  AuctionItem,
  LocalRevealBackupSecret,
} from '../types/auction';
import { useWallet } from '../context/WalletContext';
import { PredictionWidget } from '../components/prediction/PredictionWidget';
import {
  computeCommitmentHash,
  generateRandomSalt,
  formatInr,
  shortenAddress,
} from '../lib/crypto';

interface AuctionDetailsProps {
  auction: AuctionItem;
  onBack: () => void;
  onCommitBid: (
    auctionId: string,
    commitmentHash: string,
    secretBackup: LocalRevealBackupSecret
  ) => void;
  onRevealBid: (auctionId: string, bidAmountEth: number, salt: string) => {
    success: boolean;
    message: string;
  };
  onFinalizeAuction: (auctionId: string) => void;
  onAdvancePhaseDemo: (auctionId: string) => void;
  onSettleWinner: (auctionId: string) => void;
  onClaimRefund: (auctionId: string) => void;
  onWithdrawProceeds: (auctionId: string) => void;
  savedSecrets: LocalRevealBackupSecret[];
}

export const AuctionDetails: React.FC<AuctionDetailsProps> = ({
  auction,
  onBack,
  onCommitBid,
  onRevealBid,
  onFinalizeAuction,
  onAdvancePhaseDemo,
  onSettleWinner,
  onClaimRefund,
  onWithdrawProceeds,
  savedSecrets,
}) => {
  const {
    isConnected,
    wallet,
    isCorrectNetwork,
    openAuthModal,
    switchNetworkToHardhat,
  } = useWallet();

  // Commit Phase State
  const [bidAmountEth, setBidAmountEth] = useState<string>(
    (auction.startingBidEth + 0.15).toFixed(2)
  );
  const [salt, setSalt] = useState<string>(() => generateRandomSalt());
  const [computedHash, setComputedHash] = useState<string>('');
  const [backupSavedAck, setBackupSavedAck] = useState<boolean>(false);
  const [copiedSalt, setCopiedSalt] = useState<boolean>(false);
  const [actionFeedback, setActionFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Reveal Phase State
  const [revealBidInput, setRevealBidInput] = useState<string>('');
  const [revealSaltInput, setRevealSaltInput] = useState<string>('');

  // Recompute commitment hash whenever inputs change:
  // keccak256(abi.encode(auctionId, bidderAddress, bidAmount, salt))
  useEffect(() => {
    let active = true;
    const addr = wallet?.address || '0x0000000000000000000000000000000000000000';
    computeCommitmentHash(auction.numericId, addr, bidAmountEth || '0', salt).then((hash) => {
      if (active) setComputedHash(hash);
    });
    return () => {
      active = false;
    };
  }, [auction.numericId, wallet?.address, bidAmountEth, salt]);

  // Auto-populate reveal fields if a matching secret is stored in local vault for this wallet + auction
  useEffect(() => {
    if (!wallet) return;
    const match = savedSecrets.find(
      (s) =>
        s.auctionId === auction.id &&
        s.bidderAddress.toLowerCase() === wallet.address.toLowerCase()
    );
    if (match) {
      setRevealBidInput(match.bidAmountEth);
      setRevealSaltInput(match.salt);
    }
  }, [auction.id, wallet, savedSecrets]);

  const isSeller =
    isConnected &&
    wallet &&
    wallet.address.toLowerCase() === auction.sellerAddress.toLowerCase();

  const myCommitment =
    isConnected && wallet
      ? auction.commitments.find(
          (c) => c.bidderAddress.toLowerCase() === wallet.address.toLowerCase()
        )
      : undefined;

  // Download .json Reveal Backup (FR-12)
  const handleDownloadRevealJson = () => {
    if (!wallet) return;
    const payload: LocalRevealBackupSecret = {
      platform: 'AuctionChain',
      chainId: 31337,
      auctionId: auction.id,
      numericAuctionId: auction.numericId,
      auctionTitle: auction.title,
      bidderAddress: wallet.address,
      bidAmountEth: bidAmountEth,
      salt: salt,
      commitmentHash: computedHash,
      fixedDepositEth: auction.fixedDepositEth,
      createdAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `auctionchain-reveal-backup-${auction.id}-${wallet.address.slice(0, 6)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setBackupSavedAck(true);
  };

  // Import .json Reveal Backup File (PRD §8.5)
  const handleImportRevealJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    setActionFeedback(null);
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const parsed = JSON.parse(String(evt.target?.result || '{}')) as LocalRevealBackupSecret;
        if (parsed.auctionId && parsed.auctionId !== auction.id) {
          setActionFeedback({
            type: 'error',
            text: `Auction ID Mismatch: Backup file is for ${parsed.auctionId}, but you are viewing ${auction.id}.`,
          });
          return;
        }
        if (
          wallet &&
          parsed.bidderAddress &&
          parsed.bidderAddress.toLowerCase() !== wallet.address.toLowerCase()
        ) {
          setActionFeedback({
            type: 'error',
            text: `Wallet Mismatch (FR-15): Backup belongs to ${shortenAddress(
              parsed.bidderAddress
            )}, but active wallet is ${shortenAddress(wallet.address)}. Switch wallets in the header first.`,
          });
          return;
        }
        setRevealBidInput(String(parsed.bidAmountEth || ''));
        setRevealSaltInput(String(parsed.salt || ''));
        setActionFeedback({
          type: 'success',
          text: 'Reveal backup JSON verified and loaded. Click "Verify & Reveal Bid on SealedAuction.sol" below.',
        });
      } catch {
        setActionFeedback({
          type: 'error',
          text: 'Invalid JSON reveal backup file format.',
        });
      }
    };
    reader.readAsText(file);
  };

  const handleCommitSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setActionFeedback(null);
    if (!wallet) return;

    if (isSeller) {
      setActionFeedback({
        type: 'error',
        text: 'Smart Contract Revert (FR-10): SellerCannotBidOnOwnAuction(). Switch to Account 2 (Bidder 1) or Account 3 (Bidder 2).',
      });
      return;
    }

    const numericBid = Number(bidAmountEth);
    if (Number.isNaN(numericBid) || numericBid < auction.startingBidEth) {
      setActionFeedback({
        type: 'error',
        text: `Bid amount must be at least the starting bid of ${auction.startingBidEth.toFixed(2)} ETH.`,
      });
      return;
    }

    if (!backupSavedAck) {
      setActionFeedback({
        type: 'error',
        text: 'Please download or acknowledge saving your secret salt before committing (FR-12).',
      });
      return;
    }

    const secretObj: LocalRevealBackupSecret = {
      platform: 'AuctionChain',
      chainId: 31337,
      auctionId: auction.id,
      numericAuctionId: auction.numericId,
      auctionTitle: auction.title,
      bidderAddress: wallet.address,
      bidAmountEth: bidAmountEth,
      salt: salt,
      commitmentHash: computedHash,
      fixedDepositEth: auction.fixedDepositEth,
      createdAt: new Date().toISOString(),
    };

    onCommitBid(auction.id, computedHash, secretObj);
    setActionFeedback({
      type: 'success',
      text: `Sealed commitment ${computedHash.slice(0, 14)}... submitted with ${auction.fixedDepositEth.toFixed(
        2
      )} ETH fixed deposit!`,
    });
  };

  const handleRevealSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setActionFeedback(null);
    const numBid = Number(revealBidInput);
    if (Number.isNaN(numBid) || numBid <= 0 || !revealSaltInput.trim()) {
      setActionFeedback({
        type: 'error',
        text: 'Please provide both your original ETH bid amount and 32-byte hex salt.',
      });
      return;
    }

    const result = onRevealBid(auction.id, numBid, revealSaltInput.trim());
    setActionFeedback({
      type: result.success ? 'success' : 'error',
      text: result.message,
    });
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Top Bar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-[#E2E8F0] text-xs font-bold text-[#101B3D] hover:bg-slate-50 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Auctions</span>
        </button>

        {/* Demo Phase Transition Helper for Live Evaluation */}
        {(auction.phase === 'Commit' || auction.phase === 'Reveal') && (
          <button
            onClick={() => onAdvancePhaseDemo(auction.id)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#6D28D9] hover:bg-purple-700 text-white text-xs font-bold shadow-sm cursor-pointer"
            title="Advance auction window timer for live commit-reveal-finalize demonstration"
          >
            <FastForward className="w-4 h-4" />
            <span>
              {auction.phase === 'Commit'
                ? 'Demo Control: Advance to Reveal Phase'
                : 'Demo Control: Advance Past Reveal Deadline & Finalize'}
            </span>
          </button>
        )}
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Product Details, AI Prediction in INR, & On-Chain Event Log */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-[#0F172A] rounded-2xl border border-[#1E293B] overflow-hidden shadow-xl">
            <div className="relative h-72 bg-[#090D1A]">
              <img
                src={auction.imageUrl}
                alt={auction.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-4 left-4 flex items-center gap-2">
                <span className="px-3 py-1 rounded-lg text-xs font-bold uppercase bg-[#090D1A]/90 text-white border border-[#1E293B] shadow">
                  Category: {auction.category}
                </span>
                <span className="px-3 py-1 rounded-lg text-xs font-mono font-bold bg-[#090D1A]/90 text-[#06B6D4] border border-[#1E293B]">
                  Auction #{auction.numericId} ({auction.id})
                </span>
              </div>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <h1 className="text-2xl font-extrabold text-white">{auction.title}</h1>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">{auction.subtitle}</p>
              </div>

              {/* Structured Category Attributes Grid */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">
                  Normalized Product Attributes (Hashed into PriceOracle.sol)
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {Object.entries(auction.attributes).map(([key, val]) => (
                    <div
                      key={key}
                      className="p-2.5 rounded-xl bg-[#131E3A] border border-[#1E293B]"
                    >
                      <div className="text-[10px] font-mono uppercase text-slate-400">{key}</div>
                      <div className="text-xs font-bold text-white mt-0.5">
                        {key === 'original_price_inr' ? formatInr(Number(val)) : String(val)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* AI Valuation & PriceOracle Record Widget (INR) */}
          <PredictionWidget prediction={auction.aiPrediction} />

          {/* On-Chain Event & Transaction History (FR-19) */}
          <div className="bg-[#0F172A] rounded-2xl border border-[#1E293B] p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Terminal className="w-4 h-4 text-[#3B82F6]" />
                <span>On-Chain Event Log & Transaction Proofs (FR-19)</span>
              </h3>
              <span className="text-xs font-mono text-slate-400">
                {auction.events.length} Events Emitted
              </span>
            </div>

            <div className="space-y-2.5">
              {auction.events.map((ev) => (
                <div
                  key={ev.id}
                  className="p-3.5 rounded-xl bg-[#131E3A] border border-[#1E293B] text-xs space-y-1"
                >
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="px-2 py-0.5 rounded font-mono font-bold bg-[#090D1A] text-[#06B6D4] border border-[#1E293B]">
                      {ev.eventName}
                    </span>
                    <span className="font-mono text-[11px] text-slate-400">
                      Block #{ev.blockNumber} · Tx: {shortenAddress(ev.txHash)}
                    </span>
                  </div>
                  <p className="text-slate-300 font-medium pt-1">{ev.summary}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: ETH Auction Terms & Interactive Commit / Reveal / Settlement Vault */}
        <div className="lg:col-span-5 space-y-6">
          {/* Auction Terms in Test ETH */}
          <div className="bg-[#101B3D] text-white rounded-2xl p-6 border border-white/10 shadow-xl space-y-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-wider text-[#06B6D4]">
                SealedAuction.sol Terms (Test ETH)
              </span>
              <span className="px-3 py-1 rounded-lg text-xs font-bold bg-[#2563EB] text-white">
                Phase: {auction.phase.toUpperCase()}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-white/10 border border-white/10">
                <div className="text-[10px] uppercase text-slate-300">Starting Bid</div>
                <div className="text-base font-mono font-extrabold text-white mt-0.5">
                  {auction.startingBidEth.toFixed(2)} ETH
                </div>
              </div>
              <div className="p-3 rounded-xl bg-white/10 border border-[#06B6D4]/40">
                <div className="text-[10px] uppercase text-[#06B6D4]">Reserve Price</div>
                <div className="text-base font-mono font-extrabold text-[#06B6D4] mt-0.5">
                  {auction.reservePriceEth.toFixed(2)} ETH
                </div>
              </div>
              <div className="p-3 rounded-xl bg-white/10 border border-white/10">
                <div className="text-[10px] uppercase text-slate-300">Fixed Deposit</div>
                <div className="text-base font-mono font-extrabold text-white mt-0.5">
                  {auction.fixedDepositEth.toFixed(2)} ETH
                </div>
              </div>
            </div>

            <div className="text-xs text-slate-300 space-y-1 pt-2 border-t border-white/10 font-mono">
              <div>Seller: {shortenAddress(auction.sellerAddress)} ({auction.sellerEns})</div>
              <div>Contract: {shortenAddress(auction.contractAddress)}</div>
              <div>
                Highest Revealed Bid:{' '}
                <strong className="text-[#06B6D4]">
                  {auction.highestBidEth ? `${auction.highestBidEth.toFixed(2)} ETH` : 'Hidden until Reveal'}
                </strong>
              </div>
            </div>
          </div>

          {actionFeedback && (
            <div
              className={`p-4 rounded-2xl border text-xs font-semibold flex items-start gap-2.5 ${
                actionFeedback.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}
            >
              {actionFeedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              ) : (
                <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              )}
              <span>{actionFeedback.text}</span>
            </div>
          )}

          {/* CASE 1: NOT CONNECTED (GUEST VIEW) */}
          {!isConnected && (
            <div className="bg-[#0F172A] rounded-2xl border border-[#1E293B] p-6 shadow-xl space-y-4 text-center">
              <Lock className="w-8 h-8 text-[#3B82F6] mx-auto" />
              <h3 className="text-base font-bold text-white">
                Connect Wallet to Participate
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Connect your MetaMask wallet or select a preconfigured role (Account 1 Admin, Account 2 Seller, Account 3 Bidder 1, or Account 4 Bidder 2) to commit sealed bids, reveal secret salts, or inspect private transactions.
              </p>
              <button
                type="button"
                onClick={openAuthModal}
                className="w-full py-3 rounded-xl bg-[#2563EB] hover:bg-blue-600 text-white text-xs font-bold shadow-md cursor-pointer transition-colors"
              >
                Connect Wallet to Participate
              </button>
            </div>
          )}

          {/* CASE 2: COMMIT PHASE PANEL (FR-10, FR-11, FR-12, FR-13) */}
          {isConnected && auction.phase === 'Commit' && (
            <div className="bg-[#0F172A] rounded-2xl border border-[#1E293B] p-6 shadow-xl space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Lock className="w-4 h-4 text-[#3B82F6]" />
                  <span>Phase 1: Commit Sealed Bid Hash</span>
                </h3>
                <span className="text-[11px] font-mono font-semibold text-[#A78BFA] bg-[#7C3AED]/20 px-2.5 py-0.5 rounded border border-[#7C3AED]/30">
                  Collateral: {auction.fixedDepositEth.toFixed(2)} ETH
                </span>
              </div>

              {isSeller && (
                <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-500/30 text-xs text-amber-300 font-medium">
                  <strong>Seller Self-Bid Restriction (FR-10):</strong> You are connected as Account 2 (Seller) of this auction. <code>SealedAuction.sol</code> blocks sellers from bidding on their own listings. Use the top-right Role Switcher to switch to <strong>Account 3 (Bidder 1)</strong> or <strong>Account 4 (Bidder 2)</strong>.
                </div>
              )}

              {myCommitment ? (
                <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/30 space-y-2 text-xs">
                  <div className="font-bold text-white flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Sealed Commitment Recorded On-Chain (1 Commit Per Bidder Rule)</span>
                  </div>
                  <div className="font-mono text-[11px] text-emerald-300 break-all">
                    Commitment Hash: {myCommitment.commitmentHash}
                  </div>
                  <div className="text-slate-300">
                    Collateral Locked: <strong className="text-emerald-400">{myCommitment.depositEth.toFixed(2)} ETH</strong>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleCommitSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Hidden True Bid Amount (Test ETH, min {auction.startingBidEth.toFixed(2)} ETH)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={bidAmountEth}
                      onChange={(e) => setBidAmountEth(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#1E293B] bg-[#131E3A] font-mono text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-[#2563EB]/40"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-slate-300">
                        Cryptographic 32-Byte Random Salt
                      </label>
                      <button
                        type="button"
                        onClick={() => setSalt(generateRandomSalt())}
                        className="text-[11px] font-semibold text-[#2563EB] hover:underline flex items-center gap-1"
                      >
                        <RefreshCw className="w-3 h-3" /> Regenerate
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        readOnly
                        value={salt}
                        className="flex-1 px-3 py-2 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] font-mono text-[11px] text-slate-700"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(salt);
                          setCopiedSalt(true);
                          setTimeout(() => setCopiedSalt(false), 1500);
                        }}
                        className="px-3 py-2 rounded-xl border border-[#E2E8F0] text-xs font-semibold text-[#101B3D] hover:bg-slate-50"
                      >
                        {copiedSalt ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-[#101B3D] text-white font-mono text-[11px] space-y-1">
                    <div className="text-[#06B6D4] font-semibold">
                      keccak256(abi.encode(auctionId, bidder, bidAmountWei, salt)):
                    </div>
                    <div className="break-all text-slate-200">{computedHash}</div>
                  </div>

                  {/* Mandatory Salt Backup Export & Acknowledgement (FR-12) */}
                  <div className="p-3.5 rounded-xl bg-purple-50/70 border border-[#6D28D9]/30 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-[#101B3D]">
                        Reveal Secret Backup (.json)
                      </span>
                      <button
                        type="button"
                        onClick={handleDownloadRevealJson}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#6D28D9] text-white text-xs font-bold hover:bg-purple-700 cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download Backup .json</span>
                      </button>
                    </div>

                    <label className="flex items-start gap-2 text-xs text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={backupSavedAck}
                        onChange={(e) => setBackupSavedAck(e.target.checked)}
                        className="mt-0.5 rounded border-slate-300"
                      />
                      <span>
                        I have downloaded or saved my bid amount and secret salt. I understand that unrevealed bids forfeit the{' '}
                        <strong>{auction.fixedDepositEth.toFixed(2)} ETH</strong> deposit.
                      </span>
                    </label>
                  </div>

                  {!isCorrectNetwork ? (
                    <button
                      type="button"
                      onClick={switchNetworkToHardhat}
                      className="w-full py-3 rounded-xl bg-amber-500 text-slate-950 text-xs font-bold"
                    >
                      Switch to Hardhat Chain ID 31337 to Commit
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={!backupSavedAck || Boolean(isSeller)}
                      className="w-full py-3 rounded-xl bg-[#2563EB] hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold shadow-md cursor-pointer"
                    >
                      Commit Sealed Hash + Lock {auction.fixedDepositEth.toFixed(2)} ETH Deposit
                    </button>
                  )}
                </form>
              )}
            </div>
          )}

          {/* CASE 3: REVEAL PHASE PANEL (FR-14 & FR-15) */}
          {isConnected && auction.phase === 'Reveal' && (
            <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-sm space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-[#101B3D] flex items-center gap-2">
                  <Eye className="w-4 h-4 text-[#6D28D9]" />
                  <span>Phase 2: Verify & Reveal Sealed Bid</span>
                </h3>
                <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#6D28D9]/10 text-[#6D28D9] text-xs font-bold cursor-pointer hover:bg-[#6D28D9]/20">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Import .json Backup</span>
                  <input
                    type="file"
                    accept=".json,application/json"
                    onChange={handleImportRevealJson}
                    className="hidden"
                  />
                </label>
              </div>

              {myCommitment?.revealed ? (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs space-y-1.5">
                  <div className="font-bold text-emerald-900 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Your Bid Has Been Cryptographically Verified & Revealed!</span>
                  </div>
                  <div className="font-mono text-emerald-800">
                    Revealed Bid: <strong>{myCommitment.revealedAmountEth?.toFixed(2)} ETH</strong>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleRevealSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-[#101B3D] mb-1">
                      Original Committed Bid Amount (Test ETH)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={revealBidInput}
                      onChange={(e) => setRevealBidInput(e.target.value)}
                      placeholder="e.g., 1.25"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] font-mono text-sm font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#101B3D] mb-1">
                      Original 32-Byte Secret Salt (0x...)
                    </label>
                    <input
                      type="text"
                      value={revealSaltInput}
                      onChange={(e) => setRevealSaltInput(e.target.value)}
                      placeholder="0x..."
                      className="w-full px-3.5 py-2 rounded-xl border border-[#E2E8F0] font-mono text-xs"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl bg-[#6D28D9] hover:bg-purple-700 text-white text-xs font-bold shadow-md cursor-pointer"
                  >
                    Verify Hash & Reveal Bid on SealedAuction.sol
                  </button>
                </form>
              )}

              <div className="pt-3 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => onFinalizeAuction(auction.id)}
                  className="w-full py-2.5 rounded-xl bg-[#101B3D] hover:bg-slate-800 text-white text-xs font-bold cursor-pointer"
                >
                  Trigger finalizeAuction() & Resolve Reserve Check
                </button>
              </div>
            </div>
          )}

          {/* CASE 4: FINALIZED SOLD OR NO SALE SETTLEMENT PANEL (FR-16, FR-17, FR-18) */}
          {(auction.phase === 'Sold' || auction.phase === 'No Sale') && (
            <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-sm space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-[#101B3D] flex items-center gap-2">
                  <Award className="w-5 h-5 text-emerald-600" />
                  <span>
                    Finalized Outcome:{' '}
                    {auction.phase === 'Sold' ? 'SOLD (Reserve Met)' : 'NO SALE (Below Reserve)'}
                  </span>
                </h3>
              </div>

              {auction.phase === 'Sold' ? (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs space-y-1.5">
                  <div>
                    Winner:{' '}
                    <strong className="font-mono text-[#101B3D]">
                      {shortenAddress(auction.winningBidderAddress || '')} ({auction.winningBidderEns})
                    </strong>
                  </div>
                  <div>
                    Winning Bid:{' '}
                    <strong className="font-mono text-emerald-700 text-sm">
                      {auction.highestBidEth?.toFixed(2)} ETH
                    </strong>{' '}
                    (Reserve was {auction.reservePriceEth.toFixed(2)} ETH)
                  </div>
                  <div>
                    Settlement Status:{' '}
                    <strong>
                      {auction.winnerSettled
                        ? 'Winner Settled Full Bid'
                        : 'Awaiting Winner Settlement'}
                    </strong>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs space-y-1.5 text-amber-900">
                  <div className="font-bold">Reserve Price Not Reached — No Sale</div>
                  <p>
                    The highest revealed bid ({auction.highestBidEth?.toFixed(2) || '0.00'} ETH) was below the seller&apos;s reserve price of{' '}
                    <strong>{auction.reservePriceEth.toFixed(2)} ETH</strong>. All revealed bidders can claim a full pull-based deposit refund.
                  </p>
                </div>
              )}

              {/* Pull-Based Actions for Winner, Losing Revealed Bidders, and Seller */}
              {isConnected && wallet && (
                <div className="space-y-2.5">
                  {auction.phase === 'Sold' &&
                    !auction.winnerSettled &&
                    auction.winningBidderAddress?.toLowerCase() ===
                      wallet.address.toLowerCase() && (
                      <button
                        onClick={() => onSettleWinner(auction.id)}
                        className="w-full py-3 rounded-xl bg-[#2563EB] text-white text-xs font-bold shadow-md cursor-pointer"
                      >
                        Settle Winning Balance (
                        {((auction.highestBidEth || 0) - auction.fixedDepositEth).toFixed(2)} ETH +{' '}
                        {auction.fixedDepositEth.toFixed(2)} ETH Deposit Credit)
                      </button>
                    )}

                  {auction.phase === 'Sold' &&
                    auction.winnerSettled &&
                    !auction.sellerWithdrawn &&
                    isSeller && (
                      <button
                        onClick={() => onWithdrawProceeds(auction.id)}
                        className="w-full py-3 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-md cursor-pointer"
                      >
                        Pull-Based Seller Withdrawal: Claim {auction.highestBidEth?.toFixed(2)} ETH Proceeds
                      </button>
                    )}

                  {myCommitment &&
                    myCommitment.revealed &&
                    !myCommitment.depositRefunded &&
                    (auction.phase === 'No Sale' ||
                      auction.winningBidderAddress?.toLowerCase() !==
                        wallet.address.toLowerCase()) && (
                      <button
                        onClick={() => onClaimRefund(auction.id)}
                        className="w-full py-3 rounded-xl bg-[#6D28D9] text-white text-xs font-bold shadow-md cursor-pointer"
                      >
                        Claim Pull-Based Deposit Refund ({myCommitment.depositEth.toFixed(2)} ETH)
                      </button>
                    )}
                </div>
              )}
            </div>
          )}

          {/* Commitments Table */}
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-[#101B3D]">
              Recorded Commitments ({auction.commitments.length})
            </h3>
            {auction.commitments.length === 0 ? (
              <p className="text-xs text-slate-500">No commitments submitted yet.</p>
            ) : (
              <div className="space-y-2.5">
                {auction.commitments.map((c) => (
                  <div
                    key={c.id}
                    className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs flex items-center justify-between gap-2"
                  >
                    <div>
                      <div className="font-bold text-[#101B3D]">
                        {c.bidderEns} ({shortenAddress(c.bidderAddress)})
                      </div>
                      <div className="font-mono text-[11px] text-slate-500">
                        Hash: {c.commitmentHash.slice(0, 14)}...
                      </div>
                    </div>
                    <div className="text-right">
                      {c.revealed ? (
                        <span className="px-2.5 py-1 rounded-md font-mono font-bold bg-emerald-100 text-emerald-800">
                          Revealed: {c.revealedAmountEth?.toFixed(2)} ETH
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-md font-mono font-semibold bg-slate-200 text-slate-700">
                          Sealed ({c.depositEth.toFixed(2)} ETH locked)
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
