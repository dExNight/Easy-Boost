import React from "react";
import { NftItemResponse } from "../../hooks/useTonCenter";
import PoolValue from "../Utils/Value";
import { NftItemStorage, useNftItems } from "../../hooks/useNftItems";
import {
  formatTimestampToUTC,
  mulDiv,
  normalizeNumber,
  timestamp,
} from "../../utils";
import { fromJettonDecimals } from "../../utils";
import SpinnerElement from "../Utils/Spinner";
import { useTonConnectContext } from "../../contexts/TonConnectContext";
import { PoolStorage } from "../../hooks/useStakingPool";
import {
  distributedRewardsDivider,
  farmingSpeedDivider,
} from "../../constants";

export interface PositionsProps {
  isOpen: boolean;
  setIsModalOpen: (state: boolean) => void;
  poolData: PoolStorage;
  nfts: NftItemResponse[];
  decimals: number;
  symbol: string;
}

const Positions: React.FC<PositionsProps> = ({
  isOpen,
  setIsModalOpen,
  poolData,
  nfts,
  decimals,
  symbol,
}) => {
  const { sender } = useTonConnectContext();
  const { itemsStorage, claim, withdraw } = useNftItems(nfts);
  const loading = !itemsStorage;

  const isWithdrawOpen = (item: NftItemStorage) => {
    return timestamp() >= item.unlockTime;
  };

  const availableRewards = (item: NftItemStorage) => {
    const recalculatedDistributedRewards =
      poolData.distributedRewards +
      mulDiv(
        BigInt(timestamp() - poolData.lastUpdateTime) * poolData.farmingSpeed,
        distributedRewardsDivider,
        farmingSpeedDivider * poolData.lastTvl
      );

    const userRewards = mulDiv(
      recalculatedDistributedRewards - item.distributedRewards,
      BigInt(item.lockedValue),
      distributedRewardsDivider
    );
    return userRewards;
  };

  return (
    <div
      className={`fixed scrollbar-modern bg-telegram-gray-lighter bg-opacity-50 backdrop-blur-[10px] inset-0 flex items-center justify-center z-50 ${
        isOpen ? "" : "hidden"
      }`}
    >
      <div className="border border-telegram-blue bg-white max-h-[80%] overflow-auto scrollbar-modern p-6 rounded-lg shadow-md w-full max-w-4xl">
        <h2 className="text-2xl font-bold mb-4">Active positions</h2>

        <div className="mb-4">
          <PoolValue
            key_="Total Positions"
            value_={nfts.length}
            valueClass="font-semibold text-telegram-blue"
          />
        </div>

        {loading ? (
          <div className="flex justify-center my-4">
            <SpinnerElement sm />
          </div>
        ) : (
          <div className="space-y-4">
            {itemsStorage.map((item) => (
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
                    key_="Start Time"
                    value_={formatTimestampToUTC(item.startTime)}
                  />
                  <PoolValue
                    key_="Unlock Time"
                    value_={formatTimestampToUTC(item.unlockTime)}
                  />
                  <PoolValue
                    key_="Available to claim"
                    value_={`${normalizeNumber(
                      fromJettonDecimals(availableRewards(item), decimals)
                    )} ${symbol}`}
                    keyClass="text-green-500 font-medium"
                    valueClass="text-green-500 font-medium"
                  />
                </div>

                <div className="flex flex-row md:flex-col justify-end gap-3">
                  <button
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-500 transition-colors flex-1 md:flex-none"
                    onClick={async () => {
                      await claim(item.address, sender);
                    }}
                  >
                    Claim
                  </button>
                  {isWithdrawOpen(item) && (
                    <button
                      className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-500 transition-colors flex-1 md:flex-none"
                      onClick={async () => {
                        await withdraw(item.address, sender);
                      }}
                    >
                      Withdraw
                    </button>
                  )}
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
