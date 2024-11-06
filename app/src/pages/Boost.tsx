import React from "react";
import { useParams } from "react-router-dom";
import SpinnerElement from "../components/Utils/Spinner";
import { useBoostStorage } from "../hooks/useBoost";

const BoostPage: React.FC = () => {
  const { address, boostIndex } = useParams<{
    address: string;
    boostIndex: string;
  }>();
  const boostIndexNumber: number = Number(boostIndex);
  const data = useBoostStorage(address, boostIndexNumber);

  const isLoading: boolean = !data;

  return (
    <div className="relative flex justify-center items-center w-full h-full">
      {isLoading && <SpinnerElement />}
      {!isLoading && <>{data!.address?.toString()}</>}
    </div>
  );
};

export default BoostPage;
