import { useEffect, useState } from "react";
import { StakingPool } from "../contracts/StakingPool";
import { useTonClient } from "./useTonClient";
import { Address, Cell, OpenedContract } from "@ton/core";
import TonCenterV3, { JettonMaster, NftCollection } from "./useTonCenter";

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

  useEffect(() => {
    const fetchPoolStorage = async () => {
      if (!client || !address) return;

      const contract = StakingPool.createFromAddress(Address.parse(address));
      const stakingPool = client.open(contract) as OpenedContract<StakingPool>;

      try {
        const data: PoolStorage = await stakingPool.getStorageData();
        setPoolStorage(data);
      } catch (error) {
        console.error("Error fetching sale data:", error);
      }
    };

    fetchPoolStorage();
  }, [address, client]);

  return poolStorage;
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
  }, [jettonWalletAddress, jettonMetadata, client]);

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
