import { ethers } from 'ethers';
import {
  HARDHAT_WALLETS,
  HARDHAT_CHAIN_ID,
  HARDHAT_RPC_URL,
  HUMAN_ROLE_WALLETS,
  ORACLE_BACKGROUND_ACCOUNT,
  CONTRACT_DEPLOYER_PRIVATE_KEY,
  SEALED_AUCTION_CONTRACT_ADDRESS,
} from '../../lib/hardhatConfig';
import {
  AUCTION_ARTIFACT,
  PRICE_ORACLE_ARTIFACT,
} from './contractArtifacts';
import { WalletAccount } from '../../types/auction';

declare global {
  interface Window {
    ethereum?: any;
  }
}

export const AUCTION_ABI = AUCTION_ARTIFACT.abi;
export const PRICE_ORACLE_ABI = PRICE_ORACLE_ARTIFACT.abi;

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
  deployedAuctionAddress?: string | null;
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
  networkFeeEth?: string;
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
  gasFeeEth: number;
  isOnChain: boolean;
  nonce: number;
  from: string;
  to: string;
  contractAddress?: string;
  onChainAuctionId?: number;
  timestamp: number;
}

// Purge any legacy localStorage nonce or balance caches that could desync from Hardhat RPC
if (typeof window !== 'undefined') {
  try {
    localStorage.removeItem('auctionchain_metamask_tx_nonces_v1');
    localStorage.removeItem('auctionchain_wallet_balances_v1');
  } catch {
    // ignore storage errors
  }
}

let cachedDeployedAuctionAddress: string | null = null;
let cachedDeployedOracleAddress: string | null = null;
let deploymentPromise: Promise<{ auctionAddress: string; oracleAddress: string }> | null = null;

const auctionInterface = new ethers.Interface(AUCTION_ABI);

export function clearCachedMetaMaskNonce(_address?: string): void {
  try {
    localStorage.removeItem('auctionchain_metamask_tx_nonces_v1');
  } catch {
    // ignore
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
 * Queries the exact next pending transaction nonce directly from the Hardhat RPC server
 * (Reference pattern from Freelance-Milestone-Escrow web3Service.ts)
 */
export async function getFreshNonce(address: string): Promise<number> {
  try {
    const response = await fetch(HARDHAT_RPC_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_getTransactionCount',
        params: [address, 'pending'],
        id: Date.now(),
      }),
      cache: 'no-store',
    });
    const data = await response.json();
    if (data && typeof data.result === 'string') {
      return parseInt(data.result, 16);
    }
  } catch {
    // fallback below
  }
  const provider = new ethers.JsonRpcProvider(HARDHAT_RPC_URL, undefined, {
    staticNetwork: false,
    batchMaxCount: 1,
    cacheTimeout: -1,
  });
  return await provider.getTransactionCount(address, 'pending');
}

/**
 * If the user restarted `npx hardhat node` and MetaMask's cached account nonce differs from
 * Hardhat's fresh nonce, aligns Hardhat's account nonce via `hardhat_setNonce` so MetaMask
 * transactions succeed cleanly upon user confirmation.
 * (Direct reference pattern from Freelance-Milestone-Escrow web3Service.ts)
 */
export async function alignHardhatNonceIfNeeded(
  address: string,
  errorOrMessage: any
): Promise<boolean> {
  let fullMsg = '';
  if (typeof errorOrMessage === 'string') {
    fullMsg = errorOrMessage;
  } else {
    let serialized = '';
    try {
      serialized = JSON.stringify(errorOrMessage);
    } catch {
      serialized = '';
    }
    fullMsg = [
      errorOrMessage?.info?.error?.message,
      errorOrMessage?.info?.error?.data?.message,
      errorOrMessage?.error?.message,
      errorOrMessage?.error?.data?.message,
      errorOrMessage?.data?.message,
      errorOrMessage?.shortMessage,
      errorOrMessage?.reason,
      errorOrMessage?.message,
      serialized,
    ]
      .filter(Boolean)
      .join(' | ');
  }

  const match =
    fullMsg.match(/Expected nonce to be (\d+) but got (\d+)/i) ||
    fullMsg.match(/next nonce (\d+),\s*tx nonce (\d+)/i);
  if (!match) return false;

  const gotNonce = parseInt(match[2], 10);
  if (isNaN(gotNonce)) return false;

  try {
    const hexNonce = '0x' + Math.max(0, gotNonce).toString(16);
    await fetch(HARDHAT_RPC_URL, {
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
    return true;
  } catch {
    return false;
  }
}

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
    return !data?.error;
  } catch {
    return false;
  }
}

/**
 * Resets an account's on-chain ETH balance on Hardhat ONLY when explicitly requested via Admin Reset.
 */
export async function resetHardhatAccountBalance(
  address: string,
  balanceEth: number = 10000.0
): Promise<boolean> {
  try {
    const checksumAddr = ethers.getAddress(address);
    const weiBigInt = ethers.parseEther(balanceEth.toFixed(4));
    const hexWei = '0x' + weiBigInt.toString(16);

    const setRes = await fetch(HARDHAT_RPC_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'hardhat_setBalance',
        params: [checksumAddr, hexWei],
        id: Date.now(),
      }),
      cache: 'no-store',
    });
    const setData = await setRes.json();
    return !setData?.error;
  } catch {
    return false;
  }
}

/**
 * Fetches raw runtime bytecode at a given contract address on the live Hardhat node
 */
export async function getContractBytecode(address: string): Promise<string> {
  try {
    const response = await fetch(HARDHAT_RPC_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_getCode',
        params: [address, 'latest'],
        id: Date.now(),
      }),
      cache: 'no-store',
    });
    const data = await response.json();
    return typeof data?.result === 'string' ? data.result : '0x';
  } catch {
    return '0x';
  }
}

/**
 * Checks if our compiled Auction.sol contract with pull-based refund & withdrawal selectors
 * (`claimRefundWithAmount(uint256,uint256)` -> `7d533c1e`) is deployed and funded at `address`.
 */
export async function hasActiveAuctionContract(address: string): Promise<boolean> {
  if (!address || !ethers.isAddress(address)) return false;
  const code = await getContractBytecode(address);
  if (!code || code === '0x' || code === '0x0') return false;
  // Selector for claimRefundWithAmount(uint256,uint256)
  const selector = ethers.id('claimRefundWithAmount(uint256,uint256)').slice(2, 10).toLowerCase();
  if (!code.toLowerCase().includes(selector)) return false;

  try {
    const response = await fetch(HARDHAT_RPC_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_getBalance',
        params: [address, 'latest'],
        id: Date.now(),
      }),
      cache: 'no-store',
    });
    const data = await response.json();
    const balWei = data?.result ? BigInt(data.result) : 0n;
    return balWei >= ethers.parseEther('20.0');
  } catch {
    return false;
  }
}

/**
 * Ensures PriceOracle.sol and Auction.sol are deployed on the running Hardhat node.
 * Uses Hardhat Account #9 (`CONTRACT_DEPLOYER_PRIVATE_KEY`) and seeds the Auction contract
 * with a 500 ETH reserve pool from Account #9 so that Admin (#0), Seller (#1), Bidder 1 (#2),
 * Bidder 2 (#3), and Oracle (#4) nonces and balances are never touched outside user transactions.
 * (Direct reference pattern from Freelance-Milestone-Escrow web3Service.ensureFactoryDeployed)
 */
export async function ensureAuctionContractsDeployed(): Promise<{
  auctionAddress: string;
  oracleAddress: string;
}> {
  if (cachedDeployedAuctionAddress && cachedDeployedOracleAddress) {
    const active = await hasActiveAuctionContract(cachedDeployedAuctionAddress);
    if (active) {
      return {
        auctionAddress: cachedDeployedAuctionAddress,
        oracleAddress: cachedDeployedOracleAddress,
      };
    }
  }

  if (await hasActiveAuctionContract(SEALED_AUCTION_CONTRACT_ADDRESS)) {
    cachedDeployedAuctionAddress = SEALED_AUCTION_CONTRACT_ADDRESS;
    cachedDeployedOracleAddress =
      cachedDeployedOracleAddress || '0x5FbDB2315678afecb367f032d93F642f64180aa3';
    return {
      auctionAddress: cachedDeployedAuctionAddress,
      oracleAddress: cachedDeployedOracleAddress,
    };
  }

  if (deploymentPromise) {
    return await deploymentPromise;
  }

  deploymentPromise = (async () => {
    try {
      const freshProvider = new ethers.JsonRpcProvider(HARDHAT_RPC_URL, undefined, {
        staticNetwork: false,
        batchMaxCount: 1,
        cacheTimeout: -1,
      });
      const deployerWallet = new ethers.Wallet(CONTRACT_DEPLOYER_PRIVATE_KEY, freshProvider);
      let nonce = await getFreshNonce(deployerWallet.address);

      const oracleFactory = new ethers.ContractFactory(
        PRICE_ORACLE_ARTIFACT.abi,
        PRICE_ORACLE_ARTIFACT.bytecode,
        deployerWallet
      );
      const oracleContract = await oracleFactory.deploy(ORACLE_BACKGROUND_ACCOUNT.address, {
        nonce: nonce++,
      });
      await oracleContract.waitForDeployment();
      const oracleAddress = await oracleContract.getAddress();

      const auctionFactory = new ethers.ContractFactory(
        AUCTION_ARTIFACT.abi,
        AUCTION_ARTIFACT.bytecode,
        deployerWallet
      );
      const auctionContract = await auctionFactory.deploy(oracleAddress, {
        nonce: nonce++,
        value: ethers.parseEther('500.0'),
      });
      await auctionContract.waitForDeployment();
      const auctionAddress = await auctionContract.getAddress();

      cachedDeployedOracleAddress = oracleAddress;
      cachedDeployedAuctionAddress = auctionAddress;

      return { auctionAddress, oracleAddress };
    } finally {
      deploymentPromise = null;
    }
  })();

  return await deploymentPromise;
}

/**
 * Performs an uncached JSON-RPC ping to http://127.0.0.1:8545 and fetches live ETH balances
 * directly from Hardhat RPC (`eth_getBalance`), matching Freelance-Milestone-Escrow web3Service.fetchLiveBalances.
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
      deployedAuctionAddress: cachedDeployedAuctionAddress,
    };
  } catch {
    clearTimeout(timeoutId);
    return {
      isNodeOnline: false,
      chainId: null,
      latestBlock: null,
      balances: {},
      nonces: {},
      deployedAuctionAddress: null,
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
 */
export function getHumanRoleWallets(): WalletAccount[] {
  return HUMAN_ROLE_WALLETS;
}

/**
 * Ensures MetaMask is connected, on Hardhat Chain ID 31337 (0x7a69), and returns the active
 * MetaMask signer (`accounts[0]`).
 * (Direct reference pattern from Freelance-Milestone-Escrow web3Service.getActiveMetaMaskSigner)
 */
async function getActiveMetaMaskSigner(): Promise<{
  signer: ethers.JsonRpcSigner;
  activeAddress: string;
  browserProvider: ethers.BrowserProvider;
}> {
  if (typeof window === 'undefined' || !(window as any).ethereum) {
    throw new Error(
      'MetaMask browser extension not detected. Please install or enable MetaMask to confirm transactions.'
    );
  }

  const ethereum = (window as any).ethereum;
  let browserProvider = new ethers.BrowserProvider(ethereum);

  // 1. Ensure MetaMask is on Chain ID 31337 (0x7a69)
  const chainIdHex: string = await ethereum.request({ method: 'eth_chainId' });
  if (parseInt(chainIdHex, 16) !== HARDHAT_CHAIN_ID) {
    try {
      await ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x7a69' }],
      });
    } catch (switchError: any) {
      if (isUserRejection(switchError)) {
        throw new Error('Network switch to Hardhat (Chain ID 31337) was rejected in MetaMask.');
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
      } else {
        throw switchError;
      }
    }
    browserProvider = new ethers.BrowserProvider(ethereum);
  }

  // 2. Ensure at least one account is authorized in MetaMask
  let accounts: string[] = await ethereum.request({ method: 'eth_accounts' });
  if (!accounts || accounts.length === 0) {
    try {
      accounts = await ethereum.request({ method: 'eth_requestAccounts' });
    } catch (reqErr: any) {
      if (isUserRejection(reqErr)) {
        throw new Error('Transaction rejected by user in MetaMask.');
      }
      throw reqErr;
    }
  }

  if (!accounts || accounts.length === 0) {
    throw new Error('No wallet account connected in MetaMask.');
  }

  const activeAddress = ethers.getAddress(accounts[0]);
  const signer = await browserProvider.getSigner(activeAddress);
  return { signer, activeAddress, browserProvider };
}

/**
 * Connects to MetaMask using the exact EIP-2255 / Ethers v6 flow from Freelance-Milestone-Escrow web3Service.connectMetaMask
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
        'Hardhat RPC Server (http://127.0.0.1:8545) is offline! Please start "npx hardhat node" before connecting your wallet.',
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
      throw permErr;
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

    const chainIdHexCurrent: string = await ethereum.request({ method: 'eth_chainId' });
    if (parseInt(chainIdHexCurrent, 16) !== HARDHAT_CHAIN_ID) {
      try {
        await ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x7a69' }],
        });
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
        }
      }
    }

    let selectedAddr = accounts[0];
    if (preferredAddress) {
      const matchedInAuthorized = accounts.find(
        (a) => a.toLowerCase() === preferredAddress.toLowerCase()
      );
      selectedAddr = matchedInAuthorized || preferredAddress;
    } else {
      const humanMatch = accounts.find((a) =>
        HUMAN_ROLE_WALLETS.some((hw) => hw.address.toLowerCase() === a.toLowerCase())
      );
      if (humanMatch) {
        selectedAddr = humanMatch;
      } else {
        selectedAddr = HUMAN_ROLE_WALLETS[0].address;
      }
    }

    const checksumAddr = ethers.getAddress(selectedAddr);
    const resolvedRole =
      findRoleAccountByAddress(checksumAddr) ||
      (preferredAddress ? findRoleAccountByAddress(preferredAddress) : null) ||
      HUMAN_ROLE_WALLETS[0];

    // Ensure Auction.sol is deployed on the live node
    await ensureAuctionContractsDeployed().catch(() => {});

    return {
      success: true,
      address: resolvedRole.address,
      account: resolvedRole,
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
 * Reports confirmed blockchain transaction events to the backend terminal log.
 */
export async function reportTerminalAuditLog(payload: {
  category?: string;
  action: string;
  actorAddress: string;
  actorLabel?: string;
  contractAddress: string;
  valueEth: number;
  txHash: string;
  blockNumber: number;
  details?: string;
  executionMode?: string;
}): Promise<void> {
  try {
    await fetch('/api/audit/log-event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch {
    // non-blocking terminal proof log
  }
}

/**
 * Executes a real state-changing method on the deployed `Auction.sol` smart contract on Hardhat (`http://127.0.0.1:8545`).
 * Modelled directly after `web3Service.executeEscrowMethodOnChain` in Freelance-Milestone-Escrow:
 * - Auto-deploys `Auction.sol` via Account #9 if not yet deployed on the running Hardhat node.
 * - Executes payable deposits (`commitBid`, `settleWinnerPayment`), pull-based contract payouts
 *   (`claimRefundWithAmount`, `withdrawSellerProceedsWithAmount` via `payable(msg.sender).call{value: amount}("")`),
 *   and state transitions (`createAuction`, `revealBid`, `finalizeAuction`) directly on `Auction.sol`.
 * - Auto-aligns Hardhat nonces via `alignHardhatNonceIfNeeded` if Hardhat was restarted.
 * - Never generates a receipt if rejected or failed in MetaMask.
 */
export async function executeMetaMaskTransaction(params: {
  senderAddress: string;
  toAddress: string;
  valueEth?: number;
  payoutEth?: number;
  contractMethod?:
    | 'createAuction'
    | 'commitBid'
    | 'revealBid'
    | 'finalizeAuction'
    | 'settleWinnerPayment'
    | 'claimRefundWithAmount'
    | 'withdrawSellerProceedsWithAmount';
  contractArgs?: any[];
  actionName?: string;
  summary?: string;
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
        'Hardhat RPC Server (http://127.0.0.1:8545) is CLOSED / OFFLINE. Please start "npx hardhat node" in Terminal 1 to execute transactions.',
    };
  }

  const valueEthNum = params.valueEth ?? 0;
  const payoutEthNum = params.payoutEth ?? 0;
  const valueWei = valueEthNum > 0 ? ethers.parseEther(valueEthNum.toFixed(6)) : 0n;
  const payoutWei = payoutEthNum > 0 ? ethers.parseEther(payoutEthNum.toFixed(6)) : 0n;

  const roleAccount = findRoleAccountByAddress(params.senderAddress);
  const actorLabel = roleAccount?.label || 'Connected Account';
  const actionLabel =
    params.actionName ||
    (valueEthNum > 0
      ? 'Auction.commitBid(uint256,bytes32) payable'
      : 'Auction.sol Smart Contract Interaction');

  // Ensure PriceOracle.sol and Auction.sol are deployed and funded on the live Hardhat chain
  let deployedAuctionAddr = SEALED_AUCTION_CONTRACT_ADDRESS;
  try {
    const deployed = await ensureAuctionContractsDeployed();
    deployedAuctionAddr = deployed.auctionAddress;
  } catch (deployErr: any) {
    return {
      success: false,
      error:
        deployErr?.message ||
        'Failed to verify or deploy Auction.sol smart contract on Hardhat node.',
    };
  }

  // Determine the Auction.sol method and arguments
  let methodName = params.contractMethod;
  let methodArgs = params.contractArgs || [];

  if (!methodName) {
    if (payoutWei > 0n) {
      if (actionLabel.toLowerCase().includes('withdraw')) {
        methodName = 'withdrawSellerProceedsWithAmount';
        methodArgs = [1n, payoutWei];
      } else {
        methodName = 'claimRefundWithAmount';
        methodArgs = [1n, payoutWei];
      }
    } else if (valueWei > 0n) {
      if (actionLabel.toLowerCase().includes('settle')) {
        methodName = 'settleWinnerPayment';
        methodArgs = [1n];
      } else {
        methodName = 'commitBid';
        methodArgs = [1n, ethers.ZeroHash];
      }
    } else if (actionLabel.toLowerCase().includes('create')) {
      methodName = 'createAuction';
      methodArgs = [
        'AuctionChain Vehicle Lot',
        ethers.ZeroHash,
        1n,
        ethers.parseEther('1.0'),
        ethers.parseEther('1.2'),
        ethers.parseEther('0.25'),
        3600n,
        3600n,
      ];
    } else if (actionLabel.toLowerCase().includes('reveal')) {
      methodName = 'revealBid';
      methodArgs = [1n, ethers.parseEther('1.5'), ethers.ZeroHash];
    } else {
      methodName = 'finalizeAuction';
      methodArgs = [1n];
    }
  }

  const freshProvider = new ethers.JsonRpcProvider(HARDHAT_RPC_URL, undefined, {
    staticNetwork: false,
    batchMaxCount: 1,
    cacheTimeout: -1,
  });

  // EIP-1559 overrides so every smart contract interaction consumes a realistic, visible gas fee (~0.0008 - 0.0015 ETH)
  // in both MetaMask and Hardhat's live eth_getBalance
  const overrides: Record<string, any> = {
    gasLimit: 500000n,
    maxPriorityFeePerGas: ethers.parseUnits('10', 'gwei'),
    maxFeePerGas: ethers.parseUnits('20', 'gwei'),
  };
  if (valueWei > 0n) {
    overrides.value = valueWei;
  }

  const ethereum = typeof window !== 'undefined' ? (window as any).ethereum : null;

  if (ethereum) {
    try {
      const { signer: mmSigner, activeAddress } = await getActiveMetaMaskSigner();
      const isSameAccount =
        activeAddress.toLowerCase() === params.senderAddress.toLowerCase();

      const mmContract = new ethers.Contract(deployedAuctionAddr, AUCTION_ABI, mmSigner);
      let txResponse: ethers.ContractTransactionResponse;

      try {
        txResponse = await mmContract[methodName](...methodArgs, overrides);
      } catch (mmErr: any) {
        if (isUserRejection(mmErr)) {
          return {
            success: false,
            rejected: true,
            error: 'Transaction rejected by user in MetaMask.',
          };
        }
        const aligned = await alignHardhatNonceIfNeeded(activeAddress, mmErr);
        if (aligned) {
          try {
            txResponse = await mmContract[methodName](...methodArgs, overrides);
          } catch (retryErr: any) {
            if (isUserRejection(retryErr)) {
              return {
                success: false,
                rejected: true,
                error: 'Transaction rejected by user in MetaMask.',
              };
            }
            throw retryErr;
          }
        } else {
          throw mmErr;
        }
      }

      const receipt = await txResponse.wait();
      if (!receipt || receipt.status === 0) {
        return {
          success: false,
          error: 'Transaction failed or reverted on the Hardhat blockchain.',
        };
      }

      // If the user's active account in MetaMask differs from the selected role account in the frontend,
      // also execute the contract call with the role's Hardhat signer so both MetaMask's active account
      // AND the frontend role account reflect the exact on-chain balance change in `eth_getBalance`.
      if (!isSameAccount && roleAccount?.privateKey) {
        try {
          const roleWallet = new ethers.Wallet(roleAccount.privateKey, freshProvider);
          const roleNonce = await getFreshNonce(roleWallet.address);
          const roleContract = new ethers.Contract(deployedAuctionAddr, AUCTION_ABI, roleWallet);
          const roleTx = await roleContract[methodName](...methodArgs, {
            ...overrides,
            nonce: roleNonce,
          });
          await roleTx.wait();
        } catch {
          // non-blocking role mirror
        }
      }

      // Extract onChainAuctionId if AuctionCreated was emitted
      let onChainAuctionId: number | undefined;
      for (const log of receipt.logs) {
        try {
          const parsed = auctionInterface.parseLog({
            topics: [...log.topics],
            data: log.data,
          });
          if (parsed && parsed.name === 'AuctionCreated') {
            onChainAuctionId = Number(parsed.args[0]);
            break;
          }
        } catch {
          // ignore other logs
        }
      }

      const effectiveGasPrice = receipt.gasPrice ?? ethers.parseUnits('10', 'gwei');
      const gasFeeWei = receipt.gasUsed * effectiveGasPrice;
      const gasFeeEth = Number(parseFloat(ethers.formatEther(gasFeeWei)).toFixed(6));

      const txResult: OnChainTxResult = {
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        blockHash: receipt.blockHash,
        gasUsed: Number(receipt.gasUsed),
        gasFeeEth,
        isOnChain: true,
        nonce: txResponse.nonce,
        from: ethers.getAddress(receipt.from),
        to: ethers.getAddress(receipt.to ?? deployedAuctionAddr),
        contractAddress: deployedAuctionAddr,
        onChainAuctionId,
        timestamp: Math.floor(Date.now() / 1000),
      };

      await reportTerminalAuditLog({
        category: 'METAMASK_CONFIRMED_TX',
        action: actionLabel,
        actorAddress: params.senderAddress,
        actorLabel,
        contractAddress: deployedAuctionAddr,
        valueEth: valueEthNum > 0 ? valueEthNum : payoutEthNum,
        txHash: txResult.txHash,
        blockNumber: txResult.blockNumber,
        details: `${params.summary || `Confirmed on Auction.sol`} (Gas Used: ${txResult.gasUsed}, Fee: ${gasFeeEth.toFixed(6)} ETH)`,
        executionMode: `MetaMask + Auction.sol Smart Contract (Chain ID 31337, Block #${txResult.blockNumber})`,
      });

      return {
        success: true,
        receipt: txResult,
      };
    } catch (err: any) {
      if (isUserRejection(err)) {
        return {
          success: false,
          rejected: true,
          error: 'Transaction rejected by user in MetaMask.',
        };
      }
      const rawErrMsg =
        err?.shortMessage ||
        err?.reason ||
        err?.info?.error?.message ||
        err?.error?.message ||
        err?.message ||
        'MetaMask transaction failed.';
      return {
        success: false,
        error: rawErrMsg,
      };
    }
  }

  // Direct Hardhat role signer execution (when browser has no MetaMask extension installed)
  if (roleAccount?.privateKey) {
    try {
      const roleWallet = new ethers.Wallet(roleAccount.privateKey, freshProvider);
      const roleNonce = await getFreshNonce(roleWallet.address);
      const roleContract = new ethers.Contract(deployedAuctionAddr, AUCTION_ABI, roleWallet);
      const txResponse = await roleContract[methodName](...methodArgs, {
        ...overrides,
        nonce: roleNonce,
      });
      const receipt = await txResponse.wait();
      if (!receipt || receipt.status === 0) {
        return {
          success: false,
          error: 'Transaction failed or reverted on the Hardhat blockchain.',
        };
      }

      const effectiveGasPrice = receipt.gasPrice ?? ethers.parseUnits('10', 'gwei');
      const gasFeeWei = receipt.gasUsed * effectiveGasPrice;
      const gasFeeEth = Number(parseFloat(ethers.formatEther(gasFeeWei)).toFixed(6));

      const txResult: OnChainTxResult = {
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        blockHash: receipt.blockHash,
        gasUsed: Number(receipt.gasUsed),
        gasFeeEth,
        isOnChain: true,
        nonce: txResponse.nonce,
        from: ethers.getAddress(receipt.from),
        to: ethers.getAddress(receipt.to ?? deployedAuctionAddr),
        contractAddress: deployedAuctionAddr,
        timestamp: Math.floor(Date.now() / 1000),
      };

      return {
        success: true,
        receipt: txResult,
      };
    } catch (err: any) {
      return {
        success: false,
        error: err?.shortMessage || err?.reason || err?.message || 'Hardhat RPC transaction failed.',
      };
    }
  }

  return {
    success: false,
    error: 'Unable to sign transaction: no wallet signer available.',
  };
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

    const gasPriceWei = receipt.gasPrice ?? 0n;
    const feeWei = receipt.gasUsed * gasPriceWei;

    return {
      verified: true,
      txHash,
      checkedAt: Date.now(),
      rpcUrl: HARDHAT_RPC_URL,
      blockNumber: receipt.blockNumber,
      blockHash: receipt.blockHash,
      transactionIndex: receipt.index,
      gasUsed: receipt.gasUsed.toString(),
      effectiveGasPriceGwei: ethers.formatUnits(gasPriceWei, 'gwei'),
      networkFeeEth: ethers.formatEther(feeWei),
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
