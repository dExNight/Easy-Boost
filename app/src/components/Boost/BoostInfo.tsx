import React, { useEffect, useState } from "react";
import { formatTimestampToUTC, normalizeNumber, timestamp } from "../../utils";
import { isMainnet } from "../../config";
import { JettonMaster } from "../../hooks/useTonCenter";
import PoolValue from "../Utils/Value";
import { BoostStorage } from "../../hooks/useBoost";
import ProgressBar from "../Utils/ProgressBar";
import { Address, fromNano, Sender } from "@ton/core";
import { formatTimeLeft } from "../../utils";
import { Button } from "react-bootstrap";
import Positions from "./Positions";
import { useTonConnectContext } from "../../contexts/TonConnectContext";
import TopUpModal from "./TopUpModal";

export interface BoostInfoProps {
  address: Address;
  poolAddress: string;
  boostData: BoostStorage;
  boostJetton: JettonMaster | null;
  topUp: (amount: bigint, sender: Sender) => Promise<void>;
}

const BoostInfo: React.FC<BoostInfoProps> = ({
  address,
  poolAddress,
  boostData,
  boostJetton,
  topUp,
}) => {
  const { sender, connected } = useTonConnectContext();
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isTopUpModalOpen, setIsTopUpModalOpen] = useState(false);

  const [timeBeforeEnd, setTimeBeforeEnd] = useState<number>(
    boostData ? boostData.endTime - timestamp() : 0
  );

  const isRewarded: boolean = boostData ? boostData.totalRewards > 0n : false;

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeBeforeEnd((prevTime) => (prevTime > 0 ? prevTime - 1 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  if (!isRewarded) {
    return (
      <div className="flex flex-col items-center justify-center w-full max-w-2xl mx-auto my-4 px-4 gap-4">
        <h2 className="text-2xl font-bold text-center">
          Boost #{boostData.boostIndex + 1}
        </h2>
        <p className="text-lg text-center">
          Address: {address.toString({ testOnly: !isMainnet })}
        </p>

        <div className="info-block max-w-2xl mx-auto bg-transparent border-1 border-telegram-blue">
          <div className="space-y-2">
            <PoolValue
              key_="Time before end"
              value_={formatTimeLeft(timeBeforeEnd)}
            />
            <PoolValue
              key_="Start time"
              value_={formatTimestampToUTC(boostData.startTime)}
            />
            <PoolValue
              key_="End time"
              value_={formatTimestampToUTC(boostData.endTime)}
            />
          </div>
        </div>
        <div className="info-block max-w-2xl mx-auto bg-transparent border-1 border-telegram-blue">
          <div className="space-y-2">
            <PoolValue
              key_="Eligible stakers"
              value_={boostData.snapshotItemIndex}
            />
            <PoolValue
              key_="Snapshot pool TVL"
              value_={normalizeNumber(fromNano(boostData.snapshotTvl))}
            />
            <PoolValue
              key_="Creator address"
              value_={boostData.creatorAddress.toString({
                testOnly: !isMainnet,
              })}
            />
          </div>
        </div>

        <Button
          onClick={() => setIsTopUpModalOpen(true)}
          className="w-full min-h-12 rounded-2xl border-0 hover:bg-slate-600"
          variant="primary"
        >
          Top up
        </Button>

        <TopUpModal
          isOpen={isTopUpModalOpen}
          setIsOpen={setIsTopUpModalOpen}
          boostJetton={boostJetton}
          topUp={topUp}
          sender={sender}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center my-8 gap-4">
      <h2 className="text-2xl font-bold text-center">
        Boost #{boostData.boostIndex + 1}
      </h2>
      <p className="text-lg text-center">
        Address: {address.toString({ testOnly: !isMainnet })}
      </p>
      <div className="flex flex-row items-center info-block max-w-2xl mx-auto">
        <div className="w-[50%] h-full">
          <p className="text-lg font-bold mb-1">Jetton Information</p>
          <PoolValue key_="Name" value_={boostJetton?.jetton_content.name} />
          <PoolValue
            key_="Symbol"
            value_={boostJetton?.jetton_content.symbol}
          />
          <PoolValue
            key_="Description"
            value_={boostJetton?.jetton_content.description}
          />
        </div>
        <div className="w-[50%] h-full flex flex-row-reverse">
          <img
            className="max-w-[50%] rounded-lg"
            src={boostJetton?.jetton_content.image}
          />
        </div>
      </div>
      <div className="info-block max-w-2xl mx-auto bg-transparent border-1 border-telegram-blue">
        <div className="space-y-2">
          <ProgressBar
            currentSpeed={boostData.farmingSpeed}
            totalAmount={boostData.totalRewards}
            startTime={boostData.startTime}
            endTime={boostData.endTime}
            symbol={boostJetton?.jetton_content.symbol}
          />
        </div>
      </div>
      <div className="info-block max-w-2xl mx-auto bg-transparent border-1 border-telegram-blue">
        <div className="space-y-2">
          <PoolValue
            key_="Time before end"
            value_={formatTimeLeft(timeBeforeEnd)}
          />
          <PoolValue
            key_="Start time"
            value_={formatTimestampToUTC(boostData.startTime)}
          />
          <PoolValue
            key_="End time"
            value_={formatTimestampToUTC(boostData.endTime)}
          />
        </div>
      </div>
      <div className="info-block max-w-2xl mx-auto bg-transparent border-1 border-telegram-blue">
        <div className="space-y-2">
          <PoolValue
            key_="Eligible stakers"
            value_={boostData.snapshotItemIndex}
          />
          <PoolValue
            key_="Snapshot pool TVL"
            value_={normalizeNumber(fromNano(boostData.snapshotTvl))}
          />
          <PoolValue
            key_="Creator address"
            value_={boostData.creatorAddress.toString({ testOnly: !isMainnet })}
          />
        </div>
      </div>

      {connected && (
        <div className="w-full flex flex-col gap-4">
          <Button
            onClick={() => setIsModalOpen(true)}
            className="w-full min-h-12 rounded-2xl border-0 hover:bg-slate-600"
            variant="primary"
          >
            Claim
          </Button>
          <Button
            onClick={() => setIsTopUpModalOpen(true)}
            className="w-full min-h-12 rounded-2xl border-0 hover:bg-slate-600"
            variant="primary"
          >
            Top up
          </Button>
        </div>
      )}

      {!connected && <p>Connect wallet to top-up / view rewards</p>}

      <Positions
        isOpen={isModalOpen}
        setIsModalOpen={setIsModalOpen}
        boostAddress={address.toRawString()}
        poolAddress={poolAddress}
        boostData={boostData}
        decimals={Number(boostJetton?.jetton_content.decimals!)}
        symbol={boostJetton?.jetton_content.symbol!}
      />

      <TopUpModal
        isOpen={isTopUpModalOpen}
        setIsOpen={setIsTopUpModalOpen}
        boostJetton={boostJetton}
        topUp={topUp}
        sender={sender}
      />
    </div>
  );
};

export default BoostInfo;
