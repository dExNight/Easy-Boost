import React from "react";
import { useParams } from "react-router-dom";
import SpinnerElement from "../components/Utils/Spinner";

const BoostPage: React.FC = () => {
  const { boostIndex } = useParams<{
    address: string;
    boostIndex: string;
  }>();
  const boostIndexNumber: number = Number(boostIndex);

  const isLoading: boolean = boostIndexNumber < 0;

  return (
    <div className="relative flex justify-center items-center w-full h-full">
      {isLoading && <SpinnerElement />}
      {!isLoading && <>{boostIndexNumber}</>}
    </div>
  );
};

export default BoostPage;
