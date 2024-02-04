const { ethers } = require("hardhat");

class hardhat{

  async getRevertReason(txHash) {
    const tx = await ethers.provider.getTransaction(txHash);
    if(tx) {
      return this.decodeMessage(await ethers.provider.call(tx));
    } else {
      return "Unknown Error!";
    }
  }
  
  decodeMessage(code) {
    // NOTE: `code` may end with 0's which will return a text string with empty whitespace characters
    // This will truncate all 0s and set up the hex string as expected
    let codeString = `0x${code.substring(138)}`.replace(/0+$/, '');
  
    // If the codeString is an odd number of characters, add a trailing 0
    if (codeString.length % 2 === 1) {
      codeString += '0'
    }
  
    return ethers.toUtf8String(codeString)
  }

}

module.exports = new hardhat();
