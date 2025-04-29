- Version 2.a and 3.a uses the Stake Key Hash to unlock the funds
- Version 2 and 3 uses the Payment Key Hash to unlock the funds

The customer signature(s) are done backend for simplicity and reproducibility.
Your application should handle that in the frontend.

To generate the customer wallet on the backend you should use [Cardano Wallet CLI v1.3.0+](https://github.com/Cardano-Forge/cardano-wallet-cli/releases/tag/1.3.0)
