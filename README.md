# Solana-NFT-Tools
This repository contains tools/scripts written in TypeScript that help NFT teams to perform airdrops more easily or find out where certain tokens are.

## Getting Started & Usage
All dependencies required should be available after running
```
npm install
```
from the top directory.

All these scripts are designed to run directly from command line with ts-node e.g.

```
ts-node .\airdrop-spl.ts -k <PRIVATE_KEY> -w .\example.json -t <TOKEN_ADDRESS> -e devnet
```
For further information about the usage of the scripts, documentation will arrive when I get time, but use the -h flag to learn more about the inputs.