import React from "react";
import { Address } from "@ton/core";
import {
  PoolsAdminStorage,
  usePoolsAdminStorage,
} from "../hooks/usePoolsAdmin";
import PoolsAdminInfo from "../components/PoolsAdmin/PoolsAdminInfo";
import SpinnerElement from "../components/Utils/Spinner";

const PoolAdminPage: React.FC = () => {
  const poolsAdminAddress: Address = Address.parse(
    "kQAzxjrnsoKrp4J9ggSfOUkGhkVzxhLh7sGORZdLzDAxwkAe"
  );

  const poolsAdminData: PoolsAdminStorage | null = usePoolsAdminStorage(
    poolsAdminAddress.toString()
  );

  const isLoading: boolean = !poolsAdminData;

  return (
    <div className="relative flex justify-center items-center w-full h-full">
      {isLoading && <SpinnerElement />}
      {!isLoading && (
        <PoolsAdminInfo
          address={poolsAdminAddress}
          poolsAdminData={poolsAdminData!}
        />
      )}
    </div>
  );
};

export default PoolAdminPage;
