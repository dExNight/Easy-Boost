import { useEffect, useState } from "react";
import { StakingPool } from "../contracts/StakingPool";
import { useTonClient } from "./useTonClient";
import { Address, Cell, OpenedContract, Sender, toNano } from "@ton/core";
import TonCenterV3, { JettonMaster, NftCollection } from "./useTonCenter";
import { JettonMaster as JettonMsaterWrapper } from "@ton/ton";
import { JettonWallet } from "../contracts/JettonWallet";
import { buildStakeJettonsPoolPayload } from "../contracts/payload";

export interface PoolStorage {
  init: number;
  nextItemIndex: number;
  lastUpdateTime: number;
  nftItemCode: Cell;
  collectionContent: Cell;
  boostCode: Cell;
  boostHelperCode: Cell;
  nextBoostIndex: number;
  lastTvl: bigint;
  distributedRewards: bigint;
  minLockPeriod: number;
  farmingSpeed: bigint;
  rewardsWalletAddress: Address | null;
  rewardsBalance: bigint;
  commissionFactor: number;
  premintOpen: number;
  startTime: number;
  endTime: number;
  minimumDeposit: bigint;
  lockWalletAddress: Address | null;
  adminAddress: Address;
  creatorAddress: Address;
}

export function usePoolStorage(address: string | undefined) {
  const client = useTonClient();
  const [poolStorage, setPoolStorage] = useState<null | PoolStorage>(null);
  const [stakingPool, setStakingPool] =
    useState<null | OpenedContract<StakingPool>>(null);

  useEffect(() => {
    const fetchPoolStorage = async () => {
      if (!client || !address) return;

      const contract = StakingPool.createFromAddress(Address.parse(address));
      const pool = client.open(contract) as OpenedContract<StakingPool>;
      setStakingPool(pool);

      try {
        const data: PoolStorage = await pool.getStorageData();
        setPoolStorage(data);
      } catch (error) {
        console.error("Error fetching sale data:", error);
      }
    };

    fetchPoolStorage();
  }, [address, client]);

  return {
    poolStorage,
    stake: async (amount: bigint, duration: number, sender: Sender) => {
      if (!stakingPool || !poolStorage || !client || !sender.address) {
        console.error("Staking pool contract is not initialized");
        return;
      }
      try {
        const { stack } = await client.runMethod(
          poolStorage.lockWalletAddress!,
          "get_wallet_data"
        );
        stack.readBigNumber();
        stack.readAddress();
        const jetton_master_address = stack.readAddress();

        const jettonMinter = client.open(
          JettonMsaterWrapper.create(jetton_master_address)
        );

        const userJettonWalletAddress = await jettonMinter.getWalletAddress(
          sender.address
        );

        const userJettonWallet = client.open(
          JettonWallet.createFromAddress(userJettonWalletAddress)
        );

        await userJettonWallet.sendTransfer(sender, {
          toAddress: stakingPool.address,
          jettonAmount: amount,
          fwdAmount: toNano("0.25"),
          fwdPayload: buildStakeJettonsPoolPayload(duration),
          value: toNano("0.5"),
        });
      } catch (error) {
        console.error("Error sending transactions", error);
      }
    },
  };
}

export function usePoolJettons(
  jettonWalletAddress: Address | null | undefined
) {
  const client = useTonClient();
  const [jettonMetadata, setJettonMetadata] = useState<null | JettonMaster>(
    null
  );

  const tonclient: TonCenterV3 = new TonCenterV3();

  useEffect(() => {
    const fetchJettonMaster = async () => {
      if (!client || !jettonWalletAddress) return;

      try {
        const { stack } = await client.runMethod(
          jettonWalletAddress,
          "get_wallet_data"
        );
        stack.readBigNumber();
        stack.readAddress();
        const jetton_master_address = stack.readAddress();

        const metadata: JettonMaster | undefined =
          await tonclient.getJettonMetadata(
            jetton_master_address.toRawString()
          );
        setJettonMetadata(metadata ? metadata : null);
      } catch (error) {
        console.error("Error fetching sale data:", error);
      }
    };

    fetchJettonMaster();
  }, [jettonWalletAddress, client]);

  return jettonMetadata;
}

export function usePoolMetadata(address: string | null | undefined) {
  const client = useTonClient();
  const [collection, setCollection] = useState<null | NftCollection>(null);

  const tonclient: TonCenterV3 = new TonCenterV3();

  useEffect(() => {
    const fetchCollectionMetadata = async () => {
      if (!client || !address) return;

      try {
        const metadata: NftCollection | undefined =
          await tonclient.getCollectionMetadata(address);
        setCollection(metadata ? metadata : null);
      } catch (error) {
        console.error("Error fetching sale data:", error);
      }
    };

    fetchCollectionMetadata();
  }, [address, collection, client]);

  return collection;
}
