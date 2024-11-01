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

export type BoostConfig = {
    startTime: number | bigint;
    endTime: number | bigint;
    snapshotItemIndex: number;
    snapshotTvl: number | bigint;
    poolAddress: Address;
    nftItemCode: Cell;
    boostHelperCode: Cell;
};

export function boostConfigToCell(config: BoostConfig): Cell {
    return beginCell()
        .storeUint(0, 1)
        .storeUint(config.startTime, 32)
        .storeUint(config.endTime, 32)
        .storeUint(config.snapshotItemIndex, 32)
        .storeCoins(config.snapshotTvl)
        .storeCoins(0)
        .storeCoins(0)
        .storeAddress(config.poolAddress)
        .storeAddress(null)
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
            startTime: result.readNumber(),
            endTime: result.readNumber(),
            snapshotItemIndex: result.readNumber(),
            snapshotTvl: result.readBigNumber(),
            totalRewards: result.readBigNumber(),
            farmingSpeed: result.readBigNumber(),
            poolAddress: result.readAddress(),
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
}
