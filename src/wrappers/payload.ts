import { beginCell, Builder, Cell } from '@ton/core';
import { Opcodes } from './constants';

export function buildDeployPoolPayload(poolData: Cell): Cell {
    return beginCell().storeUint(Opcodes.deploy_new_pool, 32).storeRef(poolData).endCell();
}

export function buildAddPoolRewardsPayload(new_end_time?: number): Cell {
    const payload: Builder = beginCell().storeUint(Opcodes.add_pool_rewards, 32);

    if (new_end_time) {
        payload.storeUint(new_end_time, 32);
    }
    return payload.endCell();
}

export function buildStakeJettonsPoolPayload(lock_period: number, disable_nft_transfers: boolean = false): Cell {
    const payload: Builder = beginCell().storeUint(lock_period, 32);

    if (disable_nft_transfers) {
        payload.storeUint(0, 1);
    }
    return payload.endCell();
}

export function buildAddBoostRewardsPayload(): Cell {
    return beginCell().storeUint(Opcodes.top_up_jetton_balance, 32).endCell();
}

export function buildClaimPoolRewardsPayload(query_id: number = 0): Cell {
    return beginCell().storeUint(Opcodes.claim_nft, 32).storeUint(query_id, 64).endCell();
}
