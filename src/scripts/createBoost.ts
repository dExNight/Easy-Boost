import { Address, toNano } from '@ton/core';
import { compile, NetworkProvider, sleep } from '@ton/blueprint';
import { JettonMinter } from '../wrappers/JettonMinter';
import { JettonWallet } from '../wrappers/JettonWallet';
import { Boost } from '../wrappers/Boost';
import { StakingPool } from '../wrappers/StakingPool';
import { buildAddBoostRewardsPayload } from '../wrappers/payload';
import { amountToJettons, timestamp } from '../wrappers/utils';

const BOOST_CREATOR_ADDRESS: Address = Address.parse('0QAAeHjRVfqPfRIjkPlxcv-OAffJUfAxWSu6RFli4FUeUCRn');

const JETTON_MINTER_ADDRESS: Address = Address.parse('kQBYjZ-AfW8eMDKOfH2OAJr3pnjcl4dKfaGmWs6EaeT8KrbV');
const STAKING_POOL_ADDRESS: Address = Address.parse('kQAK9Lt-QUiw4p3HHtfLEp11MUPkM8JJA5ChVthQag-9ZBKj');

const BOOST_REWARDS: number = 1234;

const boostStartTime = timestamp();
const boostDuration = 60 * 60 * 12; // 1/2 day

const boostConfig = {
    startTime: boostStartTime + 60,
    endTime: boostStartTime + 60 + boostDuration,
};

export async function run(provider: NetworkProvider) {
    const jettonMinter = provider.open(JettonMinter.createFromAddress(JETTON_MINTER_ADDRESS));
    const boostCreatorWallet = provider.open(
        JettonWallet.createFromAddress(await jettonMinter.getWalletAddress(BOOST_CREATOR_ADDRESS)),
    );

    const stakingPool = provider.open(StakingPool.createFromAddress(STAKING_POOL_ADDRESS));
    const { nextBoostIndex } = await stakingPool.getStorageData();
    const boost = provider.open(
        Boost.createFromConfig(
            {
                poolAddress: stakingPool.address,
                boostIndex: 0,
                nftItemCode: await compile('NftItem'),
                boostHelperCode: await compile('BoostHelper'),
            },
            await compile('Boost'),
        ),
    );

    const boostWallet = provider.open(
        JettonWallet.createFromAddress(await jettonMinter.getWalletAddress(boost.address)),
    );

    const is_deployed: boolean = await provider.isContractDeployed(boost.address);
    console.log('Contract:', boost.address, ', is deployed:', is_deployed);
    if (!is_deployed) {
        await stakingPool.sendAddBoost(provider.sender(), {
            startTime: boostConfig.startTime,
            endTime: boostConfig.endTime,
        });

        await provider.waitForDeploy(boost.address, 30);

        await boost.sendSetBoostJettonWallet(provider.sender(), boostWallet.address);
    }

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
