import {
    Address,
    beginCell,
    Cell,
    Contract,
    contractAddress,
    ContractProvider,
    Sender,
    SendMode,
    TupleBuilder,
} from '@ton/core';
import { timestamp as getTimestamp } from './utils';

export type BoostConfig = {
    poolAddress: Address;
    boostIndex: number;
    nftItemCode: Cell;
    boostHelperCode: Cell;
};

export function boostConfigToCell(config: BoostConfig): Cell {
    return beginCell()
        .storeUint(0, 1)
        .storeAddress(config.poolAddress)
        .storeUint(config.boostIndex, 32)
        .storeRef(config.nftItemCode)
        .storeRef(config.boostHelperCode)
        .endCell();
}

export class Boost implements Contract {
    constructor(
        readonly address: Address,
        readonly init?: { code: Cell; data: Cell },
    ) {}

    static createFromAddress(address: Address) {
        return new Boost(address);
    }

    static createFromConfig(config: BoostConfig, code: Cell, workchain = 0) {
        const data = boostConfigToCell(config);
        const init = { code, data };
        return new Boost(contractAddress(workchain, init), init);
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().endCell(),
        });
    }

    async getBoostData(provider: ContractProvider) {
        const result = (await provider.get('get_boost_data', [])).stack;
        return {
            init: result.readNumber(),
            poolAddress: result.readAddress(),
            boostIndex: result.readNumber(),
            creatorAddress: result.readAddress(),
            startTime: result.readNumber(),
            endTime: result.readNumber(),
            snapshotItemIndex: result.readNumber(),
            snapshotTvl: result.readBigNumber(),
            totalRewards: result.readBigNumber(),
            farmingSpeed: result.readBigNumber(),
            boostWalletAddress: result.readAddressOpt(),
        };
    }

    async getBoostCode(provider: ContractProvider) {
        const result = (await provider.get('get_boost_codes', [])).stack;

        return {
            nftItemCode: result.readCell(),
            boostHelperCode: result.readCell(),
        };
    }

    async getBoostHelperAddress(provider: ContractProvider, nftItemAddress: Address) {
        const params = new TupleBuilder();
        params.writeAddress(nftItemAddress);
        const result = (await provider.get('get_boost_helper_address', params.build())).stack;

        return result.readAddress();
    }

    async getCurrentFarmedValue(provider: ContractProvider, timestamp?: number): Promise<bigint> {
        const { startTime, endTime, totalRewards, farmingSpeed } = await this.getBoostData(provider);
        const now = timestamp ? timestamp : getTimestamp();
        if (now < startTime) return 0n;
        if (now >= endTime) return totalRewards;
        const timePassed = now - startTime;
        return (BigInt(timePassed) * farmingSpeed) / 86400n;
    }
}
