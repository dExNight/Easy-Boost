import React from "react";
import { NftItemResponse } from "../../hooks/useTonCenter";
import PoolValue from "../Utils/Value";
import { useNftItems } from "../../hooks/useNftItems";
import { formatTimestampToUTC } from "../../utils";
import { fromJettonDecimals } from "../../utils";
import SpinnerElement from "../Utils/Spinner";

export interface PositionsProps {
  isOpen: boolean;
  setIsModalOpen: (state: boolean) => void;
  nfts: NftItemResponse[];
  decimals: number;
  symbol: string;
}

const Positions: React.FC<PositionsProps> = ({
  isOpen,
  setIsModalOpen,
  nfts,
  decimals,
  symbol,
}) => {
  const { itemsStorage, loading, error } = useNftItems(nfts);

  return (
    <div
      className={`fixed bg-black bg-opacity-50 backdrop-blur-[10px] inset-0 flex items-center justify-center z-50 ${
        isOpen ? "" : "hidden"
      }`}
    >
      <div className="bg-gray-800 flex flex-col gap-4 p-6 rounded-lg shadow-md w-full max-w-[80%]">
        <h2 className="text-2xl font-bold">Active positions</h2>

        <PoolValue key_="Total" value_={nfts.length} />

        {loading && (
          <div className="flex justify-center">
            <SpinnerElement sm />
          </div>
        )}

        {error && <div className="text-red-500 py-2">Error: {error}</div>}

        <div className="flex flex-col gap-4">
          {itemsStorage.map((item) => (
            <div
              key={item.address}
              className="flex items-center bg-gray-700 p-4 rounded-lg"
            >
              <div className="w-full gap-4">
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
