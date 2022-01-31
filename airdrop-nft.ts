import { Connection, clusterApiUrl, PublicKey, Keypair } from '@solana/web3.js';
import { u64 } from '@solana/spl-token';
import { program } from 'commander';
import { initializeWallet, readWalletList, sendToken, sleep, WalletEntry } from './common';

function getNFTInWallet(fromWallet: Keypair, candyMachine: PublicKey): PublicKey[] {
    var nfts: PublicKey[] = [];

    //TODO: Implement this

    return nfts;
}

program
   .requiredOption('-k, --privateKey <key>', 'Private key of wallet holding items to airdrop')
   .requiredOption('-w, --walletList <path>', 'JSON file containing wallets for airdrop')
   .requiredOption('-c, --candyMachineID <CM>', 'Public key of candy machine whose collection you want to airdrop')
   .option('-e, --env <env>', 'Endpoint of Solana to use', 'devnet')


program.parse(process.argv)
var {privateKey, walletList, candyMachineID, env} = program.opts();

// Initialise source Wallet
const fromWallet = initializeWallet(privateKey);
console.log('Using wallet ' + fromWallet.publicKey);

// Read json for destination wallets
const destinationWallets: WalletEntry[] = readWalletList(walletList)

// Gather a list of all NFTs in the provided wallet
const candyMachine = new PublicKey(candyMachineID);
const nftsAvailable = getNFTInWallet(fromWallet, candyMachine)

// Validate sufficient NFTs exist in that wallet
if(nftsAvailable.length < destinationWallets.length) {
    throw new Error('Insufficient NFTs in wallet to airdrop. Current amount: ' + nftsAvailable.length + ' Required amount: ' + destinationWallets.length);
}


// Establish connection for sending tokens
const connection = new Connection(clusterApiUrl(env), 'confirmed')

// Iterate over each destination wallet
for(var i = 0; i < destinationWallets.length; i++) {
    for(var j = 0; j < destinationWallets[i].amount.toNumber(); j++) {
        sendToken(fromWallet, destinationWallets[i].wallet, nftsAvailable[i], new u64(1), connection);
        sleep(5000);
    }
 }