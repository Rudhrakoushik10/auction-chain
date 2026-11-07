"""
Continuous on-chain event listener for PriceOracle.sol on Hardhat (Chain ID 31337).
Monitors PredictionRegistered events and keeps the Oracle Worker daemon active.
"""
import time
from web3 import Web3
from oracle.config import (
    HARDHAT_RPC_URL,
    PRICE_ORACLE_CONTRACT_ADDRESS,
    AUTHORIZED_ORACLE_SIGNER,
)

PRICE_ORACLE_ABI = [
    {
        "anonymous": False,
        "inputs": [
            {"indexed": True, "internalType": "uint256", "name": "predictionId", "type": "uint256"},
            {"indexed": False, "internalType": "uint256", "name": "predictedPrice", "type": "uint256"},
            {"indexed": True, "internalType": "bytes32", "name": "productHash", "type": "bytes32"},
            {"indexed": False, "internalType": "string", "name": "modelVersion", "type": "string"},
            {"indexed": False, "internalType": "uint256", "name": "timestamp", "type": "uint256"},
            {"indexed": True, "internalType": "address", "name": "oracleAddress", "type": "address"},
        ],
        "name": "PredictionRegistered",
        "type": "event",
    }
]


def listen_for_oracle_events():
    w3 = Web3(Web3.HTTPProvider(HARDHAT_RPC_URL))

    print(f"[Oracle Worker] Connecting to Hardhat RPC at {HARDHAT_RPC_URL}...")
    while not w3.is_connected():
        print("[Oracle Worker] Waiting for Hardhat node on port 8545 to start...")
        time.sleep(2)

    chain_id = w3.eth.chain_id
    last_block = w3.eth.block_number
    oracle_address = Web3.to_checksum_address(PRICE_ORACLE_CONTRACT_ADDRESS)
    contract = w3.eth.contract(address=oracle_address, abi=PRICE_ORACLE_ABI)

    print(f"[Oracle Worker] Connected to Chain ID {chain_id} at Block #{last_block}")
    print(f"[Oracle Worker] Monitoring PriceOracle.sol ({oracle_address})")
    print(f"[Oracle Worker] Authorized Signer (Account #4): {AUTHORIZED_ORACLE_SIGNER}")
    print("[Oracle Worker] Listening for PredictionRegistered events... (Press CTRL+C to stop)\n")

    try:
        while True:
            try:
                current_block = w3.eth.block_number
                if current_block > last_block:
                    events = contract.events.PredictionRegistered().get_logs(
                        from_block=last_block + 1,
                        to_block=current_block,
                    )
                    for evt in events:
                        args = evt["args"]
                        pred_id = args["predictionId"]
                        price_usd = args["predictedPrice"] / 100.0
                        model_ver = args["modelVersion"]
                        tx_hash = evt["transactionHash"].hex()
                        print(
                            f"[Oracle Event] Block #{evt['blockNumber']} | "
                            f"Prediction #{pred_id}: ${price_usd:,.2f} USD "
                            f"(Model {model_ver}) | Tx: 0x{tx_hash}"
                        )
                    last_block = current_block
            except Exception as err:
                # Re-sync if Hardhat node was restarted
                try:
                    if w3.is_connected():
                        last_block = w3.eth.block_number
                except Exception:
                    pass
            time.sleep(2)
    except KeyboardInterrupt:
        print("\n[Oracle Worker] Shutting down event listener.")
