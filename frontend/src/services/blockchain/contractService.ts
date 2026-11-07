import contractAddresses from '../../contracts/contractAddresses.json';
import { computeCommitmentHash } from '../../lib/crypto';

export const CONTRACT_ADDRESSES = contractAddresses;

export async function generateVehicleBidCommitment(
  numericAuctionId: number,
  bidderAddress: string,
  bidAmountEth: string | number,
  salt: string
): Promise<string> {
  return computeCommitmentHash(numericAuctionId, bidderAddress, bidAmountEth, salt);
}
