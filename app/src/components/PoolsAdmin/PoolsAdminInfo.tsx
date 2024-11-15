import React from "react";
import { Address } from "@ton/core";
import { fromJettonDecimals, normalizeNumber } from "../../utils";
import { isMainnet } from "../../config";
import PoolValue from "../Utils/Value";
import { PoolsAdminStorage } from "../../hooks/usePoolsAdmin";
import { JettonMaster } from "../../hooks/useTonCenter";

export interface PoolsAdminInfoProps {
  address: Address;
  poolsAdminData: PoolsAdminStorage;
  poolsAdminJetton: JettonMaster;
}

const PoolsAdminInfo: React.FC<PoolsAdminInfoProps> = ({
  address,
  poolsAdminData,
  poolsAdminJetton,
}) => {
  return (
    <div className="flex flex-col items-center justify-center w-full max-w-2xl mx-auto my-4 px-4 gap-4">
      <h2 className="text-xl md:text-2xl font-bold text-center">
        Basic pools admin contract
      </h2>
      <p className="text-sm md:text-lg text-center break-all">
        Address: {address.toString({ testOnly: !isMainnet })}
      </p>
      <div className="bg-gray-800 p-4 md:p-6 rounded-lg shadow-md w-full overflow-x-auto">
        <div className="space-y-2">
          <PoolValue
            key_="Creation fee"
            value_={`${normalizeNumber(
              fromJettonDecimals(
                poolsAdminData.creationFee,
                Number(poolsAdminJetton.jetton_content.decimals)
              )
            )} ${poolsAdminJetton.jetton_content.symbol}`}
          />
          <PoolValue
            key_="Team address"
            value_={poolsAdminData.teamAddress.toString({
              testOnly: !isMainnet,
            })}
            valueClass="break-all"
          />
          <PoolValue
            key_="Conversion address"
            value_={poolsAdminData.conversionAddress.toString({
              testOnly: !isMainnet,
            })}
            valueClass="break-all"
          />
        </div>
      </div>

      <div className="bg-gray-800 p-4 md:p-6 rounded-lg shadow-md w-full">
        <div className="space-y-2 flex flex-col justify-center items-center">
          <p className="text-sm md:text-base font-bold text-center">
            Always available staking pool
          </p>
          <p className="text-xs md:text-sm break-all text-center">
            kQAYP1ZExQf0QnFWvldP7xmu9iG0WedvHTnooUDWpHqUTPyS
          </p>
        </div>
      </div>
    </div>
  );
};

export default PoolsAdminInfo;
