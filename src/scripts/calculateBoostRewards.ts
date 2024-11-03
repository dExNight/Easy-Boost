import { Address, fromNano, toNano } from '@ton/core';
import { NetworkProvider } from '@ton/blueprint';
import { Boost } from '../wrappers/Boost';
import { timestamp } from '../wrappers/utils';
import { StakingPool } from '../wrappers/StakingPool';

const BOOST_ADDRESS: Address = Address.parse('kQAKTrAsPrVXfvjAsfbPbQ6We5HKHaL7Wclv67NIgqCbqu1q');
const STAKING_POOL_ADDRESS: Address = Address.parse('kQAK9Lt-QUiw4p3HHtfLEp11MUPkM8JJA5ChVthQag-9ZBKj');

const hour: number = 3600;

export async function run(provider: NetworkProvider) {
    const stakingPool = provider.open(StakingPool.createFromAddress(STAKING_POOL_ADDRESS));
    const boost = provider.open(Boost.createFromAddress(BOOST_ADDRESS));
    const is_deployed: boolean = await provider.isContractDeployed(boost.address);

    const { totalRewards, farmingSpeed, startTime, endTime, boostIndex } = await boost.getBoostData();
    const expectedBoostAddress: Address = await stakingPool.getBoost(boostIndex);

    console.log(`Boost address: ${boost.address.toString()}`);
    console.log(`Expected boost address: ${expectedBoostAddress.toString()}`);

    const duration: number = endTime - startTime;

    const passedTime: number = timestamp() - startTime;
    const fraction: number = passedTime / duration;
    const timeBeforeEnd: number = endTime - timestamp();

    const farmedRewards: number = Number(fromNano(farmingSpeed)) * fraction;

    console.log(`Farmed rewards: ${farmedRewards.toFixed(2)} / ${fromNano(totalRewards)}`);
    console.log(`Time before end: ${(timeBeforeEnd / hour).toFixed(2)} hours`);
    console.log(`Time after start: ${(passedTime / hour).toFixed(2)} hours`);
}
