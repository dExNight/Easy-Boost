import React from "react";
import { useParams } from "react-router-dom";

const PoolPage: React.FC = () => {
  const { address } = useParams<{ address: string }>();

  return (
    <div className="relative flex justify-center items-center w-full h-full">
      <p className="text-l">Address: {address}</p>
    </div>
  );
};

export default PoolPage;
