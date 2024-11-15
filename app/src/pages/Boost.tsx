import React from "react";
import { useParams } from "react-router-dom";
import SpinnerElement from "../components/Utils/Spinner";
import { useBoostStorage } from "../hooks/useBoost";
import BoostInfo from "../components/Boost/BoostInfo";
import { usePoolJettons } from "../hooks/useStakingPool";

const BoostPage: React.FC = () => {
  const { address, boostIndex } = useParams<{
    address: string;
    boostIndex: string;
  }>();
  
  const boostIndexNumber = Number(boostIndex);
  const data = useBoostStorage(address, boostIndexNumber);
  const boostJetton = usePoolJettons(data?.boostData?.boostWalletAddress);

  if (!address) {
    return (
      <div className="flex justify-center items-center h-full">
        <p className="text-lg text-gray-400">Address not provided</p>
      </div>
    );
  }

  if (!data || !data.address || !data.boostData) {
    return (
      <div className="flex justify-center items-center w-full h-full overflow-auto p-4">
        <SpinnerElement />
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center w-full h-full overflow-auto p-4">
      <BoostInfo
        address={data.address}
        poolAddress={address}
        boostData={data.boostData}
        boostJetton={boostJetton}
        topUp={data.topUp}
      />
    </div>
  );
};

export default BoostPage;