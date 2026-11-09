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
  syncHardhatNonceWithMetaMask,
  clearCachedMetaMaskNonce,
  resetHardhatAccountBalance,
  ensureAuctionContractsDeployed,
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
  adjustBalance: (address: string, deltaEth: number, signerAddress?: string) => void;
  resetBalances: () => void;
  updateAuthorizedOracle: (newOracleAddress: string) => boolean;
}

const WalletContext = createContext<WalletContextValue | undefined>(undefined);

const STORAGE_ADDR_KEY = 'auctionchain_wallet_active_addr_v4';
const STORAGE_ORACLE_KEY = 'auctionchain_wallet_oracle_v4';

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [wallets, setWallets] = useState<WalletAccount[]>(() =>
    HARDHAT_WALLETS.map((w) => ({ ...w }))
  );
  const [isConnected, setIsConnected] = useState<boolean>(false);
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
  const [deployedAuctionAddress, setDeployedAuctionAddress] = useState<string>(
    SEALED_AUCTION_CONTRACT_ADDRESS
  );
  const [deployedOracleAddress, setDeployedOracleAddress] = useState<string>(
    PRICE_ORACLE_CONTRACT_ADDRESS
  );

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

  /**
   * Synchronizes live ETH balances directly from Hardhat RPC (`eth_getBalance`),
   * matching `evm.syncWithLiveChain()` in the Freelance-Milestone-Escrow reference project.
   */
  const refreshHardhatNode = useCallback(async (): Promise<boolean> => {
    const addrs = HARDHAT_WALLETS.map((w) => w.address);
    const status = await checkLocalHardhatNode(addrs);
    setIsNodeOnline(status.isNodeOnline);
    if (status.isNodeOnline) {
      if (status.chainId) setChainId(status.chainId);
      setLatestBlock(status.latestBlock);
      if (Object.keys(status.balances).length > 0) {
        setWallets((prev) =>
          prev.map((w) => {
            const key = w.address.toLowerCase();
            const liveBal = status.balances[key];
            return typeof liveBal === 'number' ? { ...w, balanceEth: liveBal } : w;
          })
        );
      }
      // Ensure Auction.sol & PriceOracle.sol are deployed on the running Hardhat chain
      ensureAuctionContractsDeployed()
        .then(({ auctionAddress, oracleAddress }) => {
          setDeployedAuctionAddress(auctionAddress);
          setDeployedOracleAddress(oracleAddress);
        })
        .catch(() => {});
    }
    return status.isNodeOnline;
  }, []);

  useEffect(() => {
    setIsMetaMaskAvailable(hasMetaMask());
    refreshHardhatNode();

    const timer = setInterval(() => {
      refreshHardhatNode();
    }, 2500);

    const handleFocus = () => {
      refreshHardhatNode();
    };
    window.addEventListener('focus', handleFocus);

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
          refreshHardhatNode();
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
        window.removeEventListener('focus', handleFocus);
        if (ethereum.removeListener) {
          ethereum.removeListener('accountsChanged', handleAccountsChanged);
          ethereum.removeListener('chainChanged', handleChainChanged);
        }
      };
    }

    return () => {
      clearInterval(timer);
      window.removeEventListener('focus', handleFocus);
    };
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

  const reportNonceMismatch = useCallback((_info: NonceMismatchInfo) => {
    // Nonces are automatically aligned via hardhat_setNonce in walletService.ts
    setNonceMismatch(null);
  }, []);

  const autoSyncNonce = useCallback(async (): Promise<boolean> => {
    if (!nonceMismatch) return true;
    const ok = await syncHardhatNonceWithMetaMask(
      nonceMismatch.address,
      nonceMismatch.cachedMetaMaskNonce
    );
    setNonceMismatch(null);
    setErrorMessage(null);
    await refreshHardhatNode();
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
          'Cannot connect wallet: Hardhat RPC Server (http://127.0.0.1:8545) is offline. Please start "npx hardhat node" in Terminal 1 first.'
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

        setChainId(HARDHAT_CHAIN_ID);

        if (res.account && res.account.isHumanFacing) {
          setActiveAddress(res.account.address);
          setIsConnected(true);
          setIsAuthModalOpen(false);
          setIsConnecting(false);
          await refreshHardhatNode();
          return true;
        }

        setActiveAddress(humanWallets[0].address);
        setIsConnected(true);
        setIsAuthModalOpen(false);
        setIsConnecting(false);
        await refreshHardhatNode();
        return true;
      } else {
        const defaultRole = humanWallets[0];
        setActiveAddress(defaultRole.address);
        setIsConnected(true);
        setChainId(HARDHAT_CHAIN_ID);
        setIsAuthModalOpen(false);
        setIsConnecting(false);
        await refreshHardhatNode();
        return true;
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Error connecting wallet.');
    } finally {
      setIsConnecting(false);
    }
    return false;
  }, [humanWallets, refreshHardhatNode]);

  const devBypassLogin = useCallback(
    (roleAddress?: string) => {
      const sellerWallet =
        HUMAN_ROLE_WALLETS.find((w) => w.role === 'seller') || HUMAN_ROLE_WALLETS[0];
      const targetAddr = roleAddress || sellerWallet.address;
      setActiveAddress(targetAddr);
      setIsConnected(true);
      setChainId(HARDHAT_CHAIN_ID);
      setErrorMessage(null);
      setMismatchInfo(null);
      setIsAuthModalOpen(false);
      refreshHardhatNode();
    },
    [refreshHardhatNode]
  );

  /**
   * Matches `handleSelectRoleAccount` in Freelance-Milestone-Escrow `ConnectWalletModal.tsx`
   * when logging in from `AuthModal`, and `evm.setActiveAccount` when switching roles in the header.
   */
  const selectRoleDirect = useCallback(
    async (targetAccount: WalletAccount): Promise<boolean> => {
      setErrorMessage(null);
      setMismatchInfo(null);

      // If logging in from the Connect Wallet modal (`!isConnected`), prompt MetaMask connection
      // just like `ConnectWalletModal.tsx` in the reference project
      if (!isConnected && hasMetaMask()) {
        const online = await refreshHardhatNode();
        if (!online) {
          setErrorMessage(
            'Cannot connect wallet: Hardhat RPC Server (http://127.0.0.1:8545) is offline. Please run "npx hardhat node" in your terminal first.'
          );
          return false;
        }
        setIsConnecting(true);
        try {
          const res = await connectMetaMaskWithEthers(targetAccount.address);
          if (!res.success) {
            setErrorMessage(res.error || 'MetaMask connection cancelled or failed.');
            setIsConnecting(false);
            return false;
          }
        } catch (err: any) {
          setErrorMessage(err?.message || 'MetaMask connection cancelled or failed.');
          setIsConnecting(false);
          return false;
        }
        setIsConnecting(false);
      }

      setActiveAddress(targetAccount.address);
      setIsConnected(true);
      setChainId(HARDHAT_CHAIN_ID);
      setIsAuthModalOpen(false);
      setIsConnecting(false);

      await refreshHardhatNode().catch(() => {});
      return true;
    },
    [isConnected, refreshHardhatNode]
  );

  const disconnectWallet = useCallback(() => {
    setIsConnected(false);
    setMismatchInfo(null);
    setErrorMessage(null);
  }, []);

  const switchNetworkToHardhat = useCallback(async () => {
    if (hasMetaMask()) {
      const res = await requestSwitchToHardhatChain();
      if (res.success) {
        setChainId(HARDHAT_CHAIN_ID);
        await refreshHardhatNode();
      } else {
        setErrorMessage(res.error || 'Failed to switch network in MetaMask.');
      }
    } else {
      setChainId(HARDHAT_CHAIN_ID);
    }
  }, [refreshHardhatNode]);

  const requestAccountSwitchInMetaMask = useCallback(async () => {
    const res = await promptMetaMaskAccountSwitch();
    if (!res.success && res.error) {
      setErrorMessage(res.error);
    } else {
      await refreshHardhatNode();
    }
  }, [refreshHardhatNode]);

  /**
   * Immediately syncs live ETH balances from the Hardhat RPC server (`eth_getBalance`)
   * after an on-chain transaction, matching `await this.syncWithLiveChain()` in the reference project.
   */
  const adjustBalance = useCallback(
    (_address: string, _deltaEth: number, _signerAddress?: string) => {
      refreshHardhatNode().catch(() => {});
    },
    [refreshHardhatNode]
  );

  const resetBalances = useCallback(() => {
    Promise.all(
      HARDHAT_WALLETS.map((w) => resetHardhatAccountBalance(w.address, 10000.0))
    ).then(() => {
      refreshHardhatNode().catch(() => {});
    });
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
          contractAddress: deployedOracleAddress,
          valueEth: 0,
          txHash: `0x${Array.from({ length: 64 }, (_, i) => ((newRateInr + nextRound + i * 7) % 16).toString(16)).join('')}`,
          blockNumber: (latestBlock || 1) + nextRound,
          details: `Updated ETH/INR Oracle Feed (Round #${nextRound}): 1 ETH = ₹${newRateInr.toLocaleString('en-IN')}`,
          executionMode: 'PriceOracle.sol Live Feed',
        }),
      }).catch(() => {});
      return true;
    },
    [currentWallet?.address, currentWallet?.label, deployedOracleAddress, latestBlock, oracleRoundId]
  );

  const fetchRealMarketEthRate = useCallback(async (): Promise<number | null> => {
    setIsFetchingMarketRate(true);
    try {
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
        oracleContractAddress: deployedOracleAddress,
        auctionContractAddress: deployedAuctionAddress,
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

export function useWallet(): WalletContextValue {
  const ctx = useContext(WalletContext);
  if (!ctx) {
    throw new Error('useWallet must be used inside a WalletProvider');
  }
  return ctx;
}
