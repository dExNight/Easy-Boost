import React from "react";
import { NftItemResponse } from "../../hooks/useTonCenter";
import PoolValue from "../Utils/Value";
import { NftItemStorage, useNftItems } from "../../hooks/useNftItems";
import { formatTimestampToUTC, normalizeNumber, timestamp } from "../../utils";
import { fromJettonDecimals } from "../../utils";
import SpinnerElement from "../Utils/Spinner";
import { Button } from "react-bootstrap";
import { useTonConnectContext } from "../../contexts/TonConnectContext";
import { BoostStorage } from "../../hooks/useBoost";
import { usePoolPositions } from "../../hooks/useStakingPool";

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
  const isClaimOpened: boolean = timestamp() >= boostData.endTime;
  const loading = !itemsStorage;

  if (eligibleItems.length === 0) {
    return (
      <div
        className={`fixed bg-black bg-opacity-50 backdrop-blur-[10px] inset-0 flex items-center justify-center z-50 ${
          isOpen ? "" : "hidden"
        }`}
      >
        <div className="bg-gray-800 flex flex-col gap-4 p-6 rounded-lg shadow-md w-full max-w-[80%]">
          <h2 className="w-full flex text-2xl font-bold justify-center">
            No available rewards
          </h2>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`fixed bg-black bg-opacity-50 backdrop-blur-[10px] inset-0 flex items-center justify-center z-50 ${
        isOpen ? "" : "hidden"
      }`}
    >
      <div className="bg-gray-800 flex flex-col gap-4 p-6 rounded-lg shadow-md w-full max-w-[80%]">
        <h2 className="w-full flex text-2xl font-bold justify-center">
          Available rewards
        </h2>

        <PoolValue key_="Total" value_={eligibleItems.length} />

        {loading && (
          <div className="flex justify-center">
            <SpinnerElement sm />
          </div>
        )}

        <div className="flex flex-col gap-4">
          {eligibleItems.map((item) => (
            <div
              key={item.address}
              className="flex flex-row items-center bg-gray-700 p-4 rounded-lg"
            >
              <div className="w-full">
                <PoolValue
                  key_="Locked Value"
                  value_={`${fromJettonDecimals(
                    item.lockedValue,
                    decimals
                  )} ${symbol}`}
                />
                <PoolValue
                  key_="Claim opens"
                  value_={formatTimestampToUTC(boostData.endTime)}
                />
                <PoolValue
                  key_="To claim"
                  value_={`${normalizeNumber(
                    availableRewards(item)
                  )} ${symbol}`}
                  keyClass="text-green-500 font-normal"
                  valueClass="text-white font-normal"
                />
              </div>
              {isClaimOpened && (
                <div className="flex flex-col gap-3 justify-center">
                  <Button
                    variant="success"
                    onClick={async () => {
                      await claimBoost(item.address, boostAddress, sender);
                    }}
                  >
                    Claim
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="flex justify-end mt-6 gap-2">
          <button
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-500"
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
