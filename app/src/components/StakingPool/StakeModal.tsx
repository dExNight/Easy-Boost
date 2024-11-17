import React, { useState } from "react";
import { JettonMaster } from "../../hooks/useTonCenter";
import { useTonConnectContext } from "../../contexts/TonConnectContext";
import { Sender } from "@ton/core";
import { PoolStorage } from "../../hooks/useStakingPool";
import { fromJettonDecimals, toJettonDecimals } from "../../utils";

interface StakeModalProps {
  isOpen: boolean;
  setIsModalOpen: (state: boolean) => void;
  poolData: PoolStorage;
  poolJetton: JettonMaster;
  stake: (amount: bigint, duration: number, sender: Sender) => void;
}

const StakeModal: React.FC<StakeModalProps> = ({
  isOpen,
  setIsModalOpen,
  poolData,
  poolJetton,
  stake,
}) => {
  const { sender } = useTonConnectContext();

  const decimals: number = poolJetton.jetton_content.decimals
    ? Number(poolJetton.jetton_content.decimals)
    : 9;
  const minDeposit: number = fromJettonDecimals(
    poolData.minimumDeposit,
    decimals
  );
  const [stakeAmount, setStakeAmount] = useState(minDeposit);
  const [stakeDuration, setStakeDuration] = useState(poolData.minLockPeriod);

  const handleStake = () => {
    stake(toJettonDecimals(stakeAmount, decimals), stakeDuration, sender);
  };

  return (
    <div
      className={`fixed scrollbar-modern bg-telegram-gray-lighter bg-opacity-50 backdrop-blur-[10px] inset-0 flex items-center justify-center z-50 ${
        isOpen ? "" : "hidden"
      }`}
    >
      <div className="border border-telegram-blue bg-white max-h-[80%] overflow-auto scrollbar-modern p-6 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">Stake Tokens</h2>
        
        <div className="space-y-4">
          <div className="flex flex-col space-y-2">
            <label htmlFor="stakeAmount" className="text-lg font-medium">
              Stake Amount {poolJetton.jetton_content.symbol}
            </label>
            <input
              id="stakeAmount"
              type="number"
              value={stakeAmount}
              onChange={(e) => setStakeAmount(parseFloat(e.target.value))}
              className="w-full p-3 bg-telegram-gray-lighter rounded-lg border border-transparent focus:border-telegram-blue focus:ring-1 focus:ring-telegram-blue outline-none transition-colors"
              min={minDeposit}
              step="any"
            />
          </div>

          <div className="flex flex-col space-y-2">
            <label htmlFor="stakeDuration" className="text-lg font-medium">
              Stake Duration (seconds)
            </label>
            <input
              id="stakeDuration"
              type="number"
              value={stakeDuration}
              onChange={(e) => setStakeDuration(parseInt(e.target.value))}
              className="w-full p-3 bg-telegram-gray-lighter rounded-lg border border-transparent focus:border-telegram-blue focus:ring-1 focus:ring-telegram-blue outline-none transition-colors"
              min={poolData.minLockPeriod}
            />
          </div>

          <div className="mt-2 text-sm text-gray-500">
            Minimum deposit: {minDeposit} {poolJetton.jetton_content.symbol}
          </div>
          <div className="text-sm text-gray-500">
            Minimum lock period: {poolData.minLockPeriod} seconds
          </div>
        </div>

        <div className="flex justify-end mt-6 gap-2">
          <button
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-500 transition-colors"
            onClick={() => setIsModalOpen(false)}
          >
            Close
          </button>
          <button
            className="px-4 py-2 bg-telegram-blue text-white rounded hover:bg-telegram-blue-dark transition-colors"
            onClick={handleStake}
          >
            Stake
          </button>
        </div>
      </div>
    </div>
  );
};

export default StakeModal;