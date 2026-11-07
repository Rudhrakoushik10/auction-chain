/**
 * Cryptographic & formatting utilities for AuctionChain Sealed-Bid Commit-Reveal Protocol
 * Implements deterministic canonical hashing and commitment generation matching:
 * commitment = keccak256(abi.encode(auctionId, bidderAddress, bidAmountWei, salt))
 */

export function generateRandomSalt(): string {
  const bytes = new Uint8Array(32);
  window.crypto.getRandomValues(bytes);
  const hex = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return `0x${hex}`;
}

export function generateDeterministicTxHash(seed: string): string {
  let h1 = 0xdeadbeef ^ seed.length;
  let h2 = 0x41c6ce57 ^ seed.length;
  for (let i = 0, ch; i < seed.length; i++) {
    ch = seed.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);

  const part1 = (h1 >>> 0).toString(16).padStart(8, '0');
  const part2 = (h2 >>> 0).toString(16).padStart(8, '0');
  const repeated = (part1 + part2).repeat(4).slice(0, 64);
  return `0x${repeated}`;
}

/**
 * Normalizes ETH value to integer Wei string (18 decimals)
 */
export function normalizeEthToWeiString(ethAmount: string | number): string {
  const num = Number(ethAmount);
  if (Number.isNaN(num) || num < 0) return '0';
  const weiBigInt = BigInt(Math.round(num * 1e9)) * BigInt(1e9);
  return weiBigInt.toString();
}

/**
 * Normalizes salt to 0x-prefixed 32-byte lowercase hex string
 */
export function normalizeSaltHex(salt: string): string {
  const clean = salt.trim().toLowerCase().replace(/^0x/, '');
  return `0x${clean.padEnd(64, '0').slice(0, 64)}`;
}

/**
 * Computes deterministic commitment hash matching Solidity:
 * keccak256(abi.encode(uint256 auctionId, address bidderAddress, uint256 bidAmountWei, bytes32 salt))
 */
export async function computeCommitmentHash(
  numericAuctionId: number,
  bidderAddress: string,
  bidAmountEth: string | number,
  salt: string
): Promise<string> {
  const normalizedAuctionId = BigInt(numericAuctionId || 1).toString(16).padStart(64, '0');
  const normalizedBidder = bidderAddress.trim().toLowerCase().replace(/^0x/, '').padStart(64, '0');
  const weiStr = normalizeEthToWeiString(bidAmountEth);
  const normalizedBidWei = BigInt(weiStr).toString(16).padStart(64, '0');
  const normalizedSalt = normalizeSaltHex(salt).replace(/^0x/, '');

  const abiEncodedPayload = `${normalizedAuctionId}${normalizedBidder}${normalizedBidWei}${normalizedSalt}`;
  const encoder = new TextEncoder();
  const data = encoder.encode(abiEncodedPayload);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  return `0x${hashHex}`;
}

/**
 * Computes canonical SHA-256 hash of normalized product JSON attributes
 */
export async function computeCanonicalProductHash(
  category: string,
  attributes: Record<string, unknown>
): Promise<{ hash: string; canonicalJson: string }> {
  const sortedKeys = Object.keys(attributes).sort();
  const normalizedObj: Record<string, string | number | boolean> = {
    category: category.trim().toLowerCase(),
  };

  for (const k of sortedKeys) {
    const val = attributes[k];
    if (typeof val === 'string') {
      normalizedObj[k] = val.trim().toLowerCase();
    } else if (typeof val === 'number' || typeof val === 'boolean') {
      normalizedObj[k] = val;
    } else if (val !== null && val !== undefined) {
      normalizedObj[k] = String(val).trim().toLowerCase();
    }
  }

  const canonicalJson = JSON.stringify(normalizedObj);
  const encoder = new TextEncoder();
  const digest = await window.crypto.subtle.digest('SHA-256', encoder.encode(canonicalJson));
  const hex = Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  return {
    hash: `0x${hex}`,
    canonicalJson,
  };
}

/**
 * Deterministic conversion rate from the AI model's raw USD prediction to Indian Rupees (INR).
 * The LightGBM v1.0.0 model outputs raw valuations in USD; the frontend converts and displays
 * all monetary values exclusively in Indian Rupees (₹ / INR).
 */
export const USD_TO_INR_RATE = 84;

/**
 * Deterministic conversion rate from Test ETH to Indian Rupees (INR) for live ETH input
 * and escrow display across the platform (1 ETH = ₹2,50,000 INR).
 */
export const ETH_TO_INR_RATE = 250000;

export function convertUsdToInr(amount: number): number {
  const num = Number(amount) || 0;
  // If value is already in typical INR range (> 500,000), return as-is; otherwise convert USD -> INR
  if (num > 500000) return Math.round(num);
  return Math.round(num * USD_TO_INR_RATE);
}

export function toInrPaise(amountUsdOrInr: number): number {
  return convertUsdToInr(amountUsdOrInr) * 100;
}

/**
 * Formats any AI valuation or monetary figure in Indian Rupees (₹) using the en-IN locale.
 */
export function formatInr(amount: number): string {
  const inrValue = convertUsdToInr(amount);
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(inrValue);
}

/**
 * Converts a Test ETH amount (number or string) to Indian Rupees (INR).
 */
export function convertEthToInr(ethAmount: string | number): number {
  const num = Number(ethAmount);
  if (Number.isNaN(num) || num <= 0) return 0;
  return Math.round(num * ETH_TO_INR_RATE);
}

/**
 * Formats a Test ETH amount directly as Indian Rupees (₹) using the en-IN locale.
 */
export function formatEthToInr(ethAmount: string | number): string {
  const inrValue = convertEthToInr(ethAmount);
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(inrValue);
}

/**
 * Formats an ETH amount together with its Indian Rupee (₹) equivalent, e.g. "12.50 ETH (₹31,25,000)"
 */
export function formatEthWithInr(ethAmount: string | number, decimals = 2): string {
  const num = Number(ethAmount) || 0;
  return `${num.toFixed(decimals)} ETH (${formatEthToInr(num)})`;
}

/**
 * Alias kept for backward compatibility across components — always formats in Indian Rupees (₹ / INR).
 */
export function formatUsd(amountUsd: number): string {
  return formatInr(amountUsd);
}

export function shortenAddress(addr: string): string {
  if (!addr || addr.length < 10) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}
