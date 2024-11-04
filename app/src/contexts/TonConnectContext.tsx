import { createContext, useContext, ReactNode } from "react";
import { useTonWallet } from "@tonconnect/ui-react";
import { useTonConnect } from "../hooks/useTonConnect";
import { useTonConnectUI } from "@tonconnect/ui-react";

import { TonConnectUI, Wallet, WalletInfoWithOpenMethod } from "@tonconnect/ui";
import { Sender } from "@ton/core";

export const TonConnectContext = createContext<{
  wallet: Wallet | (Wallet & WalletInfoWithOpenMethod) | null;
  sender: Sender;
  connected: boolean;
  tonConnectUI: TonConnectUI;
} | null>(null);

export const TonConnectProvider = ({ children }: { children: ReactNode }) => {
  const wallet = useTonWallet();
  const { sender, connected } = useTonConnect();
  const [tonConnectUI] = useTonConnectUI();

  return (
    <TonConnectContext.Provider
      value={{ wallet, sender, connected, tonConnectUI }}
    >
      {children}
    </TonConnectContext.Provider>
  );
};

export const useTonConnectContext = () => {
  const context = useContext(TonConnectContext);
  if (!context) {
    throw new Error(
      "useTonConnectContext must be used within a TonConnectProvider"
    );
  }
  return context;
};
