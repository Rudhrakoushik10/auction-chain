import contractAddresses from '../../contracts/contractAddresses.json';
import {
  computeCommitmentHash,
  generateDeterministicTxHash,
} from '../../lib/crypto';

export const CONTRACT_ADDRESSES = contractAddresses;

export async function generateVehicleBidCommitment(
  numericAuctionId: number,
  bidderAddress: string,
  bidAmountEth: string | number,
  salt: string
): Promise<string> {
  return computeCommitmentHash(numericAuctionId, bidderAddress, bidAmountEth, salt);
}

export function buildSimulatedContractTx(action: string, seed: string): string {
  return generateDeterministicTxHash(`${action}:${seed}:${Date.now()}`);
}
