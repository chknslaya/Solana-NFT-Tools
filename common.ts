import { u64, Token, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { Keypair, PublicKey, Transaction, sendAndConfirmTransaction, Connection, TransactionInstruction } from '@solana/web3.js';
import  Base58 from 'bs58';
import fs from 'fs'

export const SLEEP_DURATIONms = 5000;

// Given a private key string, initialises a public key wallet
// Throws exceptions if wallet is not valid
export function initializeWallet(privateKey: string): Keypair {
    return Keypair.fromSecretKey(new Uint8Array(Base58.decode(privateKey)));
}

export class WalletEntry {
    public wallet: PublicKey;
    public amount: u64;

    public constructor(wallet: PublicKey, amount: u64) {
        this.wallet = wallet;
        this.amount = amount;
    }
}

export function readWalletList(filePath: string): WalletEntry[] {
    let walletList: WalletEntry[] = [];
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    
    data.airdrop.forEach(airdropItem =>{
        walletList.push(new WalletEntry(new PublicKey(airdropItem.wallet), airdropItem.amount));        
    })
    
    return walletList;
}

export async function sendToken(fromWallet: Keypair, toWallet: PublicKey, tokenToSend: PublicKey, transferAmount: u64, connection: Connection) : Promise<void> {
    console.log(`Start: Transferring ${transferAmount} to ${toWallet.toBase58()}`);
    
    let mintPublicKey = new PublicKey(tokenToSend);    
    let mintToken = new Token(
        connection,
        mintPublicKey,
        TOKEN_PROGRAM_ID,
        fromWallet
    );

    // Get the associated token account for the given pair of {wallet, token}
    let fromTokenAccount = await mintToken.getOrCreateAssociatedAccountInfo(
        fromWallet.publicKey
    );

    // Check sufficient funds exist in source account
    if (fromTokenAccount.amount < transferAmount) {
        throw new Error(`Insufficient funds for transfer. Amount for transfer: ${transferAmount} Amount available: ${fromTokenAccount.amount}`);
    }
    
    let instructions: TransactionInstruction[] = [];  

    // Retrieve destination token account in toWallet
    const associatedDestinationTokenAddr = await Token.getAssociatedTokenAddress(
        mintToken.associatedProgramId,
        mintToken.programId,
        mintPublicKey,
        toWallet
    );

    const receiverAccount = await connection.getAccountInfo(associatedDestinationTokenAddr);

    // If toWallet doesn't hold an appropriate token account, create one using fromWallet as payer.
    if (!receiverAccount) {
        instructions.push(
            Token.createAssociatedTokenAccountInstruction(
                mintToken.associatedProgramId,
                mintToken.programId,
                mintPublicKey,
                associatedDestinationTokenAddr,
                toWallet,
                fromWallet.publicKey
            )
        )
    }

    // Performs the actual transfer
    instructions.push(
        Token.createTransferInstruction(
            TOKEN_PROGRAM_ID,
            fromTokenAccount.address,
            associatedDestinationTokenAddr,
            fromWallet.publicKey,
            [],
            transferAmount
        )
    );

    const transaction = new Transaction().add(...instructions);
    await sendAndConfirmTransaction(connection, transaction, [fromWallet], {commitment: "confirmed"})

    console.log(`End: Transferred ${transferAmount} to ${toWallet.toBase58()}`)
}

export function sleep(ms: number) : void {
    const promise = new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
    promise.then();
}


export function getCollectionAccounts(candyMachine: PublicKey): PublicKey[] {
    var nftAccounts: PublicKey[] = [];

    //TODO: Implement this

    return nftAccounts;
}