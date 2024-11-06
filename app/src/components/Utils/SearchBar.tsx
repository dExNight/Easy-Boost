import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { isValidAddress } from "../../utils";
import { base } from "../../config";

const SearchBar: React.FC = () => {
  const [address, setAddress] = useState("");
  const navigate = useNavigate();

  const handleKeyUp = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      if (isValidAddress(address)) {
        setAddress("");
        navigate(`${base}/pool/${address}`);
      } else {
        alert("Invalid address");
      }
    }
  };

  return (
    <div className="flex justify-center items-center w-full">
      <input
        type="text"
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        onKeyUp={handleKeyUp}
        className="rounded-3xl bg-gray-800 w-full p-3"
        placeholder="Enter address"
      />
    </div>
  );
};

export default SearchBar;
