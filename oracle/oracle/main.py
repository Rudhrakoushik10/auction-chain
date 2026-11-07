"""
AuctionChain Oracle Server Entry Point (Terminal 3).
Coordinates between the Backend Vehicle AI Valuation Service (Port 8000)
and PriceOracle.sol on Hardhat Local Network (Chain ID 31337) using Account 4.
"""
from oracle.config import ORACLE_PORT, HARDHAT_RPC_URL, AUTHORIZED_ORACLE_SIGNER
from oracle.event_listener import listen_for_oracle_events


def start_oracle_server():
    print(f"[Oracle Server] Connected to Hardhat RPC {HARDHAT_RPC_URL} (Port {ORACLE_PORT})")
    print(f"[Oracle Server] Authorized Signer (Account 4): {AUTHORIZED_ORACLE_SIGNER}")
    listen_for_oracle_events()


if __name__ == "__main__":
    start_oracle_server()
