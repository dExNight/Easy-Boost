import { Address } from "@ton/core";

export function isValidAddress(address: string): boolean {
  try {
    Address.parse(address);
    return true;
  } catch (error) {
    return false;
  }
}
