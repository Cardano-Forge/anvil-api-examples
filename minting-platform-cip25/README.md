# Minting Platform

## Wallet setup

1. Generate a new Wallet (Will only serve to create the NFT collection)

> Never send ADA in this wallet.

```bash
~/Downloads/cardano-wallet-macos-latest --name policy --mnemonic
```

2. Generate a new Wallet (That will act as the treasury)

```bash
~/Downloads/cardano-wallet-macos-latest --name treasury --mnemonic
```

3. The customer wallet is not handle by this backend, you should use weld to interact with this project (will be tackle later)

---

## Start Redis

```bash
docker run -it --rm --name redis -p 6379:6379 redis
```

### Troubleshooting Redis

```bash
docker exec -it redis bash
redis-cli
keys *
```

## Access frontend

http://localhost:8000/
