#!/bin/bash
# Usage:
# API_KEY="USE_THE_ONE_WE_USE_EVERYWHERE" bash run.sh

pushd utxos

# Stats on MACOS 2024-12-03
deno run -A --env-file blockfrost.ts
# blockfrost: 119ms
# UTXOs Found: 8
# build_utxo_blockfrost: 3.16ms
deno run -A browser.ts
# build_utxo_browser: 1.78ms
deno run -A --env-file dolos.ts
# dolos: 109ms
# UTXOs Found: 8
# build_utxo_dolos: 2.26ms
