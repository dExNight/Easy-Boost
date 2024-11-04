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

const PoolPage: React.FC = () => {
  const { address } = useParams<{ address: string }>();
  const poolData: PoolStorage | null = usePoolStorage(address);
  const poolJetton: JettonMaster | null = usePoolJettons(
    poolData?.lockWalletAddress
  );

  const isLoading: boolean = !poolData || !poolJetton;
  console.log("Pooldata:", poolData);
  console.log("PoolJetton:", poolJetton);

  return (
    <div className="relative flex justify-center items-center w-full h-full">
      {isLoading && <SpinnerElement />}
      {!isLoading && (
        <PoolInfo
          address={address!}
          poolData={poolData!}
          poolJetton={poolJetton!}
        />
      )}
    </div>
  );
};

export default PoolPage;
