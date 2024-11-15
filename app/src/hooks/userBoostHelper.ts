import { useEffect, useState } from "react";
import { Boost } from "../contracts/Boost";
import { useTonClient } from "./useTonClient";
import { Address, OpenedContract } from "@ton/core";
import { fromJettonDecimals, timestamp } from "../utils";
import { NftItemStorage } from "./useNftItems";
import { BoostHelper } from "../contracts/BoostHelper";
import { distributedRewardsFivider } from "../contracts/constants";
import { BoostStorage } from "./useBoost";

export type itemRewards = {
  index: number;
  userRewards: number;
  claimedRewards: number;
};

export function useBoostHelper(
  boostAddress: string,
  boostStorage: BoostStorage,
  decimals: number,
  nfts: NftItemStorage[]
) {
  const client = useTonClient();
  const [rewards, setRewards] = useState<itemRewards[]>([]);

  useEffect(() => {
    const fetchBoostHelper = async () => {
      if (!client || !boostStorage || !boostAddress || !nfts) return;

      const boostContract = Boost.createFromAddress(
        Address.parse(boostAddress)
      );
      const boost = client.open(boostContract) as OpenedContract<Boost>;

      let now = timestamp();
      now = now > boostStorage.endTime ? boostStorage.endTime : now;

      const boostDistributedRewards =
        now < boostStorage.startTime
          ? 0n
          : (boostStorage.farmingSpeed *
              BigInt(now - boostStorage.startTime) *
              distributedRewardsFivider) /
            86400n;

      const rewardsPromises = nfts.map(async (nft) => {
        const helperAddress = await boost.getBoostHelperAddress(
          Address.parse(nft.address)
        );

        if (!(await client.isContractDeployed(helperAddress))) {
          const userRewards =
            fromJettonDecimals(
              (boostDistributedRewards - 0n) / distributedRewardsFivider,
              decimals
            ) *
            (fromJettonDecimals(nft.lockedValue, decimals) /
              fromJettonDecimals(boostStorage.snapshotTvl, decimals));

          return {
            index: nft.index,
            userRewards: userRewards,
            claimedRewards: 0,
          };
        }

        const helperContract = BoostHelper.createFromAddress(helperAddress);
        const boostHelper = client.open(
          helperContract
        ) as OpenedContract<BoostHelper>;

        const { userDistributedRewards } = await boostHelper.getHelperData();
        const userFraction =
          fromJettonDecimals(nft.lockedValue, decimals) /
          fromJettonDecimals(boostStorage.snapshotTvl, decimals);
        const userRewards =
          fromJettonDecimals(
            (boostDistributedRewards - userDistributedRewards) /
              distributedRewardsFivider,
            decimals
          ) * userFraction;

        const userClaimedRewards =
          fromJettonDecimals(
            userDistributedRewards / distributedRewardsFivider,
            decimals
          ) * userFraction;

        return {
          index: nft.index,
          userRewards: userRewards,
          claimedRewards: userClaimedRewards,
        };
      });

      const rewards = await Promise.all(rewardsPromises);
      setRewards(rewards);
    };

    fetchBoostHelper();
  }, [boostAddress, boostStorage, client]);

  return {
    boostAddress: boostAddress,
    rewards: rewards,
  };
}
