import { buildModule } from '@nomicfoundation/hardhat-ignition/modules';

/** Arc Testnet USDC (ERC-20 interface) and EURC — see https://docs.arc.network/arc/references/contract-addresses */
const ARC_USDC = '0x3600000000000000000000000000000000000000';
const ARC_EURC = '0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a';

/**
 * Production / Arc: parameters in `ignition/parameters/invoice-registry.arc.json`
 * (copy from `invoice-registry.arc.example.json`). Deploy: `bun run deploy:invoice:arc`.
 */
export default buildModule('InvoiceRegistryProdModule', (m) => {
  const registry = m.contract('InvoiceRegistry', [
    m.getParameter('initialOwner', m.getAccount(0)),
    m.getParameter('worldIdRouter'),
    m.getParameter('externalNullifierHash'),
    m.getParameter('allowedTokens', [ARC_USDC, ARC_EURC]),
  ]);
  return { registry };
});
