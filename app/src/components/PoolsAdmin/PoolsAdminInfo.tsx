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
    <div className="flex flex-col items-center justify-center my-8 gap-4">
      <h2 className="text-2xl font-bold text-center">
        Basic pools admin contract
      </h2>
      <p className="text-lg text-center">
        Address: {address.toString({ testOnly: !isMainnet })}
      </p>
      <div className="bg-gray-800 p-6 rounded-lg shadow-md w-full max-w-2xl mx-auto overflow-auto">
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
            value_={`${poolsAdminData.teamAddress.toString({
              testOnly: !isMainnet,
            })}`}
          />
          <PoolValue
            key_="Conversion address"
            value_={`${poolsAdminData.conversionAddress.toString({
              testOnly: !isMainnet,
            })}`}
          />
        </div>
      </div>

      <div className="bg-gray-800 p-6 rounded-lg shadow-md w-full max-w-2xl mx-auto overflow-auto">
        <div className="space-y-2 flex flex-col justify-center items-center">
          <p className="text-base font-bold text-center">
            Always available staking pool
          </p>
          <p>kQAYP1ZExQf0QnFWvldP7xmu9iG0WedvHTnooUDWpHqUTPyS</p>
        </div>
      </div>
    </div>
  );
};

export default PoolsAdminInfo;
