import React, { useState } from "react";
import { Button } from "react-bootstrap";
import { Sender } from "@ton/core";
import { JettonMaster } from "../../hooks/useTonCenter";
import PoolValue from "../Utils/Value";
import { toJettonDecimals } from "../../utils";

interface TopUpModalProps {
  isOpen: boolean;
  setIsOpen: (value: boolean) => void;
  boostJetton: JettonMaster | null;
  topUp: (amount: bigint, sender: Sender) => Promise<void>;
  sender: Sender;
}

const TopUpModal: React.FC<TopUpModalProps> = ({
  isOpen,
  setIsOpen,
  boostJetton,
  topUp,
  sender,
}) => {
  const [amount, setAmount] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");

  if (!isOpen) return null;

  const handleClose = () => {
    setIsOpen(false);
    setAmount("");
    setError("");
  };

  const handleTopUp = async () => {
    try {
      setError("");
      setIsLoading(true);

      if (!amount || parseFloat(amount) <= 0) {
        throw new Error("Please enter a valid amount");
      }

      const decimals = Number(boostJetton?.jetton_content.decimals || 9);
      const jettons = toJettonDecimals(Number(amount), decimals);

      await topUp(jettons, sender);
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">Top Up Boost</h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white"
          >
            ×
          </button>
        </div>

        <div className="space-y-4">
          {boostJetton && (
            <div className="mb-4">
              <PoolValue
                key_="Token"
                value_={boostJetton.jetton_content.symbol}
              />
              <PoolValue
                key_="Decimals"
                value_={boostJetton.jetton_content.decimals}
              />
            </div>
          )}

          <div className="space-y-2">
            <label className="block text-sm font-medium">Amount</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
              className="w-full p-2 rounded bg-gray-700 border border-gray-600 focus:border-blue-500 focus:outline-none"
            />
          </div>

          {error && <div className="text-red-500 text-sm mt-2">{error}</div>}

          <div className="flex space-x-3 mt-6">
            <Button
              onClick={handleClose}
              variant="secondary"
              className="w-full py-2 rounded border-0 hover:bg-gray-700"
            >
              Cancel
            </Button>
            <Button
              onClick={handleTopUp}
              variant="primary"
              disabled={isLoading}
              className="w-full py-2 rounded border-0 hover:bg-blue-600"
            >
              {isLoading ? "Processing..." : "Top Up"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopUpModal;
