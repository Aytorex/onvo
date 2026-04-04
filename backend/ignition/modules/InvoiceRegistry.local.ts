import { buildModule } from '@nomicfoundation/hardhat-ignition/modules';

/**
 * Local / dev: deploys MockERC20 + InvoiceRegistry (owner = account[0]).
 */
export default buildModule('InvoiceRegistryLocalModule', (m) => {
  const token = m.contract('MockERC20', ['Test USDC', 'tUSDC', 6]);
  const registry = m.contract('InvoiceRegistry', [
    m.getAccount(0),
    [token],
    m.getParameter('commissionRecipient', m.getAccount(0)),
  ]);
  return { registry, token };
});
