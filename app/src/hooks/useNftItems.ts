import { useEffect, useState } from "react";
import { useTonClient } from "./useTonClient";
import { Address, OpenedContract, Sender } from "@ton/core";
import { NftItem } from "../contracts/NftItem";
import { NftItemResponse } from "./useTonCenter";

export type NftItemStorage = {
  address: string;
  lockedValue: bigint;
  startTime: number;
  unlockTime: number;
  claimedRewards: bigint;
  distributedRewards: bigint;
};

export function useNftItems(nfts: NftItemResponse[]) {
  const client = useTonClient();
  const [itemsStorage, setItemsStorage] = useState<NftItemStorage[]>([]);

  useEffect(() => {
    const fetchNftStorages = async () => {
      if (!client || !nfts.length) {
        return;
      }

      try {
        const storagePromises = nfts.map(async (nft) => {
          const itemContract = NftItem.createFromAddress(
            Address.parse(nft.address)
          );
          const nftItem = client.open(itemContract) as OpenedContract<NftItem>;

          const {
            lockedValue,
            startTime,
            unlockTime,
            claimedRewards,
            distributedRewards,
          } = await nftItem.getStorageData();

          return {
            address: nft.address,
            lockedValue,
            startTime,
            unlockTime,
            claimedRewards,
            distributedRewards,
          };
        });

        const storages = await Promise.all(storagePromises);
        setItemsStorage(storages);
      } catch (error) {
        console.error("Error fetching NFT data:", error);
      }
    };

    fetchNftStorages();
  }, [nfts, client]);

  return {
    itemsStorage,
    claim: async (nftAddress: Address | string, sender: Sender) => {
      if (!client || !sender.address) {
        console.error("Nft item contract is not initialized");
        return;
      }
      try {
        nftAddress =
          nftAddress instanceof Address
            ? nftAddress
            : Address.parse(nftAddress);
        const nftItem = client.open(NftItem.createFromAddress(nftAddress));
        await nftItem.sendClaimNft(sender, {});
      } catch (error) {
        console.error("Error sending transactions", error);
      }
    },
    withdraw: async (nftAddress: Address | string, sender: Sender) => {
      if (!client || !sender.address) {
        console.error("Nft item contract is not initialized");
        return;
      }
      try {
        nftAddress =
          nftAddress instanceof Address
            ? nftAddress
            : Address.parse(nftAddress);
        const nftItem = client.open(NftItem.createFromAddress(nftAddress));
        await nftItem.sendWithdrawNft(sender, {});
      } catch (error) {
        console.error("Error sending transactions", error);
      }
    },
  };
}
