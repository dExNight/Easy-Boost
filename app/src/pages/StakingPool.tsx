import React from "react";
import { useParams } from "react-router-dom";
import { usePoolStorage, PoolStorage } from "../hooks/useStakingPool";
import SpinnerElement from "../components/Utils/Spinner";
import PoolInfo from "../components/StakingPool/PoolInfo";

const PoolPage: React.FC = () => {
  const { address } = useParams<{ address: string }>();
  const poolData: PoolStorage | null = usePoolStorage(address);

  return (
    <div className="relative flex justify-center items-center w-full h-full">
      {!poolData && <SpinnerElement />}
      {poolData && <PoolInfo address={address!} poolData={poolData} />}
    </div>
  );
};

export default PoolPage;
