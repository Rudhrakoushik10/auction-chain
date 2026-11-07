from oracle.config import HARDHAT_RPC_URL, PRICE_ORACLE_CONTRACT_ADDRESS

class BlockchainClient:
    def __init__(self):
        self.rpc_url = HARDHAT_RPC_URL
        self.contract_address = PRICE_ORACLE_CONTRACT_ADDRESS
