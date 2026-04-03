# dapp-boilerplate

Monorepo with [Bun workspaces](https://bun.sh/docs/install/workspaces) (`frontend`, `backend`). Install once from the repository root:

```
$ bun install
```

Then run package scripts from each app directory (e.g. `cd frontend && bun run dev`) or use filters from the root, e.g. `bun run --filter frontend dev`.

Install Foundry (for contracts):

```
$ curl -L https://foundry.paradigm.xyz | bash
```

## Githooks

Check that your core.hookspath is ".githooks"

```
$ git config --local core.hooksPath
```

Else, set value to ".githooks"

```
$ git config --local core.hooksPath .githooks
```
