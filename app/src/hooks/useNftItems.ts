import { useEffect, useState } from "react";
import { useTonClient } from "./useTonClient";
import { Address, OpenedContract } from "@ton/core";
import { NftItem } from "../contracts/NftItem";
import { NftItemResponse } from "./useTonCenter";

export type NftItemStorage = {
  address: string;
  lockedValue: bigint;
  startTime: number;
  unlockTime: number;
  claimedRewards: bigint;
};

export function useNftItems(nfts: NftItemResponse[]) {
  const client = useTonClient();
  const [itemsStorage, setItemsStorage] = useState<NftItemStorage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNftStorages = async () => {
      if (!client || !nfts.length) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const storagePromises = nfts.map(async (nft) => {
          const itemContract = NftItem.createFromAddress(
            Address.parse(nft.address)
          );
          const nftItem = client.open(itemContract) as OpenedContract<NftItem>;

          const { lockedValue, startTime, unlockTime, claimedRewards } =
            await nftItem.getStorageData();

          return {
            address: nft.address,
            lockedValue,
            startTime,
            unlockTime,
            claimedRewards,
          };
        });

        const storages = await Promise.all(storagePromises);
        setItemsStorage(storages);
      } catch (error) {
        console.error("Error fetching NFT data:", error);
        setError(
          error instanceof Error ? error.message : "Unknown error occurred"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchNftStorages();
  }, [nfts, client]);

  return { itemsStorage, loading, error };
}
