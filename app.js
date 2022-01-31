/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const { Gateway, Wallets } = require('fabric-network');
const FabricCAServices = require('fabric-ca-client');
const path = require('path');
const { buildCAClient, registerAndEnrollUser, enrollAdmin } = require('./CAUtil.js');
const { buildCCPOrg1, buildWallet } = require('./AppUtil.js');

const channelName = 'mychannel';
const chaincodeName = 'token_erc20';
const mspOrg1 = 'Org1MSP';
const walletPath = path.join(__dirname, 'wallet');
//const org1UserId = 'appUser9';

var ccp;
var caClient;
var wallet;
var gateway;
var network;
var contract;

function prettyJSONString(inputString) {
	return JSON.stringify(JSON.parse(inputString), null, 2);
}

exports.init_identity = async () => {
	try {
		ccp = buildCCPOrg1();
		caClient = buildCAClient(FabricCAServices, ccp, 'ca.org1.example.com');
		wallet = await buildWallet(Wallets, walletPath);
	} catch(error) {
		console.error(`******** FAILED to initiliaze Identity for Hyperledger Fabric Connection: ${error}`);
	}
}

exports.connect_network = async (org1UserId) => {
	try {
		await enrollAdmin(caClient, wallet, mspOrg1);
		await registerAndEnrollUser(caClient, wallet, mspOrg1, org1UserId, 'org1.department1');

		gateway = new Gateway();

		await gateway.connect(ccp, {
			wallet,
			identity: org1UserId,
			discovery: { enabled: true, asLocalhost: true } // using asLocalhost as this gateway is using a fabric network deployed locally
		});

		// Build a network instance based on the channel where the smart contract is deployed
		network = await gateway.getNetwork(channelName);

		// Get the contract from the network.
		contract = network.getContract(chaincodeName);

	} catch(error) {
		console.error(`******** FAILED to initiliaze Hyperledger Fabric Connection: ${error}`);
	}
}

exports.check_balance = async () => {
	try{
		console.log('\n--> Evaluate Transaction: ClientAccountBalance, function returns the balance of the given account');
		let result = await contract.evaluateTransaction('ClientAccountBalance');
		console.log(`*** Result: ${result}`);
		return result.toString();
	} catch(error) {
		console.error(`******** FAILED to check the balance of the account: ${error}`);
	}
}

exports.mint = async (amount) => {
	try{
		console.log('\n--> Submit Transaction: Mint, creates new tokens and adds them to minter\'s account balance');
		let result = await contract.submitTransaction('Mint', amount);
		console.log('*** Result: committed');
	} catch(error) {
		console.error(`******** FAILED to mint tokens to the account: ${error}`)
	}
}

exports.accountID = async () => {
	try{
		console.log('\n--> Evaluate Transaction: ClientAccountID, returns the account ID of the user.');
		let result = await contract.evaluateTransaction('ClientAccountID');
		console.log(`*** Result: ${result}`);
		return result.toString();
	} catch(error) {
		console.error(`******** FAILED to query Account ID: ${error}`)
	}
}

exports.transfer_amount = async (id, amount) => {
	try{
		console.log('\n--> Submit Transaction: Transfer, transfers the specified amount to the specified account address.');
		let result = await contract.submitTransaction('Transfer', id, amount);
		console.log('*** Result: committed');
	} catch(error) {
		console.error(`******** FAILED to transfer tokens to the specified account: ${error}`)
	}
}


