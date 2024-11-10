import React, { useState } from "react";
import { PoolStorage } from "../../hooks/useStakingPool";

interface BoostSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  poolData: PoolStorage;
  handleBoostNavigate: (boostIndex: number) => void;
}

const BoostSelectionModal: React.FC<BoostSelectionModalProps> = ({
  isOpen,
  onClose,
  poolData,
  handleBoostNavigate,
}) => {
  const [selectedBoost, setSelectedBoost] = useState<number | null>(null);

  const handleSelectBoost = (index: number) => {
    setSelectedBoost(index);
  };

  const handleConfirmBoost = () => {
    if (selectedBoost !== null) {
      handleBoostNavigate(selectedBoost);
      onClose();
    }
  };

  const indexes: number[] = [];
  for (let i = 0; i < poolData.nextBoostIndex; i++) {
    indexes.push(i);
  }

  return (
    <div
      className={`fixed scrollbar-modern bg-black bg-opacity-50 backdrop-blur-[10px] inset-0 flex items-center justify-center z-50 ${
        isOpen ? "" : "hidden"
      }`}
    >
      <div className="bg-gray-800 h-[80%] overflow-auto scrollbar-modern p-6 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">Select Boost</h2>
        <div className="space-y-4">
          {indexes.map((index) => (
            <div
              key={index}
              className={`bg-gray-700 p-4 rounded-lg cursor-pointer transition-colors ${
                selectedBoost === index ? "bg-gray-900" : "hover:bg-gray-600"
              }`}
              onClick={() => handleSelectBoost(index)}
            >
              <h3 className="text-lg font-bold">{`Boost #${index + 1}`}</h3>
            </div>
          ))}
        </div>
        <div className="flex justify-end mt-6 gap-2">
          <button
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-500"
            onClick={onClose}
          >
            Close
          </button>
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500"
            onClick={handleConfirmBoost}
          >
            Navigate
          </button>
        </div>
      </div>
    </div>
  );
};

export default BoostSelectionModal;
