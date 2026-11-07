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

export interface HardhatRpcStatus {
  isNodeOnline: boolean;
  chainId: number | null;
  latestBlock: number | null;
  balances: Record<string, number>;
}

const HARDHAT_RPC_URL = 'http://127.0.0.1:8545';

/**
 * Checks if an error thrown by MetaMask / Ethers v6 was caused by the user clicking Reject / Cancel.
 */
export function isUserRejection(err: any): boolean {
  if (!err) return false;
  const code = err?.code ?? err?.info?.error?.code ?? err?.error?.code;
  if (code === 4001 || code === 'ACTION_REJECTED') {
    return true;
  }
  const msg = String(err?.shortMessage || err?.reason || err?.message || '').toLowerCase();
  return (
    msg.includes('user rejected') ||
    msg.includes('user denied') ||
    msg.includes('rejected by user') ||
    msg.includes('action_rejected') ||
    msg.includes('request rejected')
  );
}

/**
 * Performs an uncached JSON-RPC ping to http://127.0.0.1:8545 and fetches live ETH balances
 * without touching window.ethereum on page load.
 */
export async function checkLocalHardhatNode(addresses: string[] = []): Promise<HardhatRpcStatus> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 1500);

  try {
    const response = await fetch(HARDHAT_RPC_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify([
        { jsonrpc: '2.0', method: 'eth_chainId', params: [], id: 1 },
        { jsonrpc: '2.0', method: 'eth_blockNumber', params: [], id: 2 },
      ]),
      cache: 'no-store',
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    const chainRes = Array.isArray(data) ? data.find((d: any) => d.id === 1) : data;
    const blockRes = Array.isArray(data) ? data.find((d: any) => d.id === 2) : null;

    const chainId = chainRes?.result ? parseInt(chainRes.result, 16) : HARDHAT_CHAIN_ID;
    const latestBlock = blockRes?.result ? parseInt(blockRes.result, 16) : 0;

    const balances: Record<string, number> = {};
    if (addresses.length > 0) {
      await Promise.all(
        addresses.map(async (addr) => {
          try {
            const balRes = await fetch(HARDHAT_RPC_URL, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                jsonrpc: '2.0',
                method: 'eth_getBalance',
                params: [addr, 'latest'],
                id: Date.now(),
              }),
              cache: 'no-store',
            });
            const balData = await balRes.json();
            if (balData?.result) {
              balances[addr.toLowerCase()] = Number(
                parseFloat(ethers.formatEther(BigInt(balData.result))).toFixed(4)
              );
            }
          } catch {
            // ignore individual balance error
          }
        })
      );
    }

    return {
      isNodeOnline: true,
      chainId,
      latestBlock,
      balances,
    };
  } catch {
    clearTimeout(timeoutId);
    return {
      isNodeOnline: false,
      chainId: null,
      latestBlock: null,
      balances: {},
    };
  }
}

/**
 * Checks if MetaMask / Ethereum provider is injected
 */
export function hasMetaMask(): boolean {
  return typeof window !== 'undefined' && Boolean((window as any).ethereum);
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
 * Connects to MetaMask using the proven EIP-2255 / Ethers v6 flow from the reference project:
 * 1. Verifies Hardhat RPC (http://127.0.0.1:8545) is online
 * 2. Requests permissions via wallet_requestPermissions + eth_requestAccounts
 * 3. Automatically switches/adds Hardhat Localhost 8545 (Chain ID 31337 / 0x7a69)
 */
export async function connectMetaMaskWithEthers(
  preferredAddress?: string
): Promise<MetaMaskConnectionResult> {
  const rpcStatus = await checkLocalHardhatNode();
  if (!rpcStatus.isNodeOnline) {
    return {
      success: false,
      error:
        'Hardhat RPC Server (http://127.0.0.1:8545) is offline! Please make sure Terminal 1 (Hardhat Node) is running before connecting your wallet.',
    };
  }

  if (typeof window === 'undefined' || !(window as any).ethereum) {
    return {
      success: false,
      error: 'MetaMask or Web3 wallet extension not detected in browser.',
    };
  }

  const ethereum = (window as any).ethereum;

  try {
    // Open MetaMask account selection & permissions popup (exact pattern from reference project)
    try {
      await ethereum.request({
        method: 'wallet_requestPermissions',
        params: [{ eth_accounts: {} }],
      });
    } catch (permErr: any) {
      if (isUserRejection(permErr)) {
        return {
          success: false,
          error: 'MetaMask connection cancelled by user.',
        };
      }
      // If wallet_requestPermissions is unsupported or fails on first origin handshake,
      // continue cleanly to eth_requestAccounts below
    }

    const accounts: string[] = await ethereum.request({
      method: 'eth_requestAccounts',
    });

    if (!accounts || accounts.length === 0) {
      return {
        success: false,
        error: 'No account authorized in MetaMask.',
      };
    }

    // Ensure Hardhat network (Chain ID 31337 / 0x7a69) is selected
    const chainIdHexCurrent: string = await ethereum.request({ method: 'eth_chainId' });
    let activeChainId = parseInt(chainIdHexCurrent, 16);

    if (activeChainId !== HARDHAT_CHAIN_ID) {
      try {
        await ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x7a69' }], // 31337 in hex
        });
        activeChainId = HARDHAT_CHAIN_ID;
      } catch (switchError: any) {
        if (isUserRejection(switchError)) {
          return {
            success: false,
            error: 'Network switch to Hardhat Localhost 8545 was rejected in MetaMask.',
          };
        }
        if (switchError.code === 4902) {
          await ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: '0x7a69',
                chainName: 'Hardhat Localhost 8545',
                rpcUrls: ['http://127.0.0.1:8545'],
                nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
              },
            ],
          });
          activeChainId = HARDHAT_CHAIN_ID;
        }
      }
    }

    let selectedAddr = accounts[0];
    if (preferredAddress) {
      const matchedInAuthorized = accounts.find(
        (a) => a.toLowerCase() === preferredAddress.toLowerCase()
      );
      if (matchedInAuthorized) {
        selectedAddr = matchedInAuthorized;
      }
    }

    const checksumAddr = ethers.getAddress(selectedAddr);
    const roleAccount = findRoleAccountByAddress(checksumAddr);

    if (checksumAddr.toLowerCase() === ORACLE_BACKGROUND_ACCOUNT.address.toLowerCase()) {
      return {
        success: false,
        address: checksumAddr,
        chainId: activeChainId,
        isCorrectNetwork: activeChainId === HARDHAT_CHAIN_ID,
        isUnsupportedAccount: true,
        error:
          'The connected address is the background Oracle service account (Account 4 — 0x15d34...). Please select Account 0 (Admin), Account 1 (Seller), Account 2 (Bidder 1), or Account 3 (Bidder 2).',
      };
    }

    if (!roleAccount) {
      // If user clicked a specific role card (preferredAddress) and approved MetaMask, use that role account
      if (preferredAddress) {
        const preferredRole = findRoleAccountByAddress(preferredAddress);
        if (preferredRole) {
          return {
            success: true,
            address: preferredRole.address,
            account: preferredRole,
            chainId: HARDHAT_CHAIN_ID,
            isCorrectNetwork: true,
          };
        }
      }
      return {
        success: false,
        address: checksumAddr,
        chainId: activeChainId,
        isCorrectNetwork: activeChainId === HARDHAT_CHAIN_ID,
        isUnsupportedAccount: true,
        error: `Connected account (${checksumAddr.slice(0, 6)}...${checksumAddr.slice(-4)}) is not one of the 4 role accounts. Import Account 0 (Admin), Account 1 (Seller), Account 2 (Bidder 1), or Account 3 (Bidder 2) in MetaMask.`,
      };
    }

    return {
      success: true,
      address: roleAccount.address,
      account: roleAccount,
      chainId: HARDHAT_CHAIN_ID,
      isCorrectNetwork: true,
    };
  } catch (err: any) {
    if (isUserRejection(err)) {
      return {
        success: false,
        error: 'MetaMask connection cancelled by user.',
      };
    }
    return {
      success: false,
      error: err?.message || 'Failed to connect MetaMask.',
    };
  }
}

/**
 * Prompts MetaMask to switch to or add Hardhat Localhost 8545 (Chain ID 31337)
 */
export async function requestSwitchToHardhatChain(): Promise<{ success: boolean; error?: string }> {
  if (!hasMetaMask()) {
    return { success: false, error: 'MetaMask extension not found.' };
  }

  const ethereum = (window as any).ethereum;
  const hardhatHexChainId = '0x7a69'; // 31337 in hex

  try {
    await ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: hardhatHexChainId }],
    });
    return { success: true };
  } catch (switchError: any) {
    if (switchError.code === 4902 || switchError?.message?.includes('unrecognized')) {
      try {
        await ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: hardhatHexChainId,
              chainName: 'Hardhat Localhost 8545',
              rpcUrls: ['http://127.0.0.1:8545'],
              nativeCurrency: {
                name: 'ETH',
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
 * Triggers MetaMask account chooser permissions request
 */
export async function promptMetaMaskAccountSwitch(): Promise<{ success: boolean; accounts?: string[]; error?: string }> {
  if (!hasMetaMask()) {
    return { success: false, error: 'MetaMask extension not available.' };
  }

  const ethereum = (window as any).ethereum;
  try {
    await ethereum.request({
      method: 'wallet_requestPermissions',
      params: [{ eth_accounts: {} }],
    });

    const accounts: string[] = await ethereum.request({
      method: 'eth_requestAccounts',
    });

    return { success: true, accounts };
  } catch (err: any) {
    if (isUserRejection(err)) {
      return { success: false, error: 'Account switch cancelled by user.' };
    }
    return { success: false, error: err?.message || 'Account switch request cancelled.' };
  }
}
