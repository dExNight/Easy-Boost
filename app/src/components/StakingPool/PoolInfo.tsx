import React, { useEffect, useState } from "react";
import { PoolStorage, usePoolPositions } from "../../hooks/useStakingPool";
import { fromNano, Sender } from "@ton/core";
import { formatTimestampToUTC, normalizeNumber, timestamp } from "../../utils";
import { isMainnet } from "../../config";
import { JettonMaster, NftItemResponse } from "../../hooks/useTonCenter";
import PoolValue from "../Utils/Value";
import BoostSelectionModal from "./BoostSelection";
import ProgressBar from "../Utils/ProgressBar";
import { formatTimeLeft } from "../../utils";
import { Button } from "react-bootstrap";
import StakeModal from "./StakeModal";
import { useTonConnectContext } from "../../contexts/TonConnectContext";
import Positions from "./Positions";

export interface PoolInfoProps {
  address: string;
  poolData: PoolStorage;
  poolJetton: JettonMaster;
  handleBoostNavigate: (boostIndex: number) => void;
  stake: (amount: bigint, duration: number, sender: Sender) => void;
}

const PoolInfo: React.FC<PoolInfoProps> = ({
  address,
  poolData,
  poolJetton,
  handleBoostNavigate,
  stake,
}) => {
  const { sender } = useTonConnectContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isStakeModalOpen, setIsStakeModalOpen] = useState(false);
  const [isPositionsModalOpen, setIsPositionsModalOpen] = useState(false);
  const [timeBeforeEnd, setTimeBeforeEnd] = useState<number>(
    poolData ? poolData.endTime - timestamp() : 0
  );

  const userPositions: NftItemResponse[] | undefined = usePoolPositions(
    address,
    sender.address
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
          <ProgressBar
            currentSpeed={poolData.farmingSpeed}
            totalAmount={poolData.rewardsBalance}
            startTime={poolData.startTime}
            endTime={poolData.endTime}
            symbol={poolJetton.jetton_content.symbol}
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
      <Button
        onClick={() => setIsModalOpen(true)}
        className="w-full min-h-12 rounded-2xl border-0 hover:bg-slate-600"
        variant="primary"
      >
        Boosts
      </Button>
      <Button
        onClick={() => setIsStakeModalOpen(true)}
        className="w-full min-h-12 rounded-2xl border-0 hover:bg-slate-600"
        variant="success"
      >
        Stake
      </Button>

      {userPositions && userPositions.length > 0 && (
        <Button
          onClick={() => setIsPositionsModalOpen(true)}
          className="w-full min-h-12 rounded-2xl border-0 hover:bg-slate-600"
          variant="success"
        >
          My positions
        </Button>
      )}
      {(!userPositions || userPositions.length === 0) && (
        <p>Connect wallet to see your positions</p>
      )}

      <BoostSelectionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        poolData={poolData}
        handleBoostNavigate={handleBoostNavigate}
      />
      <StakeModal
        isOpen={isStakeModalOpen}
        setIsModalOpen={setIsStakeModalOpen}
        poolData={poolData}
        poolJetton={poolJetton}
        stake={stake}
      />
      <Positions
        isOpen={isPositionsModalOpen}
        setIsModalOpen={setIsPositionsModalOpen}
        nfts={userPositions}
        decimals={Number(poolJetton.jetton_content.decimals!)}
        symbol={poolJetton.jetton_content.symbol!}
      />
    </div>
  );
};

export default PoolInfo;
