import { Connection, PublicKey, clusterApiUrl, GetProgramAccountsConfig, GetProgramAccountsFilter, AccountInfo } from '@solana/web3.js';
import { program } from 'commander';
import { decodeMetadata, getNFTOwner } from './common';
import { Metadata } from './metaplex_types';

program
   .requiredOption('-c, --candyMachine <id>', 'Public key of Candy Machine utilised')
   .option('-e, --endpoint <endpoint>', 'Endpoint of Solana to use', 'https://ssc-dao.genesysgo.net')

program.parse(process.argv)
var {candyMachine, endpoint} = program.opts();

// Establish connection for getting holders
const connection = new Connection(endpoint, 'finalized');

console.log("Finding holders for CM: " + candyMachine);

// Setup filter and config
const machineFilter: GetProgramAccountsFilter = {
    memcmp: {
        offset: 
        1 + // key
        32 + // update auth
        32 + // mint
        4 + // name string length
        32 + // name
        4 + // uri string length
        200 + // uri*
        4 + // symbol string length
        10 + // symbol
        2 + // seller fee basis points
        1 + // whether or not there is a creators vec
        4 + // creators vec length
        0 * 34,
        bytes: candyMachine
    }
};

const searchConfig: GetProgramAccountsConfig = {
    commitment: 'finalized',
    encoding: 'base64',
    filters: [machineFilter]
};

// Run search
const TOKEN_METADATA_PROGRAM_ID = new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s');
connection.getProgramAccounts(TOKEN_METADATA_PROGRAM_ID, searchConfig).then(result => {
    console.log("Found " + result.length + " holders");
    result.forEach(element => {
        const nft: Metadata = decodeMetadata(element.account.data);
        const owner: PublicKey = getNFTOwner(new PublicKey(nft.mint), connection);
        console.log(owner.toBase58());
    });
})