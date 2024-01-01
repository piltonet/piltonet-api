require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.20",
  defaultNetwork: process.env.DEFAULT_NETWORK,
  networks: {
    viction: {
      url: "https://rpc.viction.xyz",
      accounts: [process.env.SERVICE_ADMIN_PRIVATE_KEY || ""]
    },
    victestnet: {
      url: "https://rpc-testnet.viction.xyz",
      accounts: [process.env.SERVICE_ADMIN_PRIVATE_KEY || ""]
    },
    tomotestnet: {
      url: "https://rpc.testnet.tomochain.com",
      accounts: [process.env.SERVICE_ADMIN_PRIVATE_KEY || ""]
    }
  }
};
