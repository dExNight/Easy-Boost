import React from "react";
import { Address } from "@ton/core";
import { PoolsAdminStorage, usePoolsAdminStorage } from "../hooks/usePoolsAdmin";
import PoolsAdminInfo from "../components/PoolsAdmin/PoolsAdminInfo";
import SpinnerElement from "../components/Utils/Spinner";
import { usePoolJettons } from "../hooks/useStakingPool";
import { JettonMaster } from "../hooks/useTonCenter";

const PoolAdminPage: React.FC = () => {
  const poolsAdminAddress: Address = Address.parse(
    "kQAzIlHeTj9l-25A3LfR6SxtndI3NsC-YC0OpPyOruB6IFXE"
  );
  const poolsAdminJettonWallet: Address = Address.parse(
    "kQCUWwEThKk9V-6_VlJDHvP6mMvIRiVwtYIy2elBjGjsna_G"
  );

  const poolsAdminData: PoolsAdminStorage | null = usePoolsAdminStorage(
    poolsAdminAddress.toString()
  );

  const poolsAdminJetton: JettonMaster | null = usePoolJettons(
    poolsAdminJettonWallet
  );

  const isLoading: boolean = !poolsAdminData || !poolsAdminJetton;

  return (
    <div className="flex justify-center items-center w-full h-full overflow-auto p-4">
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