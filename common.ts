import { u64, Token, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { Keypair, PublicKey, Transaction, sendAndConfirmTransaction, Connection, TransactionInstruction } from '@solana/web3.js';
import  Base58 from 'bs58';
import fs from 'fs'
import { deserializeUnchecked } from 'borsh';
import { METADATA_SCHEMA, Metadata} from './metaplex_types'


// Given a private key string, initialises a public key wallet
// Throws exceptions if wallet is not valid
export function initializeWallet(privateKey: string): Keypair {
    return Keypair.fromSecretKey(new Uint8Array(Base58.decode(privateKey)));
}

export class WalletEntry {
    public wallet: PublicKey
    public amount: u64
    public constructor(_wallet: PublicKey, _amount: u64) {
        this.wallet = _wallet;
        this.amount = _amount;
    }
}

export function readWalletList(filePath: string): any {
    var walletList: WalletEntry[] = [];
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    
    for(var i = 0; i < data.airdrop.length; i++) {
        walletList.push(new WalletEntry(new PublicKey(data.airdrop[i].wallet), data.airdrop[i].amount));
    }
    
    return walletList;
}

export async function sendToken(fromWallet: Keypair, toWallet: PublicKey, tokenToSend: PublicKey, transferAmount: u64, connection: Connection) : Promise<void> {
    console.log('Start: Transferring ' + transferAmount + ' to ' + toWallet.toBase58());
    
    var mintPublicKey = new PublicKey(tokenToSend);    
    var mintToken = new Token(
        connection,
        mintPublicKey,
        TOKEN_PROGRAM_ID,
        fromWallet
    );

    // Get the associated token account for the given pair of {wallet, token}
    var fromTokenAccount = await mintToken.getOrCreateAssociatedAccountInfo(
        fromWallet.publicKey
    );

    // Check sufficient funds exist in source account
    if(fromTokenAccount.amount < transferAmount) {
        throw new Error('Insufficient funds for transfer. Amount for transfer: ' + transferAmount + ' Amount available: ' + fromTokenAccount.amount);
    }
    
    const instructions: TransactionInstruction[] = [];  

    // Retrieve destination token account in toWallet
    const associatedDestinationTokenAddr = await Token.getAssociatedTokenAddress(
        mintToken.associatedProgramId,
        mintToken.programId,
        mintPublicKey,
        toWallet
    );

    const receiverAccount = await connection.getAccountInfo(associatedDestinationTokenAddr);

    // If toWallet doesn't hold an appropriate token account, create one using fromWallet as payer.
    if (receiverAccount === null) {
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

    console.log('End: Transferred ' + transferAmount + ' to ' + toWallet.toBase58())
}

export function sleep(ms: number) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
}


export function decodeMetadata(buffer: Buffer): Metadata {
    const METADATA_REPLACE = new RegExp('\u0000', 'g');
    const metadata = deserializeUnchecked(
    METADATA_SCHEMA,
    Metadata,
    buffer,
    ) as Metadata;
    metadata.data.name = metadata.data.name.replace(METADATA_REPLACE, '');
    metadata.data.uri = metadata.data.uri.replace(METADATA_REPLACE, '');
    metadata.data.symbol = metadata.data.symbol.replace(METADATA_REPLACE, '');
    return metadata;
}

export function getNFTOwner(mintKey: PublicKey, connection: Connection): PublicKey {
    //TODO: For wallet scrape later
    
    return new PublicKey(0);
}