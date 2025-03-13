echo "Creating 51 wallets for testing purposes"
for i in $(seq 1 51); do
    ~/Downloads/cardano-wallet-macos-latest --name customer_${i} --mnemonic
done

# Binary available here: https://github.com/Cardano-Forge/cardano-wallet-cli
