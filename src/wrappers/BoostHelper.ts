import { Address, beginCell, Cell, Contract, contractAddress, ContractProvider, Sender, SendMode } from '@ton/core';

export type BoostHelperConfig = {
    boostAddress: Address;
    nftAddress: Address;
};

export function boostHelperConfigToCell(config: BoostHelperConfig): Cell {
    return beginCell()
        .storeUint(0, 1)
        .storeAddress(config.boostAddress)
        .storeAddress(config.nftAddress)
        .storeUint(0, 256)
        .endCell();
}

export class BoostHelper implements Contract {
    constructor(
        readonly address: Address,
        readonly init?: { code: Cell; data: Cell },
    ) {}

    static createFromAddress(address: Address) {
        return new BoostHelper(address);
    }

    static createFromConfig(config: BoostHelperConfig, code: Cell, workchain = 0) {
        const data = boostHelperConfigToCell(config);
        const init = { code, data };
        return new BoostHelper(contractAddress(workchain, init), init);
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().endCell(),
        });
    }

    async getHelperData(provider: ContractProvider) {
        const result = (await provider.get('get_helper_data', [])).stack;
        return {
            claimed: result.readNumber(),
            boostAddress: result.readAddress(),
            nftAddress: result.readAddress(),
            userDistributedRewards: result.readBigNumber(),
        };
    }
}
