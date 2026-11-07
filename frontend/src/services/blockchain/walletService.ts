import { ethers } from 'ethers';
import { HARDHAT_WALLETS, HARDHAT_CHAIN_ID, HUMAN_ROLE_WALLETS, ORACLE_BACKGROUND_ACCOUNT } from '../../lib/hardhatConfig';
import { WalletAccount } from '../../types/auction';

declare global {
  interface Window {
    ethereum?: any;
  }
}

export interface MetaMaskConnectionResult {
  success: boolean;
  address?: string;
  account?: WalletAccount;
  chainId?: number;
  isCorrectNetwork?: boolean;
  error?: string;
  isUnsupportedAccount?: boolean;
}

/**
 * Checks if MetaMask / Ethereum provider is injected
 */
export function hasMetaMask(): boolean {
  return typeof window !== 'undefined' && Boolean(window.ethereum);
}

/**
 * Maps any Ethereum address to configured Hardhat role account
 */
export function findRoleAccountByAddress(address: string): WalletAccount | null {
  if (!address) return null;
  const normalized = address.toLowerCase();
  return HARDHAT_WALLETS.find((w) => w.address.toLowerCase() === normalized) || null;
}

/**
 * Gets human-facing preconfigured roles (Admin, Seller, Bidder 1, Bidder 2)
 * Excludes background Oracle account
 */
export function getHumanRoleWallets(): WalletAccount[] {
  return HUMAN_ROLE_WALLETS;
}

/**
 * Request MetaMask connection using Ethers.js v6 BrowserProvider
 */
export async function connectMetaMaskWithEthers(): Promise<MetaMaskConnectionResult> {
  if (!hasMetaMask()) {
    return {
      success: false,
      error: 'MetaMask is not detected in your browser. Install the MetaMask extension or select a preconfigured role card to continue.',
    };
  }

  try {
    const provider = new ethers.BrowserProvider(window.ethereum);
    // Request accounts using Ethers v6 / MetaMask RPC
    const accounts: string[] = await window.ethereum.request({
      method: 'eth_requestAccounts',
    });

    if (!accounts || accounts.length === 0) {
      return {
        success: false,
        error: 'No accounts granted. Please approve account access in MetaMask.',
      };
    }

    const network = await provider.getNetwork();
    const chainId = Number(network.chainId);
    const isCorrectNetwork = chainId === HARDHAT_CHAIN_ID;

    const connectedAddress = accounts[0];
    const roleAccount = findRoleAccountByAddress(connectedAddress);

    // If connected account is the background Oracle account
    if (connectedAddress.toLowerCase() === ORACLE_BACKGROUND_ACCOUNT.address.toLowerCase()) {
      return {
        success: false,
        address: connectedAddress,
        chainId,
        isCorrectNetwork,
        isUnsupportedAccount: true,
        error: 'The connected address is the background Oracle service account (Account 4 — 0x15d34...). The Oracle is an autonomous backend relayer and does not have a user-facing dashboard. Please switch to Account 0 (Admin), Account 1 (Seller), Account 2 (Bidder 1), or Account 3 (Bidder 2).',
      };
    }

    if (!roleAccount) {
      return {
        success: false,
        address: connectedAddress,
        chainId,
        isCorrectNetwork,
        isUnsupportedAccount: true,
        error: `Connected account (${connectedAddress.slice(0, 6)}...${connectedAddress.slice(-4)}) is not one of the preconfigured Hardhat accounts. Please switch to Account 0 (Admin), Account 1 (Seller), Account 2 (Bidder 1), or Account 3 (Bidder 2) in MetaMask.`,
      };
    }

    return {
      success: true,
      address: roleAccount.address,
      account: roleAccount,
      chainId,
      isCorrectNetwork,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Failed to connect MetaMask.',
    };
  }
}

/**
 * Prompts MetaMask to switch to or add Hardhat Localhost (Chain ID 31337)
 */
export async function requestSwitchToHardhatChain(): Promise<{ success: boolean; error?: string }> {
  if (!hasMetaMask()) {
    return { success: false, error: 'MetaMask extension not found.' };
  }

  const hardhatHexChainId = '0x7a69'; // 31337 in hex

  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: hardhatHexChainId }],
    });
    return { success: true };
  } catch (switchError: any) {
    // Error code 4902 indicates that the chain has not been added to MetaMask
    if (switchError.code === 4902 || switchError?.message?.includes('unrecognized')) {
      try {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: hardhatHexChainId,
              chainName: 'Hardhat Localhost',
              rpcUrls: ['http://127.0.0.1:8545'],
              nativeCurrency: {
                name: 'Test ETH',
                symbol: 'ETH',
                decimals: 18,
              },
            },
          ],
        });
        return { success: true };
      } catch (addError: any) {
        return { success: false, error: addError?.message || 'Failed to add Hardhat chain.' };
      }
    }
    return { success: false, error: switchError?.message || 'Failed to switch network.' };
  }
}

/**
 * Triggers MetaMask account chooser permissions request so user can switch accounts in MetaMask
 */
export async function promptMetaMaskAccountSwitch(): Promise<{ success: boolean; accounts?: string[]; error?: string }> {
  if (!hasMetaMask()) {
    return { success: false, error: 'MetaMask extension not available.' };
  }

  try {
    // Request permissions to trigger MetaMask account picker popup
    await window.ethereum.request({
      method: 'wallet_requestPermissions',
      params: [{ eth_accounts: {} }],
    });

    const accounts: string[] = await window.ethereum.request({
      method: 'eth_accounts',
    });

    return { success: true, accounts };
  } catch (err: any) {
    // If wallet_requestPermissions is not supported or cancelled, fallback to eth_requestAccounts
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      return { success: true, accounts };
    } catch (e: any) {
      return { success: false, error: e?.message || 'Account switch request cancelled.' };
    }
  }
}
