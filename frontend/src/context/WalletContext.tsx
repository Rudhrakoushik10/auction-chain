import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { WalletAccount } from '../types/auction';
import {
  HARDHAT_WALLETS,
  HUMAN_ROLE_WALLETS,
  ORACLE_BACKGROUND_ACCOUNT,
  HARDHAT_CHAIN_ID,
  PRICE_ORACLE_CONTRACT_ADDRESS,
  SEALED_AUCTION_CONTRACT_ADDRESS,
} from '../lib/hardhatConfig';
import {
  hasMetaMask,
  checkLocalHardhatNode,
  connectMetaMaskWithEthers,
  requestSwitchToHardhatChain,
  promptMetaMaskAccountSwitch,
  findRoleAccountByAddress,
  detectAccountNonceMismatch,
  syncHardhatNonceWithMetaMask,
  clearCachedMetaMaskNonce,
  setHardhatAccountBalance,
  NonceMismatchInfo,
} from '../services/blockchain/walletService';
import { TransactionReceiptModal } from '../components/common/TransactionReceiptModal';

export interface WalletMismatchInfo {
  expectedRole: string;
  expectedLabel: string;
  expectedAddress: string;
  connectedAddress: string;
}

interface WalletContextValue {
  isConnected: boolean;
  wallet: WalletAccount | null;
  humanWallets: WalletAccount[];
  allWallets: WalletAccount[];
  chainId: number;
  isCorrectNetwork: boolean;
  isNodeOnline: boolean;
  latestBlock: number | null;
  isMetaMaskAvailable: boolean;
  mismatchInfo: WalletMismatchInfo | null;
  nonceMismatch: NonceMismatchInfo | null;
  errorMessage: string | null;
  isConnecting: boolean;
  isAuthModalOpen: boolean;
  authorizedOracleAddress: string;
  oracleContractAddress: string;
  auctionContractAddress: string;
  liveEthInrRate: number;
  oracleRoundId: number;
  isFetchingMarketRate: boolean;
  marketRateSource: string | null;
  lastMarketFetchTime: number | null;
  isAutoMarketSync: boolean;
  fetchRealMarketEthRate: () => Promise<number | null>;
  toggleAutoMarketSync: (enabled: boolean) => void;
  updateLivePriceFeed: (newRateInr: number) => Promise<boolean>;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  clearMismatch: () => void;
  reportNonceMismatch: (info: NonceMismatchInfo) => void;
  autoSyncNonce: () => Promise<boolean>;
  confirmManualNonceClear: () => void;
  inspectTransaction: (txHash: string) => void;
  refreshHardhatNode: () => Promise<boolean>;
  connectMetaMask: () => Promise<boolean>;
  devBypassLogin: (roleAddress?: string) => void;
  selectRoleDirect: (targetAccount: WalletAccount) => Promise<boolean>;
  disconnectWallet: () => void;
  switchNetworkToHardhat: () => Promise<void>;
  requestAccountSwitchInMetaMask: () => Promise<void>;
  adjustBalance: (address: string, deltaEth: number) => void;
  resetBalances: () => void;
  updateAuthorizedOracle: (newOracleAddress: string) => boolean;
}

const WalletContext = createContext<WalletContextValue | undefined>(undefined);

const STORAGE_ADDR_KEY = 'auctionchain_wallet_active_addr_v4';
const STORAGE_ORACLE_KEY = 'auctionchain_wallet_oracle_v4';
const STORAGE_BALANCES_KEY = 'auctionchain_wallet_balances_v1';

function loadPersistedBalances(): Record<string, number> {
  try {
    const raw = localStorage.getItem(STORAGE_BALANCES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function savePersistedBalances(map: Record<string, number>): void {
  try {
    localStorage.setItem(STORAGE_BALANCES_KEY, JSON.stringify(map));
  } catch {
    // ignore storage errors
  }
}

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [wallets, setWallets] = useState<WalletAccount[]>(() => {
    const saved = loadPersistedBalances();
    return HARDHAT_WALLETS.map((w) => {
      const savedBal = saved[w.address.toLowerCase()];
      return typeof savedBal === 'number' ? { ...w, balanceEth: savedBal } : { ...w };
    });
  });
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isMetaMaskAuthorized, setIsMetaMaskAuthorized] = useState<boolean>(false);
  const [activeAddress, setActiveAddress] = useState<string>(() => {
    return localStorage.getItem(STORAGE_ADDR_KEY) || HUMAN_ROLE_WALLETS[0].address;
  });
  const [chainId, setChainId] = useState<number>(HARDHAT_CHAIN_ID);
  const [isNodeOnline, setIsNodeOnline] = useState<boolean>(true);
  const [latestBlock, setLatestBlock] = useState<number | null>(0);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [mismatchInfo, setMismatchInfo] = useState<WalletMismatchInfo | null>(null);
  const [nonceMismatch, setNonceMismatch] = useState<NonceMismatchInfo | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [isMetaMaskAvailable, setIsMetaMaskAvailable] = useState<boolean>(false);
  const [inspectedTxHash, setInspectedTxHash] = useState<string | null>(null);

  const [authorizedOracleAddress, setAuthorizedOracleAddress] = useState<string>(() => {
    return (
      localStorage.getItem(STORAGE_ORACLE_KEY) ||
      ORACLE_BACKGROUND_ACCOUNT.address
    );
  });

  const [liveEthInrRate, setLiveEthInrRate] = useState<number>(() => {
    const saved = localStorage.getItem('auctionchain_oracle_eth_inr_rate');
    return saved ? Number(saved) : 250000;
  });
  const [oracleRoundId, setOracleRoundId] = useState<number>(1);
  const [isFetchingMarketRate, setIsFetchingMarketRate] = useState<boolean>(false);
  const [marketRateSource, setMarketRateSource] = useState<string | null>(() => {
    return localStorage.getItem('auctionchain_oracle_market_source') || 'Initial Baseline';
  });
  const [lastMarketFetchTime, setLastMarketFetchTime] = useState<number | null>(() => {
    const s = localStorage.getItem('auctionchain_oracle_last_fetch');
    return s ? Number(s) : null;
  });
  const [isAutoMarketSync, setIsAutoMarketSync] = useState<boolean>(() => {
    return localStorage.getItem('auctionchain_oracle_auto_sync') === 'true';
  });

  const humanWallets = wallets.filter((w) => w.isHumanFacing);

  useEffect(() => {
    if (activeAddress) {
      localStorage.setItem(STORAGE_ADDR_KEY, activeAddress);
    }
  }, [activeAddress]);

  const refreshHardhatNode = useCallback(async (): Promise<boolean> => {
    const addrs = HARDHAT_WALLETS.map((w) => w.address);
    const status = await checkLocalHardhatNode(addrs);
    setIsNodeOnline(status.isNodeOnline);
    if (status.isNodeOnline) {
      if (status.chainId) setChainId(status.chainId);
      setLatestBlock(status.latestBlock);
      if (Object.keys(status.balances).length > 0) {
        const persisted = loadPersistedBalances();
        setWallets((prev) =>
          prev.map((w) => {
            const key = w.address.toLowerCase();
            const liveBal = status.balances[key];
            if (typeof persisted[key] === 'number') {
              // Only re-push the persisted balance to Hardhat if Hardhat was restarted (reset back to 10000 ETH)
              if (typeof liveBal === 'number' && liveBal >= 9999.99 && persisted[key] < 9999.99) {
                setHardhatAccountBalance(w.address, persisted[key]).catch(() => {});
              }
              return { ...w, balanceEth: persisted[key] };
            }
            return typeof liveBal === 'number' ? { ...w, balanceEth: liveBal } : w;
          })
        );
      }

      // Automatically synchronize Hardhat nonces (`hardhat_setNonce`) if Hardhat node was closed and reopened
      let unresolvedMismatch: NonceMismatchInfo | null = null;
      for (const w of HUMAN_ROLE_WALLETS) {
        const m = detectAccountNonceMismatch(w.address, status.nonces);
        if (m) {
          const synced = await syncHardhatNonceWithMetaMask(w.address, m.cachedMetaMaskNonce);
          if (!synced && !unresolvedMismatch) {
            unresolvedMismatch = m;
          }
        }
      }
      if (unresolvedMismatch) {
        setNonceMismatch(unresolvedMismatch);
      } else {
        setNonceMismatch(null);
      }
    }
    return status.isNodeOnline;
  }, [activeAddress]);

  useEffect(() => {
    setIsMetaMaskAvailable(hasMetaMask());
    refreshHardhatNode();

    const timer = setInterval(() => {
      refreshHardhatNode();
    }, 3000);

    const ethereum = typeof window !== 'undefined' ? (window as any).ethereum : null;
    if (ethereum && typeof ethereum.on === 'function') {
      const handleAccountsChanged = (accounts: string[]) => {
        if (!accounts || accounts.length === 0) {
          setIsConnected(false);
          setMismatchInfo(null);
        } else {
          const newAddr = accounts[0];
          const matched = findRoleAccountByAddress(newAddr);
          if (matched && matched.isHumanFacing) {
            setActiveAddress(matched.address);
            setIsConnected(true);
            setMismatchInfo(null);
            setErrorMessage(null);
          }
        }
      };

      const handleChainChanged = (hexChain: string) => {
        const parsed = parseInt(hexChain, 16);
        if (!isNaN(parsed)) {
          setChainId(parsed);
        }
        refreshHardhatNode();
      };

      ethereum.on('accountsChanged', handleAccountsChanged);
      ethereum.on('chainChanged', handleChainChanged);

      return () => {
        clearInterval(timer);
        if (ethereum.removeListener) {
          ethereum.removeListener('accountsChanged', handleAccountsChanged);
          ethereum.removeListener('chainChanged', handleChainChanged);
        }
      };
    }

    return () => clearInterval(timer);
  }, [refreshHardhatNode]);

  const currentWallet = isConnected
    ? wallets.find((w) => w.address.toLowerCase() === activeAddress.toLowerCase()) || humanWallets[0]
    : null;

  const isCorrectNetwork = chainId === HARDHAT_CHAIN_ID;

  const openAuthModal = () => {
    setErrorMessage(null);
    setMismatchInfo(null);
    refreshHardhatNode();
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
    setMismatchInfo(null);
    setErrorMessage(null);
  };

  const clearMismatch = () => {
    setMismatchInfo(null);
    setErrorMessage(null);
  };

  const reportNonceMismatch = useCallback((info: NonceMismatchInfo) => {
    setNonceMismatch(info);
  }, []);

  const autoSyncNonce = useCallback(async (): Promise<boolean> => {
    if (!nonceMismatch) return false;
    const ok = await syncHardhatNonceWithMetaMask(
      nonceMismatch.address,
      nonceMismatch.cachedMetaMaskNonce
    );
    if (ok) {
      setNonceMismatch(null);
      setErrorMessage(null);
      await refreshHardhatNode();
    }
    return ok;
  }, [nonceMismatch, refreshHardhatNode]);

  const confirmManualNonceClear = useCallback(() => {
    clearCachedMetaMaskNonce();
    setNonceMismatch(null);
    setErrorMessage(null);
    refreshHardhatNode();
  }, [refreshHardhatNode]);

  const inspectTransaction = useCallback((txHash: string) => {
    if (txHash) {
      setInspectedTxHash(txHash);
    }
  }, []);

  const connectMetaMask = useCallback(async (): Promise<boolean> => {
    setIsConnecting(true);
    setErrorMessage(null);
    setMismatchInfo(null);

    try {
      const online = await refreshHardhatNode();
      if (!online) {
        setErrorMessage(
          'Cannot connect wallet: Hardhat RPC Server (http://127.0.0.1:8545) is offline. Please start Terminal 1 (Hardhat Node) first.'
        );
        setIsConnecting(false);
        return false;
      }

      if (hasMetaMask()) {
        const res = await connectMetaMaskWithEthers();
        if (!res.success) {
          setErrorMessage(res.error || 'MetaMask connection cancelled or failed.');
          setIsConnecting(false);
          return false;
        }

        if (res.nonceMismatch) {
          setNonceMismatch(res.nonceMismatch);
        }

        setIsMetaMaskAuthorized(true);
        setChainId(HARDHAT_CHAIN_ID);

        if (res.account && res.account.isHumanFacing) {
          setActiveAddress(res.account.address);
          setIsConnected(true);
          if (!res.nonceMismatch) {
            setIsAuthModalOpen(false);
          }
          setIsConnecting(false);
          return true;
        }

        setActiveAddress(humanWallets[0].address);
        setIsConnected(true);
        setIsAuthModalOpen(false);
        setIsConnecting(false);
        return true;
      } else {
        const defaultRole = humanWallets[0];
        setActiveAddress(defaultRole.address);
        setIsConnected(true);
        setIsMetaMaskAuthorized(true);
        setChainId(HARDHAT_CHAIN_ID);
        setIsAuthModalOpen(false);
        setIsConnecting(false);
        return true;
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Error connecting wallet.');
    } finally {
      setIsConnecting(false);
    }
    return false;
  }, [humanWallets, refreshHardhatNode]);

  const devBypassLogin = useCallback((roleAddress?: string) => {
    const sellerWallet =
      HUMAN_ROLE_WALLETS.find((w) => w.role === 'seller') || HUMAN_ROLE_WALLETS[0];
    const targetAddr = roleAddress || sellerWallet.address;
    localStorage.setItem('auctionchain_bypass_mode_v1', 'true');
    setActiveAddress(targetAddr);
    setIsConnected(true);
    setIsMetaMaskAuthorized(true);
    setChainId(HARDHAT_CHAIN_ID);
    setErrorMessage(null);
    setMismatchInfo(null);
    setIsAuthModalOpen(false);
    // Refresh node status non-blockingly in background
    refreshHardhatNode();
  }, [refreshHardhatNode]);

  const selectRoleDirect = useCallback(
    async (targetAccount: WalletAccount): Promise<boolean> => {
      setErrorMessage(null);
      setMismatchInfo(null);

      // Immediately switch active signer role so bypass & role switching never hang or fail
      localStorage.setItem('auctionchain_bypass_mode_v1', 'true');
      setActiveAddress(targetAccount.address);
      setIsConnected(true);
      setIsMetaMaskAuthorized(true);
      setChainId(HARDHAT_CHAIN_ID);
      setIsAuthModalOpen(false);
      setIsConnecting(false);

      // Best-effort background refresh of Hardhat balances if local node is running
      refreshHardhatNode().catch(() => {});
      return true;
    },
    [refreshHardhatNode]
  );

  const disconnectWallet = useCallback(() => {
    localStorage.removeItem('auctionchain_bypass_mode_v1');
    setIsConnected(false);
    setIsMetaMaskAuthorized(false);
    setMismatchInfo(null);
    setErrorMessage(null);
  }, []);

  const switchNetworkToHardhat = useCallback(async () => {
    if (hasMetaMask()) {
      const res = await requestSwitchToHardhatChain();
      if (res.success) {
        setChainId(HARDHAT_CHAIN_ID);
      } else {
        setErrorMessage(res.error || 'Failed to switch network in MetaMask.');
      }
    } else {
      setChainId(HARDHAT_CHAIN_ID);
    }
  }, []);

  const requestAccountSwitchInMetaMask = useCallback(async () => {
    const res = await promptMetaMaskAccountSwitch();
    if (!res.success && res.error) {
      setErrorMessage(res.error);
    }
  }, []);

  const adjustBalance = useCallback((address: string, deltaEth: number) => {
    const key = address.toLowerCase();
    setWallets((prev) => {
      const persisted = loadPersistedBalances();
      const next = prev.map((w) => {
        if (w.address.toLowerCase() !== key) return w;
        const updatedBal = Number((w.balanceEth + deltaEth).toFixed(4));
        persisted[key] = updatedBal;
        setHardhatAccountBalance(w.address, updatedBal).catch(() => {});
        return { ...w, balanceEth: updatedBal };
      });
      savePersistedBalances(persisted);
      return next;
    });
  }, []);

  const resetBalances = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_BALANCES_KEY);
    } catch {
      // ignore
    }
    setWallets(HARDHAT_WALLETS.map((w) => ({ ...w })));
    HARDHAT_WALLETS.forEach((w) => {
      setHardhatAccountBalance(w.address, 10000.0).catch(() => {});
    });
    refreshHardhatNode().catch(() => {});
  }, [refreshHardhatNode]);

  const updateAuthorizedOracle = useCallback(
    (newOracleAddress: string): boolean => {
      if (!currentWallet || currentWallet.role !== 'admin') return false;
      setAuthorizedOracleAddress(newOracleAddress);
      localStorage.setItem(STORAGE_ORACLE_KEY, newOracleAddress);
      return true;
    },
    [currentWallet]
  );

  const updateLivePriceFeed = useCallback(
    async (newRateInr: number): Promise<boolean> => {
      if (newRateInr <= 0) return false;
      localStorage.setItem('auctionchain_oracle_eth_inr_rate', String(newRateInr));
      setLiveEthInrRate(newRateInr);
      const nextRound = oracleRoundId + 1;
      setOracleRoundId(nextRound);
      fetch('/api/audit/log-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: 'PRICE_ORACLE_FEED_UPDATE',
          action: 'PriceOracle.updateEthInrRate(uint256)',
          actorAddress: currentWallet?.address || ORACLE_BACKGROUND_ACCOUNT.address,
          actorLabel: currentWallet?.label || 'PriceOracle Service',
          contractAddress: PRICE_ORACLE_CONTRACT_ADDRESS,
          valueEth: 0,
          txHash: `0x${Array.from({ length: 64 }, (_, i) => ((newRateInr + nextRound + i * 7) % 16).toString(16)).join('')}`,
          blockNumber: (latestBlock || 4189200) + nextRound,
          details: `Updated ETH/INR Oracle Feed (Round #${nextRound}): 1 ETH = ₹${newRateInr.toLocaleString('en-IN')}`,
          executionMode: 'PriceOracle.sol Live Feed',
        }),
      }).catch(() => {});
      return true;
    },
    [currentWallet?.address, currentWallet?.label, latestBlock, oracleRoundId]
  );

  const fetchRealMarketEthRate = useCallback(async (): Promise<number | null> => {
    setIsFetchingMarketRate(true);
    try {
      // 1. Query CoinGecko free public API for live ETH/INR spot price
      const cgRes = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=inr',
        { headers: { Accept: 'application/json' } }
      );
      if (cgRes.ok) {
        const data = await cgRes.json();
        const price = data?.ethereum?.inr;
        if (typeof price === 'number' && price > 0) {
          const rounded = Math.round(price);
          await updateLivePriceFeed(rounded);
          setMarketRateSource('CoinGecko Spot API');
          setLastMarketFetchTime(Date.now());
          localStorage.setItem('auctionchain_oracle_market_source', 'CoinGecko Spot API');
          localStorage.setItem('auctionchain_oracle_last_fetch', String(Date.now()));
          setIsFetchingMarketRate(false);
          return rounded;
        }
      }
    } catch {
      // CoinGecko fallback
    }

    try {
      // 2. Fallback to Binance ETHUSDT * USD/INR (~87.5)
      const bRes = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=ETHUSDT');
      if (bRes.ok) {
        const bData = await bRes.json();
        const ethUsd = parseFloat(bData?.price);
        if (!isNaN(ethUsd) && ethUsd > 0) {
          const estimatedInr = Math.round(ethUsd * 87.5);
          await updateLivePriceFeed(estimatedInr);
          setMarketRateSource('Binance Spot API (Converted to INR)');
          setLastMarketFetchTime(Date.now());
          localStorage.setItem('auctionchain_oracle_market_source', 'Binance Spot API (Converted to INR)');
          localStorage.setItem('auctionchain_oracle_last_fetch', String(Date.now()));
          setIsFetchingMarketRate(false);
          return estimatedInr;
        }
      }
    } catch {
      // Both failed
    } finally {
      setIsFetchingMarketRate(false);
    }
    return null;
  }, [updateLivePriceFeed]);

  const toggleAutoMarketSync = useCallback((enabled: boolean) => {
    setIsAutoMarketSync(enabled);
    localStorage.setItem('auctionchain_oracle_auto_sync', enabled ? 'true' : 'false');
  }, []);

  // Periodic auto-sync if user enabled it
  useEffect(() => {
    if (!isAutoMarketSync) return;
    fetchRealMarketEthRate();
    const interval = setInterval(() => {
      fetchRealMarketEthRate();
    }, 60000);
    return () => clearInterval(interval);
  }, [isAutoMarketSync, fetchRealMarketEthRate]);

  return (
    <WalletContext.Provider
      value={{
        isConnected,
        wallet: currentWallet,
        humanWallets,
        allWallets: wallets,
        chainId,
        isCorrectNetwork,
        isNodeOnline,
        latestBlock,
        isMetaMaskAvailable,
        mismatchInfo,
        nonceMismatch,
        errorMessage,
        isConnecting,
        isAuthModalOpen,
        authorizedOracleAddress,
        oracleContractAddress: PRICE_ORACLE_CONTRACT_ADDRESS,
        auctionContractAddress: SEALED_AUCTION_CONTRACT_ADDRESS,
        liveEthInrRate,
        oracleRoundId,
        isFetchingMarketRate,
        marketRateSource,
        lastMarketFetchTime,
        isAutoMarketSync,
        fetchRealMarketEthRate,
        toggleAutoMarketSync,
        updateLivePriceFeed,
        openAuthModal,
        closeAuthModal,
        clearMismatch,
        reportNonceMismatch,
        autoSyncNonce,
        confirmManualNonceClear,
        inspectTransaction,
        refreshHardhatNode,
        connectMetaMask,
        devBypassLogin,
        selectRoleDirect,
        disconnectWallet,
        switchNetworkToHardhat,
        requestAccountSwitchInMetaMask,
        adjustBalance,
        resetBalances,
        updateAuthorizedOracle,
      }}
    >
      {children}
      <TransactionReceiptModal
        txHash={inspectedTxHash}
        onClose={() => setInspectedTxHash(null)}
      />
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error('useWallet must be used inside WalletProvider');
  return ctx;
};
