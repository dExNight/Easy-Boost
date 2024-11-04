import { getHttpEndpoint } from "@orbs-network/ton-access";
import { TonClient } from "@ton/ton";
import { useAsyncInitialize } from "./useAsyncInitialize";
import { isMainnet } from "../config";

export function useTonClient() {
  console.log("is mainnet", isMainnet);
  return useAsyncInitialize(
    async () =>
      new TonClient({
        endpoint: await getHttpEndpoint({
          network: isMainnet ? "mainnet" : "testnet",
        }),
      })
  );
}