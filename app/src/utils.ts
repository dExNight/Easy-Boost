import { Address } from "@ton/core";

export function isValidAddress(address: string): boolean {
  try {
    Address.parse(address);
    return true;
  } catch (error) {
    return false;
  }
}

export function normalizeNumber(
  num: number | string,
  precision: number = 2
): string {
  return Number(num).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: precision,
  });
}

export const timestamp = (): number => Math.floor(Date.now() / 1000);

export const formatTimestampToUTC = (timestamp: number): string => {
  const date = new Date(timestamp * 1000);
  return date.toUTCString();
};

export function ipfsToHttp(url: string | undefined | null): string {
  return url
    ? url.startsWith("ipfs://")
      ? url.replace("ipfs://", "https://ipfs.io/ipfs/")
      : url
    : "";
}
