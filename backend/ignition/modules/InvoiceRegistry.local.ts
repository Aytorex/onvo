import { buildModule } from '@nomicfoundation/hardhat-ignition/modules';

/**
 * Local / dev: deploys MockERC20 + InvoiceRegistry with account[0] as trustedVerifier.
 */
export default buildModule('InvoiceRegistryLocalModule', (m) => {
  const token = m.contract('MockERC20', ['Test USDC', 'tUSDC', 6]);
  const registry = m.contract('InvoiceRegistry', [
    m.getAccount(0),
    m.getAccount(0),
    [token],
    m.getParameter('commissionRecipient', m.getAccount(0)),
  ]);
  return { registry, token };
});
