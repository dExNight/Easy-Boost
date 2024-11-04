import { TonConnectButton } from "@tonconnect/ui-react";
import { useNavigate } from "react-router-dom";
import { useTonConnectContext } from "../contexts/TonConnectContext";
import SearchBar from "./Utils/SearchBar";

function Header() {
  const navigate = useNavigate();
  const { connected, tonConnectUI } = useTonConnectContext();

  return (
    <header className="w-full h-[10vh] flex flex-nowrap justify-between items-center p-4">
      <SearchBar />
      <TonConnectButton />
    </header>
  );
}

export default Header;
