import React from "react";
import { useParams } from "react-router-dom";
import { usePoolStorage, usePoolJettons } from "../hooks/useStakingPool";
import SpinnerElement from "../components/Utils/Spinner";
import PoolInfo from "../components/StakingPool/PoolInfo";
import { JettonMaster } from "../hooks/useTonCenter";
import { useNavigate } from "react-router-dom";

const PoolPage: React.FC = () => {
  const { address } = useParams<{ address: string }>();

  const navigate = useNavigate();
  const handleBoostNavigate = (boostIndex: number) => {
    navigate(`/pool/${address}/boost/${boostIndex}`);
  };

  const { poolStorage, stake } = usePoolStorage(address);
  const poolJetton: JettonMaster | null = usePoolJettons(
    poolStorage?.lockWalletAddress
  );

  const isLoading: boolean = !poolStorage || !poolJetton;

  return (
    <div className="relative flex justify-center items-center w-full h-full">
      {isLoading && <SpinnerElement />}
      {!isLoading && (
        <PoolInfo
          address={address!}
          poolData={poolStorage!}
          poolJetton={poolJetton!}
          handleBoostNavigate={handleBoostNavigate}
          stake={stake}
        />
      )}
    </div>
  );
};

export default PoolPage;
