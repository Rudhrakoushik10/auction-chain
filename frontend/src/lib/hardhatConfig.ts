import { WalletAccount } from '../types/auction';
import contractAddresses from '../contracts/contractAddresses.json';

export const HARDHAT_CHAIN_ID = 31337;
export const HARDHAT_NETWORK_NAME = 'Hardhat Localhost (Chain ID 31337)';
export const HARDHAT_RPC_URL = 'http://127.0.0.1:8545';
export const PRICE_ORACLE_CONTRACT_ADDRESS = contractAddresses.PriceOracle;
export const SEALED_AUCTION_CONTRACT_ADDRESS = contractAddresses.Auction;

// Dedicated Hardhat Account #9 used strictly for auto-deploying contracts & seeding liquidity
// so Admin/Seller/Bidder/Oracle nonces and balances are never touched outside user transactions
export const CONTRACT_DEPLOYER_PRIVATE_KEY =
  '0x2a871d0798f97d79848a013d4936a73bf4cc922c825d33c1cf7073dff6d409c6';

/**
 * Deterministic Hardhat Role Signers (Chain ID 31337):
 * Account 0: Admin    (0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266) - Deploy contracts & configure platform
 * Account 1: Seller   (0x70997970C51812dc3A010C7d01b50e0d17dc79C8) - Create vehicle auctions
 * Account 2: Bidder 1 (0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC) - Participate in auctions (Bidder 1)
 * Account 3: Bidder 2 (0x90F79bf6EB2c4f870365E785982E1f101E93b906) - Participate in auctions (Bidder 2)
 * Account 4: Oracle   (0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65) - Submit AI predictions on-chain (Background service)
 */
export const HARDHAT_WALLETS: WalletAccount[] = [
  {
    address: contractAddresses.roles.account0_admin,
    privateKey: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
    ens: 'admin.hardhat.eth',
    label: 'Account 0 — Admin',
    accountNumber: 0,
    accountIndex: 0,
    role: 'admin',
    roleTitle: 'Administrator',
    connectButtonText: 'Connect as Admin',
    balanceEth: 10000.0,
    badgeColor: '#D97706',
    description: 'Deploy contracts and configure the platform.',
    isHumanFacing: true,
  },
  {
    address: contractAddresses.roles.account1_seller,
    privateKey: '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d',
    ens: 'seller.hardhat.eth',
    label: 'Account 1 — Seller',
    accountNumber: 1,
    accountIndex: 1,
    role: 'seller',
    roleTitle: 'Vehicle Seller',
    connectButtonText: 'Connect as Seller',
    balanceEth: 10000.0,
    badgeColor: '#2563EB',
    description: 'Create and manage vehicle auctions.',
    isHumanFacing: true,
  },
  {
    address: contractAddresses.roles.account2_bidder1,
    privateKey: '0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a',
    ens: 'bidder1.hardhat.eth',
    label: 'Account 2 — Bidder 1',
    accountNumber: 2,
    accountIndex: 2,
    role: 'bidder',
    roleTitle: 'Vehicle Bidder',
    bidderIdentifier: 'Bidder 1',
    connectButtonText: 'Connect as Bidder 1',
    balanceEth: 10000.0,
    badgeColor: '#6D28D9',
    description: 'Participate in vehicle auctions as the first bidder.',
    isHumanFacing: true,
  },
  {
    address: contractAddresses.roles.account3_bidder2,
    privateKey: '0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6',
    ens: 'bidder2.hardhat.eth',
    label: 'Account 3 — Bidder 2',
    accountNumber: 3,
    accountIndex: 3,
    role: 'bidder',
    roleTitle: 'Vehicle Bidder',
    bidderIdentifier: 'Bidder 2',
    connectButtonText: 'Connect as Bidder 2',
    balanceEth: 10000.0,
    badgeColor: '#06B6D4',
    description: 'Participate in vehicle auctions as the second bidder.',
    isHumanFacing: true,
  },
  {
    address: contractAddresses.roles.account4_oracle,
    privateKey: '0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a',
    ens: 'oracle.hardhat.eth',
    label: 'Account 4 — Oracle (Background)',
    accountNumber: 4,
    accountIndex: 4,
    role: 'oracle',
    roleTitle: 'Price Oracle',
    connectButtonText: 'Oracle Service',
    balanceEth: 10000.0,
    badgeColor: '#059669',
    description: 'On-chain Price Oracle maintaining live ETH/INR exchange rates on PriceOracle.sol.',
    isHumanFacing: false,
  },
];

export const HUMAN_ROLE_WALLETS = HARDHAT_WALLETS.filter((w) => w.isHumanFacing);
export const ORACLE_BACKGROUND_ACCOUNT = HARDHAT_WALLETS.find((w) => w.role === 'oracle')!;
