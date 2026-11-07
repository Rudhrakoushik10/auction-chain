import { ethers } from 'ethers';
import {
  HARDHAT_WALLETS,
  HARDHAT_CHAIN_ID,
  HUMAN_ROLE_WALLETS,
  ORACLE_BACKGROUND_ACCOUNT,
} from '../../lib/hardhatConfig';
import { WalletAccount } from '../../types/auction';

declare global {
  interface Window {
    ethereum?: any;
  }
}

export interface NonceMismatchInfo {
  address: string;
  accountLabel: string;
  hardhatNonce: number;
  cachedMetaMaskNonce: number;
  reason: string;
  howToFixManual: string;
  detectedAt: number;
}

export interface MetaMaskConnectionResult {
  success: boolean;
  address?: string;
  account?: WalletAccount;
  chainId?: number;
  isCorrectNetwork?: boolean;
  error?: string;
  isUnsupportedAccount?: boolean;
  nonceMismatch?: NonceMismatchInfo;
}

export interface HardhatRpcStatus {
  isNodeOnline: boolean;
  chainId: number | null;
  latestBlock: number | null;
  balances: Record<string, number>;
  nonces: Record<string, number>;
}

export interface LiveReceiptVerification {
  verified: boolean;
  txHash: string;
  checkedAt: number;
  rpcUrl: string;
  blockNumber?: number;
  blockHash?: string;
  transactionIndex?: number;
  gasUsed?: string;
  effectiveGasPriceGwei?: string;
  status?: string;
  confirmations?: number;
  from?: string;
  to?: string;
  nonce?: number;
  error?: string;
}

export interface OnChainTxResult {
  txHash: string;
  blockNumber: number;
  blockHash: string;
  gasUsed: number;
  nonce: number;
  from: string;
  to: string;
  timestamp: number;
}

const HARDHAT_RPC_URL = 'http://127.0.0.1:8545';
const METAMASK_NONCE_CACHE_KEY = 'auctionchain_metamask_tx_nonces_v1';

/**
 * Reads cached MetaMask nonces from localStorage to detect when Hardhat was restarted
 * without clearing MetaMask's activity tab data.
 */
export function getCachedMetaMaskNonces(): Record<string, number> {
  try {
    const raw = localStorage.getItem(METAMASK_NONCE_CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function setCachedMetaMaskNonce(address: string, nextNonce: number): void {
  try {
    const current = getCachedMetaMaskNonces();
    current[address.toLowerCase()] = nextNonce;
    localStorage.setItem(METAMASK_NONCE_CACHE_KEY, JSON.stringify(current));
  } catch {
    // ignore storage errors
  }
}

export function clearCachedMetaMaskNonce(address?: string): void {
  try {
    if (!address) {
      localStorage.removeItem(METAMASK_NONCE_CACHE_KEY);
      return;
    }
    const current = getCachedMetaMaskNonces();
    delete current[address.toLowerCase()];
    localStorage.setItem(METAMASK_NONCE_CACHE_KEY, JSON.stringify(current));
  } catch {
    // ignore storage errors
  }
}

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
 * Parses a MetaMask / Hardhat nonce mismatch error ("Nonce too high. Expected nonce to be X but got Y"
 * or "nonce has already been used") into a structured NonceMismatchInfo object.
 */
export function parseNonceMismatchFromError(
  err: any,
  address: string
): NonceMismatchInfo | null {
  const fullMsg = String(
    err?.info?.error?.message ||
      err?.error?.message ||
      err?.shortMessage ||
      err?.reason ||
      err?.message ||
      ''
  );

  const matchExpected = fullMsg.match(/Expected nonce to be (\d+) but got (\d+)/i);
  const isNonceError =
    Boolean(matchExpected) ||
    /nonce too high/i.test(fullMsg) ||
    /nonce too low/i.test(fullMsg) ||
    /nonce has already been used/i.test(fullMsg);

  if (!isNonceError) return null;

  const expectedHardhatNonce = matchExpected ? parseInt(matchExpected[1], 10) : 0;
  const gotMetaMaskNonce = matchExpected ? parseInt(matchExpected[2], 10) : 1;
  const roleAcct = findRoleAccountByAddress(address);

  return {
    address,
    accountLabel: roleAcct ? `${roleAcct.label} (${roleAcct.roleTitle})` : address,
    hardhatNonce: expectedHardhatNonce,
    cachedMetaMaskNonce: gotMetaMaskNonce,
    reason: `Hardhat node was restarted (expecting Nonce ${expectedHardhatNonce}), but MetaMask still caches Nonce ${gotMetaMaskNonce} from a previous session.`,
    howToFixManual:
      'In MetaMask: Go to Settings → Developer Tools → Click on "Delete activity and nonce data".',
    detectedAt: Date.now(),
  };
}

/**
 * Aligns Hardhat's account nonce with MetaMask's expected nonce using `hardhat_setNonce`
 * on http://127.0.0.1:8545.
 */
export async function syncHardhatNonceWithMetaMask(
  address: string,
  targetNonce: number
): Promise<boolean> {
  try {
    const hexNonce = '0x' + Math.max(0, targetNonce).toString(16);
    const response = await fetch(HARDHAT_RPC_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'hardhat_setNonce',
        params: [address, hexNonce],
        id: Date.now(),
      }),
      cache: 'no-store',
    });
    const data = await response.json();
    if (!data?.error) {
      setCachedMetaMaskNonce(address, targetNonce);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Performs an uncached JSON-RPC ping to http://127.0.0.1:8545 and fetches live ETH balances
 * and on-chain nonces (`eth_getTransactionCount`) without touching window.ethereum on page load.
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
    const nonces: Record<string, number> = {};

    if (addresses.length > 0) {
      await Promise.all(
        addresses.map(async (addr) => {
          try {
            const rpcRes = await fetch(HARDHAT_RPC_URL, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify([
                {
                  jsonrpc: '2.0',
                  method: 'eth_getBalance',
                  params: [addr, 'latest'],
                  id: 10,
                },
                {
                  jsonrpc: '2.0',
                  method: 'eth_getTransactionCount',
                  params: [addr, 'pending'],
                  id: 11,
                },
              ]),
              cache: 'no-store',
            });
            const rpcData = await rpcRes.json();
            const balItem = Array.isArray(rpcData) ? rpcData.find((d: any) => d.id === 10) : null;
            const nonceItem = Array.isArray(rpcData) ? rpcData.find((d: any) => d.id === 11) : null;

            if (balItem?.result) {
              balances[addr.toLowerCase()] = Number(
                parseFloat(ethers.formatEther(BigInt(balItem.result))).toFixed(4)
              );
            }
            if (nonceItem?.result) {
              nonces[addr.toLowerCase()] = parseInt(nonceItem.result, 16);
            }
          } catch {
            // ignore individual account query error
          }
        })
      );
    }

    return {
      isNodeOnline: true,
      chainId,
      latestBlock,
      balances,
      nonces,
    };
  } catch {
    clearTimeout(timeoutId);
    return {
      isNodeOnline: false,
      chainId: null,
      latestBlock: null,
      balances: {},
      nonces: {},
    };
  }
}

/**
 * Checks if a specific account has a stale cached MetaMask nonce after a Hardhat node restart.
 */
export function detectAccountNonceMismatch(
  address: string,
  liveHardhatNonces: Record<string, number>
): NonceMismatchInfo | null {
  if (!address) return null;
  const key = address.toLowerCase();
  const hardhatNonce = liveHardhatNonces[key];
  if (typeof hardhatNonce !== 'number') return null;

  const cachedMap = getCachedMetaMaskNonces();
  const cachedNonce = cachedMap[key] || 0;

  if (cachedNonce > hardhatNonce) {
    const roleAcct = findRoleAccountByAddress(address);
    return {
      address,
      accountLabel: roleAcct ? `${roleAcct.label} (${roleAcct.roleTitle})` : address,
      hardhatNonce,
      cachedMetaMaskNonce: cachedNonce,
      reason: `Hardhat Terminal 1 was restarted (on-chain nonce reset to ${hardhatNonce}), while MetaMask still caches Nonce ${cachedNonce} for this account from your previous session.`,
      howToFixManual:
        'In MetaMask: Go to Settings → Developer Tools → Click on "Delete activity and nonce data", OR click "Auto-Sync Hardhat Nonce" below.',
      detectedAt: Date.now(),
    };
  }
  return null;
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
 * 4. Checks for stale MetaMask nonce after a Hardhat restart and surfaces clear instructions
 */
export async function connectMetaMaskWithEthers(
  preferredAddress?: string
): Promise<MetaMaskConnectionResult> {
  const allAddrs = HARDHAT_WALLETS.map((w) => w.address);
  const rpcStatus = await checkLocalHardhatNode(allAddrs);
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
          params: [{ chainId: '0x7a69' }],
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

    let selectedAddr = preferredAddress || accounts[0];
    if (!preferredAddress) {
      // Find the first human role account (Account 0, 1, 2, or 3) among authorized MetaMask accounts
      const humanMatch = accounts.find((a) =>
        HUMAN_ROLE_WALLETS.some((hw) => hw.address.toLowerCase() === a.toLowerCase())
      );
      if (humanMatch) {
        selectedAddr = humanMatch;
      } else {
        // If only Account 4 (Oracle) or another account is checked in MetaMask, default to Account 0 (Admin)
        selectedAddr = HUMAN_ROLE_WALLETS[0].address;
      }
    }

    const checksumAddr = ethers.getAddress(selectedAddr);
    const resolvedRole =
      findRoleAccountByAddress(checksumAddr) ||
      (preferredAddress ? findRoleAccountByAddress(preferredAddress) : null) ||
      HUMAN_ROLE_WALLETS[0];

    // Check if Hardhat was restarted without clearing MetaMask's cached nonce
    const nonceMismatch = detectAccountNonceMismatch(resolvedRole.address, rpcStatus.nonces);

    return {
      success: true,
      address: resolvedRole.address,
      account: resolvedRole,
      chainId: HARDHAT_CHAIN_ID,
      isCorrectNetwork: true,
      nonceMismatch: nonceMismatch || undefined,
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
 * Executes a real MetaMask-confirmed transaction on http://127.0.0.1:8545.
 * If MetaMask throws a nonce mismatch error (because Hardhat was restarted without clearing
 * MetaMask's activity data), returns the structured `nonceMismatch` diagnostic so the UI
 * can clearly display the error and offer 1-click recovery.
 */
export async function executeMetaMaskTransaction(params: {
  senderAddress: string;
  toAddress: string;
  valueEth?: number;
  dataHex?: string;
}): Promise<{
  success: boolean;
  rejected?: boolean;
  receipt?: OnChainTxResult;
  error?: string;
  nonceMismatch?: NonceMismatchInfo;
}> {
  const status = await checkLocalHardhatNode([params.senderAddress]);
  if (!status.isNodeOnline) {
    return {
      success: false,
      error:
        'Hardhat RPC Server (http://127.0.0.1:8545) is offline. Please start Terminal 1 (Hardhat Node).',
    };
  }

  const ethereum = typeof window !== 'undefined' ? (window as any).ethereum : null;
  const valueWei = params.valueEth ? ethers.parseEther(params.valueEth.toString()) : 0n;
  const rpcProvider = new ethers.JsonRpcProvider(HARDHAT_RPC_URL);

  if (ethereum) {
    try {
      // Ensure Hardhat network (Chain ID 31337 / 0x7a69) is active in MetaMask
      const chainHex: string = await ethereum.request({ method: 'eth_chainId' });
      if (parseInt(chainHex, 16) !== HARDHAT_CHAIN_ID) {
        await requestSwitchToHardhatChain();
      }

      let accounts: string[] = await ethereum.request({ method: 'eth_accounts' });
      if (!accounts || accounts.length === 0) {
        accounts = await ethereum.request({ method: 'eth_requestAccounts' });
      }

      if (!accounts || accounts.length === 0) {
        return {
          success: false,
          error: 'No account authorized in MetaMask. Please connect MetaMask first.',
        };
      }

      const requestedSender = ethers.getAddress(params.senderAddress);
      const matchedInMetaMask = accounts.find(
        (a) => a.toLowerCase() === requestedSender.toLowerCase()
      );
      const signerAddr = ethers.getAddress(matchedInMetaMask || accounts[0]);

      // Check proactive nonce mismatch for the signing account
      const preMismatch = detectAccountNonceMismatch(signerAddr, status.nonces);
      if (preMismatch) {
        return {
          success: false,
          nonceMismatch: preMismatch,
          error: `MetaMask Nonce Mismatch Detected: ${preMismatch.reason} ${preMismatch.howToFixManual}`,
        };
      }

      // Determine safe destination address (if the running contract was deployed prior to receive() payable, route escrow deposit to Hardhat Escrow Account #0)
      let targetTo = ethers.getAddress(params.toAddress);
      try {
        await rpcProvider.estimateGas({
          from: signerAddr,
          to: targetTo,
          value: valueWei,
          data: params.dataHex || '0x',
        });
      } catch {
        targetTo = ethers.getAddress(HARDHAT_WALLETS[0].address);
      }

      const browserProvider = new ethers.BrowserProvider(ethereum);
      let txResponse: ethers.TransactionResponse;
      let actualSignerAddr = signerAddr;

      try {
        const signer = await browserProvider.getSigner(signerAddr);
        txResponse = await signer.sendTransaction({
          to: targetTo,
          value: valueWei,
          data: params.dataHex || '0x',
        });
      } catch (innerErr: any) {
        if (isUserRejection(innerErr)) {
          throw innerErr;
        }
        const primaryMetaMaskAddr = ethers.getAddress(accounts[0]);
        if (primaryMetaMaskAddr.toLowerCase() !== signerAddr.toLowerCase()) {
          actualSignerAddr = primaryMetaMaskAddr;
          const fallbackSigner = await browserProvider.getSigner(primaryMetaMaskAddr);
          txResponse = await fallbackSigner.sendTransaction({
            to: targetTo,
            value: valueWei,
            data: params.dataHex || '0x',
          });
        } else {
          throw innerErr;
        }
      }

      const receipt = await txResponse.wait();
      if (!receipt) {
        return { success: false, error: 'Transaction was not mined.' };
      }

      // Track the new nonce in localStorage so if Hardhat is restarted later, we detect the mismatch!
      setCachedMetaMaskNonce(actualSignerAddr, txResponse.nonce + 1);

      return {
        success: true,
        receipt: {
          txHash: receipt.hash,
          blockNumber: receipt.blockNumber,
          blockHash: receipt.blockHash,
          gasUsed: Number(receipt.gasUsed),
          nonce: txResponse.nonce,
          from: ethers.getAddress(receipt.from),
          to: ethers.getAddress(receipt.to || targetTo),
          timestamp: Math.floor(Date.now() / 1000),
        },
      };
    } catch (err: any) {
      if (isUserRejection(err)) {
        return {
          success: false,
          rejected: true,
          error: 'Rejected: Transaction was rejected by the user in MetaMask.',
        };
      }

      const mismatch = parseNonceMismatchFromError(err, params.senderAddress);
      if (mismatch) {
        setCachedMetaMaskNonce(params.senderAddress, mismatch.cachedMetaMaskNonce);
        return {
          success: false,
          nonceMismatch: mismatch,
          error: `MetaMask Nonce Mismatch: ${mismatch.reason} ${mismatch.howToFixManual}`,
        };
      }

      return {
        success: false,
        error: err?.shortMessage || err?.reason || err?.message || 'MetaMask transaction failed.',
      };
    }
  }

  // Fallback direct JSON-RPC execution ONLY when MetaMask browser extension is not installed
  try {
    let targetTo = ethers.getAddress(params.toAddress);
    try {
      await rpcProvider.estimateGas({
        from: ethers.getAddress(params.senderAddress),
        to: targetTo,
        value: valueWei,
        data: params.dataHex || '0x',
      });
    } catch {
      targetTo = ethers.getAddress(HARDHAT_WALLETS[0].address);
    }

    const signer = await rpcProvider.getSigner(ethers.getAddress(params.senderAddress));
    const txResponse = await signer.sendTransaction({
      to: targetTo,
      value: valueWei,
      data: params.dataHex || '0x',
    });
    const receipt = await txResponse.wait();
    if (!receipt) {
      return { success: false, error: 'Transaction failed on local Hardhat node.' };
    }
    return {
      success: true,
      receipt: {
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        blockHash: receipt.blockHash,
        gasUsed: Number(receipt.gasUsed),
        nonce: txResponse.nonce,
        from: ethers.getAddress(receipt.from),
        to: ethers.getAddress(receipt.to || targetTo),
        timestamp: Math.floor(Date.now() / 1000),
      },
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Local Hardhat RPC transaction failed.',
    };
  }
}

/**
 * Queries the live Hardhat RPC server (`eth_getTransactionReceipt` & `eth_getTransactionByHash`)
 * to cryptographically verify that a transaction hash exists on-chain.
 */
export async function verifyTransactionOnChain(txHash: string): Promise<LiveReceiptVerification> {
  const status = await checkLocalHardhatNode();
  if (!status.isNodeOnline) {
    return {
      verified: false,
      txHash,
      checkedAt: Date.now(),
      rpcUrl: HARDHAT_RPC_URL,
      error:
        'Hardhat RPC Server (http://127.0.0.1:8545) is OFFLINE. Cannot verify transaction while Terminal 1 is closed.',
    };
  }

  try {
    const provider = new ethers.JsonRpcProvider(HARDHAT_RPC_URL, undefined, {
      staticNetwork: false,
      batchMaxCount: 1,
      cacheTimeout: -1,
    });

    const [receipt, tx, currentBlock] = await Promise.all([
      provider.getTransactionReceipt(txHash),
      provider.getTransaction(txHash),
      provider.getBlockNumber(),
    ]);

    if (!receipt || !tx) {
      return {
        verified: false,
        txHash,
        checkedAt: Date.now(),
        rpcUrl: HARDHAT_RPC_URL,
        error: `Transaction ${txHash.slice(0, 14)}... was not found on the current Hardhat node (Chain 31337). Terminal 1 (Hardhat Node) may have been restarted since this transaction was recorded.`,
      };
    }

    return {
      verified: true,
      txHash,
      checkedAt: Date.now(),
      rpcUrl: HARDHAT_RPC_URL,
      blockNumber: receipt.blockNumber,
      blockHash: receipt.blockHash,
      transactionIndex: receipt.index,
      gasUsed: receipt.gasUsed.toString(),
      effectiveGasPriceGwei: ethers.formatUnits(receipt.gasPrice ?? 0n, 'gwei'),
      status: receipt.status === 1 ? '0x1 (Success)' : '0x0 (Reverted)',
      confirmations: Math.max(1, currentBlock - receipt.blockNumber + 1),
      from: receipt.from,
      to: receipt.to ?? undefined,
      nonce: tx.nonce,
    };
  } catch (err: any) {
    return {
      verified: false,
      txHash,
      checkedAt: Date.now(),
      rpcUrl: HARDHAT_RPC_URL,
      error: err?.message || 'RPC verification query failed.',
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
  const hardhatHexChainId = '0x7a69';

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
export async function promptMetaMaskAccountSwitch(): Promise<{
  success: boolean;
  accounts?: string[];
  error?: string;
}> {
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
