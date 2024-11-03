import { Address, toNano } from '@ton/core';
import { NetworkProvider, sleep } from '@ton/blueprint';
import { JettonMinter } from '../wrappers/JettonMinter';
import { JettonWallet } from '../wrappers/JettonWallet';
import { buildStakeJettonsPoolPayload } from '../wrappers/payload';
import { StakingPool } from '../wrappers/StakingPool';
import { amountToJettons } from '../wrappers/utils';

const JETTON_STAKER_ADDRESS: Address = Address.parse('0QCE6FJD8ZnCCp9ImNGPnf0W0Jp8Qr8TPpg-njUR26dOKB3z');
const JETTONS_TO_STAKE: number = 1000;
const LOCK_PERIOD: number = 60 * 60 * 24;

const JETTON_MINTER_ADDRESS: Address = Address.parse('kQBYjZ-AfW8eMDKOfH2OAJr3pnjcl4dKfaGmWs6EaeT8KrbV');
const STAKING_POOL_ADDRESS: Address = Address.parse('kQAUmk_6zJgzstxUbGzh3TANRElcO1SbGoiPW7yeXnMZs2JV');

export async function run(provider: NetworkProvider) {
    const jettonMinter = provider.open(JettonMinter.createFromAddress(JETTON_MINTER_ADDRESS));
    const jettonWallet = provider.open(
        JettonWallet.createFromAddress(await jettonMinter.getWalletAddress(JETTON_STAKER_ADDRESS)),
    );

    const stakingPool = provider.open(StakingPool.createFromAddress(STAKING_POOL_ADDRESS));

    await jettonWallet.sendTransfer(provider.sender(), {
        toAddress: stakingPool.address,
        jettonAmount: amountToJettons(JETTONS_TO_STAKE),
        fwdAmount: toNano('0.25'),
        fwdPayload: buildStakeJettonsPoolPayload(LOCK_PERIOD),
        value: toNano('0.5'),
    });

    while (true) {
        const { lastTvl } = await stakingPool.getStorageData();

        if (lastTvl == amountToJettons(JETTONS_TO_STAKE)) {
            console.log('Staked:', lastTvl);
            break;
        }
        sleep(5000);
    }
}
