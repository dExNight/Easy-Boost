import React from "react";
import { useParams } from "react-router-dom";
import {
  usePoolStorage,
  PoolStorage,
  usePoolJettons,
} from "../hooks/useStakingPool";
import SpinnerElement from "../components/Utils/Spinner";
import PoolInfo from "../components/StakingPool/PoolInfo";
import { JettonMaster } from "../hooks/useTonCenter";
import { useNavigate } from "react-router-dom";
import { base } from "../config";

const PoolPage: React.FC = () => {
  const { address } = useParams<{ address: string }>();

  const navigate = useNavigate();
  const handleBoostNavigate = (boostIndex: number) => {
    navigate(`${base}/pool/${address}/boost/${boostIndex}`);
  };

  const poolData: PoolStorage | null = usePoolStorage(address);
  const poolJetton: JettonMaster | null = usePoolJettons(
    poolData?.lockWalletAddress
  );

  const isLoading: boolean = !poolData || !poolJetton;

  return (
    <div className="relative flex justify-center items-center w-full h-full">
      {isLoading && <SpinnerElement />}
      {!isLoading && (
        <PoolInfo
          address={address!}
          poolData={poolData!}
          poolJetton={poolJetton!}
          handleBoostNavigate={handleBoostNavigate}
        />
      )}
    </div>
  );
};

export default PoolPage;
