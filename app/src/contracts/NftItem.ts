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
} from "@ton/core";
import { Gas, Opcodes } from "./constants";

export type NftItemConfig = {};

export function nftItemConfigToCell(config: NftItemConfig): Cell {
  console.log("nftItemConfigToCell", config);
  return beginCell().endCell();
}

export class NftItem implements Contract {
  constructor(
    readonly address: Address,
    readonly init?: { code: Cell; data: Cell }
  ) {}

  static createFromAddress(address: Address) {
    return new NftItem(address);
  }

  static createFromConfig(config: NftItemConfig, code: Cell, workchain = 0) {
    const data = nftItemConfigToCell(config);
    const init = { code, data };
    return new NftItem(contractAddress(workchain, init), init);
  }

  async sendTransferNft(
    provider: ContractProvider,
    via: Sender,
    opts: {
      toAddress: Address;
      forwardAmount: bigint;
      forwardPayload?: Cell;
      queryId?: number;
    }
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
    }
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
    boostAddress: Address,
    queryId?: number
  ) {
    await provider.internal(via, {
      value: Gas.claim_boost_rewards,
      sendMode: SendMode.PAY_GAS_SEPARATELY,
      body: beginCell()
        .storeUint(Opcodes.claim_boost_rewards, 32)
        .storeUint(queryId ?? 0, 64)
        .storeAddress(boostAddress)
        .endCell(),
    });
  }

  async sendWithdrawNft(
    provider: ContractProvider,
    via: Sender,
    opts: {
      queryId?: number;
    }
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
    }
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
    }
  ) {
    await provider.internal(via, {
      value: toNano("0.01"),
      sendMode: SendMode.PAY_GAS_SEPARATELY,
      body: beginCell()
        .storeUint(4, 32)
        .storeUint(opts.queryId ?? 0, 64)
        .endCell(),
    });
  }

  async getNftData(provider: ContractProvider) {
    const result = (await provider.get("get_nft_data", [])).stack;
    return {
      init: result.readNumber(),
      index: result.readNumber(),
      collection_address: result.readAddress(),
      owner_address: result.readAddress(),
      content: result.readCell(),
    };
  }

  async getStorageData(provider: ContractProvider) {
    const result = (await provider.get("get_storage_data", [])).stack;
    return {
      init: result.readNumber(),
      index: result.readNumber(),
      collectionAddress: result.readAddress(),
      ownerAddress: result.readAddress(),
      lockedValue: result.readBigNumber(),
      startTime: result.readNumber(),
      unlockTime: result.readNumber(),
      withdrawedAt: result.readNumber(),
      claimedRewards: result.readBigNumber(),
      isTransferrable: result.readNumber(),
      isActive: result.readNumber(),
      distributedRewards: result.readBigNumber(),
    };
  }
}
