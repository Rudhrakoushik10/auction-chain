export type ProductCategory = 'vehicle';

export type AuctionPhase = 'Upcoming' | 'Commit' | 'Reveal' | 'Finalizable' | 'Sold' | 'No Sale' | 'Cancelled';

export type UserRole = 'guest' | 'seller' | 'bidder' | 'oracle' | 'admin';

export interface VehicleAttributes {
  brand: string;
  model: string;
  year: number;
  mileage: number; // Odometer reading in miles (US dataset)
  fuel_type?: string; // Gasoline, Diesel, Hybrid, Plug-in Hybrid, Electric, E85 Flex Fuel
  engine_type?: string; // Free-text engine description, e.g. "3.5L V6 400hp Twin Turbo"
  transmission?: string; // e.g. "10-Speed Automatic", "8-Speed Automatic", "Single-Speed"
  exterior_color?: string;
  interior_color?: string;
  accident_history?: boolean | string | null;
  clean_title?: boolean | string | null;
  // Backward-compatible optional aliases
  manufacturing_year?: number;
  mileage_km?: number;
  condition?: string;
  original_price_inr?: number;
}

export type CategoryAttributes = VehicleAttributes | Record<string, string | number | boolean | null>;

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
  predicted_price: number; // Valuation price in INR from Gemini AI
  predicted_price_inr: number; // Valuation in INR (₹)
  predicted_price_paise: number; // Integer paise (Math.round(predicted_price * 100)) for PriceOracle.sol
  confidence_min_inr?: number;
  confidence_max_inr?: number;
  valuation_summary?: string;
  currency: 'INR' | 'USD';
  model_version: string; // e.g. "Gemini 3.8 Flash"
  in_training_distribution?: boolean;
  warnings?: string[];
  inference_ms?: number;
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
  attributes: Record<string, string | number | boolean | null>;
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
  label: string;
  accountNumber: number;
  accountIndex: number;
  role: UserRole;
  roleTitle: string;
  bidderIdentifier?: 'Bidder 1' | 'Bidder 2';
  connectButtonText: string;
  balanceEth: number;
  badgeColor: string;
  description: string;
  isHumanFacing: boolean;
}
