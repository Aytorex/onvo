/**
 * InvoiceRegistry — Arc / Hardhat. Set NEXT_PUBLIC_INVOICE_REGISTRY_ADDRESS after deploy.
 * ABI synced from backend compile (InvoiceRegistry.sol).
 */
const rawAddress =
  process.env.NEXT_PUBLIC_INVOICE_REGISTRY_ADDRESS?.trim() ||
  '0x0000000000000000000000000000000000000000';

export const invoiceRegistryContract = {
  address: rawAddress as `0x${string}`,
  fromBlock: BigInt(process.env.NEXT_PUBLIC_INVOICE_REGISTRY_FROM_BLOCK ?? '0'),
  abi: [
    {
      inputs: [
        {
          internalType: 'address',
          name: 'initialOwner',
          type: 'address',
        },
        {
          internalType: 'address',
          name: 'worldIdRouter_',
          type: 'address',
        },
        {
          internalType: 'uint256',
          name: 'externalNullifierHash_',
          type: 'uint256',
        },
        {
          internalType: 'address[]',
          name: 'tokens',
          type: 'address[]',
        },
      ],
      stateMutability: 'nonpayable',
      type: 'constructor',
    },
    {
      inputs: [
        {
          internalType: 'address',
          name: 'owner',
          type: 'address',
        },
      ],
      name: 'OwnableInvalidOwner',
      type: 'error',
    },
    {
      inputs: [
        {
          internalType: 'address',
          name: 'account',
          type: 'address',
        },
      ],
      name: 'OwnableUnauthorizedAccount',
      type: 'error',
    },
    {
      inputs: [],
      name: 'ReentrancyGuardReentrantCall',
      type: 'error',
    },
    {
      inputs: [
        {
          internalType: 'address',
          name: 'token',
          type: 'address',
        },
      ],
      name: 'SafeERC20FailedOperation',
      type: 'error',
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: 'uint256',
          name: 'invoiceId',
          type: 'uint256',
        },
        {
          indexed: true,
          internalType: 'address',
          name: 'emitter',
          type: 'address',
        },
      ],
      name: 'InvoiceCancelled',
      type: 'event',
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: 'uint256',
          name: 'invoiceId',
          type: 'uint256',
        },
        {
          indexed: true,
          internalType: 'bytes32',
          name: 'invoiceHash',
          type: 'bytes32',
        },
        {
          indexed: true,
          internalType: 'address',
          name: 'emitter',
          type: 'address',
        },
        {
          indexed: false,
          internalType: 'address',
          name: 'recipient',
          type: 'address',
        },
        {
          indexed: false,
          internalType: 'uint256',
          name: 'amount',
          type: 'uint256',
        },
        {
          indexed: false,
          internalType: 'address',
          name: 'token',
          type: 'address',
        },
        {
          indexed: false,
          internalType: 'string',
          name: 'vatNumber',
          type: 'string',
        },
      ],
      name: 'InvoiceCreated',
      type: 'event',
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: 'uint256',
          name: 'invoiceId',
          type: 'uint256',
        },
        {
          indexed: true,
          internalType: 'address',
          name: 'payer',
          type: 'address',
        },
        {
          indexed: false,
          internalType: 'uint256',
          name: 'amount',
          type: 'uint256',
        },
        {
          indexed: false,
          internalType: 'address',
          name: 'token',
          type: 'address',
        },
      ],
      name: 'InvoicePaid',
      type: 'event',
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: 'address',
          name: 'previousOwner',
          type: 'address',
        },
        {
          indexed: true,
          internalType: 'address',
          name: 'newOwner',
          type: 'address',
        },
      ],
      name: 'OwnershipTransferred',
      type: 'event',
    },
    {
      inputs: [
        {
          internalType: 'address',
          name: 'token',
          type: 'address',
        },
      ],
      name: 'addAllowedToken',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'address',
          name: '',
          type: 'address',
        },
      ],
      name: 'allowedToken',
      outputs: [
        {
          internalType: 'bool',
          name: '',
          type: 'bool',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'uint256',
          name: 'invoiceId',
          type: 'uint256',
        },
      ],
      name: 'cancelInvoice',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'uint256',
          name: 'invoiceId',
          type: 'uint256',
        },
        {
          internalType: 'bytes32',
          name: 'invoiceHash_',
          type: 'bytes32',
        },
        {
          internalType: 'address',
          name: 'emitter',
          type: 'address',
        },
        {
          internalType: 'address',
          name: 'recipient',
          type: 'address',
        },
        {
          internalType: 'uint256',
          name: 'amount',
          type: 'uint256',
        },
        {
          internalType: 'address',
          name: 'token',
          type: 'address',
        },
        {
          internalType: 'string',
          name: 'vatNumber',
          type: 'string',
        },
        {
          internalType: 'uint256',
          name: 'year',
          type: 'uint256',
        },
        {
          internalType: 'uint256',
          name: 'month',
          type: 'uint256',
        },
      ],
      name: 'createInvoice',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'address',
          name: 'emitter_',
          type: 'address',
        },
        {
          internalType: 'uint256',
          name: 'year',
          type: 'uint256',
        },
        {
          internalType: 'uint256',
          name: 'month',
          type: 'uint256',
        },
      ],
      name: 'getNextInvoiceId',
      outputs: [
        {
          internalType: 'uint256',
          name: '',
          type: 'uint256',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'address',
          name: 'emitter_',
          type: 'address',
        },
        {
          internalType: 'uint256',
          name: 'year',
          type: 'uint256',
        },
        {
          internalType: 'uint256',
          name: 'month',
          type: 'uint256',
        },
      ],
      name: 'getNextInvoiceSequence',
      outputs: [
        {
          internalType: 'uint256',
          name: '',
          type: 'uint256',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'address',
          name: 'emitter_',
          type: 'address',
        },
        {
          internalType: 'uint256',
          name: 'year',
          type: 'uint256',
        },
        {
          internalType: 'uint256',
          name: 'month',
          type: 'uint256',
        },
        {
          internalType: 'uint256',
          name: 'sequence',
          type: 'uint256',
        },
      ],
      name: 'packInvoiceId',
      outputs: [
        {
          internalType: 'uint256',
          name: 'invoiceId',
          type: 'uint256',
        },
      ],
      stateMutability: 'pure',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'uint256',
          name: 'invoiceId',
          type: 'uint256',
        },
      ],
      name: 'parseInvoiceId',
      outputs: [
        {
          internalType: 'address',
          name: 'emitter_',
          type: 'address',
        },
        {
          internalType: 'uint256',
          name: 'year',
          type: 'uint256',
        },
        {
          internalType: 'uint256',
          name: 'month',
          type: 'uint256',
        },
        {
          internalType: 'uint256',
          name: 'sequence',
          type: 'uint256',
        },
      ],
      stateMutability: 'pure',
      type: 'function',
    },
    {
      inputs: [],
      name: 'externalNullifierHash',
      outputs: [
        {
          internalType: 'uint256',
          name: '',
          type: 'uint256',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'uint256',
          name: 'invoiceId',
          type: 'uint256',
        },
      ],
      name: 'getInvoice',
      outputs: [
        {
          internalType: 'bytes32',
          name: 'invoiceHash_',
          type: 'bytes32',
        },
        {
          internalType: 'address',
          name: 'emitter',
          type: 'address',
        },
        {
          internalType: 'address',
          name: 'recipient',
          type: 'address',
        },
        {
          internalType: 'uint256',
          name: 'amount',
          type: 'uint256',
        },
        {
          internalType: 'address',
          name: 'token',
          type: 'address',
        },
        {
          internalType: 'string',
          name: 'vatNumber',
          type: 'string',
        },
        {
          internalType: 'enum InvoiceRegistry.Status',
          name: 'status',
          type: 'uint8',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'address',
          name: '',
          type: 'address',
        },
      ],
      name: 'isEmitterVerified',
      outputs: [
        {
          internalType: 'bool',
          name: '',
          type: 'bool',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [],
      name: 'owner',
      outputs: [
        {
          internalType: 'address',
          name: '',
          type: 'address',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'uint256',
          name: 'invoiceId',
          type: 'uint256',
        },
      ],
      name: 'payInvoice',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'uint256',
          name: 'root',
          type: 'uint256',
        },
        {
          internalType: 'uint256',
          name: 'groupId',
          type: 'uint256',
        },
        {
          internalType: 'uint256',
          name: 'nullifierHash',
          type: 'uint256',
        },
        {
          internalType: 'uint256[8]',
          name: 'proof',
          type: 'uint256[8]',
        },
      ],
      name: 'registerWithWorldId',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [],
      name: 'renounceOwnership',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'address',
          name: 'newOwner',
          type: 'address',
        },
      ],
      name: 'transferOwnership',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [],
      name: 'worldIdRouter',
      outputs: [
        {
          internalType: 'address',
          name: '',
          type: 'address',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
  ] as const,
};

/** Dev 1 ABI / address — aliases for `import { INVOICE_REGISTRY_ABI } from '@/lib/contract'`. */
export const INVOICE_REGISTRY_ADDRESS = invoiceRegistryContract.address;
export const INVOICE_REGISTRY_ABI = invoiceRegistryContract.abi;
