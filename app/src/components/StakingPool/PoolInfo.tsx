import React from "react";
import { PoolStorage } from "../../hooks/useStakingPool";
import { fromNano } from "@ton/core";
import { formatTimestampToUTC, normalizeNumber, timestamp } from "../../utils";
import { isMainnet } from "../../config";

const formatTimeLeft = (seconds: number): string => {
  const days = Math.floor(seconds / (3600 * 24));
  const hours = Math.floor((seconds % (3600 * 24)) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (secs > 0) parts.push(`${secs}s`);

  return parts.join(" ");
};

export interface PoolInfoProps {
  address: string;
  poolData: PoolStorage;
}

const PoolInfo: React.FC<PoolInfoProps> = ({ address, poolData }) => {
  let timeBeforeEnd = poolData ? poolData.endTime - timestamp() : 0;
  timeBeforeEnd = timeBeforeEnd < 0 ? 0 : timeBeforeEnd;

  return (
    <div className="flex flex-col items-center justify-center mt-8">
      <h2 className="text-2xl font-bold mb-4 text-center">
        Staking Pool Information
      </h2>
      <div className="bg-gray-800 p-6 rounded-lg shadow-md w-full max-w-2xl mx-auto overflow-auto">
        <div className="space-y-2">
          <p className="text-lg">
            <span className="font-semibold">Staking pool: </span> {address}
          </p>

          <p className="text-lg">
            <span className="font-semibold">Total rewards: </span>
            {normalizeNumber(fromNano(poolData.rewardsBalance))}
          </p>
          <p className="text-lg">
            <span className="font-semibold">Current speed: </span>
            {normalizeNumber(fromNano(poolData.farmingSpeed))}
          </p>
          <p className="text-lg">
            <span className="font-semibold">Current TVL: </span>
            {normalizeNumber(fromNano(poolData.lastTvl))}
          </p>
          <p className="text-lg">
            <span className="font-semibold">Minimum deposit: </span>
            {normalizeNumber(fromNano(poolData.minimumDeposit))}
          </p>

          <p className="text-lg">
            <span className="font-semibold">Time before end: </span>
            {formatTimeLeft(timeBeforeEnd)}
          </p>
          <p className="text-lg">
            <span className="font-semibold">Start time: </span>
            {formatTimestampToUTC(poolData.startTime)}
          </p>
          <p className="text-lg">
            <span className="font-semibold">End time: </span>
            {formatTimestampToUTC(poolData.endTime)}
          </p>

          <p className="text-lg">
            <span className="font-semibold">Total stakers: </span>
            {poolData.nextItemIndex}
          </p>
          <p className="text-lg">
            <span className="font-semibold">Total number of boosts: </span>
            {poolData.nextBoostIndex}
          </p>

          <p className="text-lg">
            <span className="font-semibold">Creator address: </span>
            {poolData.creatorAddress.toString({ testOnly: !isMainnet })}
          </p>
        </div>
      </div>
    </div>
  );
};

export default PoolInfo;
