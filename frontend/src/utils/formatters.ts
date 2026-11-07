import {
  shortenAddress,
  formatInr,
  formatUsd,
  formatEthToInr,
  formatEthWithInr,
  convertEthToInr,
  ETH_TO_INR_RATE,
} from '../lib/crypto';

export function formatAddress(address: string, chars = 4): string {
  if (!address || address.length < 10) return address;
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

export function formatEth(amount: number): string {
  return `${Number(amount).toFixed(2)} ETH (${formatEthToInr(amount)})`;
}

export function formatTimeRemaining(isoDeadline: string): string {
  const diff = new Date(isoDeadline).getTime() - Date.now();
  if (diff <= 0) return 'Ended';
  const mins = Math.floor(diff / 60000);
  const secs = Math.floor((diff % 60000) / 1000);
  return `${mins}m ${secs}s`;
}

export {
  shortenAddress,
  formatInr,
  formatUsd,
  formatEthToInr,
  formatEthWithInr,
  convertEthToInr,
  ETH_TO_INR_RATE,
};
