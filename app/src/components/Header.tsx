import { TonConnectButton } from "@tonconnect/ui-react";
import { useNavigate } from "react-router-dom";
import { useTonConnectContext } from "../contexts/TonConnectContext";

function Header() {
  const navigate = useNavigate();
  const { connected, tonConnectUI } = useTonConnectContext();

  return (
    <header className="sticky top-[-1px] w-full h-[10vh] flex flex-nowrap justify-between p-4 bg-default z-50 box-border">
      <TonConnectButton />
    </header>
  );
}

export default Header;
