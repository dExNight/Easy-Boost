import { Address, toNano } from '@ton/core';
import { NetworkProvider, sleep } from '@ton/blueprint';
import { JettonMinter } from '../wrappers/JettonMinter';
import { JettonWallet } from '../wrappers/JettonWallet';
import { buildStakeJettonsPoolPayload } from '../wrappers/payload';
import { StakingPool } from '../wrappers/StakingPool';
import { amountToJettons } from '../wrappers/utils';

const JETTONS_TO_STAKE: number = 1000;
const LOCK_PERIOD: number = 60 * 60 * 24 * 10;

const JETTON_MINTER_ADDRESS: Address = Address.parse('kQB8H9gcowwYQGSzS7Wa69Vgw789OBq3QRi0Ob5s4OXMb-xm');
const STAKING_POOL_ADDRESS: Address = Address.parse('kQAYP1ZExQf0QnFWvldP7xmu9iG0WedvHTnooUDWpHqUTPyS');

export async function run(provider: NetworkProvider) {
    const jettonMinter = provider.open(JettonMinter.createFromAddress(JETTON_MINTER_ADDRESS));
    const jettonWallet = provider.open(
        JettonWallet.createFromAddress(await jettonMinter.getWalletAddress(provider.sender().address!)),
    );

    const stakingPool = provider.open(StakingPool.createFromAddress(STAKING_POOL_ADDRESS));

    const { lastTvl: tvlBefore } = await stakingPool.getStorageData();

    await jettonWallet.sendTransfer(provider.sender(), {
        toAddress: stakingPool.address,
        jettonAmount: amountToJettons(JETTONS_TO_STAKE),
        fwdAmount: toNano('0.25'),
        fwdPayload: buildStakeJettonsPoolPayload(LOCK_PERIOD),
        value: toNano('0.5'),
    });

    while (true) {
        const { lastTvl } = await stakingPool.getStorageData();

        if (lastTvl - tvlBefore == amountToJettons(JETTONS_TO_STAKE)) {
            console.log('Staked:', lastTvl);
            break;
        }
        sleep(5000);
    }
}
