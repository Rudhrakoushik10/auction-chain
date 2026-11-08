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
  updateAuthorizedOracle: (newOracleAddress: string) => boolean;
}

const WalletContext = createContext<WalletContextValue | undefined>(undefined);

const STORAGE_ADDR_KEY = 'auctionchain_wallet_active_addr_v4';
const STORAGE_ORACLE_KEY = 'auctionchain_wallet_oracle_v4';

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [wallets, setWallets] = useState<WalletAccount[]>(HARDHAT_WALLETS);
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
        setWallets((prev) =>
          prev.map((w) => {
            const liveBal = status.balances[w.address.toLowerCase()];
            return typeof liveBal === 'number' ? { ...w, balanceEth: liveBal } : w;
          })
        );
      }

      // Check if any human role account or active account has a stale MetaMask nonce after Hardhat restart
      const activeMismatch = detectAccountNonceMismatch(activeAddress, status.nonces);
      if (activeMismatch) {
        setNonceMismatch(activeMismatch);
      } else {
        for (const w of HUMAN_ROLE_WALLETS) {
          const m = detectAccountNonceMismatch(w.address, status.nonces);
          if (m) {
            setNonceMismatch(m);
            break;
          }
        }
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
    const targetAddr = roleAddress || HUMAN_ROLE_WALLETS[0].address; // Default to Seller
    setActiveAddress(targetAddr);
    setIsConnected(true);
    setIsMetaMaskAuthorized(true);
    setChainId(HARDHAT_CHAIN_ID);
    setErrorMessage(null);
    setMismatchInfo(null);
    setIsAuthModalOpen(false);
  }, []);

  const selectRoleDirect = useCallback(
    async (targetAccount: WalletAccount): Promise<boolean> => {
      setIsConnecting(true);
      setErrorMessage(null);
      setMismatchInfo(null);

      try {
        const online = await refreshHardhatNode();
        if (!online) {
          setErrorMessage(
            'Cannot connect wallet: Hardhat RPC Server (http://127.0.0.1:8545) is closed/offline. Please start Terminal 1 (Hardhat Node) first.'
          );
          setIsConnecting(false);
          return false;
        }

        // Only prompt MetaMask authorization at initial connection (!isConnected && !isMetaMaskAuthorized).
        // When switching roles after initial connection, switch immediately without re-authorizing in MetaMask.
        if (hasMetaMask() && !isConnected && !isMetaMaskAuthorized) {
          const res = await connectMetaMaskWithEthers(targetAccount.address);
          if (!res.success) {
            setErrorMessage(res.error || 'MetaMask connection cancelled or failed.');
            setIsConnecting(false);
            return false;
          }
          if (res.nonceMismatch) {
            setNonceMismatch(res.nonceMismatch);
          }
          setIsMetaMaskAuthorized(true);
        }

        setActiveAddress(targetAccount.address);
        setIsConnected(true);
        setChainId(HARDHAT_CHAIN_ID);
        setIsAuthModalOpen(false);
        setIsConnecting(false);
        return true;
      } catch (err: any) {
        setErrorMessage(err?.message || 'Failed to select role.');
        setIsConnecting(false);
        return false;
      }
    },
    [isConnected, isMetaMaskAuthorized, refreshHardhatNode]
  );

  const disconnectWallet = useCallback(() => {
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
    setWallets((prev) =>
      prev.map((w) =>
        w.address.toLowerCase() === address.toLowerCase()
          ? { ...w, balanceEth: Number((w.balanceEth + deltaEth).toFixed(4)) }
          : w
      )
    );
  }, []);

  const updateAuthorizedOracle = useCallback(
    (newOracleAddress: string): boolean => {
      if (!currentWallet || currentWallet.role !== 'admin') return false;
      setAuthorizedOracleAddress(newOracleAddress);
      localStorage.setItem(STORAGE_ORACLE_KEY, newOracleAddress);
      return true;
    },
    [currentWallet]
  );

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
