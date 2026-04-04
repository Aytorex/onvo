import { buildModule } from '@nomicfoundation/hardhat-ignition/modules';

/**
 * Local / dev: deploys WorldIdRouterMock + MockERC20 + InvoiceRegistry with a test token allowlisted.
 */
export default buildModule('InvoiceRegistryLocalModule', (m) => {
  const worldId = m.contract('WorldIdRouterMock', []);
  const token = m.contract('MockERC20', ['Test USDC', 'tUSDC', 6]);
  const registry = m.contract('InvoiceRegistry', [
    m.getAccount(0),
    worldId,
    m.getParameter('externalNullifierHash', 1n),
    [token],
    m.getParameter('commissionRecipient', m.getAccount(0)),
  ]);
  return { registry, worldId, token };
});
