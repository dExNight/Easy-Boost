import React from "react";
import { NftItemResponse } from "../../hooks/useTonCenter";
import PoolValue from "../Utils/Value";
import { NftItemStorage, useNftItems } from "../../hooks/useNftItems";
import { formatTimestampToUTC, normalizeNumber } from "../../utils";
import { fromJettonDecimals } from "../../utils";
import SpinnerElement from "../Utils/Spinner";
import { useTonConnectContext } from "../../contexts/TonConnectContext";
import { BoostStorage } from "../../hooks/useBoost";
import { usePoolPositions } from "../../hooks/useStakingPool";
import { useBoostHelper } from "../../hooks/userBoostHelper";

export interface PositionsProps {
  isOpen: boolean;
  setIsModalOpen: (state: boolean) => void;
  boostAddress: string;
  poolAddress: string;
  boostData: BoostStorage;
  decimals: number;
  symbol: string;
}

const Positions: React.FC<PositionsProps> = ({
  isOpen,
  setIsModalOpen,
  boostAddress,
  poolAddress,
  boostData,
  decimals,
  symbol,
}) => {
  const { sender } = useTonConnectContext();
  const userPositions: NftItemResponse[] | undefined = usePoolPositions(
    poolAddress,
    sender.address
  );

  const isEligible = (item: NftItemStorage) => {
    return item.index < boostData.snapshotItemIndex;
  };

  const availableRewards = (item: NftItemStorage) => {
    const percentage =
      fromJettonDecimals(item.lockedValue, decimals) /
      fromJettonDecimals(boostData.snapshotTvl, decimals);
    return fromJettonDecimals(boostData.totalRewards, decimals) * percentage;
  };

  const { itemsStorage, claimBoost } = useNftItems(userPositions);
  const eligibleItems = itemsStorage.filter((item) => isEligible(item));
  const { rewards } = useBoostHelper(
    boostAddress,
    boostData,
    decimals,
    eligibleItems
  );

  const loading = !itemsStorage;

  const getRewardsForNft = (index: number) => {
    const reward = rewards.find((r) => r.index === index);
    return reward
      ? {
          userRewards: reward.userRewards,
          claimedRewards: reward.claimedRewards,
        }
      : null;
  };

  if (eligibleItems.length === 0) {
    return (
      <div
        className={`fixed scrollbar-modern bg-telegram-gray-lighter bg-opacity-50 backdrop-blur-[10px] inset-0 flex items-center justify-center z-50 ${
          isOpen ? "" : "hidden"
        }`}
      >
        <div className="border border-telegram-blue bg-white p-6 rounded-lg shadow-md w-full max-w-md">
          <h2 className="text-2xl font-bold text-center mb-6">
            No available rewards
          </h2>
          <div className="flex justify-center">
            <button
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-500 transition-colors"
              onClick={() => setIsModalOpen(false)}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`fixed scrollbar-modern bg-telegram-gray-lighter bg-opacity-50 backdrop-blur-[10px] inset-0 flex items-center justify-center z-50 ${
        isOpen ? "" : "hidden"
      }`}
    >
      <div className="border border-telegram-blue bg-white max-h-[80%] overflow-auto scrollbar-modern p-6 rounded-lg shadow-md w-full max-w-4xl">
        <h2 className="text-2xl font-bold text-center mb-4">
          Available rewards
        </h2>
        
        <div className="mb-4">
          <PoolValue 
            key_="Total Eligible Positions" 
            value_={eligibleItems.length}
            valueClass="font-semibold text-telegram-blue" 
          />
        </div>

        {loading ? (
          <div className="flex justify-center my-4">
            <SpinnerElement sm />
          </div>
        ) : (
          <div className="space-y-4">
            {eligibleItems.map((item) => (
              <div
                key={item.address}
                className="bg-telegram-gray-lighter p-4 rounded-lg flex flex-col md:flex-row md:items-center gap-4"
              >
                <div className="flex-grow space-y-2">
                  <PoolValue
                    key_="Locked Value"
                    value_={`${fromJettonDecimals(
                      item.lockedValue,
                      decimals
                    )} ${symbol}`}
                    valueClass="font-medium"
                  />
                  <PoolValue
                    key_="Claim opens"
                    value_={formatTimestampToUTC(boostData.endTime)}
                  />
                  <PoolValue
                    key_="Total rewards"
                    value_={`${normalizeNumber(availableRewards(item))} ${symbol}`}
                    keyClass="text-green-500 font-medium"
                    valueClass="text-green-500 font-medium"
                  />
                  <PoolValue
                    key_="Current rewards"
                    value_={`${normalizeNumber(
                      getRewardsForNft(item.index)?.userRewards!
                    )} ${symbol}`}
                    keyClass="text-green-500 font-medium"
                    valueClass="text-green-500 font-medium"
                  />
                  <PoolValue
                    key_="Claimed rewards"
                    value_={`${normalizeNumber(
                      getRewardsForNft(item.index)?.claimedRewards!
                    )} ${symbol}`}
                    valueClass="text-gray-600 font-medium"
                  />
                </div>

                <div className="flex justify-end md:justify-center">
                  <button
                    className={`px-4 py-2 rounded transition-colors ${
                      getRewardsForNft(item.index) === null
                        ? "bg-gray-400 cursor-not-allowed text-white"
                        : "bg-green-600 hover:bg-green-500 text-white"
                    }`}
                    onClick={async () => {
                      await claimBoost(item.address, boostAddress, sender);
                    }}
                    disabled={getRewardsForNft(item.index) === null}
                  >
                    Claim
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end mt-6">
          <button
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-500 transition-colors"
            onClick={() => setIsModalOpen(false)}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default Positions;