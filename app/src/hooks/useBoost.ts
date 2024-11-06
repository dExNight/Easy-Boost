import { useEffect, useState } from "react";
import { Boost } from "../contracts/Boost";
import { useTonClient } from "./useTonClient";
import { Address, OpenedContract } from "@ton/core";
import { StakingPool } from "../contracts/StakingPool";

export type BoostStorage = {
  init: boolean;
  poolAddress: Address;
  boostIndex: number;
  creatorAddress: Address;
  startTime: number;
  endTime: number;
  snapshotItemIndex: number;
  snapshotTvl: bigint;
  totalRewards: bigint;
  farmingSpeed: bigint;
};

export type BoostStorageResponse = {
  address: Address | null;
  boostData: BoostStorage | null;
};

export function useBoostStorage(
  poolAddress: string | undefined,
  boostIndex: number | undefined
): BoostStorageResponse | null {
  const client = useTonClient();
  const [boostStorage, setBoostStorage] = useState<null | BoostStorage>(null);
  const [boostAddress, setBoostAddress] = useState<null | Address>(null);

  useEffect(() => {
    const fetchBoostStorage = async () => {
      if (!client || !poolAddress || boostIndex === undefined || boostIndex < 0)
        return;

      const poolContract = StakingPool.createFromAddress(
        Address.parse(poolAddress)
      );
      const stakingPool = client.open(
        poolContract
      ) as OpenedContract<StakingPool>;

      const boostAddr: Address = await stakingPool.getBoost(boostIndex);
      setBoostAddress(boostAddr);

      const contract = Boost.createFromAddress(boostAddr);
      const boost = client.open(contract) as OpenedContract<Boost>;

      try {
        const {
          init,
          poolAddress,
          boostIndex,
          creatorAddress,
          startTime,
          endTime,
          snapshotItemIndex,
          snapshotTvl,
          totalRewards,
          farmingSpeed,
        } = await boost.getBoostData();

        setBoostStorage({
          init: init == 1,
          poolAddress: poolAddress,
          boostIndex: boostIndex,
          creatorAddress: creatorAddress,
          startTime: startTime,
          endTime: endTime,
          snapshotItemIndex: snapshotItemIndex,
          snapshotTvl: snapshotTvl,
          totalRewards: totalRewards,
          farmingSpeed: farmingSpeed,
        });
      } catch (error) {
        console.error("Error fetching sale data:", error);
      }
    };

    fetchBoostStorage();
  }, [poolAddress, boostStorage, client]);

  return {
    address: boostAddress,
    boostData: boostStorage,
  };
}
