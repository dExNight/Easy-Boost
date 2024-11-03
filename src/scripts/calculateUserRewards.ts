import { Address, fromNano } from '@ton/core';
import { NetworkProvider } from '@ton/blueprint';
import { NftItem } from '../wrappers/NftItem';
import { StakingPool } from '../wrappers/StakingPool';
import { timestamp } from '../wrappers/utils';

const STAKING_POOL_ADDRESS: Address = Address.parse('kQAUmk_6zJgzstxUbGzh3TANRElcO1SbGoiPW7yeXnMZs2JV');
const STAKE_NFT_ITEM_ADDRESS: Address = Address.parse('kQD6IEKPL82zD5kfcg5bxAj6qTvBxOJjuoCRvT8S9zueApCh');

function mulDiv(num1: bigint, num2: bigint, num3: bigint): bigint {
    return (num1 * num2) / num3;
}

const distributedRewardsDivider: bigint = 100000000000000000000000000000000000000n;
const farmingSpeedDivider: bigint = 86400n;

export async function run(provider: NetworkProvider) {
    const stakingPool = provider.open(StakingPool.createFromAddress(STAKING_POOL_ADDRESS));
    const nft = provider.open(NftItem.createFromAddress(STAKE_NFT_ITEM_ADDRESS));

    const { lockedValue, distributedRewards: nftDistributedRewards } = await nft.getStorageData();
    const {
        lastUpdateTime,
        lastTvl,
        distributedRewards: poolDistributedRewards,
        farmingSpeed,
        rewardsBalance,
    } = await stakingPool.getStorageData();

    const time_now: number = timestamp();

    const recalculated_distributed_rewards =
        poolDistributedRewards +
        mulDiv(
            BigInt(time_now - lastUpdateTime) * farmingSpeed,
            distributedRewardsDivider,
            farmingSpeedDivider * lastTvl,
        );

    const userRewards = mulDiv(
        recalculated_distributed_rewards - nftDistributedRewards,
        BigInt(lockedValue),
        distributedRewardsDivider,
    );

    console.log('Current farming speed:', fromNano(farmingSpeed));
    console.log('User rewards for now:', fromNano(userRewards));
}
