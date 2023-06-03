require('dotenv').config()
const HDWalletProviderKlaytn = require("truffle-hdwallet-provider-klaytn");
const klaytnPrivateKey = process.env.PK;
const klaytnRpcUrl = "https://public-node-api.klaytnapi.com/v1/cypress";
const klaytnChainId = 8217;

module.exports = {
  networks: {
    klaytn: {
      provider: () =>
        new HDWalletProviderKlaytn(klaytnPrivateKey, klaytnRpcUrl),
      network_id: klaytnChainId,
      gas: 5500000,
      gasPrice: 25000000000,
      skipDryRun: true,
    },
  },
  compilers: {
    solc: {
      version: "0.8.0",
      settings: {
        optimizer: {
          enabled: true,
          runs: 200
        }
      },
    },
  },  
};
