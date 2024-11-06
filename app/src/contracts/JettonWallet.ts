import {
  Address,
  beginCell,
  Cell,
  Contract,
  contractAddress,
  ContractProvider,
  Sender,
  SendMode,
} from "@ton/core";
import { Gas } from "./constants";

export type JettonWalletConfig = {};

export function jettonWalletConfigToCell(config: JettonWalletConfig): Cell {
  console.log(config);
  return beginCell().endCell();
}

export class JettonWallet implements Contract {
  constructor(
    readonly address: Address,
    readonly init?: { code: Cell; data: Cell }
  ) {}

  static createFromAddress(address: Address) {
    return new JettonWallet(address);
  }

  static createFromConfig(
    config: JettonWalletConfig,
    code: Cell,
    workchain = 0
  ) {
    const data = jettonWalletConfigToCell(config);
    const init = { code, data };
    return new JettonWallet(contractAddress(workchain, init), init);
  }

  async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
    await provider.internal(via, {
      value,
      sendMode: SendMode.PAY_GAS_SEPARATELY,
      body: beginCell().endCell(),
    });
  }

  async sendTransfer(
    provider: ContractProvider,
    via: Sender,
    opts: {
      value: bigint;
      toAddress: Address;
      fwdAmount: bigint;
      jettonAmount: bigint;
      fwdPayload: Cell;
      queryId?: number;
    }
  ) {
    await provider.internal(via, {
      value: opts.value,
      sendMode: SendMode.PAY_GAS_SEPARATELY,
      body: beginCell()
        .storeUint(0xf8a7ea5, 32)
        .storeUint(opts.queryId ?? 0, 64)
        .storeCoins(opts.jettonAmount)
        .storeAddress(opts.toAddress)
        .storeAddress(via.address)
        .storeUint(0, 1)
        .storeCoins(opts.fwdAmount)
        .storeUint(1, 1)
        .storeRef(opts.fwdPayload)
        .endCell(),
    });
  }

  async sendAddRewards(
    provider: ContractProvider,
    via: Sender,
    opts: {
      stakingAddress: Address;
      rewardsAmount: bigint;
      newEndTime?: number;
      queryId?: number;
    }
  ) {
    let forwardPayload = beginCell().storeUint(0xffffffff, 32);
    if (opts.newEndTime) {
      forwardPayload = forwardPayload.storeUint(opts.newEndTime, 32);
    }
    return await this.sendTransfer(provider, via, {
      value: Gas.send_commissions + Gas.jetton_transfer,
      toAddress: opts.stakingAddress,
      fwdAmount: Gas.send_commissions,
      jettonAmount: opts.rewardsAmount,
      fwdPayload: forwardPayload.endCell(),
      queryId: opts.queryId ?? 0,
    });
  }

  async sendStake(
    provider: ContractProvider,
    via: Sender,
    opts: {
      stakingAddress: Address;
      stakeAmount: bigint;
      stakePeriod: number;
      transferAllowed: boolean;
      queryId?: number;
    }
  ) {
    let forwardPayload = beginCell()
      .storeUint(opts.stakePeriod, 32)
      .storeBit(opts.transferAllowed);

    return await this.sendTransfer(provider, via, {
      value: Gas.send_commissions + Gas.jetton_transfer,
      toAddress: opts.stakingAddress,
      fwdAmount: Gas.send_commissions,
      jettonAmount: opts.stakeAmount,
      fwdPayload: forwardPayload.endCell(),
      queryId: opts.queryId ?? 0,
    });
  }

  async getJettonBalance(provider: ContractProvider): Promise<bigint> {
    const result = (await provider.get("get_wallet_data", [])).stack;
    return result.readBigNumber();
  }
}
