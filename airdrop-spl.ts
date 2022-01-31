import { Connection, clusterApiUrl } from '@solana/web3.js';
import { program } from 'commander';
import { initializeWallet, readWalletList, sendToken, sleep, WalletEntry } from './common';

program
   .requiredOption('-k, --privateKey <key>', 'Private key of wallet holding items to airdrop')
   .requiredOption('-w, --walletList <path>', 'JSON file containing wallets for airdrop')
   .requiredOption('-t, --token <token>', 'Public key of token to send')
   .option('-e, --env <env>', 'Endpoint of Solana to use', 'devnet')


program.parse(process.argv)
var {privateKey, walletList, token, env} = program.opts();

// Initialise source Wallet
const fromWallet = initializeWallet(privateKey);
console.log('Using wallet ' + fromWallet.publicKey);

// Read json for destination wallets
const destinationWallets: WalletEntry[] = readWalletList(walletList)

// Establish connection for sending tokens
const connection = new Connection(clusterApiUrl(env), 'confirmed')

// Iterate over each destination wallet
for(var i = 0; i < destinationWallets.length; i++) {
   sendToken(fromWallet, destinationWallets[i].wallet, token, destinationWallets[i].amount, connection);
   sleep(5000);
}
