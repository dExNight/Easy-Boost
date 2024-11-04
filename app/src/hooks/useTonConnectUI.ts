import { TonConnectUI } from "@tonconnect/ui";

export type Message = {
  to: string;
  amount: bigint;
  msg_body?: string | null;
  state_init?: string | null;
};

export async function sendTransaction(
  tonconnect: TonConnectUI,
  messages: Message[],
  valid_until: number = Date.now() + 180
) {
  const preparedMessages = messages.map(({ to, amount, state_init, msg_body }) => ({
    address: to,
    amount: amount.toString(),
    stateInit: state_init ? state_init : undefined,
    payload: msg_body ? msg_body : undefined,
  }));

  const result = await tonconnect.sendTransaction(
    {
      validUntil: valid_until,
      messages: preparedMessages,
    },
    {
      modals: ["before"],
    }
  );

  return result;
}
