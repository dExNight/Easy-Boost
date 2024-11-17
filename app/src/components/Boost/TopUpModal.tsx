import React, { useState } from "react";
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

  if (!isOpen) return null;

  return (
    <div
      className={`fixed scrollbar-modern bg-telegram-gray-lighter bg-opacity-50 backdrop-blur-[10px] inset-0 flex items-center justify-center z-50 ${
        isOpen ? "" : "hidden"
      }`}
    >
      <div className="border border-telegram-blue bg-white max-h-[80%] overflow-auto scrollbar-modern p-6 rounded-lg shadow-md w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Top Up Boost</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors text-2xl leading-none"
          >
            ×
          </button>
        </div>

        <div className="space-y-6">
          {boostJetton && (
            <div className="bg-telegram-gray-lighter p-4 rounded-lg space-y-2">
              <PoolValue
                key_="Token"
                value_={boostJetton.jetton_content.symbol}
                valueClass="font-medium text-telegram-blue"
              />
              <PoolValue
                key_="Decimals"
                value_={boostJetton.jetton_content.decimals}
                valueClass="font-medium"
              />
            </div>
          )}

          <div className="space-y-2">
            <label className="block text-lg font-medium">
              Amount
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount"
                className="w-full mt-1 p-3 bg-telegram-gray-lighter rounded-lg border border-transparent focus:border-telegram-blue focus:ring-1 focus:ring-telegram-blue outline-none transition-colors"
              />
            </label>
            {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              onClick={handleClose}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-500 transition-colors"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              onClick={handleTopUp}
              className={`px-4 py-2 text-white rounded transition-colors ${
                isLoading
                  ? "bg-telegram-blue-dark cursor-not-allowed"
                  : "bg-telegram-blue hover:bg-telegram-blue-dark"
              }`}
              disabled={isLoading}
            >
              {isLoading ? "Processing..." : "Top Up"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopUpModal;
