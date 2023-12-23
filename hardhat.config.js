require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.20",
  defaultNetwork: "victestnet",
  networks: {
    victestnet: {
      url: "https://rpc.testnet.tomochain.com",
      accounts: [process.env.SERVICE_ADMIN_PRIVATE_KEY || ""]
    },
    vicmainnet: {
      url: "https://rpc.viction.xyz",
      accounts: [process.env.SERVICE_ADMIN_PRIVATE_KEY || ""]
    }
  }
};
