import {
    Address,
    beginCell,
    Cell,
    Contract,
    contractAddress,
    ContractProvider,
    Dictionary,
    Sender,
    SendMode,
    Slice,
    toNano,
} from '@ton/core';
import { Gas, Opcodes } from './constants';

export type NftItemConfig = {};

export function nftItemConfigToCell(config: NftItemConfig): Cell {
    return beginCell().endCell();
}

export class NftItem implements Contract {
    constructor(
        readonly address: Address,
        readonly init?: { code: Cell; data: Cell },
    ) {}

    static createFromAddress(address: Address) {
        return new NftItem(address);
    }

    static createFromConfig(config: NftItemConfig, code: Cell, workchain = 0) {
        const data = nftItemConfigToCell(config);
        const init = { code, data };
        return new NftItem(contractAddress(workchain, init), init);
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().endCell(),
        });
    }

    async sendTransferNft(
        provider: ContractProvider,
        via: Sender,
        opts: {
            toAddress: Address;
            forwardAmount: bigint;
            forwardPayload?: Cell;
            queryId?: number;
        },
    ) {
        await provider.internal(via, {
            value: Gas.jetton_transfer,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(Opcodes.transfer_nft, 32)
                .storeUint(opts.queryId ?? 0, 64)
                .storeAddress(opts.toAddress)
                .storeAddress(via.address)
                .storeBit(0)
                .storeCoins(opts.forwardAmount)
                .storeMaybeRef(opts.forwardPayload)
                .endCell(),
        });
    }

    async sendClaimNft(
        provider: ContractProvider,
        via: Sender,
        opts: {
            queryId?: number;
        },
    ) {
        await provider.internal(via, {
            value: Gas.claim_nft,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(Opcodes.claim_nft, 32)
                .storeUint(opts.queryId ?? 0, 64)
                .endCell(),
        });
    }

    async sendClaimBoostRewards(
        provider: ContractProvider,
        via: Sender,
        opts: {
            queryId?: number;
            boosts: Dictionary<number, Slice>;
        },
    ) {
        await provider.internal(via, {
            value: Gas.claim_boost_rewards * BigInt(opts.boosts.size) + toNano('0.1'),
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(Opcodes.claim_boost_rewards, 32)
                .storeUint(opts.queryId ?? 0, 64)
                .storeUint(opts.boosts.size, 8)
                .storeDict(opts.boosts)
                .endCell(),
        });
    }

    async sendWithdrawNft(
        provider: ContractProvider,
        via: Sender,
        opts: {
            queryId?: number;
        },
    ) {
        await provider.internal(via, {
            value: Gas.withdraw_nft,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(Opcodes.withdraw_nft, 32)
                .storeUint(opts.queryId ?? 0, 64)
                .endCell(),
        });
    }

    async sendWithdrawJetton(
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
                .storeUint(3, 32)
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

    async getNftData(provider: ContractProvider) {
        const result = (await provider.get('get_nft_data', [])).stack;
        return {
            init: result.readNumber(),
            index: result.readNumber(),
            collection_address: result.readAddress(),
            owner_address: result.readAddress(),
            content: result.readCell(),
        };
    }

    async getStorageData(provider: ContractProvider) {
        const result = (await provider.get('get_storage_data', [])).stack;
        return {
            init: result.readNumber(),
            index: result.readNumber(),
            collection_address: result.readAddress(),
            owner_address: result.readAddress(),
            locked_value: result.readNumber(),
            start_time: result.readNumber(),
            unlock_time: result.readNumber(),
            claimed_rewards: result.readBigNumber(),
            is_transferrable: result.readNumber(),
            is_active: result.readNumber(),
            distributed_rewards: result.readBigNumber(),
        };
    }
}
