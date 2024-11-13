import { Address, toNano } from '@ton/core';
import { NetworkProvider, sleep } from '@ton/blueprint';
import { JettonMinter } from '../wrappers/JettonMinter';
import { JettonWallet } from '../wrappers/JettonWallet';
import { Boost } from '../wrappers/Boost';
import { buildAddBoostRewardsPayload } from '../wrappers/payload';
import { amountToJettons, timestamp } from '../wrappers/utils';

const BOOST_CREATOR_ADDRESS: Address = Address.parse('0QAAeHjRVfqPfRIjkPlxcv-OAffJUfAxWSu6RFli4FUeUCRn');

const JETTON_MINTER_ADDRESS: Address = Address.parse('kQBYjZ-AfW8eMDKOfH2OAJr3pnjcl4dKfaGmWs6EaeT8KrbV');
const BOOST_ADDRESS: Address = Address.parse('kQDa8uLHT058bsqkmxo97sWX5-CuaSka-be55VpclrMN0X4J');

const BOOST_REWARDS: number = 333333333;

export async function run(provider: NetworkProvider) {
    const jettonMinter = provider.open(JettonMinter.createFromAddress(JETTON_MINTER_ADDRESS));
    const boostCreatorWallet = provider.open(
        JettonWallet.createFromAddress(await jettonMinter.getWalletAddress(BOOST_CREATOR_ADDRESS)),
    );

    const boost = provider.open(Boost.createFromAddress(BOOST_ADDRESS));

    const boostWallet = provider.open(
        JettonWallet.createFromAddress(await jettonMinter.getWalletAddress(boost.address)),
    );

    await provider.waitForDeploy(boost.address, 30);

    await boostCreatorWallet.sendTransfer(provider.sender(), {
        toAddress: boost.address,
        jettonAmount: amountToJettons(BOOST_REWARDS),
        fwdAmount: toNano('0.1'),
        fwdPayload: buildAddBoostRewardsPayload(),
        value: toNano('0.2'),
    });

    while (true) {
        const { init, totalRewards } = await boost.getBoostData();

        if (init == 1) {
            if (totalRewards >= BOOST_REWARDS) {
                console.log('Boost rewards are added');
                break;
            }
        }

        sleep(5000);
    }
}
