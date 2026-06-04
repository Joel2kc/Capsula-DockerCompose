require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.28",

  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },

  networks: {

    hederaTestnet: {
      url: process.env.HEDERA_TESTNET_URL,
      accounts: [process.env.PRIVATE_KEY],
      chainId: 296,


    },
    hederaMainnet: {
      url: process.env.HEDERA_MAINNET_URL,
      accounts: [process.env.PRIVATE_KEY],
      chainId: 295,
    },

  },
};