import { useEffect, useState } from "react";
import { Boost } from "../contracts/Boost";
import { useTonClient } from "./useTonClient";
import { Address, OpenedContract, Sender, toNano } from "@ton/core";
import { StakingPool } from "../contracts/StakingPool";
import { withRetry } from "../utils";
import { JettonMaster } from "@ton/ton";
import { JettonWallet } from "../contracts/JettonWallet";
import { buildAddBoostRewardsPayload } from "../contracts/payload";
import { boostStorageService } from "../utils/boostStorage";

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
  boostWalletAddress: Address | null;
};

export function useBoostStorage(
  poolAddress: string | undefined,
  boostIndex: number | undefined
) {
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

      if (!(await client.isContractDeployed(boostAddr))) {
        return;
      }

      const contract = Boost.createFromAddress(boostAddr);
      const boost = client.open(contract) as OpenedContract<Boost>;

      try {
        await withRetry(async () => {
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
            boostWalletAddress,
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
            boostWalletAddress: boostWalletAddress,
          });
        });
      } catch (error) {
        console.error("Error fetching sale data:", error);
      }
    };

    fetchBoostStorage();

    const interval = setInterval(fetchBoostStorage, 5000);
    return () => clearInterval(interval);
  }, [poolAddress, client, boostIndex]);

  return {
    address: boostAddress,
    boostData: boostStorage,
    topUp: async (amount: bigint, sender: Sender) => {
      if (
        !boostAddress ||
        !boostStorage ||
        !boostStorage.boostWalletAddress ||
        !client ||
        !sender.address
      ) {
        console.error("Boost contract is not initialized");
        return;
      }
      try {
        const jettonAddress = boostStorageService.getJettonAddress(
          boostAddress.toString()
        );

        let jetton_master_address: Address | null = null;

        if (!jettonAddress) {
          const { stack } = await client.runMethod(
            boostStorage.boostWalletAddress!,
            "get_wallet_data"
          );
          stack.readBigNumber();
          stack.readAddress();
          jetton_master_address = stack.readAddress();
        } else {
          jetton_master_address = Address.parse(jettonAddress);
        }

        const jettonMinter = client.open(
          JettonMaster.create(jetton_master_address)
        );

        const userJettonWalletAddress = await jettonMinter.getWalletAddress(
          sender.address
        );

        const userJettonWallet = client.open(
          JettonWallet.createFromAddress(userJettonWalletAddress)
        );

        await userJettonWallet.sendTransfer(sender, {
          toAddress: boostAddress,
          jettonAmount: amount,
          fwdAmount: toNano("0.1"),
          fwdPayload: buildAddBoostRewardsPayload(),
          value: toNano("0.2"),
        });
      } catch (error) {
        console.error("Error sending transactions", error);
      }
    },
  };
}

export function useBoostStorageByAddress(boostAddress: Address | null) {
  const client = useTonClient();
  const [boostStorage, setBoostStorage] = useState<null | BoostStorage>(null);

  let intervalId: number;

  useEffect(() => {
    const fetchBoostStorage = async () => {
      if (!client || !boostAddress) return;

      if (!(await client.isContractDeployed(boostAddress))) {
        return;
      }

      const contract = Boost.createFromAddress(boostAddress);
      const boost = client.open(contract) as OpenedContract<Boost>;

      try {
        await withRetry(async () => {
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
            boostWalletAddress,
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
            boostWalletAddress: boostWalletAddress,
          });
        });
      } catch (error) {
        console.error("Error fetching sale data:", error);
      }
    };

    fetchBoostStorage();

    intervalId = setInterval(fetchBoostStorage, 7000);

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [boostAddress, boostStorage, client]);

  return {
    address: boostAddress,
    boostData: boostStorage,
  };
}
