import React, { useEffect, useState } from "react";
import { PoolStorage } from "../../hooks/useStakingPool";
import { fromNano } from "@ton/core";
import { formatTimestampToUTC, normalizeNumber, timestamp } from "../../utils";
import { isMainnet } from "../../config";
import { JettonMaster } from "../../hooks/useTonCenter";
import PoolValue from "./Value";

const formatTimeLeft = (seconds: number): string => {
  const days = Math.floor(seconds / (3600 * 24));
  const hours = Math.floor((seconds % (3600 * 24)) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  parts.push(`${secs}s`);

  return parts.join(" ");
};

export interface PoolInfoProps {
  address: string;
  poolData: PoolStorage;
  poolJetton: JettonMaster;
}

const PoolInfo: React.FC<PoolInfoProps> = ({
  address,
  poolData,
  poolJetton,
}) => {
  const [timeBeforeEnd, setTimeBeforeEnd] = useState<number>(
    poolData ? poolData.endTime - timestamp() : 0
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeBeforeEnd((prevTime) => (prevTime > 0 ? prevTime - 1 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center my-8 gap-4">
      <h2 className="text-2xl font-bold text-center">Staking Pool</h2>
      <p className="text-lg text-center">Address: {address}</p>
      <div className="flex flex-row items-center bg-gray-800 p-6 rounded-lg shadow-md w-full max-w-2xl mx-auto overflow-auto">
        <div className="w-[50%] h-full">
          <p className="text-lg font-bold mb-1">Jetton Information</p>
          <PoolValue key_="Name" value_={poolJetton.jetton_content.name} />
          <PoolValue key_="Symbol" value_={poolJetton.jetton_content.symbol} />
          <PoolValue
            key_="Description"
            value_={poolJetton.jetton_content.description}
          />
        </div>
        <div className="w-[50%] h-full flex flex-row-reverse">
          <img
            className="max-w-[50%] rounded-lg"
            src={poolJetton.jetton_content.image}
          />
        </div>
      </div>
      <div className="bg-gray-800 p-6 rounded-lg shadow-md w-full max-w-2xl mx-auto overflow-auto">
        <div className="space-y-2">
          <PoolValue
            key_="Total rewards"
            value_={`${normalizeNumber(fromNano(poolData.rewardsBalance))} ${
              poolJetton.jetton_content.symbol
            }`}
          />
          <PoolValue
            key_="Current speed"
            value_={`${normalizeNumber(fromNano(poolData.farmingSpeed))} ${
              poolJetton.jetton_content.symbol
            }`}
          />
          <PoolValue
            key_="Current TVL"
            value_={`${normalizeNumber(fromNano(poolData.lastTvl))} ${
              poolJetton.jetton_content.symbol
            }`}
          />
          <PoolValue
            key_="Minimum deposit"
            value_={`${normalizeNumber(fromNano(poolData.minimumDeposit))} ${
              poolJetton.jetton_content.symbol
            }`}
          />
        </div>
      </div>
      <div className="bg-gray-800 p-6 rounded-lg shadow-md w-full max-w-2xl mx-auto overflow-auto">
        <div className="space-y-2">
          <PoolValue
            key_="Time before end"
            value_={formatTimeLeft(timeBeforeEnd)}
          />
          <PoolValue
            key_="Start time"
            value_={formatTimestampToUTC(poolData.startTime)}
          />
          <PoolValue
            key_="End time"
            value_={formatTimestampToUTC(poolData.endTime)}
          />
          <PoolValue key_="Total stakers" value_={poolData.nextItemIndex} />
          <PoolValue
            key_="Total number of boosts"
            value_={poolData.nextBoostIndex}
          />
          <PoolValue
            key_="Creator address"
            value_={poolData.creatorAddress.toString({ testOnly: !isMainnet })}
          />
        </div>
      </div>
      <div className="bg-gray-800 p-6 rounded-lg shadow-md w-full max-w-2xl mx-auto overflow-auto">
        <div className="space-y-2">
          <PoolValue key_="Total stakers" value_={poolData.nextItemIndex} />
          <PoolValue
            key_="Total number of boosts"
            value_={poolData.nextBoostIndex}
          />
          <PoolValue
            key_="Creator address"
            value_={poolData.creatorAddress.toString({ testOnly: !isMainnet })}
          />
        </div>
      </div>
    </div>
  );
};

export default PoolInfo;
