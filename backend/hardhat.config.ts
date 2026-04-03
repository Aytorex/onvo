import { defineConfig } from 'hardhat/config';
import hardhatFoundry from '@nomicfoundation/hardhat-foundry';
import hardhatToolboxMochaEthers from '@nomicfoundation/hardhat-toolbox-mocha-ethers';

const { ETHERSCAN_API_KEY = '' } = process.env;

export default defineConfig({
  plugins: [hardhatToolboxMochaEthers, hardhatFoundry],
  paths: {
    tests: {
      mocha: './test/hardhat',
    },
  },
  solidity: {
    version: '0.8.28',
  },
  typechain: {
    outDir: './typechain-types',
  },
  networks: {
    hardhat: {
      type: 'edr-simulated',
      chainType: 'l1',
      chainId: 31337,
    },
    // polygonZkEvm: {
    //   type: 'http',
    //   chainType: 'l1',
    //   chainId: 1101,
    //   url: process.env.ALCHEMY_ENDPOINT_URL_POLYGON_ZKEVM_MAINNET ?? '',
    //   accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    // },
    // polygonZkEvmCardona: {
    //   type: 'http',
    //   chainType: 'l1',
    //   chainId: 2442,
    //   url: process.env.ALCHEMY_ENDPOINT_URL_POLYGON_ZKEVM_CARDONA ?? '',
    //   accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    // },
  },
  verify: {
    etherscan: {
      apiKey: ETHERSCAN_API_KEY,
    },
  },
});
