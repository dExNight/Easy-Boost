import { useEffect, useState } from "react";
import { PoolsAdmin } from "../contracts/PoolsAdmin";
import { useTonClient } from "./useTonClient";
import { Address, OpenedContract } from "@ton/core";
import { withRetry } from "../utils";

export type PoolsAdminStorage = {
  creationFee: bigint;
  teamAddress: Address;
  conversionAddress: Address;
};

export function usePoolsAdminStorage(address: string | undefined) {
  const client = useTonClient();
  const [poolsAdminStorage, setPoolsAdminStorage] =
    useState<null | PoolsAdminStorage>(null);

  useEffect(() => {
    const fetchPoolStorage = async () => {
      if (!client || !address) return;

      const contract = PoolsAdmin.createFromAddress(Address.parse(address));
      const poolsAdmin = client.open(contract) as OpenedContract<PoolsAdmin>;

      try {
        await withRetry(async () => {
          const creationFee: bigint = await poolsAdmin.getCreationFee();
          const { teamAddress, conversionAddress } =
            await poolsAdmin.getOwners();

          setPoolsAdminStorage({
            creationFee,
            teamAddress,
            conversionAddress,
          });
        });
      } catch (error) {
        console.error("Error fetching sale data:", error);
      }
    };

    fetchPoolStorage();
  }, [address, poolsAdminStorage, client]);

  return poolsAdminStorage;
}
