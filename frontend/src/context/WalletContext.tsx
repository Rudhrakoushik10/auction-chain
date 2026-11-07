import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
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
  connectMetaMaskWithEthers,
  requestSwitchToHardhatChain,
  promptMetaMaskAccountSwitch,
  findRoleAccountByAddress,
} from '../services/blockchain/walletService';

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
  isMetaMaskAvailable: boolean;
  mismatchInfo: WalletMismatchInfo | null;
  errorMessage: string | null;
  isConnecting: boolean;
  isAuthModalOpen: boolean;
  authorizedOracleAddress: string;
  oracleContractAddress: string;
  auctionContractAddress: string;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  clearMismatch: () => void;
  connectMetaMask: () => Promise<boolean>;
  selectRoleDirect: (targetAccount: WalletAccount) => Promise<boolean>;
  disconnectWallet: () => void;
  switchNetworkToHardhat: () => Promise<void>;
  requestAccountSwitchInMetaMask: () => Promise<void>;
  adjustBalance: (address: string, deltaEth: number) => void;
  updateAuthorizedOracle: (newOracleAddress: string) => boolean;
}

const WalletContext = createContext<WalletContextValue | undefined>(undefined);

const STORAGE_CONNECTED_KEY = 'auctionchain_wallet_connected_v3';
const STORAGE_ADDR_KEY = 'auctionchain_wallet_active_addr_v3';
const STORAGE_ORACLE_KEY = 'auctionchain_wallet_oracle_v3';

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [wallets, setWallets] = useState<WalletAccount[]>(HARDHAT_WALLETS);
  const [isConnected, setIsConnected] = useState<boolean>(() => {
    return localStorage.getItem(STORAGE_CONNECTED_KEY) === 'true';
  });
  const [activeAddress, setActiveAddress] = useState<string>(() => {
    return localStorage.getItem(STORAGE_ADDR_KEY) || HUMAN_ROLE_WALLETS[0].address;
  });
  const [chainId, setChainId] = useState<number>(HARDHAT_CHAIN_ID);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [mismatchInfo, setMismatchInfo] = useState<WalletMismatchInfo | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [isMetaMaskAvailable, setIsMetaMaskAvailable] = useState<boolean>(false);

  const [authorizedOracleAddress, setAuthorizedOracleAddress] = useState<string>(() => {
    return (
      localStorage.getItem(STORAGE_ORACLE_KEY) ||
      ORACLE_BACKGROUND_ACCOUNT.address
    );
  });

  const humanWallets = wallets.filter((w) => w.isHumanFacing);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_CONNECTED_KEY, String(isConnected));
    if (activeAddress) {
      localStorage.setItem(STORAGE_ADDR_KEY, activeAddress);
    }
  }, [isConnected, activeAddress]);

  // Check MetaMask availability and listen to events
  useEffect(() => {
    const metaMaskPresent = hasMetaMask();
    setIsMetaMaskAvailable(metaMaskPresent);

    if (metaMaskPresent && window.ethereum) {
      // Fetch initial chain ID
      window.ethereum
        .request({ method: 'eth_chainId' })
        .then((hexChain: string) => {
          setChainId(parseInt(hexChain, 16));
        })
        .catch(() => {});

      const handleAccountsChanged = (accounts: string[]) => {
        if (!accounts || accounts.length === 0) {
          // User disconnected in MetaMask
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
          } else if (newAddr.toLowerCase() === ORACLE_BACKGROUND_ACCOUNT.address.toLowerCase()) {
            setIsConnected(false);
            setErrorMessage('Connected account is the background Oracle service. Please switch to Account 1 (Admin), Account 2 (Seller), Account 3 (Bidder 1), or Account 4 (Bidder 2).');
          } else {
            // Unknown external address
            setIsConnected(false);
            setErrorMessage(`Wallet ${newAddr.slice(0, 6)}...${newAddr.slice(-4)} is not a preconfigured Hardhat account. Please switch to Account 0, 1, 2, or 3.`);
          }
        }
      };

      const handleChainChanged = (hexChain: string) => {
        const newChainId = parseInt(hexChain, 16);
        setChainId(newChainId);
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      return () => {
        if (window.ethereum.removeListener) {
          window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
          window.ethereum.removeListener('chainChanged', handleChainChanged);
        }
      };
    }
  }, []);

  const currentWallet = isConnected
    ? wallets.find((w) => w.address.toLowerCase() === activeAddress.toLowerCase()) || humanWallets[0]
    : null;

  const isCorrectNetwork = chainId === HARDHAT_CHAIN_ID;

  const openAuthModal = () => {
    setErrorMessage(null);
    setMismatchInfo(null);
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

  // Primary Connect MetaMask button action
  const connectMetaMask = useCallback(async (): Promise<boolean> => {
    setIsConnecting(true);
    setErrorMessage(null);
    setMismatchInfo(null);

    try {
      if (hasMetaMask()) {
        const res = await connectMetaMaskWithEthers();
        if (!res.success) {
          setErrorMessage(res.error || 'Connection failed.');
          setIsConnecting(false);
          return false;
        }

        if (res.isCorrectNetwork === false) {
          setChainId(res.chainId || 1);
        } else {
          setChainId(HARDHAT_CHAIN_ID);
        }

        if (res.account && res.account.isHumanFacing) {
          setActiveAddress(res.account.address);
          setIsConnected(true);
          setIsAuthModalOpen(false);
          setIsConnecting(false);
          return true;
        }

        if (res.isUnsupportedAccount) {
          setErrorMessage(res.error || 'Unsupported account.');
          setIsConnecting(false);
          return false;
        }
      } else {
        // Fallback for presentation environments without MetaMask extension
        const defaultRole = humanWallets[0];
        setActiveAddress(defaultRole.address);
        setIsConnected(true);
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
  }, [humanWallets]);

  // Direct Role Selection behavior (Sections 4 & 5)
  const selectRoleDirect = useCallback(
    async (targetAccount: WalletAccount): Promise<boolean> => {
      setIsConnecting(true);
      setErrorMessage(null);
      setMismatchInfo(null);

      try {
        if (hasMetaMask()) {
          // Check what account is actually connected in MetaMask
          const accounts: string[] = await window.ethereum.request({
            method: 'eth_accounts',
          });

          // If no account currently authorized, request access
          let connectedAddr = accounts && accounts.length > 0 ? accounts[0] : null;
          if (!connectedAddr) {
            const requested = await window.ethereum.request({
              method: 'eth_requestAccounts',
            });
            connectedAddr = requested && requested.length > 0 ? requested[0] : null;
          }

          if (connectedAddr) {
            const matchesTarget =
              connectedAddr.toLowerCase() === targetAccount.address.toLowerCase();

            if (matchesTarget) {
              // Address matches perfectly! Proceed to dashboard
              setActiveAddress(targetAccount.address);
              setIsConnected(true);
              setIsAuthModalOpen(false);
              setIsConnecting(false);
              return true;
            } else {
              // Mismatch: show expected role, expected address, and prompt to switch
              setMismatchInfo({
                expectedRole: targetAccount.roleTitle,
                expectedLabel: targetAccount.label,
                expectedAddress: targetAccount.address,
                connectedAddress: connectedAddr,
              });
              setIsConnecting(false);
              return false;
            }
          }
        }

        // If MetaMask is not installed or when user clicks without extension present,
        // activate the requested preconfigured role directly for reliable evaluation
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
    []
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
        isMetaMaskAvailable,
        mismatchInfo,
        errorMessage,
        isConnecting,
        isAuthModalOpen,
        authorizedOracleAddress,
        oracleContractAddress: PRICE_ORACLE_CONTRACT_ADDRESS,
        auctionContractAddress: SEALED_AUCTION_CONTRACT_ADDRESS,
        openAuthModal,
        closeAuthModal,
        clearMismatch,
        connectMetaMask,
        selectRoleDirect,
        disconnectWallet,
        switchNetworkToHardhat,
        requestAccountSwitchInMetaMask,
        adjustBalance,
        updateAuthorizedOracle,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error('useWallet must be used inside WalletProvider');
  return ctx;
};
