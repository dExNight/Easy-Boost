import React, { useState } from "react";
import { Form } from "react-bootstrap";
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
      className={`fixed bg-black bg-opacity-50 backdrop-blur-[10px] inset-0 flex items-center justify-center z-50 ${
        isOpen ? "" : "hidden"
      }`}
    >
      <div className="bg-gray-800 p-6 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">Stake Tokens</h2>
        <Form>
          <Form.Group className="mb-3" controlId="stakeAmount">
            <Form.Label>
              Stake Amount {poolJetton.jetton_content.symbol}
            </Form.Label>
            <Form.Control
              type="number"
              value={stakeAmount}
              onChange={(e) => setStakeAmount(parseFloat(e.target.value))}
              className="bg-gray-700 focus:bg-gray-700 text-white border-gray-600 focus:border-blue-600 focus:ring-blue-600"
            />
          </Form.Group>
          <Form.Group className="mb-3" controlId="stakeDuration">
            <Form.Label>Stake Duration (seconds)</Form.Label>
            <Form.Control
              type="number"
              value={stakeDuration}
              onChange={(e) => setStakeDuration(parseInt(e.target.value))}
              className="bg-gray-700 focus:bg-gray-700 text-white border-gray-600 focus:border-blue-600 focus:ring-blue-600"
            />
          </Form.Group>
        </Form>
        <div className="flex justify-end mt-6 gap-2">
          <button
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-500"
            onClick={() => setIsModalOpen(false)}
          >
            Close
          </button>
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500"
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
