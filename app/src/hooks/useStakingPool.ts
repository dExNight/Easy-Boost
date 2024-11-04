import { useEffect, useState } from "react";
import { StakingPool } from "../contracts/StakingPool";
import { useTonClient } from "./useTonClient";
import { Address, Cell, OpenedContract } from "@ton/core";

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
