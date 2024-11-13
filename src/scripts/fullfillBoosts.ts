import { Address, toNano } from '@ton/core';
import { compile, NetworkProvider, sleep } from '@ton/blueprint';
import { JettonMinter } from '../wrappers/JettonMinter';
import { JettonWallet } from '../wrappers/JettonWallet';
import { Boost } from '../wrappers/Boost';
import { StakingPool } from '../wrappers/StakingPool';
import { buildAddBoostRewardsPayload } from '../wrappers/payload';
import { amountToJettons } from '../wrappers/utils';

const JETTON_MINTER_ADDRESS: Address = Address.parse('kQCXZ65SFVJ2RywQ7FKddJUDX8v3q9CME-OY3Wly6taRqpBZ');
const STAKING_POOL_ADDRESS: Address = Address.parse('kQA4XlS_SzOpGbkoV0FzJEdsR8rdNf4gu2g_GaJFhCOB3JVt');

const BOOST_REWARDS: number = 500;

export async function run(provider: NetworkProvider) {
    const jettonMinter = provider.open(JettonMinter.createFromAddress(JETTON_MINTER_ADDRESS));

    const stakingPool = provider.open(StakingPool.createFromAddress(STAKING_POOL_ADDRESS));
    const { nextBoostIndex } = await stakingPool.getStorageData();

    for (let i = 0; i < nextBoostIndex; i++) {
        const boost = provider.open(
            Boost.createFromConfig(
                {
                    poolAddress: stakingPool.address,
                    boostIndex: i,
                    nftItemCode: await compile('NftItem'),
                    boostHelperCode: await compile('BoostHelper'),
                },
                await compile('Boost'),
            ),
        );

        const { creatorAddress, boostWalletAddress, totalRewards } = await boost.getBoostData();

        if (creatorAddress.equals(provider.sender().address!)) {
            if (!boostWalletAddress) {
                const boostWallet = provider.open(
                    JettonWallet.createFromAddress(await jettonMinter.getWalletAddress(boost.address)),
                );

                console.log(`Fulfilling boost ${i + 1}... setting wallet: ${boostWallet.address.toString()}`);
                console.log('creator: ', creatorAddress.toString());

                await boost.sendSetBoostJettonWallet(provider.sender(), boostWallet.address);

                await sleep(4000);
            }

            if (totalRewards == 0n) {
                console.log(`Fulfilling boost ${i + 1}... with ${BOOST_REWARDS * (i + 1)} reward`);
                console.log('creator: ', creatorAddress.toString());
                const boostCreatorWallet = provider.open(
                    JettonWallet.createFromAddress(await jettonMinter.getWalletAddress(creatorAddress)),
                );

                await boostCreatorWallet.sendTransfer(provider.sender(), {
                    toAddress: boost.address,
                    jettonAmount: amountToJettons(BOOST_REWARDS * (i + 1)),
                    fwdAmount: toNano('0.1'),
                    fwdPayload: buildAddBoostRewardsPayload(),
                    value: toNano('0.2'),
                });

                await sleep(4000);
            }
        }
    }
}
