// Auto-generated from Hardhat/Solc compiled artifacts (Solidity 0.8.24 + OpenZeppelin v5)
export const PRICE_ORACLE_ARTIFACT = {
  "contractName": "PriceOracle",
  "abi": [
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "_initialOracle",
          "type": "address"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "constructor"
    },
    {
      "inputs": [],
      "name": "InvalidAddress",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "InvalidPredictionData",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "InvalidPrice",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "OnlyAuthorizedOracle",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "OnlyOwner",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "PredictionNotFound",
      "type": "error"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "previousOracle",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "newOracle",
          "type": "address"
        }
      ],
      "name": "AuthorizedOracleUpdated",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "predictionId",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "predictedPricePaise",
          "type": "uint256"
        },
        {
          "indexed": true,
          "internalType": "bytes32",
          "name": "productDataHash",
          "type": "bytes32"
        },
        {
          "indexed": false,
          "internalType": "string",
          "name": "modelVersion",
          "type": "string"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "timestamp",
          "type": "uint256"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "oracleAddress",
          "type": "address"
        }
      ],
      "name": "PredictionRegistered",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "uint80",
          "name": "roundId",
          "type": "uint80"
        },
        {
          "indexed": false,
          "internalType": "int256",
          "name": "price",
          "type": "int256"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "updatedAt",
          "type": "uint256"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "updater",
          "type": "address"
        }
      ],
      "name": "PriceUpdated",
      "type": "event"
    },
    {
      "stateMutability": "payable",
      "type": "fallback"
    },
    {
      "inputs": [],
      "name": "authorizedOracle",
      "outputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "name": "balanceOf",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "pure",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "decimals",
      "outputs": [
        {
          "internalType": "uint8",
          "name": "",
          "type": "uint8"
        }
      ],
      "stateMutability": "pure",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "description",
      "outputs": [
        {
          "internalType": "string",
          "name": "",
          "type": "string"
        }
      ],
      "stateMutability": "pure",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "getLatestEthInrRate",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "_predictionId",
          "type": "uint256"
        }
      ],
      "name": "getPrediction",
      "outputs": [
        {
          "components": [
            {
              "internalType": "uint256",
              "name": "predictionId",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "predictedPricePaise",
              "type": "uint256"
            },
            {
              "internalType": "bytes32",
              "name": "productDataHash",
              "type": "bytes32"
            },
            {
              "internalType": "string",
              "name": "modelVersion",
              "type": "string"
            },
            {
              "internalType": "uint256",
              "name": "timestamp",
              "type": "uint256"
            },
            {
              "internalType": "address",
              "name": "oracleAddress",
              "type": "address"
            },
            {
              "internalType": "bool",
              "name": "exists",
              "type": "bool"
            }
          ],
          "internalType": "struct PriceOracle.PredictionRecord",
          "name": "",
          "type": "tuple"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "latestRoundData",
      "outputs": [
        {
          "internalType": "uint80",
          "name": "roundId",
          "type": "uint80"
        },
        {
          "internalType": "int256",
          "name": "answer",
          "type": "int256"
        },
        {
          "internalType": "uint256",
          "name": "startedAt",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "updatedAt",
          "type": "uint256"
        },
        {
          "internalType": "uint80",
          "name": "answeredInRound",
          "type": "uint80"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "name",
      "outputs": [
        {
          "internalType": "string",
          "name": "",
          "type": "string"
        }
      ],
      "stateMutability": "pure",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "nextPredictionId",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "owner",
      "outputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "_predictionId",
          "type": "uint256"
        }
      ],
      "name": "predictionExists",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "_predictedPricePaise",
          "type": "uint256"
        },
        {
          "internalType": "bytes32",
          "name": "_productDataHash",
          "type": "bytes32"
        },
        {
          "internalType": "string",
          "name": "_modelVersion",
          "type": "string"
        },
        {
          "internalType": "uint256",
          "name": "_timestamp",
          "type": "uint256"
        }
      ],
      "name": "registerPrediction",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "predictionId",
          "type": "uint256"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "_newOracle",
          "type": "address"
        }
      ],
      "name": "setAuthorizedOracle",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "bytes4",
          "name": "",
          "type": "bytes4"
        }
      ],
      "name": "supportsInterface",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "pure",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "symbol",
      "outputs": [
        {
          "internalType": "string",
          "name": "",
          "type": "string"
        }
      ],
      "stateMutability": "pure",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "int256",
          "name": "_newPrice",
          "type": "int256"
        }
      ],
      "name": "updateEthInrPrice",
      "outputs": [
        {
          "internalType": "uint80",
          "name": "roundId",
          "type": "uint80"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "version",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "pure",
      "type": "function"
    },
    {
      "stateMutability": "payable",
      "type": "receive"
    }
  ],
  "bytecode": "0x60803461009557601f610c3738819003918201601f19168301916001600160401b038311848410176100995780849260209460405283398101031261009557516001600160a01b038116908190036100955780156100835760018060a01b031933815f5416175f5560015416176001556001600255604051610b8990816100ae8239f35b60405163e6c4247b60e01b8152600490fd5b5f80fd5b634e487b7160e01b5f52604160045260245ffdfe6080806040526004361015610034575b5036156100325760405160208101905f82526020815261002e81610add565b5190f35b005b5f3560e01c90816301ffc9a714610a5757508063031e74511461098857806306fdde031461092b5780632a6d2c171461088f578063313ce5671461087457806350b01ab4146108385780635398b873146104d657806354bede8d146104ae57806354fd4d501461049357806370a08231146104665780637284e416146104125780638da5cb5b146103eb57806395d89b41146103a0578063d8d9292e14610383578063fe83bece146101b8578063feaf968c146101345763ff9e387d146100fb575f61000f565b34610130576020366003190112610130576004355f526003602052602060ff600560405f20015460a01c166040519015158152f35b5f80fd5b34610130575f366003190112610130576004545f8113156101a95760a0905b60065480156101a157905b60055469ffffffffffffffffffff92908316801561019857925b604051931691828452602084015280604084015260608301526080820152f35b50600192610178565b50429061015e565b5060a06516bcc41e9000610153565b3461013057602080600319360112610130576004355f60c06040516101dc81610ac1565b82815282858201528260408201526060808201528260808201528260a08201520152805f526003825260ff600560405f20015460a01c1615610371575f526003815260405f206040519061022f82610ac1565b805482526001808201548484019081526002830154906040850191825285600385016040519485915f9181549161026583610b1b565b808652926001811690811561034e5750600114610310575b50505061028c92500384610af9565b606085019283526102f660056004860154956080880196875201549360018060a01b039360a0880193858716855260ff60c08a019760a01c1615158752604051998a99818b5251908a01525160408901525160608801525160e06080880152610100870190610a83565b935160a0860152511660c084015251151560e08301520390f35b5f90815285812095935091905b81831061033657508a94505082010161028c8a8061027d565b8554898401850152948501948894509183019161031d565b9250505061028c94925060ff191682840152151560051b82010188928a8061027d565b6040516316c919af60e31b8152600490fd5b34610130575f366003190112610130576020600254604051908152f35b34610130575f366003190112610130576103e76040516103bf81610add565b600781526622aa2417a4a72960c91b6020820152604051918291602083526020830190610a83565b0390f35b34610130575f366003190112610130575f546040516001600160a01b039091168152602090f35b34610130575f366003190112610130576103e760405161043181610add565b6014815273115512080bc812539488141c9a58d9481199595960621b6020820152604051918291602083526020830190610a83565b34610130576020366003190112610130576004356001600160a01b038116036101305760206040515f8152f35b34610130575f36600319011261013057602060405160038152f35b34610130575f366003190112610130576001546040516001600160a01b039091168152602090f35b346101305760803660031901126101305760443567ffffffffffffffff811161013057366023820112156101305767ffffffffffffffff81600401351161013057366024826004013583010111610130576001546001600160a01b031633036108265760043515801561081c575b8015610810575b6107fe576002545f1981146107ea57600181016002556040519161056e83610ac1565b818352600435602084015260243560408401526040519261059d6020601f19601f856004013501160185610af9565b60048201358085526024830160208601375f60208360040135860101526060810193845260643560808201523360a0820152600160c0820152825f52600360205260405f20938151855560208201516001860155604082015160028601555193845167ffffffffffffffff81116107d65761061b6003830154610b1b565b95601f8711610792575b602096508690601f83116001146107255760059392915f918361071a575b50508160011b915f199060031b1c19161760038201555b60808301516004820155019060018060a01b0360a08201511682549160c060ff60a01b910151151560a01b16916affffffffffffffffffffff60a81b16171790556040519060043582526060848301528060040135606083015280600401356024820160808401375f60808260040135840101526064356040830152827f43fd9bd8c685fd4ccd5d735451786c3e091b70479fa1e2c634e9ef1eb0f3f0fb339360808160243595601f8019916004013501168101030190a4604051908152f35b015190508880610643565b90600384015f52875f20915f5b601f198516811061077b575091839160019360059695601f19811610610763575b505050811b01600382015561065a565b01515f1960f88460031b161c19169055888080610753565b919289600181928685015181550194019201610732565b600383015f5260205f20601f830160051c8101602084106107cf575b601f890160051c820181106107c4575050610625565b5f81556001016107ae565b50806107ae565b634e487b7160e01b5f52604160045260245ffd5b634e487b7160e01b5f52601160045260245ffd5b6040516327dc0e1960e01b8152600490fd5b5080600401351561054b565b5060243515610544565b6040516304e0435360e01b8152600490fd5b34610130575f366003190112610130576004545f811315610865576020905b6305f5e10060405191058152f35b5060206516bcc41e9000610857565b34610130575f36600319011261013057602060405160088152f35b34610130576020366003190112610130576004356001600160a01b038181169182900361013057805f5416330361091957811561090757600154826bffffffffffffffffffffffff60a01b821617600155167f0d5e99efb62d9924e022d899ea5776d105991634042227310043d2c17ce25a635f80a3005b60405163e6c4247b60e01b8152600490fd5b604051635fc483c560e01b8152600490fd5b34610130575f366003190112610130576103e760405161094a81610add565b601781527f41756374696f6e436861696e50726963654f7261636c650000000000000000006020820152604051918291602083526020830190610a83565b34610130576020366003190112610130575f5460043590336001600160a01b0391821614159081610a48575b50610826575f811315610a375760055469ffffffffffffffffffff91828216928084146107ea5760016020940116809269ffffffffffffffffffff19161760055580600455426006556040519081524283820152817fc55ba461e0c92000ad10f5e4c13bc371f100bed0e2c38b339e541aaf5ff5239c60403393a3604051908152f35b60405162bfc92160e01b8152600490fd5b905060015416331415826109b4565b34610130576020366003190112610130576004356001600160e01b031981160361013057805f60209252f35b91908251928382525f5b848110610aad575050825f602080949584010152601f8019910116010190565b602081830181015184830182015201610a8d565b60e0810190811067ffffffffffffffff8211176107d657604052565b6040810190811067ffffffffffffffff8211176107d657604052565b90601f8019910116810190811067ffffffffffffffff8211176107d657604052565b90600182811c92168015610b49575b6020831014610b3557565b634e487b7160e01b5f52602260045260245ffd5b91607f1691610b2a56fea264697066735822122021b8fc5b0da0dc68449a5123ab6d365dd1fbe92911dd72147ff75e35c2087a4b64736f6c63430008180033"
};

export const AUCTION_ARTIFACT = {
  "contractName": "Auction",
  "abi": [
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "_priceOracle",
          "type": "address"
        }
      ],
      "stateMutability": "payable",
      "type": "constructor"
    },
    {
      "inputs": [],
      "name": "AlreadyCommitted",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "AlreadyFinalized",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "AlreadyRevealed",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "BidBelowStartingPrice",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "CommitmentHashMismatch",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "IncorrectDepositAmount",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "IncorrectSettlementAmount",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "InvalidDeadlines",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "InvalidOraclePrediction",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "InvalidPricingConfig",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "NoCommitmentFound",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "NotInCommitPhase",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "NotInRevealPhase",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "NothingToWithdraw",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "OnlyWinnerCanSettle",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "ReentrancyGuardReentrantCall",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "RevealPhaseNotEnded",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "SellerCannotBidOnOwnAuction",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "TransferFailed",
      "type": "error"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "auctionId",
          "type": "uint256"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "seller",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "string",
          "name": "category",
          "type": "string"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "predictionId",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "startingPrice",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "reservePrice",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "fixedDeposit",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "commitDeadline",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "revealDeadline",
          "type": "uint256"
        }
      ],
      "name": "AuctionCreated",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "auctionId",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "bool",
          "name": "sold",
          "type": "bool"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "winner",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "winningBid",
          "type": "uint256"
        }
      ],
      "name": "AuctionFinalized",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "auctionId",
          "type": "uint256"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "bidder",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "bytes32",
          "name": "commitmentHash",
          "type": "bytes32"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "depositPaid",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "committedAt",
          "type": "uint256"
        }
      ],
      "name": "BidCommitted",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "auctionId",
          "type": "uint256"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "bidder",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "bidAmount",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "bool",
          "name": "isCurrentHighest",
          "type": "bool"
        }
      ],
      "name": "BidRevealed",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "auctionId",
          "type": "uint256"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "bidder",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "amount",
          "type": "uint256"
        }
      ],
      "name": "RefundClaimed",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "auctionId",
          "type": "uint256"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "seller",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "amount",
          "type": "uint256"
        }
      ],
      "name": "SellerProceedsWithdrawn",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "auctionId",
          "type": "uint256"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "winner",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "totalBidPaid",
          "type": "uint256"
        }
      ],
      "name": "WinnerSettled",
      "type": "event"
    },
    {
      "stateMutability": "payable",
      "type": "fallback"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "name": "auctionProceedsPool",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "name": "auctions",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "auctionId",
          "type": "uint256"
        },
        {
          "internalType": "address",
          "name": "seller",
          "type": "address"
        },
        {
          "internalType": "string",
          "name": "title",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "category",
          "type": "string"
        },
        {
          "internalType": "bytes32",
          "name": "metadataHash",
          "type": "bytes32"
        },
        {
          "internalType": "uint256",
          "name": "predictionId",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "startingPrice",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "reservePrice",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "fixedDeposit",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "commitDeadline",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "revealDeadline",
          "type": "uint256"
        },
        {
          "internalType": "address",
          "name": "highestBidder",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "highestBid",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "winningCommitTime",
          "type": "uint256"
        },
        {
          "internalType": "bool",
          "name": "finalized",
          "type": "bool"
        },
        {
          "internalType": "bool",
          "name": "sold",
          "type": "bool"
        },
        {
          "internalType": "bool",
          "name": "winnerSettled",
          "type": "bool"
        },
        {
          "internalType": "bool",
          "name": "sellerWithdrawn",
          "type": "bool"
        },
        {
          "internalType": "uint256",
          "name": "commitCount",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "revealCount",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "name": "balanceOf",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "pure",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "_auctionId",
          "type": "uint256"
        }
      ],
      "name": "claimRefund",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "_auctionId",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "_refundAmount",
          "type": "uint256"
        }
      ],
      "name": "claimRefundWithAmount",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "_auctionId",
          "type": "uint256"
        },
        {
          "internalType": "bytes32",
          "name": "_commitmentHash",
          "type": "bytes32"
        }
      ],
      "name": "commitBid",
      "outputs": [],
      "stateMutability": "payable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        },
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "name": "commitments",
      "outputs": [
        {
          "internalType": "bytes32",
          "name": "commitmentHash",
          "type": "bytes32"
        },
        {
          "internalType": "uint256",
          "name": "depositPaid",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "committedAt",
          "type": "uint256"
        },
        {
          "internalType": "bool",
          "name": "committed",
          "type": "bool"
        },
        {
          "internalType": "bool",
          "name": "revealed",
          "type": "bool"
        },
        {
          "internalType": "uint256",
          "name": "revealedAmount",
          "type": "uint256"
        },
        {
          "internalType": "bool",
          "name": "depositRefunded",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "string",
          "name": "_title",
          "type": "string"
        },
        {
          "internalType": "bytes32",
          "name": "_metadataHash",
          "type": "bytes32"
        },
        {
          "internalType": "uint256",
          "name": "_predictionId",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "_startingPrice",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "_reservePrice",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "_fixedDeposit",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "_commitDurationSeconds",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "_revealDurationSeconds",
          "type": "uint256"
        }
      ],
      "name": "createAuction",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "auctionId",
          "type": "uint256"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "decimals",
      "outputs": [
        {
          "internalType": "uint8",
          "name": "",
          "type": "uint8"
        }
      ],
      "stateMutability": "pure",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "_auctionId",
          "type": "uint256"
        }
      ],
      "name": "finalizeAuction",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "name",
      "outputs": [
        {
          "internalType": "string",
          "name": "",
          "type": "string"
        }
      ],
      "stateMutability": "pure",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "nextAuctionId",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "name": "pendingSellerProceeds",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "priceOracle",
      "outputs": [
        {
          "internalType": "contract IPriceOracle",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "_auctionId",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "_bidAmount",
          "type": "uint256"
        },
        {
          "internalType": "bytes32",
          "name": "_salt",
          "type": "bytes32"
        }
      ],
      "name": "revealBid",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "_auctionId",
          "type": "uint256"
        }
      ],
      "name": "settleWinnerPayment",
      "outputs": [],
      "stateMutability": "payable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "bytes4",
          "name": "",
          "type": "bytes4"
        }
      ],
      "name": "supportsInterface",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "pure",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "symbol",
      "outputs": [
        {
          "internalType": "string",
          "name": "",
          "type": "string"
        }
      ],
      "stateMutability": "pure",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "_auctionId",
          "type": "uint256"
        }
      ],
      "name": "withdrawSellerProceeds",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "_auctionId",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "_proceedsAmount",
          "type": "uint256"
        }
      ],
      "name": "withdrawSellerProceedsWithAmount",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "stateMutability": "payable",
      "type": "receive"
    }
  ],
  "bytecode": "0x60a0601f61159b38819003918201601f19168301916001600160401b038311848410176100735780849260209460405283398101031261006f57516001600160a01b0381169081900361006f5760015f5560805260018055604051611513908161008882396080518161118c0152f35b5f80fd5b634e487b7160e01b5f52604160045260245ffdfe610100806040526004361015610035575b5036156100335760405160208101905f82526020815261002f8161136e565b5190f35b005b5f3560e01c90816301ffc9a7146112b65750806306fdde031461125957806321dc65d0146111bb5780632630c12f146111775780632e46c018146110da578063313ce567146110bf5780634c1e0eed14610ac45780634d380a0d14610992578063571a26a01461080157806359df96c3146107c95780635b7baf641461070357806370a08231146106df5780639387e2c5146106b55780639468cb611461059857806395d89b411461054d578063a16e876b1461044c578063d46f34a8146102fd578063e8083863146101d4578063e90d4c061461013e5763fc5284821461011d575f610010565b3461013a575f36600319011261013a576020600154604051908152f35b5f80fd5b3461013a57604036600319011261013a576024356001600160a01b0381169081900361013a576004355f52600360205260405f20905f5260205260e060405f2080549060018101549060ff600282015460038301549082600560048601549501541694604051968752602087015260408601528181161515606086015260081c161515608084015260a0830152151560c0820152f35b3461013a57602036600319011261013a576004356101f061148d565b805f52600260205260405f20908154156102e1575b600e8201805460ff1981166001178255600b840180546001600160a01b039391929084161515806102cf575b1561028557507f5aad2e7428b047118efa9ba1720828c5c43fb520cb2dd3f64457dc33da8c3d0992604092600c9261010061ff00198254161790555416940154815190600182526020820152a35b60015f55005b7f5aad2e7428b047118efa9ba1720828c5c43fb520cb2dd3f64457dc33da8c3d0993506040925094600c9160015f9761ffff191617905501548151908582526020820152a361027f565b50600c86015460078701541115610231565b8082556001820180546001600160a01b03191633179055610205565b3461013a5761030b36611320565b9061031461148d565b805f5260206002815260405f20928015155f1461043c57925b8315610428575b831561041c575b83158015610413575b61040157600e01805463ff000000191663010000001790555f828152600582526040808220829055338252600483529020805484116103f9578054908482039182116103e557555b5f80808086335af161039c6114ae565b50156103d3577feecf77102ec152b41a40fd43f06ccbc3b43a327c2fa5bff9dc58c8574c41b9f0906040519384523393a360015f55005b6040516312171d8360e31b8152600490fd5b634e487b7160e01b5f52601160045260245ffd5b5f905561038c565b604051630686827b60e51b8152600490fd5b50834710610344565b600c810154935061033b565b9250335f526004815260405f205492610334565b506005815260405f20549261032d565b60208060031936011261013a5760043561046461148d565b805f52600282527faa6346430dbc4d05a7910374f08dafb15a57cba603387d5d14bfef94d371613f60405f2092835415610545575b6003815260405f81812033825283522060018101549094908015610535576104c56005915b3490611480565b600e8301805462ffffff1916620101011790559501805460ff191660019081179091555f858152600584526040902086905501546001600160a01b031680610518575b506040519384523393a360015f55005b5f526004815260405f2061052d858254611480565b905584610508565b5060056104c560088301546104be565b828455610499565b3461013a575f36600319011261013a5761059460405161056c8161136e565b600781526620aaa1aa24a7a760c91b60208201526040519182916020835260208301906112e2565b0390f35b604036600319011261013a576024356004356105b261148d565b34156106a357805f52600260205260405f20805415610668575b600f90825f52600360205260405f20335f5260205260405f20848155600181016105f7348254611480565b90554260028201556005600382019160ff19926001848254161790550190815416905501805490600182018092116103e557556040519182523460208301524260408301527fdc1e68092c52bba4a8cd2a3225207cd77f158b31afcab538cd291b5e22c4b20460603393a360015f55005b818155346008820155610e1042018042116103e5576009820155611c204201908142116103e557600a8101919091555f19600d8201556105cc565b604051639ad7e28760e01b8152600490fd5b3461013a57602036600319011261013a576004355f526005602052602060405f2054604051908152f35b3461013a57602036600319011261013a576106f861144e565b5060206040515f8152f35b3461013a57602036600319011261013a5760043561071f61148d565b805f52600260205260405f2090600360205260405f20335f5260205260405f206001810180549384156107bd575b50831580156107b4575b6104015760055f9201600160ff19825416179055555f80808085335af161077c6114ae565b50156103d3576040519182527ff3f402280ef0a7905e124aa621b65eaeb2725c343e8b36d398ed78c29daf285c60203393a360015f55005b50834710610757565b6008015493508461074d565b3461013a57602036600319011261013a576001600160a01b036107ea61144e565b165f526004602052602060405f2054604051908152f35b3461013a57602036600319011261013a576004355f52600260205260405f20805460a052600160a01b6001900390816001820154169060028101610844906113ac565b60e052610853600382016113ac565b60048201546080526005820154936006830154906007840154906008850154906009860154600a87015491600b8801541692600c88015494600d89015496600e8a015498600f8b01549a601001549b60405160c0526102809060a05160c0515260c051602001528060c0516040015260c0510160e051906108d3916112e2565b60c051810360c051606001526108e8916112e2565b9b60805160c0516080015260c05160a0015260c05160c0015260c05160e0015260c051610100015260c051610120015260c051610140015260c051610160015260c051610180015260c0516101a0015260ff8116151560c0516101c001528060081c60ff16151560c0516101e001528060101c60ff16151560c051610200015260181c60ff16151560c051610220015260c051610240015260c051610260015260c051900360c051f35b3461013a57606036600319011261013a576024356004356109b161148d565b805f52600260205260405f20805415610ab5575b600360205260405f20335f5260205260405f20908360046002840193845415610aad575b6003810161010161ffff19825416179055015560108101805490600182018092116103e557555f9184600c83018054808311908115610a8f575b50610a66575b50505050604051928352151560208301527f18e12105801f19bd11c1eab40db783709bb72a09bef3a44bf2062be4963922d960403393a360015f55005b55600b820180546001600160a01b0319163317905554600d919091015550600183808481610a29565b9050821480610a9f575b88610a23565b508254600d85015411610a99565b4285556109e9565b8181555f19600d8201556109c5565b3461013a5761010036600319011261013a5767ffffffffffffffff6004351161013a5736602360043501121561013a5767ffffffffffffffff600435600401351161013a573660246004356004013560043501011161013a576064351580156110b2575b80156110a8575b6110965760c43515801561108c575b61107a576001545f1981146103e55760018101600155610b6060c43542611480565b90610b6d60e43583611480565b91604051928361028081011067ffffffffffffffff61028086011117610f9d576102808401604052828452336020850152610bad60043560040135611464565b610bba604051918261138a565b60048035908101358083529060240160208301375f602060043560040135830101526040850152604051610bed8161136e565b600781526676656869636c6560c81b60208201526060850152602435608085015260443560a085015260643560c085015260843560e085015260a43561010085015281610120850152806101408501525f6101608501525f6101808501525f196101a08501525f6101c08501525f6101e08501525f6102008501525f6102208501525f6102408501525f610260850152825f52600260205260405f208451815560018060a01b036020860151166bffffffffffffffffffffffff60a01b600183015416176001820155604085015180519067ffffffffffffffff8211610f9d578190610cdc6002850154611336565b601f811161102a575b50602090601f8311600114610fbc575f92610fb1575b50508160011b915f199060031b1c19161760028201555b606085015194855167ffffffffffffffff8111610f9d57610d366003840154611336565b96601f8811610f55575b602097508790601f8311600114610ee557918060109492610260945f92610eda575b50508160011b915f199060031b1c19161760038501555b6080810151600485015560a0810151600585015560c0810151600685015560e0810151600785015561010081015160088501556101208101516009850155610140810151600a850155600b840160018060a01b03610160830151166bffffffffffffffffffffffff60a01b825416179055610180810151600c8501556101a0810151600d850155600e84016101c08201511515815462ff000061ff006101e0860151151560081b1661020086015115159260ff63ff000000610220890151151560181b1695169063ffffffff1916171791871b1617179055610240810151600f85015501519101556040519160e08352600760e08401526676656869636c6560c81b610100840152604435858401526064356040840152608435606084015260a435608084015260a083015260c0820152817f0c655e71e0275c814dfed42d168ebeb7d3bf4724e1d4d7fd07f593503922408a6101203393a3604051908152f35b015190508a80610d62565b90600385015f52885f20915f5b601f1985168110610f3e575092601094926001926102609583601f19811610610f26575b505050811b016003850155610d79565b01515f1960f88460031b161c191690558a8080610f16565b91928a600181928685015181550194019201610ef2565b600384015f5260205f20601f830160051c81019860208410610f93575b601f0160051c01975b888110610f885750610d40565b5f8155600101610f7b565b9098508890610f72565b634e487b7160e01b5f52604160045260245ffd5b015190508780610cfb565b9250600284015f5260205f20905f935b601f198416851061100f576001945083601f19811610610ff7575b505050811b016002820155610d12565b01515f1960f88460031b161c19169055878080610fe7565b81810151835560209485019460019093019290910190610fcc565b909150600284015f5260205f20601f840160051c810160208510611073575b90849392915b601f830160051c82018110611065575050610ce5565b5f815585945060010161104f565b5080611049565b604051630a716d6d60e41b8152600490fd5b5060e43515610b3e565b6040516315741a9f60e21b8152600490fd5b5060a43515610b2f565b5060643560843510610b28565b3461013a575f36600319011261013a57602060405160128152f35b3461013a576110e836611320565b906110f161148d565b805f52600260205260405f2091600360205260405f20335f5260205260405f20908015155f1461116b57925b831561115f575b5082158015611156575b6104015760018160055f93018260ff1982541617905501555f80808085335af161077c6114ae565b5082471061112e565b60080154925083611124565b5060018101549261111d565b3461013a575f36600319011261013a576040517f00000000000000000000000000000000000000000000000000000000000000006001600160a01b03168152602090f35b3461013a5760208060031936011261013a576004356111d861148d565b805f526002825260405f20916005815260405f205492831561042857831561041c57831580156104135761040157600e01805463ff000000191663010000001790555f828152600582526040808220829055338252600483529020805484116103f9578054908482039182116103e557555f80808086335af161039c6114ae565b3461013a575f36600319011261013a576105946040516112788161136e565b601981527f41756374696f6e436861696e5365616c656441756374696f6e0000000000000060208201526040519182916020835260208301906112e2565b3461013a57602036600319011261013a576004356001600160e01b031981160361013a57805f60209252f35b91908251928382525f5b84811061130c575050825f602080949584010152601f8019910116010190565b6020818301810151848301820152016112ec565b604090600319011261013a576004359060243590565b90600182811c92168015611364575b602083101461135057565b634e487b7160e01b5f52602260045260245ffd5b91607f1691611345565b6040810190811067ffffffffffffffff821117610f9d57604052565b90601f8019910116810190811067ffffffffffffffff821117610f9d57604052565b9060405191825f82546113be81611336565b908184526020946001916001811690815f1461142c57506001146113ee575b5050506113ec9250038361138a565b565b5f90815285812095935091905b8183106114145750506113ec93508201015f80806113dd565b855488840185015294850194879450918301916113fb565b925050506113ec94925060ff191682840152151560051b8201015f80806113dd565b600435906001600160a01b038216820361013a57565b67ffffffffffffffff8111610f9d57601f01601f191660200190565b919082018092116103e557565b60025f541461149c5760025f55565b604051633ee5aeb560e01b8152600490fd5b3d156114d8573d906114bf82611464565b916114cd604051938461138a565b82523d5f602084013e565b60609056fea2646970667358221220a532b009f9e3ca29745aa00452fbd62898b688f2d3b70ab66a9c3381c665943a64736f6c63430008180033"
};
