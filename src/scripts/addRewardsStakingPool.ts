import { Address, toNano } from '@ton/core';
import { NetworkProvider, sleep } from '@ton/blueprint';
import { JettonMinter } from '../wrappers/JettonMinter';
import { JettonWallet } from '../wrappers/JettonWallet';
import { buildAddPoolRewardsPayload } from '../wrappers/payload';
import { StakingPool } from '../wrappers/StakingPool';
import { amountToJettons } from '../wrappers/utils';

const POOL_CREATOR_ADDRESS: Address = Address.parse('0QAAeHjRVfqPfRIjkPlxcv-OAffJUfAxWSu6RFli4FUeUCRn');
const JETTON_REWARDS_AMOUNT: number = 10000000000;

const JETTON_MINTER_ADDRESS: Address = Address.parse('kQB8H9gcowwYQGSzS7Wa69Vgw789OBq3QRi0Ob5s4OXMb-xm');
const STAKING_POOL_ADDRESS: Address = Address.parse('kQAYP1ZExQf0QnFWvldP7xmu9iG0WedvHTnooUDWpHqUTPyS');

export async function run(provider: NetworkProvider) {
    const jettonMinter = provider.open(JettonMinter.createFromAddress(JETTON_MINTER_ADDRESS));
    const jettonWallet = provider.open(
        JettonWallet.createFromAddress(await jettonMinter.getWalletAddress(POOL_CREATOR_ADDRESS)),
    );

    const stakingPool = provider.open(StakingPool.createFromAddress(STAKING_POOL_ADDRESS));

    await jettonWallet.sendTransfer(provider.sender(), {
        toAddress: stakingPool.address,
        jettonAmount: amountToJettons(JETTON_REWARDS_AMOUNT),
        fwdAmount: toNano('0.25'),
        fwdPayload: buildAddPoolRewardsPayload(),
        value: toNano('0.5'),
    });

    while (true) {
        const { rewardsBalance } = await stakingPool.getStorageData();
        if (rewardsBalance > 0n && rewardsBalance <= amountToJettons(JETTON_REWARDS_AMOUNT)) {
            console.log('Total rewards:', rewardsBalance);
            break;
        }
        sleep(5000);
    }
}
