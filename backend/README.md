# Hardhat

Deploy contract on localhost:
```
$ bun run start:node
$ bunx hardhat ignition deploy ignition/modules/Ballot.ts --network localhost
```

Run hardhat tests with coverage
```
$ bun run test:hardhat:coverage
```

# Foundry

Run foundry tests with coverage
```
$ forge coverage
```

# Slither

Install [Poetry](https://python-poetry.org/docs/#installation), then from `backend/`:

```
$ poetry install
```

Run analysis:

```
$ bun run slither
```
