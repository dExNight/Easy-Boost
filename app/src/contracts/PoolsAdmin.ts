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
import { Opcodes } from "./constants";

export type PoolsAdminConfig = {
  creationFee: bigint;
  changeFee: bigint;
  stakingPoolCode: Cell;
  nftItemCode: Cell;
  boostCode: Cell;
  boostHelperCode: Cell;
  teamCommissionFactor: number;
  teamAddress: Address;
  conversionAddress: Address;
  host: string;
};

export function poolsAdminConfigToCell(config: PoolsAdminConfig): Cell {
  return beginCell()
    .storeCoins(config.creationFee)
    .storeCoins(config.changeFee)
    .storeAddress(null)
    .storeUint(config.teamCommissionFactor, 7)
    .storeAddress(config.teamAddress)
    .storeAddress(config.conversionAddress)
    .storeRef(
      beginCell()
        .storeRef(config.stakingPoolCode)
        .storeRef(config.nftItemCode)
        .storeRef(config.boostCode)
        .storeRef(config.boostHelperCode)
        .endCell()
    )
    .storeRef(beginCell().storeStringTail(config.host).endCell())
    .endCell();
}

export class PoolsAdmin implements Contract {
  constructor(
    readonly address: Address,
    readonly init?: { code: Cell; data: Cell }
  ) {}

  static createFromAddress(address: Address) {
    return new PoolsAdmin(address);
  }

  static createFromConfig(config: PoolsAdminConfig, code: Cell, workchain = 0) {
    const data = poolsAdminConfigToCell(config);
    const init = { code, data };
    return new PoolsAdmin(contractAddress(workchain, init), init);
  }

  async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
    await provider.internal(via, {
      value,
      sendMode: SendMode.PAY_GAS_SEPARATELY,
      body: beginCell().endCell(),
    });
  }

  async sendSetJettonWalletAddress(
    provider: ContractProvider,
    via: Sender,
    jettonWalletAddress: Address
  ) {
    await provider.internal(via, {
      value: toNano("0.01"),
      sendMode: SendMode.PAY_GAS_SEPARATELY,
      body: beginCell()
        .storeUint(Opcodes.set_jetton_wallet_address, 32)
        .storeUint(0, 64)
        .storeAddress(jettonWalletAddress)
        .endCell(),
    });
  }

  async getCreationFee(provider: ContractProvider): Promise<bigint> {
    const result = (await provider.get("get_creation_fee", [])).stack;

    return result.readBigNumber();
  }

  async getOwners(provider: ContractProvider) {
    const result = (await provider.get("get_owners", [])).stack;

    return {
      teamAddress: result.readAddress(),
      conversionAddress: result.readAddress(),
    };
  }
}
