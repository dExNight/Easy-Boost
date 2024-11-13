import {
    Address,
    beginCell,
    Cell,
    Contract,
    contractAddress,
    ContractProvider,
    Sender,
    SendMode,
    toNano,
    TupleBuilder,
} from '@ton/core';
import { Gas, OFFCHAIN_CONTENT_PREFIX, Opcodes } from './constants';

export type StakingPoolConfig = {
    poolAdminAddress: Address;
    nftItemCode: Cell;
    boostCode: Cell;
    boostHelperCode: Cell;
    collectionContent: Cell;
    minLockPeriod: number;
    commissionFactor: number;
    startTime: number;
    endTime: number;
    minimumDeposit: bigint;
    creatorAddress: Address;
};

export type CollectionData = {
    nextItemId: number;
    collectionContent: string;
    ownerAddress: Address;
};

export type CollectionContent = {
    uri: string;
    base: string;
};

export function offchainCollectionContentToCell(content: CollectionContent): Cell {
    return beginCell()
        .storeRef(beginCell().storeUint(OFFCHAIN_CONTENT_PREFIX, 8).storeStringTail(content.uri).endCell())
        .storeRef(beginCell().storeStringTail(content.base).endCell())
        .endCell();
}

export function stakingPoolConfigToCell(config: StakingPoolConfig) {
    const pool_content: Cell = beginCell()
        .storeRef(config.collectionContent)
        .storeCoins(0) // lastTvl
        .storeUint(0, 256) // distributedRewards
        .storeUint(config.minLockPeriod, 32)
        .storeCoins(0)
        .storeCoins(0) // rewardsBalance
        .storeUint(config.commissionFactor, 16)
        .storeUint(0, 1) // premintOpen
        .storeRef(
            beginCell()
                .storeUint(config.startTime, 32)
                .storeUint(config.endTime, 32)
                .storeCoins(config.minimumDeposit)
                .storeAddress(null)
                .storeAddress(null)
                .storeAddress(config.creatorAddress)
                .endCell(),
        )
        .endCell();

    return {
        data: beginCell()
            .storeUint(0, 65)
            .storeAddress(config.poolAdminAddress)
            .storeRef(
                beginCell()
                    .storeRef(config.nftItemCode)
                    .storeRef(config.boostCode)
                    .storeRef(config.boostHelperCode)
                    .endCell(),
            )
            .storeUint(0, 32)
            .storeSlice(pool_content.beginParse())
            .endCell(),
        poolContent: pool_content,
    };
}

export class StakingPool implements Contract {
    constructor(
        readonly address: Address,
        readonly init?: { code: Cell; data: Cell },
    ) {}

    static createFromAddress(address: Address) {
        return new StakingPool(address);
    }

    static createFromConfig(config: StakingPoolConfig, code: Cell, workchain = 0) {
        const { data } = stakingPoolConfigToCell(config);
        const init = { code, data };
        return new StakingPool(contractAddress(workchain, init), init);
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().endCell(),
        });
    }

    async sendSetWallets(
        provider: ContractProvider,
        via: Sender,
        opts: {
            lockWalletAddress: Address;
            rewardsWalletAddress: Address;
        },
    ) {
        await provider.internal(via, {
            value: toNano('0.01'),
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(Opcodes.set_wallets, 32)
                .storeUint(0, 64)
                .storeAddress(opts.lockWalletAddress)
                .storeAddress(opts.rewardsWalletAddress)
                .endCell(),
        });
    }

    async sendSetWalletAddress(
        provider: ContractProvider,
        via: Sender,
        opts: {
            walletAddress: Address;
            queryId?: number;
        },
    ) {
        await provider.internal(via, {
            value: toNano('0.01'),
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(Opcodes.take_wallet_address, 32)
                .storeUint(opts.queryId ?? 0, 64)
                .storeAddress(opts.walletAddress)
                .endCell(),
        });
    }

    async sendAddBoost(
        provider: ContractProvider,
        via: Sender,
        opts: {
            boostIndex: number;
            startTime: number | bigint;
            endTime: number | bigint;
            boostWalletAddress: Address;
            queryId?: number;
        },
    ) {
        await provider.internal(via, {
            value: Gas.add_boost,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(Opcodes.add_boost, 32)
                .storeUint(opts.queryId ?? 0, 64)
                .storeUint(opts.boostIndex, 32)
                .storeUint(opts.startTime, 32)
                .storeUint(opts.endTime, 32)
                .storeAddress(opts.boostWalletAddress)
                .endCell(),
        });
    }

    async sendGetStorageData(
        provider: ContractProvider,
        via: Sender,
        opts: {
            value: bigint;
            toAddress: Address;
            queryId?: number;
        },
    ) {
        await provider.internal(via, {
            value: opts.value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(Opcodes.get_storage_data, 32)
                .storeUint(opts.queryId ?? 0, 64)
                .storeAddress(opts.toAddress)
                .endCell(),
        });
    }

    async sendClosePremint(
        provider: ContractProvider,
        via: Sender,
        opts: {
            queryId?: number;
        },
    ) {
        await provider.internal(via, {
            value: toNano('0.01'),
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(Opcodes.close_premint, 32)
                .storeUint(opts.queryId ?? 0, 64)
                .endCell(),
        });
    }

    async sendChangeStartTime(
        provider: ContractProvider,
        via: Sender,
        opts: {
            newStartTime: number;
            queryId?: number;
        },
    ) {
        await provider.internal(via, {
            value: toNano('0.01'),
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(Opcodes.change_start_time, 32)
                .storeUint(opts.queryId ?? 0, 64)
                .storeUint(opts.newStartTime, 32)
                .endCell(),
        });
    }

    async sendWithdrawRewards(
        provider: ContractProvider,
        via: Sender,
        opts: {
            jettonAmount: number;
            queryId?: number;
        },
    ) {
        await provider.internal(via, {
            value: Gas.jetton_transfer,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(Opcodes.withdraw_rewards, 32)
                .storeUint(opts.queryId ?? 0, 64)
                .storeCoins(opts.jettonAmount)
                .endCell(),
        });
    }

    async sendWithdrawAccidentJettons(
        provider: ContractProvider,
        via: Sender,
        opts: {
            jettonWallet: Address;
            jettonAmount: number;
            queryId?: number;
        },
    ) {
        await provider.internal(via, {
            value: Gas.jetton_transfer,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(Opcodes.withdraw_accident_jettons, 32)
                .storeUint(opts.queryId ?? 0, 64)
                .storeAddress(opts.jettonWallet)
                .storeCoins(opts.jettonAmount)
                .endCell(),
        });
    }

    async sendWithdrawTon(
        provider: ContractProvider,
        via: Sender,
        opts: {
            queryId?: number;
        },
    ) {
        await provider.internal(via, {
            value: toNano('0.01'),
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(4, 32)
                .storeUint(opts.queryId ?? 0, 64)
                .endCell(),
        });
    }

    async getCollectionData(provider: ContractProvider): Promise<CollectionData> {
        const result = (await provider.get('get_collection_data', [])).stack;
        return {
            nextItemId: result.readNumber(),
            collectionContent: result.readCell().asSlice().skip(8).loadStringTail(),
            ownerAddress: result.readAddress(),
        };
    }

    async getNftAddressByIndex(provider: ContractProvider, index: number): Promise<Address> {
        let tuple = new TupleBuilder();
        tuple.writeNumber(index);
        const result = (await provider.get('get_nft_address_by_index', tuple.build())).stack;
        return result.readAddress();
    }

    async getNftContent(provider: ContractProvider, index: number): Promise<string> {
        let tuple = new TupleBuilder();
        tuple.writeNumber(index);
        tuple.writeCell(beginCell().endCell());
        const result = (await provider.get('get_nft_content', tuple.build())).stack;
        return result.readCell().beginParse().skip(8).loadStringTail();
    }

    async getNftRewards(
        provider: ContractProvider,
        nftLockedJettons: bigint,
        nftDistributedRewards: bigint,
    ): Promise<bigint> {
        let tuple = new TupleBuilder();
        tuple.writeNumber(nftLockedJettons);
        tuple.writeNumber(nftDistributedRewards);
        const result = (await provider.get('get_nft_rewards', tuple.build())).stack;
        return result.readBigNumber();
    }

    async getStorageData(provider: ContractProvider) {
        const result = (await provider.get('get_storage_data', [])).stack;
        return {
            init: result.readNumber(),
            nextItemIndex: result.readNumber(),
            lastUpdateTime: result.readNumber(),
            nftItemCode: result.readCell(),
            collectionContent: result.readCell(),
            boostCode: result.readCell(),
            boostHelperCode: result.readCell(),
            nextBoostIndex: result.readNumber(),
            lastTvl: result.readBigNumber(),
            distributedRewards: result.readBigNumber(),
            minLockPeriod: result.readNumber(),
            farmingSpeed: result.readBigNumber(),
            rewardsWalletAddress: result.readAddressOpt(),
            rewardsBalance: result.readBigNumber(),
            commissionFactor: result.readNumber(),
            premintOpen: result.readNumber(),
            startTime: result.readNumber(),
            endTime: result.readNumber(),
            minimumDeposit: result.readBigNumber(),
            lockWalletAddress: result.readAddressOpt(),
            adminAddress: result.readAddress(),
            creatorAddress: result.readAddress(),
        };
    }

    async getBoost(provider: ContractProvider, boost_index: number): Promise<Address> {
        const params = new TupleBuilder();
        params.writeNumber(boost_index);
        const result = (await provider.get('get_boost', params.build())).stack;

        return result.readAddress();
    }
}
