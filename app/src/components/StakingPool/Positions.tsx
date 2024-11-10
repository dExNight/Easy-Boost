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
import { Button } from "react-bootstrap";
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
      className={`fixed bg-black bg-opacity-50 backdrop-blur-[10px] inset-0 flex items-center justify-center z-50 ${
        isOpen ? "" : "hidden"
      }`}
    >
      <div className="bg-gray-800 flex flex-col gap-4 p-6 rounded-lg shadow-md w-full max-w-[80%] max-h-[80%] overflow-auto scrollbar-modern">
        <h2 className="text-2xl font-bold">Active positions</h2>

        <PoolValue key_="Total" value_={nfts.length} />

        {loading && (
          <div className="flex justify-center">
            <SpinnerElement sm />
          </div>
        )}

        <div className="flex flex-col gap-4">
          {itemsStorage.map((item) => (
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
                  keyClass="text-green-500 font-normal"
                  valueClass="text-white font-normal"
                />
              </div>
              <div className="flex flex-col gap-3 justify-center">
                <Button
                  variant="success"
                  onClick={async () => {
                    await claim(item.address, sender);
                  }}
                >
                  Claim
                </Button>
                {isWithdrawOpen(item) && (
                  <Button
                    variant="danger"
                    onClick={async () => {
                      await withdraw(item.address, sender);
                    }}
                  >
                    Withdraw
                  </Button>
                )}
              </div>
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
