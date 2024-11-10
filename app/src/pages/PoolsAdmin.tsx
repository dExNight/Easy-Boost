import React from "react";
import { Address } from "@ton/core";
import {
  PoolsAdminStorage,
  usePoolsAdminStorage,
} from "../hooks/usePoolsAdmin";
import PoolsAdminInfo from "../components/PoolsAdmin/PoolsAdminInfo";
import SpinnerElement from "../components/Utils/Spinner";
import { usePoolJettons } from "../hooks/useStakingPool";
import { JettonMaster } from "../hooks/useTonCenter";

const PoolAdminPage: React.FC = () => {
  const poolsAdminAddress: Address = Address.parse(
    "kQAzxjrnsoKrp4J9ggSfOUkGhkVzxhLh7sGORZdLzDAxwkAe"
  );
  const poolsAdminJettonWallet: Address = Address.parse(
    "kQCPcpA9mZhQpAL1HdHT546dQ3guN8tUqlit7nvwRToZqEma"
  );

  const poolsAdminData: PoolsAdminStorage | null = usePoolsAdminStorage(
    poolsAdminAddress.toString()
  );

  const poolsAdminJetton: JettonMaster | null = usePoolJettons(
    poolsAdminJettonWallet
  );

  const isLoading: boolean = !poolsAdminData || !poolsAdminJetton;

  return (
    <div className="relative flex justify-center items-center w-full h-full">
      {isLoading && <SpinnerElement />}
      {!isLoading && (
        <PoolsAdminInfo
          address={poolsAdminAddress}
          poolsAdminData={poolsAdminData!}
          poolsAdminJetton={poolsAdminJetton!}
        />
      )}
    </div>
  );
};

export default PoolAdminPage;
