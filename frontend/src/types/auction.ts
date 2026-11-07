export type ProductCategory = 'vehicle';

export type AuctionPhase = 'Upcoming' | 'Commit' | 'Reveal' | 'Finalizable' | 'Sold' | 'No Sale' | 'Cancelled';

export type UserRole = 'guest' | 'seller' | 'bidder' | 'oracle' | 'admin';

export interface VehicleAttributes {
  brand: string;
  model: string;
  manufacturing_year: number;
  mileage_km: number;
  fuel_type: 'Petrol' | 'Diesel' | 'Electric' | 'Hybrid';
  transmission: 'Manual' | 'Automatic';
  condition: 'Like New' | 'Excellent' | 'Good' | 'Fair';
  original_price_inr: number;
}

export type CategoryAttributes = VehicleAttributes | Record<string, string | number>;

export interface ModelEvaluationMetrics {
  mae: number;
  rmse: number;
  r2: number;
  trainingSamples: number;
  algorithm: string;
}

export interface AIPredictionRecord {
  prediction_id: number;
  category: ProductCategory;
  predicted_price_inr: number;
  predicted_price_paise: number;
  currency: 'INR';
  model_version: string; // "vehicle-v1"
  prediction_timestamp: number;
  product_data_hash: string;
  canonical_json: string;
  feature_breakdown: {
    factor: string;
    impact: string;
    weight: number;
  }[];
  metrics: ModelEvaluationMetrics;
  oracle_tx_hash: string;
  oracle_address: string;
  oracle_contract_address: string;
  oracle_block_number: number;
  oracle_registered: boolean;
}

export interface BidCommitmentRecord {
  id: string;
  auctionId: string;
  numericAuctionId: number;
  bidderAddress: string;
  bidderEns: string;
  commitmentHash: string;
  depositEth: number;
  committedAt: string;
  committedTimestamp: number;
  blockNumber: number;
  txHash: string;
  revealed: boolean;
  revealedAmountEth?: number;
  revealedAt?: string;
  revealTxHash?: string;
  depositRefunded: boolean;
  refundTxHash?: string;
  isForfeited?: boolean;
}

export interface OnChainEventRecord {
  id: string;
  eventName:
    | 'PredictionRegistered'
    | 'AuctionCreated'
    | 'BidCommitted'
    | 'BidRevealed'
    | 'AuctionFinalized'
    | 'WinnerSettled'
    | 'RefundClaimed'
    | 'SellerProceedsWithdrawn'
    | 'AuthorizedOracleUpdated';
  txHash: string;
  blockNumber: number;
  timestamp: string;
  actorAddress: string;
  summary: string;
}

export interface AuctionItem {
  id: string;
  numericId: number;
  title: string;
  subtitle: string;
  category: ProductCategory;
  imageUrl: string;
  sellerAddress: string;
  sellerEns: string;
  contractAddress: string;
  attributes: Record<string, string | number>;
  aiPrediction: AIPredictionRecord;
  // Auction Terms in Test ETH (Chain ID 31337)
  startingBidEth: number;
  reservePriceEth: number;
  fixedDepositEth: number;
  commitEndTime: string;
  revealEndTime: string;
  phase: AuctionPhase;
  commitments: BidCommitmentRecord[];
  highestBidEth?: number;
  winningBidderAddress?: string;
  winningBidderEns?: string;
  finalizedAt?: string;
  finalizedTxHash?: string;
  winnerSettled: boolean;
  settlementTxHash?: string;
  sellerWithdrawn: boolean;
  sellerWithdrawTxHash?: string;
  events: OnChainEventRecord[];
}

export interface LocalRevealBackupSecret {
  platform: 'AuctionChain';
  chainId: 31337;
  auctionId: string;
  numericAuctionId: number;
  auctionTitle: string;
  bidderAddress: string;
  bidAmountEth: string;
  salt: string;
  commitmentHash: string;
  fixedDepositEth: number;
  createdAt: string;
}

export interface WalletAccount {
  address: string;
  ens: string;
  label: string; // e.g. "Account 1 — Admin", "Account 2 — Seller"
  accountNumber: number; // 1, 2, 3, 4, 5
  accountIndex: number; // 0, 1, 2, 3, 4 (Hardhat index)
  role: UserRole; // 'admin' | 'seller' | 'bidder' | 'oracle'
  roleTitle: string; // "Administrator", "Vehicle Seller", "Vehicle Bidder"
  bidderIdentifier?: 'Bidder 1' | 'Bidder 2';
  connectButtonText: string; // "Connect as Admin", "Connect as Seller", etc.
  balanceEth: number;
  badgeColor: string;
  description: string;
  isHumanFacing: boolean;
}
