import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { isValidAddress } from "../../utils";

const SearchBar = () => {
  const [address, setAddress] = useState("");
  const navigate = useNavigate();

  const handleKeyUp = (event: any) => {
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
    <div className="flex justify-center items-center w-full">
      <input
        type="text"
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        onKeyUp={handleKeyUp}
        className="rounded-3xl bg-gray-100 w-full p-3 text-gray-900 placeholder-gray-500 outline-none focus:ring-1 focus:ring-telegram-blue border border-gray-200 focus:border-telegram-blue"
        placeholder="Enter address"
      />
    </div>
  );
};

export default SearchBar;
