import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { isValidAddress } from "../../utils";

const SearchBar: React.FC = () => {
  const [address, setAddress] = useState("");
  const navigate = useNavigate();

  const handleKeyUp = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      if (isValidAddress(address)) {
        setAddress("");
        navigate(`/pool/${address}`);
      } else {
        alert("Invalid address");
      }
    }
  };

  return (
    <div className="flex justify-center items-center w-full p-4">
      <input
        type="text"
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        onKeyUp={handleKeyUp}
        className="rounded-3xl bg-gray-800 w-full p-4"
        placeholder="Enter address"
      />
    </div>
  );
};

export default SearchBar;
