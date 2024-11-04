import { isMainnet } from "./config";

export const TonCenterUrl: string = `https://${
  isMainnet ? "" : "testnet."
}toncenter.com/api/v3`;
