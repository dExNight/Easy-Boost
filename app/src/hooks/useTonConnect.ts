import { useTonConnectUI } from "@tonconnect/ui-react";
import { Address, Sender, SenderArguments } from "@ton/core";
import { useState, useEffect } from "react";

export function useTonConnect(): { sender: Sender; connected: boolean } {
  const [tonConnectUI] = useTonConnectUI();
  const [connected, setConnected] = useState<boolean>(false);
  const [senderAddress, setSenderAddress] = useState<string | undefined>();

  useEffect(() => {
    setConnected(tonConnectUI.connected);
    setSenderAddress(tonConnectUI.account?.address);

    const interval = setInterval(() => {
      if (tonConnectUI.connected !== connected) {
        setConnected(tonConnectUI.connected);
        setSenderAddress(tonConnectUI.account?.address);
      }
    }, 10);

    return () => clearInterval(interval);
  }, [tonConnectUI, connected, tonConnectUI.account]);

  return {
    sender: {
      send: async (args: SenderArguments) => {
        tonConnectUI.sendTransaction({
          messages: [
            {
              address: args.to.toString(),
              amount: args.value.toString(),
              payload: args.body?.toBoc().toString("base64"),
            },
          ],
          validUntil: Date.now() + 5 * 60 * 1000, // 5 minutes for user to approve
        });
      },
      address: senderAddress ? Address.parse(senderAddress) : undefined,
    },
    connected: connected,
  };
}
