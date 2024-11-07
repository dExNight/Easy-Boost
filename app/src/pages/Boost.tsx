import React from "react";
import { useParams } from "react-router-dom";
import SpinnerElement from "../components/Utils/Spinner";
import { useBoostStorage } from "../hooks/useBoost";
import BoostInfo from "../components/Boost/BoostInfo";
import { JettonMaster } from "../hooks/useTonCenter";
import { usePoolJettons } from "../hooks/useStakingPool";

const BoostPage: React.FC = () => {
  const { address, boostIndex } = useParams<{
    address: string;
    boostIndex: string;
  }>();
  const boostIndexNumber: number = Number(boostIndex);
  const data = useBoostStorage(address, boostIndexNumber);
  const boostJetton: JettonMaster | null = usePoolJettons(
    data.boostData?.boostWalletAddress
  );

  const isLoading: boolean = !data || !boostJetton || !address;

  return (
    <div className="relative flex justify-center items-center w-full h-full">
      {isLoading && <SpinnerElement />}
      {!isLoading && (
        <BoostInfo
          address={data!.address!}
          poolAddress={address!}
          boostData={data!.boostData!}
          boostJetton={boostJetton!}
        />
      )}
    </div>
  );
};

export default BoostPage;
