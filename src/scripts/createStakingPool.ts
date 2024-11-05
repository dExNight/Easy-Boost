import { Address, toNano } from '@ton/core';
import { compile, NetworkProvider, sleep } from '@ton/blueprint';
import { JettonMinter } from '../wrappers/JettonMinter';
import { JettonWallet } from '../wrappers/JettonWallet';
import { buildDeployPoolPayload } from '../wrappers/payload';
import { offchainCollectionContentToCell, StakingPool, stakingPoolConfigToCell } from '../wrappers/StakingPool';
import { amountToJettons, timestamp } from '../wrappers/utils';

const POOL_CREATOR_ADDRESS: Address = Address.parse('0QAAeHjRVfqPfRIjkPlxcv-OAffJUfAxWSu6RFli4FUeUCRn');

const JETTON_MINTER_ADDRESS: Address = Address.parse('kQBYjZ-AfW8eMDKOfH2OAJr3pnjcl4dKfaGmWs6EaeT8KrbV');
const POOL_ADMIN_ADDRESS: Address = Address.parse('EQAzxjrnsoKrp4J9ggSfOUkGhkVzxhLh7sGORZdLzDAxwvuU');

const creationTime: number = timestamp();

const stakingPoolConfig = {
    collectionContent: offchainCollectionContentToCell({
        uri: 'https://raw.githubusercontent.com/dExNight/ProjectConfigurations/refs/heads/main/SimpleStaking/pool_metadata.json',
        base: 'https://raw.githubusercontent.com/dExNight/ProjectConfigurations/refs/heads/main/SimpleStaking/',
    }),
    minLockPeriod: 60 * 60, // 30 minutes
    commissionFactor: 1,
    startTime: creationTime + 60, // starts in 1 minute
    endTime: creationTime + 60 + 60 * 60 * 24, // ends in 1 day
    minimumDeposit: amountToJettons(100),
};

export async function run(provider: NetworkProvider) {
    const jettonMinter = provider.open(JettonMinter.createFromAddress(JETTON_MINTER_ADDRESS));
    const jettonWallet = provider.open(
        JettonWallet.createFromAddress(await jettonMinter.getWalletAddress(POOL_CREATOR_ADDRESS)),
    );

    const poolConfig = {
        poolAdminAddress: POOL_ADMIN_ADDRESS,
        nftItemCode: await compile('NftItem'),
        boostCode: await compile('Boost'),
        boostHelperCode: await compile('BoostHelper'),
        collectionContent: stakingPoolConfig.collectionContent,
        minLockPeriod: stakingPoolConfig.minLockPeriod,
        commissionFactor: stakingPoolConfig.commissionFactor,
        startTime: stakingPoolConfig.startTime,
        endTime: stakingPoolConfig.endTime,
        minimumDeposit: stakingPoolConfig.minimumDeposit,
        creatorAddress: POOL_CREATOR_ADDRESS,
    };
    const { poolContent } = stakingPoolConfigToCell(poolConfig);
    const stakingPool = provider.open(StakingPool.createFromConfig(poolConfig, await compile('StakingPool')));

    const isStakingPoolDeployed = await provider.isContractDeployed(stakingPool.address);
    if (!isStakingPoolDeployed) {
        await jettonWallet.sendTransfer(provider.sender(), {
            toAddress: POOL_ADMIN_ADDRESS,
            jettonAmount: toNano('10'),
            fwdAmount: toNano('0.2'),
            fwdPayload: buildDeployPoolPayload(poolContent),
            value: toNano('0.4'),
        });

        await provider.waitForDeploy(stakingPool.address, 30);
    }

    console.log('Initializing staking pool');
    const stackingPoolRewardsWallet = provider.open(
        JettonWallet.createFromAddress(await jettonMinter.getWalletAddress(stakingPool.address)),
    );

    const stackingPoolLockWallet = provider.open(
        JettonWallet.createFromAddress(await jettonMinter.getWalletAddress(stakingPool.address)),
    );

    await stakingPool.sendSetWallets(provider.sender(), {
        lockWalletAddress: stackingPoolLockWallet.address,
        rewardsWalletAddress: stackingPoolRewardsWallet.address,
    });

    while (true) {
        const { init } = await stakingPool.getStorageData();

        if (init == 1) {
            console.log('Staking pool initialized');
            break;
        }
        sleep(5000);
    }
}