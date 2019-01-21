import {TezosOperations} from "../src";
import {expect} from "chai";
import {KeyStore} from "../src/types/KeyStore";
import {TezosWallet} from "../src";
import {servers} from "../test/servers";
import {TezosHardwareWallet} from "../src/tezos/TezosHardwareWallet";
import {HardwareDeviceType} from "../src/types/HardwareDeviceType";

const tezosURL = servers.tezosServer;
const derivationPathIndex = Math.floor(Math.random()*10).toString();
const derivationPath = `44'/1729'/0'/0'/` + derivationPathIndex + `'`;

function sleep(seconds) {
    const e = new Date().getTime() + (seconds * 1000);
    while (new Date().getTime() <= e) {}
}

describe('Tezos operation functions', () => {
    it('successfully perform operations on a new identity', async (done) => {
        setTimeout(done, 15000);

        //get fields from tezos alphanet faucet
        const fundraiserKeys = <KeyStore> TezosWallet.unlockFundraiserIdentity(
            "economy allow chef brave erosion talk panic mirror tail message letter pact remove final pizza",
            "eriajpqb.sgqzfzjm@tezos.example.org",
            "NJ73redfI4",
            "tz1irFsFXR9iT8rW9WJYYKXZPJU2nzaMfyMp"
        );

        const fundraiserKeySecret = 'e4766f7316aae6b455d7ab886e634a92a24a22dd';

        const mnemonic = TezosWallet.generateMnemonic();
        const randomKeys = <KeyStore> TezosWallet.unlockIdentityWithMnemonic(mnemonic, '');
        const inactiveImplicitAddress = randomKeys.publicKeyHash;
        const anActiveImplicitAddress = 'tz1is75whxxkVvw2cF2FuRo5ANxZwwJ5nEbc';
        const randomDelegatedAddress = 'KT1N5t39Lw7zivvgBN9HJJzUuk64GursRzyc';
        const randomBakerAddress1 = 'tz1UmPE44pqWrEgW8sTRs6ED1DgwF7k43ncQ';
        const randomBakerAddress2 = 'tz1boot2oCjTjUN6xDNoVmtCLRdh8cc92P1u';

        const ledgerKeys = await TezosHardwareWallet.unlockAddress(HardwareDeviceType.Ledger, derivationPath);
        console.log("ledgerKeys: ", ledgerKeys)

        /*
        Uncomment this section if the fundraiser account is inactive

        console.log("+++++Activating fundraiser account");
        const activationResult = await TezosOperations.sendIdentityActivationOperation(
            tezosURL,
            fundraiserKeys,
            fundraiserKeySecret,
            derivationPath
        );
        expect(activationResult.operationGroupID).to.exist;
        sleep(33);

*/
        //Send 10tz to Ledger to perform the tests.
        const receiveResult = await TezosOperations.sendTransactionOperation(
            tezosURL,
            fundraiserKeys,
            ledgerKeys.publicKeyHash,
            10000000,
            100000, //Protocol 003 minimum fee for inactive implicit accounts is 1387
            derivationPath
        );
        expect(receiveResult.operationGroupID).to.exist;

        sleep(33);

        console.log("+++++Sending 1 tez to an inactive implicit account");
        const inactiveImplicitResult = await TezosOperations.sendTransactionOperation(
            tezosURL,
            ledgerKeys,
            inactiveImplicitAddress,
            1000000,
            300000, // Protocol 003 minimum fee for inactive implicit accounts is 1387
            derivationPath
        );
        expect(inactiveImplicitResult.operationGroupID).to.exist;

        sleep(33);

        console.log("+++++Sending 1 tez to an active implicit address");
        const activeImplicitResult = await TezosOperations.sendTransactionOperation(
            tezosURL,
            ledgerKeys,
            anActiveImplicitAddress,
            1000000,
            300000, // Protocol 003 minimum fee for active implicit accounts is 1100
            derivationPath
        );
        expect(activeImplicitResult.operationGroupID).to.exist;

        sleep(33);

        console.log("+++++Sending 1 tez to a random delegated address");
        const delegatedAccountResult = await TezosOperations.sendTransactionOperation(
            tezosURL,
            ledgerKeys,
            randomDelegatedAddress,
            1000000,
            300000, // Protocol 003 minimum fee for active kt1 accounts is 1100
            derivationPath
        );
        expect(delegatedAccountResult.operationGroupID).to.exist;

        sleep(33);

        console.log("+++++Origination an account with 1 tez");
        const originationResult = await TezosOperations.sendOriginationOperation(
            tezosURL,
            ledgerKeys,
            1000000,
            randomBakerAddress1,
            true,
            true,
            300000, // Protocol 003 minimum fee is 1377 for originations
            derivationPath
        );
        expect(originationResult.operationGroupID).to.exist;

        sleep(33);

        /*
          // Comment out delegation section in the FIRST run
          // Activate delegation section in the SECOND run.
          // Set delegatedKeyStore.publicKeyHash to the newly originated KT1 address before starting the SECOND run.

        let delegatedKeyStore = ledgerKeys;
        delegatedKeyStore.publicKeyHash = 'KT1EZgSrodHVN14Mawx91ajKDWybrr3QXuR6';

        console.log("+++++Sending delegation operation");
        const delegationResult = await TezosOperations.sendDelegationOperation(
            tezosURL,
            delegatedKeyStore,
            randomBakerAddress2,
            300000, // Protocol 003 minimum fee is 1100 for delegations
            derivationPath
        );
        expect(delegationResult.operationGroupID).to.exist

        sleep(33);
        */
    });
});
