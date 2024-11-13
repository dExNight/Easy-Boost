import { isMainnet } from "./config";

export const TonCenterUrl: string = `https://${
  isMainnet ? "" : "testnet."
}toncenter.com/api/v3`;

export const distributedRewardsDivider: bigint =
  100000000000000000000000000000000000000n;
export const farmingSpeedDivider: bigint = 86400n;

export const day: number = 86400;
