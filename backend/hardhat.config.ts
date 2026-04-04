import { defineConfig } from 'hardhat/config';
import hardhatFoundry from '@nomicfoundation/hardhat-foundry';
import hardhatToolboxMochaEthers from '@nomicfoundation/hardhat-toolbox-mocha-ethers';

const {
  ETHERSCAN_API_KEY = '',
  ARCSCAN_API_KEY = 'proapi_cf3E2OPkgbuqbegbTxZMiClbKyWmkXP6ifSsbVAMp7hDEsogKSyywBOHsH7Pn269r_eFbfka',
  ALCHEMY_ENDPOINT_URL_ARC_TESTNET = '',
  ALCHEMY_API_KEY = '',
  ARC_TESTNET_RPC_URL = 'https://rpc.testnet.arc.network',
  PRIVATE_KEY = '',
} = process.env;

const arcTestnetRpc =
  ALCHEMY_ENDPOINT_URL_ARC_TESTNET && ALCHEMY_API_KEY
    ? `${ALCHEMY_ENDPOINT_URL_ARC_TESTNET}${ALCHEMY_API_KEY}`
    : ARC_TESTNET_RPC_URL;

const explorerApiKey = ARCSCAN_API_KEY || ETHERSCAN_API_KEY;

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
  chainDescriptors: {
    5042002: {
      name: 'arc-testnet',
      blockExplorers: {
        etherscan: {
          name: 'ArcScan',
          url: 'https://testnet.arcscan.app',
          apiUrl: 'https://testnet.arcscan.app/api',
        },
      },
    },
  },
  networks: {
    hardhat: {
      type: 'edr-simulated',
      chainType: 'l1',
      chainId: 31337,
    },
    localhost: {
      type: 'http',
      chainType: 'l1',
      chainId: 31337,
      url: 'http://127.0.0.1:8545',
    },
    arcTestnet: {
      type: 'http',
      chainType: 'l1',
      chainId: 5042002,
      url: arcTestnetRpc,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
    },
  },
  verify: {
    etherscan: {
      apiKey: explorerApiKey,
    },
  },
});
