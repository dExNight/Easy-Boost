import { Address } from "@ton/core";

interface RetryConfig {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  backoffFactor: number;
}

const defaultRetryConfig: RetryConfig = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 3000,
  backoffFactor: 2,
};

export async function withRetry<T>(
  operation: () => Promise<T>,
  config: RetryConfig = defaultRetryConfig
): Promise<T> {
  let lastError: Error | null = null;
  let delay = config.initialDelay;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;
      console.warn(`Attempt ${attempt + 1} failed:`, error.message);

      if (attempt === config.maxRetries) {
        throw new Error(
          `Failed after ${config.maxRetries} attempts. Last error: ${lastError?.message}`
        );
      }

      // Ждем перед следующей попыткой
      await new Promise((resolve) => setTimeout(resolve, delay));
      delay = Math.min(delay * config.backoffFactor, config.maxDelay);
    }
  }

  throw lastError;
}

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

export const formatTimeLeft = (seconds: number): string => {
  const days = Math.floor(seconds / (3600 * 24));
  const hours = Math.floor((seconds % (3600 * 24)) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  parts.push(`${secs}s`);

  return parts.join(" ");
};

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function fromJettonDecimals(value: bigint, decimals: number): number {
  return Number(value) / 10 ** decimals;
}

export function toJettonDecimals(value: number, decimals: number): bigint {
  return BigInt(value * 10 ** decimals);
}

export function mulDiv(num1: bigint, num2: bigint, num3: bigint): bigint {
  return (num1 * num2) / num3;
}
